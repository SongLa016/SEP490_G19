// Mocked booking/payment services with pending hold logic
import axios from "axios";
import { decodeTokenPayload, isTokenExpired } from "../utils/tokenManager";
import { validateVietnamPhone } from "./authService";
import { API_BASE_URL } from "../config/api";

// pending holds trong bộ nhớ
const pendingHolds = [];

// hàm xóa pending holds hết hạn
function cleanupExpiredHolds() {
  const now = Date.now();
  for (let i = pendingHolds.length - 1; i >= 0; i -= 1) {
    if (new Date(pendingHolds[i].expiresAt).getTime() <= now) {
      pendingHolds.splice(i, 1);
    }
  }
}

// hàm đọc tất cả bookings đã xác nhận
function readAllConfirmedBookings() {
  try {
    const raw = localStorage.getItem("bookings");
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

// hàm kiểm tra xung đột giữa pending holds và bookings đã xác nhận
function hasConflict({ fieldId, date, slotId }) {
  cleanupExpiredHolds();
  const dateKey = String(date);
  const slotKey = String(slotId);
  // Check active holds
  const conflictHold = pendingHolds.some(
    (h) =>
      String(h.fieldId) === String(fieldId) &&
      String(h.date) === dateKey &&
      String(h.slotId) === slotKey
  );
  if (conflictHold) return true;
  // Check confirmed bookings persisted
  const confirmed = readAllConfirmedBookings();
  return confirmed.some(
    (b) =>
      String(b.fieldId) === String(fieldId) &&
      String(b.date) === dateKey &&
      String(b.slotId) === slotKey &&
      String(b.status).toLowerCase() === "confirmed"
  );
}

// tạo pending booking
export async function createPendingBooking(bookingData, options = {}) {
  const { fieldId, date, slotId, duration = 1 } = bookingData || {};

  // kiểm tra các validations cơ bản (giới hạn thời lượng 1h - 1.5h)
  const durationNum = Number(duration || 0);
  if (Number.isNaN(durationNum) || durationNum <= 0) {
    throw new Error("Thời lượng không hợp lệ.");
  }
  if (durationNum > 1.5) {
    const err = new Error(
      "Thời lượng đặt sân vượt giới hạn (tối đa 1 tiếng 30 phút)."
    );
    err.code = "DURATION_LIMIT";
    throw err;
  }

  if (!fieldId || !date || !slotId) {
    const err = new Error("Thiếu thông tin đặt sân (sân/ngày/giờ).");
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  // kiểm tra xung đột giữa pending holds và bookings đã xác nhận
  if (hasConflict({ fieldId, date, slotId })) {
    const err = new Error(
      "Khung giờ này đã có người đặt. Vui lòng chọn khung giờ khác."
    );
    err.code = "CONFLICT";
    throw err;
  }

  // tạo pending hold với QR expiry (mặc định 7 phút; tối thiểu 5, tối đa 10)
  const minMs = 5 * 60 * 1000;
  const maxMs = 10 * 60 * 1000;
  const requestedMs = Math.max(
    minMs,
    Math.min(maxMs, (options.expiryMinutes || 7) * 60 * 1000)
  );
  const bookingId = Math.floor(Math.random() * 1000000);
  const expiresAt = new Date(Date.now() + requestedMs).toISOString();
  const hold = { bookingId, fieldId, date, slotId, expiresAt };
  pendingHolds.push(hold);

  return {
    bookingId,
    status: "Pending",
    qrCodeUrl:
      "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=BOOKING-" +
      bookingId,
    qrExpiresAt: expiresAt,
  };
}

// xác nhận thanh toán
export async function confirmPayment(bookingId, method) {
  cleanupExpiredHolds();
  const idx = pendingHolds.findIndex(
    (h) => String(h.bookingId) === String(bookingId)
  );
  if (idx === -1) {
    const err = new Error("Phiên thanh toán không hợp lệ hoặc đã hết hạn.");
    err.code = "HOLD_NOT_FOUND";
    throw err;
  }
  const hold = pendingHolds[idx];
  const isExpired = new Date(hold.expiresAt).getTime() <= Date.now();
  if (isExpired) {
    pendingHolds.splice(idx, 1);
    const err = new Error("Mã QR đã hết hạn. Vui lòng giữ chỗ lại.");
    err.code = "EXPIRED";
    throw err;
  }
  pendingHolds.splice(idx, 1);
  return { bookingId, status: "Confirmed", paymentStatus: "Paid", method };
}

// kiểm tra sân có săn
export async function checkFieldAvailability(fieldId, date, slotId) {
  try {
    // Kiểm tra local hold trước (để tránh double-booking trong cùng session)
    if (hasConflict({ fieldId, date, slotId })) {
      return {
        available: false,
        message: "Khung giờ này đang được giữ chỗ bởi người khác",
        alternativeSlots: [],
      };
    }

    // Gọi API backend để kiểm tra trạng thái schedule real-time
    const endpoint = `${API_BASE_URL}/api/FieldSchedule/public/field/${fieldId}`;
    const response = await axios.get(endpoint);

    const schedules = Array.isArray(response.data)
      ? response.data
      : response.data?.data || [];

    // Tìm schedule matching với slotId và date
    const matchingSchedule = schedules.find((s) => {
      const scheduleSlotId = String(
        s.slotId || s.SlotId || s.slotID || s.SlotID
      );
      const scheduleDate = s.date || s.Date;

      // So sánh date
      let scheduleDateStr = "";
      if (typeof scheduleDate === "string") {
        scheduleDateStr = scheduleDate.split("T")[0];
      } else if (
        scheduleDate?.year &&
        scheduleDate?.month &&
        scheduleDate?.day
      ) {
        scheduleDateStr = `${scheduleDate.year}-${String(
          scheduleDate.month
        ).padStart(2, "0")}-${String(scheduleDate.day).padStart(2, "0")}`;
      }

      return (
        scheduleSlotId === String(slotId) && scheduleDateStr === String(date)
      );
    });

    if (!matchingSchedule) {
      // Không tìm thấy schedule
      return {
        available: true,
        message: "Sân còn trống",
        alternativeSlots: [],
      };
    }

    // Kiểm tra trạng thái schedule
    const status = (
      matchingSchedule.status ||
      matchingSchedule.Status ||
      ""
    ).toLowerCase();

    // Các trạng thái không khả dụng
    const unavailableStatuses = [
      "booked",
      "pending",
      "maintenance",
      "locked",
      "reserved",
    ];
    const isUnavailable = unavailableStatuses.includes(status);

    if (isUnavailable) {
      return {
        available: false,
        message:
          status === "booked"
            ? "Khung giờ này đã có người đặt"
            : status === "pending"
            ? "Khung giờ này đang chờ xác nhận thanh toán"
            : status === "maintenance"
            ? "Sân đang bảo trì"
            : "Khung giờ này không khả dụng",
        alternativeSlots: [],
        scheduleStatus: status,
      };
    }

    return {
      available: true,
      message: "Sân còn trống",
      alternativeSlots: [],
      scheduleStatus: status,
    };
  } catch (error) {
    console.error("Error checking field availability:", error);

    // Fallback về kiểm tra local nếu API lỗi
    const localAvailable = !hasConflict({ fieldId, date, slotId });
    return {
      available: localAvailable,
      message: localAvailable ? "Sân còn trống" : "Sân đã được đặt",
      alternativeSlots: [],
      warning: "Không thể kiểm tra real-time từ server",
    };
  }
}

// Validate ngày đặt sân (không được trong quá khứ)
export function validateBookingDate(dateStr) {
  if (!dateStr) {
    return { isValid: false, message: "Vui lòng chọn ngày" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bookingDate = new Date(dateStr);
  bookingDate.setHours(0, 0, 0, 0);
  if (isNaN(bookingDate.getTime())) {
    return { isValid: false, message: "Ngày không hợp lệ" };
  }

  if (bookingDate < today) {
    return {
      isValid: false,
      message: "Không thể đặt sân cho ngày trong quá khứ",
    };
  }

  // Giới hạn đặt trước tối đa 30 ngày
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);

  if (bookingDate > maxDate) {
    return {
      isValid: false,
      message: "Chỉ có thể đặt sân trước tối đa 30 ngày",
    };
  }

  return { isValid: true, message: "" };
}

// Validate booking data
export function validateBookingData(bookingData) {
  const errors = {};

  if (!bookingData.fieldId) {
    errors.fieldId = "Vui lòng chọn sân";
  }

  // Validate ngày đặt sân
  const dateValidation = validateBookingDate(bookingData.date);
  if (!dateValidation.isValid) {
    errors.date = dateValidation.message;
  }

  if (!bookingData.slotId) {
    errors.slotId = "Vui lòng chọn giờ";
  }

  // Validate họ tên (tối thiểu 2 ký tự)
  const customerName = bookingData.customerName?.trim() || "";
  if (!customerName) {
    errors.customerName = "Vui lòng nhập họ và tên";
  } else if (customerName.length < 2) {
    errors.customerName = "Họ tên phải có ít nhất 2 ký tự";
  }

  // Validate số điện thoại Việt Nam
  const phoneValidation = validateVietnamPhone(bookingData.customerPhone);
  if (!phoneValidation.isValid) {
    errors.customerPhone = phoneValidation.message;
  }

  // Email is only required if user doesn't have one or if explicitly required
  if (bookingData.requiresEmail && !bookingData.customerEmail?.trim()) {
    errors.customerEmail = "Vui lòng nhập email";
  } else if (
    bookingData.customerEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingData.customerEmail)
  ) {
    errors.customerEmail = "Email không hợp lệ";
  }

  // Duration limit validation (1h - 1.5h recommended/required)
  const durationNum = Number(bookingData.duration || 0);
  if (Number.isNaN(durationNum) || durationNum <= 0) {
    errors.duration = "Thời lượng không hợp lệ";
  } else if (durationNum > 1.5) {
    errors.duration = "Thời lượng tối đa 1 tiếng 30 phút";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Create axios instance with base configuration
const apiClient = axios.create({
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// thêm interceptor request để bao gồm token auth nếu có
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

// flag để tránh hiển thị nhiều thông báo session hết hạn
let isShowingSessionExpired = false;

// thêm interceptor response để xử lý lỗi 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !isShowingSessionExpired) {
      isShowingSessionExpired = true;
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Show alert and redirect
      const Swal = (await import("sweetalert2")).default;
      await Swal.fire({
        icon: "warning",
        title: "Phiên đăng nhập hết hạn",
        text: "Vui lòng đăng nhập lại để tiếp tục.",
        confirmButtonText: "Đăng nhập",
        confirmButtonColor: "#0ea5e9",
        allowOutsideClick: false,
        allowEscapeKey: false,
      }).then((result) => {
        isShowingSessionExpired = false;
        if (result.isConfirmed) {
          window.location.href = "/login";
        }
      });
    }
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
      // Try to extract more detailed error message from 500 errors
      if (data) {
        if (data.message) {
          errorMessage = data.message;
          // Check for inner exception details
          if (data.innerException) {
            errorMessage += ` (${data.innerException})`;
          } else if (data.error && typeof data.error === "string") {
            errorMessage = data.error;
          } else if (typeof data === "string") {
            errorMessage = data;
          }
        } else if (data.error) {
          errorMessage =
            typeof data.error === "string"
              ? data.error
              : JSON.stringify(data.error);
        } else if (typeof data === "string") {
          errorMessage = data;
        } else {
          errorMessage = "Lỗi máy chủ. Vui lòng thử lại sau.";
        }
      } else {
        errorMessage = "Lỗi máy chủ. Vui lòng thử lại sau.";
      }
    } else if (status === 400) {
      // Bad Request - try to get detailed error message
      if (data) {
        if (data.message) {
          errorMessage = data.message;
          if (data.innerException) {
            errorMessage += ` (${data.innerException})`;
          }
        } else if (data.error) {
          errorMessage =
            typeof data.error === "string"
              ? data.error
              : JSON.stringify(data.error);
        } else if (typeof data === "string") {
          errorMessage = data;
        } else {
          errorMessage = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
        }
      } else {
        errorMessage = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
      }
    } else if (data && data.message) {
      errorMessage = data.message;
      if (data.innerException) {
        errorMessage += ` (${data.innerException})`;
      }
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
    status: error.response?.status,
    response: error.response?.data,
    request: error.request,
    config: error.config?.url,
  });

  return errorMessage;
};

const extractArrayResponse = (responseData) => {
  if (!responseData) return [];
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData.data)) return responseData.data;
  if (Array.isArray(responseData.Data)) return responseData.Data;
  return [];
};

const ensureLoggedIn = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Bạn cần đăng nhập để thực hiện hành động này.");
  }
};

