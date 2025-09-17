module.exports = (sequelize, DataTypes, asArray) => {
  return sequelize.define(
    "SavedComparison",
    {
      _id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: {
        type: DataTypes.STRING,
        defaultValue: "",
        // ✅ إضافة validation
        validate: {
          len: {
            args: [0, 255],
            msg: "اسم المقارنة يجب أن يكون أقل من 255 حرف",
          },
        },
      },
      employeeIds: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        get() {
          return asArray(this.getDataValue("employeeIds"));
        },
        // ✅ إضافة validation للتأكد من وجود موظفين على الأقل
        validate: {
          notEmpty: {
            msg: "يجب تحديد موظف واحد على الأقل",
          },
        },
      },
      notes: {
        type: DataTypes.TEXT,
        defaultValue: "",
        // ✅ إضافة validation
        validate: {
          len: {
            args: [0, 2000],
            msg: "الملاحظات يجب أن تكون أقل من 2000 حرف",
          },
        },
      },
      range: {
        type: DataTypes.ENUM("all", "week", "month", "year", "custom"),
        defaultValue: "all",
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: true,
        // ✅ إضافة validation للتاريخ
        validate: {
          isDate: {
            msg: "تاريخ البداية يجب أن يكون تاريخ صحيح",
          },
        },
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: true,
        // ✅ إضافة validation للتاريخ
        validate: {
          isDate: {
            msg: "تاريخ النهاية يجب أن يكون تاريخ صحيح",
          },
          // ✅ التأكد من أن تاريخ النهاية بعد تاريخ البداية
          isAfterStartDate(value) {
            if (
              value &&
              this.startDate &&
              new Date(value) < new Date(this.startDate)
            ) {
              throw new Error("تاريخ النهاية يجب أن يكون بعد تاريخ البداية");
            }
          },
        },
      },
      createdBy: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: "saved_comparisons",
      timestamps: true,
      // ✅ إضافة فهارس لتحسين الأداء
      indexes: [
        {
          fields: ["createdBy"],
        },
        {
          fields: ["range"],
        },
        {
          fields: ["createdAt"],
        },
      ],
    }
  );
};
