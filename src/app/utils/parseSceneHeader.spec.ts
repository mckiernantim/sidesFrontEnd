import { parseSceneHeader, extractUniqueLocations, ParsedSceneHeader } from './parseSceneHeader';

describe('parseSceneHeader', () => {
  // ─────────────────────────────────────────────
  // Standard INT/EXT formats
  // ─────────────────────────────────────────────
  describe('standard INT/EXT formats', () => {
    it('should parse "INT. KITCHEN - DAY"', () => {
      const result = parseSceneHeader('INT. KITCHEN - DAY');
      expect(result.intExt).toBe('INT');
      expect(result.location).toBe('KITCHEN');
      expect(result.timeOfDay).toBe('DAY');
      expect(result.isOmitted).toBe(false);
      expect(result.needsNight).toBe(false);
    });

    it('should parse "EXT. HOUSE - NIGHT"', () => {
      const result = parseSceneHeader('EXT. HOUSE - NIGHT');
      expect(result.intExt).toBe('EXT');
      expect(result.location).toBe('HOUSE');
      expect(result.timeOfDay).toBe('NIGHT');
      expect(result.needsNight).toBe(true);
    });

    it('should parse "INT BEDROOM - DAY" (no period)', () => {
      const result = parseSceneHeader('INT BEDROOM - DAY');
      expect(result.intExt).toBe('INT');
      expect(result.location).toBe('BEDROOM');
      expect(result.timeOfDay).toBe('DAY');
    });

    it('should parse "EXT PARK - DUSK"', () => {
      const result = parseSceneHeader('EXT PARK - DUSK');
      expect(result.intExt).toBe('EXT');
      expect(result.location).toBe('PARK');
      expect(result.timeOfDay).toBe('DUSK');
      expect(result.needsNight).toBe(true);
    });
  });

  // ─────────────────────────────────────────────
  // INT/EXT combined forms
  // ─────────────────────────────────────────────
  describe('INT/EXT combined forms', () => {
    it('should parse "INT./EXT. CAR - DAY"', () => {
      const result = parseSceneHeader('INT./EXT. CAR - DAY');
      expect(result.intExt).toBe('INT/EXT');
      expect(result.location).toBe('CAR');
      expect(result.timeOfDay).toBe('DAY');
    });

    it('should parse "EXT./INT. RESTAURANT - NIGHT"', () => {
      const result = parseSceneHeader('EXT./INT. RESTAURANT - NIGHT');
      expect(result.intExt).toBe('INT/EXT');
      expect(result.location).toBe('RESTAURANT');
      expect(result.timeOfDay).toBe('NIGHT');
      expect(result.needsNight).toBe(true);
    });

    it('should parse "I/E CAR - DAY" (abbreviated)', () => {
      const result = parseSceneHeader('I/E CAR - DAY');
      expect(result.intExt).toBe('INT/EXT');
      expect(result.location).toBe('CAR');
    });

    it('should parse "E/I HOUSE - NIGHT" (reversed abbreviated)', () => {
      const result = parseSceneHeader('E/I HOUSE - NIGHT');
      expect(result.intExt).toBe('INT/EXT');
      expect(result.location).toBe('HOUSE');
    });
  });

  // ─────────────────────────────────────────────
  // Real NEXT DOOR scene headers from test data
  // ─────────────────────────────────────────────
  describe('real NEXT DOOR scene headers', () => {
    it('should parse "INT. HOUSE - DAY" (scene 1)', () => {
      const result = parseSceneHeader('INT. HOUSE - DAY');
      expect(result.intExt).toBe('INT');
      expect(result.location).toBe('HOUSE');
      expect(result.timeOfDay).toBe('DAY');
    });

    it('should parse "INT. BEDROOM - DAY" (scene 2)', () => {
      const result = parseSceneHeader('INT. BEDROOM - DAY');
      expect(result.intExt).toBe('INT');
      expect(result.location).toBe('BEDROOM');
    });

    it('should parse "INT. FRONT DOOR - DAY" (scene 4)', () => {
      const result = parseSceneHeader('INT. FRONT DOOR - DAY');
      expect(result.intExt).toBe('INT');
      expect(result.location).toBe('FRONT DOOR');
      expect(result.timeOfDay).toBe('DAY');
    });

    it('should parse "EXT. PARK EAST TOWNHOME PARK - DAY" (scene 6)', () => {
      const result = parseSceneHeader('EXT. PARK EAST TOWNHOME PARK - DAY');
      expect(result.intExt).toBe('EXT');
      expect(result.location).toBe('PARK EAST TOWNHOME PARK');
    });

    it('should parse "INT. ANDERSON TOWNHOUSE - DAY" (scene 7)', () => {
      const result = parseSceneHeader('INT. ANDERSON TOWNHOUSE - DAY');
      expect(result.intExt).toBe('INT');
      expect(result.location).toBe('ANDERSON TOWNHOUSE');
    });

    it('should parse "INT. ANDERSON TOWNHOUSE - NIGHT" (scene 8)', () => {
      const result = parseSceneHeader('INT. ANDERSON TOWNHOUSE - NIGHT');
      expect(result.intExt).toBe('INT');
      expect(result.location).toBe('ANDERSON TOWNHOUSE');
      expect(result.timeOfDay).toBe('NIGHT');
      expect(result.needsNight).toBe(true);
    });

    it('should parse "INT. ANDERSON TOWNHOUSE, BEDROOM - DAWN" (scene 12)', () => {
      const result = parseSceneHeader('INT. ANDERSON TOWNHOUSE, BEDROOM - DAWN');
      expect(result.intExt).toBe('INT');
      expect(result.location).toBe('ANDERSON TOWNHOUSE, BEDROOM');
      expect(result.timeOfDay).toBe('DAWN');
      expect(result.needsNight).toBe(false); // DAWN is not night
    });

    it('should parse "INT. ANDERSON TOWNHOUSE, MAIN ROOM - DAY" (scene 13)', () => {
      const result = parseSceneHeader('INT. ANDERSON TOWNHOUSE, MAIN ROOM - DAY');
      expect(result.intExt).toBe('INT');
      expect(result.location).toBe('ANDERSON TOWNHOUSE, MAIN ROOM');
    });

    it('should parse "EXT. PARK EAST AT THE RENAISSANCE - NIGHT" (scene 25)', () => {
      const result = parseSceneHeader('EXT. PARK EAST AT THE RENAISSANCE - NIGHT');
      expect(result.intExt).toBe('EXT');
      expect(result.location).toBe('PARK EAST AT THE RENAISSANCE');
      expect(result.needsNight).toBe(true);
    });

    it('should parse "EXT. ANDERSON TOWNHOUSE, BACKYARD - DAY" (scene 27)', () => {
      const result = parseSceneHeader('EXT. ANDERSON TOWNHOUSE, BACKYARD - DAY');
      expect(result.intExt).toBe('EXT');
      expect(result.location).toBe('ANDERSON TOWNHOUSE, BACKYARD');
    });

    it('should parse "INT. LULABELLE\'S CAFE - DAY" (scene 43)', () => {
      const result = parseSceneHeader('INT. LULABELLE\'S CAFE - DAY');
      expect(result.intExt).toBe('INT');
      expect(result.location).toBe('LULABELLE\'S CAFE');
    });

    it('should parse "INT. HYUNDAI ELANTRA - NIGHT" (scene 45)', () => {
      const result = parseSceneHeader('INT. HYUNDAI ELANTRA - NIGHT');
      expect(result.intExt).toBe('INT');
      expect(result.location).toBe('HYUNDAI ELANTRA');
      expect(result.needsNight).toBe(true);
    });

    it('should parse "EXT. MIDDLESEX UNIVERSITY - DAY" (scene 35)', () => {
      const result = parseSceneHeader('EXT. MIDDLESEX UNIVERSITY - DAY');
      expect(result.intExt).toBe('EXT');
      expect(result.location).toBe('MIDDLESEX UNIVERSITY');
    });

    it('should parse "INT. OFFICE OF THE DEAN - DAY" (scene 36)', () => {
      const result = parseSceneHeader('INT. OFFICE OF THE DEAN - DAY');
      expect(result.intExt).toBe('INT');
      expect(result.location).toBe('OFFICE OF THE DEAN');
    });

    it('should parse "EXT. 1511 E. WOODMERE AVENUE - DAY" (scene 58)', () => {
      const result = parseSceneHeader('EXT. 1511 E. WOODMERE AVENUE - DAY');
      expect(result.intExt).toBe('EXT');
      expect(result.location).toBe('1511 E. WOODMERE AVENUE');
    });

    it('should parse "INT. ANDERSON PARTNERS SUITE - NIGHT" (scene 63)', () => {
      const result = parseSceneHeader('INT. ANDERSON PARTNERS SUITE - NIGHT');
      expect(result.intExt).toBe('INT');
      expect(result.location).toBe('ANDERSON PARTNERS SUITE');
    });

    it('should parse "INT. STAIRWELL - NIGHT" (scene 64)', () => {
      const result = parseSceneHeader('INT. STAIRWELL - NIGHT');
      expect(result.intExt).toBe('INT');
      expect(result.location).toBe('STAIRWELL');
    });

    it('should parse "INT. HOSPITAL - DAY" (scene 70)', () => {
      const result = parseSceneHeader('INT. HOSPITAL - DAY');
      expect(result.intExt).toBe('INT');
      expect(result.location).toBe('HOSPITAL');
    });

    it('should parse "INT. GERALD\'S CAR - DAY" (scene 51)', () => {
      const result = parseSceneHeader('INT. GERALD\'S CAR - DAY');
      expect(result.intExt).toBe('INT');
      expect(result.location).toBe('GERALD\'S CAR');
    });

    it('should parse "INT. DIXON TOWNHOUSE, GERALD\'S BEDROOM CLOSET - DAY" (scene 52)', () => {
      const result = parseSceneHeader('INT. DIXON TOWNHOUSE, GERALD\'S BEDROOM CLOSET - DAY');
      expect(result.intExt).toBe('INT');
      expect(result.location).toBe('DIXON TOWNHOUSE, GERALD\'S BEDROOM CLOSET');
    });
  });

  // ─────────────────────────────────────────────
  // Strip colors
  // ─────────────────────────────────────────────
  describe('strip color assignment', () => {
    it('should assign blue to INT-DAY scenes', () => {
      const result = parseSceneHeader('INT. KITCHEN - DAY');
      expect(result.stripColor).toBe('#3B82F6');
    });

    it('should assign yellow to INT-NIGHT scenes', () => {
      const result = parseSceneHeader('INT. BEDROOM - NIGHT');
      expect(result.stripColor).toBe('#EAB308');
    });

    it('should assign green to EXT-DAY scenes', () => {
      const result = parseSceneHeader('EXT. PARK - DAY');
      expect(result.stripColor).toBe('#22C55E');
    });

    it('should assign orange to EXT-NIGHT scenes', () => {
      const result = parseSceneHeader('EXT. HOUSE - NIGHT');
      expect(result.stripColor).toBe('#F97316');
    });

    it('should assign purple to INT/EXT-DAY scenes', () => {
      const result = parseSceneHeader('INT./EXT. CAR - DAY');
      expect(result.stripColor).toBe('#8B5CF6');
    });

    it('should assign pink to INT/EXT-NIGHT scenes', () => {
      const result = parseSceneHeader('INT./EXT. PATIO - NIGHT');
      expect(result.stripColor).toBe('#EC4899');
    });

    it('should assign gray to omitted scenes', () => {
      const result = parseSceneHeader('OMITTED');
      expect(result.stripColor).toBe('#9CA3AF');
    });
  });

  // ─────────────────────────────────────────────
  // Time of day edge cases
  // ─────────────────────────────────────────────
  describe('time of day variations', () => {
    it('should handle CONTINUOUS', () => {
      const result = parseSceneHeader('INT. HALLWAY - CONTINUOUS');
      expect(result.timeOfDay).toBe('CONTINUOUS');
      expect(result.needsNight).toBe(false);
    });

    it('should handle MOMENTS LATER', () => {
      const result = parseSceneHeader('INT. ROOM - MOMENTS LATER');
      expect(result.timeOfDay).toBe('MOMENTS LATER');
      expect(result.needsNight).toBe(false);
    });

    it('should handle SAME TIME', () => {
      const result = parseSceneHeader('INT. OFFICE - SAME TIME');
      expect(result.timeOfDay).toBe('SAME TIME');
    });

    it('should handle EVENING as night', () => {
      const result = parseSceneHeader('EXT. GARDEN - EVENING');
      expect(result.timeOfDay).toBe('EVENING');
      expect(result.needsNight).toBe(true);
    });

    it('should handle DAWN (not night)', () => {
      const result = parseSceneHeader('EXT. BEACH - DAWN');
      expect(result.timeOfDay).toBe('DAWN');
      expect(result.needsNight).toBe(false);
    });

    it('should handle parenthetical modifiers like DAY (FLASHBACK)', () => {
      const result = parseSceneHeader('INT. CLASSROOM - DAY (FLASHBACK)');
      expect(result.timeOfDay).toBe('DAY');
      expect(result.location).toBe('CLASSROOM');
      expect(result.needsNight).toBe(false);
    });

    it('should handle NIGHT (CONTINUOUS)', () => {
      const result = parseSceneHeader('INT. CAR - NIGHT (CONTINUOUS)');
      expect(result.timeOfDay).toBe('NIGHT');
      expect(result.needsNight).toBe(true);
    });
  });

  // ─────────────────────────────────────────────
  // Special / edge case headers
  // ─────────────────────────────────────────────
  describe('special and edge cases', () => {
    it('should handle OMITTED', () => {
      const result = parseSceneHeader('OMITTED');
      expect(result.isOmitted).toBe(true);
      expect(result.location).toBe('OMITTED');
      expect(result.timeOfDay).toBe('');
    });

    it('should handle OMIT (alternate form)', () => {
      const result = parseSceneHeader('OMIT');
      expect(result.isOmitted).toBe(true);
    });

    it('should handle headers without INT/EXT', () => {
      const result = parseSceneHeader('ESTABLISHING SHOT');
      expect(result.location).toBe('ESTABLISHING SHOT');
      expect(result.intExt).toBe('INT'); // Default
      expect(result.timeOfDay).toBe('');
    });

    it('should handle MONTAGE', () => {
      const result = parseSceneHeader('MONTAGE');
      expect(result.location).toBe('MONTAGE');
    });

    it('should handle INTERCUT', () => {
      const result = parseSceneHeader('INTERCUT');
      expect(result.location).toBe('INTERCUT');
    });

    it('should handle whitespace trimming', () => {
      const result = parseSceneHeader('  INT. KITCHEN - DAY  ');
      expect(result.intExt).toBe('INT');
      expect(result.location).toBe('KITCHEN');
      expect(result.timeOfDay).toBe('DAY');
    });

    it('should handle locations with dashes in name', () => {
      const result = parseSceneHeader('INT. MERRY-GO-ROUND - DAY');
      expect(result.location).toBe('MERRY-GO-ROUND');
      expect(result.timeOfDay).toBe('DAY');
    });

    it('should handle compound location with " - " in it', () => {
      const result = parseSceneHeader('INT. GRAND CENTRAL - PLATFORM 9 - DAY');
      expect(result.location).toBe('GRAND CENTRAL - PLATFORM 9');
      expect(result.timeOfDay).toBe('DAY');
    });

    it('should handle no time of day', () => {
      const result = parseSceneHeader('INT. BASEMENT');
      expect(result.intExt).toBe('INT');
      expect(result.location).toBe('BASEMENT');
      expect(result.timeOfDay).toBe('');
    });
  });

  // ─────────────────────────────────────────────
  // Parse all 72 NEXT DOOR scene headers (bulk validation)
  // ─────────────────────────────────────────────
  describe('bulk parse - all 72 NEXT DOOR scenes', () => {
    const nextDoorHeaders = [
      'INT. HOUSE - DAY', 'INT. BEDROOM - DAY', 'INT. HALLWAY - DAY',
      'INT. FRONT DOOR - DAY', 'EXT. HOUSE - DAY',
      'EXT. PARK EAST TOWNHOME PARK - DAY', 'INT. ANDERSON TOWNHOUSE - DAY',
      'INT. ANDERSON TOWNHOUSE - NIGHT', 'INT. ANDERSON TOWNHOUSE - NIGHT',
      'INT. ANDERSON TOWNHOUSE - DAY', 'EXT. ANDERSON TOWNHOUSE - DAY',
      'INT. ANDERSON TOWNHOUSE, BEDROOM - DAWN',
      'INT. ANDERSON TOWNHOUSE, MAIN ROOM - DAY',
      'EXT. ANDERSON TOWNHOUSE - DAY',
      'INT. ANDERSON TOWNHOUSE, BEDROOM - NIGHT',
      'EXT. DIXON TOWNHOUSE - NIGHT', 'INT. DIXON TOWNHOUSE - NIGHT',
      'INT. DIXON TOWNHOUSE - NIGHT',
      'INT. ANDERSON TOWNHOUSE, BEDROOM - NIGHT',
      'INT. ANDERSON TOWNHOUSE - DAY', 'EXT. ANDERSON TOWNHOUSE - DAY',
      'INT. DIXON TOWNHOUSE - DAY', 'INT. DIXON TOWNHOUSE - NIGHT',
      'INT. ANDERSON TOWNHOUSE, MAIN ROOM - DAY',
      'EXT. PARK EAST AT THE RENAISSANCE - NIGHT',
      'INT. ANDERSON TOWNHOUSE, BATHROOM - NIGHT',
      'EXT. ANDERSON TOWNHOUSE, BACKYARD - DAY',
      'INT. ANDERSON TOWNHOUSE, MAIN ROOM - NIGHT',
      'INT. DIXON TOWNHOUSE - DAY',
      'EXT. PARK EAST AT THE RENAISSANCE - DAY',
      'INT. ANDERSON TOWNHOUSE, MAIN ROOM - DAY',
      'INT. ANDERSON TOWNHOUSE, MAIN ROOM - NIGHT',
      'EXT. JOGGING PATH - DAY', 'INT. DIXON TOWNHOUSE - DAY',
      'EXT. MIDDLESEX UNIVERSITY - DAY', 'INT. OFFICE OF THE DEAN - DAY',
      'EXT. COUNTRY ROAD - DAY', 'INT. HONDA - DAY',
      'EXT. DR. ABRAMS\'S HOUSE - DAY', 'INT. DR. ABRAMS\'S HOUSE - DAY',
      'EXT. ANDERSON TOWNHOUSE - NIGHT',
      'INT. ANDERSON TOWNHOUSE, MAIN ROOM - NIGHT',
      'INT. LULABELLE\'S CAFE - DAY', 'EXT. LULABELLE\'S CAFE - NIGHT',
      'INT. HYUNDAI ELANTRA - NIGHT',
      'INT. ANDERSON TOWNHOUSE, MAIN ROOM - NIGHT',
      'INT. ANDERSON TOWNHOUSE, MAIN ROOM - NIGHT',
      'EXT. DIXON TOWNHOUSE - DAY', 'EXT. ANDERSON TOWNHOUSE - DAY',
      'INT. DIXON TOWNHOUSE - DAY', 'INT. GERALD\'S CAR - DAY',
      'INT. DIXON TOWNHOUSE, GERALD\'S BEDROOM CLOSET - DAY',
      'EXT. DIXON TOWNHOUSE - DAY',
      'INT. DIXON TOWNHOUSE, GERALD\'S BEDROOM CLOSET - DAY',
      'INT. ANDERSON TOWNHOUSE, BEDROOM - DAY',
      'EXT. BAKERSFIELD - DAY', 'INT. HONDA - DAY',
      'EXT. 1511 E. WOODMERE AVENUE - DAY',
      'EXT. ANDERSON TOWNHOUSE - DAY', 'INT. OLD WOMAN\'S HOUSE - DAY',
      'EXT. OLD WOMAN\'S HOUSE - DAY', 'INT. HONDA - DAY',
      'INT. ANDERSON PARTNERS SUITE - NIGHT', 'INT. STAIRWELL - NIGHT',
      'INT. HONDA - NIGHT', 'EXT. ANDERSON TOWNHOUSE - NIGHT',
      'INT. ANDERSON TOWNHOUSE, BEDROOM - NIGHT',
      'INT. ANDERSON TOWNHOUSE, BATHROOM - NIGHT',
      'INT. ANDERSON TOWNHOUSE - NIGHT', 'INT. HOSPITAL - DAY',
      'INT. ANDERSON TOWNHOUSE - DAY', 'INT. OFFICE - DAY',
    ];

    it('should successfully parse all 72 scene headers without errors', () => {
      const results = nextDoorHeaders.map(h => parseSceneHeader(h));
      expect(results.length).toBe(72);

      // Every result should have a location
      for (const r of results) {
        expect(r.location.length).toBeGreaterThan(0);
        expect(['INT', 'EXT', 'INT/EXT']).toContain(r.intExt);
      }
    });

    it('should identify all INT scenes', () => {
      const intScenes = nextDoorHeaders
        .map(h => parseSceneHeader(h))
        .filter(r => r.intExt === 'INT');
      expect(intScenes.length).toBeGreaterThan(40);
    });

    it('should identify all EXT scenes', () => {
      const extScenes = nextDoorHeaders
        .map(h => parseSceneHeader(h))
        .filter(r => r.intExt === 'EXT');
      expect(extScenes.length).toBeGreaterThan(15);
    });

    it('should identify night scenes', () => {
      const nightScenes = nextDoorHeaders
        .map(h => parseSceneHeader(h))
        .filter(r => r.needsNight);
      expect(nightScenes.length).toBeGreaterThan(15);
    });

    it('should not flag any as omitted', () => {
      const omitted = nextDoorHeaders
        .map(h => parseSceneHeader(h))
        .filter(r => r.isOmitted);
      expect(omitted.length).toBe(0);
    });
  });
});

