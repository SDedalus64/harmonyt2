import React, { useState, useEffect } from "react";
import { View, StyleSheet, Dimensions, ScaledSize } from "react-native";
import { Text } from "../components/Text";
import { BRAND_COLORS as COLORS } from "../config/brandColors";

const DynamicExample75PercentScreen = () => {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get("window");
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

    const subscription = Dimensions.addEventListener(
      "change",
      updateDimensions,
    );

    return () => subscription?.remove();
  }, []);

  return (
    <View style={styles.fullScreen}>
      <View
        style={[
          styles.container75,
          {
            width: dimensions.containerWidth,
            height: dimensions.containerHeight,
          },
        ]}
      >
        <Text style={styles.text}>Dynamic 75% Container</Text>
        <Text style={styles.subText}>This updates on orientation change</Text>
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
  container75: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    elevation: 5,
    justifyContent: "center",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fullScreen: {
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    flex: 1,
    justifyContent: "center",
  },
  subText: {
    color: COLORS.darkGray,
    fontSize: 14,
    marginVertical: 5,
    textAlign: "center",
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
});

export default DynamicExample75PercentScreen;
