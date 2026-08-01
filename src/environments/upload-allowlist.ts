/**
 * Upload allowlist — DO NOT put real emails in this committed file.
 *
 * Populated at build time from the UPLOAD_ALLOWLIST env var
 * (comma-separated). See scripts/inject-upload-allowlist.js.
 *
 * Semantics:
 *   - empty array  → any signed-in user may upload (open)
 *   - non-empty    → only listed emails may upload
 */
export const UPLOAD_ALLOWLIST: string[] = [];

/** True when the user may start a script upload under the current allowlist. */
export function isUploadAllowed(
  email: string | null | undefined,
  allowlist: string[] = UPLOAD_ALLOWLIST
): boolean {
  if (!allowlist.length) {
    return true;
  }
  const normalized = email?.trim().toLowerCase();
  return !!normalized && allowlist.includes(normalized);
}
