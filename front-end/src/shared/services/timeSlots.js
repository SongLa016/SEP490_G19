// Service layer for TimeSlot API
import axios from "axios";
import {
  clearPersistedAuth,
  decodeTokenPayload,
  getStoredToken,
  isTokenExpired,
} from "../utils/tokenManager";

const DEFAULT_API_BASE_URL = "https://sep490-g19-zxph.onrender.com";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL;

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
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

// Helper function to handle API errors (currently unused but kept for future use)
// eslint-disable-next-line no-unused-vars
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
    } else if (data && typeof data === "string") {
      errorMessage = data;
    } else {
      errorMessage = `Lỗi ${status}: ${statusText}`;
    }
  } else if (error.request) {
    if (
      error.code === "ERR_NETWORK" ||
      error.message?.includes("CORS") ||
      error.message?.includes("Network Error")
    ) {
      errorMessage =
        "Lỗi CORS: Backend chưa cấu hình cho phép truy cập từ domain này.";
    } else {
      errorMessage =
        "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.";
    }
  } else {
    errorMessage = error.message || "Đã xảy ra lỗi không xác định.";
  }

  console.error("API Error:", {
    message: error.message,
    code: error.code,
    response: error.response?.data,
    request: error.request,
    config: error.config?.url,
  });

  throw new Error(errorMessage);
};

// Helper function to ensure time format is HH:MM:SS (with seconds) for SQL Server TIME type
const formatTimeForAPI = (timeString) => {
  if (!timeString) return "00:00";

  const parts = timeString.split(":");

  // If in HH:MM:SS format, return as is
  if (parts.length === 3) {
    return timeString;
  }

  // If in HH:MM format, add seconds
  if (parts.length === 2) {
    return `${timeString}`;
  }

  // Invalid format, return default
  console.warn("⚠️ Invalid time format:", timeString);
  return "00:00";
};

// Normalize API response item to internal keys (lowercase for consistency)
const normalizeTimeSlot = (item) => {
  if (!item) return null;

  const slotId = item.SlotID ?? item.slotId ?? item.id;
  const name = item.SlotName ?? item.slotName ?? item.name;
  const startTime = item.StartTime ?? item.startTime;
  const endTime = item.EndTime ?? item.endTime;
  const fieldId = item.FieldId ?? item.fieldId ?? null;

  // Ensure required fields exist
  if (!slotId || !name) {
    console.warn("Invalid time slot data (missing slotId or name):", item);
    return null;
  }

  // Get price
  const price = item.Price ?? item.price ?? 0;

  // Return normalized object with both camelCase and PascalCase keys for compatibility
  return {
    slotId: Number(slotId) || slotId,
    SlotID: Number(slotId) || slotId,
    name: String(name),
    slotName: String(name),
    SlotName: String(name),
    startTime: startTime || "00:00",
    StartTime: startTime || "00:00",
    endTime: endTime || "00:00",
    EndTime: endTime || "00:00",
    fieldId: fieldId ? Number(fieldId) : null,
    FieldId: fieldId ? Number(fieldId) : null,
    price: Number(price) || 0,
    Price: Number(price) || 0,
  };
};

const OWNER_ROLE_IDS = [2];
const OWNER_ROLE_NAMES = ["owner", "fieldowner", "field_owner"];

const ensureOwnerAuthorization = (actionLabel = "thao tác này") => {
  const token = getStoredToken();
  if (!token) {
    return {
      success: false,
      error:
        "Bạn cần đăng nhập bằng tài khoản Owner để thực hiện thao tác này.",
    };
  }

  if (isTokenExpired(token)) {
    clearPersistedAuth();
    return {
      success: false,
      error:
        "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại bằng tài khoản Owner.",
    };
  }

  const payload = decodeTokenPayload(token);
  if (!payload) {
    return {
      success: false,
      error: "Token không hợp lệ. Vui lòng đăng nhập lại bằng tài khoản Owner.",
    };
  }

  const roleName =
    payload.Role || payload.role || payload.RoleName || payload.roleName || "";
  const roleIdRaw =
    payload.RoleID ||
    payload.roleID ||
    payload.RoleId ||
    payload.roleId ||
    null;
  const roleId = roleIdRaw !== null ? Number(roleIdRaw) : null;
  const normalizedRoleName = roleName.toString().toLowerCase();

  const isOwner =
    (roleId !== null && OWNER_ROLE_IDS.includes(roleId)) ||
    OWNER_ROLE_NAMES.includes(normalizedRoleName);

  if (!isOwner) {
    return {
      success: false,
      error: `Chỉ tài khoản Owner mới có thể ${actionLabel}. Vui lòng đăng nhập bằng tài khoản chủ sân.`,
    };
  }

  return { success: true, token, payload };
};

