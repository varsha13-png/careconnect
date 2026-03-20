import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cc_token');
    const savedUser = localStorage.getItem('cc_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('cc_token', token);
    localStorage.setItem('cc_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
    setUser(null);
  };

  const isAuthority = () => user?.role === 'authority';
  const isCareWorker = () => user?.role === 'care_worker';
  const isDonor = () => user?.role === 'donor';
  const isGovt = () => user?.role === 'govt_official';

  return (
    <AuthContext.Provider value={{
      user, login, logout, loading,
      isAuthority, isCareWorker, isDonor, isGovt
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
