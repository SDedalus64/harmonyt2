// Dedola Brand Configuration
// Based on social media templates and brand guidelines

export const BRAND_COLORS = {
  // Primary brand colors from Dedola templates
  electricBlue: '#0099FF',    // Primary brand blue
  darkNavy: '#0A1A3E',       // Dark backgrounds and text
  darkBlue: '#023559',       // Additional dark blue for headings
  white: '#FFFFFF',

  // Supporting colors
  lightBlue: '#4397EC',      // Secondary blue
  mediumBlue: '#217DB2',     // Medium blue for headers
  orange: '#E67E23',         // Accent orange

  // Neutral colors
  lightGray: '#F8F8F8',
  mediumGray: '#E1E1E1',
  darkGray: '#666666',
  black: '#333333',

  // Gradient colors for diagonal sections
  gradientStart: '#0099FF',
  gradientEnd: '#0A1A3E',

  // Status colors
  success: '#28A745',
  warning: '#FFC107',
  error: '#DC3545',
  info: '#17A2B8',
};

export const BRAND_TYPOGRAPHY = {
  // Font families
  primary: 'System',
  secondary: 'System',

  // Responsive font sizes (backward compatible)
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    // Responsive versions
    mobile: {
      xs: 11,
      sm: 13,
      md: 15,
      lg: 17,
      xl: 19,
      xxl: 22,
      xxxl: 28,
    },
    tablet: {
      xs: 14,
      sm: 16,
      md: 18,
      lg: 20,
      xl: 24,
      xxl: 28,
      xxxl: 36,
    },
  },

  // Font weights
  weights: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const BRAND_SPACING = {
  // Backward compatible
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  // Responsive versions
  mobile: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 20,
    xl: 28,
    xxl: 40,
    xxxl: 56,
  },
  tablet: {
    xs: 6,
    sm: 12,
    md: 20,
    lg: 32,
    xl: 44,
    xxl: 64,
    xxxl: 88,
  },
};

export const BRAND_SHADOWS = {
  small: {
    shadowColor: BRAND_COLORS.darkNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: BRAND_COLORS.darkNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: BRAND_COLORS.darkNavy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const BRAND_PRINCIPLES = {
  tagline: 'Precision Delivered',
  mission: 'Delivering precise trade intelligence with elegant simplicity',
  values: [
    'Precision in every detail',
    'Elegant user experience',
    'Reliable trade data',
    'Professional excellence',
  ],
};

// Animation configurations
export const BRAND_ANIMATIONS = {
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  timing: {
    duration: 300,
  },
  easing: {
    ease: 'easeInOut',
  },
};

// Responsive utility functions
import { Dimensions, Platform } from 'react-native';

export const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = height / width;
  return Platform.OS === 'ios' && (aspectRatio <= 1.6);
};

export const getResponsiveValue = (mobileValue: any, tabletValue: any) => {
  return isTablet() ? tabletValue : mobileValue;
};

export const getTypographySize = (size: keyof typeof BRAND_TYPOGRAPHY.sizes.mobile) => {
  return isTablet() ? BRAND_TYPOGRAPHY.sizes.tablet[size] : BRAND_TYPOGRAPHY.sizes.mobile[size];
};

export const getSpacing = (size: keyof typeof BRAND_SPACING.mobile) => {
  return isTablet() ? BRAND_SPACING.tablet[size] : BRAND_SPACING.mobile[size];
};

export const getBorderRadius = (size: keyof typeof BRAND_LAYOUT.borderRadius.mobile) => {
  return isTablet() ? BRAND_LAYOUT.borderRadius.tablet[size] : BRAND_LAYOUT.borderRadius.mobile[size];
};

export const getDrawerConfig = () => {
  return isTablet() ? BRAND_LAYOUT.drawer.tablet : BRAND_LAYOUT.drawer.mobile;
};

export const getFabConfig = () => {
  return isTablet() ? BRAND_LAYOUT.fab.tablet : BRAND_LAYOUT.fab.mobile;
};

export const getInputConfig = () => {
  return isTablet() ? BRAND_LAYOUT.input.tablet : BRAND_LAYOUT.input.mobile;
};

export const getButtonConfig = () => {
  return isTablet() ? BRAND_LAYOUT.button.tablet : BRAND_LAYOUT.button.mobile;
};

// Layout constants
export const BRAND_LAYOUT = {
  borderRadius: {
    // Backward compatible
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    // Responsive versions
    mobile: {
      sm: 6,
      md: 10,
      lg: 14,
      xl: 20,
    },
    tablet: {
      sm: 10,
      md: 16,
      lg: 22,
      xl: 32,
    },
  },
  drawer: {
    // Backward compatible
    width: 320,
    headerHeight: 120,
    itemHeight: 60,
    // Responsive versions
    mobile: {
      width: 360,
      headerHeight: 100,
      itemHeight: 56,
      maxHeight: '85%',
    },
    tablet: {
      width: 520,
      headerHeight: 120,
      itemHeight: 72,
      maxHeight: '90%',
    },
  },
  fab: {
    // Backward compatible
    size: 56,
    iconSize: 24,
    // Responsive versions
    mobile: {
      size: 52,
      iconSize: 22,
    },
    tablet: {
      size: 64,
      iconSize: 28,
    },
  },
  input: {
    mobile: {
      height: 44,
      fontSize: 15,
    },
    tablet: {
      height: 56,
      fontSize: 18,
    },
  },
  button: {
    mobile: {
      height: 44,
      fontSize: 15,
    },
    tablet: {
      height: 56,
      fontSize: 18,
    },
  },
};
