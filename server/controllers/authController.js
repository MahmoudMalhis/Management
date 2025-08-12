const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { User, Accomplishment, Notification } = require("../models");
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || "dev_secret",
    {
      expiresIn: "30d",
    }
  );

  return res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: String(user._id),
      id: String(user._id),
      name: user.name,
      role: user.role,
    },
  });
};

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, password } = req.body;

    let user = await User.findOne({ where: { name } });

    if (!user) {
      const anyManager = await User.findOne({ where: { role: "manager" } });
      if (!anyManager) {
        user = await User.create({
          name,
          password,
          role: "manager",
        });

        if (user.status === "archived" || user.disabledLogin) {
          return res.status(403).json({
            success: false,
            message: "Account is archived/disabled",
          });
        }

        return sendTokenResponse(user, 200, res);
      } else {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }
    }

    if (user.status === "archived" || user.disabledLogin) {
      return res.status(403).json({
        success: false,
        message: "Account is archived/disabled",
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.registerEmployee = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, password } = req.body;
    const existingUser = await User.findOne({ where: { name } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const user = await User.create({
      name,
      password,
      role: "employee",
    });

    const userResponse = {
      id: user._id,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };

    res.status(201).json({
      success: true,
      user: userResponse,
    });
  } catch (err) {
    console.error("Error registering employee:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server Error",
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });
    res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getEmployees = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { role: "employee" };
    if (status === "archived") filter.status = "archived";
    if (status === "active") filter.status = "active";

    const employees = await User.findAll({
      where: filter,
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const id = Number(req.params.id); // تأكد أنه رقم
    const user = await User.findByPk(id, {
      attributes: ["_id", "name", "role", "status", "createdAt"],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${req.params.id} not found`,
      });
    }

    // لو بدك ترجّع فقط الموظفين، خليه 404 إذا ليس موظف
    // إذا بدك ترجع أي مستخدم، احذف هذا الشرط.
    if (user.role !== "employee") {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${req.params.id} not found`,
      });
    }

    return res.json({
      success: true,
      data: {
        id: String(user._id),
        _id: String(user._id), // للتماشي مع الواجهة
        name: user.name,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const mode = (req.query.mode || "archive").toLowerCase(); // 'hard' | 'archive'

    const user = await User.findByPk(id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    if (user.role !== "employee") {
      return res.status(400).json({
        success: false,
        message: "Only employees can be deleted/archived",
      });
    }

    if (mode === "hard") {
      await Promise.all([
        Accomplishment.destroy({ where: { employee: id } }),
        Notification.destroy({ where: { user: id } }),
      ]);
      await User.destroy({ where: { _id: id } });
      return res.json({
        success: true,
        message: "Employee and related data deleted",
      });
    }

    user.status = "archived";
    user.disabledLogin = true;
    await user.save();

    return res.json({
      success: true,
      message: "Employee archived",
      data: { id: user._id },
    });
  } catch (err) {
    console.error("deleteEmployee error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.unarchiveEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const emp = await User.findByPk(id);
    if (!emp)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    if (emp.role !== "employee")
      return res
        .status(400)
        .json({ success: false, message: "Only employees can be unarchived" });

    emp.status = "active";
    emp.disabledLogin = false;
    await emp.save();

    res.json({
      success: true,
      message: "Employee restored",
      data: {
        id: emp._id,
        name: emp.name,
        role: emp.role,
        status: emp.status,
      },
    });
  } catch (err) {
    console.error("unarchiveEmployee error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
