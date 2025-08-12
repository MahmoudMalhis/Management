const { Accomplishment, TaskTitle, User, Op } = require("../../models");

const toArray = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
};

module.exports = async function getAccomplishments(req, res) {
  try {
    const where = {};
    if (req.user.role === "employee") where.employee = req.user.id;
    else if (req.user.role === "manager" && req.query.employee)
      where.employee = req.query.employee;

    if (req.query.startDate && req.query.endDate) {
      where.createdAt = {
        [Op.gte]: new Date(req.query.startDate),
        [Op.lte]: new Date(req.query.endDate),
      };
    } else if (req.query.startDate)
      where.createdAt = { [Op.gte]: new Date(req.query.startDate) };
    else if (req.query.endDate)
      where.createdAt = { [Op.lte]: new Date(req.query.endDate) };

    const rows = await Accomplishment.findAll({
      where,
      include: [
        {
          model: User,
          as: "employeeInfo",
          attributes: ["_id", "name", "status"],
        },
        { model: TaskTitle, as: "taskTitleInfo", attributes: ["_id", "name"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    const normalized = rows.map((acc) => {
      const plain = acc.get ? acc.get({ plain: true }) : acc;
      return {
        _id: plain._id,
        description: plain.description,
        originalDescription: plain.originalDescription || null,
        originalFiles: toArray(plain.originalFiles),
        employeeDescription: plain.employeeDescription || null,
        employeeFiles: toArray(plain.employeeFiles),

        status: plain.status,
        createdAt: plain.createdAt,
        lastContentModifiedAt: plain.lastContentModifiedAt,
        files: toArray(plain.files),
        comments: toArray(plain.comments),
        previousVersions: toArray(plain.previousVersions),

        employeeInfo: plain.employeeInfo
          ? {
              _id: plain.employeeInfo._id,
              name: plain.employeeInfo.name,
              status: plain.employeeInfo.status,
            }
          : null,
        taskTitleInfo: plain.taskTitleInfo
          ? { _id: plain.taskTitleInfo._id, name: plain.taskTitleInfo.name }
          : null,
      };
    });

    const data =
      req.user.role === "manager" && !req.query.employee
        ? normalized.filter(
            (a) => a.employeeInfo && a.employeeInfo.status !== "archived"
          )
        : normalized;

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
