import { useEffect, useMemo, useRef, useState, createRef, RefObject } from "react";
import {
  Animated,
  Platform,
  UIManager,
  findNodeHandle,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PanGestureHandlerGestureEvent } from "react-native-gesture-handler";
import { isTablet } from "../platform/deviceUtils";
import { InfoFieldKey } from "../components/InfoDrawer";

// ---------------------------------------------------------------------------
// useInfoTab
// Centralised logic that positions & animates the floating blue “info” tab that
// appears beside the focused form field on iPhone / iPad.
// ---------------------------------------------------------------------------

interface UseInfoTabOptions {
  /** Keys of the form fields that should be tracked */
  fieldKeys: InfoFieldKey[];
  /** Whether the InfoDrawer is currently visible – hides the tab while open */
  infoDrawerVisible: boolean;
  /** Multiplier applied to sizes on iPad (defaults to 1.35) */
  tabletScale?: number;
  /** Y-coordinate clamp so the tab never collides with status-bar */
  minY?: number;
  /** Width/height of the tab on phone (defaults 40).  Will be multiplied by tabletScale on iPad */
  baseSize?: number;
}

export function useInfoTab({
  fieldKeys,
  infoDrawerVisible,
  tabletScale = 1.35,
  minY = 50,
  baseSize = 40,
}: UseInfoTabOptions) {
  // ---------------------------------------------------------------------
  // refs for each field so the caller can attach them to <View>s to measure
  // ---------------------------------------------------------------------
  const fieldRefs = useMemo(() => {
    const map = {} as Record<Exclude<InfoFieldKey, null>, RefObject<View>>;
    fieldKeys.forEach((key) => {
      map[key] = createRef<View>();
    });
    return map;
  }, [fieldKeys]);

  // ---------------------------------------------------------------------
  // state
  // ---------------------------------------------------------------------
  const [activeField, setActiveField] = useState<InfoFieldKey | null>(null);
  const [tabY, setTabY] = useState<number>(0);
  const opacity = useRef(new Animated.Value(0)).current;
  const prevVisibleRef = useRef(false);
  const insets = useSafeAreaInsets();

  // ---------------------------------------------------------------------
  // derived helpers
  // ---------------------------------------------------------------------
  const shouldShowTab = !!activeField && !infoDrawerVisible;

  // ---------------------------------------------------------------------
  // animate opacity when visibility toggles
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (isTablet()) {
      // We still show the tab on iPad – just enlarge it.  Keep logic identical.
    }

    const wasVisible = prevVisibleRef.current;

    if (shouldShowTab && !wasVisible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else if (!shouldShowTab && wasVisible) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    prevVisibleRef.current = shouldShowTab;
  }, [shouldShowTab, opacity]);

  // ---------------------------------------------------------------------
  // focus handler copies measurement logic from legacy file
  // ---------------------------------------------------------------------
  const handleFieldFocus = (field: Exclude<InfoFieldKey, null>) => {
    setActiveField(field);

    const ref = fieldRefs[field];
    if (!ref?.current) return;

    const measureDelay = Platform.OS === "android" ? 50 : 0;

    setTimeout(() => {
      if (!ref.current) return;

      const tabHeight = baseSize * (isTablet() ? tabletScale : 1);

      if (Platform.OS === "android") {
        const handle = findNodeHandle(ref.current);
        if (!handle) return;
        UIManager.measure(
          handle,
          (
            x: number,
            y: number,
            width_: number,
            height_: number,
            pageX: number,
            pageY: number,
          ) => {
            if (
              typeof pageY === "number" &&
              typeof height_ === "number" &&
              pageY > 0 &&
              height_ > 0
            ) {
              const centerY = pageY + height_ / 2 - tabHeight / 2;
              setTabY(Math.max(minY, centerY));
            }
          },
        );
      } else {
        // iOS
        (ref.current as View).measureInWindow(
          (
            x: number,
            y: number,
            width_: number,
            height_: number,
          ) => {
            if (
              typeof y === "number" &&
              typeof height_ === "number" &&
              y > 0 &&
              height_ > 0
            ) {
              const centerY = y + height_ / 2 - tabHeight / 2 - insets.top;
              setTabY(Math.max(minY, centerY));
            }
          },
        );
      }
    }, measureDelay);
  };

  // ---------------------------------------------------------------------
  // drag handler – caller passes to PanGestureHandler
  // ---------------------------------------------------------------------
  const handleInfoTabDrag = (event: PanGestureHandlerGestureEvent) => {
    const { translationX } = event.nativeEvent;
    if (translationX > 50 && !infoDrawerVisible) {
      // the consumer should toggle the drawer;  we just expose callback.
    }
  };

  // size for consumer convenience
  const size = baseSize * (isTablet() ? tabletScale : 1);

  return {
    fieldRefs,
    activeField,
    setActiveField,
    tabY,
    opacity,
    shouldShowTab,
    handleFieldFocus,
    handleInfoTabDrag,
    size,
  } as const;
}