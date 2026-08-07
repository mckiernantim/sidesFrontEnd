import { Component, OnDestroy, OnInit, Input, Output, EventEmitter } from '@angular/core';
import {
  ProjectApiService,
  ProjectApiError,
  SaveSceneRequest,
  SavedSceneSummary,
} from 'src/app/services/project/project-api.service';

@Component({
  selector: 'app-scene-selection',
  templateUrl: './scene-selection.component.html',
  styleUrls: ['./scene-selection.component.css'],
  standalone: false
})
export class SceneSelectionComponent implements OnInit, OnDestroy {
  @Input() scenes: any[] = [];
  @Output() sceneSelected = new EventEmitter<any>();

  /** Title of the script these scenes belong to — stamped as SaveSceneRequest.sourceTitle. */
  @Input() sourceTitle = '';
  /** Save scene is a signed-in-only action (027 US4 T046). */
  @Input() isSignedIn = false;

  /** Fired the moment a save is kicked off, carrying the exact payload sent to the API. */
  @Output() sceneSaveRequested = new EventEmitter<SaveSceneRequest>();
  /** Fired once the API confirms the scene was saved. */
  @Output() sceneSaved = new EventEmitter<SavedSceneSummary>();

  selectedScene: any = null;

  // Table configuration
  tableColumns = [
    { key: 'sceneNumberText', header: 'Scene' },
    { key: 'text', header: 'Location' },
    { key: 'preview', header: 'Preview' },
    { key: 'page', header: 'Page' }
  ];

  pageSize: number = 10;
  selected: any[] = [];

  // ── Save scene toast (mirrors dashboard-right's Save-as-Project pattern) ──
  toastVisible = false;
  toastType: 'success' | 'error' = 'success';
  toastMessage = '';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  private savingSceneKeys = new Set<any>();

  constructor(private projectApi: ProjectApiService) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  selectScene(scene: any): void {
    this.selectedScene = scene;
    this.sceneSelected.emit(scene);
  }

  isSelected(scene: any): boolean {
    return this.selectedScene === scene;
  }

  onRowClick(scene: any): void {
    this.selectScene(scene);
  }

  /** True when the signed-in gate allows the "Save scene" action to run. */
  get canSaveScene(): boolean {
    return this.isSignedIn;
  }

  isSavingScene(scene: any): boolean {
    return this.savingSceneKeys.has(scene);
  }

  /**
   * Save a single scene to the account (contracts/project-api.md `POST /scene`).
   * Disabled for signed-out users so the caller never generates a doomed
   * request; on success shows a confirmation toast and emits `sceneSaved`,
   * on a 409 SCENE_LIMIT_REACHED shows the cap message from ProjectApiError.
   */
  saveScene(scene: any): void {
    if (!this.canSaveScene || this.isSavingScene(scene)) {
      return;
    }

    const request: SaveSceneRequest = {
      sceneNumber: scene?.sceneNumberText ?? '',
      sceneHeader: scene?.text ?? '',
      sourceTitle: this.sourceTitle || '',
      characters: scene?.characters ?? [],
      pageCount: scene?.pageCount ?? scene?.page ?? 0,
      lines: scene?.lines ?? [],
    };

    this.sceneSaveRequested.emit(request);
    this.savingSceneKeys.add(scene);

    this.projectApi.saveScene(request).subscribe({
      next: (summary) => {
        this.savingSceneKeys.delete(scene);
        this.sceneSaved.emit(summary);
        this.showToast('success', `Scene ${request.sceneNumber || ''} saved to your account.`.trim());
      },
      error: (err: ProjectApiError) => {
        this.savingSceneKeys.delete(scene);
        this.showToast('error', err?.message || 'Could not save this scene. Please try again.');
      },
    });
  }

  private showToast(type: 'success' | 'error', message: string): void {
    this.toastType = type;
    this.toastMessage = message;
    this.toastVisible = true;

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
    }, 4000);
  }
}
