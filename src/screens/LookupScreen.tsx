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
  Switch,
  Dimensions,
  Animated,
  ViewStyle,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MainTabParamList } from '../navigation/types';
import CountryLookup from '../components/CountryLookup';
import { useTariff } from '../hooks/useTariff';
import { useHistory, HistoryItem } from '../hooks/useHistory';
import { useSettings } from '../hooks/useSettings';
import { getCountryName } from '../utils/countries';
import DisclaimerModal from './DisclaimerModal';
import HistoryScreen from './HistoryScreen';
import SettingsScreen from './SettingsScreen';
import LinksScreen from './LinksScreen';
import { isTablet } from '../platform/deviceUtils';
import RightColumnContent from '../components/RightColumnContent';
import { tariffSearchService } from '../services/tariffSearchService';
import { TariffService } from '../services/tariffService';
import { useFocusEffect } from '@react-navigation/native';
import { preventScreenshot, allowScreenshot, addScreenshotListener, removeScreenshotListener } from '../utils/screenshotPrevention';
import { AnimatedDrawer } from '../components/shared/AnimatedDrawer';
import { DiagonalSection } from '../components/shared/DiagonalSection';
import {
  BRAND_COLORS,
  BRAND_TYPOGRAPHY,
  BRAND_SPACING,
  BRAND_SHADOWS,
  BRAND_LAYOUT,
  BRAND_ANIMATIONS,
  getTypographySize,
  getSpacing,
  getBorderRadius,
  getDrawerConfig,
  getFabConfig,
  getInputConfig,
  getButtonConfig,
  getResponsiveValue,
  isTablet as getIsTablet
} from '../config/brandColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FieldWithInfo from '../components/FieldWithInfo';
import InfoDrawer, { InfoFieldKey } from '../components/InfoDrawer';
import { TouchableOpacity as RNTouchableOpacity } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Get tariff service instance
const tariffService = TariffService.getInstance();

// Legacy color mappings for backward compatibility
const COLORS = {
  darkBlue: BRAND_COLORS.darkNavy,
  lightBlue: BRAND_COLORS.electricBlue,
  orange: BRAND_COLORS.orange,
  yellow: '#FFD800',
  white: BRAND_COLORS.white,
  lightGray: BRAND_COLORS.lightGray,
  mediumGray: BRAND_COLORS.mediumGray,
  darkGray: BRAND_COLORS.darkGray,
  black: '#333333',
  error: BRAND_COLORS.error,
  sectionBg: '#F5F7FA',
  borderColor: '#D8E0E9',
  saveButtonBlue: BRAND_COLORS.mediumBlue,
};

// Constants
const RECIPROCAL_TARIFF_TYPE = 'Reciprocal Tariff';

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
  effectiveDate?: string;
  expirationDate?: string;
  unitCount?: string;
  unitCalculations?: {
    costPerUnitWithRT: number;
    costPerUnitWithoutRT?: number;
    additionalPerUnit?: number;
    hasRT: boolean;
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
  htsCode: string;
  description: string;
  effectiveDate: string;
  expirationDate: string;
}

