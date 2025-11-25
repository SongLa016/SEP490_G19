// Service layer for Notification APIs
import axios from "axios";
import { getStoredToken, isTokenExpired } from "../utils/tokenManager";

const DEFAULT_API_BASE_URL = "https://sep490-g19-zxph.onrender.com";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL;

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token && !isTokenExpired(token)) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("🔐 [Notification API] Token added to request", {
        url: config.url,
        tokenLength: token.length,
        hasAuthHeader: !!config.headers.Authorization
      });
    } else {
      console.warn("⚠️ [Notification API] No valid token found", {
        url: config.url,
        hasToken: !!token,
        isExpired: token ? isTokenExpired(token) : 'no token'
      });
    }
    console.log("📤 [Notification API] Request:", {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      hasToken: !!token,
      hasAuthHeader: !!config.headers.Authorization
    });
    return config;
  },
  (error) => {
    console.error("❌ [Notification API] Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    console.log("📥 [Notification API] Response:", {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      console.error("❌ [Notification API] Response Error:", {
        status,
        url: error.config?.url,
        data
      });
      if (status === 401) {
        console.warn("⚠️ [Notification API] Token expired or invalid - clearing auth");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    } else if (error.request) {
      console.error("❌ [Notification API] Network Error - No response:", error.request);
    } else {
      console.error("❌ [Notification API] Request Error:", error.message);
    }
    return Promise.reject(error);
  }
);

// Helper function to handle API errors
const handleApiError = (error) => {
  let errorMessage = "Có lỗi xảy ra khi gọi API";

  if (error.response) {
    const { status, statusText, data } = error.response;

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

    if (data && (data.message || data.error || data.detail)) {
      errorMessage = data.message || data.error || data.detail || errorMessage;
    } else {
      errorMessage = statusText || errorMessage;
    }

    console.error("Notification API Error:", {
      status: status,
      statusText: statusText,
      url: error.config?.url,
      errorMessage: errorMessage,
      responseData: data,
    });
  } else if (error.request) {
    errorMessage =
      "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.";
    console.error("Network Error:", {
      url: error.config?.url,
      errorMessage: errorMessage,
    });
  } else {
    errorMessage = error.message || errorMessage;
    console.error("Request Error:", error);
  }

  throw new Error(errorMessage);
};

/**
 * GET /api/Notification
 * Lấy danh sách thông báo (phân trang + lọc theo trạng thái)
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.pageSize - Items per page (default: 10)
 * @param {boolean} params.isRead - Filter by read status (optional)
 * @returns {Promise<Object>} Response with notifications and pagination info
 */
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
    console.log("🔔 [Notification API] GET /api/Notification", { params, url });
    
    const response = await apiClient.get(url);
    
    console.log("✅ [Notification API] Response:", {
      status: response.status,
      data: response.data,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
      keys: response.data && typeof response.data === 'object' ? Object.keys(response.data) : null
    });

  return {
      ok: true,
      data: response.data,
    };
  } catch (error) {
    console.error("❌ [Notification API] Error:", error);
    handleApiError(error);
    return {
      ok: false,
      reason: error.message || "Không thể lấy danh sách thông báo",
    };
  }
}

/**
 * GET /api/Notification/latest
 * Lấy X thông báo mới nhất
 * @param {number} count - Number of latest notifications to fetch (default: 10)
 * @returns {Promise<Object>} Response with latest notifications
 */
export async function getLatestNotifications(count = 10) {
  try {
    const url = `/api/Notification/latest?count=${count}`;
    console.log("🔔 [Notification API] GET /api/Notification/latest", { count, url });
    
    const response = await apiClient.get(url);
    
    console.log("✅ [Notification API] Latest notifications:", response.data);
    return {
      ok: true,
      data: response.data,
    };
  } catch (error) {
    console.error("❌ [Notification API] Error getting latest:", error);
    handleApiError(error);
    return {
      ok: false,
      reason: error.message || "Không thể lấy thông báo mới nhất",
    };
  }
}

/**
 * GET /api/Notification/unread-count
 * Đếm số thông báo chưa đọc
 * @returns {Promise<Object>} Response with unread count
 */
