import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { isTablet } from "../platform/deviceUtils";
import {
  BRAND_COLORS,
  BRAND_TYPOGRAPHY,
  BRAND_SHADOWS,
  getTypographySize,
  getSpacing,
  getBorderRadius,
  getInputConfig,
  getResponsiveValue,
} from "../config/brandColors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
  { code: "AU", name: "Australia" },
  { code: "BD", name: "Bangladesh" },
  { code: "BH", name: "Bahrain" },
  { code: "BN", name: "Brunei" },
  { code: "BR", name: "Brazil" },
  { code: "CA", name: "Canada" },
  { code: "CH", name: "Switzerland" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CU", name: "Cuba" },
  { code: "DE", name: "Germany" },
  { code: "EU", name: "European Union" },
  { code: "FR", name: "France" },
  { code: "GB", name: "United Kingdom" },
  { code: "HK", name: "Hong Kong" },
  { code: "ID", name: "Indonesia" },
  { code: "IL", name: "Israel" },
  { code: "IN", name: "India" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "KH", name: "Cambodia" },
  { code: "KP", name: "North Korea" },
  { code: "KR", name: "South Korea" },
  { code: "KW", name: "Kuwait" },
  { code: "LA", name: "Laos" },
  { code: "LK", name: "Sri Lanka" },
  { code: "MM", name: "Myanmar" },
  { code: "MO", name: "Macau" },
  { code: "MX", name: "Mexico" },
  { code: "MY", name: "Malaysia" },
  { code: "NO", name: "Norway" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "OM", name: "Oman" },
  { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" },
  { code: "PK", name: "Pakistan" },
  { code: "QA", name: "Qatar" },
  { code: "RU", name: "Russia" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SG", name: "Singapore" },
  { code: "TH", name: "Thailand" },
  { code: "TR", name: "Turkey" },
  { code: "TW", name: "Taiwan" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "US", name: "United States" },
  { code: "VN", name: "Vietnam" },
  { code: "ZA", name: "South Africa" },
].sort((a, b) => a.name.localeCompare(b.name));

const CountryLookup = forwardRef<CountryLookupRef, CountryLookupProps>(
  ({ onSelect, selectedCountry, onSubmitEditing }, ref) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const flatListRef = React.useRef<FlatList>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        setIsExpanded(true);
      },
    }));

    const handleCountrySelect = (country: Country) => {
      onSelect(country);
      setIsExpanded(false);
      onSubmitEditing?.();
    };

    // Scroll to selected country when dropdown opens
    useEffect(() => {
      if (isExpanded && selectedCountry && flatListRef.current) {
        const selectedIndex = countries.findIndex(
          (c) => c.code === selectedCountry.code,
        );
        if (selectedIndex >= 0) {
          setTimeout(() => {
            try {
              flatListRef.current?.scrollToIndex({
                index: selectedIndex,
                animated: true,
                viewPosition: 0.5, // Center the selected item
              });
            } catch (error) {
              // Fallback to scrollToOffset if scrollToIndex fails due to flexible heights
              const approximateOffset = selectedIndex * 50; // Approximate height
              flatListRef.current?.scrollToOffset({
                offset: approximateOffset,
                animated: true,
              });
            }
          }, 100);
        }
      }
    }, [isExpanded, selectedCountry]);

    // Handle keyboard input for quick navigation
    const handleKeyPress = (key: string) => {
      const firstMatchIndex = countries.findIndex((country) =>
        country.name.toLowerCase().startsWith(key.toLowerCase()),
      );
      if (firstMatchIndex >= 0 && flatListRef.current) {
        try {
          flatListRef.current.scrollToIndex({
            index: firstMatchIndex,
            animated: true,
            viewPosition: 0,
          });
        } catch (error) {
          // Fallback to scrollToOffset if scrollToIndex fails due to flexible heights
          const approximateOffset = firstMatchIndex * 50; // Approximate height
          flatListRef.current.scrollToOffset({
            offset: approximateOffset,
            animated: true,
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
              <Ionicons
                name="chevron-down"
                size={getResponsiveValue(20, 24)}
                color={BRAND_COLORS.darkGray}
              />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setIsExpanded(true)}
          >
            <Text style={styles.searchButtonText}>Select Origin</Text>
          </TouchableOpacity>
        )}

        {isExpanded && (
          <View style={styles.inlineDropdown}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select Country</Text>
              <TouchableOpacity
                onPress={() => setIsExpanded(false)}
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={getResponsiveValue(20, 24)}
                  color={BRAND_COLORS.darkGray}
                />
              </TouchableOpacity>
            </View>
            <FlatList
              ref={flatListRef}
              data={countries}
              keyExtractor={(item) => item.code}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    selectedCountry?.code === item.code && styles.selectedItem,
                  ]}
                  onPress={() => handleCountrySelect(item)}
                >
                  <Text
                    style={[
                      styles.countryName,
                      selectedCountry?.code === item.code &&
                        styles.selectedText,
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.countryCode,
                      selectedCountry?.code === item.code &&
                        styles.selectedText,
                    ]}
                  >
                    {item.code}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>
    );
  },
);

