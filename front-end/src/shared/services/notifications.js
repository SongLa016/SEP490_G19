// API thông báo
import axios from "axios";
import { getStoredToken, isTokenExpired } from "../utils/tokenManager";
import { API_BASE_URL } from "../config/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token && !isTokenExpired(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// xử lý lỗi response
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    return Promise.reject(error);
  }
);

// hàm xử lý lỗi API
const handleApiError = (error) => {
  let errorMessage = "Có lỗi xảy ra khi gọi API";

  if (error.response) {
    const { status, statusText, data: responseData } = error.response;
    if (status === 404) {
      errorMessage = "Không tìm thấy thông báo";
    } else if (status === 500) {
      errorMessage = "Lỗi máy chủ. Vui lòng thử lại sau.";
    } else if (status === 400) {
      errorMessage = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.";
    } else if (status === 401) {
      errorMessage = "Không có quyền truy cập. Vui lòng đăng nhập lại.";
    } else if (status === 403) {
      errorMessage = "Truy cập bị từ chối. Vui lòng kiểm tra quyền hạn.";
    }

    if (
      responseData &&
      (responseData.message || responseData.error || responseData.detail)
    ) {
      errorMessage =
        responseData.message ||
        responseData.error ||
        responseData.detail ||
        errorMessage;
    } else {
      errorMessage = statusText || errorMessage;
    }
  } else if (error.request) {
    errorMessage =
      "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.";
  } else {
    errorMessage = error.message || errorMessage;
  }

  throw new Error(errorMessage);
};

// hàm lấy danh sách thông báo
export async function getNotifications(params = {}) {
  try {
    const { page = 1, pageSize = 10, isRead } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    if (isRead !== undefined) {
      queryParams.append("isRead", isRead.toString());
    }

    const url = `/api/Notification?${queryParams.toString()}`;

    const response = await apiClient.get(url);

    return {
      ok: true,
      data: response.data,
    };
  } catch (error) {
    handleApiError(error);
    return {
      ok: false,
      reason: error.message || "Không thể lấy danh sách thông báo",
    };
  }
}

// hàm lấy danh sách thông báo cho Admin
export async function getAdminNotifications(params = {}) {
  try {
    const { pageNumber = 1, pageSize = 20 } = params;

    const response = await apiClient.get("/api/Notification/admin", {
      params: {
        pageNumber,
        pageSize,
      },
    });

    return {
      ok: true,
      data: response.data,
    };
  } catch (error) {
    handleApiError(error);
  }
}

// hàm lấy thông báo của Admin theo id
export async function getAdminNotificationById(id) {
  try {
    const response = await apiClient.get(`/api/Notification/admin/${id}`);
    return {
      ok: true,
      data: response.data,
    };
  } catch (error) {
    handleApiError(error);
  }
}

// hàm lấy X thông báo mới nhất
export async function getLatestNotifications(count = 10) {
  try {
    const url = `/api/Notification/latest?count=${count}`;

    const response = await apiClient.get(url);
    return {
      ok: true,
      data: response.data,
    };
  } catch (error) {
    handleApiError(error);
    return {
      ok: false,
      reason: error.message || "Không thể lấy thông báo mới nhất",
    };
  }
}

// hàm đếm số thông báo chưa đọc
export async function getUnreadCount() {
  try {
    const token = getStoredToken();
    if (!token) {
      return {
        ok: false,
        reason: "Bạn cần đăng nhập để xem thông báo",
        count: 0,
      };
    }

    if (isTokenExpired(token)) {
      return {
        ok: false,
        reason: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại",
        count: 0,
      };
    }

    const url = `/api/Notification/unread-count`;

    const response = await apiClient.get(url);
    let count = 0;
    if (typeof response.data === "number") {
      count = response.data;
    } else if (response.data && typeof response.data === "object") {
      if (response.data.data && typeof response.data.data === "object") {
        count = response.data.data.unreadCount || response.data.data.count || 0;
      } else {
        count =
          response.data.count ||
          response.data.unreadCount ||
          response.data.total ||
          0;
      }
    } else {
      count = 0;
    }

    return {
      ok: true,
      data: response.data,
      count: Number(count) || 0,
    };
  } catch (error) {
    if (error.response?.status === 401) {
      return {
        ok: false,
        reason: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại",
        count: 0,
      };
    }

    handleApiError(error);
    return {
      ok: false,
      reason: error.message || "Không thể lấy số thông báo chưa đọc",
      count: 0,
    };
  }
}

