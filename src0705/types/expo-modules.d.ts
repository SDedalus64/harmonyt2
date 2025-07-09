// Minimal fallback declarations for Expo modules that occasionally
// confuse TypeScript in bare React-Native workspaces. These are ONLY
// used when the real typings cannot be resolved (skipLibCheck=false).

// expo-linear-gradient already ships types, but this stub prevents IDE
// screaming during cold installs.
declare module 'expo-linear-gradient' {
  import { ComponentType } from 'react';
  import { ViewStyle } from 'react-native';
  export interface LinearGradientProps {
    colors: readonly string[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    style?: ViewStyle;
    children?: React.ReactNode;
  }
  export const LinearGradient: ComponentType<LinearGradientProps>;
  export default LinearGradient;
}

declare module 'expo-screen-orientation' {
  export enum OrientationLock {
    DEFAULT = 0,
    ALL = 1,
    PORTRAIT = 2,
    PORTRAIT_UP = 3,
    PORTRAIT_DOWN = 4,
    LANDSCAPE = 5,
    LANDSCAPE_LEFT = 6,
    LANDSCAPE_RIGHT = 7,
  }
  export function lockAsync(lock: OrientationLock): Promise<void>;
}

declare module '@expo/vector-icons' {
  import { ComponentType } from 'react';
  import { TextProps } from 'react-native';
  interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
  }
  export const Ionicons: ComponentType<IconProps>;
  export const MaterialIcons: ComponentType<IconProps>;
  // add more as needed
}