const { Accomplishment, TaskTitle, User, Op } = require("../../models");

// ✅ دالة موحدة ومحسّنة لتحويل القيم إلى مصفوفات
const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return value ?? [];
};

module.exports = async function getAccomplishments(req, res, next) {
  // ✅ إضافة next
  try {
    const where = {};

    // ✅ فلترة بناءً على دور المستخدم
    if (req.user.role === "employee") {
      where.employee = req.user.id;
    } else if (req.user.role === "manager" && req.query.employee) {
      where.employee = req.query.employee;
    }

    // ✅ فلترة التواريخ مع تحسين معالجة نهاية اليوم
    if (req.query.startDate && req.query.endDate) {
      const endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999); // ✅ جعل التاريخ شاملاً لنهاية اليوم

      where.createdAt = {
        [Op.gte]: new Date(req.query.startDate),
        [Op.lte]: endDate,
      };
    } else if (req.query.startDate) {
      where.createdAt = { [Op.gte]: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      const endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999);
      where.createdAt = { [Op.lte]: endDate };
    }

    // ✅ الحصول على البيانات مع العلاقات
    const rows = await Accomplishment.findAll({
      where,
      include: [
        {
          model: User,
          as: "employeeInfo",
          attributes: ["_id", "name", "status", "role"], // ✅ إضافة role للثبات
        },
        {
          model: TaskTitle,
          as: "taskTitleInfo",
          attributes: ["_id", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // ✅ تطبيع البيانات بطريقة موحدة
    const normalized = rows.map((accomplishment) => {
      const plain = accomplishment.get
        ? accomplishment.get({ plain: true })
        : accomplishment;

      return {
        _id: plain._id,
        description: plain.description,
        originalDescription: plain.originalDescription || null,
        originalFiles: toArray(plain.originalFiles),
        employeeDescription: plain.employeeDescription || null,
        employeeFiles: toArray(plain.employeeFiles),
        status: plain.status,
        createdAt: plain.createdAt,
        lastContentModifiedAt: plain.lastContentModifiedAt,
        files: toArray(plain.files),
        comments: toArray(plain.comments),
        previousVersions: toArray(plain.previousVersions),
        employeeInfo: plain.employeeInfo
          ? {
              _id: plain.employeeInfo._id,
              name: plain.employeeInfo.name,
              status: plain.employeeInfo.status,
              role: plain.employeeInfo.role, // ✅ إضافة role
            }
          : null,
        taskTitleInfo: plain.taskTitleInfo
          ? {
              _id: plain.taskTitleInfo._id,
              name: plain.taskTitleInfo.name,
            }
          : null,
      };
    });

    // ✅ فلترة الموظفين المؤرشفين للمدراء فقط
    const data =
      req.user.role === "manager" && !req.query.employee
        ? normalized.filter(
            (accomplishment) =>
              accomplishment.employeeInfo &&
              accomplishment.employeeInfo.status !== "archived"
          )
        : normalized;

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    // ✅ استخدام معالج الأخطاء الموحد
    next(err);
  }
};
