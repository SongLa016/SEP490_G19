//lấy tất cả các lịch trình sân nhỏ
import axios from "axios";

const DEFAULT_API_BASE_URL = "https://sep490-g19-zxph.onrender.com";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL;

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

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

// hàm xử lý lỗi API
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

// hàm chuyển đổi chuỗi ngày thành đối tượng ngày
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

// hàm chuyển đổi chuỗi thời gian thành đối tượng thời gian
const parseTimeToObject = (timeString) => {
  if (!timeString) return { hour: 0, minute: 0 };
  const parts = String(timeString).split(":");
  const hours = Number(parts[0]) || 0;
  const minutes = Number(parts[1]) || 0;
  return {
    hour: hours,
    minute: minutes,
  };
};

// hàm chuyển đổi đối tượng ngày thành chuỗi ngày
const formatDateFromObject = (dateObj) => {
  if (!dateObj) return null;
  if (typeof dateObj === "string") return dateObj;
  const { year, month, day } = dateObj;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
};

// hàm chuyển đổi đối tượng thời gian thành chuỗi thời gian
const formatTimeFromObject = (timeObj) => {
  if (!timeObj) return null;
  if (typeof timeObj === "string") return timeObj;
  const { hour, minute } = timeObj;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

// hàm chuyển đổi đối tượng lịch trình thành đối tượng lịch trình
const normalizeFieldSchedule = (item) => {
  if (!item) return null;
  return {
    scheduleId: item.scheduleId ?? item.ScheduleID ?? item.id,
    fieldId: item.fieldId ?? item.FieldID,
    fieldName: item.fieldName ?? item.FieldName,
    slotId: item.slotId ?? item.SlotID,
    slotName: item.slotName ?? item.SlotName,
    startTime: item.startTime || item.StartTime || null,
    endTime: item.endTime || item.EndTime || null,
    date: item.date || item.Date || null,
    status: item.status ?? item.Status ?? "Available",
  };
};

/**
 * hàm lấy tất cả các lịch trình sân nhỏ
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

// hàm lấy lịch trình sân nhỏ theo id sân nhỏ
export async function fetchFieldSchedulesByField(fieldId) {
  try {
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
        if (err.response?.status !== 404) {
          break;
        }
      }
    }

    if (!response) {
      const allSchedulesResponse = await apiClient.get("/FieldSchedule");
      let allData = allSchedulesResponse.data;
      let allSchedulesArray = [];

      if (Array.isArray(allData)) {
        allSchedulesArray = allData;
      } else if (allData && Array.isArray(allData.data)) {
        allSchedulesArray = allData.data;
      }

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

// hàm lấy lịch trình sân nhỏ theo id sân nhỏ
export async function fetchPublicFieldSchedulesByField(fieldId) {
  try {
    const endpoint = `/FieldSchedule/public/field/${fieldId}`;
    const DEFAULT_API_BASE_URL = "https://sep490-g19-zxph.onrender.com";
    const API_BASE_URL =
      process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL;

    const publicApiClient = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    publicApiClient.interceptors.request.use((config) => {
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

// hàm lấy lịch trình sân nhỏ theo ngày
export async function fetchPublicFieldSchedulesByDate(date) {
  try {
    const endpoints = [`/FieldSchedule/public?date=${date}`];

    const DEFAULT_API_BASE_URL = "https://sep490-g19-zxph.onrender.com";
    const API_BASE_URL =
      process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL;

    const publicApiClient = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });
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

// hàm tạo lịch trình sân nhỏ
export async function createFieldSchedule(scheduleData) {
  try {
    const endpoint = "/FieldSchedule";

    if (!scheduleData.fieldId || !scheduleData.slotId || !scheduleData.date) {
      return {
        success: false,
        error: "Thiếu thông tin bắt buộc: fieldId, slotId, hoặc date",
      };
    }

    let dateObj = null;
    if (typeof scheduleData.date === "string") {
      dateObj = parseDateToObject(scheduleData.date);
    } else if (scheduleData.date && typeof scheduleData.date === "object") {
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
          dayOfWeek: date.getDay(),
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

    const payload = {
      fieldId: Number(scheduleData.fieldId),
      slotId: Number(scheduleData.slotId),
      date: formatDateFromObject(dateObj),
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

// hàm cập nhật lịch trình sân nhỏ
export async function updateFieldSchedule(scheduleId, scheduleData) {
  try {
    const endpoint = `/FieldSchedule/${scheduleId}`;

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

// hàm lấy lịch trình sân nhỏ theo id
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

// hàm cập nhật trạng thái lịch trình sân nhỏ
export async function updateFieldScheduleStatus(
  scheduleId,
  status,
  currentSchedule = null
) {
  try {
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

    // Xử lý date
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

    const endpoint = `/FieldSchedule/${scheduleId}`;
    const response = await apiClient.put(endpoint, payload);

    const updatedSchedule = normalizeFieldSchedule(response.data);

    const updatedStatus =
      updatedSchedule?.status || response.data?.status || response.data?.Status;
    if (updatedStatus && updatedStatus.toLowerCase() !== status.toLowerCase()) {
    }

    return {
      success: true,
      data: updatedSchedule,
      message: "Cập nhật trạng thái thành công",
    };
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error),
    };
  }
}

// hàm cập nhật trạng thái lịch trình sân nhỏ chỉ có trạng thái
export async function updateFieldScheduleStatusOnly(scheduleId, status) {
  try {
    const fetchResult = await fetchFieldScheduleByIdWithAuth(scheduleId);
    if (!fetchResult.success || !fetchResult.data) {
      return await updateFieldScheduleStatus(scheduleId, status);
    }

    const schedule = fetchResult.data;

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
      status: status, // sân muốn thay đổi
      fieldName:
        schedule.fieldName || schedule.FieldName || schedule.fieldName || "",
      slotName:
        schedule.slotName || schedule.SlotName || schedule.slotName || "",
      startTime:
        startTimeStr || schedule.startTime || schedule.StartTime || "00:00",
      endTime: endTimeStr || schedule.endTime || schedule.EndTime || "00:00",
    };

    const endpoint = `/FieldSchedule/${scheduleId}`;

    try {
      const response = await apiClient.put(endpoint, payload);

      return {
        success: true,
        data: normalizeFieldSchedule(response.data),
        message: "Cập nhật trạng thái thành công",
      };
    } catch (error) {
      return await updateFieldScheduleStatus(scheduleId, status);
    }
  } catch (error) {
    return await updateFieldScheduleStatus(scheduleId, status);
  }
}

// hàm xóa lịch trình sân nhỏ
export async function deleteFieldSchedule(scheduleId) {
  try {
    const endpoint = `/FieldSchedule/${scheduleId}`;

    await apiClient.delete(endpoint);

    return {
      success: true,
      message: "Xóa lịch trình thành công",
    };
  } catch (error) {
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

// hàm lấy lịch trình sân nhỏ theo id sân nhỏ và ngày
export async function fetchAvailableSchedulesByFieldAndDate(fieldId, date) {
  try {
    if (!fieldId || !date) {
      return {
        success: false,
        error: "Field ID and date are required",
      };
    }

    // lấy tất cả lịch trình sân nhỏ theo id sân nhỏ
    const result = await fetchFieldSchedulesByField(fieldId);

    if (!result.success) {
      return result;
    }

    // lọc theo ngày và trạng thái = Available
    const schedules = result.data || [];
    const availableSchedules = schedules.filter((schedule) => {
      // phân tích ngày lịch trình
      let scheduleDateStr = "";
      if (typeof schedule.date === "string") {
        scheduleDateStr = schedule.date.split("T")[0];
      } else if (schedule.date && schedule.date.year) {
        scheduleDateStr = `${schedule.date.year}-${String(
          schedule.date.month
        ).padStart(2, "0")}-${String(schedule.date.day).padStart(2, "0")}`;
      }

      // kiểm tra ngày lịch trình và trạng thái = Available
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

// hàm lấy lịch trình sân nhỏ theo id
export async function fetchFieldScheduleById(scheduleId) {
  try {
    if (!scheduleId) {
      return {
        success: false,
        error: "Schedule ID is required",
      };
    }

    const endpoint = `/FieldSchedule/public/${scheduleId}`;

    const DEFAULT_API_BASE_URL = "https://sep490-g19-zxph.onrender.com";
    const API_BASE_URL =
      process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL;

    const publicApiClient = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    publicApiClient.interceptors.request.use((config) => {
      delete config.headers.Authorization;
      return config;
    });

    const response = await publicApiClient.get(endpoint);

    let data = response.data;

    // xử lý các response khác nhau
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
