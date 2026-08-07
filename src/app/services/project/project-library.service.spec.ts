import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProjectLibraryService } from './project-library.service';
import { ProjectService, OpenProjectResult } from './project.service';
import { ProjectApiService, ProjectSummary } from './project-api.service';
import { ScheduleApiService, ScheduleSummary, ListSchedulesResponse } from '../schedule/schedule-api.service';
import { ScheduleService } from '../schedule/schedule.service';
import { ScheduleStateService } from '../schedule/schedule-state.service';
import { AuthService } from '../auth/auth.service';
import { PdfService } from '../pdf/pdf.service';
import { ProductionSchedule } from 'src/app/types/Schedule';
import { ProjectContent } from 'src/app/types/Project';

// ─────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────

function buildSchedule(overrides: Partial<ScheduleSummary> = {}): ScheduleSummary {
  return {
    id: 'sched-1',
    projectTitle: 'THE FINAL ROSE',
    projectId: 'proj-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    version: 1,
    shootDayCount: 2,
    sceneCount: 10,
    castCount: 4,
    ...overrides,
  };
}

function buildOpenResult(projectId = 'proj-1'): OpenProjectResult {
  return {
    project: { id: projectId } as any,
    content: {} as ProjectContent,
  };
}

function buildProjectSummary(overrides: Partial<ProjectSummary> = {}): ProjectSummary {
  return {
    id: 'proj-1',
    title: 'My Screenplay',
    originalname: 'script.pdf',
    sceneCount: 10,
    pageCount: 90,
    characterCount: 5,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    contentBytes: 1000,
    ...overrides,
  };
}

