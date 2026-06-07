import axios from 'axios';

const LIVE_API_URL = 'https://ams-h6zw.onrender.com/api';
let BASE_URL = import.meta.env.VITE_API_URL || LIVE_API_URL;

if (typeof window !== 'undefined') {
  if (window.electronAPI?.getApiUrl) {
    BASE_URL = window.electronAPI.getApiUrl();
  } else {
    const currentHostname = window.location.hostname;
    const isLocal = currentHostname === 'localhost' || currentHostname === '127.0.0.1';
    const isElectronFile = window.location.protocol === 'file:';
    const devIP = import.meta.env.VITE_DEV_IP;

    try {
      const url = new URL(BASE_URL);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        if (!isLocal && !isElectronFile) {
          url.hostname = currentHostname;
        } else if (isLocal && devIP && devIP !== 'localhost') {
          url.hostname = devIP;
        }
        BASE_URL = url.toString();
      }
    } catch (e) {
      console.error('Failed to parse BASE_URL', e);
    }
  }
}

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
  login: async (credentials) => {
    try {
      const response = await apiInstance.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

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
  },

  markAttendance: async (data) => {
    try {
      const response = await apiInstance.post('/attendance', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  bulkMarkAttendance: async (data) => {
    try {
      const response = await apiInstance.post('/attendance/bulk', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  getAttendance: async (params = {}) => {
    try {
      const response = await apiInstance.get('/attendance', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  getAttendanceByCourse: async (courseId, params = {}) => {
    try {
      const response = await apiInstance.get(`/attendance/course/${courseId}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  getAttendanceByStudent: async (studentId, params = {}) => {
    try {
      const response = await apiInstance.get(`/attendance/student/${studentId}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  getAttendanceSummary: async (params = {}) => {
    try {
      const response = await apiInstance.get('/attendance/summary', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  updateAttendance: async (id, data) => {
    try {
      const response = await apiInstance.put(`/attendance/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  deleteAttendance: async (id) => {
    try {
      const response = await apiInstance.delete(`/attendance/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  markTeacherAttendance: async (data = {}) => {
    try {
      const response = await apiInstance.post('/teacher-attendance/mark', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  adminOverrideTeacherAttendance: async (data = {}) => {
    try {
      const response = await apiInstance.post('/teacher-attendance/override', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  getTodayTeacherAttendance: async () => {
    try {
      const response = await apiInstance.get('/teacher-attendance/today');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  getAllTeachersToday: async () => {
    try {
      const response = await apiInstance.get('/teacher-attendance/all-today');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  getCourses: async (params = {}) => {
    try {
      const response = await apiInstance.get('/courses', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  getInstituteById: async (id) => {
    try {
      const response = await apiInstance.get(`/institutes/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  getClassOptions: async (params = {}) => {
    try {
      const response = await apiInstance.get('/classes/options', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  getClasses: async (params = {}) => {
    try {
      const response = await apiInstance.get('/classes', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  getUsers: async (params = {}) => {
    try {
      const response = await apiInstance.get('/users', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  getQRToken: async (courseId) => {
    try {
      const response = await apiInstance.get(`/attendance/qr-token/${courseId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  markAttendanceQR: async (data) => {
    try {
      const response = await apiInstance.post('/attendance/mark-qr', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  sendLowAttendanceAlerts: async (data) => {
    try {
      const response = await apiInstance.post('/attendance/send-low-alerts', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  getStudentAttendanceSummary: async (studentId) => {
    try {
      const response = await apiInstance.get(`/attendance/student-summary/${studentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  sendManualAttendanceAlert: async (data) => {
    try {
      const response = await apiInstance.post('/attendance/send-manual-alert', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  getLmsConfig: async () => {
    try {
      const response = await apiInstance.get('/lms/config');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  updateLmsConfig: async (data) => {
    try {
      const response = await apiInstance.post('/lms/config', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  verifyLmsEmbed: async (params) => {
    try {
      const response = await apiInstance.get('/lms/verify-embed', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  // Teacher Attendance endpoints
  markTeacherAttendance: async (data) => {
    try {
      const response = await apiInstance.post('/teacher-attendance/mark', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  adminOverrideTeacherAttendance: async (data) => {
    try {
      const response = await apiInstance.post('/teacher-attendance/override', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  getTodayTeacherAttendance: async () => {
    try {
      const response = await apiInstance.get('/teacher-attendance/today');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  getAllTeachersToday: async () => {
    try {
      const response = await apiInstance.get('/teacher-attendance/all-today');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  getTeacherAttendance: async (params = {}) => {
    try {
      const response = await apiInstance.get('/teacher-attendance', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  exportBackup: async () => {
    try {
      const response = await apiInstance.get('/backup/export');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Could not create backup' };
    }
  },

  restoreBackup: async (payload) => {
    try {
      const response = await apiInstance.post('/backup/restore', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Could not restore backup' };
    }
  },
};

export default api;

