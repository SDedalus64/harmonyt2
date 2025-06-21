declare module 'react-native-keyboard-aware-scroll-view' {
  import { ComponentType } from 'react';
  import {
    ScrollViewProps,
    SectionListProps,
    FlatListProps,
  } from 'react-native';

  export interface KeyboardAwareScrollViewProps extends ScrollViewProps {
    // Additional optional props supported by the component
    enableOnAndroid?: boolean;
    enableAutomaticScroll?: boolean;
    extraHeight?: number;
    extraScrollHeight?: number;
    keyboardOpeningTime?: number;
    resetScrollToCoords?: { x: number; y: number } | null;
    viewIsInsideTabBar?: boolean;
    onKeyboardWillShow?: (frames: object) => void;
    onKeyboardWillHide?: (frames: object) => void;
  }

  export const KeyboardAwareScrollView: ComponentType<KeyboardAwareScrollViewProps>;

  export interface KeyboardAwareSectionListProps<ItemT>
    extends SectionListProps<ItemT>, KeyboardAwareScrollViewProps {}

  export interface KeyboardAwareFlatListProps<ItemT>
    extends FlatListProps<ItemT>, KeyboardAwareScrollViewProps {}

  export const KeyboardAwareSectionList: ComponentType<KeyboardAwareSectionListProps<any>>;
  export const KeyboardAwareFlatList: ComponentType<KeyboardAwareFlatListProps<any>>;

  export function KeyboardAwareHOC<T extends ComponentType<any>>(WrappedComponent: T): T;

  export default KeyboardAwareScrollView;
}