const {
  Accomplishment,
  Notification,
  TaskTitle,
  User,
} = require("../../models");

// ✅ استيراد خدمة Socket المحسّنة بدلاً من الاستيراد المباشر
const socketService = require("../../services/socketService");

module.exports = async function createAccomplishment(req, res, next) {
  // ✅ إضافة next
  try {
    const { description, taskTitle, employee } = req.body;
    const employeeId = req.user.role === "manager" ? employee : req.user.id;

    // ✅ معالجة الملفات بطريقة أكثر أماناً
    const files = (req.files || []).map((file) => ({
      fileName: file.originalname,
      filePath: `/uploads/${file.filename}`,
      fileType: file.mimetype,
    }));

    // ✅ تحويل الـ IDs بطريقة أكثر أماناً
    const employeeIdInt = Number.isInteger(Number(employeeId))
      ? Number(employeeId)
      : employeeId;
    const taskTitleId = Number.isInteger(Number(taskTitle))
      ? Number(taskTitle)
      : taskTitle;

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

    // ✅ الحصول على اسم المهمة بطريقة أكثر أماناً
    let taskTitleName = "";
    try {
      const titleObj = await TaskTitle.findByPk(taskTitleId);
      taskTitleName = titleObj ? titleObj.name : "مهمة غير محددة";
    } catch (error) {
      console.error("Error fetching task title:", error);
      taskTitleName = "مهمة غير محددة";
    }

    // ✅ إنشاء إشعار للموظف
    await Notification.create({
      user: employeeIdInt,
      type: "new_task",
      message: `تم تعيين مهمة جديدة لك: ${taskTitleName}`,
      data: { accomplishmentId: accomplishment._id, taskTitle: taskTitleName },
    });

    // ✅ إرسال إشعار Socket للموظف
    socketService.notifyUser(employeeIdInt, {
      type: "new_task",
      message: `تم تعيين مهمة جديدة لك: ${taskTitleName}`,
      data: {
        accomplishmentId: accomplishment._id,
        taskTitle: taskTitleName,
      },
    });

    // ✅ إرسال إشعارات للمدراء إذا كان المنشئ موظف
    if (req.user.role === "employee") {
      const managers = await User.findAll({ where: { role: "manager" } });

      // ✅ استخدام bulkCreate لتحسين الأداء
      const managerNotifications = managers.map((manager) => ({
        user: manager._id,
        type: "new_task",
        message: `قام الموظف ${req.user.name} بإضافة مهمة جديدة بعنوان "${taskTitleName}"`,
        data: {
          accomplishmentId: accomplishment._id,
          taskTitle: taskTitleName,
        },
      }));

      await Notification.bulkCreate(managerNotifications);

      // ✅ إرسال إشعارات Socket للمدراء
      socketService.notifyManagers({
        type: "new_task",
        message: `قام الموظف ${req.user.name} بإضافة مهمة جديدة بعنوان "${taskTitleName}"`,
        data: {
          accomplishmentId: accomplishment._id,
          taskTitle: taskTitleName,
        },
      });
    }

    // ✅ إرجاع البيانات مع العلاقات
    const populated = await Accomplishment.findByPk(accomplishment._id, {
      include: [
        {
          model: User,
          as: "employeeInfo",
          attributes: ["_id", "name", "status"],
        },
        {
          model: TaskTitle,
          as: "taskTitleInfo",
          attributes: ["_id", "name"],
        },
      ],
    });

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    // ✅ استخدام معالج الأخطاء الموحد
    next(err);
  }
};
