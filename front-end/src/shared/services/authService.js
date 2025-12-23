//xác thực API
import axios from "axios";
import { roleMapping } from "../utils/roleMapping";
import { API_BASE_URL } from "../config/api";

// hàm lấy dữ liệu từ API
function safeDecodeUTF8(str) {
  if (!str || typeof str !== "string") return str;
  try {
    // kiểm tra xem string có chứa URL-encoded characters không
    if (str.includes("%")) {
      try {
        // thử giải mã URL-encoded string
        const decoded = decodeURIComponent(str);
        // kiểm tra xem decoded string có chứa valid UTF-8 characters không
        return decoded;
      } catch (e) {
        // nếu decodeURIComponent không thành công, có thể là double-encoded => thử giải mã twice
        try {
          return decodeURIComponent(decodeURIComponent(str));
        } catch (e2) {
          console.warn("Failed to decode UTF-8 string (double decode):", e2);
          return str;
        }
      }
    }
    // kiểm tra xem string có chứa mojibake patterns (common encoding errors), thử fix
    if (str.includes("á»") || str.includes("Æ")) {
      // có thể là vấn đề encoding backend, trả về như là
      console.warn("Potential encoding issue detected in string:", str);
    }
    // nếu là valid UTF-8 string, trả về như là
    return str;
  } catch (e) {
    // If decoding fails, return original string
    console.warn("Failed to decode UTF-8 string:", e);
    return str;
  }
}

// tạo instance axios với cấu hình cơ bản
const apiClient = axios.create({
  timeout: 15000, // 15 giây timeout
  headers: {
    "Content-Type": "application/json; charset=utf-8",
  },
});

// hàm xử lý lỗi API
const handleApiError = (error) => {
  let errorMessage = "Có lỗi xảy ra khi gọi API";

  if (error.response) {
    const { status, statusText, data } = error.response;
    if (status === 404) {
      errorMessage =
        "API endpoint không tồn tại. Vui lòng kiểm tra đường dẫn API.";
    } else if (status === 500) {
      errorMessage = "Lỗi máy chủ. Vui lòng thử lại sau.";
    } else if (status === 400) {
      errorMessage = "Vui lòng nhập đầy đủ các thông tin.";
    } else if (status === 401) {
      errorMessage = "Không có quyền truy cập. Vui lòng đăng nhập lại.";
    } else if (status === 403) {
      errorMessage = "Truy cập bị từ chối. Vui lòng kiểm tra quyền hạn.";
    } else if (status === 409) {
      errorMessage = "Thông tin đã tồn tại trong hệ thống.";
    }
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
    errorMessage =
      "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.";
  } else {
    errorMessage = error.message || errorMessage;
  }

  throw new Error(errorMessage);
};

