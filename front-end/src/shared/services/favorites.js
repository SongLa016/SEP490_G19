// yêu thích sân
import axios from "axios";
import { API_BASE_URL } from "../config/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

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
  let message = "Có lỗi xảy ra khi gọi API yêu thích";

  if (error.response) {
    const { status, data, statusText } = error.response;
    if (data && (data.message || data.error || data.detail)) {
      message = data.message || data.error || data.detail;
    } else if (statusText) {
      message = statusText;
    } else {
      message = `Lỗi ${status}`;
    }
  } else if (error.request) {
    message =
      "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.";
  } else if (error.message) {
    message = error.message;
  }

  const err = new Error(message);
  throw err;
};

// hàm lấy danh sách sân yêu thích của người chơi hiện tại
export async function fetchFavoriteFields() {
  try {
    const response = await apiClient.get("/api/FavoriteFields");
    const data = response.data;

    if (!data) return [];

    const list = Array.isArray(data)
      ? data
      : Array.isArray(data.data)
      ? data.data
      : Array.isArray(data.value)
      ? data.value
      : [];

    return list.map((item) => {
      const rawId =
        item.fieldId ?? item.FieldID ?? item.fieldID ?? item.id ?? item.FieldId;
      const fieldId = Number.isNaN(Number(rawId)) ? rawId : Number(rawId);

      return {
        fieldId,
      };
    });
  } catch (error) {
    handleApiError(error);
  }
}

// hàm thêm 1 sân vào danh sách yêu thích
export async function addFavoriteField(fieldId) {
  try {
    const payload = {
      fieldId: Number(fieldId),
    };

    const response = await apiClient.post("/api/FavoriteFields", payload);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// hàm xóa 1 sân khỏi danh sách yêu thích
export async function removeFavoriteField(fieldId) {
  try {
    const id = Number(fieldId);
    const response = await apiClient.delete(`/api/FavoriteFields/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// hàm toggle yêu thích 1 sân, dùng POST hoặc DELETE tùy theo trạng thái hiện tại
export async function toggleFavoriteField(fieldId, isCurrentlyFavorite) {
  if (isCurrentlyFavorite) {
    return removeFavoriteField(fieldId);
  }
  return addFavoriteField(fieldId);
}
