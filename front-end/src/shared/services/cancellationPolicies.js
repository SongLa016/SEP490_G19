// Service for managing cancellation policies
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

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";

// API functions
export async function fetchCancellationPolicies(ownerId) {
  try {
    const url = ownerId
      ? `${API_BASE_URL}/api/CancellationPolicy/owner/${ownerId}`
      : `${API_BASE_URL}/api/CancellationPolicy`;
    const response = await apiClient.get(url);
    // Handle both array and single object responses
    const policies = Array.isArray(response.data)
      ? response.data
      : response.data
      ? [response.data]
      : [];

    return policies.map((policy) => ({
      policyId: policy.policyId || policy.PolicyID || policy.policyID,
      ownerId: policy.ownerId || policy.OwnerID || policy.ownerID,
      complexId: policy.complexId || policy.ComplexID || policy.complexID,
      name: policy.name || policy.Name || "",
      description: policy.description || policy.Description || "",
      freeCancellationHours: policy.freeCancellationHours || policy.FreeCancellationHours || 0,
      cancellationFeePercentage: policy.cancellationFeePercentage || policy.CancellationFeePercentage || 0,
      isActive: policy.isActive !== undefined ? policy.isActive : (policy.IsActive !== undefined ? policy.IsActive : true),
      createdAt: policy.createdAt || policy.CreatedAt,
      updatedAt: policy.updatedAt || policy.UpdatedAt,
    }));
  } catch (error) {
    console.error("Error fetching cancellation policies:", error);
    handleApiError(error);
  }
}

export async function fetchCancellationPolicy(policyId) {
  try {
    const response = await apiClient.get(
      `${API_BASE_URL}/api/CancellationPolicy/${policyId}`
    );
    const policy = response.data;
    
    if (!policy) return null;

    return {
      policyId: policy.policyId || policy.PolicyID || policy.policyID,
      ownerId: policy.ownerId || policy.OwnerID || policy.ownerID,
      complexId: policy.complexId || policy.ComplexID || policy.complexID,
      name: policy.name || policy.Name || "",
      description: policy.description || policy.Description || "",
      freeCancellationHours: policy.freeCancellationHours || policy.FreeCancellationHours || 0,
      cancellationFeePercentage: policy.cancellationFeePercentage || policy.CancellationFeePercentage || 0,
      isActive: policy.isActive !== undefined ? policy.isActive : (policy.IsActive !== undefined ? policy.IsActive : true),
      createdAt: policy.createdAt || policy.CreatedAt,
      updatedAt: policy.updatedAt || policy.UpdatedAt,
    };
  } catch (error) {
    console.error("Error fetching cancellation policy:", error);
    // Return null if not found (404), otherwise throw error
    if (error.response?.status === 404) {
      return null;
    }
    handleApiError(error);
  }
}

export async function fetchCancellationPolicyByComplex(complexId) {
  try {
    const complexIdNum = Number(complexId);
    // Use the specific endpoint for complex-based query
    const response = await apiClient.get(
      `${API_BASE_URL}/api/CancellationPolicy/complex/${complexIdNum}`
    );
    // Handle both array and single object responses
    const policy = Array.isArray(response.data)
      ? response.data[0]
      : response.data;

    if (!policy) {
      return null;
    }

    return {
      policyId: policy.policyId || policy.PolicyID || policy.policyID,
      complexId: policy.complexId || policy.ComplexID || policy.complexID,
      ownerId: policy.ownerId || policy.OwnerID || policy.ownerID,
      name: policy.name || policy.Name || "",
      description: policy.description || policy.Description || "",
      freeCancellationHours: policy.freeCancellationHours || policy.FreeCancellationHours || 0,
      cancellationFeePercentage: policy.cancellationFeePercentage || policy.CancellationFeePercentage || 0,
      isActive: policy.isActive !== undefined ? policy.isActive : (policy.IsActive !== undefined ? policy.IsActive : true),
      createdAt: policy.createdAt || policy.CreatedAt,
      updatedAt: policy.updatedAt || policy.UpdatedAt,
    };
  } catch (error) {
    // Return null if not found (404) - this is normal, not all complexes have policies
    // Don't log 404 errors to avoid console spam
    if (error.response?.status === 404) {
      return null;
    }
    // Only log non-404 errors
    if (error.response?.status !== 404) {
      console.error("Error fetching cancellation policy by complex:", error);
    }
    // Re-throw only non-404 errors
    if (error.response?.status !== 404) {
      handleApiError(error);
    }
    return null;
  }
}

