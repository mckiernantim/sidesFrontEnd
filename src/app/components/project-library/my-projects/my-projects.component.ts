import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProjectLibraryCard, ProjectLibraryService } from '../../../services/project/project-library.service';
import { ProjectService } from '../../../services/project/project.service';
import { ScheduleSummary } from '../../../services/schedule/schedule-api.service';
import { ScheduleStateService } from '../../../services/schedule/schedule-state.service';
import { TailwindDialogService } from '../../../services/tailwind-dialog/tailwind-dialog.service';
import { TailwindDialogComponent } from '../../shared/tailwind-dialog/tailwind-dialog.component';

const PROJECT_LIMIT = 5;

/**
 * MyProjectsComponent — spec 028 `/my-projects` route.
 *
 * Full CRUD library (US4, contracts/project-library-ui.md's Phase E contract
 * + the design mock): each card shows title, page count, scene count,
 * schedule count, and last-updated date, with Open Schedule/Create Schedule,
 * inline Rename, and Delete (with a linked-schedule warning) actions, plus
 * an always-present "+ Upload Script" entry point. Enhanced in place from
 * the Phase B/C minimal-list stub (US1 T027) — same files, same route.
 *
 * All data comes from `ProjectLibraryService`, which assembles cards from
 * `GET /project/user` plus a per-project `GET /project/:id/links` call
 * (027 T055) and owns rename/delete's optimistic-update + rollback state.
 */
@Component({
  selector: 'app-my-projects',
  templateUrl: './my-projects.component.html',
  styleUrls: ['./my-projects.component.css'],
  standalone: false,
})
export class MyProjectsComponent implements OnInit, OnDestroy {
  readonly projectLimit = PROJECT_LIMIT;

  isLoading = true;
  cards: ProjectLibraryCard[] = [];
  loadError: string | null = null;

  /** Id of the card currently resolving "Open Schedule" or "Create Schedule". */
  actingProjectId: string | null = null;
  openError: string | null = null;

  /** "Multiple schedules" picker state (US3 acceptance scenario 3 / T046). */
  schedulePickerProjectId: string | null = null;
  schedulePickerOptions: ScheduleSummary[] = [];

  /**
   * Zero-schedule fallback choice (US3's original contract): only reachable
   * if a card's displayed scheduleCount is stale (e.g. GET /project/:id/links
   * isn't deployed yet) and "Open Schedule" resolves to zero linked
   * schedules after all. The normal Phase E path never needs this — a card
   * with scheduleCount === 0 shows "Create Schedule" directly (T051).
   */
  noScheduleChoiceProjectId: string | null = null;
  noScheduleChoiceProjectTitle: string | null = null;

  /** Inline rename state (T050). */
  renamingProjectId: string | null = null;
  renameDraftTitle = '';
  isRenaming = false;
  renameError: string | null = null;

