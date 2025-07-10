/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-require-imports, react-native/no-unused-styles, react-native/no-color-literals */
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Linking,
} from "react-native";
import { Text } from "../components/Text";
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
import { getCountryName, COUNTRIES, Country } from "../utils/countries";
import {
  BRAND_COLORS as COLORS,
  BRAND_TYPOGRAPHY,
} from "../config/brandColors";
import { haptics } from "../utils/haptics";
import { AnimatedDrawer } from "../components/shared/AnimatedDrawer";
import ProfileScreen from "./ProfileScreen";

interface SettingsScreenProps {
  onNavigate?: () => void;
}

export default function SettingsScreen({
  onNavigate,
}: SettingsScreenProps = {}) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { logout } = useAuth();
  const { settings, updateSetting } = useSettings();
  const { clearHistory } = useHistory();
  const insets = useSafeAreaInsets();
  const logoMarginTop = isTablet() ? 32 : insets.top + 8;
  const [profileDrawerVisible, setProfileDrawerVisible] = useState(false);
  const [countryDropdownVisible, setCountryDropdownVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const countryDropdownRef = useRef<View>(null);

  // List of countries for the dropdown
  const countries: Country[] = [{ code: "", name: "None" }, ...COUNTRIES];

  const handleCountryDropdownToggle = () => {
    setCountryDropdownVisible(!countryDropdownVisible);

    // Scroll to the dropdown when opening
    if (!countryDropdownVisible && countryDropdownRef.current) {
      setTimeout(() => {
        countryDropdownRef.current?.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
          },
          () => {},
        );
      }, 100);
    }
  };

  const handleCountrySelect = async (countryCode: string) => {
    haptics.selection();
    setCountryDropdownVisible(false);
    await updateSetting("defaultCountry", countryCode);
  };

  const handleClearDefaultCountry = async () => {
    haptics.selection();
    await updateSetting("defaultCountry", "");
    setCountryDropdownVisible(false);
  };

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
              // Navigation will be handled by AuthContext/App level
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
              await updateSetting("showUnitCalculations", true);
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
    onNavigate?.();
    setTimeout(() => {
      navigation.navigate("InAppWebView", {
        url: "https://www.ratecast.com/privacy-policy",
        title: "Privacy Policy",
      });
    }, 100);
  };

  const handleTermsOfService = () => {
    onNavigate?.();
    setTimeout(() => {
      navigation.navigate("InAppWebView", {
        url: "https://www.ratecast.com/terms-of-service",
        title: "Terms of Service",
      });
    }, 100);
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
    onNavigate?.();
    setTimeout(() => {
      navigation.navigate("InAppWebView", {
        url: "https://dedola.com",
        title: "Company Website",
      });
    }, 100);
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView ref={scrollViewRef} style={styles.scrollView}>
        <Text style={styles.sectionTitle}>Settings</Text>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Account</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              haptics.buttonPress();
              setProfileDrawerVisible(true);
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

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleCountryDropdownToggle}
            ref={countryDropdownRef}
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
              {settings.defaultCountry && settings.defaultCountry !== "" && (
                <TouchableOpacity
                  onPress={handleClearDefaultCountry}
                  style={styles.clearButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={COLORS.darkGray}
                  />
                </TouchableOpacity>
              )}
              <Ionicons
                name={countryDropdownVisible ? "chevron-up" : "chevron-down"}
                size={20}
                color={COLORS.darkGray}
              />
            </View>
          </TouchableOpacity>

          {/* Country Dropdown */}
          {countryDropdownVisible && (
            <View style={styles.countryDropdown}>
              <ScrollView
                style={styles.countryDropdownScroll}
                nestedScrollEnabled
              >
                {countries.map((country) => {
                  const isSelected =
                    country.code === ""
                      ? !settings.defaultCountry ||
                        settings.defaultCountry === ""
                      : settings.defaultCountry === country.code;

                  return (
                    <TouchableOpacity
                      key={country.code}
                      style={[
                        styles.countryDropdownItem,
                        isSelected && styles.countryDropdownItemSelected,
                      ]}
                      onPress={() => handleCountrySelect(country.code)}
                    >
                      <Text
                        style={[
                          styles.countryDropdownItemText,
                          isSelected && styles.countryDropdownItemTextSelected,
                          country.code === "" && styles.noneText,
                        ]}
                      >
                        {country.name}
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color={COLORS.lightBlue}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <View style={styles.settingItem}>
            <View style={styles.settingItemContent}>
              <Ionicons
                name="bookmark-outline"
                size={22}
                color={COLORS.lightBlue}
              />
              <Text style={styles.settingItemText}>Auto-Save to History</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                haptics.selection();
                updateSetting("autoSaveToHistory", !settings.autoSaveToHistory);
              }}
              style={{ paddingLeft: 8 }}
            >
              <Ionicons
                name={
                  settings.autoSaveToHistory ? "checkbox" : "square-outline"
                }
                size={24}
                color={COLORS.darkBlue}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingItemContent}>
              <Ionicons
                name="calculator-outline"
                size={22}
                color={COLORS.lightBlue}
              />
              <Text style={styles.settingItemText}>Show Unit Calcs </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                haptics.selection();
                updateSetting(
                  "showUnitCalculations",
                  !(settings.showUnitCalculations ?? true),
                );
              }}
              style={{ paddingLeft: 8 }}
            >
              <Ionicons
                name={
                  (settings.showUnitCalculations ?? true)
                    ? "checkbox"
                    : "square-outline"
                }
                size={24}
                color={COLORS.darkBlue}
              />
            </TouchableOpacity>
          </View>

          {/* Quick Tour Toggle */}
          <View style={styles.settingItem}>
            <View style={styles.settingItemContent}>
              <Ionicons
                name="walk-outline"
                size={22}
                color={COLORS.lightBlue}
              />
              <Text style={styles.settingItemText}>Show Quick Tour</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                haptics.selection();
                updateSetting(
                  "showQuickTour",
                  !(settings.showQuickTour ?? true),
                );
              }}
              style={{ paddingLeft: 8 }}
            >
              <Ionicons
                name={
                  (settings.showQuickTour ?? true)
                    ? "checkbox"
                    : "square-outline"
                }
                size={24}
                color={COLORS.darkBlue}
              />
            </TouchableOpacity>
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
            <TouchableOpacity
              onPress={() => {
                haptics.selection();
                updateSetting(
                  "notifications",
                  !(settings.notifications ?? true),
                );
              }}
              style={{ paddingLeft: 8 }}
            >
              <Ionicons
                name={
                  (settings.notifications ?? true)
                    ? "checkbox"
                    : "square-outline"
                }
                size={24}
                color={COLORS.darkBlue}
              />
            </TouchableOpacity>
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
            <TouchableOpacity
              onPress={() => {
                // Only provide haptic feedback if it's being turned ON
                const newValue = !(settings.hapticFeedback ?? true);
                if (newValue) {
                  haptics.selection();
                }
                updateSetting("hapticFeedback", newValue);
              }}
              style={{ paddingLeft: 8 }}
            >
              <Ionicons
                name={
                  (settings.hapticFeedback ?? true)
                    ? "checkbox"
                    : "square-outline"
                }
                size={24}
                color={COLORS.darkBlue}
              />
            </TouchableOpacity>
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
            <TouchableOpacity
              onPress={() => {
                haptics.selection();
                updateSetting("darkMode", !(settings.darkMode ?? false));
              }}
              style={{ paddingLeft: 8 }}
            >
              <Ionicons
                name={
                  (settings.darkMode ?? false) ? "checkbox" : "square-outline"
                }
                size={24}
                color={COLORS.darkBlue}
              />
            </TouchableOpacity>
          </View>
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
            <TouchableOpacity
              onPress={() => {
                haptics.selection();
                updateSetting("cellularData", !(settings.cellularData ?? true));
              }}
              style={{ paddingLeft: 8 }}
            >
              <Ionicons
                name={
                  (settings.cellularData ?? true)
                    ? "checkbox"
                    : "square-outline"
                }
                size={24}
                color={COLORS.darkBlue}
              />
            </TouchableOpacity>
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

      {/* Profile Drawer */}
      <AnimatedDrawer
        isVisible={profileDrawerVisible}
        onClose={() => setProfileDrawerVisible(false)}
        position="left"
      >
        <ProfileScreen
          onNavigate={() => {
            setProfileDrawerVisible(false);
          }}
        />
      </AnimatedDrawer>
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
  clearButton: {
    marginRight: 8,
  },
  container: {
    backgroundColor: COLORS.white,
    flex: 1,
  },
  copyrightText: {
    color: COLORS.darkGray,
    fontSize: 12,
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
  },
  countryDropdown: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.mediumGray,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    marginTop: 8,
    overflow: "hidden",
  },
  countryDropdownItem: {
    alignItems: "center",
    borderBottomColor: COLORS.lightGray,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  countryDropdownItemSelected: {
    backgroundColor: COLORS.lightGray,
  },
  countryDropdownItemText: {
    color: COLORS.darkBlue,
    fontSize: 16,
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
  },
  countryDropdownItemTextSelected: {
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: COLORS.lightBlue,
  },
  countryDropdownScroll: {
    maxHeight: 200,
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
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.darkBlue,
    fontSize: 28,
    ...BRAND_TYPOGRAPHY.getFontStyle("bold"),
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
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
  },
  settingValue: {
    alignItems: "center",
    flexDirection: "row",
  },
  settingValueText: {
    color: COLORS.darkBlue,
    fontSize: 16,
    marginRight: 12,
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
  },
  versionText: {
    color: COLORS.darkBlue,
    fontSize: 14,
    marginBottom: 8,
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
  },
});
