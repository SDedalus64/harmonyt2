import React from "react";
import { Text as RNText, TextProps, StyleSheet } from "react-native";
import { BRAND_TYPOGRAPHY } from "../config/brandColors";

interface CustomTextProps extends TextProps {
  weight?: "light" | "regular" | "medium" | "semibold" | "bold";
}

export const Text: React.FC<CustomTextProps> = ({
  style,
  weight = "regular",
  ...props
}) => {
  const fontFamily = BRAND_TYPOGRAPHY.getFontFamily(weight);

  return (
    <RNText {...props} style={[styles.defaultText, { fontFamily }, style]} />
  );
};

const styles = StyleSheet.create({
  defaultText: {
    // Default font family will be set dynamically
  },
});

// Export as default for easier migration
export default Text;
