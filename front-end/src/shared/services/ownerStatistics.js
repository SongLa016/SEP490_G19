import axios from "axios";
import {
  getStoredToken,
  isTokenExpired,
  clearPersistedAuth,
} from "../utils/tokenManager";
import { API_BASE_URL } from "../config/api";

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

// hàm lấy dữ liệu từ response
const unwrapData = (response) => {
  if (!response) return null;
  if (response.data?.data !== undefined) {
    return response.data.data;
  }
  return response.data ?? null;
};

// hàm xử lý lỗi
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

// hàm lấy thống kê doanh thu theo ngày
export async function fetchOwnerDailyRevenue(params = {}) {
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
      `/api/owner/statistics/revenue/daily${query ? `?${query}` : ""}`
    );
    return {
      ok: true,
      data: unwrapData(response),
    };
  } catch (error) {
    const reason = extractErrorMessage(
      error,
      "Không thể lấy thống kê doanh thu theo ngày."
    );
    console.error(
      "[OwnerStatisticsService] fetchOwnerDailyRevenue failed:",
      error
    );
    return { ok: false, reason };
  }
}

// hàm lấy thống kê hiệu suất sân
export async function fetchOwnerFieldPerformance(params = {}) {
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
      `/api/owner/statistics/fields/performance${query ? `?${query}` : ""}`
    );
    return {
      ok: true,
      data: unwrapData(response),
    };
  } catch (error) {
    const reason = extractErrorMessage(
      error,
      "Không thể lấy thống kê hiệu suất sân."
    );
    console.error(
      "[OwnerStatisticsService] fetchOwnerFieldPerformance failed:",
      error
    );
    return { ok: false, reason };
  }
}

// hàm lấy thống kê tỷ lệ lấp đầy
export async function fetchOwnerFillRate(params = {}) {
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
      `/api/owner/statistics/fillrate${query ? `?${query}` : ""}`
    );
    return {
      ok: true,
      data: unwrapData(response),
    };
  } catch (error) {
    const reason = extractErrorMessage(
      error,
      "Không thể lấy thống kê tỷ lệ lấp đầy."
    );
    console.error("[OwnerStatisticsService] fetchOwnerFillRate failed:", error);
    return { ok: false, reason };
  }
}

// hàm lấy danh sách booking gần đây
export async function fetchOwnerRecentBookings(params = {}) {
  try {
    ensureAuthenticated();
    const searchParams = new URLSearchParams();
    if (params.topCount) {
      searchParams.append("topCount", params.topCount);
    }
    if (params.fromDate) {
      searchParams.append("fromDate", params.fromDate);
    }
    if (params.toDate) {
      searchParams.append("toDate", params.toDate);
    }
    const query = searchParams.toString();
    const response = await apiClient.get(
      `/api/owner/statistics/recent-bookings${query ? `?${query}` : ""}`
    );
    return {
      ok: true,
      data: unwrapData(response),
    };
  } catch (error) {
    const reason = extractErrorMessage(
      error,
      "Không thể lấy danh sách booking gần đây."
    );
    console.error(
      "[OwnerStatisticsService] fetchOwnerRecentBookings failed:",
      error
    );
    return { ok: false, reason };
  }
}

// hàm lấy tổng doanh thu
export async function fetchOwnerTotalRevenue(params = {}) {
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
      `/api/owner/statistics/revenue/total${query ? `?${query}` : ""}`
    );
    return {
      ok: true,
      data: unwrapData(response),
    };
  } catch (error) {
    const reason = extractErrorMessage(error, "Không thể lấy tổng doanh thu.");
    console.error(
      "[OwnerStatisticsService] fetchOwnerTotalRevenue failed:",
      error
    );
    return { ok: false, reason };
  }
}

// hàm lấy tổng số booking
export async function fetchOwnerTotalBookings(params = {}) {
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
      `/api/owner/statistics/booking/total${query ? `?${query}` : ""}`
    );
    return {
      ok: true,
      data: unwrapData(response),
    };
  } catch (error) {
    const reason = extractErrorMessage(error, "Không thể lấy tổng số booking.");
    console.error(
      "[OwnerStatisticsService] fetchOwnerTotalBookings failed:",
      error
    );
    return { ok: false, reason };
  }
}
