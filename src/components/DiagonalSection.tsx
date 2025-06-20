import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BRAND_COLORS } from '../config/brandColors';

interface DiagonalSectionProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary' | 'dark';
  direction?: 'left' | 'right';
  height?: number;
  angle?: number;
}

export const DiagonalSection: React.FC<DiagonalSectionProps> = ({
  children,
  style,
  variant = 'primary',
  direction = 'right',
  height = 300,
  angle = 5,
}) => {
  const getGradientColors = (): [string, string] => {
    switch (variant) {
      case 'primary':
        return [BRAND_COLORS.gradientStart, BRAND_COLORS.gradientEnd];
      case 'secondary':
        return [BRAND_COLORS.lightBlue, BRAND_COLORS.electricBlue];
      case 'dark':
        return [BRAND_COLORS.darkNavy, BRAND_COLORS.mediumBlue];
      default:
        return [BRAND_COLORS.gradientStart, BRAND_COLORS.gradientEnd];
    }
  };

  const skewAngle = direction === 'right' ? -angle : angle;

  return (
    <View style={[styles.container, { height }, style]}>
      <View
        style={[
          styles.diagonalWrapper,
          { transform: [{ skewY: `${skewAngle}deg` }] }
        ]}
      >
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            { transform: [{ skewY: `${-skewAngle}deg` }, { scaleX: 1.5 }] }
          ]}
        />
      </View>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

// Geometric pattern overlay component
interface GeometricPatternProps {
  opacity?: number;
  color?: string;
}

export const GeometricPattern: React.FC<GeometricPatternProps> = ({
  opacity = 0.1,
  color = BRAND_COLORS.white,
}) => {
  return (
    <View style={[styles.patternContainer, { opacity }]}>
      {/* Create a pattern similar to the logo's geometric blocks */}
      <View style={styles.patternRow}>
        <View style={[styles.patternBlock, { backgroundColor: color }]} />
        <View style={[styles.patternBlock, { backgroundColor: color, opacity: 0.7 }]} />
        <View style={[styles.patternBlock, { backgroundColor: color, opacity: 0.5 }]} />
        <View style={[styles.patternBlock, { backgroundColor: color, opacity: 0.3 }]} />
      </View>
      <View style={[styles.patternRow, { marginTop: -20 }]}>
        <View style={[styles.patternBlock, { backgroundColor: color, opacity: 0.3 }]} />
        <View style={[styles.patternBlock, { backgroundColor: color, opacity: 0.5 }]} />
        <View style={[styles.patternBlock, { backgroundColor: color, opacity: 0.7 }]} />
        <View style={[styles.patternBlock, { backgroundColor: color }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  diagonalWrapper: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
  content: {
    position: 'relative',
    zIndex: 1,
    flex: 1,
  },
  patternContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patternRow: {
    flexDirection: 'row',
    transform: [{ rotate: '45deg' }],
  },
  patternBlock: {
    width: 40,
    height: 40,
    margin: 5,
    transform: [{ rotate: '-45deg' }],
  },
});
