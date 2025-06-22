import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { isTablet } from '../platform/deviceUtils';

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
  icon?: keyof typeof Ionicons.glyphMap;
}

const LINKS: LinkItem[] = [
  {
    label: 'Company Website',
    url: 'https://dedola.com',
    icon: 'globe-outline',
  },
  {
    label: 'Privacy Policy',
    url: 'https://dedola.com/privacy',
    icon: 'shield-checkmark-outline',
  },
  {
    label: 'Terms of Service',
    url: 'https://dedola.com/terms',
    icon: 'document-text-outline',
  },
  {
    label: 'Support',
    url: 'mailto:support@dedola.com',
    icon: 'help-circle-outline',
  },
];

export default function LinksScreen() {
  const insets = useSafeAreaInsets();

  const handlePress = useCallback(async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (err) {
      // Fail silently – keeping UX clean. In a future iteration we might show
      // a toast or Alert to signal the error.
      console.warn(`Unable to open URL: ${url}`, err);
    }
  }, []);

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
            onPress={() => handlePress(url)}
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
              name={Platform.OS === 'ios' ? 'chevron-forward' : 'arrow-forward'}
              size={20}
              color={COLORS.darkGray}
              style={styles.chevron}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styling
// ---------------------------------------------------------------------------

const COLORS = {
  darkNavy: '#0B2953',
  electricBlue: '#217DB2',
  lightGray: '#F4F4F4',
  darkGray: '#666666',
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    paddingTop: 16,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: isTablet() ? 20 : 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  icon: {
    marginRight: 16,
  },
  linkLabel: {
    flex: 1,
    fontSize: isTablet() ? 18 : 16,
    color: COLORS.darkNavy,
    fontWeight: '500',
  },
  chevron: {
    marginLeft: 8,
  },
});