export async function createCancellationPolicy(policyData) {
  try {
    const payload = {
      ownerId: policyData.ownerId,
      complexId: policyData.complexId,
      name: policyData.name,
      description: policyData.description,
      freeCancellationHours: policyData.freeCancellationHours,
      cancellationFeePercentage: policyData.cancellationFeePercentage,
      isActive: policyData.isActive !== undefined ? policyData.isActive : true,
    };
    const response = await apiClient.post(
      `${API_BASE_URL}/api/CancellationPolicy`,
      payload
    );
    const policy = response.data;
    return {
      policyId: policy.policyId || policy.PolicyID || policy.policyID,
      complexId: policy.complexId || policy.ComplexID || policy.complexID,
      ownerId: policy.ownerId || policy.OwnerID || policy.ownerID,
      name: policy.name || policy.Name || "",
      description: policy.description || policy.Description || "",
      freeCancellationHours: policy.freeCancellationHours || policy.FreeCancellationHours || 0,
      cancellationFeePercentage: policy.cancellationFeePercentage || policy.CancellationFeePercentage || 0,
      isActive: policy.isActive !== undefined ? policy.isActive : (policy.IsActive !== undefined ? policy.IsActive : true),
      createdAt: policy.createdAt || policy.CreatedAt,
      updatedAt: policy.updatedAt || policy.UpdatedAt,
    };
  } catch (error) {
    console.error("Error creating cancellation policy:", error);
    handleApiError(error);
  }
}

export async function updateCancellationPolicy(policyId, policyData) {
  try {
    const payload = {
      ownerId: policyData.ownerId,
      complexId: policyData.complexId,
      name: policyData.name,
      description: policyData.description,
      freeCancellationHours: policyData.freeCancellationHours,
      cancellationFeePercentage: policyData.cancellationFeePercentage,
      isActive: policyData.isActive !== undefined ? policyData.isActive : true,
    };
    const response = await apiClient.put(
      `${API_BASE_URL}/api/CancellationPolicy/${policyId}`,
      payload
    );
    const policy = response.data;
    return {
      policyId: policy.policyId || policy.PolicyID || policy.policyID,
      complexId: policy.complexId || policy.ComplexID || policy.complexID,
      ownerId: policy.ownerId || policy.OwnerID || policy.ownerID,
      name: policy.name || policy.Name || "",
      description: policy.description || policy.Description || "",
      freeCancellationHours: policy.freeCancellationHours || policy.FreeCancellationHours || 0,
      cancellationFeePercentage: policy.cancellationFeePercentage || policy.CancellationFeePercentage || 0,
      isActive: policy.isActive !== undefined ? policy.isActive : (policy.IsActive !== undefined ? policy.IsActive : true),
      createdAt: policy.createdAt || policy.CreatedAt,
      updatedAt: policy.updatedAt || policy.UpdatedAt,
    };
  } catch (error) {
    console.error("Error updating cancellation policy:", error);
    handleApiError(error);
  }
}

export async function deleteCancellationPolicy(policyId) {
  try {
    const response = await apiClient.delete(
      `${API_BASE_URL}/api/CancellationPolicy/${policyId}`
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error deleting cancellation policy:", error);
    handleApiError(error);
  }
}

// Calculate cancellation fee based on policy and booking details
export function calculateCancellationFee(
  policy,
  bookingAmount,
  hoursUntilBooking
) {
  if (!policy || !policy.isActive) {
    return { fee: 0, percentage: 0, isFree: true };
  }

  if (hoursUntilBooking >= policy.freeCancellationHours) {
    return { fee: 0, percentage: 0, isFree: true };
  }

  const fee = (bookingAmount * policy.cancellationFeePercentage) / 100;
  return {
    fee: fee,
    percentage: policy.cancellationFeePercentage,
    isFree: false,
  };
}
