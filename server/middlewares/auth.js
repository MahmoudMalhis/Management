const jwt = require("jsonwebtoken");
const { User } = require("../models");

exports.protect = async (req, res, next) => {
  let token;

  // ✅ تحسين استخراج التوكن مع معالجة أفضل للأخطاء
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "غير مصرح بالوصول إلى هذا المسار", // ✅ رسالة بالعربية
    });
  }

  try {
    // ✅ التحقق من التوكن مع معالجة أفضل للأخطاء
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "المستخدم غير موجود", // ✅ رسالة واضحة
      });
    }

    // ✅ التحقق من حالة المستخدم
    if (user.status === "archived" || user.disabledLogin) {
      return res.status(403).json({
        success: false,
        message: "الحساب مؤرشف أو معطل", // ✅ رسالة واضحة
      });
    }

    // ✅ إضافة المستخدم للطلب مع توحيد المعرف
    req.user = user;
    req.user.id = user._id; // ✅ توحيد استخدام id
    next();
  } catch (err) {
    // ✅ معالجة أنواع أخطاء JWT المختلفة
    let message = "غير مصرح بالوصول إلى هذا المسار";

    if (err.name === "TokenExpiredError") {
      message = "انتهت صلاحية رمز المصادقة";
    } else if (err.name === "JsonWebTokenError") {
      message = "رمز المصادقة غير صحيح";
    }

    return res.status(401).json({
      success: false,
      message,
    });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    // ✅ تحسين التحقق من الأدوار
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "يجب تسجيل الدخول أولاً", // ✅ رسالة واضحة
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `دور المستخدم ${req.user.role} غير مصرح له بالوصول إلى هذا المسار`, // ✅ رسالة بالعربية
      });
    }
    next();
  };
};
