import React from "react";
import { View, StyleSheet, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BRAND_COLORS } from "../../config/brandColors";

export interface HorizontalSectionProps {
  /** Content rendered inside the horizontal section */
  children?: React.ReactNode;
  /** Additional styles applied to the root container */
  style?: ViewStyle | undefined;
  /** Gradient colours applied to the background */
  gradientColors?: readonly [string, string, ...string[]];
  /** Fixed height for the section in pixels (default: 200) */
  height?: number;
}

export const HorizontalSection: React.FC<HorizontalSectionProps> = ({
  children,
  style,
  gradientColors = [
    BRAND_COLORS.gradientStart,
    BRAND_COLORS.gradientEnd,
  ] as const,
  height = 200,
}) => {
  return (
    <View style={[styles.container, { height }, style]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>{children}</View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "visible",
  },
  content: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  gradient: {
    flex: 1,
  },
});
