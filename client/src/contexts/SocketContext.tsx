// ✅ FIXED: تحسين SocketContext مع معالجة شاملة للأخطاء
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "@/constants";

interface AccomplishmentData {
  _id: string;
  description: string;
  employee: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  sendNewAccomplishment: (accomplishmentData: AccomplishmentData) => void;
  sendAccomplishmentReviewed: (
    accomplishmentId: string,
    employeeId: string
  ) => void;
  sendNewComment: (accomplishmentId: string, employeeId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    let socketInstance: Socket | null = null;

    // ✅ FIXED: التحقق من وجود المستخدم والمصادقة
    if (!isAuthenticated || !user?._id) {
      setSocket(null);
      setConnected(false);
      return;
    }

    try {
      // ✅ FIXED: إنشاء اتصال socket مع معالجة أخطاء محسنة
      socketInstance = io(API_BASE_URL, {
        withCredentials: false, // تعديل حسب إعدادات السيرفر
        transports: ["websocket", "polling"], // السماح بـ fallback
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      setSocket(socketInstance);

      // ✅ FIXED: معالجة events مع تحسينات
      socketInstance.on("connect", () => {
        setConnected(true);

        // انضمام للغرف حسب دور المستخدم
        if (user?._id && user?.role) {
          socketInstance?.emit("joinRoom", {
            userId: user._id,
            role: user.role,
          });
        }
      });

      socketInstance.on("disconnect", (reason) => {
        console.log("Socket: Disconnected", reason);
        setConnected(false);

        // إعادة الاتصال التلقائي في بعض الحالات
        if (reason === "io server disconnect") {
          socketInstance?.connect();
        }
      });

      socketInstance.on("connect_error", (error) => {
        console.error("Socket: Connection error", error);
        setConnected(false);
      });

      // ✅ FIXED: معالجة الإشعارات للمدير مع التحقق من الصحة
      if (user.role === "manager") {
        socketInstance.on("newAccomplishmentAlert", (data) => {
          try {
            if (data && data.employee && data.employee.name) {
              toast(
                t("notifications.newAccomplishment", {
                  name: data.employee.name,
                }),
                {
                  description: data.description
                    ? data.description.substring(0, 50) + "..."
                    : "إنجاز جديد",
                }
              );
            }
          } catch (error) {
            console.error("Error handling newAccomplishmentAlert:", error);
          }
        });
      }

      // ✅ FIXED: معالجة الإشعارات للموظف مع التحقق من الصحة
      if (user.role === "employee") {
        socketInstance.on("accomplishmentReviewedAlert", (data) => {
          try {
            toast(t("notifications.accomplishmentReviewed"));
          } catch (error) {
            console.error("Error handling accomplishmentReviewedAlert:", error);
          }
        });

        socketInstance.on("newCommentAlert", (data) => {
          try {
            toast(t("notifications.newComment"));
          } catch (error) {
            console.error("Error handling newCommentAlert:", error);
          }
        });
      }

      // ✅ FIXED: معالجة أخطاء عامة
      socketInstance.on("error", (error) => {
        console.error("Socket: Error occurred", error);
      });

      // ✅ FIXED: معالجة reconnection
      socketInstance.on("reconnect", (attemptNumber) => {
        console.log("Socket: Reconnected after", attemptNumber, "attempts");
        setConnected(true);
      });

      socketInstance.on("reconnect_error", (error) => {
        console.error("Socket: Reconnection error", error);
      });
    } catch (error) {
      console.error("Socket: Failed to create connection", error);
      setSocket(null);
      setConnected(false);
    }

    // ✅ FIXED: تنظيف عند إلغاء المكون
    return () => {
      if (socketInstance) {
        console.log("Socket: Cleaning up connection");
        socketInstance.removeAllListeners();
        socketInstance.disconnect();
        socketInstance = null;
      }
      setSocket(null);
      setConnected(false);
    };
  }, [isAuthenticated, user?._id, user?.role, t]);

  // ✅ FIXED: دوال الإرسال مع التحقق من الاتصال
  const sendNewAccomplishment = (accomplishmentData: AccomplishmentData) => {
    if (socket && connected && accomplishmentData) {
      try {
        socket.emit("newAccomplishment", accomplishmentData);
        console.log("Socket: Sent newAccomplishment", accomplishmentData._id);
      } catch (error) {
        console.error("Socket: Error sending newAccomplishment", error);
      }
    } else {
      console.warn(
        "Socket: Cannot send newAccomplishment - not connected or invalid data"
      );
    }
  };

  const sendAccomplishmentReviewed = (
    accomplishmentId: string,
    employeeId: string
  ) => {
    if (socket && connected && accomplishmentId && employeeId) {
      try {
        socket.emit("accomplishmentReviewed", { accomplishmentId, employeeId });
        console.log("Socket: Sent accomplishmentReviewed", {
          accomplishmentId,
          employeeId,
        });
      } catch (error) {
        console.error("Socket: Error sending accomplishmentReviewed", error);
      }
    } else {
      console.warn(
        "Socket: Cannot send accomplishmentReviewed - not connected or invalid data"
      );
    }
  };

  const sendNewComment = (accomplishmentId: string, employeeId: string) => {
    if (socket && connected && accomplishmentId && employeeId) {
      try {
        socket.emit("newComment", { accomplishmentId, employeeId });
        console.log("Socket: Sent newComment", {
          accomplishmentId,
          employeeId,
        });
      } catch (error) {
        console.error("Socket: Error sending newComment", error);
      }
    } else {
      console.warn(
        "Socket: Cannot send newComment - not connected or invalid data"
      );
    }
  };

  const contextValue: SocketContextType = {
    socket,
    connected,
    sendNewAccomplishment,
    sendAccomplishmentReviewed,
    sendNewComment,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
