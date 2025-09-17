// ✅ FIXED: تحديث ملف API مع توحيد معالجة الأخطاء والـ types
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { 
  ApiResponse, 
  Employee, 
  Accomplishment, 
  TaskTitle,
  EmployeeFilters,
  AccomplishmentFilters,
  PaginationParams 
} from '@/types';
import { API_URL, STORAGE_KEYS } from '@/constants';
import { handleApiError, validateResponse } from '@/utils/errorHandler';

// ✅ FIXED: استخدام الثوابت المعرفة في constants
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// ✅ FIXED: تحسين request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(handleApiError(error));
  }
);

// ✅ FIXED: إضافة response interceptor لمعالجة الأخطاء بشكل موحد
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // معالجة أخطاء المصادقة
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      window.location.href = '/login';
    }
    return Promise.reject(handleApiError(error));
  }
);

// ✅ FIXED: Authentication API calls مع types محددة
export const authAPI = {
  // ✅ FIXED: تحسين دالة تسجيل الدخول
  login: async (name: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> => {
    try {
      const response = await api.post('/auth/login', { name, password });
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // ✅ FIXED: تحسين دالة الحصول على المستخدم الحالي
  getCurrentUser: async (): Promise<ApiResponse<{ user: any }>> => {
    try {
      const response = await api.get('/auth/me');
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // ✅ FIXED: تحسين دالة تسجيل الموظفين
  registerEmployee: async (name: string, password: string): Promise<ApiResponse<Employee>> => {
    try {
      const response = await api.post('/auth/register', { name, password });
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // ✅ FIXED: تحسين دالة جلب الموظفين مع filters
  getEmployees: async (params: EmployeeFilters = {}): Promise<ApiResponse<Employee[]>> => {
    try {
      const response = await api.get("/auth/employees", { params });
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // ✅ FIXED: استعادة الموظف المؤرشف
  unarchiveEmployee: async (id: string): Promise<ApiResponse<Employee>> => {
    try {
      const response = await api.patch(`/auth/employees/${id}/unarchive`);
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // ✅ FIXED: جلب موظف محدد
  getEmployeeById: async (id: string): Promise<ApiResponse<Employee>> => {
    try {
      const response = await api.get(`/auth/employees/${id}`);
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // ✅ FIXED: حذف الموظف مع تحديد النوع
  deleteEmployee: async (id: string, mode: "hard" | "archive" = "archive"): Promise<ApiResponse<any>> => {
    try {
      const response = await api.delete(`/auth/employees/${id}`, { params: { mode } });
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// ✅ FIXED: Accomplishments API calls مع types محددة
export const accomplishmentsAPI = {
  // ✅ FIXED: إنشاء إنجاز جديد
  createAccomplishment: async (formData: FormData): Promise<ApiResponse<Accomplishment>> => {
    try {
      const response = await api.post('/accomplishments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // ✅ FIXED: جلب جميع الإنجازات مع filters
  getAccomplishments: async (filters: AccomplishmentFilters = {}): Promise<ApiResponse<Accomplishment[]>> => {
    try {
      const response = await api.get('/accomplishments', { params: filters });
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // ✅ FIXED: جلب إنجاز محدد
  getAccomplishment: async (id: string): Promise<ApiResponse<Accomplishment>> => {
    try {
      const response = await api.get(`/accomplishments/${id}`);
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // ✅ FIXED: إضافة تعليق
  addComment: async (id: string, text: string, versionIndex?: number): Promise<ApiResponse<Accomplishment>> => {
    try {
      const response = await api.post(`/accomplishments/${id}/comments`, { text, versionIndex });
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // ✅ FIXED: الرد على تعليق
  replyToComment: async (id: string, commentId: string, text: string): Promise<ApiResponse<Accomplishment>> => {
    try {
      const response = await api.post(`/accomplishments/${id}/comments/${commentId}/reply`, { text });
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // ✅ FIXED: مراجعة الإنجاز
  reviewAccomplishment: async (id: string, status: string): Promise<ApiResponse<Accomplishment>> => {
    try {
      const response = await api.put(`/accomplishments/${id}/review`, { status });
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // ✅ FIXED: تصدير الإنجازات
  exportAccomplishments: async (filters: AccomplishmentFilters = {}): Promise<any> => {
    try {
      const response = await api.get("/accomplishments/export", {
        params: filters,
        responseType: "blob",
      });
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // ✅ FIXED: تعديل الإنجاز
  modifyAccomplishment: async (id: string, formData: FormData): Promise<ApiResponse<Accomplishment>> => {
    try {
      const response = await api.put(`/accomplishments/${id}/modify`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // ✅ FIXED: بدء الإنجاز
  startAccomplishment: async (id: string, formData: FormData): Promise<ApiResponse<Accomplishment>> => {
    try {
      const response = await api.put(`/accomplishments/${id}/start`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// ✅ FIXED: Task Titles API calls مع معالجة أخطاء محسنة
export const taskTitlesAPI = {
  // ✅ FIXED: جلب جميع العناوين
  getAll: async (): Promise<TaskTitle[]> => {
    try {
      const response = await api.get('/task-titles');
      const data = validateResponse(response.data) as ApiResponse<TaskTitle[]>;
      return data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // ✅ FIXED: إضافة عنوان جديد
  add: async (name: string): Promise<TaskTitle> => {
    try {
      const response = await api.post('/task-titles', { name });
      const data = validateResponse(response.data) as ApiResponse<TaskTitle>;
      return data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // ✅ FIXED: تعديل عنوان
  edit: async (id: string, name: string): Promise<TaskTitle> => {
    try {
      const response = await api.put(`/task-titles/${id}`, { name });
      const data = validateResponse(response.data) as ApiResponse<TaskTitle>;
      return data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // ✅ FIXED: حذف عنوان
  remove: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/task-titles/${id}`);
      return true;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// ✅ FIXED: Comparisons API مع types محددة
export const comparisonsAPI = {
  create: async (payload: {
    name?: string;
    employeeIds: string[];
    notes?: string;
    range?: "all"|"week"|"month"|"year"|"custom";
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> => {
    try {
      const response = await api.post('/comparisons', payload);
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  list: async (): Promise<ApiResponse<any[]>> => {
    try {
      const response = await api.get('/comparisons');
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  get: async (id: string): Promise<ApiResponse<any>> => {
    try {
      const response = await api.get(`/comparisons/${id}`);
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  update: async (id: string, payload: Partial<{
    name: string; 
    notes: string; 
    range: string; 
    startDate: string; 
    endDate: string; 
    employeeIds: string[];
  }>): Promise<ApiResponse<any>> => {
    try {
      const response = await api.put(`/comparisons/${id}`, payload);
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  remove: async (id: string): Promise<ApiResponse<any>> => {
    try {
      const response = await api.delete(`/comparisons/${id}`);
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// ✅ FIXED: Notifications API مع pagination محسنة
export const notificationsAPI = {
  get: async (page = 1, limit = 20): Promise<ApiResponse<any>> => {
    try {
      const response = await api.get("/notifications", { params: { page, limit } });
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  markAllRead: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await api.post("/notifications/mark-all-read");
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  markRead: async (id: string): Promise<ApiResponse<any>> => {
    try {
      const response = await api.put(`/notifications/${id}/read`);
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default api;