/**
 * Legacy (pre-project) schedule detection — spec 027 US3.
 *
 * Mirrors `LEGACY_PROJECT_ID_PATTERN` in
 * `SidesWaysBackEndProd/routes/schedule-handler.js` exactly: schedules
 * created before a real project existed carry a client-generated
 * `proj-{timestamp}` placeholder id rather than a Firestore project id.
 * A schedule with no `projectId` at all is treated the same way — there is
 * nothing to hydrate either way.
 */
export const LEGACY_PROJECT_ID_PATTERN = /^proj-\d+$/;

export function isLegacyProjectId(projectId: string | null | undefined): boolean {
  if (!projectId) return true;
  return LEGACY_PROJECT_ID_PATTERN.test(projectId);
}
