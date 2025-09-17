// ✅ تحسين دالة تحويل القيم إلى مصفوفات مع معالجة أفضل للأخطاء
module.exports = (value) => {
  // ✅ إرجاع مباشر إذا كانت مصفوفة
  if (Array.isArray(value)) {
    return value;
  }

  // ✅ معالجة النصوص JSON
  if (value && typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      // ✅ تسجيل الخطأ للتشخيص في بيئة التطوير
      if (process.env.NODE_ENV === "development") {
        console.warn("Failed to parse JSON string to array:", {
          value: value.substring(0, 100), // أول 100 حرف فقط للأمان
          error: error.message,
        });
      }
      return [];
    }
  }

  // ✅ معالجة القيم الفارغة والـ undefined
  if (value === null || value === undefined) {
    return [];
  }

  // ✅ محاولة تحويل الكائنات الأخرى
  if (typeof value === "object") {
    try {
      // إذا كان كائن له خاصية length (مثل NodeList)
      if (value.length !== undefined) {
        return Array.from(value);
      }

      // تحويل كائن إلى مصفوفة من القيم
      return Object.values(value);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Failed to convert object to array:", error.message);
      }
      return [];
    }
  }

  // ✅ في حالة أي نوع آخر، إرجاع مصفوفة فارغة
  return [];
};
