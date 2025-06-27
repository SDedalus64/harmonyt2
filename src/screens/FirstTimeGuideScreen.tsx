import React, { useState, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  BRAND_COLORS,
  BRAND_SPACING,
  BRAND_TYPOGRAPHY,
  getResponsiveValue,
  getBorderRadius,
  getSpacing,
  BRAND_SHADOWS,
  getTypographySize,
} from "../config/brandColors";
import { LinearGradient } from "expo-linear-gradient";

interface FirstTimeGuideScreenProps {
  visible: boolean;
  onClose: (dontShowAgain: boolean) => void;
}

const GuideStep = ({
  icon,
  title,
  text,
}: {
  icon: any;
  title: string;
  text: string;
}) => (
  <View style={styles.stepContainer}>
    <Ionicons
      name={icon}
      size={getResponsiveValue(28, 32)}
      color={BRAND_COLORS.electricBlue}
      style={styles.stepIcon}
    />
    <View style={styles.stepTextContainer}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  </View>
);

const FirstTimeGuideScreen: React.FC<FirstTimeGuideScreenProps> = ({
  visible,
  onClose,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isCloseToBottom =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - 20;
    setShowScrollIndicator(!isCloseToBottom);
  };

  const handleContentSizeChange = (
    contentWidth: number,
    contentHeight: number,
  ) => {
    // Check if content is scrollable by comparing content height to a reasonable modal height
    const estimatedModalHeight = 600; // Approximate modal content height
    setShowScrollIndicator(contentHeight > estimatedModalHeight);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => onClose(dontShowAgain)}
    >
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={[BRAND_COLORS.darkNavy, BRAND_COLORS.mediumBlue]}
          style={styles.modalContent}
        >
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={true}
            onScroll={handleScroll}
            onContentSizeChange={handleContentSizeChange}
            scrollEventThrottle={16}
          >
            <View style={styles.header}>
              <Ionicons
                name="compass-outline"
                size={getResponsiveValue(36, 48)}
                color={BRAND_COLORS.white}
              />
              <Text style={styles.title}>First Time? Here's a Quick Tour!</Text>
            </View>
            <Text style={styles.introText}>
              Welcome to Harmony Tariff Intelligence! Let's walk through your
              first duty calculation.
            </Text>

            <GuideStep
              icon="keypad-outline"
              title="1. Enter Your Shipment Info"
              text="Start by typing in the HTS code, select a country of origin, and enter the declared value of your goods. We'll suggest HTS codes as you type."
            />

            <GuideStep
              icon="information-circle-outline"
              title="Want to know more about a field? Tap or swipe the Info Tabs"
              text="See the (i) icons next to each field? Tap them any time for a quick explanation of what to enter and why it's needed."
            />

            <GuideStep
              icon="rocket-outline"
              title="2. Calculate Duties"
              text="Once your info is in, tap the big blue 'Calculate' button to see a full breakdown of duties, fees, and landed cost."
            />

            <GuideStep
              icon="menu-outline"
              title="Explore with the FAB Menu"
              text="The floating button in the corner is the FAB (Floating Action Button). Tap it to quickly access your recent searches, calculation history, links, DGL blogs, stats and info, and User Settings."
            />

            <View style={styles.footer}>
              <View style={styles.switchContainer}>
                <Switch
                  trackColor={{
                    false: BRAND_COLORS.mediumGray,
                    true: BRAND_COLORS.electricBlue,
                  }}
                  thumbColor={
                    dontShowAgain ? BRAND_COLORS.white : BRAND_COLORS.lightGray
                  }
                  onValueChange={setDontShowAgain}
                  value={dontShowAgain}
                />
                <Text style={styles.switchLabel}>Don't show this again</Text>
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={() => onClose(dontShowAgain)}
              >
                <Text style={styles.buttonText}>Got It!</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Scroll indicator */}
          {showScrollIndicator && (
            <View style={styles.scrollIndicator}>
              <Ionicons
                name="chevron-down"
                size={20}
                color={BRAND_COLORS.white}
              />
              <Text style={styles.scrollIndicatorText}>Scroll for more</Text>
            </View>
          )}
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: BRAND_COLORS.electricBlue,
    borderRadius: getBorderRadius("md"),
    paddingHorizontal: getSpacing("lg"),
    paddingVertical: getSpacing("sm"),
    ...BRAND_SHADOWS.medium,
  },
  buttonText: {
    color: BRAND_COLORS.white,
    fontSize: getTypographySize("md"),
    fontWeight: BRAND_TYPOGRAPHY.weights.bold,
  },
  footer: {
    alignItems: "center",
    marginTop: getSpacing("lg"),
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: getSpacing("md"),
    paddingHorizontal: getSpacing("sm"),
  },
  introText: {
    color: BRAND_COLORS.lightGray,
    fontSize: getTypographySize("md"),
    marginBottom: getSpacing("xl"),
    textAlign: "center",
  },
  modalContent: {
    width: "90%",
    maxWidth: getResponsiveValue(500, 572), // ~1 inch wider on iPad (72pt ≈ 1 inch)
    maxHeight: "85%",
    borderRadius: getBorderRadius("lg"),
    padding: getSpacing("lg"),
    ...BRAND_SHADOWS.large,
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    flex: 1,
    justifyContent: "center",
    zIndex: 9999,
  },
  scrollIndicator: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: getBorderRadius("sm"),
    bottom: getSpacing("md"),
    paddingHorizontal: getSpacing("sm"),
    paddingVertical: getSpacing("xs"),
    position: "absolute",
  },
  scrollIndicatorText: {
    color: BRAND_COLORS.white,
    fontSize: getTypographySize("xs"),
    marginTop: 2,
  },
  scrollViewContent: {
    paddingBottom: getSpacing("lg"),
  },
  stepContainer: {
    alignItems: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: getBorderRadius("md"),
    flexDirection: "row",
    marginBottom: getSpacing("xl"),
    padding: getSpacing("md"),
  },
  stepIcon: {
    marginRight: getSpacing("md"),
    marginTop: getSpacing("xs"),
  },
  stepText: {
    color: BRAND_COLORS.lightGray,
    fontSize: getTypographySize("md"),
    lineHeight: getTypographySize("md") * 1.5,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    color: BRAND_COLORS.white,
    fontSize: getTypographySize("lg"),
    fontWeight: BRAND_TYPOGRAPHY.weights.bold,
    marginBottom: getSpacing("xs"),
  },
  switchContainer: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: getSpacing("sm"),
  },
  switchLabel: {
    color: BRAND_COLORS.white,
    fontSize: getTypographySize("sm"),
    marginLeft: getSpacing("sm"),
  },
  title: {
    color: BRAND_COLORS.white,
    flex: 1,
    flexShrink: 1,
    fontSize: getResponsiveValue(
      getTypographySize("lg"),
      getTypographySize("xl"),
    ),
    fontWeight: BRAND_TYPOGRAPHY.weights.bold,
    marginLeft: getSpacing("md"),
    textAlign: "center",
  },
});

export default FirstTimeGuideScreen;
