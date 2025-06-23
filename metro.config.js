// Metro config: minimal Expo version for correct serializer during export:embed
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Disable Metro package "exports" field support until we upgrade metro (>0.79)
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
