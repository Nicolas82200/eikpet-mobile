import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAccessToken } from './token-storage';
import * as api from '../api/endpoints';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: Parameters<typeof api.register>[0]) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAccessToken()
      .then((token) => setIsAuthenticated(!!token))
      .finally(() => setIsLoading(false));
  }, []);

  const value: AuthContextValue = {
    isAuthenticated,
    isLoading,
    login: async (email, password) => {
      await api.login(email, password);
      setIsAuthenticated(true);
    },
    register: async (input) => {
      await api.register(input);
      setIsAuthenticated(true);
    },
    logout: async () => {
      await api.logout();
      setIsAuthenticated(false);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit etre utilise dans un AuthProvider');
  }
  return context;
}
