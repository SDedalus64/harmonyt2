#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the main tariff data
const tariffData = require('../src/data/tariff_processed.json');

// Create output directory
const outputDir = path.join(__dirname, '../src/data/tariff-segments');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Group tariffs by first digit
const segments = {};
const twoDigitSegments = {};

// Initialize segments
for (let i = 0; i <= 9; i++) {
  segments[i] = [];
}

// Also create two-digit segments for chapters with many entries
const largeChapters = new Set();

// First pass - distribute tariffs and identify large chapters
tariffData.tariffs.forEach(entry => {
  const hts8 = entry.hts8 || entry.normalizedCode || '';
  if (hts8.length >= 1) {
    const firstDigit = hts8[0];
    const firstTwoDigits = hts8.substring(0, 2);

    if (segments[firstDigit]) {
      segments[firstDigit].push(entry);
    }
  }
});

// Check which chapters need further segmentation (more than 1000 entries)
Object.entries(segments).forEach(([digit, entries]) => {
  console.log(`Segment ${digit}: ${entries.length} entries`);

  if (entries.length > 1000) {
    // This segment is large, create two-digit segments
    for (let i = 0; i <= 9; i++) {
      const twoDigitKey = `${digit}${i}`;
      twoDigitSegments[twoDigitKey] = [];
    }

    // Redistribute entries into two-digit segments
    entries.forEach(entry => {
      const hts8 = entry.hts8 || entry.normalizedCode || '';
      if (hts8.length >= 2) {
        const firstTwoDigits = hts8.substring(0, 2);
        if (twoDigitSegments[firstTwoDigits]) {
          twoDigitSegments[firstTwoDigits].push(entry);
        }
      }
    });

    largeChapters.add(digit);
  }
});

// Write single-digit segments (for chapters that don't need further segmentation)
Object.entries(segments).forEach(([digit, entries]) => {
  if (!largeChapters.has(digit)) {
    const filename = path.join(outputDir, `tariff-${digit}x.json`);
    fs.writeFileSync(filename, JSON.stringify({
      segment: `${digit}x`,
      description: `HTS codes ${digit}0000000 - ${digit}9999999`,
      count: entries.length,
      entries: entries
    }, null, 2));
    console.log(`Created ${filename} with ${entries.length} entries`);
  }
});

// Write two-digit segments (for large chapters)
Object.entries(twoDigitSegments).forEach(([twoDigits, entries]) => {
  if (entries.length > 0) {
    const filename = path.join(outputDir, `tariff-${twoDigits}.json`);
    fs.writeFileSync(filename, JSON.stringify({
      segment: twoDigits,
      description: `HTS codes ${twoDigits}000000 - ${twoDigits}999999`,
      count: entries.length,
      entries: entries
    }, null, 2));
    console.log(`Created ${filename} with ${entries.length} entries`);
  }
});

// Create an index file that maps prefixes to segment files
const index = {
  singleDigitSegments: {},
  twoDigitSegments: {},
  metadata: {
    totalEntries: tariffData.tariffs.length,
    lastUpdated: tariffData.data_last_updated,
    segmentationDate: new Date().toISOString()
  }
};

// Map single digits to their files
for (let i = 0; i <= 9; i++) {
  if (!largeChapters.has(String(i))) {
    index.singleDigitSegments[i] = `tariff-${i}x.json`;
  }
}

// Map two digits to their files
Object.keys(twoDigitSegments).forEach(twoDigits => {
  if (twoDigitSegments[twoDigits].length > 0) {
    index.twoDigitSegments[twoDigits] = `tariff-${twoDigits}.json`;
  }
});

// Write the index file
fs.writeFileSync(
  path.join(outputDir, 'segment-index.json'),
  JSON.stringify(index, null, 2)
);

console.log('\nSegmentation complete!');
console.log(`Total entries: ${tariffData.tariffs.length}`);
console.log(`Large chapters (segmented by 2 digits): ${Array.from(largeChapters).join(', ')}`);
console.log(`Index file created at: ${path.join(outputDir, 'segment-index.json')}`);
