import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  BRAND_COLORS,
  BRAND_TYPOGRAPHY,
  BRAND_SHADOWS,
  getTypographySize,
  getSpacing,
  getBorderRadius,
  getResponsiveValue,
} from "../config/brandColors";
import { haptics } from "../utils/haptics";
import {
  getTariffEngineeringSuggestionsWithDuties,
  CompleteDutyComparison,
} from "../services/tariffEngineeringService";

interface TariffEngineeringComparisonProps {
  htsCode: string;
  description: string;
  countryCode: string;
  countryName: string;
  declaredValue: number;
  currentTotalDuty: number;
  isUSMCAOrigin?: boolean;
  onClose: () => void;
}

export default function TariffEngineeringComparison({
  htsCode,
  description,
  countryCode,
  countryName,
  declaredValue,
  currentTotalDuty,
  isUSMCAOrigin = false,
  onClose,
}: TariffEngineeringComparisonProps) {
  const [loading, setLoading] = useState(true);
  const [comparisons, setComparisons] = useState<CompleteDutyComparison[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    loadComparisons();
  }, [htsCode, countryCode, declaredValue]);

  const loadComparisons = async () => {
    setLoading(true);
    setError(null);

    try {
      const results = await getTariffEngineeringSuggestionsWithDuties(
        htsCode,
        countryCode,
        declaredValue,
        isUSMCAOrigin,
      );

      setComparisons(results);

      if (results.length === 0) {
        setError(
          "No lower-duty alternative classifications found for this HTS code.",
        );
      }
    } catch (err) {
      console.error("Error loading comparisons:", err);
      setError("Failed to load alternative classifications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const renderComparison = (
    comparison: CompleteDutyComparison,
    index: number,
  ) => {
    const isExpanded = expandedIndex === index;
    const savingsPercent = comparison.savings.percentage;
    const isSignificantSavings = savingsPercent >= 5;

    return (
      <TouchableOpacity
        key={index}
        style={styles.comparisonCard}
        onPress={() => {
          haptics.selection();
          setExpandedIndex(isExpanded ? null : index);
        }}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.comparisonHeader}>
          <View style={styles.comparisonHeaderLeft}>
            <Text style={styles.alternativeCode}>
              {comparison.alternativeCode}
            </Text>
            <Text
              style={styles.alternativeDescription}
              numberOfLines={isExpanded ? undefined : 2}
            >
              {comparison.alternativeDescription}
            </Text>
          </View>
          <View style={styles.savingsContainer}>
            <Text
              style={[
                styles.savingsAmount,
                isSignificantSavings && styles.significantSavings,
              ]}
            >
              {formatCurrency(comparison.savings.amount)}
            </Text>
            <Text style={styles.savingsPercent}>
              Save {savingsPercent.toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Strategy */}
        <View style={styles.strategyContainer}>
          <Ionicons
            name="bulb-outline"
            size={16}
            color={BRAND_COLORS.electricBlue}
          />
          <Text style={styles.strategyText}>
            {comparison.engineeringStrategy}
          </Text>
        </View>

        {/* Avoided Tariffs */}
        {comparison.savings.avoidedTariffs.length > 0 && (
          <View style={styles.avoidedTariffsContainer}>
            <Text style={styles.avoidedTariffsLabel}>Avoids:</Text>
            {comparison.savings.avoidedTariffs.map((tariff, i) => (
              <View key={i} style={styles.avoidedTariffBadge}>
                <Text style={styles.avoidedTariffText}>{tariff}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.expandedDetails}>
            <View style={styles.divider} />

            {/* Current vs Alternative Comparison */}
            <View style={styles.comparisonRow}>
              <View style={styles.comparisonColumn}>
                <Text style={styles.columnLabel}>Current Classification</Text>
                <Text style={styles.columnCode}>{comparison.currentCode}</Text>
                <Text style={styles.columnAmount}>
                  {formatCurrency(comparison.currentDuty.totalAmount)}
                </Text>
              </View>
              <View style={styles.vsContainer}>
                <Text style={styles.vsText}>vs</Text>
              </View>
              <View style={styles.comparisonColumn}>
                <Text style={styles.columnLabel}>Alternative</Text>
                <Text style={styles.columnCode}>
                  {comparison.alternativeCode}
                </Text>
                <Text style={[styles.columnAmount, styles.alternativeAmount]}>
                  {formatCurrency(comparison.alternativeDuty.totalAmount)}
                </Text>
              </View>
            </View>

            {/* Duty Components Breakdown */}
            <View style={styles.componentsSection}>
              <Text style={styles.componentsSectionTitle}>
                Duty Breakdown Comparison
              </Text>

              {/* Current Components */}
              <View style={styles.componentsList}>
                <Text style={styles.componentsListTitle}>Current:</Text>
                {comparison.currentDuty.components.map((component, i) => (
                  <View key={i} style={styles.componentRow}>
                    <Text style={styles.componentLabel}>
                      {component.label || component.type}
                    </Text>
                    <Text style={styles.componentAmount}>
                      {formatCurrency(component.amount)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Alternative Components */}
              <View style={styles.componentsList}>
                <Text style={styles.componentsListTitle}>Alternative:</Text>
                {comparison.alternativeDuty.components.map((component, i) => (
                  <View key={i} style={styles.componentRow}>
                    <Text style={styles.componentLabel}>
                      {component.label || component.type}
                    </Text>
                    <Text style={styles.componentAmount}>
                      {formatCurrency(component.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Expand/Collapse Indicator */}
        <View style={styles.expandIndicator}>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={BRAND_COLORS.darkGray}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tariff Engineering</Text>
        <View style={styles.dataSection}>
          <Text style={styles.subtitle}>
            {htsCode} - {description}
          </Text>
          <Text style={styles.countryText}>From {countryName}</Text>
          <Text style={styles.valueText}>
            Value: {formatCurrency(declaredValue)}
          </Text>
        </View>
      </View>

      {/* Always show summary card */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card - Always visible */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Current Total Duty & Fees</Text>
          <Text style={styles.summaryAmount}>
            {formatCurrency(currentTotalDuty)}
          </Text>
          <Text style={styles.summarySubtext}>
            {loading
              ? "Analyzing..."
              : error
                ? "Analysis failed"
                : comparisons.length > 0
                  ? `${comparisons.length} lower-duty alternative${comparisons.length !== 1 ? "s" : ""} found`
                  : "No lower-duty alternatives found"}
          </Text>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BRAND_COLORS.electricBlue} />
            <Text style={styles.loadingText}>
              Analyzing alternative classifications...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle"
              size={48}
              color={BRAND_COLORS.error}
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onClose}>
              <Text style={styles.retryButtonText}>Return to Results</Text>
            </TouchableOpacity>
          </View>
        ) : comparisons.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <Ionicons
              name="analytics"
              size={48}
              color={BRAND_COLORS.electricBlue}
            />
            <Text style={[styles.noResultsText, { color: BRAND_COLORS.darkNavy }]}>
              No lower-duty alternative classifications found for this product.
            </Text>
            <Text style={[styles.noResultsSubtext, { color: BRAND_COLORS.electricBlue }]}>
              This HTS code appears to be optimally classified for imports from{" "}
              {countryName}. Alternative classifications exist but would result
              in the same or higher duties.
            </Text>
          </View>
        ) : (
          /* Comparisons */
          comparisons.map((comparison, index) =>
            renderComparison(comparison, index),
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  alternativeAmount: {
    color: BRAND_COLORS.success,
  },
  alternativeCode: {
    fontSize: getTypographySize("lg"),
    ...BRAND_TYPOGRAPHY.getFontStyle("bold"),
    color: BRAND_COLORS.darkNavy,
  },
  alternativeDescription: {
    fontSize: getTypographySize("sm"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.darkGray,
    marginTop: 4,
  },
  avoidedTariffBadge: {
    backgroundColor: BRAND_COLORS.orange,
    borderRadius: getBorderRadius("sm"),
    marginRight: getSpacing("xs"),
    marginTop: getSpacing("xs"),
    paddingHorizontal: getSpacing("sm"),
    paddingVertical: getSpacing("xs"),
  },
  avoidedTariffText: {
    fontSize: getTypographySize("xs"),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: BRAND_COLORS.white,
  },
  avoidedTariffsContainer: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: getSpacing("sm"),
  },
  avoidedTariffsLabel: {
    fontSize: getTypographySize("sm"),
    ...BRAND_TYPOGRAPHY.getFontStyle("medium"),
    color: BRAND_COLORS.darkGray,
    marginRight: getSpacing("sm"),
  },
  columnAmount: {
    fontSize: getTypographySize("lg"),
    ...BRAND_TYPOGRAPHY.getFontStyle("bold"),
    color: BRAND_COLORS.darkNavy,
  },
  columnCode: {
    fontSize: getTypographySize("md"),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: BRAND_COLORS.darkNavy,
    marginBottom: 4,
  },
  columnLabel: {
    fontSize: getTypographySize("xs"),
    ...BRAND_TYPOGRAPHY.getFontStyle("medium"),
    color: BRAND_COLORS.darkGray,
    marginBottom: 4,
  },
  comparisonCard: {
    backgroundColor: BRAND_COLORS.white,
    borderColor: BRAND_COLORS.lightGray,
    borderRadius: getBorderRadius("lg"),
    borderWidth: 1,
    marginBottom: getSpacing("md"),
    padding: getSpacing("md"),
    ...BRAND_SHADOWS.small,
  },
  comparisonColumn: {
    alignItems: "center",
    flex: 1,
  },
  comparisonHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  comparisonHeaderLeft: {
    flex: 1,
    marginRight: getSpacing("md"),
  },
  comparisonRow: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: getSpacing("md"),
  },
  componentAmount: {
    fontSize: getTypographySize("sm"),
    ...BRAND_TYPOGRAPHY.getFontStyle("medium"),
    color: BRAND_COLORS.darkNavy,
  },
  componentLabel: {
    fontSize: getTypographySize("sm"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.darkNavy,
    flex: 1,
  },
  componentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: getSpacing("xs"),
  },
  componentsList: {
    marginBottom: getSpacing("md"),
  },
  componentsListTitle: {
    fontSize: getTypographySize("sm"),
    ...BRAND_TYPOGRAPHY.getFontStyle("medium"),
    color: BRAND_COLORS.darkGray,
    marginBottom: getSpacing("xs"),
  },
  componentsSection: {
    marginTop: getSpacing("md"),
  },
  componentsSectionTitle: {
    fontSize: getTypographySize("md"),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: BRAND_COLORS.darkNavy,
    marginBottom: getSpacing("sm"),
  },
  container: {
    backgroundColor: BRAND_COLORS.white,
    flex: 1,
  },
  countryText: {
    fontSize: getTypographySize("md"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.darkGray,
    marginBottom: getSpacing("xs"),
    textAlign: "left",
  },
  dataSection: {
    alignItems: "flex-start",
    marginBottom: getSpacing("sm"),
  },
  divider: {
    backgroundColor: BRAND_COLORS.lightGray,
    height: 1,
    marginBottom: getSpacing("md"),
  },
  errorContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: getSpacing("xl"),
  },
  errorText: {
    fontSize: getTypographySize("md"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.error,
    marginBottom: getSpacing("lg"),
    marginTop: getSpacing("md"),
    textAlign: "center",
  },
  expandIndicator: {
    alignItems: "center",
    marginTop: getSpacing("sm"),
  },
  expandedDetails: {
    marginTop: getSpacing("md"),
  },
  header: {
    flexDirection: "column",
    alignItems: "flex-start",
    padding: getSpacing("lg"),
    paddingTop: getResponsiveValue(80, 100), // Move down 20px more
    paddingBottom: getSpacing("sm"), // Reduce bottom padding
    borderBottomWidth: 0, // Remove border
  },
  headerLeft: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: getSpacing("xl"),
  },
  loadingText: {
    fontSize: getTypographySize("md"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.darkGray,
    marginTop: getSpacing("md"),
  },
  noResultsContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    marginTop: getSpacing("xl"),
    padding: getSpacing("xl"),
  },
  noResultsSubtext: {
    fontSize: getTypographySize("sm"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.mediumGray,
    textAlign: "center",
  },
  noResultsText: {
    fontSize: getTypographySize("md"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.darkGray,
    marginBottom: getSpacing("sm"),
    marginTop: getSpacing("md"),
    textAlign: "center",
  },
  retryButton: {
    alignItems: "center",
    backgroundColor: BRAND_COLORS.darkNavy,
    borderRadius: getBorderRadius("md"),
    flexDirection: "row",
    paddingHorizontal: getSpacing("lg"),
    paddingVertical: getSpacing("sm"),
  },
  retryButtonText: {
    fontSize: getTypographySize("md"),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: BRAND_COLORS.white,
  },
  savingsAmount: {
    fontSize: getTypographySize("lg"),
    ...BRAND_TYPOGRAPHY.getFontStyle("bold"),
    color: BRAND_COLORS.success,
  },
  savingsContainer: {
    alignItems: "flex-end",
  },
  savingsPercent: {
    fontSize: getTypographySize("sm"),
    ...BRAND_TYPOGRAPHY.getFontStyle("medium"),
    color: BRAND_COLORS.success,
  },
  scrollContent: {
    padding: getSpacing("lg"),
    paddingTop: 0, // Start content right after header
    paddingBottom: getSpacing("xl"),
  },
  scrollView: {
    flex: 1,
  },
  significantSavings: {
    color: BRAND_COLORS.electricBlue,
  },
  strategyContainer: {
    alignItems: "center",
    borderTopColor: BRAND_COLORS.lightGray,
    borderTopWidth: 1,
    flexDirection: "row",
    marginTop: getSpacing("sm"),
    paddingTop: getSpacing("sm"),
  },
  strategyText: {
    fontSize: getTypographySize("sm"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.darkNavy,
    flex: 1,
    marginLeft: getSpacing("xs"),
  },
  subtitle: {
    fontSize: getTypographySize("md"),
    ...BRAND_TYPOGRAPHY.getFontStyle("semibold"),
    color: BRAND_COLORS.darkNavy,
    marginBottom: getSpacing("xs"),
    textAlign: "left",
  },
  summaryAmount: {
    fontSize: getTypographySize("xxl"),
    ...BRAND_TYPOGRAPHY.getFontStyle("bold"),
    color: BRAND_COLORS.white,
    marginVertical: getSpacing("xs"),
  },
  summaryCard: {
    alignItems: "center",
    backgroundColor: BRAND_COLORS.electricBlue,
    borderRadius: getBorderRadius("lg"),
    marginBottom: getSpacing("lg"),
    padding: getSpacing("lg"),
    ...BRAND_SHADOWS.medium,
  },
  summarySubtext: {
    fontSize: getTypographySize("sm"),
    ...BRAND_TYPOGRAPHY.getFontStyle("regular"),
    color: BRAND_COLORS.white,
    opacity: 0.8,
  },
  summaryTitle: {
    fontSize: getTypographySize("sm"),
    ...BRAND_TYPOGRAPHY.getFontStyle("medium"),
    color: BRAND_COLORS.white,
    opacity: 0.9,
  },
  title: {
    fontSize: getTypographySize("xxl"),
    ...BRAND_TYPOGRAPHY.getFontStyle("bold"),
    color: BRAND_COLORS.darkNavy,
    marginBottom: getSpacing("lg"),
    textAlign: "left", // More space after title
  },
  valueText: {
    fontSize: getTypographySize("sm"),
    ...BRAND_TYPOGRAPHY.getFontStyle("medium"),
    color: BRAND_COLORS.electricBlue,
    marginTop: 4,
    textAlign: "left",
  },
  vsContainer: {
    paddingHorizontal: getSpacing("md"),
  },
  vsText: {
    fontSize: getTypographySize("sm"),
    ...BRAND_TYPOGRAPHY.getFontStyle("medium"),
    color: BRAND_COLORS.darkGray,
  },
});
