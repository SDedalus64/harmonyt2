declare module 'react-native-keyboard-aware-scroll-view' {
  import * as React from 'react';
  import { ScrollViewProps, ViewStyle } from 'react-native';

  export interface KeyboardAwareProps extends ScrollViewProps {
    enableOnAndroid?: boolean;
    extraScrollHeight?: number;
    extraHeight?: number;
    keyboardOpeningTime?: number;
    viewIsInsideTabBar?: boolean;
    enableResetScrollToCoords?: boolean;
    innerRef?: (ref?: any) => void;
    style?: ViewStyle;
  }

  export class KeyboardAwareScrollView extends React.Component<KeyboardAwareProps> {}
  export class KeyboardAwareFlatList<T> extends React.Component<KeyboardAwareProps> {}
  export class KeyboardAwareSectionList<T> extends React.Component<KeyboardAwareProps> {}

  export default KeyboardAwareScrollView;
} 