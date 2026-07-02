/**
 * Test description extraction with REAL classify data
 */

const fs = require('fs');
const path = require('path');

// Load FULL real classify data directly
const fullPath = '/Users/timmckiernan/Desktop/sides-Ways/SidesWaysBackEndProd/test-data/classify-data/ALIEN APOCALYPSE-classify-data.json';
const realData = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
const allLines = realData.allLines;

// Convert firstAndLastLinesOfScenes (first 3 scenes only for testing)
const firstAndLastLinesOfScenes = realData.firstAndLastLinesOfScenes.slice(0, 3);
const scenes = firstAndLastLinesOfScenes.map((pair) => {
  const [firstLineData, lastLineData] = pair;
  return {
    sceneNumberText: firstLineData.sceneNumberText || 'N/A',
    text: firstLineData.text,
    index: firstLineData.index,
    lastLine: firstLineData.lastLine,
    category: firstLineData.category
  };
});

console.log('\n🔍 LOADED REAL CLASSIFY DATA');
console.log(`Total lines loaded: ${allLines.length}`);
console.log(`Total scenes loaded: ${scenes.length}`);

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

// Test each scene
console.log('\n\n=== TESTING REAL SCENES ===\n');

scenes.forEach((scene, idx) => {
  console.log(`\n📋 SCENE ${idx + 1}:`);
  console.log(`  Scene Number: ${scene.sceneNumberText || scene.sceneNumber || 'N/A'}`);
  console.log(`  Header: ${scene.text || 'N/A'}`);
  console.log(`  Start Index: ${scene.index}`);
  console.log(`  Last Line: ${scene.lastLine}`);

  const firstLine = scene.index || 0;
  const lastLine = scene.lastLine || firstLine;

  console.log(`  Extracting from line ${firstLine} to ${lastLine}...`);

  const descriptions = extractDescriptionLines(allLines, firstLine, lastLine);

  console.log(`  ✅ Extracted ${descriptions.length} description lines`);

  if (descriptions.length > 0) {
    console.log('\n  First 3 descriptions:');
    descriptions.slice(0, 3).forEach((desc, i) => {
      console.log(`    ${i + 1}. "${desc.substring(0, 80)}${desc.length > 80 ? '...' : ''}"`);
    });
  } else {
    console.log('  ❌ NO DESCRIPTIONS FOUND!');
    console.log('\n  Debugging: Let me check the actual lines...');

    for (let i = firstLine; i <= Math.min(firstLine + 5, lastLine); i++) {
      const line = allLines[i];
      if (line) {
        console.log(`    Line ${i}: category="${line.category}", text="${line.text?.substring(0, 50) || 'NO TEXT'}"`);
      }
    }
  }
});

console.log('\n\n=== TEST COMPLETE ===\n');