export default function LookupScreen() {
  const navigation = useNavigation<LookupScreenNavigationProp>();
  const route = useRoute<LookupScreenRouteProp>();
  const insets = useSafeAreaInsets();

  // Existing state
  const [htsCode, setHtsCode] = useState('');
      const [selectedCountry, setSelectedCountry] = useState<Country | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [declaredValue, setDeclaredValue] = useState<string>('');
  const [formattedDeclaredValue, setFormattedDeclaredValue] = useState<string>('');
  const [freightCost, setFreightCost] = useState<string>('');
  const [formattedFreightCost, setFormattedFreightCost] = useState<string>('');
  const [unitCount, setUnitCount] = useState<string>('');
  const [formattedUnitCount, setFormattedUnitCount] = useState<string>('');
  const [showInput, setShowInput] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [loadedHistoryTimestamp, setLoadedHistoryTimestamp] = useState<number | null>(null);
  const { findTariffEntry, findTariffEntryAsync, searchByPrefix, calculateDuty, isLoading: isTariffLoading, error } = useTariff();
  const { saveToHistory, history, loadHistory } = useHistory();
  const { settings, isLoading: settingsLoading } = useSettings();

  // Log settings when they change
  useEffect(() => {
    console.log('[LookupScreen] Settings loaded:', {
      autoSaveToHistory: settings.autoSaveToHistory,
      settingsLoading,
    });
  }, [settings, settingsLoading]);

  // Initialize selected country with default from settings
  useEffect(() => {
    if (!selectedCountry && settings?.defaultCountry && !route.params?.historyItem) {
      setSelectedCountry({
        code: settings.defaultCountry,
        name: getCountryName(settings.defaultCountry)
      });
    }
  }, [settings?.defaultCountry, selectedCountry, route.params?.historyItem]);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [pendingHistoryLookup, setPendingHistoryLookup] = useState(false);
  const pendingHistoryItem = useRef<any>(null);
  const currentEntry = useRef<any>(null);
  const currentDutyCalculation = useRef<any>(null);
  const [showRecentHistory, setShowRecentHistory] = useState(isTablet());
  const countryInputRef = useRef<TextInput>(null);
  const declaredValueInputRef = useRef<TextInput>(null);
  const freightCostInputRef = useRef<TextInput>(null);
  const htsCodeInputRef = useRef<TextInput>(null);
  const resultScrollViewRef = useRef<ScrollView>(null);
  const unitEntryRef = useRef<View>(null);
  const [htsSuggestions, setHtsSuggestions] = useState<Array<{code: string; description: string}>>([]);
  const [showHtsSuggestions, setShowHtsSuggestions] = useState(false);
  const [htsSearchMessage, setHtsSearchMessage] = useState<string>('');
  const [showUnitCalculations, setShowUnitCalculations] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const loadingSpinValue = useRef(new Animated.Value(0)).current;
  const [isUSMCAOrigin, setIsUSMCAOrigin] = useState(false);

  // New drawer state
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false);
  const [newsDrawerVisible, setNewsDrawerVisible] = useState(false);
  const [analyticsDrawerVisible, setAnalyticsDrawerVisible] = useState(false);
  const [resultsDrawerVisible, setResultsDrawerVisible] = useState(false);

  // Navigation drawer states
  const [mainHistoryDrawerVisible, setMainHistoryDrawerVisible] = useState(false);
  const [settingsDrawerVisible, setSettingsDrawerVisible] = useState(false);
  const [linksDrawerVisible, setLinksDrawerVisible] = useState(false);

  // Main navigation FAB state
  const [mainFabExpanded, setMainFabExpanded] = useState(false); // closed by default until disclaimer accepted
  const [userClosedFab, setUserClosedFab] = useState(false);

  // Animation values for unified floating menu
  const mainFabRotation = useRef(new Animated.Value(0)).current;
  const menuFabScale = useRef(new Animated.Value(1)).current;
  const menuFabOpacity = useRef(new Animated.Value(1)).current;

  // Individual menu button animations for arc layout (6 buttons)
  const recentFabTranslateX = useRef(new Animated.Value(0)).current;
  const recentFabTranslateY = useRef(new Animated.Value(0)).current;
  const historyFabTranslateX = useRef(new Animated.Value(0)).current;
  const historyFabTranslateY = useRef(new Animated.Value(0)).current;
  const linksFabTranslateX = useRef(new Animated.Value(0)).current;
  const linksFabTranslateY = useRef(new Animated.Value(0)).current;
  const newsFabTranslateX = useRef(new Animated.Value(0)).current;
  const newsFabTranslateY = useRef(new Animated.Value(0)).current;
  const statsFabTranslateX = useRef(new Animated.Value(0)).current;
  const statsFabTranslateY = useRef(new Animated.Value(0)).current;
  const settingsFabTranslateX = useRef(new Animated.Value(0)).current;
  const settingsFabTranslateY = useRef(new Animated.Value(0)).current;

  // Navigation drawer animations
  const historyDrawerTranslateX = useRef(new Animated.Value(getResponsiveValue(SCREEN_WIDTH * 0.85, 400))).current;
  const settingsDrawerTranslateX = useRef(new Animated.Value(-getResponsiveValue(SCREEN_WIDTH * 0.85, 400))).current;
  const linksDrawerTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const navDrawerOpacity = useRef(new Animated.Value(0)).current;

  // after other state declarations add:
  const [infoDrawerVisible, setInfoDrawerVisible] = useState(false);
  const [activeField, setActiveField] = useState<InfoFieldKey>(null);
  const [tabY, setTabY] = useState<number>(0);

  // Opacity for fading info tab (iPhone only)
  const infoTabOpacity = useRef(new Animated.Value(0)).current;

  // Determine if tab should be visible
  const shouldShowInfoTab = !!activeField && !infoDrawerVisible && !isTablet();

  // Animate tab opacity with fade-out then fade-in when field changes or visibility toggles (iPhone)
  const prevVisibleRef = useRef(false);

  useEffect(() => {
    if (isTablet()) return;

    const wasVisible = prevVisibleRef.current;

    if (shouldShowInfoTab && !wasVisible) {
      // Fade in once when becoming visible
      Animated.timing(infoTabOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else if (!shouldShowInfoTab && wasVisible) {
      // Fade out when hiding
      Animated.timing(infoTabOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    prevVisibleRef.current = shouldShowInfoTab;
  }, [shouldShowInfoTab]);

  const fieldRefs = {
    code: useRef<View>(null),
    declared: useRef<View>(null),
    freight: useRef<View>(null),
    units: useRef<View>(null),
  } as const;

  const handleFieldFocus = (field: InfoFieldKey) => {
    // User is interacting with the form – collapse FABs
    closeMainFab();
    setActiveField(field);
    // measure position
    const ref = fieldRefs[field as keyof typeof fieldRefs];
    if (ref && ref.current) {
      ref.current.measureInWindow((_x, y, _w, h) => {
        setTabY(y + h / 2 - 20 - getSpacing('sm')); // align center assuming tab height 40
      });
    }
  };

  const handleInfoPress = (field: InfoFieldKey) => {
    setActiveField(field);
    setInfoDrawerVisible(true);
  };

  useEffect(() => {
    loadHistory();
    // Tariff data is now preloaded in App.tsx
  }, []);

  // Animation effects for navigation drawers
  useEffect(() => {
    animateHistoryDrawer(mainHistoryDrawerVisible);
  }, [mainHistoryDrawerVisible]);

  useEffect(() => {
    animateSettingsDrawer(settingsDrawerVisible);
  }, [settingsDrawerVisible]);

  useEffect(() => {
    animateLinksDrawer(linksDrawerVisible);
  }, [linksDrawerVisible]);

  // Loading modal animation
  useEffect(() => {
    if (showLoadingModal) {
      // Start spinning animation
      Animated.loop(
        Animated.timing(loadingSpinValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      // Reset animation
      loadingSpinValue.setValue(0);
    }
  }, [showLoadingModal]);



  // Update the search function to use async search
  useEffect(() => {
    const searchForSuggestions = async () => {
      if (htsCode.length >= 3) {
        setShowHtsSuggestions(true);
        setHtsSearchMessage('Searching...');

        try {
          console.log('[Search] Searching for:', htsCode);
          // Use the segmented search service for better performance
          const results = await tariffSearchService.searchByPrefix(htsCode, 15);
          console.log('[Search] Results:', results.length);

          setHtsSuggestions(results);
          if (results.length === 0) {
            setHtsSearchMessage('');
          } else {
            setHtsSearchMessage(results.length === 15 ? 'Showing first 15 matches' : '');
          }
        } catch (error) {
          console.error('[Search] Error:', error);
          setHtsSuggestions([]);
          setHtsSearchMessage('Error searching HTS codes');
        }
      } else {
        setShowHtsSuggestions(false);
        setHtsSuggestions([]);
        setHtsSearchMessage('');
      }
    };

    const debounceTimer = setTimeout(searchForSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [htsCode]);

    // Collapse floating menu when form expands/contracts or drawers open
  useEffect(() => {
    const formHasContent = showHtsSuggestions || (selectedCountry && declaredValue); // Collapse when suggestions are shown or when ready to search
    const contentDrawersOpen = resultsDrawerVisible || historyDrawerVisible || newsDrawerVisible || analyticsDrawerVisible;
    const navigationDrawersOpen = mainHistoryDrawerVisible || settingsDrawerVisible || linksDrawerVisible;

    // Collapse main FAB menu when form has content or any drawers are open
    if (formHasContent || contentDrawersOpen || navigationDrawersOpen) {
      closeMainFab();
    }
  }, [showHtsSuggestions, selectedCountry, declaredValue, resultsDrawerVisible, historyDrawerVisible, newsDrawerVisible, analyticsDrawerVisible, mainHistoryDrawerVisible, settingsDrawerVisible, linksDrawerVisible]);

  const handleHtsSelection = (code: string) => {
    setHtsCode(code);
    setShowHtsSuggestions(false);
  };

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

  // Handle freight cost change
  const handleFreightCostChange = (value: string) => {
    // Store the raw value for calculations
    const numericValue = value.replace(/[^\d.]/g, '');
    setFreightCost(numericValue);

    // Format the display value with commas
    setFormattedFreightCost(formatNumberWithCommas(value));
  };

  // Handle unit count change
  const handleUnitCountChange = (value: string) => {
    // Store the raw value for calculations
    const numericValue = value.replace(/[^\d]/g, ''); // No decimals for unit count
    setUnitCount(numericValue);

    // Format the display value with commas
    setFormattedUnitCount(formatNumberWithCommas(numericValue));

    // Hide calculations when value changes (user must click Calc)
    if (showUnitCalculations) {
      setShowUnitCalculations(false);
    }
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

      // Restore freight cost if available
      if (historyItem.freightCost) {
        setFreightCost(historyItem.freightCost.toString());
        setFormattedFreightCost(formatNumberWithCommas(historyItem.freightCost.toString()));
      } else {
        setFreightCost('');
        setFormattedFreightCost('');
      }

      // Restore unit count if available
      if (historyItem.unitCount) {
        setUnitCount(historyItem.unitCount);
        setFormattedUnitCount(formatNumberWithCommas(historyItem.unitCount));
      } else {
        setUnitCount('');
        setFormattedUnitCount('');
      }

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
          fees: historyItem.fees,
          unitCount: historyItem.unitCount,
          unitCalculations: historyItem.unitCalculations,
        });

        // No need for lookup if we have all the data
        setPendingHistoryLookup(false);

        // Mark as already saved since it came from history
        setIsSaved(true);
        // Store the timestamp to prevent re-saving
        setLoadedHistoryTimestamp(historyItem.timestamp);
      } else {
        // Fall back to the original approach if we don't have complete data
        setPendingHistoryLookup(true);
        // Store the timestamp even if we need to do a lookup
        setLoadedHistoryTimestamp(historyItem.timestamp);
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

  // Scroll to bottom when results are displayed
  useEffect(() => {
    if (!showInput && result && resultScrollViewRef.current) {
      setTimeout(() => {
        // Scroll to the bottom to show the save buttons
        // Since header now scrolls with content, we can go all the way down
        resultScrollViewRef.current?.scrollToEnd({
              animated: true
            });
      }, 300); // Delay to ensure content is rendered
    }
  }, [showInput, result]);

  // Scroll to bottom when unit calculations are shown
  useEffect(() => {
    if (showUnitCalculations && resultScrollViewRef.current) {
      setTimeout(() => {
        resultScrollViewRef.current?.scrollToEnd({
              animated: true
            });
      }, 100); // Small delay to ensure calculations are rendered
          }
  }, [showUnitCalculations]);

  // Prevent screenshots when results are shown
  useFocusEffect(
    React.useCallback(() => {
      if (!showInput && result) {
        preventScreenshot();
      }

      return () => {
        allowScreenshot();
      };
    }, [showInput, result])
  );



  // Add screenshot detection
  useEffect(() => {
    if (!showInput && result) {
      const listener = addScreenshotListener(() => {
        Alert.alert(
          'Screenshot Detected',
          'Screenshots of duty calculations are not permitted for security reasons.',
          [{ text: 'OK' }]
        );
      });

      return () => {
        removeScreenshotListener(listener);
      };
    }
  }, [showInput, result]);

  const handleDisclaimerAgree = () => {
    setShowDisclaimer(false);
    openMainFab();
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

  const getLineItemLabel = (component: { label?: string; description?: string; type?: string; rate?: number }) => {
    let baseLabel = '';

    // If the component has a label or description, use that
    if (component.label || component.description) {
      baseLabel = component.label || component.description || '';
    } else {
    // For the type, we'll use a more user-friendly label
    // eslint-disable-next-line react-native/no-raw-text
    if (component.type === RECIPROCAL_TARIFF_TYPE) {
        baseLabel = RECIPROCAL_TARIFF_TYPE;
      } else if (component.type === 'base_duty') {
        baseLabel = 'Base Duty (MFN)';
      } else {
        baseLabel = component.type || '—';
      }
    }

    // Add rate to base duties for clarity
    if (component.type === 'base_duty' && component.rate && component.rate > 0) {
      baseLabel += ` - ${component.rate.toFixed(2)}%`;
    }

    return baseLabel;
  };

  // Update the handleLookup function to use async lookup with loading messages
  const handleLookup = async () => {
    // Hide any floating info tabs or drawers as soon as the user initiates a search
    setActiveField(null);
    setInfoDrawerVisible(false);
    setShowHtsSuggestions(false);

    if (!htsCode || !selectedCountry || !declaredValue) {
      Alert.alert('Missing Information', 'Please enter HTS code, select a country, and enter a declared value.');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setShowLoadingModal(true);
    setLoadedHistoryTimestamp(null); // Clear history timestamp for new lookups

    try {
      // Show loading modal for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));

      const entry = await findTariffEntryAsync(htsCode);
      if (!entry) {
        setShowLoadingModal(false);
        Alert.alert('Not Found', 'HTS code not found in tariff database.');
        setIsLoading(false);
        setLoadingMessage('');
        return;
      }

      currentEntry.current = entry;

      // Dutiable value is declared value ONLY (freight excluded)
      const totalValue = parseFloat(declaredValue);

      const dutyCalculation = calculateDuty(
        htsCode,
        totalValue,
        selectedCountry.code,
        true, // Always treat reciprocal tariffs as additive
        false, // Don't exclude reciprocal tariffs
        isUSMCAOrigin // Pass USMCA origin status
      );

      if (!dutyCalculation) {
        setShowLoadingModal(false);
        Alert.alert('Calculation Error', 'Unable to calculate duty for this combination.');
        setIsLoading(false);
        setLoadingMessage('');
        return;
      }

      currentDutyCalculation.current = dutyCalculation;

      const lookupResult: LookupResult = {
        htsCode: dutyCalculation.htsCode,
        description: dutyCalculation.description,
        dutyRate: dutyCalculation.totalRate,
        totalAmount: dutyCalculation.amount,
        breakdown: dutyCalculation.breakdown,
        components: dutyCalculation.components,
        fees: dutyCalculation.fees,
        effectiveDate: dutyCalculation.effectiveDate,
        expirationDate: dutyCalculation.expirationDate,
      };

      // Update the displayed HTS code with the result
      setHtsCode(dutyCalculation.htsCode);

      // Hide loading modal before showing results
      setShowLoadingModal(false);

      setResult(lookupResult);
      setResultsDrawerVisible(true);

            // Handle auto-save
      console.log('[handleLookup] Auto-save check:', {
        autoSaveEnabled: settings.autoSaveToHistory,
        hasResult: !!lookupResult,
        loadedHistoryTimestamp,
      });

      if (settings.autoSaveToHistory && !loadedHistoryTimestamp) {
        // Only auto-save if this is NOT a result loaded from history
        console.log('[handleLookup] Auto-saving lookup result...');
        const historyItem = {
          htsCode: lookupResult.htsCode,
          description: lookupResult.description,
          countryCode: selectedCountry.code,
          countryName: selectedCountry.name,
          declaredValue: parseFloat(declaredValue),
          freightCost: freightCost ? parseFloat(freightCost) : undefined,
          totalAmount: lookupResult.totalAmount,
          dutyRate: lookupResult.dutyRate,
          breakdown: lookupResult.breakdown,
          components: lookupResult.components,
          fees: lookupResult.fees,
          timestamp: Date.now(),
          unitCount: unitCount || undefined,
          unitCalculations: lookupResult.unitCalculations,
        };

        await saveToHistory(historyItem);
        console.log('[handleLookup] Auto-save completed');
        setIsSaved(true);
      } else if (loadedHistoryTimestamp) {
        // This is a result loaded from history, mark as already saved
        console.log('[handleLookup] Skipping auto-save - result loaded from history with timestamp:', loadedHistoryTimestamp);
        setIsSaved(true);
      } else {
        console.log('[handleLookup] Auto-save disabled, marking as unsaved');
        setIsSaved(false); // Reset saved state for manual save button
      }

      closeMainFab(); // Collapse the floating menu
      closeAllNavigationDrawers();
    } catch (error) {
      console.error('Lookup error:', error);
      setShowLoadingModal(false);
      Alert.alert('Error', 'An error occurred during lookup. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
      setShowLoadingModal(false);
    }
  };

  const handleNewLookup = () => {
    console.log('[handleNewLookup] Called with:', {
      autoSaveEnabled: settings.autoSaveToHistory,
      hasResult: !!result,
      isSaved,
    });

    // If auto-save is on, save automatically
    if (settings.autoSaveToHistory && result && !isSaved) {
      handleSaveToHistory(false).then(() => {
        handleClearAll();
      });
    } else if (!settings.autoSaveToHistory && result && !isSaved) {
      // If auto-save is off and there's an unsaved result, show warning
      Alert.alert(
        'Unsaved Lookup',
        'You have an unsaved lookup. Do you want to save it before starting a new one?',
        [
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => handleClearAll(),
          },
          {
            text: 'Save & New',
            onPress: async () => {
              await handleSaveToHistory(false); // Don't show alert
              handleClearAll();
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } else {
      // No result or already saved, proceed directly
      handleClearAll();
    }
  };



  const handleSaveToHistory = async (showAlert = true) => {
    console.log('[handleSaveToHistory] Called with:', {
      hasResult: !!result,
      hasCountry: !!selectedCountry,
      isSaved,
      showAlert,
      loadedHistoryTimestamp,
    });

    if (!result || !selectedCountry || isSaved) {
      console.log('[handleSaveToHistory] Skipping save - conditions not met');
      return;
    }

    // Check if this is a result loaded from history
    if (loadedHistoryTimestamp) {
      console.log('[handleSaveToHistory] Skipping save - result was loaded from history with timestamp:', loadedHistoryTimestamp);
      setIsSaved(true);
      if (showAlert) {
        Alert.alert('Already Saved', 'This lookup is already in your history.');
      }
      return;
    }

    try {
      const historyItem = {
        htsCode: result.htsCode,
        description: result.description,
        countryCode: selectedCountry.code,
        countryName: selectedCountry.name,
        declaredValue: parseFloat(declaredValue),
        freightCost: freightCost ? parseFloat(freightCost) : undefined,
        totalAmount: result.totalAmount,
        dutyRate: result.dutyRate,
        breakdown: result.breakdown,
        components: result.components,
        fees: result.fees,
        timestamp: Date.now(),
        unitCount: unitCount || undefined,
        unitCalculations: result.unitCalculations,
      };

      await saveToHistory(historyItem);
      setIsSaved(true);

      // Show success feedback only if requested
      if (showAlert) {
        Alert.alert('Saved', 'Lookup saved to history successfully.');
      }
    } catch (error) {
      console.error('Error saving to history:', error);
      if (showAlert) {
        Alert.alert('Error', 'Failed to save to history. Please try again.');
      }
    }
  };

  const handleClearAll = () => {
    // Clear all fields for a completely new lookup
    setHtsCode('');
    setSelectedCountry(undefined);
    setDeclaredValue('');
    setFormattedDeclaredValue('');
    setFreightCost('');
    setFormattedFreightCost('');
    setUnitCount('');
    setFormattedUnitCount('');
    setResult(null);
    setResultsDrawerVisible(false);
    setIsSaved(false);
    setShowUnitCalculations(false);
    setLoadedHistoryTimestamp(null); // Reset the history timestamp
    setIsUSMCAOrigin(false); // Reset USMCA origin

    // Focus on HTS code input for new lookup
    setTimeout(() => {
      htsCodeInputRef.current?.focus();
    }, 100);
  };

  const handleRepeatLookup = () => {
    // Keep the same HTS code, country, declared value, and unit count - just close results
    setResult(null);
    setResultsDrawerVisible(false);
    setIsSaved(false);
    setShowUnitCalculations(false);

    // Focus on declared value input since all data is preserved
    setTimeout(() => {
    declaredValueInputRef.current?.focus();
    }, 100);
  };

  const handleHistoryItemSelection = (historyItem: HistoryItem) => {
    console.log('History item selected:', historyItem);
    setHtsCode(historyItem.htsCode);

    // Ensure we have both country code and name
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

    // Restore freight cost if available
    if (historyItem.freightCost) {
      setFreightCost(historyItem.freightCost.toString());
      setFormattedFreightCost(formatNumberWithCommas(historyItem.freightCost.toString()));
    } else {
      setFreightCost('');
      setFormattedFreightCost('');
    }

    // Restore unit count if available
    if (historyItem.unitCount) {
      setUnitCount(historyItem.unitCount);
      setFormattedUnitCount(formatNumberWithCommas(historyItem.unitCount));
    } else {
      setUnitCount('');
      setFormattedUnitCount('');
    }

    // If we have complete result data, restore it directly
    if (historyItem.totalAmount !== undefined &&
        historyItem.description !== undefined) {

      // Pre-populate the result state with saved data
      setResult({
        htsCode: historyItem.htsCode,
        description: historyItem.description,
        dutyRate: historyItem.dutyRate,
        totalAmount: historyItem.totalAmount,
        breakdown: historyItem.breakdown || [],
        specialRate: historyItem.specialRate,
        components: historyItem.components,
        fees: historyItem.fees,
        unitCount: historyItem.unitCount,
        unitCalculations: historyItem.unitCalculations,
      });

      // Mark as already saved since it came from history
      setIsSaved(true);
      setResultsDrawerVisible(true);
    }

    // Close any open drawers
    closeAllNavigationDrawers();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if the date is today
    if (date.toDateString() === today.toDateString()) {
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

  // New drawer content functions
  const renderHistoryDrawerContent = () => (
    <View style={styles.drawerContent}>
      <View style={styles.drawerHeader}>
        <Ionicons name="time" size={getResponsiveValue(20, 28)} color={BRAND_COLORS.electricBlue} />
        <Text style={styles.drawerTitle}>Recent Lookups</Text>
      </View>
      <ScrollView style={styles.drawerScrollView}>
        {history.slice(0, 10).map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={styles.historyDrawerItem}
            onPress={() => {
              const closeAndNavigate = () => {
                setHistoryDrawerVisible(false);
                navigation.navigate('Lookup', { historyItem: item });
                // Open FAB after selecting history item
                setTimeout(() => {
                  setUserClosedFab(false);
                  openMainFab();
                }, 300);
              };

              // Check for unsaved results before navigating
              if (!settings.autoSaveToHistory && result && !isSaved) {
                Alert.alert(
                  'Unsaved Lookup',
                  'You have an unsaved lookup. Do you want to save it before loading this history item?',
                  [
                    {
                      text: 'Discard',
                      style: 'destructive',
                      onPress: closeAndNavigate,
                    },
                    {
                      text: 'Save & Load',
                      onPress: async () => {
                        await handleSaveToHistory(false);
                        closeAndNavigate();
                      },
                    },
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                  ]
                );
              } else {
                closeAndNavigate();
              }
            }}
          >
            <View style={styles.historyItemRow}>
              <View style={styles.countryFlag}>
                <Text style={styles.countryCode}>{item.countryCode}</Text>
              </View>
              <View style={styles.historyItemInfo}>
                <Text style={styles.historyItemCode}>{item.htsCode}</Text>
                <Text style={styles.historyItemDesc}>
                  {item.description}
                </Text>
                <Text style={styles.historyItemAmount}>
                  {formatCurrency(item.totalAmount)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderNewsDrawerContent = () => (
    <View style={[styles.drawerContent, { paddingTop: 100 }]}>
      <View style={styles.drawerHeader}>
        <Ionicons name="newspaper" size={getResponsiveValue(20, 28)} color={BRAND_COLORS.electricBlue} />
        <Text style={styles.drawerTitle}>Tariff Updates</Text>
      </View>
      <ScrollView style={styles.drawerScrollView}>
        {[
          { title: 'Section 301 Updates', tag: 'China', color: BRAND_COLORS.error },
          { title: 'USMCA Changes', tag: 'Mexico/Canada', color: BRAND_COLORS.success },
          { title: 'GSP Renewals', tag: 'Developing', color: BRAND_COLORS.warning },
          { title: 'Anti-Dumping', tag: 'Steel', color: BRAND_COLORS.info },
        ].map((item, index) => (
          <View key={index} style={styles.newsItem}>
            <View style={[styles.newsTag, { backgroundColor: item.color }]}>
              <Text style={styles.newsTagText}>{item.tag}</Text>
            </View>
            <Text style={styles.newsTitle}>{item.title}</Text>
            <Text style={styles.newsDate}>2 days ago</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderAnalyticsDrawerContent = () => (
    <View style={[styles.drawerContent, { paddingTop: 100 }]}>
      <View style={styles.drawerHeader}>
        <Ionicons name="analytics" size={getResponsiveValue(20, 28)} color={BRAND_COLORS.electricBlue} />
        <Text style={styles.drawerTitle}>Trade Insights</Text>
      </View>
      <ScrollView style={styles.drawerScrollView}>
        {[
          { title: 'Top Searched HTS', value: '8471.30.01', trend: '+12%' },
          { title: 'Avg Duty Rate', value: '7.2%', trend: '-0.3%' },
          { title: 'Most Active Country', value: 'China', trend: '45%' },
          { title: 'Weekly Lookups', value: '1,247', trend: '+8%' },
        ].map((item, index) => (
          <View key={index} style={styles.analyticsCard}>
            <LinearGradient
              colors={[BRAND_COLORS.electricBlue, BRAND_COLORS.darkNavy]}
              style={styles.analyticsGradient}
            >
              <Text style={styles.analyticsTitle}>{item.title}</Text>
              <Text style={styles.analyticsValue}>{item.value}</Text>
              <Text style={styles.analyticsTrend}>{item.trend}</Text>
            </LinearGradient>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  // Results drawer content
  const renderResultsDrawerContent = () => {
    if (!result) return null;

    const currentTimestamp = new Date().toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <View style={styles.resultsDrawerContent}>
        {/* Header */}
        <View style={styles.resultsDrawerHeader}>
          <View style={styles.resultsHeaderLeft}>
            <Text style={styles.resultsDrawerTitle}>Search Results</Text>
            <Text style={styles.resultsDrawerSubtitle}>{result.htsCode} • {selectedCountry?.name}</Text>
            <Text style={styles.resultsDrawerTimestamp}>{currentTimestamp}</Text>
          </View>
          <View style={styles.headerButtons}>
            {settings.autoSaveToHistory ? (
              <View style={[styles.headerButton, styles.autoSaveIndicator]}>
                <Ionicons
                  name="checkmark-circle"
                  size={getResponsiveValue(16, 20)}
                  color={BRAND_COLORS.success}
                />
                <Text style={styles.autoSaveText}>AutoSave On</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.headerButton, styles.saveHeaderButton, isSaved && styles.savedHeaderButton]}
                onPress={() => handleSaveToHistory()}
                disabled={isSaved}
              >
                <Ionicons
                  name={isSaved ? "checkmark-circle" : "bookmark-outline"}
                  size={getResponsiveValue(16, 20)}
                  color={isSaved ? BRAND_COLORS.success : BRAND_COLORS.electricBlue}
                />
                <Text style={[styles.headerButtonText, isSaved && styles.savedHeaderButtonText]}>
                  {isSaved ? 'Saved' : 'Save'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.headerButton, styles.newHeaderButton]}
              onPress={handleNewLookup}
            >
              <Ionicons name="add" size={getResponsiveValue(16, 20)} color={BRAND_COLORS.electricBlue} />
              <Text style={styles.headerButtonText}>New</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.resultsScrollView} showsVerticalScrollIndicator={false}>
          {/* Duties vs Landed Cost */}
          {(() => {
            const dutiableValue = parseFloat(declaredValue);
            const merchandiseValueForLanded = dutiableValue + (freightCost ? parseFloat(freightCost) : 0);
            const landedCost = merchandiseValueForLanded + result.totalAmount;
            return (
              <View style={styles.totalAmountRow}>
                {/* Duties */}
                <View style={[styles.totalAmountCard, { marginRight: 8, flex: 1 }]}>
                  <Text style={styles.totalAmountLabel}>Total Duties & Fees</Text>
                  <Text style={styles.totalAmountValue}>{formatCurrency(result.totalAmount)}</Text>
                  <Text style={styles.totalAmountSubtext}>on {formatCurrency(dutiableValue)} dutiable value</Text>
                </View>
                {/* Landed Cost */}
                <View style={[styles.totalAmountCard, { marginLeft: 8, flex: 1 }]}>
                  <Text style={styles.totalAmountLabel}>Landed Cost</Text>
                  <Text style={styles.totalAmountValue}>{formatCurrency(landedCost)}</Text>
                  <Text style={styles.totalAmountSubtext}>value + duties/fees</Text>
                </View>
              </View>
            );
          })()}

          {/* Compact Breakdown */}
          {result.components && result.components.length > 0 && (
            <View style={styles.compactSection}>
              <Text style={styles.compactSectionTitle}>Duty Breakdown</Text>
              {result.components.map((component, index) => (
                <View key={index} style={styles.compactRow}>
                  <View style={styles.compactRowLeft}>
                    <Text style={styles.compactLabel}>{getLineItemLabel(component)}</Text>
                    {component.rate > 0 && (
                      <Text style={styles.compactRate}>{component.rate.toFixed(2)}%</Text>
                    )}
                  </View>
                  <Text style={styles.compactAmount}>{formatCurrency(component.amount)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Compact Fees */}
          {result.fees && (
            <View style={styles.compactSection}>
              <Text style={styles.compactSectionTitle}>Processing Fees</Text>
              <View style={styles.compactRow}>
                <View style={styles.compactRowLeft}>
                  <Text style={styles.compactLabel}>Merchandise Processing Fee</Text>
                  <Text style={styles.compactRate}>{result.fees.mpf.rate.toFixed(4)}%</Text>
                </View>
                <Text style={styles.compactAmount}>{formatCurrency(result.fees.mpf.amount)}</Text>
              </View>
              <View style={styles.compactRow}>
                <View style={styles.compactRowLeft}>
                  <Text style={styles.compactLabel}>Harbor Maintenance Fee</Text>
                  <Text style={styles.compactRate}>{result.fees.hmf.rate.toFixed(3)}%</Text>
                </View>
                <Text style={styles.compactAmount}>{formatCurrency(result.fees.hmf.amount)}</Text>
              </View>
            </View>
          )}

          {/* Compact Per Unit */}
          {unitCount && parseFloat(unitCount) > 0 ? (
            <View style={styles.compactSection}>
              <Text style={styles.compactSectionTitle}>Per Unit ({formatNumber(parseFloat(unitCount), 0)} units)</Text>
              <View style={styles.compactRow}>
                <Text style={styles.compactLabel}>Duty Cost</Text>
                <Text style={styles.compactAmount}>
                  {formatCurrency(result.totalAmount / parseFloat(unitCount))}
                </Text>
              </View>
              {/* Landed cost per unit */}
              <View style={styles.compactRow}>
                <Text style={styles.compactLabel}>Landed Cost</Text>
                <Text style={styles.compactAmount}>
                  {formatCurrency((parseFloat(declaredValue) + (freightCost ? parseFloat(freightCost) : 0) + result.totalAmount) / parseFloat(unitCount))}
                </Text>
              </View>
              {(() => {
                // Show RT cost separately if applicable
                if (result.components) {
                  const rtComponent = result.components.find(c => c.type === RECIPROCAL_TARIFF_TYPE);
                  if (rtComponent && rtComponent.amount > 0) {
                    return (
              <View style={styles.compactRow}>
                        <Text style={styles.compactLabel}>Addl RT cost</Text>
                <Text style={styles.compactHighlight}>
                          {formatCurrency(rtComponent.amount / parseFloat(unitCount))}
                </Text>
              </View>
                    );
                  }
                }
                return null;
              })()}
            </View>
          ) : (
            <View style={styles.compactMessageSection}>
              <Ionicons name="information-circle-outline" size={getResponsiveValue(14, 18)} color={BRAND_COLORS.info} />
              <Text style={styles.compactMessage}>Enter unit count for per unit calculations</Text>
            </View>
          )}


        </ScrollView>
      </View>
    );
  };





  // Unified floating menu animations with arc layout
  const toggleMainFab = () => {
    const toValue = mainFabExpanded ? 0 : 1;
    const isClosing = mainFabExpanded;
    setMainFabExpanded(!mainFabExpanded);

    // Track if user is manually closing the FAB
    if (isClosing) {
      setUserClosedFab(true);
    }

    // Close any open navigation drawers when toggling main FAB
    if (!mainFabExpanded) {
      closeAllNavigationDrawers();
    }

        // Arc radius and angles for positioning buttons above main FAB
    const radius = getResponsiveValue(120, 173); // Increased radius for larger buttons on iPad (150 * 1.15 = 172.5 ≈ 173)
    const centerAngle = -90; // Point straight up
    const angleSpread = 120; // Total spread of 120 degrees for 6 buttons

    // Calculate positions for 6 buttons in an arc (Recent, History, Links, News, Stats, Settings)
    const recentAngle = (centerAngle - angleSpread/2) * (Math.PI / 180);
    const historyAngle = (centerAngle - angleSpread/2 + angleSpread/5) * (Math.PI / 180);
    const linksAngle = (centerAngle - angleSpread/2 + 2*angleSpread/5) * (Math.PI / 180);
    const newsAngle = (centerAngle - angleSpread/2 + 3*angleSpread/5) * (Math.PI / 180);
    const statsAngle = (centerAngle - angleSpread/2 + 4*angleSpread/5) * (Math.PI / 180);
    const settingsAngle = (centerAngle + angleSpread/2) * (Math.PI / 180);

    Animated.parallel([
      // Rotate main FAB
      Animated.timing(mainFabRotation, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }),
      // Animate menu buttons in arc formation
      Animated.stagger(50, [
        // Recent button
        Animated.parallel([
          Animated.timing(recentFabTranslateX, {
            toValue: toValue * radius * Math.cos(recentAngle),
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(recentFabTranslateY, {
            toValue: toValue * radius * Math.sin(recentAngle),
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        // History button
        Animated.parallel([
          Animated.timing(historyFabTranslateX, {
            toValue: toValue * radius * Math.cos(historyAngle),
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(historyFabTranslateY, {
            toValue: toValue * radius * Math.sin(historyAngle),
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        // Links button
        Animated.parallel([
          Animated.timing(linksFabTranslateX, {
            toValue: toValue * radius * Math.cos(linksAngle),
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(linksFabTranslateY, {
            toValue: toValue * radius * Math.sin(linksAngle),
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        // News button
        Animated.parallel([
          Animated.timing(newsFabTranslateX, {
            toValue: toValue * radius * Math.cos(newsAngle),
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(newsFabTranslateY, {
            toValue: toValue * radius * Math.sin(newsAngle),
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        // Stats button
        Animated.parallel([
          Animated.timing(statsFabTranslateX, {
            toValue: toValue * radius * Math.cos(statsAngle),
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(statsFabTranslateY, {
            toValue: toValue * radius * Math.sin(statsAngle),
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        // Settings button
        Animated.parallel([
          Animated.timing(settingsFabTranslateX, {
            toValue: toValue * radius * Math.cos(settingsAngle),
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(settingsFabTranslateY, {
            toValue: toValue * radius * Math.sin(settingsAngle),
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]),
      // Scale and fade menu buttons
      Animated.timing(menuFabScale, {
        toValue: toValue,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(menuFabOpacity, {
        toValue: toValue,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Close main FAB when other actions are taken
  const closeMainFab = () => {
    // Hide any floating info tab
    setActiveField(null);
    setInfoDrawerVisible(false);

    // Mark that user manually closed the FAB so it won't auto-reopen
    setUserClosedFab(true);

    if (mainFabExpanded) {
      toggleMainFab();
    }
  };

  // Open main FAB
  const openMainFab = () => {
    if (!mainFabExpanded) {
      toggleMainFab();
    }
  };

  // Close all navigation drawers
  const closeAllNavigationDrawers = () => {
    setMainHistoryDrawerVisible(false);
    setSettingsDrawerVisible(false);
    setLinksDrawerVisible(false);
  };

  // Close all drawers (both content and navigation drawers)
  const closeAllDrawers = () => {
    // Close content drawers
    setHistoryDrawerVisible(false);
    setNewsDrawerVisible(false);
    setAnalyticsDrawerVisible(false);
    setResultsDrawerVisible(false);
    // Close navigation drawers
    setMainHistoryDrawerVisible(false);
    setSettingsDrawerVisible(false);
    setLinksDrawerVisible(false);
  };

  // Handle closing results drawer with auto-save
  const handleCloseResultsDrawer = () => {
    console.log('[handleCloseResultsDrawer] Called with:', {
      autoSaveEnabled: settings.autoSaveToHistory,
      hasResult: !!result,
      isSaved,
      loadedHistoryTimestamp,
    });

    const closeAndOpenFab = () => {
      setResultsDrawerVisible(false);
      // Open FAB after closing results
      setTimeout(() => {
        setUserClosedFab(false);
        openMainFab();
      }, 300);
    };

    if (settings.autoSaveToHistory && result && !isSaved && !loadedHistoryTimestamp) {
      // Auto-save when closing drawer (but not if loaded from history)
      console.log('[handleCloseResultsDrawer] Auto-saving...');
      handleSaveToHistory(false).then(() => {
        closeAndOpenFab();
      });
    } else if (!settings.autoSaveToHistory && result && !isSaved) {
      // Show warning if auto-save is off and there's an unsaved result
      Alert.alert(
        'Unsaved Lookup',
        'You have an unsaved lookup. Do you want to save it before closing?',
        [
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => closeAndOpenFab(),
          },
          {
            text: 'Save & Close',
            onPress: async () => {
              await handleSaveToHistory(false);
              closeAndOpenFab();
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } else {
      // No unsaved changes or already saved
      closeAndOpenFab();
    }
  };

  // Navigation drawer animation functions
  const animateHistoryDrawer = (show: boolean) => {
    Animated.parallel([
      Animated.timing(historyDrawerTranslateX, {
        toValue: show ? 0 : getResponsiveValue(SCREEN_WIDTH * 0.85, 400),
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(navDrawerOpacity, {
        toValue: show ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateSettingsDrawer = (show: boolean) => {
    Animated.parallel([
      Animated.timing(settingsDrawerTranslateX, {
        toValue: show ? 0 : -getResponsiveValue(SCREEN_WIDTH * 0.85, 400),
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(navDrawerOpacity, {
        toValue: show ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateLinksDrawer = (show: boolean) => {
    Animated.parallel([
      Animated.timing(linksDrawerTranslateY, {
        toValue: show ? 0 : SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(navDrawerOpacity, {
        toValue: show ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ----------------------
  // Helper: hide floating info tab & suggestions
  // ----------------------
  const hideInfoTabs = () => {
    setActiveField(null);
    setInfoDrawerVisible(false);
    setShowHtsSuggestions(false);
  };

  // Removed automatic open; will open after disclaimer acceptance

  const anyDrawerOpen = historyDrawerVisible || newsDrawerVisible || analyticsDrawerVisible || resultsDrawerVisible || mainHistoryDrawerVisible || settingsDrawerVisible || linksDrawerVisible;

  const handleMainFabPress = () => {
    hideInfoTabs();
    if (anyDrawerOpen) {
      // Close all drawers and return to main Lookup screen
      closeAllDrawers();
      setMainHistoryDrawerVisible(false);
      setSettingsDrawerVisible(false);
      setLinksDrawerVisible(false);
      setHistoryDrawerVisible(false);
      setNewsDrawerVisible(false);
      setAnalyticsDrawerVisible(false);
      setResultsDrawerVisible(false);
      // Optionally scroll to top or reset state here
    } else {
      toggleMainFab();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <DisclaimerModal visible={showDisclaimer} onAgree={handleDisclaimerAgree} />

      {/* Loading Modal */}
      <Modal
        visible={showLoadingModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.loadingModalOverlay}>
          <View style={styles.loadingModalContent}>
            <Animated.View style={[
              styles.loadingSpinnerContainer,
              {
                transform: [{
                  rotate: loadingSpinValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                  })
                }]
              }
            ]}>
              <Ionicons name="time-outline" size={48} color={BRAND_COLORS.electricBlue} />
            </Animated.View>
            <Text style={styles.loadingModalText}>Calculating...</Text>
          </View>
        </View>
      </Modal>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Diagonal Background Section */}
        <DiagonalSection height={getResponsiveValue(SCREEN_HEIGHT * 0.2, SCREEN_HEIGHT * 0.25)} style={styles.heroSection}>
          <View style={[styles.logoContainer, { paddingTop: insets.top + 2 }]}>
              <Image
                source={require('../../assets/Harmony2x.png')}
              style={styles.logo}
                resizeMode="contain"
              />
            </View>
          <View style={styles.dataSourceContainer}>
            <Text style={styles.dataSourceText}>
              Data Last Updated: {tariffService.getLastUpdated() || 'Loading...'} | HTS {tariffService.getHtsRevision() || 'Loading...'}
            </Text>
            <Text style={styles.dataSourceText}>
              Data Sources: U.S. International Trade Commission,{'\n'}Federal Register Notices for Section 301 tariffs (Lists 1–4A).
            </Text>
          </View>
        </DiagonalSection>

        {/* Main Content Area */}
        <ScrollView
          ref={resultScrollViewRef}
          style={styles.mainScrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Input Form - Always visible */}
          <View style={styles.inputSection}>
              <View style={styles.sectionTitleWrapper}>
                <Text style={styles.sectionTitle}>Enter HTS Code, Country & Values</Text>
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper} ref={fieldRefs.code}>
                  <FieldWithInfo
                    placeholder="Code (Enter 3-8 digits to search)"
                    value={htsCode}
                    fieldKey="code"
                    onInfoPress={handleInfoPress}
                    onChangeText={(text) => {
                      const cleanedText = text.replace(/\D/g, '').slice(0, 8);
                      setHtsCode(cleanedText);
                      setUserClosedFab(false);
                      closeMainFab();
                      closeAllNavigationDrawers();
                    }}
                    inputRef={htsCodeInputRef}
                    keyboardType="number-pad"
                    maxLength={8}
                    placeholderTextColor={BRAND_COLORS.electricBlue}
                    style={styles.input}
                    onFocus={() => handleFieldFocus('code')}
                  />

                  {/* HTS Suggestions */}
                  {showHtsSuggestions && (
                  <View style={styles.suggestionsContainer}>
                      {htsSuggestions.length > 0 ? (
                      <ScrollView style={styles.suggestionsScrollView} showsVerticalScrollIndicator={true}>
                          {htsSuggestions.map((suggestion, index) => (
                            <TouchableOpacity
                              key={index}
                              style={styles.suggestionItem}
                              onPress={() => {
                                handleHtsSelection(suggestion.code);
                                closeMainFab();
                                closeAllNavigationDrawers();
                              }}
                            >
                              <Text style={styles.suggestionCode}>{suggestion.code}</Text>
                              <Text style={styles.suggestionDescription}>
                                {suggestion.description}
                              </Text>
                            </TouchableOpacity>
                          ))}
                          {htsSuggestions.length > 5 && (
                            <View style={styles.moreResultsIndicator}>
                              <Ionicons name="chevron-down" size={getResponsiveValue(16, 20)} color={BRAND_COLORS.mediumGray} />
                              <Text style={styles.moreResultsText}>
                                {htsSuggestions.length - 5} more results - scroll to see all
                              </Text>
                            </View>
                      )}
                    </ScrollView>
                      ) : (
                        <View style={styles.notFoundContainer}>
                          <Text style={styles.notFoundText}>Not found</Text>
                        </View>
                      )}
                  </View>
                )}
                </View>
                <View style={styles.inputWrapper}>
                  <CountryLookup
                    ref={countryInputRef}
                    selectedCountry={selectedCountry}
                    onSelect={(country) => {
                      setSelectedCountry(country);
                      setUserClosedFab(false);
                      closeMainFab();
                      closeAllNavigationDrawers();
                    }}
                  />
                </View>
                                 <View style={styles.inputWrapper} ref={fieldRefs.declared}>
                  <FieldWithInfo
                    placeholder="Declared Value (USD)"
                    value={formattedDeclaredValue}
                    fieldKey="declared"
                    onInfoPress={handleInfoPress}
                    onChangeText={(value) => {
                      handleDeclaredValueChange(value);
                      closeMainFab();
                      closeAllNavigationDrawers();
                    }}
                    inputRef={declaredValueInputRef}
                    keyboardType="decimal-pad"
                    placeholderTextColor={BRAND_COLORS.electricBlue}
                    style={styles.input}
                    onFocus={() => handleFieldFocus('declared')}
                  />
                </View>
                <View style={styles.inputWrapper} ref={fieldRefs.freight}>
                  <FieldWithInfo
                    placeholder="Freight Cost in USD (Optional)"
                    value={formattedFreightCost}
                    fieldKey="freight"
                    onInfoPress={handleInfoPress}
                    onChangeText={(value) => {
                      handleFreightCostChange(value);
                      closeMainFab();
                      closeAllNavigationDrawers();
                    }}
                    inputRef={freightCostInputRef}
                    keyboardType="decimal-pad"
                    placeholderTextColor={BRAND_COLORS.electricBlue}
                    style={styles.input}
                    onFocus={() => handleFieldFocus('freight')}
                  />
                </View>
                <View style={styles.inputWrapper} ref={fieldRefs.units}>
                  <FieldWithInfo
                    placeholder="Unit Count (Optional)"
                    value={formattedUnitCount}
                    fieldKey="units"
                    onInfoPress={handleInfoPress}
                    onChangeText={(value) => {
                      handleUnitCountChange(value);
                      closeMainFab();
                      closeAllNavigationDrawers();
                    }}
                    keyboardType="number-pad"
                    placeholderTextColor={BRAND_COLORS.electricBlue}
                    style={styles.input}
                    onFocus={() => handleFieldFocus('units')}
                  />
                </View>

                {/* USMCA Origin Checkbox - Only show for Canada/Mexico */}
                {selectedCountry && (selectedCountry.code === 'CA' || selectedCountry.code === 'MX') && (
                <View style={styles.inputWrapper}>
                <View style={styles.toggleContainer}>
                      <Text style={styles.toggleLabel}>USMCA Origin Certificate</Text>
                  <Switch
                        value={isUSMCAOrigin}
                    onValueChange={(value) => {
                          setIsUSMCAOrigin(value);
                      closeMainFab();
                      closeAllNavigationDrawers();
                    }}
                      trackColor={{ false: BRAND_COLORS.mediumGray, true: BRAND_COLORS.electricBlue }}
                      thumbColor={BRAND_COLORS.white}
                  />
                  </View>
                </View>
                )}
                </View>



                {/* Action Buttons Row */}
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={[styles.searchButton, { marginLeft: 0 }, (isLoading || isTariffLoading) && styles.searchButtonDisabled]}
                    onPress={handleLookup}
                    disabled={isLoading || isTariffLoading}
                  >
                    {isLoading || isTariffLoading ? (
                      <ActivityIndicator color={BRAND_COLORS.white} />
                    ) : (
                      <>
                        <Ionicons name="search" size={getResponsiveValue(18, 22)} color={BRAND_COLORS.white} />
                        <Text style={styles.searchButtonText}>Search</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={handleClearAll}
                  >
                    <Ionicons name="backspace-outline" size={getResponsiveValue(18, 22)} color={BRAND_COLORS.white} />
                    <Text style={styles.clearButtonText}>Clear</Text>
                  </TouchableOpacity>
                </View>

                {/* Loading Message Display */}
                {loadingMessage && (
                  <View style={styles.loadingMessageContainer}>
                    <Text style={styles.loadingMessageText}>{loadingMessage}</Text>
              </View>
                )}
                </View>
        </ScrollView>

        {/* Unified Floating Menu System */}
        <View style={[
          styles.floatingMenuContainer,
          { bottom: (isTablet() ? insets.bottom - 30 : insets.bottom - 20) }
        ]}>
          {/* Menu Buttons in Arc Formation - Recent, History, Links, News, Stats, Settings */}

          {/* Recent Button */}
          <Animated.View
            style={[
              styles.menuFab,
              styles.recentFab,
              { bottom: insets.bottom + getResponsiveValue(28, 37) - 70,
                transform: [
                  { translateX: recentFabTranslateX },
                  { translateY: recentFabTranslateY },
                  { scale: menuFabScale }
                ],
                opacity: menuFabOpacity,
              },
            ]}
          >
                  <TouchableOpacity
              style={[styles.menuFabButton, { backgroundColor: BRAND_COLORS.electricBlue }]}
              onPress={() => {
                closeAllDrawers();
                closeMainFab();
                setHistoryDrawerVisible(true);
              }}
            >
              <Ionicons name="time" size={getResponsiveValue(20, 24)} color={BRAND_COLORS.white} />
                  </TouchableOpacity>
          </Animated.View>

          {/* History Button */}
          <Animated.View
            style={[
              styles.menuFab,
              styles.historyFab,
              {
                bottom: insets.bottom + getResponsiveValue(28, 37) - 70,
                transform: [
                  { translateX: historyFabTranslateX },
                  { translateY: historyFabTranslateY },
                  { scale: menuFabScale },
                ],
                opacity: menuFabOpacity,
              },
            ]}
          >
                    <TouchableOpacity
              style={[styles.menuFabButton, { backgroundColor: BRAND_COLORS.mediumBlue }]}
              onPress={() => {
                closeAllDrawers();
                closeMainFab();
                setMainHistoryDrawerVisible(true);
              }}
            >
              <Ionicons name="library" size={getResponsiveValue(20, 24)} color={BRAND_COLORS.white} />
                    </TouchableOpacity>
          </Animated.View>

          {/* Links Button */}
          <Animated.View
            style={[
              styles.menuFab,
              styles.linksFab,
          { bottom: insets.bottom + getResponsiveValue(28, 37) - 70,
                transform: [
                  { translateX: linksFabTranslateX },
                  { translateY: linksFabTranslateY },
                  { scale: menuFabScale }
                ],
                opacity: menuFabOpacity,
              },
            ]}
          >
                    <TouchableOpacity
              style={[styles.menuFabButton, { backgroundColor: BRAND_COLORS.success }]}
              onPress={() => {
                closeAllDrawers();
                closeMainFab();
                setLinksDrawerVisible(true);
              }}
            >
              <Ionicons name="link" size={getResponsiveValue(20, 24)} color={BRAND_COLORS.white} />
                    </TouchableOpacity>
          </Animated.View>

          {/* News Button */}
          <Animated.View
            style={[
              styles.menuFab,
              styles.newsFab,
              { bottom: insets.bottom + getResponsiveValue(28, 37) - 70,
                transform: [
                  { translateX: newsFabTranslateX },
                  { translateY: newsFabTranslateY },
                  { scale: menuFabScale }
                ],
                opacity: menuFabOpacity,
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.menuFabButton, { backgroundColor: BRAND_COLORS.orange }]}
              onPress={() => {
                closeAllDrawers();
                closeMainFab();
                setNewsDrawerVisible(true);
              }}
            >
              <Ionicons name="newspaper" size={getResponsiveValue(20, 24)} color={BRAND_COLORS.white} />
            </TouchableOpacity>
          </Animated.View>

          {/* Stats Button */}
          <Animated.View
            style={[
              styles.menuFab,
              styles.statsFab,
              { bottom: insets.bottom + getResponsiveValue(28, 37) - 70,
                transform: [
                  { translateX: statsFabTranslateX },
                  { translateY: statsFabTranslateY },
                  { scale: menuFabScale }
                ],
                opacity: menuFabOpacity,
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.menuFabButton, { backgroundColor: BRAND_COLORS.info }]}
              onPress={() => {
                closeAllDrawers();
                closeMainFab();
                setAnalyticsDrawerVisible(true);
              }}
            >
              <Ionicons name="analytics" size={getResponsiveValue(20, 24)} color={BRAND_COLORS.white} />
            </TouchableOpacity>
          </Animated.View>

          {/* Settings Button */}
          <Animated.View
            style={[
              styles.menuFab,
              styles.settingsFab,
              { bottom: insets.bottom + getResponsiveValue(28, 37) - 70,
                transform: [
                  { translateX: settingsFabTranslateX },
                  { translateY: settingsFabTranslateY },
                  { scale: menuFabScale }
                ],
                opacity: menuFabOpacity,
              },
            ]}
          >
                    <TouchableOpacity
              style={[styles.menuFabButton, { backgroundColor: BRAND_COLORS.darkGray }]}
                      onPress={() => {
                closeAllDrawers();
                closeMainFab();
                setSettingsDrawerVisible(true);
              }}
            >
              <Ionicons name="settings" size={getResponsiveValue(20, 24)} color={BRAND_COLORS.white} />
                    </TouchableOpacity>
          </Animated.View>

          {/* Main Floating Menu Button */}
          <Animated.View
            style={[
              styles.mainFloatingFab,
              {
                transform: [
                  {
                    rotate: mainFabRotation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '45deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.mainFloatingFabButton}
              onPress={handleMainFabPress}
            >
              <Ionicons name="menu" size={getResponsiveValue(24, 28)} color={BRAND_COLORS.white} />
            </TouchableOpacity>
          </Animated.View>
                </View>

      {/* Animated Drawers */}
      <AnimatedDrawer
        isVisible={historyDrawerVisible}
        onClose={() => {
          setHistoryDrawerVisible(false);
          // Open FAB after closing history drawer
          setTimeout(() => {
            setUserClosedFab(false);
            openMainFab();
          }, 300);
        }}
        position="bottom"
      >
        {renderHistoryDrawerContent()}
      </AnimatedDrawer>

      <AnimatedDrawer
        isVisible={newsDrawerVisible}
        onClose={() => {
          setNewsDrawerVisible(false);
        }}
        position="right"
      >
        {renderNewsDrawerContent()}
      </AnimatedDrawer>

      <AnimatedDrawer
        isVisible={analyticsDrawerVisible}
        onClose={() => {
          setAnalyticsDrawerVisible(false);
        }}
        position="left"
      >
        {renderAnalyticsDrawerContent()}
      </AnimatedDrawer>

      {/* Results Drawer */}
      <AnimatedDrawer
        isVisible={resultsDrawerVisible}
        onClose={handleCloseResultsDrawer}
        position="bottom"
      >
        {renderResultsDrawerContent()}
      </AnimatedDrawer>

            {/* Navigation Screen Drawers - Custom implementation to avoid ScrollView nesting */}
      {(mainHistoryDrawerVisible || settingsDrawerVisible || linksDrawerVisible) && (
                  <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => {
            const wasHistoryOpen = mainHistoryDrawerVisible;
            setMainHistoryDrawerVisible(false);
            setSettingsDrawerVisible(false);
            setLinksDrawerVisible(false);
            // Open FAB if history drawer was open
            if (wasHistoryOpen) {
              setTimeout(() => {
                setUserClosedFab(false);
                openMainFab();
              }, 300);
            }
          }}
        >
          <Animated.View style={[styles.overlayBackground, { opacity: navDrawerOpacity }]} />
                  </TouchableOpacity>
      )}

      {/* History Drawer */}
                <Animated.View style={[
            styles.drawer,
            styles.rightDrawer,
            {
              transform: [{ translateX: historyDrawerTranslateX }],
              pointerEvents: mainHistoryDrawerVisible ? 'auto' : 'none'
            }
          ]}>
            <View style={styles.drawerScreenContainer}>
                            <HistoryScreen
                visible={mainHistoryDrawerVisible}
                onItemPress={(item) => {
                  // Close the history drawer
                  setMainHistoryDrawerVisible(false);
                  // Populate the form with the selected history item
                  handleHistoryItemSelection(item);
                  // Open FAB after selecting history item
                  setTimeout(() => {
                    setUserClosedFab(false);
                    openMainFab();
                  }, 300);
                }}
              />
            </View>
          </Animated.View>

      {/* Settings Drawer */}
      <Animated.View style={[
        styles.drawer,
        styles.leftDrawer,
        {
          transform: [{ translateX: settingsDrawerTranslateX }],
          pointerEvents: settingsDrawerVisible ? 'auto' : 'none'
        }
      ]}>
        <View style={styles.drawerScreenContainer}>
          <SettingsScreen />
            </View>
      </Animated.View>

      {/* Links Drawer */}
      <Animated.View style={[
        styles.drawer,
        styles.bottomDrawer,
        {
          transform: [{ translateY: linksDrawerTranslateY }],
          pointerEvents: linksDrawerVisible ? 'auto' : 'none'
        }
      ]}>
        <View style={styles.drawerScreenContainer}>
          <LinksScreen />
          </View>
      </Animated.View>
      </View>
      <InfoDrawer
        isOpen={infoDrawerVisible}
        onClose={() => setInfoDrawerVisible(false)}
        field={activeField}
      />
      {/* Info tab for iPhone fades in/out */}
      {!isTablet() && (
        <Animated.View
          pointerEvents={shouldShowInfoTab ? 'auto' : 'none'}
          style={[styles.infoTab, { top: tabY, opacity: infoTabOpacity }]}
        >
          <RNTouchableOpacity
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            onPress={() => setInfoDrawerVisible(true)}
          >
            <Ionicons name="information-circle-outline" size={24} color={BRAND_COLORS.white} />
          </RNTouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

// Get responsive configs
const fabConfig = getFabConfig();
const inputConfig = getInputConfig();
const buttonConfig = getButtonConfig();
const drawerConfig = getDrawerConfig();

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.white,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    position: 'relative',
    zIndex: 1,
  } as ViewStyle,
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: getResponsiveValue(getSpacing('xxl'), getSpacing('md')), // More top padding on iPhone for Dynamic Island
    paddingBottom: getResponsiveValue(getSpacing('xs'), getSpacing('md')), // Tighter gap under the logo on phones, original spacing retained on iPad
    // Exclusion zone based on "H" symbol height - providing breathing room
    paddingHorizontal: getResponsiveValue(60, 80), // Exclusion zone proportional to logo size
  },
  logo: {
    width: getResponsiveValue(SCREEN_WIDTH * 0.6, SCREEN_WIDTH * 0.6), // 50% larger on iPad (0.4 * 1.5 = 0.6)
    height: getResponsiveValue((SCREEN_WIDTH * 0.6) * 0.3, (SCREEN_WIDTH * 0.6) * 0.3), // Maintain aspect ratio
    maxWidth: getResponsiveValue(280, 600), // Increased maximum size for iPad (400 * 1.5 = 600)
    maxHeight: getResponsiveValue(84, 180), // Increased maximum height for iPad (120 * 1.5 = 180)
  },
  mainScrollView: {
    flex: 1,
    // Move main content slightly lower on iPhone to expose more of the blue hero backdrop
    marginTop: getResponsiveValue(-getSpacing('sm'), -getSpacing('xl')), // -8 on phone instead of -20
    zIndex: 2,
  },
  scrollContent: {
    paddingHorizontal: getSpacing('md'),
    paddingTop: getSpacing('lg'),
    paddingBottom: getSpacing('xxxl'),
  },
  inputSection: {
    backgroundColor: BRAND_COLORS.white,
    borderRadius: getBorderRadius('lg'),
    padding: getSpacing('lg'),
    ...BRAND_SHADOWS.medium,
    marginBottom: getSpacing('lg'),
  },
  sectionTitleWrapper: {
    paddingHorizontal: Platform.OS === 'ios' && Platform.isPad ? SCREEN_WIDTH * 0.25 : getSpacing('md'),
    alignItems: 'center',
    width: '100%',
  },
  sectionTitle: {
    fontSize: getResponsiveValue(getTypographySize('md'), getTypographySize('xl')),
    fontWeight: BRAND_TYPOGRAPHY.weights.bold,
    color: BRAND_COLORS.orange,
    marginBottom: getSpacing('md'),
    textAlign: 'center',
    width: Platform.OS === 'ios' && Platform.isPad ? 500 : '100%',
    maxWidth: '100%',
  },
  inputContainer: {
    marginBottom: getSpacing('md'),
  },
  inputWrapper: {
    width: '100%',
    paddingHorizontal: Platform.OS === 'ios' && Platform.isPad ? SCREEN_WIDTH * 0.25 : getSpacing('md'),
    alignItems: 'flex-start',
  },
  input: {
    backgroundColor: BRAND_COLORS.lightGray,
    borderRadius: getBorderRadius('md'),
    paddingHorizontal: getSpacing('md'),
    paddingVertical: getSpacing('sm'),
    fontSize: getResponsiveValue(getTypographySize('md'), getTypographySize('md') * 1.2), // 20% larger on iPad
    color: BRAND_COLORS.darkNavy,
    marginBottom: getSpacing('md'),
    borderWidth: 1,
    borderColor: BRAND_COLORS.mediumGray,
    height: getInputConfig().height,
    width: Platform.OS === 'ios' && Platform.isPad ? 500 : '100%',
    maxWidth: '100%',
  },
  suggestionsContainer: {
    backgroundColor: BRAND_COLORS.white,
    borderRadius: getBorderRadius('md'),
    ...BRAND_SHADOWS.small,
    marginBottom: getSpacing('md'),
    paddingVertical: getSpacing('xs'), // Reduced padding
    minHeight: 0,
    maxHeight: getResponsiveValue(325, 550), // Height for 5 items: 5 * (65/110) = 325/550
    width: Platform.OS === 'ios' && Platform.isPad ? 500 : '100%',
    maxWidth: '100%',
    alignSelf: 'flex-start',
  },
  suggestionsScrollView: {
    maxHeight: getResponsiveValue(325, 550), // Match container height
  },
  suggestionItem: {
    paddingVertical: getResponsiveValue(4, 8), // More padding on iPad for larger text
    paddingHorizontal: getSpacing('sm'),
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.lightGray,
    width: '100%',
    flexShrink: 1,
  },
  suggestionCode: {
    fontSize: getResponsiveValue(getTypographySize('sm'), getTypographySize('md') * 1.2), // Match input field size on iPad
    fontWeight: BRAND_TYPOGRAPHY.weights.semibold,
    color: BRAND_COLORS.electricBlue,
    marginBottom: 1,
    flexShrink: 1,
  },
  suggestionDescription: {
    fontSize: getResponsiveValue(10, getTypographySize('sm') * 1.1), // Slightly smaller on iPad
    color: BRAND_COLORS.darkGray,
    lineHeight: getResponsiveValue(12, getTypographySize('sm') * 1.3), // Proportional line height
    marginTop: 0,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  moreResultsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getSpacing('sm'),
    paddingHorizontal: getSpacing('md'),
    backgroundColor: BRAND_COLORS.lightGray,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.mediumGray,
  },
  moreResultsText: {
    fontSize: getResponsiveValue(getTypographySize('xs'), getTypographySize('sm')),
    color: BRAND_COLORS.mediumGray,
    marginLeft: getSpacing('xs'),
    fontStyle: 'italic',
  },
  notFoundContainer: {
    padding: getSpacing('md'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: getResponsiveValue(getTypographySize('sm'), getTypographySize('md')),
    color: BRAND_COLORS.darkGray,
    fontStyle: 'italic',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BRAND_COLORS.lightGray,
    borderRadius: getBorderRadius('md'),
    padding: getSpacing('md'),
    marginBottom: getSpacing('md'),
    width: Platform.OS === 'ios' && Platform.isPad ? 500 : '100%',
    maxWidth: '100%',
  },
  toggleLabel: {
    fontSize: getResponsiveValue(getTypographySize('md'), getTypographySize('md') * 1.2), // 20% larger on iPad
    color: BRAND_COLORS.darkNavy,
    fontWeight: BRAND_TYPOGRAPHY.weights.medium,
    flex: 1,
  },
  searchButton: {
    backgroundColor: BRAND_COLORS.electricBlue,
    borderRadius: getBorderRadius('md'),
    paddingVertical: getSpacing('md'),
    paddingHorizontal: getSpacing('lg'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...BRAND_SHADOWS.small,
    height: Platform.OS === 'ios' && Platform.isPad ? getButtonConfig().height + 12 : getButtonConfig().height,
    marginLeft: Platform.OS === 'ios' && Platform.isPad ? SCREEN_WIDTH * 0.25 : getSpacing('md'),
    alignSelf: 'flex-start',
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: BRAND_COLORS.white,
    fontSize: getTypographySize('md'),
    fontWeight: BRAND_TYPOGRAPHY.weights.semibold,
    marginLeft: getSpacing('sm'),
    lineHeight: getTypographySize('md') * 1.4, // Adjusted line height for vertical centering
  },
  loadingMessageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getSpacing('md'),
    paddingHorizontal: getSpacing('lg'),
    marginTop: getSpacing('md'),
    marginLeft: Platform.OS === 'ios' && Platform.isPad ? SCREEN_WIDTH * 0.25 : getSpacing('md'),
    alignSelf: 'flex-start',
  },
  loadingMessageText: {
    fontSize: getTypographySize('md'),
    fontWeight: BRAND_TYPOGRAPHY.weights.medium,
    color: BRAND_COLORS.electricBlue,
    textAlign: 'center',
  },

  // Unified Floating Menu Styles
  floatingMenuContainer: {
    position: 'absolute',
    bottom: getSpacing('xs'),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2000,
  },
  menuFab: {
    position: 'absolute',
    bottom: getResponsiveValue(28, 37), // Adjusted spacing for larger buttons on iPad
    alignSelf: 'center',
  },
  menuFabButton: {
    width: getResponsiveValue(48, 64), // 15% larger on iPad (56 * 1.15 = 64.4 ≈ 64)
    height: getResponsiveValue(48, 64), // 15% larger on iPad
    borderRadius: getResponsiveValue(24, 32), // Proportional border radius
    justifyContent: 'center',
    alignItems: 'center',
    ...BRAND_SHADOWS.medium,
  },
  recentFab: {},
  historyFab: {},
  linksFab: {},
  newsFab: {},
  statsFab: {},
  settingsFab: {},
  mainFloatingFab: {
    position: 'relative',
  },
  mainFloatingFabButton: {
    width: getResponsiveValue(56, 74), // 15% larger on iPad (64 * 1.15 = 73.6 ≈ 74)
    height: getResponsiveValue(56, 74), // 15% larger on iPad
    borderRadius: getResponsiveValue(28, 37), // Proportional border radius
    backgroundColor: BRAND_COLORS.darkNavy,
    justifyContent: 'center',
    alignItems: 'center',
    ...BRAND_SHADOWS.large,
  },
  // Drawer content styles
  drawerContent: {
    flex: 1,
    padding: getSpacing('lg'),
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getSpacing('md'),
    paddingBottom: getSpacing('md'),
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.lightGray,
  },
  drawerTitle: {
    fontSize: getTypographySize('lg'),
    fontWeight: BRAND_TYPOGRAPHY.weights.bold,
    color: BRAND_COLORS.darkNavy,
    marginLeft: getSpacing('sm'),
  },
  drawerScrollView: {
    flex: 1,
  },
  historyDrawerItem: {
    backgroundColor: BRAND_COLORS.white,
    borderRadius: getBorderRadius('md'),
    padding: getSpacing('md'),
    marginBottom: getSpacing('sm'),
    ...BRAND_SHADOWS.small,
    minHeight: getResponsiveValue(60, 72),
  },
  historyItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryFlag: {
    width: getResponsiveValue(36, 44),
    height: getResponsiveValue(36, 44),
    borderRadius: getResponsiveValue(18, 22),
    backgroundColor: BRAND_COLORS.electricBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getSpacing('sm'),
  },
  countryCode: {
    color: BRAND_COLORS.white,
    fontSize: getTypographySize('xs'),
    fontWeight: BRAND_TYPOGRAPHY.weights.bold,
  },
  historyItemInfo: {
    flex: 1,
  },
  historyItemCode: {
    fontSize: getTypographySize('md'),
    fontWeight: BRAND_TYPOGRAPHY.weights.semibold,
    color: BRAND_COLORS.darkNavy,
  },
  historyItemDesc: {
    fontSize: getTypographySize('sm'),
    color: BRAND_COLORS.darkGray,
    marginVertical: 2,
  },
  historyItemAmount: {
    fontSize: getTypographySize('sm'),
    fontWeight: BRAND_TYPOGRAPHY.weights.semibold,
    color: BRAND_COLORS.electricBlue,
  },
  newsItem: {
    backgroundColor: BRAND_COLORS.white,
    borderRadius: getBorderRadius('md'),
    padding: getSpacing('md'),
    marginBottom: getSpacing('sm'),
    ...BRAND_SHADOWS.small,
  },
  newsTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: getSpacing('sm'),
    paddingVertical: getSpacing('xs'),
    borderRadius: getBorderRadius('sm'),
    marginBottom: getSpacing('sm'),
  },
  newsTagText: {
    color: BRAND_COLORS.white,
    fontSize: getTypographySize('xs'),
    fontWeight: BRAND_TYPOGRAPHY.weights.semibold,
  },
  newsTitle: {
    fontSize: getTypographySize('md'),
    fontWeight: BRAND_TYPOGRAPHY.weights.semibold,
    color: BRAND_COLORS.darkNavy,
    marginBottom: getSpacing('xs'),
  },
  newsDate: {
    fontSize: getTypographySize('sm'),
    color: BRAND_COLORS.darkGray,
  },
  analyticsCard: {
    marginBottom: getSpacing('sm'),
    borderRadius: getBorderRadius('md'),
    overflow: 'hidden',
    ...BRAND_SHADOWS.small,
  },
  analyticsGradient: {
    padding: getSpacing('md'),
  },
  analyticsTitle: {
    fontSize: getTypographySize('sm'),
    color: BRAND_COLORS.white,
    marginBottom: getSpacing('xs'),
  },
  analyticsValue: {
    fontSize: getTypographySize('lg'),
    fontWeight: BRAND_TYPOGRAPHY.weights.bold,
    color: BRAND_COLORS.white,
    marginBottom: getSpacing('xs'),
  },
  analyticsTrend: {
    fontSize: getTypographySize('sm'),
    color: BRAND_COLORS.white,
    opacity: 0.8,
  },
  // Compact Results Drawer Styles
  resultsDrawerContent: {
    flex: 1,
    backgroundColor: BRAND_COLORS.white,
  },
  resultsDrawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getSpacing('md'),
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.lightGray,
    backgroundColor: BRAND_COLORS.white,
    minHeight: getResponsiveValue(60, 80),
  },
  resultsHeaderLeft: {
    flex: 1,
  },
  resultsDrawerTitle: {
    fontSize: getResponsiveValue(getTypographySize('lg'), getTypographySize('lg') * 1.35), // 35% larger on iPad (reduced from 50%)
    fontWeight: BRAND_TYPOGRAPHY.weights.bold,
    color: BRAND_COLORS.darkNavy,
  },
  resultsDrawerSubtitle: {
    fontSize: getResponsiveValue(getTypographySize('sm'), getTypographySize('sm') * 1.35), // 35% larger on iPad (reduced from 50%)
    color: BRAND_COLORS.electricBlue,
    marginTop: 2,
  },
  resultsDrawerTimestamp: {
    fontSize: getResponsiveValue(getTypographySize('xs'), getTypographySize('xs') * 1.35),
    color: BRAND_COLORS.darkGray,
    marginTop: 4,
    fontStyle: 'italic',
  },
  resultsScrollView: {
    flex: 1,
    padding: getResponsiveValue(getSpacing('md'), getSpacing('lg')), // More padding on iPad to use saved space
    paddingBottom: getSpacing('xl'),
  },
  totalAmountCard: {
    backgroundColor: BRAND_COLORS.electricBlue,
    borderRadius: getBorderRadius('md'),
    padding: getResponsiveValue(getSpacing('sm'), getSpacing('md')),
    alignItems: 'center',
    marginBottom: getSpacing('sm'),
    ...BRAND_SHADOWS.medium,
    minHeight: getResponsiveValue(70, 105), // 30% reduction iPhone (100→70), 25% reduction iPad (140→105)
  },
  totalAmountLabel: {
    fontSize: getResponsiveValue(getTypographySize('xs'), getTypographySize('sm') * 1.35), // 35% larger on iPad (reduced from 50%)
    color: BRAND_COLORS.white,
    opacity: 0.9,
    marginBottom: getResponsiveValue(1, 2), // Reduced margin to save space
  },
  totalAmountValue: {
    fontSize: getResponsiveValue(getTypographySize('xl'), getTypographySize('xxl') * 1.35), // 35% larger on iPad (reduced from 50%)
    fontWeight: BRAND_TYPOGRAPHY.weights.bold,
    color: BRAND_COLORS.white,
    marginBottom: getResponsiveValue(1, 2), // Reduced margin to save space
    textAlign: 'center',
  },
  totalAmountSubtext: {
    fontSize: getResponsiveValue(getTypographySize('xs'), getTypographySize('sm') * 1.35), // 35% larger on iPad (reduced from 50%)
    color: BRAND_COLORS.white,
    opacity: 0.8,
    textAlign: 'center',
  },
  totalAmountBreakdown: {
    fontSize: getResponsiveValue(getTypographySize('xs') * 0.9, getTypographySize('sm') * 1.2), // Slightly smaller than subtext
    color: BRAND_COLORS.white,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  compactSection: {
    backgroundColor: BRAND_COLORS.lightGray,
    borderRadius: getBorderRadius('md'),
    padding: getResponsiveValue(getSpacing('md'), getSpacing('md')), // Reduced padding on iPad to save space
    marginBottom: getResponsiveValue(getSpacing('md'), getSpacing('sm')), // Reduced margin on iPad to save space
  },
  compactSectionTitle: {
    fontSize: getResponsiveValue(getTypographySize('md'), getTypographySize('lg') * 1.35), // 35% larger on iPad (reduced from 50%)
    fontWeight: BRAND_TYPOGRAPHY.weights.semibold,
    color: BRAND_COLORS.darkNavy,
    marginBottom: getResponsiveValue(getSpacing('sm'), getSpacing('xs')), // Reduced margin on iPad to save space
  },
  compactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getResponsiveValue(getSpacing('xs'), getSpacing('xs')), // Reduced padding on iPad to save space
    minHeight: getResponsiveValue(36, 40), // Reduced height on iPad to save space
  },
  compactRowLeft: {
    flex: 1,
    marginRight: getSpacing('md'),
  },
  compactLabel: {
    fontSize: getResponsiveValue(getTypographySize('sm'), getTypographySize('md') * 1.35), // 35% larger on iPad (reduced from 50%)
    color: BRAND_COLORS.darkNavy,
    marginBottom: 1, // Reduced margin to save space
    lineHeight: getResponsiveValue(18, 22 * 1.2), // Tighter line height on iPad to save space
  },
  compactRate: {
    fontSize: getResponsiveValue(getTypographySize('xs'), getTypographySize('sm') * 1.35), // 35% larger on iPad (reduced from 50%)
    color: BRAND_COLORS.darkNavy,
  },
  compactAmount: {
    fontSize: getResponsiveValue(getTypographySize('md'), getTypographySize('lg') * 1.35), // 35% larger on iPad (reduced from 50%)
    fontWeight: BRAND_TYPOGRAPHY.weights.semibold,
    color: BRAND_COLORS.darkNavy,
  },
  compactHighlight: {
    fontSize: getResponsiveValue(getTypographySize('md'), getTypographySize('lg') * 1.35), // 35% larger on iPad (reduced from 50%)
    fontWeight: BRAND_TYPOGRAPHY.weights.bold,
    color: BRAND_COLORS.electricBlue,
  },
  compactMessageSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.lightBlue,
    borderRadius: getBorderRadius('md'),
    padding: getResponsiveValue(getSpacing('md'), getSpacing('md')), // Reduced padding on iPad to save space
    marginBottom: getResponsiveValue(getSpacing('md'), getSpacing('sm')), // Reduced margin on iPad to save space
    minHeight: getResponsiveValue(44, 48), // Reduced height on iPad to save space
  },
  compactMessage: {
    fontSize: getResponsiveValue(getTypographySize('sm') * 1.5, getTypographySize('md') * 1.35), // 35% larger font size on iPad (reduced from 50%)
    color: BRAND_COLORS.white, // Changed to white
    marginLeft: getSpacing('sm'),
    flex: 1,
    lineHeight: getResponsiveValue(18 * 1.5, 22 * 1.35), // Proportional line height increase
  },

  // Header button styles
  headerButtons: {
    flexDirection: 'row',
    gap: getSpacing('sm'),
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getSpacing('sm'),
    paddingVertical: getSpacing('xs'),
    borderRadius: getBorderRadius('md'),
    borderWidth: 1,
    gap: getSpacing('xs'),
    minHeight: getResponsiveValue(32, 40),
  },
  saveHeaderButton: {
    borderColor: BRAND_COLORS.electricBlue,
    backgroundColor: BRAND_COLORS.white,
  },
  savedHeaderButton: {
    borderColor: BRAND_COLORS.success,
    backgroundColor: BRAND_COLORS.lightGray,
  },
  newHeaderButton: {
    borderColor: BRAND_COLORS.electricBlue,
    backgroundColor: BRAND_COLORS.white,
  },
  headerButtonText: {
    fontSize: getResponsiveValue(getTypographySize('sm'), getTypographySize('sm') * 1.35), // 35% larger on iPad (reduced from 50%)
    fontWeight: BRAND_TYPOGRAPHY.weights.medium,
    color: BRAND_COLORS.electricBlue,
  },
  savedHeaderButtonText: {
    color: BRAND_COLORS.success,
  },
  autoSaveIndicator: {
    borderColor: BRAND_COLORS.success,
    backgroundColor: BRAND_COLORS.lightGray,
  },
  autoSaveText: {
    fontSize: getResponsiveValue(getTypographySize('sm'), getTypographySize('sm') * 1.35),
    fontWeight: BRAND_TYPOGRAPHY.weights.medium,
    color: BRAND_COLORS.success,
  },
  dataSourceContainer: {
    paddingHorizontal: getResponsiveValue(getSpacing('md'), getSpacing('lg')),
    paddingBottom: getSpacing('sm'),
    alignItems: 'center',
  },
  dataSourceText: {
    fontSize: getResponsiveValue(getTypographySize('xs') * 0.8, getTypographySize('sm')), // Smaller font on iPhone
    color: BRAND_COLORS.white,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: getResponsiveValue(12, 18), // Reduced line height on iPhone
    marginBottom: getSpacing('xs'),
  },



  // Drawer screen container
  drawerScreenContainer: {
    flex: 1,
    backgroundColor: BRAND_COLORS.white,
  },

  // Custom drawer styles to avoid ScrollView nesting
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlayBackground: {
    flex: 1,
    backgroundColor: 'rgba(10, 26, 62, 0.5)',
  },
  drawer: {
    position: 'absolute',
    backgroundColor: BRAND_COLORS.white,
    zIndex: 1001,
    ...BRAND_SHADOWS.large,
  },
  leftDrawer: {
    left: 0,
    top: 0,
    bottom: 0,
    width: getResponsiveValue(SCREEN_WIDTH * 0.85, 400),
    borderTopRightRadius: getBorderRadius('lg'),
    borderBottomRightRadius: getBorderRadius('lg'),
  },
  rightDrawer: {
    right: 0,
    top: 0,
    bottom: 0,
    width: getResponsiveValue(SCREEN_WIDTH * 0.85, 400),
    borderTopLeftRadius: getBorderRadius('lg'),
    borderBottomLeftRadius: getBorderRadius('lg'),
  },
  bottomDrawer: {
    left: 0,
    right: 0,
    top: 0, // Start from top to use full screen
    bottom: 0,
    borderTopLeftRadius: getBorderRadius('lg'),
    borderTopRightRadius: getBorderRadius('lg'),
  },

  // Loading Modal Styles
  loadingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingModalContent: {
    backgroundColor: BRAND_COLORS.white,
    borderRadius: getBorderRadius('lg'),
    padding: getSpacing('xl'),
    alignItems: 'center',
    ...BRAND_SHADOWS.large,
    minWidth: getResponsiveValue(200, 250),
  },
  loadingSpinnerContainer: {
    marginBottom: getSpacing('md'),
  },
  loadingModalText: {
    fontSize: getTypographySize('lg'),
    fontWeight: BRAND_TYPOGRAPHY.weights.semibold,
    color: BRAND_COLORS.darkNavy,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing('md'),
    paddingHorizontal: Platform.OS === 'ios' && Platform.isPad ? SCREEN_WIDTH * 0.25 : getSpacing('md'),
  },
  clearButton: {
    backgroundColor: BRAND_COLORS.orange,
    borderRadius: getBorderRadius('md'),
    paddingVertical: getSpacing('md'),
    paddingHorizontal: getSpacing('lg'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...BRAND_SHADOWS.small,
    height: Platform.OS === 'ios' && Platform.isPad ? getButtonConfig().height + 12 : getButtonConfig().height,
  },
  clearButtonText: {
    color: BRAND_COLORS.white,
    fontSize: getTypographySize('md'),
    fontWeight: BRAND_TYPOGRAPHY.weights.semibold,
    marginLeft: getSpacing('sm'),
    lineHeight: getTypographySize('md') * 1.4, // Adjusted line height for vertical centering
  },
  infoTab: {
    position: 'absolute',
    left: 0,
    width: 40,
    height: 40,
    backgroundColor: BRAND_COLORS.electricBlue,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...BRAND_SHADOWS.medium,
    zIndex: 3000,
    elevation: 30,
  },
  totalAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing('sm'),
  },
});
