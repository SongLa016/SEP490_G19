// Service layer for FieldSchedule API
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

  return errorMessage;
};

// Helper function to convert date string to date object
const parseDateToObject = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    dayOfWeek: date.getDay(),
  };
};

// Helper function to convert time string to time object
const parseTimeToObject = (timeString) => {
  if (!timeString) return { hour: 0, minute: 0 };
  // Handle both "HH:MM" and "HH:MM:SS" formats
  const parts = String(timeString).split(":");
  const hours = Number(parts[0]) || 0;
  const minutes = Number(parts[1]) || 0;
  return {
    hour: hours,
    minute: minutes,
  };
};

// Helper function to convert date object to date string
const formatDateFromObject = (dateObj) => {
  if (!dateObj) return null;
  if (typeof dateObj === "string") return dateObj;
  const { year, month, day } = dateObj;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

// Helper function to convert time object to time string
const formatTimeFromObject = (timeObj) => {
  if (!timeObj) return null;
  if (typeof timeObj === "string") return timeObj;
  const { hour, minute } = timeObj;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

// Normalize API response to internal format
const normalizeFieldSchedule = (item) => {
  if (!item) return null;
  return {
    scheduleId: item.scheduleId ?? item.ScheduleID ?? item.id,
    fieldId: item.fieldId ?? item.FieldID,
    fieldName: item.fieldName ?? item.FieldName,
    slotId: item.slotId ?? item.SlotID,
    slotName: item.slotName ?? item.SlotName,
    startTime: item.startTime
      ? typeof item.startTime === "string"
        ? parseTimeToObject(item.startTime)
        : item.startTime
      : null,
    endTime: item.endTime
      ? typeof item.endTime === "string"
        ? parseTimeToObject(item.endTime)
        : item.endTime
      : null,
    date: item.date
      ? typeof item.date === "string"
        ? parseDateToObject(item.date)
        : item.date
      : null,
    status: item.status ?? item.Status ?? "Available",
  };
};

/**
 * Fetch all field schedules
 * @returns {Promise<Object>} List of field schedules
 */
export async function fetchFieldSchedules() {
  try {
    const endpoint = "https://sep490-g19-zxph.onrender.com/api/FieldSchedule";

    console.log("Fetching all field schedules");

    const response = await apiClient.get(endpoint);

    let data = response.data;
    let schedulesArray = [];

    if (Array.isArray(data)) {
      schedulesArray = data;
    } else if (data && Array.isArray(data.data)) {
      schedulesArray = data.data;
    }

    return {
      success: true,
      data: schedulesArray.map(normalizeFieldSchedule).filter((s) => s !== null),
    };
  } catch (error) {
    console.error("Error fetching field schedules:", error);
    return {
      success: false,
      error: handleApiError(error),
    };
  }
}

/**
 * Fetch field schedules by fieldId
 * @param {number|string} fieldId - Field ID
 * @returns {Promise<Object>} List of field schedules for the field
 */
export async function fetchFieldSchedulesByField(fieldId) {
  try {
    const endpoint = `https://sep490-g19-zxph.onrender.com/api/FieldSchedule/field/${fieldId}`;

    console.log(`Fetching field schedules for fieldId: ${fieldId}`);

    const response = await apiClient.get(endpoint);

    let data = response.data;
    let schedulesArray = [];

    if (Array.isArray(data)) {
      schedulesArray = data;
    } else if (data && Array.isArray(data.data)) {
      schedulesArray = data.data;
    }

    return {
      success: true,
      data: schedulesArray.map(normalizeFieldSchedule).filter((s) => s !== null),
    };
  } catch (error) {
    console.error("Error fetching field schedules by field:", error);
    return {
      success: false,
      error: handleApiError(error),
    };
  }
}

/**
 * Fetch public field schedules by fieldId (no authentication required)
 * Used for getting schedules when booking small fields
 * @param {number|string} fieldId - Field ID
 * @returns {Promise<Object>} List of field schedules for the field
 */
export async function fetchPublicFieldSchedulesByField(fieldId) {
  try {
    const endpoint = `https://sep490-g19-zxph.onrender.com/api/FieldSchedule/public/field/${fieldId}`;

    console.log(`Fetching public field schedules for fieldId: ${fieldId}`);

    // Create a separate axios instance without auth token for public endpoint
    const publicApiClient = axios.create({
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await publicApiClient.get(endpoint);

    let data = response.data;
    let schedulesArray = [];

    if (Array.isArray(data)) {
      schedulesArray = data;
    } else if (data && Array.isArray(data.data)) {
      schedulesArray = data.data;
    }

    return {
      success: true,
      data: schedulesArray.map(normalizeFieldSchedule).filter((s) => s !== null),
    };
  } catch (error) {
    console.error("Error fetching public field schedules by field:", error);
    return {
      success: false,
      error: handleApiError(error),
    };
  }
}

/**
 * Create a new field schedule
 * @param {Object} scheduleData - Schedule data
 * @param {number} scheduleData.fieldId - Field ID
 * @param {number} scheduleData.slotId - Slot ID
 * @param {string|Object} scheduleData.date - Date (string "YYYY-MM-DD" or object {year, month, day})
 * @param {string|Object} scheduleData.startTime - Start time (string "HH:MM" or object {hour, minute})
 * @param {string|Object} scheduleData.endTime - End time (string "HH:MM" or object {hour, minute})
 * @param {string} scheduleData.status - Status (default: "Available")
 * @returns {Promise<Object>} Created schedule data
 */
export async function createFieldSchedule(scheduleData) {
  try {
    const endpoint = "https://sep490-g19-zxph.onrender.com/api/FieldSchedule";

    // Validate required fields
    if (!scheduleData.fieldId || !scheduleData.slotId || !scheduleData.date) {
      return {
        success: false,
        error: "Thiếu thông tin bắt buộc: fieldId, slotId, hoặc date",
      };
    }

    // Parse date - ensure it's a date object with all required fields
    let dateObj = null;
    if (typeof scheduleData.date === "string") {
      dateObj = parseDateToObject(scheduleData.date);
    } else if (scheduleData.date && typeof scheduleData.date === "object") {
      // If already an object, ensure it has all required fields
      if (scheduleData.date.year && scheduleData.date.month && scheduleData.date.day) {
        const date = new Date(
          scheduleData.date.year,
          scheduleData.date.month - 1,
          scheduleData.date.day
        );
        dateObj = {
          year: scheduleData.date.year,
          month: scheduleData.date.month,
          day: scheduleData.date.day,
          dayOfWeek: date.getDay(), // 0=Sunday, 1=Monday, ..., 6=Saturday
        };
      } else {
        dateObj = parseDateToObject(
          `${scheduleData.date.year}-${String(scheduleData.date.month).padStart(2, "0")}-${String(scheduleData.date.day).padStart(2, "0")}`
        );
      }
    }

    if (!dateObj || !dateObj.year || !dateObj.month || !dateObj.day) {
      return {
        success: false,
        error: "Ngày không hợp lệ",
      };
    }

    // Parse startTime - if not provided, use default 00:00
    let startTimeObj = { hour: 0, minute: 0 };
    if (scheduleData.startTime) {
      if (typeof scheduleData.startTime === "string") {
        startTimeObj = parseTimeToObject(scheduleData.startTime);
      } else if (typeof scheduleData.startTime === "object") {
        startTimeObj = {
          hour: Number(scheduleData.startTime.hour) || 0,
          minute: Number(scheduleData.startTime.minute) || 0,
        };
      }
    }

    // Parse endTime - if not provided, use default 00:00
    let endTimeObj = { hour: 0, minute: 0 };
    if (scheduleData.endTime) {
      if (typeof scheduleData.endTime === "string") {
        endTimeObj = parseTimeToObject(scheduleData.endTime);
      } else if (typeof scheduleData.endTime === "object") {
        endTimeObj = {
          hour: Number(scheduleData.endTime.hour) || 0,
          minute: Number(scheduleData.endTime.minute) || 0,
        };
      }
    }

    // Prepare payload - SIMPLE format that backend expects
    const payload = {
      fieldId: Number(scheduleData.fieldId),
      slotId: Number(scheduleData.slotId),
      date: formatDateFromObject(dateObj), // Convert to "YYYY-MM-DD" string
      status: String(scheduleData.status || "Available"),
    };

    console.log("Creating field schedule with payload:", JSON.stringify(payload, null, 2));

    try {
      const response = await apiClient.post(endpoint, payload);

      return {
        success: true,
        data: normalizeFieldSchedule(response.data),
        message: "Tạo lịch trình thành công",
      };
    } catch (error) {
      console.error("Error creating field schedule:", error);
      console.error("Error response:", error.response?.data);
      
      // Parse error message
      let errorMessage = "Không thể tạo lịch trình";
      
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
  } catch (error) {
    console.error("Unexpected error in createFieldSchedule:", error);
    return {
      success: false,
      error: error.message || "Lỗi không xác định khi tạo lịch trình",
    };
  }
}

/**
 * Update field schedule status
 * @param {number|string} scheduleId - Schedule ID
 * @param {string} status - New status (Available, Booked, Maintenance)
 * @returns {Promise<Object>} Updated schedule data
 */
export async function updateFieldScheduleStatus(scheduleId, status) {
  try {
    const endpoint = `https://sep490-g19-zxph.onrender.com/api/FieldSchedule/${scheduleId}/status`;

    console.log(`Updating schedule ${scheduleId} status to: ${status}`);

    const response = await apiClient.put(endpoint, { status });

    return {
      success: true,
      data: normalizeFieldSchedule(response.data),
      message: "Cập nhật trạng thái thành công",
    };
  } catch (error) {
    console.error("Error updating field schedule status:", error);
    return {
      success: false,
      error: handleApiError(error),
    };
  }
}

/**
 * Delete a field schedule
 * @param {number|string} scheduleId - Schedule ID
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteFieldSchedule(scheduleId) {
  try {
    const endpoint = `https://sep490-g19-zxph.onrender.com/api/FieldSchedule/${scheduleId}`;

    console.log(`Deleting field schedule: ${scheduleId}`);

    await apiClient.delete(endpoint);

    return {
      success: true,
      message: "Xóa lịch trình thành công",
    };
  } catch (error) {
    console.error("Error deleting field schedule:", error);
    return {
      success: false,
      error: handleApiError(error),
    };
  }
}

