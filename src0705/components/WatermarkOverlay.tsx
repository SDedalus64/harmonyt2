import { View, StyleSheet, Dimensions } from "react-native";
import { Text } from "./Text";
import React from "react";

interface WatermarkOverlayProps {
  visible: boolean;
  userName?: string;
}

const { width, height } = Dimensions.get("window");

const WatermarkOverlay: React.FC<WatermarkOverlayProps> = ({
  visible,
  userName = "CONFIDENTIAL",
}) => {
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
                { rotate: "-45deg" },
                { translateX: (index % 2) * 100 },
              ],
            },
          ]}
        >
          <Text style={styles.watermarkText}>{watermarkText}</Text>
          <Text style={styles.watermarkSubtext}>
            PROPRIETARY - DO NOT DISTRIBUTE
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    elevation: 9999,
    zIndex: 9999,
  },
  watermarkContainer: {
    alignItems: "center",
    position: "absolute",
    width: width * 1.5,
  },
  watermarkSubtext: {
    color: "rgba(255, 0, 0, 0.12)",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  watermarkText: {
    color: "rgba(255, 0, 0, 0.15)",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default WatermarkOverlay;
