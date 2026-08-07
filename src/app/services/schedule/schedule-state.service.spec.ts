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

    it('refreshes the target day title/primaryLocation/secondaryLocations (spec 031)', () => {
      const scene = createMockScene({ id: 'scene-A', location: 'KITCHEN' });
      const day = createMockDay({ id: 'day-1', dayNumber: 1, label: 'Day 1', primaryLocation: '', secondaryLocations: [] });
      const schedule = createMockSchedule({ unscheduledScenes: [scene], shootDays: [day] });
      service.setSchedule(schedule);

      service.moveSceneToDay('scene-A', 'day-1', 0);

      const updatedDay = service.schedule!.shootDays[0];
      expect(updatedDay.label).toBe('KITCHEN');
      expect(updatedDay.primaryLocation).toBe('KITCHEN');
      expect(updatedDay.secondaryLocations).toEqual([]);
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

    it('refreshes both source and target day titles after a cross-day move (spec 031)', () => {
      const scene = createMockScene({ id: 'scene-A', location: 'KITCHEN' });
      const day1 = createMockDay({ id: 'day-1', dayNumber: 1, scenes: [scene] });
      const day2 = createMockDay({ id: 'day-2', dayNumber: 2, scenes: [createMockScene({ id: 'scene-B', location: 'PARK' })] });
      const schedule = createMockSchedule({ shootDays: [day1, day2] });
      service.setSchedule(schedule);

      service.moveSceneBetweenDays('scene-A', 'day-1', 'day-2', 1);

      const updated = service.schedule!;
      expect(updated.shootDays[0].label).toBe('Day 1');
      expect(updated.shootDays[0].primaryLocation).toBe('');
      expect(updated.shootDays[1].label).toBe('PARK → KITCHEN');
      expect(updated.shootDays[1].primaryLocation).toBe('PARK');
      expect(updated.shootDays[1].secondaryLocations).toEqual(['KITCHEN']);
    });

    it('refreshes the day title after reordering scenes within the same day (spec 031)', () => {
      const sceneA = createMockScene({ id: 'A', location: 'KITCHEN' });
      const sceneB = createMockScene({ id: 'B', location: 'PARK' });
      const day = createMockDay({ id: 'day-1', dayNumber: 1, scenes: [sceneA, sceneB] });
      const schedule = createMockSchedule({ shootDays: [day] });
      service.setSchedule(schedule);

      service.moveSceneBetweenDays('B', 'day-1', 'day-1', 0);

      expect(service.schedule!.shootDays[0].label).toBe('PARK → KITCHEN');
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

    it('refreshes the source day title after removing a scene (spec 031)', () => {
      const sceneA = createMockScene({ id: 'A', location: 'KITCHEN' });
      const sceneB = createMockScene({ id: 'B', location: 'PARK' });
      const day = createMockDay({ id: 'day-1', dayNumber: 1, scenes: [sceneA, sceneB] });
      const schedule = createMockSchedule({ shootDays: [day] });
      service.setSchedule(schedule);

      service.moveSceneToUnscheduled('A', 'day-1');

      const updatedDay = service.schedule!.shootDays[0];
      expect(updatedDay.label).toBe('PARK');
      expect(updatedDay.primaryLocation).toBe('PARK');
      expect(updatedDay.secondaryLocations).toEqual([]);
    });

    it('resets the day title to "Day N" once the last scene is removed (spec 031)', () => {
      const scene = createMockScene({ id: 'A', location: 'KITCHEN' });
      const day = createMockDay({ id: 'day-1', dayNumber: 4, scenes: [scene] });
      const schedule = createMockSchedule({ shootDays: [day] });
      service.setSchedule(schedule);

      service.moveSceneToUnscheduled('A', 'day-1');

      expect(service.schedule!.shootDays[0].label).toBe('Day 4');
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

  describe('updateSceneOneLiner', () => {
    it('should update one-liner on a scene in a shoot day', () => {
      const scene = createMockScene({ id: 'scene-A', oneLiner: '', oneLinerSource: 'manual', oneLinerEdited: false });
      const day = createMockDay({ id: 'day-1', scenes: [scene] });
      const schedule = createMockSchedule({ shootDays: [day] });
      service.setSchedule(schedule);

      service.updateSceneOneLiner('scene-A', 'John discovers the letter.', 'manual');

      const updated = service.schedule!;
      const updatedScene = updated.shootDays[0].scenes[0];
      expect(updatedScene.oneLiner).toBe('John discovers the letter.');
      expect(updatedScene.oneLinerSource).toBe('manual');
      expect(updatedScene.oneLinerEdited).toBe(true);
    });

    it('should update one-liner on an unscheduled scene', () => {
      const scene = createMockScene({ id: 'scene-B', oneLiner: '' });
      const schedule = createMockSchedule({ unscheduledScenes: [scene] });
      service.setSchedule(schedule);

      service.updateSceneOneLiner('scene-B', 'Mary confronts the detective.', 'manual');

      const updated = service.schedule!;
      expect(updated.unscheduledScenes[0].oneLiner).toBe('Mary confronts the detective.');
      expect(updated.unscheduledScenes[0].oneLinerEdited).toBe(true);
    });

    it('should set oneLinerEdited=false for AI-generated one-liners', () => {
      const scene = createMockScene({ id: 'scene-A', oneLinerEdited: true });
      const day = createMockDay({ id: 'day-1', scenes: [scene] });
      const schedule = createMockSchedule({ shootDays: [day] });
      service.setSchedule(schedule);

      service.updateSceneOneLiner('scene-A', 'AI generated text.', 'ai');

      const updatedScene = service.schedule!.shootDays[0].scenes[0];
      expect(updatedScene.oneLinerSource).toBe('ai');
      expect(updatedScene.oneLinerEdited).toBe(false);
    });

    it('should mark schedule as dirty after one-liner change', () => {
      const scene = createMockScene({ id: 'scene-A' });
      const day = createMockDay({ id: 'day-1', scenes: [scene] });
      const schedule = createMockSchedule({ shootDays: [day] });
      service.setSchedule(schedule);

      service.updateSceneOneLiner('scene-A', 'New text', 'manual');

      expect(service.isDirty).toBe(true);
    });

    it('should not modify other scenes', () => {
      const sceneA = createMockScene({ id: 'A', oneLiner: 'Original A' });
      const sceneB = createMockScene({ id: 'B', oneLiner: 'Original B' });
      const day = createMockDay({ id: 'day-1', scenes: [sceneA, sceneB] });
      const schedule = createMockSchedule({ shootDays: [day] });
      service.setSchedule(schedule);

      service.updateSceneOneLiner('A', 'Updated A', 'manual');

      expect(service.schedule!.shootDays[0].scenes[1].oneLiner).toBe('Original B');
    });

    it('should not crash with null schedule', () => {
      expect(() => service.updateSceneOneLiner('x', 'text', 'manual')).not.toThrow();
    });
  });

  describe('updateSceneHeader (spec 032 US2)', () => {
    it('updates sceneHeader and re-parses intExt/location/timeOfDay on an unscheduled scene', () => {
      const scene = createMockScene({ id: 'scene-A', sceneHeader: 'INT. KITCHEN - DAY' });
      const schedule = createMockSchedule({ unscheduledScenes: [scene] });
      service.setSchedule(schedule);

      service.updateSceneHeader('scene-A', 'EXT. BACKYARD - NIGHT');

      const updated = service.schedule!.unscheduledScenes[0];
      expect(updated.sceneHeader).toBe('EXT. BACKYARD - NIGHT');
      expect(updated.intExt).toBe('EXT');
      expect(updated.location).toBe('BACKYARD');
      expect(updated.timeOfDay).toBe('NIGHT');
      expect(updated.needsNight).toBe(true);
    });

    it('updates a scene inside a shoot day and refreshes the day title', () => {
      const scene = createMockScene({ id: 'scene-A', sceneHeader: 'INT. KITCHEN - DAY' });
      const day = createMockDay({ id: 'day-1', scenes: [scene] });
      const schedule = createMockSchedule({ shootDays: [day] });
      service.setSchedule(schedule);

      service.updateSceneHeader('scene-A', 'EXT. RANCH - DAY');

      const updatedDay = service.schedule!.shootDays[0];
      const updatedScene = updatedDay.scenes[0];
      expect(updatedScene.sceneHeader).toBe('EXT. RANCH - DAY');
      expect(updatedScene.location).toBe('RANCH');
      expect(updatedDay.primaryLocation).toBe('RANCH');
    });

    it('recomputes stripColor from the new intExt/timeOfDay', () => {
      const scene = createMockScene({ id: 'scene-A', sceneHeader: 'INT. KITCHEN - DAY', stripColor: '#3B82F6' });
      const schedule = createMockSchedule({ unscheduledScenes: [scene] });
      service.setSchedule(schedule);

      service.updateSceneHeader('scene-A', 'EXT. RANCH - NIGHT');

      expect(service.schedule!.unscheduledScenes[0].stripColor).toBe('#F97316');
    });

    it('marks the schedule dirty', () => {
      const scene = createMockScene({ id: 'scene-A' });
      const schedule = createMockSchedule({ unscheduledScenes: [scene] });
      service.setSchedule(schedule);

      service.updateSceneHeader('scene-A', 'EXT. RANCH - DAY');

      expect(service.isDirty).toBe(true);
    });

    it('reverts (no-ops) when the new text trims to empty', () => {
      const scene = createMockScene({ id: 'scene-A', sceneHeader: 'INT. KITCHEN - DAY' });
      const schedule = createMockSchedule({ unscheduledScenes: [scene] });
      service.setSchedule(schedule);

      service.updateSceneHeader('scene-A', '   ');

      expect(service.schedule!.unscheduledScenes[0].sceneHeader).toBe('INT. KITCHEN - DAY');
      expect(service.isDirty).toBe(false);
    });

    it('does not modify other scenes', () => {
      const sceneA = createMockScene({ id: 'A', sceneHeader: 'INT. KITCHEN - DAY' });
      const sceneB = createMockScene({ id: 'B', sceneHeader: 'INT. HALLWAY - DAY' });
      const day = createMockDay({ id: 'day-1', scenes: [sceneA, sceneB] });
      const schedule = createMockSchedule({ shootDays: [day] });
      service.setSchedule(schedule);

      service.updateSceneHeader('A', 'EXT. RANCH - DAY');

      expect(service.schedule!.shootDays[0].scenes[1].sceneHeader).toBe('INT. HALLWAY - DAY');
    });

    it('should not crash with null schedule', () => {
      expect(() => service.updateSceneHeader('x', 'EXT. RANCH - DAY')).not.toThrow();
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

  describe('sortUnscheduledScenes', () => {
    it('reorders the unscheduled pool by the given mode', () => {
      const sceneA = createMockScene({ id: 'A', location: 'BACKYARD' });
      const sceneB = createMockScene({ id: 'B', location: 'APARTMENT' });
      const schedule = createMockSchedule({ unscheduledScenes: [sceneA, sceneB] });
      service.setSchedule(schedule);

      service.sortUnscheduledScenes('location');

      expect(service.schedule!.unscheduledScenes.map(s => s.id)).toEqual(['B', 'A']);
    });

    it('leaves shoot days untouched', () => {
      const daySceneA = createMockScene({ id: 'day-scene-A', location: 'Z LOCATION' });
      const day = createMockDay({ id: 'day-1', scenes: [daySceneA] });
      const sceneA = createMockScene({ id: 'A', location: 'BACKYARD' });
      const sceneB = createMockScene({ id: 'B', location: 'APARTMENT' });
      const schedule = createMockSchedule({ unscheduledScenes: [sceneA, sceneB], shootDays: [day] });
      service.setSchedule(schedule);

      service.sortUnscheduledScenes('location');

      expect(service.schedule!.shootDays[0].scenes.map(s => s.id)).toEqual(['day-scene-A']);
    });

    it('preserves one-liner text for every scene', () => {
      const sceneA = createMockScene({ id: 'A', location: 'BACKYARD', oneLiner: 'Alice runs.' });
      const sceneB = createMockScene({ id: 'B', location: 'APARTMENT', oneLiner: 'Bob hides.' });
      const schedule = createMockSchedule({ unscheduledScenes: [sceneA, sceneB] });
      service.setSchedule(schedule);

      service.sortUnscheduledScenes('location');

      const byId = new Map(service.schedule!.unscheduledScenes.map(s => [s.id, s]));
      expect(byId.get('A')!.oneLiner).toBe('Alice runs.');
      expect(byId.get('B')!.oneLiner).toBe('Bob hides.');
    });

    it('marks schedule as dirty', () => {
      const schedule = createMockSchedule({
        unscheduledScenes: [createMockScene({ id: 'A' }), createMockScene({ id: 'B' })],
      });
      service.setSchedule(schedule);

      service.sortUnscheduledScenes('script');

      expect(service.isDirty).toBe(true);
    });

    it('is a no-op when the unscheduled pool is empty', () => {
      const schedule = createMockSchedule({ unscheduledScenes: [] });
      service.setSchedule(schedule);

      service.sortUnscheduledScenes('script');

      expect(service.isDirty).toBe(false);
      expect(service.schedule!.version).toBe(1);
    });

    it('does not crash with null schedule', () => {
      expect(() => service.sortUnscheduledScenes('script')).not.toThrow();
    });
  });

  describe('sortShootDay', () => {
    it('reorders only the target day scenes and reindexes orderInDay', () => {
      const dayScene1 = createMockScene({ id: 'D1', location: 'ZOO', orderInDay: 0 });
      const dayScene2 = createMockScene({ id: 'D2', location: 'ATTIC', orderInDay: 1 });
      const day = createMockDay({ id: 'day-1', scenes: [dayScene1, dayScene2] });
      const schedule = createMockSchedule({ shootDays: [day] });
      service.setSchedule(schedule);

      service.sortShootDay('day-1', 'location');

      const sorted = service.schedule!.shootDays[0].scenes;
      expect(sorted.map(s => s.id)).toEqual(['D2', 'D1']);
      expect(sorted[0].orderInDay).toBe(0);
      expect(sorted[1].orderInDay).toBe(1);
    });

    it('does not move scenes across days', () => {
      const day1Scene = createMockScene({ id: 'day1-scene', location: 'ZOO' });
      const day2Scene = createMockScene({ id: 'day2-scene', location: 'ATTIC' });
      const day1 = createMockDay({ id: 'day-1', scenes: [day1Scene] });
      const day2 = createMockDay({ id: 'day-2', scenes: [day2Scene] });
      const schedule = createMockSchedule({ shootDays: [day1, day2] });
      service.setSchedule(schedule);

      service.sortShootDay('day-1', 'location');

      expect(service.schedule!.shootDays[0].scenes.map(s => s.id)).toEqual(['day1-scene']);
      expect(service.schedule!.shootDays[1].scenes.map(s => s.id)).toEqual(['day2-scene']);
    });

    it('leaves other days and the unscheduled pool untouched', () => {
      const unscheduled = createMockScene({ id: 'unsched', location: 'Z LOCATION' });
      const day1Scene = createMockScene({ id: 'd1', location: 'ZOO' });
      const day2Scene1 = createMockScene({ id: 'd2-1', location: 'ZOO' });
      const day2Scene2 = createMockScene({ id: 'd2-2', location: 'ATTIC' });
      const day1 = createMockDay({ id: 'day-1', scenes: [day1Scene] });
      const day2 = createMockDay({ id: 'day-2', scenes: [day2Scene1, day2Scene2] });
      const schedule = createMockSchedule({
        unscheduledScenes: [unscheduled],
        shootDays: [day1, day2],
      });
      service.setSchedule(schedule);

      service.sortShootDay('day-1', 'location');

      expect(service.schedule!.unscheduledScenes.map(s => s.id)).toEqual(['unsched']);
      expect(service.schedule!.shootDays[1].scenes.map(s => s.id)).toEqual(['d2-1', 'd2-2']);
    });

    it('marks schedule as dirty', () => {
      const day = createMockDay({
        id: 'day-1',
        scenes: [createMockScene({ id: 'A' }), createMockScene({ id: 'B' })],
      });
      const schedule = createMockSchedule({ shootDays: [day] });
      service.setSchedule(schedule);

      service.sortShootDay('day-1', 'script');

      expect(service.isDirty).toBe(true);
    });

    it('is a no-op for an empty day', () => {
      const schedule = createMockSchedule({ shootDays: [createMockDay({ id: 'day-1', scenes: [] })] });
      service.setSchedule(schedule);

      service.sortShootDay('day-1', 'script');

      expect(service.isDirty).toBe(false);
    });

    it('is a no-op when the day does not exist', () => {
      const schedule = createMockSchedule({ shootDays: [createMockDay({ id: 'day-1' })] });
      service.setSchedule(schedule);

      expect(() => service.sortShootDay('nonexistent', 'script')).not.toThrow();
      expect(service.isDirty).toBe(false);
    });

    it('does not crash with null schedule', () => {
      expect(() => service.sortShootDay('day-1', 'script')).not.toThrow();
    });

    it('refreshes the day title to match the new scene order (spec 031)', () => {
      const dayScene1 = createMockScene({ id: 'D1', location: 'ZOO' });
      const dayScene2 = createMockScene({ id: 'D2', location: 'ATTIC' });
      const day = createMockDay({ id: 'day-1', dayNumber: 1, scenes: [dayScene1, dayScene2] });
      const schedule = createMockSchedule({ shootDays: [day] });
      service.setSchedule(schedule);

      service.sortShootDay('day-1', 'location');

      const updatedDay = service.schedule!.shootDays[0];
      expect(updatedDay.label).toBe('ATTIC → ZOO');
      expect(updatedDay.primaryLocation).toBe('ATTIC');
      expect(updatedDay.secondaryLocations).toEqual(['ZOO']);
    });
  });

  describe('sortAllShootDays', () => {
    it('sorts every shoot day independently by the same mode', () => {
      const day1SceneA = createMockScene({ id: 'd1-a', location: 'ZOO' });
      const day1SceneB = createMockScene({ id: 'd1-b', location: 'ATTIC' });
      const day2SceneA = createMockScene({ id: 'd2-a', location: 'YARD' });
      const day2SceneB = createMockScene({ id: 'd2-b', location: 'BASEMENT' });
      const day1 = createMockDay({ id: 'day-1', scenes: [day1SceneA, day1SceneB] });
      const day2 = createMockDay({ id: 'day-2', scenes: [day2SceneA, day2SceneB] });
      const schedule = createMockSchedule({ shootDays: [day1, day2] });
      service.setSchedule(schedule);

      service.sortAllShootDays('location');

      expect(service.schedule!.shootDays[0].scenes.map(s => s.id)).toEqual(['d1-b', 'd1-a']);
      expect(service.schedule!.shootDays[1].scenes.map(s => s.id)).toEqual(['d2-b', 'd2-a']);
    });

    it('never moves scenes between days', () => {
      const day1Scene = createMockScene({ id: 'd1', intExt: 'EXT' });
      const day2Scene = createMockScene({ id: 'd2', intExt: 'INT' });
      const day1 = createMockDay({ id: 'day-1', scenes: [day1Scene] });
      const day2 = createMockDay({ id: 'day-2', scenes: [day2Scene] });
      const schedule = createMockSchedule({ shootDays: [day1, day2] });
      service.setSchedule(schedule);

      service.sortAllShootDays('intExt');

      expect(service.schedule!.shootDays[0].scenes.map(s => s.id)).toEqual(['d1']);
      expect(service.schedule!.shootDays[1].scenes.map(s => s.id)).toEqual(['d2']);
    });

    it('reindexes orderInDay per day', () => {
      const day1SceneA = createMockScene({ id: 'd1-a', sceneNumber: '2' });
      const day1SceneB = createMockScene({ id: 'd1-b', sceneNumber: '1' });
      const day1 = createMockDay({ id: 'day-1', scenes: [day1SceneA, day1SceneB] });
      const schedule = createMockSchedule({ shootDays: [day1] });
      service.setSchedule(schedule);

      service.sortAllShootDays('script');

      const sorted = service.schedule!.shootDays[0].scenes;
      expect(sorted[0].id).toBe('d1-b');
      expect(sorted[0].orderInDay).toBe(0);
      expect(sorted[1].id).toBe('d1-a');
      expect(sorted[1].orderInDay).toBe(1);
    });

    it('marks schedule as dirty', () => {
      const day = createMockDay({ id: 'day-1', scenes: [createMockScene({ id: 'A' })] });
      const schedule = createMockSchedule({ shootDays: [day] });
      service.setSchedule(schedule);

      service.sortAllShootDays('script');

      expect(service.isDirty).toBe(true);
    });

    it('is a no-op when there are no shoot days', () => {
      const schedule = createMockSchedule({ shootDays: [] });
      service.setSchedule(schedule);

      service.sortAllShootDays('script');

      expect(service.isDirty).toBe(false);
    });

    it('does not crash with null schedule', () => {
      expect(() => service.sortAllShootDays('script')).not.toThrow();
    });

    it('refreshes every day title to match its own new scene order (spec 031)', () => {
      const day1SceneA = createMockScene({ id: 'd1-a', location: 'ZOO' });
      const day1SceneB = createMockScene({ id: 'd1-b', location: 'ATTIC' });
      const day2SceneA = createMockScene({ id: 'd2-a', location: 'YARD' });
      const day2SceneB = createMockScene({ id: 'd2-b', location: 'BASEMENT' });
      const day1 = createMockDay({ id: 'day-1', dayNumber: 1, scenes: [day1SceneA, day1SceneB] });
      const day2 = createMockDay({ id: 'day-2', dayNumber: 2, scenes: [day2SceneA, day2SceneB] });
      const schedule = createMockSchedule({ shootDays: [day1, day2] });
      service.setSchedule(schedule);

      service.sortAllShootDays('location');

      expect(service.schedule!.shootDays[0].label).toBe('ATTIC → ZOO');
      expect(service.schedule!.shootDays[1].label).toBe('BASEMENT → YARD');
    });
  });

  describe('setShowSceneCast', () => {
    it('sets showSceneCast to true', () => {
      const schedule = createMockSchedule({ settings: { ...getDefaultScheduleSettings(), showSceneCast: false } });
      service.setSchedule(schedule);

      service.setShowSceneCast(true);

      expect(service.schedule!.settings.showSceneCast).toBe(true);
    });

    it('sets showSceneCast to false', () => {
      const schedule = createMockSchedule({ settings: { ...getDefaultScheduleSettings(), showSceneCast: true } });
      service.setSchedule(schedule);

      service.setShowSceneCast(false);

      expect(service.schedule!.settings.showSceneCast).toBe(false);
    });

    it('marks schedule as dirty', () => {
      service.setSchedule(createMockSchedule());

      service.setShowSceneCast(false);

      expect(service.isDirty).toBe(true);
    });

    it('does not crash with null schedule', () => {
      expect(() => service.setShowSceneCast(false)).not.toThrow();
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
