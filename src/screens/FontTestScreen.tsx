import { View, StyleSheet, ScrollView } from "react-native";
import { Text } from "../components/Text";
import React from "react";
import { BRAND_COLORS, BRAND_TYPOGRAPHY } from "../config/brandColors";

export default function FontTestScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Geologica Font Test</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Default (No Font Family)</Text>
        <Text style={styles.defaultText}>
          This is default text without font family
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>With Font Families</Text>

        <Text style={[styles.testText, { fontFamily: "Geologica-Light" }]}>
          Geologica Light (300)
        </Text>

        <Text style={[styles.testText, { fontFamily: "Geologica-Regular" }]}>
          Geologica Regular (400)
        </Text>

        <Text style={[styles.testText, { fontFamily: "Geologica-Medium" }]}>
          Geologica Medium (500)
        </Text>

        <Text style={[styles.testText, { fontFamily: "Geologica-SemiBold" }]}>
          Geologica SemiBold (600)
        </Text>

        <Text style={[styles.testText, { fontFamily: "Geologica-Bold" }]}>
          Geologica Bold (700)
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Using Helper Function</Text>

        <Text style={[styles.testText, BRAND_TYPOGRAPHY.getFontStyle("light")]}>
          Light using getFontStyle
        </Text>

        <Text
          style={[styles.testText, BRAND_TYPOGRAPHY.getFontStyle("regular")]}
        >
          Regular using getFontStyle
        </Text>

        <Text
          style={[styles.testText, BRAND_TYPOGRAPHY.getFontStyle("medium")]}
        >
          Medium using getFontStyle
        </Text>

        <Text
          style={[styles.testText, BRAND_TYPOGRAPHY.getFontStyle("semibold")]}
        >
          SemiBold using getFontStyle
        </Text>

        <Text style={[styles.testText, BRAND_TYPOGRAPHY.getFontStyle("bold")]}>
          Bold using getFontStyle
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BRAND_COLORS.white,
    flex: 1,
    padding: 20,
  },
  defaultText: {
    fontSize: 16,
    marginBottom: 5,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: BRAND_COLORS.darkNavy,
    fontSize: 18,
    marginBottom: 10,
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
  },
  testText: {
    color: BRAND_COLORS.darkNavy,
    fontSize: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
    ...BRAND_TYPOGRAPHY.getFontStyle("bold"),
  },
});
