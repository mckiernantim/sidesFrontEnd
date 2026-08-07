import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MyProjectsComponent } from './my-projects.component';
import { ProjectLibraryCard, ProjectLibraryService, ProjectOpenResolution } from '../../../services/project/project-library.service';
import { ProjectService } from '../../../services/project/project.service';
import { ProjectSummary } from '../../../services/project/project-api.service';
import { ScheduleSummary } from '../../../services/schedule/schedule-api.service';
import { ScheduleStateService } from '../../../services/schedule/schedule-state.service';
import { TailwindDialogService } from '../../../services/tailwind-dialog/tailwind-dialog.service';

function buildProject(overrides: Partial<ProjectSummary> = {}): ProjectSummary {
  return {
    id: 'proj-1',
    title: 'My Screenplay',
    originalname: 'script.pdf',
    sceneCount: 10,
    pageCount: 90,
    characterCount: 5,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
    contentBytes: 1000,
    ...overrides,
  };
}

function buildCard(overrides: Partial<ProjectLibraryCard> = {}): ProjectLibraryCard {
  return {
    project: buildProject(),
    linkedSchedules: [],
    scheduleCount: 0,
    ...overrides,
  };
}

function buildScheduleSummary(overrides: Partial<ScheduleSummary> = {}): ScheduleSummary {
  return {
    id: 'sched-1',
    projectTitle: 'My Screenplay',
    projectId: 'proj-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
    version: 1,
    shootDayCount: 2,
    sceneCount: 10,
    castCount: 4,
    ...overrides,
  };
}

