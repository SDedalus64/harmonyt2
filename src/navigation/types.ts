import { HistoryItem } from "../hooks/useHistory";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { RouteProp } from "@react-navigation/native";

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  InAppWebView: { url: string; title?: string };
  Login: undefined;
  Registration: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  Login: { email?: string };
  Registration: undefined;
};

export type MainTabParamList = {
  Lookup: {
    htsCode?: string;
    declaredValue?: string;
    countryOfOrigin?: string;
    historyItem?: any;
  };
  History: undefined;
  Links: undefined;
  Settings: undefined;
  TariffEngineering: {
    historyItem?: HistoryItem;
    fromLookup?: boolean;
    htsCode?: string;
    description?: string;
    currentRate?: number;
    country?: { code: string; name: string };
    declaredValue?: number;
  };
};

export type LookupScreenProps = {
  navigation: BottomTabNavigationProp<MainTabParamList, "Lookup">;
  route: RouteProp<MainTabParamList, "Lookup">;
};

// Re-export types for convenience
export type { HistoryItem } from "../hooks/useHistory";
