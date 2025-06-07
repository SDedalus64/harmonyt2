import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Switch, Keyboard, Dimensions, Platform, ScrollView } from 'react-native';

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
            >
              <Text style={[styles.modalTitle, { fontSize: fontSizes.title }]}>Important Disclaimer</Text>

              {/* Debug info - remove in production */}
              {__DEV__ && (
                <Text style={styles.debugText}>
                  Device: {dimensions.deviceType} | Platform: {dimensions.platform} |
                  Screen: {dimensions.screenWidth.toFixed(0)}x{dimensions.screenHeight.toFixed(0)} |
                  Modal: {dimensions.modalWidth.toFixed(0)}x{dimensions.modalHeight.toFixed(0)}
                </Text>
              )}

              <Text style={[styles.modalText, { fontSize: fontSizes.text }]}>
                 This lookup tool is for general informational purposes only and not legal advice. Data is sourced from public records (U.S. HTS, Section 301 Notices) but is subject to change. Dedola Global Logistics does not guarantee accuracy or timeliness.
                 <Text style={{ fontWeight: 'bold' }}> Users are solely responsible for verifying all information with a licensed customs broker or official sources before making business decisions.</Text> Use of this tool is at your own risk.
                 {'\n\n'}
                 <Text style={{ fontWeight: 'bold' }}>Privacy Note:</Text> Your individual tariff lookups and calculations are processed and stored only within your browser during your session. This specific lookup data is not automatically collected or stored by us. If you choose to use the 'Email My Session & Get Guide' feature, your email address and the session history you've saved will be used to provide you with that information and the guide.
              </Text>

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
                   I have read, understand, and agree to this disclaimer.
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
});

export default DisclaimerModal;
