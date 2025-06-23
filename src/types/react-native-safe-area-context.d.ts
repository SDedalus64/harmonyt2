declare module 'react-native-safe-area-context' {
  import { ComponentType } from 'react';
  import { ViewProps } from 'react-native';

  export interface SafeAreaViewProps extends ViewProps {
    edges?: ('top' | 'right' | 'bottom' | 'left')[];
  }

  export const SafeAreaProvider: ComponentType<{ children: React.ReactNode }>;
  export const SafeAreaView: ComponentType<SafeAreaViewProps>;
  export function useSafeAreaInsets(): { top: number; bottom: number; left: number; right: number };
}