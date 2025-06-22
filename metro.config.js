// Updated Metro configuration to use @react-native/metro-config per RN ≥0.73 guidance
const { getDefaultConfig } = require('@react-native/metro-config');

const config = getDefaultConfig(__dirname);
module.exports = {
  transformer: {
    unstable_disableObsEnsureModuleIds: true,    // <— ①
    getTransformOptions: async () => ({
      transform: { inlineRequires: true },       // <— ②
    }),
  },
};
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
config.resolver = {
  ...config.resolver,
  // Prevent Metro from incorrectly resolving some deps to ESM builds
  unstable_enablePackageExports: false,
};

// Remove any falsy middleware entries (Metro 0.76 bug fix)
config.server = {
  ...config.server,
  unstable_extraMiddleware: (config.server?.unstable_extraMiddleware || []).filter(Boolean),
};

// Robust patch: replace connect() factory so every app instance filters undefined middleware
(() => {
  try {
    const connectPath = require.resolve('connect');
    const connectOrig = require('connect');

    function patchApp(app) {
      if (app.__skipUndefinedInstalled) return app;
      const originalUse = app.use;
      app.use = function (route, fn) {
        let handler = fn;
        if (typeof route !== 'string') {
          handler = route;
        }
        if (!handler) {
          // Ignore undefined middleware
          return this;
        }
        return originalUse.apply(this, arguments);
      };
      app.__skipUndefinedInstalled = true;
      return app;
    }

    function connectPatched() {
      return patchApp(connectOrig());
    }

    // Copy properties (e.g., .mime, .Route, etc.)
    Object.assign(connectPatched, connectOrig);

    // Override require cache export so all future requires get patched version
    require.cache[connectPath].exports = connectPatched;
  } catch (e) {
    // If connect not yet available, ignore.
  }
})();

module.exports = config;
