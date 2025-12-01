// Service layer for Rating APIs
import axios from "axios";
import { getStoredToken, isTokenExpired } from "../utils/tokenManager";

const DEFAULT_API_BASE_URL = "https://sep490-g19-zxph.onrender.com";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL;

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
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
    }
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401/403 errors
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

// Helper function to handle API errors
const handleApiError = (error) => {
  let errorMessage = "Có lỗi xảy ra khi gọi API";
  let details = "";

  if (error.response) {
    const { status, statusText, data } = error.response;
    console.error("[handleApiError] API Error Response:", {
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
      } else if (typeof data === "string") {
        // BE có thể trả về string thuần, ví dụ: "You have already rated this booking"
        if (data === "You have already rated this booking") {
          errorMessage = "Bạn đã đánh giá lịch đặt sân này rồi.";
        } else {
          errorMessage = data;
        }
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

// Normalize rating data
function normalizeRating(rating) {
  if (!rating) return null;

  const bookingStatusRaw =
    rating.bookingStatus ||
    rating.BookingStatus ||
    rating.status ||
    rating.Status ||
    "";

  const replies = Array.isArray(rating.replies)
    ? rating.replies.map((reply) => ({
        replyId: reply.replyId || reply.id || reply.ReplyID,
        id: reply.replyId || reply.id || reply.ReplyID,
        userId: reply.userId || reply.userID || reply.UserID,
        userName: reply.userName || reply.UserName || "",
        replyText: reply.replyText || reply.ReplyText || "",
        createdAt: reply.createdAt || reply.CreatedAt || reply.created_at || "",
      }))
    : [];

  return {
    id: rating.id || rating.ratingId || rating.RatingID,
    ratingId: rating.id || rating.ratingId || rating.RatingID,
    bookingId: rating.bookingId || rating.bookingID || rating.BookingID,
    fieldId: rating.fieldId || rating.fieldID || rating.FieldID,
    fieldName: rating.fieldName || rating.FieldName || "",
    stars: rating.stars || rating.Stars || rating.rating || rating.Rating || 0,
    comment: rating.comment || rating.Comment || "",
    userName:
      rating.userName || rating.UserName || rating.user || rating.User || "Người dùng",
    createdAt: rating.createdAt || rating.CreatedAt || rating.created_at || "",
    userId: rating.userId || rating.userID || rating.UserID || null,
    bookingStatus: bookingStatusRaw ? String(bookingStatusRaw) : "",
    replies,
  };
}

// ========== RATING API FUNCTIONS ==========

/**
 * POST /api/ratings - Create a new rating
 * @param {Object} ratingData - Rating data
 * @param {number} ratingData.bookingId - Booking ID
 * @param {number} ratingData.stars - Number of stars (1-5)
 * @param {string} ratingData.comment - Comment text
 * @returns {Promise<Object>} Created rating
 */
export async function createRating(ratingData) {
  try {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      throw new Error(
        "Token không tồn tại hoặc đã hết hạn. Vui lòng đăng nhập lại."
      );
    }

    // Ensure bookingId is a number
    const bookingId = Number(ratingData.bookingId);
    if (isNaN(bookingId) || bookingId <= 0) {
      throw new Error("Booking ID không hợp lệ.");
    }

    // Ensure stars is between 1 and 5
    const stars = Number(ratingData.stars);
    if (isNaN(stars) || stars < 1 || stars > 5) {
      throw new Error("Số sao phải từ 1 đến 5.");
    }

    const payload = {
      bookingId: bookingId,
      stars: stars,
      comment: ratingData.comment || "",
    };

    console.log("[createRating] Sending payload:", payload);

    const response = await apiClient.post("/api/ratings", payload);
    console.log("[createRating] Response:", response.data);

    // Unwrap data nếu BE trả về dạng { success: true, data: {...} }
    const responseData = response.data;
    let resultData;
    if (responseData && typeof responseData === "object" && "data" in responseData) {
      resultData = responseData.data;
    } else {
      // BE có thể trả về string "Rating submitted successfully" hoặc object rating trực tiếp
      resultData = responseData;
    }

    // Nếu BE chỉ trả string, trả về rating tối thiểu dựa trên payload
    if (typeof resultData === "string") {
      return normalizeRating({
        ratingId: undefined,
        bookingId,
        stars,
        comment: payload.comment,
        userName: "Bạn",
        createdAt: new Date().toISOString(),
      });
    }

    return normalizeRating(resultData);
  } catch (error) {
    console.error("[createRating] Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      error: error,
    });
    handleApiError(error);
  }
}

/**
 * PUT /api/ratings/{id} - Update an existing rating
 * @param {number|string} ratingId - Rating ID
 * @param {Object} ratingData - Rating data
 * @param {number} ratingData.stars - Number of stars (1-5)
 * @param {string} ratingData.comment - Comment text
 * @returns {Promise<Object>} Updated rating
 */
export async function updateRating(ratingId, ratingData) {
  try {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      throw new Error(
        "Token không tồn tại hoặc đã hết hạn. Vui lòng đăng nhập lại."
      );
    }

    const id = Number(ratingId);
    if (isNaN(id) || id <= 0) {
      throw new Error("Rating ID không hợp lệ.");
    }

    const stars = Number(ratingData.stars);
    // Cho phép 0..5 theo JSON của BE, vẫn validate kiểu dữ liệu
    if (isNaN(stars) || stars < 0 || stars > 5) {
      throw new Error("Số sao phải từ 0 đến 5.");
    }

    const payload = {
      stars,
      comment: ratingData.comment ?? "",
    };

    console.log("[updateRating] Sending payload:", payload);

    const response = await apiClient.put(`/api/ratings/${id}`, payload);

    const responseData = response.data;
    const resultData =
      responseData && "data" in responseData ? responseData.data : responseData;

    return normalizeRating(resultData);
  } catch (error) {
    console.error("[updateRating] Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      error: error,
    });
    handleApiError(error);
  }
}

