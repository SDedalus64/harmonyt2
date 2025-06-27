import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { isTablet } from "../platform/deviceUtils";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

// ---------------------------------------------------------------------------
// LinksScreen
// ---------------------------------------------------------------------------
// This screen houses a curated list of external resources such as the company
// web-site, privacy policy, terms of service and the support e-mail link. It is
// rendered inside a bottom drawer from several parts of the application. The
// component purposefully keeps the UI minimal – just enough to restore the
// missing module while still providing useful actions to the user.
// ---------------------------------------------------------------------------

interface LinkItem {
  /** Display text shown to the user */
  label: string;
  /** Target URL (mailto: or https://) */
  url: string;
  /** Optional icon name from Ionicons */
  icon?: string;
}

interface ArticleItem {
  title: string;
  url: string;
}

const LINKS: LinkItem[] = [
  {
    label: "Company Website",
    url: "https://dedola.com",
    icon: "globe-outline",
  },
  {
    label: "Privacy Policy",
    url: "https://dedola.com/privacy",
    icon: "shield-checkmark-outline",
  },
  {
    label: "Terms of Service",
    url: "https://dedola.com/terms",
    icon: "document-text-outline",
  },
  {
    label: "Support",
    url: "mailto:support@dedola.com",
    icon: "help-circle-outline",
  },
];

const ARTICLES: ArticleItem[] = [
  {
    title: "HTS Classification: A 5-Minute Guide",
    url: "https://dedola.com/blog/hts-classification-guide",
  },
  {
    title: "Incoterms® 2024 – Free Cheat-Sheet",
    url: "https://dedola.com/blog/incoterms-2024-cheat-sheet",
  },
  {
    title: "Section 301 Tariffs Explained",
    url: "https://dedola.com/blog/section-301-tariffs-explained",
  },
];

export default function LinksScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handlePress = useCallback(
    (url: string, title: string) => {
      // Navigate to in-app webview instead of leaving the app.
      navigation.navigate("InAppWebView", { url, title });
    },
    [navigation],
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {LINKS.map(({ label, url, icon }) => (
          <TouchableOpacity
            key={url}
            style={styles.linkRow}
            activeOpacity={0.7}
            onPress={() => handlePress(url, label)}
          >
            {icon && (
              <Ionicons
                name={icon as any}
                size={24}
                color={COLORS.electricBlue}
                style={styles.icon}
              />
            )}
            <Text style={styles.linkLabel}>{label}</Text>
            <Ionicons
              name={Platform.OS === "ios" ? "chevron-forward" : "arrow-forward"}
              size={20}
              color={COLORS.darkGray}
              style={styles.chevron}
            />
          </TouchableOpacity>
        ))}
        {ARTICLES.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Articles & Guides</Text>
            {ARTICLES.map(({ title, url }) => (
              <TouchableOpacity
                key={url}
                style={styles.linkRow}
                activeOpacity={0.7}
                onPress={() => handlePress(url, title)}
              >
                <Ionicons
                  name="document-text-outline"
                  size={24}
                  color={COLORS.electricBlue}
                  style={styles.icon}
                />
                <Text style={styles.linkLabel}>{title}</Text>
                <Ionicons
                  name={
                    Platform.OS === "ios" ? "chevron-forward" : "arrow-forward"
                  }
                  size={20}
                  color={COLORS.darkGray}
                  style={styles.chevron}
                />
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styling
// ---------------------------------------------------------------------------

const COLORS = {
  darkNavy: "#0B2953",
  electricBlue: "#217DB2",
  lightGray: "#F4F4F4",
  darkGray: "#666666",
  white: "#FFFFFF",
};

const styles = StyleSheet.create({
  chevron: {
    marginLeft: 8,
  },
  container: {
    backgroundColor: COLORS.white,
    flex: 1,
  },
  icon: {
    marginRight: 16,
  },
  linkLabel: {
    color: COLORS.darkNavy,
    flex: 1,
    fontSize: isTablet() ? 18 : 16,
    fontWeight: "500",
  },
  linkRow: {
    alignItems: "center",
    borderBottomColor: COLORS.lightGray,
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: isTablet() ? 20 : 16,
  },
  scrollContent: {
    paddingTop: 16,
  },
  sectionHeader: {
    color: COLORS.darkNavy,
    fontSize: isTablet() ? 20 : 18,
    fontWeight: "600",
    paddingBottom: 8,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
});