// tạo booking
export async function createBooking(bookingData) {
  try {
    // kiểm tra xem user đã đăng nhập (có token)
    const token = localStorage.getItem("token");
    if (!token) {
      return {
        success: false,
        error: "Bạn cần đăng nhập để tạo booking. Vui lòng đăng nhập trước.",
      };
    }

    // kiểm tra xem token có hết hạn không
    if (isTokenExpired(token)) {
      return {
        success: false,
        error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
      };
    }

    // giải mã token để kiểm tra vai trò của user
    const tokenPayload = decodeTokenPayload(token);
    if (!tokenPayload) {
      return {
        success: false,
        error: "Token không hợp lệ. Vui lòng đăng nhập lại.",
      };
    }

    // kiểm tra xem user có phải là player (kiểm tra vai trò)
    const userRole =
      tokenPayload.Role ||
      tokenPayload.role ||
      tokenPayload.RoleName ||
      tokenPayload.roleName;
    const roleId =
      tokenPayload.RoleID ||
      tokenPayload.roleID ||
      tokenPayload.RoleId ||
      tokenPayload.roleId;

    const isPlayer =
      roleId === 3 ||
      userRole?.toLowerCase() === "player" ||
      userRole?.toLowerCase() === "người chơi" ||
      userRole === "Player";

    if (!isPlayer) {
      return {
        success: false,
        error:
          "Chỉ người chơi (Player) mới có thể tạo booking. Vui lòng đăng nhập bằng tài khoản người chơi.",
      };
    }

    // kiểm tra các trường bắt buộc
    if (!bookingData.userId) {
      return {
        success: false,
        error: "Thiếu thông tin người dùng (userId).",
      };
    }

    // scheduleId có thể là 0 nếu backend sẽ tạo nó từ fieldId, slotId, date
    if (
      bookingData.scheduleId === undefined ||
      bookingData.scheduleId === null
    ) {
      return {
        success: false,
        error: "Thiếu thông tin lịch trình (scheduleId).",
      };
    }

    const endpoint = `${API_BASE_URL}/api/Booking/create`;

    // chuẩn bị payload theo specification API
    const payload = {
      userId: Number(bookingData.userId) || 0,
      scheduleId: Number(bookingData.scheduleId) || 0,
      totalPrice: Number(bookingData.totalPrice) || 0,
      depositAmount: Number(bookingData.depositAmount) || 0,
      hasOpponent: Boolean(bookingData.hasOpponent ?? false),
    };

    const response = await apiClient.post(endpoint, payload);

    return {
      success: true,
      data: response.data,
      message: "Tạo booking thành công",
    };
  } catch (error) {
    console.error("Error creating booking:", error);

    // xử lý lỗi 401 (token hết hạn hoặc không hợp lệ)
    if (error.response?.status === 401) {
      return {
        success: false,
        error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
      };
    }

    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}

// Tạo gói đặt sân định kỳ (BookingPackage)
export async function createBookingPackage(packageData) {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      return {
        success: false,
        error:
          "Bạn cần đăng nhập để tạo gói đặt định kỳ. Vui lòng đăng nhập trước.",
      };
    }

    // Kiểm tra token hết hạn
    if (isTokenExpired(token)) {
      return {
        success: false,
        error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
      };
    }

    const endpoint =
      `${API_BASE_URL}/api/BookingPackage/create`;

    // chuyển đổi ngày thành DateTime format cho BE
    const formatDateForBackend = (dateStr) => {
      if (!dateStr) return "";
      // Nếu đã là ISO string, giữ nguyên
      if (typeof dateStr === "string" && dateStr.includes("T")) {
        return dateStr;
      }
      // Nếu là YYYY-MM-DD, chuyển thành ISO string với time 00:00:00 UTC
      if (typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return `${dateStr}T00:00:00.000Z`;
      }
      return dateStr;
    };

    // Chuẩn hoá payload theo spec backend
    const payload = {
      userId: Number(packageData.userId) || 0,
      fieldId: Number(packageData.fieldId) || 0,
      packageName: packageData.packageName || "Gói đặt định kỳ",
      startDate: formatDateForBackend(packageData.startDate),
      endDate: formatDateForBackend(packageData.endDate),
      totalPrice: Number(packageData.totalPrice) || 0,
      selectedSlots: Array.isArray(packageData.selectedSlots)
        ? packageData.selectedSlots.map((s) => ({
            slotId: Number(s.slotId) || 0,
            dayOfWeek: Number(s.dayOfWeek) || 0,
            fieldId: Number(s.fieldId) || Number(packageData.fieldId) || 0,
            scheduleId: Number(s.scheduleId) || 0,
          }))
        : [],
    };

    const response = await apiClient.post(endpoint, payload);

    return {
      success: true,
      data: response.data,
      message: "Tạo gói đặt định kỳ thành công",
    };
  } catch (error) {
    console.error("Error creating booking package:", error);
    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}
