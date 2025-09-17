const bcrypt = require("bcryptjs");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      _id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false, unique: true },
      password: { type: DataTypes.STRING, allowNull: false },
      role: {
        type: DataTypes.ENUM("manager", "employee"),
        defaultValue: "employee",
      },
      status: {
        type: DataTypes.ENUM("active", "archived"),
        defaultValue: "active",
      },
      disabledLogin: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      tableName: "users",
      timestamps: true,
    }
  );

  // ✅ تحسين hook الـ beforeCreate مع معالجة أفضل للأخطاء
  User.beforeCreate(async (user) => {
    if (user.password) {
      try {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      } catch (error) {
        console.error("Error hashing password on create:", error);
        throw new Error("فشل في تشفير كلمة المرور"); // ✅ رسالة خطأ واضحة
      }
    }
  });

  // ✅ تحسين hook الـ beforeUpdate مع معالجة أفضل للأخطاء
  User.beforeUpdate(async (user) => {
    if (user.changed("password")) {
      try {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      } catch (error) {
        console.error("Error hashing password on update:", error);
        throw new Error("فشل في تشفير كلمة المرور"); // ✅ رسالة خطأ واضحة
      }
    }
  });

  // ✅ تحسين دالة مقارنة كلمة المرور مع معالجة أفضل للأخطاء
  User.prototype.matchPassword = async function (enteredPassword) {
    try {
      if (!enteredPassword || !this.password) {
        return false;
      }
      return await bcrypt.compare(enteredPassword, this.password);
    } catch (error) {
      console.error("Error comparing passwords:", error);
      return false; // ✅ إرجاع false في حالة الخطأ بدلاً من throw
    }
  };

  return User;
};
