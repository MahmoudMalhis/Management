/* eslint-disable @typescript-eslint/no-explicit-any */
// ✅ FIXED: إصلاح api.ts - إزالة Authorization header من register
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

// إعداد axios مع timeout وتحسينات CORS
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false,
});

// ✅ FIXED: تحسين request interceptor - استثناء register من Authorization
api.interceptors.request.use(
  (config) => {
    // ✅ FIXED: لا تضف Authorization header للـ register و login
    const publicEndpoints = ['/auth/login'];
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      config.url?.includes(endpoint)
    );

    if (!isPublicEndpoint) {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // للـ FormData، دع المتصفح يحدد Content-Type
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
  
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(handleApiError(error));
  }
);

// تحسين response interceptor
api.interceptors.response.use(
  (response) => {
    
    return response;
  },
  (error) => {
    console.error('Response error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
    });
    
    // معالجة أخطاء المصادقة
    if (error.response?.status === 401) {
      const publicEndpoints = ['/auth/login', '/auth/register'];
      const isPublicEndpoint = publicEndpoints.some(endpoint =>
        error.config?.url?.includes(endpoint)
      );
      
      if (!isPublicEndpoint) {
        // فقط نحذف التوكن ونعيد التوجيه للصفحات المحمية
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(handleApiError(error));
  }
);

// ✅ FIXED: تحسين authAPI
export const authAPI = {
  login: async (name: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> => {
    try {      
      const response = await api.post('/auth/login', { name, password });
      return validateResponse(response.data);
    } catch (error) {
      console.error('Login error:', error);
      throw handleApiError(error);
    }
  },

  getCurrentUser: async (): Promise<ApiResponse<{ user: any }>> => {
    try {
      const response = await api.get('/auth/me');
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // ✅ FIXED: تحسين registerEmployee - إزالة أي headers إضافية
  registerEmployee: async (name: string, password: string): Promise<ApiResponse<Employee>> => {
    try {
      console.log('Registering employee:', { name, passwordLength: password.length });
      
      // التأكد من البيانات
      if (!name || !name.trim()) {
        throw new Error('اسم الموظف مطلوب');
      }
      
      if (!password || password.length < 6) {
        throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      }

      const requestData = {
        name: name.trim(),
        password: password
      };

      console.log('Sending registration request:', requestData);

      const response = await api.post('/auth/register', requestData);
      
      console.log('Registration response:', {
        status: response.status,
        success: response.data?.success,
        hasData: !!response.data?.data
      });

      return validateResponse(response.data);
    } catch (error) {
      console.error('Registration error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw handleApiError(error);
    }
  },

  getEmployees: async (params: EmployeeFilters = {}): Promise<ApiResponse<Employee[]>> => {
    try {
      const response = await api.get("/auth/employees", { params });
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  unarchiveEmployee: async (id: string): Promise<ApiResponse<Employee>> => {
    try {
      const response = await api.patch(`/auth/employees/${id}/unarchive`);
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getEmployeeById: async (id: string): Promise<ApiResponse<Employee>> => {
    try {
      const response = await api.get(`/auth/employees/${id}`);
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  deleteEmployee: async (id: string, mode: "hard" | "archive" = "archive"): Promise<ApiResponse<any>> => {
    try {
      const response = await api.delete(`/auth/employees/${id}`, { params: { mode } });
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// باقي الكود يبقى كما هو...
export const accomplishmentsAPI = {
createAccomplishment: async (
  formData: FormData
): Promise<Accomplishment> => {
  try {
    const response = await api.post('/accomplishments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data as Accomplishment; // مباشرة accomplishment
  } catch (error) {
    throw handleApiError(error);
  }
},


  getAccomplishments: async (filters: AccomplishmentFilters = {}): Promise<ApiResponse<Accomplishment[]>> => {
    try {
      const response = await api.get('/accomplishments', { params: filters });
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getAccomplishment: async (id: string): Promise<ApiResponse<Accomplishment>> => {
    try {
      const response = await api.get(`/accomplishments/${id}`);
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  addComment: async (id: string, text: string, versionIndex?: number): Promise<ApiResponse<Accomplishment>> => {
    try {
      const response = await api.post(`/accomplishments/${id}/comments`, { text, versionIndex });
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  replyToComment: async (id: string, commentId: string, text: string): Promise<ApiResponse<Accomplishment>> => {
    try {
      const response = await api.post(`/accomplishments/${id}/comments/${commentId}/reply`, { text });
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  reviewAccomplishment: async (id: string, status: string): Promise<ApiResponse<Accomplishment>> => {
    try {
      const response = await api.put(`/accomplishments/${id}/review`, { status });
      return validateResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

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

export const taskTitlesAPI = {
  getAll: async (): Promise<TaskTitle[]> => {
    try {
      const response = await api.get('/task-titles');
      const data = validateResponse(response.data) as ApiResponse<TaskTitle[]>;
      return data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  add: async (name: string): Promise<TaskTitle> => {
    try {
      const response = await api.post('/task-titles', { name });
      const data = validateResponse(response.data) as ApiResponse<TaskTitle>;
      return data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  edit: async (id: string, name: string): Promise<TaskTitle> => {
    try {
      const response = await api.put(`/task-titles/${id}`, { name });
      const data = validateResponse(response.data) as ApiResponse<TaskTitle>;
      return data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  remove: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/task-titles/${id}`);
      return true;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

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