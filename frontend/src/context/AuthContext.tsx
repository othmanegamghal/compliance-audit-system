import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../types';
import { authApi } from '../api/auth';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setCurrentUser: (user: User) => void;
  applySession: (accessToken: string, user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from a stored token on mount.
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((user) => setCurrentUserState(user))
      .catch(() => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const res = await authApi.login(email, password);
    localStorage.setItem('auth_token', res.access_token);
    localStorage.setItem('auth_user', JSON.stringify(res.user));
    setCurrentUserState(res.user);
  };

  const logout = () => {
    setCurrentUserState(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  // Keeps currentUser in sync when the profile (e.g. avatar, name) is updated.
  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    localStorage.setItem('auth_user', JSON.stringify(user));
  };

  // Applies a token + user (e.g. after self sign-up) to start a session.
  const applySession = (accessToken: string, user: User) => {
    localStorage.setItem('auth_token', accessToken);
    localStorage.setItem('auth_user', JSON.stringify(user));
    setCurrentUserState(user);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout, setCurrentUser, applySession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
