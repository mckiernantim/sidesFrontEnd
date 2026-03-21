import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ScheduleScene, formatFifteenMinIncrements } from '../../../types/Schedule';

/**
 * SceneStripComponent — Displays a single scene in two visual modes:
 *
 * CARD mode (showTimeline=false — unscheduled pool):
 * - Tall, readable vertical card
 * - Full scene header text (wraps, never truncated)
 * - Character names listed out
 * - Page count + flags
 * - One-liner editor
 *
 * STRIP mode (showTimeline=true — inside a shoot day):
 * - Compact horizontal row
 * - Scene header truncated to fit
 * - Timeline +/− controls visible
 *
 * The component is designed to work with Angular CDK drag-drop.
 */
@Component({
  selector: 'app-scene-strip',
  templateUrl: './scene-strip.component.html',
  styleUrls: ['./scene-strip.component.css'],
  changeDetection: ChangeDetectionStrategy.Default,
  standalone: false,
})
export class SceneStripComponent {
  @Input() scene!: ScheduleScene;
  @Input() compact: boolean = false;
  @Input() showTimeline: boolean = true;
  @Input() editable: boolean = false;
  @Input() showOneLiner: boolean = true;

  @Output() sceneClicked = new EventEmitter<ScheduleScene>();
  @Output() removeScene = new EventEmitter<ScheduleScene>();
  @Output() timeChanged = new EventEmitter<{ scene: ScheduleScene; newTime: number }>();
  @Output() oneLinerChanged = new EventEmitter<{
    sceneId: string;
    text: string;
    source: 'manual';
  }>();

  /**
   * Returns the formatted estimated time string.
   */
  get formattedTime(): string {
    return formatFifteenMinIncrements(this.scene?.estimatedTimeInFifteenMin || 0);
  }

  /**
   * Returns the page count as a displayable string (e.g. "2 4/8").
   */
  get formattedPageCount(): string {
    if (!this.scene) return '0';
    const pageCount = this.scene.pageCount;
    const wholePages = Math.floor(pageCount);
    const eighths = Math.round((pageCount - wholePages) * 8);

    if (eighths === 0) return `${wholePages}`;
    if (wholePages === 0) return `${eighths}/8`;
    return `${wholePages} ${eighths}/8`;
  }

  /**
   * Returns a short badge label for INT/EXT.
   */
  get intExtBadge(): string {
    if (!this.scene) return '';
    switch (this.scene.intExt) {
      case 'INT': return 'INT';
      case 'EXT': return 'EXT';
      case 'INT/EXT': return 'I/E';
      default: return '';
    }
  }

  /**
   * CSS classes for the INT/EXT badge — dark-theme safe colours.
   */
  get intExtBadgeClass(): string {
    if (!this.scene) return '';
    switch (this.scene.intExt) {
      case 'INT':     return 'bg-blue-900 text-blue-200 border border-blue-700';
      case 'EXT':     return 'bg-emerald-900 text-emerald-200 border border-emerald-700';
      case 'INT/EXT': return 'bg-violet-900 text-violet-200 border border-violet-700';
      default:        return 'bg-sw-surface-2 text-sw-text-muted border border-sw-border';
    }
  }

  /**
   * Whether we're rendering as a pool card (not inside a shoot day).
   * Used to switch between the tall card layout and the compact strip layout.
   */
  get isCard(): boolean {
    return !this.showTimeline;
  }

  /**
   * Comma-joined character names for the card view.
   * Shows up to 4 names; appends "+N more" when there are extras.
   */
  get characterNames(): string {
    if (!this.scene?.characters?.length) return '';
    const names = this.scene.characters.map(c => c.characterName);
    if (names.length <= 4) return names.join(', ');
    const shown = names.slice(0, 4);
    const extra = names.length - 4;
    return `${shown.join(', ')} +${extra} more`;
  }

  /**
   * Whether to show the one-liner row below the scene strip.
   * Hidden when compact mode is on or showOneLiner is false.
   */
  get shouldShowOneLiner(): boolean {
    return this.showOneLiner && !this.compact;
  }

  onStripClick(): void {
    this.sceneClicked.emit(this.scene);
  }

  onRemoveClick(event: MouseEvent): void {
    event.stopPropagation();
    this.removeScene.emit(this.scene);
  }

  /**
   * Increment estimated time by one 15-minute block.
   */
  incrementTime(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.editable || !this.scene) return;
    const newTime = this.scene.estimatedTimeInFifteenMin + 1;
    this.timeChanged.emit({ scene: this.scene, newTime });
  }

  /**
   * Decrement estimated time by one 15-minute block (minimum 1).
   */
  decrementTime(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.editable || !this.scene) return;
    const newTime = Math.max(1, this.scene.estimatedTimeInFifteenMin - 1);
    this.timeChanged.emit({ scene: this.scene, newTime });
  }

  /**
   * Handle one-liner change from the embedded OneLinerEditorComponent.
   * Propagates upward with the scene ID attached.
   */
  onOneLinerChanged(event: { text: string; source: 'manual' }): void {
    if (!this.scene) return;
    this.oneLinerChanged.emit({
      sceneId: this.scene.id,
      text: event.text,
      source: event.source,
    });
  }
}
