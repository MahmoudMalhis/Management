const { validationResult } = require("express-validator");
const { Accomplishment, Notification, User } = require("../../models");
// ✅ استيراد خدمة Socket المحسّنة
const socketService = require("../../services/socketService");

// ✅ دالة موحدة لإنشاء ID
const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substring(2, 8);

module.exports = async function addEmployeeReply(req, res, next) {
  // ✅ إضافة next
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false, // ✅ إضافة success للتوحيد
        errors: errors.array(),
      });
    }

    const { text } = req.body;
    const { id, commentId } = req.params;

    const accomplishment = await Accomplishment.findByPk(id);
    if (!accomplishment) {
      return res.status(404).json({
        success: false,
        message: "Accomplishment not found",
      });
    }

    // ✅ التحقق من الصلاحيات بطريقة أوضح
    const isAuthorized =
      String(accomplishment.employee) === String(req.user.id) ||
      req.user.role === "manager";

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to reply to this accomplishment",
      });
    }

    const existingComments = accomplishment.comments || [];
    const comment = existingComments.find(
      (c) => String(c._id) === String(commentId)
    );

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // ✅ الحصول على معرف المعلق بطريقة أكثر أماناً
    const commenterId =
      comment.commentedBy && typeof comment.commentedBy === "object"
        ? comment.commentedBy._id
        : comment.commentedBy;

    // ✅ إرسال إشعار لصاحب التعليق الأصلي إذا لم يكن نفس الشخص
    if (String(commenterId) !== String(req.user.id)) {
      await Notification.create({
        user: commenterId,
        type: "reply",
        message: `قام ${req.user.name} بالرد على تعليقك في المهمة`,
        data: { accomplishmentId: accomplishment._id, replyText: text },
      });

      // ✅ إرسال إشعار Socket
      socketService.notifyUser(commenterId, {
        type: "reply",
        message: `قام ${req.user.name} بالرد على تعليقك في المهمة`,
        data: { accomplishmentId: accomplishment._id, replyText: text },
      });
    }

    // ✅ معالجة إشعارات المدراء إذا كان المرسل موظف
    if (req.user.role === "employee") {
      const managers = await User.findAll({ where: { role: "manager" } });

      // ✅ استخدام bulkCreate لتحسين الأداء
      const managerNotifications = managers.map((manager) => ({
        user: manager._id,
        type: "reply",
        message: `قام الموظف ${req.user.name} بالرد على تعليق في المهمة "${accomplishment.originalDescription}"`,
        data: { accomplishmentId: accomplishment._id, replyText: text },
      }));

      await Notification.bulkCreate(managerNotifications);

      // ✅ إرسال إشعارات Socket للمدراء
      socketService.notifyManagers({
        type: "reply",
        message: `قام الموظف ${req.user.name} بالرد على تعليق في المهمة "${accomplishment.originalDescription}"`,
        data: { accomplishmentId: accomplishment._id, replyText: text },
      });
    }

    // ✅ معالجة إشعارات المدير للموظف
    if (req.user.role === "manager") {
      const shouldNotifyEmployee =
        String(accomplishment.employee) !== String(req.user.id) &&
        String(commenterId) !== String(accomplishment.employee);

      if (shouldNotifyEmployee) {
        await Notification.create({
          user: accomplishment.employee,
          type: "reply",
          message: `قام المدير ${req.user.name} بالرد على تعليقك في المهمة "${accomplishment.originalDescription}"`,
          data: { accomplishmentId: accomplishment._id, replyText: text },
        });

        // ✅ إرسال إشعار Socket
        socketService.notifyUser(accomplishment.employee, {
          type: "reply",
          message: `قام المدير ${req.user.name} بالرد على تعليقك في المهمة "${accomplishment.originalDescription}"`,
          data: { accomplishmentId: accomplishment._id, replyText: text },
        });
      }
    }

    // ✅ إنشاء الرد وإضافته
    const reply = {
      _id: generateId(),
      text,
      commentedBy: {
        _id: req.user.id,
        name: req.user.name,
        role: req.user.role,
      },
      isReply: true,
      replyTo: commentId,
      createdAt: new Date(),
    };

    existingComments.unshift(reply);
    accomplishment.comments = existingComments;
    await accomplishment.save();

    // ✅ إرجاع البيانات المحدّثة مع العلاقات
    const updated = await Accomplishment.findByPk(id, {
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
