/* eslint-disable react-hooks/exhaustive-deps, react-native/no-inline-styles, react-native/no-color-literals */
import React, { useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import {
  BRAND_COLORS,
  BRAND_SHADOWS,
  BRAND_LAYOUT,
  BRAND_ANIMATIONS,
  getDrawerConfig,
} from "../../config/brandColors";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface AnimatedDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position: "left" | "right" | "bottom";
  title?: string;
  /**
   * When true (default) the drawer wraps its children in an internal ScrollView to
   * enable vertical scrolling. If your content is itself a VirtualizedList (e.g.
   * FlatList) set this to false to avoid the "VirtualizedLists should never be
   * nested inside plain ScrollViews" warning.
   */
  wrapScroll?: boolean;
  /**
   * Custom drawer configuration to override default sizing
   */
  customDrawerConfig?: {
    width?: number | string;
    maxHeight?: string;
  };
}

export const AnimatedDrawer: React.FC<AnimatedDrawerProps> = ({
  isVisible,
  onClose,
  children,
  position,
  title,
  wrapScroll = true,
  customDrawerConfig,
}) => {
  const drawerConfig = getDrawerConfig();

  const translateX = useRef(
    new Animated.Value(getInitialTranslateValue()),
  ).current;
  const translateY = useRef(
    new Animated.Value(getInitialTranslateValue()),
  ).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Track whether we should render drawer to allow close animation
  const [shouldRender, setShouldRender] = React.useState(isVisible);

  function getInitialTranslateValue() {
    const width = customDrawerConfig?.width || drawerConfig.width;
    const actualWidth = typeof width === 'string' && width.includes('%') 
      ? SCREEN_WIDTH * (parseFloat(width.replace('%', '')) / 100)
      : (width as number);
    
    switch (position) {
      case "left":
        return -actualWidth;
      case "right":
        return actualWidth;
      case "bottom":
        return SCREEN_HEIGHT;
      default:
        return 0;
    }
  }

  useEffect(() => {
    if (isVisible) {
      // ensure it's rendered
      setShouldRender(true);
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.spring(position === "bottom" ? translateY : translateX, {
          toValue: 0,
          ...BRAND_ANIMATIONS.spring,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: BRAND_ANIMATIONS.timing.duration,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (shouldRender) {
      Animated.parallel([
        Animated.spring(position === "bottom" ? translateY : translateX, {
          toValue: getInitialTranslateValue(),
          ...BRAND_ANIMATIONS.spring,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: BRAND_ANIMATIONS.timing.duration,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // after animation complete unmount
        setShouldRender(false);
      });
    }
  }, [isVisible]);

  const handleGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    const { translationX, translationY } = event.nativeEvent;

    if (position === "bottom" && translationY > 50) {
      onClose();
    } else if (position === "left" && translationX < -50) {
      onClose();
    } else if (position === "right" && translationX > 50) {
      onClose();
    }
  };

  const getDrawerStyle = () => {
    const baseStyle = {
      opacity,
      ...BRAND_SHADOWS.large,
    };

    const width = customDrawerConfig?.width || drawerConfig.width;
    const actualWidth = typeof width === 'string' && width.includes('%') 
      ? SCREEN_WIDTH * (parseFloat(width.replace('%', '')) / 100)
      : (width as number);

    switch (position) {
      case "left":
        return {
          ...baseStyle,
          transform: [{ translateX }],
          left: 0,
          top: 0,
          bottom: 0,
          width: actualWidth,
        };
      case "right":
        return {
          ...baseStyle,
          transform: [{ translateX }],
          right: 0,
          top: 0,
          bottom: 0,
          width: actualWidth,
        };
      case "bottom":
        const maxHeight = customDrawerConfig?.maxHeight || drawerConfig.maxHeight;
        const maxHeightPercent =
          parseFloat(maxHeight.replace("%", "")) / 100;
        return {
          ...baseStyle,
          transform: [{ translateY }],
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: SCREEN_HEIGHT * maxHeightPercent,
        };
      default:
        return baseStyle;
    }
  };

  if (!shouldRender) return null;

  return (
    <>
      {/* Overlay */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View style={[styles.overlayBackground, { opacity }]} />
      </TouchableOpacity>

      {/* Drawer */}
      <PanGestureHandler onGestureEvent={handleGestureEvent}>
        <Animated.View style={[styles.drawer, getDrawerStyle()]}>
          <View style={styles.drawerContent}>
            {title && (
              <View style={styles.header}>
                <View style={styles.headerIndicator} />
              </View>
            )}
            {wrapScroll ? (
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {children}
            </ScrollView>
            ) : (
              <View style={{ flex: 1 }}>{children}</View>
            )}
          </View>
        </Animated.View>
      </PanGestureHandler>
    </>
  );
};

const styles = StyleSheet.create({
  drawer: {
    backgroundColor: BRAND_COLORS.white,
    borderRadius: BRAND_LAYOUT.borderRadius.lg,
    position: "absolute",
    zIndex: 3001,
  },
  drawerContent: {
    backgroundColor: BRAND_COLORS.white,
    borderRadius: BRAND_LAYOUT.borderRadius.lg,
    flex: 1,
  },
  header: {
    alignItems: "center",
    borderBottomColor: BRAND_COLORS.lightGray,
    borderBottomWidth: 1,
    height: BRAND_LAYOUT.drawer.headerHeight,
    justifyContent: "center",
  },
  headerIndicator: {
    backgroundColor: BRAND_COLORS.mediumGray,
    borderRadius: 2,
    height: 4,
    width: 40,
  },
  overlay: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 3000,
  },
  overlayBackground: {
    backgroundColor: "rgba(10, 26, 62, 0.5)",
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
});
