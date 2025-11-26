import axios from "axios";
import {
  getStoredToken,
  isTokenExpired,
  clearPersistedAuth,
} from "../utils/tokenManager";

const DEFAULT_API_BASE_URL = "https://sep490-g19-zxph.onrender.com";
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

