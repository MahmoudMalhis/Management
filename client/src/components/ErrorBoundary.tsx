// ✅ FIXED: إضافة Error Boundary لمعالجة الأخطاء على مستوى التطبيق
// يحل مشكلة عدم وجود معالج أخطاء شامل

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

// ✅ FIXED: مكون Error Boundary كلاس
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // يمكن إضافة خدمة تتبع الأخطاء هنا (مثل Sentry)
    // logErrorToService(error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      // يمكن تخصيص العرض حسب الحاجة
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200 p-4">
          <Card className="glass-card border-none max-w-lg w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-16 w-16 text-red-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-red-600">
                حدث خطأ غير متوقع
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                نعتذر، حدث خطأ أثناء تحميل التطبيق. يرجى المحاولة مرة أخرى.
              </p>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="bg-gray-100 p-4 rounded-lg">
                  <summary className="cursor-pointer font-semibold mb-2">
                    تفاصيل الخطأ (بيئة التطوير)
                  </summary>
                  <pre className="text-xs overflow-auto max-h-40">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-2 justify-center">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="glass-btn"
                >
                  المحاولة مرة أخرى
                </Button>
                <Button
                  onClick={this.handleReload}
                  className="glass-btn flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  إعادة تحميل الصفحة
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// ✅ FIXED: HOC للصفحات المحددة
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
};

// ✅ FIXED: مكون خطأ مبسط للأجزاء الصغيرة
export const SimpleErrorFallback: React.FC<{
  error?: Error;
  resetError?: () => void;
  message?: string;
}> = ({ error, resetError, message }) => (
  <div className="p-4 text-center">
    <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
    <p className="text-red-600 mb-3">
      {message || "حدث خطأ أثناء تحميل هذا الجزء"}
    </p>
    {resetError && (
      <Button onClick={resetError} size="sm" variant="outline">
        المحاولة مرة أخرى
      </Button>
    )}
    {process.env.NODE_ENV === "development" && error && (
      <details className="mt-3 text-xs text-left">
        <summary>تفاصيل الخطأ</summary>
        <pre className="bg-gray-100 p-2 rounded mt-1 overflow-auto">
          {error.toString()}
        </pre>
      </details>
    )}
  </div>
);
