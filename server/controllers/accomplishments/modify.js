const { Accomplishment, Notification, User } = require("../../models");
// ✅ استيراد خدمة Socket المحسّنة
const socketService = require("../../services/socketService");

module.exports = async function modifyAccomplishment(req, res, next) {
  // ✅ إضافة next
  try {
    const accomplishment = await Accomplishment.findByPk(req.params.id);
    if (!accomplishment) {
      return res.status(404).json({
        success: false, // ✅ إضافة success للتوحيد
        message: "Accomplishment not found",
      });
    }

    // ✅ التحقق من الصلاحيات بطريقة أوضح
    if (String(accomplishment.employee) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    // ✅ حفظ النسخة السابقة
    const previousVersions = accomplishment.previousVersions || [];
    previousVersions.push({
      description: accomplishment.description,
      files: accomplishment.files,
      modifiedAt: accomplishment.updatedAt || accomplishment.createdAt,
    });
    accomplishment.previousVersions = previousVersions;

    // ✅ تحديث البيانات
    accomplishment.description = req.body.description;

    // ✅ معالجة الملفات الجديدة
    if (req.files && req.files.length > 0) {
      accomplishment.files = req.files.map((file) => ({
        fileName: file.originalname,
        filePath: `/uploads/${file.filename}`,
        fileType: file.mimetype,
      }));
    } else {
      accomplishment.files = [];
    }

    accomplishment.status = "pending";
    accomplishment.lastContentModifiedAt = new Date();
    await accomplishment.save();

    // ✅ الحصول على البيانات المحدّثة مع العلاقات
    const updated = await Accomplishment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "employeeInfo",
          attributes: ["_id", "name", "status", "role"],
        },
      ],
    });

    // ✅ إرسال إشعارات للمدراء
    const managers = await User.findAll({ where: { role: "manager" } });

    // ✅ استخدام bulkCreate لتحسين الأداء
    const managerNotifications = managers.map((manager) => ({
      user: manager._id,
      type: "modification",
      message: `قام الموظف ${req.user.name} بتعديل المهمة "${updated.originalDescription}"`,
      data: { accomplishmentId: updated._id },
    }));

    await Notification.bulkCreate(managerNotifications);

    // ✅ إرسال إشعارات Socket للمدراء
    socketService.notifyManagers({
      type: "modification",
      message: `قام الموظف ${req.user.name} بتعديل المهمة "${updated.originalDescription}"`,
      data: { accomplishmentId: updated._id },
    });

    // ✅ إرسال تحديث Socket للإنجاز
    socketService.broadcastAccomplishmentUpdate({
      accomplishmentId: updated._id,
      employeeName: updated.employeeInfo.name,
      employeeId: updated.employeeInfo._id,
      type: "modified",
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    // ✅ استخدام معالج الأخطاء الموحد بدلاً من console.log
    next(err);
  }
};
