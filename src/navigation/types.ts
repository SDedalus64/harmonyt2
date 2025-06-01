import { HistoryItem, DutyComponent } from './hooks/useHistory';
import { User } from './contexts/AuthContext';

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
export type { HistoryItem, DutyComponent } from './hooks/useHistory';
export type { User } from './contexts/AuthContext';
