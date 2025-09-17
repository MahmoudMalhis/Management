require("dotenv").config();
const { Sequelize, DataTypes, Op } = require("sequelize");

// ✅ إعدادات قاعدة البيانات محسّنة ومتوافقة مع MySQL2
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS || "",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    dialect: "mysql",
    logging: process.env.NODE_ENV === "development" ? console.log : false,

    // ✅ إعدادات connection pool محسّنة
    pool: {
      max: 20,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },

    // ✅ إعدادات dialectOptions صحيحة لـ MySQL2
    dialectOptions: {
      charset: "utf8mb4",
      // ✅ إزالة الخيارات غير المدعومة
      connectTimeout: 60000,
      // acquireTimeout و timeout غير مدعومة في dialectOptions
    },

    // ✅ إعدادات define محسّنة
    define: {
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci", // ✅ نقل collate إلى define
      underscored: false,
      freezeTableName: true,
    },

    // ✅ إعدادات retry محسّنة
    retry: {
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /ESOCKETTIMEDOUT/,
        /EHOSTUNREACH/,
        /EPIPE/,
        /EAI_AGAIN/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
      ],
      max: 3,
    },
  }
);

// ✅ دالة الاتصال محسّنة مع معالجة أفضل للأخطاء
const connectDB = async () => {
  try {
    console.log("Attempting to connect to MySQL database...");
    console.log(`Host: ${process.env.DB_HOST || "localhost"}`);
    console.log(`Port: ${process.env.DB_PORT || 3306}`);
    console.log(`Database: ${process.env.DB_NAME}`);
    console.log(`User: ${process.env.DB_USER}`);

    // ✅ اختبار الاتصال مع timeout
    await Promise.race([
      sequelize.authenticate(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Database connection timeout")),
          15000
        )
      ),
    ]);

    console.log("✅ MySQL Connected successfully");

    // ✅ اختبار إضافي للتأكد من جودة الاتصال
    await sequelize.query("SELECT 1+1 AS result");
    console.log("✅ Database connection test passed");
  } catch (error) {
    console.error("❌ MySQL connection failed:", {
      message: error.message,
      code: error.original?.code || error.code || "UNKNOWN_ERROR",
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 3306,
      database: process.env.DB_NAME,
    });

    // ✅ إرشادات مفيدة للمطور
    if (error.original?.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("💡 حل المشكلة:");
      console.error("   1. تأكد من صحة كلمة مرور MySQL في ملف .env");
      console.error("   2. تأكد من أن مستخدم MySQL موجود ولديه صلاحيات");
      console.error("   3. جرب الاتصال بـ MySQL من command line:");
      console.error(
        `      mysql -u ${process.env.DB_USER} -p -h ${process.env.DB_HOST}`
      );
    } else if (error.original?.code === "ECONNREFUSED") {
      console.error("💡 حل المشكلة:");
      console.error("   1. تأكد من أن خادم MySQL يعمل");
      console.error("   2. تحقق من المنفذ المستخدم");
      console.error("   3. تأكد من إعدادات الجدار الناري");
    } else if (error.original?.code === "ER_BAD_DB_ERROR") {
      console.error("💡 حل المشكلة:");
      console.error(
        `   1. أنشئ قاعدة البيانات: CREATE DATABASE ${process.env.DB_NAME};`
      );
      console.error("   2. تأكد من صحة اسم قاعدة البيانات في .env");
    }

    throw error;
  }
};

// ✅ دالة للتحقق من حالة قاعدة البيانات
const checkDatabaseHealth = async () => {
  try {
    await sequelize.query("SELECT 1");
    return { healthy: true, message: "Database is healthy" };
  } catch (error) {
    return {
      healthy: false,
      message: "Database connection failed",
      error: error.message,
    };
  }
};

// ✅ دالة لإغلاق الاتصال بأمان
const closeConnection = async () => {
  try {
    await sequelize.close();
    console.log("Database connection closed successfully");
  } catch (error) {
    console.error("Error closing database connection:", error);
  }
};

module.exports = {
  sequelize,
  DataTypes,
  Op,
  connectDB,
  checkDatabaseHealth,
  closeConnection,
};
