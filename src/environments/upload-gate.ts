/**
 * Pre-launch upload gate.
 *
 * true  → only users in Firestore `listed/{email}` may upload
 * false → any signed-in user may upload
 *
 * Override at build time with UPLOAD_GATE=true|false
 * (see scripts/inject-upload-gate.js). No emails in source.
 *
 * Local default OPEN — hosted scriptthing-dev uses listedAccessGateActive
 * for site access; production builds set this via UPLOAD_GATE.
 */
export const UPLOAD_GATE_ACTIVE = false;
