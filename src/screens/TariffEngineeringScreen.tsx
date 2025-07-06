import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getTariffEngineeringSuggestions,
  getNeighboringCodes,
  getMaterialAlternatives,
  fetchTariffEngineeringSuggestions,
  TariffEngineeringSuggestion,
} from "../services/tariffEngineeringService";
import { tariffSearchService } from "../services/tariffSearchService";
import {
  BRAND_COLORS,
  BRAND_TYPOGRAPHY,
  BRAND_SHADOWS,
  getTypographySize,
  getSpacing,
  getBorderRadius,
  getResponsiveValue,
  isTablet,
} from "../config/brandColors";
import { haptics } from "../utils/haptics";
import CountryLookup from "../components/CountryLookup";

export default function TariffEngineeringScreen() {
  const insets = useSafeAreaInsets();
  const [htsCode, setHtsCode] = useState("");
  const [semanticResults, setSemanticResults] = useState<
    TariffEngineeringSuggestion[]
  >([]);
  const [materialResults, setMaterialResults] = useState<
    TariffEngineeringSuggestion[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [htsSuggestions, setHtsSuggestions] = useState<
    Array<{ code: string; description: string }>
  >([]);
  const [searchMessage, setSearchMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [currentProductInfo, setCurrentProductInfo] = useState<{
    description: string;
    dutyRate: number;
  } | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<{
    code: string;
    name: string;
  }>({ code: "CN", name: "China" }); // Default to China

  // Search for HTS suggestions as user types
  useEffect(() => {
    const searchForSuggestions = async () => {
      if (htsCode.length >= 3) {
        setShowSuggestions(true);
        setSearchMessage("Searching...");

        try {
          const results = await tariffSearchService.searchByPrefix(htsCode, 15);

          setHtsSuggestions(results);
          if (results.length === 0) {
            setSearchMessage("No matching HTS codes found");
          } else {
            setSearchMessage(""); // Clear the message when we have results
          }
        } catch (error) {
          console.error("[TariffEngineering] Search error:", error);
          setHtsSuggestions([]);
          setSearchMessage("Error searching HTS codes");
        }
      } else {
        setShowSuggestions(false);
        setHtsSuggestions([]);
        setSearchMessage("");
      }
    };

    const debounceTimer = setTimeout(searchForSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [htsCode]);

  const handleHtsSelection = (code: string) => {
    haptics.selection();
    setHtsCode(code);
    setShowSuggestions(false);
    // Automatically search when a code is selected
    searchForAlternatives(code);
  };

  const searchForAlternatives = async (code: string) => {
    if (code.length < 6) {
      setError("Enter at least 6 digits");
      return;
    }

    setError("");
    setLoading(true);
    setHasSearched(true);

    try {
      const all = await fetchTariffEngineeringSuggestions(code);
      // Split into categories
      const semantic = getNeighboringCodes(code);
      const material = getMaterialAlternatives(code);

      setSemanticResults(semantic);
      setMaterialResults(material);

      // Get current product info from the tariff engineering data
      const tariffData = (await import("../../data/tariff_engineering.json"))
        .default as any;
      const normalizedCode = code.replace(/\D/g, "").padEnd(8, "0").slice(0, 8);
      const entry = tariffData[normalizedCode];

      if (entry) {
        setCurrentProductInfo({
          description: entry.description || "Product description not available",
          dutyRate: entry.dutyRate || 0,
        });
      } else if (semantic.length > 0 || material.length > 0) {
        // Fallback to first result info
        const firstResult = semantic[0] || material[0];
        setCurrentProductInfo({
          description: "Product description not available",
          dutyRate: firstResult.currentDutyRate,
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to find alternatives");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    haptics.buttonPress();
    searchForAlternatives(htsCode);
  };

  const renderSuggestionItem = ({
    item,
  }: {
    item: { code: string; description: string };
  }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleHtsSelection(item.code)}
    >
      <Text style={styles.suggestionCode}>{item.code}</Text>
      <Text style={styles.suggestionDescription} numberOfLines={2}>
        {item.description}
      </Text>
    </TouchableOpacity>
  );

  const renderResultItem = ({
    item,
  }: {
    item: TariffEngineeringSuggestion;
  }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => haptics.selection()}
    >
      <View style={styles.resultHeader}>
        <Text style={styles.resultCode}>{item.code}</Text>
        <View style={styles.savingsBadge}>
          <Text style={styles.savingsText}>
            Save {item.savings.toFixed(1)}%
          </Text>
        </View>
      </View>
      <Text style={styles.resultDescription}>{item.description}</Text>
      <View style={styles.rateComparison}>
        <Text style={styles.oldRate}>{item.currentDutyRate}%</Text>
        <Text style={styles.arrow}>→</Text>
        <Text style={styles.newRate}>{item.suggestedDutyRate}%</Text>
        <Text style={styles.fromCountry}> (from {selectedCountry.code})</Text>
      </View>
      {item.reason && <Text style={styles.resultReason}>{item.reason}</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + getSpacing("lg") },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons
            name="construct"
            size={32}
            color={BRAND_COLORS.electricBlue}
          />
          <Text style={styles.title}>Tariff Engineering</Text>
          <Text style={styles.subtitle}>
            Find alternative HTS classifications through material substitution
            and semantic analysis
          </Text>
        </View>

        {/* Input Section */}
        <View style={styles.inputSection}>
          {/* Country Selector */}
          <View style={styles.countrySection}>
            <Text style={styles.inputLabel}>Country of Origin</Text>
            <CountryLookup
              selectedCountry={selectedCountry}
              onSelect={(country: { code: string; name: string }) => {
                setSelectedCountry(country);
                // Clear previous results when country changes
                setSemanticResults([]);
                setMaterialResults([]);
                setCurrentProductInfo(null);
                setHasSearched(false);
              }}
            />
          </View>

          <Text style={[styles.inputLabel, { marginTop: getSpacing("lg") }]}>
            Enter HTS Code
          </Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Start typing HTS code (min. 3 digits)"
              placeholderTextColor={BRAND_COLORS.mediumGray}
              value={htsCode}
              onChangeText={setHtsCode}
              keyboardType="numeric"
              maxLength={10}
            />

            {/* HTS Suggestions Dropdown */}
            {showSuggestions && (
              <View style={styles.suggestionsContainer}>
                {searchMessage && htsSuggestions.length === 0 ? (
                  <Text style={styles.searchMessage}>{searchMessage}</Text>
                ) : htsSuggestions.length > 0 ? (
                  <FlatList
                    data={htsSuggestions}
                    keyExtractor={(item) => item.code}
                    renderItem={renderSuggestionItem}
                    style={styles.suggestionsList}
                    keyboardShouldPersistTaps="handled"
                  />
                ) : null}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.searchButton,
              (!htsCode || htsCode.length < 6) && styles.searchButtonDisabled,
            ]}
            onPress={handleSearch}
            disabled={!htsCode || htsCode.length < 6 || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={BRAND_COLORS.white} />
            ) : (
              <>
                <Ionicons name="search" size={20} color={BRAND_COLORS.white} />
                <Text style={styles.searchButtonText}>Find Alternatives</Text>
              </>
            )}
          </TouchableOpacity>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        {/* Results Section */}
        {hasSearched && !loading && (
          <View style={styles.resultsSection}>
            {/* Current Product Info */}
            {currentProductInfo && (
              <View style={styles.currentProductCard}>
                <Text style={styles.currentProductLabel}>Current Product</Text>
                <Text style={styles.currentProductCode}>{htsCode}</Text>
                <Text style={styles.currentProductDescription}>
                  {currentProductInfo.description}
                </Text>
                <View style={styles.rateInfo}>
                  <Text style={styles.currentProductRate}>
                    Duty Rate from {selectedCountry.name}:{" "}
                    {currentProductInfo.dutyRate}%
                  </Text>
                  <Text style={styles.rateNote}>
                    Note: Currently showing general duty rates. Country-specific
                    rates coming soon.
                  </Text>
                </View>
              </View>
            )}
            {/* Semantic Results */}
            <View style={styles.resultCategory}>
              <View style={styles.categoryHeader}>
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: BRAND_COLORS.electricBlue },
                  ]}
                >
                  <Ionicons
                    name="git-network"
                    size={20}
                    color={BRAND_COLORS.white}
                  />
                </View>
                <Text style={styles.categoryTitle}>Semantic Similar Codes</Text>
              </View>

              {semanticResults.length > 0 ? (
                <FlatList
                  data={semanticResults}
                  keyExtractor={(item) => item.code}
                  renderItem={renderResultItem}
                  scrollEnabled={false}
                />
              ) : (
                <Text style={styles.emptyText}>No semantic matches found</Text>
              )}
            </View>

            {/* Material Results */}
            <View style={styles.resultCategory}>
              <View style={styles.categoryHeader}>
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: BRAND_COLORS.success },
                  ]}
                >
                  <Ionicons name="cube" size={20} color={BRAND_COLORS.white} />
                </View>
                <Text style={styles.categoryTitle}>Material Alternatives</Text>
              </View>

              {materialResults.length > 0 ? (
                <FlatList
                  data={materialResults}
                  keyExtractor={(item) => item.code}
                  renderItem={renderResultItem}
                  scrollEnabled={false}
                />
              ) : (
                <Text style={styles.emptyText}>
                  No material alternatives found
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  arrow: {
    color: BRAND_COLORS.darkGray,
    fontSize: getTypographySize("md"),
    marginHorizontal: 8,
  },
  categoryHeader: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: getSpacing("md"),
  },
  categoryIcon: {
    alignItems: "center",
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    marginRight: getSpacing("sm"),
    width: 32,
  },
  categoryTitle: {
    fontSize: getTypographySize("lg"),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: BRAND_COLORS.darkNavy,
  },
  container: {
    backgroundColor: BRAND_COLORS.white,
    flex: 1,
  },
  countrySection: {
    marginBottom: getSpacing("md"),
  },
  currentProductCard: {
    backgroundColor: BRAND_COLORS.lightGray,
    borderColor: BRAND_COLORS.electricBlue,
    borderRadius: getBorderRadius("md"),
    borderWidth: 2,
    marginBottom: getSpacing("lg"),
    padding: getSpacing("md"),
  },
  currentProductCode: {
    fontSize: getTypographySize("xl"),
    ...BRAND_TYPOGRAPHY.getFontStyle("bold"),
    color: BRAND_COLORS.darkNavy,
    marginBottom: getSpacing("xs"),
  },
  currentProductDescription: {
    fontSize: getTypographySize("md"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.darkGray,
    marginBottom: getSpacing("sm"),
  },
  currentProductLabel: {
    fontSize: getTypographySize("xs"),
    ...BRAND_TYPOGRAPHY.getFontStyle("medium"),
    color: BRAND_COLORS.electricBlue,
    marginBottom: getSpacing("xs"),
    textTransform: "uppercase",
  },
  currentProductRate: {
    fontSize: getTypographySize("lg"),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: BRAND_COLORS.darkNavy,
  },
  emptyText: {
    fontSize: getTypographySize("md"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.darkGray,
    padding: getSpacing("lg"),
    textAlign: "center",
  },
  error: {
    fontSize: getTypographySize("sm"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.error,
    marginTop: getSpacing("xs"),
  },
  fromCountry: {
    fontSize: getTypographySize("xs"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.darkGray,
  },
  header: {
    alignItems: "center",
    marginBottom: getSpacing("xl"),
    paddingHorizontal: getSpacing("lg"),
  },
  input: {
    backgroundColor: BRAND_COLORS.white,
    borderColor: BRAND_COLORS.mediumGray,
    borderRadius: getBorderRadius("md"),
    borderWidth: 2,
    fontSize: getTypographySize("lg"),
    height: getResponsiveValue(50, 56),
    paddingHorizontal: getSpacing("md"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.darkNavy,
  },
  inputLabel: {
    fontSize: getTypographySize("sm"),
    ...BRAND_TYPOGRAPHY.getFontStyle("medium"),
    color: BRAND_COLORS.darkNavy,
    marginBottom: getSpacing("xs"),
  },
  inputSection: {
    marginBottom: getSpacing("xl"),
    marginHorizontal: getSpacing("lg"),
  },
  inputWrapper: {
    position: "relative",
    zIndex: 10,
  },
  newRate: {
    color: BRAND_COLORS.success,
    fontSize: getTypographySize("md"),
    fontWeight: "bold",
  },
  oldRate: {
    color: BRAND_COLORS.darkGray,
    fontSize: getTypographySize("md"),
    textDecorationLine: "line-through",
  },
  rateComparison: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: getSpacing("xs"),
  },
  rateInfo: {
    marginTop: getSpacing("xs"),
  },
  rateNote: {
    fontSize: getTypographySize("xs"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.darkGray,
    fontStyle: "italic",
    marginTop: getSpacing("xs"),
  },
  resultCategory: {
    marginBottom: getSpacing("xl"),
  },
  resultCode: {
    fontSize: getTypographySize("lg"),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: BRAND_COLORS.darkNavy,
  },
  resultDescription: {
    fontSize: getTypographySize("sm"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.darkGray,
    marginVertical: getSpacing("xs"),
  },
  resultHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: getSpacing("xs"),
  },
  resultItem: {
    backgroundColor: BRAND_COLORS.white,
    borderColor: BRAND_COLORS.lightGray,
    borderRadius: getBorderRadius("md"),
    borderWidth: 1,
    marginBottom: getSpacing("sm"),
    padding: getSpacing("md"),
  },
  resultReason: {
    fontSize: getTypographySize("sm"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.darkGray,
    fontStyle: "italic",
  },
  resultScore: {
    fontSize: getTypographySize("sm"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.electricBlue,
  },
  resultsSection: {
    paddingHorizontal: getSpacing("lg"),
  },
  savingsBadge: {
    backgroundColor: BRAND_COLORS.success,
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  savingsText: {
    color: BRAND_COLORS.white,
    fontSize: getTypographySize("xs"),
    fontWeight: "bold",
  },
  scrollContent: {
    paddingBottom: getSpacing("xl"),
  },
  scrollView: {
    flex: 1,
  },
  searchButton: {
    alignItems: "center",
    backgroundColor: BRAND_COLORS.electricBlue,
    borderRadius: getBorderRadius("md"),
    flexDirection: "row",
    height: getResponsiveValue(50, 56),
    justifyContent: "center",
    marginTop: getSpacing("md"),
    ...BRAND_SHADOWS.medium,
  },
  searchButtonDisabled: {
    backgroundColor: BRAND_COLORS.mediumGray,
  },
  searchButtonText: {
    fontSize: getTypographySize("md"),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: BRAND_COLORS.white,
    marginLeft: getSpacing("sm"),
  },
  searchMessage: {
    fontSize: getTypographySize("md"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    backgroundColor: BRAND_COLORS.white,
    color: BRAND_COLORS.darkGray,
    padding: getSpacing("md"),
    textAlign: "center",
  },
  subtitle: {
    fontSize: getTypographySize("md"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.darkGray,
    marginTop: getSpacing("xs"),
    textAlign: "center",
  },
  suggestionCode: {
    fontSize: getTypographySize("md"),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: BRAND_COLORS.electricBlue,
  },
  suggestionDescription: {
    fontSize: getTypographySize("xs"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.darkGray,
    marginTop: 2,
  },
  suggestionItem: {
    backgroundColor: BRAND_COLORS.white,
    borderBottomColor: BRAND_COLORS.lightGray,
    borderBottomWidth: 1,
    paddingHorizontal: getSpacing("md"),
    paddingVertical: getSpacing("sm"),
  },
  suggestionsContainer: {
    backgroundColor: BRAND_COLORS.white,
    borderColor: BRAND_COLORS.electricBlue,
    borderRadius: getBorderRadius("md"),
    borderWidth: 2,
    elevation: 9999,
    left: -1,
    maxHeight: 220,
    overflow: "hidden",
    position: "absolute",
    right: -1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    top: getResponsiveValue(52, 58),
    zIndex: 9999,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  title: {
    fontSize: getTypographySize("xxl"),
    ...BRAND_TYPOGRAPHY.getFontStyle("bold"),
    color: BRAND_COLORS.darkNavy,
    marginTop: getSpacing("sm"),
    textAlign: "center",
  },
});
