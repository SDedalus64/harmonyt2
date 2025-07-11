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
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getTariffEngineeringSuggestions,
  getNeighboringCodes,
  getMaterialAlternatives,
  fetchTariffEngineeringSuggestions,
  TariffEngineeringSuggestion,
  getCreativeSemanticMatches,
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
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainTabParamList } from "../navigation/types";

export default function TariffEngineeringScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<MainTabParamList>>();
  const [htsCode, setHtsCode] = useState("");
  const [semanticResults, setSemanticResults] = useState<
    TariffEngineeringSuggestion[]
  >([]);
  const [materialResults, setMaterialResults] = useState<
    TariffEngineeringSuggestion[]
  >([]);
  const [creativeResults, setCreativeResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [htsSuggestions, setHtsSuggestions] = useState<
    Array<{ code: string; description: string }>
  >([]);
  const [searchMessage, setSearchMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [currentProductInfo, setCurrentProductInfo] = useState<{
    description: string;
    dutyRate: number;
  } | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<{
    code: string;
    name: string;
  }>({ code: "CN", name: "China" }); // Default to China

  // Check if should show Tariff Intelligence guide
  useEffect(() => {
    const checkShowGuide = async () => {
      try {
        const dontShow = await AsyncStorage.getItem(
          "dontShowTariffIntelligenceGuide",
        );
        if (dontShow !== "true") {
          // User hasn't opted out, show the modal
          setShowInfoModal(true);
        }
      } catch (error) {
        console.log("Error checking TI guide preference:", error);
      }
    };
    checkShowGuide();
  }, []);

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
      const creative = getCreativeSemanticMatches(code);

      setSemanticResults(semantic);
      setMaterialResults(material);
      setCreativeResults(creative);

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

  const handleModalClose = async () => {
    if (dontShowAgain) {
      try {
        await AsyncStorage.setItem("dontShowTariffIntelligenceGuide", "true");
      } catch (error) {
        console.log("Error saving preference:", error);
      }
    }
    setShowInfoModal(false);
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
      <Text style={styles.suggestionDescription}>{item.description}</Text>
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
      {item.reason && (
        <View style={styles.questionPrompt}>
          <Text style={styles.questionPromptLabel}>💬 Ask your broker:</Text>
          <Text style={styles.resultReason}>"{item.reason}"</Text>
        </View>
      )}
      <View style={styles.riskIndicator}>
        <Text style={styles.riskText}>
          Approach:{" "}
          {item.reasonType === "NEIGHBOR"
            ? "Similar products"
            : item.reasonType === "MATERIAL"
              ? "Material change"
              : item.reasonType === "SEMANTIC"
                ? "Related classification"
                : "Alternative interpretation"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Educational Modal */}
      <Modal
        visible={showInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Understanding Tariff Intelligence
              </Text>
              <TouchableOpacity onPress={handleModalClose}>
                <Ionicons
                  name="close"
                  size={24}
                  color={BRAND_COLORS.darkNavy}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalSubheading}>
                What is Tariff Engineering?
              </Text>
              <Text style={styles.modalText}>
                It's the art of asking "What if?" about your product
                classifications. Could this medical table just be... furniture?
                Professional customs brokers explore these possibilities every
                day - now you can too.
              </Text>

              <Text style={styles.modalSubheading}>How Harmony Helps</Text>
              <Text style={styles.modalText}>
                Harmony gives you smart questions you might never have thought
                to ask:
                {"\n"}• "Could this be classified differently if we import it
                unfinished?"
                {"\n"}• "What if we used a different material?"
                {"\n"}• "Is this really medical equipment or just furniture?"
              </Text>

              <Text style={styles.modalSubheading}>Keep in Mind</Text>
              <Text style={styles.modalText}>
                • These are conversation starters, not gospel truth
                {"\n"}• Your broker has the final say (they're the experts!)
                {"\n"}• Getting it wrong can be expensive
                {"\n"}• But asking smart questions? That's always free
              </Text>

              <Text style={styles.modalSubheading}>How to Use This Tool</Text>
              <Text style={styles.modalText}>
                1. Enter your HTS code
                {"\n"}2. Review the suggested questions
                {"\n"}3. Share these with your customs broker
                {"\n"}4. Or book a consultation with us for expert guidance
              </Text>
            </ScrollView>

            <View
              style={{
                paddingHorizontal: getSpacing("lg"),
                paddingBottom: getSpacing("sm"),
              }}
            >
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  marginBottom: getSpacing("xs"),
                }}
                onPress={() => setDontShowAgain(!dontShowAgain)}
              >
                <Text
                  style={{
                    fontSize: getTypographySize("sm"),
                    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
                    color: BRAND_COLORS.darkGray,
                    marginRight: getSpacing("sm"),
                  }}
                >
                  Don't show this again
                </Text>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderWidth: 2,
                    borderColor: BRAND_COLORS.electricBlue,
                    borderRadius: 4,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: dontShowAgain
                      ? BRAND_COLORS.electricBlue
                      : BRAND_COLORS.white,
                  }}
                >
                  {dontShowAgain && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={BRAND_COLORS.white}
                    />
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { margin: 0 }]}
                onPress={handleModalClose}
              >
                <Text style={styles.modalButtonText}>
                  Let's see what Harmony suggests!
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header with Gradient */}
      <LinearGradient
        colors={[BRAND_COLORS.electricBlue, BRAND_COLORS.darkNavy]}
        style={{
          alignItems: "center",
          paddingHorizontal: getSpacing("lg"),
          paddingBottom: getSpacing("xl"),
          paddingTop: insets.top + getSpacing("md"),
          position: "relative" as const,
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + getSpacing("xs") }]}
          onPress={() => navigation.navigate("Lookup")}
        >
          <Ionicons name="arrow-back" size={16} color={BRAND_COLORS.darkNavy} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Ionicons name="construct" size={32} color={BRAND_COLORS.white} />
        <Text style={[styles.title, { color: BRAND_COLORS.white }]}>
          Tariff Intelligence (Beta)
        </Text>
        <Text style={[styles.subtitle, { color: BRAND_COLORS.white }]}>
          Helping you ask the right questions about the complex world of tariffs
        </Text>
        <Text
          style={[
            styles.subtitle,
            {
              fontSize: getTypographySize("sm"),
              marginTop: getSpacing("sm"),
              color: "rgba(255,255,255,0.8)",
            },
          ]}
        >
          💡 Get ideas • Challenge assumptions • Save on duties
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Input Section */}
        <View style={[styles.inputSection, { marginTop: getSpacing("xl") }]}>
          {/* HTS Code Input - without label */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Enter HTS code (min. 6 digits)"
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

          {/* Country Selector - below HTS code */}
          <View style={{ marginTop: getSpacing("sm") }}>
            <CountryLookup
              selectedCountry={selectedCountry}
              onSelect={(country: { code: string; name: string }) => {
                setSelectedCountry(country);
                // Clear previous results when country changes
                setSemanticResults([]);
                setMaterialResults([]);
                setCreativeResults([]);
                setCurrentProductInfo(null);
                setHasSearched(false);
              }}
            />
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
                <Ionicons name="bulb" size={24} color={BRAND_COLORS.white} />
                <Text style={styles.searchButtonText}>Ask Harmony</Text>
                <Text style={styles.searchButtonSubtext}>
                  She'll find questions you never thought to ask
                </Text>
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

            {/* Helpful Reminder */}
            {(semanticResults.length > 0 ||
              materialResults.length > 0 ||
              creativeResults.length > 0) && (
              <View
                style={[
                  styles.resultsSummary,
                  {
                    backgroundColor: BRAND_COLORS.darkNavy + "10",
                    borderColor: BRAND_COLORS.darkNavy,
                    borderWidth: 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.resultsSummaryTitle,
                    {
                      fontSize: getTypographySize("sm"),
                      color: BRAND_COLORS.darkNavy,
                    },
                  ]}
                >
                  💡 Harmony's advice:
                </Text>
                <Text
                  style={[
                    styles.resultsSummaryItem,
                    { fontSize: getTypographySize("xs") },
                  ]}
                >
                  • Share these ideas with your customs broker
                  {"\n"}• Each suggestion needs professional verification
                  {"\n"}• Want Harmony's team to help? Book a consultation!
                </Text>
              </View>
            )}

            {/* Results Summary - Show what's available */}
            {(semanticResults.length > 0 ||
              materialResults.length > 0 ||
              creativeResults.length > 0) && (
              <View
                style={[
                  styles.resultsSummary,
                  { backgroundColor: BRAND_COLORS.electricBlue + "15" },
                ]}
              >
                <Text style={styles.resultsSummaryTitle}>
                  🎯 Harmony found{" "}
                  {semanticResults.length +
                    materialResults.length +
                    creativeResults.length}{" "}
                  smart questions for you:
                </Text>
                {creativeResults.length > 0 && (
                  <Text style={styles.resultsSummaryItem}>
                    💭 {creativeResults.length} "What if we classified this
                    as..." questions
                  </Text>
                )}
                {semanticResults.length > 0 && (
                  <Text style={styles.resultsSummaryItem}>
                    🔍 {semanticResults.length} "Could this qualify as..."
                    questions
                  </Text>
                )}
                {materialResults.length > 0 && (
                  <Text style={styles.resultsSummaryItem}>
                    🔄 {materialResults.length} "What if we used different
                    materials..." questions
                  </Text>
                )}
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
                <Text style={styles.categoryTitle}>
                  Classification Questions
                </Text>
              </View>
              <Text style={styles.categorySubtitle}>
                Based on how similar products might be classified differently
              </Text>

              {semanticResults.length > 0 ? (
                <FlatList
                  data={semanticResults}
                  keyExtractor={(item) => item.code}
                  renderItem={renderResultItem}
                  scrollEnabled={false}
                />
              ) : (
                <Text style={styles.emptyText}>
                  Harmony didn't find questions for this code - but you can
                  still ask your broker about alternatives!
                </Text>
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
                <Text style={styles.categoryTitle}>Material Questions</Text>
              </View>
              <Text style={styles.categorySubtitle}>
                Ask if using different materials could reduce duties
              </Text>

              {materialResults.length > 0 ? (
                <FlatList
                  data={materialResults}
                  keyExtractor={(item) => item.code}
                  renderItem={renderResultItem}
                  scrollEnabled={false}
                />
              ) : (
                <Text style={styles.emptyText}>
                  Harmony didn't find material variations - but definitely ask
                  your broker about options!
                </Text>
              )}
            </View>

            {/* Creative Cross-Chapter Results */}
            {creativeResults.length > 0 && (
              <View style={styles.resultCategory}>
                <View style={styles.categoryHeader}>
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: BRAND_COLORS.orange },
                    ]}
                  >
                    <Ionicons
                      name="bulb"
                      size={20}
                      color={BRAND_COLORS.white}
                    />
                  </View>
                  <Text style={styles.categoryTitle}>"What If" Questions</Text>
                </View>
                <Text style={styles.categorySubtitle}>
                  Creative possibilities to explore with your broker
                </Text>

                <FlatList
                  data={creativeResults}
                  keyExtractor={(item) => `${item.fromCode}-${item.toCode}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.resultItem, styles.creativeResultItem]}
                      onPress={() => haptics.selection()}
                    >
                      <View style={styles.resultHeader}>
                        <Text style={styles.creativeChapterChange}>
                          Ch {item.fromChapter} → Ch {item.toChapter}
                        </Text>
                        <View style={[styles.savingsBadge, { minWidth: 90 }]}>
                          <Text style={styles.savingsText}>
                            Save {(item.fromRate - item.toRate).toFixed(1)}%
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.resultCode}>{item.toCode}</Text>
                      <Text style={styles.resultDescription}>
                        {item.toDescription}
                      </Text>
                      <View style={styles.rateComparison}>
                        <Text style={styles.oldRate}>{item.fromRate}%</Text>
                        <Text style={styles.arrow}>→</Text>
                        <Text style={styles.newRate}>{item.toRate}%</Text>
                      </View>
                      <View style={styles.creativeReasonContainer}>
                        <Ionicons
                          name="bulb-outline"
                          size={16}
                          color={BRAND_COLORS.electricBlue}
                        />
                        <Text style={styles.creativeReason}>
                          Ask your broker: "{item.reasoning}"
                        </Text>
                      </View>
                      {item.legalBasis && (
                        <Text
                          style={[
                            styles.riskText,
                            { marginTop: getSpacing("xs") },
                          ]}
                        >
                          Rationale: {item.legalBasis}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                  scrollEnabled={false}
                />
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Question Button - Always visible when HTS is entered */}
      {htsCode.length >= 6 && !hasSearched && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={handleSearch}
          disabled={loading}
        >
          <View style={styles.floatingButtonContent}>
            <Text style={styles.floatingButtonEmoji}>💡</Text>
            <Text style={styles.floatingButtonText}>Ask Harmony for ideas</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Footer */}
      {hasSearched && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Want Harmony's team to dig deeper into these ideas?
          </Text>
          <TouchableOpacity style={styles.consultButton}>
            <Text style={styles.consultButtonText}>Book a Consultation</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  arrow: {
    color: BRAND_COLORS.darkGray,
    fontSize: getTypographySize("md"),
    marginHorizontal: 8,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: BRAND_COLORS.orange,
    borderRadius: getBorderRadius("md"),
    flexDirection: "row",
    left: getSpacing("lg"),
    paddingHorizontal: getSpacing("sm"),
    paddingVertical: getSpacing("xs"),
    position: "absolute",
    ...BRAND_SHADOWS.small,
  },
  backButtonText: {
    color: BRAND_COLORS.darkNavy,
    fontSize: getTypographySize("xs"),
    marginLeft: 4,
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
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
  categorySubtitle: {
    fontSize: getTypographySize("xs"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.electricBlue,
    fontStyle: "italic",
    marginBottom: getSpacing("md"),
    marginTop: -getSpacing("xs"),
  },
  categoryTitle: {
    fontSize: getTypographySize("lg"),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: BRAND_COLORS.darkNavy,
  },

  consultButton: {
    backgroundColor: BRAND_COLORS.electricBlue,
    borderRadius: getBorderRadius("md"),
    paddingHorizontal: getSpacing("xl"),
    paddingVertical: getSpacing("sm"),
    ...BRAND_SHADOWS.medium,
  },
  consultButtonText: {
    fontSize: getTypographySize("md"),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: BRAND_COLORS.white,
  },
  container: {
    backgroundColor: BRAND_COLORS.white,
    flex: 1,
  },
  creativeChapterChange: {
    fontSize: getTypographySize("md"),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: BRAND_COLORS.darkNavy,
  },
  creativeReason: {
    fontSize: getTypographySize("sm"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.darkGray,
    flex: 1,
    marginLeft: getSpacing("xs"),
  },
  creativeReasonContainer: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: getSpacing("xs"),
  },
  creativeResultItem: {
    borderColor: BRAND_COLORS.orange,
    borderWidth: 2,
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
  floatingButton: {
    backgroundColor: BRAND_COLORS.electricBlue,
    borderRadius: 30,
    bottom: getSpacing("xl"),
    left: getSpacing("lg"),
    paddingHorizontal: getSpacing("lg"),
    paddingVertical: getSpacing("md"),
    position: "absolute",
    right: getSpacing("lg"),
    ...BRAND_SHADOWS.large,
    elevation: 8,
  },
  floatingButtonContent: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  floatingButtonEmoji: {
    fontSize: 28,
    marginRight: getSpacing("sm"),
  },
  floatingButtonText: {
    fontSize: getTypographySize("lg"),
    ...BRAND_TYPOGRAPHY.getFontStyle("bold"),
    color: BRAND_COLORS.white,
  },
  footer: {
    alignItems: "center",
    backgroundColor: BRAND_COLORS.darkNavy,
    padding: getSpacing("lg"),
  },
  footerText: {
    fontSize: getTypographySize("md"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.white,
    marginBottom: getSpacing("md"),
    textAlign: "center",
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
    paddingVertical: getSpacing("xl"),
    position: "relative",
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
    marginBottom: getSpacing("lg"),
    marginHorizontal: getSpacing("lg"),
  },
  inputWrapper: {
    position: "relative",
    zIndex: 10,
  },
  modalBody: {
    padding: getSpacing("lg"),
  },
  modalButton: {
    alignItems: "center",
    backgroundColor: BRAND_COLORS.electricBlue,
    borderRadius: getBorderRadius("md"),
    margin: getSpacing("lg"),
    padding: getSpacing("md"),
    ...BRAND_SHADOWS.medium,
  },
  modalButtonText: {
    fontSize: getTypographySize("md"),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: BRAND_COLORS.white,
  },
  modalContent: {
    backgroundColor: BRAND_COLORS.white,
    borderRadius: getBorderRadius("lg"),
    maxHeight: "80%",
    maxWidth: 500,
    width: "100%",
    ...BRAND_SHADOWS.large,
  },
  modalHeader: {
    alignItems: "center",
    borderBottomColor: BRAND_COLORS.lightGray,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: getSpacing("lg"),
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flex: 1,
    justifyContent: "center",
    padding: getSpacing("lg"),
  },
  modalSubheading: {
    fontSize: getTypographySize("lg"),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: BRAND_COLORS.darkNavy,
    marginBottom: getSpacing("sm"),
    marginTop: getSpacing("md"),
  },
  modalText: {
    fontSize: getTypographySize("md"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.darkGray,
    lineHeight: getTypographySize("md") * 1.5,
    marginBottom: getSpacing("md"),
  },
  modalTitle: {
    fontSize: getTypographySize("xl"),
    ...BRAND_TYPOGRAPHY.getFontStyle("bold"),
    color: BRAND_COLORS.darkNavy,
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
  questionPrompt: {
    marginBottom: getSpacing("xs"),
    marginTop: getSpacing("xs"),
  },
  questionPromptLabel: {
    fontSize: getTypographySize("xs"),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: BRAND_COLORS.electricBlue,
    marginBottom: 2,
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
  resultsSummary: {
    backgroundColor: BRAND_COLORS.electricBlue + "10",
    borderRadius: getBorderRadius("md"),
    marginBottom: getSpacing("lg"),
    padding: getSpacing("md"),
  },
  resultsSummaryItem: {
    fontSize: getTypographySize("sm"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.darkGray,
    marginTop: getSpacing("xs"),
  },
  resultsSummaryTitle: {
    fontSize: getTypographySize("md"),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: BRAND_COLORS.darkNavy,
    marginBottom: getSpacing("xs"),
  },
  riskIndicator: {
    marginTop: getSpacing("xs"),
  },
  riskText: {
    fontSize: getTypographySize("xs"),
    ...BRAND_TYPOGRAPHY.getFontStyle("medium"),
    color: BRAND_COLORS.darkNavy,
    fontStyle: "italic",
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
    borderRadius: getBorderRadius("lg"),
    height: getResponsiveValue(80, 90),
    justifyContent: "center",
    marginTop: getSpacing("xl"),
    padding: getSpacing("md"),
    ...BRAND_SHADOWS.large,
    borderColor: BRAND_COLORS.electricBlue,
    borderWidth: 2,
  },
  searchButtonDisabled: {
    backgroundColor: BRAND_COLORS.mediumGray,
    borderColor: BRAND_COLORS.mediumGray,
  },
  searchButtonSubtext: {
    fontSize: getTypographySize("xs"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.white,
    marginTop: 2,
    opacity: 0.9,
    textAlign: "center",
  },
  searchButtonText: {
    fontSize: getTypographySize("lg"),
    ...BRAND_TYPOGRAPHY.getFontStyle("bold"),
    color: BRAND_COLORS.white,
    marginTop: getSpacing("xs"),
    textAlign: "center",
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
