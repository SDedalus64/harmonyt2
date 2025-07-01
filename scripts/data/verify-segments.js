#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Get the filename from command line argument
const inputFile = process.argv[2];
if (!inputFile) {
  console.error("Usage: node verify-segments.js <input-json-file>");
  process.exit(1);
}

const segmentIndexPath = path.join(
  __dirname,
  "./data/tariff-segments/segment-index.json",
);
if (!fs.existsSync(segmentIndexPath)) {
  console.error(`Error: Segment index file not found at ${segmentIndexPath}`);
  process.exit(1);
}

const segmentIndex = require(segmentIndexPath);
const originalData = JSON.parse(fs.readFileSync(inputFile, "utf8"));

console.log("=== Segment Verification ===\n");
console.log("Original file entry count:", originalData.tariffs.length);
console.log(
  "Segment index metadata count:",
  segmentIndex.metadata.totalEntries,
);

// Count entries in all segment files
let totalInSegments = 0;
const segmentCounts = {};

console.log("\nVerifying 3-digit segments:");
Object.entries(segmentIndex.segments).forEach(([prefix, file]) => {
  const segmentPath = path.join(__dirname, "./data/tariff-segments", file);
  if (fs.existsSync(segmentPath)) {
    const data = JSON.parse(fs.readFileSync(segmentPath));
    totalInSegments += data.count;
    segmentCounts[file] = data.count;
    console.log(`  ${prefix} (${file}): ${data.count} entries`);
  } else {
    console.error(`  [ERROR] Missing segment file: ${file}`);
  }
});

console.log("\n=== Summary ===");
console.log("Total entries in original file:", originalData.tariffs.length);
console.log("Total entries in segments:", totalInSegments);
const isMatch = totalInSegments === originalData.tariffs.length;
console.log("Match:", isMatch ? "YES ✓" : "NO ✗");

if (!isMatch) {
  console.log(
    "Difference:",
    Math.abs(totalInSegments - originalData.tariffs.length),
    "entries",
  );
  process.exit(1); // Exit with an error code if counts don't match
}

// Check for any missing HTS codes
console.log("\n=== Checking for missing codes ===");
const segmentCodes = new Set();

// Collect all codes from segments
Object.values(segmentIndex.segments).forEach((file) => {
  const segmentPath = path.join(__dirname, "./data/tariff-segments", file);
  if (fs.existsSync(segmentPath)) {
    const data = JSON.parse(fs.readFileSync(segmentPath));
    data.entries.forEach((entry) => {
      segmentCodes.add(entry.hts8 || entry.normalizedCode || "");
    });
  }
});

// Check if any codes from original are missing in segments
const missingCodes = [];
originalData.tariffs.forEach((entry) => {
  const code = entry.hts8 || entry.normalizedCode || "";
  if (code && !segmentCodes.has(code)) {
    missingCodes.push(code);
  }
});

if (missingCodes.length > 0) {
  console.log(`Found ${missingCodes.length} missing codes:`);
  missingCodes.slice(0, 10).forEach((code) => console.log(`  - ${code}`));
  if (missingCodes.length > 10) {
    console.log(`  ... and ${missingCodes.length - 10} more`);
  }
  process.exit(1); // Exit with an error code if codes are missing
} else {
  console.log("All codes from original file are present in segments ✓");
}

console.log("\nVerification successful!");
