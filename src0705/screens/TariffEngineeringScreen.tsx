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
  getSemanticSuggestions,
  getMaterialSuggestions,
  fetchAllTariffSuggestions,
  LinkSuggestion,
} from "../services/semanticLinkService";
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

export default function TariffEngineeringScreen() {
  const insets = useSafeAreaInsets();
  const [htsCode, setHtsCode] = useState("");
  const [semanticResults, setSemanticResults] = useState<LinkSuggestion[]>([]);
  const [materialResults, setMaterialResults] = useState<LinkSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [htsSuggestions, setHtsSuggestions] = useState<
    Array<{ code: string; description: string }>
  >([]);
  const [searchMessage, setSearchMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

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
      const all = await fetchAllTariffSuggestions(code);
      // Split into categories
      const semantic = getSemanticSuggestions(code);
      const material = getMaterialSuggestions(code);

      setSemanticResults(semantic);
      setMaterialResults(material);
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

  const renderResultItem = ({ item }: { item: LinkSuggestion }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => haptics.selection()}
    >
      <View style={styles.resultHeader}>
        <Text style={styles.resultCode}>{item.code}</Text>
        <Text style={styles.resultScore}>
          {(item.score * 100).toFixed(0)}% match
        </Text>
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
          <Text style={styles.inputLabel}>Enter HTS Code</Text>
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
                  <Ionicons
                    name="cube"
                    size={20}
                    color={BRAND_COLORS.white}
                  />
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
                <Text style={styles.emptyText}>No material alternatives found</Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: getSpacing("xl"),
  },
  header: {
    alignItems: "center",
    marginBottom: getSpacing("xl"),
    paddingHorizontal: getSpacing("lg"),
  },
  title: {
    fontSize: getTypographySize("xxl"),
    ...BRAND_TYPOGRAPHY.getFontStyle("bold"),
    color: BRAND_COLORS.darkNavy,
    marginTop: getSpacing("sm"),
    textAlign: "center",
  },
  subtitle: {
    fontSize: getTypographySize("md"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.darkGray,
    textAlign: "center",
    marginTop: getSpacing("xs"),
  },
  inputSection: {
    marginHorizontal: getSpacing("lg"),
    marginBottom: getSpacing("xl"),
  },
  inputLabel: {
    fontSize: getTypographySize("sm"),
    ...BRAND_TYPOGRAPHY.getFontStyle("medium"),
    color: BRAND_COLORS.darkNavy,
    marginBottom: getSpacing("xs"),
  },
  input: {
    height: getResponsiveValue(50, 56),
    borderWidth: 2,
    borderColor: BRAND_COLORS.mediumGray,
    borderRadius: getBorderRadius("md"),
    paddingHorizontal: getSpacing("md"),
    fontSize: getTypographySize("lg"),
    backgroundColor: BRAND_COLORS.white,
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.darkNavy,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: getResponsiveValue(70, 76),
    left: 0,
    right: 0,
    backgroundColor: BRAND_COLORS.white,
    borderWidth: 1,
    borderColor: BRAND_COLORS.mediumGray,
    borderRadius: getBorderRadius("md"),
    maxHeight: 200,
    zIndex: 1000,
    ...BRAND_SHADOWS.small,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    paddingHorizontal: getSpacing("md"),
    paddingVertical: getSpacing("sm"),
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.lightGray,
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
  searchMessage: {
    fontSize: getTypographySize("md"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.darkGray,
    padding: getSpacing("md"),
    textAlign: "center",
  },
  searchButton: {
    backgroundColor: BRAND_COLORS.electricBlue,
    height: getResponsiveValue(50, 56),
    borderRadius: getBorderRadius("md"),
    flexDirection: "row",
    alignItems: "center",
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
  error: {
    fontSize: getTypographySize("sm"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.error,
    marginTop: getSpacing("xs"),
  },
  resultsSection: {
    paddingHorizontal: getSpacing("lg"),
  },
  resultCategory: {
    marginBottom: getSpacing("xl"),
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: getSpacing("md"),
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: getSpacing("sm"),
  },
  categoryTitle: {
    fontSize: getTypographySize("lg"),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: BRAND_COLORS.darkNavy,
  },
  resultItem: {
    backgroundColor: BRAND_COLORS.white,
    padding: getSpacing("md"),
    borderRadius: getBorderRadius("md"),
    marginBottom: getSpacing("sm"),
    borderWidth: 1,
    borderColor: BRAND_COLORS.lightGray,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: getSpacing("xs"),
  },
  resultCode: {
    fontSize: getTypographySize("lg"),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: BRAND_COLORS.darkNavy,
  },
  resultScore: {
    fontSize: getTypographySize("sm"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.electricBlue,
  },
  resultReason: {
    fontSize: getTypographySize("sm"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.darkGray,
    fontStyle: "italic",
  },
  emptyText: {
    fontSize: getTypographySize("md"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.darkGray,
    textAlign: "center",
    padding: getSpacing("lg"),
  },
});
