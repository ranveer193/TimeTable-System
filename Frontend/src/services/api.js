import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch (e) { console.error('Token read error:', e); }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') window.location.href = '/login';
      } catch (e) { console.error('Storage clear error:', e); }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => {
    if (!data?.email || !data?.password || !data?.name)
      return Promise.reject(new Error('Invalid registration data'));
    return api.post('/auth/register', data);
  },
  login: (data) => {
    if (!data?.userId || !data?.password)
      return Promise.reject(new Error('Invalid login credentials'));
    return api.post('/auth/login', data);
  },
  getMe: () => api.get('/auth/me'),
};

export const superAdminAPI = {
  getStats:          () => api.get('/super-admin/stats'),
  getPendingRequests:() => api.get('/super-admin/pending-requests'),
  getActiveAdmins:   () => api.get('/super-admin/active-admins'),
  getDisabledAdmins: () => api.get('/super-admin/disabled-admins'),
  getAllTimetables:   () => api.get('/super-admin/timetables'),
  approveUser: (id, data) => {
    if (!id) return Promise.reject(new Error('User ID required'));
    if (!data?.role || !data?.department) return Promise.reject(new Error('Role and department required'));
    return api.put(`/super-admin/approve/${id}`, data);
  },
  rejectUser:        (id) => id ? api.delete(`/super-admin/reject/${id}`) : Promise.reject(new Error('ID required')),
  toggleAdminStatus: (id) => id ? api.put(`/super-admin/toggle-status/${id}`) : Promise.reject(new Error('ID required')),
};

export const timetableAPI = {
  create: (data) => {
    if (!data?.roomName || !data?.days || !data?.periodsPerDay)
      return Promise.reject(new Error('roomName, days, periodsPerDay are required'));
    return api.post('/timetables', data);
  },
  copy: (id, data) => {
    if (!id) return Promise.reject(new Error('Timetable ID required'));
    if (!data?.newRoomName) return Promise.reject(new Error('New room name required'));
    return api.post(`/timetables/${id}/copy`, data);
  },
  getAll:        () => api.get('/timetables'),
  getOne:        (id) => id ? api.get(`/timetables/${id}`) : Promise.reject(new Error('ID required')),
  getActivityLog:(id) => id ? api.get(`/timetables/${id}/activity-log`) : Promise.reject(new Error('ID required')),
  updateCell: (cellId, data) => {
    if (!cellId) return Promise.reject(new Error('Cell ID required'));
    return api.put(`/timetables/cell/${cellId}`, data);
  },
  delete: (id) => id ? api.delete(`/timetables/${id}`) : Promise.reject(new Error('ID required')),
  getCellHistory: (cellId) => cellId ? api.get(`/timetables/cell/${cellId}/history`) : Promise.reject(new Error('ID required')),
};

// Unauthenticated — used by PublicTimetableView
export const getPublicTimetable = (token) =>
  axios.get(`${API_URL}/public/timetable/${token}`);

export default api;