import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import {
  ProductionSchedule,
  ScheduleScene,
  ShootDay,
  formatFifteenMinIncrements,
} from '../../../types/Schedule';
import { ScheduleStateService } from '../../../services/schedule/schedule-state.service';
import { ScheduleService } from '../../../services/schedule/schedule.service';
import { ScheduleAutoSaveService } from '../../../services/schedule/schedule-auto-save.service';

/**
 * ScheduleBuilderComponent — The main schedule building interface.
 *
 * Layout:
 * - Left panel: Unscheduled scenes pool (draggable)
 * - Right panel: Shoot days in vertical columns (drop zones)
 * - Bottom: "Add Day" button
 *
 * Scenes can be dragged from the unscheduled pool to shoot days,
 * between days, or back to the pool. All changes flow through
 * ScheduleStateService which manages the reactive state.
 */
@Component({
  selector: 'app-schedule-builder',
  templateUrl: './schedule-builder.component.html',
  styleUrls: ['./schedule-builder.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ScheduleBuilderComponent implements OnInit, OnDestroy {
  schedule: ProductionSchedule | null = null;
  isDirty: boolean = false;
  isSaving: boolean = false;
  lastSavedAt: string | null = null;
  saveError: string | null = null;

  private subscriptions: Subscription[] = [];

  // Drop list IDs for CDK drag-drop connectivity
  unscheduledDropListId = 'unscheduled-pool';

  constructor(
    private scheduleState: ScheduleStateService,
    private scheduleService: ScheduleService,
    private autoSave: ScheduleAutoSaveService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to schedule state
    this.subscriptions.push(
      this.scheduleState.schedule$.subscribe((schedule) => {
        this.schedule = schedule;
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
        this.saveError = this.autoSave.lastSaveError;
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  /**
   * Returns all drop list IDs for CDK connectivity (unscheduled + all days).
   */
  get allDropListIds(): string[] {
    if (!this.schedule) return [this.unscheduledDropListId];
    const dayIds = this.schedule.shootDays.map((d) => `day-${d.id}`);
    return [this.unscheduledDropListId, ...dayIds];
  }

  /**
   * Returns connected drop list IDs for a specific day.
   */
  getConnectedLists(dayId: string): string[] {
    return this.allDropListIds.filter((id) => id !== `day-${dayId}`);
  }

  /**
   * Returns the total estimated time across all shoot days.
   */
  get totalScheduleTime(): string {
    if (!this.schedule) return '0m';
    const total = this.schedule.shootDays.reduce(
      (sum, d) => sum + d.estimatedTotalTime,
      0
    );
    return formatFifteenMinIncrements(total);
  }

  /**
   * Returns the count of scheduled vs total scenes.
   */
  get scheduleProgress(): string {
    if (!this.schedule) return '0 / 0';
    const total =
      this.schedule.unscheduledScenes.length +
      this.schedule.shootDays.reduce((sum, d) => sum + d.scenes.length, 0);
    const scheduled = this.schedule.shootDays.reduce(
      (sum, d) => sum + d.scenes.length,
      0
    );
    return `${scheduled} / ${total}`;
  }

  // ─────────────────────────────────────────────
  // Drag-Drop Handlers
  // ─────────────────────────────────────────────

  /**
   * Handles drop events on the unscheduled pool.
   */
  onUnscheduledDrop(event: CdkDragDrop<ScheduleScene[]>): void {
    if (!this.schedule) return;

    if (event.previousContainer === event.container) {
      // Reorder within unscheduled - just reorder the array
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      // Scene coming from a day → move to unscheduled
      const scene = event.previousContainer.data[event.previousIndex];
      const sourceDayId = this.extractDayId(event.previousContainer.id);
      if (sourceDayId) {
        this.scheduleState.moveSceneToUnscheduled(scene.id, sourceDayId);
      }
    }
  }

  /**
   * Handles drop events on a shoot day.
   */
  onDayDrop(event: CdkDragDrop<ScheduleScene[]>, dayId: string): void {
    if (!this.schedule) return;

    if (event.previousContainer === event.container) {
      // Reorder within the same day
      const scene = event.container.data[event.previousIndex];
      this.scheduleState.moveSceneBetweenDays(
        scene.id,
        dayId,
        dayId,
        event.currentIndex
      );
    } else if (event.previousContainer.id === this.unscheduledDropListId) {
      // Coming from unscheduled pool
      const scene = event.previousContainer.data[event.previousIndex];
      this.scheduleState.moveSceneToDay(scene.id, dayId, event.currentIndex);
    } else {
      // Coming from another day
      const scene = event.previousContainer.data[event.previousIndex];
      const sourceDayId = this.extractDayId(event.previousContainer.id);
      if (sourceDayId) {
        this.scheduleState.moveSceneBetweenDays(
          scene.id,
          sourceDayId,
          dayId,
          event.currentIndex
        );
      }
    }
  }

  // ─────────────────────────────────────────────
  // Day Management
  // ─────────────────────────────────────────────

  addShootDay(): void {
    if (!this.schedule) return;
    const dayNumber = this.schedule.shootDays.length + 1;
    const newDay = this.scheduleService.createShootDay(dayNumber);
    this.scheduleState.addShootDay(newDay);
  }

  removeShootDay(dayId: string): void {
    this.scheduleState.removeShootDay(dayId);
  }

  // ─────────────────────────────────────────────
  // Scene Actions
  // ─────────────────────────────────────────────

  onSceneRemoved(event: { scene: ScheduleScene; dayId: string }): void {
    this.scheduleState.moveSceneToUnscheduled(event.scene.id, event.dayId);
  }

  onSceneClicked(scene: ScheduleScene): void {
    // Future: open scene detail panel
    console.log('Scene clicked:', scene.sceneNumber, scene.location);
  }

  onTimeChanged(event: { scene: ScheduleScene; newTime: number }): void {
    if (!this.schedule) return;

    // Update the scene's estimated time
    const updated: ProductionSchedule = {
      ...this.schedule,
      shootDays: this.schedule.shootDays.map((day) => {
        const sceneIndex = day.scenes.findIndex((s) => s.id === event.scene.id);
        if (sceneIndex === -1) return day;

        const updatedScenes = [...day.scenes];
        updatedScenes[sceneIndex] = {
          ...updatedScenes[sceneIndex],
          estimatedTimeInFifteenMin: event.newTime,
        };

        return {
          ...day,
          scenes: updatedScenes,
          estimatedTotalTime: updatedScenes.reduce(
            (sum, s) => sum + s.estimatedTimeInFifteenMin,
            0
          ),
        };
      }),
      unscheduledScenes: this.schedule.unscheduledScenes.map((s) => {
        if (s.id !== event.scene.id) return s;
        return { ...s, estimatedTimeInFifteenMin: event.newTime };
      }),
    };

    this.scheduleState.updateSchedule(updated);
  }

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────

  private extractDayId(dropListId: string): string | null {
    if (dropListId.startsWith('day-')) {
      return dropListId.substring(4);
    }
    return null;
  }

  trackByDayId(index: number, day: ShootDay): string {
    return day.id;
  }

  trackBySceneId(index: number, scene: ScheduleScene): string {
    return scene.id;
  }
}
