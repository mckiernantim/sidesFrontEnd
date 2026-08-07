import { buildDayTitleFromScenes, locationsInShootOrder } from './shoot-day-title';
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

describe('locationsInShootOrder', () => {
  it('collapses consecutive duplicate locations', () => {
    const scenes = [
      createMockScene({ id: 'A', location: 'KITCHEN' }),
      createMockScene({ id: 'B', location: 'KITCHEN' }),
      createMockScene({ id: 'C', location: 'PARK' }),
    ];

    expect(locationsInShootOrder(scenes)).toEqual(['KITCHEN', 'PARK']);
  });

  it('does not collapse non-consecutive duplicates', () => {
    const scenes = [
      createMockScene({ id: 'A', location: 'KITCHEN' }),
      createMockScene({ id: 'B', location: 'PARK' }),
      createMockScene({ id: 'C', location: 'KITCHEN' }),
    ];

    expect(locationsInShootOrder(scenes)).toEqual(['KITCHEN', 'PARK', 'KITCHEN']);
  });

  it('skips blank/whitespace-only locations', () => {
    const scenes = [
      createMockScene({ id: 'A', location: '' }),
      createMockScene({ id: 'B', location: '   ' }),
      createMockScene({ id: 'C', location: 'PARK' }),
    ];

    expect(locationsInShootOrder(scenes)).toEqual(['PARK']);
  });

  it('trims location text before comparing/collapsing', () => {
    const scenes = [
      createMockScene({ id: 'A', location: 'KITCHEN ' }),
      createMockScene({ id: 'B', location: ' KITCHEN' }),
    ];

    expect(locationsInShootOrder(scenes)).toEqual(['KITCHEN']);
  });

  it('returns an empty array for an empty scene list', () => {
    expect(locationsInShootOrder([])).toEqual([]);
  });

  it('returns an empty array when every scene has a blank location', () => {
    const scenes = [
      createMockScene({ id: 'A', location: '' }),
      createMockScene({ id: 'B', location: '' }),
    ];

    expect(locationsInShootOrder(scenes)).toEqual([]);
  });

  it('handles undefined/missing location gracefully', () => {
    const scenes = [
      createMockScene({ id: 'A', location: undefined as unknown as string }),
      createMockScene({ id: 'B', location: 'PARK' }),
    ];

    expect(locationsInShootOrder(scenes)).toEqual(['PARK']);
  });
});

describe('buildDayTitleFromScenes', () => {
  it('joins collapsed locations with " → "', () => {
    const scenes = [
      createMockScene({ id: 'A', location: 'KITCHEN' }),
      createMockScene({ id: 'B', location: 'KITCHEN' }),
      createMockScene({ id: 'C', location: 'PARK' }),
    ];

    expect(buildDayTitleFromScenes(scenes, 1)).toBe('KITCHEN → PARK');
  });

  it('returns "Day N" for an empty day without inventing a location', () => {
    expect(buildDayTitleFromScenes([], 3)).toBe('Day 3');
  });

  it('returns "Day N" when every scene has a blank location', () => {
    const scenes = [createMockScene({ id: 'A', location: '' })];
    expect(buildDayTitleFromScenes(scenes, 5)).toBe('Day 5');
  });

  it('reflects a single location with no arrow', () => {
    const scenes = [
      createMockScene({ id: 'A', location: 'STUDIO A' }),
      createMockScene({ id: 'B', location: 'STUDIO A' }),
    ];

    expect(buildDayTitleFromScenes(scenes, 2)).toBe('STUDIO A');
  });

  it('updates to match a new location sequence after reordering', () => {
    const kitchen = createMockScene({ id: 'A', location: 'KITCHEN' });
    const park = createMockScene({ id: 'B', location: 'PARK' });

    expect(buildDayTitleFromScenes([kitchen, park], 1)).toBe('KITCHEN → PARK');
    expect(buildDayTitleFromScenes([park, kitchen], 1)).toBe('PARK → KITCHEN');
  });
});
