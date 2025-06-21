declare module '@react-navigation/bottom-tabs' {
  import * as React from 'react';
  import {
    NavigatorScreenParams,
    ParamListBase,
    NavigationProp,
  } from '@react-navigation/native';

  /**
   * Minimal type for navigation prop used in this project.
   * For full API surface, install React Navigation types or reference upstream types.
   */
  export interface BottomTabNavigationProp<
    ParamList extends ParamListBase = ParamListBase,
    RouteName extends keyof ParamList = keyof ParamList,
  > extends NavigationProp<ParamList, RouteName> {}

  /**
   * Simplified helper to create a bottom-tab navigator.
   * The implementation is not typed in this stub – it returns `any`.
   */
  export function createBottomTabNavigator(): any;

  export type NavigatorScreenParams<T> = NavigatorScreenParams<T>;
}