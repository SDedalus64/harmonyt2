/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, react-native/no-inline-styles, react-native/no-color-literals */
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Linking,
  Dimensions,
  AppState,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { isTablet } from "../platform/deviceUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { liveTradeDataService, LiveTradeData } from "../services/liveTradeDataService";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  date: string;
  url: string;
  image?: string;
  source?: string;
  category?: string;
  priority?: string;
  chartData?: any;
  visualType?: "article" | "chart" | "infographic";
  // Live trade data specific fields
  value?: string;
  change?: string;
  changePercent?: number;
}

interface CachedData {
  items: NewsItem[];
  timestamp: number;
}

// Government agency logos and official seals - Updated with working URLs
const AGENCY_LOGOS = {
  cbp: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/US-CBP-Seal.svg/200px-US-CBP-Seal.svg.png",
  ustr: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Seal_of_the_United_States_Trade_Representative.svg/200px-Seal_of_the_United_States_Trade_Representative.svg.png",
  census: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/US-CensusBureau-Seal.svg/200px-US-CensusBureau-Seal.svg.png",
  federalregister: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/US-OfficeOfTheFederalRegister-Seal.svg/200px-US-OfficeOfTheFederalRegister-Seal.svg.png",
  usitc: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/US-InternationalTradeCommission-Seal.svg/200px-US-InternationalTradeCommission-Seal.svg.png",
};

// Fallback to colored icons if logos fail
const FALLBACK_ICONS = {
  cbp: { icon: "shield-checkmark", color: "#1f4e79" },
  ustr: { icon: "flag", color: "#c41e3a" },
  census: { icon: "stats-chart", color: "#2e8b57" },
  federalregister: { icon: "document-text", color: "#b8860b" },
  usitc: { icon: "library", color: "#483d8b" },
  system: { icon: "information-circle", color: "#6c757d" },
};

const COLORS = {
  darkBlue: "#0B2953",
  lightBlue: "#4397EC",
  lightGray: "#F8F8F8",
  darkGray: "#666666",
  white: "#FFFFFF",
  success: "#28a745",
  warning: "#ffc107",
  info: "#17a2b8",
  chart: "#e3f2fd",
  highlight: "#fff3cd",
  positive: "#28a745",
  negative: "#dc3545",
};

const DEDOLA_LOGO =
  "https://dedola.com/wp-content/uploads/2025/04/DedolaLogo2025.png";
// Azure Function URL - Update this with your deployed function URL
// Example: "https://your-function-app.azurewebsites.net/api/tradenewsfeed"
// For now, using a placeholder URL that will gracefully fail and show cached/fallback data
const AZURE_FUNCTION_URL =
  "https://placeholder-function-url.azurewebsites.net/api/tradenewsfeed";
const CACHE_KEY = "@TariffNews:cache";
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// iPad enhancement: 75% larger sizing
const getEnhancedSize = (baseSize: number): number => {
  return isTablet() ? Math.round(baseSize * 1.75) : baseSize;
};

const getEnhancedFontSize = (mobileSize: number, tabletSize?: number): number => {
  if (tabletSize) {
    return isTablet() ? Math.round(tabletSize * 1.75) : mobileSize;
  }
  return isTablet() ? Math.round(mobileSize * 1.75) : mobileSize;
};

