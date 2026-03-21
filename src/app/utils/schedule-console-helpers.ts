/**
 * Schedule Console Helpers for Browser Testing
 *
 * This file provides easy-to-use functions accessible from the browser console
 * for testing the scheduling features, particularly the CastManagerComponent.
 *
 * These helpers are automatically registered to the window object when the app loads.
 *
 * Usage:
 * Open browser console and run:
 * ```
 * scheduleHelpers.seed()          // Seed test schedule
 * scheduleHelpers.inspect()       // Inspect current schedule
 * scheduleHelpers.clear()         // Clear schedule
 * scheduleHelpers.seedSmall()     // Seed small test data
 * scheduleHelpers.seedLarge()     // Seed large test data
 * ```
 */

import { ApplicationRef } from '@angular/core';
import { ScheduleTestDataService } from '../services/schedule/schedule-test-data.service';
import { ScheduleStateService } from '../services/schedule/schedule-state.service';

export interface ScheduleConsoleHelpers {
  /**
   * Seeds a test schedule with default settings (5 characters, 8 scenes).
   */
  seed: () => void;

  /**
   * Seeds a small test schedule (3 characters, 4 scenes).
   */
  seedSmall: () => void;

  /**
   * Seeds a large test schedule (10 characters, 20 scenes).
   */
  seedLarge: () => void;

  /**
   * Clears the current schedule.
   */
  clear: () => void;

  /**
   * Inspects the current schedule and logs details to console.
   */
  inspect: () => void;

  /**
   * Inspects cast members and logs a table to console.
   */
  inspectCast: () => void;

  /**
   * Inspects scenes and logs a table to console.
   */
  inspectScenes: () => void;

  /**
   * Shows help information for all available commands.
   */
  help: () => void;

  /**
   * Gets the current schedule object.
   */
  getSchedule: () => any;
}

/**
 * Registers schedule console helpers to the window object.
 * Call this from app.component.ts after the app initializes.
 */
export function registerScheduleConsoleHelpers(appRef: ApplicationRef): void {
  if (typeof window === 'undefined') {
    return; // Not in browser environment
  }

  try {
    // Get services from the root injector
    const injector = appRef.injector;
    const testDataService = injector.get(ScheduleTestDataService);
    const stateService = injector.get(ScheduleStateService);

    const helpers: ScheduleConsoleHelpers = {
      seed: () => {
        console.log('🎬 Seeding test schedule with default settings...');
        testDataService.seedTestSchedule();
      },

      seedSmall: () => {
        console.log('🎬 Seeding small test schedule...');
        testDataService.seedSmallTestSchedule();
      },

      seedLarge: () => {
        console.log('🎬 Seeding large test schedule...');
        testDataService.seedLargeTestSchedule();
      },

      clear: () => {
        console.log('🧹 Clearing schedule...');
        testDataService.clearSchedule();
      },

      inspect: () => {
        testDataService.inspectCurrentSchedule();
      },

      inspectCast: () => {
        testDataService.inspectCastMembers();
      },

      inspectScenes: () => {
        testDataService.inspectScenes();
      },

      getSchedule: () => {
        const schedule = stateService.schedule;
        if (!schedule) {
          console.warn('⚠️  No schedule currently loaded');
          return null;
        }
        return schedule;
      },

      help: () => {
        console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           Schedule Testing Console Helpers                     ║
╚═══════════════════════════════════════════════════════════════╝

Available commands:

  scheduleHelpers.seed()         - Seed default test schedule
                                   (5 characters, 8 scenes)

  scheduleHelpers.seedSmall()    - Seed small test schedule
                                   (3 characters, 4 scenes)

  scheduleHelpers.seedLarge()    - Seed large test schedule
                                   (10 characters, 20 scenes)

  scheduleHelpers.clear()        - Clear current schedule

  scheduleHelpers.inspect()      - Inspect current schedule state

  scheduleHelpers.inspectCast()  - Show cast members table

  scheduleHelpers.inspectScenes() - Show scenes table

  scheduleHelpers.getSchedule()  - Get current schedule object

  scheduleHelpers.help()         - Show this help message

Example workflow:
  1. scheduleHelpers.seed()
  2. scheduleHelpers.inspectCast()
  3. Navigate to Cast Manager tab to see the populated data
        `);
      },
    };

    // Register to window
    (window as any).scheduleHelpers = helpers;

    console.log(`
✅ Schedule console helpers loaded!
Type 'scheduleHelpers.help()' for available commands.
    `);
  } catch (error) {
    console.error('Failed to register schedule console helpers:', error);
  }
}

/**
 * Declares the global window interface extension for TypeScript.
 */
declare global {
  interface Window {
    scheduleHelpers?: ScheduleConsoleHelpers;
  }
}
