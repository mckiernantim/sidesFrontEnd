import { ScheduleService } from './schedule.service';
import { ScheduleStateService } from './schedule-state.service';
import {
  ProductionSchedule,
  ScheduleScene,
  ShootDay,
  CastMember,
  ScheduleLocation,
  SceneCharacter,
  getDefaultScheduleSettings,
} from '../../types/Schedule';
import { Line } from '../../types/Line';
import { SceneRef } from '../../utils/buildCharacterSceneMap';

// ─────────────────────────────────────────────
// Mock Factories
// ─────────────────────────────────────────────

function createMockLine(overrides: Partial<Line> = {}): Line {
  return {
    category: 'dialog',
    class: 'dialog',
    index: 0,
    multipleColumn: false,
    page: 1,
    sceneIndex: 0,
    text: 'Some dialog text',
    yPos: 100,
    xPos: 100,
    ...overrides,
  };
}

function createMockCharacterLine(
  name: string,
  index: number,
  sceneIndex: number = 0
): Line {
  return createMockLine({
    category: 'character',
    class: 'character',
    text: name,
    index,
    sceneIndex,
    xPos: 252, // Standard character xPos (centered)
    yPos: index * 10,
  });
}

function createMockSceneHeader(
  sceneNum: string,
  headerText: string,
  index: number,
  lastLine: number
): SceneRef {
  return {
    sceneNumberText: sceneNum,
    text: headerText,
    index,
    lastLine,
  };
}

// ─────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────

