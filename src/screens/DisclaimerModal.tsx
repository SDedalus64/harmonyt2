import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Switch, Keyboard } from 'react-native';

interface DisclaimerModalProps {
  visible: boolean;
  onAgree: () => void;
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ visible, onAgree }) => {
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (visible) {
      Keyboard.dismiss();
    }
  }, [visible]);

  const handleAgree = () => {
    if (agreed) {
      onAgree();
    }
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
         <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Important Disclaimer</Text>
            <Text style={styles.modalText}>
               This lookup tool is for general informational purposes only and not legal advice. Data is sourced from public records (U.S. HTS, Section 301 Notices) but is subject to change. Dedola Global Logistics does not guarantee accuracy or timeliness.
               <Text style={{ fontWeight: 'bold' }}> Users are solely responsible for verifying all information with a licensed customs broker or official sources before making business decisions.</Text> Use of this tool is at your own risk.
               {'\n\n'}
               <Text style={{ fontWeight: 'bold' }}>Privacy Note:</Text> Your individual tariff lookups and calculations are processed and stored only within your browser during your session. This specific lookup data is not automatically collected or stored by us. If you choose to use the 'Email My Session & Get Guide' feature, your email address and the session history you've saved will be used to provide you with that information and the guide.
            </Text>
            <View style={styles.modalCheckboxRow}>
               <Switch
                  value={agreed}
                  onValueChange={setAgreed}
                  trackColor={{ false: '#E1E1E1', true: '#2EAAF2' }}
                  thumbColor="#fff"
               />
               <Text style={styles.modalCheckboxLabel}>I have read, understand, and agree to this disclaimer.</Text>
            </View>
            <TouchableOpacity
               style={[styles.modalButton, !agreed && styles.modalButtonDisabled]}
               onPress={handleAgree}
               disabled={!agreed}
            >
               <Text style={styles.modalButtonText}>Agree & Continue</Text>
            </TouchableOpacity>
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
    width: '90%',
    backgroundColor: '#F8F8F8', // lightGray
    borderRadius: 10,
    padding: 20,
    borderColor: '#E1E1E1', // mediumGray
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: '#0B2953' }, // darkBlue
  modalText: { fontSize: 14, color: '#666666', marginBottom: 16, lineHeight: 20 }, // darkGray
  modalCheckboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  modalCheckboxLabel: { marginLeft: 8, fontSize: 14, color: '#333333' }, // black
  modalButton: { backgroundColor: '#2EAAF2', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalButtonDisabled: { opacity: 0.5 },
  modalButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default DisclaimerModal;
