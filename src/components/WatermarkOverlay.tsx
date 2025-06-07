import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

interface WatermarkOverlayProps {
  visible: boolean;
  userName?: string;
}

const { width, height } = Dimensions.get('window');

const WatermarkOverlay: React.FC<WatermarkOverlayProps> = ({ visible, userName = 'CONFIDENTIAL' }) => {
  if (!visible) return null;

  const watermarkText = `${userName} - ${new Date().toLocaleString()}`;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Diagonal watermarks */}
      {[...Array(8)].map((_, index) => (
        <View
          key={index}
          style={[
            styles.watermarkContainer,
            {
              top: (index * height) / 4 - 100,
              transform: [
                { rotate: '-45deg' },
                { translateX: (index % 2) * 100 },
              ],
            },
          ]}
        >
          <Text style={styles.watermarkText}>{watermarkText}</Text>
          <Text style={styles.watermarkSubtext}>PROPRIETARY - DO NOT DISTRIBUTE</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  watermarkContainer: {
    position: 'absolute',
    width: width * 1.5,
    alignItems: 'center',
  },
  watermarkText: {
    fontSize: 20,
    color: 'rgba(255, 0, 0, 0.15)',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  watermarkSubtext: {
    fontSize: 16,
    color: 'rgba(255, 0, 0, 0.12)',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default WatermarkOverlay;
