const { Accomplishment, Notification, User } = require("../../models");
// ✅ استيراد خدمة Socket المحسّنة
const socketService = require("../../services/socketService");

// ✅ دالة موحدة لإنشاء ID
const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substring(2, 8);

module.exports = async function reviewAccomplishment(req, res, next) {
  // ✅ إضافة next
  try {
    const { status, comment } = req.body;

    // ✅ التحقق من صحة حالة المراجعة
    const validStatuses = ["reviewed", "needs_modification"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Use "reviewed" or "needs_modification"',
      });
    }

    const accomplishment = await Accomplishment.findByPk(req.params.id);
    if (!accomplishment) {
      return res.status(404).json({
        success: false,
        message: "Accomplishment not found",
      });
    }

    // ✅ تحديث حالة الإنجاز
    accomplishment.status = status;

    // ✅ إضافة تعليق إذا تم توفيره
    if (comment && comment.trim()) {
      const newComment = {
        _id: generateId(),
        text: comment.trim(), // ✅ تنظيف النص
        commentedBy: {
          _id: req.user.id,
          name: req.user.name,
          role: req.user.role,
        },
        isReply: false,
        replyTo: null,
        createdAt: new Date(),
        versionIndex: Array.isArray(accomplishment.previousVersions)
          ? accomplishment.previousVersions.length
          : 0,
      };

      const existingComments = accomplishment.comments || [];
      existingComments.unshift(newComment);
      accomplishment.comments = existingComments;
    }

    await accomplishment.save();

    // ✅ معالجة الإشعارات بناءً على نوع المراجعة
    let notificationMessage = "";
    let notificationType = "";

    if (status === "reviewed") {
      notificationMessage = "تم اعتماد إنجازك من قبل المدير";
      notificationType = "reviewed";
    } else {
      notificationMessage = "تم طلب تعديل على مهمتك";
      notificationType = "modification_request";
    }

    // ✅ إنشاء الإشعار
    await Notification.create({
      user: accomplishment.employee,
      type: notificationType,
      message: notificationMessage,
      data: { accomplishmentId: accomplishment._id },
    });

    // ✅ إرسال إشعار Socket
    socketService.notifyUser(accomplishment.employee, {
      type: notificationType,
      message: notificationMessage,
      data: { accomplishmentId: accomplishment._id },
    });

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

    res.json({ success: true, data: updated });
  } catch (err) {
    // ✅ استخدام معالج الأخطاء الموحد
    next(err);
  }
};
