#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get the filename from command line argument
const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Usage: node segment-tariff-data.js <input-json-file>');
  process.exit(1);
}

// Read the main tariff data
const tariffData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

// Create output directory
const outputDir = path.join(__dirname, './data/tariff-segments');
if (fs.existsSync(outputDir)) {
  fs.rmSync(outputDir, { recursive: true, force: true });
}
fs.mkdirSync(outputDir, { recursive: true });

// Group tariffs by the first three digits of their HTS code
const segments = {};

tariffData.tariffs.forEach(entry => {
  const htsCode = entry.hts8 || entry.normalizedCode || '';
  if (htsCode.length >= 3) {
    const prefix = htsCode.substring(0, 3);
    if (!segments[prefix]) {
      segments[prefix] = [];
    }
    segments[prefix].push(entry);
  }
});

// Write each 3-digit segment to its own file
Object.entries(segments).forEach(([prefix, entries]) => {
  if (entries.length > 0) {
    const filename = path.join(outputDir, `tariff-${prefix}.json`);
    fs.writeFileSync(filename, JSON.stringify({
      segment: prefix,
      description: `HTS codes starting with ${prefix}`,
      count: entries.length,
      entries: entries
    }, null, 2));
    console.log(`Created ${filename} with ${entries.length} entries`);
  }
});

// Create an index file that maps 3-digit prefixes to segment files
const index = {
  segments: {},
  metadata: {
    totalEntries: tariffData.tariffs.length,
    lastUpdated: tariffData.data_last_updated,
    segmentationDate: new Date().toISOString(),
    hts_revision: tariffData.hts_revision || 'Unknown'
  }
};

Object.keys(segments).forEach(prefix => {
  if (segments[prefix].length > 0) {
    index.segments[prefix] = `tariff-${prefix}.json`;
  }
});

// Write the index file
fs.writeFileSync(
  path.join(outputDir, 'segment-index.json'),
  JSON.stringify(index, null, 2)
);

console.log('\nSegmentation complete!');
console.log(`Total entries: ${tariffData.tariffs.length}`);
console.log(`Total segments created: ${Object.keys(segments).length}`);
console.log(`Index file created at: ${path.join(outputDir, 'segment-index.json')}`);