  /** Delete-in-flight state (T050). */
  deletingProjectId: string | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private projectLibrary: ProjectLibraryService,
    private projectService: ProjectService,
    private scheduleState: ScheduleStateService,
    private dialogService: TailwindDialogService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.projectLibrary.cards$.subscribe((cards) => {
        this.cards = cards;
      })
    );
    this.loadProjects();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  loadProjects(): void {
    this.isLoading = true;
    this.loadError = null;
    this.projectLibrary.loadLibrary().subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (err) => {
        this.loadError = err?.message || 'Failed to load projects. Please try again.';
        this.isLoading = false;
      },
    });
  }

  get isAtProjectLimit(): boolean {
    return this.cards.length >= this.projectLimit;
  }

  // ─────────────────────────────────────────────
  // Open Schedule (US3's shared resolution logic)
  // ─────────────────────────────────────────────

  /**
   * "Open Schedule" — shown when the card's scheduleCount > 0. Resolves
   * through ProjectLibraryService.openProject(), which hydrates PdfService
   * and navigates directly for a single linked schedule, or offers a picker
   * for multiple (US3 acceptance scenario 3). A scheduleCount that turns out
   * to be stale (kind: 'none') falls back to the original US3 choice prompt
   * rather than silently failing.
   */
  openProject(card: ProjectLibraryCard): void {
    this.actingProjectId = card.project.id;
    this.openError = null;
    this.closeSchedulePicker();
    this.closeNoScheduleChoice();

    this.projectLibrary.openProject(card.project.id).subscribe({
      next: (resolution) => {
        this.actingProjectId = null;

        if (resolution.kind === 'picker') {
          this.schedulePickerProjectId = card.project.id;
          this.schedulePickerOptions = resolution.schedules;
        } else if (resolution.kind === 'none') {
          this.noScheduleChoiceProjectId = card.project.id;
          this.noScheduleChoiceProjectTitle = card.project.title;
        }
        // 'schedule': ProjectLibraryService already navigated — nothing else to do.
      },
      error: (err) => {
        this.actingProjectId = null;
        this.openError = err?.message || 'Failed to open this project. Please try again.';
      },
    });
  }

  /** Picker selection (US3 acceptance scenario 3). */
  chooseSchedule(scheduleId: string): void {
    this.projectLibrary.openSchedule(scheduleId);
    this.closeSchedulePicker();
  }

  closeSchedulePicker(): void {
    this.schedulePickerProjectId = null;
    this.schedulePickerOptions = [];
  }

  // ─────────────────────────────────────────────
  // Create Schedule (US4 T051)
  // ─────────────────────────────────────────────

  /**
   * "Create Schedule" — shown directly on a card when scheduleCount === 0.
   * Seeds and persists a new schedule from the project's scenes in one
   * click, then navigates straight to it (no intermediate confirmation —
   * the button already told the user what it does, per the design mock).
   */
  createScheduleForCard(card: ProjectLibraryCard): void {
    this.runCreateSchedule(card.project.id, card.project.title);
  }

  /** The US3 fallback choice's "Create Schedule" action (see noScheduleChoiceProjectId). */
  createScheduleForProject(): void {
    const projectId = this.noScheduleChoiceProjectId;
    const projectTitle = this.noScheduleChoiceProjectTitle || 'Untitled Project';
    this.closeNoScheduleChoice();
    if (!projectId) {
      return;
    }
    this.runCreateSchedule(projectId, projectTitle);
  }

  private runCreateSchedule(projectId: string, projectTitle: string): void {
    this.actingProjectId = projectId;
    this.openError = null;

    this.projectLibrary.createSchedule(projectId, projectTitle).subscribe({
      next: () => {
        this.actingProjectId = null;
      },
      error: (err) => {
        this.actingProjectId = null;
        this.openError = err?.message || 'Failed to create a schedule for this project.';
      },
    });
  }

  /** US3 fallback choice: "Continue to Dashboard" — sides flow, scenes all unselected. */
  continueToDashboard(): void {
    this.closeNoScheduleChoice();
    this.router.navigate(['/dashboard']);
  }

  closeNoScheduleChoice(): void {
    this.noScheduleChoiceProjectId = null;
    this.noScheduleChoiceProjectTitle = null;
  }

  // ─────────────────────────────────────────────
  // Rename (T050)
  // ─────────────────────────────────────────────

  startRename(card: ProjectLibraryCard): void {
    this.renamingProjectId = card.project.id;
    this.renameDraftTitle = card.project.title;
    this.renameError = null;
  }

  cancelRename(): void {
    this.renamingProjectId = null;
    this.renameDraftTitle = '';
    this.renameError = null;
  }

  confirmRename(card: ProjectLibraryCard): void {
    const title = this.renameDraftTitle.trim();
    if (!title) {
      this.renameError = 'Title cannot be empty.';
      return;
    }

    this.isRenaming = true;
    this.renameError = null;

    this.projectLibrary.renameProject(card.project.id, title).subscribe({
      next: () => {
        this.isRenaming = false;
        this.renamingProjectId = null;
      },
      error: (err) => {
        this.isRenaming = false;
        this.renameError = err?.message || 'Failed to rename this project.';
      },
    });
  }

  // ─────────────────────────────────────────────
  // Delete (T050) — confirmation names any linked schedules
  // ─────────────────────────────────────────────

  confirmDeleteCard(card: ProjectLibraryCard): void {
    const scheduleCount = card.linkedSchedules.length;
    const linkedNote =
      scheduleCount > 0
        ? ` This project has ${scheduleCount} linked schedule${scheduleCount === 1 ? '' : 's'} — ${
            scheduleCount === 1 ? 'it' : 'they'
          } will not be deleted, just unlinked.`
        : '';

    const dialogRef = this.dialogService.open(TailwindDialogComponent, {
      data: {
        title: 'Delete Project',
        content: `Are you sure you want to delete <strong>${card.project.title}</strong>? This permanently removes its stored script content and cannot be undone.${linkedNote}`,
        actions: [
          { label: 'Cancel', value: 'cancel', style: 'secondary' },
          { label: 'Delete', value: 'confirm', style: 'danger' },
        ],
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'confirm') {
        this.deleteCard(card);
      }
    });
  }

  private deleteCard(card: ProjectLibraryCard): void {
    this.deletingProjectId = card.project.id;
    this.openError = null;

    this.projectLibrary.deleteProject(card.project.id).subscribe({
      next: () => {
        this.deletingProjectId = null;
      },
      error: (err) => {
        this.deletingProjectId = null;
        this.openError = err?.message || 'Failed to delete this project.';
      },
    });
  }

  // ─────────────────────────────────────────────
  // Make sides (spec 029 US3) — hydrate a project straight into the sides
  // flow without requiring a schedule to exist first.
  // ─────────────────────────────────────────────

  makeSidesProjectId: string | null = null;

  makeSides(card: ProjectLibraryCard): void {
    this.makeSidesProjectId = card.project.id;
    this.openError = null;

    this.projectService.openProject(card.project.id).subscribe({
      next: () => {
        this.makeSidesProjectId = null;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.makeSidesProjectId = null;
        this.openError = err?.message || 'Failed to open this project. Please try again.';
      },
    });
  }

  // ─────────────────────────────────────────────
  // Upload (spec 029 US1 — lands on the upload-screen toggle, forced to
  // upload mode so "+ Upload Script" never competes with it)
  // ─────────────────────────────────────────────

  uploadScript(): void {
    this.router.navigate(['/'], { queryParams: { entry: 'upload' } });
  }

  // ─────────────────────────────────────────────
  // Shared chrome — My Projects | Schedule nav (spec 029 US4,
  // contracts/schedule-editor-ui.md "Shared chrome")
  // ─────────────────────────────────────────────

  /** True when a schedule is currently open in ScheduleStateService (root-scoped singleton). */
  get hasOpenSchedule(): boolean {
    return !!this.scheduleState.schedule;
  }

  /**
   * "Schedule" nav control — jumps back to the currently open/selected
   * schedule editor. No-ops (stays on the library) when nothing is open,
   * per contract: "if none, stay on library or no-op with guidance."
   */
  goToSchedule(): void {
    const schedule = this.scheduleState.schedule;
    if (!schedule) return;
    this.router.navigate(['/schedule', schedule.id]);
  }
}
