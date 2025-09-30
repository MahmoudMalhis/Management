const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const helmet = require("helmet");

const { connectDB } = require("./config/db");
const { initDB } = require("./models");
// ✅ استيراد معالج الأخطاء الموحد
const errorHandler = require("./middlewares/errorHandler");
const { generalLimiter } = require("./middlewares/rateLimiter");
// ✅ استيراد خدمة Socket المحسّنة
const socketService = require("./services/socketService");

const taskTitlesRoutes = require("./routes/taskTitles");
const notificationsRoutes = require("./routes/notifications"); // ✅ تصحيح اسم المتغير ليكون camelCase
const comparisonsRoutes = require("./routes/comparisons");
const authRoutes = require("./routes/auth"); // ✅ تصحيح اسم المتغير
const accomplishmentsRoutes = require("./routes/accomplishments"); // ✅ تصحيح اسم المتغير

dotenv.config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error("❌ CRITICAL ERROR: JWT_SECRET is missing or too weak!");
  console.error("Please set a strong JWT_SECRET in .env file");
  console.error(
    "Generate one using: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
  );
  process.exit(1); // إيقاف السيرفر
}

if (process.env.JWT_SECRET === "dev_secret") {
  console.error("❌ SECURITY WARNING: Using default JWT_SECRET!");
  console.error("This is a critical security risk in production!");
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
}

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // للـ CSS
        scriptSrc: ["'self'", "'unsafe-inline'"], // للـ JavaScript
        imgSrc: ["'self'", "data:", "blob:"], // للصور
        connectSrc: ["'self'"], // لطلبات API
      },
    },
    crossOriginEmbedderPolicy: false, // للسماح بعرض الصور
  })
);

// ✅ حماية إضافية
app.use(helmet.noSniff()); // منع تخمين نوع المحتوى
app.use(helmet.xssFilter()); // حماية من XSS
app.use(helmet.referrerPolicy({ policy: "same-origin" }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production" ? false : ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// ✅ تهيئة خدمة Socket بدلاً من التصدير المباشر
socketService.initialize(io);

app.use(express.json());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production" ? false : ["http://localhost:5173"],
    credentials: true,
  })
);

app.use(
  "/uploads",
  express.static(path.join(__dirname, "../client/public/uploads"))
);

// ✅ تحديث أسماء المتغيرات لتكون متسقة
app.use("/api/auth", authRoutes);
app.use("/api/accomplishments", accomplishmentsRoutes);
app.use("/api/task-titles", taskTitlesRoutes);
app.use("/api/gallery", require("./routes/gallery"));
app.use("/api/notifications", notificationsRoutes);
app.use("/api/comparisons", comparisonsRoutes);

// ✅ إضافة معالج الأخطاء الموحد في النهاية
app.use(errorHandler);

(async () => {
  try {
    await connectDB();
    await initDB();
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
})();

// ✅ تصدير socketService بدلاً من io للاستخدام في الكنترولرز
module.exports = { socketService };
