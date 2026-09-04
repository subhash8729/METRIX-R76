import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export const DEMO_USERS = {
  ADMIN: { email: 'admin@metrix.gov.in', password: 'Admin@123', label: 'Admin (Director Metrology)' },
  LAB_OFFICER: { email: 'officer@metrix.gov.in', password: 'Officer@123', label: 'Test Engineer / Lab Officer' },
  REVIEWER: { email: 'reviewer@metrix.gov.in', password: 'Reviewer@123', label: 'Technical Reviewer' },
  APPROVER: { email: 'approver@metrix.gov.in', password: 'Approver@123', label: 'Approver (Controller Metrology)' },
  VIEWER: { email: 'viewer@metrix.gov.in', password: 'Viewer@123', label: 'Auditor / Viewer' }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('metrix_token');
      if (token) {
        try {
          const res = await api.getProfile();
          setUser(res.data);
        } catch (err) {
          console.warn('Session expired, logging out', err.message);
          localStorage.removeItem('metrix_token');
          setUser(null);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    localStorage.setItem('metrix_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('metrix_token');
    setUser(null);
  };

  // 1-Click Role Switcher for seamless SIH judging demonstration
  const switchRole = async (roleKey) => {
    const demo = DEMO_USERS[roleKey];
    if (demo) {
      return await login(demo.email, demo.password);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
