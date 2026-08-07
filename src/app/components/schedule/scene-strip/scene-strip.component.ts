import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CastMember, ScheduleScene, formatFifteenMinIncrements } from '../../../types/Schedule';

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

  /**
   * Show/hide per-scene character (and linked actor) chrome — spec 031
   * FR-001–FR-003. Defaults to `true` so existing callers that don't pass
   * this input keep today's behavior.
   */
  @Input() showCast: boolean = true;

  /**
   * The schedule's cast roster, used to resolve `SceneCharacter.castMemberId`
   * to a linked `CastMember.actorName` (spec 031 FR-002 / research D2).
   */
  @Input() castMembers: CastMember[] = [];

  @Output() sceneClicked = new EventEmitter<ScheduleScene>();
  @Output() removeScene = new EventEmitter<ScheduleScene>();
  @Output() timeChanged = new EventEmitter<{ scene: ScheduleScene; newTime: number }>();
  @Output() oneLinerChanged = new EventEmitter<{
    sceneId: string;
    text: string;
    source: 'manual';
  }>();

  /**
   * Bubbles a Cast Show/Hide click from this scene's one-liner row up to
   * the schedule builder, which calls `setCastVisibility()` against the
   * same global `settings.showSceneCast` used by the day/unscheduled
   * toggles (spec 032 US1 / FR-001) — this is not a per-scene override.
   */
  @Output() castVisibilityChange = new EventEmitter<boolean>();

  /**
   * Emitted when an inline scene header edit is saved (spec 032 US2 /
   * FR-002). Carries the trimmed new header text; the parent is
   * responsible for updating the schedule scene and syncing live scan data.
   */
  @Output() headerChanged = new EventEmitter<{ sceneId: string; sceneHeader: string }>();

  // ─────────────────────────────────────────────
  // Inline Scene Header Editing (spec 032 US2)
  // ─────────────────────────────────────────────
  isEditingHeader: boolean = false;
  editHeaderValue: string = '';

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
   * Resolves a character's linked actor name via `castMemberId`, if any
   * (spec 031 research D2). Returns undefined when there's no link or no
   * matching cast member with an `actorName`.
   */
  private resolveActorName(castMemberId: string | undefined): string | undefined {
    if (!castMemberId || !this.castMembers?.length) return undefined;
    return this.castMembers.find(cm => cm.id === castMemberId)?.actorName || undefined;
  }

  /**
   * Character names for this scene, each suffixed with a linked actor
   * name when available (e.g. "ALICE (Jane Doe)"). Empty array when
   * `showCast` is off (spec 031 FR-003).
   */
  get characterDisplayEntries(): string[] {
    if (!this.showCast || !this.scene?.characters?.length) return [];
    return this.scene.characters.map(c => {
      const actor = this.resolveActorName(c.castMemberId);
      return actor ? `${c.characterName} (${actor})` : c.characterName;
    });
  }

  /**
   * Comma-joined character (+ linked actor) names for display.
   * Shows up to 4 entries; appends "+N more" when there are extras.
   * Empty string when `showCast` is off, hiding this chrome entirely.
   */
  get characterNames(): string {
    const names = this.characterDisplayEntries;
    if (!names.length) return '';
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

  /**
   * Emits the Cast Show/Hide click for this row (spec 032 US1).
   * `event` is optional so tests/callers can invoke this without a real
   * DOM event; when present it's stopped so the click doesn't also select
   * the scene (mirrors `onRemoveClick`).
   */
  onCastVisibilityChange(show: boolean, event?: MouseEvent): void {
    event?.stopPropagation();
    this.castVisibilityChange.emit(show);
  }

  /**
   * Enter inline header edit mode (spec 032 US2). No-ops when not
   * editable. `event` is optional so tests can call this directly.
   */
  enterHeaderEdit(event?: MouseEvent): void {
    event?.stopPropagation();
    if (!this.editable || !this.scene) return;
    this.isEditingHeader = true;
    this.editHeaderValue = this.scene.sceneHeader || this.scene.location || '';
  }

  /**
   * Save the edited header. Emits `headerChanged` only when the trimmed
   * value is non-empty and actually changed — an empty trimmed value
   * reverts to the previous header per spec edge case.
   */
  saveHeaderEdit(): void {
    if (!this.isEditingHeader || !this.scene) {
      this.isEditingHeader = false;
      return;
    }

    const trimmed = this.editHeaderValue.trim();
    const current = this.scene.sceneHeader || '';

    if (trimmed && trimmed !== current) {
      this.headerChanged.emit({ sceneId: this.scene.id, sceneHeader: trimmed });
    }

    this.isEditingHeader = false;
    this.editHeaderValue = '';
  }

  /**
   * Discard the in-progress header edit without emitting.
   */
  cancelHeaderEdit(): void {
    this.isEditingHeader = false;
    this.editHeaderValue = '';
  }

  /**
   * Enter key saves, Escape key cancels — mirrors OneLinerEditorComponent.
   */
  onHeaderKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.saveHeaderEdit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelHeaderEdit();
    }
  }

  /**
   * Auto-save on focus loss — mirrors OneLinerEditorComponent.
   */
  onHeaderBlur(): void {
    this.saveHeaderEdit();
  }
}
