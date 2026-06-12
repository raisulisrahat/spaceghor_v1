import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProfile, login as loginApi, register as registerApi } from '../services/api';

interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  login: (credentials: any) => Promise<any>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
  token: string | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    try {
      const response = await getProfile();
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshProfile();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const login = async (credentials: any) => {
    const response = await loginApi(credentials);
    if (response.data && response.data.two_factor_required) {
      return response.data;
    }
    const { token } = response.data;
    localStorage.setItem('token', token);
    setToken(token);
    setIsAuthenticated(true);
    await refreshProfile();
    return response.data;
  };

  const register = async (userData: any) => {
    await registerApi(userData);
    await login({ username: userData.phone_number, password: userData.password });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      login, 
      register, 
      logout, 
      loading, 
      token,
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