// Fetch all time slots (or by fieldId if provided, or by date)
export async function fetchTimeSlots(fieldId = null, date = null) {
  try {
    // If fieldId is provided, use the field-specific endpoint
    if (fieldId) {
      return await fetchTimeSlotsByField(fieldId);
    }

    // Build endpoint with optional date parameter
    let endpoint = "https://sep490-g19-zxph.onrender.com/api/TimeSlot";
    const params = {};
    
    // Add date parameter if provided
    if (date) {
      params.date = date;
    }
    
    // Build query string if params exist
    const queryString = Object.keys(params).length > 0
      ? '?' + new URLSearchParams(params).toString()
      : '';
    
    endpoint = endpoint + queryString;
    const response = await apiClient.get(endpoint);

    // Handle different response structures and normalize
    let data = response.data;
    if (Array.isArray(data)) {
      console.log(`Success - received ${data.length} time slots`);
      return {
        success: true,
        data: data.map(normalizeTimeSlot).filter((slot) => slot !== null),
      };
    } else if (data && Array.isArray(data.data)) {
      console.log(`Success - received ${data.data.length} time slots`);
      return {
        success: true,
        data: data.data.map(normalizeTimeSlot).filter((slot) => slot !== null),
      };
    } else {
      console.log(`Success - empty data`);
      return {
        success: true,
        data: [],
      };
    }
  } catch (error) {
    console.error("Error fetching time slots:", error);

    const errorMessage =
      error.response?.data?.message ||
      error.response?.data ||
      error.message ||
      "Không thể tải danh sách slot thời gian";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Fetch time slots by field ID using public endpoint
export async function fetchTimeSlotsByField(fieldId) {
  try {
    // Use public endpoint: /TimeSlot/public/{fieldId}
    const endpoint = `/TimeSlot/public/${fieldId}`;
    console.log(`Fetching time slots for field ${fieldId} from: ${endpoint}`);

    // Public endpoint may not require authentication, so use axios directly
    const response = await axios.get(`${API_BASE_URL}/api${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
      },
      timeout: 30000,
    });

    // Handle different response structures and normalize
    let data = response.data;
    if (Array.isArray(data)) {
      console.log(
        `Success - received ${data.length} time slots for field ${fieldId}`
      );
      return {
        success: true,
        data: data.map(normalizeTimeSlot).filter((slot) => slot !== null),
      };
    } else if (data && Array.isArray(data.data)) {
      console.log(
        `Success - received ${data.data.length} time slots for field ${fieldId}`
      );
      return {
        success: true,
        data: data.data.map(normalizeTimeSlot).filter((slot) => slot !== null),
      };
    } else {
      console.log(`Success - empty data for field ${fieldId}`);
      return {
        success: true,
        data: [],
      };
    }
  } catch (error) {
    console.error(`Error fetching time slots for field ${fieldId}:`, error);

    const errorMessage =
      error.response?.data?.message ||
      error.response?.data ||
      error.message ||
      `Không thể tải danh sách slot thời gian cho sân ${fieldId}`;
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Create a new time slot
export async function createTimeSlot(timeSlotData) {
  try {
    const authCheck = ensureOwnerAuthorization("tạo slot thời gian");
    if (!authCheck.success) {
      return {
        success: false,
        error: authCheck.error,
      };
    }

    // Validate required fields
    if (
      (!timeSlotData.SlotName && !timeSlotData.slotName) ||
      (!timeSlotData.StartTime && !timeSlotData.startTime) ||
      (!timeSlotData.EndTime && !timeSlotData.endTime) ||
      (!timeSlotData.fieldId && !timeSlotData.FieldId)
    ) {
      return {
        success: false,
        error: "Vui lòng điền đầy đủ thông tin",
      };
    }

    // Validate time logic
    const startTime = timeSlotData.StartTime ?? timeSlotData.startTime;
    const endTime = timeSlotData.EndTime ?? timeSlotData.endTime;

    if (startTime >= endTime) {
      return {
        success: false,
        error: "Giờ kết thúc phải lớn hơn giờ bắt đầu",
      };
    }

    // Prepare data for API - convert time format if needed
    const payload = {
      // Send camelCase to backend
      fieldId: parseInt(timeSlotData.fieldId ?? timeSlotData.FieldId),
      slotName: timeSlotData.SlotName ?? timeSlotData.slotName,
      startTime: formatTimeForAPI(startTime),
      endTime: formatTimeForAPI(endTime),
      price: timeSlotData.price ? Number(timeSlotData.price) : 0,
    };

    // Try different endpoint variations
    const endpoints = ["https://sep490-g19-zxph.onrender.com/api/TimeSlot"];
    let response = null;
    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        response = await apiClient.post(endpoint, payload);
        break;
      } catch (err) {
        if (err.response?.status === 403) {
          lastError = err;
        }

        if (err.response?.status !== 404) {
          break;
        }
      }
    }

    if (!response) {
      const errorDetail = lastError?.response?.data;
      let errorMessage = "Tất cả endpoint đều thất bại";

      // Parse error message based on status code
      if (lastError?.response?.status === 403) {
        if (typeof errorDetail === "string") {
          errorMessage = errorDetail;
        } else if (errorDetail?.message) {
          errorMessage = errorDetail.message;
        } else {
          errorMessage =
            "Không có quyền tạo slot thời gian. Vui lòng kiểm tra:\n" +
            "• Bạn có phải là chủ sân không?\n" +
            "• Slot này đã tồn tại chưa?\n" +
            "• Thời gian có hợp lệ không?";
        }
      } else {
        errorMessage =
          typeof errorDetail === "string"
            ? errorDetail
            : errorDetail?.message ||
              errorDetail?.error ||
              lastError?.message ||
              "Tất cả endpoint đều thất bại";
      }

      throw new Error(errorMessage);
    }

    // Handle different response structures
    let responseData = response.data;
    if (responseData && (responseData.SlotID || responseData.slotId)) {
      return {
        success: true,
        data: normalizeTimeSlot(responseData),
        message: "Tạo slot thời gian thành công",
      };
    } else if (responseData && responseData.data) {
      return {
        success: true,
        data: Array.isArray(responseData.data)
          ? responseData.data.map(normalizeTimeSlot)
          : normalizeTimeSlot(responseData.data),
        message: responseData.message || "Tạo slot thời gian thành công",
      };
    } else {
      return {
        success: true,
        data: normalizeTimeSlot({
          slotId: responseData?.slotId,
          slotName: payload.slotName,
          startTime: payload.startTime,
          endTime: payload.endTime,
        }),
        message: "Tạo slot thời gian thành công",
      };
    }
  } catch (error) {
    console.error("Error creating time slot:", error);

    // Parse error message from different response formats
    let errorMessage = "Không thể tạo slot thời gian";

    if (error.response?.data) {
      const data = error.response.data;
      if (typeof data === "string") {
        errorMessage = data;
      } else if (data.message) {
        errorMessage = data.message;
      } else if (data.error) {
        errorMessage = data.error;
      } else if (data.errors && Array.isArray(data.errors)) {
        errorMessage = data.errors.join(", ");
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Update an existing time slot
export async function updateTimeSlot(slotId, timeSlotData) {
  try {
    const authCheck = ensureOwnerAuthorization("cập nhật slot thời gian");
    if (!authCheck.success) {
      return {
        success: false,
        error: authCheck.error,
      };
    }

    // Validate required fields
    if (
      (!timeSlotData.SlotName && !timeSlotData.slotName) ||
      (!timeSlotData.StartTime && !timeSlotData.startTime) ||
      (!timeSlotData.EndTime && !timeSlotData.endTime) ||
      (!timeSlotData.fieldId && !timeSlotData.FieldId)
    ) {
      return {
        success: false,
        error: "Vui lòng điền đầy đủ thông tin",
      };
    }

    // Validate time logic
    const startTime = timeSlotData.StartTime ?? timeSlotData.startTime;
    const endTime = timeSlotData.EndTime ?? timeSlotData.endTime;

    if (startTime >= endTime) {
      return {
        success: false,
        error: "Giờ kết thúc phải lớn hơn giờ bắt đầu",
      };
    }

    // Prepare data for API - convert time format if needed
    const payload = {
      // Send camelCase to backend
      fieldId: parseInt(timeSlotData.fieldId ?? timeSlotData.FieldId),
      slotName: timeSlotData.SlotName ?? timeSlotData.slotName,
      startTime: formatTimeForAPI(startTime),
      endTime: formatTimeForAPI(endTime),
      price: timeSlotData.price ? Number(timeSlotData.price) : 0,
    };

    // Try different endpoint variations
    const endpoints = [
      "https://sep490-g19-zxph.onrender.com/api/TimeSlot",
      "https://sep490-g19-zxph.onrender.com/api/TimeSlots",
      "https://sep490-g19-zxph.onrender.com/api/timeSlot",
      "https://sep490-g19-zxph.onrender.com/api/timeSlots",
      "https://sep490-g19-zxph.onrender.com/api/time-slot",
      "https://sep490-g19-zxph.onrender.com/api/time-slots",
    ];
    let response = null;
    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying PUT endpoint: ${endpoint}/${slotId}`);
        response = await apiClient.put(`${endpoint}/${slotId}`, payload);
        console.log(`Success with PUT endpoint: ${endpoint}`);
        break;
      } catch (err) {
        console.log(
          `Failed with PUT endpoint: ${endpoint}`,
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

    // Handle different response structures
    let responseData = response.data;
    if (responseData && (responseData.SlotID || responseData.slotId)) {
      return {
        success: true,
        data: normalizeTimeSlot(responseData),
        message: "Cập nhật slot thời gian thành công",
      };
    } else if (responseData && responseData.data) {
      return {
        success: true,
        data: Array.isArray(responseData.data)
          ? responseData.data.map(normalizeTimeSlot)
          : normalizeTimeSlot(responseData.data),
        message: responseData.message || "Cập nhật slot thời gian thành công",
      };
    } else {
      return {
        success: true,
        data: normalizeTimeSlot({
          slotId,
          slotName: payload.slotName,
          startTime: payload.startTime,
          endTime: payload.endTime,
        }),
        message: "Cập nhật slot thời gian thành công",
      };
    }
  } catch (error) {
    console.error("Error updating time slot:", error);
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data ||
      error.message ||
      "Không thể cập nhật slot thời gian";

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Delete a time slot
export async function deleteTimeSlot(slotId) {
  try {
    const authCheck = ensureOwnerAuthorization("xóa slot thời gian");
    if (!authCheck.success) {
      return {
        success: false,
        error: authCheck.error,
      };
    }

    // Try different endpoint variations
    const endpoints = [
      "https://sep490-g19-zxph.onrender.com/api/TimeSlot",
      "https://sep490-g19-zxph.onrender.com/api/TimeSlots",
      "https://sep490-g19-zxph.onrender.com/api/timeSlot",
      "https://sep490-g19-zxph.onrender.com/api/timeSlots",
      "https://sep490-g19-zxph.onrender.com/api/time-slot",
      "https://sep490-g19-zxph.onrender.com/api/time-slots",
    ];
    let lastError = null;
    let success = false;

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying DELETE endpoint: ${endpoint}/${slotId}`);
        await apiClient.delete(`${endpoint}/${slotId}`);
        console.log(`Success with DELETE endpoint: ${endpoint}`);
        success = true;
        break;
      } catch (err) {
        console.log(
          `Failed with DELETE endpoint: ${endpoint}`,
          err.response?.status
        );
        lastError = err;
        // If it's not a 404, stop trying other endpoints
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
      message: "Xóa slot thời gian thành công",
    };
  } catch (error) {
    console.error("Error deleting time slot:", error);
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data ||
      error.message ||
      "Không thể xóa slot thời gian";

    return {
      success: false,
      error: errorMessage,
    };
  }
}
