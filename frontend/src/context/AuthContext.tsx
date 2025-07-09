import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Types
interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  firstLogin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'inzight_auth';
const DEFAULT_USER = 'support@zai-fi.com';
const DEFAULT_PASS = 'Lokesh3105';
const FIRST_LOGIN_KEY = 'inzight_first_login';

function getStoredAuth() {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!data) return { password: DEFAULT_PASS };
  try {
    return JSON.parse(data);
  } catch {
    return { password: DEFAULT_PASS };
  }
}

function setStoredAuth(auth: { password: string }) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(auth));
}

function getFirstLogin() {
  const val = localStorage.getItem(FIRST_LOGIN_KEY);
  return val !== 'false';
}

function setFirstLogin(val: boolean) {
  localStorage.setItem(FIRST_LOGIN_KEY, val ? 'true' : 'false');
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [firstLogin, setFirstLoginState] = useState(getFirstLogin());
  const navigate = useNavigate();

  useEffect(() => {
    setFirstLoginState(getFirstLogin());
  }, []);

  const login = async (username: string, password: string) => {
    const stored = getStoredAuth();
    if (username === DEFAULT_USER && password === stored.password) {
      setIsAuthenticated(true);
      // if (getFirstLogin()) {
      //   navigate('/register');
      // } else {
        navigate('/'); // Redirect to root, which is the dashboard layout
      // }
      return true;
    } else {
      setIsAuthenticated(false);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    navigate('/login');
  };

  const value = {
    isAuthenticated,
    login,
    logout,
    firstLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function setNewPassword(newPassword: string) {
  setStoredAuth({ password: newPassword });
  setFirstLogin(false);
}
