import axios from "axios";
import {
  getStoredToken,
  isTokenExpired,
  clearPersistedAuth,
} from "../utils/tokenManager";

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

export async function fetchReports(params = {}) {
  try {
    ensureAuthenticated();

    const {
      pageNumber = 1,
      pageSize = 20,
      status,
      targetType,
    } = params;

    const searchParams = new URLSearchParams({
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString(),
    });

    if (status) {
      searchParams.append("status", status);
    }
    if (targetType) {
      searchParams.append("targetType", targetType);
    }

    const response = await apiClient.get(`/api/Report?${searchParams.toString()}`);
    const data = unwrapData(response);
    return {
      ok: true,
      data: Array.isArray(data) ? data : data?.reports ?? data ?? [],
      pagination: response.data?.pagination,
    };
  } catch (error) {
    const reason = extractErrorMessage(
      error,
      "Không thể lấy danh sách báo cáo."
    );
    console.error("[ReportsService] fetchReports failed:", error);
    return { ok: false, reason };
  }
}

export async function fetchReportById(reportId) {
  try {
    ensureAuthenticated();
    const response = await apiClient.get(`/api/Report/${reportId}`);
    return {
      ok: true,
      data: unwrapData(response),
    };
  } catch (error) {
    const reason = extractErrorMessage(
      error,
      "Không thể lấy chi tiết báo cáo."
    );
    console.error("[ReportsService] fetchReportById failed:", error);
    return { ok: false, reason };
  }
}

export async function fetchMyReports() {
  try {
    ensureAuthenticated();
    const response = await apiClient.get(`/api/Report/my-reports`);
    return {
      ok: true,
      data: unwrapData(response) ?? [],
    };
  } catch (error) {
    const reason = extractErrorMessage(
      error,
      "Không thể lấy danh sách báo cáo của bạn."
    );
    console.error("[ReportsService] fetchMyReports failed:", error);
    return { ok: false, reason };
  }
}

export async function fetchPendingReports(topCount = 50) {
  try {
    ensureAuthenticated();
    const response = await apiClient.get(
      `/api/Report/pending?topCount=${topCount}`
    );
    return {
      ok: true,
      data: unwrapData(response) ?? [],
    };
  } catch (error) {
    const reason = extractErrorMessage(
      error,
      "Không thể lấy báo cáo chờ xử lý."
    );
    console.error("[ReportsService] fetchPendingReports failed:", error);
    return { ok: false, reason };
  }
}

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
      `/api/Report/statistics${query ? `?${query}` : ""}`
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
    console.error("[ReportsService] fetchReportStatistics failed:", error);
    return { ok: false, reason };
  }
}

export async function createReport(payload) {
  try {
    ensureAuthenticated();
    const response = await apiClient.post(`/api/Report`, payload);
    return {
      ok: true,
      data: unwrapData(response),
      message: response.data?.message,
    };
  } catch (error) {
    const reason = extractErrorMessage(error, "Không thể gửi báo cáo.");
    console.error("[ReportsService] createReport failed:", error);
    return { ok: false, reason };
  }
}

export async function handleReport(reportId, payload) {
  try {
    ensureAuthenticated();
    const response = await apiClient.put(
      `/api/Report/${reportId}/handle`,
      payload
    );
    return {
      ok: true,
      data: unwrapData(response),
      message: response.data?.message,
    };
  } catch (error) {
    const reason = extractErrorMessage(error, "Không thể xử lý báo cáo.");
    console.error("[ReportsService] handleReport failed:", error);
    return { ok: false, reason };
  }
}

export async function deleteReport(reportId) {
  try {
    ensureAuthenticated();
    const response = await apiClient.delete(`/api/Report/${reportId}`);
    return {
      ok: true,
      message: response.data?.message ?? "Đã xóa báo cáo.",
    };
  } catch (error) {
    const reason = extractErrorMessage(error, "Không thể xóa báo cáo.");
    console.error("[ReportsService] deleteReport failed:", error);
    return { ok: false, reason };
  }
}