export async function getUnreadCount() {
  try {
    // Check token before making request
    const token = getStoredToken();
    if (!token) {
      console.warn("⚠️ [Notification API] No token found - cannot get unread count");
      return {
        ok: false,
        reason: "Bạn cần đăng nhập để xem thông báo",
        count: 0,
      };
    }
    
    if (isTokenExpired(token)) {
      console.warn("⚠️ [Notification API] Token expired - cannot get unread count");
      return {
        ok: false,
        reason: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại",
        count: 0,
      };
    }

    const url = `/api/Notification/unread-count`;
    console.log("🔔 [Notification API] GET /api/Notification/unread-count", {
      hasToken: !!token,
      tokenLength: token.length
    });
    
    const response = await apiClient.get(url);
    
    console.log("✅ [Notification API] Response:", {
      status: response.status,
      data: response.data,
      dataType: typeof response.data,
      isNumber: typeof response.data === 'number',
      keys: response.data && typeof response.data === 'object' ? Object.keys(response.data) : null
    });
    
    // Handle different response formats
    // Format 1: { success: true, data: { unreadCount: 4 } }
    // Format 2: { count: 4 } or { unreadCount: 4 }
    // Format 3: number directly
    let count = 0;
    if (typeof response.data === 'number') {
      // API trả về số trực tiếp
      count = response.data;
    } else if (response.data && typeof response.data === 'object') {
      // Check for nested data structure: { success: true, data: { unreadCount: 4 } }
      if (response.data.data && typeof response.data.data === 'object') {
        count = response.data.data.unreadCount || response.data.data.count || 0;
      } else {
        // Direct object: { count: 4 } or { unreadCount: 4 }
        count = response.data.count || response.data.unreadCount || response.data.total || 0;
      }
    } else {
      count = 0;
    }
    
    console.log("✅ [Notification API] Parsed unread count:", count);
    
    return {
      ok: true,
      data: response.data,
      count: Number(count) || 0,
    };
  } catch (error) {
    console.error("❌ [Notification API] Error getting unread count:", error);
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.warn("⚠️ [Notification API] Unauthorized - Token invalid or expired");
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

/**
 * GET /api/Notification/type/{type}
 * Lấy thông báo theo loại (Comment, Like, ReportResult, System, ...)
 * @param {string} type - Notification type
 * @param {Object} params - Optional query parameters (page, pageSize)
 * @returns {Promise<Object>} Response with notifications of specified type
 */
export async function getNotificationsByType(type, params = {}) {
  try {
    const { page = 1, pageSize = 10 } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    const url = `/api/Notification/type/${type}?${queryParams.toString()}`;
    console.log("🔔 [Notification API] GET /api/Notification/type/{type}", {
      type,
      params,
      url,
    });

    const response = await apiClient.get(url);

    console.log("✅ [Notification API] Type response:", {
      status: response.status,
      data: response.data,
      isArray: Array.isArray(response.data),
      keys: response.data && typeof response.data === "object" ? Object.keys(response.data) : null,
    });

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
    console.error("❌ [Notification API] Error getting by type:", error);
    handleApiError(error);
    return {
      ok: false,
      reason: error.message || "Không thể lấy thông báo theo loại",
    };
  }
}

/**
 * POST /api/Notification
 * Admin tạo thông báo thủ công
 * CHỈ ADMIN MỚI CÓ THỂ GỌI API NÀY
 * @param {Object} notificationData - Notification data
 * @param {number} notificationData.userId - User ID (0 for system notification)
 * @param {string} notificationData.type - Notification type (System, Comment, Like, ReportResult, ...)
 * @param {number} notificationData.targetId - Target ID (0 if not applicable)
 * @param {string} notificationData.message - Notification message
 * @returns {Promise<Object>} Response with created notification
 */
export async function createNotification(notificationData) {
  try {
    // Kiểm tra token trước khi gọi API
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      console.error("❌ [Notification API] No valid token - Cannot create notification");
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

    console.log("🔔 [Notification API] POST /api/Notification (Admin only)", payload);
    console.log("🔐 [Notification API] Token check: Valid token present");
    
    const response = await apiClient.post(`/api/Notification`, payload);
    
    console.log("✅ [Notification API] Created notification:", response.data);
    return {
      ok: true,
      data: response.data,
      message: response.data.message || "Tạo thông báo thành công",
    };
  } catch (error) {
    console.error("❌ [Notification API] Error creating notification:", error);
    
    // Kiểm tra lỗi 403 (Forbidden) - không phải Admin
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

/**
 * POST /api/Notification/bulk
 * Admin tạo thông báo hàng loạt
 * CHỈ ADMIN MỚI CÓ THỂ GỌI API NÀY
 * @param {Array<Object>} notifications - Array of notification data
 * @returns {Promise<Object>} Response with created notifications
 */
export async function createBulkNotifications(notifications) {
  try {
    // Kiểm tra token trước khi gọi API
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      console.error("❌ [Notification API] No valid token - Cannot create bulk notifications");
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

    console.log("🔔 [Notification API] POST /api/Notification/bulk (Admin only)", {
      count: payload.length,
      payload
    });
    console.log("🔐 [Notification API] Token check: Valid token present");
    
    const response = await apiClient.post(`/api/Notification/bulk`, payload);
    
    console.log("✅ [Notification API] Created bulk notifications:", response.data);
    return {
      ok: true,
      data: response.data,
      message: response.data.message || "Tạo thông báo hàng loạt thành công",
    };
  } catch (error) {
    console.error("❌ [Notification API] Error creating bulk notifications:", error);
    
    // Kiểm tra lỗi 403 (Forbidden) - không phải Admin
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

/**
 * PUT /api/Notification/{id}/read
 * Đánh dấu đã đọc 1 thông báo
 * @param {number|string} id - Notification ID
 * @returns {Promise<Object>} Response with success status
 */
export async function markNotificationAsRead(id) {
  try {
    const url = `/api/Notification/${id}/read`;
    console.log("🔔 [Notification API] PUT /api/Notification/{id}/read", { id, url });
    
    const response = await apiClient.put(url);
    
    console.log("✅ [Notification API] Marked as read:", response.data);
    return {
      ok: true,
      data: response.data,
      message: response.data.message || "Đánh dấu đã đọc thành công",
    };
  } catch (error) {
    console.error("❌ [Notification API] Error marking as read:", error);
    handleApiError(error);
  return {
      ok: false,
      reason: error.message || "Không thể đánh dấu đã đọc",
    };
  }
}

/**
 * PUT /api/Notification/mark-all-read
 * Đánh dấu đã đọc toàn bộ thông báo
 * @returns {Promise<Object>} Response with success status
 */
export async function markAllNotificationsAsRead() {
  try {
    const url = `/api/Notification/mark-all-read`;
    console.log("🔔 [Notification API] PUT /api/Notification/mark-all-read");
    
    const response = await apiClient.put(url);
    
    console.log("✅ [Notification API] Marked all as read:", response.data);
    return {
      ok: true,
      data: response.data,
      message: response.data.message || "Đánh dấu tất cả đã đọc thành công",
    };
  } catch (error) {
    console.error("❌ [Notification API] Error marking all as read:", error);
    handleApiError(error);
    return {
      ok: false,
      reason: error.message || "Không thể đánh dấu tất cả đã đọc",
    };
  }
}

/**
 * DELETE /api/Notification/{id}
 * Xóa 1 thông báo
 * @param {number|string} id - Notification ID
 * @returns {Promise<Object>} Response with success status
 */
export async function deleteNotification(id) {
  try {
    const url = `/api/Notification/${id}`;
    console.log("🔔 [Notification API] DELETE /api/Notification/{id}", { id, url });
    
    const response = await apiClient.delete(url);
    
    console.log("✅ [Notification API] Deleted notification:", response.data);
    return {
      ok: true,
      data: response.data,
      message: response.data.message || "Xóa thông báo thành công",
    };
  } catch (error) {
    console.error("❌ [Notification API] Error deleting notification:", error);
    handleApiError(error);
    return {
      ok: false,
      reason: error.message || "Không thể xóa thông báo",
    };
  }
}

/**
 * DELETE /api/Notification/delete-all
 * Xóa toàn bộ thông báo của user
 * @returns {Promise<Object>} Response with success status
 */
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

// Compatibility functions for backward compatibility with old code
/**
 * @deprecated Use getNotifications instead
 * Fetch notifications for owner (compatibility function)
 */
export async function fetchNotifications(ownerId) {
  try {
    const result = await getNotifications({ page: 1, pageSize: 100 });
    if (result.ok) {
      const notifications = Array.isArray(result.data)
        ? result.data
        : result.data?.notifications || result.data?.data || [];
      // Filter by owner if needed (API might handle this)
      return notifications;
    }
    return [];
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

/**
 * @deprecated Update functionality not available in new API
 * This is a placeholder for backward compatibility
 */
export async function updateNotification(notificationId, notificationData) {
  console.warn(
    "updateNotification is deprecated. Notification updates are not supported in the new API."
  );
  // Since update is not available, we'll delete and create new
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

/**
 * @deprecated Stats functionality not available in new API
 * Calculate stats from notifications list
 */
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
          promotion: notifications.filter((n) => n.type === "promotion")
        .length,
          System: notifications.filter((n) => n.type === "System").length,
          Comment: notifications.filter((n) => n.type === "Comment").length,
          Like: notifications.filter((n) => n.type === "Like").length,
          ReportResult: notifications.filter(
            (n) => n.type === "ReportResult"
          ).length,
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
    console.error("Error getting notification stats:", error);
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

// Test helper functions - Expose to window for easy testing in console
if (typeof window !== 'undefined') {
  window.notificationAPI = {
    getNotifications,
    getLatestNotifications,
    getUnreadCount,
    getNotificationsByType,
    createNotification,
    createBulkNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    deleteAllNotifications,
    // Test helpers
    testCreate: async () => {
      console.log("🧪 Testing create notification...");
      return await createNotification({
        userId: 0,
        type: "System",
        targetId: 0,
        message: "Test notification from console"
      });
    },
    testGetAll: async () => {
      console.log("🧪 Testing get all notifications...");
      return await getNotifications({ page: 1, pageSize: 10 });
    },
    testGetLatest: async () => {
      console.log("🧪 Testing get latest notifications...");
      return await getLatestNotifications(5);
    },
    testUnreadCount: async () => {
      console.log("🧪 Testing get unread count...");
      return await getUnreadCount();
    }
  };
  console.log("✅ Notification API test functions available at window.notificationAPI");
  console.log("💡 Try: window.notificationAPI.testGetAll()");
}

// Export all functions as default object for convenience
export default {
  getNotifications,
  getLatestNotifications,
  getUnreadCount,
  getNotificationsByType,
  createNotification,
  createBulkNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  // Compatibility exports
  fetchNotifications,
  updateNotification,
  getNotificationStats,
};
