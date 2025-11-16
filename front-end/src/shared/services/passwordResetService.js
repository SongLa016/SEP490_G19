import axios from "axios";

// Create axios instance for password reset API calls
const apiClient = axios.create({
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper function to handle API errors
const handleApiError = (error) => {
  let errorMessage = "Có lỗi xảy ra khi thực hiện yêu cầu";

  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    console.error("API Error:", { status, data, url: error.config?.url });

    switch (status) {
      case 400:
        errorMessage =
          data?.message ||
          "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin";
        break;
      case 401:
        errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại";
        break;
      case 403:
        errorMessage = "Bạn không có quyền thực hiện thao tác này";
        break;
      case 404:
        errorMessage = data?.message || "Không tìm thấy thông tin";
        break;
      case 500:
        errorMessage = "Lỗi máy chủ. Vui lòng thử lại sau";
        break;
      default:
        errorMessage = data?.message || errorMessage;
    }
  } else if (error.request) {
    // Request was made but no response received
    errorMessage =
      "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet";
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

export const passwordResetService = {
  // Send OTP for password reset
  async sendResetOtp(email) {
    try {
      console.log(
        "Send Reset OTP API URL:",
        "https://sep490-g19-zxph.onrender.com/api/ResertPass/send-otp"
      );
      console.log("Send Reset OTP data:", { email });

      const response = await apiClient.post(
        "https://sep490-g19-zxph.onrender.com/api/ResertPass/send-otp",
        {
        email: email,
      });

      console.log("Send Reset OTP response:", response.data);

      return {
        ok: true,
        data: response.data,
        message:
          response.data.message || "Mã OTP đã được gửi đến email của bạn",
      };
    } catch (error) {
      handleApiError(error);
      return {
        ok: false,
        reason: error.message || "Gửi mã OTP thất bại",
      };
    }
  },

  // Verify OTP for password reset
  async verifyResetOtp(otp) {
    try {
      console.log(
        "Verify Reset OTP API URL:",
        "https://sep490-g19-zxph.onrender.com/api/ResertPass/verify-otp"
      );
      console.log("Verify Reset OTP data:", { otp });

      const response = await apiClient.post(
        "https://sep490-g19-zxph.onrender.com/api/ResertPass/verify-otp",
        {
        otp: otp,
      });

      console.log("Verify Reset OTP response:", response.data);

      return {
        ok: true,
        data: response.data,
        message: response.data.message || "Xác thực OTP thành công",
      };
    } catch (error) {
      handleApiError(error);
      return {
        ok: false,
        reason: error.message || "Xác thực OTP thất bại",
      };
    }
  },
};
