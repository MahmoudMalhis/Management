module.exports = (sequelize, DataTypes, asArray) => {
  return sequelize.define(
    "Accomplishment",
    {
      _id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      employee: { type: DataTypes.INTEGER, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },

      files: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        get() {
          return asArray(this.getDataValue("files"));
        },
      },
      originalDescription: { type: DataTypes.TEXT, allowNull: true },
      originalFiles: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        get() {
          return asArray(this.getDataValue("originalFiles"));
        },
      },
      employeeDescription: { type: DataTypes.TEXT, allowNull: true },
      employeeFiles: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        get() {
          return asArray(this.getDataValue("employeeFiles"));
        },
      },

      status: {
        type: DataTypes.ENUM(
          "assigned",
          "pending",
          "reviewed",
          "needs_modification"
        ),
        allowNull: false,
        defaultValue: "pending",
      },
      lastContentModifiedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      taskTitle: { type: DataTypes.INTEGER, allowNull: false },

      previousVersions: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        get() {
          return asArray(this.getDataValue("previousVersions"));
        },
      },
      comments: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        get() {
          return asArray(this.getDataValue("comments"));
        },
      },
    },
    {
      tableName: "accomplishments",
      timestamps: true,
    }
  );
};
