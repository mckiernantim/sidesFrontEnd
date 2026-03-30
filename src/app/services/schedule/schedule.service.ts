import { Injectable } from '@angular/core';
import {
  ProductionSchedule,
  ScheduleScene,
  ShootDay,
  CastMember,
  ScheduleLocation,
  SceneCharacter,
  IntExt,
  getDefaultScheduleSettings,
  getDefaultStripColor,
  formatFifteenMinIncrements,
  DayOutOfDaysEntry,
} from '../../types/Schedule';
import { parseSceneHeader, extractUniqueLocations } from '../../utils/parseSceneHeader';
import {
  buildCharacterSceneMap,
  SceneRef,
  cleanCharacterName,
} from '../../utils/buildCharacterSceneMap';
import { Line } from '../../types/Line';
import { ScheduleStateService } from './schedule-state.service';
import { PdfService } from '../pdf/pdf.service';

/**
 * ScheduleService — bridges the scan-classify pipeline output to the
 * production scheduling data model. Responsible for:
 *
 * 1. Seeding a ProductionSchedule from classified scene data
 * 2. Creating blank schedules
 * 3. Building ScheduleScene[], CastMember[], and ScheduleLocation[] objects
 * 4. UUID generation
 *
 * This service does NOT modify any scan-classify protected files.
 * It only consumes the output (allLines, scenes/firstAndLastLinesOfScenes).
 */
@Injectable({
  providedIn: 'root',
})
export class ScheduleService {
  constructor(private scheduleState: ScheduleStateService) {}

  // ─────────────────────────────────────────────
  // Schedule Creation
  // ─────────────────────────────────────────────

  /**
   * Seed a full ProductionSchedule from classify output data.
   *
   * @param projectId   - The project ID (from Firestore or local)
   * @param projectTitle - Human-readable title ("NEXT DOOR", "VILLAINS", etc.)
   * @param userId       - The authenticated user ID
   * @param allLines     - All classified lines from scan-classify
   * @param scenes       - Scene references from firstAndLastLinesOfScenes or getScenes()
   * @returns A complete ProductionSchedule with all scenes unscheduled
   */
  seedScheduleFromClassifyData(
    projectId: string,
    projectTitle: string,
    userId: string,
    allLines: Line[],
    scenes: SceneRef[]
  ): ProductionSchedule {
    // Build character-scene map from classified data
    const { sceneCharacterMap, allCharacters } = buildCharacterSceneMap(allLines, scenes);

    // Convert classify scenes to ScheduleScene objects
    const scheduleScenes = this.buildScheduleScenes(scenes, sceneCharacterMap, allLines);

    // Build cast members from character data
    const castMembers = this.buildCastMembers(allCharacters, sceneCharacterMap, scheduleScenes);

    // Extract unique locations
    const headers = scenes.map(s => s.text || '').filter(Boolean);
    const locations = this.buildScheduleLocations(headers, scheduleScenes);

    const now = new Date().toISOString();

    const schedule: ProductionSchedule = {
      id: this.generateUUID(),
      projectId,
      projectTitle,
      userId,
      createdAt: now,
      updatedAt: now,
      version: 1,
      shootDays: [],
      unscheduledScenes: scheduleScenes,
      castMembers,
      locations,
      settings: getDefaultScheduleSettings(),
      oneLinerMode: 'ai',
    };

    return schedule;
  }

  /**
   * Creates a blank ProductionSchedule with no scenes.
   * Useful for testing or manual schedule creation.
   */
  createBlankSchedule(
    projectId: string,
    projectTitle: string,
    userId: string
  ): ProductionSchedule {
    const now = new Date().toISOString();

    return {
      id: this.generateUUID(),
      projectId,
      projectTitle,
      userId,
      createdAt: now,
      updatedAt: now,
      version: 1,
      shootDays: [],
      unscheduledScenes: [],
      castMembers: [],
      locations: [],
      settings: getDefaultScheduleSettings(),
      oneLinerMode: 'manual',
    };
  }

