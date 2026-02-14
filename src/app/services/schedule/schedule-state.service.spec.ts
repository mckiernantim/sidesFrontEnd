import { ScheduleStateService } from './schedule-state.service';
import { ProductionSchedule, ShootDay, ScheduleScene, getDefaultScheduleSettings } from '../../types/Schedule';

// ─────────────────────────────────────────────
// Mock Factories
// ─────────────────────────────────────────────

function createMockScene(overrides: Partial<ScheduleScene> = {}): ScheduleScene {
  return {
    id: 'scene-001',
    sceneNumber: '1',
    sceneHeader: 'INT. KITCHEN - DAY',
    intExt: 'INT',
    location: 'KITCHEN',
    timeOfDay: 'DAY',
    pageCount: 2.5,
    scriptPageStart: 1,
    scriptPageEnd: 3,
    characters: [],
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
    id: 'schedule-001',
    projectId: 'project-001',
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

// ─────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────

describe('ScheduleStateService', () => {
  let service: ScheduleStateService;

  beforeEach(() => {
    service = new ScheduleStateService();
  });

  describe('initial state', () => {
    it('should start with null schedule', () => {
      expect(service.schedule).toBeNull();
    });

    it('should start with "sides" active tab', () => {
      expect(service.activeTab).toBe('sides');
    });

    it('should start as not dirty', () => {
      expect(service.isDirty).toBe(false);
    });

    it('should start as not saving', () => {
      expect(service.isSaving).toBe(false);
    });
  });

  describe('tab management', () => {
    it('should switch to schedule tab', () => {
      service.setActiveTab('schedule');
      expect(service.activeTab).toBe('schedule');
    });

    it('should switch back to sides tab', () => {
      service.setActiveTab('schedule');
      service.setActiveTab('sides');
      expect(service.activeTab).toBe('sides');
    });

    it('should emit tab changes via observable', (done) => {
      const emitted: string[] = [];
      service.activeTab$.subscribe(tab => {
        emitted.push(tab);
        if (emitted.length === 2) {
          expect(emitted).toEqual(['sides', 'schedule']);
          done();
        }
      });
      service.setActiveTab('schedule');
    });
  });

  describe('schedule CRUD', () => {
    it('should set a schedule', () => {
      const schedule = createMockSchedule();
      service.setSchedule(schedule);
      expect(service.schedule).toEqual(schedule);
    });

    it('should clear dirty flag when setting schedule', () => {
      service.markDirty();
      expect(service.isDirty).toBe(true);

      service.setSchedule(createMockSchedule());
      expect(service.isDirty).toBe(false);
    });

    it('should update schedule and mark dirty', () => {
      const schedule = createMockSchedule({ version: 1 });
      service.setSchedule(schedule);

      service.updateSchedule(schedule);
      expect(service.isDirty).toBe(true);
      expect(service.schedule!.version).toBe(2);
    });

    it('should update the updatedAt timestamp on update', () => {
      const schedule = createMockSchedule({ updatedAt: '2026-01-01T00:00:00Z' });
      service.setSchedule(schedule);

      service.updateSchedule(schedule);
      expect(service.schedule!.updatedAt).not.toBe('2026-01-01T00:00:00Z');
    });

    it('should clear schedule', () => {
      service.setSchedule(createMockSchedule());
      service.clearSchedule();
      expect(service.schedule).toBeNull();
      expect(service.isDirty).toBe(false);
    });

    it('should emit schedule changes via observable', (done) => {
      const emitted: (ProductionSchedule | null)[] = [];
      service.schedule$.subscribe(s => {
        emitted.push(s);
        if (emitted.length === 3) {
          expect(emitted[0]).toBeNull();
          expect(emitted[1]!.projectTitle).toBe('NEXT DOOR');
          expect(emitted[2]).toBeNull();
          done();
        }
      });
      service.setSchedule(createMockSchedule());
      service.clearSchedule();
    });
  });

  describe('moveSceneToDay', () => {
    it('should move a scene from unscheduled to a shoot day', () => {
      const scene = createMockScene({ id: 'scene-A', estimatedTimeInFifteenMin: 4, pageCount: 2 });
      const day = createMockDay({ id: 'day-1' });
      const schedule = createMockSchedule({
        unscheduledScenes: [scene],
        shootDays: [day],
      });
      service.setSchedule(schedule);

      service.moveSceneToDay('scene-A', 'day-1', 0);

      const updated = service.schedule!;
      expect(updated.unscheduledScenes.length).toBe(0);
      expect(updated.shootDays[0].scenes.length).toBe(1);
      expect(updated.shootDays[0].scenes[0].id).toBe('scene-A');
      expect(updated.shootDays[0].scenes[0].shootDayId).toBe('day-1');
      expect(updated.shootDays[0].estimatedTotalTime).toBe(4);
      expect(updated.shootDays[0].estimatedPageCount).toBe(2);
    });

    it('should insert at the correct position', () => {
      const existingScene = createMockScene({ id: 'scene-existing', estimatedTimeInFifteenMin: 2, pageCount: 1 });
      const newScene = createMockScene({ id: 'scene-new', estimatedTimeInFifteenMin: 4, pageCount: 2 });
      const day = createMockDay({
        id: 'day-1',
        scenes: [existingScene],
        estimatedTotalTime: 2,
        estimatedPageCount: 1,
      });
      const schedule = createMockSchedule({
        unscheduledScenes: [newScene],
        shootDays: [day],
      });
      service.setSchedule(schedule);

      service.moveSceneToDay('scene-new', 'day-1', 0); // Insert at beginning

      const updated = service.schedule!;
      expect(updated.shootDays[0].scenes[0].id).toBe('scene-new');
      expect(updated.shootDays[0].scenes[1].id).toBe('scene-existing');
      expect(updated.shootDays[0].scenes[0].orderInDay).toBe(0);
      expect(updated.shootDays[0].scenes[1].orderInDay).toBe(1);
    });

    it('should not modify schedule if scene not found', () => {
      const schedule = createMockSchedule({
        unscheduledScenes: [],
        shootDays: [createMockDay()],
      });
      service.setSchedule(schedule);

      service.moveSceneToDay('nonexistent', 'day-001', 0);
      // Version shouldn't change since no update happened
      expect(service.schedule!.version).toBe(1);
    });

    it('should mark schedule as dirty', () => {
      const scene = createMockScene({ id: 'scene-A' });
      const day = createMockDay({ id: 'day-1' });
      const schedule = createMockSchedule({
        unscheduledScenes: [scene],
        shootDays: [day],
      });
      service.setSchedule(schedule);

      service.moveSceneToDay('scene-A', 'day-1', 0);
      expect(service.isDirty).toBe(true);
    });
  });

  describe('moveSceneBetweenDays', () => {
    it('should move a scene between two days', () => {
      const scene = createMockScene({ id: 'scene-A', shootDayId: 'day-1', estimatedTimeInFifteenMin: 4, pageCount: 2 });
      const day1 = createMockDay({ id: 'day-1', scenes: [scene], estimatedTotalTime: 4, estimatedPageCount: 2 });
      const day2 = createMockDay({ id: 'day-2' });
      const schedule = createMockSchedule({ shootDays: [day1, day2] });
      service.setSchedule(schedule);

      service.moveSceneBetweenDays('scene-A', 'day-1', 'day-2', 0);

      const updated = service.schedule!;
      expect(updated.shootDays[0].scenes.length).toBe(0);
      expect(updated.shootDays[1].scenes.length).toBe(1);
      expect(updated.shootDays[1].scenes[0].shootDayId).toBe('day-2');
      expect(updated.shootDays[0].estimatedTotalTime).toBe(0);
      expect(updated.shootDays[1].estimatedTotalTime).toBe(4);
    });

    it('should reorder within the same day', () => {
      const sceneA = createMockScene({ id: 'A', sceneNumber: '1', estimatedTimeInFifteenMin: 2, pageCount: 1 });
      const sceneB = createMockScene({ id: 'B', sceneNumber: '2', estimatedTimeInFifteenMin: 4, pageCount: 2 });
      const sceneC = createMockScene({ id: 'C', sceneNumber: '3', estimatedTimeInFifteenMin: 6, pageCount: 3 });
      const day = createMockDay({ id: 'day-1', scenes: [sceneA, sceneB, sceneC] });
      const schedule = createMockSchedule({ shootDays: [day] });
      service.setSchedule(schedule);

      // Move C to position 0
      service.moveSceneBetweenDays('C', 'day-1', 'day-1', 0);

      const updated = service.schedule!;
      expect(updated.shootDays[0].scenes[0].id).toBe('C');
      expect(updated.shootDays[0].scenes[1].id).toBe('A');
      expect(updated.shootDays[0].scenes[2].id).toBe('B');
    });
  });

  describe('moveSceneToUnscheduled', () => {
    it('should move a scene back to unscheduled', () => {
      const scene = createMockScene({ id: 'scene-A', shootDayId: 'day-1', estimatedTimeInFifteenMin: 4, pageCount: 2 });
      const day = createMockDay({ id: 'day-1', scenes: [scene], estimatedTotalTime: 4, estimatedPageCount: 2 });
      const schedule = createMockSchedule({ shootDays: [day], unscheduledScenes: [] });
      service.setSchedule(schedule);

      service.moveSceneToUnscheduled('scene-A', 'day-1');

      const updated = service.schedule!;
      expect(updated.shootDays[0].scenes.length).toBe(0);
      expect(updated.unscheduledScenes.length).toBe(1);
      expect(updated.unscheduledScenes[0].shootDayId).toBeUndefined();
      expect(updated.unscheduledScenes[0].orderInDay).toBeUndefined();
    });

    it('should recalculate day totals after removal', () => {
      const sceneA = createMockScene({ id: 'A', estimatedTimeInFifteenMin: 4, pageCount: 2 });
      const sceneB = createMockScene({ id: 'B', estimatedTimeInFifteenMin: 8, pageCount: 5 });
      const day = createMockDay({
        id: 'day-1',
        scenes: [sceneA, sceneB],
        estimatedTotalTime: 12,
        estimatedPageCount: 7,
      });
      const schedule = createMockSchedule({ shootDays: [day] });
      service.setSchedule(schedule);

      service.moveSceneToUnscheduled('A', 'day-1');

      const updated = service.schedule!;
      expect(updated.shootDays[0].estimatedTotalTime).toBe(8);
      expect(updated.shootDays[0].estimatedPageCount).toBe(5);
    });
  });

  describe('shoot day management', () => {
    it('should add a shoot day', () => {
      service.setSchedule(createMockSchedule());

      const newDay = createMockDay({ id: 'day-new', dayNumber: 1 });
      service.addShootDay(newDay);

      expect(service.schedule!.shootDays.length).toBe(1);
      expect(service.schedule!.shootDays[0].id).toBe('day-new');
    });

    it('should remove a shoot day and move scenes to unscheduled', () => {
      const scene = createMockScene({ id: 'scene-A', shootDayId: 'day-1' });
      const day = createMockDay({ id: 'day-1', scenes: [scene] });
      const schedule = createMockSchedule({ shootDays: [day] });
      service.setSchedule(schedule);

      service.removeShootDay('day-1');

      const updated = service.schedule!;
      expect(updated.shootDays.length).toBe(0);
      expect(updated.unscheduledScenes.length).toBe(1);
      expect(updated.unscheduledScenes[0].shootDayId).toBeUndefined();
    });

    it('should not modify schedule if day not found', () => {
      const schedule = createMockSchedule({ shootDays: [createMockDay()] });
      service.setSchedule(schedule);

      service.removeShootDay('nonexistent');
      expect(service.schedule!.shootDays.length).toBe(1);
    });
  });

  describe('save state management', () => {
    it('should set saving state', () => {
      service.setSaving(true);
      expect(service.isSaving).toBe(true);

      service.setSaving(false);
      expect(service.isSaving).toBe(false);
    });

    it('should mark as saved', () => {
      service.markDirty();
      service.setSaving(true);

      service.markSaved();
      expect(service.isDirty).toBe(false);
      expect(service.isSaving).toBe(false);
    });

    it('should emit lastSavedAt on markSaved', (done) => {
      const emitted: (string | null)[] = [];
      service.lastSavedAt$.subscribe(ts => {
        emitted.push(ts);
        if (emitted.length === 2) {
          expect(emitted[0]).toBeNull();
          expect(emitted[1]).not.toBeNull();
          done();
        }
      });
      service.markSaved();
    });

    it('should mark as dirty', () => {
      service.markDirty();
      expect(service.isDirty).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should not crash on moveSceneToDay with null schedule', () => {
      expect(() => service.moveSceneToDay('x', 'y', 0)).not.toThrow();
    });

    it('should not crash on moveSceneBetweenDays with null schedule', () => {
      expect(() => service.moveSceneBetweenDays('x', 'y', 'z', 0)).not.toThrow();
    });

    it('should not crash on moveSceneToUnscheduled with null schedule', () => {
      expect(() => service.moveSceneToUnscheduled('x', 'y')).not.toThrow();
    });

    it('should not crash on addShootDay with null schedule', () => {
      expect(() => service.addShootDay(createMockDay())).not.toThrow();
    });

    it('should not crash on removeShootDay with null schedule', () => {
      expect(() => service.removeShootDay('x')).not.toThrow();
    });
  });
});
