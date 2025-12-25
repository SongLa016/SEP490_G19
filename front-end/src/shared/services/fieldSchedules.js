// Service layer for FieldSchedule API
import axios from "axios";

const DEFAULT_API_BASE_URL = "http://localhost:8080";
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
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
};

// Helper function to convert time object to time string
const formatTimeFromObject = (timeObj) => {
  if (!timeObj) return null;
  if (typeof timeObj === "string") return timeObj;
  const { hour, minute } = timeObj;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

// Normalize API response to internal format
// For public API, keep date and time as strings for easier comparison
const normalizeFieldSchedule = (item) => {
  if (!item) return null;
  return {
    scheduleId: item.scheduleId ?? item.ScheduleID ?? item.id,
    fieldId: item.fieldId ?? item.FieldID,
    fieldName: item.fieldName ?? item.FieldName,
    slotId: item.slotId ?? item.SlotID,
    slotName: item.slotName ?? item.SlotName,
    // Keep time as string for public API (easier to display and compare)
    startTime: item.startTime || item.StartTime || null,
    endTime: item.endTime || item.EndTime || null,
    // Keep date as string for public API (easier to compare)
    date: item.date || item.Date || null,
    status: item.status ?? item.Status ?? "Available",
  };
};

/**
 * Fetch all field schedules
 * @returns {Promise<Object>} List of field schedules
 */
export async function fetchFieldSchedules() {
  try {
    const endpoint = "/FieldSchedule";

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
      data: schedulesArray
        .map(normalizeFieldSchedule)
        .filter((s) => s !== null),
    };
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error),
    };
  }
}

export async function fetchFieldSchedulesByField(fieldId) {
  try {
    // Try multiple endpoint variations
    const endpoints = [
      `/FieldSchedule/field/${fieldId}`,
      `/FieldSchedule/Field/${fieldId}`,
      `/FieldSchedule?fieldId=${fieldId}`,
      `/FieldSchedule?FieldId=${fieldId}`,
    ];

    let response = null;

    for (const endpoint of endpoints) {
      try {
        response = await apiClient.get(endpoint);
        break;
      } catch (err) {
        // If it's not a 404, stop trying other endpoints
        if (err.response?.status !== 404) {
          break;
        }
      }
    }

    // If all endpoints failed, fetch all and filter by fieldId
    if (!response) {
      const allSchedulesResponse = await apiClient.get("/FieldSchedule");
      let allData = allSchedulesResponse.data;
      let allSchedulesArray = [];

      if (Array.isArray(allData)) {
        allSchedulesArray = allData;
      } else if (allData && Array.isArray(allData.data)) {
        allSchedulesArray = allData.data;
      }

      // Filter by fieldId
      const filteredSchedules = allSchedulesArray.filter((schedule) => {
        const scheduleFieldId =
          schedule.fieldId ??
          schedule.FieldId ??
          schedule.fieldID ??
          schedule.FieldID;
        return Number(scheduleFieldId) === Number(fieldId);
      });

      return {
        success: true,
        data: filteredSchedules
          .map(normalizeFieldSchedule)
          .filter((s) => s !== null),
      };
    }

    let data = response.data;
    let schedulesArray = [];

    if (Array.isArray(data)) {
      schedulesArray = data;
    } else if (data && Array.isArray(data.data)) {
      schedulesArray = data.data;
    }

    return {
      success: true,
      data: schedulesArray
        .map(normalizeFieldSchedule)
        .filter((s) => s !== null),
    };
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error),
    };
  }
}

export async function fetchPublicFieldSchedulesByField(fieldId) {
  try {
    const endpoint = `/FieldSchedule/public/field/${fieldId}`;

    // Create a separate axios instance without auth token for public endpoint
    // Use the same baseURL as other services
    const DEFAULT_API_BASE_URL = "http://localhost:8080";
    const API_BASE_URL =
      process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL;

    const publicApiClient = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Ensure no auth token is sent for public endpoint
    publicApiClient.interceptors.request.use((config) => {
      // Remove any auth token that might be set
      delete config.headers.Authorization;
      return config;
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
      data: schedulesArray
        .map(normalizeFieldSchedule)
        .filter((s) => s !== null),
    };
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error),
    };
  }
}

