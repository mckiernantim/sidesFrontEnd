import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  ShootDay,
  ScheduleScene,
  formatFifteenMinIncrements,
} from '../../../types/Schedule';
import { CdkDragDrop } from '@angular/cdk/drag-drop';

/**
 * ShootDayCardComponent — Displays a single shooting day as a card
 * in the production schedule. Contains a vertical list of SceneStrip
 * components that can be reordered via drag-and-drop.
 *
 * Shows:
 * - Day number + optional label
 * - Location
 * - Total page count and estimated time
 * - Cast required summary
 * - List of scene strips
 *
 * Supports:
 * - Scene reordering within the day (CDK drag-drop)
 * - Receiving scenes from other days / unscheduled pool
 * - Removing scenes from the day
 */
@Component({
  selector: 'app-shoot-day-card',
  templateUrl: './shoot-day-card.component.html',
  styleUrls: ['./shoot-day-card.component.css'],
  changeDetection: ChangeDetectionStrategy.Default,
  standalone: false,
})
export class ShootDayCardComponent {
  @Input() day!: ShootDay;
  @Input() editable: boolean = false;
  @Input() dropListId: string = '';
  @Input() connectedDropLists: string[] = [];

  @Output() sceneDrop = new EventEmitter<CdkDragDrop<ScheduleScene[]>>();
  @Output() sceneRemoved = new EventEmitter<{ scene: ScheduleScene; dayId: string }>();
  @Output() sceneClicked = new EventEmitter<ScheduleScene>();
  @Output() dayRemoved = new EventEmitter<string>();
  @Output() timeChanged = new EventEmitter<{ scene: ScheduleScene; newTime: number }>();
  @Output() oneLinerChanged = new EventEmitter<{
    sceneId: string;
    text: string;
    source: 'manual';
  }>();
  @Output() generateDayOneLiners = new EventEmitter<string>(); // Emits dayId

  /**
   * Returns the formatted total estimated time for this day.
   */
  get formattedTotalTime(): string {
    return formatFifteenMinIncrements(this.day?.estimatedTotalTime || 0);
  }

  /**
   * Returns the formatted page count for display.
   */
  get formattedPageCount(): string {
    if (!this.day) return '0';
    const pc = this.day.estimatedPageCount;
    const whole = Math.floor(pc);
    const eighths = Math.round((pc - whole) * 8);
    if (eighths === 0) return `${whole}`;
    if (whole === 0) return `${eighths}/8`;
    return `${whole} ${eighths}/8`;
  }

  /**
   * Returns the day header label.
   */
  get dayLabel(): string {
    if (!this.day) return '';
    if (this.day.label) return this.day.label;
    return `Day ${this.day.dayNumber}`;
  }

  /**
   * Returns a short summary of cast required.
   */
  get castSummary(): string {
    if (!this.day || !this.day.castRequired || this.day.castRequired.length === 0) {
      return 'No cast assigned';
    }
    const count = this.day.castRequired.length;
    return `${count} cast member${count !== 1 ? 's' : ''}`;
  }

  onSceneDrop(event: CdkDragDrop<ScheduleScene[]>): void {
    this.sceneDrop.emit(event);
  }

  onSceneRemoved(scene: ScheduleScene): void {
    this.sceneRemoved.emit({ scene, dayId: this.day.id });
  }

  onSceneClicked(scene: ScheduleScene): void {
    this.sceneClicked.emit(scene);
  }

  onRemoveDay(): void {
    this.dayRemoved.emit(this.day.id);
  }

  onTimeChanged(event: { scene: ScheduleScene; newTime: number }): void {
    this.timeChanged.emit(event);
  }

  onOneLinerChanged(event: { sceneId: string; text: string; source: 'manual' }): void {
    this.oneLinerChanged.emit(event);
  }

  onGenerateDayOneLiners(): void {
    this.generateDayOneLiners.emit(this.day.id);
  }

  /**
   * Returns true if this day has at least one scene with descriptions.
   */
  get canGenerateOneLiners(): boolean {
    if (!this.day || !this.day.scenes || this.day.scenes.length === 0) {
      return false;
    }
    return this.day.scenes.some(scene => scene.descriptions && scene.descriptions.length > 0);
  }

  /**
   * Returns the count of scenes ready for one-liner generation.
   */
  get scenesReadyForOneLiners(): number {
    if (!this.day || !this.day.scenes) return 0;
    return this.day.scenes.filter(scene => scene.descriptions && scene.descriptions.length > 0).length;
  }

  trackBySceneId(index: number, scene: ScheduleScene): string {
    return scene.id;
  }
}
