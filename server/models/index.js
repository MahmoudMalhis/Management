const { sequelize, DataTypes, Op } = require("../config/db");
const asArray = require("../utils/asArray");

// ✅ تحسين ترتيب الاستيرادات وإضافة تعليقات
const User = require("./User")(sequelize, DataTypes);
const TaskTitle = require("./TaskTitle")(sequelize, DataTypes);
const Notification = require("./Notification")(sequelize, DataTypes);
const SavedComparison = require("./SavedComparison")(
  sequelize,
  DataTypes,
  asArray
);
const GalleryFolder = require("./GalleryFolder")(sequelize, DataTypes, asArray);
const Accomplishment = require("./Accomplishment")(
  sequelize,
  DataTypes,
  asArray
);

// ✅ تحسين تعريف العلاقات مع إضافة تعليقات واضحة
// علاقة المستخدم بالإنجازات (one-to-many)
User.hasMany(Accomplishment, {
  foreignKey: "employee",
  as: "accomplishments",
  onDelete: "CASCADE", // ✅ حذف الإنجازات عند حذف المستخدم
});
Accomplishment.belongsTo(User, {
  foreignKey: "employee",
  as: "employeeInfo",
});

// علاقة عنوان المهمة بالإنجازات (one-to-many)
TaskTitle.hasMany(Accomplishment, {
  foreignKey: "taskTitle",
  as: "accomplishments",
  onDelete: "RESTRICT", // ✅ منع حذف العنوان إذا كان مستخدم في إنجازات
});
Accomplishment.belongsTo(TaskTitle, {
  foreignKey: "taskTitle",
  as: "taskTitleInfo",
});

// علاقة المستخدم بالإشعارات (one-to-many)
User.hasMany(Notification, {
  foreignKey: "user",
  as: "notifications",
  onDelete: "CASCADE", // ✅ حذف الإشعارات عند حذف المستخدم
});
Notification.belongsTo(User, {
  foreignKey: "user",
  as: "userInfo",
});

// علاقة المستخدم بمجلدات المعرض (one-to-many)
User.hasMany(GalleryFolder, {
  foreignKey: "createdBy",
  as: "galleryFolders",
  onDelete: "SET NULL", // ✅ تعيين NULL عند حذف المستخدم بدلاً من حذف المجلدات
});
GalleryFolder.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
});

// علاقة المستخدم بالمقارنات المحفوظة (one-to-many)
User.hasMany(SavedComparison, {
  foreignKey: "createdBy",
  as: "savedComparisons",
  onDelete: "CASCADE", // ✅ حذف المقارنات عند حذف المستخدم
});
SavedComparison.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
});

// ✅ تحسين دالة تهيئة قاعدة البيانات مع معالجة أفضل للأخطاء
const initDB = async () => {
  try {
    console.log("Initializing database...");

    // ✅ مزامنة الجداول مع إضافة الفهارس
    await sequelize.sync({
      alter: process.env.NODE_ENV === "development", // ✅ تعديل الجداول في بيئة التطوير فقط
    });

    console.log("Database synchronized successfully");

    // ✅ التحقق من وجود مدير في النظام
    const managerCount = await User.count({
      where: { role: "manager" },
    });

    if (managerCount === 0) {
      console.log("No managers found, system will create one on first login");
    } else {
      console.log(`Found ${managerCount} manager(s) in the system`);
    }
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error; // ✅ إعادة throw للخطأ ليتم التعامل معه في المستوى الأعلى
  }
};

module.exports = {
  sequelize,
  Op,
  initDB,
  User,
  TaskTitle,
  Notification,
  SavedComparison,
  GalleryFolder,
  Accomplishment,
};
