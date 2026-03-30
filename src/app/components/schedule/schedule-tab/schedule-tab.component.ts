import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { Line } from '../../../types/Line';
import { ScheduleStateService } from '../../../services/schedule/schedule-state.service';
import { ScheduleService } from '../../../services/schedule/schedule.service';
import { ScheduleApiService, ScheduleSummary } from '../../../services/schedule/schedule-api.service';
import { ScheduleAutoSaveService } from '../../../services/schedule/schedule-auto-save.service';
import { TailwindDialogService } from '../../../services/tailwind-dialog/tailwind-dialog.service';
import { TailwindDialogComponent } from '../../shared/tailwind-dialog/tailwind-dialog.component';
import { ProductionSchedule } from '../../../types/Schedule';
import { AuthService } from '../../../services/auth/auth.service';
import { PdfService } from '../../../services/pdf/pdf.service';

/**
 * ScheduleTabComponent — Container that bridges the existing dashboard
 * data flow to the ScheduleBuilderComponent.
 *
 * Responsibilities:
 * - Receives allLines and scenes from the dashboard context
 * - Seeds the schedule from classify output via ScheduleService
 * - Passes the schedule to ScheduleBuilderComponent via ScheduleStateService
 * - Saves / loads schedules via ScheduleApiService
 * - CRUD: New schedule, delete with confirmation, schedule selector
 * - Handles the "Create Schedule" button when no schedule exists
 */