  /**
   * Seeds a schedule from PDF service (single source of truth).
   * PDF service must have already processed the script (allLines and scenes populated).
   */
  seedScheduleFromPdfService(
    projectId: string,
    projectTitle: string,
    userId: string,
    pdfService: PdfService
  ): ProductionSchedule {
    console.log('🚀 seedScheduleFromPdfService called');
    console.log(`  PDF Service allLines: ${pdfService.allLines?.length || 0}`);
    console.log(`  PDF Service scenes: ${pdfService.scenes?.length || 0}`);

    if (!pdfService.allLines || pdfService.allLines.length === 0) {
      throw new Error('PDF Service has no allLines. Cannot create schedule.');
    }

    if (!pdfService.scenes || pdfService.scenes.length === 0) {
      throw new Error('PDF Service has no scenes. Cannot create schedule.');
    }

    const schedule = this.seedScheduleFromClassifyData(
      projectId,
      projectTitle,
      userId,
      pdfService.allLines,
      pdfService.scenes
    );

    this.scheduleState.setSchedule(schedule);
    return schedule;
  }

  /**
   * Seeds a schedule and immediately loads it into the ScheduleStateService.
   * @deprecated Use seedScheduleFromPdfService instead
   */
  seedAndActivateSchedule(
    projectId: string,
    projectTitle: string,
    userId: string,
    allLines: Line[],
    scenes: SceneRef[]
  ): ProductionSchedule {
    const schedule = this.seedScheduleFromClassifyData(
      projectId,
      projectTitle,
      userId,
      allLines,
      scenes
    );
    this.scheduleState.setSchedule(schedule);
    return schedule;
  }

  // ─────────────────────────────────────────────
  // Scene Conversion
  // ─────────────────────────────────────────────

  /**
   * Converts classify scene references into ScheduleScene objects.
   * Each scene gets parsed headers, characters, and default scheduling metadata.
   */
  buildScheduleScenes(
    scenes: SceneRef[],
    sceneCharacterMap: Map<string, SceneCharacter[]>,
    allLines: Line[]
  ): ScheduleScene[] {
    console.log(`🏗️ buildScheduleScenes called with ${scenes.length} scenes and ${allLines.length} allLines`);

    return scenes.map((scene, index) => {
      const sceneNumber = String(scene.sceneNumberText || scene.sceneNumber || `${index + 1}`);
      const headerText = scene.text || '';
      const parsed = parseSceneHeader(headerText);

      // Get characters for this scene
      const characters = sceneCharacterMap.get(sceneNumber) || [];

      // Extract description lines for this scene using index (startLine) and lastLine
      const firstLine = scene.index ?? 0;
      let lastLine = scene.lastLine ?? firstLine;

      // Defensive: If lastLine is before firstLine (corrupted data), set to firstLine
      if (lastLine < firstLine) {
        console.warn(`⚠️  Scene ${sceneNumber}: Invalid lastLine (${lastLine} < ${firstLine}). Using firstLine as lastLine.`);
        lastLine = firstLine;
      }

      console.log(`📋 Scene ${sceneNumber} (${headerText}): index=${scene.index}, lastLine=${scene.lastLine}, extracting from ${firstLine} to ${lastLine}`);
      const descriptions = this.extractDescriptionLines(allLines, firstLine, lastLine);
      console.log(`  ✅ Found ${descriptions.length} description lines`);

      // Estimate page count from line range
      const lineSpan = lastLine - firstLine;
      // Rough estimate: ~56 lines per page in standard screenplay format
      const pageCount = Math.max(0.125, Math.round((lineSpan / 56) * 8) / 8);

      const scheduleScene: ScheduleScene = {
        id: this.generateUUID(),
        sceneNumber,
        sceneHeader: headerText,
        intExt: parsed.intExt,
        location: parsed.location,
        timeOfDay: parsed.timeOfDay,
        pageCount,
        scriptPageStart: scene.index ?? 0,
        scriptPageEnd: scene.lastLine ?? 0,
        characters,
        descriptions,
        oneLiner: '',
        oneLinerSource: 'manual',
        oneLinerEdited: false,
        estimatedTimeInFifteenMin: this.estimateTimeFromPageCount(pageCount),
        stripColor: parsed.stripColor,
        isOmitted: parsed.isOmitted,
        needsNight: parsed.needsNight,
        hasStunts: false,
        hasEffects: false,
        hasVehicles: false,
        departmentNotes: [],
      };

      return scheduleScene;
    });
  }

