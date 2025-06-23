import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedDrawer } from './shared/AnimatedDrawer';

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
    <AnimatedDrawer isVisible={visible} onClose={onClose} position="bottom">
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
    </AnimatedDrawer>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#217DB2',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 12,
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    height: 50,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
  },
  userInfoContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  userInfoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  userInfoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  switchLabel: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    gap: 12,
  },
  sendButton: {
    backgroundColor: '#2EAAF2',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2EAAF2',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#E1E1E1',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 18,
    fontWeight: '600',
  },
});