CountryLookup.displayName = "CountryLookup";

export default CountryLookup;

const styles = StyleSheet.create({
  closeButton: {
    padding: getSpacing("xs"),
  },
  container: {
    maxWidth: "100%",
    position: "relative",
    width: "100%", // Full width of parent
  },
  countryCode: {
    fontSize: getResponsiveValue(
      getTypographySize("sm") * 1.2,
      getTypographySize("sm") * 1.4,
    ), // Larger for better readability
    color: BRAND_COLORS.darkGray,
    flexShrink: 0,
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
  },
  countryItem: {
    alignItems: "center",
    borderBottomColor: BRAND_COLORS.lightGray,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: getSpacing("sm"),
    paddingVertical: getResponsiveValue(8, 10),
  },
  countryName: {
    fontSize: getResponsiveValue(
      getTypographySize("md") * 1.3,
      getTypographySize("md") * 1.5,
    ), // Larger for better readability
    color: BRAND_COLORS.darkNavy,
    flex: 1,
    marginRight: getSpacing("sm"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
  },

  dropdownHeader: {
    alignItems: "center",
    borderBottomColor: BRAND_COLORS.lightGray,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: getSpacing("sm"),
    paddingVertical: getSpacing("xs"),
  },
  dropdownTitle: {
    fontSize: getResponsiveValue(
      getTypographySize("lg") * 1.2,
      getTypographySize("lg") * 1.4,
    ), // Larger for consistency
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: BRAND_COLORS.darkNavy,
  },
  inlineDropdown: {
    backgroundColor: BRAND_COLORS.white,
    borderRadius: getBorderRadius("md"),
    left: 0,
    position: "absolute",
    right: 0,
    top: "100%",
    ...BRAND_SHADOWS.medium,
    elevation: 50000,
    marginTop: getSpacing("xs"),
    maxHeight: getResponsiveValue(200, 250),
    zIndex: 50000,
  },
  list: {
    maxHeight: getResponsiveValue(400, 500),
  },
  searchButton: {
    alignItems: "center",
    backgroundColor: BRAND_COLORS.lightGray,
    borderColor: BRAND_COLORS.mediumGray,
    borderRadius: getBorderRadius("md"),
    borderWidth: 1,
    flexDirection: "row",
    height: getResponsiveValue(46, 54), // Adjusted height
    paddingHorizontal: getSpacing("md"),
    paddingVertical: getResponsiveValue(6, 8), // Adjusted vertical padding
    width: "100%",
  },
  searchButtonText: {
    color: BRAND_COLORS.electricBlue,
    flex: 1,
    fontSize: getResponsiveValue(
      getTypographySize("md") * 1.5 * 0.75, // 75% of current size
      getTypographySize("md") * 1.8 * 0.75, // 75% of current size
    ),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
  },
  selectedCountry: {
    backgroundColor: BRAND_COLORS.lightGray,
    borderColor: BRAND_COLORS.mediumGray,
    borderRadius: getBorderRadius("md"),
    borderWidth: 1,
    height: getResponsiveValue(46, 54), // Adjusted height
    justifyContent: "center",
    paddingHorizontal: getSpacing("md"),
    paddingVertical: getResponsiveValue(6, 8), // Adjusted vertical padding
    width: "100%",
  },
  selectedCountryContent: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  selectedCountryText: {
    fontSize: getResponsiveValue(
      getTypographySize("md") * 1.5 * 0.75, // 75% of current size
      getTypographySize("md") * 1.8 * 0.75, // 75% of current size
    ),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.darkNavy,
    flex: 1,
    marginRight: getSpacing("sm"),
  },
  selectedItem: {
    backgroundColor: "#E8F4FD",
  },
  selectedText: {
    color: BRAND_COLORS.electricBlue,
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
  },
});
