const { validationResult } = require("express-validator");
const { Accomplishment, Notification, User } = require("../../models");

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
let io;
try {
  io = require("../../server").io;
} catch {}

module.exports = async function addEmployeeReply(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { text } = req.body;
    const { id, commentId } = req.params;

    const accomplishment = await Accomplishment.findByPk(id);
    if (!accomplishment)
      return res
        .status(404)
        .json({ success: false, message: "Accomplishment not found" });

    if (
      String(accomplishment.employee) !== String(req.user.id) &&
      req.user.role !== "manager"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to reply to this accomplishment",
      });
    }

    const existingComments = accomplishment.comments || [];
    const comment = existingComments.find(
      (c) => String(c._id) === String(commentId)
    );
    if (!comment)
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });

    const commenterId =
      comment.commentedBy && typeof comment.commentedBy === "object"
        ? comment.commentedBy._id
        : comment.commentedBy;

    if (String(commenterId) !== String(req.user.id)) {
      await Notification.create({
        user: commenterId,
        type: "reply",
        message: `قام ${req.user.name} بالرد على تعليقك في المهمة`,
        data: { accomplishmentId: accomplishment._id, replyText: text },
      });
      if (io) {
        io.to(String(commenterId)).emit("notification", {
          type: "reply",
          message: `قام ${req.user.name} بالرد على تعليقك في المهمة`,
          data: { accomplishmentId: accomplishment._id, replyText: text },
        });
      }
    }

    if (req.user.role === "employee") {
      const managers = await User.findAll({ where: { role: "manager" } });
      for (const m of managers) {
        await Notification.create({
          user: m._id,
          type: "reply",
          message: `قام الموظف ${req.user.name} بالرد على تعليق في المهمة "${accomplishment.originalDescription}"`,
          data: { accomplishmentId: accomplishment._id, replyText: text },
        });
        if (io) {
          io.to(String(m._id)).emit("notification", {
            type: "reply",
            message: `قام الموظف ${req.user.name} بالرد على تعليق في المهمة "${accomplishment.originalDescription}"`,
            data: { accomplishmentId: accomplishment._id, replyText: text },
          });
        }
      }
    }

    if (req.user.role === "manager") {
      if (
        String(accomplishment.employee) !== String(req.user.id) &&
        String(commenterId) !== String(accomplishment.employee)
      ) {
        await Notification.create({
          user: accomplishment.employee,
          type: "reply",
          message: `قام المدير ${req.user.name} بالرد على تعليقك في المهمة "${accomplishment.originalDescription}"`,
          data: { accomplishmentId: accomplishment._id, replyText: text },
        });
        if (io) {
          io.to(String(accomplishment.employee)).emit("notification", {
            type: "reply",
            message: `قام المدير ${req.user.name} بالرد على تعليقك في المهمة "${accomplishment.originalDescription}"`,
            data: { accomplishmentId: accomplishment._id, replyText: text },
          });
        }
      }
    }

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
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
