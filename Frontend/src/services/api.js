import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error reading token from localStorage:', error);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } catch (storageError) {
        console.error('Error clearing localStorage:', storageError);
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => {
    if (!data || !data.email || !data.password || !data.name) {
      return Promise.reject(new Error('Invalid registration data'));
    }
    return api.post('/auth/register', data);
  },
  login: (data) => {
    if (!data || !data.userId || !data.password) {
      return Promise.reject(new Error('Invalid login credentials'));
    }
    return api.post('/auth/login', data);
  },
  getMe: () => api.get('/auth/me'),
};

// Super Admin API
export const superAdminAPI = {
  getStats: () => api.get('/super-admin/stats'),
  getPendingRequests: () => api.get('/super-admin/pending-requests'),
  getActiveAdmins: () => api.get('/super-admin/active-admins'),
  getDisabledAdmins: () => api.get('/super-admin/disabled-admins'),
  approveUser: (id, data) => {
    if (!id) {
      return Promise.reject(new Error('User ID is required'));
    }
    if (!data || !data.role || !data.department) {
      return Promise.reject(new Error('Role and department are required'));
    }
    return api.put(`/super-admin/approve/${id}`, data);
  },
  rejectUser: (id) => {
    if (!id) {
      return Promise.reject(new Error('User ID is required'));
    }
    return api.delete(`/super-admin/reject/${id}`);
  },
  toggleAdminStatus: (id) => {
    if (!id) {
      return Promise.reject(new Error('User ID is required'));
    }
    return api.put(`/super-admin/toggle-status/${id}`);
  },
  getAllTimetables: () => api.get('/super-admin/timetables'),
};

// Timetable API
export const timetableAPI = {
  create: (data) => {
    if (!data || !data.className || !data.days || !data.periodsPerDay) {
      return Promise.reject(new Error('Invalid timetable data'));
    }
    return api.post('/timetables', data);
  },
  getAll: () => api.get('/timetables'),
  getOne: (id) => {
    if (!id) {
      return Promise.reject(new Error('Timetable ID is required'));
    }
    return api.get(`/timetables/${id}`);
  },
  updateCell: (cellId, data) => {
    if (!cellId) {
      return Promise.reject(new Error('Cell ID is required'));
    }
    if (!data || (!data.subject && data.subject !== '')) {
      return Promise.reject(new Error('Invalid cell data'));
    }
    return api.put(`/timetables/cell/${cellId}`, data);
  },
  delete: (id) => {
    if (!id) {
      return Promise.reject(new Error('Timetable ID is required'));
    }
    return api.delete(`/timetables/${id}`);
  },
  getCellHistory: (cellId) => {
    if (!cellId) {
      return Promise.reject(new Error('Cell ID is required'));
    }
    return api.get(`/timetables/cell/${cellId}/history`);
  },
};

export default api;