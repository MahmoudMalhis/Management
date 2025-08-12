const { Accomplishment, Notification, User } = require("../../models");

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
let io;
try {
  io = require("../../server").io;
} catch {}

module.exports = async function addComment(req, res) {
  try {
    const { text, versionIndex } = req.body;
    const accomplishment = await Accomplishment.findByPk(req.params.id);
    if (!accomplishment)
      return res.status(404).json({ message: "Accomplishment not found" });

    // احسب versionIndex بشكل صحيح لجميع النسخ
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

    if (req.user.role === "manager") {
      await Notification.create({
        user: accomplishment.employee,
        type: "comment",
        message: "تم إضافة تعليق جديد على مهمتك",
        data: { accomplishmentId: accomplishment._id, commentText: text },
      });
      if (io) {
        io.to(String(accomplishment.employee)).emit("notification", {
          type: "comment",
          message: "تم إضافة تعليق جديد على مهمتك",
          data: { accomplishmentId: accomplishment._id, commentText: text },
        });
      }
    } else {
      const managers = await User.findAll({ where: { role: "manager" } });
      for (const m of managers) {
        await Notification.create({
          user: m._id,
          type: "comment",
          message: `قام الموظف ${req.user.name} بإضافة تعليق على المهمة "${accomplishment.originalDescription}"`,
          data: { accomplishmentId: accomplishment._id, commentText: text },
        });
        if (io) {
          io.to(String(m._id)).emit("notification", {
            type: "comment",
            message: `قام الموظف ${req.user.name} بإضافة تعليق على المهمة "${accomplishment.originalDescription}"`,
            data: { accomplishmentId: accomplishment._id, commentText: text },
          });
        }
      }
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
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
