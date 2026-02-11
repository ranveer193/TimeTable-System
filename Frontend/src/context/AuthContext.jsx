import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [awaitingApproval, setAwaitingApproval] = useState(false);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line
  }, []);

  /**
   * =========================
   * CHECK AUTH (ON REFRESH)
   * =========================
   */
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await authAPI.getMe();

      if (response?.data?.user) {
        setUser(response.data.user);
        setAwaitingApproval(false);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  /**
   * =========================
   * LOGIN (USER ID BASED)
   * =========================
   */
  const login = async ({ userId, password }) => {
    try {
      if (!userId || !password) {
        throw new Error('User ID and password are required');
      }

      const response = await authAPI.login({
        userId,
        password,
      });

      // ⏳ Awaiting admin approval
      if (response?.data?.awaitingApproval) {
        setAwaitingApproval(true);
        return { awaitingApproval: true };
      }

      const { token, user } = response?.data || {};

      if (!token || !user) {
        throw new Error('Invalid response from server');
      }

      localStorage.setItem('token', token);
      setUser(user);
      setAwaitingApproval(false);

      return { success: true, user };
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  /**
   * =========================
   * REGISTER
   * =========================
   */
  const register = async ({ userId, password, name, email }) => {
    try {
      if (!userId || !password || !name || !email) {
        throw new Error('User ID, name, email, and password are required');
      }

      const response = await authAPI.register({
        userId,
        password,
        name,
        email,
      });

      if (response?.data?.awaitingApproval) {
        setAwaitingApproval(true);
        return { awaitingApproval: true };
      }

      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  /**
   * =========================
   * LOGOUT
   * =========================
   */
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setAwaitingApproval(false);
  };

  /**
   * =========================
   * PERMISSIONS (FRONTEND)
   * =========================
   */
  const permissions = {
    isLoggedIn: !!user,
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    isAdmin: user?.role?.startsWith('ADMIN_') || false,
    isUser: user?.role === 'USER',
    canViewTimetable: !!user,
    canEditCell:
      (user?.role?.startsWith('ADMIN_') || false) && user?.isApproved === true,
  };

  const value = {
    user,
    loading,
    awaitingApproval,
    permissions,
    login,
    register,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
