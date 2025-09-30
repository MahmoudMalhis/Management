const express = require("express");
const { check } = require("express-validator");
const { uploadLimiter } = require("../middlewares/rateLimiter");
const {
  createAccomplishment,
  getAccomplishments,
  getAccomplishment,
  addComment,
  reviewAccomplishment,
  exportAccomplishments,
  addEmployeeReply,
  modifyAccomplishment,
  startAccomplishment,
} = require("../controllers/accomplishments/index");
const { protect, authorize } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

const router = express.Router();

// ✅ تحسين middleware رفع الملفات مع معالجة أفضل للأخطاء
const handleUploadError = (err, req, res, next) => {
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      message: "الملف كبير جداً (الحد الأقصى 500 ميجابايت)",
    });
  }
  if (err && err.code === "LIMIT_FILE_COUNT") {
    return res.status(413).json({
      success: false,
      message: "عدد الملفات كبير جداً",
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: "خطأ في رفع الملف: " + err.message,
    });
  }
  next();
};

// ✅ تحسين validation rules
const createValidationRules = [
  check("description", "وصف الإنجاز مطلوب")
    .notEmpty()
    .isLength({ min: 1, max: 2000 })
    .withMessage("وصف الإنجاز يجب أن يكون بين 1 و 2000 حرف"),
  check("taskTitle", "عنوان المهمة مطلوب")
    .notEmpty()
    .isNumeric()
    .withMessage("عنوان المهمة يجب أن يكون رقم صحيح"),
  check("employee")
    .optional()
    .isNumeric()
    .withMessage("معرف الموظف يجب أن يكون رقم صحيح"),
];

const commentValidationRules = [
  check("text", "نص التعليق مطلوب")
    .notEmpty()
    .isLength({ min: 1, max: 1000 })
    .withMessage("نص التعليق يجب أن يكون بين 1 و 1000 حرف"),
];

const replyValidationRules = [
  check("text", "نص الرد مطلوب")
    .notEmpty()
    .isLength({ min: 1, max: 1000 })
    .withMessage("نص الرد يجب أن يكون بين 1 و 1000 حرف"),
];

const modifyValidationRules = [
  check("description", "وصف الإنجاز مطلوب")
    .notEmpty()
    .isLength({ min: 1, max: 2000 })
    .withMessage("وصف الإنجاز يجب أن يكون بين 1 و 2000 حرف"),
];

// ✅ Routes مع تحسين الترتيب والتعليقات

// إنشاء إنجاز جديد
router.post(
  "/",
  protect,
  uploadLimiter,
  upload.array("files"),
  handleUploadError,
  createValidationRules,
  createAccomplishment
);

// تصدير الإنجازات (للمدراء فقط)
router.get("/export", protect, authorize("manager"), exportAccomplishments);

// الحصول على جميع الإنجازات
router.get("/", protect, getAccomplishments);

// الحصول على إنجاز محدد
router.get("/:id", protect, getAccomplishment);

// إضافة تعليق على إنجاز
router.post("/:id/comments", protect, commentValidationRules, addComment);

// الرد على تعليق
router.post(
  "/:id/comments/:commentId/reply",
  protect,
  replyValidationRules,
  addEmployeeReply
);

// مراجعة إنجاز (للمدراء فقط)
router.put(
  "/:id/review",
  protect,
  authorize("manager"),
  [
    check("status", "حالة المراجعة مطلوبة")
      .isIn(["reviewed", "needs_modification"])
      .withMessage(
        "حالة المراجعة يجب أن تكون 'reviewed' أو 'needs_modification'"
      ),
    check("comment")
      .optional()
      .isLength({ max: 1000 })
      .withMessage("التعليق يجب أن يكون أقل من 1000 حرف"),
  ],
  reviewAccomplishment
);

// تعديل إنجاز (للموظفين فقط)
router.put(
  "/:id/modify",
  protect,
  upload.array("files"),
  handleUploadError,
  modifyValidationRules,
  modifyAccomplishment
);

// بدء العمل على إنجاز (للموظفين فقط)
router.put(
  "/:id/start",
  protect,
  upload.array("files"),
  handleUploadError,
  [
    check("description", "وصف بداية العمل مطلوب")
      .notEmpty()
      .isLength({ min: 1, max: 2000 })
      .withMessage("وصف بداية العمل يجب أن يكون بين 1 و 2000 حرف"),
  ],
  startAccomplishment
);

module.exports = router;