  /**
   * Extracts description/action lines from a scene's line range.
   * Uses the same approach as PDF service - gets lines between firstLine and lastLine,
   * excluding metadata categories.
   */
  private extractDescriptionLines(allLines: Line[], firstLine: number, lastLine: number): string[] {
    const skipCategories = [
      'scene-header',
      'character',
      'page-number',
      'page-number-hidden',
      'more',
      'continue',
      'continue-top',
      'shot',
      'draft-color-text'
    ];

    const descriptions: string[] = [];

    for (let i = firstLine; i <= lastLine && i < allLines.length; i++) {
      const line = allLines[i];
      if (line &&
          !skipCategories.includes(line.category) &&
          line.text &&
          line.text.trim().length > 0) {
        descriptions.push(line.text.trim());
      }
    }

    return descriptions;
  }

  // ─────────────────────────────────────────────
  // Cast Member Building
  // ─────────────────────────────────────────────

  /**
   * Builds CastMember[] from the character-scene map and schedule scenes.
   * Each unique character becomes a CastMember with scene appearances tallied.
   */
  buildCastMembers(
    allCharacters: string[],
    sceneCharacterMap: Map<string, SceneCharacter[]>,
    scheduleScenes: ScheduleScene[]
  ): CastMember[] {
    return allCharacters.map((characterName, index) => {
      // Find all scenes this character appears in
      const sceneNumbers: string[] = [];
      let totalPageCount = 0;

      for (const scene of scheduleScenes) {
        const hasCharacter = scene.characters.some(
          c => c.characterName === characterName
        );
        if (hasCharacter) {
          sceneNumbers.push(scene.sceneNumber);
          totalPageCount += scene.pageCount;
        }
      }

      const castMember: CastMember = {
        id: this.generateUUID(),
        characterName,
        castNumber: index + 1,
        category: sceneNumbers.length >= 5 ? 'principal' : 'day-player',
        sceneNumbers,
        totalScenes: sceneNumbers.length,
        totalPageCount: Math.round(totalPageCount * 100) / 100,
        dayOutOfDays: [],
      };

      return castMember;
    });
  }

  // ─────────────────────────────────────────────
  // Location Building
  // ─────────────────────────────────────────────

  /**
   * Builds ScheduleLocation[] from scene headers and schedule scenes.
   * Groups scenes by normalized location name.
   */
  buildScheduleLocations(
    headers: string[],
    scheduleScenes: ScheduleScene[]
  ): ScheduleLocation[] {
    // Group scenes by location
    const locationMap = new Map<string, {
      fullHeaders: Set<string>;
      intExtSet: Set<IntExt>;
      sceneCount: number;
      totalPageCount: number;
    }>();

    for (const scene of scheduleScenes) {
      if (scene.isOmitted || !scene.location || scene.location === 'OMITTED') continue;

      const locName = scene.location;
      if (!locationMap.has(locName)) {
        locationMap.set(locName, {
          fullHeaders: new Set(),
          intExtSet: new Set(),
          sceneCount: 0,
          totalPageCount: 0,
        });
      }

      const loc = locationMap.get(locName)!;
      loc.fullHeaders.add(scene.sceneHeader);
      loc.intExtSet.add(scene.intExt);
      loc.sceneCount++;
      loc.totalPageCount += scene.pageCount;
    }

    // Convert to ScheduleLocation[]
    return Array.from(locationMap.entries()).map(([name, data]) => ({
      id: this.generateUUID(),
      name,
      fullHeaders: Array.from(data.fullHeaders),
      intExt: Array.from(data.intExtSet),
      sceneCount: data.sceneCount,
      totalPageCount: Math.round(data.totalPageCount * 100) / 100,
    }));
  }

  // ─────────────────────────────────────────────
  // Shoot Day Helpers
  // ─────────────────────────────────────────────

  /**
   * Creates a new empty shoot day with auto-numbered day number.
   */
  createShootDay(dayNumber: number, primaryLocation: string = ''): ShootDay {
    return {
      id: this.generateUUID(),
      dayNumber,
      primaryLocation,
      secondaryLocations: [],
      scenes: [],
      castRequired: [],
      estimatedPageCount: 0,
      estimatedTotalTime: 0,
      notes: '',
    };
  }

  // ─────────────────────────────────────────────
  // Estimation Helpers
  // ─────────────────────────────────────────────

