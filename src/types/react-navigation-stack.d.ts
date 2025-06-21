declare module '@react-navigation/stack' {
  import * as React from 'react';
  import {
    ParamListBase,
    NavigationProp,
    NavigatorScreenParams,
  } from '@react-navigation/native';

  export interface StackNavigationProp<
    ParamList extends ParamListBase = ParamListBase,
    RouteName extends keyof ParamList = keyof ParamList,
  > extends NavigationProp<ParamList, RouteName> {}

  export function createStackNavigator(): any;

  export type NavigatorScreenParams<T> = NavigatorScreenParams<T>;
}