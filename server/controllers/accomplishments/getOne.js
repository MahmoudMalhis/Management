const { Accomplishment, TaskTitle, User } = require("../../models");

const toArray = (v) => (Array.isArray(v) ? v : []);

module.exports = async function getAccomplishment(req, res) {
  try {
    const acc = await Accomplishment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "employeeInfo",
          attributes: ["_id", "name", "role", "status"],
        },
        { model: TaskTitle, as: "taskTitleInfo", attributes: ["_id", "name"] },
      ],
    });

    if (!acc)
      return res
        .status(404)
        .json({ success: false, message: "Accomplishment not found" });

    if (
      req.user.role !== "manager" &&
      String(acc.employee) !== String(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this accomplishment",
      });
    }

    const data = {
      _id: acc._id,
      employee: acc.employeeInfo
        ? {
            _id: acc.employeeInfo._id,
            name: acc.employeeInfo.name,
            role: acc.employeeInfo.role,
          }
        : { _id: String(acc.employee), name: "Unknown" },
      taskTitle: acc.taskTitleInfo
        ? { _id: acc.taskTitleInfo._id, name: acc.taskTitleInfo.name }
        : { _id: String(acc.taskTitle), name: "Unknown" },
      description: acc.description,
      files: toArray(acc.files),
      originalDescription: acc.originalDescription,
      originalFiles: toArray(acc.originalFiles),
      employeeDescription: acc.employeeDescription,
      employeeFiles: toArray(acc.employeeFiles),
      status: acc.status,
      lastContentModifiedAt: acc.lastContentModifiedAt,
      createdAt: acc.createdAt,
      previousVersions: toArray(acc.previousVersions),
      comments: toArray(acc.comments),
    };

    return res.json({ success: true, data });
  } catch (err) {
    console.error("GET_ACCOMPLISHMENT_ERROR:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server Error" });
  }
};
