const { Accomplishment, Notification, User } = require("../../models");
// ✅ استيراد خدمة Socket المحسّنة
const socketService = require("../../services/socketService");

module.exports = async function startAccomplishment(req, res, next) {
  // ✅ إضافة next
  try {
    const accomplishment = await Accomplishment.findByPk(req.params.id);
    if (!accomplishment) {
      return res.status(404).json({
        success: false, // ✅ إضافة success للتوحيد
        message: "Accomplishment not found",
      });
    }

    // ✅ التحقق من الصلاحيات
    if (String(accomplishment.employee) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    // ✅ التحقق من حالة المهمة
    if (accomplishment.status !== "assigned") {
      return res.status(400).json({
        success: false,
        message: "Task already started",
      });
    }

    // ✅ تحديث بيانات الإنجاز
    accomplishment.employeeDescription = req.body.description;
    accomplishment.employeeFiles = (req.files || []).map((file) => ({
      fileName: file.originalname,
      filePath: `/uploads/${file.filename}`,
      fileType: file.mimetype,
    }));
    accomplishment.files = [...accomplishment.employeeFiles];
    accomplishment.description = accomplishment.employeeDescription;
    accomplishment.status = "pending";
    accomplishment.lastContentModifiedAt = new Date();
    await accomplishment.save();

    // ✅ إرسال إشعارات للمدراء
    const managers = await User.findAll({ where: { role: "manager" } });

    // ✅ استخدام bulkCreate لتحسين الأداء
    const managerNotifications = managers.map((manager) => ({
      user: manager._id,
      type: "accomplishment_started",
      message: `قام الموظف ${req.user.name} ببدء العمل على المهمة "${accomplishment.originalDescription}"`,
      data: { accomplishmentId: accomplishment._id },
    }));

    await Notification.bulkCreate(managerNotifications);

    // ✅ إرسال إشعارات Socket للمدراء
    socketService.notifyManagers({
      type: "accomplishment_started",
      message: `قام الموظف ${req.user.name} ببدء العمل على المهمة "${accomplishment.originalDescription}"`,
      data: { accomplishmentId: accomplishment._id },
    });

    // ✅ الحصول على البيانات المحدّثة مع العلاقات
    const updated = await Accomplishment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "employeeInfo",
          attributes: ["_id", "name", "status", "role"], // ✅ إضافة role للثبات
        },
      ],
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    // ✅ استخدام معالج الأخطاء الموحد
    next(err);
  }
};
