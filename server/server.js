const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const { connectDB } = require("./config/db");
const { initDB } = require("./models");
// ✅ استيراد معالج الأخطاء الموحد
const errorHandler = require("./middlewares/errorHandler");
// ✅ استيراد خدمة Socket المحسّنة
const socketService = require("./services/socketService");

const taskTitlesRoutes = require("./routes/taskTitles");
const notificationsRoutes = require("./routes/notifications"); // ✅ تصحيح اسم المتغير ليكون camelCase
const comparisonsRoutes = require("./routes/comparisons");
const authRoutes = require("./routes/auth"); // ✅ تصحيح اسم المتغير
const accomplishmentsRoutes = require("./routes/accomplishments"); // ✅ تصحيح اسم المتغير

dotenv.config();

const app = express();
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
