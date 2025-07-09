import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  LayoutAnimation,
  Platform,
} from "react-native";
import { isTablet, getLayoutValue } from "../../platform/deviceUtils";
import {
  usePencilInteraction,
  isPreciseInteraction,
  PENCIL_CONSTANTS,
} from "../../platform/pencilUtils";

interface DraggableListItemProps {
  id: string;
  title: string;
  subtitle?: string;
  onDragStart?: () => void;
  onDragEnd?: (newIndex: number) => void;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: any;
  children?: React.ReactNode;
}

export default function DraggableListItem({
  id,
  title,
  subtitle,
  onDragStart,
  onDragEnd,
  onPress,
  onLongPress,
  style,
  children,
}: DraggableListItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isPencilActive, setIsPencilActive] = useState(false);
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;

  // Handle Apple Pencil interactions
  usePencilInteraction((event) => {
    if (event.type === "hover") {
      setIsPencilActive(true);
      Animated.spring(scale, {
        toValue: 1.02,
        useNativeDriver: true,
      }).start();
    } else if (
      event.type === "tap" &&
      isPreciseInteraction(event.pressure, event.altitude)
    ) {
      onPress?.();
    } else if (
      event.type === "longPress" &&
      isPreciseInteraction(event.pressure, event.altitude)
    ) {
      onLongPress?.();
    }
  }, isTablet());

  // Configure pan responder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only start dragging if the movement is significant
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        setIsDragging(true);
        onDragStart?.();
        Animated.spring(scale, {
          toValue: 1.05,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        setIsDragging(false);
        setIsPencilActive(false);
        Animated.parallel([
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Calculate new index based on gesture
          const newIndex = Math.round(gestureState.dy / 80); // Assuming item height is 80
          onDragEnd?.(newIndex);
        });
      },
    }),
  ).current;

  // Animate layout changes
  React.useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [isDragging, isPencilActive]);

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: scale },
          ],
          zIndex: isDragging ? 1 : 0,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View
        style={[
          styles.content,
          isDragging && styles.dragging,
          isPencilActive && styles.pencilActive,
        ]}
      >
        <View style={styles.textContainer}>
          <Text style={[styles.title, isTablet() && styles.titleTablet]}>
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[styles.subtitle, isTablet() && styles.subtitleTablet]}
            >
              {subtitle}
            </Text>
          )}
        </View>
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: getLayoutValue("borderRadius", "dimensions"),
    elevation: 3,
    marginHorizontal: getLayoutValue("medium", "spacing"),
    marginVertical: getLayoutValue("small", "spacing"),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: getLayoutValue("medium", "spacing"),
  },
  dragging: {
    elevation: 5,
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  pencilActive: {
    backgroundColor: "#F8F8F8",
  },
  subtitle: {
    color: "#666",
    fontSize: getLayoutValue("small", "typography"),
    marginTop: 4,
  },
  subtitleTablet: {
    fontSize: getLayoutValue("medium", "typography"),
    marginTop: 6,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: "#333",
    fontSize: getLayoutValue("medium", "typography"),
    fontWeight: "500",
  },
  titleTablet: {
    fontSize: getLayoutValue("large", "typography"),
  },
});
