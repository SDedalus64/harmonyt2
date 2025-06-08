import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../navigation/contexts/AuthContext';
import { useHistory } from '../hooks/useHistory';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isTablet } from '../platform/deviceUtils';

// Brand colors
const COLORS = {
  darkBlue: '#0B2953',
  lightBlue: '#4397EC',
  orange: '#E67E23',
  yellow: '#FFD800',
  white: '#FFFFFF',
  lightGray: '#F8F8F8',
  mediumGray: '#E1E1E1',
  darkGray: '#666666',
  black: '#333333',
  success: '#34C759',
  error: '#FF3B30',
};

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface UserStats {
  totalLookups: number;
  lastLookupDate: string;
  mostUsedCountry: string;
  accountCreated: string;
}

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user } = useAuth();
  const { history } = useHistory();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.email?.split('@')[0] || 'User');
  const [email, setEmail] = useState(user?.email || '');
  const [stats, setStats] = useState<UserStats>({
    totalLookups: 0,
    lastLookupDate: 'Never',
    mostUsedCountry: 'N/A',
    accountCreated: 'Unknown',
  });

  useEffect(() => {
    calculateStats();
    loadAccountCreatedDate();
  }, [history]);

  const calculateStats = () => {
    if (history.length === 0) {
      return;
    }

    // Total lookups
    const totalLookups = history.length;

    // Last lookup date
    const lastLookup = history[0]; // History is sorted by most recent
    const lastLookupDate = lastLookup ? new Date(lastLookup.timestamp).toLocaleDateString() : 'Never';

    // Most used country
    const countryCounts: { [key: string]: number } = {};
    history.forEach(item => {
      const country = item.countryName || item.countryCode || 'Unknown';
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    });

    const mostUsedCountry = Object.entries(countryCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

    setStats({
      totalLookups,
      lastLookupDate,
      mostUsedCountry,
      accountCreated: stats.accountCreated, // Preserve this
    });
  };

  const loadAccountCreatedDate = async () => {
    try {
      // Try to get account creation date from storage
      const createdDate = await AsyncStorage.getItem('@HarmonyTi:accountCreated');
      if (createdDate) {
        setStats(prev => ({
          ...prev,
          accountCreated: new Date(createdDate).toLocaleDateString(),
        }));
      } else {
        // Set current date as account created date if not found
        const now = new Date().toISOString();
        await AsyncStorage.setItem('@HarmonyTi:accountCreated', now);
        setStats(prev => ({
          ...prev,
          accountCreated: new Date(now).toLocaleDateString(),
        }));
      }
    } catch (error) {
      console.error('Error loading account created date:', error);
    }
  };

  const handleSave = () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name cannot be empty');
      return;
    }

    // In a real app, this would update the user profile on the server
    Alert.alert('Success', 'Profile updated successfully');
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'Password change functionality will be implemented in a future update.',
      [{ text: 'OK' }]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account Deletion', 'Account deletion will be implemented in a future update.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={COLORS.darkBlue} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity
              onPress={() => isEditing ? handleSave() : setIsEditing(true)}
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>{isEditing ? 'Save' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          {/* Profile Info Section */}
          <View style={styles.section}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              {isEditing && (
                <TouchableOpacity style={styles.changePhotoButton}>
                  <Ionicons name="camera" size={20} color={COLORS.lightBlue} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Display Name</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.infoInput}
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Enter display name"
                  />
                ) : (
                  <Text style={styles.infoValue}>{displayName}</Text>
                )}
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={[styles.infoValue, styles.emailText]}>{email}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Account Type</Text>
                <Text style={styles.infoValue}>Premium</Text>
              </View>
            </View>
          </View>

          {/* Statistics Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Usage Statistics</Text>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="search" size={24} color={COLORS.lightBlue} />
                <Text style={styles.statValue}>{stats.totalLookups}</Text>
                <Text style={styles.statLabel}>Total Lookups</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="calendar" size={24} color={COLORS.orange} />
                <Text style={styles.statValue}>{stats.lastLookupDate}</Text>
                <Text style={styles.statLabel}>Last Lookup</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="flag" size={24} color={COLORS.darkBlue} />
                <Text style={styles.statValue}>{stats.mostUsedCountry}</Text>
                <Text style={styles.statLabel}>Top Country</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="person-add" size={24} color={COLORS.success} />
                <Text style={styles.statValue}>{stats.accountCreated}</Text>
                <Text style={styles.statLabel}>Member Since</Text>
              </View>
            </View>
          </View>

          {/* Account Actions Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Settings</Text>

            <TouchableOpacity style={styles.actionButton} onPress={handleChangePassword}>
              <View style={styles.actionContent}>
                <Ionicons name="lock-closed-outline" size={22} color={COLORS.lightBlue} />
                <Text style={styles.actionText}>Change Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.darkGray} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionContent}>
                <Ionicons name="notifications-outline" size={22} color={COLORS.lightBlue} />
                <Text style={styles.actionText}>Notification Preferences</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.darkGray} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionContent}>
                <Ionicons name="download-outline" size={22} color={COLORS.lightBlue} />
                <Text style={styles.actionText}>Export Data</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.darkGray} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={handleDeleteAccount}
            >
              <View style={styles.actionContent}>
                <Ionicons name="trash-outline" size={22} color={COLORS.error} />
                <Text style={[styles.actionText, { color: COLORS.error }]}>
                  Delete Account
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.mediumGray,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkBlue,
  },
  editButton: {
    padding: 4,
  },
  editButtonText: {
    fontSize: 16,
    color: COLORS.lightBlue,
    fontWeight: '500',
  },
  section: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.lightBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: COLORS.white,
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: '40%',
    backgroundColor: COLORS.white,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.lightBlue,
  },
  infoContainer: {
    gap: 16,
  },
  infoRow: {
    gap: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.darkBlue,
    fontWeight: '500',
  },
  infoInput: {
    fontSize: 16,
    color: COLORS.darkBlue,
    fontWeight: '500',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightBlue,
    paddingVertical: 4,
  },
  emailText: {
    color: COLORS.darkGray,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkBlue,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: isTablet() ? 150 : 140,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.darkBlue,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.mediumGray,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionText: {
    fontSize: 16,
    color: COLORS.darkBlue,
  },
  dangerButton: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
});
