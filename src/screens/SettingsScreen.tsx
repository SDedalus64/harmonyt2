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
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../navigation/contexts/AuthContext';
import { isTablet } from '../platform/deviceUtils';

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
};

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(false);
  const [cellularDataEnabled, setCellularDataEnabled] = React.useState(true);
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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={[styles.headerContainer, { paddingTop: 0 }]}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo185.png')}
            style={[styles.headerLogo, { marginTop: logoMarginTop }]}
            resizeMode="contain"
          />
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <Text style={styles.sectionTitle}>Settings</Text>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Account</Text>

          <TouchableOpacity style={styles.settingItem}>
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
              <Ionicons name="notifications-outline" size={22} color={COLORS.lightBlue} />
              <Text style={styles.settingItemText}>Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
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
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: COLORS.mediumGray, true: COLORS.lightBlue }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingItemContent}>
              <Ionicons name="cellular-outline" size={22} color={COLORS.lightBlue} />
              <Text style={styles.settingItemText}>Cellular Data</Text>
            </View>
            <Switch
              value={cellularDataEnabled}
              onValueChange={setCellularDataEnabled}
              trackColor={{ false: COLORS.mediumGray, true: COLORS.lightBlue }}
              thumbColor={COLORS.white}
            />
          </View>
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
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>About</Text>

          <View style={styles.aboutContainer}>
            <Image
              source={require('../../assets/logo470.png')}
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
    width: 185,
    height: 40,
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
  aboutContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  aboutLogo: {
    width: 180,
    height: 60,
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
