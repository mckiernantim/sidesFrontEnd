/**
 * Pre-launch upload gate.
 *
 * true  → only users in Firestore `listed/{email}` may upload
 * false → any signed-in user may upload
 *
 * Override at build time with UPLOAD_GATE=true|false
 * (see scripts/inject-upload-gate.js). No emails in source.
 */
export const UPLOAD_GATE_ACTIVE = true;