/**
 * DELETE /api/ratings/{id} - Delete a rating
 * @param {number|string} ratingId - Rating ID
 * @returns {Promise<boolean>} true if deleted
 */
export async function deleteRating(ratingId) {
  try {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      throw new Error(
        "Token không tồn tại hoặc đã hết hạn. Vui lòng đăng nhập lại."
      );
    }

    const id = Number(ratingId);
    if (isNaN(id) || id <= 0) {
      throw new Error("Rating ID không hợp lệ.");
    }

    await apiClient.delete(`/api/ratings/${id}`);
    return true;
  } catch (error) {
    console.error("[deleteRating] Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      error: error,
    });
    handleApiError(error);
  }
}

/**
 * GET /api/ratings/field/{fieldId} - Get ratings by field ID
 * @param {number|string} fieldId - Field ID
 * @returns {Promise<Array>} Array of ratings
 */
export async function fetchRatingsByField(fieldId) {
  try {
    const response = await apiClient.get(`/api/ratings/field/${fieldId}`);
    let data = response.data;

    console.log('[fetchRatingsByField] Raw response:', response.data);

    // Handle different response formats
    if (!data) {
      return [];
    }
    if (Array.isArray(data)) {
      console.log('[fetchRatingsByField] First raw rating:', data[0]);
      return data.map(normalizeRating);
    }
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

    if (data.length > 0) {
      console.log('[fetchRatingsByField] First raw rating:', data[0]);
    }
    return data.map(normalizeRating);
  } catch (error) {
    console.error("[fetchRatingsByField] Error:", error);
    // Return empty array on error instead of throwing
    return [];
  }
}

/**
 * GET /api/ratings/complex/{complexId} - Get ratings by complex ID
 * JSON theo BE (đơn giản):
 * [
 *   {
 *     "ratingId": 0,
 *     "bookingId": 0,
 *     "userId": 0,
 *     "userName": "string",
 *     "stars": 0,
 *     "comment": "string",
 *     "createdAt": "2025-12-01T08:59:51Z"
 *   }
 * ]
 *
 * @param {number|string} complexId - Complex ID
 * @returns {Promise<Array>} Array of normalized ratings
 */
export async function fetchRatingsByComplex(complexId) {
  try {
    const response = await apiClient.get(`/api/ratings/complex/${complexId}`);
    let data = response.data;

    console.log("[fetchRatingsByComplex] Raw response:", response.data);

    // BE trả về array đơn giản theo JSON bạn mô tả
    if (!data) {
      return [];
    }
    if (Array.isArray(data)) {
      if (data.length > 0) {
        console.log("[fetchRatingsByComplex] First raw rating:", data[0]);
      }
      return data.map(normalizeRating);
    }

    // Nếu sau này BE bọc trong object, vẫn cố gắng lấy mảng ra
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

    return data.map(normalizeRating);
  } catch (error) {
    console.error("[fetchRatingsByComplex] Error:", error);
    // Không throw để tab Đánh giá vẫn hiển thị được UI trống
    return [];
  }
}

