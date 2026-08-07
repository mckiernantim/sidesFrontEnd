import { isLegacyProjectId, LEGACY_PROJECT_ID_PATTERN } from './legacyProjectId';

describe('legacyProjectId', () => {
  describe('isLegacyProjectId', () => {
    it('returns true for a proj-{timestamp} placeholder id', () => {
      expect(isLegacyProjectId('proj-1712345678901')).toBe(true);
    });

    it('returns true for a null/undefined projectId', () => {
      expect(isLegacyProjectId(null)).toBe(true);
      expect(isLegacyProjectId(undefined)).toBe(true);
    });

    it('returns true for an empty string', () => {
      expect(isLegacyProjectId('')).toBe(true);
    });

    it('returns false for a real (Firestore-style) project id', () => {
      expect(isLegacyProjectId('a1b2c3d4-5678-90ab-cdef-1234567890ab')).toBe(false);
    });

    it('returns false for an id that merely starts with proj- but is not numeric', () => {
      expect(isLegacyProjectId('proj-abc')).toBe(false);
    });
  });

  describe('LEGACY_PROJECT_ID_PATTERN', () => {
    it('matches the exact shape the backend generates', () => {
      expect(LEGACY_PROJECT_ID_PATTERN.test(`proj-${Date.now()}`)).toBe(true);
    });
  });
});
