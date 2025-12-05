// Authentication service for API integration
import axios from "axios";
import { roleMapping } from "../utils/roleMapping";

// Helper function to safely decode UTF-8 strings
// Handles cases where backend might URL-encode or double-encode UTF-8 characters
function safeDecodeUTF8(str) {
  if (!str || typeof str !== 'string') return str;
  try {
    // Check if string contains URL-encoded characters
    if (str.includes('%')) {
      try {
        // Try to decode URL-encoded string
        const decoded = decodeURIComponent(str);
        // Check if decoded string contains valid UTF-8 characters
        return decoded;
      } catch (e) {
        // If decodeURIComponent fails, might be double-encoded
        // Try decoding twice
        try {
          return decodeURIComponent(decodeURIComponent(str));
        } catch (e2) {
          console.warn('Failed to decode UTF-8 string (double decode):', e2);
          return str;
        }
      }
    }
    // If string contains mojibake patterns (common encoding errors), try to fix
    // Example: "Nguyá»…n" should be "Nguyễn"
    if (str.includes('á»') || str.includes('Æ')) {
      // This might be a backend encoding issue, return as is for now
      // Backend should fix encoding, but we log it
      console.warn('Potential encoding issue detected in string:', str);
    }
    // If it's already a valid UTF-8 string, return as is
    return str;
  } catch (e) {
    // If decoding fails, return original string
    console.warn('Failed to decode UTF-8 string:', e);
    return str;
  }
}

// Create axios instance with base configuration
const apiClient = axios.create({
  timeout: 15000, // 15 seconds timeout
  headers: {
    "Content-Type": "application/json; charset=utf-8",
  },
});

// Helper function to handle API errors
const handleApiError = (error) => {
  let errorMessage = "Có lỗi xảy ra khi gọi API";

  if (error.response) {
    // Server responded with error status
    const { status, statusText, data } = error.response;

    // Handle specific status codes
    if (status === 404) {
      errorMessage =
        "API endpoint không tồn tại. Vui lòng kiểm tra đường dẫn API.";
    } else if (status === 500) {
      errorMessage = "Lỗi máy chủ. Vui lòng thử lại sau.";
    } else if (status === 400) {
      errorMessage = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.";
    } else if (status === 401) {
      errorMessage = "Không có quyền truy cập. Vui lòng đăng nhập lại.";
    } else if (status === 403) {
      errorMessage = "Truy cập bị từ chối. Vui lòng kiểm tra quyền hạn.";
    } else if (status === 409) {
      errorMessage = "Thông tin đã tồn tại trong hệ thống.";
    }

    // Try to get error message from response data
    if (data && (data.message || data.error || data.detail)) {
      errorMessage = data.message || data.error || data.detail || errorMessage;
    } else {
      errorMessage = statusText || errorMessage;
    }

    console.error("API Error:", {
      status: status,
      statusText: statusText,
      url: error.config?.url,
      errorMessage: errorMessage,
      responseData: data,
    });
  } else if (error.request) {
    // Request was made but no response received
    errorMessage =
      "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.";
    console.error("Network Error:", {
      url: error.config?.url,
      errorMessage: errorMessage,
    });
  } else {
    // Something else happened
    errorMessage = error.message || errorMessage;
    console.error("Request Error:", error);
  }

  throw new Error(errorMessage);
};

