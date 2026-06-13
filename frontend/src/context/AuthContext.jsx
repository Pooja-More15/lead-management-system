import React, { createContext, useState, useEffect, useContext } from 'react';
import apiClient, { setAccessTokenInMemo } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verify and restore session on mount (silent refresh login check)
  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await apiClient.post('/auth/refresh');
        const { user: profile, token } = res.data.data;
        setAccessTokenInMemo(token);
        setUser(profile);
      } catch (err) {
        setAccessTokenInMemo(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen to force logout triggers from axios interceptors
    const handleForceLogout = () => {
      setAccessTokenInMemo(null);
      setUser(null);
    };

    window.addEventListener('auth:force-logout', handleForceLogout);
    return () => window.removeEventListener('auth:force-logout', handleForceLogout);
  }, []);

  const loginUser = async (email, password) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { user: profile, token } = res.data.data;
      setAccessTokenInMemo(token);
      setUser(profile);
      return profile;
    } catch (error) {
      throw error.response?.data?.message || 'Login failed';
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (name, email, password, role) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/register', { name, email, password, role });
      return res.data;
    } catch (error) {
      throw error.response?.data?.message || 'Registration failed';
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      // ignore
    } finally {
      setAccessTokenInMemo(null);
      setUser(null);
    }
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    const mappings = {
      ADMIN: [
        'manage_users',
        'manage_leads',
        'create_leads',
        'update_leads',
        'delete_leads',
        'assign_leads',
        'view_dashboard',
        'view_assigned_leads',
        'update_assigned_leads'
      ],
      MANAGER: [
        'create_leads',
        'update_leads',
        'assign_leads',
        'view_dashboard',
        'view_assigned_leads',
        'update_assigned_leads'
      ],
      AGENT: [
        'view_assigned_leads',
        'update_assigned_leads',
        'view_dashboard'
      ],
    };
    const userPerms = mappings[user.role] || [];
    return userPerms.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login: loginUser, register: registerUser, logout: logoutUser, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
