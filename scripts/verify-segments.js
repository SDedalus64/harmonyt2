#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const segmentIndex = require('../src/data/tariff-segments/segment-index.json');
const originalData = require('../src/data/tariff_processed.json');

console.log('=== Segment Verification ===\n');
console.log('Original file entry count:', originalData.tariffs.length);
console.log('Segment index metadata count:', segmentIndex.metadata.totalEntries);

// Count entries in all segment files
let totalInSegments = 0;
const segmentCounts = {};

// Count single-digit segments
console.log('\nSingle-digit segments:');
Object.entries(segmentIndex.singleDigitSegments).forEach(([digit, file]) => {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/tariff-segments', file)));
  totalInSegments += data.count;
  segmentCounts[file] = data.count;
  console.log(`  ${digit}x (${file}): ${data.count} entries`);
});

// Count two-digit segments
console.log('\nTwo-digit segments:');
Object.entries(segmentIndex.twoDigitSegments).forEach(([digits, file]) => {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/tariff-segments', file)));
  totalInSegments += data.count;
  segmentCounts[file] = data.count;
  console.log(`  ${digits} (${file}): ${data.count} entries`);
});

console.log('\n=== Summary ===');
console.log('Total entries in original file:', originalData.tariffs.length);
console.log('Total entries in segments:', totalInSegments);
console.log('Match:', totalInSegments === originalData.tariffs.length ? 'YES ✓' : 'NO ✗');

if (totalInSegments !== originalData.tariffs.length) {
  console.log('Difference:', Math.abs(totalInSegments - originalData.tariffs.length), 'entries');
}

// Check for any missing HTS codes
console.log('\n=== Checking for missing codes ===');
const segmentCodes = new Set();

// Collect all codes from segments
Object.values(segmentIndex.singleDigitSegments).forEach(file => {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/tariff-segments', file)));
  data.entries.forEach(entry => {
    segmentCodes.add(entry.hts8 || entry.normalizedCode || '');
  });
});

Object.values(segmentIndex.twoDigitSegments).forEach(file => {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/tariff-segments', file)));
  data.entries.forEach(entry => {
    segmentCodes.add(entry.hts8 || entry.normalizedCode || '');
  });
});

// Check if any codes from original are missing in segments
const missingCodes = [];
originalData.tariffs.forEach(entry => {
  const code = entry.hts8 || entry.normalizedCode || '';
  if (code && !segmentCodes.has(code)) {
    missingCodes.push(code);
  }
});

if (missingCodes.length > 0) {
  console.log(`Found ${missingCodes.length} missing codes:`);
  missingCodes.slice(0, 10).forEach(code => console.log(`  - ${code}`));
  if (missingCodes.length > 10) {
    console.log(`  ... and ${missingCodes.length - 10} more`);
  }
} else {
  console.log('All codes from original file are present in segments ✓');
}
