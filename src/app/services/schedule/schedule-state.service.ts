import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ProductionSchedule, ShootDay, ScheduleScene } from '../../types/Schedule';
import { SceneSortMode, sortScheduleScenes } from '../../utils/schedule-scene-sort';
import { buildDayTitleFromScenes, locationsInShootOrder } from '../../utils/shoot-day-title';
import { parseSceneHeader } from '../../utils/parseSceneHeader';

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
  // Day Title Helpers (spec 031)
  // ─────────────────────────────────────────────

  /**
   * Returns a copy of `day` with `label`, `primaryLocation`, and
   * `secondaryLocations` re-derived from its current scene order
   * (spec 031 FR-004/FR-005). Callers apply this to any day whose
   * `scenes` array changed (move, sort, remove) so the auto title
   * stays the source of truth for both display and persisted export
   * fields.
   */
  private refreshDayTitle(day: ShootDay): ShootDay {
    const locations = locationsInShootOrder(day.scenes);
    return {
      ...day,
      label: buildDayTitleFromScenes(day.scenes, day.dayNumber),
      primaryLocation: locations[0] ?? '',
      secondaryLocations: locations.slice(1),
    };
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
      return this.refreshDayTitle({
        ...day,
        scenes: reorderedScenes,
        estimatedPageCount: reorderedScenes.reduce((sum, s) => sum + s.pageCount, 0),
        estimatedTotalTime: reorderedScenes.reduce((sum, s) => sum + s.estimatedTimeInFifteenMin, 0),
      });
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

      return this.refreshDayTitle({
        ...day,
        scenes: reorderedScenes,
        estimatedPageCount: reorderedScenes.reduce((sum, s) => sum + s.pageCount, 0),
        estimatedTotalTime: reorderedScenes.reduce((sum, s) => sum + s.estimatedTimeInFifteenMin, 0),
      });
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

      return this.refreshDayTitle({
        ...day,
        scenes: reorderedScenes,
        estimatedPageCount: reorderedScenes.reduce((sum, s) => sum + s.pageCount, 0),
        estimatedTotalTime: reorderedScenes.reduce((sum, s) => sum + s.estimatedTimeInFifteenMin, 0),
      });
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

      return this.refreshDayTitle({
        ...day,
        scenes: reorderedScenes,
        estimatedPageCount: reorderedScenes.reduce((sum, s) => sum + s.pageCount, 0),
        estimatedTotalTime: reorderedScenes.reduce((sum, s) => sum + s.estimatedTimeInFifteenMin, 0),
      });
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
  // Scene Sort Operations (spec 030)
  // ─────────────────────────────────────────────

  /**
   * Sorts the unscheduled scene pool by the given mode. No-op when the
   * pool is empty or there is no schedule loaded (spec 030 edge cases).
   */
  sortUnscheduledScenes(mode: SceneSortMode): void {
    const schedule = this.schedule;
    if (!schedule || schedule.unscheduledScenes.length === 0) return;

    this.updateSchedule({
      ...schedule,
      unscheduledScenes: sortScheduleScenes(schedule.unscheduledScenes, mode),
    });
  }

  /**
   * Sorts the scenes within a single shoot day by the given mode.
   * Reindexes `orderInDay` to match the new order. Never moves scenes
   * to another day or the unscheduled pool. No-op for an empty/missing
   * day or when there is no schedule loaded.
   */
  sortShootDay(dayId: string, mode: SceneSortMode): void {
    const schedule = this.schedule;
    if (!schedule) return;

    const day = schedule.shootDays.find((d) => d.id === dayId);
    if (!day || day.scenes.length === 0) return;

    const sortedScenes = sortScheduleScenes(day.scenes, mode).map((scene, index) => ({
      ...scene,
      orderInDay: index,
    }));

    this.updateSchedule({
      ...schedule,
      shootDays: schedule.shootDays.map((d) =>
        d.id === dayId ? this.refreshDayTitle({ ...d, scenes: sortedScenes }) : d
      ),
    });
  }

  /**
   * Applies the given sort mode to every shoot day independently.
   * Scenes never move between days (spec 030 D4). No-op when there
   * are no shoot days or no schedule loaded.
   */
  sortAllShootDays(mode: SceneSortMode): void {
    const schedule = this.schedule;
    if (!schedule || schedule.shootDays.length === 0) return;

    this.updateSchedule({
      ...schedule,
      shootDays: schedule.shootDays.map((day) => {
        if (day.scenes.length === 0) return day;
        const sortedScenes = sortScheduleScenes(day.scenes, mode).map((scene, index) => ({
          ...scene,
          orderInDay: index,
        }));
        return this.refreshDayTitle({ ...day, scenes: sortedScenes });
      }),
    });
  }

  // ─────────────────────────────────────────────
  // Schedule Settings (spec 031)
  // ─────────────────────────────────────────────

  /**
   * Show/hide per-scene character & actor chrome across the schedule
   * builder (spec 031 FR-001). Persists via the existing settings field
   * on `ProductionSchedule`, so it flows through the normal dirty/auto-save
   * path — no separate storage.
   */
  setShowSceneCast(value: boolean): void {
    const schedule = this.schedule;
    if (!schedule) return;

    this.updateSchedule({
      ...schedule,
      settings: { ...schedule.settings, showSceneCast: value },
    });
  }

  // ─────────────────────────────────────────────
  // One-Liner Management
  // ─────────────────────────────────────────────

  /**
   * Update a scene's one-liner text and metadata.
   * Searches both shootDays and unscheduledScenes.
   * Marks schedule dirty → triggers auto-save.
   */
  updateSceneOneLiner(
    sceneId: string,
    text: string,
    source: 'manual' | 'ai'
  ): void {
    const schedule = this.schedule;
    if (!schedule) return;

    const updater = (scene: ScheduleScene): ScheduleScene => {
      if (scene.id !== sceneId) return scene;
      return {
        ...scene,
        oneLiner: text,
        oneLinerSource: source,
        oneLinerEdited: source === 'manual',
      };
    };

    this.updateSchedule({
      ...schedule,
      shootDays: schedule.shootDays.map(day => ({
        ...day,
        scenes: day.scenes.map(updater),
      })),
      unscheduledScenes: schedule.unscheduledScenes.map(updater),
    });
  }

  // ─────────────────────────────────────────────
  // Scene Header Editing (spec 032)
  // ─────────────────────────────────────────────

  /**
   * Update a scene's header text (spec 032 US2/FR-002/FR-003).
   * Searches both shootDays and unscheduledScenes. Re-runs `parseSceneHeader`
   * on the new text — the same helper `ScheduleService.buildScheduleScenes`
   * uses when a schedule is first seeded — to keep `intExt`, `location`,
   * `timeOfDay`, `isOmitted`, `needsNight`, and `stripColor` derived from the
   * header rather than stale. Refreshes the affected day's auto-title
   * (FR-005) since the location may have changed. Marks the schedule dirty
   * → triggers auto-save.
   *
   * Does NOT touch live scan/classify data (`PdfService.allLines`/`scenes`)
   * — that sync is the caller's responsibility (ScheduleBuilderComponent),
   * since this service has no knowledge of the hydrated PdfService.
   *
   * No-ops (does not update or mark dirty) when `newText` trims to empty —
   * per spec edge case, an empty header reverts to the previous value.
   */
  updateSceneHeader(sceneId: string, newText: string): void {
    const schedule = this.schedule;
    if (!schedule) return;

    const trimmed = (newText || '').trim();
    if (!trimmed) return;

    const parsed = parseSceneHeader(trimmed);

    const updater = (scene: ScheduleScene): ScheduleScene => {
      if (scene.id !== sceneId) return scene;
      return {
        ...scene,
        sceneHeader: trimmed,
        intExt: parsed.intExt,
        location: parsed.location,
        timeOfDay: parsed.timeOfDay,
        isOmitted: parsed.isOmitted,
        needsNight: parsed.needsNight,
        stripColor: parsed.stripColor,
      };
    };

    const updatedUnscheduled = schedule.unscheduledScenes.map(updater);
    const updatedDays = schedule.shootDays.map((day) => {
      const idx = day.scenes.findIndex((s) => s.id === sceneId);
      if (idx === -1) return day;
      return this.refreshDayTitle({ ...day, scenes: day.scenes.map(updater) });
    });

    this.updateSchedule({
      ...schedule,
      unscheduledScenes: updatedUnscheduled,
      shootDays: updatedDays,
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

  /**
   * Sync the local schedule version with the backend version.
   * Call this after a successful save to prevent version drift
   * between the client and server.
   */
  syncVersion(backendVersion: number): void {
    const schedule = this.schedule;
    if (!schedule) return;

    // Only sync if the backend version is different from local
    if (schedule.version !== backendVersion) {
      this.scheduleSubject.next({
        ...schedule,
        version: backendVersion,
      });
      // Don't mark dirty — this is a metadata sync, not a user change
    }
  }
}
