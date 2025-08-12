module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "TaskTitle",
    {
      _id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false, unique: true },
    },
    {
      tableName: "task_titles",
      timestamps: true,
    }
  );
};
