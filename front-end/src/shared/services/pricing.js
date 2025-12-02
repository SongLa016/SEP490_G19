// Service layer for Pricing API
import axios from "axios";

// Create axios instance with base configuration
const apiClient = axios.create({
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
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

const BASE_URL = "https://sep490-g19-zxph.onrender.com/api";

// Normalize API response
const normalizePricing = (item) => {
  if (!item) return item;
  return {
    priceId: item.priceId ?? item.PriceId ?? item.id ?? item.fieldPriceId ?? item.FieldPriceId,
    fieldId: item.fieldId ?? item.FieldId,
    slotId: item.slotId ?? item.SlotId,
    price: item.price ?? item.Price,
  };
};

// Fetch all pricing
export async function fetchPricing() {
  try {
    const endpoints = [
      `${BASE_URL}/FieldPrice`,
      `${BASE_URL}/fieldPrice`,
      `${BASE_URL}/Pricing`,
      `${BASE_URL}/pricing`,
    ];

    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        const response = await apiClient.get(endpoint);

        let data = response.data;
        if (Array.isArray(data)) {
          return {
            success: true,
            data: data.map(normalizePricing),
          };
        } else if (data && Array.isArray(data.data)) {
          return {
            success: true,
            data: data.data.map(normalizePricing),
          };
        }
      } catch (err) {
        lastError = err;
        if (err.response?.status !== 404) {
          break;
        }
      }
    }

    throw lastError;
  } catch (error) {
    console.error("Error fetching pricing:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Không thể tải danh sách giá",
    };
  }
}

// Create pricing
export async function createPricing(pricingData) {
  try {
    // Validate required fields
    if (
      !pricingData.fieldId ||
      !pricingData.slotId ||
      pricingData.price === undefined
    ) {
      return {
        success: false,
        error: "Vui lòng điền đầy đủ thông tin",
      };
    }

    const payload = {
      fieldId: parseInt(pricingData.fieldId),
      slotId: parseInt(pricingData.slotId),
      price: parseFloat(pricingData.price),
    };
    const endpoints = [
      `${BASE_URL}/FieldPrice`,
      `${BASE_URL}/fieldPrice`,
      `${BASE_URL}/Pricing`,
      `${BASE_URL}/pricing`,
    ];

    let response = null;
    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        response = await apiClient.post(endpoint, payload);
        break;
      } catch (err) {
        console.error(
          `Failed with POST endpoint: ${endpoint}`,
          err.response?.status,
          err.response?.data
        );
        lastError = err;
        if (err.response?.status !== 404) {
          break;
        }
      }
    }

    if (!response) {
      throw lastError || new Error("Tất cả endpoint đều thất bại");
    }

    return {
      success: true,
      data: normalizePricing(response.data),
      message: "Tạo giá thành công",
    };
  } catch (error) {
    console.error("Error creating pricing:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        "Không thể tạo giá",
    };
  }
}

// Update pricing
export async function updatePricing(priceId, pricingData) {
  try {
    if (
      !pricingData.fieldId ||
      !pricingData.slotId ||
      pricingData.price === undefined
    ) {
      return {
        success: false,
        error: "Vui lòng điền đầy đủ thông tin",
      };
    }

    const payload = {
      fieldId: parseInt(pricingData.fieldId),
      slotId: parseInt(pricingData.slotId),
      price: parseFloat(pricingData.price),
    };
    const endpoints = [
      `${BASE_URL}/FieldPrice`,
      `${BASE_URL}/fieldPrice`,
      `${BASE_URL}/Pricing`,
      `${BASE_URL}/pricing`,
    ];

    let response = null;
    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        response = await apiClient.put(`${endpoint}/${priceId}`, payload);
        break;
      } catch (err) {
        console.error(
          `Failed with PUT endpoint: ${endpoint}`,
          err.response?.status,
          err.response?.data
        );
        lastError = err;
        if (err.response?.status !== 404) {
          break;
        }
      }
    }

    if (!response) {
      throw lastError || new Error("Tất cả endpoint đều thất bại");
    }

    return {
      success: true,
      data: normalizePricing(response.data),
      message: "Cập nhật giá thành công",
    };
  } catch (error) {
    console.error("Error updating pricing:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        "Không thể cập nhật giá",
    };
  }
}

// Delete pricing
export async function deletePricing(priceId) {
  try {
    const endpoints = [
      `${BASE_URL}/FieldPrice`,
      `${BASE_URL}/fieldPrice`,
      `${BASE_URL}/Pricing`,
      `${BASE_URL}/pricing`,
    ];

    let lastError = null;
    let success = false;

    for (const endpoint of endpoints) {
      try {
        await apiClient.delete(`${endpoint}/${priceId}`);
        success = true;
        break;
      } catch (err) {
        console.error(
          `Failed with DELETE endpoint: ${endpoint}`,
          err.response?.status,
          err.response?.data
        );
        lastError = err;
        if (err.response?.status !== 404) {
          break;
        }
      }
    }

    if (!success) {
      throw lastError || new Error("Tất cả endpoint đều thất bại");
    }

    return {
      success: true,
      message: "Xóa giá thành công",
    };
  } catch (error) {
    console.error("Error deleting pricing:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        "Không thể xóa giá",
    };
  }
}
