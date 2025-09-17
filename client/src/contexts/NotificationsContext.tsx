// ✅ FIXED: إصلاح NotificationsContext مع معالجة شاملة للأخطاء
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { notificationsAPI } from "@/api/api";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/contexts/AuthContext";

type Notif = {
  _id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
};

type Ctx = {
  notifications: Notif[];
  loading: boolean;
  unreadCount: number;
  currentPage: number;
  totalPages: number;
  fetchNotifications: (page?: number, append?: boolean) => Promise<void>;
  fetchNext: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
};

const NotificationsContext = createContext<Ctx | null>(null);

interface NotificationsProviderProps {
  children: ReactNode;
}

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({
  children,
}) => {
  const { user, isAuthenticated, token } = useAuth();
  const { socket } = useSocket();

  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const isFetchingMoreRef = useRef(false);

  // ✅ FIXED: تحسين دالة حساب غير المقروءة مع التحقق من null/undefined
  const recalcUnread = (list: Notif[] | null | undefined): number => {
    // التحقق من وجود القائمة وأنها مصفوفة
    if (!list || !Array.isArray(list)) {
      console.warn("recalcUnread: list is not a valid array", list);
      return 0;
    }

    try {
      return list.reduce((acc, n) => {
        // التحقق من وجود الكائن والخاصية
        if (n && typeof n.isRead === "boolean") {
          return acc + (n.isRead ? 0 : 1);
        }
        return acc;
      }, 0);
    } catch (error) {
      console.error("Error in recalcUnread:", error);
      return 0;
    }
  };

  const fetchNotifications = async (page = 1, append = false) => {
    // ✅ FIXED: تحقق شامل من حالة المصادقة
    if (!isAuthenticated || !token || !user?._id) {
      console.log("User not authenticated, clearing notifications");
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      if (append) isFetchingMoreRef.current = true;
      else setLoading(true);

      const response = await notificationsAPI.get(page, 10);

      // ✅ FIXED: التحقق من صحة الاستجابة
      if (!response || typeof response !== "object") {
        throw new Error("Invalid response from notifications API");
      }

      const {
        data,
        totalPages: newTotalPages,
        currentPage: newCurrentPage,
      } = response;

      // ✅ FIXED: التحقق من أن data مصفوفة صحيحة
      const notificationsData = Array.isArray(data) ? data : [];

      if (append) {
        setNotifications((prev) => {
          const combined = [...(prev || []), ...notificationsData];
          setUnreadCount(recalcUnread(combined));
          return combined;
        });
      } else {
        setNotifications(notificationsData);
        setUnreadCount(recalcUnread(notificationsData));
      }

      setTotalPages(newTotalPages || 1);
      setCurrentPage(newCurrentPage || 1);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);

      // تعيين قيم افتراضية آمنة في حالة الخطأ
      if (!append) {
        setNotifications([]);
        setUnreadCount(0);
        setTotalPages(1);
        setCurrentPage(1);
      }

      // لا نعرض toast error هنا لتجنب الإزعاج
    } finally {
      if (append) isFetchingMoreRef.current = false;
      else setLoading(false);
    }
  };

  const fetchNext = async () => {
    if (isFetchingMoreRef.current) return;
    if (currentPage >= totalPages) return;
    await fetchNotifications(currentPage + 1, true);
  };

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => {
        if (!Array.isArray(prev)) return [];
        return prev.map((n) => ({ ...n, isRead: true }));
      });
      setUnreadCount(0);
    } catch (error) {
      console.error("markAllRead error:", error);
    }
  };

  const markRead = async (id: string) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) => {
        if (!Array.isArray(prev)) return [];
        return prev.map((n) => (n._id === id ? { ...n, isRead: true } : n));
      });
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      console.error("markRead error:", error);
    }
  };

  // ✅ FIXED: تحسين useEffect للتحميل الأولي
  useEffect(() => {
    if (!user?._id || !isAuthenticated || !token) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      setCurrentPage(1);
      setTotalPages(1);
      return;
    }

    // تأخير بسيط لضمان أن السيرفر جاهز
    const timer = setTimeout(() => {
      fetchNotifications(1, false);
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, isAuthenticated, token]);

  // ✅ FIXED: تحسين socket listener
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    const handleNotification = (notif: Notif) => {
      console.log("New notification received:", notif);

      // التحقق من صحة الإشعار
      if (!notif || !notif._id) {
        console.warn("Invalid notification received:", notif);
        return;
      }

      setNotifications((prev) => {
        const prevArray = Array.isArray(prev) ? prev : [];
        return [notif, ...prevArray];
      });

      if (!notif.isRead) {
        setUnreadCount((c) => c + 1);
      }
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [socket, isAuthenticated]);

  // ✅ FIXED: تحسين context value مع useMemo
  const value = useMemo(
    () => ({
      notifications: Array.isArray(notifications) ? notifications : [],
      loading,
      unreadCount: Math.max(0, unreadCount), // التأكد من أن العدد ليس سالب
      currentPage: Math.max(1, currentPage), // التأكد من أن الصفحة ليست أقل من 1
      totalPages: Math.max(1, totalPages), // التأكد من أن المجموع ليس أقل من 1
      fetchNotifications,
      fetchNext,
      markAllRead,
      markRead,
    }),
    [notifications, loading, unreadCount, currentPage, totalPages]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = (): Ctx => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used within NotificationsProvider"
    );
  }
  return ctx;
};
