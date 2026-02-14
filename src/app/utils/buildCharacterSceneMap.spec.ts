import {
  buildCharacterSceneMap,
  cleanCharacterName,
  isRealCharacter,
  SceneRef,
} from './buildCharacterSceneMap';
import { Line } from '../types/Line';

// ─────────────────────────────────────────────
// Test Helpers
// ─────────────────────────────────────────────

/**
 * Creates a mock Line object for testing.
 * Defaults to a character line at the standard character xPos (252).
 */
function mockLine(overrides: Partial<Line>): Line {
  return {
    yPos: 500,
    xPos: 252,     // Standard character position
    page: 1,
    text: 'CHLOE',
    index: 0,
    category: 'character',
    class: '',
    multipleColumn: false,
    sceneIndex: 0,
    ...overrides,
  };
}

/**
 * Creates a mock SceneRef for testing.
 */
function mockSceneRef(overrides: Partial<SceneRef> = {}): SceneRef {
  return {
    sceneNumberText: '1',
    text: 'INT. KITCHEN - DAY',
    index: 0,
    lastLine: 20,
    ...overrides,
  };
}

// ─────────────────────────────────────────────
// cleanCharacterName Tests
// ─────────────────────────────────────────────
describe('cleanCharacterName', () => {
  it('should return a plain character name unchanged', () => {
    expect(cleanCharacterName('CHLOE')).toBe('CHLOE');
  });

  it('should strip (V.O.) from character name', () => {
    expect(cleanCharacterName('MICHAEL (V.O.)')).toBe('MICHAEL');
  });

  it('should strip (O.S.) from character name', () => {
    expect(cleanCharacterName('GERALD (O.S.)')).toBe('GERALD');
  });

  it('should strip (CONT\'D) from character name', () => {
    expect(cleanCharacterName('CHLOE (CONT\'D)')).toBe('CHLOE');
  });

  it('should strip (CONTD) without apostrophe', () => {
    expect(cleanCharacterName('NANCY (CONTD)')).toBe('NANCY');
  });

  it('should strip (V.O) without trailing period', () => {
    expect(cleanCharacterName('MICHAEL (V.O)')).toBe('MICHAEL');
  });

  it('should handle multiple spaces', () => {
    expect(cleanCharacterName('DEAN O\'BRIEN')).toBe('DEAN O\'BRIEN');
  });

  it('should strip all extensions combined', () => {
    // Edge case: should handle if somehow both V.O. and CONT'D appear
    const result = cleanCharacterName('GERALD (V.O.) (CONT\'D)');
    expect(result).toBe('GERALD');
  });

  it('should trim whitespace', () => {
    expect(cleanCharacterName('  JASON  ')).toBe('JASON');
  });

  it('should handle DR. prefix correctly', () => {
    expect(cleanCharacterName('DR. ABRAMS')).toBe('DR. ABRAMS');
  });

  it('should handle AUTOMATED VOICE (V.O.)', () => {
    expect(cleanCharacterName('AUTOMATED VOICE (V.O.)')).toBe('AUTOMATED VOICE');
  });

  it('should handle VOICE (V.O.)', () => {
    expect(cleanCharacterName('VOICE (V.O.)')).toBe('VOICE');
  });
});

