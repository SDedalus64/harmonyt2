import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
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
].sort((a, b) => a.name.localeCompare(b.name));

const CountryLookup = forwardRef<CountryLookupRef, CountryLookupProps>(
  ({ onSelect, selectedCountry, onSubmitEditing }, ref) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const flatListRef = React.useRef<FlatList>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        setIsExpanded(true);
      }
    }));

    const handleCountrySelect = (country: Country) => {
      onSelect(country);
      setIsExpanded(false);
      onSubmitEditing?.();
    };

    // Scroll to selected country when dropdown opens
    useEffect(() => {
      if (isExpanded && selectedCountry && flatListRef.current) {
        const selectedIndex = countries.findIndex(c => c.code === selectedCountry.code);
        if (selectedIndex >= 0) {
          setTimeout(() => {
            try {
              flatListRef.current?.scrollToIndex({
                index: selectedIndex,
                animated: true,
                viewPosition: 0.5 // Center the selected item
              });
            } catch (error) {
              // Fallback to scrollToOffset if scrollToIndex fails due to flexible heights
              const approximateOffset = selectedIndex * 50; // Approximate height
              flatListRef.current?.scrollToOffset({
                offset: approximateOffset,
                animated: true
              });
            }
          }, 100);
        }
      }
    }, [isExpanded, selectedCountry]);

    // Handle keyboard input for quick navigation
    const handleKeyPress = (key: string) => {
      const firstMatchIndex = countries.findIndex(
        country => country.name.toLowerCase().startsWith(key.toLowerCase())
      );
      if (firstMatchIndex >= 0 && flatListRef.current) {
        try {
          flatListRef.current.scrollToIndex({
            index: firstMatchIndex,
            animated: true,
            viewPosition: 0
          });
        } catch (error) {
          // Fallback to scrollToOffset if scrollToIndex fails due to flexible heights
          const approximateOffset = firstMatchIndex * 50; // Approximate height
          flatListRef.current.scrollToOffset({
            offset: approximateOffset,
            animated: true
          });
        }
      }
    };

    return (
      <View style={styles.container}>
        {selectedCountry ? (
          <TouchableOpacity
            style={styles.selectedCountry}
            onPress={() => setIsExpanded(true)}
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
            onPress={() => setIsExpanded(true)}
          >
            <Ionicons name="globe-outline" size={20} color="#666" />
            <Text style={styles.searchButtonText}>Select Country of Origin</Text>
          </TouchableOpacity>
        )}

        <Modal
          visible={isExpanded}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsExpanded(false)}
        >
          <TouchableWithoutFeedback onPress={() => setIsExpanded(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
          <View style={styles.dropdown}>
                  <View style={styles.dropdownHeader}>
                    <Text style={styles.dropdownTitle}>Select Country</Text>
                    <TouchableOpacity
                      onPress={() => setIsExpanded(false)}
                      style={styles.closeButton}
                    >
                      <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
            </View>
            <FlatList
                    ref={flatListRef}
                    data={countries}
              keyExtractor={item => item.code}
              style={styles.list}
              keyboardShouldPersistTaps="handled"

              renderItem={({ item }) => (
                <TouchableOpacity
                        style={[
                          styles.countryItem,
                          selectedCountry?.code === item.code && styles.selectedItem
                        ]}
                  onPress={() => handleCountrySelect(item)}
                >
                        <Text style={[
                          styles.countryName,
                          selectedCountry?.code === item.code && styles.selectedText
                        ]}>{item.name}</Text>
                        <Text style={[
                          styles.countryCode,
                          selectedCountry?.code === item.code && styles.selectedText
                        ]}>{item.code}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
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
    fontSize: isTablet() ? 21.6 : 14.4, // 10% reduction: 24 * 0.9 = 21.6, 16 * 0.9 = 14.4
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
    fontSize: isTablet() ? 21.6 : 14.4, // 10% reduction: 24 * 0.9 = 21.6, 16 * 0.9 = 14.4
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxWidth: isTablet() ? 600 : 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 10,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  dropdownTitle: {
    fontSize: isTablet() ? 24.3 : 16.2, // 10% reduction: 27 * 0.9 = 24.3, 18 * 0.9 = 16.2
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  list: {
    maxHeight: isTablet() ? 500 : 400,
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
    minHeight: 44, // Minimum height for touch targets
  },
  selectedItem: {
    backgroundColor: '#E8F4FD',
  },
  countryName: {
    fontSize: isTablet() ? 21.6 : 14.4, // 10% reduction: 24 * 0.9 = 21.6, 16 * 0.9 = 14.4
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  countryCode: {
    fontSize: isTablet() ? 18.9 : 12.6, // 10% reduction: 21 * 0.9 = 18.9, 14 * 0.9 = 12.6
    color: '#666',
    flexShrink: 0,
  },
  selectedText: {
    color: '#0066CC',
    fontWeight: '600',
  },
});
