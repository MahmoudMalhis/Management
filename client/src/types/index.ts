// ✅ FIXED: إنشاء ملف types موحد لجميع الـ interfaces والـ types
// هذا الملف يحل مشكلة عدم توحيد الـ types عبر التطبيق

export interface User {
  _id: string;
  id: string;
  name: string;
  role: "manager" | "employee";
  status?: "active" | "archived";
  createdAt?: string;
}

export interface Employee extends User {
  role: "manager" | "employee";
}

export interface TaskTitle {
  _id: string;
  name: string;
}

export interface FileData {
  _id?: string;
  fileName: string;
  filePath?: string;
  fileType?: string;
  file?: File;
}

export interface Comment {
  _id: string;
  text: string;
  createdAt: string;
  isReply?: boolean;
  replyTo?: string;
  versionIndex?: number;
  commentedBy: {
    _id: string,
    name: string,
    role: "manager" | "employee",
  };
}

export interface AccomplishmentVersion {
  description: string;
  files: FileData[];
  modifiedAt: string;
  _id: string;
}

export interface Accomplishment {
  _id: string;
  description: string;
  status: "pending" | "reviewed" | "needs_modification" | "assigned";
  createdAt: string;
  lastContentModifiedAt?: string;
  originalDescription?: string;
  originalFiles?: FileData[];
  files: FileData[];
  comments: Comment[];
  previousVersions?: AccomplishmentVersion[];
  employee: {
    _id: string,
    name: string,
  };
  employeeInfo?: {
    _id: string,
    name: string,
  };
  taskTitleInfo?: {
    _id: string,
    name: string,
  };
}

export interface Notification {
  _id: string;
  type: "new_task" | "comment" | "reply" | "review";
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: {
    accomplishmentId?: string,
    [key: string]: any,
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
  totalCount?: number;
  totalPages?: number;
  currentPage?: number;
}

export interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface EmployeeFilters {
  status?: "active" | "archived";
}

export interface AccomplishmentFilters {
  employee?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export type LoadingState = "idle" | "loading" | "success" | "error";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Gallery Types
export interface GalleryFile {
  _id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fromAccomplishment?: string;
}

export interface GalleryFolder {
  _id: string;
  name: string;
  files: GalleryFile[];
  filesCount: number;
}

// Comparison Types
export type QuickRange = "all" | "week" | "month" | "year" | "custom";

export interface SavedComparison {
  _id: string;
  name?: string;
  notes?: string;
  employeeIds: string[];
  range: QuickRange;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

// Form Types
export interface LoginFormData {
  name: string;
  password: string;
}

export interface EmployeeFormData {
  name: string;
  password: string;
  confirmPassword: string;
}

// Socket Types
export interface AccomplishmentSocketData {
  _id: string;
  description: string;
  employee: {
    _id: string,
    name: string,
  };
  createdAt: string;
}
