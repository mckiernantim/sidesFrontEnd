import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';

/**
 * OneLinerEditorComponent — Inline editor for scene one-liners
 *
 * Reads one-liner data from the ScheduleScene input.
 * Emits changes upward so parent components can sync to ScheduleStateService.
 *
 * Features:
 * - Display one-liner text (or placeholder "Add a one-liner description...")
 * - Click to enter edit mode (text input, max 100 chars)
 * - Save on blur or Enter key
 * - Cancel on Escape key
 * - Source indicator: 🤖 AI vs ✏️ manual
 * - Truncate long one-liners with ellipsis in display mode
 *
 * Usage:
 * <app-one-liner-editor
 *   [oneLiner]="scene.oneLiner"
 *   [oneLinerSource]="scene.oneLinerSource"
 *   [editable]="true"
 *   (oneLinerChanged)="handleChange($event)">
 * </app-one-liner-editor>
 */
@Component({
  selector: 'app-one-liner-editor',
  templateUrl: './one-liner-editor.component.html',
  styleUrls: ['./one-liner-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.Default,
  standalone: false,
})
export class OneLinerEditorComponent {
  @Input() oneLiner: string = '';
  @Input() oneLinerSource: 'ai' | 'manual' = 'manual';
  @Input() editable: boolean = true;
  @Input() compact: boolean = false;

  @Output() oneLinerChanged = new EventEmitter<{ text: string; source: 'manual' }>();

  // Component state
  isEditing: boolean = false;
  editValue: string = '';

  /**
   * Enter edit mode — populate the input with the current one-liner text.
   */
  enterEditMode(): void {
    if (!this.editable) return;
    this.isEditing = true;
    this.editValue = this.oneLiner || '';
  }

  /**
   * Exit edit mode without saving.
   */
  cancelEdit(): void {
    this.isEditing = false;
    this.editValue = '';
  }

  /**
   * Save the edited one-liner. Emits the change event for parents to persist.
   */
  saveOneLiner(): void {
    if (!this.isEditing) return;

    const trimmedValue = this.editValue.trim();

    // Only emit if the value actually changed
    if (trimmedValue !== (this.oneLiner || '')) {
      this.oneLinerChanged.emit({ text: trimmedValue, source: 'manual' });
    }

    this.isEditing = false;
    this.editValue = '';
  }

  /**
   * Handle Enter key (save) and Escape key (cancel) in the text input.
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.saveOneLiner();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelEdit();
    }
  }

  /**
   * Handle blur event — auto-save on focus loss.
   */
  onBlur(): void {
    this.saveOneLiner();
  }

  /**
   * Source indicator icon: 🤖 AI-generated, ✏️ manual, empty if no one-liner.
   */
  get indicatorIcon(): string {
    if (this.oneLiner && this.oneLinerSource === 'ai') return '🤖';
    if (this.oneLiner && this.oneLinerSource === 'manual') return '✏️';
    return '';
  }

  /**
   * Tooltip for the source indicator.
   */
  get indicatorTooltip(): string {
    if (this.oneLiner && this.oneLinerSource === 'ai') return 'AI-generated one-liner';
    if (this.oneLiner && this.oneLinerSource === 'manual') return 'Manually edited';
    return '';
  }

  /**
   * Placeholder text for the input field.
   */
  get placeholderText(): string {
    if (this.isEditing) return 'Enter one-liner (max 100 chars)';
    return 'Add a one-liner description...';
  }

  /**
   * Whether the current edit value exceeds the 100-character limit.
   */
  get isOverLimit(): boolean {
    return this.editValue.length > 100;
  }

  /**
   * Character count display (e.g. "42/100").
   */
  get charCount(): string {
    return `${this.editValue.length}/100`;
  }
}
