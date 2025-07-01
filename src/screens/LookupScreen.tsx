/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, react-native/no-inline-styles, react-native/no-color-literals, react-native/sort-styles, react-native/no-unused-styles, @typescript-eslint/no-require-imports */
import React, { useState, useEffect, useRef } from "react";
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
  useWindowDimensions,
  ImageStyle,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MainTabParamList } from "../navigation/types";
import CountryLookup from "../components/CountryLookup";
import { useTariff } from "../hooks/useTariff";
import { useHistory, HistoryItem } from "../hooks/useHistory";
import { useSettings } from "../hooks/useSettings";
import { getCountryName } from "../utils/countries";
import DisclaimerModal from "./DisclaimerModal";
import HistoryScreen from "./HistoryScreen";
import SettingsScreen from "./SettingsScreen";
import LinksScreen from "./LinksScreen";
import TariffNewsContent from "../components/TariffNewsContent";
import { isTablet } from "../platform/deviceUtils";
import RightColumnContent from "../components/RightColumnContent";
import HistoryColumnContent from "../components/HistoryColumnContent";
import { tariffSearchService } from "../services/tariffSearchService";
import { TariffService } from "../services/tariffService";
import { useFocusEffect } from "@react-navigation/native";
import {
  preventScreenshot,
  allowScreenshot,
  addScreenshotListener,
  removeScreenshotListener,
} from "../utils/screenshotPrevention";
import { AnimatedDrawer } from "../components/shared/AnimatedDrawer";
import { DiagonalSection } from "../components/shared/DiagonalSection";
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
  getTradeNewsDrawerConfig,
  getFabConfig,
  getInputConfig,
  getButtonConfig,
  getResponsiveValue,
  isTablet as getIsTablet,
} from "../config/brandColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FieldWithInfo from "../components/FieldWithInfo";
import InfoDrawer, { InfoFieldKey } from "../components/InfoDrawer";

// Keyboard-aware scrolling
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import FirstTimeGuideScreen from "./FirstTimeGuideScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { haptics } from "../utils/haptics";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const GUIDE_STORAGE_KEY = "@HarmonyTi:hasSeenFirstTimeGuide";

// Get tariff service instance
const tariffService = TariffService.getInstance();

// Legacy color mappings for backward compatibility
const COLORS = {
  darkBlue: BRAND_COLORS.darkNavy,
  lightBlue: BRAND_COLORS.electricBlue,
  orange: BRAND_COLORS.orange,
  yellow: "#FFD800",
  white: BRAND_COLORS.white,
  lightGray: BRAND_COLORS.lightGray,
  mediumGray: BRAND_COLORS.mediumGray,
  darkGray: BRAND_COLORS.darkGray,
  black: "#333333",
  error: BRAND_COLORS.error,
  sectionBg: "#F5F7FA",
  borderColor: "#D8E0E9",
  saveButtonBlue: BRAND_COLORS.mediumBlue,
};

// Toggle to visually debug header tab placement during layout tweaks
const _DEBUG_HEADER_TAB = false;

// Constants
const RECIPROCAL_TARIFF_TYPE = "Reciprocal Tariff";

type LookupScreenNavigationProp = BottomTabNavigationProp<
  MainTabParamList,
  "Lookup"
