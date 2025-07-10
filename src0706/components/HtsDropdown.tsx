import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Keyboard,
} from "react-native";

const BRAND_YELLOW = "#FFCB05";
const BRAND_BLUE_DARK = "#1E3A8A"; // Adjust if needed
const BRAND_BLUE_LIGHT = "#93C5FD";

const HtsDropdown = ({
  htsCode,
  suggestions,
  onSelect,
  visible,
  maxHeight = 200,
}: {
  htsCode: string;
  suggestions: { code: string; description?: string }[];
  onSelect: (code: string, description?: string) => void;
  visible: boolean;
  maxHeight?: number;
}) => {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  if (!visible || suggestions.length === 0) return null;

  const renderItem = ({
    item,
  }: {
    item: { code: string; description?: string };
  }) => {
    const isExpanded = expandedItem === item.code;

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => {
          onSelect(item.code, item.description);
          setExpandedItem(null);
          Keyboard.dismiss();
        }}
        onLongPress={() =>
          setExpandedItem((prev) => (prev === item.code ? null : item.code))
        }
      >
        <Text style={styles.code}>{item.code}</Text>
        <Text
          numberOfLines={isExpanded ? undefined : 1}
          style={styles.description}
        >
          {item.description || ""}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.dropdownContainer, { maxHeight }]}>
      <FlatList
        data={suggestions}
        renderItem={renderItem}
        keyExtractor={(item) => item.code}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  code: {
    color: BRAND_BLUE_DARK,
    fontSize: 16,
    fontWeight: "600",
  },
  description: {
    color: BRAND_BLUE_LIGHT,
    fontSize: 14,
  },
  dropdownContainer: {
    position: "absolute",
    top: 120, // Adjust based on actual field position
    left: 16,
    right: 16,
    backgroundColor: BRAND_YELLOW,
    borderRadius: 8,
    zIndex: 9999,
    opacity: 1,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  item: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});

export default HtsDropdown;
