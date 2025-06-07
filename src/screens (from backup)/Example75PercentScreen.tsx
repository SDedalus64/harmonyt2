import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

// Get device dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Calculate 75% of screen dimensions
const containerWidth = screenWidth * 0.75;
const containerHeight = screenHeight * 0.75;

const Example75PercentScreen = () => {
  return (
    <View style={styles.fullScreen}>
      <View style={styles.container75}>
        <Text style={styles.text}>
          This container is 75% of the screen size
        </Text>
        <Text style={styles.subText}>
          Width: {containerWidth.toFixed(0)}px ({screenWidth.toFixed(0)}px screen)
        </Text>
        <Text style={styles.subText}>
          Height: {containerHeight.toFixed(0)}px ({screenHeight.toFixed(0)}px screen)
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
    width: containerWidth,
    height: containerHeight,
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
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 5,
  },
});

export default Example75PercentScreen;
