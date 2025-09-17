const { Accomplishment, Notification, User } = require("../../models");
// ✅ استيراد خدمة Socket المحسّنة
const socketService = require("../../services/socketService");

// ✅ دالة موحدة لإنشاء ID
const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substring(2, 8);

module.exports = async function addComment(req, res, next) {
  // ✅ إضافة next
  try {
    const { text, versionIndex } = req.body;
    const accomplishment = await Accomplishment.findByPk(req.params.id);

    if (!accomplishment) {
      return res.status(404).json({
        success: false, // ✅ إضافة success للتوحيد
        message: "Accomplishment not found",
      });
    }

    // ✅ حساب versionIndex بشكل صحيح لجميع النسخ
    const currentVersionIndex = Array.isArray(accomplishment.previousVersions)
      ? accomplishment.previousVersions.length
      : 0;

    const comment = {
      _id: generateId(),
      text,
      commentedBy: {
        _id: req.user.id,
        name: req.user.name,
        role: req.user.role,
      },
      isReply: false,
      replyTo: null,
      createdAt: new Date(),
      versionIndex:
        versionIndex !== undefined ? versionIndex : currentVersionIndex,
    };

    const comments = accomplishment.comments || [];
    comments.unshift(comment);
    accomplishment.comments = comments;
    await accomplishment.save();

    // ✅ معالجة الإشعارات بطريقة محسّنة
    if (req.user.role === "manager") {
      // إشعار للموظف
      await Notification.create({
        user: accomplishment.employee,
        type: "comment",
        message: "تم إضافة تعليق جديد على مهمتك",
        data: { accomplishmentId: accomplishment._id, commentText: text },
      });

      // ✅ إرسال إشعار Socket
      socketService.notifyUser(accomplishment.employee, {
        type: "comment",
        message: "تم إضافة تعليق جديد على مهمتك",
        data: { accomplishmentId: accomplishment._id, commentText: text },
      });
    } else {
      // إشعارات للمدراء
      const managers = await User.findAll({ where: { role: "manager" } });

      // ✅ استخدام bulkCreate لتحسين الأداء
      const managerNotifications = managers.map((manager) => ({
        user: manager._id,
        type: "comment",
        message: `قام الموظف ${req.user.name} بإضافة تعليق على المهمة "${accomplishment.originalDescription}"`,
        data: { accomplishmentId: accomplishment._id, commentText: text },
      }));

      await Notification.bulkCreate(managerNotifications);

      // ✅ إرسال إشعار Socket للمدراء
      socketService.notifyManagers({
        type: "comment",
        message: `قام الموظف ${req.user.name} بإضافة تعليق على المهمة "${accomplishment.originalDescription}"`,
        data: { accomplishmentId: accomplishment._id, commentText: text },
      });
    }

    // ✅ إرجاع البيانات المحدّثة مع العلاقات
    const updated = await Accomplishment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "employeeInfo",
          attributes: ["_id", "name", "status", "role"],
        },
      ],
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    // ✅ استخدام معالج الأخطاء الموحد
    next(err);
  }
};
