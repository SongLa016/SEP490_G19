// Service for managing deposit policies
import axios from "axios";
import { API_BASE_URL } from "../config/api";

// tạo instance axios với cấu hình base
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// thêm interceptor request để include token auth nếu có
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

// hàm kiểm tra token trước khi gọi API
const checkToken = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.");
  }
  return token;
};

// hàm helper để xử lý lỗi API
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
    errorMessage =
      "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.";
  } else {
    errorMessage = error.message || "Đã xảy ra lỗi không xác định.";
  }

  console.error("API Error:", error);
  throw new Error(errorMessage);
};

// hàm lấy tất cả các deposit policies
export async function fetchDepositPolicies() {
  try {
    checkToken();
    const response = await apiClient.get(
      `${API_BASE_URL}/api/owner/deposit-policies`
    );
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
    handleApiError(error);
  }
}

// hàm lấy deposit policy theo id
export async function fetchDepositPolicy(policyId) {
  try {
    checkToken();
    const response = await apiClient.get(
      `${API_BASE_URL}/api/owner/deposit-policies/${policyId}`
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
    handleApiError(error);
  }
}

// hàm lấy deposit policy theo fieldId
export async function fetchDepositPolicyByField(fieldId) {
  try {
    checkToken();
    const fieldIdNum = Number(fieldId);
    if (!fieldIdNum || isNaN(fieldIdNum)) {
      return null;
    }
    const response = await apiClient.get(
      `${API_BASE_URL}/api/public/field/${fieldIdNum}`
    );
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
    if (error.response?.status === 404) {
      return null;
    }
    return null;
  }
}

// hàm tạo deposit policy
export async function createDepositPolicy(policyData) {
  try {
    checkToken();
    const formData = new FormData();
    formData.append("FieldId", policyData.fieldId);
    formData.append("DepositPercent", policyData.depositPercent);
    formData.append("MinDeposit", policyData.minDeposit ?? 0);
    formData.append("MaxDeposit", policyData.maxDeposit ?? 0);

    const response = await apiClient.post(
      `${API_BASE_URL}/api/owner/deposit-policies`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// hàm cập nhật deposit policy
export async function updateDepositPolicy(policyId, policyData) {
  try {
    checkToken();
    const formData = new FormData();
    formData.append("DepositPolicyId", policyId);
    formData.append("FieldId", policyData.fieldId);
    formData.append("DepositPercent", policyData.depositPercent);
    formData.append("MinDeposit", policyData.minDeposit ?? 0);
    formData.append("MaxDeposit", policyData.maxDeposit ?? 0);
    formData.append("CreatedAt", policyData.createdAt || "");

    const response = await apiClient.put(
      `${API_BASE_URL}/api/owner/deposit-policies/${policyId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// hàm xóa deposit policy
export async function deleteDepositPolicy(policyId, fieldId) {
  try {
    checkToken();
    const response = await apiClient.delete(
      `${API_BASE_URL}/api/owner/deposit-policies/${policyId}/field/${fieldId}`
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}
