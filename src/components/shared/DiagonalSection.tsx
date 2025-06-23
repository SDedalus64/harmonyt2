import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BRAND_COLORS } from '../../config/brandColors';

export interface DiagonalSectionProps {
  /** Content rendered inside the diagonal section */
  children?: React.ReactNode;
  /** Additional styles applied to the root container */
  style?: ViewStyle | undefined;
  /** Gradient colours applied to the background */
  gradientColors?: readonly [string, string, ...string[]];
  /** Skew angle of the section in degrees (default: 45) */
  angle?: number;
  /** Fixed height for the section in pixels (default: 200) */
  height?: number;
}

export const DiagonalSection: React.FC<DiagonalSectionProps> = ({
  children,
  style,
  gradientColors = [BRAND_COLORS.gradientStart, BRAND_COLORS.gradientEnd] as const,
  angle = 45,
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
        <View style={styles.content}>
          {children}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'visible',
  },
  gradient: {
    flex: 1,
    transform: [{ skewY: '-2deg' }],
    marginTop: -10,
    marginBottom: -10,
  },
  content: {
    flex: 1,
    transform: [{ skewY: '2deg' }],
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
});
