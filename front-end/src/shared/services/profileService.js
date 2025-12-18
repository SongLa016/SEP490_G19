import axios from "axios";

// Create axios instance for profile API calls
const apiClient = axios.create({
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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
  async getPlayerProfile(userId) {
    try {
      const API_URL = `https://sep490-g19-zxph.onrender.com/api/PlayerProfile/${userId}`;

      const response = await apiClient.get(API_URL);

      return {
        ok: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error fetching player profile:", error);
      return {
        ok: false,
        reason:
          error.response?.data?.message || "Không thể lấy thông tin người dùng",
      };
    }
  },

  // Change password API
  async changePassword(oldPassword, newPassword, confirmNewPassword) {
    try {
      const API_URL =
        "https://sep490-g19-zxph.onrender.com/api/UserProfile/change-password";

      const response = await apiClient.post(API_URL, {
        oldPassword,
        newPassword,
        confirmNewPassword,
      });

      return {
        ok: true,
        data: response.data,
        message: response.data?.message || "Đổi mật khẩu thành công",
      };
    } catch (error) {
      let errorMessage = "Đổi mật khẩu thất bại";

      // Log để debug
      console.error("Change password error:", error);

      if (error.response) {
        const { data, status } = error.response;
        console.error("Error response:", { status, data });

        // Ưu tiên lấy message từ API response
        if (typeof data === "string") {
          errorMessage = data;
        } else if (data?.message) {
          errorMessage = data.message;
        } else if (data?.Message) {
          errorMessage = data.Message;
        } else if (data?.title) {
          errorMessage = data.title;
        } else if (data?.errors) {
          // Nếu có errors array/object từ validation
          const errors = data.errors;
          if (Array.isArray(errors) && errors.length > 0) {
            errorMessage = errors[0];
          } else if (typeof errors === "object") {
            const firstError = Object.values(errors)[0];
            errorMessage = Array.isArray(firstError)
              ? firstError[0]
              : firstError;
          }
        }
      } else if (
        error.code === "ERR_NETWORK" ||
        error.message === "Network Error"
      ) {
        errorMessage = "Mật khẩu cũ không đúng. Vui lòng kiểm tra lại.";
      } else if (error.request) {
        errorMessage = "Không thể kết nối đến máy chủ";
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        ok: false,
        reason: errorMessage,
      };
    }
  },

  // Update user profile (lấy user từ token)
  async updateProfile(userId, profileData, avatarFile = null) {
    try {
      const API_URL =
        "https://sep490-g19-zxph.onrender.com/api/UserProfile/profile/player";

      // Format dateOfBirth to YYYY-MM-DD format
      let formattedDateOfBirth = "";
      if (profileData.dateOfBirth) {
        if (
          typeof profileData.dateOfBirth === "string" &&
          profileData.dateOfBirth.match(/^\d{4}-\d{2}-\d{2}$/)
        ) {
          formattedDateOfBirth = profileData.dateOfBirth;
        } else {
          const date = new Date(profileData.dateOfBirth);
          if (!isNaN(date.getTime())) {
            formattedDateOfBirth = date.toISOString().split("T")[0];
          }
        }
      }

      // Luôn dùng FormData (multipart/form-data) theo API spec
      const formData = new FormData();

      // Sử dụng PascalCase field names theo API spec (theo Swagger)
      formData.append("FullName", profileData.fullName || "");

      // Chỉ gửi Avatar nếu có file mới
      if (avatarFile) {
        formData.append("Avatar", avatarFile);
      }
      // Nếu không có file, không gửi Avatar field (backend sẽ giữ nguyên avatar cũ)

      formData.append("DateOfBirth", formattedDateOfBirth || "");
      formData.append("Gender", profileData.gender || "");
      formData.append("Address", profileData.address || "");
      formData.append(
        "PreferredPositions",
        profileData.preferredPositions || ""
      );
      formData.append("SkillLevel", profileData.skillLevel || "");
      formData.append("Bio", profileData.bio || "");

      // Phone và Email không cần gửi trong FormData (backend lấy từ token)

      // Use separate client for multipart/form-data
      const requestClient = axios.create({
        timeout: 30000,
        headers: {
          "Content-Type": "multipart/form-data",
          accept: "*/*",
        },
      });

      requestClient.interceptors.request.use(
        (config) => {
          const token = localStorage.getItem("token");
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (error) => {
          return Promise.reject(error);
        }
      );

      // Gọi PUT request
      const response = await requestClient.put(API_URL, formData);

      // Xử lý response - API trả về avatarUrl thay vì avatar
      const responseData = response.data || {};

      return {
        ok: true,
        data: {
          ...responseData,
          // Map avatarUrl về avatar để tương thích với frontend
          avatar: responseData.avatarUrl || responseData.avatar || null,
        },
        message: responseData.message || "Cập nhật profile thành công",
      };
    } catch (error) {
      handleApiError(error);
      return {
        ok: false,
        reason: error.message || "Cập nhật profile thất bại",
      };
    }
  },

  // Get user profile (lấy theo token từ Authorization header)
  async getProfile(userId) {
    try {
      // Lấy profile theo token, không cần userId trong URL
      const response = await apiClient.get(
        "https://sep490-g19-zxph.onrender.com/api/UserProfile/profile"
      );

      // Xử lý response data - có thể có nhiều format khác nhau
      let profileData = null;
      if (response.data) {
        // Nếu response.data là object trực tiếp
        if (response.data.fullName || response.data.email) {
          profileData = response.data;
        }
        // Nếu response.data có nested profile
        else if (response.data.profile) {
          profileData = response.data.profile;
        }
        // Nếu response.data có nested data
        else if (response.data.data) {
          profileData = response.data.data;
        }
        // Nếu response.data là array và có phần tử đầu tiên
        else if (Array.isArray(response.data) && response.data.length > 0) {
          profileData = response.data[0];
        }
      }

      return {
        ok: true,
        data: response.data,
        profile: profileData || response.data,
      };
    } catch (error) {
      handleApiError(error);
      return {
        ok: false,
        reason: error.message || "Lấy thông tin profile thất bại",
      };
    }
  },

  // Update owner/admin profile (PUT request to /api/UserProfile/profile/admin-owner)
  async updateOwnerAdminProfile(profileData, avatarFile = null) {
    try {
      const API_URL =
        "https://sep490-g19-zxph.onrender.com/api/UserProfile/profile/admin-owner";

      // Format dateOfBirth to YYYY-MM-DD format if provided
      let formattedDateOfBirth = "";
      if (profileData.dateOfBirth) {
        if (
          typeof profileData.dateOfBirth === "string" &&
          profileData.dateOfBirth.match(/^\d{4}-\d{2}-\d{2}$/)
        ) {
          formattedDateOfBirth = profileData.dateOfBirth;
        } else {
          const date = new Date(profileData.dateOfBirth);
          if (!isNaN(date.getTime())) {
            formattedDateOfBirth = date.toISOString().split("T")[0];
          }
        }
      }

      // Use FormData for multipart/form-data (supports file upload)
      const formData = new FormData();

      // Sử dụng PascalCase field names theo API spec
      if (profileData.fullName !== undefined) {
        formData.append("FullName", profileData.fullName || "");
      }

      // Chỉ gửi Avatar nếu có file mới
      if (avatarFile) {
        formData.append("Avatar", avatarFile);
      }
      // Nếu không có file, không gửi Avatar field (backend sẽ giữ nguyên avatar cũ)

      if (profileData.dateOfBirth !== undefined) {
        formData.append("DateOfBirth", formattedDateOfBirth || "");
      }

      if (profileData.gender !== undefined) {
        formData.append("Gender", profileData.gender || "");
      }

      if (profileData.address !== undefined) {
        formData.append("Address", profileData.address || "");
      }

      // Phone và Email thường không cần gửi trong FormData (backend lấy từ token)
      // Nhưng nếu API yêu cầu, có thể thêm:
      // if (profileData.phone !== undefined) {
      //   formData.append("Phone", profileData.phone || "");
      // }
      // if (profileData.email !== undefined) {
      //   formData.append("Email", profileData.email || "");
      // }

      // Use separate client for multipart/form-data
      const requestClient = axios.create({
        timeout: 30000,
        headers: {
          "Content-Type": "multipart/form-data",
          accept: "*/*",
        },
      });

      requestClient.interceptors.request.use(
        (config) => {
          const token = localStorage.getItem("token");
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (error) => {
          return Promise.reject(error);
        }
      );

      // Gọi PUT request
      const response = await requestClient.put(API_URL, formData);

      // Xử lý response - API có thể trả về avatarUrl thay vì avatar
      const responseData = response.data || {};

      return {
        ok: true,
        data: {
          ...responseData,
          // Map avatarUrl về avatar để tương thích với frontend
          avatar: responseData.avatarUrl || responseData.avatar || null,
        },
        message: responseData.message || "Cập nhật profile thành công",
      };
    } catch (error) {
      handleApiError(error);
      return {
        ok: false,
        reason: error.message || "Cập nhật profile thất bại",
      };
    }
  },
};