/**
 * Fetch public field schedules by date
 * @param {string} date - Date in format "YYYY-MM-DD"
 * @returns {Promise<Object>} List of field schedules for the date
 */
export async function fetchPublicFieldSchedulesByDate(date) {
  try {
    // Try different endpoint variations
    const endpoints = [`/FieldSchedule/public?date=${date}`];

    const DEFAULT_API_BASE_URL = "http://localhost:8080";
    const API_BASE_URL =
      process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL;

    const publicApiClient = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Ensure no auth token is sent for public endpoint
    publicApiClient.interceptors.request.use((config) => {
      delete config.headers.Authorization;
      return config;
    });

    let schedulesArray = [];

    for (const endpoint of endpoints) {
      try {
        const response = await publicApiClient.get(endpoint);
        let data = response.data;

        if (Array.isArray(data)) {
          schedulesArray = data;
        } else if (data && Array.isArray(data.data)) {
          schedulesArray = data.data;
        }

        if (schedulesArray.length > 0) {
          return {
            success: true,
            data: schedulesArray
              .map(normalizeFieldSchedule)
              .filter((s) => s !== null),
          };
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          break;
        }
      }
    }

    // If all endpoints failed, return empty array
    return {
      success: true,
      data: [],
    };
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error),
      data: [],
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
    const endpoint = "/FieldSchedule";

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
      if (
        scheduleData.date.year &&
        scheduleData.date.month &&
        scheduleData.date.day
      ) {
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
          `${scheduleData.date.year}-${String(scheduleData.date.month).padStart(
            2,
            "0"
          )}-${String(scheduleData.date.day).padStart(2, "0")}`
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

    try {
      const response = await apiClient.post(endpoint, payload);

      return {
        success: true,
        data: normalizeFieldSchedule(response.data),
        message: "Tạo lịch trình thành công",
      };
    } catch (error) {
      // Parse error message
      let errorMessage = "Không thể tạo lịch trình";

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
  } catch (error) {
    return {
      success: false,
      error: error.message || "Lỗi không xác định khi tạo lịch trình",
    };
  }
}

export async function updateFieldSchedule(scheduleId, scheduleData) {
  try {
    const endpoint = `/FieldSchedule/${scheduleId}`;

    // Prepare payload according to API spec
    const payload = {
      fieldName: scheduleData.fieldName || "string",
      slotId: Number(scheduleData.slotId),
      slotName: scheduleData.slotName || "string",
      scheduleID: Number(scheduleId),
      fieldID: Number(scheduleData.fieldID || scheduleData.fieldId),
      date: scheduleData.date || "",
      status: scheduleData.status || "Available",
      startTime: scheduleData.startTime || "00:00",
      endTime: scheduleData.endTime || "00:00",
    };

    const response = await apiClient.put(endpoint, payload);

    return {
      success: true,
      data: normalizeFieldSchedule(response.data),
      message: "Cập nhật lịch trình thành công",
    };
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error),
    };
  }
}

/**
 * Fetch field schedule by ID (with auth token)
 * @param {number|string} scheduleId - Schedule ID
 * @returns {Promise<Object>} Schedule data
 */
async function fetchFieldScheduleByIdWithAuth(scheduleId) {
  try {
    const endpoint = `/FieldSchedule/${scheduleId}`;
    const response = await apiClient.get(endpoint);

    // Xử lý response có thể có nhiều format
    let scheduleData = response.data;
    if (scheduleData && scheduleData.data) {
      scheduleData = scheduleData.data;
    }

    return {
      success: true,
      data: normalizeFieldSchedule(scheduleData),
    };
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error),
    };
  }
}

