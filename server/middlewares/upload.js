const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto"); // ✅ إضافة crypto لأسماء ملفات آمنة

// ✅ تحسين إعدادات التخزين مع أمان أفضل
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // ✅ تغيير المسار ليكون خارج client/public للأمان
    const uploadDir = path.join(__dirname, "../../uploads");

    // ✅ التأكد من وجود المجلد مع معالجة أفضل للأخطاء
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log(`Upload directory created: ${uploadDir}`);
      }
      cb(null, uploadDir);
    } catch (error) {
      console.error("Error creating upload directory:", error);
      cb(error, null);
    }
  },
  filename: function (req, file, cb) {
    try {
      // ✅ إنشاء اسم ملف آمن وفريد
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const randomName = crypto.randomBytes(16).toString("hex");
      const timestamp = Date.now();

      // ✅ تنظيف اسم الملف الأصلي من الأحرف الخطيرة فقط
      const safeName = file.originalname
        .replace(/[<>:"/\\|?*\x00-\x1f\x7f-\x9f]/g, "_") // استبدال الأحرف الخطيرة بـ _
        .substring(0, 50); // تحديد الطول

      const safeFileName = `${timestamp}-${randomName}${fileExtension}`;

      cb(null, safeFileName);
    } catch (error) {
      console.error("Error generating filename:", error);
      cb(error, null);
    }
  },
});

// ✅ فلترة الملفات - فقط منع الملفات الخطيرة التنفيذية
function fileFilter(req, file, cb) {
  try {
    // ✅ الامتدادات الخطيرة التنفيذية المحظورة فقط
    const dangerousExecutableExtensions = [
      ".exe",
      ".bat",
      ".cmd",
      ".com",
      ".pif",
      ".scr",
      ".vbs",
      ".vb",
      ".js",
      ".jse",
      ".ws",
      ".wsf",
      ".wsc",
      ".wsh",
      ".ps1",
      ".ps1xml",
      ".ps2",
      ".ps2xml",
      ".psc1",
      ".psc2",
      ".msh",
      ".msh1",
      ".msh2",
      ".mshxml",
      ".msh1xml",
      ".msh2xml",
      ".scf",
      ".lnk",
      ".inf",
      ".reg",
      ".app",
      ".deb",
      ".rpm",
      ".run",
      ".dmg",
      ".pkg",
    ];

    const fileExtension = path.extname(file.originalname).toLowerCase();

    // ✅ فحص الامتدادات الخطيرة التنفيذية فقط
    if (dangerousExecutableExtensions.includes(fileExtension)) {
      const error = new Error(
        `نوع الملف ${fileExtension} غير مسموح لأسباب أمنية (ملف تنفيذي)`
      );
      error.code = "DANGEROUS_EXECUTABLE_FILE";
      return cb(error, false);
    }

    // ✅ فحص حجم اسم الملف
    if (file.originalname.length > 255) {
      const error = new Error("اسم الملف طويل جداً (الحد الأقصى 255 حرف)");
      error.code = "FILENAME_TOO_LONG";
      return cb(error, false);
    }

    // ✅ فحص الأحرف الخطيرة في اسم الملف (أحرف التحكم فقط)
    const dangerousControlChars = /[\x00-\x1f\x7f-\x9f]/;
    if (dangerousControlChars.test(file.originalname)) {
      const error = new Error("اسم الملف يحتوي على أحرف تحكم غير صالحة");
      error.code = "INVALID_CONTROL_CHARS";
      return cb(error, false);
    }

    // ✅ السماح بجميع الملفات الأخرى (تصميم، صور، مستندات، إلخ)
    cb(null, true);
  } catch (error) {
    console.error("Error in file filter:", error);
    cb(error, false);
  }
}

// ✅ إعدادات multer مع دعم ملفات كبيرة
const uploadConfig = {
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // ✅ الإبقاء على 500 ميجابايت لدعم ملفات التصميم الكبيرة
    files: 50, // الحد الأقصى 50 ملفات
    fieldNameSize: 100, // حد اسم الحقل
    fieldSize: 1024 * 1024, // حد حجم الحقل
    headerPairs: 2000, // حد أزواج الرؤوس
  },
};

