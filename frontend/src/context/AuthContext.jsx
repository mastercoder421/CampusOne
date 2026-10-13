import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient, { setAuthToken } from '../api/axiosClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('campusone_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('campusone_token') || null;
    if (savedToken) setAuthToken(savedToken);
    return savedToken;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('campusone_token');
      if (storedToken) {
        setAuthToken(storedToken);
        try {
          const res = await axiosClient.get('/auth/me');
          if (res.data.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('campusone_user', JSON.stringify(res.data.user));
          }
        } catch (error) {
          console.warn('Session verification error:', error.message);
          localStorage.removeItem('campusone_token');
          localStorage.removeItem('campusone_user');
          setAuthToken(null);
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axiosClient.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token: receivedToken, user: receivedUser } = res.data;
        setToken(receivedToken);
        setUser(receivedUser);
        setAuthToken(receivedToken);
        localStorage.setItem('campusone_token', receivedToken);
        localStorage.setItem('campusone_user', JSON.stringify(receivedUser));
        return { success: true, user: receivedUser };
      }
      return { success: false, message: res.data.message || 'Login failed' };
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Login failed';
      return { success: false, message: msg };
    }
  };

  const register = async (userData) => {
    try {
      const res = await axiosClient.post('/auth/register', userData);
      if (res.data.success) {
        const { token: receivedToken, user: receivedUser } = res.data;
        setToken(receivedToken);
        setUser(receivedUser);
        setAuthToken(receivedToken);
        localStorage.setItem('campusone_token', receivedToken);
        localStorage.setItem('campusone_user', JSON.stringify(receivedUser));
        return { success: true, user: receivedUser };
      }
      return { success: false, message: res.data.message || 'Registration failed' };
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Registration failed';
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      await axiosClient.post('/auth/logout');
    } catch (error) {
      console.warn('Logout notification error:', error.message);
    } finally {
      localStorage.removeItem('campusone_token');
      localStorage.removeItem('campusone_user');
      setAuthToken(null);
      setUser(null);
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
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
