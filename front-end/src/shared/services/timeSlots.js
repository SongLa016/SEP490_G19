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

// Helper function to ensure time format is HH:MM (without seconds)
const formatTimeForAPI = (timeString) => {
  if (!timeString) return timeString;
  // If in HH:MM:SS format, remove seconds
  if (timeString.split(":").length === 3) {
    const [hours, minutes] = timeString.split(":");
    return `${hours}:${minutes}`;
  }
  // If already in HH:MM format, return as is
  if (timeString.split(":").length === 2) {
    return timeString;
  }
  return timeString;
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

  return {
    slotId: Number(slotId) || slotId,
    name: String(name),
    startTime: startTime || "00:00",
    endTime: endTime || "00:00",
    fieldId: fieldId ? Number(fieldId) : null,
  };
};

// Mock data for testing (hardcoded)
const MOCK_TIME_SLOTS = [
  // Timeslots for fieldId = 32
  {
    SlotID: 1,
    SlotName: "Slot 1",
    FieldId: 32,
    StartTime: "06:00",
    EndTime: "07:30",
  },
  {
    SlotID: 2,
    SlotName: "Slot 2",
    FieldId: 32,
    StartTime: "07:30",
    EndTime: "09:00",
  },
  {
    SlotID: 3,
    SlotName: "Slot 3",
    FieldId: 32,
    StartTime: "09:00",
    EndTime: "10:30",
  },
  {
    SlotID: 4,
    SlotName: "Slot 4",
    FieldId: 32,
    StartTime: "10:30",
    EndTime: "12:00",
  },
  {
    SlotID: 5,
    SlotName: "Slot 5",
    FieldId: 32,
    StartTime: "12:00",
    EndTime: "13:30",
  },
  {
    SlotID: 6,
    SlotName: "Slot 6",
    FieldId: 32,
    StartTime: "13:30",
    EndTime: "15:00",
  },
  {
    SlotID: 7,
    SlotName: "Slot 7",
    FieldId: 32,
    StartTime: "15:00",
    EndTime: "16:30",
  },
  {
    SlotID: 8,
    SlotName: "Slot 8",
    FieldId: 32,
    StartTime: "16:30",
    EndTime: "18:00",
  },
  {
    SlotID: 9,
    SlotName: "Slot 9",
    FieldId: 32,
    StartTime: "18:00",
    EndTime: "19:30",
  },
  {
    SlotID: 10,
    SlotName: "Slot 10",
    FieldId: 32,
    StartTime: "19:30",
    EndTime: "21:00",
  },
  {
    SlotID: 11,
    SlotName: "Slot 11",
    FieldId: 32,
    StartTime: "21:00",
    EndTime: "22:30",
  },
  {
    SlotID: 12,
    SlotName: "Slot 12",
    FieldId: 32,
    StartTime: "22:30",
    EndTime: "00:00",
  },

  // Timeslots for other fields (for testing)
  {
    SlotID: 13,
    SlotName: "Slot 1",
    FieldId: 48,
    StartTime: "08:00",
    EndTime: "09:30",
  },
  {
    SlotID: 14,
    SlotName: "Slot 2",
    FieldId: 48,
    StartTime: "09:30",
    EndTime: "11:00",
  },
  {
    SlotID: 15,
    SlotName: "Slot 3",
    FieldId: 48,
    StartTime: "14:00",
    EndTime: "15:30",
  },
];

// Fetch all time slots (or by fieldId if provided)
export async function fetchTimeSlots(fieldId = null) {
  try {
    // If fieldId is provided, use the field-specific endpoint
    if (fieldId) {
      return await fetchTimeSlotsByField(fieldId);
    }

    // Otherwise fetch all time slots
    const endpoint = "https://sep490-g19-zxph.onrender.com/api/TimeSlot";
    console.log(`Fetching all time slots from: ${endpoint}`);
    const response = await apiClient.get(endpoint);

    // Handle different response structures and normalize
    let data = response.data;
    if (Array.isArray(data)) {
      console.log(`Success - received ${data.length} time slots`);
      return {
        success: true,
        data: data.map(normalizeTimeSlot).filter(slot => slot !== null),
      };
    } else if (data && Array.isArray(data.data)) {
      console.log(`Success - received ${data.data.length} time slots`);
      return {
        success: true,
        data: data.data.map(normalizeTimeSlot).filter(slot => slot !== null),
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

// Fetch time slots by field ID
export async function fetchTimeSlotsByField(fieldId) {
  try {
    const endpoint = `https://sep490-g19-zxph.onrender.com/api/TimeSlot/field/${fieldId}`;
    console.log(`Fetching time slots for field ${fieldId} from: ${endpoint}`);
    const response = await apiClient.get(endpoint);

    // Handle different response structures and normalize
    let data = response.data;
    if (Array.isArray(data)) {
      console.log(`Success - received ${data.length} time slots for field ${fieldId}`);
      return {
        success: true,
        data: data.map(normalizeTimeSlot).filter(slot => slot !== null),
      };
    } else if (data && Array.isArray(data.data)) {
      console.log(`Success - received ${data.data.length} time slots for field ${fieldId}`);
      return {
        success: true,
        data: data.data.map(normalizeTimeSlot).filter(slot => slot !== null),
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
    };

    console.log("Creating time slot with payload:", payload);

    // Try different endpoint variations
    const endpoints = ["https://sep490-g19-zxph.onrender.com/api/TimeSlot"];
    let response = null;
    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying POST endpoint: ${endpoint}`, payload);
        response = await apiClient.post(endpoint, payload);
        console.log(`Success with POST endpoint: ${endpoint}`, response.data);
        break;
      } catch (err) {
        console.error(
          `Failed with POST endpoint: ${endpoint}`,
          err.response?.status,
          err.response?.data
        );
        console.error('Full error:', {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          message: err.message
        });
        lastError = err;
        // If it's not a 404, stop trying other endpoints
        if (err.response?.status !== 404) {
          break;
        }
      }
    }

    if (!response) {
      const errorDetail = lastError?.response?.data;
      const errorMessage = typeof errorDetail === 'string' 
        ? errorDetail 
        : errorDetail?.message || errorDetail?.error || lastError?.message || "Tất cả endpoint đều thất bại";
      
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
      if (typeof data === 'string') {
        errorMessage = data;
      } else if (data.message) {
        errorMessage = data.message;
      } else if (data.error) {
        errorMessage = data.error;
      } else if (data.errors && Array.isArray(data.errors)) {
        errorMessage = data.errors.join(', ');
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
