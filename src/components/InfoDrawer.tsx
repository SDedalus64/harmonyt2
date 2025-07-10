import React, { type FC } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { AnimatedDrawer } from "./shared/AnimatedDrawer";
import {
  BRAND_COLORS,
  BRAND_TYPOGRAPHY,
  getResponsiveValue,
  getSpacing,
  isTablet,
} from "../config/brandColors";

export type InfoFieldKey = "code" | "declared" | "freight" | "units" | null;

interface InfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  field: InfoFieldKey;
}

interface FieldCopy {
  title: string;
  body: string;
}

const FIELD_CONTENT: Record<Exclude<InfoFieldKey, null>, FieldCopy> = {
  code: {
    title: "🎯 Why We Only Ask for 8 Digits of the HTS Code",
    body: `✅ 6 digits = global HS code

    ⸻

• 🔹 The first 6 digits belong to the Harmonized System (HS)—an international standard managed by the World Customs Organization (WCO) and used by over 200 countries.

📄 +2 digits = U.S. rate line
• 🔹 The 7th & 8th digits (also called the "rate line") are U.S.-specific and determine the applicable duty rate.

🚫 Digits 9–10 = statistical/optional detail
• 🔹 The last two digits add a statistical suffix used for internal reporting—not required for duty calculation.

⸻

📊 Summary: 8 Digits = What You Need
• 🔹 The 8-digit level corresponds to duty-determining subheadings.
• 🔹 Additional 9–10 digits are optional and intended for data/statistical purposes.


🛠️ Pro Tip: Enter the first 3 digits to activate smart code search.`,
  },
  declared: {
    title: "📦 Declared Value: What to Include vs. What May Be Excluded¹",
    body: `⸻

✅ Include in Declared Value

• 💵 Price Paid for Goods – Total paid to seller
• 📦 Packing Costs – Boxes, crates, materials
• 💼 Selling Commissions – Paid to seller's agent
• 🔧 Assists – Tools, designs, parts you supplied
• 📄 Royalties – If required to buy the goods³
• 💰 Resale Proceeds to Seller – If seller gets a cut
• 🚛 Foreign Inland Freight – Factory to export port⁴

⸻

❌ May Be Excluded (see footnotes**)

• 🇺🇸 U.S. Duties & Taxes (always)
• 🚢 International Freight⁵
• 👤 Buying Commissions – Paid to your agent only²
• 🔧 Post-Import Services⁶
• 🛡️ Marine Insurance⁵
• 🚚 U.S. Inland Freight⁵

⸻

🔎 Footnotes

• 1️⃣ Exclusions must be clearly listed and backed by documentation
• 2️⃣ Buying commissions are only excludable if the agent works solely for the buyer
• 3️⃣ Royalties are only dutiable if required as a condition of sale of good
• 4️⃣ Foreign inland freight is usually dutiable unless the seller pays and it's clearly not part of the sale price
• 5️⃣ International freight, insurance, and U.S. inland freight are excludable only if itemized separately and verifiable
• 6️⃣ Post-importation work (e.g., setup, maintenance) is not dutiable if cost incurred by buyer`,
  },
  freight: {
    title: "🚚 Import Costs – Not Included in Declared Value",
    body: `⸻

✅ Additional Landed Costs Paid by You. Such as:
• ⛴️ International Freight
• 🚛 Freight Drayage (port to warehouse) 
• 🏗️ Warehousing (at discharge and destination)
• 🚛 U.S. Inland Freight
• 🚛 Distribution
• 💰 Other costs
⸻
📊 Why Enter Cost Estimates? HarmonyTi 
• 💰 Adds to declared value to calculate estimated landed cost
• 📈 Divides est. landed cost by unit count for per-unit landed cost
⸻

💡 Pro Tip: If your commercial invoice doesn't itemize freight and other supplier-paid costs, Customs will include them in the dutiable value. A small adjustment to your invoice can help you avoid overpaying on duties.`,
  },
  units: {
    title: "📦 Units – Optional, but Useful",
    body: `✅ What It Is

    ⸻

    • 📦 Per Units Duties, Special Tariffs, and Landed cost estimates.
• 📦 Projections for pricing and margin analysis.

⸻

📝 Totally Optional
• 📦 You can leave it blank — your duty estimates and landed cost estimates will still work
• 📦 You can turn it off in settings if you don't want to use it at all
• ✅ Use if you want better business visibility for:
📦 Product managers
💰 Sales teams 
👤 Margin-sensitive clients
📈 CFOs

⸻

💡 Pro Tip: Entering units helps tie costs to each item—especially useful when you're shipping similar products again.`,
  },
};

const InfoDrawer: FC<InfoDrawerProps> = (props: InfoDrawerProps) => {
  const { isOpen, onClose, field } = props;
  if (!field) return null;
  const content = FIELD_CONTENT[field as Exclude<InfoFieldKey, null>];
  const insets = useSafeAreaInsets();

  // Drawer width: phones use 90% of screen; tablets take 60% up to 600px
  const { width: SCREEN_WIDTH } = Dimensions.get("window");
  const drawerWidth = isTablet()
    ? Math.min(SCREEN_WIDTH * 0.6, 600)
    : "90%";

  const containerStyles = [
    styles.container,
    { paddingTop: insets.top + getSpacing("lg") },
  ];

  const renderBody = (bodyString: string): React.ReactElement[] => {
    return bodyString.split("\n").map((raw: string, idx: number) => {
      const trimmed = raw.trim();
      if (!trimmed) return <View key={idx} style={{ height: 4 }} />;
      if (trimmed === "⸻") return <View key={idx} style={styles.separator} />;

      const normalized = trimmed.startsWith("•")
        ? trimmed.slice(1).trim()
        : trimmed;
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
    <AnimatedDrawer
      isVisible={isOpen}
      onClose={onClose}
      position="left"
      customDrawerConfig={{ width: drawerWidth }}
    >
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
  bodyText: {
    color: BRAND_COLORS.white,
    fontSize: getResponsiveValue(14, 18),
    lineHeight: getResponsiveValue(18, 22),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
  },
  bulletIcon: {
    color: BRAND_COLORS.white,
    fontSize: getResponsiveValue(14, 18),
    width: 26,
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
  },
  bulletRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    marginBottom: 4,
  },
  bulletText: {
    color: BRAND_COLORS.white,
    flex: 1,
    fontSize: getResponsiveValue(14, 18),
    lineHeight: getResponsiveValue(18, 22),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
  },
  container: {
    flex: 1,
    padding: getSpacing("lg"),
  },
  gradientContainer: {
    flex: 1,
    minHeight: "100%",
  },
  pullTab: {
    alignItems: "center",
    borderBottomRightRadius: 20,
    borderTopRightRadius: 20,
    height: isTablet() ? 112 : 80,
    justifyContent: "center",
    position: "absolute",
    right: isTablet() ? -56 : -40,
    top: 60,
    width: isTablet() ? 56 : 40,
  },
  scrollContent: {
    flexGrow: 1,
  },
  separator: {
    backgroundColor: "rgba(255,255,255,0.3)",
    height: 1,
    marginVertical: getSpacing("sm"),
  },
  title: {
    color: BRAND_COLORS.white,
    fontSize: getResponsiveValue(20, 26),
    ...BRAND_TYPOGRAPHY.getFontStyle("bold"),
    marginBottom: getSpacing("sm"),
  },
});

export default InfoDrawer;
