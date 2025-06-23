declare module 'react-native' {
  /**
   * Minimal fallback typings so the codebase compiles in environments where the
   * full React-Native package isn't present. At runtime a proper React-Native
   * implementation (or Expo) provides these APIs.
   */
  export type ViewStyle = Record<string, unknown>;
  export interface ViewProps {
    style?: ViewStyle;
    [key: string]: any;
  }
  // Components (typed as any to avoid over-specification)
  export const View: any;
  export const StyleSheet: any;
  export const Platform: any;
  export const Dimensions: any;
}