import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of, throwError, EMPTY } from 'rxjs';
import { SchedulePageComponent } from './schedule-page.component';
import { ScheduleTabComponent } from '../schedule-tab/schedule-tab.component';
import { ScheduleBuilderComponent } from '../schedule-builder/schedule-builder.component';
import { ShootDayCardComponent } from '../shoot-day-card/shoot-day-card.component';
import { SceneStripComponent } from '../scene-strip/scene-strip.component';
import { ScheduleApiService } from '../../../services/schedule/schedule-api.service';
import { ScheduleStateService } from '../../../services/schedule/schedule-state.service';
import { ScheduleAutoSaveService } from '../../../services/schedule/schedule-auto-save.service';
import { TailwindDialogService } from '../../../services/tailwind-dialog/tailwind-dialog.service';
import { AuthService } from '../../../services/auth/auth.service';
import { ProjectService } from '../../../services/project/project.service';
import { ProjectApiService, ProjectSummary } from '../../../services/project/project-api.service';
import { PdfService } from '../../../services/pdf/pdf.service';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';

// ─────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────

class MockScheduleApiService {
  createSchedule = jest.fn().mockReturnValue(EMPTY);
  updateSchedule = jest.fn().mockReturnValue(EMPTY);
  getSchedule = jest.fn().mockReturnValue(EMPTY);
  deleteSchedule = jest.fn().mockReturnValue(EMPTY);
  listSchedules = jest.fn().mockReturnValue(of({ success: true, schedules: [], count: 0 }));
}

class MockAutoSaveService {
  start = jest.fn();
  stop = jest.fn();
  saveNow = jest.fn();
  markSavedToBackend = jest.fn();
  get isActive(): boolean { return false; }
  get versionConflict(): boolean { return false; }
  get lastSaveError(): string | null { return null; }
}

class MockTailwindDialogService {
  open = jest.fn().mockReturnValue({
    afterClosed: () => EMPTY,
    close: jest.fn(),
  });
}

class MockAuthService {
  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  setUser(user: any): void {
    this.userSubject.next(user);
  }

  getAuthenticatedUser() {
    return this.user$;
  }
}

class MockProjectService {
  activeProjectId: string | null = null;
  openProject = jest.fn().mockReturnValue(EMPTY);
}

class MockProjectApiService {
  listProjects = jest.fn().mockReturnValue(of({ projects: [] as ProjectSummary[] }));
}

function createMockProjectSummary(overrides: Partial<ProjectSummary> = {}): ProjectSummary {
  return {
    id: 'proj-real-uuid-1',
    title: 'THE FINAL ROSE',
    originalname: 'the-final-rose.pdf',
    sceneCount: 10,
    pageCount: 90,
    characterCount: 5,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    contentBytes: 1024,
    ...overrides,
  };
}

