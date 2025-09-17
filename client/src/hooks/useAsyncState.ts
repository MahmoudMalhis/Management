// ✅ FIXED: إنشاء hook موحد لإدارة الـ loading states
// يحل مشكلة تكرار كود إدارة الحالات غير المتزامنة

import { useState, useCallback } from 'react';
import { AsyncState, LoadingState } from '@/types';
import { handleApiError, showErrorToast } from '@/utils/errorHandler';

// ✅ FIXED: Hook موحد للحالات غير المتزامنة
export const useAsyncState = <T>() => {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const [loadingState, setLoadingState] = useState<LoadingState>('idle');

  // ✅ FIXED: دالة تنفيذ العمليات غير المتزامنة
  const execute = useCallback(async (
    asyncFunction: () => Promise<T>,
    options?: {
      showSuccessToast?: boolean;
      successMessage?: string;
      showErrorToast?: boolean;
      customErrorMessage?: string;
    }
  ) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      setLoadingState('loading');

      const result = await asyncFunction();
      
      setState({
        data: result,
        loading: false,
        error: null,
      });
      setLoadingState('success');

      if (options?.showSuccessToast) {
        // يمكن إضافة toast للنجاح هنا إذا لزم الأمر
      }

      return result;
    } catch (error) {
      const apiError = handleApiError(error);
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: apiError.message,
      }));
      setLoadingState('error');

      if (options?.showErrorToast !== false) {
        showErrorToast(error, options?.customErrorMessage);
      }

      throw error;
    }
  }, []);

  // ✅ FIXED: دالة إعادة تعيين الحالة
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
    setLoadingState('idle');
  }, []);

  // ✅ FIXED: دالة تحديث البيانات
  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  // ✅ FIXED: دالة تحديث حالة الخطأ
  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, error, loading: false }));
    setLoadingState('error');
  }, []);

  return {
    ...state,
    loadingState,
    execute,
    reset,
    setData,
    setError,
    isLoading: state.loading,
    isError: loadingState === 'error',
    isSuccess: loadingState === 'success',
    isIdle: loadingState === 'idle',
  };
};

// ✅ FIXED: Hook مخصص للعمليات البسيطة
export const useAsyncOperation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async <T>(
    operation: () => Promise<T>,
    options?: {
      onSuccess?: (result: T) => void;
      onError?: (error: any) => void;
      showErrorToast?: boolean;
    }
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await operation();
      
      setLoading(false);
      options?.onSuccess?.(result);
      
      return result;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
      setLoading(false);

      if (options?.showErrorToast !== false) {
        showErrorToast(err);
      }

      options?.onError?.(err);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    reset,
    setError,
  };
};