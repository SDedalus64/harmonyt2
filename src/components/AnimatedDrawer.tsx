import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AnimatedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  position: 'bottom' | 'right' | 'left';
  height?: number;
  width?: number;
  children: React.ReactNode;
  backgroundColor?: string;
  overlayColor?: string;
  animationDuration?: number;
  enableSwipeToClose?: boolean;
  borderRadius?: number;
}

export const AnimatedDrawer: React.FC<AnimatedDrawerProps> = ({
  isOpen,
  onClose,
  position,
  height,
  width,
  children,
  backgroundColor = '#FFFFFF',
  overlayColor = 'rgba(0, 0, 0, 0.3)',
  animationDuration = 300,
  enableSwipeToClose = true,
  borderRadius = 20,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Local visibility state so we can keep component mounted during closing animation
  const [visible, setVisible] = useState(isOpen);

  // Calculate dimensions
  const drawerHeight = height || SCREEN_HEIGHT * 0.7;
  const drawerWidth = width || SCREEN_WIDTH * 0.85;

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => enableSwipeToClose,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (!enableSwipeToClose) return false;

        // Determine if the gesture is in the right direction
        if (position === 'bottom') {
          return gestureState.dy > 10;
        } else if (position === 'right') {
          return gestureState.dx > 10;
        } else if (position === 'left') {
          return gestureState.dx < -10;
        }
        return false;
      },
      onPanResponderMove: (_, gestureState) => {
        let progress = 0;

        if (position === 'bottom') {
          progress = Math.max(0, Math.min(1, gestureState.dy / drawerHeight));
        } else if (position === 'right') {
          progress = Math.max(0, Math.min(1, gestureState.dx / drawerWidth));
        } else if (position === 'left') {
          progress = Math.max(0, Math.min(1, -gestureState.dx / drawerWidth));
        }

        animatedValue.setValue(1 - progress);
        overlayOpacity.setValue(1 - progress);
      },
      onPanResponderRelease: (_, gestureState) => {
        let shouldClose = false;

        if (position === 'bottom') {
          shouldClose = gestureState.dy > drawerHeight * 0.3 || gestureState.vy > 0.5;
        } else if (position === 'right') {
          shouldClose = gestureState.dx > drawerWidth * 0.3 || gestureState.vx > 0.5;
        } else if (position === 'left') {
          shouldClose = -gestureState.dx > drawerWidth * 0.3 || gestureState.vx < -0.5;
        }

        if (shouldClose) {
          onClose();
        } else {
          // Snap back to open
          Animated.parallel([
            Animated.spring(animatedValue, {
              toValue: 1,
              useNativeDriver: true,
              tension: 65,
              friction: 11,
            }),
            Animated.timing(overlayOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  // When prop opens, ensure visible
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(animatedValue, {
          toValue: 1,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: animationDuration,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: animationDuration,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: animationDuration,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // After closing animation completes, unmount content
        setVisible(false);
      });
    }
  }, [isOpen]);

  // Calculate transform based on position
  const getTransform = () => {
    if (position === 'bottom') {
      return {
        transform: [{
          translateY: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [drawerHeight, 0],
          }),
        }],
      };
    } else if (position === 'right') {
      return {
        transform: [{
          translateX: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [drawerWidth, 0],
          }),
        }],
      };
    } else if (position === 'left') {
      return {
        transform: [{
          translateX: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [-drawerWidth, 0],
          }),
        }],
      };
    }
    return {};
  };

  // Get position styles
  const getPositionStyles = () => {
    const baseStyles: any = {
      position: 'absolute',
      backgroundColor,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 10,
    };

    if (position === 'bottom') {
      return {
        ...baseStyles,
        bottom: 0,
        left: 0,
        right: 0,
        height: drawerHeight,
        borderTopLeftRadius: borderRadius,
        borderTopRightRadius: borderRadius,
      };
    } else if (position === 'right') {
      return {
        ...baseStyles,
        top: 0,
        right: 0,
        bottom: 0,
        width: drawerWidth,
        borderTopLeftRadius: borderRadius,
        borderBottomLeftRadius: borderRadius,
      };
    } else if (position === 'left') {
      return {
        ...baseStyles,
        top: 0,
        left: 0,
        bottom: 0,
        width: drawerWidth,
        borderTopRightRadius: borderRadius,
        borderBottomRightRadius: borderRadius,
      };
    }
    return baseStyles;
  };

  if (!visible) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayOpacity,
            backgroundColor: overlayColor,
          },
        ]}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={[
          getPositionStyles(),
          getTransform(),
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
