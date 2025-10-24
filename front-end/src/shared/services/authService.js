// Authentication service for API integration
import axios from "axios";
import { roleMapping } from "../utils/roleMapping";

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL:
    process.env.NODE_ENV === "production"
      ? "https://sep490-g19-zxph.onrender.com/api"
      : "https://sep490-g19-zxph.onrender.com/api",
  timeout: 15000, // 15 seconds timeout
  headers: {
    "Content-Type": "application/json",
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
      console.log(
        "Register API URL:",
        "https://sep490-g19-zxph.onrender.com/api/Register/send-otp"
      );
      console.log("Register data:", {
        email: userData.email,
        fullName: userData.fullName,
        roleName: userData.roleName,
        phone: userData.phone,
        hasAvatar: !!userData.avatar,
      });

      const response = await apiClient.post("/Register/send-otp", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

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
      console.log(
        "Verify OTP API URL:",
        "https://sep490-g19-zxph.onrender.com/api/Register/verify-otp"
      );

      const response = await apiClient.post("/Register/verify-otp", {
        email: email,
        otp: otp,
      });

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
      console.log("🔍 Fetching role from database for UserID:", userID);

      // Call API to get user role information
      const response = await apiClient.get(`/Users/get-role/${userID}`);
      console.log("🔍 Database role response:", response.data);

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
      console.log("Login API URL:", loginUrl);
      console.log("Login data:", {
        phone: credentials.phone,
        hasPassword: !!credentials.password,
      });

      // Test connection first
      console.log("Testing connection to:", loginUrl);

      const response = await apiClient.post("/Login/login", {
        phone: credentials.phone,
        password: credentials.password,
      });

      console.log("Login response:", response.data);

      // Decode JWT token to get user info
      const token = response.data.token || response.data.accessToken;
      let userData = null;

      if (token) {
        try {
          // Decode JWT payload (without verification for now)
          const payload = JSON.parse(atob(token.split(".")[1]));
          console.log("🔍 JWT Payload:", payload);
          console.log("🔍 Raw RoleID from JWT:", payload.RoleID);
          console.log("🔍 Raw RoleName from JWT:", payload.RoleName);

          userData = {
            userID: payload.UserID,
            email: payload.Email,
            fullName: payload.FullName,
            phone: payload.Phone,
            roleID: payload.RoleID || 1, // Default to Player (RoleID = 1)
            roleName: payload.RoleName || "Player", // Default role if not in token
            emailVerified:
              payload.EmailVerified !== undefined
                ? payload.EmailVerified
                : true, // Mặc định true nếu không có trong token
          };

          console.log("🔍 UserData before mapping:", userData);
          console.log(
            "🔍 Is RoleID valid?",
            roleMapping.isValidRoleID(userData.roleID)
          );

          // If JWT doesn't contain RoleID, fetch from database
          if (!userData.roleID || !roleMapping.isValidRoleID(userData.roleID)) {
            console.log("🔄 JWT missing RoleID, fetching from database...");
            const dbRoleData = await this.getUserRoleFromDatabase(
              userData.userID
            );

            if (dbRoleData && dbRoleData.roleID) {
              userData.roleID = dbRoleData.roleID;
              userData.roleName = roleMapping.getRoleName(dbRoleData.roleID);
              console.log(
                "✅ Role fetched from database:",
                userData.roleID,
                "→",
                userData.roleName
              );
            } else {
              console.log(
                "❌ Could not fetch role from database, defaulting to Player"
              );
              userData.roleID = 1;
              userData.roleName = "Player";
            }
          } else {
            // Map RoleID to RoleName based on database mapping
            userData.roleName = roleMapping.getRoleName(userData.roleID);
            console.log(
              "✅ RoleID mapping successful:",
              userData.roleID,
              "→",
              userData.roleName
            );
          }

          console.log("🔍 Final UserData:", userData);
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
      console.log(
        "Google Login API URL:",
        "https://sep490-g19-zxph.onrender.com/api/Login/login-google"
      );
      console.log("Google Login data:", { email, name });

      const response = await apiClient.post("/Login/login-google", {
        email: email,
        name: name,
      });

      console.log("Google Login response:", response.data);

      const token = response.data.token || response.data.accessToken;
      let userData = null;

      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          userData = {
            userID: payload.UserID,
            email: payload.Email,
            fullName: payload.FullName,
            phone: payload.Phone || "",
            roleID: payload.RoleID || 1, // Default to Player (RoleID = 1)
            roleName: payload.RoleName || "Player", // Default role if not in token
            emailVerified:
              payload.EmailVerified !== undefined
                ? payload.EmailVerified
                : false, // Google login might not be verified
          };

          // Map RoleID to RoleName based on database mapping
          if (userData.roleID && roleMapping.isValidRoleID(userData.roleID)) {
            userData.roleName = roleMapping.getRoleName(userData.roleID);
          } else {
            userData.roleName = "Player";
            userData.roleID = 1;
            console.log(
              "Invalid or missing RoleID, defaulting to Player (RoleID = 1)"
            );
          }
          console.log("Decoded user data from Google token:", userData);
        } catch (error) {
          console.error("Error decoding JWT token:", error);
          userData = {
            email: email,
            fullName: name,
            roleID: 1, // Default to Player
            roleName: "Player",
            emailVerified: false, // Google login might not be verified
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
      console.log(
        "Resend OTP API URL:",
        "https://sep490-g19-zxph.onrender.com/api/Register/resend-otp"
      );

      const response = await apiClient.post("/Register/resend-otp", { email });

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