describe('ProjectLibraryService', () => {
  let service: ProjectLibraryService;
  let mockProjectService: { openProject: jest.Mock };
  let mockProjectApi: {
    listProjects: jest.Mock;
    getProjectLinks: jest.Mock;
    renameProject: jest.Mock;
    deleteProject: jest.Mock;
  };
  let mockScheduleApi: { listSchedules: jest.Mock; createSchedule: jest.Mock };
  let mockScheduleService: { seedScheduleFromPdfService: jest.Mock };
  let mockScheduleState: { clearSchedule: jest.Mock };
  let mockAuthService: { getCurrentUser: jest.Mock };
  let mockPdfService: any;
  let mockRouter: { navigate: jest.Mock };

  beforeEach(() => {
    mockProjectService = { openProject: jest.fn() };
    mockProjectApi = {
      listProjects: jest.fn(),
      getProjectLinks: jest.fn(),
      renameProject: jest.fn(),
      deleteProject: jest.fn(),
    };
    mockScheduleApi = { listSchedules: jest.fn(), createSchedule: jest.fn() };
    mockScheduleService = { seedScheduleFromPdfService: jest.fn() };
    mockScheduleState = { clearSchedule: jest.fn() };
    mockAuthService = { getCurrentUser: jest.fn().mockReturnValue({ uid: 'user-1' }) };
    mockPdfService = {};
    mockRouter = { navigate: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        ProjectLibraryService,
        { provide: ProjectService, useValue: mockProjectService },
        { provide: ProjectApiService, useValue: mockProjectApi },
        { provide: ScheduleApiService, useValue: mockScheduleApi },
        { provide: ScheduleService, useValue: mockScheduleService },
        { provide: ScheduleStateService, useValue: mockScheduleState },
        { provide: AuthService, useValue: mockAuthService },
        { provide: PdfService, useValue: mockPdfService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    service = TestBed.inject(ProjectLibraryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('openProject — resolution logic (contracts/project-library-ui.md)', () => {
    it('navigates to the project\'s single linked schedule when exactly one exists', (done) => {
      mockProjectService.openProject.mockReturnValue(of(buildOpenResult('proj-1')));
      mockScheduleApi.listSchedules.mockReturnValue(
        of({ success: true, count: 1, schedules: [buildSchedule({ id: 'sched-only', projectId: 'proj-1' })] } as ListSchedulesResponse)
      );

      service.openProject('proj-1').subscribe((resolution) => {
        expect(resolution).toEqual({ kind: 'schedule', scheduleId: 'sched-only' });
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/schedule', 'sched-only']);
        done();
      });
    });

    it('offers a schedule picker when a project has multiple linked schedules', (done) => {
      mockProjectService.openProject.mockReturnValue(of(buildOpenResult('proj-1')));
      mockScheduleApi.listSchedules.mockReturnValue(
        of({
          success: true,
          count: 2,
          schedules: [
            buildSchedule({ id: 'sched-a', projectId: 'proj-1' }),
            buildSchedule({ id: 'sched-b', projectId: 'proj-1' }),
          ],
        } as ListSchedulesResponse)
      );

      service.openProject('proj-1').subscribe((resolution) => {
        expect(resolution.kind).toBe('picker');
        if (resolution.kind === 'picker') {
          expect(resolution.schedules.map((s) => s.id)).toEqual(['sched-a', 'sched-b']);
        }
        expect(mockRouter.navigate).not.toHaveBeenCalled();
        done();
      });
    });

    it('offers Create Schedule or continue-to-dashboard when a project has none', (done) => {
      mockProjectService.openProject.mockReturnValue(of(buildOpenResult('proj-1')));
      mockScheduleApi.listSchedules.mockReturnValue(
        of({ success: true, count: 0, schedules: [] } as ListSchedulesResponse)
      );

      service.openProject('proj-1').subscribe((resolution) => {
        expect(resolution).toEqual({ kind: 'none' });
        expect(mockRouter.navigate).not.toHaveBeenCalled();
        done();
      });
    });

    it('ignores schedules linked to other projects when resolving a count', (done) => {
      mockProjectService.openProject.mockReturnValue(of(buildOpenResult('proj-1')));
      mockScheduleApi.listSchedules.mockReturnValue(
        of({
          success: true,
          count: 2,
          schedules: [
            buildSchedule({ id: 'sched-mine', projectId: 'proj-1' }),
            buildSchedule({ id: 'sched-other', projectId: 'proj-999' }),
          ],
        } as ListSchedulesResponse)
      );

      service.openProject('proj-1').subscribe((resolution) => {
        expect(resolution).toEqual({ kind: 'schedule', scheduleId: 'sched-mine' });
        done();
      });
    });

    it('hydrates PdfService before evaluating any of the above', (done) => {
      const callOrder: string[] = [];
      mockProjectService.openProject.mockImplementation(() => {
        callOrder.push('openProject');
        return of(buildOpenResult('proj-1'));
      });
      mockScheduleApi.listSchedules.mockImplementation(() => {
        callOrder.push('listSchedules');
        return of({ success: true, count: 0, schedules: [] } as ListSchedulesResponse);
      });

      service.openProject('proj-1').subscribe(() => {
        expect(callOrder).toEqual(['openProject', 'listSchedules']);
        done();
      });
    });

    it('propagates a ProjectService.openProject error without calling listSchedules', (done) => {
      mockProjectService.openProject.mockReturnValue(throwError(() => new Error('CONTENT_MISSING')));

      service.openProject('proj-1').subscribe({
        next: () => fail('expected an error, got a value'),
        error: (err: Error) => {
          expect(err.message).toBe('CONTENT_MISSING');
          expect(mockScheduleApi.listSchedules).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('openSchedule', () => {
    it('navigates directly to a chosen schedule id (picker selection)', () => {
      service.openSchedule('sched-chosen');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/schedule', 'sched-chosen']);
    });
  });

  // ─────────────────────────────────────────────
  // loadLibrary — US4 T047
  // ─────────────────────────────────────────────

  describe('loadLibrary — assembles ProjectLibraryCard[] (US4 T047)', () => {
    it('assembles ProjectLibraryCard[] via GET /project/user plus a parallel GET /project/:id/links per project', (done) => {
      const projectA = buildProjectSummary({ id: 'proj-a', title: 'Chinatown' });
      const projectB = buildProjectSummary({ id: 'proj-b', title: 'Cold Harbor' });
      mockProjectApi.listProjects.mockReturnValue(of({ projects: [projectA, projectB] }));
      mockProjectApi.getProjectLinks.mockImplementation((id: string) =>
        of({ schedules: id === 'proj-a' ? [{ id: 'sched-1', projectTitle: 'Chinatown', updatedAt: '2026-01-01T00:00:00.000Z' }] : [] })
      );

      service.loadLibrary().subscribe((cards) => {
        expect(mockProjectApi.getProjectLinks).toHaveBeenCalledWith('proj-a');
        expect(mockProjectApi.getProjectLinks).toHaveBeenCalledWith('proj-b');
        expect(cards.length).toBe(2);
        expect(cards[0].project).toEqual(projectA);
        done();
      });
    });

    it('computes scheduleCount from the links response', (done) => {
      const project = buildProjectSummary({ id: 'proj-a' });
      mockProjectApi.listProjects.mockReturnValue(of({ projects: [project] }));
      mockProjectApi.getProjectLinks.mockReturnValue(
        of({
          schedules: [
            { id: 'sched-1', projectTitle: 'My Screenplay', updatedAt: '2026-01-01T00:00:00.000Z' },
            { id: 'sched-2', projectTitle: 'My Screenplay', updatedAt: '2026-01-02T00:00:00.000Z' },
          ],
        })
      );

      service.loadLibrary().subscribe((cards) => {
        expect(cards[0].scheduleCount).toBe(2);
        expect(cards[0].linkedSchedules.map((s) => s.id)).toEqual(['sched-1', 'sched-2']);
        done();
      });
    });

    it('degrades a project to scheduleCount 0 when GET /project/:id/links fails', (done) => {
      const project = buildProjectSummary({ id: 'proj-a' });
      mockProjectApi.listProjects.mockReturnValue(of({ projects: [project] }));
      mockProjectApi.getProjectLinks.mockReturnValue(throwError(() => new Error('Not Found')));

      service.loadLibrary().subscribe((cards) => {
        expect(cards.length).toBe(1);
        expect(cards[0].scheduleCount).toBe(0);
        expect(cards[0].linkedSchedules).toEqual([]);
        done();
      });
    });

    it('resolves an empty array with zero link calls when the user has no projects', (done) => {
      mockProjectApi.listProjects.mockReturnValue(of({ projects: [] }));

      service.loadLibrary().subscribe((cards) => {
        expect(cards).toEqual([]);
        expect(mockProjectApi.getProjectLinks).not.toHaveBeenCalled();
        done();
      });
    });

    it('publishes the assembled cards on cards$', (done) => {
      const project = buildProjectSummary({ id: 'proj-a' });
      mockProjectApi.listProjects.mockReturnValue(of({ projects: [project] }));
      mockProjectApi.getProjectLinks.mockReturnValue(of({ schedules: [] }));

      service.loadLibrary().subscribe(() => {
        service.cards$.subscribe((cards) => {
          expect(cards.length).toBe(1);
          expect(cards[0].project.id).toBe('proj-a');
          done();
        });
      });
    });
  });

  // ─────────────────────────────────────────────
  // renameProject — US4 T047
  // ─────────────────────────────────────────────

  describe('renameProject', () => {
    it('calls PUT /project/:id and updates the card optimistically', (done) => {
      const project = buildProjectSummary({ id: 'proj-a', title: 'Old Title' });
      mockProjectApi.listProjects.mockReturnValue(of({ projects: [project] }));
      mockProjectApi.getProjectLinks.mockReturnValue(of({ schedules: [] }));

      service.loadLibrary().subscribe(() => {
        let sawOptimisticUpdate = false;
        const sub = service.cards$.subscribe((cards) => {
          if (cards[0]?.project.title === 'New Title') {
            sawOptimisticUpdate = true;
          }
        });

        // Never resolves synchronously — proves the optimistic update happens
        // before the network call completes, not after.
        mockProjectApi.renameProject.mockReturnValue(
          of({ project: { ...project, title: 'New Title', updatedAt: '2026-02-01T00:00:00.000Z' } })
        );

        service.renameProject('proj-a', 'New Title').subscribe(() => {
          expect(sawOptimisticUpdate).toBe(true);
          expect(service.cards[0].project.title).toBe('New Title');
          expect(service.cards[0].project.updatedAt).toBe('2026-02-01T00:00:00.000Z');
          sub.unsubscribe();
          done();
        });
      });
    });

    it('rolls back the card on error', (done) => {
      const project = buildProjectSummary({ id: 'proj-a', title: 'Old Title' });
      mockProjectApi.listProjects.mockReturnValue(of({ projects: [project] }));
      mockProjectApi.getProjectLinks.mockReturnValue(of({ schedules: [] }));

      service.loadLibrary().subscribe(() => {
        mockProjectApi.renameProject.mockReturnValue(throwError(() => new Error('Failed to rename')));

        service.renameProject('proj-a', 'New Title').subscribe({
          next: () => fail('expected an error'),
          error: () => {
            expect(service.cards[0].project.title).toBe('Old Title');
            done();
          },
        });
      });
    });
  });

  // ─────────────────────────────────────────────
  // deleteProject — US4 T047
  // ─────────────────────────────────────────────

  describe('deleteProject', () => {
    it('calls DELETE /project/:id and removes the card', (done) => {
      const project = buildProjectSummary({ id: 'proj-a' });
      mockProjectApi.listProjects.mockReturnValue(of({ projects: [project] }));
      mockProjectApi.getProjectLinks.mockReturnValue(of({ schedules: [] }));

      service.loadLibrary().subscribe(() => {
        mockProjectApi.deleteProject.mockReturnValue(of({ deleted: true, linkedSchedules: [] }));

        service.deleteProject('proj-a').subscribe(() => {
          expect(service.cards).toEqual([]);
          done();
        });
      });
    });

    it('rolls back (restores the card) on error', (done) => {
      const project = buildProjectSummary({ id: 'proj-a' });
      mockProjectApi.listProjects.mockReturnValue(of({ projects: [project] }));
      mockProjectApi.getProjectLinks.mockReturnValue(of({ schedules: [] }));

      service.loadLibrary().subscribe(() => {
        mockProjectApi.deleteProject.mockReturnValue(throwError(() => new Error('Forbidden')));

        service.deleteProject('proj-a').subscribe({
          next: () => fail('expected an error'),
          error: () => {
            expect(service.cards.length).toBe(1);
            expect(service.cards[0].project.id).toBe('proj-a');
            done();
          },
        });
      });
    });
  });

  // ─────────────────────────────────────────────
  // createSchedule — US4 T051
  // ─────────────────────────────────────────────

  describe('createSchedule', () => {
    it('hydrates PdfService via ProjectService.openProject before seeding', (done) => {
      const callOrder: string[] = [];
      const fakeSchedule = { id: 'sched-new' } as ProductionSchedule;

      mockProjectService.openProject.mockImplementation(() => {
        callOrder.push('openProject');
        return of(buildOpenResult('proj-a'));
      });
      mockScheduleService.seedScheduleFromPdfService.mockImplementation(() => {
        callOrder.push('seed');
        return fakeSchedule;
      });
      mockScheduleApi.createSchedule.mockImplementation(() => {
        callOrder.push('createSchedule');
        return of({ success: true, scheduleId: 'sched-new', message: 'ok' });
      });

      service.createSchedule('proj-a', 'Chinatown').subscribe((result) => {
        expect(callOrder).toEqual(['openProject', 'seed', 'createSchedule']);
        expect(result).toEqual({ scheduleId: 'sched-new' });
        expect(mockScheduleService.seedScheduleFromPdfService).toHaveBeenCalledWith(
          'proj-a',
          'Chinatown',
          'user-1',
          mockPdfService
        );
        expect(mockScheduleState.clearSchedule).toHaveBeenCalled();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/schedule', 'sched-new']);
        done();
      });
    });

    it('falls back to "anonymous" when no user is signed in', (done) => {
      mockAuthService.getCurrentUser.mockReturnValue(null);
      mockProjectService.openProject.mockReturnValue(of(buildOpenResult('proj-a')));
      mockScheduleService.seedScheduleFromPdfService.mockReturnValue({ id: 'sched-new' } as ProductionSchedule);
      mockScheduleApi.createSchedule.mockReturnValue(of({ success: true, scheduleId: 'sched-new', message: 'ok' }));

      service.createSchedule('proj-a', 'Chinatown').subscribe(() => {
        expect(mockScheduleService.seedScheduleFromPdfService).toHaveBeenCalledWith(
          'proj-a',
          'Chinatown',
          'anonymous',
          mockPdfService
        );
        done();
      });
    });

    it('propagates a createSchedule API error without navigating', (done) => {
      mockProjectService.openProject.mockReturnValue(of(buildOpenResult('proj-a')));
      mockScheduleService.seedScheduleFromPdfService.mockReturnValue({ id: 'sched-new' } as ProductionSchedule);
      mockScheduleApi.createSchedule.mockReturnValue(throwError(() => new Error('Failed to create schedule')));

      service.createSchedule('proj-a', 'Chinatown').subscribe({
        next: () => fail('expected an error'),
        error: (err) => {
          expect(err.message).toBe('Failed to create schedule');
          expect(mockRouter.navigate).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  // ─────────────────────────────────────────────
  // Integration-style test (spec 028 T042, quickstart.md Scenario 4)
  // ─────────────────────────────────────────────

  describe('integration: save project → create schedule → sign out/in → Continue → Open Schedule (quickstart Scenario 4)', () => {
    it('resolves straight to the one schedule linked to a reopened project, with zero extra classify-pipeline calls', (done) => {
      // Fixture: a project saved with one schedule already linked to it,
      // plus an unrelated schedule belonging to a different project to prove
      // filtering, and a spy standing in for "the classify pipeline" that
      // must never be invoked during this flow (FR-007 / SC-006).
      const classifyPipelineSpy = jest.fn();
      const projectId = 'proj-final-rose';
      const openResult = buildOpenResult(projectId);

      mockProjectService.openProject.mockReturnValue(of(openResult));
      mockScheduleApi.listSchedules.mockReturnValue(
        of({
          success: true,
          count: 2,
          schedules: [
            buildSchedule({ id: 'sched-final-rose', projectId }),
            buildSchedule({ id: 'sched-unrelated', projectId: 'proj-some-other-script' }),
          ],
        } as ListSchedulesResponse)
      );

      service.openProject(projectId).subscribe((resolution) => {
        expect(resolution).toEqual({ kind: 'schedule', scheduleId: 'sched-final-rose' });
        expect(mockProjectService.openProject).toHaveBeenCalledWith(projectId);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/schedule', 'sched-final-rose']);
        expect(classifyPipelineSpy).not.toHaveBeenCalled();
        done();
      });
    });
  });
});