export const authService = {
  // đăng ký người dùng và gửi OTP
  async registerUser(userData) {
    try {
      const formData = new FormData();
      formData.append("Email", userData.email || "");
      formData.append("FullName", userData.fullName || "");
      formData.append("RoleName", userData.roleName || "Player");
      formData.append("Password", userData.password || "");
      formData.append("Phone", userData.phone || "");

      // thêm avatar
      if (userData.avatar) {
        formData.append("Avatar", userData.avatar);
      }
      const response = await apiClient.post(
        "${API_BASE_URL}/api/Register/send-otp",
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

  // xác thực OTP
  async verifyOtp(email, otp) {
    try {
      const response = await apiClient.post(
        "${API_BASE_URL}/api/Register/verify-otp",
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

  // lấy vai trò người dùng từ database khi JWT không chứa thông tin vai trò
  async getUserRoleFromDatabase(userID) {
    try {
      const response = await apiClient.get(
        `${API_BASE_URL}/api/Users/get-role/${userID}`
      );
      return response.data;
    } catch (error) {
      return null;
    }
  },

  // đăng nhập người dùng
  async loginUser(credentials) {
    try {
      const response = await apiClient.post(
        `${API_BASE_URL}/api/Login/login`,
        {
          phone: credentials.phone,
          password: credentials.password,
        }
      );
      // giải mã JWT token để lấy thông tin người dùng
      const token = response.data.token || response.data.accessToken;
      if (!token) {
        return {
          ok: false,
          reason: "Số điện thoại hoặc mật khẩu không đúng",
        };
      }

      let userData = null;

      if (token) {
        try {
          // giải mã JWT payload (không xác thực cho bây giờ)
          const payload = JSON.parse(atob(token.split(".")[1]));
          let roleID, roleName;

          // Backend uses "Role" field instead of "RoleID" and "RoleName"
          if (payload.Role) {
            // ánh xạ tên  vai trò thành ID
            roleID = roleMapping.getRoleID(payload.Role);
            roleName = payload.Role;
          } else if (payload.RoleID && payload.RoleName) {
            // fallback cho format cũ
            roleID = payload.RoleID;
            roleName = payload.RoleName;
          } else {
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
      // Extract error message without throwing
      let errorMessage = "Đăng nhập thất bại";

      if (error.response) {
        // Server responded with error status
        const { status, statusText, data } = error.response;

        // Handle specific status codes
        if (status === 401) {
          errorMessage = "Số điện thoại hoặc mật khẩu không đúng";
        } else if (status === 404) {
          errorMessage = "Không tìm thấy tài khoản với số điện thoại này";
        } else if (status === 400) {
          errorMessage =
            "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.";
        } else if (status === 500) {
          errorMessage = "Lỗi máy chủ. Vui lòng thử lại sau.";
        } else if (status === 403) {
          errorMessage = "Truy cập bị từ chối. Vui lòng kiểm tra quyền hạn.";
        }

        // Try to get error message from response data
        if (data && (data.message || data.error || data.detail)) {
          errorMessage =
            data.message || data.error || data.detail || errorMessage;
        } else if (statusText) {
          errorMessage = statusText;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage =
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.";
      } else {
        // Something else happened
        errorMessage = error.message || errorMessage;
      }

      console.error("Login error:", {
        errorMessage,
        originalError: error,
      });

      return {
        ok: false,
        reason: errorMessage,
      };
    }
  },

  // Google Login
  async loginWithGoogle(email, name) {
    try {
      const response = await apiClient.post(
        `${API_BASE_URL}/api/Login/login-google`,
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
        `${API_BASE_URL}/api/Register/resend-otp`,
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

export const VIETNAM_PHONE_REGEX = /^(03|05|07|08|09)[0-9]{8}$/;

// kiểm tra mật khẩu mạnh: 8-64 ký tự, 1 chữ hoa, 1 chữ thường, 1 số
export const validateStrongPassword = (password) => {
  const errors = [];
  if (!password || password.length < 8) {
    errors.push("Tối thiểu 8 ký tự");
  }
  if (password && password.length > 64) {
    errors.push("Tối đa 64 ký tự");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Ít nhất 1 chữ hoa");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Ít nhất 1 chữ thường");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Ít nhất 1 số");
  }
  return {
    isValid: errors.length === 0,
    errors,
    message: errors.length > 0 ? errors.join(", ") : "",
  };
};

// Validate số điện thoại Việt Nam
export const validateVietnamPhone = (phone) => {
  const cleanPhone = phone?.replace(/\s/g, "") || "";
  if (!cleanPhone) {
    return { isValid: false, message: "Vui lòng nhập số điện thoại" };
  }
  if (!VIETNAM_PHONE_REGEX.test(cleanPhone)) {
    return {
      isValid: false,
      message: "SĐT phải 10 số, bắt đầu bằng 03/05/07/08/09",
    };
  }
  return { isValid: true, message: "" };
};

export const validateRegistrationData = (data) => {
  const errors = {};

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Email không hợp lệ";
  }

  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.fullName = "Họ tên phải có ít nhất 2 ký tự";
  }

  // Validate mật khẩu mạnh
  const passwordValidation = validateStrongPassword(data.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.message;
  }

  // Validate số điện thoại Việt Nam
  const phoneValidation = validateVietnamPhone(data.phone);
  if (!phoneValidation.isValid) {
    errors.phone = phoneValidation.message;
  }

  if (!data.roleName) {
    errors.roleName = "Vui lòng chọn vai trò";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// định dạng dữ liệu đăng ký cho API
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