/**
 * Update field schedule status
 * @param {number|string} scheduleId - Schedule ID
 * @param {string} status - New status (Available, Booked, Maintenance)
 * @param {Object} currentSchedule - Optional: Current schedule data to avoid fetching
 * @returns {Promise<Object>} Updated schedule data
 */
export async function updateFieldScheduleStatus(
  scheduleId,
  status,
  currentSchedule = null
) {
  try {
    // Nếu không có currentSchedule, lấy thông tin schedule hiện tại trước
    let schedule = currentSchedule;
    if (!schedule) {
      const fetchResult = await fetchFieldScheduleByIdWithAuth(scheduleId);
      if (!fetchResult.success) {
        return {
          success: false,
          error: fetchResult.error || "Không thể lấy thông tin lịch trình",
        };
      }
      schedule = fetchResult.data;
    }

    // Chuẩn bị payload theo API spec
    // Xử lý date
    let dateStr = "";
    if (schedule.date) {
      if (typeof schedule.date === "string") {
        // Lấy phần YYYY-MM-DD nếu có time
        const dateMatch = schedule.date.match(/^\d{4}-\d{2}-\d{2}/);
        dateStr = dateMatch ? dateMatch[0] : schedule.date;
      } else if (schedule.date.year) {
        dateStr = formatDateFromObject(schedule.date);
      }
    } else if (schedule.Date) {
      dateStr = formatDateFromObject(schedule.Date);
    }

    // Xử lý startTime và endTime
    let startTimeStr = schedule.startTime || schedule.StartTime || "00:00";
    let endTimeStr = schedule.endTime || schedule.EndTime || "00:00";

    if (typeof startTimeStr === "object" && startTimeStr.hour !== undefined) {
      startTimeStr = formatTimeFromObject(startTimeStr);
    }
    if (typeof endTimeStr === "object" && endTimeStr.hour !== undefined) {
      endTimeStr = formatTimeFromObject(endTimeStr);
    }

    const payload = {
      fieldName: schedule.fieldName || schedule.FieldName || "string",
      slotId: Number(
        schedule.slotId ||
          schedule.SlotId ||
          schedule.slotID ||
          schedule.SlotID ||
          0
      ),
      slotName: schedule.slotName || schedule.SlotName || "string",
      scheduleID: Number(scheduleId),
      fieldID: Number(
        schedule.fieldId ||
          schedule.FieldId ||
          schedule.fieldID ||
          schedule.FieldID ||
          0
      ),
      date: dateStr,
      status: status, // Status mới
      startTime: startTimeStr,
      endTime: endTimeStr,
    };

    // Use the correct endpoint: /FieldSchedule/{id}
    const endpoint = `/FieldSchedule/${scheduleId}`;

    console.log(`📤 [UPDATE SCHEDULE] Full PUT request to ${endpoint}`, {
      scheduleId: scheduleId,
      status: status,
      payload: payload
    });

    const response = await apiClient.put(endpoint, payload);

    console.log(`📥 [UPDATE SCHEDULE] Full PUT response from ${endpoint}:`, response.data);

    const updatedSchedule = normalizeFieldSchedule(response.data);
    
    // Verify the status was actually updated
    const updatedStatus = updatedSchedule?.status || response.data?.status || response.data?.Status;
    if (updatedStatus && updatedStatus.toLowerCase() !== status.toLowerCase()) {
      console.warn(`⚠️ [UPDATE SCHEDULE] Status mismatch! Expected: ${status}, Got: ${updatedStatus}`);
    }

    return {
      success: true,
      data: updatedSchedule,
      message: "Cập nhật trạng thái thành công",
    };
  } catch (error) {
    console.error(`❌ [UPDATE SCHEDULE] Full update failed:`, {
      scheduleId: scheduleId,
      status: status,
      endpoint: `/FieldSchedule/${scheduleId}`,
      error: error.response?.data || error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      payload: error.config?.data
    });
    
    return {
      success: false,
      error: handleApiError(error),
    };
  }
}

