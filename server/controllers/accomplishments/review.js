const { Accomplishment, Notification, User } = require("../../models");
const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
let io;
try {
  io = require("../../server").io;
} catch {}

module.exports = async function reviewAccomplishment(req, res) {
  try {
    const { status, comment } = req.body;
    if (!["reviewed", "needs_modification"].includes(status)) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'Invalid status. Use "reviewed" or "needs_modification"',
        });
    }

    const accomplishment = await Accomplishment.findByPk(req.params.id);
    if (!accomplishment)
      return res
        .status(404)
        .json({ success: false, message: "Accomplishment not found" });

    accomplishment.status = status;

    if (comment && comment.trim()) {
      const newComment = {
        _id: generateId(),
        text: comment,
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
      const existing = accomplishment.comments || [];
      existing.unshift(newComment);
      accomplishment.comments = existing;
    }

    await accomplishment.save();

    if (status === "reviewed") {
      await Notification.create({
        user: accomplishment.employee,
        type: "reviewed",
        message: "تم اعتماد إنجازك من قبل المدير",
        data: { accomplishmentId: accomplishment._id },
      });
      if (io)
        io.to(String(accomplishment.employee)).emit("notification", {
          type: "reviewed",
          message: "تم اعتماد إنجازك من قبل المدير",
          data: { accomplishmentId: accomplishment._id },
        });
    } else {
      await Notification.create({
        user: accomplishment.employee,
        type: "modification_request",
        message: "تم طلب تعديل على مهمتك",
        data: { accomplishmentId: accomplishment._id },
      });
      if (io)
        io.to(String(accomplishment.employee)).emit("notification", {
          type: "modification_request",
          message: "تم طلب تعديل على مهمتك",
          data: { accomplishmentId: accomplishment._id },
        });
    }

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
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
