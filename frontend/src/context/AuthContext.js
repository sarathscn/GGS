import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('ggs-token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password, auth_type: 'email' });
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('ggs-token', newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const loginWithPhone = async (phone, password) => {
    const response = await api.post('/auth/login', { phone, password, auth_type: 'phone' });
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('ggs-token', newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const signup = async (data) => {
    const response = await api.post('/auth/register', data);
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('ggs-token', newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const googleAuth = async (googleData) => {
    const response = await api.post('/auth/google', googleData);
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('ggs-token', newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const sendOTP = async (phone) => {
    const response = await api.post('/auth/otp/send', { phone });
    return response.data;
  };

  const verifyOTP = async (phone, otp) => {
    const response = await api.post('/auth/otp/verify', { phone, otp });
    if (response.data.token) {
      localStorage.setItem('ggs-token', response.data.token);
      setToken(response.data.token);
      setUser(response.data.user);
    }
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('ggs-token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data) => {
    const response = await api.put('/auth/profile', data);
    setUser(response.data);
    return response.data;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      loginWithPhone,
      signup,
      googleAuth,
      sendOTP,
      verifyOTP,
      logout,
      updateProfile,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      isVerifiedSeller: user?.is_seller_verified
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
