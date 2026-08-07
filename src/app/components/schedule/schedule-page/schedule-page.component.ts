import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ScheduleApiService } from '../../../services/schedule/schedule-api.service';
import { ScheduleStateService } from '../../../services/schedule/schedule-state.service';
import { ScheduleAutoSaveService } from '../../../services/schedule/schedule-auto-save.service';
import { AuthService } from '../../../services/auth/auth.service';
import { ProjectService } from '../../../services/project/project.service';
import { ProjectApiService, ProjectSummary } from '../../../services/project/project-api.service';
import { PdfService } from '../../../services/pdf/pdf.service';
import { ProductionSchedule } from '../../../types/Schedule';
import { isLegacyProjectId } from '../../../utils/legacyProjectId';
import { Project } from '../../../types/Project';

/**
 * SchedulePageComponent — Standalone page for viewing/editing schedules.
 *
 * Routes:
 *   /schedule        — Show schedule list (loads saved schedules)
 *   /schedule/:id    — Deep-link to a specific schedule
 *
 * This component is independent of the sides/classify pipeline. It wraps
 * the existing ScheduleTabComponent but passes no allLines — the "Create
 * New Schedule" button stays disabled. Users can only load saved schedules
 * from the backend.
 *
 * From the dashboard (post-upload), the schedule tab still works as before
 * with full classify data.
 */
