import axios from 'axios';
import { getAuthToken, setAuthToken, clearAuth } from './auth';
import { UPLOAD_FIELD_NAME } from './upload';

const API_URL = import.meta.env.VITE_API_URL as string || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 429 && !original._retry429) {
      original._retry429 = true;
      await new Promise((r) => setTimeout(r, 2000));
      return api(original);
    }

    if (error.response?.status === 401 && !original._retry) {
      const isRefreshRequest =
        typeof original.url === 'string' && original.url.includes('/auth/refresh');
      if (isRefreshRequest) {
        clearAuth();
        return Promise.reject(error);
      }
      original._retry = true;
      try {
        const { data } = await api.post('/auth/refresh');
        const newToken = data.access_token as string;
        setAuthToken(newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        clearAuth();
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

export interface WorkflowBySlugResponse {
  serviceId: string;
  steps: Array<{
    id: string;
    serviceId: string;
    stepNumber: number;
    stepNameAr: string;
    stepNameEn?: string | null;
    stepDescriptionAr?: string | null;
    stepDescriptionEn?: string | null;
    stepType: string;
    stepConfig?: Record<string, unknown> | null;
    displayOrder: number;
    isActive: boolean;
  }>;
}

export const workflowsAPI = {
  getServiceWorkflow: (serviceId: string) =>
    api.get(`/workflows/service/${serviceId}/workflow`),
  getWorkflowBySlug: (slug: string) =>
    api.get<WorkflowBySlugResponse>(`/workflows/service-by-slug/${encodeURIComponent(slug)}`),
};

export interface UploadedFileResult {
  filename: string;
  url: string;
  original_name: string;
  thumbnailUrl?: string;
}

const getBaseURL = () => import.meta.env.VITE_API_URL as string || 'http://localhost:8000/api';

/**
 * دالة رفع موحدة: إرسال FormData عبر XHR دون تعيين Content-Type أبداً
 * (المتصفح يضيف multipart/form-data; boundary=... تلقائياً — يمنع 415 خلف البروكسي/الـ CDN).
 * تُستخدم لجميع رفع الملفات: الطلبات، الاستوديو، الأدمن، إلخ.
 */
export function uploadFormData<T = unknown>(
  path: string,
  formData: FormData,
  options?: { method?: 'POST' | 'PUT'; query?: string; onProgress?: (percent: number) => void },
): Promise<{ data: T }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const token = getAuthToken();
    const baseURL = getBaseURL();
    const pathStr = path.startsWith('/') ? path : `/${path}`;
    const q = options?.query ? (pathStr.includes('?') ? `&${options.query}` : `?${options.query}`) : '';
    const url = path.startsWith('http') ? path : `${baseURL}${pathStr}${q}`;

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && options?.onProgress) {
        options.onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = xhr.responseText ? (JSON.parse(xhr.responseText) as T) : ({} as T);
          resolve({ data });
        } catch {
          reject(new Error('استجابة غير صالحة'));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText) as { detail?: string };
          reject(new Error(err.detail ?? `خطأ ${xhr.status}`));
        } catch {
          reject(new Error(`خطأ ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', () => reject(new Error('انقطع الاتصال أثناء الرفع')));
    xhr.addEventListener('abort', () => reject(new Error('تم إلغاء الرفع')));

    xhr.open(options?.method ?? 'POST', url);
    xhr.withCredentials = true;
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

/** رفع ملف طلبات مع تقدم — يستخدم uploadFormData الموحدة. */
function uploadWithProgress(
  url: string,
  formData: FormData,
  onProgress?: (percent: number) => void,
): Promise<UploadedFileResult> {
  return uploadFormData<UploadedFileResult>(url, formData, { onProgress }).then((r) => r.data);
}

export const ordersAPI = {
  upload: (file: File, onProgress?: (percent: number) => void): Promise<UploadedFileResult> => {
    const form = new FormData();
    form.append(UPLOAD_FIELD_NAME, file);
    return uploadWithProgress('/orders/upload', form, onProgress);
  },

  uploadBatch: async (
    files: File[],
    onProgress?: (percent: number) => void,
  ): Promise<UploadedFileResult[]> => {
    const results: UploadedFileResult[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;
      const result = await ordersAPI.upload(file, (filePct) => {
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

export interface SavedLocationItem {
  id: string;
  user_id: string;
  label: string;
  street?: string;
  neighborhood?: string;
  building_floor?: string;
  extra?: string;
  latitude: number | null;
  longitude: number | null;
  display_order: number;
  created_at: string;
  updated_at?: string;
}

export const savedLocationsAPI = {
  list: () => api.get<{ data: SavedLocationItem[] }>('/saved-locations/'),
  create: (data: {
    label: 'home' | 'work' | 'other';
    street?: string | null;
    neighborhood?: string | null;
    building_floor?: string | null;
    extra?: string | null;
    latitude: number;
    longitude: number;
  }) => api.post<SavedLocationItem>('/saved-locations/', data),
  update: (id: string, data: Partial<{ street: string | null; neighborhood: string | null; building_floor: string | null; extra: string | null; latitude: number; longitude: number }>) =>
    api.patch<SavedLocationItem>(`/saved-locations/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/saved-locations/${id}`),
};

const studioBaseUrl = (() => {
  const u = import.meta.env.VITE_API_URL as string || 'http://localhost:8000/api';
  return u.replace(/\/api\/?$/, '') || u;
})();

export function getStudioImageUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${studioBaseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** رفع الاستوديو عبر دالة الرفع الموحدة (XHR) لضمان multipart صحيح وتجنب 415. */
export const studioAPI = {
  removeBackground: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return uploadFormData<{ path: string; url: string }>('/studio/remove-background', form);
  },
  passportPhotos: (file: File, removeBgFirst?: boolean) => {
    const form = new FormData();
    form.append('file', file);
    const query = removeBgFirst ? 'removeBgFirst=true' : undefined;
    return uploadFormData<{ path: string; url: string }>('/studio/passport-photos', form, { query });
  },
  cropRotate: (
    file: File,
    options: { left?: number; top?: number; width?: number; height?: number; rotate?: number },
  ) => {
    const form = new FormData();
    form.append('file', file);
    const params = new URLSearchParams();
    if (options.left != null) params.set('left', String(options.left));
    if (options.top != null) params.set('top', String(options.top));
    if (options.width != null) params.set('width', String(options.width));
    if (options.height != null) params.set('height', String(options.height));
    if (options.rotate != null) params.set('rotate', String(options.rotate));
    const query = params.toString() || undefined;
    return uploadFormData<{ path: string; url: string }>('/studio/crop-rotate', form, { query });
  },
  addDpi: (file: File, dpi: number) => {
    const form = new FormData();
    form.append('file', file);
    return uploadFormData<{ path: string; url: string }>('/studio/add-dpi', form, { query: `dpi=${dpi}` });
  },
  applyFilter: (
    file: File,
    filter: 'grayscale' | 'sepia' | 'blur' | 'adjust',
    options?: { blurSigma?: number; brightness?: number; contrast?: number; saturation?: number },
  ) => {
    const form = new FormData();
    form.append('file', file);
    const params = new URLSearchParams();
    params.set('filter', filter);
    if (options?.blurSigma != null) params.set('blurSigma', String(options.blurSigma));
    if (options?.brightness != null) params.set('brightness', String(options.brightness));
    if (options?.contrast != null) params.set('contrast', String(options.contrast));
    if (options?.saturation != null) params.set('saturation', String(options.saturation));
    const query = params.toString() || undefined;
    return uploadFormData<{ path: string; url: string }>('/studio/apply-filter', form, { query });
  },
};
