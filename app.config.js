import 'dotenv/config';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('./package.json');

/**
 * This dynamic Expo config gives you "turn-key" control of the native project
 * without opening Xcode or Android Studio.  Edit the values below (or feed them
 * via environment variables / package.json) and then run:
 *   npx expo prebuild --clean
 * The iOS + Android projects are regenerated with those settings baked in.
 */
export default ({ config }) => ({
  ...config,
  name: 'HarmonyTi',
  slug: 'harmonyti',

  // JS version comes from package.json to keep it source-of-truth.
  version: pkg.version,

  ios: {
    ...config.ios,
    bundleIdentifier: 'com.sdedola.tcalcmobile',
    buildNumber: process.env.IOS_BUILD_NUMBER ?? '35',
    supportsTablet: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      UIBackgroundModes: ['fetch', 'remote-notification'],
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: false,
        NSAllowsLocalNetworking: true,
      },
      UIRequiredDeviceCapabilities: ['arm64'],
      UIStatusBarStyle: 'UIStatusBarStyleDefault',
      UIViewControllerBasedStatusBarAppearance: false,
    },
  },

  android: {
    ...config.android,
    package: 'com.sdedola.tcalcmobile',
    versionCode: parseInt(process.env.ANDROID_VERSION_CODE ?? '28', 10),
    edgeToEdgeEnabled: true,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
  },

  extra: {
    ...config.extra,
    eas: {
      projectId: '63842548-a21a-4ebd-b86d-96cff60b051f',
    },
  },

  plugins: [
    [
      'expo-build-properties',
      {
        ios: {
          // Match the Team ID you currently have set in Xcode.
          developmentTeam: process.env.IOS_TEAM_ID ?? '2QFN2YCBAZ',
          deploymentTarget: '15.1',
          useFrameworks: 'static',
        },
      },
    ],
  ],

  scheme: 'com.sdedola.tcalcmobile',
}); 