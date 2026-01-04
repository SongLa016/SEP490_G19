/**
 * API Configuration
 * 
 * Sử dụng biến môi trường REACT_APP_API_BASE_URL để chuyển đổi giữa:
 * - Production (Azure): https://sep490-g19-zxph.onrender.com
 * - Local development: http://localhost:8080
 * 
 * Cách sử dụng:
 * - Tạo file .env.local với REACT_APP_API_BASE_URL=http://localhost:8080 để chạy local
 * - Hoặc không set gì để dùng production URL mặc định
 */

// Production API URL (Azure/Render)
const PRODUCTION_API_URL = "https://sep490-g19-zxph.onrender.com";

// Local development API URL
const LOCAL_API_URL = "http://localhost:8080";

// Lấy API URL từ biến môi trường, mặc định là production
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || PRODUCTION_API_URL;

// Export các URL riêng để tiện sử dụng
export const API_ENDPOINTS = {
  BASE: API_BASE_URL,
  API: `${API_BASE_URL}`,
};

// Helper function để build full API URL
export const buildApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}/api${cleanEndpoint}`;
};

// Export constants cho các môi trường
export const ENV_URLS = {
  PRODUCTION: PRODUCTION_API_URL,
  LOCAL: LOCAL_API_URL,
};

export default API_BASE_URL;
