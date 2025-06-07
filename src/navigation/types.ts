import { HistoryItem } from '../hooks/useHistory';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  InAppWebView: { url: string; title?: string };
  Login: undefined;
  Registration: undefined;
};

export type AuthStackParamList = {
  Login: { email?: string };
  Registration: undefined;
};

export type MainTabParamList = {
  Lookup: { historyItem?: HistoryItem };
  History: undefined;
  Settings: undefined;
  Test: undefined;
  Links: undefined;

};

// Re-export types for convenience
export type { HistoryItem } from '../hooks/useHistory';
