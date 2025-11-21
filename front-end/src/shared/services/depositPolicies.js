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
    console.log("Fetching all deposit policies");
    const response = await apiClient.get(
      "https://sep490-g19-zxph.onrender.com/api/DepositPolicy"
    );
    console.log("Deposit policies response:", response.data);

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
    console.log(`Fetching deposit policy ${policyId}`);
    const response = await apiClient.get(
      `https://sep490-g19-zxph.onrender.com/api/DepositPolicy/${policyId}`
    );
    console.log("Deposit policy response:", response.data);
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

    console.log(`Fetching deposit policy for fieldId: ${fieldIdNum}`);

    // Use the specific endpoint for field-based query
    const DEFAULT_API_BASE_URL = "https://sep490-g19-zxph.onrender.com";
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL;
    const endpoint = `${API_BASE_URL}/api/DepositPolicy/field/${fieldIdNum}`;

    console.log(`Calling deposit policy endpoint: ${endpoint}`);
    
    const response = await apiClient.get(endpoint);
    console.log("Deposit policy response:", response.data);

    // Handle both array and single object responses
    const policy = Array.isArray(response.data)
      ? response.data[0]
      : response.data;

    if (!policy) {
      console.log(`No deposit policy found for fieldId: ${fieldIdNum}`);
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

    console.log(`Successfully fetched deposit policy for fieldId ${fieldIdNum}:`, normalizedPolicy);
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
    console.log("Creating deposit policy with data:", policyData);
    const payload = {
      fieldId: policyData.fieldId,
      depositPercent: policyData.depositPercent,
      minDeposit: policyData.minDeposit || null,
      maxDeposit: policyData.maxDeposit || null,
    };
    console.log("Sending payload:", payload);
    const response = await apiClient.post(
      "https://sep490-g19-zxph.onrender.com/api/DepositPolicy",
      payload
    );
    console.log("Create deposit policy response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating deposit policy:", error);
    handleApiError(error);
  }
}

export async function updateDepositPolicy(policyId, policyData) {
  try {
    console.log(`Updating deposit policy ${policyId} with data:`, policyData);
    const payload = {
      fieldId: policyData.fieldId,
      depositPercent: policyData.depositPercent,
      minDeposit: policyData.minDeposit || null,
      maxDeposit: policyData.maxDeposit || null,
    };
    console.log("Sending payload:", payload);
    const response = await apiClient.put(
      `https://sep490-g19-zxph.onrender.com/api/DepositPolicy/${policyId}`,
      payload
    );
    console.log("Update deposit policy response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error updating deposit policy:", error);
    handleApiError(error);
  }
}

export async function deleteDepositPolicy(policyId) {
  try {
    console.log(`Deleting deposit policy ${policyId}`);
    const response = await apiClient.delete(
      `https://sep490-g19-zxph.onrender.com/api/DepositPolicy/${policyId}`
    );
    console.log("Delete deposit policy response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error deleting deposit policy:", error);
    handleApiError(error);
  }
}

