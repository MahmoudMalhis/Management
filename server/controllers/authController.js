const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { User, Accomplishment, Notification } = require("../models");

// ✅ دالة موحدة لإرسال الاستجابة مع التوكن
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id }, // ✅ استخدام _id بشكل متسق
    process.env.JWT_SECRET || "dev_secret",
    {
      expiresIn: "30d",
    }
  );

  return res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: String(user._id), // ✅ تحويل إلى string للثبات
      id: String(user._id), // ✅ إضافة id للتوافق مع الواجهة
      name: user.name,
      role: user.role,
    },
  });
};

exports.login = async (req, res, next) => {
  // ✅ إضافة next للاستفادة من معالج الأخطاء
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false, // ✅ إضافة success للتوحيد
        errors: errors.array(),
      });
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
    // ✅ تمرير الخطأ لمعالج الأخطاء الموحد
    next(err);
  }
};

exports.registerEmployee = async (req, res, next) => {
  // ✅ إضافة next
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
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
      id: String(user._id), // ✅ تحويل إلى string
      _id: String(user._id), // ✅ إضافة _id للتوحيد
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };

    res.status(201).json({
      success: true,
      user: userResponse,
    });
  } catch (err) {
    // ✅ استخدام معالج الأخطاء الموحد بدلاً من console.error مخصص
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  // ✅ إضافة next
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });
    res.json({
      success: true,
      user,
    });
  } catch (err) {
    next(err); // ✅ استخدام معالج الأخطاء الموحد
  }
};

exports.getEmployees = async (req, res, next) => {
  // ✅ إضافة next
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
    next(err); // ✅ استخدام معالج الأخطاء الموحد
  }
};

exports.getEmployeeById = async (req, res, next) => {
  // ✅ إضافة next
  try {
    const id = Number(req.params.id);
    const user = await User.findByPk(id, {
      attributes: ["_id", "name", "role", "status", "createdAt"],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${req.params.id} not found`,
      });
    }

    // ✅ فحص الدور بطريقة أوضح
    if (user.role !== "employee") {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${req.params.id} not found`,
      });
    }

    return res.json({
      success: true,
      data: {
        id: String(user._id), // ✅ تحويل إلى string
        _id: String(user._id), // ✅ إضافة _id للتوحيد
        name: user.name,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err); // ✅ استخدام معالج الأخطاء الموحد
  }
};

exports.deleteEmployee = async (req, res, next) => {
  // ✅ إضافة next
  try {
    const { id } = req.params;
    const mode = (req.query.mode || "archive").toLowerCase();

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "employee") {
      return res.status(400).json({
        success: false,
        message: "Only employees can be deleted/archived",
      });
    }

    if (mode === "hard") {
      // ✅ استخدام Promise.all لتحسين الأداء
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

    // ✅ تحديث حالة الموظف بدلاً من الحذف
    user.status = "archived";
    user.disabledLogin = true;
    await user.save();

    return res.json({
      success: true,
      message: "Employee archived",
      data: { id: String(user._id) }, // ✅ تحويل إلى string
    });
  } catch (err) {
    next(err); // ✅ استخدام معالج الأخطاء الموحد
  }
};

exports.unarchiveEmployee = async (req, res, next) => {
  // ✅ إضافة next
  try {
    const { id } = req.params;
    const employee = await User.findByPk(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (employee.role !== "employee") {
      return res.status(400).json({
        success: false,
        message: "Only employees can be unarchived",
      });
    }

    // ✅ استعادة حالة الموظف
    employee.status = "active";
    employee.disabledLogin = false;
    await employee.save();

    res.json({
      success: true,
      message: "Employee restored",
      data: {
        id: String(employee._id), // ✅ تحويل إلى string
        _id: String(employee._id), // ✅ إضافة _id للتوحيد
        name: employee.name,
        role: employee.role,
        status: employee.status,
      },
    });
  } catch (err) {
    next(err); // ✅ استخدام معالج الأخطاء الموحد
  }
};
