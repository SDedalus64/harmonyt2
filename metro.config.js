// Minimal metro config to bypass version conflicts
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Minimal default config provided by Expo

// Disable "exports" field resolution feature that is currently causing a runtime
// TypeError: _interopRequireDefault is not a function (it is Object) when the
// Metro bundler erroneously resolves some packages to their ESM builds on
// Hermes. We explicitly turn the feature off until upgrading to a newer Metro
// version where the issue is fixed.

// --- Work-around for Metro package exports bug (RN < 0.79) ------------------
if (!config.resolver) {
  config.resolver = {};
}

// Prevent Metro from preferring the "exports" field so that it falls back to
// classic resolution ("main", React-Native field, platform extensions, etc.).
// See https://reactnative.dev/docs/metro#package-exports-support-new
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
