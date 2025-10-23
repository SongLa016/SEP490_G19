// Authentication service for API integration
import axios from "axios";

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: "https://sep490-g19-zxph.onrender.com/api",
  timeout: 10000, // 10 seconds timeout
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

  // Login user
  async loginUser(credentials) {
    try {
      console.log(
        "Login API URL:",
        "https://sep490-g19-zxph.onrender.com/api/Login/login"
      );
      console.log("Login data:", {
        phone: credentials.phone,
        hasPassword: !!credentials.password,
      });

      const response = await apiClient.post("/Login/login", {
        phone: credentials.phone,
        password: credentials.password,
      });

      return {
        ok: true,
        data: response.data,
        user: response.data.user || response.data.data,
        token: response.data.token || response.data.accessToken,
      };
    } catch (error) {
      handleApiError(error);
      return {
        ok: false,
        reason: error.message || "Đăng nhập thất bại",
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
