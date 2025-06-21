// Minimal metro config to bypass version conflicts
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Minimal default config provided by Expo

module.exports = config;
