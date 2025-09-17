module.exports = (sequelize, DataTypes, asArray) => {
  return sequelize.define(
    "GalleryFolder",
    {
      _id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        // ✅ إضافة validation لاسم المجلد
        validate: {
          notEmpty: {
            msg: "اسم المجلد لا يمكن أن يكون فارغاً",
          },
          len: {
            args: [1, 255],
            msg: "اسم المجلد يجب أن يكون بين 1 و 255 حرف",
          },
          // ✅ منع الأحرف الخطيرة في أسماء المجلدات
          isValidFolderName(value) {
            const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
            if (dangerousChars.test(value)) {
              throw new Error("اسم المجلد يحتوي على أحرف غير مسموحة");
            }
          },
        },
      },
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
      // ✅ إضافة فهارس لتحسين الأداء
      indexes: [
        {
          fields: ["createdBy"],
        },
        {
          fields: ["name"],
        },
        {
          fields: ["createdAt"],
        },
      ],
    }
  );
};
