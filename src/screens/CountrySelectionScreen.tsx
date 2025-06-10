import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { useSettings } from '../hooks/useSettings';
import { COUNTRIES, Country } from '../utils/countries';

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
};

type CountrySelectionNavigationProp = StackNavigationProp<RootStackParamList>;

export default function CountrySelectionScreen() {
  const navigation = useNavigation<CountrySelectionNavigationProp>();
  const { settings, updateSetting } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');

  // Add "None" option to the beginning of the countries list
  const countriesWithNone = [
    { code: '', name: 'None' },
    ...COUNTRIES
  ];

  const filteredCountries = countriesWithNone.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCountrySelect = async (countryCode: string) => {
    await updateSetting('defaultCountry', countryCode);
    navigation.goBack();
  };

  const renderCountryItem = ({ item }: { item: Country }) => {
    const isSelected = item.code === ''
      ? !settings.defaultCountry || settings.defaultCountry === ''
      : settings.defaultCountry === item.code;

    return (
      <TouchableOpacity
        style={[styles.countryItem, isSelected && styles.selectedCountryItem]}
        onPress={() => handleCountrySelect(item.code)}
      >
        <Text style={[styles.countryName, isSelected && styles.selectedText, item.code === '' && styles.noneOption]}>
          {item.name}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.darkBlue} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Default Country</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.darkGray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search countries..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.darkGray}
        />
      </View>

      <FlatList
        data={filteredCountries}
        renderItem={renderCountryItem}
        keyExtractor={(item) => item.code}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
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
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkBlue,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.darkBlue,
  },
  listContent: {
    paddingBottom: 20,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 50,
  },
  selectedCountryItem: {
    backgroundColor: COLORS.lightGray,
  },
  countryName: {
    fontSize: 16,
    color: COLORS.darkBlue,
    flex: 1,
    marginRight: 12,
  },
  selectedText: {
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.mediumGray,
    marginHorizontal: 16,
  },
  noneOption: {
    fontStyle: 'italic',
    color: COLORS.darkGray,
  },
});
