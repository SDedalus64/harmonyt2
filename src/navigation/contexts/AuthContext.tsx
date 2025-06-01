import React, { createContext, useState, useEffect } from 'react';
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored auth state
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to get stored user data
      const storedUser = await authService.getUserData();
      if (storedUser) {
        // Verify token is still valid by making a test request
        try {
          await authService.authenticatedFetch('/auth/verify');
          setUser(storedUser);
        } catch (error) {
          // If token is invalid, clear everything
          await authService.clearTokens();
          setUser(null);
        }
      }
    } catch (err) {
      console.error('Auth state check error:', err);
      setError('Failed to check authentication state');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const userData = await authService.login(email, password);
      setUser(userData);
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.logout();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError(err instanceof Error ? err.message : 'Logout failed');
      // Still clear user state even if API call fails
      setUser(null);
      throw err;
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
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      const userData = await authService.register(email, password, name, companyName, receiveUpdates);
      setUser(userData);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextValue = {
    user,
    isLoggedIn: !!user,
    login,
    logout,
    register,
    isLoading,
    error
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext };
