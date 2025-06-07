import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScaledSize } from 'react-native';

const DynamicExample75PercentScreen = () => {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return {
      screenWidth: width,
      screenHeight: height,
      containerWidth: width * 0.75,
      containerHeight: height * 0.75,
    };
  });

  useEffect(() => {
    const updateDimensions = ({ window }: { window: ScaledSize }) => {
      setDimensions({
        screenWidth: window.width,
        screenHeight: window.height,
        containerWidth: window.width * 0.75,
        containerHeight: window.height * 0.75,
      });
    };

    const subscription = Dimensions.addEventListener('change', updateDimensions);

    return () => subscription?.remove();
  }, []);

  return (
    <View style={styles.fullScreen}>
      <View style={[
        styles.container75,
        {
          width: dimensions.containerWidth,
          height: dimensions.containerHeight,
        }
      ]}>
        <Text style={styles.text}>
          Dynamic 75% Container
        </Text>
        <Text style={styles.subText}>
          This updates on orientation change
        </Text>
        <Text style={styles.subText}>
          Width: {dimensions.containerWidth.toFixed(0)}px
        </Text>
        <Text style={styles.subText}>
          Height: {dimensions.containerHeight.toFixed(0)}px
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  container75: {
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    padding: 20,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 5,
    textAlign: 'center',
  },
});

export default DynamicExample75PercentScreen;
