// ✅ FIXED: إنشاء ملف للوظائف المساعدة الموحدة
// يحل مشكلة تكرار الكود والوظائف المساعدة

import { DATE_FORMATS } from '@/constants';

// ✅ FIXED: دوال التاريخ والوقت
export const formatDate = (date: string | Date, format: keyof typeof DATE_FORMATS = 'DISPLAY'): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'تاريخ غير صالح';
    }

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: format === 'FULL' ? 'long' : 'short',
      day: 'numeric',
    };

    if (format === 'FULL') {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.second = '2-digit';
    }

    return dateObj.toLocaleDateString('ar-SA', options);
  } catch {
    return 'تاريخ غير صالح';
  }
};

// ✅ FIXED: دالة تحويل التاريخ لصيغة API
export const formatDateForApi = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

// ✅ FIXED: دالة حساب الوقت المنقضي
export const getTimeAgo = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
    if (diffInDays < 7) return `منذ ${diffInDays} يوم`;
    
    return formatDate(dateObj);
  } catch {
    return 'وقت غير صالح';
  }
};

// ✅ FIXED: دوال معالجة النصوص
export const truncateText = (text: string, maxLength: number = 100, suffix: string = '...'): string => {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength).trim() + suffix;
};

export const capitalizeFirst = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const removeExtraSpaces = (text: string): string => {
  return text?.trim().replace(/\s+/g, ' ') || '';
};

// ✅ FIXED: دوال التحقق من الصحة
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string, minLength: number = 6): boolean => {
  return password && password.length >= minLength;
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// ✅ FIXED: دوال الملفات
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
};

export const isImageFile = (filename: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
  const extension = getFileExtension(filename).toLowerCase();
  return imageExtensions.includes(extension);
};

// ✅ FIXED: دوال URL والمسارات
export const buildUrl = (baseUrl: string, path: string, params?: Record<string, any>): string => {
  let url = `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value));
      }
    });
    
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  
  return url;
};

export const getQueryParams = (search: string): Record<string, string> => {
  const params = new URLSearchParams(search);
  const result: Record<string, string> = {};
  
  params.forEach((value, key) => {
    result[key] = value;
  });
  
  return result;
};

// ✅ FIXED: دوال التحويل والتنسيق
export const parseNumber = (value: string | number): number => {
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

export const formatNumber = (num: number, decimals: number = 0): string => {
  return num.toLocaleString('ar-SA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

// ✅ FIXED: دوال المصفوفات والكائنات
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

export const sortBy = <T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

export const uniqueBy = <T>(array: T[], key: keyof T): T[] => {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

// ✅ FIXED: دوال التخزين المحلي
export const setLocalStorage = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

export const getLocalStorage = <T>(key: string, defaultValue?: T): T | undefined => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn('Failed to read from localStorage:', error);
    return defaultValue;
  }
};

export const removeLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to remove from localStorage:', error);
  }
};

// ✅ FIXED: دوال التأخير والأداء
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// ✅ FIXED: دالة تحميل الملفات
export const downloadFile = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};