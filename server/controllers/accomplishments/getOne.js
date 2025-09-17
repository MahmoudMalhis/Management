const { Accomplishment, TaskTitle, User } = require("../../models");

// ✅ دالة موحدة لتحويل القيم إلى مصفوفات
const toArray = (value) => (Array.isArray(value) ? value : []);

module.exports = async function getAccomplishment(req, res, next) {
  // ✅ إضافة next
  try {
    const accomplishment = await Accomplishment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "employeeInfo",
          attributes: ["_id", "name", "role", "status"],
        },
        {
          model: TaskTitle,
          as: "taskTitleInfo",
          attributes: ["_id", "name"],
        },
      ],
    });

    if (!accomplishment) {
      return res.status(404).json({
        success: false,
        message: "Accomplishment not found",
      });
    }

    // ✅ التحقق من الصلاحيات بطريقة أوضح
    const isAuthorized =
      req.user.role === "manager" ||
      String(accomplishment.employee) === String(req.user.id);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this accomplishment",
      });
    }

    // ✅ تكوين البيانات المُرجعة بطريقة موحدة
    const data = {
      _id: accomplishment._id,
      employee: accomplishment.employeeInfo
        ? {
            _id: accomplishment.employeeInfo._id,
            name: accomplishment.employeeInfo.name,
            role: accomplishment.employeeInfo.role,
            status: accomplishment.employeeInfo.status, // ✅ إضافة status
          }
        : {
            _id: String(accomplishment.employee),
            name: "Unknown",
            role: "unknown",
            status: "unknown",
          },
      taskTitle: accomplishment.taskTitleInfo
        ? {
            _id: accomplishment.taskTitleInfo._id,
            name: accomplishment.taskTitleInfo.name,
          }
        : {
            _id: String(accomplishment.taskTitle),
            name: "Unknown",
          },
      description: accomplishment.description,
      files: toArray(accomplishment.files),
      originalDescription: accomplishment.originalDescription,
      originalFiles: toArray(accomplishment.originalFiles),
      employeeDescription: accomplishment.employeeDescription,
      employeeFiles: toArray(accomplishment.employeeFiles),
      status: accomplishment.status,
      lastContentModifiedAt: accomplishment.lastContentModifiedAt,
      createdAt: accomplishment.createdAt,
      previousVersions: toArray(accomplishment.previousVersions),
      comments: toArray(accomplishment.comments),
    };

    return res.json({ success: true, data });
  } catch (err) {
    // ✅ استخدام معالج الأخطاء الموحد مع تسجيل أفضل للأخطاء
    console.error("GET_ACCOMPLISHMENT_ERROR:", err);
    next(err);
  }
};
