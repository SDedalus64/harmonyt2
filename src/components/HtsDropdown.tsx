import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  BRAND_COLORS,
  BRAND_TYPOGRAPHY,
  getTypographySize,
  getSpacing,
  getBorderRadius,
  getResponsiveValue,
} from "../config/brandColors";

interface HtsDropdownProps {
  htsCode: string;
  suggestions: { code: string; description?: string }[];
  onSelect: (code: string, description?: string) => void;
  visible: boolean;
}

const HtsDropdown = ({
  htsCode,
  suggestions,
  onSelect,
  visible,
}: HtsDropdownProps) => {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  if (!visible || suggestions.length === 0) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <TouchableWithoutFeedback>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.dropdown}>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownTitle}>Select HTS Code</Text>
              </View>
              <FlatList
                data={suggestions}
                keyExtractor={(item) => item.code}
                style={styles.list}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.item,
                      expandedItem === item.code && styles.expandedItem,
                    ]}
                    onPress={() => {
                      onSelect(item.code, item.description);
                      setExpandedItem(null);
                    }}
                    onLongPress={() =>
                      setExpandedItem(
                        expandedItem === item.code ? null : item.code,
                      )
                    }
                  >
                    <Text style={styles.code}>{item.code}</Text>
                    <Text
                      numberOfLines={expandedItem === item.code ? undefined : 1}
                      style={styles.description}
                    >
                      {item.description || ""}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  code: {
    fontSize: getResponsiveValue(
      getTypographySize("md"),
      getTypographySize("md") * 1.2,
    ),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: BRAND_COLORS.electricBlue,
    marginBottom: 2,
  },
  description: {
    fontSize: getResponsiveValue(
      getTypographySize("sm"),
      getTypographySize("sm") * 1.2,
    ),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.darkGray,
  },
  dropdown: {
    backgroundColor: BRAND_COLORS.white,
    borderRadius: getBorderRadius("lg"),
    maxHeight: "80%",
    maxWidth: getResponsiveValue(400, 600),
    width: "100%",
    ...Platform.select({
      ios: {
        shadowColor: BRAND_COLORS.darkNavy,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  dropdownHeader: {
    alignItems: "center",
    borderBottomColor: BRAND_COLORS.lightGray,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: getSpacing("md"),
  },
  dropdownTitle: {
    fontSize: getResponsiveValue(
      getTypographySize("lg"),
      getTypographySize("lg") * 1.2,
    ),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: BRAND_COLORS.darkNavy,
  },
  expandedItem: {
    backgroundColor: "#E8F4FD",
  },
  item: {
    borderBottomColor: BRAND_COLORS.lightGray,
    borderBottomWidth: 1,
    minHeight: getResponsiveValue(48, 56),
    paddingHorizontal: getSpacing("md"),
    paddingVertical: getSpacing("sm"),
  },
  list: {
    maxHeight: getResponsiveValue(400, 500),
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flex: 1,
    justifyContent: "center",
    padding: getSpacing("lg"),
  },
});

export default HtsDropdown;
