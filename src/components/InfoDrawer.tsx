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
    title: "🚚 Freight Cost – What's Dutiable & Why It Matters",
    body: `⸻
  
  ✅ When Freight Is Included in the Price
  
  These freight charges become part of your dutiable value:
  • 🚛 Freight within the export country (e.g. factory to port)
  • ⛴️ International freight if bundled in the product price
  • 🏗️ Loading and handling fees before export
  
  ⸻
  
  ❌ When Freight Is Separately Listed
  
  These costs are not dutiable if they appear clearly on your invoice:
  • 🌊 International freight (listed separately)
  • 🛡️ Insurance (if itemized)
  • 🇺🇸 Domestic freight in the U.S.
  • 🧾 Duties, brokerage, and port fees
  
  ⸻
  
  📊 Why We Ask for Freight
  
  By entering your freight cost, you can:
  • Estimate your landed cost with more precision
  • Understand your true cost per unit
  • Make smarter pricing and purchasing decisions
  
  It helps you stay in control—especially when evaluating quotes or planning margins.
  
  ⸻
  
  💡 Pro Tip
  
  If your invoice doesn't break out freight, Customs may count it as dutiable. Use clear terms like FOB or CIF to avoid unnecessary duties.`,
  },  
  units: {
    title: '📦 Units – Optional, but Powerful',
    body: `🧾 Why We Ask for It
• The number of units in the shipment helps us tie your declared value and freight costs to a per-unit basis
• This gives you clear, actionable insight into:
• 💰 Cost per unit
• 📈 Estimated margin per unit
• 🧮 Better quotes and pricing strategies

⸻

🧩 What It Enables
• 🔍 Estimate landed cost per unit
• 🧠 Evaluate customer margin targets
• 📊 Improve forecasting by aligning profit with volume

⸻

📝 Totally Optional
• You can leave it blank — your freight and duty estimates will still work
• But adding unit count unlocks better business visibility, especially for:
• Product managers
• Sales teams
• Margin-sensitive clients

⸻

💡 Pro Tip

Entering units helps tie costs to each item—especially useful when you’re shipping similar products again.`,
  },
};

const InfoDrawer: React.FC<InfoDrawerProps> = ({ isOpen, onClose, field }) => {
  if (!field) return null;
  const content = FIELD_CONTENT[field];
  const insets = useSafeAreaInsets();
  const containerStyles = [
    styles.container,
    {
      paddingTop: insets.top + getSpacing('lg'),
    },
  ];

  return (
    <AnimatedDrawer isVisible={isOpen} onClose={onClose} position="left">
      <LinearGradient
        colors={[BRAND_COLORS.electricBlue, BRAND_COLORS.darkNavy]}
        style={containerStyles}
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: getSpacing('lg'),
  },
  title: {
    fontSize: getResponsiveValue(20, 26),
    fontWeight: 'bold',
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

export default InfoDrawer;