import { TextStyle } from "react-native";
import { BRAND_TYPOGRAPHY } from "./brandColors";

// Global text style helper that automatically applies the correct Geologica font
export const getTextStyle = (
  weight: keyof typeof BRAND_TYPOGRAPHY.weights = "regular",
): TextStyle => {
  return BRAND_TYPOGRAPHY.getFontStyle(weight);
};

// Pre-defined text styles with Geologica fonts
export const GlobalTextStyles = {
  light: BRAND_TYPOGRAPHY.getFontStyle("light"),
  regular: BRAND_TYPOGRAPHY.getFontStyle("regular"),
  medium: BRAND_TYPOGRAPHY.getFontStyle("medium"),
  semibold: BRAND_TYPOGRAPHY.getFontStyle("semibold"),
  bold: BRAND_TYPOGRAPHY.getFontStyle("bold"),
};

// Helper to apply font family based on existing fontWeight in style
export const applyFontFamily = (
  style: TextStyle | TextStyle[] | undefined,
): TextStyle | TextStyle[] => {
  if (!style) {
    return { fontFamily: BRAND_TYPOGRAPHY.getFontFamily("regular") };
  }

  if (Array.isArray(style)) {
    return style.map((s) => applyFontFamily(s) as TextStyle);
  }

  const fontWeight = style.fontWeight;
  let weight: keyof typeof BRAND_TYPOGRAPHY.weights = "regular";

  // Map numeric and string font weights to our font variants
  switch (fontWeight) {
    case "300":
    case 300:
    case "light":
      weight = "light";
      break;
    case "400":
    case 400:
    case "normal":
    case "regular":
      weight = "regular";
      break;
    case "500":
    case 500:
    case "medium":
      weight = "medium";
      break;
    case "600":
    case 600:
    case "semibold":
      weight = "semibold";
      break;
    case "700":
    case 700:
    case "bold":
      weight = "bold";
      break;
    default:
      weight = "regular";
  }

  return {
    ...style,
    fontFamily: BRAND_TYPOGRAPHY.getFontFamily(weight),
  };
};
