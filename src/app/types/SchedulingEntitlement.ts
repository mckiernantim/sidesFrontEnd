/**
 * Scheduling-tier entitlement (spec 028) — view-model types + helpers.
 * hasSchedulingTier is always computed server-side (GET /stripe/subscription-status)
 * and re-derived nowhere else; this file only offers pure display/routing helpers,
 * mirroring utils/founders-offer.ts's separation of pure helpers from the service.
 */

export interface SchedulingEntitlement {
  hasSchedulingTier: boolean;
}

/**
 * Same "explicit sign-in only" contract as founders-offer.ts's pricing
 * redirect (research D5): mid-session reloads must never hijack the user's
 * current page, only an explicit (non-modal) sign-in should.
 */
export function shouldShowPostLoginChoice(
  entitlement: SchedulingEntitlement,
  options: { explicitSignIn: boolean }
): boolean {
  return Boolean(options?.explicitSignIn) && Boolean(entitlement?.hasSchedulingTier);
}

/**
 * Upload-screen dual-path mode (spec 029 D3, data-model.md). Transient UI
 * state only — never persisted to Firestore. Defaults to 'upload'; may be
 * set from the `?entry=upload|saved` query param.
 */
export type UploadEntryMode = 'upload' | 'saved-project';

/**
 * The upload-screen toggle (Upload new script / Use saved project — spec 029
 * FR-001) is the source of truth for dual entry (research D1); it is visible
 * only for scheduling-tier users and never for non-premium accounts.
 */
export function shouldShowUploadEntryToggle(
  entitlement: SchedulingEntitlement
): boolean {
  return Boolean(entitlement?.hasSchedulingTier);
}

/**
 * The post-upload fork (Save as Project / Just make sides — spec 029
 * FR-003) replaces the single-button document-ready Continue for
 * scheduling-tier users only, after a script has been classified.
 */
export function shouldShowPostUploadFork(
  entitlement: SchedulingEntitlement
): boolean {
  return Boolean(entitlement?.hasSchedulingTier);
}
