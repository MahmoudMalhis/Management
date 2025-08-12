const express = require("express");
const { check } = require("express-validator");
const {
  login,
  registerEmployee,
  getMe,
  getEmployees,
  getEmployeeById,
  deleteEmployee,
  unarchiveEmployee,
} = require("../controllers/authController");
const { protect, authorize } = require("../middlewares/auth");

const router = express.Router();

router.post(
  "/login",
  [
    check("name", "Name is required").not().isEmpty(),
    check("password", "Password is required").exists(),
  ],
  login
);

router.post(
  "/register",
  [
    protect,
    authorize("manager"),
    check("name", "Name is required").not().isEmpty(),
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  registerEmployee
);

router.get("/me", protect, getMe);

router.get("/employees", protect, authorize("manager"), getEmployees);

router.get("/employees/:id", protect, authorize("manager"), getEmployeeById);

router.delete("/employees/:id", protect, authorize("manager"), deleteEmployee);

router.patch(
  "/employees/:id/unarchive",
  protect,
  authorize("manager"),
  unarchiveEmployee
);

module.exports = router;
