import React from 'react';
import { Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LinkItem {
  label: string;
  url: string;
}

const LINKS: LinkItem[] = [
  { label: 'Dedola Global Logistics', url: 'https://www.dedola.com' },
  { label: 'U.S. HTS – Harmonized Tariff Schedule', url: 'https://hts.usitc.gov/' },
  { label: 'CBP – Customs & Border Protection', url: 'https://www.cbp.gov/' },
  { label: 'World Customs Organization', url: 'https://www.wcoomd.org/' },
];

const LinksScreen: React.FC = () => {
  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.warn(`Unable to open URL: ${url}`, error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {LINKS.map((link) => (
        <TouchableOpacity
          key={link.url}
          onPress={() => openLink(link.url)}
          style={styles.linkItem}
        >
          <Ionicons name="link-outline" size={20} color={COLORS.electricBlue} />
          <Text style={styles.linkText}>{link.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const COLORS = {
  electricBlue: '#4397EC',
  darkNavy: '#0B2953',
  lightGray: '#F8F8F8',
  mediumGray: '#E1E1E1',
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: COLORS.lightGray,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.mediumGray,
  },
  linkText: {
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.darkNavy,
    flexShrink: 1,
  },
});

export default LinksScreen;