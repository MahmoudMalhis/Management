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
          try {
            return typeof rawValue === "string"
              ? JSON.parse(rawValue)
              : rawValue;
          } catch {
            return null;
          }
        },
      },
      isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      tableName: "notifications",
      timestamps: true,
    }
  );
};
