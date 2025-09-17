// services/socketService.js
// ✅ إنشاء خدمة Socket منفصلة لتجنب مشاكل الاستيراد الدائري وتحسين الأداء
class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // ✅ تتبع المستخدمين المتصلين لتجنب تسريب الذاكرة
  }

  // ✅ تهيئة الخدمة مع معالجة شاملة للأحداث
  initialize(io) {
    this.io = io;
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on("connection", (socket) => {
      console.log("User connected:", socket.id);

      // ✅ معالجة انضمام المستخدم مع try-catch للأمان
      socket.on("joinRoom", ({ userId, role }) => {
        try {
          if (role === "manager") {
            socket.join("managers");
          }
          socket.join(String(userId));

          // ✅ تسجيل المستخدم المتصل
          this.connectedUsers.set(socket.id, { userId, role });

          console.log(`User ${userId} with role ${role} joined rooms`);
        } catch (error) {
          console.error("Error in joinRoom:", error);
          socket.emit("error", { message: "فشل في الانضمام للغرفة" });
        }
      });

      // ✅ معالجة قطع الاتصال مع تنظيف البيانات
      socket.on("disconnect", () => {
        try {
          const user = this.connectedUsers.get(socket.id);
          if (user) {
            console.log(`User ${user.userId} disconnected`);
            this.connectedUsers.delete(socket.id);
          }
        } catch (error) {
          console.error("Error in disconnect:", error);
        }
      });

      // ✅ معالجة أخطاء Socket
      socket.on("error", (error) => {
        console.error("Socket error:", error);
      });
    });
  }

  // ✅ طرق موحدة لإرسال الإشعارات مع معالجة الأخطاء
  notifyUser(userId, notificationData) {
    if (!this.io) {
      console.warn("Socket.IO not initialized");
      return false;
    }

    try {
      this.io.to(String(userId)).emit("notification", notificationData);
      return true;
    } catch (error) {
      console.error("Error sending notification:", error);
      return false;
    }
  }

  notifyManagers(notificationData) {
    if (!this.io) {
      console.warn("Socket.IO not initialized");
      return false;
    }

    try {
      this.io.to("managers").emit("notification", notificationData);
      return true;
    } catch (error) {
      console.error("Error sending notification to managers:", error);
      return false;
    }
  }

  // ✅ إرسال تحديث للإنجاز
  broadcastAccomplishmentUpdate(accomplishmentData) {
    if (!this.io) {
      console.warn("Socket.IO not initialized");
      return false;
    }

    try {
      this.io.emit("accomplishmentUpdate", accomplishmentData);
      return true;
    } catch (error) {
      console.error("Error broadcasting accomplishment update:", error);
      return false;
    }
  }

  // ✅ إضافة طرق مفيدة لمراقبة النظام
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  getConnectedUsersByRole(role) {
    return Array.from(this.connectedUsers.values())
      .filter((user) => user.role === role)
      .map((user) => user.userId);
  }
}

// ✅ إنشاء instance واحد لتجنب التكرار
const socketService = new SocketService();

module.exports = socketService;
