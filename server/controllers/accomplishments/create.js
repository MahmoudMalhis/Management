const {
  Accomplishment,
  Notification,
  TaskTitle,
  User,
} = require("../../models");

let io;
try {
  io = require("../../server").io;
} catch {}

module.exports = async function createAccomplishment(req, res) {
  try {
    const { description, taskTitle, employee } = req.body;
    const employeeId = req.user.role === "manager" ? employee : req.user.id;

    const files = (req.files || []).map((file) => ({
      fileName: file.originalname,
      filePath: `/uploads/${file.filename}`,
      fileType: file.mimetype,
    }));

    const employeeIdInt = isNaN(Number(employeeId))
      ? employeeId
      : Number(employeeId);
    const taskTitleId = isNaN(Number(taskTitle))
      ? taskTitle
      : Number(taskTitle);

    const accomplishment = await Accomplishment.create({
      description,
      taskTitle: taskTitleId,
      employee: employeeIdInt,
      files,
      status: req.user.role === "manager" ? "assigned" : "pending",
      originalDescription: req.user.role === "manager" ? description : null,
      originalFiles: req.user.role === "manager" ? files : [],
      employeeDescription: req.user.role === "employee" ? description : null,
      employeeFiles: req.user.role === "employee" ? files : [],
    });

    let taskTitleName = "";
    try {
      const titleObj = await TaskTitle.findByPk(taskTitleId);
      taskTitleName = titleObj ? titleObj.name : "";
    } catch {}

    await Notification.create({
      user: employeeIdInt,
      type: "new_task",
      message: `تم تعيين مهمة جديدة لك: ${taskTitleName}`,
      data: { accomplishmentId: accomplishment._id, taskTitle: taskTitleName },
    });

    if (io) {
      io.to(String(employeeIdInt)).emit("notification", {
        type: "new_task",
        message: `تم تعيين مهمة جديدة لك: ${taskTitleName}`,
        data: {
          accomplishmentId: accomplishment._id,
          taskTitle: taskTitleName,
        },
      });
    }

    if (req.user.role === "employee") {
      const managers = await User.findAll({ where: { role: "manager" } });
      for (const m of managers) {
        await Notification.create({
          user: m._id,
          type: "new_task",
          message: `قام الموظف ${req.user.name} بإضافة مهمة جديدة بعنوان "${taskTitleName}"`,
          data: {
            accomplishmentId: accomplishment._id,
            taskTitle: taskTitleName,
          },
        });
        if (io) {
          io.to(String(m._id)).emit("notification", {
            type: "new_task",
            message: `قام الموظف ${req.user.name} بإضافة مهمة جديدة بعنوان "${taskTitleName}"`,
            data: {
              accomplishmentId: accomplishment._id,
              taskTitle: taskTitleName,
            },
          });
        }
      }
    }

    const populated = await Accomplishment.findByPk(accomplishment._id, {
      include: [
        {
          model: User,
          as: "employeeInfo",
          attributes: ["_id", "name", "status"],
        },
        { model: TaskTitle, as: "taskTitleInfo", attributes: ["_id", "name"] },
      ],
    });

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
