#!/usr/bin/env node
/**
 * Writes src/environments/upload-gate.ts from UPLOAD_GATE.
 *
 *   UPLOAD_GATE=true  npm run build   # listed-collection admins only
 *   UPLOAD_GATE=false npm run build   # open to every signed-in user
 *   (unset)           npm run build   # defaults to true (gated)
 */
const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, '../src/environments/upload-gate.ts');
const raw = (process.env.UPLOAD_GATE ?? 'true').trim().toLowerCase();
const active = !(raw === 'false' || raw === '0' || raw === 'off' || raw === 'open');

const contents = `/**
 * Pre-launch upload gate.
 *
 * true  → only users in Firestore \`listed/{email}\` may upload
 * false → any signed-in user may upload
 *
 * Override at build time with UPLOAD_GATE=true|false
 * (see scripts/inject-upload-gate.js). No emails in source.
 *
 * AUTO-GENERATED — current build: ${active ? 'GATED (listed only)' : 'OPEN'}
 */
export const UPLOAD_GATE_ACTIVE = ${active};
`;

fs.writeFileSync(outPath, contents, 'utf8');
console.log(
  active
    ? '[upload-gate] GATED — only Firestore listed/ members may upload'
    : '[upload-gate] OPEN — any signed-in user may upload'
);
