import React from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../navigation/contexts/AuthContext';
import { isTablet } from '../platform/deviceUtils';
import { useSettings } from '../hooks/useSettings';
import { useHistory } from '../hooks/useHistory';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCountryName } from '../utils/countries';

// Brand colors
const COLORS = {
  darkBlue: '#0B2953',
  lightBlue: '#4397EC',
  orange: '#E67E23',
  yellow: '#FFD800',
  white: '#FFFFFF',
  lightGray: '#F8F8F8',
  mediumGray: '#E1E1E1',
  darkGray: '#666666',
  black: '#333333',
  error: '#FF3B30',
  success: '#34C759',
};

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { logout } = useAuth();
  const { settings, updateSetting } = useSettings();
  const { clearHistory } = useHistory();
  const insets = useSafeAreaInsets();
  const logoMarginTop = isTablet() ? 32 : insets.top + 8;

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. The app will need to re-download tariff data on next use.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all AsyncStorage except settings and auth
              const keys = await AsyncStorage.getAllKeys();
              const keysToRemove = keys.filter(key =>
                !key.includes('settings') &&
                !key.includes('auth') &&
                !key.includes('history')
              );
              await AsyncStorage.multiRemove(keysToRemove);
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              console.error('Clear cache error:', error);
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleClearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will clear all app data including history, settings, and cached data. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearHistory();
              await AsyncStorage.clear();
              Alert.alert('Success', 'All data cleared successfully');
              // Reset settings to defaults
              await updateSetting('autoSaveToHistory', true);
              await updateSetting('notifications', true);
              await updateSetting('darkMode', false);
              await updateSetting('cellularData', true);
              await updateSetting('showUnitCalculations', false);
              await updateSetting('defaultCountry', 'CN');
              await updateSetting('hapticFeedback', true);
            } catch (error) {
              console.error('Clear all data error:', error);
              Alert.alert('Error', 'Failed to clear all data');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handlePrivacyPolicy = () => {
    navigation.navigate('InAppWebView', {
      url: 'https://www.ratecast.com/privacy-policy',
      title: 'Privacy Policy'
    });
  };

  const handleTermsOfService = () => {
    navigation.navigate('InAppWebView', {
      url: 'https://www.ratecast.com/terms-of-service',
      title: 'Terms of Service'
    });
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@ratecast.com');
  };

  const handleRateApp = () => {
    // TODO: Add app store links when published
    Alert.alert('Rate App', 'Thank you! App store rating will be available when the app is published.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.sectionTitle}>Settings</Text>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Account</Text>

                    <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.settingItemContent}>
              <Ionicons name="person-outline" size={22} color={COLORS.lightBlue} />
              <Text style={styles.settingItemText}>Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.darkGray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
            <View style={styles.settingItemContent}>
              <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
              <Text style={[styles.settingItemText, { color: COLORS.error }]}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Preferences</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingItemContent}>
              <Ionicons name="bookmark-outline" size={22} color={COLORS.lightBlue} />
              <Text style={styles.settingItemText}>Auto-Save to History</Text>
            </View>
            <Switch
              value={settings.autoSaveToHistory}
              onValueChange={(value) => updateSetting('autoSaveToHistory', value)}
              trackColor={{ false: COLORS.mediumGray, true: COLORS.lightBlue }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingItemContent}>
              <Ionicons name="calculator-outline" size={22} color={COLORS.lightBlue} />
              <Text style={styles.settingItemText}>Show Unit Calculations</Text>
            </View>
            <Switch
              value={settings.showUnitCalculations ?? false}
              onValueChange={(value) => updateSetting('showUnitCalculations', value)}
              trackColor={{ false: COLORS.mediumGray, true: COLORS.lightBlue }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingItemContent}>
              <Ionicons name="notifications-outline" size={22} color={COLORS.lightBlue} />
              <Text style={styles.settingItemText}>Notifications</Text>
            </View>
            <Switch
              value={settings.notifications ?? true}
              onValueChange={(value) => updateSetting('notifications', value)}
              trackColor={{ false: COLORS.mediumGray, true: COLORS.lightBlue }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingItemContent}>
              <Ionicons name="phone-portrait-outline" size={22} color={COLORS.lightBlue} />
              <Text style={styles.settingItemText}>Haptic Feedback</Text>
            </View>
            <Switch
              value={settings.hapticFeedback ?? true}
              onValueChange={(value) => updateSetting('hapticFeedback', value)}
              trackColor={{ false: COLORS.mediumGray, true: COLORS.lightBlue }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingItemContent}>
              <Ionicons name="moon-outline" size={22} color={COLORS.lightBlue} />
              <Text style={styles.settingItemText}>Dark Mode</Text>
            </View>
            <Switch
              value={settings.darkMode ?? false}
              onValueChange={(value) => updateSetting('darkMode', value)}
              trackColor={{ false: COLORS.mediumGray, true: COLORS.lightBlue }}
              thumbColor={COLORS.white}
            />
          </View>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate('CountrySelection')}
          >
            <View style={styles.settingItemContent}>
              <Ionicons name="flag-outline" size={22} color={COLORS.lightBlue} />
              <Text style={styles.settingItemText}>Default Country</Text>
            </View>
            <View style={styles.settingValue}>
              <Text style={styles.settingValueText}>
                {getCountryName(settings.defaultCountry || 'CN')}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.darkGray} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Data & Storage Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Data & Storage</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingItemContent}>
              <Ionicons name="cellular-outline" size={22} color={COLORS.lightBlue} />
              <Text style={styles.settingItemText}>Use Cellular Data</Text>
            </View>
            <Switch
              value={settings.cellularData ?? true}
              onValueChange={(value) => updateSetting('cellularData', value)}
              trackColor={{ false: COLORS.mediumGray, true: COLORS.lightBlue }}
              thumbColor={COLORS.white}
            />
          </View>

          <TouchableOpacity style={styles.settingItem} onPress={handleClearCache}>
            <View style={styles.settingItemContent}>
              <Ionicons name="trash-outline" size={22} color={COLORS.orange} />
              <Text style={[styles.settingItemText, { color: COLORS.orange }]}>Clear Cache</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.darkGray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleClearAllData}>
            <View style={styles.settingItemContent}>
              <Ionicons name="warning-outline" size={22} color={COLORS.error} />
              <Text style={[styles.settingItemText, { color: COLORS.error }]}>Clear All Data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.darkGray} />
          </TouchableOpacity>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Legal</Text>

          <TouchableOpacity style={styles.settingItem} onPress={handlePrivacyPolicy}>
            <View style={styles.settingItemContent}>
              <Ionicons name="shield-outline" size={22} color={COLORS.lightBlue} />
              <Text style={styles.settingItemText}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.darkGray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleTermsOfService}>
            <View style={styles.settingItemContent}>
              <Ionicons name="document-text-outline" size={22} color={COLORS.lightBlue} />
              <Text style={styles.settingItemText}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.darkGray} />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Support</Text>

          <TouchableOpacity style={styles.settingItem} onPress={handleContactSupport}>
            <View style={styles.settingItemContent}>
              <Ionicons name="mail-outline" size={22} color={COLORS.lightBlue} />
              <Text style={styles.settingItemText}>Contact Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.darkGray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleRateApp}>
            <View style={styles.settingItemContent}>
              <Ionicons name="star-outline" size={22} color={COLORS.lightBlue} />
              <Text style={styles.settingItemText}>Rate App</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.darkGray} />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>About</Text>

          <View style={styles.aboutContainer}>
            <Image
              source={require('../../assets/Harmony2x.png')}
              style={styles.aboutLogo}
              resizeMode="contain"
            />
            <Text style={styles.versionText}>Version 1.0.0</Text>
            <Text style={styles.copyrightText}>© 2025 HarmonyTi. All rights reserved.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  headerContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.mediumGray,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoContainer: {
    alignItems: 'center',
  },
  headerLogo: {
    width: 370,
    height: 80,
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.darkBlue,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  section: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.darkBlue,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkBlue,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.mediumGray,
  },
  settingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingItemText: {
    fontSize: 16,
    color: COLORS.darkBlue,
    marginLeft: 12,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValueText: {
    fontSize: 16,
    color: COLORS.darkBlue,
    marginRight: 12,
  },
  aboutContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  aboutLogo: {
    width: 360,
    height: 120,
    marginBottom: 16,
  },
  versionText: {
    fontSize: 14,
    color: COLORS.darkBlue,
    marginBottom: 8,
  },
  copyrightText: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
});