@Component({
  selector: 'app-schedule-page',
  templateUrl: './schedule-page.component.html',
  styleUrls: ['./schedule-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SchedulePageComponent implements OnInit, OnDestroy {
  /** True while loading a specific schedule from the route param */
  isLoadingRoute: boolean = false;

  /** Error from loading a route-specified schedule */
  routeLoadError: string | null = null;

  /** Whether the user is authenticated */
  isAuthenticated: boolean = false;

  // ─────────────────────────────────────────────
  // Project linking (spec 027 US3 T041/T042)
  // ─────────────────────────────────────────────

  /**
   * True once the open schedule's linked project has been resolved and
   * hydrated into PdfService/UploadService — a resolvable owned project
   * means script data is live, exactly as if freshly uploaded (T041).
   */
  isProjectLinked: boolean = false;

  /**
   * True when the open schedule has no resolvable project — either it has
   * no `projectId`, a legacy `proj-{timestamp}` placeholder, or the linked
   * project could not be loaded (deleted / not owned / content missing).
   * Today's behavior is preserved exactly in this case: manual one-liner
   * entry still works via data already persisted on the schedule, only the
   * "live" re-seed/regeneration path is unavailable until attached (T042).
   */
  isLegacySchedule: boolean = false;

  /**
   * The resolved, hydrated project this schedule belongs to (spec 028 US5,
   * T054) — passed down to ScheduleBuilderComponent's header via
   * app-schedule-tab. Null until `resolveLinkedProject()` succeeds; stays
   * null for legacy/unlinked schedules.
   */
  linkedProject: Project | null = null;

  /** True while resolving/hydrating the linked project. */
  isHydratingProject: boolean = false;

  /** Attach-flow state: projects offered when linking a legacy schedule. */
  attachableProjects: ProjectSummary[] = [];
  isLoadingAttachOptions: boolean = false;
  isAttachPickerOpen: boolean = false;
  isAttaching: boolean = false;
  attachError: string | null = null;

  // ─────────────────────────────────────────────
  // Shared chrome — My Projects | Schedule nav + save indicator
  // (spec 029 US4, contracts/schedule-editor-ui.md "Shared chrome")
  // ─────────────────────────────────────────────
  isDirty: boolean = false;
  isSaving: boolean = false;
  lastSavedAt: string | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private scheduleApi: ScheduleApiService,
    private scheduleState: ScheduleStateService,
    private autoSave: ScheduleAutoSaveService,
    private authService: AuthService,
    private projectService: ProjectService,
    private projectApi: ProjectApiService,
    public pdfService: PdfService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Watch for route param + auth state to load a specific schedule
    this.subscriptions.push(
      combineLatest([
        this.route.paramMap,
        this.authService.user$,
      ]).subscribe(([params, user]) => {
        this.isAuthenticated = !!user;

        const scheduleId = params.get('id');
        if (scheduleId && user) {
          this.loadScheduleById(scheduleId);
        }

        this.cdr.markForCheck();
      }),
      this.scheduleState.isDirty$.subscribe((dirty) => {
        this.isDirty = dirty;
        this.cdr.markForCheck();
      }),
      this.scheduleState.isSaving$.subscribe((saving) => {
        this.isSaving = saving;
        this.cdr.markForCheck();
      }),
      this.scheduleState.lastSavedAt$.subscribe((timestamp) => {
        this.lastSavedAt = timestamp;
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  /**
   * Navigate back to the schedule list (clears the loaded schedule).
   */
  backToList(): void {
    this.scheduleState.clearSchedule();
    this.router.navigate(['/schedule']);
  }

  /**
   * Navigate to the upload page to create a new schedule from a script.
   */
  goToUpload(): void {
    this.router.navigate(['/']);
  }

  /**
   * Shared-chrome "My Projects" nav control (spec 029 US4). Navigating away
   * does not discard in-progress edits — ScheduleAutoSaveService already
   * flushes dirty schedules on a 1s debounce independent of this component's
   * lifecycle, so a save in flight (or already queued) completes normally.
   */
  goToMyProjects(): void {
    this.router.navigate(['/my-projects']);
  }

  /** True while a schedule is loaded — drives the "Schedule" nav pill's active state. */
  get hasOpenSchedule(): boolean {
    return !!this.scheduleState.schedule;
  }

  // ─────────────────────────────────────────────
  // Private
  // ─────────────────────────────────────────────

  private loadScheduleById(id: string): void {
    // Don't reload if the same schedule is already loaded
    if (this.scheduleState.schedule?.id === id) return;

    this.isLoadingRoute = true;
    this.routeLoadError = null;
    this.cdr.markForCheck();

    this.scheduleApi.getSchedule(id).subscribe({
      next: (response) => {
        this.scheduleState.setSchedule(response.schedule);
        // Schedule loaded from backend — mark it as already persisted
        this.autoSave.markSavedToBackend();
        this.isLoadingRoute = false;
        this.cdr.markForCheck();
        this.resolveLinkedProject(response.schedule);
      },
      error: (err) => {
        this.routeLoadError = err.message || 'Failed to load schedule.';
        this.isLoadingRoute = false;
        this.cdr.markForCheck();
      },
    });
  }

  // ─────────────────────────────────────────────
  // Project linking (T041/T042)
  // ─────────────────────────────────────────────

  /**
   * Resolves the opened schedule's `projectId` through ProjectService.
   * A resolvable, owned, non-legacy project means script data is live —
   * PdfService/UploadService get hydrated exactly like a fresh upload, so
   * ScheduleTabComponent (and the rest of the app) can treat it as such.
   *
   * Any failure to resolve (no projectId, legacy `proj-{timestamp}` id, or
   * an API error such as a deleted/un-owned/content-missing project) keeps
   * today's pre-027 behavior exactly: the already-loaded schedule still
   * renders and its persisted one-liners/descriptions still work manually,
   * only the "live" script re-seed path is unavailable until attached.
   */
  private resolveLinkedProject(schedule: ProductionSchedule): void {
    const projectId = schedule.projectId;

    if (!projectId || isLegacyProjectId(projectId)) {
      this.isProjectLinked = false;
      this.isLegacySchedule = true;
      this.linkedProject = null;
      this.cdr.markForCheck();
      return;
    }

    this.isHydratingProject = true;
    this.cdr.markForCheck();

    this.projectService.openProject(projectId).subscribe({
      next: (result) => {
        this.isProjectLinked = true;
        this.isLegacySchedule = false;
        this.isHydratingProject = false;
        this.linkedProject = result.project;
        this.cdr.markForCheck();
      },
      error: () => {
        // Deleted, not owned, or CONTENT_MISSING — fall back to legacy behavior.
        this.isProjectLinked = false;
        this.isLegacySchedule = true;
        this.isHydratingProject = false;
        this.linkedProject = null;
        this.cdr.markForCheck();
      },
    });
  }

  /**
   * Opens the "link this schedule to a project" picker, lazily loading the
   * user's saved projects the first time it's opened.
   */
  openAttachPicker(): void {
    this.isAttachPickerOpen = true;
    this.attachError = null;

    if (this.attachableProjects.length === 0) {
      this.isLoadingAttachOptions = true;
      this.cdr.markForCheck();

      this.projectApi.listProjects().subscribe({
        next: (response) => {
          this.attachableProjects = response.projects || [];
          this.isLoadingAttachOptions = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.attachableProjects = [];
          this.isLoadingAttachOptions = false;
          this.attachError = 'Failed to load your saved projects.';
          this.cdr.markForCheck();
        },
      });
    }

    this.cdr.markForCheck();
  }

  closeAttachPicker(): void {
    this.isAttachPickerOpen = false;
    this.attachError = null;
    this.cdr.markForCheck();
  }

  /**
   * Links the currently open (legacy/unlinked) schedule to a real, owned
   * project via PUT /schedule/:id (T034), then re-attempts hydration so the
   * schedule becomes "live" immediately without a page reload (T042).
   */
  attachToProject(projectId: string): void {
    const schedule = this.scheduleState.schedule;
    if (!schedule || !projectId) return;

    this.isAttaching = true;
    this.attachError = null;
    this.cdr.markForCheck();

    const updatedSchedule: ProductionSchedule = { ...schedule, projectId };

    this.scheduleApi.updateSchedule(updatedSchedule).subscribe({
      next: () => {
        this.scheduleState.setSchedule(updatedSchedule);
        this.isAttaching = false;
        this.isAttachPickerOpen = false;
        this.cdr.markForCheck();
        this.resolveLinkedProject(updatedSchedule);
      },
      error: (err) => {
        this.isAttaching = false;
        this.attachError = err.message || 'Failed to link this schedule to the selected project.';
        this.cdr.markForCheck();
      },
    });
  }
}
