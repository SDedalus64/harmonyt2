#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read app.json
const appJsonPath = path.join(__dirname, '../app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

// Get current build number
const currentBuild = parseInt(appJson.expo.ios.buildNumber);
const newBuild = currentBuild + 1;

// Update build number
appJson.expo.ios.buildNumber = newBuild.toString();

// Also update Android version code if it exists
if (appJson.expo.android && appJson.expo.android.versionCode) {
  appJson.expo.android.versionCode = newBuild;
}

// Write back to app.json
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');

console.log(`✅ Build number incremented: ${currentBuild} → ${newBuild}`);
console.log(`📱 iOS buildNumber: ${newBuild}`);
if (appJson.expo.android) {
  console.log(`🤖 Android versionCode: ${newBuild}`);
}

// Also update Info.plist if iOS directory exists
const infoPlistPath = path.join(__dirname, '../ios/HarmonyTi/Info.plist');
if (fs.existsSync(infoPlistPath)) {
  let infoPlist = fs.readFileSync(infoPlistPath, 'utf8');

  // Replace CFBundleVersion
  infoPlist = infoPlist.replace(
    /<key>CFBundleVersion<\/key>\s*<string>\d+<\/string>/,
    `<key>CFBundleVersion</key>\n    <string>${newBuild}</string>`
  );

  fs.writeFileSync(infoPlistPath, infoPlist);
  console.log(`🍎 Updated iOS Info.plist`);
}

console.log('\n💡 Remember to:');
console.log('   1. Run "npx expo prebuild --clean" if you updated native files');
console.log('   2. Update the build number in Xcode before archiving');
console.log(`   3. Commit these changes: git add -A && git commit -m "Bump build to ${newBuild}"`);
