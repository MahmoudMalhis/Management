const { sequelize, DataTypes, Op } = require("../config/db");
const asArray = require("../utils/asArray");
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

User.hasMany(Accomplishment, { foreignKey: "employee", as: "accomplishments" });
Accomplishment.belongsTo(User, { foreignKey: "employee", as: "employeeInfo" });

TaskTitle.hasMany(Accomplishment, {
  foreignKey: "taskTitle",
  as: "accomplishments",
});
Accomplishment.belongsTo(TaskTitle, {
  foreignKey: "taskTitle",
  as: "taskTitleInfo",
});

User.hasMany(Notification, { foreignKey: "user", as: "notifications" });
Notification.belongsTo(User, { foreignKey: "user", as: "userInfo" });

User.hasMany(GalleryFolder, { foreignKey: "createdBy", as: "galleryFolders" });
GalleryFolder.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

User.hasMany(SavedComparison, {
  foreignKey: "createdBy",
  as: "savedComparisons",
});
SavedComparison.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

const initDB = async () => {
  await sequelize.sync();
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
