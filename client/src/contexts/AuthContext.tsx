// ✅ FIXED: تحديث AuthContext مع استخدام Types موحدة ومعالجة أخطاء محسنة
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CheckCircle, AlertTriangle } from "lucide-react";

// ✅ FIXED: استيراد Types والثوابت
import { User } from "@/types";
import { STORAGE_KEYS } from "@/constants";
import { authAPI } from "@/api/api";
import { handleApiError, showErrorToast } from "@/utils/errorHandler";

// ✅ FIXED: تحسين interface لـ AuthContext
interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (name: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isManager: boolean;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// ✅ FIXED: تحسين AuthProvider مع معالجة أخطاء أفضل
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { t } = useTranslation();

  // ✅ FIXED: دالة تنظيف الخطأ
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ✅ FIXED: دالة تحديث بيانات المستخدم
  const refreshUser = useCallback(async () => {
    if (!token) return;

    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (err) {
      console.error("Failed to refresh user:", err);
      // لا نعرض خطأ هنا لأنه قد يكون token منتهي الصلاحية
      logout();
    }
  }, [token]);

  // ✅ FIXED: تحسين التحقق من صحة الـ token
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authAPI.getCurrentUser();
        setUser(response.user);
        setIsAuthenticated(true);
        setError(null);
      } catch (err) {
        console.error("Auth verification failed:", err);

        // إزالة الـ token المنتهي الصلاحية
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);

        const apiError = handleApiError(err);
        setError(apiError.message);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  // ✅ FIXED: تحسين دالة تسجيل الدخول
  const login = useCallback(
    async (name: string, password: string) => {
      try {
        setLoading(true);
        setError(null);

        const response = await authAPI.login(name, password);
        const { token: newToken, user: userData } = response;

        // حفظ الـ token
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newToken);
        setToken(newToken);
        setUser(userData);
        setIsAuthenticated(true);

        // عرض رسالة نجاح
        toast.success(t("common.success"), {
          icon: <CheckCircle className="text-green-500" />,
          description: `${t("auth.login")} ${t(
            "common.success"
          ).toLowerCase()}`,
        });
      } catch (err) {
        console.error("Login error:", err);

        const apiError = handleApiError(err);
        setError(apiError.message);

        toast.error(t("common.error"), {
          icon: <AlertTriangle className="text-red-500" />,
          description: apiError.message,
        });

        throw err; // إعادة throw للمكونات التي تستدعي login
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  // ✅ FIXED: تحسين دالة تسجيل الخروج
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setError(null);

    // يمكن إضافة إشعار تسجيل الخروج هنا إذا لزم الأمر
    toast.info(t("auth.logout"), {
      description: "تم تسجيل الخروج بنجاح",
    });
  }, [t]);

  // ✅ FIXED: تحسين التحقق من كون المستخدم مدير
  const isManager = user?.role === "manager";

  // ✅ FIXED: قيم الـ context
  const value: AuthContextType = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    isAuthenticated,
    isManager,
    clearError,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ✅ FIXED: تحسين hook مع معالجة خطأ أفضل
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

// ✅ FIXED: hook مساعد للتحقق من الصلاحيات
export const usePermissions = () => {
  const { user, isManager } = useAuth();

  return {
    canManageEmployees: isManager,
    canViewEmployees: isManager,
    canAddEmployees: isManager,
    canDeleteEmployees: isManager,
    canCompareEmployees: isManager,
    canManageTaskTitles: isManager,
    canExportData: isManager,
    canAccessGallery: isManager,
    canReviewAccomplishments: isManager,
    canAddAccomplishments: true, // كل المستخدمين يمكنهم إضافة إنجازات
    canViewOwnAccomplishments: true,
    canModifyOwnAccomplishments: user?.role === "employee",
  };
};
