import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isTablet, getLayoutValue } from '../../platform/deviceUtils';

interface Country {
  code: string;
  name: string;
}

interface CountryLookupProps {
  onSelect: (country: Country) => void;
  selectedCountry?: Country;
}

const countries: Country[] = [
  { code: 'AU', name: 'Australia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CA', name: 'Canada' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'CL', name: 'Chile' },
  { code: 'CN', name: 'China' },
  { code: 'CU', name: 'Cuba' },
  { code: 'DE', name: 'Germany' },
  { code: 'EU', name: 'European Union' },
  { code: 'FR', name: 'France' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IL', name: 'Israel' },
  { code: 'IN', name: 'India' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'KP', name: 'North Korea' },
  { code: 'KR', name: 'South Korea' },
  { code: 'MX', name: 'Mexico' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'NO', name: 'Norway' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'PE', name: 'Peru' },
  { code: 'PH', name: 'Philippines' },
  { code: 'RU', name: 'Russia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'TH', name: 'Thailand' },
  { code: 'TR', name: 'Turkey' },
  { code: 'US', name: 'United States' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'ZA', name: 'South Africa' },
];

export default function CountryLookup({ onSelect, selectedCountry }: CountryLookupProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const isTabletDevice = isTablet();

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCountrySelect = (country: Country) => {
    onSelect(country);
    setIsExpanded(false);
    setSearchQuery('');
  };

  const renderCountryItem = ({ item }: { item: Country }) => (
    <TouchableOpacity
      style={[
        styles.countryItem,
        isTabletDevice && styles.countryItemTablet
      ]}
      onPress={() => handleCountrySelect(item)}
    >
      <Text style={[
        styles.countryName,
        isTabletDevice && styles.countryNameTablet
      ]}>
        {item.name}
      </Text>
      <Text style={[
        styles.countryCode,
        isTabletDevice && styles.countryCodeTablet
      ]}>
        {item.code}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {selectedCountry ? (
        <TouchableOpacity
          style={[
            styles.selectedCountry,
            isTabletDevice && styles.selectedCountryTablet
          ]}
          onPress={() => setIsExpanded(true)}
        >
          <View style={styles.selectedCountryContent}>
            <Text style={[
              styles.selectedCountryText,
              isTabletDevice && styles.selectedCountryTextTablet
            ]}>
              {selectedCountry.name} ({selectedCountry.code})
            </Text>
            <Ionicons
              name="chevron-down"
              size={isTabletDevice ? 24 : 20}
              color="#666"
            />
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.searchButton,
            isTabletDevice && styles.searchButtonTablet
          ]}
          onPress={() => setIsExpanded(true)}
        >
          <Ionicons
            name="globe-outline"
            size={isTabletDevice ? 24 : 20}
            color="#666"
          />
          <Text style={[
            styles.searchButtonText,
            isTabletDevice && styles.searchButtonTextTablet
          ]}>
            Select Country of Origin
          </Text>
        </TouchableOpacity>
      )}

      {isExpanded && (
        <View style={[
          styles.dropdown,
          isTabletDevice && styles.dropdownTablet
        ]}>
          <View style={[
            styles.searchContainer,
            isTabletDevice && styles.searchContainerTablet
          ]}>
            <Ionicons
              name="search"
              size={isTabletDevice ? 24 : 20}
              color="#666"
              style={styles.searchIcon}
            />
            <TextInput
              style={[
                styles.searchInput,
                isTabletDevice && styles.searchInputTablet
              ]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search countries..."
              autoFocus
            />
          </View>
          <FlatList
            data={filteredCountries}
            keyExtractor={item => item.code}
            style={styles.list}
            numColumns={isTabletDevice ? 2 : 1}
            renderItem={renderCountryItem}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: getLayoutValue('medium', 'spacing'),
  },
  selectedCountry: {
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: getLayoutValue('borderRadius', 'dimensions'),
    backgroundColor: '#F8F8F8',
    padding: getLayoutValue('medium', 'spacing'),
  },
  selectedCountryTablet: {
    padding: getLayoutValue('large', 'spacing'),
  },
  selectedCountryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedCountryText: {
    fontSize: getLayoutValue('medium', 'typography'),
    color: '#333',
  },
  selectedCountryTextTablet: {
    fontSize: getLayoutValue('large', 'typography'),
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: getLayoutValue('borderRadius', 'dimensions'),
    backgroundColor: '#F8F8F8',
    padding: getLayoutValue('medium', 'spacing'),
  },
  searchButtonTablet: {
    padding: getLayoutValue('large', 'spacing'),
  },
  searchButtonText: {
    marginLeft: getLayoutValue('small', 'spacing'),
    fontSize: getLayoutValue('medium', 'typography'),
    color: '#666',
  },
  searchButtonTextTablet: {
    fontSize: getLayoutValue('large', 'typography'),
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: getLayoutValue('borderRadius', 'dimensions'),
    borderWidth: 1,
    borderColor: '#E1E1E1',
    marginTop: getLayoutValue('small', 'spacing'),
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownTablet: {
    width: Dimensions.get('window').width * 0.8,
    left: '10%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getLayoutValue('medium', 'spacing'),
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  searchContainerTablet: {
    padding: getLayoutValue('large', 'spacing'),
  },
  searchIcon: {
    marginRight: getLayoutValue('small', 'spacing'),
  },
  searchInput: {
    flex: 1,
    fontSize: getLayoutValue('medium', 'typography'),
    color: '#333',
  },
  searchInputTablet: {
    fontSize: getLayoutValue('large', 'typography'),
  },
  list: {
    maxHeight: 300,
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getLayoutValue('medium', 'spacing'),
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  countryItemTablet: {
    padding: getLayoutValue('large', 'spacing'),
    flex: 1,
  },
  countryName: {
    fontSize: getLayoutValue('medium', 'typography'),
    color: '#333',
  },
  countryNameTablet: {
    fontSize: getLayoutValue('large', 'typography'),
  },
  countryCode: {
    fontSize: getLayoutValue('small', 'typography'),
    color: '#666',
  },
  countryCodeTablet: {
    fontSize: getLayoutValue('medium', 'typography'),
  },
});
