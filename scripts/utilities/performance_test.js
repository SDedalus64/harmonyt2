#!/usr/bin/env node

/**
 * Performance Testing Script for Azure-Only Implementation
 *
 * This script helps monitor and test the performance characteristics
 * of the new Azure-only tariff loading system.
 */

const fs = require("fs");
const path = require("path");

console.log("🧪 HarmonyTi Azure Performance Test Suite");
console.log("==========================================\n");

// Test configuration
const testConfig = {
  testHtsCodes: [
    { code: "84715001", country: "CN", description: "Laptop from China" },
    { code: "61091000", country: "MX", description: "T-shirt from Mexico" },
    { code: "87032310", country: "CA", description: "Car engine from Canada" },
    { code: "85171100", country: "KR", description: "Phone from South Korea" },
    { code: "94036000", country: "VN", description: "Furniture from Vietnam" },
  ],
  expectedTimes: {
    appStartup: 1000, // ms
    firstLookup: 3000, // ms
    cachedLookup: 500, // ms
  },
};

// Performance metrics to track
const metrics = {
  appStartupTime: null,
  firstLookupTime: null,
  cachedLookupTimes: [],
  azureLoadTime: null,
  totalDataSize: null,
  cacheHitRate: 0,
};

function displayTestPlan() {
  console.log("📋 Test Plan:");
  console.log("1. App Startup Performance (target: <1 second)");
  console.log("2. First Azure Lookup (target: 1-3 seconds)");
  console.log("3. Cached Lookup Performance (target: <500ms)");
  console.log("4. Bundle Size Verification");
  console.log("5. Network Error Handling\n");
}

function displayTestCodes() {
  console.log("🎯 Test HTS Codes:");
  testConfig.testHtsCodes.forEach((test, index) => {
    console.log(
      `${index + 1}. ${test.code} (${test.country}) - ${test.description}`,
    );
  });
  console.log("");
}

function checkBundleSize() {
  console.log("📦 Bundle Size Analysis:");

  // Check if local data was removed
  const localDataPath = path.join(__dirname, "..", "src", "data (local copy)");
  const exists = fs.existsSync(localDataPath);

  if (!exists) {
    console.log("✅ Local tariff data successfully removed");
  } else {
    console.log("❌ Local tariff data still exists - bundle not optimized");
  }

  // Check for large files in src
  console.log("🔍 Checking for large files in src/...");

  try {
    const srcPath = path.join(__dirname, "..", "src");
    const largeFiles = findLargeFiles(srcPath, 1024 * 1024); // 1MB+

    if (largeFiles.length === 0) {
      console.log("✅ No large data files found in src/");
    } else {
      console.log("⚠️  Large files found:");
      largeFiles.forEach((file) => {
        console.log(
          `   - ${file.path} (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
        );
      });
    }
  } catch (error) {
    console.log("⚠️  Could not analyze src/ directory");
  }

  console.log("");
}

function findLargeFiles(dir, minSize, files = []) {
  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        findLargeFiles(fullPath, minSize, files);
      } else if (stat.size > minSize) {
        files.push({
          path: fullPath.replace(path.join(__dirname, ".."), ""),
          size: stat.size,
        });
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }

  return files;
}

function displayExpectedBehavior() {
  console.log("🎯 Expected Behavior:");
  console.log("");

  console.log("📱 App Startup:");
  console.log("   - Should start in <1 second");
  console.log('   - No "Preloading tariff data..." message');
  console.log("   - Immediate UI display");
  console.log("");

  console.log("🔍 First Lookup:");
  console.log('   - Console: "🚀 Loading tariff data from Azure Blob Storage"');
  console.log(
    '   - Console: "📡 Fetching from: https://harmonytariff.blob.core.windows.net/..."',
  );
  console.log('   - Console: "⏱️ Load time: XXXXms"');
  console.log("   - Should complete in 1-3 seconds");
  console.log("");

  console.log("⚡ Cached Lookups:");
  console.log('   - Console: "📦 Tariff data already loaded and cached"');
  console.log("   - Should complete in <500ms");
  console.log("   - No additional Azure requests");
  console.log("");
}

function displayTroubleshooting() {
  console.log("🔧 Troubleshooting Guide:");
  console.log("");

  console.log("❌ If app startup is slow:");
  console.log("   - Check if local data was properly removed");
  console.log("   - Verify no preloading code remains");
  console.log("   - Clear Metro cache: npx expo start --clear");
  console.log("");

  console.log("❌ If Azure loading fails:");
  console.log("   - Check internet connection");
  console.log("   - Verify Azure blob URLs in console");
  console.log("   - Check for CORS issues");
  console.log("   - Test Azure endpoint directly");
  console.log("");

  console.log("❌ If lookups are consistently slow:");
  console.log("   - Check network speed");
  console.log("   - Verify caching is working");
  console.log("   - Monitor for repeated Azure fetches");
  console.log("");
}

function displayCommands() {
  console.log("🚀 Quick Commands:");
  console.log("");
  console.log("Start fresh test:");
  console.log("   npx expo start --clear");
  console.log("");
  console.log("Launch iOS simulator:");
  console.log("   npx expo run:ios");
  console.log("");
  console.log("Check bundle size:");
  console.log("   du -sh src/");
  console.log("");
  console.log("Find large files:");
  console.log("   find src/ -type f -size +1M");
  console.log("");
}

// Main execution
function main() {
  displayTestPlan();
  displayTestCodes();
  checkBundleSize();
  displayExpectedBehavior();
  displayTroubleshooting();
  displayCommands();

  console.log(
    "🎉 Ready to test! Launch the app and follow the test plan above.",
  );
  console.log("📊 Monitor the console logs for performance metrics.");
  console.log("");
  console.log("Happy testing! 🚀");
}

// Run the script
main();
