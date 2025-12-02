// Service for managing deposit policies
import axios from "axios";

// Create axios instance with base configuration
const apiClient = axios.create({
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token if available
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

// Helper function to handle API errors
const handleApiError = (error) => {
  let errorMessage = "Có lỗi xảy ra khi gọi API";

  if (error.response) {
    const { status, statusText, data } = error.response;
    if (status === 404) {
      errorMessage = "API endpoint không tồn tại.";
    } else if (status === 500) {
      errorMessage = "Lỗi máy chủ. Vui lòng thử lại sau.";
    } else if (data && data.message) {
      errorMessage = data.message;
    } else {
      errorMessage = `Lỗi ${status}: ${statusText}`;
    }
  } else if (error.request) {
    errorMessage = "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.";
  } else {
    errorMessage = error.message || "Đã xảy ra lỗi không xác định.";
  }

  console.error("API Error:", error);
  throw new Error(errorMessage);
};

// API functions
export async function fetchDepositPolicies() {
  try {
    const response = await apiClient.get(
      "https://sep490-g19-zxph.onrender.com/api/DepositPolicy"
    );
    // Handle both array and single object responses
    const policies = Array.isArray(response.data)
      ? response.data
      : response.data
      ? [response.data]
      : [];

    return policies.map((policy) => ({
      depositPolicyId: policy.depositPolicyId,
      fieldId: policy.fieldId,
      fieldName: policy.fieldName || "",
      depositPercent: policy.depositPercent,
      minDeposit: policy.minDeposit,
      maxDeposit: policy.maxDeposit,
      createdAt: policy.createdAt,
    }));
  } catch (error) {
    console.error("Error fetching deposit policies:", error);
    handleApiError(error);
  }
}

export async function fetchDepositPolicy(policyId) {
  try {
    const response = await apiClient.get(
      `https://sep490-g19-zxph.onrender.com/api/DepositPolicy/${policyId}`
    );
    const policy = response.data;
    return {
      depositPolicyId: policy.depositPolicyId,
      fieldId: policy.fieldId,
      fieldName: policy.fieldName || "",
      depositPercent: policy.depositPercent,
      minDeposit: policy.minDeposit,
      maxDeposit: policy.maxDeposit,
      createdAt: policy.createdAt,
    };
  } catch (error) {
    console.error("Error fetching deposit policy:", error);
    handleApiError(error);
  }
}

export async function fetchDepositPolicyByField(fieldId) {
  try {
    const fieldIdNum = Number(fieldId);
    if (!fieldIdNum || isNaN(fieldIdNum)) {
      console.warn(`Invalid fieldId: ${fieldId}`);
      return null;
    }
    // Use the specific endpoint for field-based query
    const DEFAULT_API_BASE_URL = "https://sep490-g19-zxph.onrender.com";
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL;
    const endpoint = `${API_BASE_URL}/api/DepositPolicy/field/${fieldIdNum}`;
    const response = await apiClient.get(endpoint);
    // Handle both array and single object responses
    const policy = Array.isArray(response.data)
      ? response.data[0]
      : response.data;

    if (!policy) {
      return null;
    }

    const normalizedPolicy = {
      depositPolicyId: policy.depositPolicyId || policy.depositPolicyID,
      fieldId: policy.fieldId || policy.fieldID,
      fieldName: policy.fieldName || policy.FieldName || "",
      depositPercent: policy.depositPercent || policy.depositPercent || 0,
      minDeposit: policy.minDeposit || policy.minDeposit || 0,
      maxDeposit: policy.maxDeposit || policy.maxDeposit || 0,
      createdAt: policy.createdAt || policy.CreatedAt,
    };
    return normalizedPolicy;
  } catch (error) {
    console.error("Error fetching deposit policy by field:", error);
    // Return null if not found (404), otherwise log and return null
    if (error.response?.status === 404) {
      console.log(`Deposit policy not found for fieldId: ${fieldId} (404)`);
      return null;
    }
    // For other errors, log but don't throw - return null to allow page to continue
    console.warn(`Failed to fetch deposit policy for fieldId ${fieldId}:`, error.message);
    return null;
  }
}

export async function createDepositPolicy(policyData) {
  try {
    const payload = {
      fieldId: policyData.fieldId,
      depositPercent: policyData.depositPercent,
      minDeposit: policyData.minDeposit || null,
      maxDeposit: policyData.maxDeposit || null,
    };
    const response = await apiClient.post(
      "https://sep490-g19-zxph.onrender.com/api/DepositPolicy",
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Error creating deposit policy:", error);
    handleApiError(error);
  }
}

export async function updateDepositPolicy(policyId, policyData) {
  try {
    const payload = {
      fieldId: policyData.fieldId,
      depositPercent: policyData.depositPercent,
      minDeposit: policyData.minDeposit || null,
      maxDeposit: policyData.maxDeposit || null,
    };
    const response = await apiClient.put(
      `https://sep490-g19-zxph.onrender.com/api/DepositPolicy/${policyId}`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Error updating deposit policy:", error);
    handleApiError(error);
  }
}

export async function deleteDepositPolicy(policyId) {
  try {
    const response = await apiClient.delete(
      `https://sep490-g19-zxph.onrender.com/api/DepositPolicy/${policyId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting deposit policy:", error);
    handleApiError(error);
  }
}

