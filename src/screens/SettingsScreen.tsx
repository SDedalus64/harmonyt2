/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment, @typescript-eslint/no-require-imports, react-native/no-unused-styles, react-native/no-color-literals */
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  Image,
  Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { RootStackParamList } from "../navigation/types";
import { useAuth } from "../navigation/contexts/AuthContext";
import { isTablet } from "../platform/deviceUtils";
import { useSettings } from "../hooks/useSettings";
import { useHistory } from "../hooks/useHistory";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCountryName } from "../utils/countries";
import { BRAND_COLORS as COLORS } from "../config/brandColors";
import { haptics } from "../utils/haptics";

export default function SettingsScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { logout } = useAuth();
  const { settings, updateSetting } = useSettings();
  const { clearHistory } = useHistory();
  const insets = useSafeAreaInsets();
  const logoMarginTop = isTablet() ? 32 : insets.top + 8;

  const handleLogout = async () => {
    haptics.warning();
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          onPress: async () => {
            try {
              haptics.success();
              await logout();
              // @ts-ignore
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });
            } catch (error) {
              console.error("Logout error:", error);
              haptics.error();
              Alert.alert("Error", "Failed to logout");
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const handleClearCache = async () => {
    Alert.alert(
      "Clear Cache",
      "This will clear all cached data. The app will need to re-download tariff data on next use.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear all AsyncStorage except settings and auth
              const keys = await AsyncStorage.getAllKeys();
              const keysToRemove = keys.filter(
                (key) =>
                  !key.includes("settings") &&
                  !key.includes("auth") &&
                  !key.includes("history"),
              );
              await AsyncStorage.multiRemove(keysToRemove);
              Alert.alert("Success", "Cache cleared successfully");
            } catch (error) {
              console.error("Clear cache error:", error);
              Alert.alert("Error", "Failed to clear cache");
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const handleClearAllData = async () => {
    Alert.alert(
      "Clear All Data",
      "This will clear all app data including history, settings, and cached data. This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await clearHistory();
              await AsyncStorage.clear();
              Alert.alert("Success", "All data cleared successfully");
              // Reset settings to defaults
              await updateSetting("autoSaveToHistory", true);
              await updateSetting("notifications", true);
              await updateSetting("darkMode", false);
              await updateSetting("cellularData", true);
              await updateSetting("showUnitCalculations", false);
              await updateSetting("defaultCountry", "");
              await updateSetting("hapticFeedback", true);
            } catch (error) {
              console.error("Clear all data error:", error);
              Alert.alert("Error", "Failed to clear all data");
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const handlePrivacyPolicy = () => {
    navigation.navigate("InAppWebView", {
      url: "https://www.ratecast.com/privacy-policy",
      title: "Privacy Policy",
    });
  };

  const handleTermsOfService = () => {
    navigation.navigate("InAppWebView", {
      url: "https://www.ratecast.com/terms-of-service",
      title: "Terms of Service",
    });
  };

  const handleContactSupport = () => {
    Linking.openURL("mailto:support@ratecast.com");
  };

  const handleRateApp = () => {
    // TODO: Add app store links when published
    Alert.alert(
      "Rate App",
      "Thank you! App store rating will be available when the app is published.",
    );
  };

  const handleCompanyWebsite = () => {
    navigation.navigate("InAppWebView", {
      url: "https://dedola.com",
      title: "Company Website",
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.sectionTitle}>Settings</Text>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Account</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              haptics.buttonPress();
              navigation.navigate("Profile");
            }}
          >
            <View style={styles.settingItemContent}>
              <Ionicons
                name="person-outline"
                size={22}
                color={COLORS.lightBlue}
              />
              <Text style={styles.settingItemText}>Profile</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.darkGray}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
            <View style={styles.settingItemContent}>
              <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
              <Text style={[styles.settingItemText, { color: COLORS.error }]}>
                Logout
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Preferences</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingItemContent}>
              <Ionicons
                name="bookmark-outline"
                size={22}
                color={COLORS.lightBlue}
              />
              <Text style={styles.settingItemText}>Auto-Save to History</Text>
            </View>
            <Switch
              value={settings.autoSaveToHistory}
              onValueChange={(value) => {
                haptics.selection();
                updateSetting("autoSaveToHistory", value);
              }}
              trackColor={{ false: COLORS.mediumGray, true: COLORS.lightBlue }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingItemContent}>
              <Ionicons
                name="calculator-outline"
                size={22}
                color={COLORS.lightBlue}
              />
              <Text style={styles.settingItemText}>Show Unit Calculations</Text>
            </View>
            <Switch
              value={settings.showUnitCalculations ?? false}
              onValueChange={(value) => {
                haptics.selection();
                updateSetting("showUnitCalculations", value);
              }}
              trackColor={{ false: COLORS.mediumGray, true: COLORS.lightBlue }}
              thumbColor={COLORS.white}
            />
          </View>

          {/* Quick Tour Toggle */}
          <View style={styles.settingItem}>
            <View style={styles.settingItemContent}>
              <Ionicons
                name="walk-outline"
                size={22}
                color={COLORS.lightBlue}
              />
              <Text style={styles.settingItemText}>
                Show Quick Tour On Startup
              </Text>
            </View>
            <Switch
              value={settings.showQuickTour ?? true}
              onValueChange={(value) => {
                haptics.selection();
                updateSetting("showQuickTour", value);
              }}
              trackColor={{ false: COLORS.mediumGray, true: COLORS.lightBlue }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingItemContent}>
              <Ionicons
                name="notifications-outline"
                size={22}
                color={COLORS.lightBlue}
              />
              <Text style={styles.settingItemText}>Notifications</Text>
            </View>
            <Switch
              value={settings.notifications ?? true}
              onValueChange={(value) => {
                haptics.selection();
                updateSetting("notifications", value);
              }}
              trackColor={{ false: COLORS.mediumGray, true: COLORS.lightBlue }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingItemContent}>
              <Ionicons
                name="phone-portrait-outline"
                size={22}
                color={COLORS.lightBlue}
              />
              <Text style={styles.settingItemText}>Haptic Feedback</Text>
            </View>
            <Switch
              value={settings.hapticFeedback ?? true}
              onValueChange={(value) => {
                // Only provide haptic feedback if it's being turned ON
                if (value) {
                  haptics.selection();
                }
                updateSetting("hapticFeedback", value);
              }}
              trackColor={{ false: COLORS.mediumGray, true: COLORS.lightBlue }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingItemContent}>
              <Ionicons
                name="moon-outline"
                size={22}
                color={COLORS.lightBlue}
              />
              <Text style={styles.settingItemText}>Dark Mode</Text>
            </View>
            <Switch
              value={settings.darkMode ?? false}
              onValueChange={(value) => {
                haptics.selection();
                updateSetting("darkMode", value);
              }}
              trackColor={{ false: COLORS.mediumGray, true: COLORS.lightBlue }}
              thumbColor={COLORS.white}
            />
          </View>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate("CountrySelection")}
          >
            <View style={styles.settingItemContent}>
              <Ionicons
                name="flag-outline"
                size={22}
                color={COLORS.lightBlue}
              />
              <Text style={styles.settingItemText}>Default Country</Text>
            </View>
            <View style={styles.settingValue}>
              <Text
                style={[
                  styles.settingValueText,
                  (!settings.defaultCountry ||
                    settings.defaultCountry === "") &&
                    styles.noneText,
                ]}
              >
                {settings.defaultCountry && settings.defaultCountry !== ""
                  ? getCountryName(settings.defaultCountry)
                  : "None"}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.darkGray}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Data & Storage Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Data & Storage</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingItemContent}>
              <Ionicons
                name="cellular-outline"
                size={22}
                color={COLORS.lightBlue}
              />
              <Text style={styles.settingItemText}>Use Cellular Data</Text>
            </View>
            <Switch
              value={settings.cellularData ?? true}
              onValueChange={(value) => {
                haptics.selection();
                updateSetting("cellularData", value);
              }}
              trackColor={{ false: COLORS.mediumGray, true: COLORS.lightBlue }}
              thumbColor={COLORS.white}
            />
          </View>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleClearCache}
          >
            <View style={styles.settingItemContent}>
              <Ionicons name="trash-outline" size={22} color={COLORS.orange} />
              <Text style={[styles.settingItemText, { color: COLORS.orange }]}>
                Clear Cache
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.darkGray}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleClearAllData}
          >
            <View style={styles.settingItemContent}>
              <Ionicons name="warning-outline" size={22} color={COLORS.error} />
              <Text style={[styles.settingItemText, { color: COLORS.error }]}>
                Clear All Data
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.darkGray}
            />
          </TouchableOpacity>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Legal & Resources</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handlePrivacyPolicy}
          >
            <View style={styles.settingItemContent}>
              <Ionicons
                name="shield-outline"
                size={22}
                color={COLORS.lightBlue}
              />
              <Text style={styles.settingItemText}>Privacy Policy</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.darkGray}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleTermsOfService}
          >
            <View style={styles.settingItemContent}>
              <Ionicons
                name="document-text-outline"
                size={22}
                color={COLORS.lightBlue}
              />
              <Text style={styles.settingItemText}>Terms of Service</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.darkGray}
            />
          </TouchableOpacity>

          {/* Company Website */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleCompanyWebsite}
          >
            <View style={styles.settingItemContent}>
              <Ionicons
                name="globe-outline"
                size={22}
                color={COLORS.lightBlue}
              />
              <Text style={styles.settingItemText}>Company Website</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.darkGray}
            />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Support</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleContactSupport}
          >
            <View style={styles.settingItemContent}>
              <Ionicons
                name="mail-outline"
                size={22}
                color={COLORS.lightBlue}
              />
              <Text style={styles.settingItemText}>Contact Support</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.darkGray}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleRateApp}>
            <View style={styles.settingItemContent}>
              <Ionicons
                name="star-outline"
                size={22}
                color={COLORS.lightBlue}
              />
              <Text style={styles.settingItemText}>Rate App</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.darkGray}
            />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>About</Text>

          <View style={styles.aboutContainer}>
            <Image
              source={require("../../assets/Harmony2x.png")}
              style={styles.aboutLogo}
              resizeMode="contain"
            />
            <Text style={styles.versionText}>Version 1.0.0</Text>
            <Text style={styles.copyrightText}>
              © 2025 HarmonyTi. All rights reserved.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  aboutContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  aboutLogo: {
    height: 120,
    marginBottom: 16,
    width: 360,
  },
  container: {
    backgroundColor: COLORS.white,
    flex: 1,
  },
  copyrightText: {
    color: COLORS.darkGray,
    fontSize: 12,
  },
  headerContainer: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderBottomColor: COLORS.mediumGray,
    borderBottomWidth: 1,
    elevation: 3,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerLogo: {
    height: 80,
    width: 370,
  },
  logoContainer: {
    alignItems: "center",
  },
  noneText: {
    color: COLORS.darkGray,
    fontStyle: "italic",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: COLORS.lightGray,
    borderLeftColor: COLORS.darkBlue,
    borderLeftWidth: 4,
    borderRadius: 12,
    marginBottom: 24,
    marginHorizontal: 16,
    padding: 16,
  },
  sectionHeader: {
    color: COLORS.darkBlue,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.darkBlue,
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 16,
    marginHorizontal: 16,
    marginTop: 24,
  },
  settingItem: {
    alignItems: "center",
    borderBottomColor: COLORS.mediumGray,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  settingItemContent: {
    alignItems: "center",
    flexDirection: "row",
  },
  settingItemText: {
    color: COLORS.darkBlue,
    fontSize: 16,
    marginLeft: 12,
  },
  settingValue: {
    alignItems: "center",
    flexDirection: "row",
  },
  settingValueText: {
    color: COLORS.darkBlue,
    fontSize: 16,
    marginRight: 12,
  },
  versionText: {
    color: COLORS.darkBlue,
    fontSize: 14,
    marginBottom: 8,
  },
});
