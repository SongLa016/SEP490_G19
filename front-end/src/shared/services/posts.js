// Service layer for Post APIs
import axios from "axios";
import {
  decodeTokenPayload,
  getStoredToken,
  isTokenExpired,
} from "../utils/tokenManager";

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

/**
 * Get current user info from token
 * @returns {Object|null} User info from token or null
 */
export function getCurrentUserFromToken() {
  const token = getStoredToken();
  if (!token || isTokenExpired(token)) {
    return null;
  }

  const payload = decodeTokenPayload(token);
  if (!payload) {
    return null;
  }

  return {
    userId: payload.UserID || payload.userID || payload.userId,
    email: payload.Email || payload.email,
    fullName: payload.FullName || payload.fullName,
    phone: payload.Phone || payload.phone,
    role: payload.Role || payload.role || payload.RoleName || payload.roleName,
    roleID: payload.RoleID || payload.roleID || payload.roleId,
  };
}

/**
 * Check if current user is the owner of a post
 * @param {Object} post - Post object
 * @returns {boolean} True if current user is the owner
 */
export function isPostOwner(post) {
  const currentUser = getCurrentUserFromToken();
  if (!currentUser || !post) {
    return false;
  }

  // Get post user ID from multiple possible formats
  const postUserId =
    post.userId ||
    post.userID ||
    post.UserID ||
    post.author?.id ||
    post.author?.userId ||
    post.author?.userID ||
    post.author?.UserID ||
    null;

  // Get current user ID
  const currentUserId = currentUser.userId;

  // Compare as both string and number to handle type mismatches
  const isMatch =
    postUserId &&
    currentUserId &&
    (String(postUserId) === String(currentUserId) ||
      Number(postUserId) === Number(currentUserId));
  return isMatch;
}

/**
 * Check if current user has a specific role (from token)
 * @param {string} roleName - Role name to check (e.g., "Player", "Owner", "Admin")
 * @returns {boolean} True if user has the role
 */
