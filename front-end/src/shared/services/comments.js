// Service layer for Comment APIs
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
        // Token expired or invalid
        console.warn("Token expired or invalid, clearing auth");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Optionally redirect to login
        if (window.location.pathname !== "/login") {
          // window.location.href = "/login";
        }
      } else if (status === 403) {
        // Forbidden - user doesn't have permission
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
      // Bad request - show validation errors
      if (data && data.errors) {
        const errorMessages = Object.values(data.errors).flat().join(", ");
        errorMessage = `Dữ liệu không hợp lệ: ${errorMessages}`;
      } else if (data && data.message) {
        errorMessage = data.message;
      } else {
        errorMessage = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
      }
    } else if (status === 500) {
      // Server error - show more details if available
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

function normalizeComment(comment) {
  if (!comment) return null;

  // Normalize author information
  let author = null;
  if (comment.author) {
    author = {
      id:
        comment.author.id ||
        comment.author.userId ||
        comment.author.userID ||
        comment.author.UserID,
      userId:
        comment.author.id ||
        comment.author.userId ||
        comment.author.userID ||
        comment.author.UserID,
      username:
        comment.author.username ||
        comment.author.Username ||
        comment.author.userName ||
        "",
      name:
        comment.author.name ||
        comment.author.Name ||
        comment.author.fullName ||
        comment.author.FullName ||
        "",
      avatar:
        comment.author.avatar ||
        comment.author.Avatar ||
        comment.author.avatarUrl ||
        null,
      verified:
        comment.author.verified ||
        comment.author.Verified ||
        comment.author.isVerified ||
        false,
    };
  } else {
    author = {
      id: comment.userId || comment.userID || comment.UserID,
      userId: comment.userId || comment.userID || comment.UserID,
      username: "",
      name: "",
      avatar: null,
      verified: false,
    };
  }

  return {
    id: comment.id || comment.commentId || comment.CommentID,
    commentId: comment.id || comment.commentId || comment.CommentID,
    postId: comment.postId || comment.postID || comment.PostID,
    userId: comment.userId || comment.userID || comment.UserID || author?.id,
    userName: comment.userName || comment.UserName || comment.username || comment.Username,
    fullName: comment.fullName || comment.FullName,
    parentCommentId:
      comment.parentCommentId ||
      comment.parentCommentID ||
      comment.ParentCommentID ||
      null,
    content: comment.content || comment.Content || "",
    createdAt: comment.createdAt || comment.CreatedAt || comment.created_at,
    updatedAt: comment.updatedAt || comment.UpdatedAt || comment.updated_at,
    status: comment.status || comment.Status || "Active",
    likes: comment.likes || comment.likeCount || comment.like_count || 0,
    isLiked: comment.isLiked || comment.is_liked || false,
    replies: comment.replies ? comment.replies.map(normalizeComment) : [],
    author: author,
  };
}

// ========== COMMENT API FUNCTIONS ==========

/**
 * POST /api/Comment - Create a new comment
 * @param {Object} commentData - Comment data
 * @param {number} commentData.postId - Post ID
 * @param {number} commentData.parentCommentId - Parent comment ID (optional, only for replies)
 * @param {string} commentData.content - Comment content
 * @returns {Promise<Object>} Created comment
 */
export async function createComment(commentData) {
  try {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      throw new Error(
        "Token không tồn tại hoặc đã hết hạn. Vui lòng đăng nhập lại."
      );
    }

    // Ensure postId is a number
    const postId = Number(commentData.postId);
    if (isNaN(postId) || postId <= 0) {
      throw new Error("Post ID không hợp lệ.");
    }

    // Build payload based on whether it's a parent comment or reply
    const parentCommentId = commentData.parentCommentId
      ? Number(commentData.parentCommentId)
      : null;

    let payload;
    if (parentCommentId && parentCommentId > 0) {
      // Reply comment - include parentCommentId
      payload = {
        postId: postId,
        parentCommentId: parentCommentId,
        content: commentData.content || "",
      };
    } else {
      // Parent comment - only postId and content
      payload = {
        postId: postId,
        content: commentData.content || "",
      };
    }

    console.log("[createComment] Sending payload:", payload);
    console.log("[createComment] Payload types:", {
      postId: typeof payload.postId,
      parentCommentId: payload.parentCommentId
        ? typeof payload.parentCommentId
        : "not included",
      content: typeof payload.content,
    });

    const response = await apiClient.post("/api/Comment", payload);
    console.log("[createComment] Response:", response.data);
    
    // Unwrap data if it's wrapped in { success: true, data: ... }
    const responseData = response.data;
    const resultData = (responseData && 'data' in responseData) ? responseData.data : responseData;
    
    return normalizeComment(resultData);
  } catch (error) {
    console.error("[createComment] Error details:", {
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
 * GET /api/Comment/post/{postId} - Get comments by post ID
 * @param {number|string} postId - Post ID
 * @returns {Promise<Array>} Array of comments
 */
export async function fetchCommentsByPost(postId) {
  try {
    const response = await apiClient.get(`/api/Comment/post/${postId}`);
    let data = response.data;

    console.log('[fetchCommentsByPost] Raw response:', response.data);

    // Handle different response formats
    if (!data) {
      return [];
    }
    if (Array.isArray(data)) {
      console.log('[fetchCommentsByPost] First raw comment:', data[0]);
      return data.map(normalizeComment);
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
      console.log('[fetchCommentsByPost] First raw comment:', data[0]);
    }
    return data.map(normalizeComment);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * GET /api/Comment/{id} - Get comment by ID
 * @param {number|string} id - Comment ID
 * @returns {Promise<Object>} Comment object
 */
export async function fetchCommentById(id) {
  try {
    const response = await apiClient.get(`/api/Comment/${id}`);
    return normalizeComment(response.data);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * PUT /api/Comment/{id} - Update comment
 * @param {number|string} id - Comment ID
 * @param {Object} commentData - Updated comment data
 * @param {string} commentData.content - Comment content
 * @returns {Promise<Object>} Updated comment
 */
export async function updateComment(id, commentData) {
  try {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      throw new Error(
        "Token không tồn tại hoặc đã hết hạn. Vui lòng đăng nhập lại."
      );
    }

    const payload = {
      content: commentData.content,
    };

    const response = await apiClient.put(`/api/Comment/${id}`, payload);
    return normalizeComment(response.data);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * DELETE /api/Comment/{id} - Delete comment
 * @param {number|string} id - Comment ID
 * @returns {Promise<void>}
 */
export async function deleteComment(id) {
  try {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      throw new Error(
        "Token không tồn tại hoặc đã hết hạn. Vui lòng đăng nhập lại."
      );
    }

    await apiClient.delete(`/api/Comment/${id}`);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * GET /api/Comment/{commentId}/replies - Get replies to a comment
 * @param {number|string} commentId - Comment ID
 * @returns {Promise<Array>} Array of reply comments
 */
export async function fetchCommentReplies(commentId) {
  try {
    const response = await apiClient.get(`/api/Comment/${commentId}/replies`);
    let data = response.data;

    if (!data) {
      return [];
    }
    if (Array.isArray(data)) {
      return data.map(normalizeComment);
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

    return data.map(normalizeComment);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * GET /api/Comment/post/{postId}/count - Get comment count for a post
 * @param {number|string} postId - Post ID
 * @returns {Promise<number>} Comment count
 */
export async function getCommentCount(postId) {
  try {
    const response = await apiClient.get(`/api/Comment/post/${postId}/count`);
    const responseData = response.data;
    
    // Handle different response formats
    if (typeof responseData === 'number') {
      return responseData;
    }
    if (responseData && typeof responseData === 'object') {
      // Handle {success: true, data: count} format
      if ('data' in responseData) {
        return Number(responseData.data) || 0;
      }
      // Handle {count: X} format
      if ('count' in responseData) {
        return Number(responseData.count) || 0;
      }
    }
    return 0;
  } catch (error) {
    handleApiError(error);
  }
}
