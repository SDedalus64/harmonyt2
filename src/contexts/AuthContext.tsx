import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth as useAuthHook, UserProfile } from '../hooks/useAuth';

// Storage keys
const AUTH_TOKEN_KEY = '@tcalc_auth_token';

// Define auth context values interface
export interface AuthContextValue {
  isLoggedIn: boolean;
  userToken: string | null;
  userProfile: UserProfile | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string, companyName: string, receiveUpdates: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<boolean>;
  sendHistoryToEmail: (email: string, receiveUpdates: boolean) => Promise<boolean>;
}

// Create the context
export const AuthContext = createContext<AuthContextValue | null>(null);

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userToken, setUserToken] = useState<string | null>(null);
  const auth = useAuthHook();

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        setUserToken(token);
      } catch (error) {
        console.error('Error loading auth token:', error);
      }
    };
    loadToken();
  }, []);

  const value: AuthContextValue = {
    ...auth,
    userToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
