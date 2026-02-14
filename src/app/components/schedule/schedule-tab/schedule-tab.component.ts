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
import { ProductionSchedule } from '../../../types/Schedule';
import { AuthService } from '../../../services/auth/auth.service';

/**
 * ScheduleTabComponent — Container that bridges the existing dashboard
 * data flow to the ScheduleBuilderComponent.
 *
 * Responsibilities:
 * - Receives allLines and scenes from the dashboard context
 * - Seeds the schedule from classify output via ScheduleService
 * - Passes the schedule to ScheduleBuilderComponent via ScheduleStateService
 * - Saves / loads schedules via ScheduleApiService
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
  /** All classified lines from scan-classify output */
  @Input() allLines: Line[] = [];

  /** Scene references (firstAndLastLinesOfScenes from PdfService) */
  @Input() scenes: any[] = [];

  /** Project title (script name) */
  @Input() projectTitle: string = '';

  /** Whether a schedule has been loaded */
  scheduleLoaded: boolean = false;
  isLoading: boolean = false;
  isSaving: boolean = false;
  saveError: string | null = null;
  savedSchedules: ScheduleSummary[] = [];

  private userId: string = '';
  private subscriptions: Subscription[] = [];

  constructor(
    private scheduleState: ScheduleStateService,
    private scheduleService: ScheduleService,
    private scheduleApi: ScheduleApiService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Watch the schedule state
    this.subscriptions.push(
      this.scheduleState.schedule$.subscribe((schedule) => {
        this.scheduleLoaded = !!schedule;
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
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  /**
   * Creates a new production schedule from the classified script data.
   * Seeds the schedule via ScheduleService and activates it in ScheduleStateService.
   */
  createSchedule(): void {
    if (!this.allLines || this.allLines.length === 0) {
      console.warn('ScheduleTab: No allLines available to create schedule');
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    try {
      const projectId = `proj-${Date.now()}`;
      const schedule = this.scheduleService.seedAndActivateSchedule(
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

      // Auto-save to backend if user is authenticated
      if (this.userId) {
        this.saveScheduleToBackend(schedule);
      }
    } catch (err) {
      console.error('ScheduleTab: Failed to create schedule:', err);
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Saves the current schedule to the backend.
   */
  saveSchedule(): void {
    const schedule = this.scheduleState.schedule;
    if (!schedule) return;

    this.saveScheduleToBackend(schedule);
  }

  /**
   * Loads a previously saved schedule from the backend.
   */
  loadSchedule(scheduleId: string): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.scheduleApi.getSchedule(scheduleId).subscribe({
      next: (response) => {
        this.scheduleState.setSchedule(response.schedule);
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
   * Deletes a saved schedule.
   */
  deleteSchedule(scheduleId: string): void {
    this.scheduleApi.deleteSchedule(scheduleId).subscribe({
      next: () => {
        this.savedSchedules = this.savedSchedules.filter((s) => s.id !== scheduleId);
        // If the deleted schedule was active, clear state
        if (this.scheduleState.schedule?.id === scheduleId) {
          this.scheduleState.setSchedule(null as any);
        }
        this.cdr.markForCheck();
        console.log('ScheduleTab: Schedule deleted:', scheduleId);
      },
      error: (err) => {
        console.error('ScheduleTab: Failed to delete schedule:', err);
      },
    });
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
