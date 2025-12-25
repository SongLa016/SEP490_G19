import axios from "axios";
import {
  getStoredToken,
  isTokenExpired,
  clearPersistedAuth,
  decodeTokenPayload,
} from "../utils/tokenManager";
import { ROLES } from "../constants/roles";

const DEFAULT_API_BASE_URL = "http://localhost:8080";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token && !isTokenExpired(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearPersistedAuth();
    }
    return Promise.reject(error);
  }
);

const ensureAuthenticated = () => {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Bạn cần đăng nhập để thực hiện thao tác này.");
  }
  if (isTokenExpired(token)) {
    clearPersistedAuth();
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }
};

const ensureAdminRole = () => {
  ensureAuthenticated();
  const token = getStoredToken();
  const payload = decodeTokenPayload(token);
  
  if (!payload) {
    throw new Error("Không thể xác thực quyền truy cập.");
  }
  
  // Check role from token payload - support multiple formats
  let roleId = payload.roleID || payload.roleId || payload.RoleID || payload.RoleId;
  let roleName = payload.roleName || payload.RoleName || payload.role || payload.Role;
  
  // Fallback: Check from localStorage user object if token doesn't have role info
  if (!roleId && !roleName) {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        roleId = user.roleID || user.roleId;
        roleName = user.roleName || user.role;
        console.log("[AdminStatistics] Using role from localStorage user:", { roleId, roleName });
      }
    } catch (e) {
      console.warn("[AdminStatistics] Failed to parse user from localStorage:", e);
    }
  }
  
  // Debug logging
  console.log("[AdminStatistics] Token payload:", payload);
  console.log("[AdminStatistics] Role check - roleID:", roleId, "roleName:", roleName);
  
  const isAdmin = roleId === ROLES.ADMIN.id || 
                  roleId === 3 ||
                  roleName === ROLES.ADMIN.name || 
                  roleName === "Admin" || 
                  roleName === "admin" ||
                  (typeof roleName === "string" && roleName.toLowerCase() === "admin");
  
  if (!isAdmin) {
    console.error("[AdminStatistics] Admin check failed. Payload:", payload, "roleID:", roleId, "roleName:", roleName);
    throw new Error("Bạn không có quyền thực hiện thao tác này. Chỉ quản trị viên mới được phép.");
  }
};

const unwrapData = (response) => {
  if (!response) return null;
  if (response.data?.data !== undefined) {
    return response.data.data;
  }
  return response.data ?? null;
};

const extractErrorMessage = (error, fallbackMessage) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return fallbackMessage;
};

// AdminOwnerStatistics
export async function fetchOwnerStatistics(params = {}) {
  try {
    ensureAuthenticated();
    const searchParams = new URLSearchParams();
    if (params.fromDate) {
      searchParams.append("fromDate", params.fromDate);
    }
    if (params.toDate) {
      searchParams.append("toDate", params.toDate);
    }
    const query = searchParams.toString();
    const response = await apiClient.get(
      `/api/admin/statistics/owners${query ? `?${query}` : ""}`
    );
    return {
      ok: true,
      data: unwrapData(response),
    };
  } catch (error) {
    const reason = extractErrorMessage(
      error,
      "Không thể lấy thống kê chủ sân."
    );
    console.error("[AdminStatisticsService] fetchOwnerStatistics failed:", error);
    return { ok: false, reason };
  }
}

// AdminStatistics - Bookings
export async function fetchBookingStatistics(params = {}) {
  try {
    ensureAuthenticated();
    const searchParams = new URLSearchParams();
    if (params.fromDate) {
      searchParams.append("fromDate", params.fromDate);
    }
    if (params.toDate) {
      searchParams.append("toDate", params.toDate);
    }
    const query = searchParams.toString();
    const response = await apiClient.get(
      `/api/admin/statistics/bookings${query ? `?${query}` : ""}`
    );
    return {
      ok: true,
      data: unwrapData(response),
    };
  } catch (error) {
    const reason = extractErrorMessage(
      error,
      "Không thể lấy thống kê booking."
    );
    console.error("[AdminStatisticsService] fetchBookingStatistics failed:", error);
    return { ok: false, reason };
  }
}

