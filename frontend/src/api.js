import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

const apiInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const api = {
  // Auth endpoints
  login: async (credentials) => {
    try {
      const response = await apiInstance.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  // Future endpoints can be added here
  signup: async (userData) => {
    try {
      const response = await apiInstance.post('/auth/signup', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  getMe: async () => {
    try {
      const response = await apiInstance.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await apiInstance.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  resetPassword: async (token, password) => {
    try {
      const response = await apiInstance.post('/auth/reset-password', { token, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  }
};

export default api;
