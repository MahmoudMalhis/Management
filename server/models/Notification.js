module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Notification",
    {
      _id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user: { type: DataTypes.INTEGER, allowNull: false },
      type: { type: DataTypes.STRING, allowNull: false },
      message: { type: DataTypes.STRING, allowNull: false },
      data: {
        type: DataTypes.JSON,
        allowNull: true,
        get() {
          const rawValue = this.getDataValue("data");
          // ✅ تحسين معالجة JSON مع try-catch أفضل
          try {
            if (typeof rawValue === "string") {
              return JSON.parse(rawValue);
            }
            return rawValue || {}; // ✅ إرجاع كائن فارغ بدلاً من null
          } catch (error) {
            console.error("Error parsing notification data:", error);
            return {}; // ✅ إرجاع كائن فارغ في حالة الخطأ
          }
        },
      },
      isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      tableName: "notifications",
      timestamps: true,
      // ✅ إضافة فهارس لتحسين الأداء
      indexes: [
        {
          fields: ["user"],
        },
        {
          fields: ["isRead"],
        },
        {
          fields: ["type"],
        },
        {
          fields: ["createdAt"],
        },
        {
          fields: ["user", "isRead"], // فهرس مركب لاستعلامات الإشعارات غير المقروءة
        },
      ],
    }
  );
};