  /**
   * Estimates shooting time (in 15-minute increments) from page count.
   * Industry rule of thumb: ~1 page = ~1 hour of shooting.
   * We round to nearest 15-minute increment.
   *
   * @param pageCount - Page count in 8ths
   * @returns Estimated time in 15-minute increments (minimum 1)
   */
  estimateTimeFromPageCount(pageCount: number): number {
    // 1 page ≈ 4 fifteen-minute increments (1 hour)
    const raw = pageCount * 4;
    return Math.max(1, Math.round(raw));
  }

  /**
   * Formats estimated time from 15-minute increments to readable string.
   * Delegates to the shared utility function.
   */
  formatTime(increments: number): string {
    return formatFifteenMinIncrements(increments);
  }

  // ─────────────────────────────────────────────
  // Validation Helpers
  // ─────────────────────────────────────────────

  /**
   * Checks if the PDF service has valid data required for schedule creation
   * and one-liner generation.
   *
   * @param pdfService - The PDF service instance to check
   * @returns boolean - True if PDF service has allLines and scenes with valid data
   */
  hasPdfServiceData(pdfService?: PdfService): boolean {
    if (!pdfService) {
      console.log('❌ hasPdfServiceData: no pdfService provided');
      return false;
    }

    if (!pdfService.allLines || pdfService.allLines.length === 0) {
      console.log('❌ hasPdfServiceData: pdfService has no allLines');
      return false;
    }

    if (!pdfService.scenes || pdfService.scenes.length === 0) {
      console.log('❌ hasPdfServiceData: pdfService has no scenes');
      return false;
    }

    console.log(`✅ hasPdfServiceData: pdfService has ${pdfService.allLines.length} lines and ${pdfService.scenes.length} scenes`);
    return true;
  }

  /**
   * Checks if a schedule has valid scene descriptions needed for AI one-liner generation.
   * Returns an object with detailed validation results.
   *
   * @param schedule - The production schedule to validate
   * @returns Object with validation results and statistics
   */
  validateScheduleForOneLinerGeneration(schedule: ProductionSchedule): {
    isValid: boolean;
    totalScenes: number;
    scenesWithDescriptions: number;
    scenesWithoutDescriptions: number;
    missingScenes: string[];
    reason?: string;
  } {
    if (!schedule) {
      return {
        isValid: false,
        totalScenes: 0,
        scenesWithDescriptions: 0,
        scenesWithoutDescriptions: 0,
        missingScenes: [],
        reason: 'No schedule provided'
      };
    }

    // Collect all scenes from the schedule
    const allScenes: ScheduleScene[] = [
      ...(schedule.unscheduledScenes || []),
      ...(schedule.shootDays || []).flatMap(day => day.scenes || [])
    ];

    if (allScenes.length === 0) {
      return {
        isValid: false,
        totalScenes: 0,
        scenesWithDescriptions: 0,
        scenesWithoutDescriptions: 0,
        missingScenes: [],
        reason: 'Schedule has no scenes'
      };
    }

    // Check which scenes have descriptions
    const scenesWithDescriptions = allScenes.filter(s =>
      s.descriptions && s.descriptions.length > 0
    );
    const scenesWithoutDescriptions = allScenes.filter(s =>
      !s.descriptions || s.descriptions.length === 0
    );

    const missingScenes = scenesWithoutDescriptions.map(s => s.sceneNumber);

    console.log('📊 validateScheduleForOneLinerGeneration:', {
      totalScenes: allScenes.length,
      scenesWithDescriptions: scenesWithDescriptions.length,
      scenesWithoutDescriptions: scenesWithoutDescriptions.length,
      missingScenes
    });

    return {
      isValid: scenesWithoutDescriptions.length === 0,
      totalScenes: allScenes.length,
      scenesWithDescriptions: scenesWithDescriptions.length,
      scenesWithoutDescriptions: scenesWithoutDescriptions.length,
      missingScenes,
      reason: scenesWithoutDescriptions.length > 0
        ? `${scenesWithoutDescriptions.length} scene(s) missing descriptions`
        : undefined
    };
  }

  // ─────────────────────────────────────────────
  // UUID Generation
  // ─────────────────────────────────────────────

  /**
   * Generates a UUID v4-like string.
   * Uses crypto.getRandomValues when available, falls back to Math.random.
   */
  generateUUID(): string {
    // Try crypto API first (browser & Node 16+)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    // Fallback: manual UUID v4 construction
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
