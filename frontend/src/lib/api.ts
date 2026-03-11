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

export const workflowsAPI = {
  getServiceWorkflow: (serviceId: string) =>
    api.get(`/workflows/service/${serviceId}/workflow`),
};

export interface UploadedFileResult {
  filename: string;
  url: string;
  original_name: string;
  thumbnailUrl?: string;
}

function uploadWithProgress(
  url: string,
  formData: FormData,
  onProgress?: (percent: number) => void,
): Promise<UploadedFileResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const token = localStorage.getItem('khawam_token');

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); } catch { reject(new Error('استجابة غير صالحة')); }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.detail || 'فشل الرفع'));
        } catch { reject(new Error(`خطأ ${xhr.status}`)); }
      }
    });

    xhr.addEventListener('error', () => reject(new Error('انقطع الاتصال أثناء الرفع')));
    xhr.addEventListener('abort', () => reject(new Error('تم إلغاء الرفع')));

    const baseURL = import.meta.env.VITE_API_URL as string || 'http://localhost:8000/api';
    xhr.open('POST', `${baseURL}${url}`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

export const ordersAPI = {
  upload: (file: File, onProgress?: (percent: number) => void): Promise<UploadedFileResult> => {
    const form = new FormData();
    form.append('file', file);
    return uploadWithProgress('/orders/upload', form, onProgress);
  },

  uploadBatch: async (
    files: File[],
    onProgress?: (percent: number) => void,
  ): Promise<UploadedFileResult[]> => {
    const results: UploadedFileResult[] = [];
    for (let i = 0; i < files.length; i++) {
      const result = await ordersAPI.upload(files[i], (filePct) => {
        if (onProgress) {
          const overall = Math.round(((i + filePct / 100) / files.length) * 100);
          onProgress(overall);
        }
      });
      results.push(result);
    }
    return results;
  },

  create: (data: Record<string, unknown>) => api.post('/orders/', data),
  getOrders: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get<{ data: Array<Record<string, unknown>>; total: number; page: number; limit: number; totalPages: number }>('/orders/', { params }),
  getById: (orderId: string) => api.get<Record<string, unknown>>(`/orders/${orderId}`),
  getReorderData: (orderId: string) =>
    api.get<Record<string, unknown>>(`/orders/${orderId}/reorder-data`),
};
