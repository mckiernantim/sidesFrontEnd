import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { ProjectApiService, ProjectApiError, CreateProjectRequest } from 'src/app/services/project/project-api.service';
import { ProjectContent } from 'src/app/types/Project';

export interface SaveProjectDialogData {
  /** Default title pre-populated from the current script. */
  defaultTitle: string;
  /** The full classified script output to be saved. Never logged. */
  content: ProjectContent;
}

export interface SaveProjectResult {
  /** Project name as entered (trimmed). */
  title: string;
  /** Always true — dialog cannot emit without acknowledgment. */
  optInAcknowledged: true;
  /** The content to persist. */
  content: ProjectContent;
}

@Component({
  selector: 'app-save-project-dialog',
  templateUrl: './save-project-dialog.component.html',
  styleUrls: ['./save-project-dialog.component.css'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.Default,
})
export class SaveProjectDialogComponent implements OnInit {
  @Input() data: SaveProjectDialogData = { defaultTitle: '', content: null as any };
  @Output() save = new EventEmitter<SaveProjectResult>();
  @Output() cancel = new EventEmitter<void>();

  projectName = '';
  acknowledged = false;
  isSaving = false;
  errorMessage: string | null = null;
  isLimitReached = false;

  constructor(
    private projectApi: ProjectApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.projectName = (this.data?.defaultTitle ?? '').trim();
  }

  get canSave(): boolean {
    return this.acknowledged && this.projectName.trim().length > 0 && !this.isSaving;
  }

  onSave(): void {
    if (!this.canSave) {
      return;
    }

    const trimmedName = this.projectName.trim();
    this.isSaving = true;
    this.errorMessage = null;
    this.isLimitReached = false;

    const request: CreateProjectRequest = {
      title: trimmedName,
      content: this.data.content,
      optInAcknowledged: true,
    };

    this.projectApi.createProject(request).subscribe({
      next: () => {
        this.isSaving = false;
        this.save.emit({
          title: trimmedName,
          optInAcknowledged: true,
          content: this.data.content,
        });
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.isSaving = false;

        if (err instanceof ProjectApiError && err.code === 'PROJECT_LIMIT_REACHED') {
          this.isLimitReached = true;
          this.errorMessage = null;
        } else if (err instanceof Error) {
          this.errorMessage = err.message;
        } else {
          this.errorMessage = 'An unexpected error occurred. Please try again.';
        }

        this.cdr.detectChanges();
      },
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
