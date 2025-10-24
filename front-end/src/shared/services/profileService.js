import axios from "axios";

// Create axios instance for profile API calls
const apiClient = axios.create({
  baseURL:
    process.env.NODE_ENV === "production"
      ? "https://sep490-g19-zxph.onrender.com/api"
      : "https://sep490-g19-zxph.onrender.com/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper function to handle API errors
const handleApiError = (error) => {
  let errorMessage = "Có lỗi xảy ra khi cập nhật profile";

  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    console.error("API Error:", { status, data, url: error.config?.url });

    switch (status) {
      case 400:
        errorMessage = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin";
        break;
      case 401:
        errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại";
        break;
      case 403:
        errorMessage = "Bạn không có quyền thực hiện thao tác này";
        break;
      case 404:
        errorMessage = "Không tìm thấy profile";
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

export const profileService = {
  // Update user profile
  async updateProfile(userId, profileData) {
    try {
      console.log(
        "Update Profile API URL:",
        "https://sep490-g19-zxph.onrender.com/api/UpdateProfile/update-profile"
      );
      console.log("Update Profile data:", {
        userId,
        profileData,
      });

      const response = await apiClient.post("/UpdateProfile/update-profile", {
        userId: userId,
        dateOfBirth: profileData.dateOfBirth || "",
        gender: profileData.gender || "",
        address: profileData.address || "",
        preferredPositions: profileData.preferredPositions || "",
        skillLevel: profileData.skillLevel || "",
        bio: profileData.bio || "",
      });

      console.log("Update Profile response:", response.data);

      return {
        ok: true,
        data: response.data,
        message: response.data.message || "Cập nhật profile thành công",
      };
    } catch (error) {
      handleApiError(error);
      return {
        ok: false,
        reason: error.message || "Cập nhật profile thất bại",
      };
    }
  },

  // Get user profile
  async getProfile(userId) {
    try {
      console.log(
        "Get Profile API URL:",
        "https://sep490-g19-zxph.onrender.com/api/UpdateProfile/get-profile"
      );
      console.log("Get Profile userId:", userId);

      const response = await apiClient.get(
        `/UpdateProfile/get-profile/${userId}`
      );

      console.log("Get Profile response:", response.data);

      return {
        ok: true,
        data: response.data,
        profile: response.data.profile || response.data.data,
      };
    } catch (error) {
      handleApiError(error);
      return {
        ok: false,
        reason: error.message || "Lấy thông tin profile thất bại",
      };
    }
  },
};