export const authService = {
  // Register user and send OTP
  async registerUser(userData) {
    try {
      const formData = new FormData();

      // Add all required fields
      formData.append("Email", userData.email || "");
      formData.append("FullName", userData.fullName || "");
      formData.append("RoleName", userData.roleName || "Player");
      formData.append("Password", userData.password || "");
      formData.append("Phone", userData.phone || "");

      // Add avatar if provided
      if (userData.avatar) {
        formData.append("Avatar", userData.avatar);
      }
      const response = await apiClient.post(
        "https://sep490-g19-zxph.onrender.com/api/Register/send-otp",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return {
        ok: true,
        data: response.data,
        message:
          response.data.message ||
          "Đăng ký thành công, vui lòng kiểm tra email để lấy mã OTP",
      };
    } catch (error) {
      handleApiError(error);
      return {
        ok: false,
        reason: error.message || "Đăng ký thất bại",
      };
    }
  },

  // Verify OTP
  async verifyOtp(email, otp) {
    try {
      const response = await apiClient.post(
        "https://sep490-g19-zxph.onrender.com/api/Register/verify-otp",
        {
          email: email,
          otp: otp,
        }
      );

      return {
        ok: true,
        data: response.data,
        user: response.data.user || response.data.data,
      };
    } catch (error) {
      handleApiError(error);
      return {
        ok: false,
        reason: error.message || "Xác thực OTP thất bại",
      };
    }
  },

  // Get user role from database when JWT doesn't contain role info
  async getUserRoleFromDatabase(userID) {
    try {
      // Call API to get user role information
      const response = await apiClient.get(
        `https://sep490-g19-zxph.onrender.com/api/Users/get-role/${userID}`
      );
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching role from database:", error);
      return null;
    }
  },

  // Login user
  async loginUser(credentials) {
    try {
      const loginUrl = "https://sep490-g19-zxph.onrender.com/api/Login/login";
      // Test connection first
      const response = await apiClient.post(
        "https://sep490-g19-zxph.onrender.com/api/Login/login",
        {
          phone: credentials.phone,
          password: credentials.password,
        }
      );
      // Decode JWT token to get user info
      const token = response.data.token || response.data.accessToken;
      let userData = null;

      if (token) {
        try {
          // Decode JWT payload (without verification for now)
          const payload = JSON.parse(atob(token.split(".")[1]));
          // Extract role information from JWT token (backend format)
          let roleID, roleName;

          // Backend uses "Role" field instead of "RoleID" and "RoleName"
          if (payload.Role) {
            // Map role name to role ID
            roleID = roleMapping.getRoleID(payload.Role);
            roleName = payload.Role;
            console.log(
              "🔍 Role from token (backend format):",
              payload.Role,
              "→ RoleID:",
              roleID
            );
          } else if (payload.RoleID && payload.RoleName) {
            // Fallback for old format
            roleID = payload.RoleID;
            roleName = payload.RoleName;
            console.log(
              "🔍 Role from token (old format):",
              payload.RoleID,
              "→",
              payload.RoleName
            );
          } else {
            console.warn("⚠️ No role information found in token");
            roleID = 1;
            roleName = "Player";
          }

          userData = {
            userID: payload.UserID,
            email: payload.Email,
            fullName: safeDecodeUTF8(payload.FullName),
            phone: payload.Phone,
            roleID: roleID,
            roleName: roleName,
            emailVerified:
              payload.EmailVerified !== undefined
                ? payload.EmailVerified
                : true,
          };
        } catch (error) {
          console.error("Error decoding JWT token:", error);
          // Fallback to basic user data - only if JWT decode fails
          userData = {
            phone: credentials.phone,
            roleID: 1, // Default to Player
            roleName: "Player",
            emailVerified: true, // Mặc định true cho fallback
          };
          console.warn(
            "JWT decode failed, using fallback data for user:",
            credentials.phone
          );
        }
      }

      return {
        ok: true,
        data: response.data,
        user: userData,
        token: token,
      };
    } catch (error) {
      handleApiError(error);
      return {
        ok: false,
        reason: error.message || "Đăng nhập thất bại",
      };
    }
  },

  // Google Login
  async loginWithGoogle(email, name) {
    try {
      const response = await apiClient.post(
        "https://sep490-g19-zxph.onrender.com/api/Login/login-google",
        {
          email: email,
          name: name,
        }
      );
      const token = response.data.token || response.data.accessToken;
      let userData = null;

      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));

          // Extract role information from JWT token (backend format)
          let roleID, roleName;

          // Backend uses "Role" field instead of "RoleID" and "RoleName"
          if (payload.Role) {
            // Map role name to role ID
            roleID = roleMapping.getRoleID(payload.Role);
            roleName = payload.Role;
            console.log(
              "🔍 Google Login - Role from token (backend format):",
              payload.Role,
              "→ RoleID:",
              roleID
            );
          } else if (payload.RoleID && payload.RoleName) {
            // Fallback for old format
            roleID = payload.RoleID;
            roleName = payload.RoleName;
            console.log(
              "🔍 Google Login - Role from token (old format):",
              payload.RoleID,
              "→",
              payload.RoleName
            );
          } else {
            console.warn(
              "⚠️ Google Login - No role information found in token"
            );
            roleID = 1;
            roleName = "Player";
          }

          userData = {
            userID: payload.UserID,
            email: payload.Email,
            fullName: safeDecodeUTF8(payload.FullName),
            phone: payload.Phone || "",
            roleID: roleID,
            roleName: roleName,
            emailVerified:
              payload.EmailVerified !== undefined
                ? payload.EmailVerified
                : true, // Google đã xác thực email, không cần OTP
          };
        } catch (error) {
          console.error("Error decoding JWT token:", error);
          userData = {
            email: email,
            fullName: name,
            roleID: 1, // Default to Player
            roleName: "Player",
            emailVerified: true, // Google đã xác thực email, không cần OTP
          };
        }
      }

      return {
        ok: true,
        user: userData,
        token: token,
        message: response.data.message || "Đăng nhập Google thành công",
      };
    } catch (error) {
      handleApiError(error);
      return {
        ok: false,
        reason: error.message || "Đăng nhập Google thất bại",
      };
    }
  },

  // Resend OTP
  async resendOtp(email) {
    try {
      const response = await apiClient.post(
        "https://sep490-g19-zxph.onrender.com/api/Register/resend-otp",
        { email }
      );

      return {
        ok: true,
        data: response.data,
        message: response.data.message || "Mã OTP đã được gửi lại",
      };
    } catch (error) {
      handleApiError(error);
      return {
        ok: false,
        reason: error.message || "Gửi lại OTP thất bại",
      };
    }
  },
};

// Validation helpers
export const validateRegistrationData = (data) => {
  const errors = {};

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Email không hợp lệ";
  }

  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.fullName = "Họ tên phải có ít nhất 2 ký tự";
  }

  if (!data.password || data.password.length < 6) {
    errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
  }

  if (!data.phone || !/^[0-9]{10,11}$/.test(data.phone.replace(/\s/g, ""))) {
    errors.phone = "Số điện thoại không hợp lệ";
  }

  if (!data.roleName) {
    errors.roleName = "Vui lòng chọn vai trò";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Format registration data for API
export const formatRegistrationData = (formData) => {
  return {
    email: formData.email?.trim(),
    fullName: formData.fullName?.trim(),
    roleName: formData.roleName || "Player",
    password: formData.password,
    phone: formData.phone?.trim(),
    avatar: formData.avatar || null,
  };
};
