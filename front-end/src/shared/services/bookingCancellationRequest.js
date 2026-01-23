// dịch vụ quản lý yêu cầu hủy booking
import axios from "axios";
import { API_BASE_URL } from "../config/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// thêm interceptor request để bao gồm token auth
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// hàm xử lý lỗi API
const handleApiError = (error) => {
  let errorMessage = "Có lỗi xảy ra khi gọi API";
  if (error.response) {
    const { status, statusText, data } = error.response;
    if (status === 401) {
      errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
    } else if (status === 403) {
      errorMessage = "Bạn không có quyền thực hiện thao tác này.";
    } else if (status === 404) {
      errorMessage = "Không tìm thấy yêu cầu hủy.";
    } else if (status === 500) {
      errorMessage = "Lỗi máy chủ. Vui lòng thử lại sau.";
    } else if (data?.message) {
      errorMessage = data.message;
    } else {
      errorMessage = `Lỗi ${status}: ${statusText}`;
    }
  } else if (error.request) {
    errorMessage = "Không thể kết nối đến server.";
  } else {
    errorMessage = error.message || "Đã xảy ra lỗi không xác định.";
  }

  console.error("API Error:", error);
  throw new Error(errorMessage);
};

// chuẩn hóa dữ liệu response
const normalizeRequest = (data) => ({
  id: data.id || data.Id || data.ID,
  bookingId: data.bookingId || data.BookingId || data.bookingID,
  reason: data.reason || data.Reason || "",
  status: data.status || data.Status || "",
  refundAmount: data.refundAmount || data.RefundAmount || 0,
  createdAt: data.createdAt || data.CreatedAt,
  updatedAt: data.updatedAt || data.UpdatedAt,
  confirmedAt: data.confirmedAt || data.ConfirmedAt,
  ...data,
});

// lấy danh sách yêu cầu hủy của owner
export async function fetchOwnerCancellationRequests() {
  try {
    const response = await apiClient.get(
      `${API_BASE_URL}/api/BookingCancellationRe/owner/cancellations`
    );
    const data = Array.isArray(response.data) ? response.data : [];
    return data.map(normalizeRequest);
  } catch (error) {
    handleApiError(error);
  }
}

// lấy chi tiết yêu cầu hủy theo ID
export async function fetchCancellationRequestById(id) {
  try {
    const response = await apiClient.get(
      `${API_BASE_URL}/api/BookingCancellationRe/${id}`
    );
    return normalizeRequest(response.data);
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    handleApiError(error);
  }
}

// tạo yêu cầu hủy booking mới
export async function createCancellationRequest(requestData) {
  try {
    const response = await apiClient.post(
      `${API_BASE_URL}/api/BookingCancellationRe`,
      requestData
    );
    return normalizeRequest(response.data);
  } catch (error) {
    handleApiError(error);
  }
}

// xác nhận yêu cầu hủy
export async function confirmCancellationRequest(id) {
  try {
    const response = await apiClient.put(
      `${API_BASE_URL}/api/BookingCancellationRe/confirm/${id}`
    );
    return normalizeRequest(response.data);
  } catch (error) {
    handleApiError(error);
  }
}

// xóa/từ chối yêu cầu hủy
export async function deleteCancellationRequest(id) {
  try {
    const response = await apiClient.delete(
      `${API_BASE_URL}/api/BookingCancellationRe/${id}`
    );
    return { success: true, data: response.data };
  } catch (error) {
    handleApiError(error);
  }
}
