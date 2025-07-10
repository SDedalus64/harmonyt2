import React, { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, AppState, AppStateStatus } from 'react-native';

// Define user profile interface
export interface UserProfile {
  email: string;
  name: string;
  companyName: string;
  receiveUpdates: boolean;
}

// Define auth context values interface
export interface AuthContextValue {
  isLoggedIn: boolean;
  userProfile: UserProfile | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string, companyName: string, receiveUpdates: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<boolean>;
  sendHistoryToEmail: (email: string, receiveUpdates: boolean) => Promise<boolean>;
}

// Storage keys
const USER_PROFILE_KEY = '@tcalc_user_profile';
const AUTH_TOKEN_KEY = '@tcalc_auth_token';
const AUTH_STATE_KEY = '@tcalc_auth_state';

// Mock API endpoints
const API_BASE_URL = 'https://api.example.com';

/**
 * Hook for authentication and user profile management
 */
export function useAuth(): AuthContextValue {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const appState = useRef(AppState.currentState);

  // Function to restore auth state
  const restoreAuthState = async () => {
      try {
      const [authState, token, profileJson] = await Promise.all([
        AsyncStorage.getItem(AUTH_STATE_KEY),
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        AsyncStorage.getItem(USER_PROFILE_KEY)
      ]);

      if (authState === 'true' && token && profileJson) {
            const profile = JSON.parse(profileJson);
            setUserProfile(profile);
            setIsLoggedIn(true);
        console.log('Auth state restored successfully');
      } else {
        console.log('No valid auth state found');
        }
      } catch (error) {
      console.error('Error restoring auth state:', error);
    } finally {
      setIsInitialized(true);
    }
  };

  // Handle app state changes
  useEffect(() => {
    // Subscribe to app state changes
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        console.log('App came to foreground, checking auth state');
        restoreAuthState();
      }
      appState.current = nextAppState;
    });

    // Initial auth state check
    restoreAuthState();

    return () => {
      subscription.remove();
    };
  }, []);

  /**
   * Login user with email and password
   */
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // In a real app, this would be an API call
      console.log(`Logging in user: ${email}`);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock successful login
      const mockToken = 'mock-auth-token-' + Date.now();

      // Mock user profile
      const profile: UserProfile = {
        email,
        name: 'Demo User', // In a real app, this would come from the API
        companyName: 'Demo Company',
        receiveUpdates: true
      };

      // Save all auth data atomically
      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, mockToken),
        AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile)),
        AsyncStorage.setItem(AUTH_STATE_KEY, 'true')
      ]);

      setUserProfile(profile);
      setIsLoggedIn(true);

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  /**
   * Register a new user
   */
  const register = async (
    email: string,
    password: string,
    name: string,
    companyName: string,
    receiveUpdates: boolean
  ): Promise<boolean> => {
    try {
      // In a real app, this would be an API call
      console.log(`Registering user: ${email}`);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock successful registration
      const mockToken = 'mock-auth-token-' + Date.now();

      // Save user profile
      const profile: UserProfile = {
        email,
        name,
        companyName,
        receiveUpdates
      };

      // Save all auth data atomically
      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, mockToken),
        AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile)),
        AsyncStorage.setItem(AUTH_STATE_KEY, 'true')
      ]);

      // Send data to HubSpot (in a real app)
      console.log('Sending user data to HubSpot:', profile);

      setUserProfile(profile);
      setIsLoggedIn(true);

      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  /**
   * Logout the current user
   */
  const logout = async (): Promise<void> => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(AUTH_TOKEN_KEY),
        AsyncStorage.removeItem(USER_PROFILE_KEY),
        AsyncStorage.removeItem(AUTH_STATE_KEY)
      ]);
      setUserProfile(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (profile: Partial<UserProfile>): Promise<boolean> => {
    try {
      if (!userProfile) {
        return false;
      }

      // Update profile
      const updatedProfile = { ...userProfile, ...profile };
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));

      // In a real app, send update to API
      console.log('Updating profile:', updatedProfile);

      setUserProfile(updatedProfile);
      return true;
    } catch (error) {
      console.error('Update profile error:', error);
      return false;
    }
  };

  /**
   * Send history to email and update HubSpot
   */
  const sendHistoryToEmail = async (email: string, receiveUpdates: boolean): Promise<boolean> => {
    try {
      // Get history from storage
      const historyJson = await AsyncStorage.getItem('@tcalc_history');
      const history = historyJson ? JSON.parse(historyJson) : [];

      // Prepare data for backend
      const data = {
        email,
        receiveUpdates,
        history,
        userProfile: isLoggedIn ? userProfile : null
      };

      // In a real app, this would be an API call to your backend
      console.log('Sending history to backend for email delivery:', data);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // If user is not logged in but provided email, save partial profile
      if (!isLoggedIn && email) {
        const partialProfile: UserProfile = {
          email,
          name: '',
          companyName: '',
          receiveUpdates
        };

        // In a real app, send to HubSpot
        console.log('Sending partial profile to HubSpot:', partialProfile);
      }

      return true;
    } catch (error) {
      console.error('Send history error:', error);
      return false;
    }
  };

  return {
    isLoggedIn,
    userProfile,
    login,
    register,
    logout,
    updateProfile,
    sendHistoryToEmail
  };
}
