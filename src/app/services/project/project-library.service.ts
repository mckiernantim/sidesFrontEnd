import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { ProjectService } from './project.service';
import { DeleteProjectResponse, ProjectApiService, ProjectLink, ProjectSummary, RenameProjectResponse } from './project-api.service';
import { ScheduleApiService, ScheduleSummary } from '../schedule/schedule-api.service';
import { ScheduleService } from '../schedule/schedule.service';
import { ScheduleStateService } from '../schedule/schedule-state.service';
import { AuthService } from '../auth/auth.service';
import { PdfService } from '../pdf/pdf.service';

// ─────────────────────────────────────────────
// Resolution Types
// ─────────────────────────────────────────────

/** No schedule is linked to this project yet — the caller offers Create Schedule or Continue to dashboard. */
export interface ProjectOpenNone {
  kind: 'none';
}

/** Exactly one schedule is linked — already navigated there, informational for the caller. */
export interface ProjectOpenSchedule {
  kind: 'schedule';
  scheduleId: string;
}

/** More than one schedule is linked — the caller must show a picker (US3 acceptance scenario 3). */
export interface ProjectOpenPicker {
  kind: 'picker';
  schedules: ScheduleSummary[];
}

export type ProjectOpenResolution = ProjectOpenNone | ProjectOpenSchedule | ProjectOpenPicker;

/**
 * View model for a My Projects card (spec 028 US4, data-model.md's
 * ProjectLibraryCard). `project` uses the same `ProjectSummary` shape
 * `GET /project/user` already returns — data-model.md's sketch names the
 * field `Project`, but no card field needs anything beyond the summary
 * (title, page/scene counts, updatedAt), so no second network shape is
 * introduced.
 */
export interface ProjectLibraryCard {
  project: ProjectSummary;
  linkedSchedules: ProjectLink[];
  scheduleCount: number;
}

/**
 * ProjectLibraryService — the "Open" resolution logic shared by the post-login
 * choice screen and My Projects (spec 028 US3, contracts/project-library-ui.md):
 *
 *   openProject(project):
 *     ProjectService.openProject(project.id)        // hydrates PdfService/UploadService (027 Phase 4)
 *     schedules = linkedSchedules for project.id     // filtered GET /schedule/user (T043) — this
 *                                                     // resolution path intentionally does not depend
 *                                                     // on GET /project/:id/links, which loadLibrary()
 *                                                     // uses only for card display counts
 *     if schedules.length === 0:
 *         offer "Create Schedule" or "Continue to dashboard"    // caller renders this choice
 *     elif schedules.length === 1:
 *         navigate ['/schedule', schedules[0].id]                // this service navigates directly
 *     else:
 *         show a picker, then navigate ['/schedule', chosenId]   // caller renders the picker, calls openSchedule()
 *
 * PdfService is always hydrated (via ProjectService.openProject) BEFORE the
 * schedule count is evaluated — the switchMap below only subscribes to
 * listSchedules() once openProject's tap has already run, so a zero-schedule
 * project still lands with a live, ready-to-use PdfService (e.g. for
 * "Create Schedule" immediately after).
 */
@Injectable({
  providedIn: 'root',
})
export class ProjectLibraryService {
  /**
   * The library's cards, kept up to date across rename/delete so components
   * bound to this observable (My Projects) reflect optimistic updates and
   * their rollbacks without a manual refetch (spec 028 T047).
   */
  private cardsSubject = new BehaviorSubject<ProjectLibraryCard[]>([]);
  readonly cards$: Observable<ProjectLibraryCard[]> = this.cardsSubject.asObservable();

  constructor(
    private projectService: ProjectService,
    private projectApi: ProjectApiService,
    private scheduleApi: ScheduleApiService,
    private scheduleService: ScheduleService,
    private scheduleState: ScheduleStateService,
    private authService: AuthService,
    private pdfService: PdfService,
    private router: Router
  ) {}

  get cards(): ProjectLibraryCard[] {
    return this.cardsSubject.getValue();
  }

  // ─────────────────────────────────────────────
  // Library assembly (US4 T047/T049)
  // ─────────────────────────────────────────────

  /**
   * Assembles ProjectLibraryCard[] from GET /project/user plus a parallel
   * GET /project/:id/links per project (research D9, 027 T055). A failure
   * for any one project's links call still degrades that project's card to
   * scheduleCount: 0 rather than failing the whole list.
   */
  loadLibrary(): Observable<ProjectLibraryCard[]> {
    return this.projectApi.listProjects().pipe(
      switchMap((response) => {
        const projects = response.projects || [];
        if (projects.length === 0) {
          return of([] as ProjectLibraryCard[]);
        }

        const cardRequests = projects.map((project) =>
          this.projectApi.getProjectLinks(project.id).pipe(
            map((linksResponse) => this.toCard(project, linksResponse.schedules || [])),
            catchError(() => of(this.toCard(project, [])))
          )
        );

        return forkJoin(cardRequests);
      }),
      tap((cards) => this.cardsSubject.next(cards))
    );
  }

