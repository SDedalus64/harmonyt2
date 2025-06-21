import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { BRAND_COLORS, BRAND_SHADOWS, BRAND_LAYOUT, BRAND_ANIMATIONS, getDrawerConfig } from '../../config/brandColors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AnimatedDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position: 'left' | 'right' | 'bottom';
  title?: string;
}

export const AnimatedDrawer: React.FC<AnimatedDrawerProps> = ({
  isVisible,
  onClose,
  children,
  position,
  title,
}) => {
  const drawerConfig = getDrawerConfig();

  const translateX = useRef(new Animated.Value(getInitialTranslateValue())).current;
  const translateY = useRef(new Animated.Value(getInitialTranslateValue())).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Track whether we should render drawer to allow close animation
  const [shouldRender, setShouldRender] = React.useState(isVisible);

  function getInitialTranslateValue() {
    switch (position) {
      case 'left':
        return -drawerConfig.width;
      case 'right':
        return drawerConfig.width;
      case 'bottom':
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
        Animated.spring(position === 'bottom' ? translateY : translateX, {
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
        Animated.spring(position === 'bottom' ? translateY : translateX, {
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

    if (position === 'bottom' && translationY > 50) {
      onClose();
    } else if (position === 'left' && translationX < -50) {
      onClose();
    } else if (position === 'right' && translationX > 50) {
      onClose();
    }
  };

  const getDrawerStyle = () => {
    const baseStyle = {
      opacity,
      ...BRAND_SHADOWS.large,
    };

    switch (position) {
      case 'left':
        return {
          ...baseStyle,
          transform: [{ translateX }],
          left: 0,
          top: 0,
          bottom: 0,
          width: drawerConfig.width,
        };
      case 'right':
        return {
          ...baseStyle,
          transform: [{ translateX }],
          right: 0,
          top: 0,
          bottom: 0,
          width: drawerConfig.width,
        };
      case 'bottom':
        const maxHeightPercent = parseFloat(drawerConfig.maxHeight.replace('%', '')) / 100;
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
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {children}
            </ScrollView>
          </View>
        </Animated.View>
      </PanGestureHandler>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3000,
  },
  overlayBackground: {
    flex: 1,
    backgroundColor: 'rgba(10, 26, 62, 0.5)',
  },
  drawer: {
    position: 'absolute',
    backgroundColor: BRAND_COLORS.white,
    zIndex: 3001,
    borderRadius: BRAND_LAYOUT.borderRadius.lg,
  },
  drawerContent: {
    flex: 1,
    backgroundColor: BRAND_COLORS.white,
    borderRadius: BRAND_LAYOUT.borderRadius.lg,
  },
  header: {
    height: BRAND_LAYOUT.drawer.headerHeight,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.lightGray,
  },
  headerIndicator: {
    width: 40,
    height: 4,
    backgroundColor: BRAND_COLORS.mediumGray,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
});
