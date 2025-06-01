import React, { useState, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isTablet } from '../platform/deviceUtils';

interface Country {
  code: string;
  name: string;
}

interface CountryLookupProps {
  onSelect: (country: Country) => void;
  selectedCountry?: Country;
  onSubmitEditing?: () => void;
}

export interface CountryLookupRef {
  focus: () => void;
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

const CountryLookup = forwardRef<CountryLookupRef, CountryLookupProps>(
  ({ onSelect, selectedCountry, onSubmitEditing }, ref) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const searchInputRef = React.useRef<TextInput>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        setIsExpanded(true);
        // Small delay to ensure the dropdown is rendered
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      }
    }));

    const filteredCountries = countries.filter(country =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCountrySelect = (country: Country) => {
      onSelect(country);
      setIsExpanded(false);
      setSearchQuery('');
      onSubmitEditing?.();
    };

    const handleSearchSubmit = () => {
      if (filteredCountries.length === 1) {
        handleCountrySelect(filteredCountries[0]);
      } else {
        Keyboard.dismiss();
      }
    };

    return (
      <View style={styles.container}>
        {selectedCountry ? (
          <TouchableOpacity
            style={styles.selectedCountry}
            onPress={() => {
              setIsExpanded(true);
              setTimeout(() => {
                searchInputRef.current?.focus();
              }, 100);
            }}
          >
            <View style={styles.selectedCountryContent}>
              <Text style={styles.selectedCountryText}>
                {selectedCountry.name} ({selectedCountry.code})
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => {
              setIsExpanded(true);
              setTimeout(() => {
                searchInputRef.current?.focus();
              }, 100);
            }}
          >
            <Ionicons name="globe-outline" size={20} color="#666" />
            <Text style={styles.searchButtonText}>Select Country of Origin</Text>
          </TouchableOpacity>
        )}

        {isExpanded && (
          <View style={styles.dropdown}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search countries..."
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSearchSubmit}
                blurOnSubmit={false}
              />
            </View>
            <FlatList
              data={filteredCountries}
              keyExtractor={item => item.code}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => handleCountrySelect(item)}
                >
                  <Text style={styles.countryName}>{item.name}</Text>
                  <Text style={styles.countryCode}>{item.code}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>
    );
  }
);

CountryLookup.displayName = 'CountryLookup';

export default CountryLookup;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  selectedCountry: {
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 12,
    backgroundColor: '#F8F8F8',
    padding: 16,
  },
  selectedCountryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedCountryText: {
    fontSize: isTablet() ? 20 : 16,
    color: '#333',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 12,
    backgroundColor: '#F8F8F8',
    padding: 16,
  },
  searchButtonText: {
    marginLeft: 8,
    fontSize: isTablet() ? 20 : 16,
    color: '#666',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    marginTop: 4,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxHeight: isTablet() ? 500 : 300,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: isTablet() ? 20 : 16,
    color: '#333',
  },
  list: {
    maxHeight: 300,
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  countryName: {
    fontSize: isTablet() ? 20 : 16,
    color: '#333',
  },
  countryCode: {
    fontSize: isTablet() ? 18 : 14,
    color: '#666',
  },
});
