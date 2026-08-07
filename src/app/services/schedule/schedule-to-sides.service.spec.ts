import { of } from 'rxjs';
import { ScheduleToSidesService } from './schedule-to-sides.service';
import { PdfService } from '../pdf/pdf.service';
import { ProjectService } from '../project/project.service';
import {
  ProductionSchedule,
  ScheduleScene,
  ShootDay,
  getDefaultScheduleSettings,
} from '../../types/Schedule';

function createMockScene(overrides: Partial<ScheduleScene> = {}): ScheduleScene {
  return {
    id: 'scene-001',
    sceneNumber: '1',
    sceneHeader: 'INT. KITCHEN - DAY',
    intExt: 'INT',
    location: 'KITCHEN',
    timeOfDay: 'DAY',
    pageCount: 2,
    scriptPageStart: 1,
    scriptPageEnd: 3,
    characters: [],
    descriptions: [],
    oneLiner: '',
    oneLinerSource: 'manual',
    oneLinerEdited: false,
    estimatedTimeInFifteenMin: 4,
    stripColor: '#3B82F6',
    isOmitted: false,
    needsNight: false,
    hasStunts: false,
    hasEffects: false,
    hasVehicles: false,
    departmentNotes: [],
    ...overrides,
  };
}

function createMockDay(overrides: Partial<ShootDay> = {}): ShootDay {
  return {
    id: 'day-001',
    dayNumber: 1,
    primaryLocation: 'STUDIO A',
    secondaryLocations: [],
    scenes: [],
    castRequired: [],
    estimatedPageCount: 0,
    estimatedTotalTime: 0,
    notes: '',
    ...overrides,
  };
}

function createMockSchedule(overrides: Partial<ProductionSchedule> = {}): ProductionSchedule {
  return {
    id: 'sched-001',
    projectId: 'real-project-id-123',
    projectTitle: 'NEXT DOOR',
    userId: 'user-abc',
    createdAt: '2026-02-08T12:00:00Z',
    updatedAt: '2026-02-08T12:00:00Z',
    version: 1,
    shootDays: [],
    unscheduledScenes: [],
    castMembers: [],
    locations: [],
    settings: getDefaultScheduleSettings(),
    oneLinerMode: 'ai',
    ...overrides,
  };
}

// Canonical PdfService scene shape — deliberately NOT ScheduleScene (research D7):
// carries index/docPageIndex/sceneNumberText, not sceneNumber/location/etc.
function createCanonicalScene(sceneNumberText: string, index: number) {
  return {
    index,
    docPageIndex: index,
    sceneNumberText,
    category: 'scene-header',
    text: `INT. LOCATION ${sceneNumberText} - DAY`,
  };
}

