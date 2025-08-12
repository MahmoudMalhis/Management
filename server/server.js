const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const { connectDB } = require("./config/db");
const { initDB } = require("./models");

const taskTitlesRoutes = require("./routes/taskTitles");
const Notifications = require("./routes/notifications");
const comparisonsRoutes = require("./routes/comparisons");
const auth = require("./routes/auth");
const accomplishments = require("./routes/accomplishments");

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

module.exports = { io };

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

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinRoom", ({ userId, role }) => {
    if (role === "manager") socket.join("managers");
    socket.join(String(userId));
  });

  socket.on("newAccomplishment", (data) => {
    socket.to("managers").emit("newAccomplishmentAlert", data);
  });

  socket.on(
    "accomplishmentStatusChanged",
    ({ accomplishmentId, employeeId, status }) => {
      socket
        .to(String(employeeId))
        .emit("accomplishmentStatusChangedAlert", { accomplishmentId, status });
    }
  );

  socket.on("newComment", ({ accomplishmentId, employeeId }) => {
    socket.to(String(employeeId)).emit("newCommentAlert", { accomplishmentId });
  });

  socket.on("newReply", ({ accomplishmentId, managerId }) => {
    socket.to(String(managerId)).emit("newReplyAlert", { accomplishmentId });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.use("/api/auth", auth);
app.use("/api/accomplishments", accomplishments);
app.use("/api/task-titles", taskTitlesRoutes);
app.use("/api/gallery", require("./routes/gallery"));
app.use("/api/notifications", Notifications);
app.use("/api/comparisons", comparisonsRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Server Error" });
});

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
