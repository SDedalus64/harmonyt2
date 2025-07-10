import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { isTablet, BRAND_TYPOGRAPHY } from "../config/brandColors";

interface FieldWithInfoProps extends TextInputProps {
  placeholder: string;
  inputRef?: React.RefObject<TextInput>;
  fieldKey?: "code" | "declared" | "freight" | "units";
  onInfoPress?: (field: "code" | "declared" | "freight" | "units") => void;
}

const FieldWithInfo: React.FC<FieldWithInfoProps> = ({
  placeholder,
  inputRef,
  fieldKey,
  onInfoPress,
  ...restProps
}) => {
  const showIconOnTablet = isTablet();
  const iconSize = showIconOnTablet ? 42 : 22;

  return (
    <View style={styles.inputGroup}>
      <TextInput
        ref={inputRef}
        placeholder={placeholder}
        style={[styles.input, restProps.style]}
        {...restProps}
      />

      {showIconOnTablet && fieldKey && onInfoPress && (
        <TouchableOpacity
          onPress={() => onInfoPress(fieldKey)}
          style={[styles.iconOverlay, { width: iconSize + 12 }]}
        >
          <Ionicons
            name="information-circle-outline"
            size={iconSize}
            color="#217DB2"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  iconOverlay: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: -56, // Moved 2px further left
    position: "absolute",
    top: 0,
    transform: [{ translateY: -7 }],
  },
  input: {
    fontFamily: BRAND_TYPOGRAPHY.getFontFamily("regular"),
    fontSize: 24, // 75% of 32
    height: 48, // Tightened to match LookupScreen input height
    width: "100%",
  },
  inputGroup: {
    position: "relative",
    width: "100%",
  },
});

export default FieldWithInfo;
