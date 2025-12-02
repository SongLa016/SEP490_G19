import axios from "axios";
import { getStoredToken, isTokenExpired } from "../utils/tokenManager";

const DEFAULT_API_BASE_URL = "https://sep490-g19-zxph.onrender.com";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
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
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        console.warn("Token expired or invalid, clearing auth");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } else if (status === 403) {
        console.warn("Access forbidden - insufficient permissions");
      }
    }
    return Promise.reject(error);
  }
);

const handleApiError = (error) => {
  let errorMessage = "Có lỗi xảy ra khi gọi API";
  let details = "";

  if (error.response) {
    const { status, statusText, data } = error.response;
    console.error("[RatingReply][handleApiError] API Error Response:", {
      status,
      statusText,
      data,
      headers: error.response.headers,
    });

    if (status === 401) {
      errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    } else if (status === 403) {
      errorMessage = "Bạn không có quyền thực hiện thao tác này.";
    } else if (status === 404) {
      errorMessage = "API endpoint không tồn tại.";
    } else if (status === 400) {
      if (data && data.errors) {
        const errorMessages = Object.values(data.errors).flat().join(", ");
        errorMessage = `Dữ liệu không hợp lệ: ${errorMessages}`;
      } else if (data && data.message) {
        errorMessage = data.message;
      } else {
        errorMessage = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
      }
    } else if (status === 500) {
      if (data && data.message) {
        errorMessage = `Lỗi máy chủ: ${data.message}`;
      } else if (data && data.error) {
        errorMessage = `Lỗi máy chủ: ${data.error}`;
      } else {
        errorMessage = "Lỗi máy chủ. Vui lòng thử lại sau.";
      }
    } else if (data && data.message) {
      errorMessage = data.message;
    } else if (data && typeof data === "string") {
      errorMessage = data;
    } else {
      errorMessage = `Lỗi ${status}: ${statusText}`;
    }
  } else if (error.request) {
    if (
      error.code === "ERR_NETWORK" ||
      error.message?.includes("CORS") ||
      error.message?.includes("Network Error")
    ) {
      errorMessage =
        "Lỗi CORS: Backend chưa cấu hình cho phép truy cập từ domain này.";
      details =
        "Vui lòng kiểm tra cấu hình CORS trên backend hoặc liên hệ admin.";
    } else if (
      error.code === "ECONNABORTED" ||
      error.message?.includes("timeout")
    ) {
      errorMessage = "Kết nối timeout. Vui lòng thử lại sau.";
      details = "Server có thể đang quá tải hoặc kết nối mạng chậm.";
    } else {
      errorMessage =
        "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.";
    }
  } else {
    errorMessage = error.message || "Đã xảy ra lỗi không xác định.";
  }

  const fullError = new Error(errorMessage);
  if (details) {
    fullError.details = details;
  }
  throw fullError;
};

function normalizeRatingReply(reply) {
  if (!reply) return null;

  return {
    id: reply.id || reply.replyId || reply.ReplyID,
    replyId: reply.id || reply.replyId || reply.ReplyID,
    ratingId: reply.ratingId || reply.RatingID,
    userId: reply.userId || reply.userID || reply.UserID,
    userName: reply.userName || reply.UserName || "",
    replyText: reply.replyText || reply.ReplyText || "",
    createdAt: reply.createdAt || reply.CreatedAt || reply.created_at,
    updatedAt: reply.updatedAt || reply.UpdatedAt || reply.updated_at,
  };
}

