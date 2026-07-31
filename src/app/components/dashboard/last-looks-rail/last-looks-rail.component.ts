import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
} from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-last-looks-rail',
  templateUrl: './last-looks-rail.component.html',
  styleUrls: ['./last-looks-rail.component.css'],
  standalone: false,
})
export class LastLooksRailComponent {
  constructor(private cdRef: ChangeDetectorRef) {}

  @Input() scriptName: string = '';
  @Input() scriptDate: number | null = null;
  @Input() selectedScenes: any[] = [];
  @Input() userData: any = null;
  @Input() isCheckingSubscription: boolean = false;
  @Input() callsheetReady: boolean = false;
  @Input() callSheetPath: string = '';
  @Input() watermark: string = '';
  @Input() hasWatermark: boolean = false;
  @Input() callsheetState: boolean = false;
  @Input() callsheet: string = '';
  @Input() editState: boolean = false;
  @Input() isCollapsed: boolean = false;

  @Output() sceneReorder = new EventEmitter<CdkDragDrop<any[]>>();
  @Output() sceneRemove = new EventEmitter<any>();
  @Output() sceneNumberEdit = new EventEmitter<{ scene: any; event: FocusEvent }>();
  @Output() sceneTextEdit = new EventEmitter<{ scene: any; event: FocusEvent }>();
  @Output() getSides = new EventEmitter<void>();
  @Output() signIn = new EventEmitter<void>();
  @Output() backToScenes = new EventEmitter<void>();
  @Output() toggleRail = new EventEmitter<void>();
  @Output() callsheetUpload = new EventEmitter<any>();
  @Output() watermarkUpdate = new EventEmitter<any>();
  @Output() watermarkRemove = new EventEmitter<void>();

  /** Local editing state for contenteditable fields — display only, not business logic. */
  editingSceneNumber: string | null = null;
  editingSceneText: string | null = null;
  private originalSceneNumber: string | null = null;
  private originalSceneText: string | null = null;

  get sceneCount(): number {
    return this.selectedScenes?.length ?? 0;
  }

  get verticalLabel(): string {
    return `Scenes · ${this.sceneCount}`;
  }

  /** Filename portion of the callsheet storage path, for display in the status row. */
  get callsheetLabel(): string {
    if (!this.callsheet) return '';
    const withoutQuery = this.callsheet.split('?')[0];
    return decodeURIComponent(withoutQuery.split('/').pop() || withoutQuery);
  }

  onSceneDrop(event: CdkDragDrop<any[]>): void {
    this.sceneReorder.emit(event);
  }

  onRemoveScene(scene: any): void {
    this.sceneRemove.emit(scene);
  }

  startEditingSceneNumber(scene: any): void {
    if (!this.editState || scene.category !== 'scene-header') return;
    this.editingSceneNumber = scene.sceneNumberText;
    this.originalSceneNumber = scene.sceneNumberText;
  }

  handleSceneNumberKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      (event.target as HTMLElement).blur();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelSceneNumberEdit(event.target as HTMLElement);
    }
  }

  private cancelSceneNumberEdit(el: HTMLElement): void {
    if (el && this.originalSceneNumber !== null) {
      el.textContent = this.originalSceneNumber;
    }
    this.editingSceneNumber = null;
    this.originalSceneNumber = null;
  }

  onSceneNumberBlur(scene: any, event: FocusEvent): void {
    this.sceneNumberEdit.emit({ scene, event });
    this.editingSceneNumber = null;
  }

  startEditingSceneText(scene: any): void {
    if (!this.editState) return;
    this.editingSceneText = scene.text;
    this.originalSceneText = scene.text;
  }

  handleSceneTextKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      (event.target as HTMLElement).blur();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelSceneTextEdit(event.target as HTMLElement);
    }
  }

  private cancelSceneTextEdit(el: HTMLElement): void {
    if (el && this.originalSceneText !== null) {
      el.textContent = this.originalSceneText;
    }
    this.editingSceneText = null;
    this.originalSceneText = null;
  }

  onSceneTextBlur(scene: any, event: FocusEvent): void {
    this.sceneTextEdit.emit({ scene, event });
    this.editingSceneText = null;
  }

  trackBySceneIndex(_index: number, scene: any): number {
    return scene.docPageIndex;
  }
}