// AdminStatistics - Revenue
export async function fetchRevenueStatistics(params = {}) {
  try {
    ensureAuthenticated();
    const searchParams = new URLSearchParams();
    if (params.fromDate) {
      searchParams.append("fromDate", params.fromDate);
    }
    if (params.toDate) {
      searchParams.append("toDate", params.toDate);
    }
    const query = searchParams.toString();
    const response = await apiClient.get(
      `/api/admin/statistics/revenue${query ? `?${query}` : ""}`
    );
    return {
      ok: true,
      data: unwrapData(response),
    };
  } catch (error) {
    const reason = extractErrorMessage(
      error,
      "Không thể lấy thống kê doanh thu."
    );
    console.error("[AdminStatisticsService] fetchRevenueStatistics failed:", error);
    return { ok: false, reason };
  }
}

// AdminStatistics - Fields
export async function fetchFieldStatistics(params = {}) {
  try {
    ensureAuthenticated();
    const searchParams = new URLSearchParams();
    if (params.fromDate) {
      searchParams.append("fromDate", params.fromDate);
    }
    if (params.toDate) {
      searchParams.append("toDate", params.toDate);
    }
    const query = searchParams.toString();
    const response = await apiClient.get(
      `/api/admin/statistics/fields${query ? `?${query}` : ""}`
    );
    return {
      ok: true,
      data: unwrapData(response),
    };
  } catch (error) {
    const reason = extractErrorMessage(
      error,
      "Không thể lấy thống kê sân."
    );
    console.error("[AdminStatisticsService] fetchFieldStatistics failed:", error);
    return { ok: false, reason };
  }
}

// AdminStatistics - Reports
export async function fetchReportStatistics(params = {}) {
  try {
    ensureAuthenticated();
    const searchParams = new URLSearchParams();
    if (params.fromDate) {
      searchParams.append("fromDate", params.fromDate);
    }
    if (params.toDate) {
      searchParams.append("toDate", params.toDate);
    }
    const query = searchParams.toString();
    const response = await apiClient.get(
      `/api/admin/statistics/reports${query ? `?${query}` : ""}`
    );
    return {
      ok: true,
      data: unwrapData(response),
    };
  } catch (error) {
    const reason = extractErrorMessage(
      error,
      "Không thể lấy thống kê báo cáo."
    );
    console.error("[AdminStatisticsService] fetchReportStatistics failed:", error);
    return { ok: false, reason };
  }
}

// AdminStatistics - Pending Reports
export async function fetchPendingReportStatistics(params = {}) {
  try {
    ensureAuthenticated();
    const searchParams = new URLSearchParams();
    if (params.fromDate) {
      searchParams.append("fromDate", params.fromDate);
    }
    if (params.toDate) {
      searchParams.append("toDate", params.toDate);
    }
    const query = searchParams.toString();
    const response = await apiClient.get(
      `/api/admin/statistics/reports/pending${query ? `?${query}` : ""}`
    );
    return {
      ok: true,
      data: unwrapData(response),
    };
  } catch (error) {
    const reason = extractErrorMessage(
      error,
      "Không thể lấy thống kê báo cáo chờ xử lý."
    );
    console.error("[AdminStatisticsService] fetchPendingReportStatistics failed:", error);
    return { ok: false, reason };
  }
}

// AdminStatistics - Posts
export async function fetchPostStatistics(params = {}) {
  try {
    ensureAuthenticated();
    const searchParams = new URLSearchParams();
    if (params.fromDate) {
      searchParams.append("fromDate", params.fromDate);
    }
    if (params.toDate) {
      searchParams.append("toDate", params.toDate);
    }
    const query = searchParams.toString();
    const response = await apiClient.get(
      `/api/admin/statistics/posts${query ? `?${query}` : ""}`
    );
    return {
      ok: true,
      data: unwrapData(response),
    };
  } catch (error) {
    const reason = extractErrorMessage(
      error,
      "Không thể lấy thống kê bài viết."
    );
    console.error("[AdminStatisticsService] fetchPostStatistics failed:", error);
    return { ok: false, reason };
  }
}

