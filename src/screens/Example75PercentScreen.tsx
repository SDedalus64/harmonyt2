import { View, StyleSheet, Dimensions } from "react-native";
import { Text } from "../components/Text";
import React from "react";
import { BRAND_COLORS as COLORS } from "../config/brandColors";

// Get device dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

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
          Width: {containerWidth.toFixed(0)}px ({screenWidth.toFixed(0)}px
          screen)
        </Text>
        <Text style={styles.subText}>
          Height: {containerHeight.toFixed(0)}px ({screenHeight.toFixed(0)}px
          screen)
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container75: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    elevation: 5,
    height: containerHeight,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: containerWidth,
  },
  fullScreen: {
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    flex: 1,
    justifyContent: "center",
  },
  subText: {
    color: "#666",
    fontSize: 14,
    marginVertical: 5,
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
});

export default Example75PercentScreen;
