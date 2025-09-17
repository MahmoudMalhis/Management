/* eslint-disable @typescript-eslint/no-explicit-any */
// ✅ FIXED: إنشاء ملف constants موحد للثوابت
// يحل مشكلة تشتت الثوابت وعدم توحيد أسلوب التسمية

// API Constants
export const API_BASE_URL: string = 
  (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
export const API_URL = `${API_BASE_URL}/api`;

// Socket Constants
export const SOCKET_URL: string = API_BASE_URL;

// Storage Keys - ✅ FIXED: توحيد تسمية مفاتيح التخزين
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'token',
  LANGUAGE: 'lang',
  SIDEBAR_STATE: 'sidebar:state',
} as const;

// Sidebar Constants
export const SIDEBAR_CONFIG = {
  COOKIE_MAX_AGE: 60 * 60 * 24 * 7, // 7 days
  WIDTH: '16rem',
  WIDTH_MOBILE: '18rem',
  WIDTH_ICON: '3rem',
  KEYBOARD_SHORTCUT: 'b',
} as const;

// Pagination Constants
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  DEFAULT_PAGE: 1,
  MAX_PAGE_SIZE: 100,
} as const;

// File Upload Constants
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'text/plain'],
} as const;

// Toast Constants
export const TOAST_CONFIG = {
  DURATION: 4000,
  LIMIT: 3,
  REMOVE_DELAY: 1000000,
} as const;

// Status Constants
export const ACCOMPLISHMENT_STATUS = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  NEEDS_MODIFICATION: 'needs_modification',
  ASSIGNED: 'assigned',
} as const;

export const USER_ROLES = {
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
} as const;

export const USER_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
} as const;

// Date Format Constants
export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  API: 'yyyy-MM-dd',
  FULL: 'dd/MM/yyyy HH:mm:ss',
} as const;

// Route Constants
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  ACCOMPLISHMENTS: '/accomplishments',
  ACCOMPLISHMENTS_ADD: '/accomplishments/add',
  ACCOMPLISHMENTS_DETAILS: '/accomplishments/:id',
  EMPLOYEES: '/employees',
  EMPLOYEES_ADD: '/employees/add',
  EMPLOYEES_COMPARE: '/employees/compare',
  EMPLOYEES_ARCHIVED: '/employees/archived',
  GALLERY: '/gallery',
  TASK_TITLES: '/task-titles',
  NOTIFICATIONS: '/notifications',
  COMPARISONS: '/comparisons',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  NEW_TASK: 'new_task',
  COMMENT: 'comment',
  REPLY: 'reply',
  REVIEW: 'review',
} as const;

// Time Ranges
export const TIME_RANGES = {
  ALL: 'all',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
  CUSTOM: 'custom',
} as const;

// Loading States
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;