// AdminStatistics - Users All
export async function fetchAllUserStatistics(params = {}) {
  try {
    ensureAuthenticated();
    const searchParams = new URLSearchParams();
    if (params.fromDate) {
      searchParams.append("fromDate", params.fromDate);
    }
    if (params.toDate) {
      searchParams.append("toDate", params.toDate);
    }
    const query = searchParams.toString();
    const response = await apiClient.get(
      `/api/admin/statistics/users/all${query ? `?${query}` : ""}`
    );
    return {
      ok: true,
      data: unwrapData(response),
    };
  } catch (error) {
    const reason = extractErrorMessage(
      error,
      "Không thể lấy thống kê tất cả người dùng."
    );
    console.error("[AdminStatisticsService] fetchAllUserStatistics failed:", error);
    return { ok: false, reason };
  }
}

// AdminStatistics - Users
export async function fetchUserStatistics(params = {}) {
  try {
    ensureAuthenticated();
    const searchParams = new URLSearchParams();
    if (params.fromDate) {
      searchParams.append("fromDate", params.fromDate);
    }
    if (params.toDate) {
      searchParams.append("toDate", params.toDate);
    }
    const query = searchParams.toString();
    const response = await apiClient.get(
      `/api/admin/statistics/users${query ? `?${query}` : ""}`
    );
    return {
      ok: true,
      data: unwrapData(response),
    };
  } catch (error) {
    const reason = extractErrorMessage(
      error,
      "Không thể lấy thống kê người dùng."
    );
    console.error("[AdminStatisticsService] fetchUserStatistics failed:", error);
    return { ok: false, reason };
  }
}

// AdminStatistics - Recent Activities
export async function fetchRecentActivities() {
  try {
    ensureAuthenticated();
    const response = await apiClient.get(
      "/api/admin/statistics/recent-activities"
    );
    return {
      ok: true,
      data: unwrapData(response),
    };
  } catch (error) {
    const reason = extractErrorMessage(
      error,
      "Không thể lấy hoạt động gần đây."
    );
    console.error(
      "[AdminStatisticsService] fetchRecentActivities failed:",
      error
    );
    return { ok: false, reason };
  }
}

// Fetch Player Profile by userId
export async function fetchPlayerProfile(userId) {
  try {
    ensureAuthenticated();
    const response = await apiClient.get(`/api/PlayerProfile/${userId}`);
    return {
      ok: true,
      data: unwrapData(response),
    };
  } catch (error) {
    const reason = extractErrorMessage(
      error,
      "Không thể lấy thông tin profile người dùng."
    );
    console.error("[AdminStatisticsService] fetchPlayerProfile failed:", error);
    return { ok: false, reason };
  }
}

// Lock/Unlock User Account
export async function lockUserAccount(userId) {
  try {
    // Kiểm tra quyền admin trước khi thực hiện
    ensureAdminRole();
    
    // Thử các method khác nhau vì API có thể yêu cầu method cụ thể
    let response;
    let lastError;
    
    // Thử PATCH trước (thường dùng cho toggle status)
    try {
      response = await apiClient.patch(`/api/admin/statistics/lock/${userId}`);
    } catch (patchError) {
      lastError = patchError;
      // Nếu PATCH không được, thử PUT
      if (patchError.response?.status === 405) {
        try {
          response = await apiClient.put(`/api/admin/statistics/lock/${userId}`);
        } catch (putError) {
          lastError = putError;
          // Nếu PUT không được, thử POST
          if (putError.response?.status === 405) {
            try {
              response = await apiClient.post(`/api/admin/statistics/lock/${userId}`);
            } catch (postError) {
              lastError = postError;
              // Nếu POST không được, thử DELETE
              if (postError.response?.status === 405) {
                response = await apiClient.delete(`/api/admin/statistics/lock/${userId}`);
              } else {
                throw postError;
              }
            }
          } else {
            throw putError;
          }
        }
      } else {
        throw patchError;
      }
    }
    
    return {
      ok: true,
      data: unwrapData(response),
    };
  } catch (error) {
    const reason = extractErrorMessage(
      error,
      "Không thể khóa/mở khóa tài khoản."
    );
    console.error("[AdminStatisticsService] lockUserAccount failed:", error);
    console.error("[AdminStatisticsService] Error details:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    });
    return { ok: false, reason };
  }
}

