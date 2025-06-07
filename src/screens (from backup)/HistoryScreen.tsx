import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from '../navigation/types';
import { useHistory, HistoryItem } from '../hooks/useHistory';
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
  error: '#FF3B30',
};

type HistoryScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'History'>;

export default function HistoryScreen() {
  const navigation = useNavigation<HistoryScreenNavigationProp>();
  const { history, loadHistory, clearHistory } = useHistory();
  const insets = useSafeAreaInsets();
  const logoMarginTop = isTablet() ? 32 : insets.top + 8;

  // Reload history every time the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if the date is today
    if (date.toDateString() === now.toDateString()) {
      return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Check if the date is yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    // For other dates, show the full date
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all history?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => clearHistory(),
        },
      ],
      { cancelable: true }
    );
  };

  const handleItemPress = (item: HistoryItem) => {
    navigation.navigate('Lookup', { historyItem: item });
  };

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => handleItemPress(item)}
    >
      <View style={styles.historyItemHeader}>
        <Text style={styles.historyItemHtsCode}>{item.htsCode}</Text>
      </View>
      <Text style={styles.historyItemDescription} numberOfLines={1}>{item.description}</Text>
      <View style={styles.historyItemDetails}>
        <View style={styles.historyItemDetail}>
          <Text style={styles.historyItemCountry}>{item.countryName}</Text>
          {item.totalAmount !== undefined && (
          <Text style={styles.historyItemValue} numberOfLines={1}>{formatCurrency(item.totalAmount)}</Text>
          )}
        </View>
        <Text style={styles.historyItemTimestamp}>{formatDate(item.timestamp)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Image
        source={require('../../assets/Harmony2x.png')}
        style={styles.emptyStateLogo}
        resizeMode="contain"
      />
      <Text style={styles.emptyStateTitle}>No History Yet</Text>
      <Text style={styles.emptyStateText}>
        Your lookup history will appear here. Start by looking up an HTS code.
      </Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={() => navigation.navigate('Lookup', {})}
      >
        <Text style={styles.emptyStateButtonText}>Go to Lookup</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={[styles.headerContainer, { paddingTop: 0 }]}>
        <View style={styles.headerTitleContainer}>
          <Image
            source={require('../../assets/Harmony2x.png')}
            style={[styles.headerLogo, { marginTop: logoMarginTop }]}
            resizeMode="contain"
          />
        </View>
        {history.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearHistory}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.mediumGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 360,
    height: 70,
  },
  header: {
    marginLeft: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.darkBlue,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.orange,
    borderRadius: 4,
  },
  clearButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  historyItem: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.lightBlue,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyItemHtsCode: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.darkBlue,
  },
  historyItemDescription: {
    fontSize: 14,
    color: COLORS.darkBlue,
    marginBottom: 8,
    flexShrink: 0, // Add this line
  },
  historyItemDetails: {
    marginTop: 4,
    flexShrink: 0, // Add this line
  },
  historyItemDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },flexShrink: 0, // Add this line

  historyItemCountry: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.darkBlue,
  },
  historyItemValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.darkBlue,
    flexShrink: 0, // Add this line
  },
  historyItemTimestamp: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginTop: 4,
    opacity: 0.8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateLogo: {
    width: 360,
    height: 70,
    marginBottom: 24,
    opacity: 0.8,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.darkBlue,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: COLORS.orange,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
