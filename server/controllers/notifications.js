const { Notification } = require("../models");

exports.getNotifications = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "20", 10), 1);
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
      totalCount: result.count,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    console.error("getNotifications error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      {
        where: { user: req.user.id, isRead: false },
      }
    );
    return res.json({ success: true });
  } catch (err) {
    console.error("markAllRead error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const notif = await Notification.findOne({
      where: { _id: req.params.id, user: req.user.id },
    });
    if (!notif) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }
    if (!notif.isRead) {
      notif.isRead = true;
      await notif.save();
    }
    return res.json({ success: true, data: notif });
  } catch (err) {
    console.error("markNotificationRead error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
