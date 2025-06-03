import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../navigation/contexts/AuthContext';

// Storage keys
const AUTH_TOKEN_KEY = '@HarmonyTi:authToken';
const REFRESH_TOKEN_KEY = '@HarmonyTi:refreshToken';
const USER_DATA_KEY = '@HarmonyTi:userData';

// Mock user data for development
const MOCK_USERS = [
  {
    email: 'test@example.com',
    password: 'password123',
    user: {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      companyName: 'Test Company',
      receiveUpdates: true,
    },
  },
];

// API endpoints - replace with your actual API endpoints
const API_BASE_URL = 'https://api.ratecast.com/v1';
const ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  PROFILE: '/auth/profile',
};

// Types
interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

// Helper function to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to generate mock tokens
const generateMockTokens = () => ({
  token: `mock_token_${Math.random().toString(36).substring(7)}`,
  refreshToken: `mock_refresh_${Math.random().toString(36).substring(7)}`,
});

// Helper function to handle API errors
const handleApiError = async (response: Response): Promise<never> => {
  const error: ApiError = await response.json().catch(() => ({
    message: 'An unexpected error occurred',
  }));

  // Handle specific error cases
  switch (response.status) {
    case 401:
      // Clear tokens on auth error
      await clearTokens();
      throw new Error('Session expired. Please login again.');
    case 403:
      throw new Error('Access denied');
    case 404:
      throw new Error('Resource not found');
    case 422:
      throw new Error(error.message || 'Invalid input');
    default:
      throw new Error(error.message || 'An unexpected error occurred');
  }
};

// Token management
export const storeTokens = async (token: string, refreshToken: string) => {
  try {
    await AsyncStorage.multiSet([
      [AUTH_TOKEN_KEY, token],
      [REFRESH_TOKEN_KEY, refreshToken],
    ]);
  } catch (error) {
    console.error('Error storing tokens:', error);
    throw new Error('Failed to store authentication tokens');
  }
};

export const getTokens = async () => {
  try {
    const [token, refreshToken] = await AsyncStorage.multiGet([
      AUTH_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
    ]);
    return {
      token: token[1],
      refreshToken: refreshToken[1],
    };
  } catch (error) {
    console.error('Error getting tokens:', error);
    throw new Error('Failed to retrieve authentication tokens');
  }
};

export const clearTokens = async () => {
  try {
    await AsyncStorage.multiRemove([
      AUTH_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      USER_DATA_KEY,
    ]);
  } catch (error) {
    console.error('Error clearing tokens:', error);
    throw new Error('Failed to clear authentication tokens');
  }
};

// User data management
export const storeUserData = async (user: User) => {
  try {
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error storing user data:', error);
    throw new Error('Failed to store user data');
  }
};

export const getUserData = async (): Promise<User | null> => {
  try {
    const userData = await AsyncStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    throw new Error('Failed to retrieve user data');
  }
};

// Mock API calls
export const login = async (email: string, password: string): Promise<User> => {
  try {
    // Simulate API delay
    await delay(1000);

    // Find mock user
    const mockUser = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (!mockUser) {
      throw new Error('Invalid email or password');
    }

    // Generate mock tokens
    const { token, refreshToken } = generateMockTokens();

    // Store tokens and user data
    await storeTokens(token, refreshToken);
    await storeUserData(mockUser.user);

    return mockUser.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error instanceof Error ? error : new Error('Login failed');
  }
};

export const register = async (
  email: string,
  password: string,
  name: string,
  companyName: string,
  receiveUpdates: boolean
): Promise<User> => {
  try {
    // Simulate API delay
    await delay(1000);

    // Check if email already exists
    if (MOCK_USERS.some(u => u.email === email)) {
      throw new Error('Email already registered');
    }

    // Create new mock user
    const newUser = {
      id: Math.random().toString(36).substring(7),
      email,
      name,
      companyName,
      receiveUpdates,
    };

    // Add to mock users
    MOCK_USERS.push({
      email,
      password,
      user: newUser,
    });

    // Generate mock tokens
    const { token, refreshToken } = generateMockTokens();

    // Store tokens and user data
    await storeTokens(token, refreshToken);
    await storeUserData(newUser);

    return newUser;
  } catch (error) {
    console.error('Registration error:', error);
    throw error instanceof Error ? error : new Error('Registration failed');
  }
};

export const logout = async (): Promise<void> => {
  try {
    // Simulate API delay
    await delay(500);
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    await clearTokens();
  }
};

export const refreshToken = async (): Promise<string> => {
  try {
    // Simulate API delay
    await delay(500);

    const { refreshToken } = await getTokens();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // Generate new mock token
    const { token: newToken } = generateMockTokens();
    await storeTokens(newToken, refreshToken);

    return newToken;
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error instanceof Error ? error : new Error('Failed to refresh token');
  }
};

export const getAuthHeaders = async (): Promise<HeadersInit> => {
  const { token } = await getTokens();
  return {
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};

export const authenticatedFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  try {
    // Simulate API delay
    await delay(500);

    const headers = await getAuthHeaders();
    const { token } = await getTokens();

    if (!token) {
      throw new Error('No authentication token available');
    }

    // For mock implementation, just return a success response
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Authenticated fetch error:', error);
    throw error instanceof Error ? error : new Error('Request failed');
  }
};
