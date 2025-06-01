import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Keyboard,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MainTabParamList } from '../navigation/types';
import CountryLookup from '../components/CountryLookup';
import { useTariff } from '../hooks/useTariff';
import { useHistory, HistoryItem } from '../hooks/useHistory';
import DisclaimerModal from './DisclaimerModal';
import { isTablet } from '../platform/deviceUtils';
import RightColumnContent from '../components/RightColumnContent';

const getLineItemLabel = (component: { label?: string; description?: string; type?: string }) => {
  return component.label || component.description || component.type || '—';
};

// Brand colors
const COLORS = {
  darkBlue: '#023559',
  lightBlue: '#4397EC',
  orange: '#E67E23',
  yellow: '#FFD800',
  white: '#FFFFFF',
  lightGray: '#F8F8F8',
  mediumGray: '#E1E1E1',
  darkGray: '#666666',
  black: '#333333',
  error: '#FF3B30',
  sectionBg: '#F5F7FA',
  borderColor: '#D8E0E9',
};

type LookupScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Lookup'>;
type LookupScreenRouteProp = RouteProp<MainTabParamList, 'Lookup'>;

interface Country {
  code: string;
  name: string;
}

interface LookupResult {
  htsCode: string;
  description: string;
  dutyRate: number;
  totalAmount: number;
  breakdown?: string[];
  specialRate?: {
    rate: number;
    description: string;
  };
  components?: DutyComponent[];
  fees?: {
    mpf: { rate: number; amount: number };
    hmf: { rate: number; amount: number };
  };
}

interface DutyComponent {
  type: string;
  rate: number;
  amount: number;
  label?: string;
  description?: string;
}

interface DutyCalculation {
  components: DutyComponent[];
  breakdown: string[];
  totalRate: number;
  amount: number;
  fees: {
    mpf: { rate: number; amount: number };
    hmf: { rate: number; amount: number };
  };
}

