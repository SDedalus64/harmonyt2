declare module 'react-native' {
  /**
   * Minimal fallback typings to prevent "Cannot find module 'react-native'" compile errors in non-RN type-checkers.
   * In a real React-Native / Expo build the full typings are provided by the `react-native` package itself.
   */
  export const Platform: any;
  export const Dimensions: any;
  export const View: any;
  export const Text: any;
}