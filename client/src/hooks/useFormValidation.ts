/* eslint-disable @typescript-eslint/no-explicit-any */
// ✅ FIXED: إصلاح useFormValidation مع logic محسن
import { useState, useCallback, useMemo } from 'react';
import { isValidEmail, isValidPassword, removeExtraSpaces } from '@/utils/helpers';

// ✅ FIXED: Types للتحقق من الصحة
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  password?: boolean;
  custom?: (value: any, allValues?: any) => string | null;
  message?: string;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface FormErrors {
  [key: string]: string;
}

export interface FormValues {
  [key: string]: any;
}

// ✅ FIXED: Hook للتحقق من النماذج مع إصلاحات
export const useFormValidation = <T extends FormValues>(
  initialValues: T,
  validationRules: ValidationRules = {}
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ FIXED: التحقق من حقل واحد مع تمرير جميع القيم
  const validateField = useCallback((name: string, value: any, allValues = values): string => {
    const rule = validationRules[name];
    if (!rule) return '';

    const stringValue = String(value || '').trim();

    // Required validation
    if (rule.required && !stringValue) {
      return rule.message || `${name} مطلوب`;
    }

    // Skip other validations if field is empty and not required
    if (!stringValue && !rule.required) {
      return '';
    }

    // MinLength validation
    if (rule.minLength && stringValue.length < rule.minLength) {
      return rule.message || `${name} يجب أن يكون ${rule.minLength} أحرف على الأقل`;
    }

    // MaxLength validation
    if (rule.maxLength && stringValue.length > rule.maxLength) {
      return rule.message || `${name} يجب أن يكون ${rule.maxLength} أحرف أو أقل`;
    }

    // Email validation
    if (rule.email && !isValidEmail(stringValue)) {
      return rule.message || 'البريد الإلكتروني غير صالح';
    }

    // Password validation
    if (rule.password && !isValidPassword(stringValue, rule.minLength || 6)) {
      return rule.message || `كلمة المرور يجب أن تكون ${rule.minLength || 6} أحرف على الأقل`;
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(stringValue)) {
      return rule.message || `${name} غير صالح`;
    }

    // ✅ FIXED: Custom validation مع تمرير جميع القيم
    if (rule.custom) {
      const customError = rule.custom(value, allValues);
      if (customError) {
        return customError;
      }
    }

    return '';
  }, [validationRules, values]);

  // ✅ FIXED: التحقق من جميع الحقول
  const validateAll = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName], values);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validationRules, validateField]);

  // ✅ FIXED: تحديث قيمة حقل مع تنظيف الأخطاء
  const setValue = useCallback((name: string, value: any) => {
    const newValues = { ...values, [name]: value };
    setValues(newValues);
    
    // ✅ FIXED: إعادة التحقق من الحقل مع القيم الجديدة فقط إذا تم لمسه
    if (touched[name]) {
      const error = validateField(name, value, newValues);
      setErrors(prev => ({ ...prev, [name]: error }));
    }

    // ✅ FIXED: إعادة التحقق من الحقول المترابطة (مثل confirmPassword)
    if (name === 'password' && touched.confirmPassword) {
      const confirmPasswordError = validateField('confirmPassword', newValues.confirmPassword, newValues);
      setErrors(prev => ({ ...prev, confirmPassword: confirmPasswordError }));
    }
  }, [values, touched, validateField]);

  // ✅ FIXED: تحديث عدة قيم
  const setMultipleValues = useCallback((newValues: Partial<T>) => {
    const updatedValues = { ...values, ...newValues };
    setValues(updatedValues);
  }, [values]);

  // ✅ FIXED: معالج تغيير الحقل
  const handleChange = useCallback((name: string) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = event.target.type === 'checkbox' 
      ? (event.target as HTMLInputElement).checked
      : removeExtraSpaces(event.target.value);
    
    setValue(name, value);
  }, [setValue]);

  // ✅ FIXED: معالج blur للحقل مع تحسين
  const handleBlur = useCallback((name: string) => () => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // التحقق من الحقل فقط عند blur
    const error = validateField(name, values[name], values);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validateField, values]);

  // ✅ FIXED: تنظيف النموذج
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // ✅ FIXED: تعيين خطأ محدد
  const setFieldError = useCallback((name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  // ✅ FIXED: مسح خطأ محدد
  const clearFieldError = useCallback((name: string) => {
    setErrors(prev => ({ ...prev, [name]: '' }));
  }, []);

  // ✅ FIXED: معالج إرسال النموذج
  const handleSubmit = useCallback((onSubmit: (values: T) => Promise<void> | void) => 
    async (event?: React.FormEvent) => {
      if (event) {
        event.preventDefault();
      }

      // تعليم جميع الحقول كملموسة
      const allTouched = Object.keys(validationRules).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setTouched(allTouched);

      setIsSubmitting(true);

      try {
        const isValid = validateAll();
        if (!isValid) {
          console.log('Form validation failed:', errors);
          return;
        }

        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    }, [values, validationRules, validateAll, errors]);

  // ✅ FIXED: حالة النموذج مع تحسين
  const isValid = useMemo(() => {
    // فقط تحقق من الحقول الملموسة لتجنب عرض أخطاء مبكرة
    return Object.keys(touched).every(fieldName => {
      if (!validationRules[fieldName]) return true;
      return !validateField(fieldName, values[fieldName], values);
    });
  }, [values, validationRules, validateField, touched]);

  const hasErrors = useMemo(() => {
    return Object.values(errors).some(error => !!error);
  }, [errors]);

  const isDirty = useMemo(() => {
    return Object.keys(values).some(key => values[key] !== initialValues[key]);
  }, [values, initialValues]);

  // ✅ FIXED: helper functions للحقول
  const getFieldProps = useCallback((name: string) => ({
    name,
    value: values[name] || '',
    onChange: handleChange(name),
    onBlur: handleBlur(name),
    error: touched[name] ? errors[name] : '',
  }), [values, errors, touched, handleChange, handleBlur]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    hasErrors,
    isDirty,
    setValue,
    setMultipleValues,
    setFieldError,
    clearFieldError,
    handleChange,
    handleBlur,
    handleSubmit,
    validateField,
    validateAll,
    reset,
    getFieldProps,
    setIsSubmitting,
  };
};

// ✅ FIXED: Hook مبسط للنماذج البسيطة
export const useSimpleForm = <T extends FormValues>(initialValues: T) => {
  const [values, setValues] = useState<T>(initialValues);
  const [loading, setLoading] = useState(false);

  const setValue = useCallback((name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleChange = useCallback((name: string) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = event.target.type === 'checkbox' 
      ? (event.target as HTMLInputElement).checked
      : event.target.value;
    
    setValue(name, value);
  }, [setValue]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setLoading(false);
  }, [initialValues]);

  const handleSubmit = useCallback((onSubmit: (values: T) => Promise<void> | void) => 
    async (event?: React.FormEvent) => {
      if (event) {
        event.preventDefault();
      }

      setLoading(true);
      try {
        await onSubmit(values);
      } finally {
        setLoading(false);
      }
    }, [values]);

  return {
    values,
    loading,
    setValue,
    setValues,
    handleChange,
    handleSubmit,
    reset,
    setLoading,
  };
};

// ✅ FIXED: قواعد التحقق الشائعة مع تحسين
export const commonValidationRules = {
  required: (message?: string): ValidationRule => ({
    required: true,
    message: message || 'هذا الحقل مطلوب',
  }),

  email: (message?: string): ValidationRule => ({
    email: true,
    message: message || 'البريد الإلكتروني غير صالح',
  }),

  password: (minLength = 6, message?: string): ValidationRule => ({
    password: true,
    minLength,
    message: message || `كلمة المرور يجب أن تكونمن ${minLength} أحرف على الأقل`,
  }),

  minLength: (length: number, message?: string): ValidationRule => ({
    minLength: length,
    message: message || `يجب أن يكون ${length} أحرف على الأقل`,
  }),

  maxLength: (length: number, message?: string): ValidationRule => ({
    maxLength: length,
    message: message || `يجب أن يكون ${length} أحرف أو أقل`,
  }),

  // ✅ FIXED: تحسين confirmPassword rule
  confirmPassword: (passwordField: string = 'password', message?: string): ValidationRule => ({
    custom: (value: string, allValues: any) => {
      if (!value) return null; // إذا كان فارغ، خلي required rule يتعامل معه
      if (value !== allValues?.[passwordField]) {
        return message || 'كلمة المرور غير متطابقة';
      }
      return null;
    },
    message: message || 'كلمة المرور غير متطابقة',
  }),
};