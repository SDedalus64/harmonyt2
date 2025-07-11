/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, react-native/no-inline-styles, react-native/no-color-literals, react-native/sort-styles, react-native/no-unused-styles, @typescript-eslint/no-require-imports */
import HtsDropdown from "../components/HtsDropdown";
import React, { useState, useEffect, useRef, RefObject } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Keyboard,
  Dimensions,
  Animated,
  ViewStyle,
  Modal,
  useWindowDimensions,
  ImageStyle,
  UIManager,
  findNodeHandle,
  TouchableWithoutFeedback,
} from "react-native";
import { Text } from "../components/Text";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MainTabParamList } from "../navigation/types";
import CountryLookup, { CountryLookupRef } from "../components/CountryLookup";
import { useTariff } from "../hooks/useTariff";
import { useHistory, HistoryItem } from "../hooks/useHistory";
import { useSettings } from "../hooks/useSettings";
import { getCountryName } from "../utils/countries";
import DisclaimerModal from "./DisclaimerModal";
import HistoryScreen from "./HistoryScreen";
import SettingsScreen from "./SettingsScreen";
import LinksScreen from "./LinksScreen";
import TariffEngineeringComparison from "../components/TariffEngineeringComparison";
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
import { HorizontalSection } from "../components/shared/HorizontalSection";
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
  "#003559": BRAND_COLORS.darkNavy,
  "#0A99F2": BRAND_COLORS.electricBlue,
  "#FFCC01": BRAND_COLORS.orange,
  white: BRAND_COLORS.white,
  lightGray: BRAND_COLORS.lightGray,
  mediumGray: BRAND_COLORS.mediumGray,
  darkGray: BRAND_COLORS.darkGray,
  "#000000": BRAND_COLORS.black,
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
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const { saveToHistory, history, loadHistory } = useHistory();
  const { settings, updateSetting, isLoading: settingsLoading } = useSettings();
  const [selectedDescription, setSelectedDescription] = useState(""); // Add this line

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
  const countryInputRef = useRef<CountryLookupRef>(null);
  const declaredValueInputRef = useRef<TextInput>(null);
  const freightCostInputRef = useRef<TextInput>(null);
  const htsCodeInputRef = useRef<TextInput>(null);
  const additionalCostInputRef = useRef<TextInput>(null);
  const unitCountInputRef = useRef<TextInput>(null);
  // Use generic ref to support both ScrollView and KeyboardAwareScrollView
  const resultScrollViewRef = useRef<any>(null);
  const unitEntryRef = useRef<View>(null);
  const [htsSuggestions, setHtsSuggestions] = useState<
    Array<{ code: string; description: string }>
  >([]);
  const [showHtsSuggestions, setShowHtsSuggestions] = useState(false);
  const [htsSearchMessage, setHtsSearchMessage] = useState<string>("");
  const [showUnitCalculations, setShowUnitCalculations] = useState(
    settings.showUnitCalculations ?? true,
  );
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const loadingSpinValue = useRef(new Animated.Value(0)).current;
  const [isUSMCAOrigin, setIsUSMCAOrigin] = useState(false);
  const [isLoadingFromHistory, setIsLoadingFromHistory] = useState(false);

  // New drawer state
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false);
  const [newsDrawerVisible, setNewsDrawerVisible] = useState(false);
  const [analyticsDrawerVisible, setAnalyticsDrawerVisible] = useState(false);
  const [resultsDrawerVisible, setResultsDrawerVisible] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [htsDescriptionExpanded, setHtsDescriptionExpanded] = useState(false);

  // Multi-field states
  const [currentAdditionalCost, setCurrentAdditionalCost] = useState("");
  const [additionalCosts, setAdditionalCosts] = useState<
    Array<{ id: string; amount: number; label?: string }>
  >([]);
  const [currentUnitCount, setCurrentUnitCount] = useState("");
  const [unitCounts, setUnitCounts] = useState<
    Array<{ id: string; amount: number; label?: string }>
  >([]);

  // Navigation drawer states
  const [mainHistoryDrawerVisible, setMainHistoryDrawerVisible] =
    useState(false);
  const [settingsDrawerVisible, setSettingsDrawerVisible] = useState(false);
  const [linksDrawerVisible, setLinksDrawerVisible] = useState(false);
  const [tariffEngineeringDrawerVisible, setTariffEngineeringDrawerVisible] =
    useState(false);

  // Main navigation FAB state
  const [mainFabExpanded, setMainFabExpanded] = useState(false); // closed by default until disclaimer accepted
  const [userClosedFab, setUserClosedFab] = useState(false);

  // Animation values for unified floating menu
  const mainFabRotation = useRef(new Animated.Value(0)).current;
  const menuFabScale = useRef(new Animated.Value(0)).current; // Start at 0 since menu starts collapsed
  const menuFabOpacity = useRef(new Animated.Value(0)).current; // Start at 0 since menu starts collapsed

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
  const tariffEngineeringFabTranslateX = useRef(new Animated.Value(0)).current;
  const tariffEngineeringFabTranslateY = useRef(new Animated.Value(0)).current;

  // Navigation drawer animations
  const historyDrawerTranslateX = useRef(
    new Animated.Value(getResponsiveValue(SCREEN_WIDTH * 0.85, 400)),
  ).current;
  const linksDrawerTranslateY = useRef(
    new Animated.Value(SCREEN_HEIGHT),
  ).current;
  const navDrawerOpacity = useRef(new Animated.Value(0)).current;

  // after other state declarations add:
  const [infoDrawerVisible, setInfoDrawerVisible] = useState(false);
  const [activeField, setActiveField] = useState<InfoFieldKey | null>(null);
  const isOpeningInfoDrawer = useRef(false);
  const [tabY, setTabY] = useState<number>(0);
  const [showFirstTimeGuide, setShowFirstTimeGuide] = useState(false);

  // Opacity for fading info tab (iPhone only)
  const infoTabOpacity = useRef(new Animated.Value(0)).current;

  // Determine if tab should be visible - only show for the active field
  const shouldShowInfoTab = !!activeField && !infoDrawerVisible;

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
    // Collapse HTS description when focusing other fields
    setHtsDescriptionExpanded(false);

    // measure position
    const ref = fieldRefs[field as keyof typeof fieldRefs];
    if (ref && ref.current) {
      // Add a small delay on Android to ensure layout is complete
      const measureDelay = Platform.OS === "android" ? 50 : 0;

      setTimeout(() => {
        if (ref.current) {
          // Use UIManager.measure for Android as measureInWindow can be unreliable
          if (Platform.OS === "android") {
            const handle = findNodeHandle(ref.current);
            if (handle) {
              UIManager.measure(handle, (x, y, width, height, pageX, pageY) => {
                console.log(
                  `[InfoTab] Android UIManager.measure - Field: ${field}, x: ${x}, y: ${y}, width: ${width}, height: ${height}, pageX: ${pageX}, pageY: ${pageY}`,
                );

                if (
                  typeof pageY === "number" &&
                  typeof height === "number" &&
                  !isNaN(pageY) &&
                  !isNaN(height) &&
                  pageY > 0 &&
                  height > 0
                ) {
                  const tabHeight = 40;
                  // pageY is already screen-relative, don't subtract insets.top
                  // Instead, just use pageY directly and center the tab
                  const centerY = pageY + height / 2 - tabHeight / 2;

                  console.log(
                    `[InfoTab] Android calculated - pageY: ${pageY}, height: ${height}, centerY: ${centerY}, insets.top: ${insets.top}`,
                  );

                  setTabY(Math.max(50, centerY));
                } else {
                  // Fallback with a better default based on field
                  // Final positions - perfectly aligned
                  const fieldDefaults = {
                    code: 322, // Perfect!
                    declared: 433, // Perfect!
                    freight: 489, // Added 2px more
                    units: 546, // Perfect!
                  };
                  const fallbackY = field ? fieldDefaults[field] : 200;
                  console.log(
                    `[InfoTab] Android measure failed for field: ${field}, using fallback: ${fallbackY}`,
                  );
                  setTabY(fallbackY || 200);
                }
              });
            }
          } else {
            // iOS uses measureInWindow as before
            ref.current.measureInWindow((x, y, width, height) => {
              if (
                typeof y === "number" &&
                typeof height === "number" &&
                !isNaN(y) &&
                !isNaN(height) &&
                y > 0 &&
                height > 0
              ) {
                const spacing = getSpacing("sm");
                if (typeof spacing === "number" && !isNaN(spacing)) {
                  setTabY(y + height / 2 - 20 - spacing);
                }
              } else {
                setTabY(200);
              }
            });
          }
        }
      }, measureDelay);
    }
  };

  const handleInfoPress = (field: InfoFieldKey) => {
    setActiveField(field);
    Keyboard.dismiss();
    setInfoDrawerVisible(true);
  };

  useEffect(() => {
    loadHistory();
    // Tariff data is now preloaded in App.tsx
  }, []);

  // Check if disclaimer has been accepted
  useEffect(() => {
    const checkDisclaimer = async () => {
      try {
        const hasAcceptedDisclaimer = await AsyncStorage.getItem(
          "hasAcceptedDisclaimer",
        );
        if (hasAcceptedDisclaimer === null) {
          // First time, show the disclaimer
          setShowDisclaimer(true);
        }
      } catch (error) {
        console.log("Error checking disclaimer status:", error);
      }
    };
    checkDisclaimer();
  }, []);

  // Animation effects for navigation drawers
  useEffect(() => {
    animateHistoryDrawer(mainHistoryDrawerVisible);
  }, [mainHistoryDrawerVisible]);

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
          const results = await tariffSearchService.searchByPrefix(htsCode, 50);
          console.log("[Search] Results:", results.length);

          setHtsSuggestions(results);
          if (results.length === 0) {
            setHtsSearchMessage("");
          } else {
            setHtsSearchMessage(
              results.length === 50 ? "Showing first 50 matches" : "",
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

    const debounceTimer = setTimeout(searchForSuggestions, 150);
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

  const handleHtsSelection = (code: string, description?: string) => {
    haptics.selection();
    setHtsCode(code);
    // Remove the HTS code from the beginning of the description if it exists
    let cleanDescription = description || "";
    if (cleanDescription.startsWith(code)) {
      cleanDescription = cleanDescription.substring(code.length).trim();
    }
    setSelectedDescription(cleanDescription); // Store the cleaned description
    setShowHtsSuggestions(false);
    setHtsSuggestions([]); // Clear suggestions
    Keyboard.dismiss(); // Dismiss keyboard
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
    // Remove $ and commas, keep only numbers and decimal
    const cleanedValue = value.replace(/[$,]/g, "");
    const numericValue = cleanedValue.replace(/[^\d.]/g, "");
    setDeclaredValue(numericValue);

    // Format while typing with $ and commas
    if (numericValue) {
      const formatted = `$${formatNumberWithCommas(numericValue)}`;
      setFormattedDeclaredValue(formatted);
    } else {
      setFormattedDeclaredValue("");
    }
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
    // Unit calculations now always show when units are provided
    // No need to reset showUnitCalculations state
  };

  // Handle additional cost change with real-time formatting
  const handleAdditionalCostChange = (value: string) => {
    // Remove $ and commas, keep only numbers and decimal
    const cleanedValue = value.replace(/[$,]/g, "");
    const numericValue = cleanedValue.replace(/[^\d.]/g, "");

    // Format while typing with $ and commas
    if (numericValue) {
      const formatted = `$${formatNumberWithCommas(numericValue)}`;
      setCurrentAdditionalCost(formatted);
    } else {
      setCurrentAdditionalCost("");
    }
  };

  // Multi-field handlers
  const handleAddAdditionalCost = () => {
    const amount = parseFloat(currentAdditionalCost.replace(/[^0-9.]/g, ""));
    if (!isNaN(amount) && amount > 0) {
      // Add to existing total instead of replacing
      const currentTotal =
        additionalCosts.length > 0 ? additionalCosts[0].amount : 0;
      setAdditionalCosts([
        {
          id: "total",
          amount: currentTotal + amount,
        },
      ]);
      // Clear the field for another entry
      setCurrentAdditionalCost("");
      haptics.selection();
    }
  };

  const handleDeleteAdditionalCost = (id: string) => {
    // Clear the entire cost chip
    setAdditionalCosts([]);
    haptics.selection();
  };

  const handleAddUnitCount = () => {
    const amount = parseFloat(currentUnitCount);
    if (!isNaN(amount) && amount > 0) {
      // Add to existing total instead of replacing
      const currentTotal = unitCounts.length > 0 ? unitCounts[0].amount : 0;
      setUnitCounts([
        {
          id: "total",
          amount: currentTotal + amount,
        },
      ]);
      // Clear the field for another entry
      setCurrentUnitCount("");
      haptics.selection();

      // Dismiss keyboard after adding units to see the result
      Keyboard.dismiss();
    }
  };

  const handleDeleteUnitCount = (id: string) => {
    // Clear the entire unit chip
    setUnitCounts([]);
    haptics.selection();
  };

  const formatArithmetic = () => {
    const declaredVal = parseFloat(declaredValue) || 0;
    const additionalTotal = additionalCosts.reduce(
      (sum, cost) => sum + cost.amount,
      0,
    );
    const total = declaredVal + additionalTotal;

    if (additionalCosts.length === 0) {
      return (
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.arithmeticText}>
            ${formatNumberWithCommas(declaredVal.toString())}
          </Text>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.arithmeticContainer,
          { paddingRight: isTablet() ? 0 : 35 },
        ]}
      >
        <Text style={styles.arithmeticText}>
          ${formatNumberWithCommas(declaredVal.toString())}
        </Text>
        <View style={styles.arithmeticRow}>
          <Text style={styles.arithmeticText}>
            + ${formatNumberWithCommas(additionalTotal.toString())}
          </Text>
          <TouchableOpacity
            onPress={() => handleDeleteAdditionalCost("total")}
            style={{ position: "absolute", right: isTablet() ? -30 : -25 }}
          >
            <Ionicons
              name="close-circle"
              size={getResponsiveValue(21, 24)}
              color={BRAND_COLORS.electricBlue}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.arithmeticDivider} />
        <Text style={[styles.arithmeticText, styles.arithmeticTotal]}>
          ${formatNumberWithCommas(total.toString())}
        </Text>
      </View>
    );
  };

  const formatUnitArithmetic = () => {
    const total = unitCounts.reduce((sum, unit) => sum + unit.amount, 0);

    return (
      <View
        style={{ alignItems: "flex-end", paddingRight: isTablet() ? 0 : 35 }}
      >
        <View style={styles.arithmeticRow}>
          <Text style={styles.arithmeticText}>
            {total.toLocaleString("en-US")} units
          </Text>
          <TouchableOpacity
            onPress={() => handleDeleteUnitCount("total")}
            style={{ position: "absolute", right: isTablet() ? -30 : -25 }}
          >
            <Ionicons
              name="close-circle"
              size={getResponsiveValue(21, 24)}
              color={BRAND_COLORS.electricBlue}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
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
      // Use requestAnimationFrame for immediate scroll after render
      requestAnimationFrame(() => {
        // Scroll to the bottom to show the save buttons
        // Since header now scrolls with content, we can go all the way down
        resultScrollViewRef.current?.scrollToEnd({
          animated: true,
        });
      });
    }
  }, [showInput, result]);

  // Clear unit count when setting is turned off
  useEffect(() => {
    if (!(settings.showUnitCalculations ?? true)) {
      setUnitCount("");
      setFormattedUnitCount("");
    }
  }, [settings.showUnitCalculations]);

  // Scroll to bottom when unit count is entered and results are shown
  useEffect(() => {
    if (
      unitCount &&
      parseFloat(unitCount) > 0 &&
      result &&
      resultScrollViewRef.current
    ) {
      requestAnimationFrame(() => {
        resultScrollViewRef.current?.scrollToEnd({
          animated: true,
        });
      });
    }
  }, [unitCount, result]);

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

  const handleDisclaimerAgree = async () => {
    haptics.success();
    try {
      await AsyncStorage.setItem("hasAcceptedDisclaimer", "true");
    } catch (error) {
      console.log("Error saving disclaimer acceptance:", error);
    }
    setShowDisclaimer(false);
    // The useEffect listening to showDisclaimer will handle showing the guide
    openMainFab();
  };

  const handleGuideClose = async (dontShowAgain: boolean) => {
    setShowFirstTimeGuide(false);
    if (dontShowAgain) {
      try {
        // Update the settings to disable quick tour
        await updateSetting("showQuickTour", false);
        // Also set the AsyncStorage key for backwards compatibility
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
    setHtsDescriptionExpanded(false);

    if (!htsCode || !selectedCountry || !declaredValue) {
      haptics.error();
      Alert.alert("Missing Information");
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
      // Calculate total declared value including additional costs
      const totalDeclaredValue =
        parseFloat(declaredValue) +
        additionalCosts.reduce((sum, cost) => sum + cost.amount, 0);

      const calculation = await tariffService.calculateDuty(
        htsCode,
        totalDeclaredValue,
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
    setSelectedDescription(""); // Clear the selected description
    setHtsDescriptionExpanded(false); // Collapse description
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
    setShowUnitCalculations(settings.showUnitCalculations ?? true); // Reset to user preference
    setLoadedHistoryTimestamp(null); // Reset the history timestamp
    setIsUSMCAOrigin(false); // Reset USMCA origin

    // Clear chips data
    setAdditionalCosts([]);
    setCurrentAdditionalCost("");
    setUnitCounts([]);
    setCurrentUnitCount("");

    // Focus on HTS code input for new lookup
    requestAnimationFrame(() => {
      htsCodeInputRef.current?.focus();
    });
  };

  const handleRepeatLookup = () => {
    // Keep the same HTS code, country, declared value, and unit count - just close results
    setResult(null);
    setResultsDrawerVisible(false);
    setIsSaved(false);
    // Don't reset showUnitCalculations - keep current state

    // Focus on declared value input since all data is preserved
    requestAnimationFrame(() => {
      declaredValueInputRef.current?.focus();
    });
  };

  const handleHistoryItemSelection = (historyItem: HistoryItem) => {
    haptics.selection();

    // Set loading from history flag
    setIsLoadingFromHistory(true);

    // Clear any HTS suggestions first
    setShowHtsSuggestions(false);
    setHtsSuggestions([]);

    // Set the selected description from history BEFORE setting HTS code
    // This prevents the dropdown from showing
    if (historyItem.description) {
      setSelectedDescription(historyItem.description);
    }

    // Now set the HTS code
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
      setShowUnitCalculations(settings.showUnitCalculations ?? true);
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
      setLoadedHistoryTimestamp(historyItem.timestamp || Date.now());

      // Open results drawer to show the saved calculation
      setResultsDrawerVisible(true);
    }

    // Close navigation drawers
    closeAllNavigationDrawers();
  };

  // New function to populate fields from most recent history without opening results
  const handleRecentLookupPopulate = () => {
    if (history.length === 0) {
      haptics.error();
      Alert.alert("No History", "No recent lookups found.");
      return;
    }

    haptics.selection();
    const mostRecentItem = history[0]; // History is already sorted by most recent

    // Clear any results and reset state
    setResult(null);
    setResultsDrawerVisible(false);
    setIsSaved(false);
    setLoadedHistoryTimestamp(null);

    // Clear any HTS suggestions first
    setShowHtsSuggestions(false);
    setHtsSuggestions([]);

    // Set the selected description from history BEFORE setting HTS code
    if (mostRecentItem.description) {
      setSelectedDescription(mostRecentItem.description);
    }

    // Now set the HTS code
    setHtsCode(mostRecentItem.htsCode);

    // Set country
    const countryCode = mostRecentItem.countryCode;
    const countryName =
      mostRecentItem.countryName || getCountryName(countryCode);

    setSelectedCountry({
      code: countryCode,
      name: countryName,
    });

    // Set declared value
    const savedDeclaredValue = mostRecentItem.declaredValue
      ? mostRecentItem.declaredValue.toString()
      : "";
    setDeclaredValue(savedDeclaredValue);
    setFormattedDeclaredValue(
      savedDeclaredValue
        ? `$${formatNumberWithCommas(savedDeclaredValue)}`
        : "",
    );

    // Restore freight cost if available
    if (mostRecentItem.freightCost) {
      const freight = mostRecentItem.freightCost.toString();
      setFreightCost(freight);
      setFormattedFreightCost(`$${formatNumberWithCommas(freight)}`);
    } else {
      setFreightCost("");
      setFormattedFreightCost("");
    }

    // Restore unit count if available
    if (mostRecentItem.unitCount) {
      const units = mostRecentItem.unitCount.toString();
      setUnitCount(units);
      setFormattedUnitCount(formatNumberWithCommas(units));
    } else {
      setUnitCount("");
      setFormattedUnitCount("");
    }

    // Restore showUnitCalculations state if available
    if (mostRecentItem.showUnitCalculations !== undefined) {
      setShowUnitCalculations(mostRecentItem.showUnitCalculations);
    }

    // Close all drawers to show the populated form
    closeAllNavigationDrawers();
    closeAllDrawers();
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
              const loadHistoryItem = () => {
                // Close history drawer first
                setHistoryDrawerVisible(false);
                // Handle history item selection immediately
                handleHistoryItemSelection(item);
              };

              // Check for unsaved results before loading
              if (!settings.autoSaveToHistory && result && !isSaved) {
                Alert.alert(
                  "Unsaved Lookup",
                  "You have an unsaved lookup. Do you want to save it before loading this history item?",
                  [
                    {
                      text: "Discard",
                      style: "destructive",
                      onPress: loadHistoryItem,
                    },
                    {
                      text: "Save & Load",
                      onPress: async () => {
                        await handleSaveToHistory(false);
                        loadHistoryItem();
                      },
                    },
                    {
                      text: "Cancel",
                      style: "cancel",
                    },
                  ],
                );
              } else {
                loadHistoryItem();
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
              {selectedCountry?.name}
            </Text>
            {result.description && (
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => {
                  haptics.selection();
                  setDescriptionExpanded(!descriptionExpanded);
                }}
              >
                <Text
                  style={[
                    styles.resultsDrawerDescription,
                    descriptionExpanded &&
                      styles.resultsDrawerDescriptionExpanded,
                  ]}
                  numberOfLines={descriptionExpanded ? undefined : 1}
                  ellipsizeMode="tail"
                >
                  {result.description}
                </Text>
              </TouchableOpacity>
            )}
            <Text style={styles.resultsDrawerTimestamp}>
              {currentTimestamp}
            </Text>
          </View>
          <View style={styles.headerButtonsVertical}>
            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.headerButtonStacked,
                styles.saveHeaderButtonStacked,
              ]}
              onPress={() => {
                haptics.buttonPress();
                // If AutoSave is on or off, just close the drawer
                setResultsDrawerVisible(false);
                setDescriptionExpanded(false);
                setUserClosedFab(false);
                openMainFab();
              }}
            >
              <Ionicons
                name="bookmark"
                size={getResponsiveValue(16, 20)}
                color={BRAND_COLORS.electricBlue}
              />
              <Text style={styles.headerButtonStackedText}>Save</Text>
            </TouchableOpacity>

            {/* Clear Button */}
            <TouchableOpacity
              style={[
                styles.headerButtonStacked,
                styles.clearHeaderButtonStacked,
              ]}
              onPress={() => {
                haptics.buttonPress();
                if (!settings.autoSaveToHistory && result && !isSaved) {
                  // Show warning if AutoSave is off and result is unsaved
                  Alert.alert(
                    "Clear Results",
                    "You have unsaved results. What would you like to do?",
                    [
                      {
                        text: "Cancel",
                        style: "cancel",
                      },
                      {
                        text: "Don't Save",
                        style: "destructive",
                        onPress: () => {
                          handleClearAll();
                          setResultsDrawerVisible(false);
                          setDescriptionExpanded(false);
                          setUserClosedFab(false);
                          openMainFab();
                        },
                      },
                      {
                        text: "Save",
                        onPress: async () => {
                          await handleSaveToHistory(false);
                          handleClearAll();
                          setResultsDrawerVisible(false);
                          setDescriptionExpanded(false);
                          setUserClosedFab(false);
                          openMainFab();
                        },
                      },
                    ],
                  );
                } else {
                  // AutoSave is on or result is already saved
                  handleClearAll();
                  setResultsDrawerVisible(false);
                  setDescriptionExpanded(false);
                  setUserClosedFab(false);
                  openMainFab();
                }
              }}
            >
              <Ionicons
                name="trash-outline"
                size={getResponsiveValue(16, 20)}
                color={BRAND_COLORS.orange}
              />
              <Text
                style={[
                  styles.headerButtonStackedText,
                  { color: BRAND_COLORS.orange },
                ]}
              >
                Clear
              </Text>
            </TouchableOpacity>

            {/* Tariff Intel Button */}
            <TouchableOpacity
              style={[
                styles.headerButtonStacked,
                styles.tariffIntelHeaderButtonStacked,
              ]}
              onPress={() => {
                haptics.buttonPress();
                Keyboard.dismiss();
                setResultsDrawerVisible(false);
                setTariffEngineeringDrawerVisible(true);
              }}
            >
              <Ionicons
                name="bulb"
                size={getResponsiveValue(16, 20)}
                color={BRAND_COLORS.success}
              />
              <Text
                style={[
                  styles.headerButtonStackedText,
                  { color: BRAND_COLORS.success },
                ]}
              >
                Find Better Options?
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.resultsContainer, { flex: 1 }]}>
          <ScrollView
            style={[styles.resultsScrollView, { flex: 1 }]}
            contentContainerStyle={{ paddingBottom: getSpacing("xl") }}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            decelerationRate="normal"
            bounces={true}
          >
            {/* Duties vs Landed Cost */}
            {(() => {
              const dutiableValue = parseFloat(declaredValue);
              const additionalCostsTotal = additionalCosts.reduce(
                (sum, cost) => sum + cost.amount,
                0,
              );
              const merchandiseValueForLanded =
                dutiableValue +
                additionalCostsTotal +
                (freightCost ? parseFloat(freightCost) : 0);
              const landedCost = merchandiseValueForLanded + result.totalAmount;
              const hasFreightCost = freightCost && parseFloat(freightCost) > 0;
              const hasAdditionalCosts = additionalCostsTotal > 0;
              const showLandedCost = hasFreightCost || hasAdditionalCosts;

              return (
                <View
                  style={[
                    styles.totalAmountRow,
                    {
                      justifyContent: showLandedCost
                        ? "space-between"
                        : "flex-end",
                    },
                  ]}
                >
                  {/* Duties */}
                  <View
                    style={[
                      styles.totalAmountCard,
                      {
                        marginRight: showLandedCost ? 8 : 0,
                        flex: showLandedCost ? 1 : undefined,
                      },
                    ]}
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
                  {/* Landed Cost - show if freight cost or additional costs exist */}
                  {showLandedCost && (
                    <View
                      style={[
                        styles.totalAmountCard,
                        { marginLeft: 8, flex: 1 },
                      ]}
                    >
                      <Text style={styles.totalAmountLabel}>
                        Est. Landed Cost
                      </Text>
                      <Text style={styles.totalAmountValue}>
                        {formatCurrency(landedCost)}
                      </Text>
                      <Text style={styles.totalAmountSubtext}>
                        COGs+duties+other costs
                      </Text>
                    </View>
                  )}
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

            {/* Unit Calculations - Display directly when units are provided */}
            {(() => {
              const totalUnitCount = unitCounts.reduce(
                (sum, unit) => sum + unit.amount,
                0,
              );
              const totalDeclaredValue =
                parseFloat(declaredValue) +
                additionalCosts.reduce((sum, cost) => sum + cost.amount, 0);

              if (totalUnitCount > 0) {
                return (
                  <View style={styles.compactSection}>
                    <Text style={styles.compactSectionTitle}>
                      Per Unit ({formatNumber(totalUnitCount, 0)} units)
                    </Text>
                    <View style={styles.compactRow}>
                      <Text style={styles.compactLabel}>Duty Cost</Text>
                      <Text style={styles.compactAmount}>
                        {formatCurrency(result.totalAmount / totalUnitCount)}
                      </Text>
                    </View>
                    {/* Landed cost per unit - show total value including all costs */}
                    <View style={styles.compactRow}>
                      <Text style={styles.compactLabel}>Landed Cost</Text>
                      <Text style={styles.compactAmount}>
                        {formatCurrency(
                          (totalDeclaredValue + result.totalAmount) /
                            totalUnitCount,
                        )}
                      </Text>
                    </View>
                    {(() => {
                      // Show RT cost separately if applicable
                      if (result.components) {
                        const rtComponent = result.components.find(
                          (c: DutyComponent) =>
                            c.type === RECIPROCAL_TARIFF_TYPE,
                        );
                        if (rtComponent && rtComponent.amount > 0) {
                          return (
                            <View style={styles.compactRow}>
                              <Text style={styles.compactLabel}>
                                Addl RT cost
                              </Text>
                              <Text style={styles.compactHighlight}>
                                {formatCurrency(
                                  rtComponent.amount / totalUnitCount,
                                )}
                              </Text>
                            </View>
                          );
                        }
                      }
                      return null;
                    })()}
                  </View>
                );
              }
              return null;
            })()}
          </ScrollView>
        </View>
      </View>
    );
  };

  // Unified floating menu animations with horizontal layout
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

    const spacing = isTablet() ? getResponsiveValue(80, 110) : 50; // iPhone: reduced spacing between FABs

    const animations: Animated.CompositeAnimation[] = [];

    const fabConfigs = [
      { animX: recentFabTranslateX, animY: recentFabTranslateY, multiplier: 1 },
      {
        animX: historyFabTranslateX,
        animY: historyFabTranslateY,
        multiplier: 2,
      },
      { animX: linksFabTranslateX, animY: linksFabTranslateY, multiplier: 3 },
      { animX: newsFabTranslateX, animY: newsFabTranslateY, multiplier: 4 },
      {
        animX: tariffEngineeringFabTranslateX,
        animY: tariffEngineeringFabTranslateY,
        multiplier: 5,
      },
      {
        animX: settingsFabTranslateX,
        animY: settingsFabTranslateY,
        multiplier: 6,
      },
    ];

    fabConfigs.forEach(({ animX, animY, multiplier }) => {
      const xPosition = toValue * spacing * multiplier;

      animations.push(
        Animated.timing(animX, {
          toValue: xPosition,
          duration: 120,
          useNativeDriver: true,
        }),
      );

      // Keep Y at 0 for all FABs - perfect horizontal alignment
      animations.push(
        Animated.timing(animY, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
      );
    });

    // Rotate main FAB
    animations.push(
      Animated.timing(mainFabRotation, {
        toValue,
        duration: 120,
        useNativeDriver: true,
      }),
    );

    // Scale/opacity
    animations.push(
      Animated.timing(menuFabScale, {
        toValue,
        duration: 120,
        useNativeDriver: true,
      }),
    );
    animations.push(
      Animated.timing(menuFabOpacity, {
        toValue,
        duration: 120,
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
    setTariffEngineeringDrawerVisible(false);
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
    setTariffEngineeringDrawerVisible(false);
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
      setDescriptionExpanded(false); // Reset description expansion
      // Open FAB immediately without delay
      setUserClosedFab(false);
      openMainFab();
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
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(navDrawerOpacity, {
        toValue: show ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateLinksDrawer = (show: boolean) => {
    Animated.parallel([
      Animated.timing(linksDrawerTranslateY, {
        toValue: show ? 0 : SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(navDrawerOpacity, {
        toValue: show ? 1 : 0,
        duration: 200,
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
    linksDrawerVisible ||
    tariffEngineeringDrawerVisible;

  const handleMainFabPress = () => {
    haptics.buttonPress();
    Keyboard.dismiss();
    hideInfoTabs();
    if (anyDrawerOpen) {
      // Close all drawers and return to main Lookup screen
      closeAllDrawers();
      setMainHistoryDrawerVisible(false);
      setSettingsDrawerVisible(false);
      setLinksDrawerVisible(false);
      setTariffEngineeringDrawerVisible(false);
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
    const { translationX, state } = event.nativeEvent;

    // Detect a rightward drag of ~50px to trigger opening
    if (translationX > 50 && !infoDrawerVisible) {
      // Store the current active field before it gets cleared
      const fieldToShow = activeField;

      // Set flag to prevent clearing activeField on blur
      isOpeningInfoDrawer.current = true;

      // Provide haptic feedback
      haptics.selection();

      // Dismiss keyboard and open drawer
      Keyboard.dismiss();

      setTimeout(() => {
        setActiveField(fieldToShow);
        setInfoDrawerVisible(true);
        isOpeningInfoDrawer.current = false;

        // Blur all fields
        if (htsCodeInputRef.current) htsCodeInputRef.current.blur();
        if (declaredValueInputRef.current) declaredValueInputRef.current.blur();
        if (additionalCostInputRef.current)
          additionalCostInputRef.current.blur();
        if (unitCountInputRef.current) unitCountInputRef.current.blur();
      }, 100);
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
        ? windowHeight * 0.2 // Reduced by ~50px
        : windowHeight * 0.25 // Reduced by ~50px
      : windowHeight * 0.23; // Reduced by ~50px

    const logoWidth = windowWidth * (isTabletNow ? 0.6 : 0.75);

    return {
      heroSection: {
        height: heroHeight + insets.top - 20, // Increased height to accommodate FABs
        marginTop: -insets.top,
      } as ViewStyle,
      logo: {
        width: logoWidth,
        height: logoWidth * 0.3,
        maxWidth: isTabletNow ? 600 : 420,
        maxHeight: isTabletNow ? 180 : 126,
        marginTop: 5, // Keep logo in position after header resize
      } as ImageStyle,
      dataSourceContainer: isTabletNow
        ? {
            marginBottom: isLandscape ? 0 : -getSpacing("xs"),
          }
        : {},
    };
  }, [windowWidth, windowHeight, isLandscape, isTabletNow, insets.top]);

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
  }, [
    windowWidth,
    windowHeight,
    linksDrawerVisible,
    historyDrawerVisible,
    mainHistoryDrawerVisible,
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
        "showQuickTour:",
        settings.showQuickTour,
        "settingsLoading:",
        settingsLoading,
      );

      // Don't check while settings are still loading
      if (settingsLoading) {
        console.log("[FirstTimeGuide] Settings still loading, waiting...");
        return;
      }

      // Only check if the disclaimer has also been dealt with
      if (!showDisclaimer) {
        // Check if we should show the quick tour based on settings
        if (settings.showQuickTour === true) {
          console.log(
            "[FirstTimeGuide] Showing guide because showQuickTour is enabled",
          );
          // Use requestAnimationFrame to show after next paint
          requestAnimationFrame(() => {
            setShowFirstTimeGuide(true);
          });
        } else if (settings.showQuickTour === false) {
          console.log(
            "[FirstTimeGuide] Not showing guide because showQuickTour is disabled",
          );
        } else {
          // showQuickTour is undefined/null, check if first time
          const hasSeenGuide = await AsyncStorage.getItem(GUIDE_STORAGE_KEY);
          console.log("[FirstTimeGuide] hasSeenGuide value:", hasSeenGuide);
          if (hasSeenGuide === null) {
            console.log(
              "[FirstTimeGuide] Showing guide for first time (setting not configured)",
            );
            requestAnimationFrame(() => {
              setShowFirstTimeGuide(true);
            });
          }
        }
      } else {
        console.log(
          "[FirstTimeGuide] Disclaimer still visible, not checking guide",
        );
      }
    };
    checkFirstTimeGuide();
  }, [showDisclaimer, settings.showQuickTour, settingsLoading]);

  // Automatically reopen FAB menu when all drawers are closed (unless user manually closed it)
  useEffect(() => {
    if (!anyDrawerOpen && !userClosedFab) {
      // Use requestAnimationFrame to ensure smooth transition
      requestAnimationFrame(() => {
        openMainFab();
      });
    }
    // Removed the automatic closing of FAB when drawers open
    // This allows quick switching between drawers
  }, [anyDrawerOpen]);

  return (
    <>
      <SafeAreaView style={styles.container}>
        {/* Horizontal Background Section */}
        <HorizontalSection
          height={Number(dynamicHeaderStyles.heroSection.height)}
          style={{ ...styles.heroSection, ...dynamicHeaderStyles.heroSection }}
        >
          <View
            style={[
              styles.logoContainer,
              { paddingTop: Math.max(insets.top * 1.25 - 18, 0) },
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
                  Keyboard.dismiss();
                  handleRecentLookupPopulate();
                }}
              >
                <Ionicons
                  name="time"
                  size={getResponsiveValue(16, 24)}
                  color={BRAND_COLORS.white}
                />
              </TouchableOpacity>
            </Animated.View>

            {/* History Button */}
            <Animated.View
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
                  Keyboard.dismiss();
                  closeAllDrawers();
                  // Don't close FAB menu - keep it open for quick access
                  setMainHistoryDrawerVisible(true);
                }}
              >
                <Ionicons
                  name="library"
                  size={getResponsiveValue(16, 24)}
                  color={BRAND_COLORS.white}
                />
              </TouchableOpacity>
            </Animated.View>

            {/* Tariff News Button */}
            <Animated.View
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
                  Keyboard.dismiss();
                  closeAllDrawers();
                  // Don't close FAB menu - keep it open for quick access
                  setLinksDrawerVisible(true);
                }}
              >
                <Ionicons
                  name="newspaper-outline"
                  size={getResponsiveValue(16, 24)}
                  color={BRAND_COLORS.white}
                />
              </TouchableOpacity>
            </Animated.View>

            {/* News Button */}
            <Animated.View
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
                  Keyboard.dismiss();
                  closeAllDrawers();
                  // Don't close FAB menu - keep it open for quick access
                  setNewsDrawerVisible(true);
                }}
              >
                <Ionicons
                  name="newspaper"
                  size={getResponsiveValue(16, 24)}
                  color={BRAND_COLORS.white}
                />
              </TouchableOpacity>
            </Animated.View>

            {/* Tariff Engineering Button */}
            <Animated.View
              style={[
                styles.menuFab,
                {
                  transform: [
                    { translateX: tariffEngineeringFabTranslateX },
                    { translateY: tariffEngineeringFabTranslateY },
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
                  Keyboard.dismiss();
                  closeAllDrawers();
                  // Navigate to full TI screen
                  navigation.navigate("TariffEngineering" as any);
                }}
              >
                <Text style={styles.fabDollarSign}>TI</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Settings Button */}
            <Animated.View
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
                  Keyboard.dismiss();
                  closeAllDrawers();
                  // Don't close FAB menu - keep it open for quick access
                  setSettingsDrawerVisible(true);
                }}
              >
                <Ionicons
                  name="settings"
                  size={getResponsiveValue(16, 24)}
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
                  size={getResponsiveValue(19, 28)}
                  color={BRAND_COLORS.white}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </HorizontalSection>

        <KeyboardAwareScrollView
          ref={resultScrollViewRef}
          style={styles.mainScrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          extraScrollHeight={
            activeField === "units"
              ? getResponsiveValue(100, 80)
              : Platform.OS === "ios" && !Platform.isPad
                ? 20
                : 40
          }
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          keyboardShouldPersistTaps="handled"
          keyboardOpeningTime={250}
          bounces={true}
          decelerationRate="normal"
          scrollEventThrottle={16}
          contentInsetAdjustmentBehavior="automatic"
          enableResetScrollToCoords={true}
          viewIsInsideTabBar={Platform.OS === "ios" && !Platform.isPad}
        >
          {/* Input Form - Always visible */}
          <View style={styles.inputSection}>
            <View
              style={[
                styles.inputContainer,
                {
                  paddingLeft:
                    Platform.OS === "ios" && !Platform.isPad ? 10 : 0,
                },
              ]}
            >
              {/* HTS Code row */}
              <View style={styles.dropdownFieldsRow}>
                <View
                  style={[
                    styles.halfWidthWrapper,
                    { marginRight: getSpacing("xs"), width: "50%" },
                  ]}
                  ref={fieldRefs.code}
                >
                  <TextInput
                    placeholder="HTS Code"
                    value={htsCode}
                    onChangeText={(text) => {
                      const cleanedText = text.replace(/\D/g, "").slice(0, 8);
                      setHtsCode(cleanedText);
                      setUserClosedFab(false);
                      closeMainFab();
                      closeAllNavigationDrawers();
                      // Clear description if user is typing a new code
                      if (selectedDescription && text !== htsCode) {
                        setSelectedDescription("");
                      }
                    }}
                    ref={htsCodeInputRef}
                    keyboardType="number-pad"
                    maxLength={8}
                    placeholderTextColor={BRAND_COLORS.electricBlue}
                    style={[styles.input, styles.halfWidthInput]}
                    onFocus={() => handleFieldFocus("code")}
                    onBlur={() => {
                      if (!isOpeningInfoDrawer.current) {
                        setActiveField(null);
                      }
                    }}
                  />
                </View>
                {/* Right column - HTS Suggestions */}
                <View
                  style={[
                    styles.halfWidthWrapper,
                    {
                      marginLeft: getSpacing("xs"),
                      width: "50%",
                      position: "relative",
                    },
                  ]}
                >
                  {/* HTS Suggestions Dropdown - Now in right column */}
                  {showHtsSuggestions && htsSuggestions.length > 0 && (
                    <View
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 9999,
                        maxHeight: 200,
                        backgroundColor: BRAND_COLORS.white,
                        borderRadius: getBorderRadius("md"),
                        borderWidth: 1,
                        borderColor: BRAND_COLORS.electricBlue,
                        ...BRAND_SHADOWS.medium,
                      }}
                    >
                      <ScrollView
                        style={{ maxHeight: 200 }}
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled={true}
                      >
                        {htsSuggestions.map((item) => (
                          <TouchableOpacity
                            key={item.code}
                            style={{
                              padding: getSpacing("sm"),
                              borderBottomWidth: 1,
                              borderBottomColor: BRAND_COLORS.lightGray,
                            }}
                            onPress={() =>
                              handleHtsSelection(item.code, item.description)
                            }
                          >
                            <Text
                              style={{
                                fontSize: getTypographySize("sm"),
                                ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
                                color: BRAND_COLORS.electricBlue,
                              }}
                            >
                              {item.code}
                            </Text>
                            <Text
                              style={{
                                fontSize: getTypographySize("xs"),
                                ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
                                color: BRAND_COLORS.darkGray,
                                marginTop: 2,
                              }}
                              numberOfLines={2}
                            >
                              {item.description}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Selected description display */}
                  {selectedDescription && !showHtsSuggestions && (
                    <View
                      style={{
                        padding: getSpacing("sm"),
                        backgroundColor: BRAND_COLORS.lightGray,
                        borderRadius: getBorderRadius("sm"),
                        minHeight: getResponsiveValue(46, 54),
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: getTypographySize("xs"),
                          ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
                          color: BRAND_COLORS.darkNavy,
                        }}
                        numberOfLines={2}
                      >
                        {selectedDescription}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Origin row */}
              <View
                style={[
                  styles.dropdownFieldsRow,
                  { marginTop: getSpacing("sm") },
                ]}
              >
                <View
                  style={[
                    styles.halfWidthWrapper,
                    { marginRight: getSpacing("xs"), width: "50%" },
                  ]}
                >
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
                {/* Right column - USMCA toggle for Canada/Mexico */}
                <View
                  style={[
                    styles.halfWidthWrapper,
                    {
                      marginLeft: getSpacing("xs"),
                      width: "50%",
                      position: "relative",
                      minHeight: getResponsiveValue(46, 54), // Match input height
                    },
                  ]}
                >
                  {/* USMCA Origin Checkbox - Only show for Canada/Mexico */}
                  {selectedCountry &&
                    (selectedCountry.code === "CA" ||
                      selectedCountry.code === "MX") && (
                      <View style={styles.toggleContainer}>
                        <Text style={styles.toggleLabel}>
                          USMCA Certificate
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            haptics.selection();
                            setIsUSMCAOrigin(!isUSMCAOrigin);
                            closeMainFab(false);
                            closeAllNavigationDrawers();
                          }}
                          style={{ paddingLeft: 8 }}
                        >
                          <Ionicons
                            name={isUSMCAOrigin ? "checkbox" : "square-outline"}
                            size={getResponsiveValue(24, 28)}
                            color={BRAND_COLORS.darkNavy}
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                </View>
              </View>

              {/* Declared Value row */}
              <View
                style={[
                  styles.dropdownFieldsRow,
                  { marginTop: getSpacing("sm") },
                ]}
              >
                <View
                  style={[
                    styles.halfWidthWrapper,
                    { marginRight: getSpacing("xs"), width: "50%" },
                  ]}
                  ref={fieldRefs.declared}
                >
                  <TextInput
                    placeholder="Declared Value"
                    value={formattedDeclaredValue}
                    onChangeText={(value) => {
                      handleDeclaredValueChange(value);
                      closeMainFab(false);
                      closeAllNavigationDrawers();
                    }}
                    ref={declaredValueInputRef}
                    keyboardType="decimal-pad"
                    placeholderTextColor={BRAND_COLORS.electricBlue}
                    style={[
                      styles.input,
                      styles.halfWidthInput,
                      styles.currencyInput,
                      { textAlign: formattedDeclaredValue ? "right" : "left" },
                    ]}
                    onBlur={() => {
                      if (declaredValue) {
                        setFormattedDeclaredValue(
                          `$${formatNumberWithCommas(declaredValue.replace(/[^0-9.]/g, ""))}`,
                        );
                      }
                      if (!isOpeningInfoDrawer.current) {
                        setActiveField(null);
                      }
                    }}
                    onFocus={() => {
                      // Keep the formatted value on focus
                      handleFieldFocus("declared");
                    }}
                  />
                </View>
                {/* Right column - Cost chips */}
                <View
                  style={[
                    styles.halfWidthWrapper,
                    {
                      marginLeft: getSpacing("xs"),
                      width: "50%",
                      position: "relative",
                      minHeight: getResponsiveValue(46, 54), // Match input height
                    },
                  ]}
                >
                  <View
                    style={{ position: "absolute", top: 10, left: 0, right: 0 }}
                  >
                    {(declaredValue || additionalCosts.length > 0) &&
                      formatArithmetic()}
                  </View>
                </View>
              </View>

              {/* Add Costs row */}
              <View
                style={[
                  styles.dropdownFieldsRow,
                  { marginTop: getSpacing("sm") },
                ]}
              >
                <View
                  style={[
                    styles.halfWidthWrapper,
                    { marginRight: getSpacing("xs"), width: "50%" },
                  ]}
                  ref={fieldRefs.freight}
                >
                  <View style={styles.multiFieldInputRow}>
                    <TextInput
                      ref={additionalCostInputRef}
                      placeholder="Add Costs"
                      value={currentAdditionalCost}
                      onChangeText={handleAdditionalCostChange}
                      keyboardType="decimal-pad"
                      placeholderTextColor={BRAND_COLORS.electricBlue}
                      style={[
                        styles.input,
                        styles.multiFieldInput,
                        styles.currencyInput,
                        { textAlign: currentAdditionalCost ? "right" : "left" },
                      ]}
                      onSubmitEditing={handleAddAdditionalCost}
                      returnKeyType="done"
                      onFocus={() => handleFieldFocus("freight")}
                      onBlur={() => {
                        if (!isOpeningInfoDrawer.current) {
                          setActiveField(null);
                        }
                      }}
                    />
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={handleAddAdditionalCost}
                    >
                      <Ionicons
                        name="add-circle"
                        size={getResponsiveValue(40, 45)}
                        color={BRAND_COLORS.electricBlue}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                {/* Right column - empty for future use */}
                <View
                  style={[
                    styles.halfWidthWrapper,
                    {
                      marginLeft: getSpacing("xs"),
                      width: "50%",
                      position: "relative",
                      minHeight: getResponsiveValue(46, 54), // Match input height
                    },
                  ]}
                />
              </View>

              {/* Units row */}
              <View
                style={[
                  styles.dropdownFieldsRow,
                  { marginTop: getSpacing("sm") },
                ]}
              >
                {/* Left column - Units */}
                <View
                  style={[
                    styles.halfWidthWrapper,
                    { marginRight: getSpacing("xs"), width: "50%" },
                  ]}
                  ref={fieldRefs.units}
                >
                  <View style={styles.multiFieldInputRow}>
                    <TextInput
                      ref={unitCountInputRef}
                      placeholder="Add Units"
                      value={currentUnitCount}
                      onChangeText={(value) => {
                        const cleaned = value.replace(/[^0-9]/g, "");
                        setCurrentUnitCount(cleaned);
                      }}
                      keyboardType="number-pad"
                      placeholderTextColor={BRAND_COLORS.electricBlue}
                      style={[
                        styles.input,
                        styles.multiFieldInput,
                        styles.currencyInput,
                        { textAlign: currentUnitCount ? "right" : "left" },
                      ]}
                      onSubmitEditing={handleAddUnitCount}
                      returnKeyType="done"
                      onFocus={() => handleFieldFocus("units")}
                      onBlur={() => {
                        if (!isOpeningInfoDrawer.current) {
                          setActiveField(null);
                        }
                      }}
                    />
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={handleAddUnitCount}
                    >
                      <Ionicons
                        name="add-circle"
                        size={getResponsiveValue(40, 45)}
                        color={BRAND_COLORS.electricBlue}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                {/* Right column - Unit chips */}
                <View
                  style={[
                    styles.halfWidthWrapper,
                    {
                      marginLeft: getSpacing("xs"),
                      width: "50%",
                      position: "relative",
                      minHeight: getResponsiveValue(46, 54), // Match input height
                    },
                  ]}
                >
                  <View
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 0,
                      right: 0,
                    }}
                  >
                    {unitCounts.length > 0 && formatUnitArithmetic()}
                  </View>
                </View>
              </View>

              {/* Loading Message Display */}
              {loadingMessage && (
                <View style={styles.loadingMessageContainer}>
                  <Text style={styles.loadingMessageText}>
                    {loadingMessage}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Additional Action Buttons below Info container */}
          <View
            style={{
              flexDirection: "row", // Always horizontal
              justifyContent: "center",
              gap: getSpacing("sm"),
              marginTop: getSpacing("md"),
              marginBottom: getSpacing("md"),
              paddingHorizontal:
                Platform.OS === "ios" && Platform.isPad
                  ? SCREEN_WIDTH * 0.25
                  : getSpacing("md"),
            }}
          >
            <TouchableOpacity
              style={[
                styles.searchButton,
                isLoading && styles.searchButtonDisabled,
                { flex: 1 },
              ]}
              onPress={handleLookup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={BRAND_COLORS.white} />
              ) : (
                <>
                  <Ionicons
                    name="calculator"
                    size={getResponsiveValue(18, 22)}
                    color={BRAND_COLORS.white}
                  />
                  <Text style={styles.searchButtonText}>Calculate</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.clearButton, { flex: 1 }]}
              onPress={handleClearAll}
            >
              <Ionicons
                name="close-circle-outline"
                size={getResponsiveValue(18, 22)}
                color={BRAND_COLORS.white}
              />
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>

        {/* Data Source Info */}
        <View
          style={[styles.dataSourceInfoContainer, { pointerEvents: "none" }]}
        >
          <LinearGradient
            colors={[BRAND_COLORS.gradientStart, BRAND_COLORS.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.dataSourceGradient}
          >
            <Text style={styles.dataSourceInfoLine}>Data Last Updated:</Text>
            <Text style={styles.dataSourceInfoLine}>
              {tariffService.getLastUpdated() || "Loading..."} | HTS Revision:{" "}
              {tariffService.getHtsRevision() || "Loading..."}
            </Text>
            <Text style={styles.dataSourceInfoLine}>Data Sources:</Text>
            <Text style={styles.dataSourceInfoLine}>
              U.S. International Trade Commission,
            </Text>
            <Text style={styles.dataSourceInfoLine}>
              Federal Register Notices for Sections, IEEPA, and Punitive
              Tariffs.
            </Text>
          </LinearGradient>
        </View>

        {/* Results Drawer */}
        <AnimatedDrawer
          isVisible={resultsDrawerVisible}
          onClose={handleCloseResultsDrawer}
          position="bottom"
        >
          {renderResultsDrawerContent()}
        </AnimatedDrawer>

        {/* Tariff Engineering Drawer */}
        <AnimatedDrawer
          isVisible={tariffEngineeringDrawerVisible}
          onClose={() => {
            setTariffEngineeringDrawerVisible(false);
            // Reopen FAB after closing drawer
            setUserClosedFab(false);
            openMainFab();
          }}
          position="right"
        >
          <TariffEngineeringComparison
            htsCode={htsCode}
            description={result?.description || selectedDescription}
            countryCode={selectedCountry?.code || ""}
            countryName={selectedCountry?.name || ""}
            declaredValue={parseFloat(declaredValue) || 0}
            currentTotalDuty={result?.totalAmount || 0}
            isUSMCAOrigin={isUSMCAOrigin}
            onClose={() => setTariffEngineeringDrawerVisible(false)}
          />
        </AnimatedDrawer>

        {/* Recent Lookups Drawer */}
        <AnimatedDrawer
          isVisible={historyDrawerVisible}
          onClose={() => {
            setHistoryDrawerVisible(false);
            setUserClosedFab(false);
            openMainFab();
          }}
          position="left"
        >
          {renderHistoryDrawerContent()}
        </AnimatedDrawer>

        {/* Main History Drawer */}
        <AnimatedDrawer
          isVisible={mainHistoryDrawerVisible}
          onClose={() => {
            setMainHistoryDrawerVisible(false);
            setUserClosedFab(false);
            openMainFab();
          }}
          position="left"
        >
          <HistoryScreen
            onItemPress={(item: HistoryItem) => {
              setMainHistoryDrawerVisible(false);
              // Handle history item selection immediately
              handleHistoryItemSelection(item);
            }}
          />
        </AnimatedDrawer>

        {/* News Drawer */}
        <AnimatedDrawer
          isVisible={newsDrawerVisible}
          onClose={() => {
            setNewsDrawerVisible(false);
            setUserClosedFab(false);
            openMainFab();
          }}
          position="right"
        >
          {renderNewsDrawerContent()}
        </AnimatedDrawer>

        {/* Analytics Drawer */}
        <AnimatedDrawer
          isVisible={analyticsDrawerVisible}
          onClose={() => {
            setAnalyticsDrawerVisible(false);
            setUserClosedFab(false);
            openMainFab();
          }}
          position="right"
        >
          {renderAnalyticsDrawerContent()}
        </AnimatedDrawer>

        {/* Settings Drawer */}
        <AnimatedDrawer
          isVisible={settingsDrawerVisible}
          onClose={() => {
            setSettingsDrawerVisible(false);
            setUserClosedFab(false);
            openMainFab();
          }}
          position="right"
        >
          <SettingsScreen />
        </AnimatedDrawer>

        {/* Links/Tariff News Drawer */}
        <AnimatedDrawer
          isVisible={linksDrawerVisible}
          onClose={() => {
            setLinksDrawerVisible(false);
            setUserClosedFab(false);
            openMainFab();
          }}
          position="bottom"
        >
          <TariffNewsContent />
        </AnimatedDrawer>
      </SafeAreaView>

      {/* Info tab - only show for the active field */}
      {shouldShowInfoTab && activeField && (
        <PanGestureHandler onGestureEvent={handleInfoTabDrag} enabled={true}>
          <Animated.View
            pointerEvents="auto"
            style={[
              styles.infoTab,
              {
                top: getResponsiveValue(
                  activeField === "code"
                    ? 245
                    : activeField === "declared"
                      ? 392
                      : activeField === "freight"
                        ? 460 // Added freight for iPhone
                        : activeField === "units"
                          ? 390
                          : 322,
                  activeField === "code"
                    ? 425
                    : activeField === "declared"
                      ? 610
                      : activeField === "freight"
                        ? 698 // Freight already here for iPad
                        : activeField === "units"
                          ? 780
                          : 350,
                ),
                opacity: isTablet() ? 1 : infoTabOpacity,
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.1)", // Debug: semi-transparent white
              }}
              onPress={() => {
                console.log("[InfoTab] Tab pressed!");
                console.log("[InfoTab] Current activeField:", activeField);
                console.log(
                  "[InfoTab] Current infoDrawerVisible:",
                  infoDrawerVisible,
                );

                // Store the current active field before it gets cleared
                const fieldToShow = activeField;

                // Set flag to prevent clearing activeField on blur
                isOpeningInfoDrawer.current = true;

                // Dismiss keyboard first and wait for it to fully close
                Keyboard.dismiss();
                haptics.selection();

                // Small delay to ensure keyboard is fully dismissed before showing drawer
                setTimeout(() => {
                  // Restore the active field and open drawer
                  setActiveField(fieldToShow);
                  setInfoDrawerVisible(true);
                  isOpeningInfoDrawer.current = false;
                  // Ensure any active field is blurred
                  if (htsCodeInputRef.current) htsCodeInputRef.current.blur();
                  if (declaredValueInputRef.current)
                    declaredValueInputRef.current.blur();
                  if (additionalCostInputRef.current)
                    additionalCostInputRef.current.blur();
                  if (unitCountInputRef.current)
                    unitCountInputRef.current.blur();
                }, 100);
              }}
              onPressIn={() => console.log("[InfoTab] Touch started")}
              onPressOut={() => console.log("[InfoTab] Touch ended")}
            >
              <Ionicons
                name="information-circle-outline"
                size={getResponsiveValue(24, 26)}
                color={BRAND_COLORS.white}
              />
            </TouchableOpacity>
          </Animated.View>
        </PanGestureHandler>
      )}

      {/* Info Drawer - Moved outside SafeAreaView to ensure proper rendering */}
      <InfoDrawer
        isOpen={infoDrawerVisible}
        onClose={() => {
          setInfoDrawerVisible(false);
          // Refocus the field after drawer closes
          if (activeField) {
            let ref = null;
            switch (activeField) {
              case "code":
                ref = htsCodeInputRef;
                break;
              case "declared":
                ref = declaredValueInputRef;
                break;
              case "freight":
                ref = additionalCostInputRef;
                break;
              case "units":
                ref = unitCountInputRef;
                break;
            }
            if (ref && ref.current) {
              setTimeout(() => {
                ref.current?.focus();
              }, 300);
            }
          }
        }}
        field={activeField}
      />
      <FirstTimeGuideScreen
        visible={showFirstTimeGuide}
        onClose={handleGuideClose}
      />
      <DisclaimerModal
        visible={showDisclaimer}
        onAgree={handleDisclaimerAgree}
      />
    </>
  );
}

// Get responsive configs
const fabConfig = getFabConfig();
const inputConfig = getInputConfig();
const buttonConfig = getButtonConfig();
const drawerConfig = getDrawerConfig();
const styles = StyleSheet.create({
  dutiableContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  dutiableLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  dutiableValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E3A8A", // Dark blue
    alignSelf: "flex-end",
    width: "100%",
    textAlign: "right",
    paddingRight: 8,
  },

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
    overflow: "visible", // Ensure FABs can extend outside the section
  } as ViewStyle,
  logoContainer: {
    width: "100%", // Make the container span the full width
    justifyContent: "flex-start", // This handles vertical centering
    alignItems: "flex-start", // Align the logo to the left within this container
    paddingLeft: getResponsiveValue(10, 30), // Use responsive padding
    height: "90%", // Ensure it occupies the full height of the parent
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
    marginTop: getResponsiveValue(-15, -45), // Further up: -20 -> -35, -30 -> -45 (15px more)
  },
  mainScrollView: {
    flex: 1,
    zIndex: 8, // Higher than FAB container to ensure overlap works correctly
  },
  scrollContent: {
    paddingHorizontal: getResponsiveValue(12, 16), // Reduced horizontal padding
    paddingTop: getResponsiveValue(8, 62), // iPhone: 8px, iPad: 62px (12 + 50 extra)
    paddingBottom: getResponsiveValue(40, 60), // Reduced bottom padding
  },
  inputSection: {
    backgroundColor: BRAND_COLORS.white,
    ...BRAND_SHADOWS.medium,
    marginBottom: getResponsiveValue(8, 12), // Reduced margin
    paddingLeft: getResponsiveValue(10, 30), // Use responsive padding
    zIndex: 10, // Ensure it appears above data source info
    elevation: 10, // For Android
  },
  sectionTitleWrapper: {
    paddingHorizontal:
      Platform.OS === "ios" && Platform.isPad
        ? SCREEN_WIDTH * 0.25
        : getSpacing("md"),
    alignItems: "flex-start", // Left-align content
    justifyContent: "flex-start", // Left-align content
    width: "100%",
  },
  sectionTitle: {
    fontSize: getResponsiveValue(
      getTypographySize("lg") * 1.25, // Increased by 75%
      getTypographySize("xl") * 1.25, // Increased by 75%
    ),
    ...BRAND_TYPOGRAPHY.getFontStyle("bold"),
    color: BRAND_COLORS.darkNavy,
    marginBottom: getResponsiveValue(8, 12), // Reduced margin
    textAlign: "left", // Left-justified
    width: Platform.OS === "ios" && Platform.isPad ? 500 : "100%",
    maxWidth: "100%",
    paddingHorizontal: getResponsiveValue(20, 40), // Add padding to align with fields
  },
  inputContainer: {
    marginBottom: getResponsiveValue(8, 12), // Reduced margin
  },
  dropdownFieldsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
    paddingHorizontal:
      Platform.OS === "ios" && Platform.isPad ? SCREEN_WIDTH * 0.05 : 0,
    marginBottom: getResponsiveValue(10, 12), // Add bottom margin for spacing
    gap: getResponsiveValue(5, 9), // Add gap between fields
    minHeight: getResponsiveValue(46, 54), // Ensure consistent minimum height for all rows
  },
  halfWidthWrapper: {
    flex: 1,
    position: "relative",
  },
  halfWidthInput: {
    width: "100%",
  },
  halfWidthSuggestions: {
    position: "absolute",
    top: getResponsiveValue(46, 54), // Position below the input field
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 999, // For Android
  },
  inputWrapper: {
    width: Platform.OS === "ios" && Platform.isPad ? "100%" : "50%", // 60% width on iPhone
    paddingHorizontal:
      Platform.OS === "ios" && Platform.isPad ? SCREEN_WIDTH * 0.25 : 0, // No padding on iPhone since width is constrained
    alignItems: "flex-start",
    marginLeft: Platform.OS === "ios" && Platform.isPad ? 0 : -1, // -1px left margin (moved 2px more left from 1px)
  },
  input: {
    backgroundColor: BRAND_COLORS.lightGray,
    borderRadius: getBorderRadius("md"),
    paddingHorizontal: getSpacing("sm"),
    paddingVertical: getResponsiveValue(6, 8), // Adjusted vertical padding
    fontSize: getResponsiveValue(
      getTypographySize("md") * 1.5 * 0.75, // 75% of current size
      getTypographySize("md") * 1.8 * 0.65, // 75% of current size
    ),
    fontFamily: BRAND_TYPOGRAPHY.getFontFamily("regular"),
    color: BRAND_COLORS.darkNavy,
    marginBottom: getResponsiveValue(6, 8), // Reduced bottom margin
    borderWidth: 1,
    borderColor: BRAND_COLORS.mediumGray,
    height: getResponsiveValue(46, 54), // Adjusted height
    width: Platform.OS === "ios" && Platform.isPad ? 500 : "100%", // Full width of wrapper
    maxWidth: "100%",
  },
  currencyInput: {
    textAlign: "right",
    paddingRight: getSpacing("md"),
  },
  suggestionsContainer: {
    backgroundColor: BRAND_COLORS.white,
    borderRadius: getBorderRadius("md"),
    ...BRAND_SHADOWS.small,
    marginTop: getSpacing("xs"),
    marginBottom: getSpacing("sm"),
    paddingVertical: getSpacing("xs"), // Reduced padding
    minHeight: 0,
    maxHeight: getResponsiveValue(325, 550), // Height for 5 items: 5 * (65/110) = 325/550
    width: "100%", // Use full width of parent (which is already constrained)
    alignSelf: "flex-start",
    zIndex: 15, // Ensure suggestions appear above everything
    elevation: 15, // For Android
  },
  suggestionsScrollView: {
    maxHeight: getResponsiveValue(325, 550), // Match container height
  },
  suggestionItem: {
    paddingVertical: getResponsiveValue(8, 10),
    paddingHorizontal: getSpacing("xs"),
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.lightGray,
    width: "100%",
  },
  suggestionCode: {
    fontSize: getResponsiveValue(
      getTypographySize("sm"),
      getTypographySize("md"),
    ),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: BRAND_COLORS.electricBlue,
    marginBottom: 2,
  },
  suggestionDescription: {
    fontSize: getResponsiveValue(
      getTypographySize("md"),
      getTypographySize("sm"),
    ),
    color: BRAND_COLORS.darkGray,
    lineHeight: getResponsiveValue(14, 18),
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
    padding: getResponsiveValue(6, 8), // Reduced padding for smaller toggle
    paddingHorizontal: getResponsiveValue(10, 12), // Add horizontal padding
    width: "100%", // Full width of parent column
    height: getResponsiveValue(46, 54), // Match input field height
  },
  toggleLabel: {
    fontSize: getResponsiveValue(
      getTypographySize("sm"),
      getTypographySize("md"),
    ), // Smaller text for compact space
    color: BRAND_COLORS.darkNavy,
    ...BRAND_TYPOGRAPHY.getFontStyle("medium"),
    flex: 1,
    marginRight: getSpacing("xs"), // Add some space before the switch
  },
  selectedDescriptionContainer: {
    marginTop: getResponsiveValue(-1, -1), // Negative margin to bring it closer to the field
    marginBottom: getResponsiveValue(8, 10),
    paddingHorizontal: getSpacing("sm"),
    paddingVertical: getSpacing("xs"),
    backgroundColor: BRAND_COLORS.lightGray,
    borderRadius: getBorderRadius("sm"),
    width: "100%", // Use full width of parent (which is already constrained)
    alignSelf: "flex-start",
  },

  selectedDescriptionText: {
    fontSize: getResponsiveValue(
      getTypographySize("xs") * 0.9, // Even smaller on iPhone
      getTypographySize("sm") * 1.5, // Slightly smaller on iPad
    ),
    color: BRAND_COLORS.darkGray,
    fontFamily: "Geologica-Regular",
    fontStyle: "italic",
    lineHeight: getResponsiveValue(14, 18),
  },
  searchButton: {
    backgroundColor: BRAND_COLORS.electricBlue,
    borderRadius: getBorderRadius("md"),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...BRAND_SHADOWS.small,
    height: getResponsiveValue(44, 52), // Consistent height
    minWidth: getResponsiveValue(80, 120), // Ensure minimum width for consistent sizing
    paddingHorizontal: getResponsiveValue(12, 16),
    paddingVertical: 0, // Remove vertical padding, let height + alignItems center it
    marginLeft: 0,
    alignSelf: "flex-start",
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: BRAND_COLORS.white,
    fontSize: getTypographySize("md"),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    marginLeft: getSpacing("xs"),
    marginTop: 2, // Push text down by 2 pixels
    lineHeight: getTypographySize("md"), // Remove line height multiplier for better centering
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
    ...BRAND_TYPOGRAPHY.getFontStyle("medium"),
    color: BRAND_COLORS.electricBlue,
    textAlign: "center",
  },

  // Unified Floating Menu Styles
  heroFloatingMenuContainer: {
    position: "absolute",
    top: getResponsiveValue(175, 250), // Moved down 100px iPhone, 125px iPad
    left: getResponsiveValue(25, 50), // Left padding to match logo alignment
    right: 0,
    height: getResponsiveValue(45, 74), // Match main FAB height to ensure consistent alignment
    alignItems: "center", // Center vertically to ensure all FABs are on same horizontal line
    justifyContent: "flex-start", // Left align horizontally
    flexDirection: "row", // Ensure horizontal layout
    zIndex: 9999, // Very high z-index to ensure FABs are clickable
    elevation: 9999, // For Android
  },
  menuFab: {
    position: "absolute",
    alignSelf: "center", // Ensure vertical centering
    zIndex: 10000,
    elevation: 10000, // For Android
  },
  menuFabButton: {
    width: getResponsiveValue(38, 64), // 80% size on iPhone (48 * 0.8 = 38.4 ≈ 38), iPad unchanged
    height: getResponsiveValue(38, 64), // 80% size on iPhone, iPad unchanged
    borderRadius: getResponsiveValue(19, 32), // Proportional border radius
    justifyContent: "center",
    alignItems: "center",
    ...BRAND_SHADOWS.medium,
  },
  fabDollarSign: {
    fontSize: getResponsiveValue(20, 32),
    fontWeight: "bold",
    color: BRAND_COLORS.white,
  },

  mainFloatingFab: {
    position: "relative",
    alignSelf: "center", // Ensure vertical centering
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
    ...BRAND_TYPOGRAPHY.getFontStyle("bold"),
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
    ...BRAND_TYPOGRAPHY.getFontStyle("bold"),
  },
  historyItemInfo: {
    flex: 1,
  },
  historyItemCode: {
    fontSize: getTypographySize("md"),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: BRAND_COLORS.darkNavy,
  },
  historyItemDesc: {
    fontSize: getTypographySize("sm"),
    color: BRAND_COLORS.darkGray,
    marginVertical: 2,
  },
  historyItemAmount: {
    fontSize: getTypographySize("sm"),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
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
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
  },
  newsTitle: {
    fontSize: getTypographySize("md"),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
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
    ...BRAND_TYPOGRAPHY.getFontStyle("bold"),
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
    ...BRAND_TYPOGRAPHY.getFontStyle("bold"),
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
  resultsDrawerDescription: {
    fontSize: getResponsiveValue(
      getTypographySize("sm"),
      getTypographySize("sm") * 1.35,
    ),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.darkGray,
    marginTop: 4,
    marginBottom: 2,
    lineHeight: getResponsiveValue(18, 22),
  },
  resultsDrawerDescriptionExpanded: {
    backgroundColor: BRAND_COLORS.lightGray,
    padding: getSpacing("xs"),
    borderRadius: getBorderRadius("sm"),
    marginHorizontal: -getSpacing("xs"),
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
    ...BRAND_TYPOGRAPHY.getFontStyle("bold"),
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
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
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
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: BRAND_COLORS.darkNavy,
    textAlign: "right", // Right-align dollar amounts
  },
  compactHighlight: {
    fontSize: getResponsiveValue(
      getTypographySize("md"),
      getTypographySize("lg") * 1.35,
    ), // 35% larger on iPad (reduced from 50%)
    ...BRAND_TYPOGRAPHY.getFontStyle("bold"),
    color: BRAND_COLORS.electricBlue,
    textAlign: "right", // Right-align dollar amounts
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
      getTypographySize("sm"),
      getTypographySize("md"),
    ), // Back to original size
    color: BRAND_COLORS.white, // Changed to white
    marginLeft: getSpacing("sm"),
    flex: 1,
    lineHeight: getResponsiveValue(18, 22), // Back to original line height
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
    ...BRAND_TYPOGRAPHY.getFontStyle("medium"),
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
  tariffEngineeringHeaderButton: {
    borderColor: BRAND_COLORS.electricBlue,
    backgroundColor: BRAND_COLORS.white,
    marginLeft: getSpacing("xs"),
  },
  headerButtonText: {
    fontSize: getResponsiveValue(
      getTypographySize("sm"),
      getTypographySize("sm") * 1.35,
    ), // 35% larger on iPad (reduced from 50%)
    ...BRAND_TYPOGRAPHY.getFontStyle("medium"),
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
    ...BRAND_TYPOGRAPHY.getFontStyle("medium"),
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
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: BRAND_COLORS.darkNavy,
  },
  clearButton: {
    backgroundColor: BRAND_COLORS.orange,
    borderRadius: getBorderRadius("md"),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...BRAND_SHADOWS.small,
    height: getResponsiveValue(44, 52), // Consistent height with searchButton
    minWidth: getResponsiveValue(80, 120), // Same minimum width as searchButton
    paddingHorizontal: getResponsiveValue(12, 16),
    paddingVertical: 0, // Remove vertical padding, let height + alignItems center it
  },
  clearButtonText: {
    color: BRAND_COLORS.white,
    fontSize: getTypographySize("md"),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    marginLeft: getSpacing("xs"),
    marginTop: 2, // Push text down by 2 pixels
    lineHeight: getTypographySize("md"), // Remove line height multiplier for better centering
  },
  infoTab: {
    position: "absolute",
    left: getResponsiveValue(-16, 0), // iPhone: extends to 8px (2px gap before field at 10px), iPad: extends to 25px (5px gap before field at 30px)
    width: getResponsiveValue(45, 75), // iPhone: same as field height, iPad: 50px as requested
    height: getResponsiveValue(40, 50), // iPhone: same as field height, iPad: 50px as requested
    backgroundColor: BRAND_COLORS.electricBlue,
    borderTopRightRadius: getResponsiveValue(23, 25),
    borderBottomRightRadius: getResponsiveValue(23, 25),
    justifyContent: "center",
    alignItems: "center",
    ...BRAND_SHADOWS.medium,
    zIndex: 3000,
    elevation: 3000,
  },
  totalAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: getSpacing("sm"),
  },
  dataSourceInfoContainer: {
    position: "absolute",
    bottom: 0, // Flush with bottom of screen
    left: 0,
    right: 0,
    alignItems: "center",
    ...BRAND_SHADOWS.small,
    zIndex: 1000, // Above background but below interactive elements
    overflow: "visible",
  },
  dataSourceGradient: {
    width: "100%",
    paddingVertical: getSpacing("sm"),
    paddingHorizontal: getSpacing("md"),
    alignItems: "center",
  },
  dataSourceInfoLine: {
    fontSize: getResponsiveValue(
      getTypographySize("sm") * 1.275, // 15% smaller than 1.5x
      getTypographySize("sm") * 1.875, // 25% bigger than 1.5x
    ),
    color: BRAND_COLORS.white,
    textAlign: "center",
    lineHeight: getResponsiveValue(19.125, 37.5), // Proportional line height
    opacity: 0.9,
  },
  tariffEngineeringButton: {
    backgroundColor: BRAND_COLORS.success,
    borderRadius: getBorderRadius("md"),
    paddingVertical: getResponsiveValue(10, 14),
    paddingHorizontal: getResponsiveValue(16, 20),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: getResponsiveValue(30, 40), // Position above bottom edge
    left: getSpacing("md"),
    right: getSpacing("md"),
    ...BRAND_SHADOWS.medium,
  },
  tariffEngineeringButtonText: {
    color: BRAND_COLORS.white,
    fontSize: getResponsiveValue(
      getTypographySize("sm"),
      getTypographySize("md"),
    ),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    marginLeft: getSpacing("xs"),
  },

  // HTS Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  htsDropdown: {
    backgroundColor: BRAND_COLORS.white,
    borderRadius: getBorderRadius("lg"),
    width: getResponsiveValue(SCREEN_WIDTH * 0.9, 500),
    maxHeight: getResponsiveValue(SCREEN_HEIGHT * 0.7, 600),
    ...BRAND_SHADOWS.large,
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: getSpacing("md"),
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.lightGray,
  },
  dropdownTitle: {
    fontSize: getTypographySize("lg"),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: BRAND_COLORS.darkNavy,
  },
  closeButton: {
    padding: getSpacing("xs"),
  },
  htsList: {
    maxHeight: getResponsiveValue(400, 500),
  },
  htsModalItem: {
    paddingVertical: getResponsiveValue(10, 14),
    paddingHorizontal: getSpacing("md"),
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.lightGray,
  },
  htsModalCode: {
    fontSize: getResponsiveValue(
      getTypographySize("md") * 0.75,
      getTypographySize("md"),
    ),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: BRAND_COLORS.electricBlue,
    marginBottom: 2,
  },
  htsModalDescription: {
    fontSize: getResponsiveValue(
      getTypographySize("sm") * 0.75,
      getTypographySize("sm"),
    ),
    color: BRAND_COLORS.darkGray,
    lineHeight: getResponsiveValue(16, 20),
  },
  inlineSuggestionsContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: BRAND_COLORS.white,
    borderRadius: getBorderRadius("md"),
    ...BRAND_SHADOWS.medium,
    marginTop: getSpacing("xs"),
    maxHeight: getResponsiveValue(200, 250),
    zIndex: 999,
    elevation: 999,
  },
  selectedHtsField: {
    backgroundColor: BRAND_COLORS.lightGray,
    borderColor: BRAND_COLORS.mediumGray,
    borderRadius: getBorderRadius("md"),
    borderWidth: 1,
    minHeight: getResponsiveValue(46, 54),
    justifyContent: "center",
    paddingHorizontal: getSpacing("md"),
    paddingVertical: getSpacing("sm"),
    width: "100%",
  },
  selectedHtsContent: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
  },
  selectedHtsTextContainer: {
    flex: 1,
  },
  selectedHtsCodeText: {
    fontSize: getResponsiveValue(
      getTypographySize("md") * 1.5 * 0.75,
      getTypographySize("md") * 1.8 * 0.75,
    ),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: BRAND_COLORS.darkNavy,
  },
  selectedHtsDescriptionText: {
    fontSize: getResponsiveValue(
      getTypographySize("sm"),
      getTypographySize("md"),
    ),
    color: BRAND_COLORS.darkNavy,
    marginTop: getSpacing("xs"),
    lineHeight: getResponsiveValue(18, 22),
  },
  valueFieldsRow: {
    flexDirection: "row",
    gap: getResponsiveValue(10, 15),
    paddingHorizontal: getResponsiveValue(20, 40),
  },
  valueFieldColumn: {
    flex: 1,
  },
  valueInput: {
    ...Platform.select({
      ios: {
        fontSize: getResponsiveValue(
          getTypographySize("md"),
          getTypographySize("md") * 1.2,
        ),
        height: getResponsiveValue(40, 48),
        paddingHorizontal: getResponsiveValue(15, 20),
        backgroundColor: BRAND_COLORS.lightGray,
        borderRadius: getResponsiveValue(12, 16),
        color: BRAND_COLORS.mediumBlue,
        textAlign: "right",
        width: "100%",
        borderWidth: 1,
        borderColor: BRAND_COLORS.mediumGray,
        ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
      },
      android: {
        fontSize: getResponsiveValue(
          getTypographySize("md"),
          getTypographySize("md") * 1.2,
        ),
        height: getResponsiveValue(46, 54),
        paddingHorizontal: getResponsiveValue(15, 20),
        backgroundColor: BRAND_COLORS.lightGray,
        borderRadius: getResponsiveValue(12, 16),
        color: BRAND_COLORS.mediumBlue,
        textAlign: "right",
        width: "100%",
        borderWidth: 1,
        borderColor: BRAND_COLORS.mediumGray,
        ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
      },
    }),
  },
  multiFieldContainer: {
    marginTop: getResponsiveValue(10, 12),
  },
  multiFieldInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: getResponsiveValue(8, 10),
  },
  multiFieldInput: {
    flex: 1,
    fontSize: getResponsiveValue(
      getTypographySize("md"),
      getTypographySize("md") * 1.2,
    ),
    height: getResponsiveValue(46, 54),
    paddingHorizontal: getResponsiveValue(15, 20),
    backgroundColor: BRAND_COLORS.lightGray,
    borderRadius: getResponsiveValue(12, 16),
    color: BRAND_COLORS.mediumBlue,
    textAlign: "right",
    borderWidth: 1,
    borderColor: BRAND_COLORS.mediumGray,
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
  },
  addButton: {
    padding: getResponsiveValue(4, 6),
  },
  chipsContainer: {
    marginTop: getResponsiveValue(8, 10),
    gap: getResponsiveValue(6, 8),
  },
  chip: {
    backgroundColor: BRAND_COLORS.lightGray,
    paddingHorizontal: getResponsiveValue(12, 16),
    paddingVertical: getResponsiveValue(6, 8),
    borderRadius: getResponsiveValue(8, 10),
    marginBottom: getResponsiveValue(4, 6),
  },
  chipContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chipText: {
    fontSize: getResponsiveValue(11 * 0.98, 13 * 0.98), // 2% smaller
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"), // Use regular weight Geologica
    color: BRAND_COLORS.electricBlue, // Lighter blue for better contrast
    marginRight: getResponsiveValue(8, 10),
  },
  arithmeticContainer: {
    alignItems: "flex-end",
  },
  arithmeticText: {
    fontSize: getResponsiveValue(18, 22.5), // Increased by 75% from 12/14
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"), // Ensure Geologica font (includes fontWeight: 600)
    color: BRAND_COLORS.electricBlue, // Changed to electric blue
    textAlign: "right",
  },
  arithmeticRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  arithmeticDivider: {
    height: 1,
    backgroundColor: BRAND_COLORS.electricBlue, // Changed to match text color
    marginVertical: getResponsiveValue(4, 6),
    marginTop: getResponsiveValue(8, 10),
    width: "70%", // Ensure divider spans full width
  },
  arithmeticTotal: {
    fontSize: getResponsiveValue(20.5, 24), // Increased by 75% from 14/16
    fontWeight: "700",
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: BRAND_COLORS.white,
  },
  // Header buttons - vertical layout
  headerButtonsVertical: {
    flexDirection: "column",
    gap: getSpacing("xs"),
    marginLeft: getSpacing("md"),
  },
  headerButtonStacked: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: getSpacing("sm"),
    paddingVertical: getSpacing("xs"),
    borderRadius: getBorderRadius("md"),
    borderWidth: 1,
    gap: getSpacing("xs"),
    minHeight: getResponsiveValue(32, 40),
  },
  headerButtonStackedText: {
    fontSize: getResponsiveValue(
      getTypographySize("sm"),
      getTypographySize("sm") * 1.35,
    ),
    ...BRAND_TYPOGRAPHY.getFontStyle("medium"),
    color: BRAND_COLORS.electricBlue,
  },
  saveHeaderButtonStacked: {
    borderColor: BRAND_COLORS.electricBlue,
    backgroundColor: BRAND_COLORS.white,
  },
  clearHeaderButtonStacked: {
    borderColor: BRAND_COLORS.orange,
    backgroundColor: BRAND_COLORS.white,
  },
  tariffIntelHeaderButtonStacked: {
    borderColor: BRAND_COLORS.success,
    backgroundColor: BRAND_COLORS.white,
  },
  // Save and Tariff Intelligence Buttons
  actionButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: getSpacing("md"),
  },
  saveToHistoryButton: {
    backgroundColor: BRAND_COLORS.electricBlue,
    borderRadius: getBorderRadius("md"),
    paddingVertical: getResponsiveValue(10, 14),
    paddingHorizontal: getResponsiveValue(16, 20),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...BRAND_SHADOWS.medium,
    minWidth: getResponsiveValue(120, 160),
  },
  saveToHistoryButtonText: {
    color: BRAND_COLORS.white,
    fontSize: getResponsiveValue(
      getTypographySize("sm"),
      getTypographySize("md"),
    ),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    marginLeft: getSpacing("xs"),
    marginTop: 2,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
});
