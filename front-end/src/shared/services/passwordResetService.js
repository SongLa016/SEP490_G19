import axios from "axios";
import { API_BASE_URL } from "../config/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

const handleApiError = (error) => {
  let errorMessage = "Có lỗi xảy ra khi thực hiện yêu cầu";

  if (error.response) {
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
    errorMessage =
      "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet";
    console.error("Network Error:", {
      url: error.config?.url,
      errorMessage: errorMessage,
    });
  } else {
    errorMessage = error.message || errorMessage;
    console.error("Request Error:", error);
  }

  throw new Error(errorMessage);
};

export const passwordResetService = {
  // hàm gửi mã OTP để reset password
  async sendResetOtp(email) {
    try {
      const response = await apiClient.post(
        "${API_BASE_URL}/api/ResertPass/send-otp",
        {
          email: email,
        }
      );
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

  // hàm xác thực mã OTP để reset password
  async verifyResetOtp(otp) {
    try {
      const response = await apiClient.post(
        "${API_BASE_URL}/api/ResertPass/verify-otp",
        {
          otp: otp,
        }
      );
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
