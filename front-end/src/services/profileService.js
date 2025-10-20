// Profile service for API integration
export const profileService = {
  // Get user profile data
  async getProfile(userId) {
    try {
      const response = await fetch(`/api/users/${userId}/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error;
    }
  },

  // Update user profile
  async updateProfile(userId, profileData) {
    try {
      const response = await fetch(`/api/users/${userId}/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  },

  // Upload avatar
  async uploadAvatar(userId, file) {
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch(`/api/users/${userId}/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload avatar");
      }

      return await response.json();
    } catch (error) {
      console.error("Error uploading avatar:", error);
      throw error;
    }
  },

  // Get user statistics
  async getStats(userId) {
    try {
      const response = await fetch(`/api/users/${userId}/stats`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching stats:", error);
      throw error;
    }
  },

  // Change password
  async changePassword(userId, passwordData) {
    try {
      const response = await fetch(`/api/users/${userId}/password`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passwordData),
      });

      if (!response.ok) {
        throw new Error("Failed to change password");
      }

      return await response.json();
    } catch (error) {
      console.error("Error changing password:", error);
      throw error;
    }
  },

  // Update notification settings
  async updateNotificationSettings(userId, settings) {
    try {
      const response = await fetch(`/api/users/${userId}/notifications`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("Failed to update notification settings");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating notification settings:", error);
      throw error;
    }
  },

  // Delete account
  async deleteAccount(userId) {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      return await response.json();
    } catch (error) {
      console.error("Error deleting account:", error);
      throw error;
    }
  },
};

// Profile data validation
export const validateProfileData = (data) => {
  const errors = {};

  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.fullName = "Họ tên phải có ít nhất 2 ký tự";
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Email không hợp lệ";
  }

  if (data.phone && !/^[0-9]{10,11}$/.test(data.phone.replace(/\s/g, ""))) {
    errors.phone = "Số điện thoại không hợp lệ";
  }

  if (data.dateOfBirth) {
    const birthDate = new Date(data.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    if (age < 13 || age > 100) {
      errors.dateOfBirth = "Tuổi phải từ 13 đến 100";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Format profile data for API
export const formatProfileForAPI = (profileData) => {
  return {
    fullName: profileData.fullName?.trim(),
    phone: profileData.phone?.trim(),
    dateOfBirth: profileData.dateOfBirth,
    gender: profileData.gender,
    address: profileData.address?.trim(),
    preferredPositions: profileData.preferredPositions,
    skillLevel: profileData.skillLevel,
    bio: profileData.bio?.trim(),
  };
};
