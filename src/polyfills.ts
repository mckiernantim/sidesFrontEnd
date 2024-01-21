/***************************************************************************************************
 * BROWSER POLYFILLS
 */

// ... (existing browser polyfills)

/***************************************************************************************************
 * Zone JS is required by default for Angular itself.
 */
import 'zone.js/dist/zone';  // Included with Angular CLI.

// Polyfills for Node.js core modules
import 'path-browserify';
// Add any other polyfills for Node.js core modules you need here
// For example, if you need 'util':
// import 'util';

(window as any).global = window;

/***************************************************************************************************
 * APPLICATION IMPORTS
 */

// ... (any other application imports)
