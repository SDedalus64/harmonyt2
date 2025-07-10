declare module '@react-navigation/native' {
  import { ComponentType } from 'react';
  export interface NavigationContainerProps {
    children: React.ReactNode;
  }
  export const NavigationContainer: ComponentType<NavigationContainerProps>;

  // other simplified helper types
  export type ParamListBase = Record<string, object | undefined>;
  export type NavigationProp<
    T extends ParamListBase = ParamListBase,
    RouteName extends keyof T = keyof T
  > = {
    navigate(name: RouteName, params?: T[RouteName]): void;
    goBack(): void;
    // Extend with other members as needed (setOptions, reset, etc.)
  };

  // Extend stub with commonly-used hooks and helper types so that the
  // compiler recognises them when the real @react-navigation/native
  // types are shadowed in bare/RN setups.
  /**
   * React Navigation hook that returns the navigation object for the active
   * screen.  A minimal generic version is provided here – change `any` to
   * stricter types as needed in the future.
   */
  export function useNavigation<T extends NavigationProp<any> = NavigationProp<any>>(): T;

  /**
   * Hook that gives access to the current route.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function useRoute<T = any>(): T;

  /**
   * Runs `effect` each time the screen comes into focus.  It mirrors the real
   * `useFocusEffect` API but keeps the typings lightweight.
   */
  export function useFocusEffect(effect: () => void | (() => void)): void;

  /**
   * Helper type for route params – simplified to avoid pulling in the full
   * utility types.
   */
  export type RouteProp<
    ParamList extends ParamListBase,
    RouteName extends keyof ParamList
  > = {
    key: string;
    name: RouteName;
    params: ParamList[RouteName];
  };
}