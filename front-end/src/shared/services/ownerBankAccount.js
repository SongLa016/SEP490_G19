// Service for managing owner bank accounts
import axios from "axios";
import {
  getStoredToken,
  isTokenExpired,
  clearPersistedAuth,
} from "../utils/tokenManager";

const DEFAULT_API_BASE_URL = "https://sep490-g19-zxph.onrender.com";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL;

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token && !isTokenExpired(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearPersistedAuth();
    }
    return Promise.reject(error);
  }
);

// Helper function to check if error is related to foreign key constraint or trigger
const isForeignKeyConstraintError = (error) => {
  // Check response data
  if (error.response?.data) {
    const errorData = error.response.data;
    let errorMessage = '';
    
    // Try to extract error message from various formats
    if (typeof errorData === 'string') {
      errorMessage = errorData;
    } else if (errorData.message) {
      errorMessage = errorData.message;
    } else if (errorData.error) {
      errorMessage = typeof errorData.error === 'string' ? errorData.error : errorData.error.message || JSON.stringify(errorData.error);
    } else if (errorData.title) {
      errorMessage = errorData.title;
    } else {
      errorMessage = JSON.stringify(errorData);
    }
    
    if (errorMessage) {
      const lowerMessage = errorMessage.toLowerCase();
      
      // Check for common database constraint/trigger keywords
      const constraintKeywords = [
        'foreign key',
        'constraint',
        'reference',
        'trigger',
        'đang được sử dụng',
        'đang sử dụng',
        'được sử dụng',
        'sân',
        'field',
        'cannot delete',
        'cannot be deleted',
        'violation',
        'referenced',
        'dependency',
        'conflict',
        'conflicting'
      ];
      
      if (constraintKeywords.some(keyword => lowerMessage.includes(keyword))) {
        return true;
      }
    }
  }
  
  // Check statusText
  if (error.response?.statusText) {
    const statusText = error.response.statusText.toLowerCase();
    if (statusText.includes('internal server error') && error.response.status === 500) {
      // For DELETE operations with 500 error, likely a constraint violation
      return true;
    }
  }
  
  return false;
};

// Helper function to handle API errors
const handleApiError = (error, operation = '') => {
  let errorMessage = "Có lỗi xảy ra khi gọi API";

  // Check for CORS error (only for actual network errors, not server errors)
  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    // Only show network error if there's no response (actual network issue)
    if (!error.response && error.request) {
      if (error.message && error.message.includes('CORS')) {
        errorMessage = "Lỗi CORS: Không thể kết nối đến server. Vui lòng kiểm tra cấu hình CORS trên server hoặc thử lại sau.";
      } else {
        errorMessage = "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.";
      }
    }
  }
  
  // If we have a response, it's a server error, not a network error
  if (error.response) {
    const { status, statusText, data } = error.response;
    
    // For DELETE operations, 500 errors are often constraint violations
    const isDeleteOperation = operation === 'delete' || error.config?.method === 'delete';
    
    // Check if it's a foreign key constraint or trigger violation
    if (isForeignKeyConstraintError(error) || (isDeleteOperation && status === 500)) {
      errorMessage = "Không thể xóa tài khoản ngân hàng vì đang được sử dụng bởi một hoặc nhiều sân. Vui lòng gỡ liên kết tài khoản khỏi các sân trước khi xóa.";
    } else if (status === 404) {
      errorMessage = "Tài khoản ngân hàng không tồn tại hoặc đã bị xóa.";
    } else if (status === 401) {
      errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    } else if (status === 403) {
      errorMessage = "Bạn không có quyền thực hiện thao tác này.";
    } else if (status === 500) {
      // For DELETE with 500, assume it's a constraint issue
      if (isDeleteOperation) {
        errorMessage = "Không thể xóa tài khoản ngân hàng vì đang được sử dụng bởi một hoặc nhiều sân. Vui lòng gỡ liên kết tài khoản khỏi các sân trước khi xóa.";
      } else {
        errorMessage = "Lỗi máy chủ. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.";
      }
    } else if (status === 400) {
      // Check if 400 error might be related to constraint
      if (isForeignKeyConstraintError(error)) {
        errorMessage = "Không thể xóa tài khoản ngân hàng vì đang được sử dụng bởi một hoặc nhiều sân. Vui lòng gỡ liên kết tài khoản khỏi các sân trước khi xóa.";
      } else {
        errorMessage = data?.message || "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
      }
    } else if (data && data.message) {
      errorMessage = data.message;
    } else {
      errorMessage = `Lỗi ${status}: ${statusText}`;
    }
  } else if (error.request && !error.response) {
    // Only show network error if we made a request but got no response
    errorMessage = "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.";
  } else {
    errorMessage = error.message || "Đã xảy ra lỗi không xác định.";
  }

  console.error("API Error:", error);
  throw new Error(errorMessage);
};