const upload = multer(uploadConfig);

// ✅ middleware للتحقق من الملفات بعد التحميل
const validateUploadedFiles = (req, res, next) => {
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      try {
        // ✅ التحقق من وجود الملف فعلياً
        if (!fs.existsSync(file.path)) {
          return res.status(500).json({
            success: false,
            message: "فشل في حفظ الملف على الخادم",
          });
        }

        // ✅ التحقق من حجم الملف الفعلي
        const stats = fs.statSync(file.path);
        if (stats.size === 0) {
          // حذف الملف الفارغ
          fs.unlinkSync(file.path);
          return res.status(400).json({
            success: false,
            message: "لا يمكن رفع ملف فارغ",
          });
        }

        // ✅ فحص إضافي للملفات التنفيذية المحتملة بناءً على المحتوى
        const buffer = fs.readFileSync(file.path, { start: 0, end: 4 });
        const hex = buffer.toString("hex").toUpperCase();

        // التحقق من Windows PE header (ملفات .exe)
        if (hex.startsWith("4D5A")) {
          // MZ header
          fs.unlinkSync(file.path);
          return res.status(400).json({
            success: false,
            message: "تم اكتشاف ملف تنفيذي - غير مسموح",
          });
        }

        // ✅ إضافة معلومات إضافية للملف
        file.uploadedAt = new Date();
        file.isValidated = true;
        file.actualSize = stats.size;
        file.safeName = file.originalname.replace(
          /[<>:"/\\|?*\x00-\x1f\x7f-\x9f]/g,
          "_"
        );
      } catch (error) {
        console.error("Error validating uploaded file:", error);
        // في حالة خطأ في القراءة، نحذف الملف للأمان
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (deleteError) {
          console.error("Error deleting problematic file:", deleteError);
        }
        return res.status(500).json({
          success: false,
          message: "خطأ في التحقق من الملف المرفوع",
        });
      }
    }
  }
  next();
};

// ✅ middleware لتنظيف الملفات في حالة الخطأ
const cleanupOnError = (err, req, res, next) => {
  if (req.files && req.files.length > 0) {
    req.files.forEach((file) => {
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
          console.log(`Cleaned up file: ${file.path}`);
        }
      } catch (cleanupError) {
        console.error("Error cleaning up file:", cleanupError);
      }
    });
  }
  next(err);
};

// ✅ دالة مساعدة للحصول على معلومات نوع الملف (اختيارية)
const getFileInfo = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();

    return {
      size: stats.size,
      extension: ext,
      isImage: [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".bmp",
        ".webp",
        ".svg",
      ].includes(ext),
      isDocument: [
        ".pdf",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx",
        ".ppt",
        ".pptx",
      ].includes(ext),
      isDesign: [
        ".psd",
        ".ai",
        ".sketch",
        ".fig",
        ".blend",
        ".max",
        ".ma",
        ".mb",
        ".c4d",
      ].includes(ext),
      is3D: [
        ".obj",
        ".fbx",
        ".dae",
        ".3ds",
        ".blend",
        ".max",
        ".ma",
        ".mb",
        ".c4d",
        ".stl",
        ".ply",
      ].includes(ext),
      isVideo: [
        ".mp4",
        ".avi",
        ".mov",
        ".wmv",
        ".flv",
        ".webm",
        ".mkv",
      ].includes(ext),
      isAudio: [".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a"].includes(ext),
      isArchive: [".zip", ".rar", ".7z", ".tar", ".gz", ".bz2"].includes(ext),
    };
  } catch (error) {
    console.error("Error getting file info:", error);
    return null;
  }
};

module.exports = upload;

// ✅ تصدير الباقي كخصائص إضافية
module.exports.upload = upload;
module.exports.validateUploadedFiles = validateUploadedFiles;
module.exports.cleanupOnError = cleanupOnError;
module.exports.getFileInfo = getFileInfo;