describe('extractUniqueLocations', () => {
  it('should extract unique locations from scene headers', () => {
    const headers = [
      'INT. KITCHEN - DAY',
      'EXT. KITCHEN - NIGHT',
      'INT. BEDROOM - DAY',
      'INT. KITCHEN - NIGHT',
    ];
    const locations = extractUniqueLocations(headers);
    expect(locations).toContain('KITCHEN');
    expect(locations).toContain('BEDROOM');
    expect(locations.length).toBe(2);
  });

  it('should sort locations alphabetically', () => {
    const headers = [
      'INT. ZEBRA ZOO - DAY',
      'INT. APPLE STORE - DAY',
      'EXT. MOUNTAIN - DAY',
    ];
    const locations = extractUniqueLocations(headers);
    expect(locations).toEqual(['APPLE STORE', 'MOUNTAIN', 'ZEBRA ZOO']);
  });

  it('should exclude OMITTED scenes', () => {
    const headers = ['INT. KITCHEN - DAY', 'OMITTED', 'EXT. PARK - DAY'];
    const locations = extractUniqueLocations(headers);
    expect(locations).not.toContain('OMITTED');
    expect(locations.length).toBe(2);
  });

  it('should handle real NEXT DOOR locations', () => {
    const headers = [
      'INT. ANDERSON TOWNHOUSE - DAY',
      'INT. ANDERSON TOWNHOUSE - NIGHT',
      'EXT. ANDERSON TOWNHOUSE - DAY',
      'INT. DIXON TOWNHOUSE - NIGHT',
      'INT. LULABELLE\'S CAFE - DAY',
    ];
    const locations = extractUniqueLocations(headers);
    expect(locations).toContain('ANDERSON TOWNHOUSE');
    expect(locations).toContain('DIXON TOWNHOUSE');
    expect(locations).toContain('LULABELLE\'S CAFE');
  });

  it('should handle empty input', () => {
    const locations = extractUniqueLocations([]);
    expect(locations.length).toBe(0);
  });
});