// hàm lấy thông báo theo loại
export async function getNotificationsByType(type, params = {}) {
  try {
    const { page = 1, pageSize = 10 } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    const url = `/api/Notification/type/${type}?${queryParams.toString()}`;

    const response = await apiClient.get(url);

    let notifications = [];
    if (Array.isArray(response.data)) {
      notifications = response.data;
    } else if (response.data?.notifications) {
      notifications = response.data.notifications;
    } else if (response.data?.data) {
      notifications = Array.isArray(response.data.data)
        ? response.data.data
        : response.data.data.notifications || response.data.data.items || [];
    } else if (response.data?.items) {
      notifications = response.data.items;
    } else if (response.data) {
      notifications = response.data.results || [];
    }

    return {
      ok: true,
      data: notifications,
      raw: response.data,
    };
  } catch (error) {
    handleApiError(error);
    return {
      ok: false,
      reason: error.message || "Không thể lấy thông báo theo loại",
    };
  }
}

// hàm tạo thông báo
export async function createNotification(notificationData) {
  try {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      return {
        ok: false,
        reason: "Bạn cần đăng nhập để tạo thông báo",
      };
    }

    const payload = {
      userId: notificationData.userId || 0,
      type: notificationData.type || "System",
      targetId: notificationData.targetId || 0,
      message: notificationData.message || "",
    };

    const response = await apiClient.post(`/api/Notification`, payload);

    return {
      ok: true,
      data: response.data,
      message: response.data.message || "Tạo thông báo thành công",
    };
  } catch (error) {
    if (error.response?.status === 403) {
      return {
        ok: false,
        reason: "Chỉ Admin mới có quyền tạo thông báo",
      };
    }

    handleApiError(error);
    return {
      ok: false,
      reason: error.message || "Không thể tạo thông báo",
    };
  }
}

// hàm tạo thông báo hàng loạt
export async function createBulkNotifications(notifications) {
  try {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      return {
        ok: false,
        reason: "Bạn cần đăng nhập để tạo thông báo",
      };
    }

    const payload = notifications.map((notif) => ({
      userId: notif.userId || 0,
      type: notif.type || "System",
      targetId: notif.targetId || 0,
      message: notif.message || "",
    }));

    const response = await apiClient.post(`/api/Notification/bulk`, payload);

    return {
      ok: true,
      data: response.data,
      message: response.data.message || "Tạo thông báo hàng loạt thành công",
    };
  } catch (error) {
    if (error.response?.status === 403) {
      return {
        ok: false,
        reason: "Chỉ Admin mới có quyền tạo thông báo hàng loạt",
      };
    }

    handleApiError(error);
    return {
      ok: false,
      reason: error.message || "Không thể tạo thông báo hàng loạt",
    };
  }
}

// hàm tạo thông báo cho Admin
export async function createAdminNotification(notificationData) {
  try {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      return {
        ok: false,
        reason: "Bạn cần đăng nhập (Admin) để tạo thông báo",
      };
    }

    const payload = {
      userId:
        notificationData.userId === 0 || notificationData.userId == null
          ? null
          : notificationData.userId,
      title: notificationData.title || "",
      message: notificationData.message || "",
      type: notificationData.type || "System",
      targetId: notificationData.targetId ?? 0,
    };

    const response = await apiClient.post(`/api/Notification/admin`, payload);

    return {
      ok: true,
      data: response.data,
      message: response.data?.message || "Tạo thông báo (admin) thành công",
    };
  } catch (error) {
    if (error.response?.status === 403) {
      return {
        ok: false,
        reason: "Chỉ Admin mới có quyền tạo thông báo (admin)",
      };
    }

    handleApiError(error);
    return {
      ok: false,
      reason: error.message || "Không thể tạo thông báo (admin)",
    };
  }
}

