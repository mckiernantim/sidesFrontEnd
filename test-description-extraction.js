/**
 * Test to verify description extraction from allLines
 */

// Mock real allLines data for a single scene
const mockAllLines = [
  // Line 0 - Scene header
  {
    index: 0,
    category: 'scene-header',
    text: 'INT. AMTRACK TRAIN -- LATER DAY',
    sceneNumber: '5',
    sceneNumberText: '5',
    class: 'scene-header',
    page: 5,
    pageNumber: 5,
    sceneIndex: 0,
    multipleColumn: false,
    yPos: 100,
    xPos: 100
  },
  // Line 1 - Action/Description
  {
    index: 1,
    category: 'description',
    text: 'Sarah sits by the window, watching the landscape blur past.',
    sceneNumber: '5',
    sceneNumberText: '5',
    class: 'description',
    page: 5,
    pageNumber: 5,
    sceneIndex: 0,
    multipleColumn: false,
    yPos: 120,
    xPos: 50
  },
  // Line 2 - Another action line
  {
    index: 2,
    category: 'description',
    text: 'She pulls out a worn photograph from her jacket pocket.',
    sceneNumber: '5',
    sceneNumberText: '5',
    class: 'description',
    page: 5,
    pageNumber: 5,
    sceneIndex: 0,
    multipleColumn: false,
    yPos: 140,
    xPos: 50
  },
  // Line 3 - Character name
  {
    index: 3,
    category: 'character',
    text: 'SARAH',
    sceneNumber: '5',
    sceneNumberText: '5',
    class: 'character',
    page: 5,
    pageNumber: 5,
    sceneIndex: 0,
    multipleColumn: false,
    yPos: 160,
    xPos: 250
  },
  // Line 4 - Dialogue
  {
    index: 4,
    category: 'dialog',
    text: 'I should have stayed.',
    sceneNumber: '5',
    sceneNumberText: '5',
    class: 'dialog',
    page: 5,
    pageNumber: 5,
    sceneIndex: 0,
    multipleColumn: false,
    yPos: 180,
    xPos: 150
  },
  // Line 5 - More action
  {
    index: 5,
    category: 'description',
    text: 'She clutches the photo tighter as tears well up.',
    sceneNumber: '5',
    sceneNumberText: '5',
    class: 'description',
    page: 5,
    pageNumber: 5,
    sceneIndex: 0,
    multipleColumn: false,
    yPos: 200,
    xPos: 50
  },
  // Line 6 - Next scene header
  {
    index: 6,
    category: 'scene-header',
    text: 'EXT. TRAIN STATION - DAY',
    sceneNumber: '6',
    sceneNumberText: '6',
    class: 'scene-header',
    page: 6,
    pageNumber: 6,
    sceneIndex: 1,
    multipleColumn: false,
    yPos: 220,
    xPos: 100
  }
];

const mockSceneRef = {
  sceneNumberText: '5',
  sceneNumber: '5',
  text: 'INT. AMTRACK TRAIN -- LATER DAY',
  index: 0,        // Scene starts at line 0
  lastLine: 5      // Scene ends at line 5 (before next scene header at line 6)
};

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

  console.log('\n=== EXTRACTION PROCESS ===');
  console.log(`Extracting from line ${firstLine} to ${lastLine}`);
  console.log(`Total lines in allLines: ${allLines.length}`);

  for (let i = firstLine; i <= lastLine && i < allLines.length; i++) {
    const line = allLines[i];
    console.log(`\nLine ${i}:`);
    console.log(`  Category: "${line.category}"`);
    console.log(`  Text: "${line.text}"`);

    const shouldSkip = skipCategories.includes(line.category);
    console.log(`  Skip? ${shouldSkip}`);

    if (line &&
        !skipCategories.includes(line.category) &&
        line.text &&
        line.text.trim().length > 0) {
      console.log(`  ✓ ADDED to descriptions`);
      descriptions.push(line.text.trim());
    } else {
      console.log(`  ✗ SKIPPED`);
    }
  }

  console.log(`\n=== EXTRACTION COMPLETE ===`);
  console.log(`Total descriptions extracted: ${descriptions.length}`);
  console.log('Descriptions:', descriptions);

  return descriptions;
}

// Run the test
console.log('\n\n🧪 TESTING DESCRIPTION EXTRACTION\n');
console.log('Mock Scene:', mockSceneRef);

const result = extractDescriptionLines(mockAllLines, mockSceneRef.index, mockSceneRef.lastLine);

console.log('\n\n📊 FINAL RESULT:');
console.log('Extracted descriptions:', result);
console.log('\n✅ Expected: 4 description lines (indices 1, 2, 4, 5)');
console.log(`✅ Actual: ${result.length} description lines`);

if (result.length === 4) {
  console.log('\n✅ TEST PASSED - Correct number of descriptions extracted!');
  console.log('\nDescriptions should be:');
  console.log('1. "Sarah sits by the window, watching the landscape blur past."');
  console.log('2. "She pulls out a worn photograph from her jacket pocket."');
  console.log('3. "I should have stayed." (dialogue)');
  console.log('4. "She clutches the photo tighter as tears well up."');
} else {
  console.log('\n❌ TEST FAILED - Expected 4 descriptions, got', result.length);
}
