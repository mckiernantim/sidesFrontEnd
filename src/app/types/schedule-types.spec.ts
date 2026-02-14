import {
  ProductionSchedule,
  ShootDay,
  ScheduleScene,
  CastMember,
  DayOutOfDaysEntry,
  ScheduleLocation,
  DayResource,
  DepartmentNote,
  ScheduleSettings,
  SceneCharacter,
  IntExt,
  DOODStatus,
  Department,
  CastCategory,
  DEFAULT_STRIP_COLORS,
  getDefaultStripColor,
  formatFifteenMinIncrements,
  getDefaultScheduleSettings,
} from './Schedule';

// ─────────────────────────────────────────────
// Mock Factory Helpers
// ─────────────────────────────────────────────

function createMockSceneCharacter(overrides: Partial<SceneCharacter> = {}): SceneCharacter {
  return {
    characterName: 'CHLOE',
    hasDialogue: true,
    isVoiceOver: false,
    isOffScreen: false,
    ...overrides,
  };
}

function createMockDepartmentNote(overrides: Partial<DepartmentNote> = {}): DepartmentNote {
  return {
    department: 'props',
    note: 'Rubber knife needed',
    requiresPrep: true,
    ...overrides,
  };
}

function createMockScheduleScene(overrides: Partial<ScheduleScene> = {}): ScheduleScene {
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
    characters: [createMockSceneCharacter()],
    oneLiner: 'Chloe discovers the letter.',
    oneLinerSource: 'ai',
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

function createMockShootDay(overrides: Partial<ShootDay> = {}): ShootDay {
  return {
    id: 'day-001',
    dayNumber: 1,
    date: '2026-03-15',
    label: 'Day 1 - Kitchen Scenes',
    primaryLocation: 'ANDERSON TOWNHOUSE',
    secondaryLocations: [],
    scenes: [createMockScheduleScene()],
    castRequired: [],
    estimatedPageCount: 2.5,
    estimatedTotalTime: 4,
    notes: '',
    ...overrides,
  };
}

function createMockCastMember(overrides: Partial<CastMember> = {}): CastMember {
  return {
    id: 'cast-001',
    characterName: 'CHLOE',
    actorName: 'Jane Doe',
    castNumber: 1,
    category: 'principal',
    sceneNumbers: ['1', '2', '5'],
    totalScenes: 3,
    totalPageCount: 7.5,
    dayOutOfDays: [],
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
    shootDays: [createMockShootDay()],
    unscheduledScenes: [],
    castMembers: [createMockCastMember()],
    locations: [],
    settings: getDefaultScheduleSettings(),
    oneLinerMode: 'ai',
    ...overrides,
  };
}

// ─────────────────────────────────────────────
// Test Suites
// ─────────────────────────────────────────────

describe('Schedule Types', () => {
  describe('ProductionSchedule', () => {
    it('should create a valid production schedule with all required fields', () => {
      const schedule = createMockSchedule();

      expect(schedule.id).toBe('schedule-001');
      expect(schedule.projectTitle).toBe('NEXT DOOR');
      expect(schedule.userId).toBe('user-abc');
      expect(schedule.version).toBe(1);
      expect(schedule.shootDays.length).toBe(1);
      expect(schedule.unscheduledScenes.length).toBe(0);
      expect(schedule.castMembers.length).toBe(1);
      expect(schedule.oneLinerMode).toBe('ai');
    });

    it('should support mixed one-liner mode', () => {
      const schedule = createMockSchedule({ oneLinerMode: 'mixed' });
      expect(schedule.oneLinerMode).toBe('mixed');
    });

    it('should support manual one-liner mode', () => {
      const schedule = createMockSchedule({ oneLinerMode: 'manual' });
      expect(schedule.oneLinerMode).toBe('manual');
    });

    it('should have ISO 8601 timestamps', () => {
      const schedule = createMockSchedule();
      // Verify timestamps are valid ISO 8601 (Date constructor can parse them)
      expect(new Date(schedule.createdAt).getTime()).not.toBeNaN();
      expect(new Date(schedule.updatedAt).getTime()).not.toBeNaN();
      expect(schedule.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(schedule.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('ShootDay', () => {
    it('should create a valid shoot day', () => {
      const day = createMockShootDay();

      expect(day.id).toBe('day-001');
      expect(day.dayNumber).toBe(1);
      expect(day.date).toBe('2026-03-15');
      expect(day.primaryLocation).toBe('ANDERSON TOWNHOUSE');
      expect(day.scenes.length).toBe(1);
    });

    it('should support secondary locations', () => {
      const day = createMockShootDay({
        secondaryLocations: ['PARK', 'COFFEE SHOP'],
      });
      expect(day.secondaryLocations.length).toBe(2);
      expect(day.secondaryLocations).toContain('PARK');
    });

    it('should track estimated page count and time', () => {
      const day = createMockShootDay({
        estimatedPageCount: 5.0,
        estimatedTotalTime: 16, // 4 hours
      });
      expect(day.estimatedPageCount).toBe(5.0);
      expect(day.estimatedTotalTime).toBe(16);
    });

    it('should calculate total time from scenes', () => {
      const scenes = [
        createMockScheduleScene({ estimatedTimeInFifteenMin: 4 }),
        createMockScheduleScene({ id: 'scene-002', estimatedTimeInFifteenMin: 8 }),
        createMockScheduleScene({ id: 'scene-003', estimatedTimeInFifteenMin: 2 }),
      ];
      const totalTime = scenes.reduce((sum, s) => sum + s.estimatedTimeInFifteenMin, 0);
      const day = createMockShootDay({
        scenes,
        estimatedTotalTime: totalTime,
      });
      expect(day.estimatedTotalTime).toBe(14); // 4 + 8 + 2 = 14 (3h 30m)
    });
  });

  describe('ScheduleScene', () => {
    it('should create a valid schedule scene with defaults', () => {
      const scene = createMockScheduleScene();

      expect(scene.sceneNumber).toBe('1');
      expect(scene.intExt).toBe('INT');
      expect(scene.location).toBe('KITCHEN');
      expect(scene.timeOfDay).toBe('DAY');
      expect(scene.estimatedTimeInFifteenMin).toBe(4);
      expect(scene.isOmitted).toBe(false);
      expect(scene.needsNight).toBe(false);
      expect(scene.stripColor).toBe('#3B82F6');
    });

    it('should support night scene flags', () => {
      const scene = createMockScheduleScene({
        timeOfDay: 'NIGHT',
        needsNight: true,
        stripColor: '#EAB308',
      });
      expect(scene.needsNight).toBe(true);
      expect(scene.timeOfDay).toBe('NIGHT');
    });

    it('should support INT/EXT scenes', () => {
      const scene = createMockScheduleScene({
        intExt: 'INT/EXT',
        sceneHeader: 'INT./EXT. CAR - DAY',
      });
      expect(scene.intExt).toBe('INT/EXT');
    });

    it('should support omitted scenes', () => {
      const scene = createMockScheduleScene({
        isOmitted: true,
        sceneHeader: 'OMITTED',
        location: 'OMITTED',
      });
      expect(scene.isOmitted).toBe(true);
    });

    it('should track characters per scene', () => {
      const scene = createMockScheduleScene({
        characters: [
          createMockSceneCharacter({ characterName: 'CHLOE' }),
          createMockSceneCharacter({ characterName: 'MICHAEL', isVoiceOver: true }),
        ],
      });
      expect(scene.characters.length).toBe(2);
      expect(scene.characters[1].isVoiceOver).toBe(true);
    });

    it('should support department notes', () => {
      const scene = createMockScheduleScene({
        departmentNotes: [
          createMockDepartmentNote({ department: 'props', note: 'Rubber knife' }),
          createMockDepartmentNote({ department: 'stunts', note: 'Fight choreography' }),
        ],
      });
      expect(scene.departmentNotes.length).toBe(2);
    });

    it('should allow scheduling metadata (shootDayId, orderInDay)', () => {
      const scene = createMockScheduleScene({
        shootDayId: 'day-001',
        orderInDay: 3,
      });
      expect(scene.shootDayId).toBe('day-001');
      expect(scene.orderInDay).toBe(3);
    });

    it('should support AI one-liner source', () => {
      const scene = createMockScheduleScene({
        oneLiner: 'Chloe discovers a hidden letter.',
        oneLinerSource: 'ai',
        oneLinerEdited: false,
      });
      expect(scene.oneLinerSource).toBe('ai');
    });

    it('should support manual one-liner source', () => {
      const scene = createMockScheduleScene({
        oneLiner: 'Michael confronts Chloe about the past.',
        oneLinerSource: 'manual',
        oneLinerEdited: true,
      });
      expect(scene.oneLinerSource).toBe('manual');
      expect(scene.oneLinerEdited).toBe(true);
    });

    it('should use estimatedTimeInFifteenMin not estimatedTime', () => {
      const scene = createMockScheduleScene({
        estimatedTimeInFifteenMin: 8, // 2 hours
      });
      // Verify the field name matches the spec update
      expect(scene.estimatedTimeInFifteenMin).toBe(8);
      expect((scene as any).estimatedTime).toBeUndefined();
    });
  });

  describe('CastMember', () => {
    it('should create a valid cast member', () => {
      const member = createMockCastMember();

      expect(member.characterName).toBe('CHLOE');
      expect(member.actorName).toBe('Jane Doe');
      expect(member.castNumber).toBe(1);
      expect(member.category).toBe('principal');
      expect(member.sceneNumbers).toEqual(['1', '2', '5']);
      expect(member.totalScenes).toBe(3);
    });

    it('should support all cast categories', () => {
      const categories: CastCategory[] = [
        'principal', 'day-player', 'recurring', 'stunt', 'background', 'voice-only',
      ];

      for (const category of categories) {
        const member = createMockCastMember({ category });
        expect(member.category).toBe(category);
      }
    });

    it('should support day out of days entries', () => {
      const dood: DayOutOfDaysEntry[] = [
        { shootDayId: 'day-001', dayNumber: 1, status: 'SW' },
        { shootDayId: 'day-002', dayNumber: 2, status: 'W' },
        { shootDayId: 'day-003', dayNumber: 3, status: 'WF' },
      ];
      const member = createMockCastMember({ dayOutOfDays: dood });
      expect(member.dayOutOfDays.length).toBe(3);
      expect(member.dayOutOfDays[0].status).toBe('SW');
      expect(member.dayOutOfDays[2].status).toBe('WF');
    });

    it('should handle availability dates', () => {
      const member = createMockCastMember({
        startDate: '2026-03-01',
        endDate: '2026-06-30',
        holdDays: ['2026-04-01'],
        unavailableDays: ['2026-04-15', '2026-04-16'],
      });
      expect(member.startDate).toBe('2026-03-01');
      expect(member.unavailableDays.length).toBe(2);
    });
  });

  describe('DayOutOfDaysEntry', () => {
    it('should support all DOOD status codes', () => {
      const statuses: DOODStatus[] = ['SW', 'W', 'WF', 'SWF', 'H', 'R', 'T', 'WD', ''];

      for (const status of statuses) {
        const entry: DayOutOfDaysEntry = {
          shootDayId: 'day-001',
          dayNumber: 1,
          status,
        };
        expect(entry.status).toBe(status);
      }
    });

    it('should support optional date field', () => {
      const entryWithDate: DayOutOfDaysEntry = {
        shootDayId: 'day-001',
        dayNumber: 1,
        date: '2026-03-15',
        status: 'W',
      };
      expect(entryWithDate.date).toBe('2026-03-15');
    });
  });

  describe('ScheduleLocation', () => {
    it('should create a valid location', () => {
      const location: ScheduleLocation = {
        id: 'loc-001',
        name: 'ANDERSON TOWNHOUSE',
        fullHeaders: [
          'INT. ANDERSON TOWNHOUSE - DAY',
          'INT. ANDERSON TOWNHOUSE - NIGHT',
          'EXT. ANDERSON TOWNHOUSE - DAY',
        ],
        intExt: ['INT', 'EXT'],
        sceneCount: 12,
        totalPageCount: 30,
      };
      expect(location.name).toBe('ANDERSON TOWNHOUSE');
      expect(location.sceneCount).toBe(12);
      expect(location.fullHeaders.length).toBe(3);
    });

    it('should support production details', () => {
      const location: ScheduleLocation = {
        id: 'loc-002',
        name: 'LULABELLE\'S CAFE',
        fullHeaders: ['INT. LULABELLE\'S CAFE - DAY'],
        intExt: ['INT'],
        sceneCount: 2,
        totalPageCount: 8,
        address: '123 Main St, Los Angeles, CA',
        contactName: 'John Smith',
        contactPhone: '555-0100',
        permitRequired: true,
        notes: 'Closes at 6pm, need to wrap by 5:30',
      };
      expect(location.permitRequired).toBe(true);
      expect(location.address).toContain('Los Angeles');
    });
  });

  describe('DepartmentNote', () => {
    it('should support all department types', () => {
      const departments: Department[] = [
        'props', 'hair-makeup', 'wardrobe', 'vehicles', 'special-equipment',
        'stunts', 'vfx', 'sfx', 'background', 'animals', 'locations',
        'art', 'camera', 'sound', 'other',
      ];

      for (const dept of departments) {
        const note = createMockDepartmentNote({ department: dept });
        expect(note.department).toBe(dept);
      }
    });

    it('should support estimated cost', () => {
      const note = createMockDepartmentNote({
        department: 'vehicles',
        note: 'Picture car - 1965 Mustang',
        estimatedCost: 2500,
      });
      expect(note.estimatedCost).toBe(2500);
    });
  });
});

describe('Schedule Utility Functions', () => {
  describe('getDefaultStripColor', () => {
    it('should return blue for INT-DAY', () => {
      expect(getDefaultStripColor('INT', 'DAY')).toBe('#3B82F6');
    });

    it('should return yellow for INT-NIGHT', () => {
      expect(getDefaultStripColor('INT', 'NIGHT')).toBe('#EAB308');
    });

    it('should return green for EXT-DAY', () => {
      expect(getDefaultStripColor('EXT', 'DAY')).toBe('#22C55E');
    });

    it('should return orange for EXT-NIGHT', () => {
      expect(getDefaultStripColor('EXT', 'NIGHT')).toBe('#F97316');
    });

    it('should return purple for INT/EXT-DAY', () => {
      expect(getDefaultStripColor('INT/EXT', 'DAY')).toBe('#8B5CF6');
    });

    it('should return pink for INT/EXT-NIGHT', () => {
      expect(getDefaultStripColor('INT/EXT', 'NIGHT')).toBe('#EC4899');
    });

    it('should recognize EVENING and DUSK as night', () => {
      expect(getDefaultStripColor('INT', 'EVENING')).toBe('#EAB308');
      expect(getDefaultStripColor('EXT', 'DUSK')).toBe('#F97316');
    });

    it('should return INT-DAY color for empty time of day (defaults to DAY)', () => {
      // Empty string doesn't match night keywords, so falls through to DAY
      expect(getDefaultStripColor('INT', '')).toBe('#3B82F6');
    });

    it('should return INT-DAY color for CONTINUOUS (not night)', () => {
      // CONTINUOUS doesn't match night keywords, so falls through to DAY
      expect(getDefaultStripColor('INT', 'CONTINUOUS')).toBe('#3B82F6');
    });
  });

  describe('formatFifteenMinIncrements', () => {
    it('should format 0 increments as "0m"', () => {
      expect(formatFifteenMinIncrements(0)).toBe('0m');
    });

    it('should format 1 increment as "15m"', () => {
      expect(formatFifteenMinIncrements(1)).toBe('15m');
    });

    it('should format 2 increments as "30m"', () => {
      expect(formatFifteenMinIncrements(2)).toBe('30m');
    });

    it('should format 3 increments as "45m"', () => {
      expect(formatFifteenMinIncrements(3)).toBe('45m');
    });

    it('should format 4 increments as "1h 0m"', () => {
      expect(formatFifteenMinIncrements(4)).toBe('1h 0m');
    });

    it('should format 5 increments as "1h 15m"', () => {
      expect(formatFifteenMinIncrements(5)).toBe('1h 15m');
    });

    it('should format 8 increments as "2h 0m"', () => {
      expect(formatFifteenMinIncrements(8)).toBe('2h 0m');
    });

    it('should format 10 increments as "2h 30m"', () => {
      expect(formatFifteenMinIncrements(10)).toBe('2h 30m');
    });

    it('should handle large values (48 = 12h)', () => {
      expect(formatFifteenMinIncrements(48)).toBe('12h 0m');
    });

    it('should handle negative values as "0m"', () => {
      expect(formatFifteenMinIncrements(-1)).toBe('0m');
    });
  });

  describe('getDefaultScheduleSettings', () => {
    it('should return valid default settings', () => {
      const settings = getDefaultScheduleSettings();

      expect(settings.defaultDayLength).toBe(5);
      expect(settings.showOmittedScenes).toBe(false);
      expect(settings.autoCalculateDOOD).toBe(true);
      expect(settings.exportFormat).toBe('xlsx');
      expect(settings.sixDayWeeks).toBe(true);
      expect(settings.dayOffDay).toBe('sunday');
    });

    it('should return a new object on each call (not a shared reference)', () => {
      const settings1 = getDefaultScheduleSettings();
      const settings2 = getDefaultScheduleSettings();

      expect(settings1).not.toBe(settings2); // Different references
      expect(settings1).toEqual(settings2);  // Same values
    });
  });

  describe('DEFAULT_STRIP_COLORS', () => {
    it('should have 6 color mappings', () => {
      expect(Object.keys(DEFAULT_STRIP_COLORS).length).toBe(6);
    });

    it('should have hex color values for all entries', () => {
      const hexPattern = /^#[0-9A-Fa-f]{6}$/;
      for (const [key, value] of Object.entries(DEFAULT_STRIP_COLORS)) {
        expect(value).toMatch(hexPattern);
      }
    });
  });
});
