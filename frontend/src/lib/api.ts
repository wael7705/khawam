import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL as string || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('khawam_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await api.post('/auth/refresh');
        const newToken = data.access_token as string;
        localStorage.setItem('khawam_token', newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('khawam_token');
        localStorage.removeItem('khawam_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  register: (data: { name: string; phone?: string; email?: string; password: string }) =>
    api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: Record<string, string>) => api.put('/auth/profile', data),
  changePassword: (current_password: string, new_password: string) =>
    api.put('/auth/change-password', { current_password, new_password }),
  logout: () => api.post('/auth/logout'),
};

export const portfolioAPI = {
  getFeatured: () => api.get('/portfolio/featured'),
  getAll: () => api.get('/portfolio'),
  getById: (id: string) => api.get(`/portfolio/${id}`),
};

export const servicesAPI = {
  getAll: () => api.get('/services'),
};
