import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subscription } from 'rxjs';
import { ProductionSchedule, CastMember, CastCategory, ScheduleScene } from '../../../types/Schedule';
import { ScheduleStateService } from '../../../services/schedule/schedule-state.service';

/**
 * CastManagerComponent — The "casting director pane" for managing cast members.
 *
 * Features:
 * - Auto-populates cast list from classify `allChars` output
 * - Editable actor name field per character
 * - Drag-and-drop to reorder cast numbers
 * - Category selector dropdown per character
 * - Display scene count per character
 * - Display total page count per character
 * - Persist changes to the schedule data
 *
 * Spec: 008-production-scheduling/spec.md (Task P4-T05)
 */
@Component({
  selector: 'app-cast-manager',
  templateUrl: './cast-manager.component.html',
  styleUrls: ['./cast-manager.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class CastManagerComponent implements OnInit, OnDestroy {
  castMembers: CastMember[] = [];
  schedule: ProductionSchedule | null = null;

  // Available cast categories for dropdown
  readonly castCategories: CastCategory[] = [
    'principal',
    'day-player',
    'recurring',
    'stunt',
    'background',
    'voice-only',
  ];

  private subscriptions: Subscription[] = [];

  constructor(
    private scheduleState: ScheduleStateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to schedule changes
    this.subscriptions.push(
      this.scheduleState.schedule$.subscribe((schedule) => {
        this.schedule = schedule;
        if (schedule) {
          // Create a mutable copy for drag-drop
          this.castMembers = [...schedule.castMembers];
        } else {
          this.castMembers = [];
        }
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  // ─────────────────────────────────────────────
  // Drag-and-Drop Handler
  // ─────────────────────────────────────────────

  /**
   * Handles drag-and-drop reordering of cast members.
   * Updates cast numbers to match the new order.
   */
  onCastDrop(event: CdkDragDrop<CastMember[]>): void {
    if (!this.schedule) return;

    // Reorder the array
    moveItemInArray(this.castMembers, event.previousIndex, event.currentIndex);

    // Update cast numbers to match the new order
    const updatedCastMembers = this.castMembers.map((member, index) => ({
      ...member,
      castNumber: index + 1,
    }));

    // Persist to schedule state
    this.updateScheduleCastMembers(updatedCastMembers);
  }

  // ─────────────────────────────────────────────
  // Actor Name Editing
  // ─────────────────────────────────────────────

  /**
   * Updates the actor name for a cast member.
   */
  updateActorName(castMemberId: string, actorName: string): void {
    if (!this.schedule) return;

    const updatedCastMembers = this.castMembers.map((member) =>
      member.id === castMemberId
        ? { ...member, actorName: actorName.trim() || undefined }
        : member
    );

    this.updateScheduleCastMembers(updatedCastMembers);
  }

  // ─────────────────────────────────────────────
  // Category Selection
  // ─────────────────────────────────────────────

  /**
   * Updates the category for a cast member.
   */
  updateCategory(castMemberId: string, category: CastCategory): void {
    if (!this.schedule) return;

    const updatedCastMembers = this.castMembers.map((member) =>
      member.id === castMemberId ? { ...member, category } : member
    );

    this.updateScheduleCastMembers(updatedCastMembers);
  }

  // ─────────────────────────────────────────────
  // Calculated Displays
  // ─────────────────────────────────────────────

  /**
   * Gets the scene count for a cast member.
   */
  getSceneCount(castMember: CastMember): number {
    return castMember.totalScenes;
  }

  /**
   * Gets the total page count for a cast member.
   */
  getPageCount(castMember: CastMember): number {
    return castMember.totalPageCount;
  }

  /**
   * Formats page count to 1 decimal place.
   */
  formatPageCount(pageCount: number): string {
    return pageCount.toFixed(1);
  }

  /**
   * TrackBy function for ngFor performance optimization.
   */
  trackByCastMemberId(index: number, member: CastMember): string {
    return member.id;
  }

  /**
   * Returns a human-readable label for a cast category.
   */
  getCategoryLabel(category: CastCategory): string {
    switch (category) {
      case 'principal':
        return 'Principal';
      case 'day-player':
        return 'Day Player';
      case 'recurring':
        return 'Recurring';
      case 'stunt':
        return 'Stunt';
      case 'background':
        return 'Background';
      case 'voice-only':
        return 'Voice Only';
      default:
        return category;
    }
  }

  // ─────────────────────────────────────────────
  // Private Helpers
  // ─────────────────────────────────────────────

  /**
   * Updates the schedule with new cast members and marks it as dirty.
   * Recalculates scene and page counts from the schedule's scenes.
   */
  private updateScheduleCastMembers(updatedCastMembers: CastMember[]): void {
    if (!this.schedule) return;

    // Recalculate scene and page counts from all scenes
    const recalculatedCastMembers = this.recalculateCastStats(
      updatedCastMembers,
      this.schedule
    );

    // Update the schedule and mark as dirty
    this.scheduleState.updateSchedule({
      ...this.schedule,
      castMembers: recalculatedCastMembers,
    });

    // Update local copy for UI
    this.castMembers = [...recalculatedCastMembers];
    this.cdr.markForCheck();
  }

  /**
   * Recalculates scene and page counts for all cast members based on
   * the current schedule scenes.
   */
  private recalculateCastStats(
    castMembers: CastMember[],
    schedule: ProductionSchedule
  ): CastMember[] {
    // Collect all scenes from the schedule
    const allScenes: ScheduleScene[] = [
      ...schedule.unscheduledScenes,
      ...schedule.shootDays.flatMap((day) => day.scenes),
    ];

    return castMembers.map((member) => {
      // Find all scenes this character appears in
      const sceneNumbers: string[] = [];
      let totalPageCount = 0;

      for (const scene of allScenes) {
        const hasCharacter = scene.characters.some(
          (c) => c.characterName === member.characterName
        );
        if (hasCharacter) {
          sceneNumbers.push(scene.sceneNumber);
          totalPageCount += scene.pageCount;
        }
      }

      return {
        ...member,
        sceneNumbers,
        totalScenes: sceneNumbers.length,
        totalPageCount: Math.round(totalPageCount * 100) / 100,
      };
    });
  }
}
