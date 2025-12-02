import axios from "axios";
import {
  getStoredToken,
  isTokenExpired,
  clearPersistedAuth,
} from "../utils/tokenManager";

const DEFAULT_API_BASE_URL = "https://sep490-g19-zxph.onrender.com";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token && !isTokenExpired(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearPersistedAuth();
    }
    return Promise.reject(error);
  }
);

const ensureAuthenticated = () => {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Bạn cần đăng nhập để thực hiện thao tác này.");
  }
  if (isTokenExpired(token)) {
    clearPersistedAuth();
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }
};

export const playerStatisticsService = {
  /**
   * Helper function to extract numeric value from API response
   */
  extractNumericValue(data, possibleKeys = []) {
    if (typeof data === 'number') {
      return data;
    }
    if (typeof data === 'object' && data !== null) {
      // Try provided keys first
      for (const key of possibleKeys) {
        if (data[key] !== undefined && typeof data[key] === 'number') {
          return data[key];
        }
      }
      // Try common keys
      const commonKeys = ['totalBookings', 'totalHours', 'totalSpent', 'totalSpending', 'averageRating', 'data', 'value', 'count'];
      for (const key of commonKeys) {
        if (data[key] !== undefined) {
          const value = data[key];
          if (typeof value === 'number') {
            return value;
          }
          if (typeof value === 'object' && value !== null) {
            // Recursively try to extract
            const nested = this.extractNumericValue(value, possibleKeys);
            if (nested !== null) return nested;
          }
        }
      }
      // If object has only one key, try that value
      const keys = Object.keys(data);
      if (keys.length === 1) {
        const value = data[keys[0]];
        if (typeof value === 'number') {
          return value;
        }
        if (typeof value === 'object' && value !== null) {
          return this.extractNumericValue(value, possibleKeys);
        }
      }
      // Try first numeric value found
      for (const value of Object.values(data)) {
        if (typeof value === 'number') {
          return value;
        }
      }
    }
    return 0;
  },

  /**
   * Lấy tổng số lượt đặt sân
   * GET /api/player/statistic/total-bookings
   */
  async getTotalBookings() {
    try {
      ensureAuthenticated();
      const response = await apiClient.get(
        "/api/player/statistic/total-bookings"
      );
      
      const totalBookings = this.extractNumericValue(response.data, [
        'totalBookings', 'bookings', 'count', 'total'
      ]);
      
      return {
        ok: true,
        data: response.data,
        totalBookings: totalBookings,
      };
    } catch (error) {
      console.error("Error fetching total bookings:", error);
      throw new Error(
        error.response?.data?.message ||
        "Không thể lấy tổng số lượt đặt sân"
      );
    }
  },

  /**
   * Lấy tổng giờ chơi
   * GET /api/player/statistic/total-playing
   */
  async getTotalPlaying() {
    try {
      ensureAuthenticated();
      const response = await apiClient.get(
        "/api/player/statistic/total-playing"
      );
      
      const totalHours = this.extractNumericValue(response.data, [
        'totalHours', 'totalPlaying', 'totalPlayingHours', 'hours', 'playingHours'
      ]);
      
      return {
        ok: true,
        data: response.data,
        totalHours: totalHours,
      };
    } catch (error) {
      console.error("Error fetching total playing:", error);
      throw new Error(
        error.response?.data?.message ||
        "Không thể lấy tổng giờ chơi"
      );
    }
  },

  /**
   * Lấy tổng chi tiêu
   * GET /api/player/statistic/total-spending
   */
  async getTotalSpending() {
    try {
      ensureAuthenticated();
      const response = await apiClient.get(
        "/api/player/statistic/total-spending"
      );
      
      const totalSpent = this.extractNumericValue(response.data, [
        'totalSpent', 'totalSpending', 'spending', 'amount', 'total'
      ]);
      
      return {
        ok: true,
        data: response.data,
        totalSpent: totalSpent,
      };
    } catch (error) {
      console.error("Error fetching total spending:", error);
      throw new Error(
        error.response?.data?.message ||
        "Không thể lấy tổng chi tiêu"
      );
    }
  },

  /**
   * Lấy thống kê theo tháng
   * GET /api/player/statistic/stats/monthly
   */
  async getMonthlyStats() {
    try {
      ensureAuthenticated();
      const response = await apiClient.get(
        "/api/player/statistic/stats/monthly"
      );
      return {
        ok: true,
        data: response.data,
        monthlyStats: response.data?.monthlyStats || response.data?.data || response.data || [],
      };
    } catch (error) {
      console.error("Error fetching monthly stats:", error);
      throw new Error(
        error.response?.data?.message ||
        "Không thể lấy thống kê theo tháng"
      );
    }
  },

  /**
   * Lấy đánh giá trung bình
   * GET /api/player/statistic/average-rating
   */
  async getAverageRating() {
    try {
      ensureAuthenticated();
      const response = await apiClient.get(
        "/api/player/statistic/average-rating"
      );
      
      const averageRating = this.extractNumericValue(response.data, [
        'averageRating', 'rating', 'avgRating', 'average'
      ]);
      
      return {
        ok: true,
        data: response.data,
        averageRating: averageRating,
      };
    } catch (error) {
      console.error("Error fetching average rating:", error);
      throw new Error(
        error.response?.data?.message ||
        "Không thể lấy đánh giá trung bình"
      );
    }
  },

  /**
   * Lấy hoạt động gần đây
   * GET /api/player/statistic/recent-activity
   */
  async getRecentActivity() {
    try {
      ensureAuthenticated();
      const response = await apiClient.get(
        "/api/player/statistic/recent-activity"
      );
      return {
        ok: true,
        data: response.data,
        recentActivity: response.data?.recentActivity || response.data?.data || response.data || [],
      };
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      throw new Error(
        error.response?.data?.message ||
        "Không thể lấy hoạt động gần đây"
      );
    }
  },

  /**
   * Lấy tất cả thống kê cùng lúc
   */
  async getAllStats() {
    try {
      ensureAuthenticated();
      const [totalBookings, totalPlaying, totalSpending, monthlyStats, averageRating, recentActivity] = await Promise.all([
        this.getTotalBookings(),
        this.getTotalPlaying(),
        this.getTotalSpending(),
        this.getMonthlyStats(),
        this.getAverageRating(),
        this.getRecentActivity(),
      ]);

      return {
        ok: true,
        totalBookings: totalBookings.totalBookings,
        totalHours: totalPlaying.totalHours,
        totalSpent: totalSpending.totalSpent,
        monthlyStats: monthlyStats.monthlyStats,
        averageRating: averageRating.averageRating,
        recentActivity: recentActivity.recentActivity,
      };
    } catch (error) {
      console.error("Error fetching all stats:", error);
      throw error;
    }
  },
};

