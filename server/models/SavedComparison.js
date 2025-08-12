module.exports = (sequelize, DataTypes, asArray) => {
  return sequelize.define(
    "SavedComparison",
    {
      _id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, defaultValue: "" },
      employeeIds: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        get() {
          return asArray(this.getDataValue("employeeIds"));
        },
      },
      notes: { type: DataTypes.TEXT, defaultValue: "" },
      range: {
        type: DataTypes.ENUM("all", "week", "month", "year", "custom"),
        defaultValue: "all",
      },
      startDate: { type: DataTypes.DATE, allowNull: true },
      endDate: { type: DataTypes.DATE, allowNull: true },
      createdBy: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: "saved_comparisons",
      timestamps: true,
    }
  );
};
