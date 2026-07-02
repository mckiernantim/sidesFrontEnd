/**
 * Test the complete schedule creation flow using real classify data
 * Simulates what happens when schedule service creates a schedule from PDF service
 */

const fs = require('fs');
const path = require('path');

// Load REAL classify data
const fullPath = '/Users/timmckiernan/Desktop/sides-Ways/SidesWaysBackEndProd/test-data/classify-data/ALIEN APOCALYPSE-classify-data.json';
const realData = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

console.log('🚀 TESTING SCHEDULE CREATION FLOW\n');
console.log('='.repeat(80));

// Simulate PDF Service data structure
const pdfService = {
  allLines: realData.allLines,
  scenes: realData.firstAndLastLinesOfScenes.slice(0, 5).map(pair => {
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
};

console.log(`\n📦 PDF Service Data:`);
console.log(`  allLines: ${pdfService.allLines.length} lines`);
console.log(`  scenes: ${pdfService.scenes.length} scenes`);

// The extraction function from schedule.service.ts
function extractDescriptionLines(allLines, firstLine, lastLine) {
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

// Simulate buildScheduleScenes method
function buildScheduleScenes(scenes, allLines) {
  console.log(`\n🏗️  buildScheduleScenes called with ${scenes.length} scenes and ${allLines.length} allLines`);

  const scheduleScenes = [];

  scenes.forEach((scene, index) => {
    const sceneNumber = String(scene.sceneNumberText || scene.sceneNumber || `${index + 1}`);
    const headerText = scene.text || '';

    // Get line range
    const firstLine = scene.index ?? 0;
    const lastLine = scene.lastLine ?? firstLine;

    console.log(`\n📋 Scene ${sceneNumber} (${headerText}):`);
    console.log(`  index=${scene.index}, lastLine=${scene.lastLine}`);
    console.log(`  Extracting from ${firstLine} to ${lastLine}...`);

    const descriptions = extractDescriptionLines(allLines, firstLine, lastLine);
    console.log(`  ✅ Found ${descriptions.length} description lines`);

    // Estimate page count from line range
    const lineSpan = lastLine - firstLine;
    const pageCount = Math.max(0.125, Math.round((lineSpan / 56) * 8) / 8);

    const scheduleScene = {
      id: `scene-${index}`,
      sceneNumber,
      sceneHeader: headerText,
      pageCount,
      scriptPageStart: firstLine,
      scriptPageEnd: lastLine,
      descriptions,
      oneLiner: '',
      oneLinerSource: 'manual'
    };

    if (descriptions.length > 0) {
      console.log(`  First 3 descriptions:`);
      descriptions.slice(0, 3).forEach((desc, i) => {
        console.log(`    ${i + 1}. "${desc.substring(0, 80)}${desc.length > 80 ? '...' : ''}"`);
      });
    }

    scheduleScenes.push(scheduleScene);
  });

  return scheduleScenes;
}

// Test the complete flow
console.log('\n' + '='.repeat(80));
console.log('TESTING SCHEDULE SCENE CREATION');
console.log('='.repeat(80));

const scheduleScenes = buildScheduleScenes(pdfService.scenes, pdfService.allLines);

console.log('\n' + '='.repeat(80));
console.log('RESULTS SUMMARY');
console.log('='.repeat(80));
console.log(`\n✅ Created ${scheduleScenes.length} schedule scenes`);

scheduleScenes.forEach((scene, idx) => {
  console.log(`\n${idx + 1}. Scene ${scene.sceneNumber}:`);
  console.log(`   Header: ${scene.sceneHeader}`);
  console.log(`   Page Count: ${scene.pageCount}`);
  console.log(`   Script Pages: ${scene.scriptPageStart} - ${scene.scriptPageEnd}`);
  console.log(`   Descriptions: ${scene.descriptions.length} lines`);
  console.log(`   Ready for AI: ${scene.descriptions.length > 0 ? '✅ YES' : '❌ NO'}`);
});

// Verify all scenes have descriptions
const scenesWithDescriptions = scheduleScenes.filter(s => s.descriptions.length > 0);
const scenesWithoutDescriptions = scheduleScenes.filter(s => s.descriptions.length === 0);

console.log('\n' + '='.repeat(80));
console.log('VALIDATION');
console.log('='.repeat(80));
console.log(`\n✅ Scenes with descriptions: ${scenesWithDescriptions.length}/${scheduleScenes.length}`);
if (scenesWithoutDescriptions.length > 0) {
  console.log(`\n⚠️  Scenes WITHOUT descriptions: ${scenesWithoutDescriptions.length}`);
  scenesWithoutDescriptions.forEach(s => {
    console.log(`   - Scene ${s.sceneNumber}: ${s.sceneHeader}`);
  });
}

console.log('\n' + '='.repeat(80));
console.log('TEST COMPLETE');
console.log('='.repeat(80));
console.log(`\n${scenesWithDescriptions.length === scheduleScenes.length ? '✅ PASS' : '❌ FAIL'}: All scenes should have descriptions extracted`);
