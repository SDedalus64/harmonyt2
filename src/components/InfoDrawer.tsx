import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AnimatedDrawer } from './shared/AnimatedDrawer';
import {
  BRAND_COLORS,
  getResponsiveValue,
  getSpacing,
  isTablet,
} from '../config/brandColors';

export type InfoFieldKey = 'code' | 'declared' | 'freight' | 'units' | null;

interface InfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  field: InfoFieldKey;
}

const FIELD_CONTENT: Record<Exclude<InfoFieldKey, null>, { title: string; body: string }> = {
  code: {
    title: '🎯 Why We Only Ask for 8 Digits of the HTS Code',
    body: `✅ 6 digits = global HS code
• 🔹 The first 6 digits belong to the Harmonized System (HS)—an international standard managed by the World Customs Organization (WCO) and used by over 200 countries.

📄 +2 digits = U.S. rate line
• 🔹 The 7th & 8th digits (also called the "rate line") are U.S.-specific and determine the applicable duty rate.

🚫 Digits 9–10 = statistical/optional detail
• 🔹 The last two digits add a statistical suffix used for internal reporting—not required for duty calculation.

⸻

📊 Summary: 8 Digits = What You Need
• 🔹 The 8-digit level corresponds to duty-determining subheadings.
• 🔹 Additional 9–10 digits are optional and intended for data/statistical purposes.


🛠️ Pro Tip: Start with the first 3 digits and you'll be good to go.`,
  },
  declared: {
    title: '💵 Declared Value — What & Why',
    body: `✅ What Is It?
• 💵 The Declared Value is the price you (the importer) paid for the goods
• 💵 It should reflect the true transaction value — the amount on your commercial invoice

⸻

📦 What's Included?
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
• 🔹 It's the basis for duty calculations under CBP rules (Transaction Value Method)
• 🔹 Our system uses it to:
• 📈 Calculate estimated duties and taxes
• 📊 Run profitability and landed cost projections
• 🧾 Assist in compliance reviews or pre-classification

⸻

🛠️ Pro Tip: 
• 🔹 Be consistent with your commercial invoice. CBP can reject values that appear artificially low.`,
  },
  freight: {
    title: "🚚 Freight Cost – What's Dutiable & Why It Matters",
    body: `⸻

✅ When Freight Is Included in the Price
• 🚛 Freight within the export country (e.g. factory to port)
• ⛴️ International freight if bundled in the product price
• 🏗️ Loading and handling fees before export

⸻

❌ When Freight Is Separately Listed
• 🌊 International freight (listed separately)
• 🛡️ Insurance (if itemized)
• 🇺🇸 Domestic freight in the U.S.
• 🧾 Duties, brokerage, and port fees

⸻

📊 Why We Ask for Freight
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
Entering units helps tie costs to each item—especially useful when you're shipping similar products again.`,
  },
};

const InfoDrawer: React.FC<InfoDrawerProps> = ({ isOpen, onClose, field }) => {
  if (!field) return null;
  const content = FIELD_CONTENT[field];
  const insets = useSafeAreaInsets();

  const containerStyles = [
    styles.container,
    { paddingTop: insets.top + getSpacing('lg') },
  ];

  const renderBody = (bodyString: string) => {
    return bodyString.split('\n').map((raw, idx) => {
      const trimmed = raw.trim();
      if (!trimmed) return <View key={idx} style={{ height: 4 }} />;
      if (trimmed === '⸻') return <View key={idx} style={styles.separator} />;

      const normalized = trimmed.startsWith('•') ? trimmed.slice(1).trim() : trimmed;
      const match = normalized.match(/^([^\s]+)\s+(.*)$/);

      if (match) {
        const icon = match[1];
        const text = match[2];
        return (
          <View key={idx} style={styles.bulletRow}>
            <Text style={styles.bulletIcon}>{icon}</Text>
            <Text style={styles.bulletText}>{text}</Text>
          </View>
        );
      }

      return (
        <Text key={idx} style={[styles.bodyText, { marginBottom: 4 }]}>
          {trimmed}
        </Text>
      );
    });
  };

  return (
    <AnimatedDrawer isVisible={isOpen} onClose={onClose} position="left">
      <View style={styles.gradientContainer}>
        <LinearGradient
          colors={[BRAND_COLORS.electricBlue, BRAND_COLORS.darkNavy]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={containerStyles}>
          <TouchableOpacity
            style={styles.pullTab}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Ionicons
              name="information-circle-outline"
              size={22}
              color={BRAND_COLORS.white}
            />
          </TouchableOpacity>
          <Text style={styles.title}>{content.title}</Text>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {renderBody(content.body)}
          </ScrollView>
        </View>
      </View>
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
    marginBottom: getSpacing('sm'),
  },
  bodyText: {
    fontSize: getResponsiveValue(14, 18),
    lineHeight: getResponsiveValue(18, 22),
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
  gradientContainer: {
    flex: 1,
    minHeight: '100%',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bulletIcon: {
    width: 26,
    fontSize: getResponsiveValue(14, 18),
    color: BRAND_COLORS.white,
  },
  bulletText: {
    flex: 1,
    fontSize: getResponsiveValue(14, 18),
    lineHeight: getResponsiveValue(18, 22),
    color: BRAND_COLORS.white,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: getSpacing('sm'),
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default InfoDrawer;