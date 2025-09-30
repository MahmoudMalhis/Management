/* eslint-disable @typescript-eslint/no-explicit-any */
// ✅ FIXED: إنشاء معالج أخطاء موحد
// يحل مشكلة عدم توحيد أسلوب معالجة الأخطاء عبر التطبيق

import { ApiError } from "@/types";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

// ✅ FIXED: دالة موحدة لمعالجة أخطاء الـ API
// ✅ تحسين معالجة رسائل الأخطاء من السيرفر
export const handleApiError = (error: any): ApiError => {
  console.error("API Error:", error);

  // إذا كان الخطأ من الشبكة
  if (!error.response) {
    return {
      message: error.message || "خطأ في الاتصال بالسيرفر",
      status: 0,
      code: "NETWORK_ERROR",
    };
  }

  // ✅ استخدام الرسالة من السيرفر إذا كانت موجودة
  const serverMessage = error.response?.data?.message;
  const serverErrors = error.response?.data?.errors;

  // إذا كان هناك رسالة واضحة من السيرفر، استخدمها
  if (serverMessage) {
    return {
      message: serverMessage,
      status: error.response.status,
      code: error.response.data?.code || "SERVER_ERROR",
    };
  }

  // معالجة أخطاء التحقق
  if (serverErrors && Array.isArray(serverErrors)) {
    const messages = serverErrors.map((err: any) => err.msg).join(", ");
    return {
      message: messages || "خطأ في البيانات المدخلة",
      status: error.response.status,
      code: "VALIDATION_ERROR",
    };
  }

  // رسائل افتراضية حسب كود الحالة
  const statusMessages: Record<number, string> = {
    400: "البيانات المدخلة غير صحيحة",
    401: "اسم المستخدم أو كلمة المرور غير صحيحة",
    403: "ليس لديك صلاحية للوصول",
    404: "الصفحة المطلوبة غير موجودة",
    500: "حدث خطأ في السيرفر",
  };

  return {
    message: statusMessages[error.response.status] || "حدث خطأ غير متوقع",
    status: error.response.status,
    code: error.response.data?.code || "UNKNOWN_ERROR",
  };
};

// ✅ FIXED: دالة لعرض رسائل الخطأ بشكل موحد
export const showErrorToast = (error: any, customMessage?: string) => {
  const apiError = handleApiError(error);
  const message = customMessage || apiError.message;

  toast.error(message, {
    icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
    duration: 5000,
  });

  // تسجيل الخطأ في الكونسول للمطورين
  console.error("API Error:", apiError);
};

// ✅ FIXED: دالة للتحقق من صحة الاستجابة
export const validateResponse = <T,>(response: any): T => {
  if (!response || typeof response !== "object") {
    throw new Error("استجابة غير صالحة من السيرفر");
  }

  if (response.success === false) {
    throw new Error(response.message || "فشل في العملية");
  }

  return response.data || response;
};

// ✅ FIXED: دالة لمعالجة أخطاء النماذج
export const handleFormError = (
  error: any,
  setError: (error: string) => void
) => {
  const apiError = handleApiError(error);
  setError(apiError.message);
  showErrorToast(error);
};

// ✅ FIXED: دالة للتحقق من حالة الاستجابة
export const isSuccessResponse = (response: any): boolean => {
  return response && (response.success === true || response.status < 400);
};

// ✅ FIXED: أنواع مختلفة من الأخطاء
export const ERROR_TYPES = {
  NETWORK: "NETWORK",
  VALIDATION: "VALIDATION",
  AUTHENTICATION: "AUTHENTICATION",
  AUTHORIZATION: "AUTHORIZATION",
  SERVER: "SERVER",
  UNKNOWN: "UNKNOWN",
} as const;

// ✅ FIXED: تحديد نوع الخطأ
export const getErrorType = (error: any): keyof typeof ERROR_TYPES => {
  if (!error.response) return ERROR_TYPES.NETWORK;

  const status = error.response.status;

  if (status === 400) return ERROR_TYPES.VALIDATION;
  if (status === 401) return ERROR_TYPES.AUTHENTICATION;
  if (status === 403) return ERROR_TYPES.AUTHORIZATION;
  if (status >= 500) return ERROR_TYPES.SERVER;

  return ERROR_TYPES.UNKNOWN;
};

// ✅ FIXED: رسائل خطأ افتراضية حسب النوع
export const getDefaultErrorMessage = (
  errorType: keyof typeof ERROR_TYPES
): string => {
  const messages = {
    [ERROR_TYPES.NETWORK]: "خطأ في الاتصال بالإنترنت",
    [ERROR_TYPES.VALIDATION]: "البيانات المدخلة غير صحيحة",
    [ERROR_TYPES.AUTHENTICATION]: "يجب تسجيل الدخول أولاً",
    [ERROR_TYPES.AUTHORIZATION]: "ليس لديك صلاحية للوصول",
    [ERROR_TYPES.SERVER]: "خطأ في الخادم، حاول مرة أخرى",
    [ERROR_TYPES.UNKNOWN]: "حدث خطأ غير متوقع",
  };

  return messages[errorType];
};