/**
 * Update field schedule status only (simplified version)
 * This function tries to update only the status field with minimal payload
 * @param {number|string} scheduleId - Schedule ID
 * @param {string} status - New status (Available, Booked, Maintenance)
 * @returns {Promise<Object>} Updated schedule data
 */
export async function updateFieldScheduleStatusOnly(scheduleId, status) {
  try {
    // First, try to get minimal schedule info to build a valid PUT payload
    const fetchResult = await fetchFieldScheduleByIdWithAuth(scheduleId);
    if (!fetchResult.success || !fetchResult.data) {
      // If we can't fetch, fall back to full update method
      return await updateFieldScheduleStatus(scheduleId, status);
    }

    const schedule = fetchResult.data;
    
    // Build minimal payload with only required fields
    let dateStr = "";
    if (schedule.date) {
      if (typeof schedule.date === "string") {
        const dateMatch = schedule.date.match(/^\d{4}-\d{2}-\d{2}/);
        dateStr = dateMatch ? dateMatch[0] : schedule.date;
      } else if (schedule.date.year) {
        dateStr = formatDateFromObject(schedule.date);
      }
    } else if (schedule.Date) {
      dateStr = formatDateFromObject(schedule.Date);
    }

    let startTimeStr = schedule.startTime || schedule.StartTime || "00:00";
    let endTimeStr = schedule.endTime || schedule.EndTime || "00:00";

    if (typeof startTimeStr === "object" && startTimeStr.hour !== undefined) {
      startTimeStr = formatTimeFromObject(startTimeStr);
    }
    if (typeof endTimeStr === "object" && endTimeStr.hour !== undefined) {
      endTimeStr = formatTimeFromObject(endTimeStr);
    }

    // Minimal payload - only essential fields
    // Ensure all required fields are included for backend validation
    const payload = {
      scheduleID: Number(scheduleId),
      fieldID: Number(
        schedule.fieldId ||
        schedule.FieldId ||
        schedule.fieldID ||
        schedule.FieldID ||
        0
      ),
      slotId: Number(
        schedule.slotId ||
        schedule.SlotId ||
        schedule.slotID ||
        schedule.SlotID ||
        0
      ),
      date: dateStr || schedule.date || schedule.Date || "",
      status: status, // Only field we want to change
      fieldName: schedule.fieldName || schedule.FieldName || schedule.fieldName || "",
      slotName: schedule.slotName || schedule.SlotName || schedule.slotName || "",
      startTime: startTimeStr || schedule.startTime || schedule.StartTime || "00:00",
      endTime: endTimeStr || schedule.endTime || schedule.EndTime || "00:00",
    };
    
    // Log payload to verify format
    console.log(`📋 [UPDATE SCHEDULE] Payload for simple update:`, JSON.stringify(payload, null, 2));

    // Use the correct endpoint: /FieldSchedule/{id}
    const endpoint = `/FieldSchedule/${scheduleId}`;
    
    try {
      console.log(`📤 [UPDATE SCHEDULE] PUT request to ${endpoint}`, {
        scheduleId: scheduleId,
        status: status,
        payload: payload
      });
      
      const response = await apiClient.put(endpoint, payload);
      
      console.log(`✅ [UPDATE SCHEDULE] PUT success to ${endpoint}:`, response.data);
      
      return {
        success: true,
        data: normalizeFieldSchedule(response.data),
        message: "Cập nhật trạng thái thành công",
      };
    } catch (error) {
      // If PUT fails, log detailed error and fall back to full update method
      console.error("❌ [UPDATE SCHEDULE] Simple status update failed:", {
        endpoint: endpoint,
        payload: payload,
        error: error.response?.data || error.message,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      return await updateFieldScheduleStatus(scheduleId, status);
    }
  } catch (error) {
    // Final fallback to full update method
    console.warn("Error in updateFieldScheduleStatusOnly, using full update:", error);
    return await updateFieldScheduleStatus(scheduleId, status);
  }
}

/**
 * Delete a field schedule
 * @param {number|string} scheduleId - Schedule ID
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteFieldSchedule(scheduleId) {
  try {
    const endpoint = `/FieldSchedule/${scheduleId}`;

    await apiClient.delete(endpoint);

    return {
      success: true,
      message: "Xóa lịch trình thành công",
    };
  } catch (error) {
    // Check if error is related to booking/foreign key constraint
    const errorMessage = handleApiError(error);
    const isBookingError =
      errorMessage.toLowerCase().includes("booking") ||
      errorMessage.toLowerCase().includes("đặt sân") ||
      errorMessage.toLowerCase().includes("entity changes") ||
      errorMessage.toLowerCase().includes("foreign key") ||
      errorMessage.toLowerCase().includes("constraint") ||
      error.response?.data?.message?.toLowerCase().includes("entity changes") ||
      error.response?.data?.message?.toLowerCase().includes("foreign key");

    return {
      success: false,
      error: isBookingError
        ? "Bạn không thể xóa vì đang có lịch đặt sân này"
        : errorMessage,
    };
  }
}

/**
 * Fetch available schedules for a specific field and date
 * @param {number} fieldId - Field ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export async function fetchAvailableSchedulesByFieldAndDate(fieldId, date) {
  try {
    if (!fieldId || !date) {
      return {
        success: false,
        error: "Field ID and date are required",
      };
    }

    // Fetch all schedules for the field
    const result = await fetchFieldSchedulesByField(fieldId);

    if (!result.success) {
      return result;
    }

    // Filter by date and status = Available
    const schedules = result.data || [];
    const availableSchedules = schedules.filter((schedule) => {
      // Parse schedule date
      let scheduleDateStr = "";
      if (typeof schedule.date === "string") {
        scheduleDateStr = schedule.date.split("T")[0];
      } else if (schedule.date && schedule.date.year) {
        scheduleDateStr = `${schedule.date.year}-${String(
          schedule.date.month
        ).padStart(2, "0")}-${String(schedule.date.day).padStart(2, "0")}`;
      }

      // Check if date matches and status is Available
      const status = schedule.status || schedule.Status || "";
      const isAvailable = status.toLowerCase() === "available";
      const dateMatches = scheduleDateStr === date;

      return dateMatches && isAvailable;
    });

    return {
      success: true,
      data: availableSchedules,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to fetch available schedules",
    };
  }
}

/**
 * Fetch a single field schedule by ID using public endpoint
 * @param {number|string} scheduleId - Schedule ID
 * @returns {Promise<Object>} Schedule data
 */
export async function fetchFieldScheduleById(scheduleId) {
  try {
    if (!scheduleId) {
      return {
        success: false,
        error: "Schedule ID is required",
      };
    }

    const endpoint = `/FieldSchedule/public/${scheduleId}`;

    // Create a separate axios instance without auth token for public endpoint
    const DEFAULT_API_BASE_URL = "http://localhost:8080";
    const API_BASE_URL =
      process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL;

    const publicApiClient = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Ensure no auth token is sent for public endpoint
    publicApiClient.interceptors.request.use((config) => {
      delete config.headers.Authorization;
      return config;
    });

    const response = await publicApiClient.get(endpoint);

    let data = response.data;

    // Handle different response structures
    if (data && (data.scheduleId || data.ScheduleID || data.scheduleID)) {
      return {
        success: true,
        data: normalizeFieldSchedule(data),
      };
    } else if (data && data.data) {
      return {
        success: true,
        data: normalizeFieldSchedule(data.data),
      };
    } else {
      return {
        success: false,
        error: "Invalid response format",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error),
    };
  }
}