// hàm tạo thông báo hàng loạt cho Admin
export async function createAdminBulkNotifications(notifications = []) {
  try {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      return {
        ok: false,
        reason: "Bạn cần đăng nhập (Admin) để tạo thông báo hàng loạt",
      };
    }

    const payload = notifications.map((notif) => ({
      userId: notif.userId === 0 || notif.userId == null ? null : notif.userId,
      title: notif.title || "",
      message: notif.message || "",
      type: notif.type || "System",
      targetId: notif.targetId ?? 0,
    }));

    const response = await apiClient.post(
      `/api/Notification/admin/bulk`,
      payload
    );

    return {
      ok: true,
      data: response.data,
      message:
        response.data?.message || "Tạo thông báo (admin) hàng loạt thành công",
    };
  } catch (error) {
    if (error.response?.status === 403) {
      return {
        ok: false,
        reason: "Chỉ Admin mới có quyền tạo thông báo (admin) hàng loạt",
      };
    }

    handleApiError(error);
    return {
      ok: false,
      reason: error.message || "Không thể tạo thông báo (admin) hàng loạt",
    };
  }
}

// hàm đánh dấu đã đọc thông báo
export async function markNotificationAsRead(id) {
  try {
    const url = `/api/Notification/${id}/read`;

    const response = await apiClient.put(url);

    return {
      ok: true,
      data: response.data,
      message: response.data.message || "Đánh dấu đã đọc thành công",
    };
  } catch (error) {
    handleApiError(error);
    return {
      ok: false,
      reason: error.message || "Không thể đánh dấu đã đọc",
    };
  }
}

// hàm đánh dấu đã đọc toàn bộ thông báo
export async function markAllNotificationsAsRead() {
  try {
    const url = `/api/Notification/mark-all-read`;

    const response = await apiClient.put(url);

    return {
      ok: true,
      data: response.data,
      message: response.data.message || "Đánh dấu tất cả đã đọc thành công",
    };
  } catch (error) {
    handleApiError(error);
    return {
      ok: false,
      reason: error.message || "Không thể đánh dấu tất cả đã đọc",
    };
  }
}

// hàm xóa thông báo
export async function deleteNotification(id) {
  try {
    const url = `/api/Notification/${id}`;

    const response = await apiClient.delete(url);

    return {
      ok: true,
      data: response.data,
      message: response.data.message || "Xóa thông báo thành công",
    };
  } catch (error) {
    handleApiError(error);
    return {
      ok: false,
      reason: error.message || "Không thể xóa thông báo",
    };
  }
}

// hàm xóa thông báo cho Admin
export async function deleteAdminNotification(id) {
  try {
    const response = await apiClient.delete(`/api/Notification/admin/${id}`);
    return {
      ok: true,
      data: response.data,
      message: response.data.message || "Xóa thông báo (admin) thành công",
    };
  } catch (error) {
    handleApiError(error);
    return {
      ok: false,
      reason: error.message || "Không thể xóa thông báo (admin)",
    };
  }
}

// hàm xóa hàng loạt thông báo cho Admin
export async function bulkDeleteAdminNotifications(ids = []) {
  try {
    const response = await apiClient.delete("/api/Notification/admin/bulk", {
      data: ids,
    });
    return {
      ok: true,
      data: response.data,
      message: response.data.message || "Đã xóa thông báo (admin) hàng loạt",
    };
  } catch (error) {
    handleApiError(error);
    return {
      ok: false,
      reason: error.message || "Không thể xóa thông báo (admin) hàng loạt",
    };
  }
}

