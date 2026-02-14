import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ProductionSchedule, ShootDay, ScheduleScene } from '../../types/Schedule';

/**
 * Reactive state management for the scheduling UI.
 * Holds the current schedule, active tab, dirty state, and saving state.
 * All state is exposed as observables for components to subscribe to.
 */
@Injectable({
  providedIn: 'root',
})
export class ScheduleStateService {
  // Core state
  private scheduleSubject = new BehaviorSubject<ProductionSchedule | null>(null);
  private activeTabSubject = new BehaviorSubject<'sides' | 'schedule'>('sides');
  private isDirtySubject = new BehaviorSubject<boolean>(false);
  private isSavingSubject = new BehaviorSubject<boolean>(false);
  private lastSavedAtSubject = new BehaviorSubject<string | null>(null);

  // Public observables
  readonly schedule$: Observable<ProductionSchedule | null> = this.scheduleSubject.asObservable();
  readonly activeTab$: Observable<'sides' | 'schedule'> = this.activeTabSubject.asObservable();
  readonly isDirty$: Observable<boolean> = this.isDirtySubject.asObservable();
  readonly isSaving$: Observable<boolean> = this.isSavingSubject.asObservable();
  readonly lastSavedAt$: Observable<string | null> = this.lastSavedAtSubject.asObservable();

  // ─────────────────────────────────────────────
  // Getters (synchronous access to current values)
  // ─────────────────────────────────────────────

  get schedule(): ProductionSchedule | null {
    return this.scheduleSubject.getValue();
  }

  get activeTab(): 'sides' | 'schedule' {
    return this.activeTabSubject.getValue();
  }

  get isDirty(): boolean {
    return this.isDirtySubject.getValue();
  }

  get isSaving(): boolean {
    return this.isSavingSubject.getValue();
  }

  // ─────────────────────────────────────────────
  // Tab Management
  // ─────────────────────────────────────────────

  setActiveTab(tab: 'sides' | 'schedule'): void {
    this.activeTabSubject.next(tab);
  }

  // ─────────────────────────────────────────────
  // Schedule CRUD Operations
  // ─────────────────────────────────────────────

  setSchedule(schedule: ProductionSchedule | null): void {
    this.scheduleSubject.next(schedule);
    this.isDirtySubject.next(false);
  }

  /**
   * Update the schedule and mark as dirty (needs saving).
   * Increments the version number automatically.
   */
  updateSchedule(schedule: ProductionSchedule): void {
    const updated: ProductionSchedule = {
      ...schedule,
      updatedAt: new Date().toISOString(),
      version: schedule.version + 1,
    };
    this.scheduleSubject.next(updated);
    this.isDirtySubject.next(true);
  }

  clearSchedule(): void {
    this.scheduleSubject.next(null);
    this.isDirtySubject.next(false);
  }

  // ─────────────────────────────────────────────
  // Scene Drag-Drop Operations
  // ─────────────────────────────────────────────

  /**
   * Move a scene from unscheduled to a specific shoot day at a given position.
   */
  moveSceneToDay(sceneId: string, targetDayId: string, targetIndex: number): void {
    const schedule = this.schedule;
    if (!schedule) return;

    // Find the scene in unscheduled
    const sceneIndex = schedule.unscheduledScenes.findIndex(s => s.id === sceneId);
    if (sceneIndex === -1) return;

    const scene = { ...schedule.unscheduledScenes[sceneIndex] };
    const newUnscheduled = [...schedule.unscheduledScenes];
    newUnscheduled.splice(sceneIndex, 1);

    // Find the target day
    const newDays = schedule.shootDays.map(day => {
      if (day.id !== targetDayId) return day;

      const newScenes = [...day.scenes];
      scene.shootDayId = targetDayId;
      scene.orderInDay = targetIndex;
      newScenes.splice(targetIndex, 0, scene);

      // Recalculate order and totals
      const reorderedScenes = newScenes.map((s, i) => ({ ...s, orderInDay: i }));
      return {
        ...day,
        scenes: reorderedScenes,
        estimatedPageCount: reorderedScenes.reduce((sum, s) => sum + s.pageCount, 0),
        estimatedTotalTime: reorderedScenes.reduce((sum, s) => sum + s.estimatedTimeInFifteenMin, 0),
      };
    });

    this.updateSchedule({
      ...schedule,
      unscheduledScenes: newUnscheduled,
      shootDays: newDays,
    });
  }

