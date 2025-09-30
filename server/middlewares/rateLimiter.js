// 📁 server/middlewares/rateLimiter.js (ملف جديد)
const rateLimit = require("express-rate-limit");

// حد عام لجميع الطلبات
const generalLimiter = rateLimit({
  //   windowMs: 15 * 60 * 1000, // 15 دقيقة
  //   max: 100, // حد أقصى 100 طلب لكل IP
  //   message: {
  //     success: false,
  //     message: "تجاوزت الحد المسموح من الطلبات، حاول بعد 15 دقيقة",
  //   },
  //   standardHeaders: true, // إرجاع معلومات rate limit في headers
  //   legacyHeaders: false,
});

// حد خاص لتسجيل الدخول (أكثر تشدداً)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 50, // 5 محاولات فقط لتسجيل الدخول
  message: {
    success: false,
    message: "محاولات دخول كثيرة، حاول بعد 15 دقيقة",
  },
  skipSuccessfulRequests: true, // لا تحسب المحاولات الناجحة
});

// حد لرفع الملفات
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // ساعة واحدة
  max: 30, // 20 رفعة في الساعة
  message: {
    success: false,
    message: "تجاوزت حد رفع الملفات، حاول بعد ساعة",
  },
});

module.exports = {
  loginLimiter,
  uploadLimiter,
};
