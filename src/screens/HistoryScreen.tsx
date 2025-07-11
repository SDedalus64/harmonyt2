import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { MainTabParamList } from "../navigation/types";
import { useHistory, HistoryItem } from "../hooks/useHistory";
import { isTablet } from "../platform/deviceUtils";
import { BRAND_COLORS as COLORS } from "../config/brandColors";

type HistoryScreenNavigationProp = BottomTabNavigationProp<MainTabParamList>;

interface HistoryScreenProps {
  onItemPress?: (item: HistoryItem) => void;
  visible?: boolean;
}

export default function HistoryScreen({
  onItemPress,
  visible = true,
}: HistoryScreenProps) {
  const navigation = useNavigation<HistoryScreenNavigationProp>();
  const { history, loadHistory, clearHistory } = useHistory();
  const insets = useSafeAreaInsets();
  const logoMarginTop = isTablet() ? 32 : insets.top + 8;
  const [refreshing, setRefreshing] = React.useState(false);

  console.log("[HistoryScreen] Component rendered with history:", {
    length: history.length,
    onItemPress: !!onItemPress,
    visible,
  });

  // Reload history when visible prop changes to true
  useEffect(() => {
    if (visible) {
      console.log("[HistoryScreen] Drawer opened, refreshing history...");
      loadHistory();
    }
  }, [visible, loadHistory]);

  // Reload history every time the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log("[HistoryScreen] Screen focused, loading history...");
      loadHistory();
      return () => {
        console.log("[HistoryScreen] Screen unfocused");
      };
    }, [loadHistory]),
  );

  // Also reload on mount - especially important when used as a drawer
  useEffect(() => {
    console.log("[HistoryScreen] Component mounted, loading history...");
    loadHistory();
  }, [loadHistory]);

  // Log when history changes
  useEffect(() => {
    console.log("[HistoryScreen] History state updated:", {
      length: history.length,
      items: history.map((h) => ({
        htsCode: h.htsCode,
        timestamp: h.timestamp,
      })),
    });
  }, [history]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if the date is today
    if (date.toDateString() === now.toDateString()) {
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

  const handleRefresh = async () => {
    console.log("[HistoryScreen] Manual refresh triggered");
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleClearHistory = () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to clear all history?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => clearHistory(),
        },
      ],
      { cancelable: true },
    );
  };

  const handleItemPress = (item: HistoryItem) => {
    if (onItemPress) {
      // When used as a drawer, use the callback
      onItemPress(item);
    } else {
      // When used as a standalone screen, navigate based on item type
      if (item.isTariffEngineering) {
        // Navigate to TE screen with the HTS code and country
        (navigation as any).navigate("TariffEngineering", {
          historyItem: item,
        });
      } else {
        // Navigate to normal lookup screen
        navigation.navigate("Lookup", { historyItem: item });
      }
    }
  };

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <TouchableOpacity
      style={[
        styles.historyItem,
        item.isTariffEngineering && styles.historyItemTE,
      ]}
      onPress={() => handleItemPress(item)}
    >
      {item.isTariffEngineering && item.teData?.bestAlternative && (
        <View style={styles.teIndicator}>
          <Ionicons name="construct" size={16} color={COLORS.white} />
          <Text style={styles.teIndicatorText}>
            Save {item.teData.maxSavings.toFixed(1)}%
          </Text>
        </View>
      )}
      <Text style={styles.historyItemDescription}>{item.description}</Text>
      <View style={styles.historyItemDetails}>
        <View style={styles.historyItemDetail}>
          <Text style={styles.historyItemCountry}>{item.countryName}</Text>
          {item.isTariffEngineering ? (
            <Text style={styles.historyItemAlternatives}>
              {item.teData?.totalAlternatives} alternatives found
            </Text>
          ) : (
            item.totalAmount !== undefined && (
              <Text style={styles.historyItemValue}>
                {formatCurrency(item.totalAmount)}
              </Text>
            )
          )}
        </View>
        <Text style={styles.historyItemTimestamp}>
          {formatDate(item.timestamp)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Image
        source={require("../../assets/Harmony2x.png")}
        style={styles.emptyStateLogo}
        resizeMode="contain"
      />
      <Text style={styles.emptyStateTitle}>No History Yet</Text>
      <Text style={styles.emptyStateText}>
        Your lookup history will appear here. Start by looking up an HTS code.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: isTablet() ? 32 : insets.top + 16 }, // Add top padding for status bar
        ]}
        ListEmptyComponent={renderEmptyState}
        ListHeaderComponent={
          history.length > 0 ? (
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>History</Text>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearHistory}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  clearButton: {
    backgroundColor: COLORS.orange,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonContainer: {
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 8, // Add some top padding for the clear button
    paddingBottom: 16,
  },
  clearButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "500",
  },
  container: {
    backgroundColor: COLORS.white,
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 32,
    paddingTop: 64, // Extra top padding to account for status bar space
  },
  emptyStateLogo: {
    width: 270, // Reduced by 25% from 360
    height: 52.5, // Reduced by 25% from 70
    marginBottom: 24,
    opacity: 0.8,
  },
  emptyStateText: {
    color: COLORS.darkGray,
    fontSize: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  emptyStateTitle: {
    color: COLORS.darkBlue,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  header: {
    marginLeft: 8,
  },
  headerContainer: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderBottomColor: COLORS.mediumGray,
    borderBottomWidth: 1,
    elevation: 3,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 80,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4, // Ensure minimum height for proper button display
  },
  headerLogo: {
    width: 270, // Reduced by 25% from 360
    height: 52.5, // Reduced by 25% from 70
  },
  headerTitleContainer: {
    alignItems: "center",
    flexDirection: "row",
  },
  historyHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  historyItem: {
    backgroundColor: COLORS.lightGray,
    borderLeftColor: COLORS.lightBlue,
    borderLeftWidth: 4,
    borderRadius: 8,
    marginBottom: 12,
    padding: 16,
  },
  historyItemAlternatives: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: "600",
  },
  historyItemCountry: {
    color: COLORS.darkBlue,
    fontSize: 14,
    fontWeight: "500",
  },
  historyItemDescription: {
    color: COLORS.darkBlue,
    fontSize: 14,
    marginBottom: 8,
  },
  historyItemDetail: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  historyItemDetails: {
    marginTop: 4,
  },
  historyItemHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  historyItemHtsCode: {
    color: COLORS.darkBlue,
    fontSize: 18,
    fontWeight: "700",
  },
  historyItemTE: {
    backgroundColor: "#f0f9f0",
    borderLeftColor: COLORS.success,
  },
  historyItemTimestamp: {
    color: COLORS.darkGray,
    fontSize: 12,
    marginTop: 4,
    opacity: 0.8,
  },
  historyItemValue: {
    color: COLORS.darkBlue,
    fontSize: 14,
    fontWeight: "700",
  },
  historyTitle: {
    color: COLORS.darkBlue,
    fontSize: 24,
    fontWeight: "bold",
  },
  listContent: {
    flexGrow: 1,
    padding: 16,
  },
  teIndicator: {
    alignItems: "center",
    backgroundColor: COLORS.success,
    borderRadius: 12,
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: "absolute",
    right: 8,
    top: 8,
  },
  teIndicatorText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  title: {
    color: COLORS.darkBlue,
    fontSize: 20,
    fontWeight: "700",
  },
});