  /**
   * Move a scene from one shoot day to another (or reorder within the same day).
   */
  moveSceneBetweenDays(
    sceneId: string,
    sourceDayId: string,
    targetDayId: string,
    targetIndex: number
  ): void {
    const schedule = this.schedule;
    if (!schedule) return;

    let movedScene: ScheduleScene | null = null;

    // Remove from source day
    const afterRemoval = schedule.shootDays.map(day => {
      if (day.id !== sourceDayId) return day;

      const idx = day.scenes.findIndex(s => s.id === sceneId);
      if (idx === -1) return day;

      movedScene = { ...day.scenes[idx] };
      const newScenes = [...day.scenes];
      newScenes.splice(idx, 1);
      const reorderedScenes = newScenes.map((s, i) => ({ ...s, orderInDay: i }));

      return {
        ...day,
        scenes: reorderedScenes,
        estimatedPageCount: reorderedScenes.reduce((sum, s) => sum + s.pageCount, 0),
        estimatedTotalTime: reorderedScenes.reduce((sum, s) => sum + s.estimatedTimeInFifteenMin, 0),
      };
    });

    if (!movedScene) return;

    // Add to target day
    const afterInsertion = afterRemoval.map(day => {
      if (day.id !== targetDayId) return day;

      const newScenes = [...day.scenes];
      (movedScene as ScheduleScene).shootDayId = targetDayId;
      (movedScene as ScheduleScene).orderInDay = targetIndex;
      newScenes.splice(targetIndex, 0, movedScene as ScheduleScene);
      const reorderedScenes = newScenes.map((s, i) => ({ ...s, orderInDay: i }));

      return {
        ...day,
        scenes: reorderedScenes,
        estimatedPageCount: reorderedScenes.reduce((sum, s) => sum + s.pageCount, 0),
        estimatedTotalTime: reorderedScenes.reduce((sum, s) => sum + s.estimatedTimeInFifteenMin, 0),
      };
    });

    this.updateSchedule({
      ...schedule,
      shootDays: afterInsertion,
    });
  }

  /**
   * Move a scene back to the unscheduled pool.
   */
  moveSceneToUnscheduled(sceneId: string, sourceDayId: string): void {
    const schedule = this.schedule;
    if (!schedule) return;

    let movedScene: ScheduleScene | null = null;

    const newDays = schedule.shootDays.map(day => {
      if (day.id !== sourceDayId) return day;

      const idx = day.scenes.findIndex(s => s.id === sceneId);
      if (idx === -1) return day;

      movedScene = { ...day.scenes[idx] };
      const newScenes = [...day.scenes];
      newScenes.splice(idx, 1);
      const reorderedScenes = newScenes.map((s, i) => ({ ...s, orderInDay: i }));

      return {
        ...day,
        scenes: reorderedScenes,
        estimatedPageCount: reorderedScenes.reduce((sum, s) => sum + s.pageCount, 0),
        estimatedTotalTime: reorderedScenes.reduce((sum, s) => sum + s.estimatedTimeInFifteenMin, 0),
      };
    });

    if (!movedScene) return;

    // Clear scheduling metadata
    (movedScene as ScheduleScene).shootDayId = undefined;
    (movedScene as ScheduleScene).orderInDay = undefined;

    this.updateSchedule({
      ...schedule,
      shootDays: newDays,
      unscheduledScenes: [...schedule.unscheduledScenes, movedScene],
    });
  }

  // ─────────────────────────────────────────────
  // Shoot Day Management
  // ─────────────────────────────────────────────

  addShootDay(day: ShootDay): void {
    const schedule = this.schedule;
    if (!schedule) return;

    this.updateSchedule({
      ...schedule,
      shootDays: [...schedule.shootDays, day],
    });
  }

  removeShootDay(dayId: string): void {
    const schedule = this.schedule;
    if (!schedule) return;

    const dayToRemove = schedule.shootDays.find(d => d.id === dayId);
    if (!dayToRemove) return;

    // Move all scenes back to unscheduled
    const scenesToUnschedule = dayToRemove.scenes.map(s => ({
      ...s,
      shootDayId: undefined,
      orderInDay: undefined,
    }));

    this.updateSchedule({
      ...schedule,
      shootDays: schedule.shootDays.filter(d => d.id !== dayId),
      unscheduledScenes: [...schedule.unscheduledScenes, ...scenesToUnschedule],
    });
  }

  // ─────────────────────────────────────────────
  // Save State Management
  // ─────────────────────────────────────────────

  setSaving(saving: boolean): void {
    this.isSavingSubject.next(saving);
  }

  markSaved(): void {
    this.isDirtySubject.next(false);
    this.isSavingSubject.next(false);
    this.lastSavedAtSubject.next(new Date().toISOString());
  }

  markDirty(): void {
    this.isDirtySubject.next(true);
  }
}
