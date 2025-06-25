declare module 'react-native-gesture-handler' {
  import { ComponentType } from 'react';
  import { ViewProps } from 'react-native';
  export const PanGestureHandler: ComponentType<ViewProps & { onGestureEvent?: any; enabled?: boolean }>;
  export interface PanGestureHandlerGestureEvent {
    nativeEvent: {
      translationX: number;
      translationY: number;
      velocityX?: number;
      velocityY?: number;
      [key: string]: any;
    };
  }
  export const TapGestureHandler: ComponentType<ViewProps>;
  export const GestureHandlerRootView: ComponentType<ViewProps>;
  export const State: any;
}