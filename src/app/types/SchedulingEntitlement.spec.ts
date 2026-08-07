import {
  SchedulingEntitlement,
  shouldShowPostLoginChoice,
  shouldShowUploadEntryToggle,
  shouldShowPostUploadFork,
} from './SchedulingEntitlement';

function entitlement(hasSchedulingTier: boolean): SchedulingEntitlement {
  return { hasSchedulingTier };
}

describe('SchedulingEntitlement helpers', () => {
  describe('shouldShowPostLoginChoice (spec 028, unchanged)', () => {
    it('shows post-login choice only for an explicit sign-in with scheduling tier', () => {
      expect(shouldShowPostLoginChoice(entitlement(true), { explicitSignIn: true })).toBe(true);
    });

    it('hides post-login choice on a non-explicit (reload) sign-in even with scheduling tier', () => {
      expect(shouldShowPostLoginChoice(entitlement(true), { explicitSignIn: false })).toBe(false);
    });

    it('hides post-login choice for non-premium users regardless of explicit sign-in', () => {
      expect(shouldShowPostLoginChoice(entitlement(false), { explicitSignIn: true })).toBe(false);
    });
  });

  describe('shouldShowUploadEntryToggle (spec 029 FR-001)', () => {
    it('shows upload entry toggle only when hasSchedulingTier', () => {
      expect(shouldShowUploadEntryToggle(entitlement(true))).toBe(true);
    });

    it('hides upload entry toggle when hasSchedulingTier is false', () => {
      expect(shouldShowUploadEntryToggle(entitlement(false))).toBe(false);
    });

    it('hides upload entry toggle for a null/undefined entitlement', () => {
      expect(shouldShowUploadEntryToggle(undefined as unknown as SchedulingEntitlement)).toBe(false);
      expect(shouldShowUploadEntryToggle(null as unknown as SchedulingEntitlement)).toBe(false);
    });
  });

  describe('shouldShowPostUploadFork (spec 029 FR-003)', () => {
    it('shows post-upload fork only when hasSchedulingTier', () => {
      expect(shouldShowPostUploadFork(entitlement(true))).toBe(true);
    });

    it('hides post-upload fork when hasSchedulingTier is false', () => {
      expect(shouldShowPostUploadFork(entitlement(false))).toBe(false);
    });

    it('hides both the upload entry toggle and the post-upload fork when hasSchedulingTier is false', () => {
      const nonPremium = entitlement(false);
      expect(shouldShowUploadEntryToggle(nonPremium)).toBe(false);
      expect(shouldShowPostUploadFork(nonPremium)).toBe(false);
    });
  });
});