// ─────────────────────────────────────────────
// isRealCharacter Tests
// ─────────────────────────────────────────────
describe('isRealCharacter', () => {
  it('should accept a standard character line', () => {
    const line = mockLine({ text: 'CHLOE', category: 'character', xPos: 252 });
    expect(isRealCharacter(line)).toBe(true);
  });

  it('should accept character at exactly MIN_CHARACTER_XPOS (200)', () => {
    const line = mockLine({ text: 'JASON', category: 'character', xPos: 200 });
    expect(isRealCharacter(line)).toBe(true);
  });

  it('should reject non-character category lines', () => {
    const line = mockLine({ text: 'CHLOE', category: 'dialogue', xPos: 252 });
    expect(isRealCharacter(line)).toBe(false);
  });

  it('should reject scene-header category lines', () => {
    const line = mockLine({ text: 'THE KITCHEN', category: 'scene-header', xPos: 108 });
    expect(isRealCharacter(line)).toBe(false);
  });

  it('should reject lines with low xPos (misclassified locations)', () => {
    const line = mockLine({ text: 'THE MAIN ROOM', category: 'character', xPos: 108 });
    expect(isRealCharacter(line)).toBe(false);
  });

  it('should reject parenthetical lines', () => {
    const line = mockLine({ text: '(laughs nervously)', category: 'character', xPos: 252 });
    expect(isRealCharacter(line)).toBe(false);
  });

  it('should reject "(concerned)"', () => {
    const line = mockLine({ text: '(concerned)', category: 'character', xPos: 252 });
    expect(isRealCharacter(line)).toBe(false);
  });

  it('should reject "(smiles)"', () => {
    const line = mockLine({ text: '(smiles)', category: 'character', xPos: 252 });
    expect(isRealCharacter(line)).toBe(false);
  });

  // Real misclassifications from NEXT DOOR data
  it('should reject "THE MAIN ROOM" (misclassified location)', () => {
    const line = mockLine({ text: 'THE MAIN ROOM', category: 'character', xPos: 108 });
    expect(isRealCharacter(line)).toBe(false);
  });

  it('should reject "LIVING ROOM" (misclassified location)', () => {
    const line = mockLine({ text: 'LIVING ROOM', category: 'character', xPos: 108 });
    expect(isRealCharacter(line)).toBe(false);
  });

  it('should reject "THREE MONTHS LATER" (time jump)', () => {
    const line = mockLine({ text: 'THREE MONTHS LATER', category: 'character', xPos: 252 });
    expect(isRealCharacter(line)).toBe(false);
  });

  it('should reject "BACK TO SCENE" (transition)', () => {
    const line = mockLine({ text: 'BACK TO SCENE', category: 'character', xPos: 252 });
    expect(isRealCharacter(line)).toBe(false);
  });

  it('should reject "INSERT - CLIPPING" (insert)', () => {
    const line = mockLine({ text: 'INSERT - CLIPPING', category: 'character', xPos: 252 });
    expect(isRealCharacter(line)).toBe(false);
  });

  it('should reject "INSERT - PHOTO" (insert)', () => {
    const line = mockLine({ text: 'INSERT - PHOTO', category: 'character', xPos: 252 });
    expect(isRealCharacter(line)).toBe(false);
  });

  it('should reject "THE END" (end marker)', () => {
    const line = mockLine({ text: 'THE END', category: 'character', xPos: 252 });
    expect(isRealCharacter(line)).toBe(false);
  });

  it('should reject "FOUND" (sound effect)', () => {
    const line = mockLine({ text: 'FOUND', category: 'character', xPos: 252 });
    expect(isRealCharacter(line)).toBe(false);
  });

  it('should reject "STOP." (sound effect)', () => {
    const line = mockLine({ text: 'STOP.', category: 'character', xPos: 252 });
    expect(isRealCharacter(line)).toBe(false);
  });

  it('should reject "LOCKED." (sound effect)', () => {
    const line = mockLine({ text: 'LOCKED.', category: 'character', xPos: 252 });
    expect(isRealCharacter(line)).toBe(false);
  });

  it('should reject "BEEP." (sound effect)', () => {
    const line = mockLine({ text: 'BEEP.', category: 'character', xPos: 252 });
    expect(isRealCharacter(line)).toBe(false);
  });

  it('should reject "DOORBELL CHIME." (sound effect)', () => {
    const line = mockLine({ text: 'DOORBELL CHIME.', category: 'character', xPos: 252 });
    expect(isRealCharacter(line)).toBe(false);
  });

  it('should reject "SECOND FLOOR" (location descriptor)', () => {
    const line = mockLine({ text: 'SECOND FLOOR', category: 'character', xPos: 252 });
    expect(isRealCharacter(line)).toBe(false);
  });

  it('should reject "CHLOE\'S POV" (POV shot)', () => {
    const line = mockLine({ text: 'CHLOE\'S POV', category: 'character', xPos: 252 });
    expect(isRealCharacter(line)).toBe(false);
  });

  it('should reject empty text', () => {
    const line = mockLine({ text: '', category: 'character', xPos: 252 });
    expect(isRealCharacter(line)).toBe(false);
  });

  // Real valid characters from NEXT DOOR
  it('should accept "CHLOE"', () => {
    expect(isRealCharacter(mockLine({ text: 'CHLOE', xPos: 252 }))).toBe(true);
  });

  it('should accept "MICHAEL"', () => {
    expect(isRealCharacter(mockLine({ text: 'MICHAEL', xPos: 252 }))).toBe(true);
  });

  it('should accept "GERALD"', () => {
    expect(isRealCharacter(mockLine({ text: 'GERALD', xPos: 252 }))).toBe(true);
  });

  it('should accept "NANCY"', () => {
    expect(isRealCharacter(mockLine({ text: 'NANCY', xPos: 252 }))).toBe(true);
  });

  it('should accept "DR. ABRAMS"', () => {
    expect(isRealCharacter(mockLine({ text: 'DR. ABRAMS', xPos: 252 }))).toBe(true);
  });

  it('should accept "DEAN O\'BRIEN"', () => {
    expect(isRealCharacter(mockLine({ text: 'DEAN O\'BRIEN', xPos: 252 }))).toBe(true);
  });

  it('should accept "OLD WOMAN"', () => {
    expect(isRealCharacter(mockLine({ text: 'OLD WOMAN', xPos: 252 }))).toBe(true);
  });

  it('should accept "AUTOMATED VOICE"', () => {
    expect(isRealCharacter(mockLine({ text: 'AUTOMATED VOICE', xPos: 252 }))).toBe(true);
  });

  it('should accept "FEMALE PARALEGAL"', () => {
    expect(isRealCharacter(mockLine({ text: 'FEMALE PARALEGAL', xPos: 252 }))).toBe(true);
  });

  it('should accept "MICHAEL (V.O.)"', () => {
    expect(isRealCharacter(mockLine({ text: 'MICHAEL (V.O.)', xPos: 252 }))).toBe(true);
  });

  it('should accept "GERALD (O.S.)"', () => {
    expect(isRealCharacter(mockLine({ text: 'GERALD (O.S.)', xPos: 252 }))).toBe(true);
  });

  it('should accept "VOICEMAIL (V.O.)"', () => {
    expect(isRealCharacter(mockLine({ text: 'VOICEMAIL (V.O.)', xPos: 252 }))).toBe(true);
  });
});

