// Service layer for TimeSlot API
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

// Helper function to convert time format from HH:MM to HH:MM:SS
const formatTimeForAPI = (timeString) => {
  if (!timeString) return timeString;
  // If already in HH:MM:SS format, return as is
  if (timeString.split(":").length === 3) {
    return timeString;
  }
  // If in HH:MM format, add :00 for seconds
  if (timeString.split(":").length === 2) {
    return `${timeString}:00`;
  }
  return timeString;
};

// Normalize API response item to internal keys
const normalizeTimeSlot = (item) => {
  if (!item) return item;
  return {
    SlotID: item.SlotID ?? item.slotId ?? item.id ?? item.SlotID,
    SlotName: item.SlotName ?? item.slotName ?? item.name ?? item.SlotName,
    StartTime: item.StartTime ?? item.startTime ?? item.StartTime,
    EndTime: item.EndTime ?? item.endTime ?? item.EndTime,
  };
};

// Fetch all time slots
export async function fetchTimeSlots() {
  try {
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

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        const response = await apiClient.get(endpoint);

        // Handle different response structures and normalize
        let data = response.data;
        if (Array.isArray(data)) {
          console.log(`Success with endpoint: ${endpoint}`);
          return {
            success: true,
            data: data.map(normalizeTimeSlot),
          };
        } else if (data && Array.isArray(data.data)) {
          console.log(`Success with endpoint: ${endpoint}`);
          return {
            success: true,
            data: data.data.map(normalizeTimeSlot),
          };
        } else {
          console.log(`Success with endpoint: ${endpoint} (empty data)`);
          return {
            success: true,
            data: [],
          };
        }
      } catch (err) {
        console.log(`Failed with endpoint: ${endpoint}`, err.response?.status);
        lastError = err;
        // If it's not a 404, stop trying other endpoints
        if (err.response?.status !== 404) {
          break;
        }
      }
    }

    // If all endpoints failed, throw the last error
    throw lastError;
  } catch (error) {
    console.error("Error fetching time slots:", error);
    console.error("Full error details:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });

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

// Create a new time slot
export async function createTimeSlot(timeSlotData) {
  try {
    // Validate required fields
    if (
      (!timeSlotData.SlotName && !timeSlotData.slotName) ||
      (!timeSlotData.StartTime && !timeSlotData.startTime) ||
      (!timeSlotData.EndTime && !timeSlotData.endTime)
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
      slotName: timeSlotData.SlotName ?? timeSlotData.slotName,
      startTime: formatTimeForAPI(startTime),
      endTime: formatTimeForAPI(endTime),
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
        console.log(`Trying POST endpoint: ${endpoint}`);
        response = await apiClient.post(endpoint, payload);
        console.log(`Success with POST endpoint: ${endpoint}`);
        break;
      } catch (err) {
        console.log(
          `Failed with POST endpoint: ${endpoint}`,
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
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data ||
      error.message ||
      "Không thể tạo slot thời gian";

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Update an existing time slot
export async function updateTimeSlot(slotId, timeSlotData) {
  try {
    // Validate required fields
    if (
      (!timeSlotData.SlotName && !timeSlotData.slotName) ||
      (!timeSlotData.StartTime && !timeSlotData.startTime) ||
      (!timeSlotData.EndTime && !timeSlotData.endTime)
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
      slotName: timeSlotData.SlotName ?? timeSlotData.slotName,
      startTime: formatTimeForAPI(startTime),
      endTime: formatTimeForAPI(endTime),
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
