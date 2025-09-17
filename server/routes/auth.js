const express = require("express");
const { check } = require("express-validator");
const {
  login,
  registerEmployee,
  getMe,
  getEmployees,
  getEmployeeById,
  deleteEmployee,
  unarchiveEmployee,
} = require("../controllers/authController");
const { protect, authorize } = require("../middlewares/auth");

const router = express.Router();

// ✅ تحسين validation rules مع رسائل خطأ واضحة بالعربية
const loginValidationRules = [
  check("name", "اسم المستخدم مطلوب")
    .notEmpty()
    .isLength({ min: 2, max: 50 })
    .withMessage("اسم المستخدم يجب أن يكون بين 2 و 50 حرف")
    .trim(), // ✅ تنظيف النص
  check("password", "كلمة المرور مطلوبة")
    .exists()
    .isLength({ min: 1 })
    .withMessage("كلمة المرور لا يمكن أن تكون فارغة"),
];

const registerValidationRules = [
  check("name", "اسم المستخدم مطلوب")
    .notEmpty()
    .isLength({ min: 2, max: 50 })
    .withMessage("اسم المستخدم يجب أن يكون بين 2 و 50 حرف")
    .matches(/^[a-zA-Z0-9_\u0600-\u06FF\s]+$/) // ✅ السماح بالأحرف العربية
    .withMessage("اسم المستخدم يحتوي على أحرف غير مسموحة")
    .trim(),
  check("password", "كلمة المرور قصيرة جداً")
    .isLength({ min: 6, max: 128 })
    .withMessage("كلمة المرور يجب أن تكون أكثر من 6 أحرف"),
];

const employeeIdValidationRules = [
  check("id", "معرف الموظف غير صحيح")
    .isInt({ min: 1 })
    .withMessage("معرف الموظف يجب أن يكون رقم صحيح موجب"),
];

// ✅ Routes مع تحسين التعليقات والترتيب

// تسجيل الدخول
router.post("/login", loginValidationRules, login);

// تسجيل موظف جديد (للمدراء فقط)
router.post(
  "/register",
  protect,
  authorize("manager"),
  registerValidationRules,
  registerEmployee
);

// الحصول على معلومات المستخدم الحالي
router.get("/me", protect, getMe);

// الحصول على جميع الموظفين (للمدراء فقط)
router.get(
  "/employees",
  protect,
  authorize("manager"),
  [
    check("status")
      .optional()
      .isIn(["active", "archived", "all"])
      .withMessage("حالة الفلترة يجب أن تكون 'active' أو 'archived' أو 'all'"),
  ],
  getEmployees
);

// الحصول على موظف محدد (للمدراء فقط)
router.get(
  "/employees/:id",
  protect,
  authorize("manager"),
  employeeIdValidationRules,
  getEmployeeById
);

// حذف أو أرشفة موظف (للمدراء فقط)
router.delete(
  "/employees/:id",
  protect,
  authorize("manager"),
  [
    ...employeeIdValidationRules,
    check("mode")
      .optional()
      .isIn(["archive", "hard"])
      .withMessage("نوع الحذف يجب أن يكون 'archive' أو 'hard'"),
  ],
  deleteEmployee
);

// استعادة موظف من الأرشيف (للمدراء فقط)
router.patch(
  "/employees/:id/unarchive",
  protect,
  authorize("manager"),
  employeeIdValidationRules,
  unarchiveEmployee
);

module.exports = router;
