import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import * as authService from '../../services/authService';

export interface User {
  id: string;
  email: string;
  name: string;
  companyName: string;
  receiveUpdates: boolean;
}

export interface AuthContextValue {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string, companyName: string, receiveUpdates: boolean) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Storage keys
const AUTH_TOKEN_KEY = '@tcalc_auth_token';
const USER_PROFILE_KEY = '@tcalc_user_profile';
const AUTH_STATE_KEY = '@tcalc_auth_state';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);

  // Restore auth state from storage
  const restoreAuthState = async () => {
    try {
      const [authState, profileJson, token] = await Promise.all([
        AsyncStorage.getItem(AUTH_STATE_KEY),
        AsyncStorage.getItem(USER_PROFILE_KEY),
        AsyncStorage.getItem(AUTH_TOKEN_KEY)
      ]);

      if (authState === 'true' && profileJson && token) {
        const profile = JSON.parse(profileJson);
        setUserProfile(profile);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Error restoring auth state:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  // Save auth state to storage
  const saveAuthState = async (loggedIn: boolean) => {
    try {
      await AsyncStorage.setItem(AUTH_STATE_KEY, loggedIn.toString());
    } catch (error) {
      console.error('Error saving auth state:', error);
    }
  };

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground - restore auth state
        restoreAuthState();
      }
      appState.current = nextAppState;
    });

    // Initial auth state restoration
    restoreAuthState();

    return () => {
      subscription.remove();
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // For demo purposes, accept any login
      console.log(`Mock login for: ${email}`);

      // Create mock user data
      const userData: User = {
        id: 'mock-user-' + Date.now(),
        email: email,
        name: 'Demo User',
        companyName: 'Demo Company',
        receiveUpdates: true
      };

      // Save auth data
      const mockToken = 'mock-auth-token-' + Date.now();
      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, mockToken),
        AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userData)),
        AsyncStorage.setItem(AUTH_STATE_KEY, 'true')
      ]);

      setUserProfile(userData);
      setIsLoggedIn(true);
      await saveAuthState(true);
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Clear all auth data
      await Promise.all([
        AsyncStorage.removeItem(AUTH_TOKEN_KEY),
        AsyncStorage.removeItem(USER_PROFILE_KEY),
        AsyncStorage.removeItem(AUTH_STATE_KEY)
      ]);

      setUserProfile(null);
      setIsLoggedIn(false);
    } catch (err) {
      console.error('Logout error:', err);
      setError(err instanceof Error ? err.message : 'Logout failed');
      // Still clear user state even if error occurs
      setUserProfile(null);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    companyName: string,
    receiveUpdates: boolean
  ): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Mock registration
      const userData: User = {
        id: 'mock-user-' + Date.now(),
        email: email,
        name: name,
        companyName: companyName,
        receiveUpdates: receiveUpdates
      };

      // Save auth data
      const mockToken = 'mock-auth-token-' + Date.now();
      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, mockToken),
        AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userData)),
        AsyncStorage.setItem(AUTH_STATE_KEY, 'true')
      ]);

      setUserProfile(userData);
      setIsLoggedIn(true);
      await saveAuthState(true);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profile: Partial<User>): Promise<boolean> => {
    try {
      if (!userProfile) return false;

      const updatedProfile = { ...userProfile, ...profile };
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));
      setUserProfile(updatedProfile);
      return true;
    } catch (error) {
      console.error('Update profile error:', error);
      return false;
    }
  };

  const sendHistoryToEmail = async (email: string, receiveUpdates: boolean): Promise<boolean> => {
    try {
      const historyJson = await AsyncStorage.getItem('@tcalc_history');
      const history = historyJson ? JSON.parse(historyJson) : [];

      console.log('Sending history to backend:', { email, receiveUpdates, history });
      await new Promise(resolve => setTimeout(resolve, 2000));

      return true;
    } catch (error) {
      console.error('Send history error:', error);
      return false;
    }
  };

  const value: AuthContextValue = {
    user: userProfile,
    isLoggedIn,
    login,
    logout,
    register,
    isLoading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext };
