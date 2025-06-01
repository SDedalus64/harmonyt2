import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SaveWorkCardProps {
  onPress: () => void;
  isLoggedIn: boolean;
}

export default function SaveWorkCard({ onPress, isLoggedIn }: SaveWorkCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Save Your Work</Text>
      
      <Text style={styles.description}>
        Get your results and our{' '}
        <Text style={styles.highlightText}>free tariff guide</Text>
        {' '}sent to your inbox
      </Text>
      
      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
      >
        <Text style={styles.buttonText}>Email Results</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#FFE0A0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#217DB2',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    lineHeight: 22,
  },
  highlightText: {
    color: '#E67E22',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#E67E22',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
