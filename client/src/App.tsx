// ✅ FIXED: تحديث App.tsx مع إضافة Error Boundary والتحسينات
import { Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./i18n";

// ✅ FIXED: استيراد الـ types والـ constants
import { User } from "@/types";
import { ROUTES, STORAGE_KEYS } from "@/constants";

// ✅ FIXED: استيراد Error Boundary
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Contexts
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";

// Pages - ✅ FIXED: تنظيم الاستيراد
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EmployeeList from "./pages/EmployeeList";
import AddEmployee from "./pages/AddEmployee";
import AccomplishmentsList from "./pages/AccomplishmentsList";
import AddAccomplishment from "./pages/AddAccomplishment";
import AccomplishmentDetails from "./pages/AccomplishmentDetails";
import CompareEmployees from "./pages/CompareEmployees";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import GalleryPage from "./pages/Gallery";
import AdminTaskTitles from "./pages/AdminTaskTitles";
import NotificationsPage from "./pages/NotificationsPage";
import ArchivedEmployees from "./pages/ArchivedEmployees";
import SavedComparisonsPage from "./pages/SavedComparisonsPage";

// ✅ FIXED: تحسين إعدادات QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// ✅ FIXED: تحسين مكون ProtectedRoute مع types
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | null;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole = null,
}) => {
  const { isAuthenticated, user, loading } = useAuth();

  // ✅ FIXED: تحسين loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
};

// ✅ FIXED: تحسين مكون AppContent مع معالجة الأخطاء
const AppContent: React.FC = () => {
  const { i18n } = useTranslation();

  // ✅ FIXED: تحسين إدارة الاتجاه واللغة
  useEffect(() => {
    const savedLanguage = localStorage.getItem(STORAGE_KEYS.LANGUAGE) || "ar";

    if (i18n.language !== savedLanguage) {
      i18n.changeLanguage(savedLanguage);
    }

    const updateDirection = (language: string) => {
      const direction = language === "ar" ? "rtl" : "ltr";
      document.documentElement.dir = direction;
      document.documentElement.lang = language;
      document.body.dir = direction;
    };

    updateDirection(savedLanguage);

    // ✅ FIXED: إضافة listener لتغيير اللغة
    const handleLanguageChange = (lng: string) => {
      updateDirection(lng);
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, lng);
    };

    i18n.on("languageChanged", handleLanguageChange);

    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, [i18n]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path={ROUTES.LOGIN} element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="task-titles" element={<AdminTaskTitles />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="accomplishments" element={<AccomplishmentsList />} />
            <Route path="accomplishments/add" element={<AddAccomplishment />} />
            <Route
              path="accomplishments/:id"
              element={<AccomplishmentDetails />}
            />

            {/* ✅ FIXED: Routes للمدير فقط */}
            <Route
              path="employees"
              element={
                <ProtectedRoute requiredRole="manager">
                  <EmployeeList />
                </ProtectedRoute>
              }
            />
            <Route
              path="employees/add"
              element={
                <ProtectedRoute requiredRole="manager">
                  <AddEmployee />
                </ProtectedRoute>
              }
            />
            <Route
              path="employees/compare"
              element={
                <ProtectedRoute requiredRole="manager">
                  <CompareEmployees />
                </ProtectedRoute>
              }
            />
            <Route
              path="employees/archived"
              element={
                <ProtectedRoute requiredRole="manager">
                  <ArchivedEmployees />
                </ProtectedRoute>
              }
            />
            <Route
              path="comparisons"
              element={
                <ProtectedRoute requiredRole="manager">
                  <SavedComparisonsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

// ✅ FIXED: تحسين المكون الرئيسي مع Loading Fallback
const LoadingFallback: React.FC = () => (
  <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#dbeafe] via-[#e3e7fa] to-[#bdd7f6]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">جاري التحميل...</p>
    </div>
  </div>
);

const App: React.FC = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <NotificationsProvider>
            <Suspense fallback={<LoadingFallback />}>
              <TooltipProvider>
                <Toaster />
                <AppContent />
              </TooltipProvider>
            </Suspense>
          </NotificationsProvider>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
