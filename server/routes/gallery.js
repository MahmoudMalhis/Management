const express = require("express");
const router = express.Router();
const { GalleryFolder } = require("../models");
const { protect } = require("../middlewares/auth");

router.get("/folders", protect, async (req, res, next) => {
  // ✅ إضافة next
  try {
    const folders = await GalleryFolder.findAll({
      attributes: ["_id", "name", "files", "createdAt"],
      order: [["createdAt", "DESC"]],
    });

    // ✅ تحسين تنسيق البيانات المُرجعة
    const formattedFolders = folders.map((folder) => ({
      _id: folder._id,
      name: folder.name,
      filesCount: Array.isArray(folder.files) ? folder.files.length : 0,
      createdAt: folder.createdAt, // ✅ إضافة تاريخ الإنشاء
    }));

    res.json({
      success: true, // ✅ إضافة success للتوحيد
      count: formattedFolders.length, // ✅ إضافة العدد
      folders: formattedFolders,
    });
  } catch (err) {
    // ✅ استخدام معالج الأخطاء الموحد
    next(err);
  }
});

router.get("/folders/:id", protect, async (req, res, next) => {
  // ✅ إضافة next
  try {
    const folder = await GalleryFolder.findByPk(req.params.id);

    if (!folder) {
      return res.status(404).json({
        success: false, // ✅ إضافة success للتوحيد
        message: "Folder not found",
      });
    }

    res.json({
      success: true,
      folder,
    });
  } catch (err) {
    // ✅ استخدام معالج الأخطاء الموحد
    next(err);
  }
});

router.post("/add-files", protect, async (req, res, next) => {
  // ✅ إضافة next
  try {
    const { files, folderName } = req.body;

    // ✅ تحسين التحقق من البيانات
    if (!folderName || !folderName.trim()) {
      return res.status(400).json({
        success: false, // ✅ إضافة success للتوحيد
        message: "اسم المجلد مطلوب",
      });
    }

    const trimmedFolderName = folderName.trim(); // ✅ تنظيف النص

    let folder = await GalleryFolder.findOne({
      where: { name: trimmedFolderName },
    });

    if (!folder) {
      // ✅ إنشاء مجلد جديد
      folder = await GalleryFolder.create({
        name: trimmedFolderName,
        createdBy: req.user.id,
        files: files || [],
      });
    } else {
      // ✅ تحديث المجلد الموجود مع تجنب التكرار
      const existingFiles = Array.isArray(folder.files) ? folder.files : [];
      const existingPaths = existingFiles.map((file) => file.filePath);
      const newFiles = (files || []).filter(
        (file) => !existingPaths.includes(file.filePath)
      );

      folder.files = existingFiles.concat(newFiles);
      await folder.save();
    }

    res.json({
      success: true,
      folder,
      message: folder.isNewRecord
        ? "تم إنشاء المجلد بنجاح"
        : "تم تحديث المجلد بنجاح", // ✅ رسالة تأكيد
    });
  } catch (err) {
    // ✅ استخدام معالج الأخطاء الموحد
    next(err);
  }
});

module.exports = router;