// hàm xóa toàn bộ thông báo của user
export async function deleteAllNotifications() {
  try {
    const response = await apiClient.delete(`/api/Notification/delete-all`);
    return {
      ok: true,
      data: response.data,
      message: response.data.message || "Xóa tất cả thông báo thành công",
    };
  } catch (error) {
    handleApiError(error);
    return {
      ok: false,
      reason: error.message || "Không thể xóa tất cả thông báo",
    };
  }
}

// hàm lấy danh sách thông báo
export async function fetchNotifications(ownerId) {
  try {
    const result = await getNotifications({ page: 1, pageSize: 100 });
    if (result.ok) {
      const notifications = Array.isArray(result.data)
        ? result.data
        : result.data?.notifications || result.data?.data || [];
      return notifications;
    }
    return [];
  } catch (error) {
    return [];
  }
}

export async function updateNotification(notificationId, notificationData) {
  // vì update không khả dụng, chúng tôi sẽ xóa và tạo mới
  try {
    await deleteNotification(notificationId);
    return await createNotification(notificationData);
  } catch (error) {
    handleApiError(error);
    return {
      ok: false,
      reason: error.message || "Không thể cập nhật thông báo",
    };
  }
}

export async function getNotificationStats(ownerId) {
  try {
    const result = await getNotifications({ page: 1, pageSize: 1000 });
    if (result.ok) {
      const notifications = Array.isArray(result.data)
        ? result.data
        : result.data?.notifications || result.data?.data || [];

      const stats = {
        total: notifications.length,
        sent: notifications.filter((n) => n.isActive !== false).length,
        byType: {
          cancellation: notifications.filter((n) => n.type === "cancellation")
            .length,
          maintenance: notifications.filter((n) => n.type === "maintenance")
            .length,
          update: notifications.filter((n) => n.type === "update").length,
          promotion: notifications.filter((n) => n.type === "promotion").length,
          System: notifications.filter((n) => n.type === "System").length,
          Comment: notifications.filter((n) => n.type === "Comment").length,
          Like: notifications.filter((n) => n.type === "Like").length,
          ReportResult: notifications.filter((n) => n.type === "ReportResult")
            .length,
        },
        byPriority: {
          low: notifications.filter((n) => n.priority === "low").length,
          medium: notifications.filter((n) => n.priority === "medium").length,
          high: notifications.filter((n) => n.priority === "high").length,
          urgent: notifications.filter((n) => n.priority === "urgent").length,
        },
      };
      return stats;
    }
    return {
      total: 0,
      sent: 0,
      byType: {
        cancellation: 0,
        maintenance: 0,
        update: 0,
        promotion: 0,
      },
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0,
      },
    };
  } catch (error) {
    return {
      total: 0,
      sent: 0,
      byType: {
        cancellation: 0,
        maintenance: 0,
        update: 0,
        promotion: 0,
      },
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0,
      },
    };
  }
}

if (typeof window !== "undefined") {
  window.notificationAPI = {
    getNotifications,
    getAdminNotifications,
    getAdminNotificationById,
    getLatestNotifications,
    getUnreadCount,
    getNotificationsByType,
    createNotification,
    createBulkNotifications,
    createAdminNotification,
    createAdminBulkNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    deleteAdminNotification,
    bulkDeleteAdminNotifications,
    deleteAllNotifications,
    // Test helpers
    testCreate: async () => {
      return await createNotification({
        userId: 0,
        type: "System",
        targetId: 0,
        message: "Test notification from console",
      });
    },
    testGetAll: async () => {
      return await getNotifications({ page: 1, pageSize: 10 });
    },
    testGetLatest: async () => {
      return await getLatestNotifications(5);
    },
    testUnreadCount: async () => {
      return await getUnreadCount();
    },
  };
}

const notificationService = {
  getNotifications,
  getAdminNotifications,
  getAdminNotificationById,
  getLatestNotifications,
  getUnreadCount,
  getNotificationsByType,
  createNotification,
  createBulkNotifications,
  createAdminNotification,
  createAdminBulkNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAdminNotification,
  bulkDeleteAdminNotifications,
  deleteAllNotifications,
  fetchNotifications,
  updateNotification,
  getNotificationStats,
};

export default notificationService;
