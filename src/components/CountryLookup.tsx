import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isTablet } from '../platform/deviceUtils';
import {
  BRAND_COLORS,
  BRAND_TYPOGRAPHY,
  getTypographySize,
  getSpacing,
  getBorderRadius,
  getInputConfig,
  getResponsiveValue
} from '../config/brandColors';

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
  { code: 'BD', name: 'Bangladesh' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'BN', name: 'Brunei' },
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
  { code: 'HK', name: 'Hong Kong' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IL', name: 'Israel' },
  { code: 'IN', name: 'India' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'KH', name: 'Cambodia' },
  { code: 'KP', name: 'North Korea' },
  { code: 'KR', name: 'South Korea' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'LA', name: 'Laos' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'MM', name: 'Myanmar' },
  { code: 'MO', name: 'Macau' },
  { code: 'MX', name: 'Mexico' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'NO', name: 'Norway' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'OM', name: 'Oman' },
  { code: 'PE', name: 'Peru' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'QA', name: 'Qatar' },
  { code: 'RU', name: 'Russia' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'TH', name: 'Thailand' },
  { code: 'TR', name: 'Turkey' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'AE', name: 'United Arab Emirates' },
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
              <Ionicons name="chevron-down" size={getResponsiveValue(20, 24)} color={BRAND_COLORS.darkGray} />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setIsExpanded(true)}
          >
            <Ionicons name="globe-outline" size={getResponsiveValue(20, 24)} color={BRAND_COLORS.electricBlue} />
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
                      <Ionicons name="close" size={getResponsiveValue(24, 28)} color={BRAND_COLORS.darkGray} />
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
    marginBottom: getSpacing('md'),
    width: Platform.OS === 'ios' && Platform.isPad ? 500 : '100%',
    maxWidth: '100%',
  },
  selectedCountry: {
    borderWidth: 1,
    borderColor: BRAND_COLORS.mediumGray,
    borderRadius: getBorderRadius('md'),
    backgroundColor: BRAND_COLORS.lightGray,
    paddingHorizontal: getSpacing('md'),
    paddingVertical: getSpacing('sm'),
    height: getInputConfig().height,
    justifyContent: 'center',
  },
  selectedCountryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedCountryText: {
    fontSize: getResponsiveValue(getTypographySize('md'), getTypographySize('md') * 1.2), // 20% larger on iPad
    color: BRAND_COLORS.darkNavy,
    flex: 1,
    marginRight: getSpacing('sm'),
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BRAND_COLORS.mediumGray,
    borderRadius: getBorderRadius('md'),
    backgroundColor: BRAND_COLORS.lightGray,
    paddingHorizontal: getSpacing('md'),
    paddingVertical: getSpacing('sm'),
    height: getInputConfig().height,
  },
  searchButtonText: {
    marginLeft: getSpacing('sm'),
    fontSize: getResponsiveValue(getTypographySize('md'), getTypographySize('md') * 1.2), // 20% larger on iPad
    color: BRAND_COLORS.electricBlue,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: getSpacing('lg'),
  },
  dropdown: {
    backgroundColor: BRAND_COLORS.white,
    borderRadius: getBorderRadius('lg'),
    width: '100%',
    maxWidth: getResponsiveValue(400, 600),
    maxHeight: '80%',
    shadowColor: BRAND_COLORS.darkNavy,
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
    padding: getSpacing('md'),
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.lightGray,
  },
  dropdownTitle: {
    fontSize: getResponsiveValue(getTypographySize('lg'), getTypographySize('lg') * 1.2), // 20% larger on iPad
    fontWeight: BRAND_TYPOGRAPHY.weights.semibold,
    color: BRAND_COLORS.darkNavy,
  },
  closeButton: {
    padding: getSpacing('xs'),
  },
  list: {
    maxHeight: getResponsiveValue(400, 500),
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getSpacing('sm'),
    paddingHorizontal: getSpacing('md'),
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.lightGray,
    minHeight: getResponsiveValue(48, 56), // Larger touch targets
  },
  selectedItem: {
    backgroundColor: '#E8F4FD',
  },
  countryName: {
    fontSize: getResponsiveValue(getTypographySize('md'), getTypographySize('md') * 1.2), // 20% larger on iPad
    color: BRAND_COLORS.darkNavy,
    flex: 1,
    marginRight: getSpacing('sm'),
  },
  countryCode: {
    fontSize: getResponsiveValue(getTypographySize('sm'), getTypographySize('sm') * 1.2), // 20% larger on iPad
    color: BRAND_COLORS.darkGray,
    flexShrink: 0,
  },
  selectedText: {
    color: BRAND_COLORS.electricBlue,
    fontWeight: BRAND_TYPOGRAPHY.weights.semibold,
  },
});