describe('ScheduleService', () => {
  let service: ScheduleService;
  let stateService: ScheduleStateService;

  beforeEach(() => {
    stateService = new ScheduleStateService();
    service = new ScheduleService(stateService);
  });

  // ─────────────────────────────────────────────
  // UUID Generation
  // ─────────────────────────────────────────────

  describe('generateUUID', () => {
    it('should generate a non-empty string', () => {
      const uuid = service.generateUUID();
      expect(uuid).toBeTruthy();
      expect(typeof uuid).toBe('string');
    });

    it('should generate unique UUIDs', () => {
      const uuids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        uuids.add(service.generateUUID());
      }
      expect(uuids.size).toBe(100);
    });

    it('should contain hyphens (UUID format)', () => {
      const uuid = service.generateUUID();
      expect(uuid).toContain('-');
    });
  });

  // ─────────────────────────────────────────────
  // Time Estimation
  // ─────────────────────────────────────────────

  describe('estimateTimeFromPageCount', () => {
    it('should return 4 increments for 1 page (1 hour)', () => {
      expect(service.estimateTimeFromPageCount(1)).toBe(4);
    });

    it('should return 2 increments for half a page (30 min)', () => {
      expect(service.estimateTimeFromPageCount(0.5)).toBe(2);
    });

    it('should return minimum 1 increment for very short scenes', () => {
      expect(service.estimateTimeFromPageCount(0.125)).toBe(1);
    });

    it('should return 8 increments for 2 pages (2 hours)', () => {
      expect(service.estimateTimeFromPageCount(2)).toBe(8);
    });

    it('should round to nearest increment', () => {
      // 0.375 pages * 4 = 1.5, rounds to 2
      expect(service.estimateTimeFromPageCount(0.375)).toBe(2);
    });

    it('should handle zero page count with minimum of 1', () => {
      expect(service.estimateTimeFromPageCount(0)).toBe(1);
    });
  });

  describe('formatTime', () => {
    it('should format 4 increments as "1h 0m"', () => {
      expect(service.formatTime(4)).toBe('1h 0m');
    });

    it('should format 2 increments as "30m"', () => {
      expect(service.formatTime(2)).toBe('30m');
    });

    it('should format 0 increments as "0m"', () => {
      expect(service.formatTime(0)).toBe('0m');
    });

    it('should format 10 increments as "2h 30m"', () => {
      expect(service.formatTime(10)).toBe('2h 30m');
    });
  });

  // ─────────────────────────────────────────────
  // Blank Schedule Creation
  // ─────────────────────────────────────────────

  describe('createBlankSchedule', () => {
    it('should create a schedule with correct metadata', () => {
      const schedule = service.createBlankSchedule('proj-1', 'Test Film', 'user-abc');

      expect(schedule.projectId).toBe('proj-1');
      expect(schedule.projectTitle).toBe('Test Film');
      expect(schedule.userId).toBe('user-abc');
      expect(schedule.version).toBe(1);
    });

    it('should have a valid UUID id', () => {
      const schedule = service.createBlankSchedule('proj-1', 'Test Film', 'user-abc');
      expect(schedule.id).toBeTruthy();
      expect(schedule.id).toContain('-');
    });

    it('should have ISO 8601 timestamps', () => {
      const schedule = service.createBlankSchedule('proj-1', 'Test Film', 'user-abc');
      expect(new Date(schedule.createdAt).toISOString()).toBeTruthy();
      expect(new Date(schedule.updatedAt).toISOString()).toBeTruthy();
    });

    it('should start with empty arrays', () => {
      const schedule = service.createBlankSchedule('proj-1', 'Test Film', 'user-abc');
      expect(schedule.shootDays).toEqual([]);
      expect(schedule.unscheduledScenes).toEqual([]);
      expect(schedule.castMembers).toEqual([]);
      expect(schedule.locations).toEqual([]);
    });

    it('should default to manual one-liner mode', () => {
      const schedule = service.createBlankSchedule('proj-1', 'Test Film', 'user-abc');
      expect(schedule.oneLinerMode).toBe('manual');
    });

    it('should have default settings', () => {
      const schedule = service.createBlankSchedule('proj-1', 'Test Film', 'user-abc');
      const defaults = getDefaultScheduleSettings();
      expect(schedule.settings).toEqual(defaults);
    });
  });

  // ─────────────────────────────────────────────
  // Shoot Day Creation
  // ─────────────────────────────────────────────

  describe('createShootDay', () => {
    it('should create a shoot day with correct day number', () => {
      const day = service.createShootDay(1);
      expect(day.dayNumber).toBe(1);
    });

    it('should create a shoot day with a UUID', () => {
      const day = service.createShootDay(1);
      expect(day.id).toBeTruthy();
      expect(day.id).toContain('-');
    });

    it('should accept a primary location', () => {
      const day = service.createShootDay(3, 'STUDIO A');
      expect(day.primaryLocation).toBe('STUDIO A');
    });

    it('should default primary location to empty string', () => {
      const day = service.createShootDay(1);
      expect(day.primaryLocation).toBe('');
    });

    it('should start with zero page count and time', () => {
      const day = service.createShootDay(1);
      expect(day.estimatedPageCount).toBe(0);
      expect(day.estimatedTotalTime).toBe(0);
    });

    it('should start with empty scenes and cast', () => {
      const day = service.createShootDay(1);
      expect(day.scenes).toEqual([]);
      expect(day.castRequired).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────
  // Scene Conversion (buildScheduleScenes)
  // ─────────────────────────────────────────────

  describe('buildScheduleScenes', () => {
    it('should convert a single scene correctly', () => {
      const scenes: SceneRef[] = [
        createMockSceneHeader('1', 'INT. KITCHEN - DAY', 0, 50),
      ];
      const charMap = new Map<string, SceneCharacter[]>();

      const result = service.buildScheduleScenes(scenes, charMap);

      expect(result.length).toBe(1);
      expect(result[0].sceneNumber).toBe('1');
      expect(result[0].sceneHeader).toBe('INT. KITCHEN - DAY');
      expect(result[0].intExt).toBe('INT');
      expect(result[0].location).toBe('KITCHEN');
      expect(result[0].timeOfDay).toBe('DAY');
    });

    it('should assign unique UUIDs to each scene', () => {
      const scenes: SceneRef[] = [
        createMockSceneHeader('1', 'INT. KITCHEN - DAY', 0, 50),
        createMockSceneHeader('2', 'EXT. BACKYARD - NIGHT', 51, 100),
      ];
      const charMap = new Map<string, SceneCharacter[]>();

      const result = service.buildScheduleScenes(scenes, charMap);

      expect(result[0].id).not.toBe(result[1].id);
    });

    it('should parse INT/EXT correctly', () => {
      const scenes: SceneRef[] = [
        createMockSceneHeader('1', 'INT. KITCHEN - DAY', 0, 10),
        createMockSceneHeader('2', 'EXT. BACKYARD - NIGHT', 11, 20),
        createMockSceneHeader('3', 'INT./EXT. CAR - CONTINUOUS', 21, 30),
      ];
      const charMap = new Map<string, SceneCharacter[]>();

      const result = service.buildScheduleScenes(scenes, charMap);

      expect(result[0].intExt).toBe('INT');
      expect(result[1].intExt).toBe('EXT');
      expect(result[2].intExt).toBe('INT/EXT');
    });

    it('should detect night scenes', () => {
      const scenes: SceneRef[] = [
        createMockSceneHeader('1', 'INT. BEDROOM - NIGHT', 0, 20),
        createMockSceneHeader('2', 'EXT. PARK - DAY', 21, 40),
      ];
      const charMap = new Map<string, SceneCharacter[]>();

      const result = service.buildScheduleScenes(scenes, charMap);

      expect(result[0].needsNight).toBe(true);
      expect(result[1].needsNight).toBe(false);
    });

    it('should detect omitted scenes', () => {
      const scenes: SceneRef[] = [
        createMockSceneHeader('5', 'OMITTED', 0, 0),
      ];
      const charMap = new Map<string, SceneCharacter[]>();

      const result = service.buildScheduleScenes(scenes, charMap);

      expect(result[0].isOmitted).toBe(true);
      expect(result[0].location).toBe('OMITTED');
    });

    it('should attach characters to scenes', () => {
      const scenes: SceneRef[] = [
        createMockSceneHeader('1', 'INT. KITCHEN - DAY', 0, 50),
      ];
      const charMap = new Map<string, SceneCharacter[]>([
        ['1', [
          { characterName: 'JOHN', hasDialogue: true, isVoiceOver: false, isOffScreen: false },
          { characterName: 'MARY', hasDialogue: true, isVoiceOver: false, isOffScreen: false },
        ]],
      ]);

      const result = service.buildScheduleScenes(scenes, charMap);

      expect(result[0].characters.length).toBe(2);
      expect(result[0].characters[0].characterName).toBe('JOHN');
      expect(result[0].characters[1].characterName).toBe('MARY');
    });

    it('should default to empty characters when not in map', () => {
      const scenes: SceneRef[] = [
        createMockSceneHeader('99', 'INT. OFFICE - DAY', 0, 10),
      ];
      const charMap = new Map<string, SceneCharacter[]>();

      const result = service.buildScheduleScenes(scenes, charMap);

      expect(result[0].characters).toEqual([]);
    });

    it('should assign strip colors based on intExt and timeOfDay', () => {
      const scenes: SceneRef[] = [
        createMockSceneHeader('1', 'INT. KITCHEN - DAY', 0, 10),
        createMockSceneHeader('2', 'EXT. BACKYARD - NIGHT', 11, 20),
      ];
      const charMap = new Map<string, SceneCharacter[]>();

      const result = service.buildScheduleScenes(scenes, charMap);

      // INT-DAY should be blue
      expect(result[0].stripColor).toBe('#3B82F6');
      // EXT-NIGHT should be orange
      expect(result[1].stripColor).toBe('#F97316');
    });

    it('should estimate time in 15-minute increments', () => {
      const scenes: SceneRef[] = [
        createMockSceneHeader('1', 'INT. KITCHEN - DAY', 0, 56), // ~1 page
      ];
      const charMap = new Map<string, SceneCharacter[]>();

      const result = service.buildScheduleScenes(scenes, charMap);

      expect(result[0].estimatedTimeInFifteenMin).toBeGreaterThanOrEqual(1);
    });

    it('should default scheduling flags to false', () => {
      const scenes: SceneRef[] = [
        createMockSceneHeader('1', 'INT. KITCHEN - DAY', 0, 10),
      ];
      const charMap = new Map<string, SceneCharacter[]>();

      const result = service.buildScheduleScenes(scenes, charMap);

      expect(result[0].hasStunts).toBe(false);
      expect(result[0].hasEffects).toBe(false);
      expect(result[0].hasVehicles).toBe(false);
      expect(result[0].departmentNotes).toEqual([]);
    });

    it('should use scene number text when available', () => {
      const scenes: SceneRef[] = [
        { sceneNumberText: '1A', text: 'INT. KITCHEN - DAY', index: 0, lastLine: 10 },
      ];
      const charMap = new Map<string, SceneCharacter[]>();

      const result = service.buildScheduleScenes(scenes, charMap);

      expect(result[0].sceneNumber).toBe('1A');
    });

    it('should fall back to index-based numbering when no scene number', () => {
      const scenes: SceneRef[] = [
        { text: 'INT. KITCHEN - DAY', index: 0, lastLine: 10 },
      ];
      const charMap = new Map<string, SceneCharacter[]>();

      const result = service.buildScheduleScenes(scenes, charMap);

      expect(result[0].sceneNumber).toBe('1'); // index 0 + 1
    });

    it('should handle multiple scenes', () => {
      const scenes: SceneRef[] = [
        createMockSceneHeader('1', 'INT. KITCHEN - DAY', 0, 50),
        createMockSceneHeader('2', 'EXT. BACKYARD - NIGHT', 51, 100),
        createMockSceneHeader('3', 'INT./EXT. CAR - DUSK', 101, 150),
        createMockSceneHeader('4', 'INT. BEDROOM - MORNING', 151, 200),
      ];
      const charMap = new Map<string, SceneCharacter[]>();

      const result = service.buildScheduleScenes(scenes, charMap);

      expect(result.length).toBe(4);
      expect(result.map(s => s.sceneNumber)).toEqual(['1', '2', '3', '4']);
    });
  });

  // ─────────────────────────────────────────────
  // Cast Member Building
  // ─────────────────────────────────────────────

  describe('buildCastMembers', () => {
    it('should create a cast member for each unique character', () => {
      const allCharacters = ['ALICE', 'BOB'];
      const charMap = new Map<string, SceneCharacter[]>([
        ['1', [{ characterName: 'ALICE', hasDialogue: true, isVoiceOver: false, isOffScreen: false }]],
        ['2', [{ characterName: 'BOB', hasDialogue: true, isVoiceOver: false, isOffScreen: false }]],
      ]);
      const scenes: ScheduleScene[] = [
        { id: 's1', sceneNumber: '1', characters: [{ characterName: 'ALICE', hasDialogue: true, isVoiceOver: false, isOffScreen: false }], pageCount: 1 } as ScheduleScene,
        { id: 's2', sceneNumber: '2', characters: [{ characterName: 'BOB', hasDialogue: true, isVoiceOver: false, isOffScreen: false }], pageCount: 2 } as ScheduleScene,
      ];

      const result = service.buildCastMembers(allCharacters, charMap, scenes);

      expect(result.length).toBe(2);
      expect(result[0].characterName).toBe('ALICE');
      expect(result[1].characterName).toBe('BOB');
    });

    it('should assign sequential cast numbers', () => {
      const allCharacters = ['ALICE', 'BOB', 'CHARLIE'];
      const charMap = new Map<string, SceneCharacter[]>();
      const scenes: ScheduleScene[] = [];

      const result = service.buildCastMembers(allCharacters, charMap, scenes);

      expect(result[0].castNumber).toBe(1);
      expect(result[1].castNumber).toBe(2);
      expect(result[2].castNumber).toBe(3);
    });

    it('should tally scene appearances correctly', () => {
      const allCharacters = ['ALICE'];
      const charMap = new Map<string, SceneCharacter[]>();
      const scenes: ScheduleScene[] = [
        { id: 's1', sceneNumber: '1', characters: [{ characterName: 'ALICE', hasDialogue: true, isVoiceOver: false, isOffScreen: false }], pageCount: 1 } as ScheduleScene,
        { id: 's2', sceneNumber: '2', characters: [{ characterName: 'ALICE', hasDialogue: true, isVoiceOver: false, isOffScreen: false }], pageCount: 2 } as ScheduleScene,
        { id: 's3', sceneNumber: '3', characters: [{ characterName: 'BOB', hasDialogue: true, isVoiceOver: false, isOffScreen: false }], pageCount: 1 } as ScheduleScene,
      ];

      const result = service.buildCastMembers(allCharacters, charMap, scenes);

      expect(result[0].sceneNumbers).toEqual(['1', '2']);
      expect(result[0].totalScenes).toBe(2);
      expect(result[0].totalPageCount).toBe(3);
    });

    it('should classify characters with 5+ scenes as principal', () => {
      const allCharacters = ['LEAD'];
      const charMap = new Map<string, SceneCharacter[]>();
      const scenes: ScheduleScene[] = Array.from({ length: 6 }, (_, i) => ({
        id: `s${i}`,
        sceneNumber: `${i + 1}`,
        characters: [{ characterName: 'LEAD', hasDialogue: true, isVoiceOver: false, isOffScreen: false }],
        pageCount: 1,
      } as ScheduleScene));

      const result = service.buildCastMembers(allCharacters, charMap, scenes);

      expect(result[0].category).toBe('principal');
      expect(result[0].totalScenes).toBe(6);
    });

    it('should classify characters with fewer than 5 scenes as day-player', () => {
      const allCharacters = ['EXTRA'];
      const charMap = new Map<string, SceneCharacter[]>();
      const scenes: ScheduleScene[] = [
        { id: 's1', sceneNumber: '1', characters: [{ characterName: 'EXTRA', hasDialogue: true, isVoiceOver: false, isOffScreen: false }], pageCount: 1 } as ScheduleScene,
      ];

      const result = service.buildCastMembers(allCharacters, charMap, scenes);

      expect(result[0].category).toBe('day-player');
    });

    it('should start with empty dayOutOfDays', () => {
      const allCharacters = ['ALICE'];
      const charMap = new Map<string, SceneCharacter[]>();
      const scenes: ScheduleScene[] = [];

      const result = service.buildCastMembers(allCharacters, charMap, scenes);

      expect(result[0].dayOutOfDays).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────
  // Location Building
  // ─────────────────────────────────────────────

  describe('buildScheduleLocations', () => {
    it('should extract unique locations', () => {
      const headers = ['INT. KITCHEN - DAY', 'INT. KITCHEN - NIGHT', 'EXT. PARK - DAY'];
      const scenes: ScheduleScene[] = [
        { sceneHeader: 'INT. KITCHEN - DAY', location: 'KITCHEN', intExt: 'INT', isOmitted: false, pageCount: 1 } as ScheduleScene,
        { sceneHeader: 'INT. KITCHEN - NIGHT', location: 'KITCHEN', intExt: 'INT', isOmitted: false, pageCount: 2 } as ScheduleScene,
        { sceneHeader: 'EXT. PARK - DAY', location: 'PARK', intExt: 'EXT', isOmitted: false, pageCount: 1 } as ScheduleScene,
      ];

      const result = service.buildScheduleLocations(headers, scenes);

      expect(result.length).toBe(2);
      const names = result.map(l => l.name).sort();
      expect(names).toEqual(['KITCHEN', 'PARK']);
    });

    it('should tally scene counts per location', () => {
      const headers = ['INT. KITCHEN - DAY', 'INT. KITCHEN - NIGHT'];
      const scenes: ScheduleScene[] = [
        { sceneHeader: 'INT. KITCHEN - DAY', location: 'KITCHEN', intExt: 'INT', isOmitted: false, pageCount: 1 } as ScheduleScene,
        { sceneHeader: 'INT. KITCHEN - NIGHT', location: 'KITCHEN', intExt: 'INT', isOmitted: false, pageCount: 2 } as ScheduleScene,
      ];

      const result = service.buildScheduleLocations(headers, scenes);

      expect(result[0].sceneCount).toBe(2);
    });

    it('should accumulate page counts', () => {
      const headers = ['INT. KITCHEN - DAY'];
      const scenes: ScheduleScene[] = [
        { sceneHeader: 'INT. KITCHEN - DAY', location: 'KITCHEN', intExt: 'INT', isOmitted: false, pageCount: 1.5 } as ScheduleScene,
        { sceneHeader: 'INT. KITCHEN - NIGHT', location: 'KITCHEN', intExt: 'INT', isOmitted: false, pageCount: 2.25 } as ScheduleScene,
      ];

      const result = service.buildScheduleLocations(headers, scenes);

      expect(result[0].totalPageCount).toBe(3.75);
    });

    it('should collect all INT/EXT variants for a location', () => {
      const headers: string[] = [];
      const scenes: ScheduleScene[] = [
        { sceneHeader: 'INT. HOUSE - DAY', location: 'HOUSE', intExt: 'INT', isOmitted: false, pageCount: 1 } as ScheduleScene,
        { sceneHeader: 'EXT. HOUSE - DAY', location: 'HOUSE', intExt: 'EXT', isOmitted: false, pageCount: 1 } as ScheduleScene,
      ];

      const result = service.buildScheduleLocations(headers, scenes);

      expect(result[0].intExt).toContain('INT');
      expect(result[0].intExt).toContain('EXT');
    });

    it('should exclude omitted scenes from locations', () => {
      const headers: string[] = [];
      const scenes: ScheduleScene[] = [
        { sceneHeader: 'OMITTED', location: 'OMITTED', intExt: 'INT', isOmitted: true, pageCount: 0 } as ScheduleScene,
      ];

      const result = service.buildScheduleLocations(headers, scenes);

      expect(result.length).toBe(0);
    });

    it('should assign UUID to each location', () => {
      const headers: string[] = [];
      const scenes: ScheduleScene[] = [
        { sceneHeader: 'INT. KITCHEN - DAY', location: 'KITCHEN', intExt: 'INT', isOmitted: false, pageCount: 1 } as ScheduleScene,
      ];

      const result = service.buildScheduleLocations(headers, scenes);

      expect(result[0].id).toBeTruthy();
      expect(result[0].id).toContain('-');
    });
  });

  // ─────────────────────────────────────────────
  // Full Schedule Seeding
  // ─────────────────────────────────────────────

  describe('seedScheduleFromClassifyData', () => {
    // Build realistic classify data
    const allLines: Line[] = [
      // Scene 1: INT. KITCHEN - DAY (lines 0-20)
      createMockLine({ category: 'scene-header', class: 'scene-header', text: 'INT. KITCHEN - DAY', index: 0, sceneIndex: 0, page: 1 }),
      createMockLine({ category: 'description', text: 'A cozy kitchen.', index: 1, sceneIndex: 0 }),
      createMockCharacterLine('ALICE', 2, 0),
      createMockLine({ category: 'dialog', text: 'Good morning!', index: 3, sceneIndex: 0 }),
      createMockCharacterLine('BOB', 4, 0),
      createMockLine({ category: 'dialog', text: 'Hey there.', index: 5, sceneIndex: 0 }),

      // Scene 2: EXT. BACKYARD - NIGHT (lines 21-40)
      createMockLine({ category: 'scene-header', class: 'scene-header', text: 'EXT. BACKYARD - NIGHT', index: 21, sceneIndex: 1, page: 2 }),
      createMockLine({ category: 'description', text: 'Stars overhead.', index: 22, sceneIndex: 1 }),
      createMockCharacterLine('BOB', 23, 1),
      createMockLine({ category: 'dialog', text: 'Look at the sky.', index: 24, sceneIndex: 1 }),
      createMockCharacterLine('CHARLIE', 25, 1),
      createMockLine({ category: 'dialog', text: 'Beautiful.', index: 26, sceneIndex: 1 }),
    ];

    const scenes: SceneRef[] = [
      createMockSceneHeader('1', 'INT. KITCHEN - DAY', 0, 20),
      createMockSceneHeader('2', 'EXT. BACKYARD - NIGHT', 21, 40),
    ];

    it('should create a schedule with correct project metadata', () => {
      const schedule = service.seedScheduleFromClassifyData(
        'proj-1', 'NEXT DOOR', 'user-abc', allLines, scenes
      );

      expect(schedule.projectId).toBe('proj-1');
      expect(schedule.projectTitle).toBe('NEXT DOOR');
      expect(schedule.userId).toBe('user-abc');
    });

    it('should set version to 1', () => {
      const schedule = service.seedScheduleFromClassifyData(
        'proj-1', 'NEXT DOOR', 'user-abc', allLines, scenes
      );

      expect(schedule.version).toBe(1);
    });

    it('should default to AI one-liner mode', () => {
      const schedule = service.seedScheduleFromClassifyData(
        'proj-1', 'NEXT DOOR', 'user-abc', allLines, scenes
      );

      expect(schedule.oneLinerMode).toBe('ai');
    });

    it('should have all scenes in unscheduledScenes', () => {
      const schedule = service.seedScheduleFromClassifyData(
        'proj-1', 'NEXT DOOR', 'user-abc', allLines, scenes
      );

      expect(schedule.unscheduledScenes.length).toBe(2);
      expect(schedule.unscheduledScenes[0].sceneNumber).toBe('1');
      expect(schedule.unscheduledScenes[1].sceneNumber).toBe('2');
    });

    it('should start with no shoot days', () => {
      const schedule = service.seedScheduleFromClassifyData(
        'proj-1', 'NEXT DOOR', 'user-abc', allLines, scenes
      );

      expect(schedule.shootDays).toEqual([]);
    });

    it('should extract cast members from classified lines', () => {
      const schedule = service.seedScheduleFromClassifyData(
        'proj-1', 'NEXT DOOR', 'user-abc', allLines, scenes
      );

      const names = schedule.castMembers.map(c => c.characterName).sort();
      expect(names).toContain('ALICE');
      expect(names).toContain('BOB');
      expect(names).toContain('CHARLIE');
    });

    it('should correctly tally BOB appearing in both scenes', () => {
      const schedule = service.seedScheduleFromClassifyData(
        'proj-1', 'NEXT DOOR', 'user-abc', allLines, scenes
      );

      const bob = schedule.castMembers.find(c => c.characterName === 'BOB');
      expect(bob).toBeTruthy();
      expect(bob!.totalScenes).toBe(2);
      expect(bob!.sceneNumbers).toContain('1');
      expect(bob!.sceneNumbers).toContain('2');
    });

    it('should extract locations', () => {
      const schedule = service.seedScheduleFromClassifyData(
        'proj-1', 'NEXT DOOR', 'user-abc', allLines, scenes
      );

      const locNames = schedule.locations.map(l => l.name).sort();
      expect(locNames).toContain('BACKYARD');
      expect(locNames).toContain('KITCHEN');
    });

    it('should parse scene headers correctly for scene 1', () => {
      const schedule = service.seedScheduleFromClassifyData(
        'proj-1', 'NEXT DOOR', 'user-abc', allLines, scenes
      );

      const scene1 = schedule.unscheduledScenes[0];
      expect(scene1.intExt).toBe('INT');
      expect(scene1.location).toBe('KITCHEN');
      expect(scene1.timeOfDay).toBe('DAY');
      expect(scene1.needsNight).toBe(false);
    });

    it('should parse scene headers correctly for scene 2', () => {
      const schedule = service.seedScheduleFromClassifyData(
        'proj-1', 'NEXT DOOR', 'user-abc', allLines, scenes
      );

      const scene2 = schedule.unscheduledScenes[1];
      expect(scene2.intExt).toBe('EXT');
      expect(scene2.location).toBe('BACKYARD');
      expect(scene2.timeOfDay).toBe('NIGHT');
      expect(scene2.needsNight).toBe(true);
    });

    it('should have default settings', () => {
      const schedule = service.seedScheduleFromClassifyData(
        'proj-1', 'NEXT DOOR', 'user-abc', allLines, scenes
      );

      expect(schedule.settings).toEqual(getDefaultScheduleSettings());
    });
  });

  // ─────────────────────────────────────────────
  // Seed and Activate
  // ─────────────────────────────────────────────

  describe('seedAndActivateSchedule', () => {
    const allLines: Line[] = [
      createMockLine({ category: 'scene-header', text: 'INT. OFFICE - DAY', index: 0 }),
      createMockCharacterLine('BOSS', 1),
    ];

    const scenes: SceneRef[] = [
      createMockSceneHeader('1', 'INT. OFFICE - DAY', 0, 10),
    ];

    it('should load the schedule into ScheduleStateService', () => {
      const schedule = service.seedAndActivateSchedule(
        'proj-1', 'OFFICE FILM', 'user-abc', allLines, scenes
      );

      expect(stateService.schedule).toBeTruthy();
      expect(stateService.schedule!.projectTitle).toBe('OFFICE FILM');
    });

    it('should return the same schedule that was activated', () => {
      const schedule = service.seedAndActivateSchedule(
        'proj-1', 'OFFICE FILM', 'user-abc', allLines, scenes
      );

      expect(stateService.schedule).toEqual(schedule);
    });

    it('should clear dirty state after activation', () => {
      stateService.markDirty();
      service.seedAndActivateSchedule(
        'proj-1', 'OFFICE FILM', 'user-abc', allLines, scenes
      );

      expect(stateService.isDirty).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // Edge Cases
  // ─────────────────────────────────────────────

  describe('edge cases', () => {
    it('should handle empty allLines', () => {
      const schedule = service.seedScheduleFromClassifyData(
        'proj-1', 'EMPTY', 'user-abc', [], []
      );

      expect(schedule.unscheduledScenes).toEqual([]);
      expect(schedule.castMembers).toEqual([]);
      expect(schedule.locations).toEqual([]);
    });

    it('should handle scenes with no text', () => {
      const scenes: SceneRef[] = [
        { sceneNumberText: '1', index: 0, lastLine: 5 },
      ];
      const charMap = new Map<string, SceneCharacter[]>();

      const result = service.buildScheduleScenes(scenes, charMap);

      expect(result.length).toBe(1);
      expect(result[0].sceneHeader).toBe('');
    });

    it('should handle scenes with no lastLine', () => {
      const scenes: SceneRef[] = [
        { sceneNumberText: '1', text: 'INT. KITCHEN - DAY', index: 0 },
      ];
      const charMap = new Map<string, SceneCharacter[]>();

      const result = service.buildScheduleScenes(scenes, charMap);

      expect(result.length).toBe(1);
      expect(result[0].scriptPageEnd).toBe(0);
    });

    it('should handle V.O. characters in scenes', () => {
      const allLines: Line[] = [
        createMockLine({ category: 'scene-header', text: 'INT. KITCHEN - DAY', index: 0 }),
        createMockCharacterLine('NARRATOR (V.O.)', 1),
        createMockLine({ category: 'dialog', text: 'It was a dark and stormy night.', index: 2 }),
      ];
      const scenes: SceneRef[] = [
        createMockSceneHeader('1', 'INT. KITCHEN - DAY', 0, 5),
      ];

      const schedule = service.seedScheduleFromClassifyData(
        'proj-1', 'VO TEST', 'user-abc', allLines, scenes
      );

      const narrator = schedule.castMembers.find(c => c.characterName === 'NARRATOR');
      expect(narrator).toBeTruthy();
    });
  });
});
