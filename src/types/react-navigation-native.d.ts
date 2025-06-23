declare module '@react-navigation/native' {
  import { ComponentType } from 'react';
  export interface NavigationContainerProps {
    children: React.ReactNode;
  }
  export const NavigationContainer: ComponentType<NavigationContainerProps>;

  // other simplified helper types
  export type ParamListBase = Record<string, object | undefined>;
  export type NavigationProp<T extends ParamListBase> = {
    navigate(name: keyof T, params?: T[keyof T]): void;
    goBack(): void;
    // ... add as needed
  };
}