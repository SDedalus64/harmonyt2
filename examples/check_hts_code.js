const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./src/data/tariff_processed.json', 'utf8'));
const tariffs = data.tariffs;

// The HTS code from the screenshot
const searchCode = '84713000';

console.log(`Searching for HTS code: ${searchCode}`);
console.log('Total entries in database:', tariffs.length);

// Direct search
const directMatch = tariffs.find(t => t.hts8 === searchCode);
if (directMatch) {
  console.log('\nDirect match found:');
  console.log(`HTS: ${directMatch.hts8}`);
  console.log(`Description: ${directMatch.brief_description}`);
  console.log(`MFN Rate: ${directMatch.mfn_ad_val_rate}`);
  if (directMatch.additional_duty) {
    console.log(`Additional Duty: ${directMatch.additional_duty}`);
  }
} else {
  console.log('\nNo direct match found.');
}

// Check variations
const variations = [
  searchCode,
  parseInt(searchCode).toString(), // Remove leading zeros if any
  searchCode.padEnd(10, '0'), // Pad to 10 digits
  searchCode.substring(0, 6), // Try 6 digits
  searchCode.substring(0, 4)  // Try 4 digits
];

console.log('\nChecking variations:');
variations.forEach(variant => {
  const matches = tariffs.filter(t => t.hts8 && t.hts8.startsWith(variant));
  if (matches.length > 0) {
    console.log(`\nMatches for "${variant}":`);
    matches.slice(0, 3).forEach(m => {
      console.log(`  ${m.hts8}: ${m.brief_description}`);
    });
  }
});

// Check how HTS codes are stored
console.log('\nSample HTS codes in database:');
const sampleCodes = tariffs
  .filter(t => t.hts8 && t.hts8.startsWith('8471'))
  .slice(0, 5);
sampleCodes.forEach(t => {
  console.log(`  ${t.hts8}: ${t.brief_description}`);
});