// API functions
export async function fetchOwnerBankAccounts(ownerId) {
  try {
    const ownerIdNum = Number(ownerId);
    console.log(`Fetching bank accounts for ownerId: ${ownerIdNum}`);

    // Try different endpoint variations
    const endpoints = [
      `/api/OwnerBankAccount/${ownerIdNum}`,
      `/api/OwnerBankAccount/owner/${ownerIdNum}`,
      `/api/ownerBankAccount/${ownerIdNum}`,
    ];

    let response = null;
    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying GET endpoint: ${endpoint}`);
        response = await apiClient.get(endpoint);
        console.log(`Success with GET endpoint: ${endpoint}`);
        console.log("Bank accounts response:", response.data);
        break;
      } catch (err) {
        console.log(
          `Failed with GET endpoint: ${endpoint}`,
          err.response?.status
        );
        lastError = err;
        // If it's not a 404, stop trying other endpoints
        if (err.response?.status !== 404) {
          break;
        }
      }
    }

    if (!response) {
      throw lastError || new Error("Tất cả endpoint đều thất bại");
    }

    // Handle both array and single object responses
    const accounts = Array.isArray(response.data)
      ? response.data
      : response.data
      ? [response.data]
      : [];

    return accounts.map((account) => ({
      bankAccountId: account.bankAccountId,
      ownerId: account.ownerId,
      bankName: account.bankName,
      bankShortCode: account.bankShortCode,
      accountNumber: account.accountNumber,
      accountHolder: account.accountHolder,
      isDefault: account.isDefault,
      createdAt: account.createdAt,
    }));
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    handleApiError(error);
  }
}

export async function fetchBankAccount(bankAccountId) {
  try {
    const response = await apiClient.get(
      `/api/OwnerBankAccount/${bankAccountId}`
    );
    const account = response.data;
    return {
      bankAccountId: account.bankAccountId,
      ownerId: account.ownerId,
      bankName: account.bankName,
      bankShortCode: account.bankShortCode,
      accountNumber: account.accountNumber,
      accountHolder: account.accountHolder,
      isDefault: account.isDefault,
      createdAt: account.createdAt,
    };
  } catch (error) {
    handleApiError(error);
  }
}

export async function createOwnerBankAccount(accountData) {
  try {
    console.log("Creating bank account with data:", accountData);
    const payload = {
      ownerId: accountData.ownerId,
      bankName: accountData.bankName,
      bankShortCode: accountData.bankShortCode || "",
      accountNumber: accountData.accountNumber,
      accountHolder: accountData.accountHolder,
      isDefault: accountData.isDefault || false,
    };
    console.log("Sending payload:", payload);
    const response = await apiClient.post(
      "/api/OwnerBankAccount",
      payload
    );
    console.log("Create bank account response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating bank account:", error);
    handleApiError(error);
  }
}

export async function updateOwnerBankAccount(bankAccountId, accountData) {
  try {
    const response = await apiClient.put(
      `/api/OwnerBankAccount/${bankAccountId}`,
      {
      ownerId: accountData.ownerId,
      bankName: accountData.bankName,
      bankShortCode: accountData.bankShortCode || "",
      accountNumber: accountData.accountNumber,
      accountHolder: accountData.accountHolder,
      isDefault: accountData.isDefault || false,
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function deleteOwnerBankAccount(bankAccountId) {
  try {
    console.log(`Deleting bank account with ID: ${bankAccountId}`);
    const response = await apiClient.delete(
      `/api/OwnerBankAccount/${bankAccountId}`
    );
    console.log("Delete bank account response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error deleting bank account:", error);
    // Log more details for debugging
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
      console.error("Response statusText:", error.response.statusText);
    } else if (error.request) {
      console.error("Request made but no response received:", error.request);
    }
    handleApiError(error, 'delete');
  }
}

export async function setDefaultBankAccount(bankAccountId, ownerId) {
  try {
    // First, set all accounts to non-default
    const accounts = await fetchOwnerBankAccounts(ownerId);
    for (const account of accounts) {
      if (account.bankAccountId !== bankAccountId && account.isDefault) {
        await updateOwnerBankAccount(account.bankAccountId, {
          ...account,
          isDefault: false,
        });
      }
    }

    // Then set the selected account as default
    const account = accounts.find((a) => a.bankAccountId === bankAccountId);
    if (account) {
      return await updateOwnerBankAccount(bankAccountId, {
        ...account,
        isDefault: true,
      });
    }
  } catch (error) {
    handleApiError(error);
  }
}
