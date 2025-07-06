import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getTariffEngineeringSuggestions,
  getNeighboringCodes,
  getMaterialAlternatives,
  fetchTariffEngineeringSuggestions,
  TariffEngineeringSuggestion,
} from '../services/tariffEngineeringService';
import { tariffSearchService } from '../services/tariffSearchService';
import {
  BRAND_COLORS,
  BRAND_TYPOGRAPHY,
  BRAND_SHADOWS,
  getTypographySize,
  getSpacing,
  getBorderRadius,
  getResponsiveValue,
  isTablet,
} from '../config/brandColors';
import { haptics } from '../utils/haptics';

export default function TariffEngineeringScreen() {
  const insets = useSafeAreaInsets();
  const [htsCode, setHtsCode] = useState('');
  const [allSuggestions, setAllSuggestions] = useState<TariffEngineeringSuggestion[]>([]);
  const [neighboringSuggestions, setNeighboringSuggestions] = useState<TariffEngineeringSuggestion[]>([]);
  const [materialSuggestions, setMaterialSuggestions] = useState<TariffEngineeringSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [htsSuggestions, setHtsSuggestions] = useState<Array<{ code: string; description: string }>>([]);
  const [searchMessage, setSearchMessage] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Search for HTS suggestions as user types
  useEffect(() => {
    const searchForSuggestions = async () => {
      if (htsCode.length >= 3) {
        setShowSuggestions(true);
        setSearchMessage('Searching...');

        try {
          const results = await tariffSearchService.searchByPrefix(htsCode, 15);
          
          setHtsSuggestions(results);
          if (results.length === 0) {
            setSearchMessage('No matching HTS codes found');
          } else {
            setSearchMessage(''); // Clear the message when we have results
          }
        } catch (error) {
          console.error('[TariffEngineering] Search error:', error);
          setHtsSuggestions([]);
          setSearchMessage('Error searching HTS codes');
        }
      } else {
        setShowSuggestions(false);
        setHtsSuggestions([]);
        setSearchMessage('');
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
      setError('Enter at least 6 digits');
      return;
    }
    
    setError('');
    setLoading(true);
    setHasSearched(true);
    
    try {
      const suggestions = await fetchTariffEngineeringSuggestions(code);
      setAllSuggestions(suggestions);
      
      // Also get categorized suggestions
      setNeighboringSuggestions(getNeighboringCodes(code));
      setMaterialSuggestions(getMaterialAlternatives(code));
    } catch (err: any) {
      setError(err.message || 'Failed to find alternatives');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    haptics.buttonPress();
    searchForAlternatives(htsCode);
  };

  const renderSuggestionItem = ({ item }: { item: { code: string; description: string } }) => (
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

  const renderEngineeringItem = ({ item }: { item: TariffEngineeringSuggestion }) => (
    <TouchableOpacity style={styles.resultItem} onPress={() => haptics.selection()}>
      <View style={styles.resultHeader}>
        <View style={styles.resultCodeContainer}>
          <Text style={styles.resultCode}>{item.code}</Text>
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>Save {item.savings.toFixed(1)}%</Text>
          </View>
        </View>
        <View style={styles.dutyRates}>
          <Text style={styles.currentRate}>{item.currentDutyRate}%</Text>
          <Ionicons name="arrow-forward" size={16} color={BRAND_COLORS.darkGray} />
          <Text style={styles.suggestedRate}>{item.suggestedDutyRate}%</Text>
        </View>
      </View>
      <Text style={styles.resultDescription} numberOfLines={2}>
        {item.description}
      </Text>
      {item.reason && (
        <Text style={styles.resultReason}>{item.reason}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + getSpacing('lg') }
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="construct" size={32} color={BRAND_COLORS.electricBlue} />
          <Text style={styles.title}>Tariff Engineering</Text>
          <Text style={styles.subtitle}>
            Find alternative HTS classifications with lower duty rates
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
            style={[styles.searchButton, (!htsCode || htsCode.length < 6) && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={!htsCode || htsCode.length < 6 || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={BRAND_COLORS.white} />
            ) : (
              <>
                <Ionicons name="search" size={20} color={BRAND_COLORS.white} />
                <Text style={styles.searchButtonText}>Find Lower Duty Rates</Text>
              </>
            )}
          </TouchableOpacity>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        {/* Results Section */}
        {hasSearched && !loading && (
          <View style={styles.resultsSection}>
            {/* All Opportunities */}
            {allSuggestions.length > 0 && (
              <View style={styles.resultCategory}>
                <View style={styles.categoryHeader}>
                  <View style={[styles.categoryIcon, { backgroundColor: BRAND_COLORS.success }]}>
                    <Ionicons name="trending-down" size={20} color={BRAND_COLORS.white} />
                  </View>
                  <Text style={styles.categoryTitle}>Top Savings Opportunities</Text>
                </View>
                
                <FlatList
                  data={allSuggestions.slice(0, 5)}
                  keyExtractor={(item) => item.code}
                  renderItem={renderEngineeringItem}
                  scrollEnabled={false}
                />
              </View>
            )}

            {/* Neighboring Codes */}
            {neighboringSuggestions.length > 0 && (
              <View style={styles.resultCategory}>
                <View style={styles.categoryHeader}>
                  <View style={[styles.categoryIcon, { backgroundColor: BRAND_COLORS.electricBlue }]}>
                    <Ionicons name="git-branch" size={20} color={BRAND_COLORS.white} />
                  </View>
                  <Text style={styles.categoryTitle}>Neighboring Classifications</Text>
                </View>
                
                <FlatList
                  data={neighboringSuggestions}
                  keyExtractor={(item) => item.code}
                  renderItem={renderEngineeringItem}
                  scrollEnabled={false}
                />
              </View>
            )}

            {/* Material Alternatives */}
            {materialSuggestions.length > 0 && (
              <View style={styles.resultCategory}>
                <View style={styles.categoryHeader}>
                  <View style={[styles.categoryIcon, { backgroundColor: BRAND_COLORS.orange }]}>
                    <Ionicons name="cube" size={20} color={BRAND_COLORS.white} />
                  </View>
                  <Text style={styles.categoryTitle}>Material Alternatives</Text>
                </View>
                
                <FlatList
                  data={materialSuggestions}
                  keyExtractor={(item) => item.code}
                  renderItem={renderEngineeringItem}
                  scrollEnabled={false}
                />
              </View>
            )}

            {allSuggestions.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="information-circle-outline" size={48} color={BRAND_COLORS.mediumGray} />
                <Text style={styles.emptyText}>
                  No lower-duty alternatives found for this HTS code
                </Text>
              </View>
            )}
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
    paddingHorizontal: getSpacing('lg'),
    paddingBottom: getSpacing('xxxl'),
  },
  header: {
    alignItems: 'center',
    marginBottom: getSpacing('xl'),
  },
  title: {
    fontSize: getTypographySize('xl'),
    ...BRAND_TYPOGRAPHY.getFontStyle('bold'),
    color: BRAND_COLORS.darkNavy,
    marginTop: getSpacing('sm'),
  },
  subtitle: {
    fontSize: getTypographySize('sm'),
    ...BRAND_TYPOGRAPHY.getFontStyle('regular'),
    color: BRAND_COLORS.darkGray,
    textAlign: 'center',
    marginTop: getSpacing('xs'),
    paddingHorizontal: getSpacing('lg'),
  },
  inputSection: {
    backgroundColor: BRAND_COLORS.lightGray,
    borderRadius: getBorderRadius('lg'),
    padding: getSpacing('lg'),
    marginBottom: getSpacing('lg'),
    ...BRAND_SHADOWS.small,
  },
  inputLabel: {
    fontSize: getTypographySize('sm'),
    ...BRAND_TYPOGRAPHY.getFontStyle('medium'),
    color: BRAND_COLORS.darkNavy,
    marginBottom: getSpacing('sm'),
  },
  input: {
    backgroundColor: BRAND_COLORS.white,
    borderRadius: getBorderRadius('md'),
    paddingHorizontal: getSpacing('md'),
    paddingVertical: getSpacing('sm'),
    fontSize: getTypographySize('md'),
    ...BRAND_TYPOGRAPHY.getFontStyle('regular'),
    color: BRAND_COLORS.darkNavy,
    borderWidth: 1,
    borderColor: BRAND_COLORS.mediumGray,
    height: getResponsiveValue(44, 56),
  },
  suggestionsContainer: {
    backgroundColor: BRAND_COLORS.white,
    borderRadius: getBorderRadius('md'),
    marginTop: getSpacing('sm'),
    marginBottom: getSpacing('md'),
    maxHeight: 200,
    ...BRAND_SHADOWS.small,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    paddingVertical: getSpacing('sm'),
    paddingHorizontal: getSpacing('md'),
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.lightGray,
  },
  suggestionCode: {
    fontSize: getTypographySize('sm'),
    ...BRAND_TYPOGRAPHY.getFontStyle('semibold'),
    color: BRAND_COLORS.electricBlue,
  },
  suggestionDescription: {
    fontSize: getTypographySize('xs'),
    color: BRAND_COLORS.darkGray,
    marginTop: 2,
  },
  searchMessage: {
    padding: getSpacing('md'),
    fontSize: getTypographySize('sm'),
    color: BRAND_COLORS.darkGray,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  searchButton: {
    backgroundColor: BRAND_COLORS.electricBlue,
    borderRadius: getBorderRadius('md'),
    paddingVertical: getSpacing('md'),
    paddingHorizontal: getSpacing('lg'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: getSpacing('md'),
    ...BRAND_SHADOWS.small,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: BRAND_COLORS.white,
    fontSize: getTypographySize('md'),
    ...BRAND_TYPOGRAPHY.getFontStyle('semibold'),
    marginLeft: getSpacing('sm'),
  },
  error: {
    color: BRAND_COLORS.error,
    fontSize: getTypographySize('sm'),
    marginTop: getSpacing('sm'),
    textAlign: 'center',
  },
  resultsSection: {
    marginTop: getSpacing('lg'),
  },
  resultCategory: {
    marginBottom: getSpacing('xl'),
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getSpacing('md'),
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getSpacing('sm'),
  },
  categoryTitle: {
    fontSize: getTypographySize('lg'),
    ...BRAND_TYPOGRAPHY.getFontStyle('semibold'),
    color: BRAND_COLORS.darkNavy,
  },
  resultItem: {
    backgroundColor: BRAND_COLORS.white,
    borderRadius: getBorderRadius('md'),
    padding: getSpacing('md'),
    marginBottom: getSpacing('sm'),
    borderWidth: 1,
    borderColor: BRAND_COLORS.lightGray,
    ...BRAND_SHADOWS.small,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing('xs'),
  },
  resultCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultCode: {
    fontSize: getTypographySize('md'),
    ...BRAND_TYPOGRAPHY.getFontStyle('semibold'),
    color: BRAND_COLORS.darkNavy,
    marginRight: getSpacing('sm'),
  },
  savingsBadge: {
    backgroundColor: BRAND_COLORS.success,
    paddingHorizontal: getSpacing('sm'),
    paddingVertical: getSpacing('xs'),
    borderRadius: getBorderRadius('sm'),
  },
  savingsText: {
    color: BRAND_COLORS.white,
    fontSize: getTypographySize('xs'),
    ...BRAND_TYPOGRAPHY.getFontStyle('semibold'),
  },
  dutyRates: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentRate: {
    fontSize: getTypographySize('sm'),
    color: BRAND_COLORS.darkGray,
    textDecorationLine: 'line-through',
  },
  suggestedRate: {
    fontSize: getTypographySize('md'),
    ...BRAND_TYPOGRAPHY.getFontStyle('semibold'),
    color: BRAND_COLORS.success,
    marginLeft: getSpacing('xs'),
  },
  resultDescription: {
    fontSize: getTypographySize('sm'),
    color: BRAND_COLORS.darkGray,
    marginBottom: getSpacing('xs'),
  },
  resultReason: {
    fontSize: getTypographySize('xs'),
    color: BRAND_COLORS.electricBlue,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: getSpacing('xxxl'),
  },
  emptyText: {
    fontSize: getTypographySize('sm'),
    color: BRAND_COLORS.darkGray,
    textAlign: 'center',
    marginTop: getSpacing('md'),
    paddingHorizontal: getSpacing('xl'),
  },
});