import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { AnimatedDrawer } from './shared/AnimatedDrawer';
import { BRAND_COLORS, getResponsiveValue, getSpacing, getBorderRadius, isTablet } from '../config/brandColors';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export type InfoFieldKey = 'code' | 'declared' | 'freight' | 'units' | null;

interface InfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  field: InfoFieldKey;
}

const FIELD_CONTENT: Record<Exclude<InfoFieldKey, null>, { title: string; body: string }> = {
  code: {
    title: 'HTS Code',
    body:
      'Enter the 6-10 digit Harmonized Tariff Schedule (HTS) code for the product you are importing. The first 6 digits are international; the remaining digits are U.S. specific.',
  },
  declared: {
    title: 'Declared Value',
    body:
      'The commercial invoice value of the goods (Cost of Goods Sold). Provide the amount in USD. This is used to calculate ad-valorem duties and fees.',
  },
  freight: {
    title: 'Freight Cost',
    body:
      'Optional. Include international freight costs if you want the MPF (Merchandise Processing Fee) and other value-based fees calculated on CIF (Cost, Insurance & Freight).',
  },
  units: {
    title: 'Unit Count',
    body:
      'Optional. Enter the number of individual units in the shipment to see duties and fees expressed on a per-unit basis.',
  },
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function InfoDrawer({ isOpen, onClose, field }: InfoDrawerProps) {
  if (!field) return null;
  const content = FIELD_CONTENT[field];
  const insets = useSafeAreaInsets();
  return (
    <AnimatedDrawer isVisible={isOpen} onClose={onClose} position="left">
      <LinearGradient
        colors={[BRAND_COLORS.electricBlue, BRAND_COLORS.darkNavy]}
        style={[
          styles.container,
          {
            paddingTop: insets.top + getSpacing('lg'),
            height: SCREEN_HEIGHT * 0.8,
            borderTopRightRadius: getBorderRadius('lg'),
            borderBottomRightRadius: getBorderRadius('lg'),
          },
        ]}
      >
        <TouchableOpacity style={styles.pullTab} onPress={onClose} activeOpacity={0.8}>
          <Ionicons name="information-circle-outline" size={22} color={BRAND_COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>{content.title}</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.body}>{content.body}</Text>
        </ScrollView>
      </LinearGradient>
    </AnimatedDrawer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: getSpacing('lg'),
  },
  title: {
    fontSize: getResponsiveValue(20, 26),
    fontWeight: '700',
    color: BRAND_COLORS.white,
    marginBottom: getSpacing('md'),
  },
  body: {
    fontSize: getResponsiveValue(14, 18),
    lineHeight: getResponsiveValue(20, 24),
    color: BRAND_COLORS.white,
  },
  pullTab: {
    position: 'absolute',
    right: isTablet() ? -56 : -40,
    top: 60,
    width: isTablet() ? 56 : 40,
    height: isTablet() ? 112 : 80,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 