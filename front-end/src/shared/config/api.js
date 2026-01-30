/**
 * API Configuration
 */

// Local development API URL
const LOCAL_API_URL = "http://localhost:8080";

// Sử dụng localhost:8080
export const API_BASE_URL = LOCAL_API_URL;

// Export các URL
export const API_ENDPOINTS = {
  BASE: API_BASE_URL,
  API: `${API_BASE_URL}`,
};

// Helper function để build full API URL
export const buildApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}/api${cleanEndpoint}`;
};

// Log môi trường hiện tại (chỉ trong development)
if (process.env.NODE_ENV === "development") {
  console.log(`[API Config] Base URL: ${API_BASE_URL}`);
}

export default API_BASE_URL;
