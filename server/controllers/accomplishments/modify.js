const { Accomplishment, Notification, User } = require("../../models");

let io;
try {
  io = require("../../server").io;
} catch {}

module.exports = async function modifyAccomplishment(req, res) {
  try {
    const accomplishment = await Accomplishment.findByPk(req.params.id);
    if (!accomplishment)
      return res.status(404).json({ message: "Accomplishment not found" });

    if (String(accomplishment.employee) !== String(req.user.id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const prev = accomplishment.previousVersions || [];
    prev.push({
      description: accomplishment.description,
      files: accomplishment.files,
      modifiedAt: accomplishment.updatedAt || accomplishment.createdAt,
    });
    accomplishment.previousVersions = prev;

    accomplishment.description = req.body.description;

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

    const updated = await Accomplishment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "employeeInfo",
          attributes: ["_id", "name", "status", "role"],
        },
      ],
    });

    const managers = await User.findAll({ where: { role: "manager" } });
    for (const m of managers) {
      await Notification.create({
        user: m._id,
        type: "modification",
        message: `قام الموظف ${req.user.name} بتعديل المهمة "${updated.originalDescription}"`,
        data: { accomplishmentId: updated._id },
      });
      if (io) {
        io.to(String(m._id)).emit("notification", {
          type: "modification",
          message: `قام الموظف ${req.user.name} بتعديل المهمة "${updated.originalDescription}"`,
          data: { accomplishmentId: updated._id },
        });
      }
    }

    if (io) {
      io.to("managers").emit("accomplishmentModified", {
        accomplishmentId: updated._id,
        employeeName: updated.employeeInfo.name,
        employeeId: updated.employeeInfo._id,
      });
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: err.message });
  }
};
