import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Switch, Keyboard, Dimensions, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BRAND_COLORS } from '../config/brandColors';

interface DisclaimerModalProps {
  visible: boolean;
  onAgree: () => void;
}

// Get device dimensions and calculate 75%
const getModalDimensions = () => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const modalWidth = screenWidth * 0.75;
  const modalHeight = screenHeight * 0.75;

  // Device detection logic
  const isTablet = screenWidth >= 768; // iPad and larger tablets
  const isSmallPhone = screenWidth < 375; // Smaller phones
  const isLargePhone = screenWidth >= 414; // iPhone Plus/Pro Max sizes

  return {
    modalWidth,
    modalHeight,
    screenWidth,
    screenHeight,
    isTablet,
    isSmallPhone,
    isLargePhone,
    deviceType: isTablet ? 'tablet' : isSmallPhone ? 'small-phone' : isLargePhone ? 'large-phone' : 'phone',
    platform: Platform.OS,
  };
};

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ visible, onAgree }) => {
  const [agreed, setAgreed] = useState(false);
  const [dimensions, setDimensions] = useState(getModalDimensions());
  const scrollViewRef = useRef<ScrollView>(null);
  const [showScrollHint, setShowScrollHint] = useState(true);

  useEffect(() => {
    if (visible) {
      Keyboard.dismiss();
    }
  }, [visible]);

  useEffect(() => {
    // Update dimensions on orientation change
    const updateDimensions = () => {
      setDimensions(getModalDimensions());
    };

    const subscription = Dimensions.addEventListener('change', updateDimensions);

    return () => subscription?.remove();
  }, []);

  const handleAgree = () => {
    if (agreed) {
      onAgree();
    }
  };

  // Adjust font sizes based on device type
  const getFontSizes = () => {
    const { isTablet, isSmallPhone } = dimensions;

    if (isTablet) {
      return {
        title: 24,
        text: 16,
        button: 18,
        checkbox: 16,
      };
    } else if (isSmallPhone) {
      return {
        title: 18,
        text: 13,
        button: 14,
        checkbox: 13,
      };
    } else {
      return {
        title: 20,
        text: 14,
        button: 16,
        checkbox: 14,
      };
    }
  };

  const fontSizes = getFontSizes();

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    setShowScrollHint(!isAtBottom);
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onShow={() => { Keyboard.dismiss(); }}
      onRequestClose={() => { /* (Optional) handle modal close (e.g. via back button) */ }}
    >
      <View style={styles.modalOverlay}>
         <View style={[
           styles.modalContent,
           {
             width: dimensions.modalWidth,
             maxHeight: dimensions.modalHeight,
             // Add padding adjustments based on device
             padding: dimensions.isTablet ? 30 : dimensions.isSmallPhone ? 15 : 20,
           }
         ]}>
            <ScrollView
              ref={scrollViewRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              bounces={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              <Text style={[styles.modalTitle, { fontSize: fontSizes.title }]}>Welcome to HarmonyTi</Text>

              {/* Debug info - remove in production */}
              {__DEV__ && (
                <Text style={styles.debugText}>
                  Device: {dimensions.deviceType} | Platform: {dimensions.platform} |
                  Screen: {dimensions.screenWidth.toFixed(0)}x{dimensions.screenHeight.toFixed(0)} |
                  Modal: {dimensions.modalWidth.toFixed(0)}x{dimensions.modalHeight.toFixed(0)}
                </Text>
              )}

              <Text style={[styles.modalSubtitle, { fontSize: fontSizes.text + 2 }]}>
                Your Professional Import Duty Calculator
              </Text>

              <Text style={[styles.modalText, { fontSize: fontSizes.text }]}>
                <Text style={{ fontWeight: 'bold' }}>What we provide:</Text>
                {'\n'}• Real-time duty estimates based on official U.S. tariff data
                {'\n'}• Current trade action rates (Section 301, 232, reciprocal tariffs)
                {'\n'}• Instant calculations for import planning
                {'\n\n'}
                <Text style={{ fontWeight: 'bold' }}>Important to know:</Text>
                {'\n'}• Estimates are for planning purposes only
                {'\n'}• Final duties are determined by U.S. Customs at time of entry
                {'\n'}• Always verify with a licensed customs broker for official rulings
                {'\n\n'}
                <Text style={{ fontWeight: 'bold' }}>Your privacy:</Text>
                {'\n'}• Calculations are processed locally on your device
                {'\n'}• We don't store your lookup history unless you request a report
                {'\n'}• or an evaluation of your import duties.
                {'\n'}• Email features are optional and only used when requested
              </Text>

              <View style={styles.legalNotice}>
                <Text style={[styles.legalText, { fontSize: fontSizes.text - 1 }]}>
                  By using HarmonyTi, you acknowledge that this tool provides estimates only.
                  Dedola Global Logistics is not liable for decisions based solelyon these calculations.
                  Users must independently verify all information with licensenced professional or
                  official sources.
                </Text>
              </View>

              <View style={styles.modalCheckboxRow}>
                 <Switch
                    value={agreed}
                    onValueChange={(value) => {
                      setAgreed(value);
                      // Scroll to bottom when user toggles the switch on
                      if (value) {
                        setTimeout(() => {
                          scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 100);
                      }
                    }}
                    trackColor={{ false: '#E1E1E1', true: '#2EAAF2' }}
                    thumbColor="#fff"
                    // Scale switch for tablets
                    style={dimensions.isTablet ? { transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] } : {}}
                 />
                 <Text style={[styles.modalCheckboxLabel, { fontSize: fontSizes.checkbox }]}>
                   I understand and accept these terms
                 </Text>
              </View>

              <TouchableOpacity
                 style={[
                   styles.modalButton,
                   !agreed && styles.modalButtonDisabled,
                   // Adjust button height based on device
                   { paddingVertical: dimensions.isTablet ? 16 : dimensions.isSmallPhone ? 10 : 12 }
                 ]}
                 onPress={handleAgree}
                 disabled={!agreed}
              >
                 <Text style={[styles.modalButtonText, { fontSize: fontSizes.button }]}>
                   Agree & Continue
                 </Text>
              </TouchableOpacity>

            </ScrollView>

            {showScrollHint && (
              <View style={styles.scrollHintOverlay} pointerEvents="none"> 
                <Ionicons name="chevron-down" size={28} color={BRAND_COLORS.orange} />
                <Text style={[styles.scrollHintText, { color: BRAND_COLORS.orange }]}>Scroll for agreement</Text>
              </View>
            )}
         </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#F8F8F8', // lightGray
    borderRadius: 10,
    borderColor: '#E1E1E1', // mediumGray
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    marginBottom: 16,
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#0B2953', // darkBlue
    textAlign: 'center',
  },
  modalSubtitle: {
    fontWeight: '600',
    marginBottom: 20,
    color: '#2EAAF2', // electricBlue
    textAlign: 'center',
  },
  modalText: {
    color: '#666666', // darkGray
    lineHeight: 20,
    marginBottom: 16,
  },
  modalCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 5,
  },
  modalCheckboxLabel: {
    marginLeft: 8,
    color: '#333333', // black
    flex: 1,
  },
  modalButton: {
    backgroundColor: '#2EAAF2',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  debugText: {
    fontSize: 10,
    color: '#999',
    marginBottom: 8,
    textAlign: 'center',
  },
  legalNotice: {
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#2EAAF2',
  },
  legalText: {
    color: '#555555',
    lineHeight: 18,
    fontSize: 12,
    fontStyle: 'italic',
  },
  scrollHintOverlay: {
    position: 'absolute',
    bottom: 7,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scrollHintText: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default DisclaimerModal;
