/**
 * Investigate why OMITTED scenes have invalid lastLine values
 */

const fs = require('fs');

const fullPath = '/Users/timmckiernan/Desktop/sides-Ways/SidesWaysBackEndProd/test-data/classify-data/ALIEN APOCALYPSE-classify-data.json';
const realData = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

console.log('🔍 INVESTIGATING OMITTED SCENES\n');
console.log('='.repeat(80));

// Look at scenes 3-10 in the raw data
const scenesToCheck = realData.firstAndLastLinesOfScenes.slice(0, 10);

scenesToCheck.forEach((pair, idx) => {
  const [firstLineData, lastLineData] = pair;

  console.log(`\nScene ${idx + 1}:`);
  console.log(`  Scene Number: ${firstLineData.sceneNumberText || firstLineData.sceneNumber || 'N/A'}`);
  console.log(`  Header: ${firstLineData.text}`);
  console.log(`  Category: ${firstLineData.category}`);
  console.log(`  First Line:`);
  console.log(`    index: ${firstLineData.index}`);
  console.log(`    lastLine: ${firstLineData.lastLine}`);
  console.log(`  Last Line Data:`);
  console.log(`    index: ${lastLineData?.index || 'N/A'}`);
  console.log(`    text: ${lastLineData?.text?.substring(0, 50) || 'N/A'}`);

  // Check if this is an OMITTED scene
  if (firstLineData.text && firstLineData.text.includes('OMITTED')) {
    console.log(`  ⚠️  This is an OMITTED scene`);
  }

  // Check if lastLine is valid
  if (firstLineData.lastLine < firstLineData.index) {
    console.log(`  ❌ INVALID: lastLine (${firstLineData.lastLine}) < index (${firstLineData.index})`);
  } else {
    const lineSpan = firstLineData.lastLine - firstLineData.index;
    console.log(`  ✅ VALID: Line span = ${lineSpan} lines`);
  }
});

console.log('\n' + '='.repeat(80));
console.log('ANALYSIS COMPLETE\n');
