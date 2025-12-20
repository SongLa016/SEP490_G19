// Service layer for Comment APIs
import axios from "axios";
import { getStoredToken, isTokenExpired } from "../utils/tokenManager";

const DEFAULT_API_BASE_URL = "https://sep490-g19-zxph.onrender.com";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL;

// tạo instance axios với cấu hình base
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

// thêm interceptor request để include token auth nếu có
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

// thêm interceptor response để xử lý lỗi 401/403
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        // token hết hạn hoặc không hợp lệ
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } else if (status === 403) {
        // Forbidden - user doesn't have permission
      }
    }
    return Promise.reject(error);
  }
);

// hàm helper để xử lý lỗi API
const handleApiError = (error) => {
  let errorMessage = "Có lỗi xảy ra khi gọi API";
  let details = "";

  if (error.response) {
    const { status, statusText, data } = error.response;
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

// hàm chuẩn hóa comment
function normalizeComment(comment) {
  if (!comment) return null;
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
    userName:
      comment.userName ||
      comment.UserName ||
      comment.username ||
      comment.Username,
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

// tạo comment mới
export async function createComment(commentData) {
  try {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      throw new Error(
        "Token không tồn tại hoặc đã hết hạn. Vui lòng đăng nhập lại."
      );
    }

    // đảm bảo postId là số
    const postId = Number(commentData.postId);
    if (isNaN(postId) || postId <= 0) {
      throw new Error("Post ID không hợp lệ.");
    }

    const parentCommentId = commentData.parentCommentId
      ? Number(commentData.parentCommentId)
      : null;

    let payload;
    if (parentCommentId && parentCommentId > 0) {
      payload = {
        postId: postId,
        parentCommentId: parentCommentId,
        content: commentData.content || "",
      };
    } else {
      payload = {
        postId: postId,
        content: commentData.content || "",
      };
    }

    const response = await apiClient.post("/api/Comment", payload);
    const responseData = response.data;
    const resultData =
      responseData && "data" in responseData ? responseData.data : responseData;

    return normalizeComment(resultData);
  } catch (error) {
    handleApiError(error);
  }
}

// lấy comments theo postId
export async function fetchCommentsByPost(postId) {
  try {
    const response = await apiClient.get(`/api/Comment/post/${postId}`);
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

    if (data.length > 0) {
    }
    return data.map(normalizeComment);
  } catch (error) {
    handleApiError(error);
  }
}

// lấy comment theo id
export async function fetchCommentById(id) {
  try {
    const response = await apiClient.get(`/api/Comment/${id}`);
    let rawData = response.data;
    let commentData = rawData;
    if (rawData && rawData.data) {
      commentData = rawData.data;
    } else if (rawData && rawData.success && rawData.data) {
      commentData = rawData.data;
    }
    const normalized = normalizeComment(commentData);
    if (normalized) {
      normalized.rawData = rawData;
      normalized.rawCommentData = commentData;
    }
    return normalized;
  } catch (error) {
    handleApiError(error);
  }
}

// cập nhật comment
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

// xóa comment
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

// lấy replies theo commentId
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

// lấy số lượng comment theo postId
export async function getCommentCount(postId) {
  try {
    const response = await apiClient.get(`/api/Comment/post/${postId}/count`);
    const responseData = response.data;

    if (typeof responseData === "number") {
      return responseData;
    }
    if (responseData && typeof responseData === "object") {
      if ("data" in responseData) {
        return Number(responseData.data) || 0;
      }
      if ("count" in responseData) {
        return Number(responseData.count) || 0;
      }
    }
    return 0;
  } catch (error) {
    handleApiError(error);
  }
}