export default function LookupScreen() {
  const navigation = useNavigation<LookupScreenNavigationProp>();
  const route = useRoute<LookupScreenRouteProp>();
  const [htsCode, setHtsCode] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [declaredValue, setDeclaredValue] = useState<string>('');
  const [formattedDeclaredValue, setFormattedDeclaredValue] = useState<string>('');
  const [showInput, setShowInput] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const { findTariffEntry, calculateDuty, isLoading: isTariffLoading, error } = useTariff();
  const { saveToHistory, history, loadHistory } = useHistory();
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [pendingHistoryLookup, setPendingHistoryLookup] = useState(false);
  const pendingHistoryItem = useRef<any>(null);
  const currentEntry = useRef<any>(null);
  const currentDutyCalculation = useRef<any>(null);
  const [showRecentHistory, setShowRecentHistory] = useState(isTablet());
  const countryInputRef = useRef<TextInput>(null);
  const declaredValueInputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  // Format number with commas
  const formatNumberWithCommas = (value: string): string => {
    // Remove any non-digit characters except decimal point
    const cleanValue = value.replace(/[^\d.]/g, '');

    // Handle decimal part separately
    const parts = cleanValue.split('.');
    const wholePart = parts[0];
    const decimalPart = parts.length > 1 ? '.' + parts[1] : '';

    // Add commas to the whole part
    const formattedWholePart = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return formattedWholePart + decimalPart;
  };

  // Handle declared value change
  const handleDeclaredValueChange = (value: string) => {
    // Store the raw value for calculations
    const numericValue = value.replace(/[^\d.]/g, '');
    setDeclaredValue(numericValue);

    // Format the display value with commas
    setFormattedDeclaredValue(formatNumberWithCommas(value));
  };

  // Handle navigation params
  useEffect(() => {
    const historyItem = route.params?.historyItem;
    if (historyItem) {
      console.log('History item received:', historyItem);
      setHtsCode(historyItem.htsCode);

      // Ensure we have both country code and name
      // First try to get from countryCode/countryName fields
      let countryCode = historyItem.countryCode;
      let countryName = historyItem.countryName;

      // If those aren't available, fall back to the country field
      if (!countryCode && historyItem.countryCode) {
        countryCode = historyItem.countryCode;
      }

      if (!countryName && historyItem.countryCode) {
        // Try to find the country name from our countries list
        const countries = [
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

        const foundCountry = countries.find(c => c.code === historyItem.countryCode);
        if (foundCountry) {
          countryName = foundCountry.name;
        } else {
          // If we can't find the name, use the code as the name
          countryName = historyItem.countryCode;
        }
      }

      console.log('Setting country from history:', { code: countryCode, name: countryName });

      setSelectedCountry({
        code: countryCode,
        name: countryName
      });

      // Use the saved declared value instead of hardcoded value
      const savedDeclaredValue = historyItem.declaredValue ? historyItem.declaredValue.toString() : '1000';
      setDeclaredValue(savedDeclaredValue);
      setFormattedDeclaredValue(formatNumberWithCommas(savedDeclaredValue));

      setShowInput(false);
      pendingHistoryItem.current = historyItem;

      // If we have complete result data, restore it directly
      if (historyItem.totalAmount !== undefined &&
          historyItem.description !== undefined) {

        // Pre-populate the result state with saved data
        setResult({
          htsCode: historyItem.htsCode,
          description: historyItem.description,
          dutyRate: historyItem.dutyRate,
          totalAmount: historyItem.totalAmount,
          breakdown: historyItem.breakdown || [], // Add breakdown restoration
          specialRate: historyItem.specialRate, // Add special rate restoration
          components: historyItem.components,
          fees: historyItem.fees
        });

        // No need for lookup if we have all the data
        setPendingHistoryLookup(false);

        // Mark as already saved since it came from history
        setIsSaved(true);
      } else {
        // Fall back to the original approach if we don't have complete data
        setPendingHistoryLookup(true);
      }
    }
  }, [route.params?.historyItem]);

  // Trigger lookup after state is set from history
  useEffect(() => {
    if (pendingHistoryLookup && htsCode && selectedCountry && declaredValue) {
      setPendingHistoryLookup(false);
      handleLookup();
    }
  }, [pendingHistoryLookup, htsCode, selectedCountry, declaredValue]);

  const handleDisclaimerAgree = () => {
    setShowDisclaimer(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    }).format(amount);
  };

  const formatNumber = (num: number, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: true,
    }).format(num);
  };

  // Helper function to extract special rate information from breakdown
  const extractSpecialRate = (breakdown: string[], countryName: string) => {
    // Look for special rate information in the breakdown
    const specialRateItem = breakdown.find(item =>
      item.includes('Special Rate') ||
      item.includes('Preferential Rate') ||
      item.includes('Free Trade Agreement')
    );

    if (specialRateItem) {
      // Extract rate from the item
      const rateMatch = specialRateItem.match(/(\d+(\.\d+)?)%/);
      const rate = rateMatch ? parseFloat(rateMatch[1]) : 0;

      // Create description based on country and program
      let description = `${countryName} `;

      if (specialRateItem.includes('USMCA')) {
        description += 'USMCA Program';
      } else if (specialRateItem.includes('GSP')) {
        description += 'GSP Program';
      } else if (specialRateItem.includes('FTA')) {
        description += 'Free Trade Agreement';
      } else {
        description += 'Special Rate Program';
      }

      return { rate, description };
    }

    return undefined;
  };

  // Extract component descriptions from breakdown data
  const extractComponentDescriptions = (
    components: DutyComponent[],
    breakdown: string[]
  ): DutyComponent[] => {
    return components.map((component: DutyComponent) => {
      let label = '';

      if (component.type === 'general') {
        // Look for MFN or special rate info in breakdown
        const generalItem = breakdown.find((item: string) =>
          item.includes('General Rate') ||
          item.includes('MFN') ||
          item.includes('Column 1')
        );

        if (generalItem) {
          if (generalItem.includes('MFN')) {
            label = 'MFN';
          } else if (generalItem.includes('Special')) {
            label = 'Special Rate';
          } else {
            label = '(General/Special Duties)';
          }
        } else {
          label = '(General/Special Duties)';
        }
      }
      else if (component.type === 'section301') {
        // Look for specific list number in breakdown
        const section301Item = breakdown.find((item: string) => item.includes('Section 301'));

        if (section301Item) {
          const listMatch = section301Item.match(/List (\d+)/i);
          if (listMatch) {
            label = `Section 301 - List ${listMatch[1]}`;
          } else {
            label = 'Section 301 - List #(s)';
          }
        } else {
          label = 'Section 301 - List #(s)';
        }
      }
      else if (component.type === 'truce') {
        // Look for expiration date in breakdown
        const truceItem = breakdown.find((item: string) =>
          item.includes('Truce') || item.includes('Expiration')
        );

        if (truceItem) {
          const dateMatch = truceItem.match(/(\d+\/\d+\/\d+)/);
          if (dateMatch) {
            label = `US-China Truce Rate Expiration ${dateMatch[1]}`;
          } else {
            label = 'US-China Truce Rate Expiration 8/##/2025';
          }
        } else {
          label = 'US-China Truce Rate Expiration 8/##/2025';
        }
      }

      return {
        ...component,
        label
      };
    });
  };

  const handleLookup = async () => {
    if (!htsCode.trim()) {
      Alert.alert('Error', 'Please enter an HTS code');
      return;
    }
    if (!selectedCountry) {
      Alert.alert('Error', 'Please select a country');
      return;
    }
    if (!declaredValue.trim()) {
      Alert.alert('Error', 'Please enter a declared value');
      return;
    }

    const value = parseFloat(declaredValue);
    if (isNaN(value) || value <= 0) {
      Alert.alert('Error', 'Please enter a valid declared value');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setIsSaved(false);

    try {
      const entry = findTariffEntry(htsCode);
      if (!entry) {
        Alert.alert('Error', 'HTS code not found');
        return;
      }

      const dutyCalculation = calculateDuty(htsCode, value, selectedCountry.code);

      // Store the entry and calculation for later use when saving
      currentEntry.current = entry;
      currentDutyCalculation.current = dutyCalculation;

      const formattedBreakdown = dutyCalculation.breakdown.map(item => {
        let formatted = item.replace(/\$(\d+(\.\d{2})?)/g, (match, amount) => {
          return formatCurrency(parseFloat(amount));
        });
        formatted = formatted.replace(/(\d+(\.\d{2})?)%/g, (match, amount) => {
          return `${formatNumber(parseFloat(amount))}%`;
        });
        return formatted;
      });

      // Extract component descriptions from breakdown data
      const componentsWithLabels = extractComponentDescriptions(
        dutyCalculation.components,
        dutyCalculation.breakdown
      );

      // Extract special rate information if available
      const specialRate = extractSpecialRate(dutyCalculation.breakdown, selectedCountry.name);

      const lookupResult: LookupResult = {
        htsCode: entry["HTS Number"],
        description: entry.Description,
        dutyRate: dutyCalculation.totalRate,
        totalAmount: dutyCalculation.amount,
        breakdown: formattedBreakdown,
        specialRate: specialRate,
        components: componentsWithLabels,
        fees: dutyCalculation.fees,
      };

      setResult(lookupResult);
      setShowInput(false);

      // Don't automatically save to history - wait for save button
    } catch (error) {
      Alert.alert('Error', 'Failed to lookup HTS code');
      console.error('Lookup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToHistory = async () => {
    if (!result || !selectedCountry || !declaredValue) {
      Alert.alert('Error', 'No lookup result to save');
      return;
    }

    try {
      const value = parseFloat(declaredValue);
      const entry = currentEntry.current;
      const dutyCalculation = currentDutyCalculation.current;

      if (!entry || !dutyCalculation) {
        console.error('Missing entry or duty calculation data');
        return;
      }

      console.log('Saving to history with country:', {
        code: selectedCountry.code,
        name: selectedCountry.name
      });

      // Save to history with complete data
      await saveToHistory({
        htsCode: entry["HTS Number"],
        countryCode: selectedCountry.code, // Save country code
        countryName: selectedCountry.name, // Save country name
        description: entry.Description,
        dutyRate: dutyCalculation.totalRate,
        declaredValue: value, // Save the declared value
        totalAmount: dutyCalculation.amount, // Save the total amount
        components: dutyCalculation.components, // Save the components
        fees: dutyCalculation.fees, // Save the fees
        breakdown: result.breakdown, // Save the breakdown
        specialRate: result.specialRate, // Save special rate information
      });

      // Mark as saved
      setIsSaved(true);

      // Navigate to History tab
      navigation.navigate('History');
    } catch (error) {
      Alert.alert('Error', 'Failed to save to history');
      console.error('Save error:', error);
    }
  };

  const handleNewLookup = () => {
    setHtsCode('');
    setSelectedCountry(undefined);
    setDeclaredValue('');
    setFormattedDeclaredValue('');
    setResult(null);
    setShowInput(true);
    setIsSaved(false);
    currentEntry.current = null;
    currentDutyCalculation.current = null;
  };

  // Comparison Section calculations for China
  const declared = parseFloat(declaredValue || '0');
  const priorRate = 1.45;
  const currentRate = 0.30;
  const priorAmount = declared * priorRate;
  const currentAmount = declared * currentRate;
  const delta = priorAmount - currentAmount;

  const renderRecentHistory = () => null;

  const handleHistoryItemPress = (item: HistoryItem) => {
    setHtsCode(item.htsCode);
    setSelectedCountry({
      code: item.countryCode,
      name: item.countryName
    });
    setDeclaredValue(item.declaredValue.toString());
    setFormattedDeclaredValue(formatNumberWithCommas(item.declaredValue.toString()));
    setShowInput(false);

    // If we have complete result data, restore it directly
    if (item.totalAmount !== undefined && item.description !== undefined) {
      setResult({
        htsCode: item.htsCode,
        description: item.description,
        dutyRate: item.dutyRate,
        totalAmount: item.totalAmount,
        breakdown: item.breakdown || [],
        specialRate: item.specialRate,
        components: item.components,
        fees: item.fees
      });
      setIsSaved(true);
    }
  };

  const handleHtsCodeSubmit = () => {
    if (htsCode.trim()) {
      countryInputRef.current?.focus();
    }
  };

  const handleCountrySelect = () => {
    declaredValueInputRef.current?.focus();
  };

  const handleDeclaredValueSubmit = () => {
    if (declaredValue.trim() && selectedCountry) {
      Keyboard.dismiss();
      handleLookup();
    }
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
      <Text style={styles.historyItemDescription}>{item.description}</Text>
      <View style={styles.historyItemDetails}>
        <View style={styles.historyItemDetail}>
          <Text style={styles.historyItemCountry}>{item.countryName}</Text>
          {item.totalAmount !== undefined && (
            <Text style={styles.historyItemValue}>{formatCurrency(item.totalAmount)}</Text>
          )}
        </View>
        <Text style={styles.historyItemTimestamp}>{formatDate(item.timestamp)}</Text>
      </View>
    </TouchableOpacity>
  );

  // Add formatDate function
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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <DisclaimerModal visible={showDisclaimer} onAgree={handleDisclaimerAgree} />
      <View style={styles.content}>
        <View style={styles.mainContent}>
          {/* Header Section with Logo */}
          <View style={styles.fixedHeader}>
            <View style={styles.headerContent}>
              <Image
                source={require('../../assets/logo470.png')}
                style={styles.headerLogo}
                resizeMode="contain"
              />
            </View>

            {/* Input Section */}
            {showInput ? (
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={htsCode}
                    onChangeText={setHtsCode}
                    placeholder="Enter HTS Code"
                    keyboardType="number-pad"
                    maxLength={12}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={handleHtsCodeSubmit}
                    blurOnSubmit={false}
                    autoFocus={true}
                  />
                </View>

                <CountryLookup
                  ref={countryInputRef}
                  selectedCountry={selectedCountry}
                  onSelect={(country) => {
                    setSelectedCountry(country);
                    handleCountrySelect();
                  }}
                  onSubmitEditing={handleCountrySelect}
                />

                <View style={styles.inputWrapper}>
                  <TextInput
                    ref={declaredValueInputRef}
                    style={styles.input}
                    value={formattedDeclaredValue}
                    onChangeText={handleDeclaredValueChange}
                    placeholder="Enter Declared Value"
                    keyboardType="decimal-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleDeclaredValueSubmit}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.lookupButton, (isLoading || isTariffLoading) && styles.lookupButtonDisabled]}
                  onPress={handleLookup}
                  disabled={isLoading || isTariffLoading}
                >
                  {isLoading || isTariffLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.lookupButtonText}>Lookup</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.resultHeader}>
                <View style={styles.resultSummary}>
                  <Text style={styles.resultHtsCode}>{result?.htsCode}</Text>
                  <Text style={styles.resultCountry}>{selectedCountry?.name}</Text>
                </View>
                <TouchableOpacity
                  style={styles.newLookupButton}
                  onPress={handleNewLookup}
                >
                  <Ionicons name="refresh" size={18} color={COLORS.white} />
                  <Text style={styles.newLookupButtonText}>New Lookup</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Results Section */}
          {!showInput && result && (
            <ScrollView style={styles.resultContainer}>
              <Text style={styles.lookupResultsTitle}>Lookup results</Text>

              {/* Product Information Section */}
              <View style={styles.sectionContainer}>
                <View style={styles.gridRow}>
                  <Text style={styles.gridLabel}>HTS Code:</Text>
                  <Text style={styles.gridValue}>{result.htsCode}</Text>
                </View>

                <View style={styles.gridRow}>
                  <Text style={styles.gridLabel}>Description:</Text>
                  <Text style={styles.gridValue}>{result.description}</Text>
                </View>

                <View style={styles.gridRow}>
                  <Text style={styles.gridLabel}>Origin Country:</Text>
                  <Text style={styles.gridValue}>{selectedCountry?.name}</Text>
                </View>

                <View style={styles.gridRow}>
                  <Text style={styles.gridLabel}>Entered Value:</Text>
                  <Text style={styles.gridValue}>{formatCurrency(parseFloat(declaredValue))}</Text>
                </View>

                {/* New Fields */}
                {currentEntry.current?.additional_duty && (
                  <View style={styles.gridRow}>
                    <Text style={styles.gridLabel}>Additional Duty:</Text>
                    <Text style={styles.gridValue}>{currentEntry.current.additional_duty}</Text>
                  </View>
                )}

                {currentEntry.current?.begin_effect_date && (
                  <View style={styles.gridRow}>
                    <Text style={styles.gridLabel}>Effective Date:</Text>
                    <Text style={styles.gridValue}>{currentEntry.current.begin_effect_date}</Text>
                  </View>
                )}

                {currentEntry.current?.end_effective_date && (
                  <View style={styles.gridRow}>
                    <Text style={styles.gridLabel}>Expiration Date:</Text>
                    <Text style={styles.gridValue}>{currentEntry.current.end_effective_date}</Text>
                  </View>
                )}
              </View>

              <View style={styles.divider} />

              {/* Estimated Duties & Fees Section */}
              <Text style={styles.sectionTitle}>Estimated Duties & Fees</Text>

              <View style={styles.sectionContainer}>
    {/* Table Header */}
    <View style={styles.tableHeader}>
      <Text style={styles.tableHeaderCell1}>Rate Line Item</Text>
      <Text style={styles.tableHeaderCell2}>Duty/Fee Rate%</Text>
      <Text style={styles.tableHeaderCell3}>Amount</Text>
    </View>

    {/* Table Rows */}
    {result.components && result.components.map((component, index) => (
      <View key={`component-${index}`} style={styles.tableRow}>
  <Text style={styles.tableCell1} numberOfLines={1}>
    {getLineItemLabel(component)}
  </Text>
  <Text style={styles.tableCell2} numberOfLines={1}>
    {formatNumber(component.rate)}%
  </Text>
  <Text style={styles.tableCell3} numberOfLines={1}>
    {formatCurrency(component.amount)}
  </Text>
</View>
))}

                {/* MPF Fee */}
                {result.fees && result.fees.mpf && (
                  <View style={styles.tableRow}>
                    <Text style={styles.tableCell1}>Mdse. Processing (MPF)</Text>
                    <Text style={styles.tableCell2}>{formatNumber(result.fees.mpf.rate, 4)}%</Text>
                    <Text style={styles.tableCell3}>{formatCurrency(result.fees.mpf.amount)}</Text>
                  </View>
                )}

                {/* HMF Fee */}
                {result.fees && result.fees.hmf && (
                  <View style={styles.tableRow}>
                    <Text style={styles.tableCell1}>Harbor Maint. (HMF)</Text>
                    <Text style={styles.tableCell2}>{formatNumber(result.fees.hmf.rate, 4)}%</Text>
                    <Text style={styles.tableCell3}>{formatCurrency(result.fees.hmf.amount)}</Text>
                  </View>
                )}

                {/* Total Row */}
                <View style={styles.totalRow}>
                  <Text style={styles.totalCell1}>Projected Total</Text>
                  <Text style={styles.totalCell3}>{formatCurrency(result.totalAmount)}</Text>
                </View>
              </View>

              {/* Comparison Section - Only for China */}
              {selectedCountry?.code === 'CN' && (
                <>
                  <Text style={[styles.sectionTitle, {marginTop: 24}]}>Comparison</Text>
                  <View style={styles.sectionContainer}>
                    {/* Comparison Table Header */}
                    <View style={styles.tableHeader}>
                      <Text style={styles.tableHeaderCell1}>Tariff War Period</Text>
                      <Text style={styles.tableHeaderCell2}>Additional %</Text>
                      <Text style={styles.tableHeaderCell3}>Amount</Text>
                    </View>
                    {/* Current Rate */}
                    <View style={styles.tableRow}>
                      <Text style={styles.tableCell1}>90-day US/CH Tariff</Text>
                      <Text style={styles.tableCell2}>{formatNumber(currentRate * 100)}%</Text>
                      <Text style={styles.tableCell3}>{formatCurrency(currentAmount)}</Text>
                    </View>
                    {/* Prior Rate */}
                    <View style={styles.tableRow}>
                      <Text style={styles.tableCell1}>Special US/CH Tariff</Text>
                      <Text style={styles.tableCell2}>{formatNumber(priorRate * 100)}%</Text>
                      <Text style={styles.tableCell3}>{formatCurrency(priorAmount)}</Text>
                    </View>
                    {/* Decrease Row */}
                    <View style={styles.totalRow}>
                      <Text style={styles.totalCell1}>Delta</Text>
                      <Text style={styles.decreaseValue}>({formatCurrency(delta)})</Text>
                    </View>
                  </View>
                </>
              )}

              {!isSaved && (
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveToHistory}
                >
                  <Text style={styles.saveButtonText}>Save Results</Text>
                </TouchableOpacity>
              )}

              <View style={styles.disclaimerContainer}>
                <Text style={styles.disclaimerText}>
                  Disclaimer: Duty rates are estimates only and may not reflect all applicable trade programs or restrictions.
                </Text>
              </View>
            </ScrollView>
          )}

          {/* Loading State */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.lightBlue} />
              <Text style={styles.loadingText}>Looking up HTS code...</Text>
            </View>
          )}

          {/* Error State */}
          {error && showInput && (
            <View style={styles.errorContainer}>
              <Ionicons name="warning-outline" size={48} color={COLORS.error} />
              <Text style={styles.errorTitle}>Unable to Load Tariff Data</Text>
              <Text style={styles.errorText}>
                Please check your internet connection and try again.
              </Text>
              <Text style={styles.errorSubtext}>
                The app needs to download tariff data to perform lookups.
              </Text>
            </View>
          )}
        </View>
        {isTablet() && (
          <View style={styles.rightColumn}>
            <RightColumnContent />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    flexDirection: isTablet() ? 'row' : 'column',
    alignItems: 'stretch',
  },
  mainContent: {
    flex: 1,
    padding: 16,
    minWidth: 0, // Prevents overflow on tablets
  },
  fixedHeader: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.mediumGray,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerLogo: {
    width: 300,
  },
  header: {
    flex: 1,
  },
  title: {
    fontSize: isTablet() ? 32 : 26,
    fontWeight: '700',
    color: COLORS.darkBlue,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: isTablet() ? 19 : 15,
    color: COLORS.darkGray,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  inputWrapper: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
    paddingHorizontal: 12,
    height: 48,
    justifyContent: 'center',
  },
  input: {
    fontSize: isTablet() ? 28 : 22,
    color: COLORS.darkBlue,
  },
  lookupButton: {
    backgroundColor: COLORS.orange,
    borderRadius: 8,
    width: 200,
    alignSelf: 'center',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  lookupButtonDisabled: {
    opacity: 0.7,
  },
  lookupButtonText: {
    color: COLORS.white,
    fontSize: isTablet() ? 23 : 18,
    fontWeight: '600',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  resultSummary: {
    flex: 1,
  },
  resultHtsCode: {
    fontSize: isTablet() ? 23 : 18,
    fontWeight: '700',
    color: COLORS.darkBlue,
  },
  resultCountry: {
    fontSize: isTablet() ? 16 : 13,
    color: COLORS.darkGray,
  },
  newLookupButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.orange,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  newLookupButtonText: {
    color: COLORS.white,
    fontSize: isTablet() ? 19 : 15,
    fontWeight: '600',
    marginLeft: 4,
  },
  resultContainer: {
    flex: 1,
    padding: 16,
  },
  lookupResultsTitle: {
    fontSize: isTablet() ? 25 : 20,
    fontWeight: '700',
    color: COLORS.lightBlue,
    marginBottom: 16,
  },
  sectionContainer: {
    backgroundColor: COLORS.sectionBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  gridRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
  },
  gridLabel: {
    flex: 1,
    fontSize: isTablet() ? 18 : 14,
    color: COLORS.darkBlue,
    fontWeight: '500',
  },
  gridValue: {
    flex: 2,
    fontSize: isTablet() ? 18 : 14,
    color: COLORS.black,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.darkGray,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: isTablet() ? 23 : 18,
    fontWeight: '700',
    color: COLORS.lightBlue,
    marginBottom: 16,
  },
  // Table styles
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkGray,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
  },
  tableHeaderCell1: {
    flex: 3.5,
    fontSize: isTablet() ? 18 : 14,
    fontWeight: '600',
    color: COLORS.darkBlue,
    textAlign: 'left',
    flexShrink: 0, // Add this line
  },
  tableHeaderCell2: {
    flex: 2,
    fontSize: isTablet() ? 18 : 14,
    fontWeight: '600',
    color: COLORS.darkBlue,
    textAlign: 'right',
    paddingRight: 8,
    flexShrink: 0, // Add this line
  },
  tableHeaderCell3: {
    flex: 2,
    fontSize: isTablet() ? 18 : 14,
    fontWeight: '600',
    color: COLORS.darkBlue,
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  tableCell1: {
    flex: 3.5,
    fontSize: isTablet() ? 15 : 12,
    color: COLORS.black,
    textAlign: 'left',
    flexShrink: 0, // Add this line
  },
  tableCell2: {
    flex: 2,
    fontSize: isTablet() ? 15 : 12,
    color: COLORS.black,
    textAlign: 'right',
    paddingRight: 8,
    flexShrink: 0, // Add this line
  },
  tableCell3: {
    flex: 2,
    fontSize: isTablet() ? 15 : 12,
    color: COLORS.black,
    textAlign: 'right',
    flexShrink: 0, // Add this line
  },
  totalRow: {
    flexDirection: 'row',
    borderTopWidth: 2,
    borderTopColor: COLORS.darkGray,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
  },
  totalCell1: {
    flex: 5.5,
    fontSize: isTablet() ? 15 : 12,
    fontWeight: '600',
    color: COLORS.lightBlue,
    textAlign: 'right',
    paddingRight: 8,
    flexShrink: 0, // Add this line
  },
  totalCell3: {
    flex: 2,
    fontSize: isTablet() ? 15 : 12,
    fontWeight: '700',
    color: COLORS.lightBlue,
    textAlign: 'right',
    flexShrink: 0, // Add this line
  },
  decreaseValue: {
    flex: 2,
    fontSize: isTablet() ? 15 : 12,
    fontWeight: '700',
    color: COLORS.lightBlue,
    textAlign: 'right',
    flexShrink: 0, // Add this line
  },
  saveButton: {
    backgroundColor: COLORS.orange,
    borderRadius: 8,
    height: 48,
    width: 200,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: isTablet() ? 20 : 16,
    fontWeight: '600',
  },
  disclaimerContainer: {
    marginBottom: 24,
  },
  disclaimerText: {
    fontSize: isTablet() ? 15 : 12,
    color: COLORS.darkGray,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    fontSize: isTablet() ? 20 : 16,
    color: COLORS.darkGray,
    marginTop: 16,
  },
  rightColumn: {
    width: 320,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.mediumGray,
    backgroundColor: COLORS.white,
    height: '100%',
    paddingVertical: 0,
  },
  historyItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyItemHtsCode: {
    fontSize: isTablet() ? 18 : 14,
    fontWeight: '600',
    color: COLORS.darkBlue,
  },
  historyItemDescription: {
    fontSize: isTablet() ? 16 : 12,
    color: COLORS.darkGray,
    marginTop: 4,
    flexShrink: 0, // Add this line
  },
  historyItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    flexShrink: 0, // Add this line
  },
  historyItemDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyItemCountry: {
    fontSize: isTablet() ? 14 : 12,
    color: COLORS.darkGray,
    marginRight: 8,
  },
  historyItemValue: {
    fontSize: isTablet() ? 14 : 12,
    color: COLORS.black,
    flexShrink: 0, // Add this line
  },
  historyItemTimestamp: {
    fontSize: isTablet() ? 14 : 12,
    color: COLORS.darkGray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorTitle: {
    fontSize: isTablet() ? 24 : 20,
    fontWeight: '700',
    color: COLORS.error,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: isTablet() ? 18 : 16,
    color: COLORS.darkGray,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: isTablet() ? 16 : 14,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
});
