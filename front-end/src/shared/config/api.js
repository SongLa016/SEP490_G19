/**
 * API Configuration
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
  LOCAL: LOCAL_API_URL,
  PRODUCTION: PRODUCTION_API_URL,
};

// Helper function để build full API URL
export const buildApiUrl = (endpoint, useLocal = false) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const baseUrl = useLocal ? LOCAL_API_URL : API_BASE_URL;
  return `${baseUrl}/api${cleanEndpoint}`;
};

// Helper để build URL cho production
export const buildProductionApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${PRODUCTION_API_URL}/api${cleanEndpoint}`;
};

// Helper để build URL cho local
export const buildLocalApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${LOCAL_API_URL}/api${cleanEndpoint}`;
};

// Export constants cho các môi trường
export const ENV_URLS = {
  PRODUCTION: PRODUCTION_API_URL,
  LOCAL: LOCAL_API_URL,
};

// Kiểm tra môi trường hiện tại
export const isLocalMode = () => API_BASE_URL === LOCAL_API_URL;
export const isProductionMode = () => !isLocalMode();

// Log môi trường hiện tại (chỉ trong development)
if (process.env.NODE_ENV === 'development') {
  console.log(`[API Config] Base URL: ${API_BASE_URL}`);
}

export default API_BASE_URL;