export function hasUserRole(roleName) {
  const currentUser = getCurrentUserFromToken();
  if (!currentUser) {
    return false;
  }

  const userRole = currentUser.role || "";
  return userRole.toLowerCase() === roleName.toLowerCase();
}

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

    if (status === 400) {
      // Bad request - show validation errors
      if (data && data.errors) {
        const errorMessages = Object.values(data.errors).flat().join(", ");
        errorMessage = `Dữ liệu không hợp lệ: ${errorMessages}`;
      } else if (data && data.message) {
        errorMessage = data.message;
      } else if (data && typeof data === "string") {
        errorMessage = data;
      } else {
        errorMessage = `Lỗi ${status}: ${
          statusText || "Bad Request"
        }. Vui lòng kiểm tra lại dữ liệu.`;
      }
    } else if (status === 401) {
      errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    } else if (status === 403) {
      errorMessage = "Bạn không có quyền thực hiện thao tác này.";
    } else if (status === 404) {
      errorMessage = "API endpoint không tồn tại.";
    } else if (status === 500) {
      errorMessage = "Lỗi máy chủ. Vui lòng thử lại sau.";
    } else if (data && data.message) {
      errorMessage = data.message;
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

// ========== POST API FUNCTIONS ==========

/**
 * GET /api/Post - Get all posts
 * @param {Object} params - Query parameters (optional)
 * @returns {Promise<Array>} Array of posts
 */
export async function fetchPosts(params = {}) {
  try {
    const response = await apiClient.get("/api/Post", { params });
    let data = response.data;

    // Handle different response formats
    if (!data) {
      return [];
    }
    if (Array.isArray(data)) {
      return data;
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

    return data.map(normalizePost);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * POST /api/Post - Create a new post
 * @param {Object} postData - Post data
 * @param {string} postData.title - Post title
 * @param {string} postData.content - Post content
 * @param {File|File[]} postData.imageFiles - Image file(s) to upload (optional)
 * @param {string[]} postData.imageUrls - Array of image URLs (if already uploaded, optional)
 * @param {number} postData.fieldId - Field ID (optional)
 * @returns {Promise<Object>} Created post
 */
export async function createPost(postData) {
  try {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      throw new Error(
        "Token không tồn tại hoặc đã hết hạn. Vui lòng đăng nhập lại."
      );
    }

    const currentUser = getCurrentUserFromToken();
    if (!currentUser) {
      throw new Error("Không thể xác thực người dùng. Vui lòng đăng nhập lại.");
    }

    // Always use FormData for consistency and to ensure backend [FromForm] binding works
    const formData = new FormData();
    formData.append("Title", postData.title || "");
    formData.append("Content", postData.content || "");

    // FieldId should be a number
    const fieldId = Number(postData.fieldId) || 0;
    formData.append("FieldId", fieldId.toString());

    // Handle ImageFiles (New Files)
    if (postData.imageFiles) {
      const files = Array.isArray(postData.imageFiles)
        ? postData.imageFiles
        : [postData.imageFiles];
      files.forEach((file) => {
        if (file instanceof File) {
          formData.append("ImageFiles", file);
        }
      });
    }

    // Handle existing URLs (if provided as imageUrls or mediaUrl)
    // Some backends might use this to keep existing images
    const imageUrls = postData.imageUrls || [];
    if (imageUrls.length > 0) {
      formData.append("MediaUrl", imageUrls[0]);
    } else if (postData.mediaUrl) {
      formData.append("MediaUrl", postData.mediaUrl);
    }
    const response = await apiClient.post("/api/Post", formData);

    // Handle response with data wrapper
    const responsePostData = response.data?.data || response.data;
    return normalizePost(responsePostData);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * GET /api/Post/{id} - Get post by ID
 * @param {number|string} id - Post ID
 * @returns {Promise<Object>} Post object
 */
export async function fetchPostById(id) {
  try {
    const response = await apiClient.get(`/api/Post/${id}`);
    // Handle response with data wrapper (consistent with createPost/updatePost)
    const postData = response.data?.data || response.data;
    return normalizePost(postData);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * PUT /api/Post/{id} - Update post
 * @param {number|string} id - Post ID
 * @param {Object} postData - Updated post data
 * @param {File|File[]} postData.imageFiles - Image file(s) to upload (optional)
 * @param {string[]} postData.imageUrls - Array of image URLs (if already uploaded, optional)
 * @returns {Promise<Object>} Updated post
 */
export async function updatePost(id, postData) {
  try {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      throw new Error(
        "Token không tồn tại hoặc đã hết hạn. Vui lòng đăng nhập lại."
      );
    }

    // Fetch post first to check ownership
    const post = await fetchPostById(id);
    if (!isPostOwner(post)) {
      throw new Error("Bạn không có quyền chỉnh sửa bài viết này.");
    }

    // Always use FormData for consistency and to ensure backend [FromForm] binding works
    const formData = new FormData();
    formData.append("Title", postData.title || "");
    formData.append("Content", postData.content || "");

    // FieldId should be a number
    const fieldId = Number(postData.fieldId) || 0;
    formData.append("FieldId", fieldId.toString());

    // Handle ImageFiles (New Files)
    if (postData.imageFiles) {
      const files = Array.isArray(postData.imageFiles)
        ? postData.imageFiles
        : [postData.imageFiles];
      files.forEach((file) => {
        if (file instanceof File) {
          formData.append("ImageFiles", file);
        }
      });
    }

    // Handle existing URLs (if provided as imageUrls or mediaUrl)
    // This allows the backend to know we want to keep/set this URL if it supports it
    const imageUrls = postData.imageUrls || [];
    if (imageUrls.length > 0) {
      formData.append("MediaUrl", imageUrls[0]);
    } else if (postData.mediaUrl) {
      formData.append("MediaUrl", postData.mediaUrl);
    }
    const response = await apiClient.put(`/api/Post/${id}`, formData);

    // Handle response with data wrapper
    const responsePostData = response.data?.data || response.data;
    return normalizePost(responsePostData);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * DELETE /api/Post/{id}/mine - User delete their own post
 * @param {number|string} id - Post ID
 * @returns {Promise<void>}
 */
export async function deletePost(id) {
  try {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      throw new Error(
        "Token không tồn tại hoặc đã hết hạn. Vui lòng đăng nhập lại."
      );
    }

    // User deletes their own post
    await apiClient.delete(`/api/Post/${id}/mine`);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * DELETE /api/Post/{id} - Admin delete any post
 * @param {number|string} id - Post ID
 * @returns {Promise<void>}
 */
export async function deletePostAsAdmin(id) {
  try {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      throw new Error(
        "Token không tồn tại hoặc đã hết hạn. Vui lòng đăng nhập lại."
      );
    }

    // Check if user is admin
    const currentUser = getCurrentUserFromToken();
    if (!hasUserRole("Admin")) {
      throw new Error(
        "Bạn không có quyền xóa bài viết này. Chỉ Admin mới có quyền xóa bài viết bất kỳ."
      );
    }

    // Admin deletes any post
    await apiClient.delete(`/api/Post/${id}`);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * GET /api/Post/trending - Get trending posts
 * @param {Object} params - Query parameters (optional)
 * @returns {Promise<Array>} Array of trending posts
 */
export async function fetchTrendingPosts(params = {}) {
  try {
    const response = await apiClient.get("/api/Post/trending", { params });
    let data = response.data;

    if (!data) {
      return [];
    }
    if (Array.isArray(data)) {
      return data.map(normalizePost);
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

    return data.map(normalizePost);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * GET /api/Post/newsfeed - Get newsfeed posts
 * @param {Object} params - Query parameters (optional)
 * @returns {Promise<Array>} Array of newsfeed posts
 */
export async function fetchNewsfeedPosts(params = {}) {
  try {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      throw new Error(
        "Token không tồn tại hoặc đã hết hạn. Vui lòng đăng nhập lại."
      );
    }

    const response = await apiClient.get("/api/Post/newsfeed", { params });
    let data = response.data;

    if (!data) {
      return [];
    }
    if (Array.isArray(data)) {
      return data.map(normalizePost);
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

    return data.map(normalizePost);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * GET /api/Post/search - Search posts
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query
 * @param {string} params.fieldId - Filter by field ID (optional)
 * @param {string} params.userId - Filter by user ID (optional)
 * @returns {Promise<Array>} Array of matching posts
 */
export async function searchPosts(params = {}) {
  try {
    const response = await apiClient.get("/api/Post/search", { params });
    let data = response.data;

    if (!data) {
      return [];
    }
    if (Array.isArray(data)) {
      return data.map(normalizePost);
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

    return data.map(normalizePost);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * GET /api/Post/user/{userId} - Get posts by user ID
 * @param {number|string} userId - User ID
 * @param {Object} params - Query parameters (optional)
 * @returns {Promise<Array>} Array of user's posts
 */
export async function fetchPostsByUser(userId, params = {}) {
  try {
    const response = await apiClient.get(`/api/Post/user/${userId}`, {
      params,
    });
    let data = response.data;

    if (!data) {
      return [];
    }
    if (Array.isArray(data)) {
      return data.map(normalizePost);
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

    return data.map(normalizePost);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * GET /api/Post/field/{fieldId} - Get posts by field ID
 * @param {number|string} fieldId - Field ID
 * @param {Object} params - Query parameters (optional)
 * @returns {Promise<Array>} Array of posts for the field
 */
export async function fetchPostsByField(fieldId, params = {}) {
  try {
    const response = await apiClient.get(`/api/Post/field/${fieldId}`, {
      params,
    });
    let data = response.data;

    if (!data) {
      return [];
    }
    if (Array.isArray(data)) {
      return data.map(normalizePost);
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

    return data.map(normalizePost);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * POST /api/Post/{id}/like - Like a post
 * @param {number|string} id - Post ID
 * @returns {Promise<Object>} Updated post or like status
 */
export async function likePost(id) {
  try {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      throw new Error(
        "Token không tồn tại hoặc đã hết hạn. Vui lòng đăng nhập lại."
      );
    }

    const response = await apiClient.post(`/api/Post/${id}/like`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * DELETE /api/Post/{id}/like - Unlike a post
 * @param {number|string} id - Post ID
 * @returns {Promise<Object>} Updated post or like status
 */
export async function unlikePost(id) {
  try {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      throw new Error(
        "Token không tồn tại hoặc đã hết hạn. Vui lòng đăng nhập lại."
      );
    }

    const response = await apiClient.delete(`/api/Post/${id}/like`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function reviewPost(id, payload = {}) {
  try {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      throw new Error(
        "Token không tồn tại hoặc đã hết hạn. Vui lòng đăng nhập lại."
      );
    }

    // Check if user is admin
    if (!hasUserRole("Admin")) {
      throw new Error(
        "Bạn không có quyền duyệt bài viết. Chỉ Admin mới có quyền này."
      );
    }

    // Ensure id is a number
    const postId = typeof id === "string" ? parseInt(id, 10) : id;
    if (isNaN(postId)) {
      throw new Error("ID bài viết không hợp lệ.");
    }

    // Default status is "Active" (approve), can be "Rejected" to reject
    // If payload already has status, use it; otherwise default to "Active"
    const reviewPayload = {
      status: payload.status || "Active",
    };

    // Validate status
    if (
      reviewPayload.status !== "Active" &&
      reviewPayload.status !== "Rejected"
    ) {
      throw new Error(
        `Status không hợp lệ. Chỉ chấp nhận "Active" hoặc "Rejected", nhận được: "${reviewPayload.status}"`
      );
    }

    // Add other payload fields if provided (e.g., note)
    if (payload.note) {
      reviewPayload.note = payload.note;
    }
    // Call API with status payload
    const response = await apiClient.put(
      `/api/Post/${postId}/review`,
      reviewPayload
    );
    // Handle different response formats
    let responsePostData = null;
    if (response.data) {
      // Try different possible response structures
      responsePostData =
        response.data?.data ||
        response.data?.value ||
        response.data?.result ||
        response.data;
    }

    // If response contains post data, normalize it
    if (responsePostData) {
      return normalizePost(responsePostData);
    }

    // If no post data in response, return success message
    return {
      success: true,
      message: response.data?.message || "Đã duyệt bài viết thành công.",
    };
  } catch (error) {
    console.error("[reviewPost] Error:", error);
    handleApiError(error);
    throw error; // Re-throw to let caller handle it
  }
}

/**
 * GET /api/Post/pending - Get pending posts (Admin only)
 * @param {Object} params - Query parameters (optional)
 * @returns {Promise<Array>} Array of pending posts
 */
export async function fetchPendingPosts(params = {}) {
  try {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      throw new Error(
        "Token không tồn tại hoặc đã hết hạn. Vui lòng đăng nhập lại."
      );
    }

    // Check if user is admin
    if (!hasUserRole("Admin")) {
      throw new Error(
        "Bạn không có quyền xem danh sách bài viết chờ duyệt. Chỉ Admin mới có quyền này."
      );
    }

    const response = await apiClient.get("/api/Post/pending", { params });
    let data = response.data;

    // Handle different response formats
    if (!data) {
      return [];
    }
    if (Array.isArray(data)) {
      return data.map(normalizePost);
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

    return data.map(normalizePost);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Normalize post data to consistent format
 * @param {Object} post - Raw post data from API
 * @returns {Object} Normalized post
 */
function normalizePost(post) {
  if (!post) return null;
  // Normalize author information - check multiple possible formats
  let author = null;
  if (post.author) {
    // If author is an object
    author = {
      id:
        post.author.id ||
        post.author.userId ||
        post.author.userID ||
        post.author.UserID ||
        post.userId ||
        post.userID ||
        post.UserID,
      userId:
        post.author.id ||
        post.author.userId ||
        post.author.userID ||
        post.author.UserID ||
        post.userId ||
        post.userID ||
        post.UserID,
      username:
        post.author.username ||
        post.author.Username ||
        post.author.userName ||
        "",
      name:
        post.author.name ||
        post.author.Name ||
        post.author.fullName ||
        post.author.FullName ||
        post.author.full_name ||
        "",
      avatar:
        post.author.avatar ||
        post.author.Avatar ||
        post.author.avatarUrl ||
        post.author.avatar_url ||
        null,
      verified:
        post.author.verified ||
        post.author.Verified ||
        post.author.isVerified ||
        false,
    };
  } else {
    // Try to extract from post properties (including userName from API response)
    author = {
      id: post.userId || post.userID || post.UserID,
      userId: post.userId || post.userID || post.UserID,
      username: post.authorUsername || post.username || post.userName || "",
      name:
        post.authorName ||
        post.authorFullName ||
        post.fullName ||
        post.FullName ||
        post.userFullName ||
        post.userName ||
        "",
      avatar: post.authorAvatar || post.avatar || post.userAvatar || null,
      verified: post.authorVerified || post.isVerified || false,
    };
  }

  // Normalize field information - check multiple possible formats
  let field = null;
  if (post.field) {
    // If field is an object
    field = {
      id:
        post.field.id ||
        post.field.fieldId ||
        post.field.fieldID ||
        post.field.FieldID ||
        post.fieldId ||
        post.fieldID ||
        post.FieldID,
      fieldId:
        post.field.id ||
        post.field.fieldId ||
        post.field.fieldID ||
        post.field.FieldID ||
        post.fieldId ||
        post.fieldID ||
        post.FieldID,
      name:
        post.field.name ||
        post.field.Name ||
        post.field.fieldName ||
        post.field.FieldName ||
        "",
      fieldName:
        post.field.name ||
        post.field.Name ||
        post.field.fieldName ||
        post.field.FieldName ||
        "",
      location:
        post.field.location ||
        post.field.Location ||
        post.field.address ||
        post.field.Address ||
        post.field.fieldAddress ||
        "",
      address:
        post.field.location ||
        post.field.Location ||
        post.field.address ||
        post.field.Address ||
        post.field.fieldAddress ||
        "",
      complexName:
        post.field.complexName ||
        post.field.ComplexName ||
        post.field.complex_name ||
        "",
    };
  } else if (post.fieldId || post.fieldID || post.FieldID) {
    // If only fieldId is provided, create minimal field object
    field = {
      id: post.fieldId || post.fieldID || post.FieldID,
      fieldId: post.fieldId || post.fieldID || post.FieldID,
      name: post.fieldName || post.FieldName || "",
      fieldName: post.fieldName || post.FieldName || "",
      location:
        post.fieldLocation ||
        post.FieldLocation ||
        post.fieldAddress ||
        post.FieldAddress ||
        "",
      address:
        post.fieldLocation ||
        post.FieldLocation ||
        post.fieldAddress ||
        post.FieldAddress ||
        "",
      complexName: post.complexName || post.ComplexName || "",
    };
  }

  // Get userId from multiple sources - prioritize direct post properties, then author
  const userId =
    post.userId ||
    post.userID ||
    post.UserID ||
    author?.id ||
    author?.userId ||
    author?.userID ||
    author?.UserID ||
    null;
  // Normalize image files - handle imageUrls (from API response), imageFiles, and mediaUrl
  let imageFiles = [];
  let mediaUrl = null;

  // Priority: imageUrls (from API) > imageFiles > ImageFiles > mediaUrl/MediaURL
  if (
    post.imageUrls &&
    Array.isArray(post.imageUrls) &&
    post.imageUrls.length > 0
  ) {
    // API returns imageUrls array (from response)
    imageFiles = post.imageUrls;
    mediaUrl = imageFiles[0];
  } else if (
    post.imageFiles &&
    Array.isArray(post.imageFiles) &&
    post.imageFiles.length > 0
  ) {
    // If imageFiles array is provided, use it
    imageFiles = post.imageFiles;
    mediaUrl = imageFiles[0];
  } else if (
    post.ImageFiles &&
    Array.isArray(post.ImageFiles) &&
    post.ImageFiles.length > 0
  ) {
    // Handle capitalized ImageFiles
    imageFiles = post.ImageFiles;
    mediaUrl = imageFiles[0];
  } else {
    // Fallback to mediaUrl/MediaURL for backward compatibility
    mediaUrl = post.mediaUrl || post.mediaURL || post.MediaURL || null;
    if (mediaUrl) {
      imageFiles = [mediaUrl];
    }
  }

  const normalizedPost = {
    id: post.id || post.postId || post.PostID,
    postId: post.id || post.postId || post.PostID,
    userId: userId, // Use normalized userId
    userID: userId, // Also include userID for compatibility
    UserID: userId, // Also include UserID for compatibility
    title: post.title || post.Title || "",
    content: post.content || post.Content || "",
    mediaUrl: mediaUrl, // Single URL for backward compatibility
    imageFiles: imageFiles, // Array of image URLs
    fieldId: post.fieldId || post.fieldID || post.FieldID || null,
    createdAt: post.createdAt || post.CreatedAt || post.created_at,
    updatedAt: post.updatedAt || post.UpdatedAt || post.updated_at,
    status: post.status || post.Status || "Active",
    visibility: post.visibility || post.Visibility || "Public",
    // Additional fields that might be returned
    likes: post.likes || post.likeCount || post.like_count || 0,
    comments:
      typeof post.comments === "number"
        ? post.comments
        : post.commentCount || post.comment_count || 0,
    isLiked: post.isLiked || post.is_liked || false,
    // Post status fields
    isPending: post.isPending || post.is_pending || false,
    isRejected: post.isRejected || post.is_rejected || false,
    // Permission fields
    isOwner: post.isOwner || post.is_owner || false,
    canEdit: post.canEdit || post.can_edit || false,
    canDelete: post.canDelete || post.can_delete || false,
    showReviewButtons:
      post.showReviewButtons || post.show_review_buttons || false,
    // Author information (normalized)
    author: author,
    // Field information (normalized)
    field: field,
  };
  return normalizedPost;
}
