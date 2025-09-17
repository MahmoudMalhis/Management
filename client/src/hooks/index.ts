// ✅ FIXED: ملف index موحد لتصدير جميع الـ hooks
// يسهل استيراد الـ hooks من مكان واحد

// Async state management
export * from './useAsyncState';

// Form validation
export * from './useFormValidation';

// Mobile detection (existing)
export * from './use-mobile';

// Toast (existing)
export * from './use-toast';

// Re-export commonly used hooks
export {
  useAsyncState as useAsync,
  useAsyncOperation as useOperation,
} from './useAsyncState';

export {
  useFormValidation as useForm,
  useSimpleForm as useSimpleForm,
  commonValidationRules as validation,
} from './useFormValidation';