  private toCard(project: ProjectSummary, linkedSchedules: ProjectLink[]): ProjectLibraryCard {
    return { project, linkedSchedules, scheduleCount: linkedSchedules.length };
  }

  // ─────────────────────────────────────────────
  // Rename / Delete (US4 T047/T049)
  // ─────────────────────────────────────────────

  /**
   * Renames a project, updating the card optimistically and rolling back on
   * error so the UI never shows a title that failed to persist.
   */
  renameProject(projectId: string, title: string): Observable<RenameProjectResponse> {
    const previousCards = this.cardsSubject.getValue();
    this.cardsSubject.next(
      previousCards.map((card) =>
        card.project.id === projectId ? { ...card, project: { ...card.project, title } } : card
      )
    );

    return this.projectApi.renameProject(projectId, title).pipe(
      tap((response) => {
        const current = this.cardsSubject.getValue();
        this.cardsSubject.next(
          current.map((card) =>
            card.project.id === projectId
              ? {
                  ...card,
                  project: { ...card.project, title: response.project.title, updatedAt: response.project.updatedAt },
                }
              : card
          )
        );
      }),
      catchError((err) => {
        this.cardsSubject.next(previousCards);
        return throwError(() => err);
      })
    );
  }

  /**
   * Deletes a project and removes its card. Any linked-schedule warning is
   * the caller's responsibility to surface BEFORE calling this — the
   * already-loaded card's `linkedSchedules` (from loadLibrary()) has
   * everything a confirmation dialog needs without a second API call.
   */
  deleteProject(projectId: string): Observable<DeleteProjectResponse> {
    const previousCards = this.cardsSubject.getValue();

    return this.projectApi.deleteProject(projectId).pipe(
      tap(() => {
        this.cardsSubject.next(this.cardsSubject.getValue().filter((card) => card.project.id !== projectId));
      }),
      catchError((err) => {
        this.cardsSubject.next(previousCards);
        return throwError(() => err);
      })
    );
  }

  // ─────────────────────────────────────────────
  // Create Schedule from a project with none (US4 T051)
  // ─────────────────────────────────────────────

  /**
   * Seeds and persists a brand-new schedule for a project with zero linked
   * schedules, then navigates straight to it. Reuses 027/008 machinery
   * verbatim (ScheduleService.seedScheduleFromPdfService + ScheduleApiService
   * .createSchedule) — no new schedule-creation logic. ProjectService
   * .openProject() hydrates PdfService first so the seed always sees this
   * project's scenes, even if the working session was on a different
   * project or nothing at all a moment ago.
   */
  createSchedule(projectId: string, projectTitle: string): Observable<{ scheduleId: string }> {
    return this.projectService.openProject(projectId).pipe(
      switchMap(() => {
        const userId = this.authService.getCurrentUser()?.uid || 'anonymous';
        const schedule = this.scheduleService.seedScheduleFromPdfService(
          projectId,
          projectTitle,
          userId,
          this.pdfService
        );

        return this.scheduleApi.createSchedule(schedule).pipe(
          tap(() => {
            // Clear local schedule state so SchedulePageComponent's
            // loadScheduleById fetches fresh from the backend (rather than
            // short-circuiting on a matching id) and correctly resolves
            // isProjectLinked via its own resolveLinkedProject() path.
            this.scheduleState.clearSchedule();
            this.router.navigate(['/schedule', schedule.id]);
          }),
          map(() => ({ scheduleId: schedule.id }))
        );
      })
    );
  }

  openProject(projectId: string): Observable<ProjectOpenResolution> {
    return this.projectService.openProject(projectId).pipe(
      switchMap(() => this.scheduleApi.listSchedules()),
      map((response) => {
        const linkedSchedules = (response.schedules || []).filter(
          (schedule) => schedule.projectId === projectId
        );

        if (linkedSchedules.length === 1) {
          const scheduleId = linkedSchedules[0].id;
          this.router.navigate(['/schedule', scheduleId]);
          return { kind: 'schedule', scheduleId } as ProjectOpenSchedule;
        }

        if (linkedSchedules.length > 1) {
          return { kind: 'picker', schedules: linkedSchedules } as ProjectOpenPicker;
        }

        return { kind: 'none' } as ProjectOpenNone;
      })
    );
  }

  /** Navigates to a schedule chosen from the "multiple schedules" picker (US3 acceptance scenario 3). */
  openSchedule(scheduleId: string): void {
    this.router.navigate(['/schedule', scheduleId]);
  }
}
