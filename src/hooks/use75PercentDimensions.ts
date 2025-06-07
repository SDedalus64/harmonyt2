import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

interface Dimensions75 {
  width: number;
  height: number;
  screenWidth: number;
  screenHeight: number;
}

export const use75PercentDimensions = (): Dimensions75 => {
  const [dimensions, setDimensions] = useState<Dimensions75>(() => {
    const { width, height } = Dimensions.get('window');
    return {
      width: width * 0.75,
      height: height * 0.75,
      screenWidth: width,
      screenHeight: height,
    };
  });

  useEffect(() => {
    const updateDimensions = ({ window }: { window: ScaledSize }) => {
      setDimensions({
        width: window.width * 0.75,
        height: window.height * 0.75,
        screenWidth: window.width,
        screenHeight: window.height,
      });
    };

    const subscription = Dimensions.addEventListener('change', updateDimensions);

    return () => subscription?.remove();
  }, []);

  return dimensions;
};