describe('ScheduleToSidesService', () => {
  let service: ScheduleToSidesService;
  let pdfServiceMock: Partial<PdfService> & { allLines: any[]; scenes: any[] };
  let projectServiceMock: Partial<ProjectService>;
  let canonicalScenes: any[];

  beforeEach(() => {
    canonicalScenes = [
      createCanonicalScene('1', 0),
      createCanonicalScene('2', 10),
      createCanonicalScene('3', 20),
    ];

    pdfServiceMock = {
      allLines: [{ index: 0 }, { index: 1 }],
      scenes: canonicalScenes,
      getScenes: jest.fn(),
      setSelectedScenes: jest.fn(),
    };

    projectServiceMock = {
      activeProjectId: 'real-project-id-123',
      openProject: jest.fn().mockReturnValue(of({ project: {}, content: {} } as any)),
    };

    service = new ScheduleToSidesService(
      pdfServiceMock as PdfService,
      projectServiceMock as ProjectService
    );
  });

  it('matches day scenes to canonical PdfService scenes by sceneNumber, preserving strip-board order', (done) => {
    const day = createMockDay({
      scenes: [
        createMockScene({ sceneNumber: '3' }),
        createMockScene({ sceneNumber: '1' }),
        createMockScene({ sceneNumber: '2' }),
      ],
    });
    const schedule = createMockSchedule();

    service.generateSidesForDay(day, schedule).subscribe((result) => {
      expect(result.success).toBeTrue();
      expect(result.matchedScenes.map((s) => s.sceneNumberText)).toEqual(['3', '1', '2']);
      done();
    });
  });

  it('surfaces a clear error naming any scene numbers that fail to match, without generating a partial/wrong PDF', (done) => {
    const day = createMockDay({
      scenes: [
        createMockScene({ sceneNumber: '1' }),
        createMockScene({ sceneNumber: '99' }),
      ],
    });
    const schedule = createMockSchedule();

    service.generateSidesForDay(day, schedule).subscribe((result) => {
      expect(result.success).toBeFalse();
      expect(result.errorMessage).toContain('99');
      expect(pdfServiceMock.setSelectedScenes).not.toHaveBeenCalled();
      done();
    });
  });

  it('calls pdf.setSelectedScenes with the matched scenes in day order', (done) => {
    const day = createMockDay({
      scenes: [
        createMockScene({ sceneNumber: '2' }),
        createMockScene({ sceneNumber: '3' }),
      ],
    });
    const schedule = createMockSchedule();

    service.generateSidesForDay(day, schedule).subscribe(() => {
      expect(pdfServiceMock.setSelectedScenes).toHaveBeenCalledWith([
        canonicalScenes[1],
        canonicalScenes[2],
      ]);
      done();
    });
  });

  it('produces the same selected-scene array as a manual dashboard multi-select of the same scenes in the same order', (done) => {
    // A manual dashboard multi-select just pushes each clicked canonical scene, in click order.
    const manualClickOrder = ['2', '1'];
    const manualSelection = manualClickOrder.map((num) =>
      canonicalScenes.find((c) => c.sceneNumberText === num)
    );

    const day = createMockDay({
      scenes: [
        createMockScene({ sceneNumber: '2' }),
        createMockScene({ sceneNumber: '1' }),
      ],
    });
    const schedule = createMockSchedule();

    service.generateSidesForDay(day, schedule).subscribe((result) => {
      expect(result.matchedScenes).toEqual(manualSelection);
      done();
    });
  });

  it('does nothing and shows a clear message for a day with zero scenes', (done) => {
    const day = createMockDay({ scenes: [] });
    const schedule = createMockSchedule();

    service.generateSidesForDay(day, schedule).subscribe((result) => {
      expect(result.success).toBeFalse();
      expect(result.errorMessage).toBeTruthy();
      expect(pdfServiceMock.getScenes).not.toHaveBeenCalled();
      expect(pdfServiceMock.setSelectedScenes).not.toHaveBeenCalled();
      expect(projectServiceMock.openProject).not.toHaveBeenCalled();
      done();
    });
  });

  it('does nothing and shows a clear message for a legacy (non-project-linked) schedule', (done) => {
    const day = createMockDay({ scenes: [createMockScene({ sceneNumber: '1' })] });
    const schedule = createMockSchedule({ projectId: 'proj-1699999999999' });

    service.generateSidesForDay(day, schedule).subscribe((result) => {
      expect(result.success).toBeFalse();
      expect(result.errorMessage).toBeTruthy();
      expect(pdfServiceMock.getScenes).not.toHaveBeenCalled();
      expect(pdfServiceMock.setSelectedScenes).not.toHaveBeenCalled();
      expect(projectServiceMock.openProject).not.toHaveBeenCalled();
      done();
    });
  });

  it('hydrates via ProjectService.openProject() when PdfService is not already hydrated for this schedule\'s project (research D7)', (done) => {
    pdfServiceMock.allLines = [];
    projectServiceMock.activeProjectId = 'some-other-project';

    const day = createMockDay({ scenes: [createMockScene({ sceneNumber: '1' })] });
    const schedule = createMockSchedule({ projectId: 'real-project-id-123' });

    service.generateSidesForDay(day, schedule).subscribe((result) => {
      expect(projectServiceMock.openProject).toHaveBeenCalledWith('real-project-id-123');
      expect(result.success).toBeTrue();
      done();
    });
  });

  it('does not re-hydrate when PdfService already matches the schedule\'s active project', (done) => {
    const day = createMockDay({ scenes: [createMockScene({ sceneNumber: '1' })] });
    const schedule = createMockSchedule({ projectId: 'real-project-id-123' });

    service.generateSidesForDay(day, schedule).subscribe(() => {
      expect(projectServiceMock.openProject).not.toHaveBeenCalled();
      done();
    });
  });
});
