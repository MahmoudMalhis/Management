const { TaskTitle } = require("../models");

exports.getTaskTitles = async (req, res, next) => {
  // ✅ إضافة next
  try {
    const titles = await TaskTitle.findAll({
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      count: titles.length, // ✅ إضافة عدد العناصر للثبات
      data: titles,
    });
  } catch (err) {
    // ✅ استخدام معالج الأخطاء الموحد
    next(err);
  }
};

exports.addTaskTitle = async (req, res, next) => {
  // ✅ إضافة next
  try {
    const { name } = req.body;

    // ✅ تحسين التحقق من البيانات
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "العنوان مطلوب",
      });
    }

    const trimmedName = name.trim(); // ✅ تنظيف النص

    // ✅ التحقق من وجود العنوان مسبقاً
    const existingTitle = await TaskTitle.findOne({
      where: { name: trimmedName },
    });

    if (existingTitle) {
      return res.status(409).json({
        success: false,
        message: "العنوان موجود مسبقاً",
      });
    }

    const title = await TaskTitle.create({ name: trimmedName });

    res.status(201).json({
      success: true,
      data: title,
      message: "تم إضافة العنوان بنجاح", // ✅ رسالة تأكيد
    });
  } catch (err) {
    // ✅ استخدام معالج الأخطاء الموحد
    next(err);
  }
};

exports.editTaskTitle = async (req, res, next) => {
  // ✅ إضافة next
  try {
    const { id } = req.params;
    const { name } = req.body;

    // ✅ تحسين التحقق من البيانات
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "العنوان مطلوب",
      });
    }

    const title = await TaskTitle.findByPk(id);
    if (!title) {
      return res.status(404).json({
        success: false,
        message: "العنوان غير موجود",
      });
    }

    const trimmedName = name.trim(); // ✅ تنظيف النص

    // ✅ التحقق من عدم وجود عنوان آخر بنفس الاسم
    const existingTitle = await TaskTitle.findOne({
      where: {
        name: trimmedName,
        _id: { [require("../models").Op.ne]: id }, // ✅ استثناء العنوان الحالي
      },
    });

    if (existingTitle) {
      return res.status(409).json({
        success: false,
        message: "العنوان موجود مسبقاً",
      });
    }

    title.name = trimmedName;
    await title.save();

    res.json({
      success: true,
      data: title,
      message: "تم تحديث العنوان بنجاح", // ✅ رسالة تأكيد
    });
  } catch (err) {
    // ✅ استخدام معالج الأخطاء الموحد
    next(err);
  }
};

exports.deleteTaskTitle = async (req, res, next) => {
  // ✅ إضافة next
  try {
    const { id } = req.params;

    const deletedCount = await TaskTitle.destroy({
      where: { _id: id },
    });

    if (!deletedCount) {
      return res.status(404).json({
        success: false,
        message: "العنوان غير موجود",
      });
    }

    res.json({
      success: true,
      message: "تم حذف العنوان بنجاح", // ✅ رسالة تأكيد
    });
  } catch (err) {
    // ✅ استخدام معالج الأخطاء الموحد
    next(err);
  }
};
