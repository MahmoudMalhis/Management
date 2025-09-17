const { Notification } = require("../models");

exports.getNotifications = async (req, res, next) => {
  // ✅ إضافة next
  try {
    // ✅ تحسين معالجة معاملات الصفحة والحد الأقصى
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "20", 10), 1),
      100
    ); // ✅ حد أقصى 100
    const offset = (page - 1) * limit;

    const result = await Notification.findAndCountAll({
      where: { user: req.user.id },
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const totalPages = Math.max(Math.ceil(result.count / limit), 1);

    return res.json({
      success: true,
      data: result.rows,
      pagination: {
        // ✅ تجميع معلومات الصفحة في كائن منفصل
        totalCount: result.count,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    // ✅ استخدام معالج الأخطاء الموحد
    next(err);
  }
};

exports.markAllRead = async (req, res, next) => {
  // ✅ إضافة next
  try {
    const [updatedCount] = await Notification.update(
      { isRead: true },
      {
        where: { user: req.user.id, isRead: false },
      }
    );

    return res.json({
      success: true,
      message: `تم تحديد ${updatedCount} إشعارات كمقروءة`, // ✅ رسالة أكثر وضوحاً
    });
  } catch (err) {
    // ✅ استخدام معالج الأخطاء الموحد
    next(err);
  }
};

exports.markNotificationRead = async (req, res, next) => {
  // ✅ إضافة next
  try {
    const notification = await Notification.findOne({
      where: { _id: req.params.id, user: req.user.id },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // ✅ تحديث الإشعار فقط إذا لم يكن مقروءاً من قبل
    if (!notification.isRead) {
      notification.isRead = true;
      await notification.save();
    }

    return res.json({
      success: true,
      data: notification,
      message: "تم تحديد الإشعار كمقروء", // ✅ رسالة تأكيد
    });
  } catch (err) {
    // ✅ استخدام معالج الأخطاء الموحد
    next(err);
  }
};