export async function createRatingReply({ userId, ratingId, replyText }) {
  try {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      throw new Error(
        "Token không tồn tại hoặc đã hết hạn. Vui lòng đăng nhập lại."
      );
    }

    if (!userId) {
      throw new Error("UserId không hợp lệ.");
    }

    const rId = Number(ratingId);
    if (isNaN(rId) || rId <= 0) {
      throw new Error("RatingId không hợp lệ.");
    }

    const payload = {
      ratingId: rId,
      replyText: replyText || "",
    };
    const response = await apiClient.post(`/api/RatingReply/${userId}/add`, payload);
    const responseData = response.data;
    
    // Xử lý trường hợp backend trả về string hoặc object
    let resultData;
    if (!responseData) {
      // Nếu không có data, tạo reply object tối thiểu
      resultData = {
        ratingId: rId,
        userId: userId,
        replyText: replyText || "",
        createdAt: new Date().toISOString(),
      };
    } else if (typeof responseData === "string") {
      // Nếu backend trả về string (ví dụ: "Reply added successfully")
      // Tạo reply object tối thiểu dựa trên payload
      resultData = {
        ratingId: rId,
        userId: userId,
        replyText: replyText || "",
        createdAt: new Date().toISOString(),
      };
    } else if (typeof responseData === "object" && "data" in responseData) {
      // Nếu backend trả về object có property "data"
      resultData = responseData.data;
    } else {
      // Nếu backend trả về object trực tiếp
      resultData = responseData;
    }

    return normalizeRatingReply(resultData);
  } catch (error) {
    console.error("[createRatingReply] Error:", error);
    handleApiError(error);
  }
}

export async function fetchRatingReplies(ratingId) {
  try {
    const rId = Number(ratingId);
    if (isNaN(rId) || rId <= 0) {
      return [];
    }

    const response = await apiClient.get(`/api/RatingReply/${rId}/list`);
    let data = response.data;

    if (!data) return [];
    if (Array.isArray(data)) return data.map(normalizeRatingReply);

    if (data && typeof data === "object") {
      if (Array.isArray(data.value)) {
        data = data.value;
      } else if (Array.isArray(data.data)) {
        data = data.data;
      } else if (Array.isArray(data.results)) {
        data = data.results;
      } else {
        data = [];
      }
    } else {
      data = [];
    }

    return data.map(normalizeRatingReply);
  } catch (error) {
    console.error("[fetchRatingReplies] Error:", error);
    // Return empty array on error instead of throwing
    return [];
  }
}

export async function updateRatingReply(replyId, replyText) {
  try {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      throw new Error(
        "Token không tồn tại hoặc đã hết hạn. Vui lòng đăng nhập lại."
      );
    }

    const id = Number(replyId);
    if (isNaN(id) || id <= 0) {
      throw new Error("ReplyId không hợp lệ.");
    }

    const payload = {
      replyText: replyText || "",
    };
    const response = await apiClient.put(`/api/RatingReply/${id}/update`, payload);
    const responseData = response.data;
    
    // Xử lý trường hợp backend trả về string hoặc object
    let resultData;
    if (!responseData) {
      // Nếu không có data, tạo reply object tối thiểu
      resultData = {
        replyId: id,
        replyText: replyText || "",
        updatedAt: new Date().toISOString(),
      };
    } else if (typeof responseData === "string") {
      // Nếu backend trả về string (ví dụ: "Reply updated successfully")
      // Tạo reply object tối thiểu dựa trên payload
      resultData = {
        replyId: id,
        replyText: replyText || "",
        updatedAt: new Date().toISOString(),
      };
    } else if (typeof responseData === "object" && "data" in responseData) {
      // Nếu backend trả về object có property "data"
      resultData = responseData.data;
    } else {
      // Nếu backend trả về object trực tiếp
      resultData = responseData;
    }

    return normalizeRatingReply(resultData);
  } catch (error) {
    console.error("[updateRatingReply] Error:", error);
    handleApiError(error);
  }
}

export async function deleteRatingReply(replyId) {
  try {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      throw new Error(
        "Token không tồn tại hoặc đã hết hạn. Vui lòng đăng nhập lại."
      );
    }

    const id = Number(replyId);
    if (isNaN(id) || id <= 0) {
      throw new Error("ReplyId không hợp lệ.");
    }

    await apiClient.delete(`/api/RatingReply/${id}/delete`);
    return true;
  } catch (error) {
    console.error("[deleteRatingReply] Error:", error);
    handleApiError(error);
  }
}

