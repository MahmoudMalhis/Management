// middlewares/errorHandler.js
// ✅ إضافة معالج أخطاء موحد لتوحيد طريقة معالجة الأخطاء في جميع أنحاء التطبيق
const errorHandler = (err, req, res, next) => {
  // ✅ تسجيل شامل للأخطاء مع معلومات مفيدة للتشخيص
  console.error("Error occurred:", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString(),
  });

  // ✅ تحديد نوع الخطأ ورمز الاستجابة بطريقة موحدة
  let statusCode = err.statusCode || 500;
  let message = err.message || "خطأ في الخادم";

  // ✅ معالجة أخطاء Sequelize المختلفة
  if (err.name === "SequelizeValidationError") {
    statusCode = 400;
    message = "بيانات غير صحيحة";
  } else if (err.name === "SequelizeUniqueConstraintError") {
    statusCode = 409;
    message = "البيانات موجودة مسبقاً";
  } else if (err.name === "SequelizeForeignKeyConstraintError") {
    statusCode = 400;
    message = "مرجع غير صحيح";
  }

  // ✅ معالجة أخطاء JWT
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "رمز المصادقة غير صحيح";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "انتهت صلاحية رمز المصادقة";
  }

  // ✅ معالجة أخطاء رفع الملفات
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 413;
    message = "حجم الملف كبير جداً";
  } else if (err.code === "LIMIT_FILE_COUNT") {
    statusCode = 413;
    message = "عدد الملفات كبير جداً";
  }

  // ✅ استجابة موحدة للأخطاء مع تفاصيل إضافية في بيئة التطوير فقط
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      details: err.errors || undefined,
    }),
  });
};

module.exports = errorHandler;
