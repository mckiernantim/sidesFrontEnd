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

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private scheduleApi: ScheduleApiService,
    private scheduleState: ScheduleStateService,
    private autoSave: ScheduleAutoSaveService,
    private authService: AuthService,
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
      },
      error: (err) => {
        this.routeLoadError = err.message || 'Failed to load schedule.';
        this.isLoadingRoute = false;
        this.cdr.markForCheck();
      },
    });
  }
}
