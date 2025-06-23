import { Platform } from 'react-native';

type LayoutType = 'spacing' | 'typography' | 'dimensions';
type LayoutKey = 'small' | 'medium' | 'large';
type DimensionKey = 'buttonHeight' | 'inputHeight' | 'borderRadius';

interface BaseLayout {
  mobile: Record<LayoutKey, number>;
  tablet: Record<LayoutKey, number>;
}

interface DimensionLayout {
  mobile: Record<DimensionKey, number>;
  tablet: Record<DimensionKey, number>;
}

interface LayoutConstants {
  spacing: BaseLayout;
  typography: BaseLayout;
  dimensions: DimensionLayout;
}

export const isTablet = () => Platform.OS === 'ios' && (Platform as any).isPad === true;

export const getDeviceSpecificStyles = (mobileStyles: any, tabletStyles: any) => {
  return isTablet() ? { ...mobileStyles, ...tabletStyles } : mobileStyles;
};

export const getDeviceSpecificComponent = (mobileComponent: any, tabletComponent: any) => {
  return isTablet() ? tabletComponent : mobileComponent;
};

// Layout constants for different devices
export const layoutConstants: LayoutConstants = {
  spacing: {
    mobile: {
      small: 8,
      medium: 16,
      large: 24,
    },
    tablet: {
      small: 12,
      medium: 24,
      large: 32,
    },
  },
  typography: {
    mobile: {
      small: 14,
      medium: 16,
      large: 20,
    },
    tablet: {
      small: 16,
      medium: 20,
      large: 24,
    },
  },
  dimensions: {
    mobile: {
      buttonHeight: 44,
      inputHeight: 44,
      borderRadius: 12,
    },
    tablet: {
      buttonHeight: 56,
      inputHeight: 56,
      borderRadius: 16,
    },
  },
};

// Get device-specific layout values
export const getLayoutValue = (key: LayoutKey | DimensionKey, type: LayoutType): number => {
  const device = isTablet() ? 'tablet' : 'mobile';
  if (type === 'dimensions') {
    return (layoutConstants[type][device] as Record<DimensionKey, number>)[key as DimensionKey];
  }
  return (layoutConstants[type][device] as Record<LayoutKey, number>)[key as LayoutKey];
};
