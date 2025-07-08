import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  Switch,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
} from "react-native";
// ← SafeAreaView must come from react-native-safe-area-context:
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

import { useDebounce } from "../hooks/useDebounce";
import EntryForm from "../components/EntryForm";
import ResultSummary from "../components/ResultSummary";

import { MainTabParamList } from "../navigation/types";
import { useSettings } from "../hooks/useSettings";
import { useHistory } from "../hooks/useHistory";
import { useTariff } from "../hooks/useTariff";
import { tariffSearchService } from "../services/tariffSearchService";
import { TariffService } from "../services/tariffService";
import { getCountryName } from "../utils/countries";
import CountryLookup from "../components/CountryLookup";

// Remove erroneous InfoFieldKey import and define our own union:
type FieldKey = "code" | "declared" | "freight" | "units";

import FieldWithInfo from "../components/FieldWithInfo";
import DisclaimerModal from "./DisclaimerModal";
import InfoDrawer from "../components/InfoDrawer";
import FirstTimeGuideScreen from "./FirstTimeGuideScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { haptics } from "../utils/haptics";
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
  BRAND_SHADOWS,
  getTypographySize,
  getSpacing,
  getBorderRadius,
  getResponsiveValue,
  getDrawerConfig,
  getFabConfig,
  getInputConfig,
  getButtonConfig,
  getTradeNewsDrawerConfig,
} from "../config/brandColors";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import HistoryColumnContent from "../components/HistoryColumnContent";
import RightColumnContent from "../components/RightColumnContent";
import LinksScreen from "./LinksScreen";
import SettingsScreen from "./SettingsScreen";
import TariffNewsContent from "../components/TariffNewsContent";
import HistoryScreen from "./HistoryScreen";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";

type LookupScreenNavigationProp = BottomTabNavigationProp<
  MainTabParamList,
  "Lookup"
>;
type LookupScreenRouteProp = RouteProp<MainTabParamList, "Lookup">;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const tariffService = TariffService.getInstance();
const GUIDE_STORAGE_KEY = "@HarmonyTi:hasSeenFirstTimeGuide";
const RECIPROCAL_TARIFF_TYPE = "Reciprocal Tariff";

