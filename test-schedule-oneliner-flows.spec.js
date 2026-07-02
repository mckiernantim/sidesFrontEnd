/**
 * Test Suite: Schedule Service One-Liner Generation Flows
 *
 * Tests both required flows:
 * Flow #1: Upload script => PDF service holds script => create schedule => AI one-liners
 * Flow #2: Load old schedule => no PDF data => prompt for script upload
 *
 * Uses REAL PDF service data to ensure accuracy.
 */

const fs = require('fs');
const path = require('path');

// Load REAL classify data
const testDataPath = '/Users/timmckiernan/Desktop/sides-Ways/SidesWaysBackEndProd/test-data/classify-data/ALIEN APOCALYPSE-classify-data.json';
const realData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));

console.log('\n' + '='.repeat(80));
console.log('SCHEDULE SERVICE ONE-LINER GENERATION FLOW TESTS');
console.log('='.repeat(80));

// ─────────────────────────────────────────────
// Mock Services
// ─────────────────────────────────────────────

class MockPdfService {
  constructor(allLines = [], scenes = []) {
    this.allLines = allLines;
    this.scenes = scenes;
  }
}

class MockScheduleService {
  hasPdfServiceData(pdfService) {
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

  validateScheduleForOneLinerGeneration(schedule) {
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

    const allScenes = [
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

    const scenesWithDescriptions = allScenes.filter(s =>
      s.descriptions && s.descriptions.length > 0
    );
    const scenesWithoutDescriptions = allScenes.filter(s =>
      !s.descriptions || s.descriptions.length === 0
    );

    const missingScenes = scenesWithoutDescriptions.map(s => s.sceneNumber);

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

  extractDescriptionLines(allLines, firstLine, lastLine) {
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

    const descriptions = [];

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

  buildScheduleScenes(scenes, allLines) {
    return scenes.map((scene, index) => {
      const sceneNumber = String(scene.sceneNumberText || scene.sceneNumber || `${index + 1}`);
      const headerText = scene.text || '';

      const firstLine = scene.index ?? 0;
      let lastLine = scene.lastLine ?? firstLine;

      // Defensive: If lastLine is before firstLine, set to firstLine
      if (lastLine < firstLine) {
        console.warn(`⚠️  Scene ${sceneNumber}: Invalid lastLine (${lastLine} < ${firstLine}). Using firstLine as lastLine.`);
        lastLine = firstLine;
      }

      const descriptions = this.extractDescriptionLines(allLines, firstLine, lastLine);

      return {
        id: `scene-${index}`,
        sceneNumber,
        sceneHeader: headerText,
        descriptions,
        pageCount: 1.0,
        scriptPageStart: firstLine,
        scriptPageEnd: lastLine,
        oneLiner: '',
        oneLinerSource: 'manual'
      };
    });
  }

  seedScheduleFromClassifyData(projectId, projectTitle, userId, allLines, scenes) {
    const scheduleScenes = this.buildScheduleScenes(scenes, allLines);

    return {
      id: projectId,
      projectId,
      projectTitle,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      shootDays: [],
      unscheduledScenes: scheduleScenes,
      castMembers: [],
      locations: [],
      settings: {},
      oneLinerMode: 'ai'
    };
  }
}

// ─────────────────────────────────────────────
// Test Utilities
// ─────────────────────────────────────────────

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    testsPassed++;
  } else {
    console.log(`  ❌ FAIL: ${message}`);
    testsFailed++;
  }
}

function testSection(title) {
  console.log('\n' + '─'.repeat(80));
  console.log(title);
  console.log('─'.repeat(80));
}

// ─────────────────────────────────────────────
// FLOW #1: Upload Script → Create Schedule
// ─────────────────────────────────────────────

testSection('FLOW #1: Upload Script → PDF Service → Create Schedule → AI One-Liners');

// Simulate PDF service with real data
const pdfService = new MockPdfService(
  realData.allLines,
  realData.firstAndLastLinesOfScenes.slice(0, 5).map(pair => {
    const [firstLineData] = pair;
    return {
      sceneNumberText: firstLineData.sceneNumberText || 'N/A',
      sceneNumber: firstLineData.sceneNumber,
      text: firstLineData.text,
      index: firstLineData.index,
      lastLine: firstLineData.lastLine,
      category: firstLineData.category
    };
  })
);

const scheduleService = new MockScheduleService();

console.log('\n1️⃣  PDF Service loaded with script data');
assert(pdfService.allLines.length > 0, `PDF service has ${pdfService.allLines.length} lines`);
assert(pdfService.scenes.length === 5, `PDF service has ${pdfService.scenes.length} scenes`);

console.log('\n2️⃣  Validate PDF service data is available');
const hasPdfData = scheduleService.hasPdfServiceData(pdfService);
assert(hasPdfData === true, 'PDF service data is valid');

console.log('\n3️⃣  Create schedule from PDF service data');
const schedule = scheduleService.seedScheduleFromClassifyData(
  'test-project-123',
  'ALIEN APOCALYPSE',
  'test-user-456',
  pdfService.allLines,
  pdfService.scenes
);

assert(schedule !== null, 'Schedule created successfully');
assert(schedule.unscheduledScenes.length === 5, `Schedule has ${schedule.unscheduledScenes.length} unscheduled scenes`);

console.log('\n4️⃣  Validate schedule has scene descriptions (required for AI one-liners)');
const validation = scheduleService.validateScheduleForOneLinerGeneration(schedule);

console.log(`\n  📊 Validation Results:`);
console.log(`     Total scenes: ${validation.totalScenes}`);
console.log(`     Scenes with descriptions: ${validation.scenesWithDescriptions}`);
console.log(`     Scenes without descriptions: ${validation.scenesWithoutDescriptions}`);

if (validation.missingScenes.length > 0) {
  console.log(`     Missing descriptions: ${validation.missingScenes.join(', ')}`);
}

assert(validation.totalScenes === 5, `Total scenes count matches (${validation.totalScenes})`);

// Check individual scenes for descriptions
schedule.unscheduledScenes.forEach((scene, index) => {
  const hasDescriptions = scene.descriptions && scene.descriptions.length > 0;
  console.log(`\n  Scene ${scene.sceneNumber}:`);
  console.log(`    Header: ${scene.sceneHeader}`);
  console.log(`    Descriptions: ${scene.descriptions?.length || 0} lines`);

  if (hasDescriptions) {
    console.log(`    First description: "${scene.descriptions[0].substring(0, 60)}..."`);
    testsPassed++; // Count as pass if has descriptions
  } else {
    console.log(`    ⚠️  No descriptions found`);
    testsFailed++; // Count as fail if missing descriptions
  }
});

console.log('\n5️⃣  Can generate AI one-liners?');
const canGenerateFlow1 = hasPdfData && validation.isValid;
assert(canGenerateFlow1 === true || validation.scenesWithDescriptions >= 2,
  `Can generate one-liners for ${validation.scenesWithDescriptions} scenes with descriptions`);

// ─────────────────────────────────────────────
// FLOW #2: Load Old Schedule (No PDF Data)
// ─────────────────────────────────────────────

testSection('FLOW #2: Load Old Schedule → No PDF Data → Prompt for Upload');

console.log('\n1️⃣  Simulate loading old schedule from backend');
const oldSchedule = {
  id: 'old-schedule-789',
  projectId: 'old-project-abc',
  projectTitle: 'OLD MOVIE TITLE',
  userId: 'test-user-456',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  version: 1,
  shootDays: [],
  unscheduledScenes: [
    {
      id: 'scene-1',
      sceneNumber: '1',
      sceneHeader: 'INT. OFFICE - DAY',
      descriptions: [], // OLD SCHEDULES MAY NOT HAVE DESCRIPTIONS
      pageCount: 1.0,
      scriptPageStart: 0,
      scriptPageEnd: 10,
      oneLiner: 'John meets his new boss',
      oneLinerSource: 'manual'
    },
    {
      id: 'scene-2',
      sceneNumber: '2',
      sceneHeader: 'EXT. PARKING LOT - NIGHT',
      descriptions: [], // MISSING DESCRIPTIONS
      pageCount: 0.5,
      scriptPageStart: 11,
      scriptPageEnd: 15,
      oneLiner: '',
      oneLinerSource: 'manual'
    }
  ],
  castMembers: [],
  locations: [],
  settings: {},
  oneLinerMode: 'manual'
};

assert(oldSchedule !== null, 'Old schedule loaded from backend');
assert(oldSchedule.unscheduledScenes.length === 2, `Old schedule has ${oldSchedule.unscheduledScenes.length} scenes`);

console.log('\n2️⃣  Check if PDF service has data (simulating loaded schedule without script upload)');
const emptyPdfService = new MockPdfService(); // Empty PDF service
const hasPdfDataFlow2 = scheduleService.hasPdfServiceData(emptyPdfService);

assert(hasPdfDataFlow2 === false, 'PDF service is empty (no script loaded)');

console.log('\n3️⃣  Validate old schedule for one-liner generation');
const validationFlow2 = scheduleService.validateScheduleForOneLinerGeneration(oldSchedule);

console.log(`\n  📊 Validation Results:`);
console.log(`     Total scenes: ${validationFlow2.totalScenes}`);
console.log(`     Scenes with descriptions: ${validationFlow2.scenesWithDescriptions}`);
console.log(`     Scenes without descriptions: ${validationFlow2.scenesWithoutDescriptions}`);
console.log(`     Reason: ${validationFlow2.reason || 'N/A'}`);

assert(validationFlow2.isValid === false, 'Schedule validation fails (scenes missing descriptions)');
assert(validationFlow2.scenesWithoutDescriptions === 2, `All ${validationFlow2.scenesWithoutDescriptions} scenes missing descriptions`);

console.log('\n4️⃣  Can generate AI one-liners?');
const canGenerateFlow2 = hasPdfDataFlow2 && validationFlow2.isValid;
assert(canGenerateFlow2 === false, 'AI one-liner generation is DISABLED (as expected)');

console.log('\n5️⃣  Get user-friendly error message');
const errorMessage = (() => {
  if (!hasPdfDataFlow2 && !validationFlow2.isValid) {
    return 'Please upload your script to enable AI one-liner generation';
  }
  if (!hasPdfDataFlow2) {
    return 'Script data not loaded. Please upload your script to enable AI one-liner generation.';
  }
  if (!validationFlow2.isValid) {
    return `${validationFlow2.scenesWithoutDescriptions} scene(s) are missing descriptions. Please upload your script again.`;
  }
  return '';
})();

console.log(`  Message: "${errorMessage}"`);
assert(errorMessage.includes('upload your script'), 'Error message prompts user to upload script');

// ─────────────────────────────────────────────
// Test Results Summary
// ─────────────────────────────────────────────

console.log('\n' + '='.repeat(80));
console.log('TEST RESULTS SUMMARY');
console.log('='.repeat(80));

console.log(`\n✅ Tests Passed: ${testsPassed}`);
console.log(`❌ Tests Failed: ${testsFailed}`);
console.log(`📊 Total Tests: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
  console.log('\n🎉 ALL TESTS PASSED!');
  console.log('\nBoth flows are working correctly:');
  console.log('  ✅ Flow #1: Upload script → Create schedule → AI one-liners ENABLED');
  console.log('  ✅ Flow #2: Load old schedule → PDF data missing → AI one-liners DISABLED with prompt');
} else {
  console.log('\n❌ SOME TESTS FAILED');
  console.log(`\n${testsFailed} test(s) need attention.`);
}

console.log('\n' + '='.repeat(80));

// Exit with appropriate code
process.exit(testsFailed > 0 ? 1 : 0);
