import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  BRAND_COLORS, 
  BRAND_SPACING, 
  BRAND_TYPOGRAPHY, 
  getResponsiveValue, 
  getBorderRadius, 
  getSpacing, 
  BRAND_SHADOWS,
  getTypographySize
} from '../config/brandColors';
import { LinearGradient } from 'expo-linear-gradient';

interface FirstTimeGuideScreenProps {
  visible: boolean;
  onClose: (dontShowAgain: boolean) => void;
}

const GuideStep = ({ icon, title, text }: { icon: any; title: string; text: string }) => (
  <View style={styles.stepContainer}>
    <Ionicons name={icon} size={getResponsiveValue(28, 32)} color={BRAND_COLORS.electricBlue} style={styles.stepIcon} />
    <View style={styles.stepTextContainer}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  </View>
);

const FirstTimeGuideScreen: React.FC<FirstTimeGuideScreenProps> = ({ visible, onClose }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

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
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.header}>
                <Ionicons name="compass-outline" size={getResponsiveValue(36, 48)} color={BRAND_COLORS.white} />
                <Text style={styles.title}>First Time? Here's a Quick Tour!</Text>
            </View>
            <Text style={styles.introText}>
              Welcome to Harmony! Let's walk through your first duty calculation.
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
                  trackColor={{ false: BRAND_COLORS.mediumGray, true: BRAND_COLORS.electricBlue }}
                  thumbColor={dontShowAgain ? BRAND_COLORS.white : BRAND_COLORS.lightGray}
                  onValueChange={setDontShowAgain}
                  value={dontShowAgain}
                />
                <Text style={styles.switchLabel}>Don't show this again</Text>
              </View>

              <TouchableOpacity style={styles.button} onPress={() => onClose(dontShowAgain)}>
                <Text style={styles.buttonText}>Got It!</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 9999,
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
    borderRadius: getBorderRadius('lg'),
    padding: getSpacing('lg'),
    ...BRAND_SHADOWS.large,
  },
  scrollViewContent: {
    paddingBottom: getSpacing('lg'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getSpacing('md'),
  },
  title: {
    fontSize: getTypographySize('xl'),
    fontWeight: BRAND_TYPOGRAPHY.weights.bold,
    color: BRAND_COLORS.white,
    textAlign: 'center',
    marginLeft: getSpacing('md'),
  },
  introText: {
    fontSize: getTypographySize('md'),
    color: BRAND_COLORS.lightGray,
    textAlign: 'center',
    marginBottom: getSpacing('xl'),
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: getSpacing('xl'),
    padding: getSpacing('md'),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: getBorderRadius('md'),
  },
  stepIcon: {
    marginRight: getSpacing('md'),
    marginTop: getSpacing('xs'),
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: getTypographySize('lg'),
    fontWeight: BRAND_TYPOGRAPHY.weights.bold,
    color: BRAND_COLORS.white,
    marginBottom: getSpacing('xs'),
  },
  stepText: {
    fontSize: getTypographySize('md'),
    color: BRAND_COLORS.lightGray,
    lineHeight: getTypographySize('md') * 1.5,
  },
  footer: {
    marginTop: getSpacing('lg'),
    alignItems: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getSpacing('sm'),
  },
  switchLabel: {
    fontSize: getTypographySize('sm'),
    color: BRAND_COLORS.white,
    marginLeft: getSpacing('sm'),
  },
  button: {
    backgroundColor: BRAND_COLORS.electricBlue,
    paddingVertical: getSpacing('sm'),
    paddingHorizontal: getSpacing('lg'),
    borderRadius: getBorderRadius('md'),
    ...BRAND_SHADOWS.medium,
  },
  buttonText: {
    fontSize: getTypographySize('md'),
    fontWeight: BRAND_TYPOGRAPHY.weights.bold,
    color: BRAND_COLORS.white,
  },
});

export default FirstTimeGuideScreen; 