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
    title: "🎯 Why We Only Ask for 8 Digits of the HTS Code",
    body: `✅ 6 digits = global HS code
• The first 6 digits belong to the Harmonized System (HS)—an international standard managed by the World Customs Organization (WCO) and used by over 200 countries.

📄 +2 digits = U.S. rate line
• The 7th & 8th digits (also called the "rate line") are U.S.-specific and determine the applicable duty rate.

🚫 Digits 9–10 = statistical/optional detail
• The last two digits add a statistical suffix used for internal reporting—not required for duty calculation.

⸻

📊 Summary: 8 Digits = What You Need
• The 8-digit level corresponds to duty-determining subheadings.
• Additional 9–10 digits are optional and intended for data/statistical purposes.
• Entering more than 8 digits is redundant for calculating duty or fulfilling primary classification needs.`,
  },
  declared: {
    title: '💵 Declared Value — What & Why',
    body: `✅ What Is It?
• The Declared Value is the price you (the importer) paid for the goods
• It should reflect the true transaction value — the amount on your commercial invoice

⸻

�� What's Included?
• 🔹 Product cost (before duty or freight)
• 🔹 Commissions or selling fees (if not excluded)
• 🔹 Royalties or license fees (if applicable)
• 🔹 Value of any "assists" (e.g. free tooling or molds provided by the buyer)

⸻

❌ What's Not Included?
• 🚫 International freight (if separately itemized)
• 🚫 Insurance (if separately stated)
• 🚫 U.S. duties or brokerage fees

⸻

📊 Why We Ask for It
• It's the basis for duty calculations under CBP rules (Transaction Value Method)
• Our system uses it to:
• 📈 Calculate estimated duties and taxes
• 📊 Run profitability and landed cost projections
• 🧾 Assist in compliance reviews or pre-classification

⸻

🛠️ Pro Tip

Be consistent with your commercial invoice. CBP can reject values that appear artificially low.`,
  },
  freight: {
    title: "📦 What's Included in the Dutiable Value?",
    body: `The dutiable value is based on the price paid for the goods plus certain freight-related costs.

✅ Included (Dutiable)
• 🚚 Freight within the export country (e.g., factory to port)
• ⛴️ Ocean freight if bundled in the price (CIF, DDP with no breakdown)
• 🏗️ Handling/loading fees before export

⸻

❌ Excluded (Non-Dutiable)
• 🌊 Ocean freight if itemized separately
• 🛡️ Insurance (if clearly stated)
• 🇺🇸 U.S. domestic freight (port to warehouse)
• 🧾 U.S. duties, brokerage, harbor fees

⸻

⚠️ Pro Tip

If the invoice doesn't separate freight and insurance, CBP may include it all in the dutiable value. Be clear with terms like FOB or CIF.`,
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