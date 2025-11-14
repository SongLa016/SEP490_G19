// Service for managing deposit policies
import axios from "axios";

// Determine base URL based on environment
const getBaseURL = () => {
  if (process.env.NODE_ENV === 'development') {
    return "/api";
  }
  return "https://sep490-g19-zxph.onrender.com/api";
};

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: getBaseURL(),
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
    const response = await apiClient.get("/DepositPolicy");
    return response.data.map((policy) => ({
      depositPolicyId: policy.depositPolicyId,
      fieldId: policy.fieldId,
      fieldName: policy.fieldName || "",
      depositPercent: policy.depositPercent,
      minDeposit: policy.minDeposit,
      maxDeposit: policy.maxDeposit,
      createdAt: policy.createdAt,
    }));
  } catch (error) {
    handleApiError(error);
  }
}

export async function fetchDepositPolicy(policyId) {
  try {
    const response = await apiClient.get(`/DepositPolicy/${policyId}`);
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
    handleApiError(error);
  }
}

export async function fetchDepositPolicyByField(fieldId) {
  try {
    const response = await apiClient.get("/DepositPolicy");
    const policies = response.data.filter(
      (p) => p.fieldId === Number(fieldId)
    );
    if (policies.length === 0) return null;
    const policy = policies[0];
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
    handleApiError(error);
  }
}

export async function createDepositPolicy(policyData) {
  try {
    const response = await apiClient.post("/DepositPolicy", {
      fieldId: policyData.fieldId,
      depositPercent: policyData.depositPercent,
      minDeposit: policyData.minDeposit || null,
      maxDeposit: policyData.maxDeposit || null,
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function updateDepositPolicy(policyId, policyData) {
  try {
    const response = await apiClient.put(`/DepositPolicy/${policyId}`, {
      fieldId: policyData.fieldId,
      depositPercent: policyData.depositPercent,
      minDeposit: policyData.minDeposit || null,
      maxDeposit: policyData.maxDeposit || null,
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function deleteDepositPolicy(policyId) {
  try {
    const response = await apiClient.delete(`/DepositPolicy/${policyId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

