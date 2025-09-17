const { validationResult } = require("express-validator");
const { SavedComparison } = require("../models");

exports.createComparison = async (req, res, next) => {
  // ✅ إضافة next
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const {
      name = "",
      employeeIds = [],
      notes = "",
      range = "all",
      startDate,
      endDate,
    } = req.body;

    // ✅ تحسين معالجة التواريخ
    const comparisonData = {
      name: name.trim(), // ✅ تنظيف النص
      employeeIds,
      notes: notes.trim(), // ✅ تنظيف النص
      range,
      createdBy: req.user.id,
    };

    // ✅ إضافة التواريخ فقط إذا كانت صحيحة
    if (startDate) {
      comparisonData.startDate = new Date(startDate);
    }
    if (endDate) {
      comparisonData.endDate = new Date(endDate);
    }

    const comparison = await SavedComparison.create(comparisonData);

    res.status(201).json({
      success: true,
      data: comparison,
      message: "تم إنشاء المقارنة بنجاح", // ✅ رسالة تأكيد
    });
  } catch (err) {
    // ✅ استخدام معالج الأخطاء الموحد
    next(err);
  }
};

exports.listComparisons = async (req, res, next) => {
  // ✅ إضافة next
  try {
    const items = await SavedComparison.findAll({
      where: { createdBy: req.user.id },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (err) {
    // ✅ استخدام معالج الأخطاء الموحد
    next(err);
  }
};

exports.getComparison = async (req, res, next) => {
  // ✅ إضافة next
  try {
    const item = await SavedComparison.findOne({
      where: { _id: req.params.id, createdBy: req.user.id },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "المقارنة غير موجودة", // ✅ رسالة بالعربية
      });
    }

    res.json({ success: true, data: item });
  } catch (err) {
    // ✅ استخدام معالج الأخطاء الموحد
    next(err);
  }
};

exports.updateComparison = async (req, res, next) => {
  // ✅ إضافة next
  try {
    const updates = {};
    const allowedFields = [
      "name",
      "notes",
      "range",
      "startDate",
      "endDate",
      "employeeIds",
    ];

    // ✅ معالجة التحديثات المسموحة فقط
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === "name" || field === "notes") {
          updates[field] = req.body[field].trim(); // ✅ تنظيف النصوص
        } else if (field === "startDate" || field === "endDate") {
          updates[field] = new Date(req.body[field]);
        } else {
          updates[field] = req.body[field];
        }
      }
    }

    const item = await SavedComparison.findOne({
      where: { _id: req.params.id, createdBy: req.user.id },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "المقارنة غير موجودة",
      });
    }

    await item.update(updates);

    res.json({
      success: true,
      data: item,
      message: "تم تحديث المقارنة بنجاح", // ✅ رسالة تأكيد
    });
  } catch (err) {
    // ✅ استخدام معالج الأخطاء الموحد
    next(err);
  }
};

exports.deleteComparison = async (req, res, next) => {
  // ✅ إضافة next
  try {
    const deletedCount = await SavedComparison.destroy({
      where: { _id: req.params.id, createdBy: req.user.id },
    });

    if (!deletedCount) {
      return res.status(404).json({
        success: false,
        message: "المقارنة غير موجودة",
      });
    }

    res.json({
      success: true,
      message: "تم حذف المقارنة بنجاح", // ✅ رسالة تأكيد
    });
  } catch (err) {
    // ✅ استخدام معالج الأخطاء الموحد
    next(err);
  }
};