export default function LookupScreen() {
  const navigation = useNavigation<LookupScreenNavigationProp>();
  const route = useRoute<LookupScreenRouteProp>();
  const insets = useSafeAreaInsets();

  const [htsCode, setHtsCode] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<
    { code: string; name: string } | undefined
  >();
  const [declaredValue, setDeclaredValue] = useState("");
  const [freightCost, setFreightCost] = useState("");
  const [unitCount, setUnitCount] = useState("");
  const [isUSMCAOrigin, setIsUSMCAOrigin] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loadedHistoryTimestamp, setLoadedHistoryTimestamp] = useState<
    number | null
  >(null);

  const { settings } = useSettings();
  const { history, loadHistory, saveToHistory } = useHistory();

  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [showFirstTimeGuide, setShowFirstTimeGuide] = useState(false);

  // Use our local FieldKey type:
  const [activeField, setActiveField] = useState<FieldKey | null>(null);
  const [infoDrawerVisible, setInfoDrawerVisible] = useState(false);
  const infoTabOpacity = useRef(new Animated.Value(0)).current;
  const [tabY, setTabY] = useState(0);

  const { code, country, declared, freight, units } = {
    code: useDebounce(htsCode, 300),
    country: useDebounce(selectedCountry, 300),
    declared: useDebounce(declaredValue, 300),
    freight: useDebounce(freightCost, 300),
    units: useDebounce(unitCount, 300),
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (code.length >= 3 && country && declared) {
      handleLookup();
    }
  }, [code, country, declared]);

  const handleLookup = async () => {
    if (!htsCode || !selectedCountry || !declaredValue) {
      Alert.alert(
        "Missing Information",
        "Enter code, country, and declared value."
      );
      return;
    }
    haptics.impact();
    Keyboard.dismiss();
    setIsLoading(true);
    setResult(null);
    setIsSaved(false);
    try {
      const calc = await tariffService.calculateDuty(
        htsCode,
        parseFloat(declaredValue),
        selectedCountry.code,
        settings.isReciprocalAdditive,
        false,
        isUSMCAOrigin
      );
      if (calc) {
        const lookupResult = {
          totalAmount: calc.amount,
          components: calc.components,
          fees: calc.fees,
          breakdown: calc.breakdown,
        };
        setResult(lookupResult);
        haptics.success();
        if (settings.autoSaveToHistory && !loadedHistoryTimestamp) {
          await saveToHistory({
            htsCode,
            description: calc.description,
            countryCode: selectedCountry.code,
            countryName: selectedCountry.name,
            declaredValue: parseFloat(declaredValue),
            freightCost: freightCost ? parseFloat(freightCost) : undefined,
            totalAmount: calc.amount,
            dutyRate: calc.totalRate,
            breakdown: calc.breakdown,
            components: calc.components,
            fees: calc.fees,
            // ← Removed bad import/type lines and timestamp
            unitCount: unitCount || undefined,
          });
          setIsSaved(true);
        }
      }
    } catch (e) {
      Alert.alert("Error", "Lookup failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = () => {
    setHtsCode("");
    setSelectedCountry(undefined);
    setDeclaredValue("");
    setFreightCost("");
    setUnitCount("");
    setIsUSMCAOrigin(false);
    setResult(null);
    setIsSaved(false);
    setLoadedHistoryTimestamp(null);
  };

  const handleDisclaimerAgree = () => {
    setShowDisclaimer(false);
  };

  const handleGuideClose = async (dontShowAgain: boolean) => {
    setShowFirstTimeGuide(false);
    if (dontShowAgain) {
      await AsyncStorage.setItem(GUIDE_STORAGE_KEY, "true");
    }
  };

  useEffect(() => {
    if (!showDisclaimer && settings.showQuickTour) {
      setShowFirstTimeGuide(true);
    }
  }, [showDisclaimer, settings.showQuickTour]);

  const renderFullResults = () => {
    if (!result) return null;
    return (
      <View style={styles.fullResultsContainer}>
        <ScrollView
          style={styles.fullResultsScroll}
          contentContainerStyle={{ paddingBottom: getSpacing("xl") }}
          showsVerticalScrollIndicator={false}
        >
          {/* Duties & Landed */}
          <View style={styles.totalRow}>
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Est. Duties & Fees</Text>
              <Text style={styles.totalValue}>
                ${result.totalAmount.toFixed(2)}
              </Text>
            </View>
            {freightCost && parseFloat(freightCost) > 0 && (
              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Est. Landed Cost</Text>
                <Text style={styles.totalValue}>
                  $
                  {(
                    parseFloat(declaredValue) +
                    parseFloat(freightCost) +
                    result.totalAmount
                  ).toFixed(2)}
                </Text>
              </View>
            )}
          </View>

          {/* Breakdown */}
          <Text style={styles.sectionTitle}>Duty Breakdown</Text>
          {result.components.map((c: any, i: number) => (
            <View key={i} style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{c.label || c.type}</Text>
              <Text style={styles.breakdownAmount}>
                ${c.amount.toFixed(2)}
              </Text>
            </View>
          ))}

          {/* Fees */}
          <Text style={styles.sectionTitle}>Processing Fees</Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>MPF</Text>
            <Text style={styles.breakdownAmount}>
              ${result.fees.mpf.amount.toFixed(2)}
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>HMF</Text>
            <Text style={styles.breakdownAmount}>
              ${result.fees.hmf.amount.toFixed(2)}
            </Text>
          </View>

          {/* Per Unit */}
          {unitCount && parseFloat(unitCount) > 0 && (
            <>
              <Text style={styles.sectionTitle}>Per Unit ({unitCount})</Text>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Duty Cost</Text>
                <Text style={styles.breakdownAmount}>
                  ${(result.totalAmount / parseFloat(unitCount)).toFixed(2)}
                </Text>
              </View>
              {freightCost && parseFloat(freightCost) > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Landed Cost</Text>
                  <Text style={styles.breakdownAmount}>
                    {(
                      (parseFloat(declaredValue) +
                        parseFloat(freightCost) +
                        result.totalAmount) /
                      parseFloat(unitCount)
                    ).toFixed(2)}
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <DisclaimerModal visible={showDisclaimer} onAgree={handleDisclaimerAgree} />

      <View style={styles.content}>
        <HorizontalSection
          height={SCREEN_HEIGHT * 0.28}
          style={styles.heroSection}
        >
          <Image
            source={require("../../assets/Harmony-white.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </HorizontalSection>

        <View style={styles.mainScrollArea}>
          <EntryForm
            htsCode={htsCode}
            onHtsChange={setHtsCode}
            selectedCountry={selectedCountry}
            onCountryChange={setSelectedCountry}
            declaredValue={declaredValue}
            onDeclaredChange={setDeclaredValue}
            freightCost={freightCost}
            onFreightChange={setFreightCost}
            unitCount={unitCount}
            onUnitsChange={setUnitCount}
            isUSMCAOrigin={isUSMCAOrigin}
            onUSMCAChange={setIsUSMCAOrigin}
            isLoading={isLoading}
            onCalculate={handleLookup}
            onClear={handleClearAll}
          />

          <ResultSummary
            duties={result?.totalAmount || 0}
            landed={
              result
                ? parseFloat(declaredValue) +
                  (freightCost ? parseFloat(freightCost) : 0) +
                  result.totalAmount
                : undefined
            }
            perUnitDuty={
              result && unitCount
                ? result.totalAmount / parseFloat(unitCount)
                : undefined
            }
            perUnitLanded={
              result && unitCount
                ? (parseFloat(declaredValue) +
                    (freightCost ? parseFloat(freightCost) : 0) +
                    result.totalAmount) /
                  parseFloat(unitCount)
                : undefined
            }
          />

          {renderFullResults()}

          {/* Example of renaming the drawer prop: */}
          <AnimatedDrawer
            isVisible={false}
            onClose={() => {}}
            position="bottom"
            customDrawerConfig={getDrawerConfig()}
          >
            <View />
          </AnimatedDrawer>
        </View>
      </View>

      <InfoDrawer
        isOpen={infoDrawerVisible}
        onClose={() => setInfoDrawerVisible(false)} 
        field={activeField}
      />

      <FirstTimeGuideScreen visible={showFirstTimeGuide} onClose={handleGuideClose} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND_COLORS.white },
  content: { flex: 1 },
  heroSection: { position: "relative", zIndex: 1 },
  logo: {
    width: getResponsiveValue(SCREEN_WIDTH * 0.6, SCREEN_WIDTH * 0.75),
    height: getTypographySize("lg") * 2,
    alignSelf: "center",
  },
  mainScrollArea: {
    flex: 1,
    padding: getSpacing("md"),
  },
  fullResultsContainer: {
    flex: 1,
    backgroundColor: BRAND_COLORS.white,
    marginTop: getSpacing("lg"),
  },
  fullResultsScroll: {
    flex: 1,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: getSpacing("md"),
  },
  totalCard: {
    backgroundColor: BRAND_COLORS.electricBlue,
    borderRadius: getBorderRadius("md"),
    padding: getSpacing("sm"),
    flex: 1,
    marginHorizontal: getSpacing("xs"),
  },
  totalLabel: {
    color: BRAND_COLORS.white,
    fontSize: getTypographySize("sm"),
  },
  totalValue: {
    color: BRAND_COLORS.white,
    fontSize: getTypographySize("xl"),
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: getTypographySize("md"),
    fontWeight: "600",
    marginTop: getSpacing("lg"),
    marginBottom: getSpacing("sm"),
    color: BRAND_COLORS.darkNavy,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: getSpacing("xs"),
  },
  breakdownLabel: {
    fontSize: getTypographySize("sm"),
    color: BRAND_COLORS.darkGray,
  },
  breakdownAmount: {
    fontSize: getTypographySize("sm"),
    color: BRAND_COLORS.darkNavy,
    fontWeight: "500",
  },
});