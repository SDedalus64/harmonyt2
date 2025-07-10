/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, react-native/no-inline-styles, react-native/no-color-literals, react-native/sort-styles, react-native/no-unused-styles, @typescript-eslint/no-require-imports */
import HtsDropdown from "../components/HtsDropdown";
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
import { useInfoTab } from "../hooks/useInfoTab";
import { InfoTab } from "../components/InfoTab";

// Allow inline asset imports with require()
// eslint-disable-next-line @typescript-eslint/ban-types
declare const require: any;

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
  const [showDisclaimer, setShowDisclaimer] = useState(true);
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
  const countryInputRef = useRef<TextInput>(null);
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

  // New drawer state
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false);
  const [newsDrawerVisible, setNewsDrawerVisible] = useState(false);
  const [analyticsDrawerVisible, setAnalyticsDrawerVisible] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [htsDescriptionExpanded, setHtsDescriptionExpanded] = useState(false);
  // Dedicated drawer for compact results view (legacy phone layout)
  const [resultsDrawerVisible, setResultsDrawerVisible] = useState(false);

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

  // Info drawer & floating tab
  const [infoDrawerVisible, setInfoDrawerVisible] = useState(false);
  const [showFirstTimeGuide, setShowFirstTimeGuide] = useState(false);

  // Hook that controls the floating info-tab behaviour on both phone & tablet
  const {
    fieldRefs,
    activeField,
    setActiveField,
    tabY,
    opacity: infoTabOpacity,
    shouldShowTab,
    handleFieldFocus,
    handleInfoTabDrag,
    size: infoTabSize,
  } = useInfoTab({
    fieldKeys: ["code", "declared", "freight", "units"],
    infoDrawerVisible,
    tabletScale: 1.35, // iPad pill = 54px
  });

  // Helpers to open info drawer and focus behaviour
  const handleInfoPress = (field: InfoFieldKey) => {
    setActiveField(field);
    setInfoDrawerVisible(true);
  };

  const handleFieldFocusWrapper = (field: InfoFieldKey) => {
    // replicate previous behaviour: collapse menus and description
    closeMainFab();
    setHtsDescriptionExpanded(false);
    handleFieldFocus(field as Exclude<InfoFieldKey, null>);
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
    if (!htsCode || !selectedCountry) {
      Alert.alert(
        "Missing Information",
        "Please enter an HTS code and select a country.",
      );
      return;
    }

    // Basic validation for HTS code
    if (htsCode.length < 6) {
      Alert.alert(
        "Invalid HTS Code",
        "HTS code must be at least 6 digits long.",
      );
      return;
    }

    // Validate declared value
    if (!declaredValue || parseFloat(declaredValue) <= 0) {
      Alert.alert(
        "Missing Information",
        "Please enter a declared value greater than 0.",
      );
      return;
    }

    setIsLoading(true);
    setShowLoadingModal(true);
    setLoadingMessage("Calculating duties and fees...");

    try {
      // Close keyboard
      Keyboard.dismiss();

      // Close all drawers and FABs
      closeAllDrawers();
      closeMainFab(false);

      // Calculate duty
      const dutyCalc = calculateDuty(
        htsCode,
        parseFloat(declaredValue),
        selectedCountry.code,
        true,
        false,
        isUSMCAOrigin,
      );

      if (!dutyCalc) {
        throw new Error("Unable to calculate duty with provided data.");
      }
      console.log("[Lookup] Duty calculation result:", dutyCalc);

      // Extract components with descriptions
      const componentsWithDescriptions = extractComponentDescriptions(
        dutyCalc.components,
        dutyCalc.breakdown,
      );

      // Extract special rate if applicable
      const specialRate = extractSpecialRate(
        dutyCalc.breakdown,
        selectedCountry.name,
      );

      // Calculate unit costs if units are provided
      const totalUnitCount = unitCounts.reduce<number>(
        (sum: number, unit: { id: string; amount: number; label?: string }) =>
          sum + unit.amount,
        0,
      );
      let unitCalculations = undefined;
      if (totalUnitCount > 0) {
        const costPerUnit = dutyCalc.amount / totalUnitCount;
        const rtComponent = dutyCalc.components.find(
          (c: DutyComponent) => c.type === RECIPROCAL_TARIFF_TYPE,
        );
        const hasRT = rtComponent && rtComponent.amount > 0;
        const costPerUnitWithoutRT = hasRT
          ? (dutyCalc.amount - rtComponent.amount) / totalUnitCount
          : costPerUnit;
        const additionalPerUnit = hasRT
          ? rtComponent.amount / totalUnitCount
          : 0;

        unitCalculations = {
          costPerUnitWithRT: costPerUnit,
          costPerUnitWithoutRT,
          additionalPerUnit,
          hasRT,
        };
      }

      const result: LookupResult = {
        htsCode: dutyCalc.htsCode,
        description: dutyCalc.description,
        dutyRate: dutyCalc.totalRate,
        totalAmount: dutyCalc.amount,
        breakdown: dutyCalc.breakdown,
        specialRate,
        components: componentsWithDescriptions,
        fees: dutyCalc.fees,
        effectiveDate: dutyCalc.effectiveDate,
        expirationDate: dutyCalc.expirationDate,
        unitCount: totalUnitCount > 0 ? totalUnitCount.toString() : undefined,
        unitCalculations,
      };

      setResult(result);
      setIsSaved(false);
      setLoadedHistoryTimestamp(null);

      // Store the current entry data
      currentEntry.current = {
        htsCode,
        selectedCountry,
        declaredValue,
        freightCost,
        unitCounts,
        additionalCosts,
        isUSMCAOrigin,
      };

      // Store the duty calculation
      currentDutyCalculation.current = dutyCalc;

      // Scroll to results section
      setTimeout(() => {
        if (resultScrollViewRef.current) {
          resultScrollViewRef.current.scrollToEnd({ animated: true });
        }
      }, 100);

      // Auto-save if enabled
      if (settings.autoSaveToHistory) {
        console.log("[Lookup] Auto-saving to history...");
        await handleSaveToHistory(false);
      }
    } catch (error) {
      console.error("[Lookup] Error:", error);
      Alert.alert(
        "Lookup Error",
        error instanceof Error ? error.message : "Failed to calculate duties",
      );
    } finally {
      setIsLoading(false);
      setShowLoadingModal(false);
      setLoadingMessage("");
    }
  };

  const handleNewLookup = () => {
    haptics.buttonPress();
    
    // Clear form
    setHtsCode("");
    setSelectedCountry(settings?.defaultCountry ? {
      code: settings.defaultCountry,
      name: getCountryName(settings.defaultCountry),
    } : undefined);
    setSelectedDescription("");
    setDeclaredValue("");
    setFormattedDeclaredValue("");
    setFreightCost("");
    setFormattedFreightCost("");
    setUnitCount("");
    setFormattedUnitCount("");
    setResult(null);
    setIsSaved(false);
    setLoadedHistoryTimestamp(null);
    setShowInput(true);
    setShowHtsSuggestions(false);
    setHtsSuggestions([]);
    setDescriptionExpanded(false);
    setHtsDescriptionExpanded(false);
    setCurrentAdditionalCost("");
    setAdditionalCosts([]);
    setCurrentUnitCount("");
    setUnitCounts([]);
    setIsUSMCAOrigin(false);

    // Clear stored data
    currentEntry.current = null;
    currentDutyCalculation.current = null;

    // Focus on HTS code input
    setTimeout(() => {
      htsCodeInputRef.current?.focus();
    }, 100);
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
        {history.slice(0, 10).map((item: HistoryItem, index: number) => (
          <TouchableOpacity
            key={item.id}
            style={styles.historyDrawerItem}
            onPress={() => {
              const closeAndNavigate = () => {
                setHistoryDrawerVisible(false);
                navigation.navigate("Lookup", { historyItem: item });
                // Open FAB immediately after selecting history item
                setUserClosedFab(false);
                openMainFab();
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
    return (
      <View style={styles.drawerContent}>
        <View style={styles.drawerHeader}>
          <Ionicons
            name="analytics"
            size={getResponsiveValue(24, 32)}
            color={BRAND_COLORS.info}
          />
          <Text style={styles.drawerTitle}>Analytics</Text>
        </View>
        <ScrollView style={styles.drawerScrollView}>
          <View style={styles.analyticsCard}>
            <LinearGradient
              colors={[BRAND_COLORS.electricBlue, BRAND_COLORS.mediumBlue]}
              style={styles.analyticsGradient}
            >
              <Text style={styles.analyticsTitle}>Total Searches</Text>
              <Text style={styles.analyticsValue}>142</Text>
              <Text style={styles.analyticsTrend}>+12% this month</Text>
            </LinearGradient>
          </View>
          <View style={styles.analyticsCard}>
            <LinearGradient
              colors={[BRAND_COLORS.success, "#27ae60"]}
              style={styles.analyticsGradient}
            >
              <Text style={styles.analyticsTitle}>Saved Lookups</Text>
              <Text style={styles.analyticsValue}>{history.length}</Text>
              <Text style={styles.analyticsTrend}>All time</Text>
            </LinearGradient>
          </View>
          <View style={styles.analyticsCard}>
            <LinearGradient
              colors={[BRAND_COLORS.orange, "#e67e22"]}
              style={styles.analyticsGradient}
            >
              <Text style={styles.analyticsTitle}>Most Searched</Text>
              <Text style={styles.analyticsValue}>China</Text>
              <Text style={styles.analyticsTrend}>45% of searches</Text>
            </LinearGradient>
          </View>
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
            const hasFreightCost = freightCost && parseFloat(freightCost) > 0;

            return (
              <View
                style={[
                  styles.totalAmountRow,
                  {
                    justifyContent: hasFreightCost
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
                      marginRight: hasFreightCost ? 8 : 0,
                      flex: hasFreightCost ? 1 : undefined,
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
                {/* Landed Cost - only show if freight cost is provided */}
                {hasFreightCost && (
                  <View
                    style={[styles.totalAmountCard, { marginLeft: 8, flex: 1 }]}
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
            const totalUnitCount = unitCounts.reduce<number>(
              (sum: number, unit: { id: string; amount: number; label?: string }) =>
                sum + unit.amount,
              0,
            );
            const totalDeclaredValue =
              parseFloat(declaredValue) +
              additionalCosts.reduce<number>(
                (sum: number, cost: { id: string; amount: number; label?: string }) =>
                  sum + cost.amount,
                0,
              );

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

        {/* Tariff Engineering Button - Outside ScrollView */}
        <TouchableOpacity
          style={styles.tariffEngineeringButton}
          onPress={() => {
            haptics.selection();
            // Close results drawer and open tariff engineering with current data
            setResultsDrawerVisible(false);
            setTariffEngineeringDrawerVisible(true);
          }}
        >
          <Ionicons
            name="git-compare"
            size={getResponsiveValue(18, 22)}
            color={BRAND_COLORS.white}
          />
          <Text style={styles.tariffEngineeringButtonText}>
            Tariff Engineering
          </Text>
        </TouchableOpacity>
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

    const spacing = isTablet() ? getResponsiveValue(80, 110) : 54; // iPhone: 49 + 5px more space from main FAB

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
      { animX: statsFabTranslateX, animY: statsFabTranslateY, multiplier: 5 },
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
          duration: 200,
          useNativeDriver: true,
        }),
      );

      // Keep Y at 0 for all FABs - perfect horizontal alignment
      animations.push(
        Animated.timing(animY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      );
    });

    // Rotate main FAB
    animations.push(
      Animated.timing(mainFabRotation, {
        toValue,
        duration: 200,
        useNativeDriver: true,
      }),
    );

    // Scale/opacity
    animations.push(
      Animated.timing(menuFabScale, {
        toValue,
        duration: 200,
        useNativeDriver: true,
      }),
    );
    animations.push(
      Animated.timing(menuFabOpacity, {
        toValue,
        duration: 200,
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

  const anyDrawerOpen = React.useMemo(
    () =>
      historyDrawerVisible ||
      newsDrawerVisible ||
      analyticsDrawerVisible ||
      mainHistoryDrawerVisible ||
      settingsDrawerVisible ||
      linksDrawerVisible ||
      tariffEngineeringDrawerVisible ||
      infoDrawerVisible,
    [
      historyDrawerVisible,
      newsDrawerVisible,
      analyticsDrawerVisible,
      mainHistoryDrawerVisible,
      settingsDrawerVisible,
      linksDrawerVisible,
      tariffEngineeringDrawerVisible,
      infoDrawerVisible,
    ],
  );

  const handleMainFabPress = (): void => {
    haptics.buttonPress();
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
  const noResultsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ----------------------
  // Gesture: drag info tab to open drawer (iPhone)
  // ----------------------
  const handleInfoTabDragOpen = (
    event: PanGestureHandlerGestureEvent,
  ) => {
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
      );
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
  }, [showDisclaimer, settings.showQuickTour]);

  // Automatically reopen FAB menu when all drawers are closed (unless user manually closed it)
  useEffect(() => {
    if (!anyDrawerOpen && !userClosedFab) {
      // Use requestAnimationFrame to ensure smooth transition
      requestAnimationFrame(() => {
        openMainFab();
      });
    } else if (anyDrawerOpen && mainFabExpanded) {
      closeMainFab();
    }
  }, [anyDrawerOpen]);

  // Tariff utilities from custom hook
  const { calculateDuty, searchByPrefix } = useTariff();

  // Helper: format numbers with comma separators (used across component)
  const formatNumberWithCommas = (value: string): string => {
    // remove non-digit except .
    const clean = value.replace(/[^\d.]/g, "");
    const [whole, decimal] = clean.split(".");
    const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return decimal ? `${withCommas}.${decimal}` : withCommas;
  };

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
        {/* Fixed Header Container - X0/Y0 to X595/Y236 */}
        <View style={styles.fixedHeaderContainer}>
          {/* Logo and Menu Section */}
          <HorizontalSection
            height={100}
            style={styles.logoSection}
          >
            <View style={styles.logoRow}>
              <Image
                source={require("../../assets/Harmony-white.png")}
                style={styles.headerLogo}
                resizeMode="contain"
              />
              
              {/* Unified Floating Menu System */}
              <View style={styles.headerMenuContainer}>
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
                      size={getResponsiveValue(16, 24)}
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
                      size={getResponsiveValue(16, 24)}
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
                      size={getResponsiveValue(16, 24)}
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
                      size={getResponsiveValue(16, 24)}
                      color={BRAND_COLORS.white}
                    />
                  </TouchableOpacity>
                </Animated.View>

                {/* Tariff Engineering Button */}
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
                      setTariffEngineeringDrawerVisible(true);
                    }}
                  >
                    <Ionicons
                      name="construct"
                      size={getResponsiveValue(16, 24)}
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
            </View>
          </HorizontalSection>

          {/* Entry Hub Section */}
          <View style={styles.entryHubSection}>
            <Text style={styles.entryHubTitle}>Entry Hub</Text>
            
            {/* HTS Code and Country fields in same row */}
            <View style={styles.entryFieldsRow}>
              <View style={styles.htsFieldWrapper} ref={fieldRefs.code}>
                {htsCode && selectedDescription ? (
                  <TouchableOpacity
                    style={styles.selectedHtsField}
                    onPress={() => {
                      setHtsDescriptionExpanded(!htsDescriptionExpanded);
                      haptics.selection();
                    }}
                  >
                    <View style={styles.selectedHtsContent}>
                      <View style={styles.selectedHtsTextContainer}>
                        <Text style={styles.selectedHtsCodeText}>
                          {htsCode}
                        </Text>
                        <Text
                          style={styles.selectedHtsDescriptionText}
                          numberOfLines={htsDescriptionExpanded ? undefined : 1}
                          ellipsizeMode="tail"
                        >
                          {selectedDescription}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <FieldWithInfo
                    placeholder="HTS Code"
                    value={htsCode}
                    fieldKey="code"
                    onInfoPress={handleInfoPress}
                    onChangeText={(text: string) => {
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
                    style={styles.entryField}
                    onFocus={() => handleFieldFocusWrapper("code")}
                  />
                )}

                {/* HTS Suggestions Dropdown */}
                {showHtsSuggestions && htsSuggestions.length > 0 && !selectedDescription && (
                  <HtsDropdown
                    htsCode={htsCode}
                    suggestions={htsSuggestions}
                    onSelect={handleHtsSelection}
                    visible={showHtsSuggestions}
                  />
                )}
              </View>

              <View style={styles.countryFieldWrapper}>
                <CountryLookup
                  ref={countryInputRef}
                  selectedCountry={selectedCountry}
                  onSelect={(country: Country) => {
                    setSelectedCountry(country);
                    setUserClosedFab(false);
                    closeMainFab(false);
                    closeAllNavigationDrawers();
                  }}
                />
              </View>
            </View>

            {/* Value fields row */}
            <View style={styles.valueFieldsRow}>
              {/* Declared Value */}
              <View style={styles.valueFieldWrapper} ref={fieldRefs.declared}>
                <TextInput
                  placeholder="Declared $"
                  value={formattedDeclaredValue}
                  onChangeText={(value: string) => {
                    handleDeclaredValueChange(value);
                    closeMainFab(false);
                    closeAllNavigationDrawers();
                  }}
                  ref={declaredValueInputRef}
                  keyboardType="decimal-pad"
                  placeholderTextColor={BRAND_COLORS.electricBlue}
                  style={styles.entryField}
                  onFocus={() => {
                    setFormattedDeclaredValue(declaredValue);
                    handleFieldFocusWrapper("declared");
                  }}
                  onBlur={() => {
                    if (declaredValue) {
                      setFormattedDeclaredValue(`$${formatNumberWithCommas(declaredValue)}`);
                    }
                  }}
                />
              </View>

              {/* Units */}
              {(settings.showUnitCalculations ?? true) && (
                <View style={styles.valueFieldWrapper} ref={fieldRefs.units}>
                  <View style={styles.multiFieldContainer}>
                    <View style={styles.multiFieldInputRow}>
                      <TextInput
                        ref={unitCountInputRef}
                        placeholder="Units"
                        value={currentUnitCount}
                        onChangeText={(value: string) => {
                          const cleaned = value.replace(/[^0-9.]/g, "");
                          const parts = cleaned.split(".");
                          if (parts.length > 2) return;
                          if (parts[1] && parts[1].length > 1) return;
                          setCurrentUnitCount(cleaned);
                        }}
                        keyboardType="decimal-pad"
                        placeholderTextColor={BRAND_COLORS.electricBlue}
                        style={[styles.entryField, styles.multiFieldInput]}
                        onSubmitEditing={handleAddUnitCount}
                        returnKeyType="done"
                        onFocus={() => handleFieldFocusWrapper("units")}
                      />
                      <TouchableOpacity
                        style={styles.addButtonCompact}
                        onPress={handleAddUnitCount}
                      >
                        <Ionicons
                          name="add-circle"
                          size={24}
                          color={BRAND_COLORS.electricBlue}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Added units chips */}
                    {unitCounts.length > 0 && (
                      <View style={styles.chipsContainer}>
                        {unitCounts.map((unit: { id: string; amount: number; label?: string }) => (
                          <TouchableOpacity
                            key={unit.id}
                            style={styles.chip}
                            onPress={() => handleDeleteUnitCount(unit.id)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.chipContent}>
                              <Text style={styles.chipText}>
                                {formatNumberWithCommas(unit.amount.toString())}
                              </Text>
                              <Ionicons
                                name="close-circle"
                                size={16}
                                color={BRAND_COLORS.orange}
                              />
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[styles.searchButton, isLoading && styles.searchButtonDisabled]}
                onPress={handleLookup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={BRAND_COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="search" size={18} color={BRAND_COLORS.white} />
                    <Text style={styles.searchButtonText}>Calculate</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
                <Ionicons name="backspace-outline" size={18} color={BRAND_COLORS.white} />
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Scrollable Content Area - Results and other content */}
        <KeyboardAwareScrollView
          ref={resultScrollViewRef}
          style={styles.scrollableContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Results Section - Displayed inline instead of in drawer */}
          {result && (
            <View style={styles.resultsSection}>
              {/* Results Header */}
              <View style={styles.resultsHeader}>
                <View style={styles.resultsHeaderInfo}>
                  <Text style={styles.resultsTitle}>Results for {selectedCountry?.name}</Text>
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
                          styles.resultsDescription,
                          descriptionExpanded && styles.resultsDescriptionExpanded,
                        ]}
                        numberOfLines={descriptionExpanded ? undefined : 1}
                        ellipsizeMode="tail"
                      >
                        {result.description}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <View style={styles.resultsActions}>
                  {settings.autoSaveToHistory ? (
                    <View style={styles.autoSaveIndicator}>
                      <Ionicons name="checkmark-circle" size={16} color={BRAND_COLORS.success} />
                      <Text style={styles.autoSaveText}>AutoSave On</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.saveButton, isSaved && styles.savedButton]}
                      onPress={() => handleSaveToHistory()}
                      disabled={isSaved}
                    >
                      <Ionicons
                        name={isSaved ? "checkmark-circle" : "bookmark-outline"}
                        size={16}
                        color={isSaved ? BRAND_COLORS.success : BRAND_COLORS.electricBlue}
                      />
                      <Text style={[styles.saveButtonText, isSaved && styles.savedButtonText]}>
                        {isSaved ? "Saved" : "Save"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Duties and Landed Cost Cards */}
              {(() => {
                const dutiableValue = parseFloat(declaredValue);
                const merchandiseValueForLanded = dutiableValue + (freightCost ? parseFloat(freightCost) : 0);
                const landedCost = merchandiseValueForLanded + result.totalAmount;
                const hasFreightCost = freightCost && parseFloat(freightCost) > 0;

                return (
                  <View style={styles.totalCardsRow}>
                    {/* Duties Card */}
                    <View style={[styles.totalCard, { marginRight: hasFreightCost ? 8 : 0 }]}>
                      <Text style={styles.totalCardLabel}>Est. Duties & Fees</Text>
                      <Text style={styles.totalCardValue}>{formatCurrency(result.totalAmount)}</Text>
                      <Text style={styles.totalCardSubtext}>on {formatCurrency(dutiableValue)} value</Text>
                    </View>
                    
                    {/* Landed Cost Card */}
                    {hasFreightCost && (
                      <View style={[styles.totalCard, { marginLeft: 8 }]}>
                        <Text style={styles.totalCardLabel}>Est. Landed Cost</Text>
                        <Text style={styles.totalCardValue}>{formatCurrency(landedCost)}</Text>
                        <Text style={styles.totalCardSubtext}>COGs+duties+other costs</Text>
                      </View>
                    )}
                  </View>
                );
              })()}

              {/* Duty Breakdown */}
              {result.components && result.components.length > 0 && (
                <View style={styles.breakdownSection}>
                  <Text style={styles.breakdownTitle}>Duty Breakdown</Text>
                  {result.components.map((component: DutyComponent, index: number) => (
                    <View key={index} style={styles.breakdownRow}>
                      <View style={styles.breakdownLeft}>
                        <Text style={styles.breakdownLabel}>{getLineItemLabel(component)}</Text>
                        {component.rate > 0 && (
                          <Text style={styles.breakdownRate}>{component.rate.toFixed(2)}%</Text>
                        )}
                      </View>
                      <Text style={styles.breakdownAmount}>{formatCurrency(component.amount)}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Processing Fees */}
              {result.fees && (
                <View style={styles.breakdownSection}>
                  <Text style={styles.breakdownTitle}>Processing Fees</Text>
                  <View style={styles.breakdownRow}>
                    <View style={styles.breakdownLeft}>
                      <Text style={styles.breakdownLabel}>Merchandise Processing Fee</Text>
                      <Text style={styles.breakdownRate}>{result.fees.mpf.rate.toFixed(4)}%</Text>
                    </View>
                    <Text style={styles.breakdownAmount}>{formatCurrency(result.fees.mpf.amount)}</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <View style={styles.breakdownLeft}>
                      <Text style={styles.breakdownLabel}>Harbor Maintenance Fee</Text>
                      <Text style={styles.breakdownRate}>{result.fees.hmf.rate.toFixed(3)}%</Text>
                    </View>
                    <Text style={styles.breakdownAmount}>{formatCurrency(result.fees.hmf.amount)}</Text>
                  </View>
                </View>
              )}

              {/* Unit Calculations */}
              {(() => {
                const totalUnitCount = unitCounts.reduce<number>(
                  (sum: number, unit: { id: string; amount: number; label?: string }) =>
                    sum + unit.amount,
                  0,
                );
                const totalDeclaredValue =
                  parseFloat(declaredValue) +
                  additionalCosts.reduce<number>(
                    (sum: number, cost: { id: string; amount: number; label?: string }) =>
                      sum + cost.amount,
                    0,
                  );

                if (totalUnitCount > 0) {
                  return (
                    <View style={styles.breakdownSection}>
                      <Text style={styles.breakdownTitle}>Per Unit ({formatNumber(totalUnitCount, 0)} units)</Text>
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Duty Cost</Text>
                        <Text style={styles.breakdownAmount}>{formatCurrency(result.totalAmount / totalUnitCount)}</Text>
                      </View>
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Landed Cost</Text>
                        <Text style={styles.breakdownAmount}>
                          {formatCurrency((totalDeclaredValue + result.totalAmount) / totalUnitCount)}
                        </Text>
                      </View>
                      {(() => {
                        if (result.components) {
                          const rtComponent = result.components.find((c: DutyComponent) => c.type === RECIPROCAL_TARIFF_TYPE);
                          if (rtComponent && rtComponent.amount > 0) {
                            return (
                              <View style={styles.breakdownRow}>
                                <Text style={styles.breakdownLabel}>Addl RT cost</Text>
                                <Text style={styles.breakdownHighlight}>
                                  {formatCurrency(rtComponent.amount / totalUnitCount)}
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

              {/* Tariff Engineering Button */}
              <TouchableOpacity
                style={styles.tariffEngineeringButton}
                onPress={() => {
                  haptics.selection();
                  setTariffEngineeringDrawerVisible(true);
                }}
              >
                <Ionicons name="git-compare" size={18} color={BRAND_COLORS.white} />
                <Text style={styles.tariffEngineeringButtonText}>Tariff Engineering</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Loading Message Display */}
          {loadingMessage && (
            <View style={styles.loadingMessageContainer}>
              <Text style={styles.loadingMessageText}>{loadingMessage}</Text>
            </View>
          )}
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
            // Open FAB immediately
            setUserClosedFab(false);
            openMainFab();
          }}
          position="bottom"
        >
          {renderHistoryDrawerContent()}
        </AnimatedDrawer>

        <AnimatedDrawer
          isVisible={newsDrawerVisible}
          onClose={() => {
            setNewsDrawerVisible(false);
            // Open FAB immediately
            setUserClosedFab(false);
            openMainFab();
          }}
          position="right"
        >
          {renderNewsDrawerContent()}
        </AnimatedDrawer>

        <AnimatedDrawer
          isVisible={analyticsDrawerVisible}
          onClose={() => {
            setAnalyticsDrawerVisible(false);
            // Open FAB immediately
            setUserClosedFab(false);
            openMainFab();
          }}
          position="left"
        >
          {renderAnalyticsDrawerContent()}
        </AnimatedDrawer>

        {/* Tariff News Drawer */}
        <AnimatedDrawer
          isVisible={linksDrawerVisible}
          onClose={() => {
            setLinksDrawerVisible(false);
            // Open FAB immediately
            setUserClosedFab(false);
            openMainFab();
          }}
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
            // Open FAB immediately
            setUserClosedFab(false);
            openMainFab();
          }}
          position="right"
          wrapScroll={false}
        >
          <HistoryColumnContent
            visible={mainHistoryDrawerVisible}
            onItemPress={(item: HistoryItem) => {
              // Close the history drawer
              setMainHistoryDrawerVisible(false);
              // Populate the form with the selected history item
              handleHistoryItemSelection(item);
              // Open FAB immediately
              setUserClosedFab(false);
              openMainFab();
            }}
          />
        </AnimatedDrawer>

        {/* Settings Drawer */}
        <AnimatedDrawer
          isVisible={settingsDrawerVisible}
          onClose={() => {
            setSettingsDrawerVisible(false);
            // Open FAB immediately
            setUserClosedFab(false);
            openMainFab();
          }}
          position="left"
        >
          <SettingsScreen
            onNavigate={() => {
              setSettingsDrawerVisible(false);
              // Don't open FAB when navigating to another screen
            }}
          />
        </AnimatedDrawer>

        {/* Tariff Engineering Drawer */}
        <AnimatedDrawer
          isVisible={tariffEngineeringDrawerVisible}
          onClose={() => {
            setTariffEngineeringDrawerVisible(false);
            // Open FAB immediately
            setUserClosedFab(false);
            openMainFab();
          }}
          position="right"
        >
          {result && selectedCountry && (
            <TariffEngineeringComparison
              htsCode={result.htsCode}
              description={result.description}
              countryCode={selectedCountry.code}
              countryName={selectedCountry.name}
              declaredValue={parseFloat(declaredValue)}
              currentTotalDuty={result.totalAmount}
              isUSMCAOrigin={isUSMCAOrigin}
              onClose={() => {
                // Close tariff engineering drawer and reopen results
                setTariffEngineeringDrawerVisible(false);
                setResultsDrawerVisible(true);
              }}
            />
          )}
        </AnimatedDrawer>

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

        {shouldShowTab && tabY > 0 && (
          <InfoTab
            y={tabY}
            opacity={infoTabOpacity}
            size={infoTabSize}
            onPress={() => setInfoDrawerVisible(true)}
            onDrag={handleInfoTabDragOpen}
          />
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
  
  // Fixed Header Container - X0/Y0 to X595/Y236
  fixedHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: 595,
    height: 236,
    backgroundColor: BRAND_COLORS.white,
    zIndex: 100,
    ...BRAND_SHADOWS.medium,
  },
  
  // Logo Section
  logoSection: {
    height: 100,
    backgroundColor: BRAND_COLORS.darkNavy,
  },
  logoRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerLogo: {
    width: 200,
    height: 60,
    resizeMode: 'contain',
  },
  headerMenuContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Entry Hub Section
  entryHubSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  entryHubTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BRAND_COLORS.darkNavy,
    marginBottom: 10,
  },
  entryFieldsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10,
  },
  htsFieldWrapper: {
    flex: 1,
    position: 'relative',
  },
  countryFieldWrapper: {
    flex: 1,
  },
  entryField: {
    backgroundColor: BRAND_COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: BRAND_COLORS.darkNavy,
    borderWidth: 1,
    borderColor: BRAND_COLORS.mediumGray,
    height: 40,
  },
  valueFieldsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10,
  },
  valueFieldWrapper: {
    flex: 1,
  },
  multiFieldContainer: {
    flex: 1,
  },
  multiFieldInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  multiFieldInput: {
    flex: 1,
  },
  addButtonCompact: {
    padding: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
    gap: 5,
  },
  chip: {
    backgroundColor: BRAND_COLORS.lightGray,
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  chipText: {
    fontSize: 12,
    color: BRAND_COLORS.darkNavy,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  
  // Scrollable Content
  scrollableContent: {
    flex: 1,
    marginTop: 236, // Start below fixed header
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  
  // Results Section
  resultsSection: {
    backgroundColor: BRAND_COLORS.white,
    borderRadius: 12,
    padding: 16,
    ...BRAND_SHADOWS.medium,
    marginBottom: 20,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.lightGray,
  },
  resultsHeaderInfo: {
    flex: 1,
    marginRight: 10,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BRAND_COLORS.darkNavy,
    marginBottom: 4,
  },
  resultsDescription: {
    fontSize: 14,
    color: BRAND_COLORS.darkGray,
    marginTop: 4,
  },
  resultsDescriptionExpanded: {
    backgroundColor: BRAND_COLORS.lightGray,
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  resultsActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  autoSaveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  autoSaveText: {
    fontSize: 12,
    color: BRAND_COLORS.success,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: BRAND_COLORS.lightGray,
  },
  savedButton: {
    backgroundColor: BRAND_COLORS.success + '20',
  },
  saveButtonText: {
    fontSize: 12,
    color: BRAND_COLORS.electricBlue,
    fontWeight: '600',
  },
  savedButtonText: {
    color: BRAND_COLORS.success,
  },
  
  // Total Cards
  totalCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  totalCard: {
    flex: 1,
    backgroundColor: BRAND_COLORS.electricBlue,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    ...BRAND_SHADOWS.small,
  },
  totalCardLabel: {
    fontSize: 12,
    color: BRAND_COLORS.white,
    opacity: 0.9,
    marginBottom: 4,
  },
  totalCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: BRAND_COLORS.white,
    marginBottom: 4,
  },
  totalCardSubtext: {
    fontSize: 11,
    color: BRAND_COLORS.white,
    opacity: 0.8,
    textAlign: 'center',
  },
  
  // Breakdown Sections
  breakdownSection: {
    marginBottom: 20,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND_COLORS.darkNavy,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.lightGray + '50',
  },
  breakdownLeft: {
    flex: 1,
    marginRight: 10,
  },
  breakdownLabel: {
    fontSize: 14,
    color: BRAND_COLORS.darkNavy,
  },
  breakdownRate: {
    fontSize: 12,
    color: BRAND_COLORS.darkGray,
    marginTop: 2,
  },
  breakdownAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_COLORS.darkNavy,
  },
  breakdownHighlight: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_COLORS.orange,
  },
  
  // Selected HTS Field
  selectedHtsField: {
    backgroundColor: BRAND_COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: BRAND_COLORS.mediumGray,
    minHeight: 40,
  },
  selectedHtsContent: {
    flexDirection: 'column',
  },
  selectedHtsTextContainer: {
    flex: 1,
  },
  selectedHtsCodeText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_COLORS.electricBlue,
  },
  selectedHtsDescriptionText: {
    fontSize: 12,
    color: BRAND_COLORS.darkGray,
    marginTop: 2,
    fontStyle: 'italic',
  },

  // Unified Floating Menu Styles
  heroFloatingMenuContainer: {
    position: "absolute",
    bottom: getResponsiveValue(5, 15), // iPhone: -5px more, iPad: -10px more for proportional spacing
    left: getResponsiveValue(20, 50), // Left padding to match logo alignment
    right: 0,
    height: getResponsiveValue(45, 74), // Match main FAB height to ensure consistent alignment
    alignItems: "center", // Center vertically to ensure all FABs are on same horizontal line
    justifyContent: "flex-start", // Left align horizontally
    flexDirection: "row", // Ensure horizontal layout
    zIndex: 100, // High z-index to ensure FABs are clickable
  },
  menuFab: {
    position: "absolute",
    alignSelf: "center", // Ensure vertical centering
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
    ...BRAND_SHADOWS.large,
    zIndex: 999,
    elevation: 999,
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
  },
  loadingSpinnerContainer: {
    marginBottom: getSpacing("md"),
  },
  loadingModalText: {
    fontSize: getTypographySize("lg"),
    ...BRAND_TYPOGRAPHY.getFontStyle("medium"),
    color: BRAND_COLORS.darkNavy,
  },
  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: getResponsiveValue(8, 12), // Reduced margin
    paddingHorizontal:
      Platform.OS === "ios" && Platform.isPad
        ? SCREEN_WIDTH * 0.25
        : getResponsiveValue(8, 12), // Reduced padding
  },
  clearButton: {
    backgroundColor: BRAND_COLORS.darkGray,
    borderRadius: getBorderRadius("md"),
    paddingVertical: getResponsiveValue(8, 12),
    paddingHorizontal: getResponsiveValue(16, 20),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...BRAND_SHADOWS.small,
    height: getResponsiveValue(40, 48),
  },
  clearButtonText: {
    color: BRAND_COLORS.white,
    fontSize: getTypographySize("md"),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    marginLeft: getSpacing("sm"),
  },
  infoTab: {
    position: "absolute",
    left: -10, // Moved 10px to the left for more noticeable spacing
    width: 40,
    height: 40,
    backgroundColor: BRAND_COLORS.electricBlue,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
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
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  dataSourceGradient: {
    paddingVertical: getSpacing("sm"),
    paddingHorizontal: getSpacing("md"),
    alignItems: "center",
  },
  dataSourceInfoLine: {
    fontSize: getResponsiveValue(10, 12),
    color: BRAND_COLORS.white,
    opacity: 0.9,
    textAlign: "center",
  },
  tariffEngineeringButton: {
    backgroundColor: BRAND_COLORS.info,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    ...BRAND_SHADOWS.small,
  },
  tariffEngineeringButtonText: {
    color: BRAND_COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
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
        fontSize: getResponsiveValue(16, 18) * 0.75, // Same as HTS code font
        height: getResponsiveValue(46, 54), // Same height as HTS input
        paddingHorizontal: getResponsiveValue(15, 20),
        backgroundColor: BRAND_COLORS.lightGray,
        borderRadius: getResponsiveValue(12, 16),
        color: BRAND_COLORS.mediumBlue, // Changed to medium blue
        textAlign: "left",
        width: "100%",
        borderWidth: 1,
        borderColor: BRAND_COLORS.mediumGray,
      },
      android: {
        fontSize: getResponsiveValue(16, 18) * 0.75, // Same as HTS code font
        height: getResponsiveValue(46, 54), // Same height as HTS input
        paddingHorizontal: getResponsiveValue(15, 20),
        backgroundColor: BRAND_COLORS.lightGray,
        borderRadius: getResponsiveValue(12, 16),
        color: BRAND_COLORS.mediumBlue, // Changed to medium blue
        textAlign: "left",
        width: "100%",
        borderWidth: 1,
        borderColor: BRAND_COLORS.mediumGray,
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
    fontSize: getResponsiveValue(16, 18) * 0.75, // Same as HTS code font
    height: getResponsiveValue(46, 54), // Same height as value input
    paddingHorizontal: getResponsiveValue(15, 20),
    backgroundColor: BRAND_COLORS.lightGray,
    borderRadius: getResponsiveValue(12, 16),
    color: BRAND_COLORS.mediumBlue, // Same medium blue
    textAlign: "left",
    borderWidth: 1,
    borderColor: BRAND_COLORS.mediumGray,
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
    fontSize: getResponsiveValue(11, 13),
    color: BRAND_COLORS.darkNavy,
    marginRight: getResponsiveValue(8, 10),
  },
  arithmeticContainer: {
    marginTop: getResponsiveValue(8, 10),
    paddingTop: getResponsiveValue(8, 10),
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.lightGray,
  },
  arithmeticText: {
    fontSize: getResponsiveValue(12, 14),
    fontWeight: "600",
    color: BRAND_COLORS.darkNavy,
    textAlign: "right",
  },
  arithmeticDivider: {
    height: 1,
    backgroundColor: BRAND_COLORS.darkNavy,
    marginVertical: getResponsiveValue(4, 6),
  },
  arithmeticTotal: {
    fontSize: getResponsiveValue(14, 16),
    fontWeight: "700",
  },
  searchButton: {
    backgroundColor: BRAND_COLORS.electricBlue,
    borderRadius: getBorderRadius("md"),
    paddingVertical: getResponsiveValue(8, 12), // Reduced padding
    paddingHorizontal: getResponsiveValue(16, 20), // Reduced padding
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...BRAND_SHADOWS.small,
    height: getResponsiveValue(40, 48), // Reduced height
    marginLeft: 0, // Remove margin for iPad positioning
    alignSelf: "flex-start",
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: BRAND_COLORS.white,
    fontSize: getTypographySize("md"),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    marginLeft: getSpacing("sm"),
    lineHeight: getTypographySize("md") * 1.4, // Adjusted line height for vertical centering
  },
  clearButton: {
    backgroundColor: BRAND_COLORS.darkGray,
    borderRadius: getBorderRadius("md"),
    paddingVertical: getResponsiveValue(8, 12),
    paddingHorizontal: getResponsiveValue(16, 20),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...BRAND_SHADOWS.small,
    height: getResponsiveValue(40, 48),
  },
  clearButtonText: {
    color: BRAND_COLORS.white,
    fontSize: getTypographySize("md"),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    marginLeft: getSpacing("sm"),
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
  
  // HTS Suggestions Styles
  suggestionsContainer: {
    backgroundColor: BRAND_COLORS.white,
    borderRadius: getBorderRadius("md"),
    ...BRAND_SHADOWS.small,
    marginTop: getSpacing("xs"),
    marginBottom: getSpacing("sm"),
    paddingVertical: getSpacing("xs"),
    minHeight: 0,
    maxHeight: getResponsiveValue(325, 550),
    width: "100%",
    alignSelf: "flex-start",
    zIndex: 15,
    elevation: 15,
  },
  suggestionsScrollView: {
    maxHeight: getResponsiveValue(325, 550),
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
    padding: getResponsiveValue(6, 8),
    marginBottom: getResponsiveValue(8, 12),
    width: Platform.OS === "ios" && Platform.isPad ? 500 : "100%",
    maxWidth: "100%",
    height: getResponsiveValue(40, 48),
  },
  toggleLabel: {
    fontSize: getResponsiveValue(
      getTypographySize("md"),
      getTypographySize("md") * 1.2,
    ),
    color: BRAND_COLORS.darkNavy,
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    flex: 1,
  },
  selectedDescriptionContainer: {
    marginTop: getResponsiveValue(-6, -8),
    marginBottom: getResponsiveValue(8, 10),
    paddingHorizontal: getSpacing("sm"),
    paddingVertical: getSpacing("xs"),
    backgroundColor: BRAND_COLORS.lightGray,
    borderRadius: getBorderRadius("sm"),
    width: "100%",
    alignSelf: "flex-start",
  },
  selectedDescriptionText: {
    fontSize: getResponsiveValue(
      getTypographySize("xs") * 0.9,
      getTypographySize("sm") * 0.9,
    ),
    color: BRAND_COLORS.darkGray,
    fontFamily: "Geologica-Regular",
    fontStyle: "italic",
    lineHeight: getResponsiveValue(14, 18),
  },
  // Legacy styles for backward compatibility
  inputSection: {
    backgroundColor: BRAND_COLORS.white,
    borderRadius: getBorderRadius("lg"),
    padding: getResponsiveValue(12, 16),
    ...BRAND_SHADOWS.medium,
    marginBottom: getResponsiveValue(8, 12),
    zIndex: 10,
    elevation: 10,
  },
  sectionTitleWrapper: {
    paddingHorizontal:
      Platform.OS === "ios" && Platform.isPad
        ? SCREEN_WIDTH * 0.25
        : getSpacing("md"),
    alignItems: "flex-start",
    width: "100%",
  },
  sectionTitle: {
    fontSize: getResponsiveValue(
      getTypographySize("lg") * 1.25,
      getTypographySize("xxl") * 1.25,
    ),
    ...BRAND_TYPOGRAPHY.getFontStyle("bold"),
    color: BRAND_COLORS.darkNavy,
    marginBottom: getResponsiveValue(8, 12),
    textAlign: "left",
    width: Platform.OS === "ios" && Platform.isPad ? 500 : "100%",
    maxWidth: "100%",
    paddingHorizontal: getResponsiveValue(20, 40),
  },
  inputContainer: {
    marginBottom: getResponsiveValue(8, 12),
  },
  dropdownFieldsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
    paddingHorizontal:
      Platform.OS === "ios" && Platform.isPad ? SCREEN_WIDTH * 0.25 : 0,
    marginBottom: getResponsiveValue(10, 12),
    gap: getResponsiveValue(8, 12),
  },
  halfWidthWrapper: {
    flex: 1,
    position: "relative",
  },
  halfWidthInput: {
    width: "100%",
  },
  inputWrapper: {
    width: Platform.OS === "ios" && Platform.isPad ? "100%" : "50%",
    paddingHorizontal:
      Platform.OS === "ios" && Platform.isPad ? SCREEN_WIDTH * 0.25 : 0,
    alignItems: "flex-start",
    marginLeft: Platform.OS === "ios" && Platform.isPad ? 0 : -1,
  },
  input: {
    backgroundColor: BRAND_COLORS.lightGray,
    borderRadius: getBorderRadius("md"),
    paddingHorizontal: getSpacing("sm"),
    paddingVertical: getResponsiveValue(6, 8),
    fontSize: getResponsiveValue(
      getTypographySize("md") * 1.5 * 0.75,
      getTypographySize("md") * 1.8 * 0.75,
    ),
    fontFamily: BRAND_TYPOGRAPHY.getFontFamily("regular"),
    color: BRAND_COLORS.darkNavy,
    marginBottom: getResponsiveValue(6, 8),
    borderWidth: 1,
    borderColor: BRAND_COLORS.mediumGray,
    height: getResponsiveValue(46, 54),
    width: Platform.OS === "ios" && Platform.isPad ? 500 : "100%",
    maxWidth: "100%",
  },
  valueInput: {
    width: "100%",
  },
  valueFieldColumn: {
    flex: 1,
  },
  arithmeticContainer: {
    marginTop: getSpacing("xs"),
    paddingTop: getSpacing("xs"),
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.lightGray,
  },
  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: getSpacing("md"),
    paddingHorizontal:
      Platform.OS === "ios" && Platform.isPad ? SCREEN_WIDTH * 0.25 : 0,
    gap: getSpacing("sm"),
  },
});