describe('SchedulePageComponent', () => {
  let component: SchedulePageComponent;
  let fixture: ComponentFixture<SchedulePageComponent>;
  let stateService: ScheduleStateService;
  let mockApiService: MockScheduleApiService;
  let mockAuthService: MockAuthService;
  let mockProjectService: MockProjectService;
  let mockProjectApiService: MockProjectApiService;
  let paramMapSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    mockApiService = new MockScheduleApiService();
    mockAuthService = new MockAuthService();
    mockProjectService = new MockProjectService();
    mockProjectApiService = new MockProjectApiService();
    paramMapSubject = new BehaviorSubject(convertToParamMap({}));

    await TestBed.configureTestingModule({
      declarations: [
        SchedulePageComponent,
        ScheduleTabComponent,
        ScheduleBuilderComponent,
        ShootDayCardComponent,
        SceneStripComponent,
      ],
      imports: [CommonModule, DragDropModule, RouterTestingModule, HttpClientTestingModule],
      providers: [
        ScheduleStateService,
        { provide: ScheduleApiService, useValue: mockApiService },
        { provide: ScheduleAutoSaveService, useClass: MockAutoSaveService },
        { provide: TailwindDialogService, useValue: new MockTailwindDialogService() },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ProjectService, useValue: mockProjectService },
        { provide: ProjectApiService, useValue: mockProjectApiService },
        { provide: PdfService, useValue: { allLines: [], scenes: [] } },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: paramMapSubject.asObservable() },
        },
      ],
    }).compileComponents();

    stateService = TestBed.inject(ScheduleStateService);

    fixture = TestBed.createComponent(SchedulePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('when not authenticated', () => {
    it('should show sign-in message', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Sign in Required');
    });

    it('should not show schedule tab', () => {
      const tab = fixture.nativeElement.querySelector('app-schedule-tab');
      expect(tab).toBeNull();
    });

    it('should set isAuthenticated to false', () => {
      expect(component.isAuthenticated).toBe(false);
    });
  });

  describe('when authenticated', () => {
    beforeEach(() => {
      mockAuthService.setUser({ uid: 'user-123', email: 'test@test.com' });
      fixture.detectChanges();
    });

    it('should set isAuthenticated to true', () => {
      expect(component.isAuthenticated).toBe(true);
    });

    it('should render the schedule tab', () => {
      const tab = fixture.nativeElement.querySelector('app-schedule-tab');
      expect(tab).not.toBeNull();
    });

    it('should show the page header', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Production Schedules');
    });

    it('should show the upload hint', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('upload and classify a script');
    });
  });

  // ─────────────────────────────────────────────
  // Shared chrome — My Projects | Schedule nav + save indicator (spec 029 US4, T020/T022)
  // ─────────────────────────────────────────────
  describe('shared chrome — My Projects | Schedule nav + save indicator', () => {
    beforeEach(() => {
      mockAuthService.setUser({ uid: 'user-123', email: 'test@test.com' });
      fixture.detectChanges();
    });

    it('renders the My Projects | Schedule nav shell', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('[data-testid="scheduling-nav"]')).toBeTruthy();
      expect(el.querySelector('[data-testid="nav-my-projects"]')).toBeTruthy();
      expect(el.querySelector('[data-testid="nav-schedule"]')).toBeTruthy();
    });

    it('"My Projects" nav control navigates to /my-projects without discarding in-progress edits', () => {
      const router = TestBed.inject(Router);
      const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

      component.goToMyProjects();

      expect(navigateSpy).toHaveBeenCalledWith(['/my-projects']);
    });

    it('reflects unsaved → saving → all changes saved via ScheduleStateService (existing auto-save observables)', () => {
      const el = () => fixture.nativeElement as HTMLElement;

      stateService.setSchedule({
        id: 'sched-x', projectId: 'proj-x', projectTitle: 'Test',
        userId: 'user-123', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        version: 1, shootDays: [], unscheduledScenes: [], castMembers: [], settings: {} as any,
      } as any);
      fixture.detectChanges();

      stateService.markDirty();
      fixture.detectChanges();
      expect(el().querySelector('[data-testid="schedule-page-save-indicator"]')!.textContent).toContain('Unsaved changes');
      expect(component.hasOpenSchedule).toBe(true);

      stateService.setSaving(true);
      fixture.detectChanges();
      expect(el().querySelector('[data-testid="schedule-page-save-indicator"]')!.textContent).toContain('Saving');

      stateService.markSaved();
      fixture.detectChanges();
      expect(el().querySelector('[data-testid="schedule-page-save-indicator"]')!.textContent).toContain('All changes saved');
    });
  });

  describe('with route param :id', () => {
    const fullMockSchedule = {
      id: 'sched-abc',
      projectId: 'proj-123',
      projectTitle: 'Test Film',
      userId: 'user-123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      shootDays: [],
      unscheduledScenes: [],
      castMembers: [],
      locations: [],
      notes: '',
    };

    it('should load a specific schedule when authenticated', () => {
      mockApiService.getSchedule.mockReturnValue(
        of({ success: true, schedule: { ...fullMockSchedule } as any })
      );

      // Provide route param
      paramMapSubject.next(convertToParamMap({ id: 'sched-abc' }));
      // Then authenticate
      mockAuthService.setUser({ uid: 'user-123' });
      fixture.detectChanges();

      expect(mockApiService.getSchedule).toHaveBeenCalledWith('sched-abc');
      expect(stateService.schedule).not.toBeNull();
      expect(stateService.schedule?.id).toBe('sched-abc');
    });

    it('should not load when not authenticated', () => {
      paramMapSubject.next(convertToParamMap({ id: 'sched-abc' }));
      fixture.detectChanges();

      expect(mockApiService.getSchedule).not.toHaveBeenCalled();
    });

    it('should show error when schedule load fails', () => {
      mockApiService.getSchedule.mockReturnValue(
        throwError(() => new Error('Schedule not found.'))
      );

      paramMapSubject.next(convertToParamMap({ id: 'sched-bad' }));
      mockAuthService.setUser({ uid: 'user-123' });
      fixture.detectChanges();

      expect(component.routeLoadError).toBe('Schedule not found.');
      expect(component.isLoadingRoute).toBe(false);

      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Failed to Load Schedule');
    });

    it('should not reload if same schedule is already loaded', () => {
      stateService.setSchedule({ ...fullMockSchedule } as any);
      fixture.detectChanges();

      paramMapSubject.next(convertToParamMap({ id: 'sched-abc' }));
      mockAuthService.setUser({ uid: 'user-123' });
      fixture.detectChanges();

      expect(mockApiService.getSchedule).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────
  // Project linking (spec 027 US3 T041/T042)
  // ─────────────────────────────────────────────

  describe('project linking on schedule open', () => {
    function loadSchedule(projectId: string | null): void {
      mockApiService.getSchedule.mockReturnValue(
        of({
          success: true,
          schedule: {
            id: 'sched-abc',
            projectId,
            projectTitle: 'Test Film',
            userId: 'user-123',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1,
            shootDays: [],
            unscheduledScenes: [],
            castMembers: [],
            locations: [],
            notes: '',
          } as any,
        })
      );

      paramMapSubject.next(convertToParamMap({ id: 'sched-abc' }));
      mockAuthService.setUser({ uid: 'user-123' });
      fixture.detectChanges();
    }

    it('resolves a real (non-legacy) projectId through ProjectService and marks the project as linked (T041)', () => {
      mockProjectService.openProject.mockReturnValue(of({ project: { id: 'proj-real-uuid-1' } as any, content: {} as any }));

      loadSchedule('proj-real-uuid-1');

      expect(mockProjectService.openProject).toHaveBeenCalledWith('proj-real-uuid-1');
      expect(component.isProjectLinked).toBe(true);
      expect(component.isLegacySchedule).toBe(false);
    });

    it('passes PdfService down to app-schedule-tab once the project is linked', () => {
      mockProjectService.openProject.mockReturnValue(of({ project: { id: 'proj-real-uuid-1' } as any, content: {} as any }));

      loadSchedule('proj-real-uuid-1');
      fixture.detectChanges();

      const tab = fixture.debugElement.query((de) => de.name === 'app-schedule-tab');
      expect(tab.componentInstance.pdfService).toBeTruthy();
    });

    it('does not call ProjectService.openProject for a legacy proj-{timestamp} placeholder id', () => {
      loadSchedule('proj-1738900000000');

      expect(mockProjectService.openProject).not.toHaveBeenCalled();
      expect(component.isProjectLinked).toBe(false);
      expect(component.isLegacySchedule).toBe(true);
    });

    it('treats a missing projectId as a legacy schedule', () => {
      loadSchedule(null);

      expect(mockProjectService.openProject).not.toHaveBeenCalled();
      expect(component.isLegacySchedule).toBe(true);
    });

    it('falls back to legacy behavior when the linked project fails to resolve (deleted/not owned/content missing)', () => {
      mockProjectService.openProject.mockReturnValue(throwError(() => new Error('Forbidden')));

      loadSchedule('proj-real-uuid-1');

      expect(component.isProjectLinked).toBe(false);
      expect(component.isLegacySchedule).toBe(true);
    });

    it('shows the attach-project banner only for legacy/unlinked schedules', () => {
      loadSchedule('proj-1738900000000');
      fixture.detectChanges();

      const banner = fixture.nativeElement.querySelector('[data-testid="attach-project-banner"]');
      expect(banner).not.toBeNull();
    });

    it('does not show the attach-project banner once a project is linked', () => {
      mockProjectService.openProject.mockReturnValue(of({ project: { id: 'proj-real-uuid-1' } as any, content: {} as any }));

      loadSchedule('proj-real-uuid-1');
      fixture.detectChanges();

      const banner = fixture.nativeElement.querySelector('[data-testid="attach-project-banner"]');
      expect(banner).toBeNull();
    });

    it('stores the resolved project and passes it down to app-schedule-tab (spec 028 US5 T054)', () => {
      mockProjectService.openProject.mockReturnValue(
        of({ project: { id: 'proj-real-uuid-1', title: 'THE FINAL ROSE' } as any, content: {} as any })
      );

      loadSchedule('proj-real-uuid-1');
      fixture.detectChanges();

      expect(component.linkedProject?.title).toBe('THE FINAL ROSE');

      const tab = fixture.debugElement.query((de) => de.name === 'app-schedule-tab');
      expect(tab.componentInstance.project?.title).toBe('THE FINAL ROSE');
    });

    it('clears linkedProject for a legacy/unresolvable schedule', () => {
      loadSchedule('proj-1738900000000');
      fixture.detectChanges();

      expect(component.linkedProject).toBeNull();
    });
  });

  // ─────────────────────────────────────────────
  // Spec 028 US3 T041 — verifies 027 T041/T042's hydration is exactly what
  // US3's "continue with a saved project" flow needs. No new production
  // code: this documents/confirms the existing behavior above under the
  // exact task wording so the contract stays covered as its own suite.
  // ─────────────────────────────────────────────

  describe('US3 T041 — resumed schedule script data (SC-006, contracts/project-library-ui.md)', () => {
    function loadSchedule(projectId: string | null): void {
      mockApiService.getSchedule.mockReturnValue(
        of({
          success: true,
          schedule: {
            id: 'sched-abc',
            projectId,
            projectTitle: 'Test Film',
            userId: 'user-123',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1,
            shootDays: [],
            unscheduledScenes: [],
            castMembers: [],
            locations: [],
            notes: '',
          } as any,
        })
      );

      paramMapSubject.next(convertToParamMap({ id: 'sched-abc' }));
      mockAuthService.setUser({ uid: 'user-123' });
      fixture.detectChanges();
    }

    it('resolves schedule.projectId to a hydrated project on load', () => {
      mockProjectService.openProject.mockReturnValue(of({ project: { id: 'proj-real-uuid-1' } as any, content: {} as any }));

      loadSchedule('proj-real-uuid-1');

      expect(mockProjectService.openProject).toHaveBeenCalledWith('proj-real-uuid-1');
      expect(component.isProjectLinked).toBe(true);
    });

    it('the resolved project\'s script data enables AI one-liner generation with zero re-upload prompt', () => {
      mockProjectService.openProject.mockReturnValue(of({ project: { id: 'proj-real-uuid-1' } as any, content: {} as any }));

      loadSchedule('proj-real-uuid-1');
      fixture.detectChanges();

      // FR-007: a hydrated project means PdfService (script data) flows down
      // to app-schedule-tab (and from there to ScheduleBuilderComponent),
      // exactly as a fresh upload would — this is what "enables AI one-liner
      // generation" means for a resumed schedule. No attach/re-upload banner
      // renders once linked (SC-006's "zero re-upload prompt").
      const tab = fixture.debugElement.query((de) => de.name === 'app-schedule-tab');
      expect(tab.componentInstance.pdfService).toBe(component.pdfService);

      const banner = fixture.nativeElement.querySelector('[data-testid="attach-project-banner"]');
      expect(banner).toBeNull();
    });

    it('a legacy schedule (unresolvable projectId) keeps today\'s exact behavior — manual one-liners work, AI one-liners show the re-upload prompt', () => {
      loadSchedule('proj-1738900000000');
      fixture.detectChanges();

      expect(component.isProjectLinked).toBe(false);

      // ScheduleBuilderComponent's one-liner UI is unaffected either way —
      // manual entry always works because it edits ScheduleScene.oneLiner
      // directly. What changes for a legacy/unlinked schedule is that
      // PdfService is withheld from app-schedule-tab (no live script data),
      // and the banner explicitly names the re-upload/AI-regeneration gap.
      const tab = fixture.debugElement.query((de) => de.name === 'app-schedule-tab');
      expect(tab.componentInstance.pdfService).toBeUndefined();

      const banner = fixture.nativeElement.querySelector('[data-testid="attach-project-banner"]');
      expect(banner).not.toBeNull();
      expect(banner.textContent).toContain('Manual one-liners still work');
      expect(banner.textContent).toContain('regenerate AI one-liners');
    });
  });

  describe('attach flow (T042)', () => {
    beforeEach(() => {
      mockApiService.getSchedule.mockReturnValue(
        of({
          success: true,
          schedule: {
            id: 'sched-abc',
            projectId: 'proj-1738900000000',
            projectTitle: 'Test Film',
            userId: 'user-123',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1,
            shootDays: [],
            unscheduledScenes: [],
            castMembers: [],
            locations: [],
            notes: '',
          } as any,
        })
      );

      paramMapSubject.next(convertToParamMap({ id: 'sched-abc' }));
      mockAuthService.setUser({ uid: 'user-123' });
      fixture.detectChanges();
    });

    it('loads the user\'s saved projects when the attach picker is opened', () => {
      mockProjectApiService.listProjects.mockReturnValue(
        of({ projects: [createMockProjectSummary()] })
      );

      component.openAttachPicker();

      expect(mockProjectApiService.listProjects).toHaveBeenCalled();
      expect(component.attachableProjects.length).toBe(1);
      expect(component.isAttachPickerOpen).toBe(true);
    });

    it('links the schedule to the selected project via PUT /schedule/:id and re-resolves hydration', () => {
      mockProjectService.openProject.mockReturnValue(of({ project: { id: 'proj-real-uuid-1' } as any, content: {} as any }));
      mockApiService.updateSchedule.mockReturnValue(of({ success: true, scheduleId: 'sched-abc', version: 2, message: 'ok' }));

      component.attachToProject('proj-real-uuid-1');

      const [updateArg] = mockApiService.updateSchedule.mock.calls[0];
      expect(updateArg.id).toBe('sched-abc');
      expect(updateArg.projectId).toBe('proj-real-uuid-1');
      expect(stateService.schedule?.projectId).toBe('proj-real-uuid-1');
      expect(mockProjectService.openProject).toHaveBeenCalledWith('proj-real-uuid-1');
      expect(component.isProjectLinked).toBe(true);
      expect(component.isAttachPickerOpen).toBe(false);
    });

    it('surfaces an error without throwing when attaching fails', () => {
      mockApiService.updateSchedule.mockReturnValue(throwError(() => new Error('Schedule was modified by another session.')));

      expect(() => component.attachToProject('proj-real-uuid-1')).not.toThrow();
      expect(component.attachError).toBe('Schedule was modified by another session.');
      expect(component.isAttaching).toBe(false);
    });
  });

  describe('navigation helpers', () => {
    // Spec 028 US5 T056 — My Projects <-> Schedule navigation must not lose
    // in-progress schedule state. ScheduleStateService is a root singleton,
    // so state naturally persists across route navigation unless something
    // explicitly clears it. Only the explicit "Back to List" action does —
    // simply navigating away (component destroy) must not.
    it('does not clear the loaded schedule on ngOnDestroy — only backToList() does (T056)', () => {
      stateService.setSchedule({
        id: 'sched-abc',
        projectId: 'proj-123',
        projectTitle: 'Test',
        userId: 'user-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        shootDays: [],
        unscheduledScenes: [],
        castMembers: [],
        locations: [],
        notes: '',
      } as any);

      component.ngOnDestroy();

      expect(stateService.schedule).not.toBeNull();
      expect(stateService.schedule?.id).toBe('sched-abc');
    });

    it('should clear schedule on backToList', () => {
      stateService.setSchedule({
        id: 'sched-abc',
        projectId: 'proj-123',
        projectTitle: 'Test',
        userId: 'user-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        shootDays: [],
        unscheduledScenes: [],
        castMembers: [],
        locations: [],
        notes: '',
      } as any);

      component.backToList();

      expect(stateService.schedule).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe on destroy', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
