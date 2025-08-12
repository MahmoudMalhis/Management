const { TaskTitle } = require("../models");

exports.getTaskTitles = async (req, res) => {
  try {
    const titles = await TaskTitle.findAll({ order: [["createdAt", "DESC"]] });
    res.json({ success: true, data: titles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addTaskTitle = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "العنوان مطلوب" });
    }
    const exists = await TaskTitle.findOne({ where: { name } });
    if (exists) {
      return res
        .status(409)
        .json({ success: false, message: "العنوان موجود مسبقاً" });
    }
    const title = await TaskTitle.create({ name });
    res.status(201).json({ success: true, data: title });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.editTaskTitle = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const title = await TaskTitle.findByPk(id);
    if (!title) {
      return res
        .status(404)
        .json({ success: false, message: "العنوان غير موجود" });
    }
    title.name = name;
    await title.save();
    res.json({ success: true, data: title });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteTaskTitle = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCount = await TaskTitle.destroy({ where: { _id: id } });
    if (!deletedCount) {
      return res
        .status(404)
        .json({ success: false, message: "العنوان غير موجود" });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