describe('MyProjectsComponent', () => {
  let component: MyProjectsComponent;
  let fixture: ComponentFixture<MyProjectsComponent>;
  let projectLibrary: {
    cards$: any;
    loadLibrary: jest.Mock;
    openProject: jest.Mock;
    openSchedule: jest.Mock;
    renameProject: jest.Mock;
    deleteProject: jest.Mock;
    createSchedule: jest.Mock;
  };
  let cardsSubject: BehaviorSubject<ProjectLibraryCard[]>;
  let dialogService: { open: jest.Mock };
  let router: jest.Mocked<Router>;
  let projectService: { openProject: jest.Mock };
  let scheduleState: { schedule: { id: string } | null };

  async function setup(initialCards: ProjectLibraryCard[], loadLibraryImpl?: () => any) {
    cardsSubject = new BehaviorSubject<ProjectLibraryCard[]>([]);

    projectLibrary = {
      cards$: cardsSubject.asObservable(),
      loadLibrary: jest.fn().mockImplementation(
        loadLibraryImpl ||
          (() => of(initialCards).pipe(tap((cards) => cardsSubject.next(cards))))
      ),
      openProject: jest.fn(),
      openSchedule: jest.fn(),
      renameProject: jest.fn(),
      deleteProject: jest.fn(),
      createSchedule: jest.fn(),
    };

    dialogService = { open: jest.fn() };
    router = { navigate: jest.fn() } as unknown as jest.Mocked<Router>;
    projectService = { openProject: jest.fn() };
    scheduleState = { schedule: null };

    await TestBed.configureTestingModule({
      declarations: [MyProjectsComponent],
      imports: [CommonModule, FormsModule],
      providers: [
        { provide: ProjectLibraryService, useValue: projectLibrary },
        { provide: ProjectService, useValue: projectService },
        { provide: ScheduleStateService, useValue: scheduleState },
        { provide: TailwindDialogService, useValue: dialogService },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  // ─────────────────────────────────────────────
  // Basic rendering
  // ─────────────────────────────────────────────

  it('renders title, page count, scene count, schedule count, and last-updated date per card (T048)', async () => {
    const card = buildCard({
      project: buildProject({ id: 'proj-42', title: 'Chinatown', pageCount: 112, sceneCount: 84 }),
      linkedSchedules: [
        { id: 'sched-1', projectTitle: 'My Screenplay', updatedAt: '2026-01-01T00:00:00Z' },
        { id: 'sched-2', projectTitle: 'My Screenplay', updatedAt: '2026-01-02T00:00:00Z' },
      ],
      scheduleCount: 2,
    });
    await setup([card]);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Chinatown');
    expect(compiled.textContent).toContain('112 pages');
    expect(compiled.textContent).toContain('84 scenes');
    expect(compiled.textContent).toContain('2 schedules');
    expect(compiled.textContent).toContain('Updated');
  });

  it('renders an empty state when there are zero saved projects', async () => {
    await setup([]);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="my-projects-empty"]')).toBeTruthy();
  });

  it('empty library exposes a clear Upload Script CTA to /?entry=upload (contracts/schedule-editor-ui.md)', async () => {
    await setup([]);

    const compiled = fixture.nativeElement as HTMLElement;
    const cta = compiled.querySelector('[data-testid="empty-upload-cta"]') as HTMLButtonElement;
    expect(cta).toBeTruthy();
    cta.click();

    expect(router.navigate).toHaveBeenCalledWith(['/'], { queryParams: { entry: 'upload' } });
  });

  it('+ Upload Script navigates to /?entry=upload (spec 029 US3)', async () => {
    await setup([]);

    component.uploadScript();

    expect(router.navigate).toHaveBeenCalledWith(['/'], { queryParams: { entry: 'upload' } });
  });

  it('surfaces a retryable error when the library fails to load', async () => {
    await setup([], () => throwError(() => ({ message: 'Network error' })));

    expect(component.loadError).toBe('Network error');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="my-projects-error"]')).toBeTruthy();
  });

  // ─────────────────────────────────────────────
  // Open Schedule vs Create Schedule (T048)
  // ─────────────────────────────────────────────

  describe('primary action per card', () => {
    it('shows Open Schedule when scheduleCount > 0', async () => {
      const card = buildCard({
        scheduleCount: 1,
        linkedSchedules: [{ id: 'sched-1', projectTitle: 'My Screenplay', updatedAt: '2026-01-01T00:00:00Z' }],
      });
      await setup([card]);

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[data-testid="open-schedule-btn"]')).toBeTruthy();
      expect(compiled.querySelector('[data-testid="create-schedule-card-btn"]')).toBeFalsy();
    });

    it('shows Create Schedule when scheduleCount === 0', async () => {
      const card = buildCard({ scheduleCount: 0 });
      await setup([card]);

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[data-testid="create-schedule-card-btn"]')).toBeTruthy();
      expect(compiled.querySelector('[data-testid="open-schedule-btn"]')).toBeFalsy();
    });

    it('Open Schedule resolves through ProjectLibraryService.openProject', async () => {
      const card = buildCard({ project: buildProject({ id: 'proj-42' }), scheduleCount: 1 });
      await setup([card]);
      projectLibrary.openProject.mockReturnValue(of<ProjectOpenResolution>({ kind: 'schedule', scheduleId: 'sched-only' }));

      component.openProject(card);

      expect(projectLibrary.openProject).toHaveBeenCalledWith('proj-42');
      expect(component.actingProjectId).toBeNull();
    });

    it('Create Schedule on a card seeds and creates directly via ProjectLibraryService.createSchedule (T051)', async () => {
      const card = buildCard({ project: buildProject({ id: 'proj-42', title: 'Chinatown' }), scheduleCount: 0 });
      await setup([card]);
      projectLibrary.createSchedule.mockReturnValue(of({ scheduleId: 'sched-new' }));

      component.createScheduleForCard(card);

      expect(projectLibrary.createSchedule).toHaveBeenCalledWith('proj-42', 'Chinatown');
      expect(component.actingProjectId).toBeNull();
    });

    it('surfaces an error without trapping the user when Create Schedule fails', async () => {
      const card = buildCard({ project: buildProject({ id: 'proj-42' }), scheduleCount: 0 });
      await setup([card]);
      projectLibrary.createSchedule.mockReturnValue(throwError(() => new Error('Failed to create a schedule')));

      component.createScheduleForCard(card);

      expect(component.openError).toBe('Failed to create a schedule');
      expect(component.actingProjectId).toBeNull();
    });

    it('shows a schedule picker when multiple schedules are linked (US3 acceptance scenario 3)', async () => {
      const card = buildCard({ project: buildProject({ id: 'proj-42' }), scheduleCount: 2 });
      const schedules = [buildScheduleSummary({ id: 'sched-a' }), buildScheduleSummary({ id: 'sched-b' })];
      await setup([card]);
      projectLibrary.openProject.mockReturnValue(of<ProjectOpenResolution>({ kind: 'picker', schedules }));

      component.openProject(card);
      fixture.detectChanges();

      expect(component.schedulePickerProjectId).toBe('proj-42');
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelectorAll('[data-testid="schedule-picker-option"]').length).toBe(2);
    });

    it('falls back to the zero-schedule choice when Open Schedule resolves to none (stale count)', async () => {
      const card = buildCard({ project: buildProject({ id: 'proj-42', title: 'Chinatown' }), scheduleCount: 1 });
      await setup([card]);
      projectLibrary.openProject.mockReturnValue(of<ProjectOpenResolution>({ kind: 'none' }));

      component.openProject(card);
      fixture.detectChanges();

      expect(component.noScheduleChoiceProjectId).toBe('proj-42');
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[data-testid="no-schedule-choice"]')).toBeTruthy();
    });

    it('the fallback choice\'s Create Schedule seeds via ProjectLibraryService.createSchedule', async () => {
      const card = buildCard({ project: buildProject({ id: 'proj-42', title: 'Chinatown' }), scheduleCount: 1 });
      await setup([card]);
      projectLibrary.openProject.mockReturnValue(of<ProjectOpenResolution>({ kind: 'none' }));
      component.openProject(card);
      projectLibrary.createSchedule.mockReturnValue(of({ scheduleId: 'sched-new' }));

      component.createScheduleForProject();

      expect(projectLibrary.createSchedule).toHaveBeenCalledWith('proj-42', 'Chinatown');
      expect(component.noScheduleChoiceProjectId).toBeNull();
    });

    it('Continue to Dashboard navigates to /dashboard', async () => {
      const card = buildCard({ project: buildProject({ id: 'proj-42' }), scheduleCount: 1 });
      await setup([card]);
      projectLibrary.openProject.mockReturnValue(of<ProjectOpenResolution>({ kind: 'none' }));
      component.openProject(card);

      component.continueToDashboard();

      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('surfaces a clear error without trapping the user when Open Schedule fails', async () => {
      const card = buildCard({ project: buildProject({ id: 'proj-42' }), scheduleCount: 1 });
      await setup([card]);
      projectLibrary.openProject.mockReturnValue(throwError(() => new Error('Forbidden')));

      component.openProject(card);

      expect(component.openError).toBe('Forbidden');
      expect(component.actingProjectId).toBeNull();
    });
  });

  // ─────────────────────────────────────────────
  // Rename (inline, T048/T050)
  // ─────────────────────────────────────────────

  describe('rename', () => {
    it('is inline and persists via ProjectLibraryService.renameProject', async () => {
      const card = buildCard({ project: buildProject({ id: 'proj-42', title: 'Old Title' }) });
      await setup([card]);
      projectLibrary.renameProject.mockReturnValue(of({ id: 'proj-42', title: 'New Title', updatedAt: '2026-02-01T00:00:00Z' }));

      component.startRename(card);
      fixture.detectChanges();
      expect(component.renamingProjectId).toBe('proj-42');
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[data-testid="rename-input-proj-42"]')).toBeTruthy();

      component.renameDraftTitle = 'New Title';
      component.confirmRename(card);

      expect(projectLibrary.renameProject).toHaveBeenCalledWith('proj-42', 'New Title');
      expect(component.renamingProjectId).toBeNull();
    });

    it('rejects an empty title without calling the API', async () => {
      const card = buildCard({ project: buildProject({ id: 'proj-42' }) });
      await setup([card]);

      component.startRename(card);
      component.renameDraftTitle = '   ';
      component.confirmRename(card);

      expect(projectLibrary.renameProject).not.toHaveBeenCalled();
      expect(component.renameError).toBeTruthy();
    });

    it('surfaces an error and keeps editing open on rename failure', async () => {
      const card = buildCard({ project: buildProject({ id: 'proj-42' }) });
      await setup([card]);
      projectLibrary.renameProject.mockReturnValue(throwError(() => new Error('Failed to rename')));

      component.startRename(card);
      component.renameDraftTitle = 'New Title';
      component.confirmRename(card);

      expect(component.renameError).toBe('Failed to rename');
      expect(component.renamingProjectId).toBe('proj-42');
    });

    it('Cancel exits rename mode without calling the API', async () => {
      const card = buildCard({ project: buildProject({ id: 'proj-42' }) });
      await setup([card]);

      component.startRename(card);
      component.cancelRename();

      expect(component.renamingProjectId).toBeNull();
      expect(projectLibrary.renameProject).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────
  // Delete (T048/T050) — confirmation names linked schedules
  // ─────────────────────────────────────────────

  describe('delete', () => {
    it('shows a confirmation naming any linked schedules before deleting', async () => {
      const card = buildCard({
        project: buildProject({ id: 'proj-42', title: 'Chinatown' }),
        linkedSchedules: [{ id: 'sched-1', projectTitle: 'My Screenplay', updatedAt: '2026-01-01T00:00:00Z' }],
        scheduleCount: 1,
      });
      await setup([card]);
      dialogService.open.mockReturnValue({ afterClosed: () => of('cancel') });

      component.confirmDeleteCard(card);

      expect(dialogService.open).toHaveBeenCalled();
      const dialogConfig = dialogService.open.mock.calls[0][1];
      expect(dialogConfig.data.content).toContain('1 linked schedule');
      expect(projectLibrary.deleteProject).not.toHaveBeenCalled();
    });

    it('deletes via ProjectLibraryService.deleteProject after confirmation', async () => {
      const card = buildCard({ project: buildProject({ id: 'proj-42' }) });
      await setup([card]);
      dialogService.open.mockReturnValue({ afterClosed: () => of('confirm') });
      projectLibrary.deleteProject.mockReturnValue(of({ deleted: true, linkedSchedules: [] }));

      component.confirmDeleteCard(card);

      expect(projectLibrary.deleteProject).toHaveBeenCalledWith('proj-42');
    });

    it('does not delete when the dialog is cancelled', async () => {
      const card = buildCard({ project: buildProject({ id: 'proj-42' }) });
      await setup([card]);
      dialogService.open.mockReturnValue({ afterClosed: () => of('cancel') });

      component.confirmDeleteCard(card);

      expect(projectLibrary.deleteProject).not.toHaveBeenCalled();
    });

    it('surfaces an error without trapping the user when delete fails', async () => {
      const card = buildCard({ project: buildProject({ id: 'proj-42' }) });
      await setup([card]);
      dialogService.open.mockReturnValue({ afterClosed: () => of('confirm') });
      projectLibrary.deleteProject.mockReturnValue(throwError(() => new Error('Forbidden')));

      component.confirmDeleteCard(card);

      expect(component.openError).toBe('Forbidden');
      expect(component.deletingProjectId).toBeNull();
    });
  });

  // ─────────────────────────────────────────────
  // 5-project cap (T048/T052)
  // ─────────────────────────────────────────────

  describe('5-project cap', () => {
    it('shows the limit-reached state consistently with the save-project dialog\'s 409 handling', async () => {
      const cards = Array.from({ length: 5 }, (_, i) => buildCard({ project: buildProject({ id: `proj-${i}` }) }));
      await setup(cards);

      const compiled = fixture.nativeElement as HTMLElement;
      const banner = compiled.querySelector('[data-testid="project-limit-banner"]');
      expect(banner).toBeTruthy();
      expect(banner?.textContent).toContain('5/5');
    });

    it('does not show the limit banner under 5 projects', async () => {
      const cards = [buildCard()];
      await setup(cards);

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[data-testid="project-limit-banner"]')).toBeFalsy();
    });
  });

  // ─────────────────────────────────────────────
  // Make sides (spec 029 US3 / T016) — hydrate → dashboard, no schedule required
  // ─────────────────────────────────────────────

  describe('Make sides', () => {
    it('hydrates the project and navigates to /dashboard without requiring a schedule', async () => {
      const card = buildCard({ project: buildProject({ id: 'proj-42' }), scheduleCount: 0 });
      await setup([card]);
      projectService.openProject.mockReturnValue(of({ project: {}, content: {} }));

      component.makeSides(card);

      expect(projectService.openProject).toHaveBeenCalledWith('proj-42');
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      expect(component.makeSidesProjectId).toBeNull();
    });

    it('surfaces an error without trapping the user when hydration fails', async () => {
      const card = buildCard({ project: buildProject({ id: 'proj-42' }) });
      await setup([card]);
      projectService.openProject.mockReturnValue(throwError(() => new Error('missing content')));

      component.makeSides(card);

      expect(component.openError).toBe('missing content');
      expect(component.makeSidesProjectId).toBeNull();
      expect(router.navigate).not.toHaveBeenCalledWith(['/dashboard']);
    });
  });

  // ─────────────────────────────────────────────
  // Shared chrome — My Projects | Schedule nav (spec 029 US4, T021/T022)
  // ─────────────────────────────────────────────

  describe('My Projects | Schedule nav', () => {
    it('renders the My Projects | Schedule nav shell', async () => {
      await setup([]);

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[data-testid="scheduling-nav"]')).toBeTruthy();
      expect(compiled.querySelector('[data-testid="nav-my-projects"]')).toBeTruthy();
      expect(compiled.querySelector('[data-testid="nav-schedule"]')).toBeTruthy();
    });

    it('disables the Schedule nav control when no schedule is open', async () => {
      scheduleState.schedule = null;
      await setup([]);

      const compiled = fixture.nativeElement as HTMLElement;
      const scheduleBtn = compiled.querySelector('[data-testid="nav-schedule"]') as HTMLButtonElement;
      expect(scheduleBtn.disabled).toBe(true);
      expect(component.hasOpenSchedule).toBe(false);
    });

    it('navigates to the open schedule when Schedule nav is clicked', async () => {
      await setup([]);
      scheduleState.schedule = { id: 'sched-99' };

      component.goToSchedule();

      expect(router.navigate).toHaveBeenCalledWith(['/schedule', 'sched-99']);
    });

    it('no-ops (stays on the library) when Schedule nav is clicked with no open schedule', async () => {
      scheduleState.schedule = null;
      await setup([]);

      component.goToSchedule();

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
