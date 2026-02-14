import { Injectable, OnDestroy } from '@angular/core';
import { Subscription, Subject, of, EMPTY } from 'rxjs';
import {
  debounceTime,
  filter,
  switchMap,
  tap,
  retry,
  catchError,
  distinctUntilChanged,
} from 'rxjs/operators';
import { ScheduleStateService } from './schedule-state.service';
import { ScheduleApiService } from './schedule-api.service';
import { ProductionSchedule } from '../../types/Schedule';

/**
 * ScheduleAutoSaveService — Debounced auto-save pipeline.
 *
 * Subscribes to schedule state changes and automatically persists
 * dirty schedules to the backend after a 1-second debounce period.
 *
 * Features:
 *   - 1-second debounce: rapid drag-drops → single save
 *   - Retry on failure: up to 3 attempts before giving up
 *   - Version conflict detection: surfaces 409 errors
 *   - Save status tracking: "Saving…" / "Saved ✓" / error
 *   - Manual save trigger for immediate persistence
 *   - Destroy cleanup prevents leaked subscriptions
 *
 * Usage:
 *   Inject into ScheduleTabComponent and call `start()` once a schedule
 *   is loaded, `stop()` when navigating away or destroying the component.
 */
@Injectable({
  providedIn: 'root',
})
export class ScheduleAutoSaveService implements OnDestroy {
  /** Whether auto-save is currently active */
  private active = false;

  /** Auto-save subscription */
  private autoSaveSub: Subscription | null = null;

  /** Manual save trigger */
  private manualSave$ = new Subject<void>();
  private manualSaveSub: Subscription | null = null;

  /** Last save status for UI display */
  private _lastSaveError: string | null = null;
  private _saveAttemptCount = 0;
  private _versionConflict = false;

  /** Max retry attempts on transient failures */
  static readonly MAX_RETRIES = 3;

  /** Debounce time in ms */
  static readonly DEBOUNCE_MS = 1000;

  constructor(
    private scheduleState: ScheduleStateService,
    private scheduleApi: ScheduleApiService
  ) {}

  // ─────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────

  /**
   * Start the auto-save pipeline. Should be called once when a
   * schedule is loaded and the user is authenticated.
   */
  start(): void {
    if (this.active) return;
    this.active = true;
    this._lastSaveError = null;
    this._versionConflict = false;

    // Auto-save: fires when isDirty$ becomes true, debounced by 1s
    this.autoSaveSub = this.scheduleState.isDirty$.pipe(
      distinctUntilChanged(),
      filter((dirty) => dirty === true),
      debounceTime(ScheduleAutoSaveService.DEBOUNCE_MS),
      // Only save if still dirty (user may have undone changes)
      filter(() => this.scheduleState.isDirty),
      switchMap(() => this.performSave())
    ).subscribe();

    // Manual save: immediate, no debounce
    this.manualSaveSub = this.manualSave$.pipe(
      filter(() => this.scheduleState.isDirty),
      switchMap(() => this.performSave())
    ).subscribe();
  }

  /**
   * Stop the auto-save pipeline. Call when navigating away
   * from the schedule tab or on component destroy.
   */
  stop(): void {
    this.active = false;
    this.autoSaveSub?.unsubscribe();
    this.autoSaveSub = null;
    this.manualSaveSub?.unsubscribe();
    this.manualSaveSub = null;
  }

  /**
   * Trigger an immediate save (bypasses debounce).
   */
  saveNow(): void {
    this.manualSave$.next();
  }

  /**
   * Whether the auto-save pipeline is running.
   */
  get isActive(): boolean {
    return this.active;
  }

  /**
   * Last save error message, or null if last save succeeded.
   */
  get lastSaveError(): string | null {
    return this._lastSaveError;
  }

  /**
   * Whether the last failure was a version conflict (409).
   */
  get versionConflict(): boolean {
    return this._versionConflict;
  }

  ngOnDestroy(): void {
    this.stop();
  }

  // ─────────────────────────────────────────────
  // Internal Save Logic
  // ─────────────────────────────────────────────

  /**
   * Performs the actual save — gets current schedule, calls API,
   * handles success/error, and updates state.
   *
   * Returns an Observable that completes after the save attempt.
   * Errors are caught internally so the outer subscription stays alive.
   */
  private performSave() {
    const schedule = this.scheduleState.schedule;
    if (!schedule) return EMPTY;

    this._saveAttemptCount++;
    this._lastSaveError = null;
    this._versionConflict = false;

    // Mark as saving in state
    this.scheduleState.setSaving(true);

    // Choose create vs update based on whether this schedule exists
    const save$ = this.getSaveObservable(schedule);

    return save$.pipe(
      retry({
        count: ScheduleAutoSaveService.MAX_RETRIES,
        delay: (error, retryCount) => {
          // Don't retry on version conflicts (409) or auth errors (401/403)
          const status = error?.status || 0;
          if (status === 409 || status === 401 || status === 403) {
            throw error; // Skip retry, propagate to catchError
          }
          // Exponential backoff: 500ms, 1000ms, 2000ms
          const delayMs = 500 * Math.pow(2, retryCount - 1);
          return of(null).pipe(
            switchMap(() => {
              return new Promise<void>((resolve) => setTimeout(resolve, delayMs));
            })
          );
        },
      }),
      tap(() => {
        // Success
        this.scheduleState.markSaved();
        this._lastSaveError = null;
        this._versionConflict = false;
        this._saveAttemptCount = 0;
      }),
      catchError((error) => {
        // Failed after retries
        this.scheduleState.setSaving(false);

        const status = error?.status || 0;
        if (status === 409) {
          this._versionConflict = true;
          this._lastSaveError = 'Schedule modified by another session. Please reload.';
        } else if (status === 401 || status === 403) {
          this._lastSaveError = 'Authentication expired. Please sign in again.';
        } else {
          this._lastSaveError = error?.message || 'Failed to save schedule.';
        }

        console.error('ScheduleAutoSave: Save failed', {
          error: this._lastSaveError,
          status,
          attempts: this._saveAttemptCount,
        });

        // Return EMPTY so the outer subscription stays alive
        return EMPTY;
      })
    );
  }

  /**
   * Returns the correct API observable based on schedule state.
   * New schedules (version 1, never saved) use POST, updates use PUT.
   */
  private getSaveObservable(schedule: ProductionSchedule) {
    // If schedule version is 1 and it hasn't been saved yet,
    // use create. Otherwise use update.
    // The version gets incremented by ScheduleStateService on every change,
    // so version > 1 means it's been modified and needs an update.
    return this.scheduleApi.updateSchedule(schedule);
  }
}
