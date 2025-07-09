import React from "react";
import { Text as RNText, TextProps, TextStyle, StyleProp } from "react-native";
import { BRAND_TYPOGRAPHY } from "../config/brandColors";

// Custom Text component that automatically applies Geologica font
export const Text: React.FC<TextProps> = ({ style, ...props }) => {
  const getFontFamilyFromStyle = (textStyle: StyleProp<TextStyle>): string => {
    if (!textStyle || textStyle === null) {
      return BRAND_TYPOGRAPHY.getFontFamily("regular");
    }

    // If it's an array, get the fontWeight from the last style object
    if (Array.isArray(textStyle)) {
      for (let i = textStyle.length - 1; i >= 0; i--) {
        const s = textStyle[i];
        if (s && typeof s === "object" && "fontWeight" in s) {
          return getFontFamilyFromWeight(s.fontWeight);
        }
      }
      return BRAND_TYPOGRAPHY.getFontFamily("regular");
    }

    // Single style object
    if (
      typeof textStyle === "object" &&
      "fontWeight" in textStyle &&
      textStyle.fontWeight
    ) {
      return getFontFamilyFromWeight(textStyle.fontWeight);
    }

    return BRAND_TYPOGRAPHY.getFontFamily("regular");
  };

  const getFontFamilyFromWeight = (
    fontWeight: TextStyle["fontWeight"],
  ): string => {
    switch (fontWeight) {
      case "300":
      case 300:
        return BRAND_TYPOGRAPHY.getFontFamily("light");
      case "400":
      case 400:
      case "normal":
        return BRAND_TYPOGRAPHY.getFontFamily("regular");
      case "500":
      case 500:
        return BRAND_TYPOGRAPHY.getFontFamily("medium");
      case "600":
      case 600:
        return BRAND_TYPOGRAPHY.getFontFamily("semibold");
      case "700":
      case 700:
      case "bold":
        return BRAND_TYPOGRAPHY.getFontFamily("bold");
      default:
        return BRAND_TYPOGRAPHY.getFontFamily("regular");
    }
  };

  const fontFamily = getFontFamilyFromStyle(style);

  return <RNText {...props} style={[{ fontFamily }, style]} />;
};

export default Text;
