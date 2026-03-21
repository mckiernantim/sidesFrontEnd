import { Injectable } from '@angular/core';
import { Line } from '../../types/Line';
import { SceneRef } from '../../utils/buildCharacterSceneMap';
import { ProductionSchedule } from '../../types/Schedule';
import { ScheduleService } from './schedule.service';
import { ScheduleStateService } from './schedule-state.service';

/**
 * ScheduleTestDataService — Provides test data and utilities for manual testing
 * of the scheduling features, particularly the CastManagerComponent.
 *
 * This service creates realistic mock screenplay data that can be used to
 * populate a schedule with cast members, scenes, and other production data.
 *
 * Usage in browser console:
 * ```
 * const testData = window['ng'].probe(document.body).injector.get('ScheduleTestDataService');
 * testData.seedTestSchedule();
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class ScheduleTestDataService {
  constructor(
    private scheduleService: ScheduleService,
    private scheduleState: ScheduleStateService
  ) {
    // Make this service available globally for console testing
    if (typeof window !== 'undefined') {
      (window as any).scheduleTestData = this;
    }
  }

  // ─────────────────────────────────────────────
  // Public Test Data Factories
  // ─────────────────────────────────────────────

  /**
   * Creates a complete test schedule with realistic screenplay data.
   * This is the primary method for manual testing.
   *
   * @param options - Customization options for the test data
   * @returns A fully populated ProductionSchedule
   */
  createTestSchedule(options: {
    projectTitle?: string;
    characterCount?: number;
    sceneCount?: number;
  } = {}): ProductionSchedule {
    const {
      projectTitle = 'Test Script',
      characterCount = 5,
      sceneCount = 8,
    } = options;

    console.log('🎬 Creating test schedule with:', {
      projectTitle,
      characterCount,
      sceneCount,
    });

    // Generate test screenplay data
    const { allLines, scenes } = this.generateTestScriptData(
      characterCount,
      sceneCount
    );

    console.log(`  ✅ Generated ${allLines.length} lines and ${scenes.length} scenes`);

    // Seed the schedule from the test data
    const schedule = this.scheduleService.seedScheduleFromClassifyData(
      `test-proj-${Date.now()}`,
      projectTitle,
      'test-user',
      allLines,
      scenes
    );

    console.log(`  ✅ Schedule created with ${schedule.castMembers.length} cast members`);
    console.log('  📋 Cast members:', schedule.castMembers.map(c => c.characterName).join(', '));

    return schedule;
  }

  /**
   * Seeds a test schedule directly into the ScheduleStateService.
   * This makes it immediately available to all components.
   *
   * Usage in browser console:
   * ```
   * window.scheduleTestData.seedTestSchedule()
   * ```
   */
  seedTestSchedule(options: {
    projectTitle?: string;
    characterCount?: number;
    sceneCount?: number;
  } = {}): void {
    const schedule = this.createTestSchedule(options);
    this.scheduleState.setSchedule(schedule);
    console.log('✅ Test schedule loaded into ScheduleStateService!');
    console.log('🎭 Cast Members:', schedule.castMembers);
    console.log('🎬 Scenes:', schedule.unscheduledScenes.length);
  }

  /**
   * Creates a small test schedule (3 characters, 4 scenes).
   * Good for quick testing.
   */
  seedSmallTestSchedule(): void {
    this.seedTestSchedule({
      projectTitle: 'Small Test Script',
      characterCount: 3,
      sceneCount: 4,
    });
  }

  /**
   * Creates a large test schedule (10 characters, 20 scenes).
   * Good for testing performance and UI with many items.
   */
  seedLargeTestSchedule(): void {
    this.seedTestSchedule({
      projectTitle: 'Large Test Script',
      characterCount: 10,
      sceneCount: 20,
    });
  }

  /**
   * Clears the current schedule from state.
   */
  clearSchedule(): void {
    this.scheduleState.clearSchedule();
    console.log('✅ Schedule cleared from state');
  }

  // ─────────────────────────────────────────────
  // Test Data Generation
  // ─────────────────────────────────────────────

  /**
   * Generates realistic test screenplay data (allLines and scenes).
   * Creates a mixture of scene headers, character names, dialogue, and action lines.
   */
  private generateTestScriptData(
    characterCount: number,
    sceneCount: number
  ): { allLines: Line[]; scenes: SceneRef[] } {
    const allLines: Line[] = [];
    const scenes: SceneRef[] = [];

    // Pre-generate character names
    const characterNames = this.generateCharacterNames(characterCount);

    let lineIndex = 0;

    for (let sceneIdx = 0; sceneIdx < sceneCount; sceneIdx++) {
      const sceneNumber = `${sceneIdx + 1}`;
      const sceneStartIndex = lineIndex;

      // Add scene header
      const sceneHeader = this.generateSceneHeader(sceneIdx);
      allLines.push(
        this.createLine({
          category: 'scene-header',
          text: sceneHeader,
          index: lineIndex,
          sceneIndex: sceneIdx,
          page: Math.floor(lineIndex / 56) + 1,
          xPos: 100,
          yPos: lineIndex * 12,
        })
      );
      lineIndex++;

      // Add 2-4 action/description lines
      const actionLineCount = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < actionLineCount; i++) {
        allLines.push(
          this.createLine({
            category: 'description',
            text: `Action line ${i + 1} for scene ${sceneNumber}.`,
            index: lineIndex,
            sceneIndex: sceneIdx,
            page: Math.floor(lineIndex / 56) + 1,
            xPos: 100,
            yPos: lineIndex * 12,
          })
        );
        lineIndex++;
      }

      // Add 2-3 characters with dialogue in this scene
      const charactersInScene = this.selectRandomCharacters(
        characterNames,
        Math.min(2 + Math.floor(Math.random() * 2), characterCount)
      );

      for (const characterName of charactersInScene) {
        // Character name line
        allLines.push(
          this.createLine({
            category: 'character',
            text: characterName,
            index: lineIndex,
            sceneIndex: sceneIdx,
            page: Math.floor(lineIndex / 56) + 1,
            xPos: 252, // Standard centered xPos for character names
            yPos: lineIndex * 12,
          })
        );
        lineIndex++;

        // Dialogue line
        allLines.push(
          this.createLine({
            category: 'dialog',
            text: `Some dialogue from ${characterName}.`,
            index: lineIndex,
            sceneIndex: sceneIdx,
            page: Math.floor(lineIndex / 56) + 1,
            xPos: 150,
            yPos: lineIndex * 12,
          })
        );
        lineIndex++;
      }

      // Create scene reference
      const sceneLastIndex = lineIndex - 1;
      scenes.push({
        sceneNumberText: sceneNumber,
        sceneNumber: sceneNumber,
        text: sceneHeader,
        index: sceneStartIndex,
        lastLine: sceneLastIndex,
      });
    }

    return { allLines, scenes };
  }

  /**
   * Generates realistic character names for test data.
   */
  private generateCharacterNames(count: number): string[] {
    const firstNames = [
      'ALEX',
      'JORDAN',
      'MORGAN',
      'CASEY',
      'TAYLOR',
      'RILEY',
      'DREW',
      'CHARLIE',
      'AVERY',
      'QUINN',
      'DAKOTA',
      'REESE',
      'SAWYER',
      'PEYTON',
      'BLAKE',
    ];

    const lastNames = [
      'SMITH',
      'JOHNSON',
      'WILLIAMS',
      'BROWN',
      'JONES',
      'GARCIA',
      'MILLER',
      'DAVIS',
      'RODRIGUEZ',
      'MARTINEZ',
      'HERNANDEZ',
      'LOPEZ',
      'GONZALEZ',
      'WILSON',
      'ANDERSON',
    ];

    const names: string[] = [];
    const used = new Set<string>();

    for (let i = 0; i < count; i++) {
      let name: string;
      let attempts = 0;
      do {
        const first = firstNames[i % firstNames.length];
        const last = lastNames[(i + attempts) % lastNames.length];
        name = `${first} ${last}`;
        attempts++;
      } while (used.has(name) && attempts < 100);

      used.add(name);
      names.push(name);
    }

    return names;
  }

  /**
   * Generates a realistic scene header for test data.
   */
  private generateSceneHeader(sceneIndex: number): string {
    const intExts = ['INT', 'EXT', 'INT/EXT'];
    const locations = [
      'KITCHEN',
      'LIVING ROOM',
      'BEDROOM',
      'OFFICE',
      'COFFEE SHOP',
      'PARK',
      'CAR',
      'RESTAURANT',
      'STREET',
      'WAREHOUSE',
    ];
    const timesOfDay = ['DAY', 'NIGHT', 'DAWN', 'DUSK', 'CONTINUOUS'];

    const intExt = intExts[sceneIndex % intExts.length];
    const location = locations[sceneIndex % locations.length];
    const timeOfDay = timesOfDay[sceneIndex % timesOfDay.length];

    return `${intExt}. ${location} - ${timeOfDay}`;
  }

  /**
   * Selects N random unique items from an array.
   */
  private selectRandomCharacters(characters: string[], count: number): string[] {
    const shuffled = [...characters].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Creates a Line object with required fields and optional overrides.
   */
  private createLine(overrides: Partial<Line>): Line {
    return {
      category: 'description',
      class: 'description',
      index: 0,
      multipleColumn: false,
      page: 1,
      sceneIndex: 0,
      text: '',
      yPos: 0,
      xPos: 100,
      ...overrides,
    };
  }

  // ─────────────────────────────────────────────
  // Inspection Utilities
  // ─────────────────────────────────────────────

  /**
   * Logs the current schedule state to the console.
   * Useful for debugging during manual testing.
   */
  inspectCurrentSchedule(): void {
    const schedule = this.scheduleState.schedule;
    if (!schedule) {
      console.warn('⚠️  No schedule currently loaded');
      return;
    }

    console.log('📊 Current Schedule:', schedule);
    console.log('🎭 Cast Members:', schedule.castMembers);
    console.log('🎬 Unscheduled Scenes:', schedule.unscheduledScenes);
    console.log('📅 Shoot Days:', schedule.shootDays);
    console.log('📍 Locations:', schedule.locations);
  }

  /**
   * Logs cast member statistics to the console.
   */
  inspectCastMembers(): void {
    const schedule = this.scheduleState.schedule;
    if (!schedule) {
      console.warn('⚠️  No schedule currently loaded');
      return;
    }

    console.log('🎭 Cast Members:');
    console.table(
      schedule.castMembers.map((member) => ({
        'Cast #': member.castNumber,
        Character: member.characterName,
        Actor: member.actorName || '(not assigned)',
        Category: member.category,
        Scenes: member.totalScenes,
        'Page Count': member.totalPageCount.toFixed(1),
      }))
    );
  }

  /**
   * Logs scene statistics to the console.
   */
  inspectScenes(): void {
    const schedule = this.scheduleState.schedule;
    if (!schedule) {
      console.warn('⚠️  No schedule currently loaded');
      return;
    }

    const allScenes = [
      ...schedule.unscheduledScenes,
      ...schedule.shootDays.flatMap((day) => day.scenes),
    ];

    console.log('🎬 Scenes:');
    console.table(
      allScenes.map((scene) => ({
        'Scene #': scene.sceneNumber,
        Header: scene.sceneHeader.substring(0, 40),
        Characters: scene.characters.length,
        'Page Count': scene.pageCount.toFixed(2),
        'One-Liner': scene.oneLiner || '(empty)',
      }))
    );
  }
}
