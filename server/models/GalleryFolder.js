module.exports = (sequelize, DataTypes, asArray) => {
  return sequelize.define(
    "GalleryFolder",
    {
      _id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      createdBy: { type: DataTypes.INTEGER, allowNull: true },
      files: {
        type: DataTypes.JSON,
        defaultValue: [],
        get() {
          return asArray(this.getDataValue("files"));
        },
      },
    },
    {
      tableName: "gallery_folders",
      timestamps: true,
    }
  );
};