>;
type LookupScreenRouteProp = RouteProp<MainTabParamList, "Lookup">;

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

  // Debug logging
  console.log(
    "[LookupScreen] Render - showFirstTimeGuide state will be logged in useEffect",
  );

  // Existing state
  const [htsCode, setHtsCode] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [declaredValue, setDeclaredValue] = useState<string>("");
  const [formattedDeclaredValue, setFormattedDeclaredValue] =
    useState<string>("");
  const [freightCost, setFreightCost] = useState<string>("");
  const [formattedFreightCost, setFormattedFreightCost] = useState<string>("");
  const [unitCount, setUnitCount] = useState<string>("");
  const [formattedUnitCount, setFormattedUnitCount] = useState<string>("");
  const [showInput, setShowInput] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [loadedHistoryTimestamp, setLoadedHistoryTimestamp] = useState<
    number | null
  >(null);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const { saveToHistory, history, loadHistory } = useHistory();
  const { settings, isLoading: settingsLoading } = useSettings();

  // Log settings when they change
  useEffect(() => {
    console.log("[LookupScreen] Settings loaded:", {
      autoSaveToHistory: settings.autoSaveToHistory,
      settingsLoading,
    });
  }, [settings, settingsLoading]);

  // Initialize selected country with default from settings
  useEffect(() => {
    if (
      !selectedCountry &&
      settings?.defaultCountry &&
      !route.params?.historyItem
    ) {
      setSelectedCountry({
        code: settings.defaultCountry,
        name: getCountryName(settings.defaultCountry),
      });
    }
  }, [settings?.defaultCountry, selectedCountry, route.params?.historyItem]);

  const [pendingHistoryLookup, setPendingHistoryLookup] = useState(false);
  const pendingHistoryItem = useRef<any>(null);
  const currentEntry = useRef<any>(null);
  const currentDutyCalculation = useRef<any>(null);
  const [showRecentHistory, setShowRecentHistory] = useState(isTablet());
  const countryInputRef = useRef<TextInput>(null);
  const declaredValueInputRef = useRef<TextInput>(null);
  const freightCostInputRef = useRef<TextInput>(null);
  const htsCodeInputRef = useRef<TextInput>(null);
  // Use generic ref to support both ScrollView and KeyboardAwareScrollView
  const resultScrollViewRef = useRef<any>(null);
  const unitEntryRef = useRef<View>(null);
  const [htsSuggestions, setHtsSuggestions] = useState<
    Array<{ code: string; description: string }>
  >([]);
  const [showHtsSuggestions, setShowHtsSuggestions] = useState(false);
  const [htsSearchMessage, setHtsSearchMessage] = useState<string>("");
  const [showUnitCalculations, setShowUnitCalculations] = useState(
    settings.showUnitCalculations ?? false,
  );
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const loadingSpinValue = useRef(new Animated.Value(0)).current;
  const [isUSMCAOrigin, setIsUSMCAOrigin] = useState(false);

  // New drawer state
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false);
  const [newsDrawerVisible, setNewsDrawerVisible] = useState(false);
  const [analyticsDrawerVisible, setAnalyticsDrawerVisible] = useState(false);
  const [resultsDrawerVisible, setResultsDrawerVisible] = useState(false);

  // Navigation drawer states
  const [mainHistoryDrawerVisible, setMainHistoryDrawerVisible] =
    useState(false);
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
  const historyDrawerTranslateX = useRef(
    new Animated.Value(getResponsiveValue(SCREEN_WIDTH * 0.85, 400)),
  ).current;
  const settingsDrawerTranslateX = useRef(
    new Animated.Value(-getResponsiveValue(SCREEN_WIDTH * 0.85, 400)),
  ).current;
  const linksDrawerTranslateY = useRef(
    new Animated.Value(SCREEN_HEIGHT),
  ).current;
  const navDrawerOpacity = useRef(new Animated.Value(0)).current;

  // after other state declarations add:
  const [infoDrawerVisible, setInfoDrawerVisible] = useState(false);
  const [activeField, setActiveField] = useState<InfoFieldKey | null>(null);
  const [tabY, setTabY] = useState<number>(0);
  const [showFirstTimeGuide, setShowFirstTimeGuide] = useState(false);

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
        setTabY(y + h / 2 - 20 - getSpacing("sm")); // align center assuming tab height 40
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
        }),
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
        setHtsSearchMessage("Searching...");

        try {
          console.log("[Search] Searching for:", htsCode);
          // Use the segmented search service for better performance
          const results = await tariffSearchService.searchByPrefix(htsCode, 15);
          console.log("[Search] Results:", results.length);

          setHtsSuggestions(results);
          if (results.length === 0) {
            setHtsSearchMessage("");
          } else {
            setHtsSearchMessage(
              results.length === 15 ? "Showing first 15 matches" : "",
            );
          }
        } catch (error) {
          console.error("[Search] Error:", error);
          setHtsSuggestions([]);
          setHtsSearchMessage("Error searching HTS codes");
        }
      } else {
        setShowHtsSuggestions(false);
        setHtsSuggestions([]);
        setHtsSearchMessage("");
      }
    };

    const debounceTimer = setTimeout(searchForSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [htsCode]);

  // Collapse floating menu when form expands/contracts or drawers open
  useEffect(() => {
    const formHasContent =
      showHtsSuggestions || (selectedCountry && declaredValue); // Collapse when suggestions are shown or when ready to search
    const contentDrawersOpen =
      resultsDrawerVisible ||
      historyDrawerVisible ||
      newsDrawerVisible ||
      analyticsDrawerVisible;
    const navigationDrawersOpen =
      mainHistoryDrawerVisible || settingsDrawerVisible || linksDrawerVisible;

    // Collapse main FAB menu when form has content or any drawers are open
    if (formHasContent || contentDrawersOpen || navigationDrawersOpen) {
      closeMainFab();
    }
  }, [
    showHtsSuggestions,
    selectedCountry,
    declaredValue,
    resultsDrawerVisible,
    historyDrawerVisible,
    newsDrawerVisible,
    analyticsDrawerVisible,
    mainHistoryDrawerVisible,
    settingsDrawerVisible,
    linksDrawerVisible,
  ]);

  const handleHtsSelection = (code: string) => {
    haptics.selection();
    setHtsCode(code);
    setShowHtsSuggestions(false);
  };

  // Format number with commas
  const formatNumberWithCommas = (value: string): string => {
    // Remove any non-digit characters except decimal point
    const cleanValue = value.replace(/[^\d.]/g, "");

    // Handle decimal part separately
    const parts = cleanValue.split(".");
    const wholePart = parts[0];
    const decimalPart = parts.length > 1 ? "." + parts[1] : "";

    // Add commas to the whole part
    const formattedWholePart = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    return formattedWholePart + decimalPart;
  };

  // Handle declared value change
  const handleDeclaredValueChange = (value: string) => {
    // Store the raw value for calculations
    const numericValue = value.replace(/[^\d.]/g, "");
    setDeclaredValue(numericValue);

    // Format the display value with commas
    setFormattedDeclaredValue(formatNumberWithCommas(value));
  };

  // Handle freight cost change
  const handleFreightCostChange = (value: string) => {
    // Store the raw value for calculations
    const numericValue = value.replace(/[^\d.]/g, "");
    setFreightCost(numericValue);

    // Format the display value with commas
    setFormattedFreightCost(formatNumberWithCommas(value));
  };

  // Handle unit count change
  const handleUnitCountChange = (value: string) => {
    // Store the raw value for calculations
    const numericValue = value.replace(/[^\d]/g, ""); // No decimals for unit count
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
      console.log("History item received:", historyItem);
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
        ];

        const foundCountry = countries.find(
          (c) => c.code === historyItem.countryCode,
        );
        if (foundCountry) {
          countryName = foundCountry.name;
        } else {
          // If we can't find the name, use the code as the name
          countryName = historyItem.countryCode;
        }
      }

      console.log("Setting country from history:", {
        code: countryCode,
        name: countryName,
      });

      setSelectedCountry({
        code: countryCode,
        name: countryName,
      });

      // Use the saved declared value instead of hardcoded value
      const savedDeclaredValue = historyItem.declaredValue
        ? historyItem.declaredValue.toString()
        : "1000";
      setDeclaredValue(savedDeclaredValue);
      setFormattedDeclaredValue(formatNumberWithCommas(savedDeclaredValue));

      // Restore freight cost if available
      if (historyItem.freightCost) {
        setFreightCost(historyItem.freightCost.toString());
        setFormattedFreightCost(
          formatNumberWithCommas(historyItem.freightCost.toString()),
        );
      } else {
        setFreightCost("");
        setFormattedFreightCost("");
      }

      // Restore unit count if available
      if (historyItem.unitCount) {
        setUnitCount(historyItem.unitCount);
        setFormattedUnitCount(formatNumberWithCommas(historyItem.unitCount));
      } else {
        setUnitCount("");
        setFormattedUnitCount("");
      }

      setShowInput(false);
      pendingHistoryItem.current = historyItem;

      // If we have complete result data, restore it directly
      if (
        historyItem.totalAmount !== undefined &&
        historyItem.description !== undefined
      ) {
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
          animated: true,
        });
      }, 300); // Delay to ensure content is rendered
    }
  }, [showInput, result]);

  // Sync showUnitCalculations with settings
  useEffect(() => {
    setShowUnitCalculations(settings.showUnitCalculations ?? false);
    // Clear unit count when setting is turned off
    if (!(settings.showUnitCalculations ?? false)) {
      setUnitCount("");
      setFormattedUnitCount("");
    }
  }, [settings.showUnitCalculations]);

  // Scroll to bottom when unit calculations are shown
  useEffect(() => {
    if (showUnitCalculations && resultScrollViewRef.current) {
      setTimeout(() => {
        resultScrollViewRef.current?.scrollToEnd({
          animated: true,
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
    }, [showInput, result]),
  );

  // Add screenshot detection
  useEffect(() => {
    if (!showInput && result) {
      const listener = addScreenshotListener(() => {
        Alert.alert(
          "Screenshot Detected",
          "Screenshots of duty calculations are not permitted for security reasons.",
          [{ text: "OK" }],
        );
      });

      return () => {
        removeScreenshotListener(listener);
      };
    }
  }, [showInput, result]);

  const handleDisclaimerAgree = () => {
    haptics.success();
    setShowDisclaimer(false);
    // The useEffect listening to showDisclaimer will handle showing the guide
    openMainFab();
  };

  const handleGuideClose = async (dontShowAgain: boolean) => {
    setShowFirstTimeGuide(false);
    if (dontShowAgain) {
      try {
        await AsyncStorage.setItem(GUIDE_STORAGE_KEY, "true");
      } catch (e) {
        console.error("Failed to save first time guide preference.", e);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    }).format(amount);
  };

  const formatNumber = (num: number, decimals = 2) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: true,
    }).format(num);
  };

  // Helper function to extract special rate information from breakdown
  const extractSpecialRate = (breakdown: string[], countryName: string) => {
    // Look for special rate information in the breakdown
    const specialRateItem = breakdown.find(
      (item) =>
        item.includes("Special Rate") ||
        item.includes("Preferential Rate") ||
        item.includes("Free Trade Agreement"),
    );

    if (specialRateItem) {
      // Extract rate from the item
      const rateMatch = specialRateItem.match(/(\d+(\.\d+)?)%/);
      const rate = rateMatch ? parseFloat(rateMatch[1]) : 0;

      // Create description based on country and program
      let description = `${countryName} `;

      if (specialRateItem.includes("USMCA")) {
        description += "USMCA Program";
      } else if (specialRateItem.includes("GSP")) {
        description += "GSP Program";
      } else if (specialRateItem.includes("FTA")) {
        description += "Free Trade Agreement";
      } else {
        description += "Special Rate Program";
      }

      return { rate, description };
    }

    return undefined;
  };

  // Extract component descriptions from breakdown data
  const extractComponentDescriptions = (
    components: DutyComponent[],
    breakdown: string[],
  ): DutyComponent[] => {
    return components.map((component: DutyComponent) => {
      let label = "";

      if (component.type === "general") {
        // Look for MFN or special rate info in breakdown
        const generalItem = breakdown.find(
          (item: string) =>
            item.includes("General Rate") ||
            item.includes("MFN") ||
            item.includes("Column 1"),
        );

        if (generalItem) {
          if (generalItem.includes("MFN")) {
            label = "MFN";
          } else if (generalItem.includes("Special")) {
            label = "Special Rate";
          } else {
            label = "(General/Special Duties)";
          }
        } else {
          label = "(General/Special Duties)";
        }
      } else if (component.type === "section301") {
        // Look for specific list number in breakdown
        const section301Item = breakdown.find((item: string) =>
          item.includes("Section 301"),
        );

        if (section301Item) {
          const listMatch = section301Item.match(/List (\d+)/i);
          if (listMatch) {
            label = `Section 301 - List ${listMatch[1]}`;
          } else {
            label = "Section 301 - List #(s)";
          }
        } else {
          label = "Section 301 - List #(s)";
        }
      } else if (component.type === "truce") {
        // Look for expiration date in breakdown
        const truceItem = breakdown.find(
          (item: string) =>
            item.includes("Truce") || item.includes("Expiration"),
        );

        if (truceItem) {
          const dateMatch = truceItem.match(/(\d+\/\d+\/\d+)/);
          if (dateMatch) {
            label = `US-China Truce Rate Expiration ${dateMatch[1]}`;
          } else {
            label = "US-China Truce Rate Expiration 8/##/2025";
          }
        } else {
          label = "US-China Truce Rate Expiration 8/##/2025";
        }
      }

      return {
        ...component,
        label,
      };
    });
  };

  const getLineItemLabel = (component: {
    label?: string;
    description?: string;
    type?: string;
    rate?: number;
  }) => {
    let baseLabel = "";

    // If the component has a label or description, use that
    if (component.label || component.description) {
      baseLabel = component.label || component.description || "";
    } else {
      // For the type, we'll use a more user-friendly label

      if (component.type === RECIPROCAL_TARIFF_TYPE) {
        baseLabel = RECIPROCAL_TARIFF_TYPE;
      } else if (component.type === "base_duty") {
        baseLabel = "Base Duty (MFN)";
      } else {
        baseLabel = component.type || "—";
      }
    }

    // Add rate to base duties for clarity
    if (
      component.type === "base_duty" &&
      component.rate &&
      component.rate > 0
    ) {
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
      haptics.error();
      Alert.alert(
        "Missing Information",
        "Please enter HTS code, select a country, and enter a declared value.",
      );
      return;
    }

    // Trigger haptic feedback for calculate action
    haptics.impact();

    Keyboard.dismiss();
    setIsLoading(true);
    setResult(null);
    setShowInput(false);
    setIsSaved(false);

    try {
      console.log("Looking up HTS code:", htsCode);
      const calculation = await tariffService.calculateDuty(
        htsCode,
        parseFloat(declaredValue),
        selectedCountry.code,
        settings.isReciprocalAdditive,
        false, // excludeReciprocalTariff is false by default
        isUSMCAOrigin,
      );

      console.log("Calculation result:", calculation);

      if (calculation) {
        currentDutyCalculation.current = calculation;

        const lookupResult: LookupResult = {
          htsCode: calculation.htsCode,
          description: calculation.description,
          dutyRate: calculation.totalRate,
          totalAmount: calculation.amount,
          breakdown: calculation.breakdown,
          components: calculation.components,
          fees: calculation.fees,
          effectiveDate: calculation.effectiveDate,
          expirationDate: calculation.expirationDate,
        };

        // Update the displayed HTS code with the result
        setHtsCode(calculation.htsCode);

        // Hide loading modal before showing results
        setShowLoadingModal(false);

        setResult(lookupResult);
        setResultsDrawerVisible(true);

        // Success haptic feedback
        haptics.success();

        // Handle auto-save
        console.log("[handleLookup] Auto-save check:", {
          autoSaveEnabled: settings.autoSaveToHistory,
          hasResult: !!lookupResult,
          loadedHistoryTimestamp,
        });

        if (settings.autoSaveToHistory && !loadedHistoryTimestamp) {
          // Only auto-save if this is NOT a result loaded from history
          console.log("[handleLookup] Auto-saving lookup result...");
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
          console.log("[handleLookup] Auto-save completed");
          setIsSaved(true);
        } else if (loadedHistoryTimestamp) {
          // This is a result loaded from history, mark as already saved
          console.log(
            "[handleLookup] Skipping auto-save - result loaded from history with timestamp:",
            loadedHistoryTimestamp,
          );
          setIsSaved(true);
        } else {
          console.log("[handleLookup] Auto-save disabled, marking as unsaved");
          setIsSaved(false); // Reset saved state for manual save button
        }

        closeMainFab(); // Collapse the floating menu
        closeAllNavigationDrawers();
      } else {
        setShowLoadingModal(false);
        Alert.alert(
          "Calculation Error",
          "Unable to calculate duty for this combination.",
        );
        setIsLoading(false);
        setLoadingMessage("");
        return;
      }
    } catch (error) {
      console.error("Lookup error:", error);
      setShowLoadingModal(false);
      Alert.alert(
        "Error",
        "An error occurred during lookup. Please try again.",
      );
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
      setShowLoadingModal(false);
    }
  };

  const handleNewLookup = () => {
    console.log("[handleNewLookup] Called with:", {
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
        "Unsaved Lookup",
        "You have an unsaved lookup. Do you want to save it before starting a new one?",
        [
          {
            text: "Discard",
            style: "destructive",
            onPress: () => handleClearAll(),
          },
          {
            text: "Save & New",
            onPress: async () => {
              await handleSaveToHistory(false); // Don't show alert
              handleClearAll();
            },
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ],
      );
    } else {
      // No result or already saved, proceed directly
      handleClearAll();
    }
  };

  const handleSaveToHistory = async (showAlert = true) => {
    console.log("[handleSaveToHistory] Called with:", {
      hasResult: !!result,
      hasCountry: !!selectedCountry,
      isSaved,
      showAlert,
      loadedHistoryTimestamp,
    });

    if (!result || !selectedCountry || isSaved) {
      console.log("[handleSaveToHistory] Skipping save - conditions not met");
      return;
    }

    // Check if this is a result loaded from history
    if (loadedHistoryTimestamp) {
      console.log(
        "[handleSaveToHistory] Skipping save - result was loaded from history with timestamp:",
        loadedHistoryTimestamp,
      );
      setIsSaved(true);
      if (showAlert) {
        Alert.alert("Already Saved", "This lookup is already in your history.");
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
        showUnitCalculations: showUnitCalculations, // Save the display state
      };

      await saveToHistory(historyItem);
      setIsSaved(true);

      // Success haptic feedback
      haptics.success();

      // Show success feedback only if requested
      if (showAlert) {
        Alert.alert("Saved", "Lookup saved to history successfully.");
      }
    } catch (error) {
      console.error("Error saving to history:", error);
      if (showAlert) {
        Alert.alert("Error", "Failed to save to history. Please try again.");
      }
    }
  };

  const handleClearAll = () => {
    // Haptic feedback for clear action
    haptics.impactHeavy();

    // Clear all fields for a completely new lookup
    setHtsCode("");
    setSelectedCountry(undefined);
    setDeclaredValue("");
    setFormattedDeclaredValue("");
    setFreightCost("");
    setFormattedFreightCost("");
    setUnitCount("");
    setFormattedUnitCount("");
    setResult(null);
    setResultsDrawerVisible(false);
    setIsSaved(false);
    setShowUnitCalculations(settings.showUnitCalculations ?? false); // Reset to user preference
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
    // Don't reset showUnitCalculations - keep current state

    // Focus on declared value input since all data is preserved
    setTimeout(() => {
      declaredValueInputRef.current?.focus();
    }, 100);
  };

  const handleHistoryItemSelection = (historyItem: HistoryItem) => {
    haptics.selection();
    console.log("History item selected:", historyItem);
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
      ];

      const foundCountry = countries.find(
        (c) => c.code === historyItem.countryCode,
      );
      if (foundCountry) {
        countryName = foundCountry.name;
      } else {
        // If we can't find the name, use the code as the name
        countryName = historyItem.countryCode;
      }
    }

    console.log("Setting country from history:", {
      code: countryCode,
      name: countryName,
    });

    setSelectedCountry({
      code: countryCode,
      name: countryName,
    });

    // Use the saved declared value instead of hardcoded value
    const savedDeclaredValue = historyItem.declaredValue
      ? historyItem.declaredValue.toString()
      : "1000";
    setDeclaredValue(savedDeclaredValue);
    setFormattedDeclaredValue(formatNumberWithCommas(savedDeclaredValue));

    // Restore freight cost if available
    if (historyItem.freightCost) {
      setFreightCost(historyItem.freightCost.toString());
      setFormattedFreightCost(
        formatNumberWithCommas(historyItem.freightCost.toString()),
      );
    } else {
      setFreightCost("");
      setFormattedFreightCost("");
    }

    // Restore unit count if available
    if (historyItem.unitCount) {
      setUnitCount(historyItem.unitCount);
      setFormattedUnitCount(formatNumberWithCommas(historyItem.unitCount));
    } else {
      setUnitCount("");
      setFormattedUnitCount("");
    }

    // Restore showUnitCalculations state if available, otherwise use settings default
    if (historyItem.showUnitCalculations !== undefined) {
      setShowUnitCalculations(historyItem.showUnitCalculations);
    } else {
      setShowUnitCalculations(settings.showUnitCalculations ?? false);
    }

    // If we have complete result data, restore it directly
    if (
      historyItem.totalAmount !== undefined &&
      historyItem.description !== undefined
    ) {
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
      return `Today ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }

    // Check if the date is yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }

    // For other dates, show the full date
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // New drawer content functions
  const renderHistoryDrawerContent = () => (
    <View style={styles.drawerContent}>
      <View style={styles.drawerHeader}>
        <Ionicons
          name="time"
          size={getResponsiveValue(20, 28)}
          color={BRAND_COLORS.electricBlue}
        />
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
                navigation.navigate("Lookup", { historyItem: item });
                // Open FAB after selecting history item
                setTimeout(() => {
                  setUserClosedFab(false);
                  openMainFab();
                }, 300);
              };

              // Check for unsaved results before navigating
              if (!settings.autoSaveToHistory && result && !isSaved) {
                Alert.alert(
                  "Unsaved Lookup",
                  "You have an unsaved lookup. Do you want to save it before loading this history item?",
                  [
                    {
                      text: "Discard",
                      style: "destructive",
                      onPress: closeAndNavigate,
                    },
                    {
                      text: "Save & Load",
                      onPress: async () => {
                        await handleSaveToHistory(false);
                        closeAndNavigate();
                      },
                    },
                    {
                      text: "Cancel",
                      style: "cancel",
                    },
                  ],
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
                <Text style={styles.historyItemDesc}>{item.description}</Text>
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

  const renderNewsDrawerContent = () => <RightColumnContent />;

  const renderAnalyticsDrawerContent = () => {
    const analyticsMetrics = [
      { title: "Top Searched HTS", value: "8471.30.01", trend: "+12%" },
      { title: "Avg Duty Rate", value: "7.2%", trend: "-0.3%" },
      { title: "Most Active Country", value: "China", trend: "45%" },
      { title: "Weekly Lookups", value: "1,247", trend: "+8%" },
    ];

    return (
      <View style={[styles.drawerContent, { paddingTop: 100 }]}>
        <View style={styles.drawerHeader}>
          <Ionicons
            name="analytics"
            size={getResponsiveValue(20, 28)}
            color={BRAND_COLORS.electricBlue}
          />
          <Text style={styles.drawerTitle}>Trade Insights</Text>
        </View>
        <ScrollView style={styles.drawerScrollView}>
          {analyticsMetrics.map((item, index) => (
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
  };

  // Results drawer content
  const renderResultsDrawerContent = () => {
    if (!result) return null;

    const currentTimestamp = new Date().toLocaleString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <View style={styles.resultsDrawerContent}>
        {/* Header */}
        <View style={styles.resultsDrawerHeader}>
          <View style={styles.resultsHeaderLeft}>
            <Text style={styles.resultsDrawerTitle}>Search Results</Text>
            <Text style={styles.resultsDrawerSubtitle}>
              {result.htsCode} • {selectedCountry?.name}
            </Text>
            <Text style={styles.resultsDrawerTimestamp}>
              {currentTimestamp}
            </Text>
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
                style={[
                  styles.headerButton,
                  styles.saveHeaderButton,
                  isSaved && styles.savedHeaderButton,
                ]}
                onPress={() => handleSaveToHistory()}
                disabled={isSaved}
              >
                <Ionicons
                  name={isSaved ? "checkmark-circle" : "bookmark-outline"}
                  size={getResponsiveValue(16, 20)}
                  color={
                    isSaved ? BRAND_COLORS.success : BRAND_COLORS.electricBlue
                  }
                />
                <Text
                  style={[
                    styles.headerButtonText,
                    isSaved && styles.savedHeaderButtonText,
                  ]}
                >
                  {isSaved ? "Saved" : "Save"}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.headerButton, styles.newHeaderButton]}
              onPress={handleNewLookup}
            >
              <Ionicons
                name="add"
                size={getResponsiveValue(16, 20)}
                color={BRAND_COLORS.electricBlue}
              />
              <Text style={styles.headerButtonText}>New</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.resultsScrollView}
          contentContainerStyle={{ paddingBottom: getSpacing("xl") }}
          showsVerticalScrollIndicator={false}
        >
          {/* Duties vs Landed Cost */}
          {(() => {
            const dutiableValue = parseFloat(declaredValue);
            const merchandiseValueForLanded =
              dutiableValue + (freightCost ? parseFloat(freightCost) : 0);
            const landedCost = merchandiseValueForLanded + result.totalAmount;
            return (
              <View style={styles.totalAmountRow}>
                {/* Duties */}
                <View
                  style={[styles.totalAmountCard, { marginRight: 8, flex: 1 }]}
                >
                  <Text style={styles.totalAmountLabel}>
                    Est. Duties & Fees
                  </Text>
                  <Text style={styles.totalAmountValue}>
                    {formatCurrency(result.totalAmount)}
                  </Text>
                  <Text style={styles.totalAmountSubtext}>
                    on {formatCurrency(dutiableValue)} value
                  </Text>
                </View>
                {/* Landed Cost */}
                <View
                  style={[styles.totalAmountCard, { marginLeft: 8, flex: 1 }]}
                >
                  <Text style={styles.totalAmountLabel}>Est. Landed Cost</Text>
                  <Text style={styles.totalAmountValue}>
                    {formatCurrency(landedCost)}
                  </Text>
                  <Text style={styles.totalAmountSubtext}>
                    COGs+duties+freight
                  </Text>
                </View>
              </View>
            );
          })()}

          {/* Compact Breakdown */}
          {result.components && result.components.length > 0 && (
            <View style={styles.compactSection}>
              <Text style={styles.compactSectionTitle}>Duty Breakdown</Text>
              {result.components.map(
                (component: DutyComponent, index: number) => (
                  <View key={index} style={styles.compactRow}>
                    <View style={styles.compactRowLeft}>
                      <Text style={styles.compactLabel}>
                        {getLineItemLabel(component)}
                      </Text>
                      {component.rate > 0 && (
                        <Text style={styles.compactRate}>
                          {component.rate.toFixed(2)}%
                        </Text>
                      )}
                    </View>
                    <Text style={styles.compactAmount}>
                      {formatCurrency(component.amount)}
                    </Text>
                  </View>
                ),
              )}
            </View>
          )}

          {/* Compact Fees */}
          {result.fees && (
            <View style={styles.compactSection}>
              <Text style={styles.compactSectionTitle}>Processing Fees</Text>
              <View style={styles.compactRow}>
                <View style={styles.compactRowLeft}>
                  <Text style={styles.compactLabel}>
                    Merchandise Processing Fee
                  </Text>
                  <Text style={styles.compactRate}>
                    {result.fees.mpf.rate.toFixed(4)}%
                  </Text>
                </View>
                <Text style={styles.compactAmount}>
                  {formatCurrency(result.fees.mpf.amount)}
                </Text>
              </View>
              <View style={styles.compactRow}>
                <View style={styles.compactRowLeft}>
                  <Text style={styles.compactLabel}>
                    Harbor Maintenance Fee
                  </Text>
                  <Text style={styles.compactRate}>
                    {result.fees.hmf.rate.toFixed(3)}%
                  </Text>
                </View>
                <Text style={styles.compactAmount}>
                  {formatCurrency(result.fees.hmf.amount)}
                </Text>
              </View>
            </View>
          )}

          {/* Unit Calculations Toggle & Display */}
          {unitCount && parseFloat(unitCount) > 0 ? (
            <>
              {/* Toggle Button */}
              <TouchableOpacity
                style={styles.unitCalculationsToggle}
                onPress={() => {
                  haptics.selection();
                  setShowUnitCalculations(!showUnitCalculations);
                }}
              >
                <View style={styles.unitCalculationsToggleLeft}>
                  <Ionicons
                    name="calculator-outline"
                    size={getResponsiveValue(16, 20)}
                    color={BRAND_COLORS.electricBlue}
                  />
                  <Text style={styles.unitCalculationsToggleText}>
                    Unit Calculations
                  </Text>
                </View>
                <Ionicons
                  name={showUnitCalculations ? "chevron-up" : "chevron-down"}
                  size={getResponsiveValue(16, 20)}
                  color={BRAND_COLORS.darkGray}
                />
              </TouchableOpacity>

              {/* Compact Per Unit - Only show when toggled on */}
              {showUnitCalculations && (
                <View style={styles.compactSection}>
                  <Text style={styles.compactSectionTitle}>
                    Per Unit ({formatNumber(parseFloat(unitCount), 0)} units)
                  </Text>
                  <View style={styles.compactRow}>
                    <Text style={styles.compactLabel}>Duty Cost</Text>
                    <Text style={styles.compactAmount}>
                      {formatCurrency(
                        result.totalAmount / parseFloat(unitCount),
                      )}
                    </Text>
                  </View>
                  {/* Landed cost per unit */}
                  <View style={styles.compactRow}>
                    <Text style={styles.compactLabel}>Landed Cost</Text>
                    <Text style={styles.compactAmount}>
                      {formatCurrency(
                        (parseFloat(declaredValue) +
                          (freightCost ? parseFloat(freightCost) : 0) +
                          result.totalAmount) /
                          parseFloat(unitCount),
                      )}
                    </Text>
                  </View>
                  {(() => {
                    // Show RT cost separately if applicable
                    if (result.components) {
                      const rtComponent = result.components.find(
                        (c: DutyComponent) => c.type === RECIPROCAL_TARIFF_TYPE,
                      );
                      if (rtComponent && rtComponent.amount > 0) {
                        return (
                          <View style={styles.compactRow}>
                            <Text style={styles.compactLabel}>
                              Addl RT cost
                            </Text>
                            <Text style={styles.compactHighlight}>
                              {formatCurrency(
                                rtComponent.amount / parseFloat(unitCount),
                              )}
                            </Text>
                          </View>
                        );
                      }
                    }
                    return null;
                  })()}
                </View>
              )}
            </>
          ) : (
            // Only show the prompt message if the setting is enabled
            (settings.showUnitCalculations ?? false) && (
              <View style={styles.compactMessageSection}>
                <Ionicons
                  name="information-circle-outline"
                  size={getResponsiveValue(14, 18)}
                  color={BRAND_COLORS.info}
                />
                <Text style={styles.compactMessage}>
                  Enter unit count for per unit calculations
                </Text>
              </View>
            )
          )}
        </ScrollView>
      </View>
    );
  };

  // Unified floating menu animations with diagonal layout
  const toggleMainFab = (recordUserClose: boolean = true) => {
    const toValue = mainFabExpanded ? 0 : 1;
    const isClosing = mainFabExpanded;
    setMainFabExpanded(!mainFabExpanded);

    // Record manual close only if requested
    if (isClosing && recordUserClose) {
      setUserClosedFab(true);
    } else {
      setUserClosedFab(false);
    }

    if (!mainFabExpanded) closeAllNavigationDrawers();

    const spacing = isTablet() ? getResponsiveValue(80, 110) : 54; // iPhone: 49 + 5px more space from main FAB

    const animations: Animated.CompositeAnimation[] = [];

    // Diagonal expansion matching hero section angle
    // The hero section uses a skewY of -2deg, which is approximately 0.035 radians
    // tan(-2deg) ≈ -0.035, so for every unit of X movement, Y should move by 0.035 units
    const diagonalSlope = 0.035; // Matches the -2deg skew of the hero section

    const fabConfigs = [
      { animX: recentFabTranslateX, animY: recentFabTranslateY, multiplier: 1 },
      {
        animX: historyFabTranslateX,
        animY: historyFabTranslateY,
        multiplier: 2,
      },
      { animX: linksFabTranslateX, animY: linksFabTranslateY, multiplier: 3 },
      { animX: newsFabTranslateX, animY: newsFabTranslateY, multiplier: 4 },
      { animX: statsFabTranslateX, animY: statsFabTranslateY, multiplier: 5 },
      {
        animX: settingsFabTranslateX,
        animY: settingsFabTranslateY,
        multiplier: 6,
      },
    ];

    fabConfigs.forEach(({ animX, animY, multiplier }) => {
      const xPosition = toValue * spacing * multiplier;
      // Y position follows the diagonal line exactly
      // All FABs expand to the right and up following the diagonal
      const yPosition = -xPosition * diagonalSlope;

      animations.push(
        Animated.timing(animX, {
          toValue: xPosition,
          duration: 300,
          useNativeDriver: true,
        }),
      );

      animations.push(
        Animated.timing(animY, {
          toValue: yPosition,
          duration: 300,
          useNativeDriver: true,
        }),
      );
    });

    // Rotate main FAB
    animations.push(
      Animated.timing(mainFabRotation, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }),
    );

    // Scale/opacity
    animations.push(
      Animated.timing(menuFabScale, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }),
    );
    animations.push(
      Animated.timing(menuFabOpacity, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }),
    );

    Animated.parallel(animations).start();
  };

  // Close main FAB when other actions are taken
  const closeMainFab = (recordUserClose: boolean = true) => {
    // Hide any floating info tab
    setActiveField(null);
    setInfoDrawerVisible(false);

    // Mark manual close only if requested
    if (recordUserClose) {
      setUserClosedFab(true);
    } else {
      setUserClosedFab(false);
    }

    if (mainFabExpanded) {
      toggleMainFab(recordUserClose);
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
    console.log("[handleCloseResultsDrawer] Called with:", {
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

    if (
      settings.autoSaveToHistory &&
      result &&
      !isSaved &&
      !loadedHistoryTimestamp
    ) {
      // Auto-save when closing drawer (but not if loaded from history)
      console.log("[handleCloseResultsDrawer] Auto-saving...");
      handleSaveToHistory(false).then(() => {
        closeAndOpenFab();
      });
    } else if (!settings.autoSaveToHistory && result && !isSaved) {
      // Show warning if auto-save is off and there's an unsaved result
      Alert.alert(
        "Unsaved Lookup",
        "You have an unsaved lookup. Do you want to save it before closing?",
        [
          {
            text: "Discard",
            style: "destructive",
            onPress: () => closeAndOpenFab(),
          },
          {
            text: "Save & Close",
            onPress: async () => {
              await handleSaveToHistory(false);
              closeAndOpenFab();
            },
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ],
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

  const anyDrawerOpen =
    historyDrawerVisible ||
    newsDrawerVisible ||
    analyticsDrawerVisible ||
    resultsDrawerVisible ||
    mainHistoryDrawerVisible ||
    settingsDrawerVisible ||
    linksDrawerVisible;

  const handleMainFabPress = () => {
    haptics.buttonPress();
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

  // Delay "Not found" feedback
  const [showNoResults, setShowNoResults] = useState(false);
  const noResultsTimer = useRef<NodeJS.Timeout | null>(null);

  // ----------------------
  // Gesture: drag info tab to open drawer (iPhone)
  // ----------------------
  const handleInfoTabDrag = (event: PanGestureHandlerGestureEvent) => {
    const { translationX } = event.nativeEvent;
    // Detect a rightward drag of ~50px to trigger opening
    if (translationX > 50 && !infoDrawerVisible) {
      setInfoDrawerVisible(true);
    }
  };

  // Removed header drawer state - data source info now in FAB container

  // Removed header drawer toggle functions - text now in FAB container

  // ----------------------
  // Dynamic layout based on rotation / size
  // ----------------------
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;

  // Runtime tablet check (depends on current dimensions)
  const isTabletNow = ((): boolean => {
    const aspect = windowHeight / windowWidth;
    return Platform.OS === "ios" && Platform.isPad && aspect <= 1.6;
  })();

  // Memo-ized dynamic styles that need to react on rotation
  const dynamicHeaderStyles = React.useMemo(() => {
    const heroHeight = isTabletNow
      ? isLandscape
        ? windowHeight * 0.25 // Increased from 0.18
        : windowHeight * 0.3 // Increased from 0.25
      : windowHeight * 0.28; // Increased from 0.2 to accommodate FABs

    const logoWidth = windowWidth * (isTabletNow ? 0.6 : 0.75);

    return {
      heroSection: {
        height: heroHeight,
      } as ViewStyle,
      logo: {
        width: logoWidth,
        height: logoWidth * 0.3,
        maxWidth: isTabletNow ? 600 : 420,
        maxHeight: isTabletNow ? 180 : 126,
      } as ImageStyle,
      dataSourceContainer: isTabletNow
        ? {
            marginBottom: isLandscape ? 0 : -getSpacing("xs"),
          }
        : {},
    };
  }, [windowWidth, windowHeight, isLandscape, isTabletNow]);

  // Dynamic form width & side padding
  const dynamicFormStyles = React.useMemo(() => {
    // Fixed field width for tablet
    const fieldWidth = isTabletNow ? 500 : "100%";
    // Calculate symmetric side padding so the field remains centered with the same width in any orientation
    const sidePadding =
      isTabletNow && typeof fieldWidth === "number"
        ? (windowWidth - fieldWidth) / 2
        : getSpacing("md");
    return {
      wrapper: {
        paddingHorizontal: sidePadding,
      } as ViewStyle,
      input: {
        width: fieldWidth,
      } as ViewStyle,
      suggestionWidth: {
        width: fieldWidth,
      } as ViewStyle,
    };
  }, [isLandscape, isTabletNow, windowWidth]);

  // Keep hidden drawers correctly positioned after rotation
  useEffect(() => {
    // Update off-screen positions only when corresponding drawer not visible
    if (!linksDrawerVisible) {
      linksDrawerTranslateY.setValue(windowHeight);
    }
    const hiddenX = getResponsiveValue(windowWidth * 0.85, 400);
    if (!historyDrawerVisible && !mainHistoryDrawerVisible) {
      historyDrawerTranslateX.setValue(hiddenX);
    }
    if (!settingsDrawerVisible) {
      settingsDrawerTranslateX.setValue(-hiddenX);
    }
  }, [
    windowWidth,
    windowHeight,
    linksDrawerVisible,
    historyDrawerVisible,
    mainHistoryDrawerVisible,
    settingsDrawerVisible,
  ]);

  // ... after dynamicFormStyles definition ...
  const dynamicActionStyles = React.useMemo(() => {
    // Match side padding with the dynamicFormStyles calculation so buttons align with fields
    const sidePadding = isTabletNow
      ? (windowWidth - 500) / 2
      : getSpacing("md");
    return {
      row: {
        paddingHorizontal: sidePadding,
      } as ViewStyle,
      searchButton: {
        marginLeft: 0,
      } as ViewStyle,
    };
  }, [isLandscape, isTabletNow, windowWidth]);

  useEffect(() => {
    const checkFirstTimeGuide = async () => {
      console.log(
        "[FirstTimeGuide] Checking guide - showDisclaimer:",
        showDisclaimer,
      );
      // Only check if the disclaimer has also been dealt with
      if (!showDisclaimer && (settings.showQuickTour ?? true)) {
        const hasSeenGuide = await AsyncStorage.getItem(GUIDE_STORAGE_KEY);
        console.log("[FirstTimeGuide] hasSeenGuide value:", hasSeenGuide);
        if (hasSeenGuide === null) {
          // If the key doesn't exist, show the guide after a delay to let disclaimer modal fully dismiss
          console.log(
            "[FirstTimeGuide] Showing guide for first time after delay",
          );
          setTimeout(() => {
            setShowFirstTimeGuide(true);
          }, 500); // 500ms delay to ensure disclaimer modal is fully dismissed
        } else {
          console.log(
            "[FirstTimeGuide] Guide has been seen before, not showing",
          );
        }
      } else {
        console.log(
          "[FirstTimeGuide] Disclaimer still visible, not checking guide",
        );
      }
    };
    checkFirstTimeGuide();
  }, [showDisclaimer]);

  // Automatically reopen FAB menu when all drawers are closed (unless user manually closed it)
  useEffect(() => {
    if (!anyDrawerOpen && !userClosedFab) {
      openMainFab();
    } else if (anyDrawerOpen && mainFabExpanded) {
      closeMainFab();
    }
  }, [anyDrawerOpen]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <DisclaimerModal
        visible={showDisclaimer}
        onAgree={handleDisclaimerAgree}
      />

      {/* Loading Modal */}
      <Modal
        visible={showLoadingModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.loadingModalOverlay}>
          <View style={styles.loadingModalContent}>
            <Animated.View
              style={[
                styles.loadingSpinnerContainer,
                {
                  transform: [
                    {
                      rotate: loadingSpinValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "360deg"],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Ionicons
                name="time-outline"
                size={48}
                color={BRAND_COLORS.electricBlue}
              />
            </Animated.View>
            <Text style={styles.loadingModalText}>Calculating...</Text>
          </View>
        </View>
      </Modal>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Diagonal Background Section */}
        <DiagonalSection
          height={Number(dynamicHeaderStyles.heroSection.height)}
          style={{ ...styles.heroSection, ...dynamicHeaderStyles.heroSection }}
        >
          <View
            style={[
              styles.logoContainer,
              { paddingTop: Math.max(insets.top - 18, 0) },
            ]}
          >
            <Image
              source={require("../../assets/Harmony-white.png")}
              style={dynamicHeaderStyles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Unified Floating Menu System - Now in hero section */}
          <View style={styles.heroFloatingMenuContainer}>
            {/* Menu Buttons in Arc Formation - Recent, History, Links, News, Stats, Settings */}

            {/* Recent Button */}
            <Animated.View
              pointerEvents={mainFabExpanded ? "auto" : "none"}
              style={[
                styles.menuFab,
                {
                  transform: [
                    { translateX: recentFabTranslateX },
                    { translateY: recentFabTranslateY },
                    { scale: menuFabScale },
                  ],
                  opacity: menuFabOpacity,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.menuFabButton,
                  { backgroundColor: BRAND_COLORS.electricBlue },
                ]}
                onPress={() => {
                  haptics.buttonPress();
                  closeAllDrawers();
                  closeMainFab(false);
                  setHistoryDrawerVisible(true);
                }}
              >
                <Ionicons
                  name="time"
                  size={getResponsiveValue(16, 24)} // 80% size on iPhone (20 * 0.8 = 16)
                  color={BRAND_COLORS.white}
                />
              </TouchableOpacity>
            </Animated.View>

            {/* History Button */}
            <Animated.View
              pointerEvents={mainFabExpanded ? "auto" : "none"}
              style={[
                styles.menuFab,
                {
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
                style={[
                  styles.menuFabButton,
                  { backgroundColor: BRAND_COLORS.mediumBlue },
                ]}
                onPress={() => {
                  haptics.buttonPress();
                  closeAllDrawers();
                  closeMainFab(false);
                  setMainHistoryDrawerVisible(true);
                }}
              >
                <Ionicons
                  name="library"
                  size={getResponsiveValue(16, 24)} // 80% size on iPhone
                  color={BRAND_COLORS.white}
                />
              </TouchableOpacity>
            </Animated.View>

            {/* Tariff News Button */}
            <Animated.View
              pointerEvents={mainFabExpanded ? "auto" : "none"}
              style={[
                styles.menuFab,
                {
                  transform: [
                    { translateX: linksFabTranslateX },
                    { translateY: linksFabTranslateY },
                    { scale: menuFabScale },
                  ],
                  opacity: menuFabOpacity,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.menuFabButton,
                  { backgroundColor: BRAND_COLORS.success },
                ]}
                onPress={() => {
                  haptics.buttonPress();
                  closeAllDrawers();
                  closeMainFab(false);
                  setLinksDrawerVisible(true);
                }}
              >
                <Ionicons
                  name="newspaper-outline"
                  size={getResponsiveValue(16, 24)} // 80% size on iPhone
                  color={BRAND_COLORS.white}
                />
              </TouchableOpacity>
            </Animated.View>

            {/* News Button */}
            <Animated.View
              pointerEvents={mainFabExpanded ? "auto" : "none"}
              style={[
                styles.menuFab,
                {
                  transform: [
                    { translateX: newsFabTranslateX },
                    { translateY: newsFabTranslateY },
                    { scale: menuFabScale },
                  ],
                  opacity: menuFabOpacity,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.menuFabButton,
                  { backgroundColor: BRAND_COLORS.orange },
                ]}
                onPress={() => {
                  haptics.buttonPress();
                  closeAllDrawers();
                  closeMainFab(false);
                  setNewsDrawerVisible(true);
                }}
              >
                <Ionicons
                  name="newspaper"
                  size={getResponsiveValue(16, 24)} // 80% size on iPhone
                  color={BRAND_COLORS.white}
                />
              </TouchableOpacity>
            </Animated.View>

            {/* Stats Button */}
            <Animated.View
              pointerEvents={mainFabExpanded ? "auto" : "none"}
              style={[
                styles.menuFab,
                {
                  transform: [
                    { translateX: statsFabTranslateX },
                    { translateY: statsFabTranslateY },
                    { scale: menuFabScale },
                  ],
                  opacity: menuFabOpacity,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.menuFabButton,
                  { backgroundColor: BRAND_COLORS.info },
                ]}
                onPress={() => {
                  haptics.buttonPress();
                  closeAllDrawers();
                  closeMainFab(false);
                  setAnalyticsDrawerVisible(true);
                }}
              >
                <Ionicons
                  name="analytics"
                  size={getResponsiveValue(16, 24)} // 80% size on iPhone
                  color={BRAND_COLORS.white}
                />
              </TouchableOpacity>
            </Animated.View>

            {/* Settings Button */}
            <Animated.View
              pointerEvents={mainFabExpanded ? "auto" : "none"}
              style={[
                styles.menuFab,
                {
                  transform: [
                    { translateX: settingsFabTranslateX },
                    { translateY: settingsFabTranslateY },
                    { scale: menuFabScale },
                  ],
                  opacity: menuFabOpacity,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.menuFabButton,
                  { backgroundColor: BRAND_COLORS.darkGray },
                ]}
                onPress={() => {
                  haptics.buttonPress();
                  closeAllDrawers();
                  closeMainFab(false);
                  setSettingsDrawerVisible(true);
                }}
              >
                <Ionicons
                  name="settings"
                  size={getResponsiveValue(16, 24)} // 80% size on iPhone
                  color={BRAND_COLORS.white}
                />
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
                        outputRange: ["0deg", "45deg"],
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
                <Ionicons
                  name="menu"
                  size={getResponsiveValue(19, 28)} // 80% size on iPhone (24 * 0.8 = 19.2 ≈ 19)
                  color={BRAND_COLORS.white}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </DiagonalSection>

        {/* Main Content Area */}
        <KeyboardAwareScrollView
          ref={resultScrollViewRef}
          style={styles.mainScrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          extraScrollHeight={20}
        >
          {/* Input Form - Always visible */}
          <View style={styles.inputSection}>
            <View style={styles.sectionTitleWrapper}>
              <Text style={styles.sectionTitle}>Entry Hub</Text>
            </View>

            <View style={styles.inputContainer}>
              <View
                style={[styles.inputWrapper, dynamicFormStyles.wrapper]}
                ref={fieldRefs.code}
              >
                <FieldWithInfo
                  placeholder="Code (Enter 3-8 digits to search)"
                  value={htsCode}
                  fieldKey="code"
                  onInfoPress={handleInfoPress}
                  onChangeText={(text) => {
                    const cleanedText = text.replace(/\D/g, "").slice(0, 8);
                    setHtsCode(cleanedText);
                    setUserClosedFab(false);
                    closeMainFab();
                    closeAllNavigationDrawers();
                  }}
                  inputRef={htsCodeInputRef}
                  keyboardType="number-pad"
                  maxLength={8}
                  placeholderTextColor={BRAND_COLORS.electricBlue}
                  style={[styles.input, dynamicFormStyles.input]}
                  onFocus={() => handleFieldFocus("code")}
                />

                {/* HTS Suggestions */}
                {showHtsSuggestions && (
                  <View
                    style={[
                      styles.suggestionsContainer,
                      dynamicFormStyles.suggestionWidth,
                    ]}
                  >
                    {htsSuggestions.length > 0 ? (
                      <ScrollView
                        style={styles.suggestionsScrollView}
                        showsVerticalScrollIndicator={true}
                      >
                        {htsSuggestions.map((suggestion, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.suggestionItem}
                            onPress={() => {
                              handleHtsSelection(suggestion.code);
                              closeMainFab(false);
                              closeAllNavigationDrawers();
                            }}
                          >
                            <Text style={styles.suggestionCode}>
                              {suggestion.code}
                            </Text>
                            <Text style={styles.suggestionDescription}>
                              {suggestion.description}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        {htsSuggestions.length > 5 && (
                          <View style={styles.moreResultsIndicator}>
                            <Ionicons
                              name="chevron-down"
                              size={getResponsiveValue(16, 20)}
                              color={BRAND_COLORS.mediumGray}
                            />
                            <Text style={styles.moreResultsText}>
                              {htsSuggestions.length - 5} more results - scroll
                              to see all
                            </Text>
                          </View>
                        )}
                      </ScrollView>
                    ) : null}
                  </View>
                )}
              </View>
              <View style={[styles.inputWrapper, dynamicFormStyles.wrapper]}>
                <CountryLookup
                  ref={countryInputRef}
                  selectedCountry={selectedCountry}
                  onSelect={(country) => {
                    setSelectedCountry(country);
                    setUserClosedFab(false);
                    closeMainFab(false);
                    closeAllNavigationDrawers();
                  }}
                />
              </View>
              <View
                style={[styles.inputWrapper, dynamicFormStyles.wrapper]}
                ref={fieldRefs.declared}
              >
                <FieldWithInfo
                  placeholder="Declared Value (USD)"
                  value={formattedDeclaredValue}
                  fieldKey="declared"
                  onInfoPress={handleInfoPress}
                  onChangeText={(value) => {
                    handleDeclaredValueChange(value);
                    closeMainFab(false);
                    closeAllNavigationDrawers();
                  }}
                  inputRef={declaredValueInputRef}
                  keyboardType="decimal-pad"
                  placeholderTextColor={BRAND_COLORS.electricBlue}
                  style={[styles.input, dynamicFormStyles.input]}
                  onFocus={() => handleFieldFocus("declared")}
                />
              </View>
              <View
                style={[styles.inputWrapper, dynamicFormStyles.wrapper]}
                ref={fieldRefs.freight}
              >
                <FieldWithInfo
                  placeholder="Freight Cost in USD (Optional)"
                  value={formattedFreightCost}
                  fieldKey="freight"
                  onInfoPress={handleInfoPress}
                  onChangeText={(value) => {
                    handleFreightCostChange(value);
                    closeMainFab(false);
                    closeAllNavigationDrawers();
                  }}
                  inputRef={freightCostInputRef}
                  keyboardType="decimal-pad"
                  placeholderTextColor={BRAND_COLORS.electricBlue}
                  style={[styles.input, dynamicFormStyles.input]}
                  onFocus={() => handleFieldFocus("freight")}
                />
              </View>
              {/* Only show Unit Count field if Show Unit Calculations is enabled */}
              {(settings.showUnitCalculations ?? false) && (
                <View
                  style={[styles.inputWrapper, dynamicFormStyles.wrapper]}
                  ref={fieldRefs.units}
                >
                  <FieldWithInfo
                    placeholder="Unit Count (Optional)"
                    value={formattedUnitCount}
                    fieldKey="units"
                    onInfoPress={handleInfoPress}
                    onChangeText={(value) => {
                      handleUnitCountChange(value);
                      closeMainFab(false);
                      closeAllNavigationDrawers();
                    }}
                    keyboardType="number-pad"
                    placeholderTextColor={BRAND_COLORS.electricBlue}
                    style={[styles.input, dynamicFormStyles.input]}
                    onFocus={() => handleFieldFocus("units")}
                  />
                </View>
              )}

              {/* USMCA Origin Checkbox - Only show for Canada/Mexico */}
              {selectedCountry &&
                (selectedCountry.code === "CA" ||
                  selectedCountry.code === "MX") && (
                  <View
                    style={[styles.inputWrapper, dynamicFormStyles.wrapper]}
                  >
                    <View style={styles.toggleContainer}>
                      <Text style={styles.toggleLabel}>
                        USMCA Origin Certificate
                      </Text>
                      <Switch
                        value={isUSMCAOrigin}
                        onValueChange={(value) => {
                          haptics.selection();
                          setIsUSMCAOrigin(value);
                          closeMainFab(false);
                          closeAllNavigationDrawers();
                        }}
                        trackColor={{
                          false: BRAND_COLORS.mediumGray,
                          true: BRAND_COLORS.electricBlue,
                        }}
                        thumbColor={BRAND_COLORS.white}
                      />
                    </View>
                  </View>
                )}
            </View>

            {/* Action Buttons Row */}
            <View style={[styles.actionButtonsRow, dynamicActionStyles.row]}>
              <TouchableOpacity
                style={[
                  styles.searchButton,
                  dynamicActionStyles.searchButton,
                  isLoading && styles.searchButtonDisabled,
                ]}
                onPress={handleLookup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={BRAND_COLORS.white} />
                ) : (
                  <>
                    <Ionicons
                      name="search"
                      size={getResponsiveValue(18, 22)}
                      color={BRAND_COLORS.white}
                    />
                    <Text style={styles.searchButtonText}>Calculate</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearAll}
              >
                <Ionicons
                  name="backspace-outline"
                  size={getResponsiveValue(18, 22)}
                  color={BRAND_COLORS.white}
                />
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
        </KeyboardAwareScrollView>

        {/* Data Source Info Text - positioned at bottom of screen */}
        <View style={styles.dataSourceInfoContainer} pointerEvents="none">
          <LinearGradient
            colors={[BRAND_COLORS.gradientStart, BRAND_COLORS.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.dataSourceGradient}
          >
            <Text style={styles.dataSourceInfoLine}>
              Data Last Updated:{" "}
              {tariffService.getLastUpdated() || "Loading..."} | HTS Rev.{" "}
              {tariffService.getHtsRevision() || "Loading..."}
            </Text>
            <Text style={styles.dataSourceInfoLine}>
              Data Sources: U.S. International Trade Commission,
            </Text>
            <Text style={styles.dataSourceInfoLine}>
              Federal Register Notices for Section 301 tariffs (Lists 1–4A).
            </Text>
          </LinearGradient>
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

        {/* Tariff News Drawer */}
        <AnimatedDrawer
          isVisible={linksDrawerVisible}
          onClose={() => setLinksDrawerVisible(false)}
          position="right"
          customDrawerConfig={getTradeNewsDrawerConfig()}
        >
          <TariffNewsContent />
        </AnimatedDrawer>

        {/* New History Side Drawer */}
        <AnimatedDrawer
          isVisible={mainHistoryDrawerVisible}
          onClose={() => {
            setMainHistoryDrawerVisible(false);
            // Open FAB after closing history drawer
            setTimeout(() => {
              setUserClosedFab(false);
              openMainFab();
            }, 300);
          }}
          position="right"
          wrapScroll={false}
        >
          <HistoryColumnContent
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
        {settingsDrawerVisible && (
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
            <Animated.View
              style={[styles.overlayBackground, { opacity: navDrawerOpacity }]}
            />
          </TouchableOpacity>
        )}

        {/* History Drawer */}
        {false && (
          <Animated.View
            style={[
              styles.drawer,
              styles.rightDrawer,
              {
                transform: [{ translateX: historyDrawerTranslateX }],
                pointerEvents: mainHistoryDrawerVisible ? "auto" : "none",
              },
            ]}
          >
            <View style={styles.drawerScreenContainer}>
              <HistoryScreen
                visible={mainHistoryDrawerVisible}
                onItemPress={(item) => {
                  // Close the history drawer
                  setMainHistoryDrawerVisible(false);
                  handleHistoryItemSelection(item);
                  setTimeout(() => {
                    setUserClosedFab(false);
                    openMainFab();
                  }, 300);
                }}
              />
            </View>
          </Animated.View>
        )}

        {/* Settings Drawer */}
        <Animated.View
          style={[
            styles.drawer,
            styles.leftDrawer,
            {
              transform: [{ translateX: settingsDrawerTranslateX }],
              pointerEvents: settingsDrawerVisible ? "auto" : "none",
            },
          ]}
        >
          <View style={styles.drawerScreenContainer}>
            <SettingsScreen />
          </View>
        </Animated.View>

        {/* Links Drawer */}
        {false && (
          <Animated.View
            style={[
              styles.drawer,
              styles.bottomDrawer,
              {
                transform: [{ translateY: linksDrawerTranslateY }],
                pointerEvents: linksDrawerVisible ? "auto" : "none",
              },
            ]}
          >
            <View style={styles.drawerScreenContainer}>
              <LinksScreen />
            </View>
          </Animated.View>
        )}

        <InfoDrawer
          isOpen={infoDrawerVisible}
          onClose={() => setInfoDrawerVisible(false)}
          field={activeField}
        />

        {/* Info tab for iPhone fades in/out */}
        {!isTablet() && (
          <PanGestureHandler
            onGestureEvent={handleInfoTabDrag}
            enabled={shouldShowInfoTab}
          >
            <Animated.View
              pointerEvents={shouldShowInfoTab ? "auto" : "none"}
              style={[styles.infoTab, { top: tabY, opacity: infoTabOpacity }]}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                }}
                onPress={() => setInfoDrawerVisible(true)}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={24}
                  color={BRAND_COLORS.white}
                />
              </TouchableOpacity>
            </Animated.View>
          </PanGestureHandler>
        )}

        <FirstTimeGuideScreen
          visible={showFirstTimeGuide}
          onClose={handleGuideClose}
        />
      </View>
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
    position: "relative",
    zIndex: 1,
  } as ViewStyle,
  logoContainer: {
    width: "100%", // Make the container span the full width
    justifyContent: "center", // This handles vertical centering
    alignItems: "flex-start", // Align the logo to the left within this container
    paddingLeft: getResponsiveValue(20, 50), // Use responsive padding
    height: "100%", // Ensure it occupies the full height of the parent
  },
  logo: {
    width: getResponsiveValue(SCREEN_WIDTH * 0.6, SCREEN_WIDTH * 0.75),
    height: getResponsiveValue(
      getTypographySize("lg"),
      getTypographySize("xl"),
    ),
    maxWidth: isTablet() ? 600 : 420,
    maxHeight: isTablet() ? 180 : 126,
    resizeMode: "contain",
    opacity: 0.9,
    marginTop: getResponsiveValue(-35, -45), // Further up: -20 -> -35, -30 -> -45 (15px more)
  },
  mainScrollView: {
    flex: 1,
    zIndex: 8, // Higher than FAB container to ensure overlap works correctly
  },
  scrollContent: {
    paddingHorizontal: getSpacing("md"),
    paddingTop: getSpacing("lg"),
    paddingBottom: getSpacing("xxxl"),
  },
  inputSection: {
    backgroundColor: BRAND_COLORS.white,
    borderRadius: getBorderRadius("lg"),
    padding: getSpacing("lg"),
    ...BRAND_SHADOWS.medium,
    marginBottom: getSpacing("lg"),
    zIndex: 10, // Ensure it appears above data source info
    elevation: 10, // For Android
  },
  sectionTitleWrapper: {
    paddingHorizontal:
      Platform.OS === "ios" && Platform.isPad
        ? SCREEN_WIDTH * 0.25
        : getSpacing("md"),
    alignItems: "center",
    width: "100%",
  },
  sectionTitle: {
    fontSize: getResponsiveValue(
      getTypographySize("md"),
      getTypographySize("xl"),
    ),
    fontWeight: BRAND_TYPOGRAPHY.weights.bold,
    color: BRAND_COLORS.orange,
    marginBottom: getSpacing("md"),
    textAlign: "center",
    width: Platform.OS === "ios" && Platform.isPad ? 500 : "100%",
    maxWidth: "100%",
  },
  inputContainer: {
    marginBottom: getSpacing("md"),
  },
  inputWrapper: {
    width: "100%",
    paddingHorizontal:
      Platform.OS === "ios" && Platform.isPad
        ? SCREEN_WIDTH * 0.25
        : getSpacing("md"),
    alignItems: "flex-start",
  },
  input: {
    backgroundColor: BRAND_COLORS.lightGray,
    borderRadius: getBorderRadius("md"),
    paddingHorizontal: getSpacing("md"),
    paddingVertical: getSpacing("sm"),
    fontSize: getResponsiveValue(
      getTypographySize("md"),
      getTypographySize("md") * 1.2,
    ), // 20% larger on iPad
    color: BRAND_COLORS.darkNavy,
    marginBottom: getSpacing("md"),
    borderWidth: 1,
    borderColor: BRAND_COLORS.mediumGray,
    height: getInputConfig().height,
    width: Platform.OS === "ios" && Platform.isPad ? 500 : "100%",
    maxWidth: "100%",
  },
  suggestionsContainer: {
    backgroundColor: BRAND_COLORS.white,
    borderRadius: getBorderRadius("md"),
    ...BRAND_SHADOWS.small,
    marginBottom: getSpacing("md"),
    paddingVertical: getSpacing("xs"), // Reduced padding
    minHeight: 0,
    maxHeight: getResponsiveValue(325, 550), // Height for 5 items: 5 * (65/110) = 325/550
    width: Platform.OS === "ios" && Platform.isPad ? 500 : "100%",
    maxWidth: "100%",
    alignSelf: "flex-start",
    zIndex: 15, // Ensure suggestions appear above everything
    elevation: 15, // For Android
  },
  suggestionsScrollView: {
    maxHeight: getResponsiveValue(325, 550), // Match container height
  },
  suggestionItem: {
    paddingVertical: getResponsiveValue(4, 8), // More padding on iPad for larger text
    paddingHorizontal: getSpacing("sm"),
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.lightGray,
    width: "100%",
    flexShrink: 1,
  },
  suggestionCode: {
    fontSize: getResponsiveValue(
      getTypographySize("sm"),
      getTypographySize("md") * 1.2,
    ), // Match input field size on iPad
    fontWeight: BRAND_TYPOGRAPHY.weights.semibold,
    color: BRAND_COLORS.electricBlue,
    marginBottom: 1,
    flexShrink: 1,
  },
  suggestionDescription: {
    fontSize: getResponsiveValue(10, getTypographySize("sm") * 1.1), // Slightly smaller on iPad
    color: BRAND_COLORS.darkGray,
    lineHeight: getResponsiveValue(12, getTypographySize("sm") * 1.3), // Proportional line height
    marginTop: 0,
    flexShrink: 1,
    flexWrap: "wrap",
  },
  moreResultsIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: getSpacing("sm"),
    paddingHorizontal: getSpacing("md"),
    backgroundColor: BRAND_COLORS.lightGray,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.mediumGray,
  },
  moreResultsText: {
    fontSize: getResponsiveValue(
      getTypographySize("xs"),
      getTypographySize("sm"),
    ),
    color: BRAND_COLORS.mediumGray,
    marginLeft: getSpacing("xs"),
    fontStyle: "italic",
  },
  notFoundContainer: {
    padding: getSpacing("md"),
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundText: {
    fontSize: getResponsiveValue(
      getTypographySize("sm"),
      getTypographySize("md"),
    ),
    color: BRAND_COLORS.darkGray,
    fontStyle: "italic",
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: BRAND_COLORS.lightGray,
    borderRadius: getBorderRadius("md"),
    padding: getSpacing("md"),
    marginBottom: getSpacing("md"),
    width: Platform.OS === "ios" && Platform.isPad ? 500 : "100%",
    maxWidth: "100%",
  },
  toggleLabel: {
    fontSize: getResponsiveValue(
      getTypographySize("md"),
      getTypographySize("md") * 1.2,
    ), // 20% larger on iPad
    color: BRAND_COLORS.darkNavy,
    fontWeight: BRAND_TYPOGRAPHY.weights.medium,
    flex: 1,
  },
  searchButton: {
    backgroundColor: BRAND_COLORS.electricBlue,
    borderRadius: getBorderRadius("md"),
    paddingVertical: getSpacing("md"),
    paddingHorizontal: getSpacing("lg"),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...BRAND_SHADOWS.small,
    height:
      Platform.OS === "ios" && Platform.isPad
        ? getButtonConfig().height + 12
        : getButtonConfig().height,
    marginLeft:
      Platform.OS === "ios" && Platform.isPad
        ? SCREEN_WIDTH * 0.25
        : getSpacing("md"),
    alignSelf: "flex-start",
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: BRAND_COLORS.white,
    fontSize: getTypographySize("md"),
    fontWeight: BRAND_TYPOGRAPHY.weights.semibold,
    marginLeft: getSpacing("sm"),
    lineHeight: getTypographySize("md") * 1.4, // Adjusted line height for vertical centering
  },
  loadingMessageContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: getSpacing("md"),
    paddingHorizontal: getSpacing("lg"),
    marginTop: getSpacing("md"),
    marginLeft:
      Platform.OS === "ios" && Platform.isPad
        ? SCREEN_WIDTH * 0.25
        : getSpacing("md"),
    alignSelf: "flex-start",
  },
  loadingMessageText: {
    fontSize: getTypographySize("md"),
    fontWeight: BRAND_TYPOGRAPHY.weights.medium,
    color: BRAND_COLORS.electricBlue,
    textAlign: "center",
  },

  // Unified Floating Menu Styles
  heroFloatingMenuContainer: {
    position: "absolute",
    bottom: getResponsiveValue(5, 15), // iPhone: -5px more, iPad: -10px more for proportional spacing
    left: getResponsiveValue(20, 50), // Left padding to match logo alignment
    right: 0,
    alignItems: "flex-start", // Left align the FABs
    zIndex: 100, // High z-index to ensure FABs are clickable
  },
  menuFab: {
    position: "absolute",
  },
  menuFabButton: {
    width: getResponsiveValue(38, 64), // 80% size on iPhone (48 * 0.8 = 38.4 ≈ 38), iPad unchanged
    height: getResponsiveValue(38, 64), // 80% size on iPhone, iPad unchanged
    borderRadius: getResponsiveValue(19, 32), // Proportional border radius
    justifyContent: "center",
    alignItems: "center",
    ...BRAND_SHADOWS.medium,
  },

  mainFloatingFab: {
    position: "relative",
  },
  mainFloatingFabButton: {
    width: getResponsiveValue(45, 74), // 80% size on iPhone (56 * 0.8 = 44.8 ≈ 45), iPad unchanged
    height: getResponsiveValue(45, 74), // 80% size on iPhone, iPad unchanged
    borderRadius: getResponsiveValue(22.5, 37), // Proportional border radius
    backgroundColor: BRAND_COLORS.darkNavy,
    justifyContent: "center",
    alignItems: "center",
    ...BRAND_SHADOWS.large,
  },
  // Drawer content styles
  drawerContent: {
    flex: 1,
    padding: getSpacing("lg"),
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: getSpacing("md"),
    paddingBottom: getSpacing("md"),
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.lightGray,
  },
  drawerTitle: {
    fontSize: getTypographySize("lg"),
    fontWeight: BRAND_TYPOGRAPHY.weights.bold,
    color: BRAND_COLORS.darkNavy,
    marginLeft: getSpacing("sm"),
  },
  drawerScrollView: {
    flex: 1,
  },
  historyDrawerItem: {
    backgroundColor: BRAND_COLORS.white,
    borderRadius: getBorderRadius("md"),
    padding: getSpacing("md"),
    marginBottom: getSpacing("sm"),
    ...BRAND_SHADOWS.small,
    minHeight: getResponsiveValue(60, 72),
  },
  historyItemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  countryFlag: {
    width: getResponsiveValue(36, 44),
    height: getResponsiveValue(36, 44),
    borderRadius: getResponsiveValue(18, 22),
    backgroundColor: BRAND_COLORS.electricBlue,
    justifyContent: "center",
    alignItems: "center",
    marginRight: getSpacing("sm"),
  },
  countryCode: {
    color: BRAND_COLORS.white,
    fontSize: getTypographySize("xs"),
    fontWeight: BRAND_TYPOGRAPHY.weights.bold,
  },
  historyItemInfo: {
    flex: 1,
  },
  historyItemCode: {
    fontSize: getTypographySize("md"),
    fontWeight: BRAND_TYPOGRAPHY.weights.semibold,
    color: BRAND_COLORS.darkNavy,
  },
  historyItemDesc: {
    fontSize: getTypographySize("sm"),
    color: BRAND_COLORS.darkGray,
    marginVertical: 2,
  },
  historyItemAmount: {
    fontSize: getTypographySize("sm"),
    fontWeight: BRAND_TYPOGRAPHY.weights.semibold,
    color: BRAND_COLORS.electricBlue,
  },
  newsItem: {
    backgroundColor: BRAND_COLORS.white,
    borderRadius: getBorderRadius("md"),
    padding: getSpacing("md"),
    marginBottom: getSpacing("sm"),
    ...BRAND_SHADOWS.small,
  },
  newsTag: {
    alignSelf: "flex-start",
    paddingHorizontal: getSpacing("sm"),
    paddingVertical: getSpacing("xs"),
    borderRadius: getBorderRadius("sm"),
    marginBottom: getSpacing("sm"),
  },
  newsTagText: {
    color: BRAND_COLORS.white,
    fontSize: getTypographySize("xs"),
    fontWeight: BRAND_TYPOGRAPHY.weights.semibold,
  },
  newsTitle: {
    fontSize: getTypographySize("md"),
    fontWeight: BRAND_TYPOGRAPHY.weights.semibold,
    color: BRAND_COLORS.darkNavy,
    marginBottom: getSpacing("xs"),
  },
  newsDate: {
    fontSize: getTypographySize("sm"),
    color: BRAND_COLORS.darkGray,
  },
  analyticsCard: {
    marginBottom: getSpacing("sm"),
    borderRadius: getBorderRadius("md"),
    overflow: "hidden",
    ...BRAND_SHADOWS.small,
  },
  analyticsGradient: {
    padding: getSpacing("md"),
  },
  analyticsTitle: {
    fontSize: getTypographySize("sm"),
    color: BRAND_COLORS.white,
    marginBottom: getSpacing("xs"),
  },
  analyticsValue: {
    fontSize: getTypographySize("lg"),
    fontWeight: BRAND_TYPOGRAPHY.weights.bold,
    color: BRAND_COLORS.white,
    marginBottom: getSpacing("xs"),
  },
  analyticsTrend: {
    fontSize: getTypographySize("sm"),
    color: BRAND_COLORS.white,
    opacity: 0.8,
  },
  // Compact Results Drawer Styles
  resultsDrawerContent: {
    flex: 1,
    backgroundColor: BRAND_COLORS.white,
  },
  resultsDrawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: getSpacing("md"),
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.lightGray,
    backgroundColor: BRAND_COLORS.white,
    minHeight: getResponsiveValue(60, 80),
  },
  resultsHeaderLeft: {
    flex: 1,
  },
  resultsDrawerTitle: {
    fontSize: getResponsiveValue(
      getTypographySize("lg"),
      getTypographySize("lg") * 1.35,
    ), // 35% larger on iPad (reduced from 50%)
    fontWeight: BRAND_TYPOGRAPHY.weights.bold,
    color: BRAND_COLORS.darkNavy,
  },
  resultsDrawerSubtitle: {
    fontSize: getResponsiveValue(
      getTypographySize("sm"),
      getTypographySize("sm") * 1.35,
    ), // 35% larger on iPad (reduced from 50%)
    color: BRAND_COLORS.electricBlue,
    marginTop: 2,
  },
  resultsDrawerTimestamp: {
    fontSize: getResponsiveValue(
      getTypographySize("xs"),
      getTypographySize("xs") * 1.35,
    ),
    color: BRAND_COLORS.darkGray,
    marginTop: 4,
    fontStyle: "italic",
  },
  resultsScrollView: {
    flex: 1,
    padding: getResponsiveValue(getSpacing("md"), getSpacing("lg")), // More padding on iPad to use saved space
    paddingBottom: getSpacing("xl"),
  },
  totalAmountCard: {
    backgroundColor: BRAND_COLORS.electricBlue,
    borderRadius: getBorderRadius("md"),
    padding: getResponsiveValue(getSpacing("sm"), getSpacing("md")),
    alignItems: "center",
    marginBottom: getSpacing("sm"),
    ...BRAND_SHADOWS.medium,
    minHeight: getResponsiveValue(70, 105), // 30% reduction iPhone (100→70), 25% reduction iPad (140→105)
  },
  totalAmountLabel: {
    fontSize: getResponsiveValue(
      getTypographySize("xs"),
      getTypographySize("sm") * 1.35,
    ), // 35% larger on iPad (reduced from 50%)
    color: BRAND_COLORS.white,
    opacity: 0.9,
    marginBottom: getResponsiveValue(1, 2), // Reduced margin to save space
  },
  totalAmountValue: {
    fontSize: getResponsiveValue(
      getTypographySize("xl"),
      getTypographySize("xxl") * 1.35,
    ), // 35% larger on iPad (reduced from 50%)
    fontWeight: BRAND_TYPOGRAPHY.weights.bold,
    color: BRAND_COLORS.white,
    marginBottom: getResponsiveValue(1, 2), // Reduced margin to save space
    textAlign: "center",
  },
  totalAmountSubtext: {
    fontSize: getResponsiveValue(
      getTypographySize("xs"),
      getTypographySize("sm") * 1.35,
    ), // 35% larger on iPad (reduced from 50%)
    color: BRAND_COLORS.white,
    opacity: 0.8,
    textAlign: "center",
  },
  totalAmountBreakdown: {
    fontSize: getResponsiveValue(
      getTypographySize("xs") * 0.9,
      getTypographySize("sm") * 1.2,
    ), // Slightly smaller than subtext
    color: BRAND_COLORS.white,
    opacity: 0.7,
    fontStyle: "italic",
  },
  compactSection: {
    backgroundColor: BRAND_COLORS.lightGray,
    borderRadius: getBorderRadius("md"),
    padding: getResponsiveValue(getSpacing("md"), getSpacing("md")), // Reduced padding on iPad to save space
    marginBottom: getResponsiveValue(getSpacing("md"), getSpacing("sm")), // Reduced margin on iPad to save space
  },
  compactSectionTitle: {
    fontSize: getResponsiveValue(
      getTypographySize("md"),
      getTypographySize("lg") * 1.35,
    ), // 35% larger on iPad (reduced from 50%)
    fontWeight: BRAND_TYPOGRAPHY.weights.semibold,
    color: BRAND_COLORS.darkNavy,
    marginBottom: getResponsiveValue(getSpacing("sm"), getSpacing("xs")), // Reduced margin on iPad to save space
  },
  compactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: getResponsiveValue(getSpacing("xs"), getSpacing("xs")), // Reduced padding on iPad to save space
    minHeight: getResponsiveValue(36, 40), // Reduced height on iPad to save space
  },
  compactRowLeft: {
    flex: 1,
    marginRight: getSpacing("md"),
  },
  compactLabel: {
    fontSize: getResponsiveValue(
      getTypographySize("sm"),
      getTypographySize("md") * 1.35,
    ), // 35% larger on iPad (reduced from 50%)
    color: BRAND_COLORS.darkNavy,
    marginBottom: 1, // Reduced margin to save space
    lineHeight: getResponsiveValue(18, 22 * 1.2), // Tighter line height on iPad to save space
  },
  compactRate: {
    fontSize: getResponsiveValue(
      getTypographySize("xs"),
      getTypographySize("sm") * 1.35,
    ), // 35% larger on iPad (reduced from 50%)
    color: BRAND_COLORS.darkNavy,
  },
  compactAmount: {
    fontSize: getResponsiveValue(
      getTypographySize("md"),
      getTypographySize("lg") * 1.35,
    ), // 35% larger on iPad (reduced from 50%)
    fontWeight: BRAND_TYPOGRAPHY.weights.semibold,
    color: BRAND_COLORS.darkNavy,
  },
  compactHighlight: {
    fontSize: getResponsiveValue(
      getTypographySize("md"),
      getTypographySize("lg") * 1.35,
    ), // 35% larger on iPad (reduced from 50%)
    fontWeight: BRAND_TYPOGRAPHY.weights.bold,
    color: BRAND_COLORS.electricBlue,
  },
  compactMessageSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BRAND_COLORS.lightBlue,
    borderRadius: getBorderRadius("md"),
    padding: getResponsiveValue(getSpacing("md"), getSpacing("md")), // Reduced padding on iPad to save space
    marginBottom: getResponsiveValue(getSpacing("md"), getSpacing("sm")), // Reduced margin on iPad to save space
    minHeight: getResponsiveValue(44, 48), // Reduced height on iPad to save space
  },
  compactMessage: {
    fontSize: getResponsiveValue(
      getTypographySize("sm") * 1.5,
      getTypographySize("md") * 1.35,
    ), // 35% larger font size on iPad (reduced from 50%)
    color: BRAND_COLORS.white, // Changed to white
    marginLeft: getSpacing("sm"),
    flex: 1,
    lineHeight: getResponsiveValue(18 * 1.5, 22 * 1.35), // Proportional line height increase
  },
  unitCalculationsToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: getResponsiveValue(10, 12),
    paddingHorizontal: getResponsiveValue(12, 16),
    marginHorizontal: getResponsiveValue(12, 16),
    marginTop: getResponsiveValue(8, 10),
    backgroundColor: BRAND_COLORS.lightGray,
    borderRadius: getBorderRadius("md"),
  },
  unitCalculationsToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: getResponsiveValue(8, 10),
  },
  unitCalculationsToggleText: {
    fontSize: getTypographySize("sm"),
    fontWeight: BRAND_TYPOGRAPHY.weights.medium,
    color: BRAND_COLORS.darkNavy,
  },

  // Header button styles
  headerButtons: {
    flexDirection: "row",
    gap: getSpacing("sm"),
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: getSpacing("sm"),
    paddingVertical: getSpacing("xs"),
    borderRadius: getBorderRadius("md"),
    borderWidth: 1,
    gap: getSpacing("xs"),
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
    fontSize: getResponsiveValue(
      getTypographySize("sm"),
      getTypographySize("sm") * 1.35,
    ), // 35% larger on iPad (reduced from 50%)
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
    fontSize: getResponsiveValue(
      getTypographySize("sm"),
      getTypographySize("sm") * 1.35,
    ),
    fontWeight: BRAND_TYPOGRAPHY.weights.medium,
    color: BRAND_COLORS.success,
  },

  // Drawer screen container
  drawerScreenContainer: {
    flex: 1,
    backgroundColor: BRAND_COLORS.white,
  },

  // Custom drawer styles to avoid ScrollView nesting
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlayBackground: {
    flex: 1,
    backgroundColor: "rgba(10, 26, 62, 0.5)",
  },
  drawer: {
    position: "absolute",
    backgroundColor: BRAND_COLORS.white,
    zIndex: 1001,
    ...BRAND_SHADOWS.large,
  },
  leftDrawer: {
    left: 0,
    top: 0,
    bottom: 0,
    width: getResponsiveValue(SCREEN_WIDTH * 0.85, 400),
    borderTopRightRadius: getBorderRadius("lg"),
    borderBottomRightRadius: getBorderRadius("lg"),
  },
  rightDrawer: {
    right: 0,
    top: 0,
    bottom: 0,
    width: getResponsiveValue(SCREEN_WIDTH * 0.85, 400),
    borderTopLeftRadius: getBorderRadius("lg"),
    borderBottomLeftRadius: getBorderRadius("lg"),
  },
  bottomDrawer: {
    left: 0,
    right: 0,
    top: 0, // Start from top to use full screen
    bottom: 0,
    borderTopLeftRadius: getBorderRadius("lg"),
    borderTopRightRadius: getBorderRadius("lg"),
  },

  // Loading Modal Styles
  loadingModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingModalContent: {
    backgroundColor: BRAND_COLORS.white,
    borderRadius: getBorderRadius("lg"),
    padding: getSpacing("xl"),
    alignItems: "center",
    ...BRAND_SHADOWS.large,
    minWidth: getResponsiveValue(200, 250),
  },
  loadingSpinnerContainer: {
    marginBottom: getSpacing("md"),
  },
  loadingModalText: {
    fontSize: getTypographySize("lg"),
    fontWeight: BRAND_TYPOGRAPHY.weights.semibold,
    color: BRAND_COLORS.darkNavy,
  },
  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: getSpacing("md"),
    paddingHorizontal:
      Platform.OS === "ios" && Platform.isPad
        ? SCREEN_WIDTH * 0.25
        : getSpacing("md"),
  },
  clearButton: {
    backgroundColor: BRAND_COLORS.orange,
    borderRadius: getBorderRadius("md"),
    paddingVertical: getSpacing("md"),
    paddingHorizontal: getSpacing("lg"),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...BRAND_SHADOWS.small,
    height:
      Platform.OS === "ios" && Platform.isPad
        ? getButtonConfig().height + 12
        : getButtonConfig().height,
  },
  clearButtonText: {
    color: BRAND_COLORS.white,
    fontSize: getTypographySize("md"),
    fontWeight: BRAND_TYPOGRAPHY.weights.semibold,
    marginLeft: getSpacing("sm"),
    lineHeight: getTypographySize("md") * 1.4, // Adjusted line height for vertical centering
  },
  infoTab: {
    position: "absolute",
    left: 0,
    width: 40,
    height: 40,
    backgroundColor: BRAND_COLORS.electricBlue,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    ...BRAND_SHADOWS.medium,
    zIndex: 3000,
    elevation: 30,
  },
  totalAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: getSpacing("sm"),
  },
  dataSourceInfoContainer: {
    position: "absolute",
    bottom: 10, // 10px from bottom of screen
    left: 0,
    right: 0,
    alignItems: "center",
    borderRadius: getBorderRadius("md"),
    marginHorizontal: getSpacing("md"),
    ...BRAND_SHADOWS.small,
    zIndex: 1, // Above background but below interactive elements
    overflow: "hidden", // Ensure gradient respects border radius
  },
  dataSourceGradient: {
    width: "100%",
    paddingVertical: getSpacing("xs"),
    paddingHorizontal: getSpacing("md"),
    alignItems: "center",
  },
  dataSourceInfoLine: {
    fontSize: getResponsiveValue(
      getTypographySize("xs"),
      getTypographySize("sm"),
    ),
    color: BRAND_COLORS.white,
    textAlign: "center",
    lineHeight: getResponsiveValue(14, 18),
    opacity: 0.9,
  },
});