// ─────────────────────────────────────────────
// buildCharacterSceneMap Tests
// ─────────────────────────────────────────────
describe('buildCharacterSceneMap', () => {
  it('should build a character map from simple scene data', () => {
    const scenes: SceneRef[] = [
      mockSceneRef({ sceneNumberText: '1', index: 0, lastLine: 10 }),
      mockSceneRef({ sceneNumberText: '2', index: 11, lastLine: 20 }),
    ];

    const lines: Line[] = [
      mockLine({ text: 'CHLOE', index: 2, category: 'character', xPos: 252 }),
      mockLine({ text: 'dialogue line', index: 3, category: 'dialogue', xPos: 252 }),
      mockLine({ text: 'MICHAEL', index: 5, category: 'character', xPos: 252 }),
      mockLine({ text: 'CHLOE', index: 12, category: 'character', xPos: 252 }),
    ];

    const result = buildCharacterSceneMap(lines, scenes);

    // Scene 1 should have CHLOE and MICHAEL
    const scene1Chars = result.sceneCharacterMap.get('1')!;
    expect(scene1Chars.length).toBe(2);
    expect(scene1Chars.map(c => c.characterName)).toContain('CHLOE');
    expect(scene1Chars.map(c => c.characterName)).toContain('MICHAEL');

    // Scene 2 should have only CHLOE
    const scene2Chars = result.sceneCharacterMap.get('2')!;
    expect(scene2Chars.length).toBe(1);
    expect(scene2Chars[0].characterName).toBe('CHLOE');

    // Full cast should be CHLOE and MICHAEL
    expect(result.allCharacters).toEqual(['CHLOE', 'MICHAEL']);
  });

  it('should deduplicate characters within a scene', () => {
    const scenes: SceneRef[] = [
      mockSceneRef({ sceneNumberText: '1', index: 0, lastLine: 20 }),
    ];

    const lines: Line[] = [
      mockLine({ text: 'CHLOE', index: 2, category: 'character', xPos: 252 }),
      mockLine({ text: 'CHLOE', index: 5, category: 'character', xPos: 252 }),
      mockLine({ text: 'CHLOE', index: 10, category: 'character', xPos: 252 }),
    ];

    const result = buildCharacterSceneMap(lines, scenes);
    const scene1Chars = result.sceneCharacterMap.get('1')!;
    expect(scene1Chars.length).toBe(1);
    expect(scene1Chars[0].characterName).toBe('CHLOE');
    expect(scene1Chars[0].hasDialogue).toBe(true);
  });

  it('should detect voice over characters', () => {
    const scenes: SceneRef[] = [
      mockSceneRef({ sceneNumberText: '1', index: 0, lastLine: 10 }),
    ];

    const lines: Line[] = [
      mockLine({ text: 'MICHAEL (V.O.)', index: 2, category: 'character', xPos: 252 }),
    ];

    const result = buildCharacterSceneMap(lines, scenes);
    const chars = result.sceneCharacterMap.get('1')!;
    expect(chars.length).toBe(1);
    expect(chars[0].characterName).toBe('MICHAEL');
    expect(chars[0].isVoiceOver).toBe(true);
  });

  it('should detect off-screen characters', () => {
    const scenes: SceneRef[] = [
      mockSceneRef({ sceneNumberText: '1', index: 0, lastLine: 10 }),
    ];

    const lines: Line[] = [
      mockLine({ text: 'GERALD (O.S.)', index: 2, category: 'character', xPos: 252 }),
    ];

    const result = buildCharacterSceneMap(lines, scenes);
    const chars = result.sceneCharacterMap.get('1')!;
    expect(chars[0].characterName).toBe('GERALD');
    expect(chars[0].isOffScreen).toBe(true);
  });

  it('should mark character as not VO-only when they appear both V.O. and on screen', () => {
    const scenes: SceneRef[] = [
      mockSceneRef({ sceneNumberText: '1', index: 0, lastLine: 20 }),
    ];

    const lines: Line[] = [
      mockLine({ text: 'MICHAEL (V.O.)', index: 2, category: 'character', xPos: 252 }),
      mockLine({ text: 'MICHAEL', index: 8, category: 'character', xPos: 252 }),
    ];

    const result = buildCharacterSceneMap(lines, scenes);
    const chars = result.sceneCharacterMap.get('1')!;
    expect(chars.length).toBe(1);
    expect(chars[0].characterName).toBe('MICHAEL');
    expect(chars[0].isVoiceOver).toBe(false); // Not VO-only since they appear on screen too
  });

  it('should filter out misclassified lines', () => {
    const scenes: SceneRef[] = [
      mockSceneRef({ sceneNumberText: '1', index: 0, lastLine: 20 }),
    ];

    const lines: Line[] = [
      mockLine({ text: 'CHLOE', index: 2, category: 'character', xPos: 252 }),
      // Misclassified lines
      mockLine({ text: 'THE MAIN ROOM', index: 5, category: 'character', xPos: 108 }),
      mockLine({ text: '(laughs)', index: 7, category: 'character', xPos: 252 }),
      mockLine({ text: 'THREE MONTHS LATER', index: 9, category: 'character', xPos: 252 }),
      mockLine({ text: 'INSERT - PHOTO', index: 11, category: 'character', xPos: 252 }),
      mockLine({ text: 'THE END', index: 15, category: 'character', xPos: 252 }),
    ];

    const result = buildCharacterSceneMap(lines, scenes);
    const chars = result.sceneCharacterMap.get('1')!;
    expect(chars.length).toBe(1);
    expect(chars[0].characterName).toBe('CHLOE');
  });

  it('should ignore lines outside any scene range', () => {
    const scenes: SceneRef[] = [
      mockSceneRef({ sceneNumberText: '1', index: 10, lastLine: 20 }),
    ];

    const lines: Line[] = [
      // Index 5 is before scene 1 starts (index 10)
      mockLine({ text: 'CHLOE', index: 5, category: 'character', xPos: 252 }),
      // Index 15 is within scene 1
      mockLine({ text: 'MICHAEL', index: 15, category: 'character', xPos: 252 }),
      // Index 25 is after scene 1 ends (lastLine 20)
      mockLine({ text: 'GERALD', index: 25, category: 'character', xPos: 252 }),
    ];

    const result = buildCharacterSceneMap(lines, scenes);
    expect(result.sceneCharacterMap.has('1')).toBe(true);
    expect(result.sceneCharacterMap.get('1')!.length).toBe(1);
    expect(result.sceneCharacterMap.get('1')![0].characterName).toBe('MICHAEL');
    expect(result.allCharacters).toEqual(['MICHAEL']);
  });

  it('should handle empty lines array', () => {
    const scenes: SceneRef[] = [
      mockSceneRef({ sceneNumberText: '1', index: 0, lastLine: 20 }),
    ];

    const result = buildCharacterSceneMap([], scenes);
    expect(result.sceneCharacterMap.size).toBe(0);
    expect(result.allCharacters.length).toBe(0);
  });

  it('should handle empty scenes array', () => {
    const lines: Line[] = [
      mockLine({ text: 'CHLOE', index: 2, category: 'character', xPos: 252 }),
    ];

    const result = buildCharacterSceneMap(lines, []);
    expect(result.sceneCharacterMap.size).toBe(0);
    expect(result.allCharacters.length).toBe(0);
  });

  it('should sort all characters alphabetically', () => {
    const scenes: SceneRef[] = [
      mockSceneRef({ sceneNumberText: '1', index: 0, lastLine: 30 }),
    ];

    const lines: Line[] = [
      mockLine({ text: 'ZEBRA', index: 2, category: 'character', xPos: 252 }),
      mockLine({ text: 'ALPHA', index: 5, category: 'character', xPos: 252 }),
      mockLine({ text: 'MICHAEL', index: 8, category: 'character', xPos: 252 }),
    ];

    const result = buildCharacterSceneMap(lines, scenes);
    expect(result.allCharacters).toEqual(['ALPHA', 'MICHAEL', 'ZEBRA']);
  });

  it('should handle characters across multiple scenes', () => {
    const scenes: SceneRef[] = [
      mockSceneRef({ sceneNumberText: '1', index: 0, lastLine: 10 }),
      mockSceneRef({ sceneNumberText: '2', index: 11, lastLine: 20 }),
      mockSceneRef({ sceneNumberText: '3', index: 21, lastLine: 30 }),
    ];

    const lines: Line[] = [
      mockLine({ text: 'CHLOE', index: 2, category: 'character', xPos: 252 }),
      mockLine({ text: 'MICHAEL', index: 5, category: 'character', xPos: 252 }),
      mockLine({ text: 'CHLOE', index: 12, category: 'character', xPos: 252 }),
      mockLine({ text: 'GERALD', index: 15, category: 'character', xPos: 252 }),
      mockLine({ text: 'CHLOE', index: 22, category: 'character', xPos: 252 }),
      mockLine({ text: 'MICHAEL', index: 25, category: 'character', xPos: 252 }),
      mockLine({ text: 'GERALD', index: 28, category: 'character', xPos: 252 }),
    ];

    const result = buildCharacterSceneMap(lines, scenes);

    // CHLOE appears in all 3 scenes
    expect(result.sceneCharacterMap.get('1')!.find(c => c.characterName === 'CHLOE')).toBeTruthy();
    expect(result.sceneCharacterMap.get('2')!.find(c => c.characterName === 'CHLOE')).toBeTruthy();
    expect(result.sceneCharacterMap.get('3')!.find(c => c.characterName === 'CHLOE')).toBeTruthy();

    // MICHAEL appears in scenes 1 and 3
    expect(result.sceneCharacterMap.get('1')!.find(c => c.characterName === 'MICHAEL')).toBeTruthy();
    expect(result.sceneCharacterMap.get('2')!.find(c => c.characterName === 'MICHAEL')).toBeUndefined();
    expect(result.sceneCharacterMap.get('3')!.find(c => c.characterName === 'MICHAEL')).toBeTruthy();

    // GERALD appears in scenes 2 and 3
    expect(result.sceneCharacterMap.get('1')!.find(c => c.characterName === 'GERALD')).toBeUndefined();
    expect(result.sceneCharacterMap.get('2')!.find(c => c.characterName === 'GERALD')).toBeTruthy();
    expect(result.sceneCharacterMap.get('3')!.find(c => c.characterName === 'GERALD')).toBeTruthy();

    expect(result.allCharacters).toEqual(['CHLOE', 'GERALD', 'MICHAEL']);
  });

  it('should handle CONT\'D character names without duplication', () => {
    const scenes: SceneRef[] = [
      mockSceneRef({ sceneNumberText: '1', index: 0, lastLine: 20 }),
    ];

    const lines: Line[] = [
      mockLine({ text: 'CHLOE', index: 2, category: 'character', xPos: 252 }),
      mockLine({ text: 'CHLOE (CONT\'D)', index: 8, category: 'character', xPos: 252 }),
    ];

    const result = buildCharacterSceneMap(lines, scenes);
    const chars = result.sceneCharacterMap.get('1')!;
    expect(chars.length).toBe(1);
    expect(chars[0].characterName).toBe('CHLOE');
    expect(result.allCharacters).toEqual(['CHLOE']);
  });

  it('should use sceneNumber as fallback if sceneNumberText is missing', () => {
    const scenes: SceneRef[] = [
      { sceneNumber: 5, index: 0, lastLine: 10 },
    ];

    const lines: Line[] = [
      mockLine({ text: 'CHLOE', index: 2, category: 'character', xPos: 252 }),
    ];

    const result = buildCharacterSceneMap(lines, scenes);
    expect(result.sceneCharacterMap.has('5')).toBe(true);
  });
});
