/**
 * Test schedule creation flow with defensive fix for invalid lastLine values
 */

const fs = require('fs');

const fullPath = '/Users/timmckiernan/Desktop/sides-Ways/SidesWaysBackEndProd/test-data/classify-data/ALIEN APOCALYPSE-classify-data.json';
const realData = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

console.log('🚀 TESTING SCHEDULE CREATION WITH DEFENSIVE FIX\n');
console.log('='.repeat(80));

const pdfService = {
  allLines: realData.allLines,
  scenes: realData.firstAndLastLinesOfScenes.slice(0, 10).map(pair => {
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

console.log(`📦 PDF Service Data:`);
console.log(`  allLines: ${pdfService.allLines.length} lines`);
console.log(`  scenes: ${pdfService.scenes.length} scenes\n`);

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

function buildScheduleScenes(scenes, allLines) {
  console.log('='.repeat(80));
  console.log('BUILDING SCHEDULE SCENES');
  console.log('='.repeat(80) + '\n');

  const scheduleScenes = [];

  scenes.forEach((scene, index) => {
    const sceneNumber = String(scene.sceneNumberText || scene.sceneNumber || `${index + 1}`);
    const headerText = scene.text || '';

    const firstLine = scene.index ?? 0;
    let lastLine = scene.lastLine ?? firstLine;

    // Defensive: If lastLine is before firstLine (corrupted data), set to firstLine
    if (lastLine < firstLine) {
      console.warn(`⚠️  Scene ${sceneNumber}: Invalid lastLine (${lastLine} < ${firstLine}). Using firstLine as lastLine.`);
      lastLine = firstLine;
    }

    console.log(`📋 Scene ${sceneNumber} (${headerText}):`);
    console.log(`  index=${scene.index}, lastLine=${scene.lastLine} (corrected to ${lastLine})`);

    const descriptions = extractDescriptionLines(allLines, firstLine, lastLine);
    console.log(`  ✅ Found ${descriptions.length} description lines`);

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
      oneLinerSource: 'manual',
      isOmitted: headerText.includes('OMITTED')
    };

    if (descriptions.length > 0) {
      console.log(`  Sample: "${descriptions[0].substring(0, 60)}..."`);
    }

    scheduleScenes.push(scheduleScene);
  });

  return scheduleScenes;
}

const scheduleScenes = buildScheduleScenes(pdfService.scenes, pdfService.allLines);

console.log('\n' + '='.repeat(80));
console.log('VALIDATION SUMMARY');
console.log('='.repeat(80));

const scenesWithDescriptions = scheduleScenes.filter(s => s.descriptions.length > 0 && !s.isOmitted);
const omittedScenes = scheduleScenes.filter(s => s.isOmitted);
const emptyNonOmitted = scheduleScenes.filter(s => s.descriptions.length === 0 && !s.isOmitted);

console.log(`\n✅ Active scenes with descriptions: ${scenesWithDescriptions.length}`);
console.log(`⚠️  OMITTED scenes: ${omittedScenes.length}`);
console.log(`❌ Empty non-OMITTED scenes: ${emptyNonOmitted.length}`);

console.log('\n📊 Breakdown:');
scheduleScenes.forEach((scene, idx) => {
  const status = scene.isOmitted ? '⊘ OMITTED' :
                 scene.descriptions.length > 0 ? '✅ Ready' :
                 '❌ Empty';
  console.log(`  ${idx + 1}. Scene ${scene.sceneNumber}: ${status} (${scene.descriptions.length} lines)`);
});

const testPassed = emptyNonOmitted.length === 0;
console.log('\n' + '='.repeat(80));
console.log(`${testPassed ? '✅ TEST PASSED' : '❌ TEST FAILED'}`);
console.log('='.repeat(80));
console.log(testPassed ?
  '\nAll non-OMITTED scenes have descriptions extracted successfully!' :
  '\nSome non-OMITTED scenes are missing descriptions.');