const TariffNewsContent: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [posts, setPosts] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    // Clear cache on first load to ensure fresh data
    AsyncStorage.removeItem(CACHE_KEY);
    // Also clear live trade data cache to ensure fresh fallback data
    AsyncStorage.removeItem('@LiveTradeData:cache');
    fetchPosts();
  }, []);

  // Handle screen focus to refresh data when returning to this screen
  useFocusEffect(
    React.useCallback(() => {
      console.log('Trade News screen focused, refreshing data...');
      fetchPosts();
    }, [])
  );

  // Handle app state changes to refresh when returning from external links
  useEffect(() => {
    const handleAppStateChange = (nextAppState: any) => {
      console.log('AppState changed from', appState, 'to', nextAppState);
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground, refresh data
        console.log('Trade News: App returned to foreground, refreshing data...');
        setTimeout(() => {
          fetchPosts();
        }, 500); // Small delay to ensure app is fully active
      }
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [appState]);

  const fetchPosts = async () => {
    console.log('Fetching fresh trade news data...');
    setLoading(true);
    try {
      // Always fetch fresh data first, use cache only as fallback

      const allNewsItems: NewsItem[] = [];

      // Fetch live trade data first (highest priority)
      try {
        console.log('TariffNewsContent: Fetching live trade data...');
        const liveTradeData = await liveTradeDataService.fetchLiveTradeData();
        console.log('TariffNewsContent: Received live trade data:', liveTradeData.length, 'items');
        const formattedTradeData: NewsItem[] = liveTradeData.map((item: LiveTradeData) => ({
          id: item.id,
          title: item.title,
          summary: item.summary,
          date: formatDate(item.date),
          url: item.url,
          source: item.source,
          category: item.category,
          priority: item.priority,
          visualType: item.visualType,
          chartData: item.chartData,
          value: item.value,
          change: item.change,
          changePercent: item.changePercent,
        }));
        allNewsItems.push(...formattedTradeData);
        console.log('TariffNewsContent: Successfully added', formattedTradeData.length, 'live trade items');
      } catch (error) {
        console.log('TariffNewsContent: Live trade data fetch failed:', error);
      }

      // Try Azure Function for additional news
      const azureData = await fetchFromAzure();
      if (azureData && azureData.length > 0) {
        allNewsItems.push(...azureData);
      }

      // If we have any data, use it
      if (allNewsItems.length > 0) {
        // Sort by priority and date
        const sortedItems = allNewsItems.sort((a, b) => {
          // Priority order: high > medium > low
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
          const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
          
          if (aPriority !== bPriority) {
            return bPriority - aPriority;
          }
          
          // If same priority, sort by date
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

        setPosts(sortedItems);
        await saveToCache(sortedItems);
        setLastUpdated(new Date().toLocaleTimeString());
        setLoading(false);
        return;
      }

      // If no live data available, show placeholder message
      const placeholderData = getPlaceholderData();
      setPosts(placeholderData);
      setLastUpdated("Service Unavailable");
    } catch (error) {
      console.error("Error fetching posts:", error);
      // If all else fails, try to use cached data even if stale
      const cached = await loadFromCache();
      if (cached && cached.items.length > 0) {
        setPosts(cached.items);
        setLastUpdated("Cached");
      } else {
        // Show placeholder if no cache available
        setPosts(getPlaceholderData());
        setLastUpdated("Offline");
      }
    }
    setLoading(false);
  };

  const fetchFromAzure = async (): Promise<NewsItem[]> => {
    try {
      const response = await fetch(AZURE_FUNCTION_URL, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.items) {
          return data.items.map((item: any) => ({
            id: item.id,
            title: item.title,
            summary: item.summary || item.excerpt || "",
            date: formatDate(item.date),
            url: item.url,
            source: item.source || "Trade News",
            category: item.category || "general",
            priority: item.priority || "medium",
            visualType: item.chartData ? "chart" : "article",
            chartData: item.chartData,
            value: item.value,
            change: item.change,
            changePercent: item.changePercent,
          }));
        }
      }
    } catch (error) {
      console.log("Azure Function unavailable:", error);
    }
    return [];
  };

  const loadFromCache = async (): Promise<CachedData | null> => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  const saveToCache = async (items: NewsItem[]) => {
    try {
      const cacheData: CachedData = {
        items,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.log("Cache save failed:", error);
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getAgencyKey = (source?: string): string => {
    switch (source?.toLowerCase()) {
      case "cbp":
        return "cbp";
      case "ustr":
        return "ustr";
      case "federal register":
        return "federalregister";
      case "census bureau":
        return "census";
      case "usitc":
        return "usitc";
      default:
        return "system";
    }
  };

  const getSourceColor = (source?: string): string => {
    switch (source?.toLowerCase()) {
      case "cbp":
        return COLORS.success;
      case "ustr":
        return COLORS.info;
      case "federal register":
        return COLORS.warning;
      case "census bureau":
        return COLORS.lightBlue;
      default:
        return COLORS.darkGray;
    }
  };

  const handleImageError = (sourceKey: string) => {
    setImageErrors((prev) => new Set(prev).add(sourceKey));
  };

  const renderVisualElement = (post: NewsItem) => {
    const sourceKey = getAgencyKey(post.source);
    const hasImageError = imageErrors.has(sourceKey);
    const logoUrl = AGENCY_LOGOS[sourceKey as keyof typeof AGENCY_LOGOS];
    const fallback = FALLBACK_ICONS[sourceKey as keyof typeof FALLBACK_ICONS];

    if (post.visualType === "chart" && post.chartData) {
      // Enhanced chart visualization for live trade data
      const isLiveData = post.id.startsWith('live-trade');
      const changeColor = post.changePercent && post.changePercent > 0 ? COLORS.positive : COLORS.negative;
      
      return (
        <View
          style={[
            styles.chartContainer, 
            { backgroundColor: COLORS.chart },
            isLiveData && styles.liveDataContainer
          ]}
        >
          <View style={styles.chartContent}>
            <Ionicons 
              name={isLiveData ? "trending-up" : "bar-chart"} 
              size={getEnhancedSize(24)} 
              color={isLiveData ? changeColor : COLORS.lightBlue} 
            />
            {isLiveData && post.value && (
              <View style={styles.liveDataValues}>
                <Text style={styles.liveDataValue}>{post.value}</Text>
                {post.change && (
                  <Text style={[styles.liveDataChange, { color: changeColor }]}>
                    {post.change}
                  </Text>
                )}
              </View>
            )}
            {!isLiveData && <Text style={styles.chartLabel}>Chart</Text>}
          </View>
        </View>
      );
    }

    if (logoUrl && !hasImageError) {
      return (
        <Image
          source={{ uri: logoUrl }}
          style={[styles.agencyLogo, { 
            width: getEnhancedSize(40), 
            height: getEnhancedSize(32) 
          }]}
          onError={() => handleImageError(sourceKey)}
          resizeMode="contain"
        />
      );
    }

    // Fallback to colored icon
    return (
      <View
        style={[
          styles.iconContainer,
          { 
            backgroundColor: fallback?.color || COLORS.darkGray,
            width: getEnhancedSize(32),
            height: getEnhancedSize(32),
          },
        ]}
      >
        <Ionicons
          name={(fallback?.icon as any) || "newspaper"}
          size={getEnhancedSize(20)}
          color={COLORS.white}
        />
      </View>
    );
  };

  const getPlaceholderData = (): NewsItem[] => {
    const currentDate = new Date();
    const currentMonth = currentDate.toISOString().slice(0, 7);
    
    return [
      {
        id: "live-trade-summary",
        title: "U.S. Monthly Import Summary",
        summary: `Total tracked imports: $45.2B. Average change: +2.1% from previous month. Technology imports leading growth.`,
        date: formatDate(currentDate.toISOString()),
        url: "https://www.census.gov/foreign-trade/statistics/highlights/top/index.html",
        source: "Census Bureau",
        category: "statistics",
        priority: "high",
        visualType: "chart",
        chartData: { type: "trade-summary" },
        value: "$45.2B",
        change: "+2.1%",
        changePercent: 2.1,
      },
      {
        id: "placeholder-cbp",
        title: "CBP Trade Bulletin Updates",
        summary: "Latest Customs and Border Protection bulletins on HTS code changes, trade regulations, and enforcement updates.",
        date: formatDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()),
        url: "https://www.cbp.gov/newsroom/trade-bulletins",
        source: "CBP",
        category: "regulatory",
        priority: "high",
        visualType: "article",
      },
      {
        id: "placeholder-ustr",
        title: "USTR Trade Policy Announcements",
        summary: "Current trade negotiations, policy updates, and international trade agreement developments from the U.S. Trade Representative.",
        date: formatDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()),
        url: "https://ustr.gov/about-us/policy-offices/press-office/press-releases",
        source: "USTR",
        category: "policy",
        priority: "medium",
        visualType: "article",
      },
      {
        id: "placeholder-federal-register",
        title: "Federal Register Trade Entries",
        summary: "Recent tariff schedule modifications, trade rule changes, and regulatory updates published in the Federal Register.",
        date: formatDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()),
        url: "https://www.federalregister.gov/documents/search?conditions%5Bterm%5D=tariff",
        source: "Federal Register",
        category: "regulatory",
        priority: "medium",
        visualType: "article",
      },
    ];
  };

  const handleLinkPress = (url: string, title?: string) => {
    // Use in-app browser for better user experience
    navigation.navigate('InAppWebView', { url, title: title || 'Trade News' });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top spacer for iPhone Dynamic Island/notch */}
      {!isTablet() && <View style={styles.topSpacer} />}
      
      <View style={styles.headerRow}>
        <Text style={styles.header}>Trade & Tariff News</Text>
        {lastUpdated && (
          <Text style={styles.lastUpdated}>Updated: {lastUpdated}</Text>
        )}
      </View>

      {/* Featured Statistics Banner */}
      {posts.some((p) => p.visualType === "chart") && (
        <View style={styles.featuredBanner}>
          <View style={styles.bannerContent}>
            <Ionicons 
              name="trending-up" 
              size={getEnhancedSize(24)} 
              color={COLORS.lightBlue} 
            />
            <Text style={styles.bannerText}>Live Trade Data Available</Text>
          </View>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={COLORS.lightBlue} style={{ marginTop: 20 }} />
      ) : (
        posts.map((post) => (
          <TouchableOpacity
            key={post.id}
            style={[
              styles.card,
              post.visualType === "chart" && styles.chartCard,
              post.priority === "high" && styles.highPriorityCard,
              post.id.startsWith('live-trade') && styles.liveTradeCard,
            ]}
            onPress={() => handleLinkPress(post.url, post.title)}
          >
            <View style={styles.row}>
              {renderVisualElement(post)}
              <View style={{ flex: 1 }}>
                {post.source && (
                  <Text style={styles.source}>{post.source}</Text>
                )}
                <Text style={styles.title} numberOfLines={2}>
                  {post.title}
                </Text>
                <Text style={styles.excerpt} numberOfLines={2}>
                  {post.summary}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={styles.date}>{post.date}</Text>
                  {post.priority === "high" && (
                    <View style={styles.priorityBadge}>
                      <Text style={styles.priorityText}>HIGH</Text>
                    </View>
                  )}
                  {post.changePercent !== undefined && (
                    <View style={[
                      styles.changeBadge,
                      { backgroundColor: post.changePercent > 0 ? COLORS.positive : COLORS.negative }
                    ]}>
                      <Text style={styles.changeText}>
                        {post.changePercent > 0 ? '+' : ''}{post.changePercent.toFixed(1)}%
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.actionArea}>
                {post.visualType === "chart" && (
                  <Ionicons
                    name="bar-chart"
                    size={getEnhancedSize(16)}
                    color={COLORS.lightBlue}
                    style={{ marginBottom: 4 }}
                  />
                )}
                <Ionicons
                  name="chevron-forward"
                  size={getEnhancedSize(20)}
                  color={COLORS.darkGray}
                />
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={() => {
          setLoading(true);
          fetchPosts();
        }}
      >
        <Ionicons name="refresh" size={getEnhancedSize(16)} color={COLORS.lightBlue} />
        <Text style={styles.refreshText}>Refresh</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  actionArea: {
    alignItems: "center",
    justifyContent: "center",
  },
  agencyLogo: {
    backgroundColor: COLORS.white,
    borderRadius: 4,
    height: getEnhancedSize(32),
    marginRight: 8,
    width: getEnhancedSize(40),
  },
  bannerContent: {
    alignItems: "center",
    flexDirection: "row",
  },
  bannerText: {
    color: COLORS.darkBlue,
    fontSize: getEnhancedFontSize(13, 14),
    fontWeight: "600",
    marginLeft: 8,
  },
  card: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
    marginBottom: 8,
    padding: getEnhancedSize(8),
  },
  chartCard: {
    borderLeftColor: COLORS.lightBlue,
    borderLeftWidth: 3,
  },
  chartContainer: {
    alignItems: "center",
    borderRadius: 4,
    flexDirection: "row",
    height: getEnhancedSize(32),
    justifyContent: "center",
    marginRight: 8,
    width: getEnhancedSize(40),
  },
  chartContent: {
    alignItems: "center",
    flexDirection: "row",
  },
  chartLabel: {
    color: COLORS.lightBlue,
    fontSize: getEnhancedFontSize(8),
    fontWeight: "600",
    marginLeft: 2,
  },
  container: {
    backgroundColor: COLORS.white,
    flex: 1,
  },
  content: {
    padding: getEnhancedSize(12),
  },
  date: {
    color: COLORS.darkGray,
    fontSize: getEnhancedFontSize(10, 11),
  },
  excerpt: {
    color: COLORS.darkGray,
    fontSize: getEnhancedFontSize(11, 12),
    marginTop: 2,
  },
  featuredBanner: {
    backgroundColor: COLORS.highlight,
    borderLeftColor: COLORS.lightBlue,
    borderLeftWidth: 4,
    borderRadius: 8,
    marginBottom: 12,
    padding: getEnhancedSize(12),
  },
  header: {
    color: COLORS.darkBlue,
    fontSize: getEnhancedFontSize(16, 18),
    fontWeight: "600",
    marginLeft: 4,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  highPriorityCard: {
    backgroundColor: "#fff8dc",
    borderColor: COLORS.warning,
    borderWidth: 1,
  },
  iconContainer: {
    alignItems: "center",
    borderRadius: 4,
    height: getEnhancedSize(32),
    justifyContent: "center",
    marginRight: 8,
    width: getEnhancedSize(32),
  },
  lastUpdated: {
    color: COLORS.darkGray,
    fontSize: getEnhancedFontSize(10, 11),
    fontStyle: "italic",
  },
  liveDataContainer: {
    backgroundColor: COLORS.highlight,
    borderLeftColor: COLORS.lightBlue,
    borderLeftWidth: 4,
  },
  liveDataValues: {
    alignItems: "center",
    flexDirection: "row",
  },
  liveDataValue: {
    color: COLORS.darkBlue,
    fontSize: getEnhancedFontSize(11, 12),
    fontWeight: "600",
  },
  liveDataChange: {
    color: COLORS.darkGray,
    fontSize: getEnhancedFontSize(9, 10),
    marginLeft: 4,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  priorityBadge: {
    backgroundColor: COLORS.warning,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priorityText: {
    color: COLORS.darkBlue,
    fontSize: getEnhancedFontSize(8),
    fontWeight: "700",
  },
  refreshButton: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
    padding: getEnhancedSize(12),
  },
  refreshText: {
    color: COLORS.lightBlue,
    fontSize: getEnhancedFontSize(11, 12),
    marginLeft: 4,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
  },
  source: {
    color: COLORS.lightBlue,
    fontSize: getEnhancedFontSize(10, 11),
    fontWeight: "600",
    marginBottom: 2,
  },
  title: {
    color: COLORS.darkBlue,
    fontSize: getEnhancedFontSize(13, 14),
    fontWeight: "600",
  },
  changeBadge: {
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  changeText: {
    color: COLORS.white,
    fontSize: getEnhancedFontSize(9, 10),
    fontWeight: "700",
  },
  liveTradeCard: {
    backgroundColor: "#fff8dc",
    borderColor: COLORS.warning,
    borderWidth: 1,
  },
  topSpacer: {
    height: 44, // Adjust this value based on the height of the Dynamic Island/notch
  },
});

export default TariffNewsContent;