// xác nhận thanh toán
export async function confirmPaymentAPI(bookingId, depositAmount) {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      return {
        success: false,
        error: "Bạn cần đăng nhập để xác nhận thanh toán",
      };
    }

    // kiểm tra xem bookingId có phải là số và hợp lệ không
    const numericBookingId = Number(bookingId);
    if (isNaN(numericBookingId) || numericBookingId <= 0) {
      return {
        success: false,
        error: "Booking ID không hợp lệ",
      };
    }
    const numericDepositAmount = Number(depositAmount);
    if (isNaN(numericDepositAmount) || numericDepositAmount <= 0) {
      return {
        success: false,
        error: "Số tiền cọc không hợp lệ",
      };
    }

    const endpoint = `${API_BASE_URL}/api/Booking/confirm-payment/${numericBookingId}`;
    const payload = {
      Amount: numericDepositAmount,
    };

    const response = await apiClient.put(endpoint, payload);
    return {
      success: true,
      data: response.data,
      message: response.data?.Message || "Xác nhận đặt cọc thành công",
    };
  } catch (error) {
    // Kiểm tra nếu là lỗi CORS
    const isCorsError =
      error.code === "ERR_NETWORK" ||
      error.message?.includes("CORS") ||
      error.message?.includes("Network Error") ||
      (!error.response && error.request);

    const errorMessage = handleApiError(error);

    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
      isCorsError: isCorsError, // Đánh dấu là lỗi CORS để frontend xử lý đặc biệt
    };
  }
}

