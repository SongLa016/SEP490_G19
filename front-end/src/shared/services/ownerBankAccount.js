// Service for managing owner bank accounts
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
    const ownerIdNum = Number(ownerId);
    // Try different endpoint variations
    const endpoints = [
      `https://sep490-g19-zxph.onrender.com/api/OwnerBankAccount/${ownerIdNum}`,
      `https://sep490-g19-zxph.onrender.com/api/OwnerBankAccount/owner/${ownerIdNum}`,
      `https://sep490-g19-zxph.onrender.com/api/ownerBankAccount/${ownerIdNum}`,
    ];

    let response = null;
    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        response = await apiClient.get(endpoint);
        break;
      } catch (err) {
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
      `https://sep490-g19-zxph.onrender.com/api/OwnerBankAccount/${bankAccountId}`
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
    const payload = {
      ownerId: accountData.ownerId,
      bankName: accountData.bankName,
      bankShortCode: accountData.bankShortCode || "",
      accountNumber: accountData.accountNumber,
      accountHolder: accountData.accountHolder,
      isDefault: accountData.isDefault || false,
    };
    const response = await apiClient.post(
      "https://sep490-g19-zxph.onrender.com/api/OwnerBankAccount",
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Error creating bank account:", error);
    handleApiError(error);
  }
}

export async function updateOwnerBankAccount(bankAccountId, accountData) {
  try {
    const response = await apiClient.put(
      `https://sep490-g19-zxph.onrender.com/api/OwnerBankAccount/${bankAccountId}`,
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
    const response = await apiClient.delete(
      `https://sep490-g19-zxph.onrender.com/api/OwnerBankAccount/${bankAccountId}`
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
