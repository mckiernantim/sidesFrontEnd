import { sortScheduleScenes, SceneSortMode } from './schedule-scene-sort';
import { ScheduleScene } from '../types/Schedule';

// ─────────────────────────────────────────────
// Mock Factory
// ─────────────────────────────────────────────

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

describe('sortScheduleScenes', () => {
  describe('script order', () => {
    it('sorts by numeric scene number ascending', () => {
      const scenes = [
        createMockScene({ id: 'C', sceneNumber: '3', scriptPageStart: 5 }),
        createMockScene({ id: 'A', sceneNumber: '1', scriptPageStart: 1 }),
        createMockScene({ id: 'B', sceneNumber: '2', scriptPageStart: 3 }),
      ];

      const sorted = sortScheduleScenes(scenes, 'script');

      expect(sorted.map((s) => s.id)).toEqual(['A', 'B', 'C']);
    });

    it('orders complex scene numbers like 12B after 12 and before 13', () => {
      const scenes = [
        createMockScene({ id: '13', sceneNumber: '13' }),
        createMockScene({ id: '12B', sceneNumber: '12B' }),
        createMockScene({ id: '12', sceneNumber: '12' }),
      ];

      const sorted = sortScheduleScenes(scenes, 'script');

      expect(sorted.map((s) => s.id)).toEqual(['12', '12B', '13']);
    });

    it('falls back to scriptPageStart then sceneNumber string when scene number has no numeric prefix', () => {
      const scenes = [
        createMockScene({ id: 'X', sceneNumber: 'X', scriptPageStart: 10 }),
        createMockScene({ id: 'A-prefix', sceneNumber: 'A-prefix', scriptPageStart: 2 }),
      ];

      const sorted = sortScheduleScenes(scenes, 'script');

      expect(sorted.map((s) => s.id)).toEqual(['A-prefix', 'X']);
    });

    it('is stable for exact ties', () => {
      const scenes = [
        createMockScene({ id: 'first', sceneNumber: '1' }),
        createMockScene({ id: 'second', sceneNumber: '1' }),
        createMockScene({ id: 'third', sceneNumber: '1' }),
      ];

      const sorted = sortScheduleScenes(scenes, 'script');

      expect(sorted.map((s) => s.id)).toEqual(['first', 'second', 'third']);
    });
  });

  describe('intExt', () => {
    it('groups INT before INT/EXT before EXT, stable by script order within group', () => {
      const scenes = [
        createMockScene({ id: 'ext-2', intExt: 'EXT', sceneNumber: '2' }),
        createMockScene({ id: 'int-3', intExt: 'INT', sceneNumber: '3' }),
        createMockScene({ id: 'both-1', intExt: 'INT/EXT', sceneNumber: '1' }),
        createMockScene({ id: 'int-1', intExt: 'INT', sceneNumber: '1' }),
        createMockScene({ id: 'ext-1', intExt: 'EXT', sceneNumber: '1' }),
      ];

      const sorted = sortScheduleScenes(scenes, 'intExt');

      expect(sorted.map((s) => s.id)).toEqual([
        'int-1',
        'int-3',
        'both-1',
        'ext-1',
        'ext-2',
      ]);
    });

    it('sorts unknown/missing intExt values last', () => {
      const scenes = [
        createMockScene({ id: 'unknown', intExt: '' as any }),
        createMockScene({ id: 'ext', intExt: 'EXT' }),
        createMockScene({ id: 'int', intExt: 'INT' }),
      ];

      const sorted = sortScheduleScenes(scenes, 'intExt');

      expect(sorted.map((s) => s.id)).toEqual(['int', 'ext', 'unknown']);
    });
  });

  describe('location', () => {
    it('sorts alphabetically by location', () => {
      const scenes = [
        createMockScene({ id: 'c', location: 'CHURCH' }),
        createMockScene({ id: 'a', location: 'APARTMENT' }),
        createMockScene({ id: 'b', location: 'BACKYARD' }),
      ];

      const sorted = sortScheduleScenes(scenes, 'location');

      expect(sorted.map((s) => s.id)).toEqual(['a', 'b', 'c']);
    });

    it('sorts scenes with an empty location last', () => {
      const scenes = [
        createMockScene({ id: 'empty', location: '' }),
        createMockScene({ id: 'kitchen', location: 'KITCHEN' }),
      ];

      const sorted = sortScheduleScenes(scenes, 'location');

      expect(sorted.map((s) => s.id)).toEqual(['kitchen', 'empty']);
    });

    it('breaks location ties by script order', () => {
      const scenes = [
        createMockScene({ id: 'kitchen-3', location: 'KITCHEN', sceneNumber: '3' }),
        createMockScene({ id: 'kitchen-1', location: 'KITCHEN', sceneNumber: '1' }),
      ];

      const sorted = sortScheduleScenes(scenes, 'location');

      expect(sorted.map((s) => s.id)).toEqual(['kitchen-1', 'kitchen-3']);
    });
  });

  describe('timeOfDay', () => {
    it('orders DAY, DAWN, DUSK, NIGHT, CONTINUOUS, then other', () => {
      const scenes = [
        createMockScene({ id: 'other', timeOfDay: 'MAGIC HOUR' }),
        createMockScene({ id: 'continuous', timeOfDay: 'CONTINUOUS' }),
        createMockScene({ id: 'night', timeOfDay: 'NIGHT' }),
        createMockScene({ id: 'dusk', timeOfDay: 'DUSK' }),
        createMockScene({ id: 'dawn', timeOfDay: 'DAWN' }),
        createMockScene({ id: 'day', timeOfDay: 'DAY' }),
      ];

      const sorted = sortScheduleScenes(scenes, 'timeOfDay');

      expect(sorted.map((s) => s.id)).toEqual([
        'day',
        'dawn',
        'dusk',
        'night',
        'continuous',
        'other',
      ]);
    });
  });

  describe('invariants', () => {
    it('does not mutate the input array', () => {
      const scenes = [
        createMockScene({ id: 'B', sceneNumber: '2' }),
        createMockScene({ id: 'A', sceneNumber: '1' }),
      ];
      const original = [...scenes];

      sortScheduleScenes(scenes, 'script');

      expect(scenes).toEqual(original);
    });

    it('does not alter one-liner text, source, or edited flag for any mode', () => {
      const modes: SceneSortMode[] = ['script', 'intExt', 'location', 'timeOfDay'];
      const scenes = [
        createMockScene({
          id: 'A',
          oneLiner: 'Alice finds the key.',
          oneLinerSource: 'manual',
          oneLinerEdited: true,
        }),
        createMockScene({
          id: 'B',
          oneLiner: 'Bob loses the map.',
          oneLinerSource: 'ai',
          oneLinerEdited: false,
        }),
      ];

      modes.forEach((mode) => {
        const sorted = sortScheduleScenes(scenes, mode);
        const a = sorted.find((s) => s.id === 'A')!;
        const b = sorted.find((s) => s.id === 'B')!;
        expect(a.oneLiner).toBe('Alice finds the key.');
        expect(a.oneLinerSource).toBe('manual');
        expect(a.oneLinerEdited).toBe(true);
        expect(b.oneLiner).toBe('Bob loses the map.');
        expect(b.oneLinerSource).toBe('ai');
        expect(b.oneLinerEdited).toBe(false);
      });
    });

    it('does not alter scene identity fields', () => {
      const scene = createMockScene({ id: 'scene-A', sceneNumber: '1' });
      const [sorted] = sortScheduleScenes([scene], 'script');
      expect(sorted.id).toBe('scene-A');
      expect(sorted).toBe(scene);
    });

    it('handles an empty array for every mode', () => {
      const modes: SceneSortMode[] = ['script', 'intExt', 'location', 'timeOfDay'];
      modes.forEach((mode) => {
        expect(sortScheduleScenes([], mode)).toEqual([]);
      });
    });
  });
});
