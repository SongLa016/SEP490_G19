/**
 * Utility để test CORS và API connectivity
 */

import { API_BASE_URL } from '../config/api';
import { getStoredToken, isTokenExpired } from './tokenManager';

/**
 * Test kết nối đến API với public endpoint
 * @returns {Promise<Object>} Kết quả test
 */
export async function testPublicApiConnection() {
  const result = {
    success: false,
    error: null,
    details: {},
    timestamp: new Date().toISOString()
  };

  try {
    console.log(`[CORS Test - Public] Testing connection to: ${API_BASE_URL}/api/Post`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${API_BASE_URL}/api/Post`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    result.details.status = response.status;
    result.details.statusText = response.statusText;
    result.details.headers = Object.fromEntries(response.headers.entries());
    
    if (response.ok) {
      const data = await response.json();
      result.success = true;
      result.details.dataType = Array.isArray(data) ? 'array' : typeof data;
      result.details.dataLength = Array.isArray(data) ? data.length : null;
      console.log(`[CORS Test - Public] ✅ Success: ${response.status} ${response.statusText}`);
    } else {
      result.error = `HTTP ${response.status}: ${response.statusText}`;
      console.log(`[CORS Test - Public] ❌ HTTP Error: ${response.status} ${response.statusText}`);
    }
    
  } catch (error) {
    result.error = error.message;
    result.details.errorCode = error.code;
    result.details.errorName = error.name;
    
    // Phân loại lỗi
    if (error.name === 'AbortError') {
      result.details.errorType = 'TIMEOUT';
      console.log(`[CORS Test - Public] ⏰ Timeout: Request took longer than 10 seconds`);
    } else if (error.message.includes('CORS')) {
      result.details.errorType = 'CORS';
      console.log(`[CORS Test - Public] 🚫 CORS Error: ${error.message}`);
    } else if (error.message.includes('Network') || error.code === 'ERR_NETWORK') {
      result.details.errorType = 'NETWORK';
      console.log(`[CORS Test - Public] 🌐 Network Error: ${error.message}`);
    } else if (error.message.includes('Failed to fetch')) {
      result.details.errorType = 'CONNECTION_REFUSED';
      console.log(`[CORS Test - Public] 🔌 Connection Refused: Backend không chạy hoặc không thể kết nối`);
    } else {
      result.details.errorType = 'UNKNOWN';
      console.log(`[CORS Test - Public] ❓ Unknown Error: ${error.message}`);
    }
  }
  
  return result;
}

/**
 * Test kết nối đến API với authenticated endpoint
 * @returns {Promise<Object>} Kết quả test
 */
export async function testAuthenticatedApiConnection() {
  const result = {
    success: false,
    error: null,
    details: {},
    hasToken: false,
    tokenValid: false,
    timestamp: new Date().toISOString()
  };

  try {
    // Kiểm tra token
    const token = getStoredToken();
    result.hasToken = !!token;
    result.tokenValid = token && !isTokenExpired(token);
    
    console.log(`[CORS Test - Auth] Testing authenticated endpoint: ${API_BASE_URL}/api/Post/newsfeed`);
    console.log(`[CORS Test - Auth] Has token: ${result.hasToken}, Valid: ${result.tokenValid}`);
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (result.tokenValid) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${API_BASE_URL}/api/Post/newsfeed`, {
      method: 'GET',
      headers: headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    result.details.status = response.status;
    result.details.statusText = response.statusText;
    result.details.headers = Object.fromEntries(response.headers.entries());
    
    if (response.ok) {
      const data = await response.json();
      result.success = true;
      result.details.dataType = Array.isArray(data) ? 'array' : typeof data;
      result.details.dataLength = Array.isArray(data) ? data.length : null;
      console.log(`[CORS Test - Auth] ✅ Success: ${response.status} ${response.statusText}`);
    } else if (response.status === 401) {
      result.error = `Unauthorized: Token không hợp lệ hoặc đã hết hạn`;
      result.details.expectedError = true; // Đây là lỗi mong đợi nếu không có token
      console.log(`[CORS Test - Auth] 🔐 Expected 401: No valid token`);
    } else {
      result.error = `HTTP ${response.status}: ${response.statusText}`;
      console.log(`[CORS Test - Auth] ❌ HTTP Error: ${response.status} ${response.statusText}`);
    }
    
  } catch (error) {
    result.error = error.message;
    result.details.errorCode = error.code;
    result.details.errorName = error.name;
    
    // Phân loại lỗi
    if (error.name === 'AbortError') {
      result.details.errorType = 'TIMEOUT';
      console.log(`[CORS Test - Auth] ⏰ Timeout: Request took longer than 10 seconds`);
    } else if (error.message.includes('CORS')) {
      result.details.errorType = 'CORS';
      console.log(`[CORS Test - Auth] 🚫 CORS Error: ${error.message}`);
    } else if (error.message.includes('Network') || error.code === 'ERR_NETWORK') {
      result.details.errorType = 'NETWORK';
      console.log(`[CORS Test - Auth] 🌐 Network Error: ${error.message}`);
    } else if (error.message.includes('Failed to fetch')) {
      result.details.errorType = 'CONNECTION_REFUSED';
      console.log(`[CORS Test - Auth] 🔌 Connection Refused: Backend không chạy hoặc không thể kết nối`);
    } else {
      result.details.errorType = 'UNKNOWN';
      console.log(`[CORS Test - Auth] ❓ Unknown Error: ${error.message}`);
    }
  }
  
  return result;
}

/**
 * Test CORS với OPTIONS request
 * @returns {Promise<Object>} Kết quả test CORS
 */
export async function testCorsOptions() {
  const result = {
    success: false,
    error: null,
    corsHeaders: {},
    timestamp: new Date().toISOString()
  };

  try {
    console.log(`[CORS Options Test] Testing CORS preflight to: ${API_BASE_URL}/api/Post`);
    
    const response = await fetch(`${API_BASE_URL}/api/Post`, {
      method: 'OPTIONS',
      headers: {
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    // Lấy CORS headers
    const corsHeaders = {};
    response.headers.forEach((value, key) => {
      if (key.toLowerCase().startsWith('access-control-')) {
        corsHeaders[key] = value;
      }
    });
    
    result.corsHeaders = corsHeaders;
    result.success = response.ok;
    
    if (response.ok) {
      console.log(`[CORS Options Test] ✅ CORS preflight successful`);
      console.log(`[CORS Options Test] CORS Headers:`, corsHeaders);
    } else {
      result.error = `OPTIONS request failed: ${response.status} ${response.statusText}`;
      console.log(`[CORS Options Test] ❌ CORS preflight failed: ${response.status}`);
    }
    
  } catch (error) {
    result.error = error.message;
    console.log(`[CORS Options Test] ❌ Error: ${error.message}`);
  }
  
  return result;
}

/**
 * Chạy tất cả các test
 * @returns {Promise<Object>} Kết quả tổng hợp
 */
export async function runAllTests() {
  console.log(`[API Tests] Starting comprehensive API tests...`);
  console.log(`[API Tests] Target URL: ${API_BASE_URL}`);
  console.log(`[API Tests] Current Origin: ${window.location.origin}`);
  
  const results = {
    publicApi: await testPublicApiConnection(),
    authenticatedApi: await testAuthenticatedApiConnection(),
    corsOptions: await testCorsOptions(),
    summary: {
      timestamp: new Date().toISOString(),
      apiUrl: API_BASE_URL,
      origin: window.location.origin
    }
  };
  
  // Tạo summary dựa trên kết quả
  if (results.publicApi.success) {
    results.summary.status = 'SUCCESS';
    results.summary.message = 'Public API connection successful';
    
    // Kiểm tra thêm authenticated API
    if (results.authenticatedApi.success) {
      results.summary.message = 'Both public and authenticated APIs working';
    } else if (results.authenticatedApi.details.expectedError) {
      results.summary.message = 'Public API working, auth API returns expected 401 (no token)';
    }
  } else if (results.publicApi.details.errorType === 'CONNECTION_REFUSED') {
    results.summary.status = 'BACKEND_DOWN';
    results.summary.message = 'Backend server is not running';
  } else if (results.publicApi.details.errorType === 'CORS') {
    results.summary.status = 'CORS_ERROR';
    results.summary.message = 'CORS configuration issue';
  } else {
    results.summary.status = 'ERROR';
    results.summary.message = results.publicApi.error;
  }
  
  console.log(`[API Tests] Summary:`, results.summary);
  return results;
}