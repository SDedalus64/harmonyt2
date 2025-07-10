import React from "react";
import { Animated, StyleSheet, TouchableOpacity } from "react-native";
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { BRAND_COLORS, getResponsiveValue } from "../config/brandColors";

interface InfoTabProps {
  /** Y-coordinate (absolute) where the tab should be rendered */
  y: number;
  /** Animated opacity value */
  opacity: Animated.Value;
  /** Physical size of the tab (width = height). 40 on iPhone, ~48 on iPad */
  size?: number;
  /** Called when the user taps the tab */
  onPress: () => void;
  /** Forwarded gesture handler for right-swipe to open drawer */
  onDrag: (event: PanGestureHandlerGestureEvent) => void;
  /** Optional additional horizontal offset (defaults −size × 0.25) */
  leftOffset?: number;
}

export const InfoTab: React.FC<InfoTabProps> = ({
  y,
  opacity,
  size = 40,
  leftOffset,
  onPress,
  onDrag,
}) => {
  const dimension = size;
  const borderRadius = dimension / 2;
  const left = leftOffset ?? -dimension * 0.25;

  return (
    <PanGestureHandler onGestureEvent={onDrag} enabled={true}>
      <Animated.View
        pointerEvents="auto"
        style={[
          styles.container,
          {
            width: dimension,
            height: dimension,
            borderRadius,
            top: y,
            left,
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.touchArea}
          activeOpacity={0.8}
          onPress={onPress}
        >
          <Ionicons
            name="information-circle-outline"
            size={getResponsiveValue(24, 30)}
            color={BRAND_COLORS.white}
          />
        </TouchableOpacity>
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    backgroundColor: BRAND_COLORS.electricBlue,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3000,
    elevation: 30,
  },
  touchArea: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});