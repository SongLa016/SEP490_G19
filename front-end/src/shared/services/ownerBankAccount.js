// Service for managing owner bank accounts
import axios from "axios";

// Determine base URL based on environment
const getBaseURL = () => {
  if (process.env.NODE_ENV === "development") {
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
    errorMessage =
      "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.";
  } else {
    errorMessage = error.message || "Đã xảy ra lỗi không xác định.";
  }

  console.error("API Error:", error);
  throw new Error(errorMessage);
};

// API functions
export async function fetchOwnerBankAccounts(ownerId) {
  try {
    const response = await apiClient.get(`/OwnerBankAccount/${ownerId}`);
    return response.data.map((account) => ({
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
    handleApiError(error);
  }
}

export async function fetchBankAccount(bankAccountId) {
  try {
    const response = await apiClient.get(`/OwnerBankAccount/${bankAccountId}`);
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
    const response = await apiClient.post("/OwnerBankAccount", {
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

export async function updateOwnerBankAccount(bankAccountId, accountData) {
  try {
    const response = await apiClient.put(`/OwnerBankAccount/${bankAccountId}`, {
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
    const response = await apiClient.delete(
      `/OwnerBankAccount/${bankAccountId}`
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
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
