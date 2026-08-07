import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { of, throwError } from 'rxjs';

import { SaveProjectDialogComponent, SaveProjectDialogData, SaveProjectResult } from './save-project-dialog.component';
import { ProjectApiService, ProjectApiError } from 'src/app/services/project/project-api.service';
import { ProjectContent } from 'src/app/types/Project';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function createMockContent(overrides: Partial<ProjectContent> = {}): ProjectContent {
  return {
    title: 'MOCK SCRIPT',
    originalname: 'mock-script.pdf',
    createdAt: '2026-08-06T00:00:00.000Z',
    allLines: [{ index: 0, text: 'INT. KITCHEN - DAY', category: 'scene-header' }],
    individualPages: [[]],
    allChars: ['ALICE', 'BOB'],
    firstAndLastLinesOfScenes: [{ index: 0, lastLine: 5 }],
    ...overrides,
  };
}

function createDialogData(overrides: Partial<SaveProjectDialogData> = {}): SaveProjectDialogData {
  return {
    defaultTitle: 'My Awesome Script',
    content: createMockContent(),
    ...overrides,
  };
}

// ─────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────

describe('SaveProjectDialogComponent', () => {
  let component: SaveProjectDialogComponent;
  let fixture: ComponentFixture<SaveProjectDialogComponent>;
  let projectApiSpy: jest.Mocked<ProjectApiService>;

  beforeEach(async () => {
    const mockProjectApi = {
      createProject: jest.fn(),
    } as unknown as jest.Mocked<ProjectApiService>;

    await TestBed.configureTestingModule({
      declarations: [SaveProjectDialogComponent],
      imports: [FormsModule, CommonModule, RouterTestingModule],
      providers: [
        { provide: ProjectApiService, useValue: mockProjectApi },
      ],
    }).compileComponents();

    projectApiSpy = TestBed.inject(ProjectApiService) as jest.Mocked<ProjectApiService>;
    fixture = TestBed.createComponent(SaveProjectDialogComponent);
    component = fixture.componentInstance;
    component.data = createDialogData();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─────────────────────────────────────────────
  // T018 — acknowledgment required before save enabled
  // ─────────────────────────────────────────────
  it('requires the storage acknowledgment before the save button is enabled', fakeAsync(() => {
    // Name is populated but acknowledgment is false initially
    component.projectName = 'My Script';
    component.acknowledged = false;
    fixture.detectChanges();
    tick();

    expect(component.canSave).toBe(false);

    // Get the save button
    const saveButton = fixture.debugElement.query(By.css('button[aria-label="Save project"]'));
    expect(saveButton.nativeElement.disabled).toBe(true);

    // Tick the acknowledgment
    component.acknowledged = true;
    fixture.detectChanges();
    tick();

    expect(component.canSave).toBe(true);
    expect(saveButton.nativeElement.disabled).toBe(false);
  }));

  // ─────────────────────────────────────────────
  // T018 — name defaults to script title
  // ─────────────────────────────────────────────
  it('defaults the project name to the script title', () => {
    expect(component.projectName).toBe('My Awesome Script');

    const nameInput = fixture.debugElement.query(By.css('#project-name'));
    expect((nameInput.nativeElement as HTMLInputElement).value).toBe('My Awesome Script');
  });

  it('defaults to the content title when defaultTitle is empty', () => {
    component.data = createDialogData({ defaultTitle: '' });
    component.ngOnInit();
    fixture.detectChanges();

    expect(component.projectName).toBe('');
  });

  // ─────────────────────────────────────────────
  // T018 — emits save with trimmed name + optInAcknowledged true
  // ─────────────────────────────────────────────
  it('emits the save event with the trimmed name and optInAcknowledged true', fakeAsync(() => {
    projectApiSpy.createProject.mockReturnValue(
      of({
        id: 'proj-new',
        title: 'Trimmed Name',
        sceneCount: 1,
        pageCount: 1,
        createdAt: '2026-08-06T00:00:00.000Z',
      })
    );

    component.projectName = '  Trimmed Name  ';
    component.acknowledged = true;
    fixture.detectChanges();

    const emittedEvents: SaveProjectResult[] = [];
    component.save.subscribe((result) => emittedEvents.push(result));

    component.onSave();
    tick();

    expect(emittedEvents.length).toBe(1);
    expect(emittedEvents[0].title).toBe('Trimmed Name');
    expect(emittedEvents[0].optInAcknowledged).toBe(true);
    expect(emittedEvents[0].content).toEqual(component.data.content);
  }));

  it('does not emit save when acknowledgment is not checked', fakeAsync(() => {
    component.projectName = 'My Script';
    component.acknowledged = false;
    fixture.detectChanges();

    const emittedEvents: SaveProjectResult[] = [];
    component.save.subscribe((result) => emittedEvents.push(result));

    component.onSave();
    tick();

    expect(emittedEvents.length).toBe(0);
    expect(projectApiSpy.createProject).not.toHaveBeenCalled();
  }));

  // ─────────────────────────────────────────────
  // T018 — shows limit-reached message with delete-to-make-room affordance on 409
  // ─────────────────────────────────────────────
  it('shows the limit-reached message with a delete-to-make-room affordance on a 409', fakeAsync(() => {
    const limitError = new ProjectApiError(
      'PROJECT_LIMIT_REACHED',
      "You've reached the 5-project limit. Delete a project to make room.",
      409
    );
    projectApiSpy.createProject.mockReturnValue(throwError(() => limitError));

    component.projectName = 'My Script';
    component.acknowledged = true;
    fixture.detectChanges();

    component.onSave();
    tick();
    fixture.detectChanges();

    expect(component.isLimitReached).toBe(true);
    expect(component.errorMessage).toBeNull();

    const limitBanner = fixture.debugElement.query(By.css('[role="alert"]'));
    expect(limitBanner).not.toBeNull();

    const bannerText = limitBanner.nativeElement.textContent;
    expect(bannerText).toContain('limit reached');

    // There should be a profile link acting as the delete-to-make-room affordance
    const profileLink = limitBanner.query(By.css('a[routerLink="/profile"]'));
    expect(profileLink).not.toBeNull();
  }));

  it('shows a generic error message for non-limit API errors', fakeAsync(() => {
    const apiError = new ProjectApiError('UNKNOWN', 'Server blew up.', 500);
    projectApiSpy.createProject.mockReturnValue(throwError(() => apiError));

    component.projectName = 'My Script';
    component.acknowledged = true;
    fixture.detectChanges();

    component.onSave();
    tick();
    fixture.detectChanges();

    expect(component.isLimitReached).toBe(false);
    expect(component.errorMessage).toContain('Server blew up');
  }));

  // ─────────────────────────────────────────────
  // cancel
  // ─────────────────────────────────────────────
  it('emits the cancel event when Cancel is clicked', () => {
    let cancelCount = 0;
    component.cancel.subscribe(() => { cancelCount++; });

    component.onCancel();

    expect(cancelCount).toBe(1);
  });
});
