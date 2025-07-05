import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SessionExportModalProps {
  visible: boolean;
  onClose: () => void;
  onSend: (email: string, receiveUpdates: boolean) => void;
  userEmail?: string;
  userName?: string;
  companyName?: string;
  isLoggedIn: boolean;
}

export default function SessionExportModal({
  visible,
  onClose,
  onSend,
  userEmail = '',
  userName = '',
  companyName = '',
  isLoggedIn,
}: SessionExportModalProps) {
  const [email, setEmail] = useState(userEmail);
  const [receiveUpdates, setReceiveUpdates] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSend = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Call the onSend callback with email and preference
      await onSend(email, receiveUpdates);
      
      // Show success message
      Alert.alert(
        'Success',
        'Your session data and tariff guide have been sent to your email.',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      console.error('Error sending session:', error);
      setError('Failed to send session data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Get a Copy of Your Session</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalDescription}>
            Enter your email below to receive a copy of your session. As a bonus, we'll also send you our featured guide: "Tariff Code Review - Your Guide to Lower Duties". You'll also get occasional updates about our services.
          </Text>

          {!isLoggedIn && (
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                value={email}
                onChangeText={setEmail}
                placeholder="Your email address"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>
          )}

          {isLoggedIn && (
            <View style={styles.userInfoContainer}>
              <Text style={styles.userInfoLabel}>Sending to:</Text>
              <Text style={styles.userInfoValue}>{email}</Text>
              {userName && <Text style={styles.userInfoValue}>{userName}</Text>}
              {companyName && <Text style={styles.userInfoValue}>{companyName}</Text>}
            </View>
          )}

          <View style={styles.switchContainer}>
            <Switch
              value={receiveUpdates}
              onValueChange={setReceiveUpdates}
              trackColor={{ false: '#E1E1E1', true: '#2EAAF2' }}
              thumbColor={receiveUpdates ? '#fff' : '#fff'}
            />
            <Text style={styles.switchLabel}>
              Yes, I'd like to receive updates and offers from Dedola Global Logistics.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSend}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.sendButtonText}>Send My Session</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>No, thanks</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    gap: 12,
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: '#E1E1E1',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderColor: '#E1E1E1',
    borderRadius: 12,
    borderWidth: 1,
    color: '#333',
    fontSize: 16,
    height: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 5,
    maxWidth: 500,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: '100%',
  },
  modalDescription: {
    color: '#333',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  modalTitle: {
    color: '#217DB2',
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: '#2EAAF2',
    borderRadius: 28,
    elevation: 8,
    height: 56,
    justifyContent: 'center',
    shadowColor: '#2EAAF2',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  switchContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 24,
  },
  switchLabel: {
    color: '#666',
    flex: 1,
    fontSize: 14,
    marginLeft: 12,
  },
  userInfoContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  userInfoLabel: {
    color: '#666',
    fontSize: 14,
    marginBottom: 8,
  },
  userInfoValue: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
});
