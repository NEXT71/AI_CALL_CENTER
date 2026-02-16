import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/apiService';
import useInactivityTimeout from '../hooks/useInactivityTimeout';

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

  // Define logout function first so it can be used in handleInactiveLogout
  const logout = useCallback(async () => {
    // Clear cookies via API call
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear local storage
    localStorage.removeItem('user');
    setUser(null);
    
    // Redirect to login page
    window.location.href = '/login';
  }, []);

  // Auto-logout after 10 minutes of inactivity
  const handleInactiveLogout = useCallback(() => {
    if (user) {
      console.log('Auto-logout due to inactivity');
      alert('You have been logged out due to 10 minutes of inactivity.');
      logout();
    }
  }, [user, logout]);

  // Initialize inactivity timeout (10 minutes) - only when user is logged in
  useInactivityTimeout(user ? handleInactiveLogout : null, 10);

  useEffect(() => {
    // Check if user is logged in
    const initAuth = async () => {
      const savedUser = localStorage.getItem('user');

      if (savedUser) {
        try {
          // Verify authentication with backend (cookies sent automatically)
          const response = await authService.getMe();
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        } catch (error) {
          console.error('Auth verification failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      const { user } = response.data;

      // Tokens are now in httpOnly cookies, just store user data
      localStorage.setItem('user', JSON.stringify(user));

      setUser(user);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      const { user } = response.data;

      // Tokens are now in httpOnly cookies, just store user data
      localStorage.setItem('user', JSON.stringify(user));

      setUser(user);
      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authService.getMe();
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      return { success: true };
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      return { success: false, error };
    }
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (typeof roles === 'string') {
      return user.role === roles;
    }
    return roles.includes(user.role);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    hasRole,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
