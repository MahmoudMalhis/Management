// ✅ FIXED: تحديث AddEmployee مع جميع التحسينات المطلوبة
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  CheckCircle,
  AlertTriangle,
  LucideArrowLeft,
  LucideUserPlus,
} from "lucide-react";

// ✅ FIXED: استيراد Types والثوابت
import { EmployeeFormData } from "@/types";
import { ROUTES } from "@/constants";
import { authAPI } from "@/api/api";
import { showErrorToast } from "@/utils/errorHandler";
import {
  useFormValidation,
  commonValidationRules,
} from "@/hooks/useFormValidation";

// ✅ FIXED: استيراد مكونات UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FormCard from "@/components/FormCard";
import FormActions from "@/components/FormActions";
import { Alert, AlertDescription } from "@/components/ui/alert";

// ✅ FIXED: قواعد التحقق للنموذج
const getValidationRules = (t: any) => ({
  name: {
    ...commonValidationRules.required(
      t("employees.name") + " " + t("common.required")
    ),
    ...commonValidationRules.minLength(
      2,
      t("employees.name") + " يجب أن يكون حرفين على الأقل"
    ),
    ...commonValidationRules.maxLength(
      50,
      t("employees.name") + " يجب أن يكون 50 حرف أو أقل"
    ),
  },
  password: {
    ...commonValidationRules.password(6, t("employees.passwordMinLength")),
  },
  confirmPassword: {
    ...commonValidationRules.required("تأكيد كلمة المرور مطلوب"),
    custom: (value: string, values?: EmployeeFormData) => {
      if (value !== values?.password) {
        return "كلمة المرور غير متطابقة";
      }
      return null;
    },
  },
});

// ✅ FIXED: المكون الرئيسي مع التحسينات
const AddEmployee: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // ✅ FIXED: استخدام hook التحقق من النماذج
  const {
    values,
    errors,
    isSubmitting,
    isValid,
    handleChange,
    handleSubmit,
    setFieldError,
    getFieldProps,
    setIsSubmitting,
  } = useFormValidation<EmployeeFormData>(
    {
      name: "",
      password: "",
      confirmPassword: "",
    },
    getValidationRules(t)
  );

  // ✅ FIXED: التحقق المخصص لتطابق كلمات المرور
  const validatePasswordConfirmation = useCallback(() => {
    if (values.password !== values.confirmPassword && values.confirmPassword) {
      setFieldError("confirmPassword", "كلمة المرور غير متطابقة");
      return false;
    }
    return true;
  }, [values.password, values.confirmPassword, setFieldError]);

  // ✅ FIXED: معالج إرسال النموذج
  const onSubmit = useCallback(
    async (formData: EmployeeFormData) => {
      // التحقق الإضافي
      if (!validatePasswordConfirmation()) {
        return;
      }

      try {
        setIsSubmitting(true);

        await authAPI.registerEmployee(formData.name.trim(), formData.password);

        // عرض رسالة نجاح
        toast.success(t("common.success"), {
          icon: <CheckCircle className="text-green-500" />,
          description: `${t("employees.add")} ${t(
            "common.success"
          ).toLowerCase()}`,
        });

        // العودة لصفحة الموظفين
        navigate(ROUTES.EMPLOYEES);
      } catch (error) {
        console.error("Error registering employee:", error);
        showErrorToast(error, "فشل في إضافة الموظف");
      } finally {
        setIsSubmitting(false);
      }
    },
    [validatePasswordConfirmation, setIsSubmitting, t, navigate]
  );

  // ✅ FIXED: معالج الإلغاء
  const handleCancel = useCallback(() => {
    navigate(ROUTES.EMPLOYEES);
  }, [navigate]);

  // ✅ FIXED: معالج تغيير كلمة المرور للتحقق من التطابق
  const handlePasswordChange = useCallback(
    (field: "password" | "confirmPassword") =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        handleChange(field)(event);

        // إزالة خطأ التطابق عند تغيير أي من الحقلين
        if (errors.confirmPassword && field === "password") {
          setFieldError("confirmPassword", "");
        }
      },
    [handleChange, handlePasswordChange, errors.confirmPassword, setFieldError]
  );

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* ✅ FIXED: زر العودة مع استخدام الثوابت */}
      <Button
        variant="ghost"
        className="mb-4 flex items-center gap-1 glass-btn"
        onClick={handleCancel}
      >
        <LucideArrowLeft className="h-4 w-4" />
        {t("common.back")}
      </Button>

      {/* ✅ FIXED: النموذج مع التحسينات */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormCard
          title={t("employees.add")}
          description={t("employees.create")}
          footer={
            <FormActions
              loading={isSubmitting}
              cancelLabel={t("common.cancel")}
              submitLabel={t("employees.create")}
              loadingLabel={t("common.loading")}
              onCancel={handleCancel}
              submitIcon={<LucideUserPlus className="h-4 w-4" />}
            />
          }
        >
          {/* ✅ FIXED: عرض الأخطاء العامة */}
          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive" className="glass-card">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                يرجى تصحيح الأخطاء أدناه قبل المتابعة
              </AlertDescription>
            </Alert>
          )}

          {/* ✅ FIXED: حقل الاسم مع التحقق */}
          <div className="space-y-2">
            <Label htmlFor="name" className="glassy-text">
              {t("employees.name")} *
            </Label>
            <Input
              id="name"
              type="text"
              placeholder={t("employees.name")}
              className={`glass-input ${errors.name ? "border-red-500" : ""}`}
              disabled={isSubmitting}
              {...getFieldProps("name")}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* ✅ FIXED: حقل كلمة المرور مع التحقق */}
          <div className="space-y-2">
            <Label htmlFor="password" className="glassy-text">
              {t("employees.password")} *
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={t("employees.password")}
              className={`glass-input ${
                errors.password ? "border-red-500" : ""
              }`}
              disabled={isSubmitting}
              autoComplete="new-password"
              {...getFieldProps("password")}
              onChange={handlePasswordChange("password")}
            />
            {errors.password && (
              <p className="text-sm text-red-600 mt-1">{errors.password}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {t("employees.passwordMinLength")}
            </p>
          </div>

          {/* ✅ FIXED: حقل تأكيد كلمة المرور مع التحقق */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="glassy-text">
              {t("employees.confirmPassword")} *
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder={t("employees.confirmPassword")}
              className={`glass-input ${
                errors.confirmPassword ? "border-red-500" : ""
              }`}
              disabled={isSubmitting}
              autoComplete="new-password"
              {...getFieldProps("confirmPassword")}
              onChange={handlePasswordChange("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-600 mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* ✅ FIXED: معلومات إضافية */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              ملاحظات هامة:
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• سيتم إنشاء حساب موظف جديد بصلاحيات محدودة</li>
              <li>• يمكن للموظف تسجيل الدخول فور إنشاء الحساب</li>
              <li>• يمكن تعديل بيانات الموظف لاحقاً من قائمة الموظفين</li>
            </ul>
          </div>
        </FormCard>
      </form>
    </div>
  );
};

export default AddEmployee;
