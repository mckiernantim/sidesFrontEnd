import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { Router } from '@angular/router';
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
import { OneLinerService, SceneForOneLiner } from '../../../services/schedule/one-liner.service';
import { ScheduleToSidesService } from '../../../services/schedule/schedule-to-sides.service';
import { PdfService } from '../../../services/pdf/pdf.service';
import { isLegacyProjectId } from '../../../utils/legacyProjectId';
import { Project } from '../../../types/Project';
import { SceneSortMode, SCENE_SORT_MODE_OPTIONS } from '../../../utils/schedule-scene-sort';

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
 *
 * One-Liner Generation:
 * - Requires PDF service to have valid data (allLines and scenes)
 * - If PDF data is not available, one-liner generation is disabled
 */
@Component({
  selector: 'app-schedule-builder',
  templateUrl: './schedule-builder.component.html',
  styleUrls: ['./schedule-builder.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ScheduleBuilderComponent implements OnInit, OnDestroy {
  /** PDF Service - required for AI one-liner generation */
  @Input() pdfService?: PdfService;

  /**
   * The saved project this schedule belongs to (spec 028 US5, T054).
   * Supplied by SchedulePageComponent once resolveLinkedProject() resolves
   * a real (non-legacy) project — undefined for a fresh/legacy schedule,
   * in which case the header falls back to the schedule's own projectTitle.
   */
  @Input() project?: Project;

  schedule: ProductionSchedule | null = null;
  isDirty: boolean = false;
  isSaving: boolean = false;
  lastSavedAt: string | null = null;
  saveError: string | null = null;
  isGeneratingOneLiners: boolean = false;

  // Tab navigation state
  activeTab: 'schedule' | 'cast' = 'schedule';

  private subscriptions: Subscription[] = [];

  // Drop list IDs for CDK drag-drop connectivity
  unscheduledDropListId = 'unscheduled-pool';

  // ─────────────────────────────────────────────
  // Generate Sides (spec 028 US2)
  // ─────────────────────────────────────────────
  generatingSidesForDayId: string | null = null;
  generateSidesError: string | null = null;
  generateSidesErrorDayId: string | null = null;

  // ─────────────────────────────────────────────
  // Scene Sort Controls (spec 030)
  // ─────────────────────────────────────────────
  readonly sortModes = SCENE_SORT_MODE_OPTIONS;
  unscheduledSortMode: SceneSortMode | null = null;
  allDaysSortMode: SceneSortMode | null = null;

  // ─────────────────────────────────────────────
  // Cast Show/Hide Toggle (spec 031)
  // ─────────────────────────────────────────────

  /**
   * Whether per-scene character/actor chrome is shown. Falls back to
   * `true` when `settings.showSceneCast` is `undefined` (schedules
   * persisted before spec 031 existed) — spec 031 FR-001.
   */
  get showSceneCastEnabled(): boolean {
    return this.schedule?.settings?.showSceneCast !== false;
  }

  /**
   * Show/hide per-scene characters & actors (spec 031).
   * Persists via ScheduleStateService dirty/auto-save path.
   */
  setCastVisibility(show: boolean): void {
    this.scheduleState.setShowSceneCast(show);
  }

  /** @deprecated use setCastVisibility — kept for any leftover select handlers */
  onCastVisibilityChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.setCastVisibility(value === 'show');
  }

  // ─────────────────────────────────────────────
  // Editable Scene Headers (spec 032 US2)
  // ─────────────────────────────────────────────

  /**
   * Transient soft notice shown when a header edit saved to the schedule
   * but couldn't sync to live scan data (no hydrated `pdfService` — spec
   * 032 edge case). Cleared automatically after a few seconds.
   */
  headerSyncNotice: string | null = null;
  private headerSyncNoticeTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Handles an inline scene header edit bubbled up from any `app-scene-strip`
   * (in a shoot day or the unscheduled pool).
   *
   * 1. Updates the `ScheduleScene` (header/intExt/location/timeOfDay/
   *    stripColor + day title refresh) via `ScheduleStateService`.
   * 2. Syncs the live scan/classify data (`PdfService.allLines`/`scenes` +
   *    `finalDocument` for Last Looks) via `PdfService.syncSceneHeaderText`,
   *    matched by `sceneNumber` (spec 032 FR-004) — only when a hydrated
   *    `pdfService` is actually available (research: no project GCS
   *    content-update API exists for v1, so session scan + schedule
   *    autosave are the sync targets; this session-only sync is
   *    best-effort and surfaced with a soft notice when unavailable).
   */
  onHeaderChanged(event: { sceneId: string; sceneHeader: string }): void {
    const scene = this.findSceneById(event.sceneId);
    const sceneNumber = scene?.sceneNumber;

    this.scheduleState.updateSceneHeader(event.sceneId, event.sceneHeader);

    if (!this.pdfService) {
      this.showHeaderSyncNotice('Header updated in the schedule — no live script open, so scan data wasn\'t synced.');
      return;
    }

    const synced = sceneNumber ? this.pdfService.syncSceneHeaderText(sceneNumber, event.sceneHeader) : false;
    if (!synced) {
      this.showHeaderSyncNotice('Header updated in the schedule, but scan data wasn\'t available to sync.');
    }
  }

  private showHeaderSyncNotice(message: string): void {
    this.headerSyncNotice = message;
    this.cdr.markForCheck();

    if (this.headerSyncNoticeTimeout) {
      clearTimeout(this.headerSyncNoticeTimeout);
    }
    this.headerSyncNoticeTimeout = setTimeout(() => {
      this.headerSyncNotice = null;
      this.headerSyncNoticeTimeout = null;
      this.cdr.markForCheck();
    }, 5000);
  }

  /** Finds a `ScheduleScene` by id across shoot days and the unscheduled pool. */
  private findSceneById(sceneId: string): ScheduleScene | undefined {
    if (!this.schedule) return undefined;
    return (
      this.schedule.unscheduledScenes.find((s) => s.id === sceneId) ||
      this.schedule.shootDays.flatMap((d) => d.scenes).find((s) => s.id === sceneId)
    );
  }

  constructor(
    private scheduleState: ScheduleStateService,
    private scheduleService: ScheduleService,
    private autoSave: ScheduleAutoSaveService,
    private oneLinerService: OneLinerService,
    private scheduleToSidesService: ScheduleToSidesService,
    private router: Router,
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
    if (this.headerSyncNoticeTimeout) {
      clearTimeout(this.headerSyncNoticeTimeout);
    }
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

  /**
   * Returns the total number of scenes in the schedule.
   */
  get totalScenes(): number {
    if (!this.schedule) return 0;
    return (
      this.schedule.unscheduledScenes.length +
      this.schedule.shootDays.reduce((sum, d) => sum + d.scenes.length, 0)
    );
  }

  // ─────────────────────────────────────────────
  // Header — project/schedule context (spec 028 US5, T053/T054)
  // ─────────────────────────────────────────────

  /**
   * Project name shown in the header. Falls back to the schedule's own
   * `projectTitle` when no live `project` input is supplied — i.e. a
   * legacy/unlinked schedule (SchedulePageComponent only passes `project`
   * once resolveLinkedProject() resolves a real, owned project).
   */
  get projectDisplayName(): string {
    return this.project?.title || this.schedule?.projectTitle || 'Untitled Project';
  }

  /**
   * Schedule name shown alongside the project name. `ProductionSchedule`
   * has no dedicated "name" field distinct from `projectTitle`, so this
   * derives a stable, human-readable label from the schedule's own
   * optimistic-concurrency version counter (mirrors the design mock's
   * "Shooting Schedule v2" placeholder using real schedule data).
   */
  get scheduleDisplayName(): string {
    if (!this.schedule) return '';
    return `Shooting Schedule v${this.schedule.version}`;
  }

  /** Number of shoot days in the schedule. */
  get shootDayCount(): number {
    return this.schedule?.shootDays.length ?? 0;
  }

  /** Total scenes currently placed on any shoot day. */
  get scheduledSceneCount(): number {
    if (!this.schedule) return 0;
    return this.schedule.shootDays.reduce((sum, d) => sum + d.scenes.length, 0);
  }

  /** Scenes not yet assigned to any shoot day. */
  get unscheduledSceneCount(): number {
    return this.schedule?.unscheduledScenes.length ?? 0;
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

  /**
   * Handle one-liner changes from any scene strip (in days or unscheduled pool).
   * Updates the ScheduleScene in ScheduleStateService → triggers auto-save.
   */
  onOneLinerChanged(event: { sceneId: string; text: string; source: 'manual' }): void {
    this.scheduleState.updateSceneOneLiner(event.sceneId, event.text, event.source);
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
  // Scene Sort Controls (spec 030)
  // ─────────────────────────────────────────────

  /** Sorts the unscheduled scene pool immediately (contract: click applies immediately). */
  sortUnscheduled(mode: SceneSortMode): void {
    this.unscheduledSortMode = mode;
    this.scheduleState.sortUnscheduledScenes(mode);
  }

  /** Forwards a per-day sort request emitted by a `app-shoot-day-card`. */
  onDaySortRequested(event: { dayId: string; mode: SceneSortMode }): void {
    this.scheduleState.sortShootDay(event.dayId, event.mode);
  }

  /** Applies the given mode to every shoot day independently (FR-004). */
  sortAllDays(mode: SceneSortMode): void {
    this.allDaysSortMode = mode;
    this.scheduleState.sortAllShootDays(mode);
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

  // ─────────────────────────────────────────────
  // Tab Navigation
  // ─────────────────────────────────────────────

  /**
   * Switches between Schedule and Cast Manager tabs.
   */
  switchTab(tab: 'schedule' | 'cast'): void {
    this.activeTab = tab;
    this.cdr.markForCheck();
  }

  // ─────────────────────────────────────────────
  // One-Liner Generation
  // ─────────────────────────────────────────────

  /**
   * Generate one-liners for scenes in a specific shoot day.
   * Only generates for scenes that have descriptions.
   */
  generateDayOneLiners(dayId: string): void {
    if (!this.schedule || this.isGeneratingOneLiners) return;

    const day = this.schedule.shootDays.find(d => d.id === dayId);
    if (!day || !day.scenes || day.scenes.length === 0) {
      console.warn('No scenes found for day:', dayId);
      return;
    }

    // Filter to only scenes with descriptions
    const scenesWithDescriptions = day.scenes.filter(
      scene => scene.descriptions && scene.descriptions.length > 0
    );

    if (scenesWithDescriptions.length === 0) {
      alert(`No scenes in ${day.label || 'Day ' + day.dayNumber} have descriptions. Please upload your script first.`);
      return;
    }

    // Transform to the format expected by the service
    const dayLabel = day.label || `Day ${day.dayNumber}`;
    const scenesForGeneration: SceneForOneLiner[] = scenesWithDescriptions.map((scene) => ({
      sceneNumber: scene.sceneNumber,
      sceneHeader: scene.sceneHeader,
      sceneText: scene.descriptions || [],
      characters: (scene.characters || []).map((c) => c.characterName),
      pageCount: scene.pageCount,
    }));

    console.log(`Generating one-liners for ${scenesForGeneration.length} scenes in ${dayLabel}`);

    this.isGeneratingOneLiners = true;
    this.cdr.markForCheck();

    this.oneLinerService.generateOneLiners(scenesForGeneration, dayLabel).subscribe({
      next: (oneLiners) => {
        this.isGeneratingOneLiners = false;
        this.cdr.markForCheck();
        console.log(`Generated ${oneLiners.size} one-liners for ${day.label || 'Day ' + day.dayNumber}`);
        alert(`Successfully generated ${oneLiners.size} one-liners for ${day.label || 'Day ' + day.dayNumber}!`);
      },
      error: (err) => {
        this.isGeneratingOneLiners = false;
        this.cdr.markForCheck();
        console.error('Failed to generate one-liners', err);
        alert('Failed to generate one-liners. Please try again.');
      },
    });
  }

  /**
   * Generate one-liners for all scenes in the schedule using AI.
   * Only generates for scenes that have descriptions.
   */
  generateAllOneLiners(): void {
    if (!this.schedule || this.isGeneratingOneLiners) return;

    // Validate that we can generate one-liners
    if (!this.canGenerateOneLiners) {
      console.warn('Cannot generate one-liners:', this.oneLinerDisabledReason);
      alert(this.oneLinerDisabledReason);
      return;
    }

    // Collect all scenes (unscheduled + all shoot days)
    const allScenes: ScheduleScene[] = [
      ...this.schedule.unscheduledScenes,
      ...this.schedule.shootDays.flatMap((day) => day.scenes),
    ];

    if (allScenes.length === 0) {
      console.log('No scenes to generate one-liners for');
      return;
    }

    // Filter to only scenes with descriptions (required for AI generation)
    const scenesWithDescriptions = allScenes.filter(
      scene => scene.descriptions && scene.descriptions.length > 0
    );

    if (scenesWithDescriptions.length === 0) {
      alert('No scenes have descriptions. Please upload your script to enable AI one-liner generation.');
      return;
    }

    // Transform to the format expected by the service
    const scenesForGeneration: SceneForOneLiner[] = scenesWithDescriptions.map((scene) => ({
      sceneNumber: scene.sceneNumber,
      sceneHeader: scene.sceneHeader,
      sceneText: scene.descriptions || [],
      characters: (scene.characters || []).map((c) => c.characterName),
      pageCount: scene.pageCount,
    }));

    console.log(`Generating one-liners for ${scenesForGeneration.length} scenes (out of ${allScenes.length} total)`);

    this.isGeneratingOneLiners = true;
    this.cdr.markForCheck();

    this.oneLinerService.generateOneLiners(scenesForGeneration).subscribe({
      next: (oneLiners) => {
        this.isGeneratingOneLiners = false;
        this.cdr.markForCheck();
        console.log(`Generated ${oneLiners.size} one-liners successfully`);
        alert(`Successfully generated ${oneLiners.size} one-liners for scenes with descriptions.`);
      },
      error: (err) => {
        this.isGeneratingOneLiners = false;
        this.cdr.markForCheck();
        console.error('Failed to generate one-liners', err);
        alert('Failed to generate one-liners. Please try again.');
      },
    });
  }

  /**
   * Checks if one-liner generation is available.
   * Requires schedule to exist and have at least ONE scene with descriptions.
   */
  get canGenerateOneLiners(): boolean {
    if (!this.schedule) return false;

    // Collect all scenes
    const allScenes: ScheduleScene[] = [
      ...this.schedule.unscheduledScenes,
      ...this.schedule.shootDays.flatMap((day) => day.scenes),
    ];

    if (allScenes.length === 0) return false;

    // Check if at least ONE scene has descriptions
    const scenesWithDescriptions = allScenes.filter(
      scene => scene.descriptions && scene.descriptions.length > 0
    );

    return scenesWithDescriptions.length > 0;
  }

  /**
   * Gets the reason why one-liner generation is disabled (for tooltip/message).
   */
  get oneLinerDisabledReason(): string {
    if (!this.schedule) return 'No schedule loaded';

    const allScenes: ScheduleScene[] = [
      ...this.schedule.unscheduledScenes,
      ...this.schedule.shootDays.flatMap((day) => day.scenes),
    ];

    if (allScenes.length === 0) {
      return 'No scenes in schedule';
    }

    const scenesWithDescriptions = allScenes.filter(
      scene => scene.descriptions && scene.descriptions.length > 0
    );

    if (scenesWithDescriptions.length === 0) {
      return 'Please upload your script to enable AI one-liner generation';
    }

    // If we have some scenes with descriptions, show how many
    if (scenesWithDescriptions.length < allScenes.length) {
      return `${scenesWithDescriptions.length} of ${allScenes.length} scenes ready for AI one-liners`;
    }

    return `Generate AI one-liners for ${allScenes.length} scenes`;
  }

  // ─────────────────────────────────────────────
  // Generate Sides (spec 028 US2)
  // ─────────────────────────────────────────────

  /**
   * True when this schedule has no resolvable saved-project link (either no
   * `projectId` at all, or the client-generated `proj-{timestamp}` placeholder
   * stamped before a project existed — research D7, `legacyProjectId.ts`).
   */
  get isLegacySchedule(): boolean {
    return isLegacyProjectId(this.schedule?.projectId);
  }

  /**
   * Per shoot-day-precondition table (contracts/project-library-ui.md):
   * a day needs at least one scene AND a schedule that's linked to a real,
   * saved project before sides can be generated.
   */
  canGenerateSidesForDay(day: ShootDay): boolean {
    if (!day || !day.scenes || day.scenes.length === 0) return false;
    if (this.isLegacySchedule) return false;
    return true;
  }

  generateSidesTooltip(day: ShootDay): string {
    if (!day || !day.scenes || day.scenes.length === 0) {
      return 'No scenes on this day';
    }
    if (this.isLegacySchedule) {
      return "This schedule isn't linked to a saved project — re-upload the script or connect this schedule to a project to generate sides.";
    }
    return `Generate sides for ${day.scenes.length} scene(s) in ${day.label || 'Day ' + day.dayNumber}`;
  }

  /**
   * Delegates entirely to ScheduleToSidesService.generateSidesForDay()
   * (data-model.md's resolution sequence) then, on success, navigates to
   * /dashboard with the one-shot router-state flag DashboardRightComponent
   * reads once to reuse the existing toggleLastLooks() path (research D8) —
   * guaranteeing FR-012 (identical output to a manual dashboard selection).
   */
  generateSidesForDay(day: ShootDay): void {
    if (!this.schedule || !this.canGenerateSidesForDay(day) || this.generatingSidesForDayId) {
      return;
    }

    this.generatingSidesForDayId = day.id;
    this.generateSidesError = null;
    this.generateSidesErrorDayId = null;
    this.cdr.markForCheck();

    this.scheduleToSidesService.generateSidesForDay(day, this.schedule).subscribe({
      next: (result) => {
        this.generatingSidesForDayId = null;
        if (result.success) {
          this.router.navigate(['/dashboard'], { state: { autoOpenLastLooks: true } });
        } else {
          this.generateSidesError = result.errorMessage || 'Could not generate sides for this day.';
          this.generateSidesErrorDayId = day.id;
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.generatingSidesForDayId = null;
        this.generateSidesError = 'Could not generate sides for this day. Please try again.';
        this.generateSidesErrorDayId = day.id;
        this.cdr.markForCheck();
      },
    });
  }
}
