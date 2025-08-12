const { Accomplishment, Notification, User } = require("../../models");

let io;
try {
  io = require("../../server").io;
} catch {}

module.exports = async function startAccomplishment(req, res) {
  const accomplishment = await Accomplishment.findByPk(req.params.id);
  if (!accomplishment)
    return res.status(404).json({ message: "Accomplishment not found" });

  if (String(accomplishment.employee) !== String(req.user.id)) {
    return res.status(403).json({ message: "Not authorized" });
  }

  if (accomplishment.status !== "assigned") {
    return res.status(400).json({ message: "Task already started" });
  }

  accomplishment.employeeDescription = req.body.description;
  accomplishment.employeeFiles = (req.files || []).map((f) => ({
    fileName: f.originalname,
    filePath: `/uploads/${f.filename}`,
    fileType: f.mimetype,
  }));
  accomplishment.files = [...accomplishment.employeeFiles];
  accomplishment.description = accomplishment.employeeDescription;
  accomplishment.status = "pending";
  accomplishment.lastContentModifiedAt = new Date();
  await accomplishment.save();

  const managers = await User.findAll({ where: { role: "manager" } });
  for (const m of managers) {
    await Notification.create({
      user: m._id,
      type: "accomplishment_started",
      message: `قام الموظف ${req.user.name} ببدء العمل على المهمة "${accomplishment.originalDescription}"`,
      data: { accomplishmentId: accomplishment._id },
    });
    if (io) {
      io.to(String(m._id)).emit("notification", {
        type: "accomplishment_started",
        message: `قام الموظف ${req.user.name} بعمل على المهمة "${accomplishment.originalDescription}"`,
        data: { accomplishmentId: accomplishment._id },
      });
    }
  }

  const updated = await Accomplishment.findByPk(req.params.id, {
    include: [{ model: User, as: "employeeInfo", attributes: ["_id", "name"] }],
  });
  res.json({ success: true, data: updated });
};
