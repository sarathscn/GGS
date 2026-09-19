import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ggs-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ggs-token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else if (
      error.response?.status === 403 &&
      (error.response?.data?.is_suspended ||
        error.response?.data?.is_banned ||
        error.response?.data?.detail?.toLowerCase()?.includes('suspended') ||
        error.response?.data?.detail?.toLowerCase()?.includes('banned'))
    ) {
      localStorage.removeItem('ggs-token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?suspended=1';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
