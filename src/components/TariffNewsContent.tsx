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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { isTablet } from "../platform/deviceUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
}

interface CachedData {
  items: NewsItem[];
  timestamp: number;
}

// Government agency logos and official seals
const AGENCY_LOGOS = {
  cbp: "https://www.cbp.gov/sites/default/files/assets/images/headers/cbp-seal.png",
  ustr: "https://ustr.gov/sites/default/files/USTR%20Seal.png",
  census:
    "https://www.census.gov/content/dam/Census/about/images/census-logo.png",
  federalregister: "https://www.federalregister.gov/images/fr-logo.png",
  usitc: "https://www.usitc.gov/images/usitc_logo.png",
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
};

const DEDOLA_LOGO =
  "https://dedola.com/wp-content/uploads/2025/04/DedolaLogo2025.png";
const AZURE_FUNCTION_URL =
  "https://your-function-app.azurewebsites.net/api/tradeNewsfeed"; // Replace with your actual URL
const CACHE_KEY = "@TariffNews:cache";
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

const TariffNewsContent: React.FC = () => {
  const [posts, setPosts] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      // First, try to load from cache
      const cached = await loadFromCache();
      if (cached && cached.items.length > 0) {
        setPosts(cached.items);
        setLastUpdated(new Date(cached.timestamp).toLocaleTimeString());
        setLoading(false);

        // If cache is fresh, we're done
        if (Date.now() - cached.timestamp < CACHE_DURATION) {
          return;
        }
      }

      // Try Azure Function first
      const azureData = await fetchFromAzure();
      if (azureData && azureData.length > 0) {
        setPosts(azureData);
        await saveToCache(azureData);
        setLastUpdated(new Date().toLocaleTimeString());
        setLoading(false);
        return;
      }

      // If Azure Function is unavailable, show placeholder message
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
          }));
        }
      }
    } catch (error) {
      console.log("Azure Function unavailable");
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
      return (
        <View
          style={[styles.chartContainer, { backgroundColor: COLORS.chart }]}
        >
          <Ionicons name="bar-chart" size={24} color={COLORS.lightBlue} />
          <Text style={styles.chartLabel}>Chart</Text>
        </View>
      );
    }

    if (logoUrl && !hasImageError) {
      return (
        <Image
          source={{ uri: logoUrl }}
          style={styles.agencyLogo}
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
          { backgroundColor: fallback?.color || COLORS.darkGray },
        ]}
      >
        <Ionicons
          name={(fallback?.icon as any) || "newspaper"}
          size={20}
          color={COLORS.white}
        />
      </View>
    );
  };

  const getPlaceholderData = (): NewsItem[] => {
    return [
      {
        id: "placeholder-stats",
        title: "Monthly Trade Statistics Dashboard",
        summary:
          "Interactive charts showing U.S. trade balance, top trading partners, and import/export trends.",
        date: formatDate(new Date().toISOString()),
        url: "https://www.census.gov/foreign-trade/statistics/",
        source: "Census Bureau",
        category: "statistics",
        priority: "high",
        visualType: "chart",
        chartData: { type: "trade-balance" },
      },
      {
        id: "placeholder-1",
        title: "Trade News Service Initializing",
        summary:
          "Real-time trade updates from CBP, USTR, Federal Register, and Census Bureau will appear here once the service is active.",
        date: formatDate(new Date().toISOString()),
        url: "https://www.cbp.gov/newsroom/trade-bulletins",
        source: "System",
        category: "info",
        priority: "low",
        visualType: "article",
      },
      {
        id: "placeholder-2",
        title: "HTS Revision Updates",
        summary:
          "Harmonized Tariff Schedule revisions and updates will be automatically tracked and displayed.",
        date: formatDate(new Date().toISOString()),
        url: "https://hts.usitc.gov/",
        source: "CBP",
        category: "regulatory",
        priority: "medium",
        visualType: "article",
      },
      {
        id: "placeholder-3",
        title: "Trade Policy Announcements",
        summary:
          "USTR trade negotiations, tariff changes, and policy updates will be monitored in real-time.",
        date: formatDate(new Date().toISOString()),
        url: "https://ustr.gov/",
        source: "USTR",
        category: "policy",
        priority: "medium",
        visualType: "article",
      },
    ];
  };

  const openExternal = (url: string) => Linking.openURL(url);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
            <Ionicons name="trending-up" size={24} color={COLORS.lightBlue} />
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
            ]}
            onPress={() => openExternal(post.url)}
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
                </View>
              </View>
              <View style={styles.actionArea}>
                {post.visualType === "chart" && (
                  <Ionicons
                    name="bar-chart"
                    size={16}
                    color={COLORS.lightBlue}
                    style={{ marginBottom: 4 }}
                  />
                )}
                <Ionicons
                  name="chevron-forward"
                  size={20}
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
        <Ionicons name="refresh" size={16} color={COLORS.lightBlue} />
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
    height: 32,
    marginRight: 8,
    width: 40,
  },
  bannerContent: {
    alignItems: "center",
    flexDirection: "row",
  },
  bannerText: {
    color: COLORS.darkBlue,
    fontSize: isTablet() ? 14 : 13,
    fontWeight: "600",
    marginLeft: 8,
  },
  card: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
    marginBottom: 8,
    padding: 8,
  },
  chartCard: {
    borderLeftColor: COLORS.lightBlue,
    borderLeftWidth: 3,
  },
  chartContainer: {
    alignItems: "center",
    borderRadius: 4,
    flexDirection: "row",
    height: 32,
    justifyContent: "center",
    marginRight: 8,
    width: 40,
  },
  chartLabel: {
    color: COLORS.lightBlue,
    fontSize: 8,
    fontWeight: "600",
    marginLeft: 2,
  },
  container: {
    backgroundColor: COLORS.white,
    flex: 1,
  },
  content: {
    padding: 12,
  },
  date: {
    color: COLORS.darkGray,
    fontSize: isTablet() ? 11 : 10,
  },
  excerpt: {
    color: COLORS.darkGray,
    fontSize: isTablet() ? 12 : 11,
    marginTop: 2,
  },
  featuredBanner: {
    backgroundColor: COLORS.highlight,
    borderLeftColor: COLORS.lightBlue,
    borderLeftWidth: 4,
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
  },
  header: {
    color: COLORS.darkBlue,
    fontSize: isTablet() ? 18 : 16,
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
    height: 32,
    justifyContent: "center",
    marginRight: 8,
    width: 32,
  },
  lastUpdated: {
    color: COLORS.darkGray,
    fontSize: isTablet() ? 11 : 10,
    fontStyle: "italic",
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
    fontSize: 8,
    fontWeight: "700",
  },
  refreshButton: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
    padding: 12,
  },
  refreshText: {
    color: COLORS.lightBlue,
    fontSize: isTablet() ? 12 : 11,
    marginLeft: 4,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
  },
  source: {
    color: COLORS.lightBlue,
    fontSize: isTablet() ? 11 : 10,
    fontWeight: "600",
    marginBottom: 2,
  },
  title: {
    color: COLORS.darkBlue,
    fontSize: isTablet() ? 14 : 13,
    fontWeight: "600",
  },
});

export default TariffNewsContent;
