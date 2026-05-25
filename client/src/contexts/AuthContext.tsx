import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, type User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (...roles: string[]) => boolean;
  canEditBossAssignments: boolean;
  canViewAllTabs: boolean;
  canManageUsers: boolean;
  canAddAbsencesPreferences: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const response = await authAPI.login({ username, password });
    localStorage.setItem('token', response.data.token);
    setUser({
      id: response.data.id,
      username: response.data.username,
      role: response.data.role,
    });
  };

  const register = async (username: string, password: string) => {
    const response = await authAPI.register({ username, password });
    localStorage.setItem('token', response.data.token);
    setUser({
      id: response.data.id,
      username: response.data.username,
      role: response.data.role,
    });
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Ignore errors on logout
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const hasRole = (...roles: string[]) => {
    return user ? roles.includes(user.role) : false;
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    hasRole,
    canEditBossAssignments: hasRole('Administrator', 'Officer'),
    canViewAllTabs: hasRole('Administrator', 'Officer', 'Raider', 'Member'),
    canManageUsers: hasRole('Administrator'),
    canAddAbsencesPreferences: hasRole('Administrator', 'Officer', 'Raider', 'Member'),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
