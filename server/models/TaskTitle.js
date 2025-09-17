module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "TaskTitle",
    {
      _id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        // ✅ إضافة validation للتأكد من عدم وجود نصوص فارغة
        validate: {
          notEmpty: {
            msg: "اسم المهمة لا يمكن أن يكون فارغاً",
          },
          len: {
            args: [1, 255],
            msg: "اسم المهمة يجب أن يكون بين 1 و 255 حرف",
          },
        },
      },
    },
    {
      tableName: "task_titles",
      timestamps: true,
      // ✅ إضافة فهارس لتحسين الأداء
      indexes: [
        {
          unique: true,
          fields: ["name"],
        },
        {
          fields: ["createdAt"],
        },
      ],
    }
  );
};