@Component({
  selector: 'app-schedule-tab',
  templateUrl: './schedule-tab.component.html',
  styleUrls: ['./schedule-tab.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ScheduleTabComponent implements OnInit, OnDestroy {
  /** PDF Service - single source of truth for script data */
  @Input() pdfService?: PdfService;

  /** All classified lines from scan-classify output (DEPRECATED: use pdfService) */
  @Input() allLines: Line[] = [];

  /** Scene references (firstAndLastLinesOfScenes from PdfService) (DEPRECATED: use pdfService) */
  @Input() scenes: any[] = [];

  /** Project title (script name) */
  @Input() projectTitle: string = '';

  /** Whether a schedule has been loaded */
  scheduleLoaded: boolean = false;
  isLoading: boolean = false;
  isSaving: boolean = false;
  saveError: string | null = null;
  savedSchedules: ScheduleSummary[] = [];
  lastSavedAt: string | null = null;

  /** Whether the schedule selector dropdown is open */
  scheduleSelectorOpen: boolean = false;

  /** Whether the schedule is being deleted */
  isDeleting: boolean = false;

  private userId: string = '';
  private subscriptions: Subscription[] = [];

  constructor(
    private scheduleState: ScheduleStateService,
    private scheduleService: ScheduleService,
    private scheduleApi: ScheduleApiService,
    private autoSave: ScheduleAutoSaveService,
    private authService: AuthService,
    private dialogService: TailwindDialogService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Watch the schedule state
    this.subscriptions.push(
      this.scheduleState.schedule$.subscribe((schedule) => {
        const wasLoaded = this.scheduleLoaded;
        this.scheduleLoaded = !!schedule;

        // Start auto-save when a schedule is first loaded
        if (schedule && !wasLoaded && this.userId) {
          this.autoSave.start();
        }

        this.cdr.markForCheck();
      })
    );

    // Track saving state from auto-save
    this.subscriptions.push(
      this.scheduleState.isSaving$.subscribe((saving) => {
        this.isSaving = saving;
        this.cdr.markForCheck();
      })
    );

    // Track last saved timestamp
    this.subscriptions.push(
      this.scheduleState.lastSavedAt$.subscribe((timestamp) => {
        this.lastSavedAt = timestamp;
        this.cdr.markForCheck();
      })
    );

    // Get the authenticated user ID
    this.subscriptions.push(
      this.authService.user$.subscribe((user) => {
        this.userId = user?.uid || '';
        // When we have a user, load their saved schedules
        if (this.userId) {
          this.loadSavedSchedules();
          // Start auto-save if schedule already loaded
          if (this.scheduleLoaded) {
            this.autoSave.start();
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.autoSave.stop();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  // ─────────────────────────────────────────────
  // Schedule Creation
  // ─────────────────────────────────────────────

  /**
   * Creates a new production schedule from the classified script data.
   * Seeds the schedule via ScheduleService and activates it in ScheduleStateService.
   */
  createSchedule(): void {
    // Check if we have any data to work with
    const hasAllLines = this.allLines && this.allLines.length > 0;
    const hasPdfService = this.pdfService &&
                         this.pdfService.allLines &&
                         this.pdfService.allLines.length > 0;

    if (!hasAllLines && !hasPdfService) {
      console.warn('ScheduleTab: No script data available to create schedule');
      alert('Please upload and process a script first before creating a schedule.');
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    try {
      const projectId = `proj-${Date.now()}`;
      let schedule: ProductionSchedule;

      // Prefer PDF Service if available (single source of truth)
      if (hasPdfService) {
        console.log('ScheduleTab: Creating schedule from PDF Service');
        schedule = this.scheduleService.seedScheduleFromPdfService(
          projectId,
          this.projectTitle || 'Untitled Project',
          this.userId || 'anonymous',
          this.pdfService!
        );

        console.log(
          'ScheduleTab: Schedule created from PDF Service with',
          schedule.unscheduledScenes.length,
          'scenes,',
          schedule.castMembers.length,
          'cast members'
        );
      } else {
        // Fallback to legacy allLines/scenes method
        console.log('ScheduleTab: Creating schedule from allLines (legacy)');
        schedule = this.scheduleService.seedAndActivateSchedule(
          projectId,
          this.projectTitle || 'Untitled Project',
          this.userId || 'anonymous',
          this.allLines,
          this.scenes
        );

        console.log(
          'ScheduleTab: Schedule created with',
          schedule.unscheduledScenes.length,
          'scenes,',
          schedule.castMembers.length,
          'cast members,',
          schedule.locations.length,
          'locations'
        );
      }

      // Auto-save to backend if user is authenticated
      if (this.userId && schedule) {
        this.saveScheduleToBackend(schedule);
      }
    } catch (error) {
      console.error('ScheduleTab: Failed to create schedule:', error);
      alert('Failed to create schedule. Please try uploading your script again.');
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Starts a new schedule. If a schedule is already loaded with unsaved
   * changes, prompts the user to confirm before discarding.
   */
  confirmNewSchedule(): void {
    // Check if we have any data to work with
    const hasAllLines = this.allLines && this.allLines.length > 0;
    const hasPdfService = this.pdfService &&
                         this.pdfService.allLines &&
                         this.pdfService.allLines.length > 0;

    if (!hasAllLines && !hasPdfService) {
      console.warn('ScheduleTab: No script data available to create schedule');
      alert('Please upload and process a script first before creating a schedule.');
      return;
    }

    if (this.scheduleLoaded && this.scheduleState.isDirty) {
      const dialogRef = this.dialogService.open(TailwindDialogComponent, {
        data: {
          title: 'Unsaved Changes',
          content: 'You have unsaved changes to the current schedule. Creating a new schedule will discard them.',
          actions: [
            { label: 'Cancel', value: 'cancel', style: 'secondary' },
            { label: 'Discard & Create New', value: 'confirm', style: 'danger' },
          ],
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result === 'confirm') {
          this.autoSave.stop();
          this.scheduleState.clearSchedule();
          this.createSchedule();
        }
      });
    } else if (this.scheduleLoaded) {
      // Schedule loaded but not dirty — just confirm replacement
      const dialogRef = this.dialogService.open(TailwindDialogComponent, {
        data: {
          title: 'Create New Schedule',
          content: 'This will replace the current schedule with a fresh one. Continue?',
          actions: [
            { label: 'Cancel', value: 'cancel', style: 'secondary' },
            { label: 'Create New', value: 'confirm', style: 'primary' },
          ],
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result === 'confirm') {
          this.autoSave.stop();
          this.scheduleState.clearSchedule();
          this.createSchedule();
        }
      });
    } else {
      // No schedule loaded — create directly
      this.createSchedule();
    }
  }

  // ─────────────────────────────────────────────
  // Schedule Saving
  // ─────────────────────────────────────────────

  /**
   * Saves the current schedule immediately (bypasses debounce).
   */
  saveSchedule(): void {
    this.autoSave.saveNow();
  }

  /**
   * Whether there's a version conflict that needs user attention.
   */
  get hasVersionConflict(): boolean {
    return this.autoSave.versionConflict;
  }

  // ─────────────────────────────────────────────
  // Schedule Loading & Switching
  // ─────────────────────────────────────────────

  /**
   * Loads a previously saved schedule from the backend.
   */
  loadSchedule(scheduleId: string): void {
    this.isLoading = true;
    this.scheduleSelectorOpen = false;
    this.cdr.markForCheck();

    this.scheduleApi.getSchedule(scheduleId).subscribe({
      next: (response) => {
        this.autoSave.stop();
        this.scheduleState.setSchedule(response.schedule);
        // Schedule is loaded from backend, so it's already persisted
        this.autoSave.markSavedToBackend();
        this.isLoading = false;
        this.cdr.markForCheck();
        console.log('ScheduleTab: Schedule loaded from backend:', scheduleId);
      },
      error: (err) => {
        console.error('ScheduleTab: Failed to load schedule:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  /**
   * Switches to a different saved schedule. If the current schedule has
   * unsaved changes, prompts the user to confirm first.
   */
  switchSchedule(scheduleId: string): void {
    // Don't switch to the already-active schedule
    if (this.scheduleState.schedule?.id === scheduleId) {
      this.scheduleSelectorOpen = false;
      return;
    }

    if (this.scheduleState.isDirty) {
      const dialogRef = this.dialogService.open(TailwindDialogComponent, {
        data: {
          title: 'Unsaved Changes',
          content: 'You have unsaved changes. Switch schedules anyway?',
          actions: [
            { label: 'Cancel', value: 'cancel', style: 'secondary' },
            { label: 'Discard & Switch', value: 'confirm', style: 'danger' },
          ],
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result === 'confirm') {
          this.loadSchedule(scheduleId);
        }
      });
    } else {
      this.loadSchedule(scheduleId);
    }
  }

  /**
   * Toggles the schedule selector dropdown.
   */
  toggleScheduleSelector(): void {
    this.scheduleSelectorOpen = !this.scheduleSelectorOpen;
    this.cdr.markForCheck();
  }

  /**
   * Closes the schedule selector dropdown.
   */
  closeScheduleSelector(): void {
    this.scheduleSelectorOpen = false;
    this.cdr.markForCheck();
  }

  // ─────────────────────────────────────────────
  // Schedule Deletion
  // ─────────────────────────────────────────────

  /**
   * Shows a confirmation dialog before deleting a schedule.
   */
  confirmDeleteSchedule(scheduleId: string, title?: string): void {
    const scheduleName = title || 'this schedule';
    const dialogRef = this.dialogService.open(TailwindDialogComponent, {
      data: {
        title: 'Delete Schedule',
        content: `Are you sure you want to delete <strong>${scheduleName}</strong>? This action cannot be undone.`,
        actions: [
          { label: 'Cancel', value: 'cancel', style: 'secondary' },
          { label: 'Delete', value: 'confirm', style: 'danger' },
        ],
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'confirm') {
        this.deleteSchedule(scheduleId);
      }
    });
  }

  /**
   * Confirms deletion of the currently active schedule.
   */
  confirmDeleteCurrentSchedule(): void {
    const schedule = this.scheduleState.schedule;
    if (!schedule) return;

    this.confirmDeleteSchedule(schedule.id, schedule.projectTitle);
  }

  /**
   * Deletes a saved schedule from the backend.
   */
  deleteSchedule(scheduleId: string): void {
    this.isDeleting = true;
    this.cdr.markForCheck();

    this.scheduleApi.deleteSchedule(scheduleId).subscribe({
      next: () => {
        this.savedSchedules = this.savedSchedules.filter((s) => s.id !== scheduleId);
        // If the deleted schedule was active, clear state
        if (this.scheduleState.schedule?.id === scheduleId) {
          this.autoSave.stop();
          this.scheduleState.clearSchedule();
        }
        this.isDeleting = false;
        this.cdr.markForCheck();
        console.log('ScheduleTab: Schedule deleted:', scheduleId);
      },
      error: (err) => {
        this.isDeleting = false;
        this.cdr.markForCheck();
        console.error('ScheduleTab: Failed to delete schedule:', err);
      },
    });
  }

  // ─────────────────────────────────────────────
  // Getters for template
  // ─────────────────────────────────────────────

  /**
   * Returns the currently active schedule (for template access).
   */
  get currentSchedule(): ProductionSchedule | null {
    return this.scheduleState.schedule;
  }

  /**
   * Returns saved schedules excluding the active one (for the selector).
   */
  get otherSavedSchedules(): ScheduleSummary[] {
    const activeId = this.scheduleState.schedule?.id;
    return this.savedSchedules.filter((s) => s.id !== activeId);
  }

  /**
   * Checks if PDF service has valid data for one-liner generation.
   * This is required for Flow #1 (new script upload).
   */
  get hasPdfServiceData(): boolean {
    return this.scheduleService.hasPdfServiceData(this.pdfService);
  }

  /**
   * Checks if we have any script data available to create a schedule.
   * Returns true if either pdfService OR allLines/scenes have data.
   */
  get hasScriptData(): boolean {
    const hasAllLines = this.allLines && this.allLines.length > 0;
    const hasPdfService = this.pdfService &&
                         this.pdfService.allLines &&
                         this.pdfService.allLines.length > 0;
    return hasAllLines || hasPdfService;
  }

  // ─────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────

  private saveScheduleToBackend(schedule: ProductionSchedule): void {
    this.isSaving = true;
    this.saveError = null;
    this.cdr.markForCheck();

    const saveObs = schedule.version === 1
      ? this.scheduleApi.createSchedule(schedule)
      : this.scheduleApi.updateSchedule(schedule);

    saveObs.subscribe({
      next: (response) => {
        this.isSaving = false;
        this.saveError = null;
        this.cdr.markForCheck();
        console.log('ScheduleTab: Schedule saved to backend:', response);

        // Tell auto-save that this schedule now exists on the backend
        this.autoSave.markSavedToBackend();

        // Sync version from backend response if available
        if ((response as any)?.version && this.scheduleState.schedule) {
          this.scheduleState.syncVersion((response as any).version);
        }

        // Refresh the saved schedules list
        this.loadSavedSchedules();
      },
      error: (err) => {
        this.isSaving = false;
        this.saveError = err.message;
        this.cdr.markForCheck();
        console.error('ScheduleTab: Failed to save schedule:', err);
      },
    });
  }

  private loadSavedSchedules(): void {
    this.scheduleApi.listSchedules().subscribe({
      next: (response) => {
        this.savedSchedules = response.schedules;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('ScheduleTab: Failed to load saved schedules:', err);
      },
    });
  }
}