// tạo QR code
export async function generateQRCode(bookingId, options = {}) {
  try {
    const params = new URLSearchParams();
    if (options.paymentType) {
      params.set("paymentType", options.paymentType);
    } else if (options.amountType) {
      params.set("paymentType", options.amountType);
    }
    if (options.amount) {
      params.set("amount", Number(options.amount));
    }

    const endpoint = `${API_BASE_URL}/api/Booking/generate-qr/${bookingId}${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    const response = await apiClient.get(endpoint);
    // Lấy qrCodeUrl từ response với nhiều trường hợp khác nhau
    const qrCodeUrl =
      response.data?.qrCodeUrl ||
      response.data?.QRCodeUrl ||
      response.data?.qrCode ||
      response.data?.QRCode ||
      response.data?.data?.qrCodeUrl ||
      response.data?.data?.QRCodeUrl ||
      null;

    return {
      success: true,
      data: response.data,
      qrCodeUrl: qrCodeUrl,
    };
  } catch (error) {
    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}

// tạo QR code cho số tiền còn lại
export async function generateQRCodeForRemaining(bookingId) {
  try {
    // kiểm tra xem user đã đăng nhập (có token)
    const token = localStorage.getItem("token");
    if (!token) {
      return {
        success: false,
        error: "Bạn cần đăng nhập để tạo QR code",
      };
    }

    // kiểm tra xem bookingId có phải là số và hợp lệ không
    const numericBookingId = Number(bookingId);
    if (isNaN(numericBookingId) || numericBookingId <= 0) {
      return {
        success: false,
        error: "Booking ID không hợp lệ",
      };
    }

    const endpoint = `${API_BASE_URL}/api/Booking/generate-qr/${numericBookingId}`;

    const response = await apiClient.get(endpoint);

    return {
      success: true,
      data: response.data,
      qrCodeUrl:
        response.data?.qrCodeUrl ||
        response.data?.qrCode ||
        response.data?.qrCodeUrl ||
        null,
    };
  } catch (error) {
    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}

// xác nhận bởi owner
export async function confirmByOwner(bookingId) {
  try {
    // kiểm tra xem user đã đăng nhập (có token)
    const token = localStorage.getItem("token");
    if (!token) {
      return {
        success: false,
        error: "Bạn cần đăng nhập để xác nhận booking",
      };
    }

    const numericBookingId = Number(bookingId);
    if (isNaN(numericBookingId) || numericBookingId <= 0) {
      return {
        success: false,
        error: "Booking ID không hợp lệ",
      };
    }

    const endpoint = `${API_BASE_URL}/api/Booking/confirm-by-owner/${numericBookingId}`;
    const response = await apiClient.put(endpoint);

    return {
      success: true,
      data: response.data,
      message: "Xác nhận booking thành công",
    };
  } catch (error) {
    // Kiểm tra nếu là lỗi CORS
    const isCorsError =
      error.code === "ERR_NETWORK" ||
      error.message?.includes("CORS") ||
      error.message?.includes("Network Error") ||
      (!error.response && error.request);

    const errorMessage = handleApiError(error);

    // cung cấp thông báo lỗi cụ thể
    if (error.response?.status === 400) {
      return {
        success: false,
        error:
          errorMessage ||
          "Không thể xác nhận booking. Booking có thể đã được xác nhận hoặc không tồn tại.",
        isCorsError: isCorsError,
      };
    }

    if (error.response?.status === 404) {
      return {
        success: false,
        error: "Không tìm thấy booking. Booking có thể đã bị xóa.",
        isCorsError: isCorsError,
      };
    }

    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
      isCorsError: isCorsError,
    };
  }
}

// lấy danh sách bookings của player
export async function fetchBookingsByPlayer(playerId) {
  try {
    if (playerId === undefined || playerId === null || playerId === "") {
      return {
        success: false,
        error: "Thiếu thông tin người chơi. Không thể tải lịch sử đặt sân.",
      };
    }

    const endpoint = `${API_BASE_URL}/api/Booking/player/${playerId}`;

    const response = await apiClient.get(endpoint);

    return {
      success: true,
      data: Array.isArray(response.data) ? response.data : [],
    };
  } catch (error) {
    console.error("Error fetching bookings by player:", error);
    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}

export async function fetchBookingPackagesByPlayer(playerId) {
  try {
    if (playerId === undefined || playerId === null || playerId === "") {
      return {
        success: false,
        error:
          "Thiếu thông tin người chơi. Không thể tải lịch sử gói đặt sân cố định.",
      };
    }

    const endpoint = `${API_BASE_URL}/api/BookingPackage/player/${playerId}`;
    const response = await apiClient.get(endpoint);

    return {
      success: true,
      data: extractArrayResponse(response.data),
    };
  } catch (error) {
    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}

// lấy danh sách gói đặt sân cố định của player
export async function fetchBookingPackagesByPlayerToken() {
  try {
    ensureLoggedIn();
    const endpoint =
      `${API_BASE_URL}/api/BookingPackage/player/packages`;
    const response = await apiClient.get(endpoint);
    return {
      success: true,
      data: extractArrayResponse(response.data),
    };
  } catch (error) {
    console.error("Error fetching booking packages by player (token):", error);
    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}

// lấy danh sách sessions của gói đặt sân cố định của player
export async function fetchBookingPackageSessionsByPlayerToken() {
  try {
    ensureLoggedIn();
    const endpoint =
      `${API_BASE_URL}/api/BookingPackage/player/sessions`;
    const response = await apiClient.get(endpoint);
    return {
      success: true,
      data: extractArrayResponse(response.data),
    };
  } catch (error) {
    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}

// lấy danh sách bookings của owner
export async function fetchBookingsByOwner(ownerId) {
  try {
    if (ownerId === undefined || ownerId === null || ownerId === "") {
      return {
        success: false,
        error: "Thiếu thông tin chủ sân. Không thể tải danh sách booking.",
      };
    }

    const endpoint = `${API_BASE_URL}/api/Booking/owner/${ownerId}`;

    const response = await apiClient.get(endpoint);

    return {
      success: true,
      data: Array.isArray(response.data) ? response.data : [],
    };
  } catch (error) {
    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}

// lấy danh sách gói đặt sân cố định của owner
export async function fetchBookingPackagesByOwner(ownerId) {
  try {
    if (ownerId === undefined || ownerId === null || ownerId === "") {
      return {
        success: false,
        error:
          "Thiếu thông tin chủ sân. Không thể tải danh sách gói đặt sân cố định.",
      };
    }

    const endpoint = `${API_BASE_URL}/api/BookingPackage/owner/${ownerId}`;

    const response = await apiClient.get(endpoint);

    return {
      success: true,
      data: Array.isArray(response.data) ? response.data : [],
    };
  } catch (error) {
    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}

// lấy danh sách gói đặt sân cố định của owner (token)
export async function fetchBookingPackagesByOwnerToken() {
  try {
    ensureLoggedIn();
    const endpoint =
      `${API_BASE_URL}/api/BookingPackage/owner/packages`;
    const response = await apiClient.get(endpoint);
    return {
      success: true,
      data: extractArrayResponse(response.data),
    };
  } catch (error) {
    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}

// lấy danh sách sessions của gói đặt sân cố định của owner (token)
export async function fetchBookingPackageSessionsByOwnerToken() {
  try {
    ensureLoggedIn();
    const endpoint =
      `${API_BASE_URL}/api/BookingPackage/owner/sessions`;
    const response = await apiClient.get(endpoint);
    return {
      success: true,
      data: extractArrayResponse(response.data),
    };
  } catch (error) {
    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}

// xác nhận gói đặt sân cố định
export async function confirmBookingPackage(packageId) {
  try {
    const numericId = Number(packageId);
    if (!numericId || Number.isNaN(numericId)) {
      return { success: false, error: "BookingPackageId không hợp lệ." };
    }

    const endpoint = `${API_BASE_URL}/api/BookingPackage/confirm/${numericId}`;
    const response = await apiClient.post(endpoint);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}

// đánh dấu gói đặt sân cố định đã hoàn thành
export async function completeBookingPackage(packageId) {
  try {
    const numericId = Number(packageId);
    if (!numericId || Number.isNaN(numericId)) {
      return { success: false, error: "BookingPackageId không hợp lệ." };
    }

    const endpoint = `${API_BASE_URL}/api/BookingPackage/complete/${numericId}`;
    const response = await apiClient.put(endpoint);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}

// hủy một session cụ thể trong gói đặt sân cố định
export async function cancelBookingPackageSession(sessionId) {
  try {
    const numericId = Number(sessionId);
    if (!numericId || Number.isNaN(numericId)) {
      return { success: false, error: "SessionId không hợp lệ." };
    }

    const endpoint = `${API_BASE_URL}/api/BookingPackage/cancel-session/${numericId}`;
    const response = await apiClient.post(endpoint);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}

// hủy booking
export async function cancelBooking(bookingId, reason) {
  try {
    if (!bookingId) {
      return {
        success: false,
        error: "Booking ID is required",
      };
    }

    if (!reason || !reason.trim()) {
      return {
        success: false,
        error: "Lý do hủy là bắt buộc",
      };
    }

    const endpoint =
      `${API_BASE_URL}/api/BookingCancellationRe`;

    const payload = {
      bookingId: Number(bookingId),
      reason: String(reason).trim(),
    };

    // sử dụng apiClient thay vì axios để đảm bảo token được bao gồm tự động
    const response = await apiClient.post(endpoint, payload);

    return {
      success: true,
      data: response.data,
      message:
        response.data?.message || "Đã gửi yêu cầu hủy booking thành công",
      cancelReason: response.data?.cancelReason,
      refundAmount: response.data?.refundAmount,
      penaltyAmount: response.data?.penaltyAmount,
      finalRefundAmount: response.data?.finalRefundAmount,
      refundQR: response.data?.refundQR,
    };
  } catch (error) {
    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}

// lấy danh sách yêu cầu hủy booking của owner
export async function fetchCancellationRequests() {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      return {
        success: false,
        error: "Vui lòng đăng nhập để xem yêu cầu hủy",
      };
    }

    const endpoint =
      `${API_BASE_URL}/api/BookingCancellationRe/owner/cancellations`;

    const response = await apiClient.get(endpoint);

    return {
      success: true,
      data: Array.isArray(response.data)
        ? response.data
        : response.data?.data || [],
    };
  } catch (error) {
    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}

// lấy chi tiết yêu cầu hủy theo ID
export async function fetchCancellationRequestById(cancellationId) {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      return {
        success: false,
        error: "Vui lòng đăng nhập để xem chi tiết yêu cầu hủy",
      };
    }

    if (!cancellationId) {
      return {
        success: false,
        error: "Cancellation ID is required",
      };
    }

    const endpoint = `${API_BASE_URL}/api/BookingCancellationRe/${cancellationId}`;

    const response = await apiClient.get(endpoint);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        error:
          error.response.data?.message || "Không thể tải chi tiết yêu cầu hủy",
      };
    }

    return {
      success: false,
      error: error.message || "Có lỗi xảy ra khi tải chi tiết yêu cầu hủy",
    };
  }
}

// xác nhận yêu cầu hủy
export async function confirmCancellation(cancellationId) {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      return {
        success: false,
        error: "Vui lòng đăng nhập để xác nhận yêu cầu hủy",
      };
    }

    if (!cancellationId) {
      return {
        success: false,
        error: "Cancellation ID is required",
      };
    }

    const endpoint = `${API_BASE_URL}/api/BookingCancellationRe/confirm/${cancellationId}`;

    const response = await apiClient.put(endpoint, {});

    return {
      success: true,
      data: response.data,
      message: "Đã xác nhận hủy booking",
    };
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        error: error.response.data?.message || "Không thể xác nhận hủy",
      };
    }

    return {
      success: false,
      error: error.message || "Có lỗi xảy ra khi xác nhận hủy",
    };
  }
}

// xóa/từ chối yêu cầu hủy
export async function deleteCancellationRequest(cancellationId) {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      return {
        success: false,
        error: "Vui lòng đăng nhập để xóa yêu cầu hủy",
      };
    }

    if (!cancellationId) {
      return {
        success: false,
        error: "Cancellation ID is required",
      };
    }

    const endpoint = `${API_BASE_URL}/api/BookingCancellationRe/${cancellationId}`;

    await apiClient.delete(endpoint);

    return {
      success: true,
      message: "Đã xóa yêu cầu hủy",
    };
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        error: error.response.data?.message || "Không thể xóa yêu cầu hủy",
      };
    }

    return {
      success: false,
      error: error.message || "Có lỗi xảy ra khi xóa yêu cầu hủy",
    };
  }
}

// cập nhật trạng thái booking
export async function updateBookingStatus(bookingId, status) {
  try {
    if (!bookingId) {
      return {
        success: false,
        error: "Booking ID is required",
      };
    }

    if (!status) {
      return {
        success: false,
        error: "Status is required",
      };
    }

    // kiểm tra xem user đã đăng nhập (có token)
    const token = localStorage.getItem("token");
    if (!token) {
      return {
        success: false,
        error: "Bạn cần đăng nhập để cập nhật trạng thái booking",
      };
    }

    const numericBookingId = Number(bookingId);
    if (isNaN(numericBookingId) || numericBookingId <= 0) {
      return {
        success: false,
        error: "Booking ID không hợp lệ",
      };
    }

    // thử các endpoint khác nhau để cập nhật trạng thái booking
    const endpoints = [
      `${API_BASE_URL}/api/Booking/${numericBookingId}/status`,
      `${API_BASE_URL}/api/Booking/update-status/${numericBookingId}`,
      `${API_BASE_URL}/api/Booking/${numericBookingId}`,
    ];

    const payload = {
      status: String(status),
    };

    let lastError = null;
    for (const endpoint of endpoints) {
      try {
        const response = await apiClient.put(endpoint, payload);
        return {
          success: true,
          data: response.data,
          message: `Đã cập nhật trạng thái booking sang "${status}"`,
        };
      } catch (putError) {
        lastError = putError;
        if (
          putError.response?.status === 404 ||
          putError.response?.status === 405
        ) {
          try {
            const response = await apiClient.patch(endpoint, payload);
            return {
              success: true,
              data: response.data,
              message: `Đã cập nhật trạng thái booking sang "${status}"`,
            };
          } catch (patchError) {
            lastError = patchError;
            continue;
          }
        }
        if (
          putError.response?.status !== 404 &&
          putError.response?.status !== 405
        ) {
          break;
        }
      }
    }

    // nếu tất cả endpoints đều thất bại, trả về lỗi
    const errorMessage = handleApiError(lastError);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  } catch (error) {
    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}

// lấy danh sách yêu cầu hủy booking của user hiện tại (từ token)
export async function fetchCancellationRequestsByUser() {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      return {
        success: false,
        error: "Bạn cần đăng nhập để xem yêu cầu hủy booking",
      };
    }

    const endpoint = `${API_BASE_URL}/api/BookingCancellationRe/by-user`;

    const response = await apiClient.get(endpoint);

    return {
      success: true,
      data: extractArrayResponse(response.data),
    };
  } catch (error) {
    // nếu 404, có thể user chưa có yêu cầu hủy nào
    if (error.response?.status === 404) {
      return {
        success: true,
        data: [],
      };
    }

    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}
