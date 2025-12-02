// Mocked booking/payment services with pending hold logic
import axios from "axios";
import { decodeTokenPayload, isTokenExpired } from "../utils/tokenManager";

// In-memory pending holds (front-end only). Each item: { bookingId, fieldId, date, slotId, expiresAt }
const pendingHolds = [];

function cleanupExpiredHolds() {
  const now = Date.now();
  for (let i = pendingHolds.length - 1; i >= 0; i -= 1) {
    if (new Date(pendingHolds[i].expiresAt).getTime() <= now) {
      pendingHolds.splice(i, 1);
    }
  }
}

function readAllConfirmedBookings() {
  // Read directly from localStorage to avoid coupling to bookingStore internals
  try {
    const raw = localStorage.getItem("bookings");
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

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

export async function createPendingBooking(bookingData, options = {}) {
  // bookingData should include: fieldId, date, slotId, duration, totalPrice, depositPercent, etc.
  const { fieldId, date, slotId, duration = 1 } = bookingData || {};

  // Basic validations (duration limit 1h - 1.5h)
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

  // Conflict check against active holds and confirmed bookings
  if (hasConflict({ fieldId, date, slotId })) {
    const err = new Error(
      "Khung giờ này đã có người đặt. Vui lòng chọn khung giờ khác."
    );
    err.code = "CONFLICT";
    throw err;
  }

  // Create a pending hold with QR expiry (default 7 minutes; min 5, max 10)
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

  // Remove hold upon payment confirmation (backend would atomically confirm here)
  pendingHolds.splice(idx, 1);
  return { bookingId, status: "Confirmed", paymentStatus: "Paid", method };
}

// Check field availability (synchronous vs pending holds + confirmed)
export async function checkFieldAvailability(fieldId, date, slotId) {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const available = !hasConflict({ fieldId, date, slotId });
  return {
    available,
    message: available ? "Sân còn trống" : "Sân đã được đặt",
    alternativeSlots: [],
  };
}

// Validate booking data
export function validateBookingData(bookingData) {
  const errors = {};

  if (!bookingData.fieldId) {
    errors.fieldId = "Vui lòng chọn sân";
  }

  if (!bookingData.date) {
    errors.date = "Vui lòng chọn ngày";
  }

  if (!bookingData.slotId) {
    errors.slotId = "Vui lòng chọn giờ";
  }

  if (!bookingData.customerName?.trim()) {
    errors.customerName = "Vui lòng nhập họ và tên";
  }

  if (!bookingData.customerPhone?.trim()) {
    errors.customerPhone = "Vui lòng nhập số điện thoại";
  } else if (!/^[0-9+\-\s()]{10,15}$/.test(bookingData.customerPhone)) {
    errors.customerPhone = "Số điện thoại không hợp lệ";
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

export async function createBooking(bookingData) {
  try {
    // Check if user is authenticated (has token)
    const token = localStorage.getItem("token");
    if (!token) {
      return {
        success: false,
        error: "Bạn cần đăng nhập để tạo booking. Vui lòng đăng nhập trước.",
      };
    }

    // Check if token is expired
    if (isTokenExpired(token)) {
      return {
        success: false,
        error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
      };
    }

    // Decode token to check user role
    const tokenPayload = decodeTokenPayload(token);
    if (!tokenPayload) {
      return {
        success: false,
        error: "Token không hợp lệ. Vui lòng đăng nhập lại.",
      };
    }

    // Check if user is a player (role check)
    // Backend might use: Role, RoleID, RoleName, role, roleId, roleName
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

    // RoleID 3 typically means Player in many systems, or check role name
    const isPlayer =
      roleId === 3 ||
      userRole?.toLowerCase() === "player" ||
      userRole?.toLowerCase() === "người chơi" ||
      userRole === "Player";

    if (!isPlayer) {
      console.warn("⚠️ [GỬI GIỮ CHỖ - API] User role check failed:", {
        userRole,
        roleId,
        tokenPayload,
      });
      return {
        success: false,
        error:
          "Chỉ người chơi (Player) mới có thể tạo booking. Vui lòng đăng nhập bằng tài khoản người chơi.",
      };
    }

    // Validate required fields
    if (!bookingData.userId) {
      return {
        success: false,
        error: "Thiếu thông tin người dùng (userId).",
      };
    }

    // scheduleId can be 0 if backend will create it from fieldId, slotId, date
    // But we still validate it's a number
    if (
      bookingData.scheduleId === undefined ||
      bookingData.scheduleId === null
    ) {
      return {
        success: false,
        error: "Thiếu thông tin lịch trình (scheduleId).",
      };
    }

    const endpoint = "https://sep490-g19-zxph.onrender.com/api/Booking/create";

    // Prepare payload according to API specification
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

    // Handle 401 Unauthorized (token expired or invalid)
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
      "https://sep490-g19-zxph.onrender.com/api/BookingPackage/create";

    // Chuẩn hoá payload theo spec backend
    const payload = {
      userId: Number(packageData.userId) || 0,
      fieldId: Number(packageData.fieldId) || 0,
      packageName: packageData.packageName || "Gói đặt định kỳ",
      startDate: packageData.startDate, // ISO string
      endDate: packageData.endDate, // ISO string
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

export async function confirmPaymentAPI(bookingId, depositAmount) {
  try {
    // Check if user is authenticated (has token)
    const token = localStorage.getItem("token");
    if (!token) {
      return {
        success: false,
        error: "Bạn cần đăng nhập để xác nhận thanh toán",
      };
    }

    // Ensure bookingId is a number and valid
    const numericBookingId = Number(bookingId);
    if (isNaN(numericBookingId) || numericBookingId <= 0) {
      return {
        success: false,
        error: "Booking ID không hợp lệ",
      };
    }

    // Ensure depositAmount is a number
    const numericDepositAmount = Number(depositAmount);
    if (isNaN(numericDepositAmount) || numericDepositAmount <= 0) {
      return {
        success: false,
        error: "Số tiền cọc không hợp lệ",
      };
    }

    const endpoint = `https://sep490-g19-zxph.onrender.com/api/Booking/confirm-payment/${numericBookingId}`;

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
    console.error("❌ [XÁC NHẬN ĐẶT CỌC - API] Error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
    });

    // Kiểm tra nếu là lỗi CORS - có thể request đã thành công nhưng response bị chặn
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

    const endpoint = `https://sep490-g19-zxph.onrender.com/api/Booking/generate-qr/${bookingId}${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    const response = await apiClient.get(endpoint);

    return {
      success: true,
      data: response.data,
      qrCodeUrl: response.data?.qrCodeUrl || response.data?.qrCode || null,
    };
  } catch (error) {
    console.error("Error generating QR code:", error);
    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}

/**
 * Generate QR code for remaining amount (after deposit is paid)
 * @param {number|string} bookingId - The booking ID
 * @returns {Promise<{success: boolean, data?: Object, qrCodeUrl?: string, error?: string}>}
 */
export async function generateQRCodeForRemaining(bookingId) {
  try {
    // Check if user is authenticated (has token)
    const token = localStorage.getItem("token");
    if (!token) {
      return {
        success: false,
        error: "Bạn cần đăng nhập để tạo QR code",
      };
    }

    // Ensure bookingId is a number and valid
    const numericBookingId = Number(bookingId);
    if (isNaN(numericBookingId) || numericBookingId <= 0) {
      return {
        success: false,
        error: "Booking ID không hợp lệ",
      };
    }

    const endpoint = `https://sep490-g19-zxph.onrender.com/api/Booking/generate-qr/${numericBookingId}`;

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
    console.error("❌ [TẠO QR CÒN LẠI - API] Error:", error);
    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}

export async function confirmByOwner(bookingId) {
  try {
    // Check if user is authenticated (has token)
    const token = localStorage.getItem("token");
    if (!token) {
      return {
        success: false,
        error: "Bạn cần đăng nhập để xác nhận booking",
      };
    }

    // Ensure bookingId is a number and valid
    const numericBookingId = Number(bookingId);
    if (isNaN(numericBookingId) || numericBookingId <= 0) {
      return {
        success: false,
        error: "Booking ID không hợp lệ",
      };
    }

    const endpoint = `https://sep490-g19-zxph.onrender.com/api/Booking/confirm-by-owner/${numericBookingId}`;

    const response = await apiClient.put(endpoint);

    return {
      success: true,
      data: response.data,
      message: "Xác nhận booking thành công",
    };
  } catch (error) {
    console.error("❌ Error confirming booking by owner:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
    });

    // Kiểm tra nếu là lỗi CORS - có thể request đã thành công nhưng response bị chặn
    const isCorsError =
      error.code === "ERR_NETWORK" ||
      error.message?.includes("CORS") ||
      error.message?.includes("Network Error") ||
      (!error.response && error.request);

    const errorMessage = handleApiError(error);

    // Provide more specific error messages
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

export async function fetchBookingsByPlayer(playerId) {
  try {
    if (playerId === undefined || playerId === null || playerId === "") {
      return {
        success: false,
        error: "Thiếu thông tin người chơi. Không thể tải lịch sử đặt sân.",
      };
    }

    const endpoint = `https://sep490-g19-zxph.onrender.com/api/Booking/player/${playerId}`;

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

// Lịch sử gói đặt sân cố định theo người chơi
export async function fetchBookingPackagesByPlayer(playerId) {
  try {
    if (playerId === undefined || playerId === null || playerId === "") {
      return {
        success: false,
        error:
          "Thiếu thông tin người chơi. Không thể tải lịch sử gói đặt sân cố định.",
      };
    }

    const endpoint = `https://sep490-g19-zxph.onrender.com/api/BookingPackage/player/${playerId}`;

    const response = await apiClient.get(endpoint);

    return {
      success: true,
      data: Array.isArray(response.data) ? response.data : [],
    };
  } catch (error) {
    console.error("Error fetching booking packages by player:", error);
    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}

export async function fetchBookingsByOwner(ownerId) {
  try {
    if (ownerId === undefined || ownerId === null || ownerId === "") {
      return {
        success: false,
        error: "Thiếu thông tin chủ sân. Không thể tải danh sách booking.",
      };
    }

    const endpoint = `https://sep490-g19-zxph.onrender.com/api/Booking/owner/${ownerId}`;

    const response = await apiClient.get(endpoint);

    return {
      success: true,
      data: Array.isArray(response.data) ? response.data : [],
    };
  } catch (error) {
    console.error("Error fetching bookings by owner:", error);
    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}

// Owner: fetch all booking packages for fields owned by this owner
export async function fetchBookingPackagesByOwner(ownerId) {
  try {
    if (ownerId === undefined || ownerId === null || ownerId === "") {
      return {
        success: false,
        error:
          "Thiếu thông tin chủ sân. Không thể tải danh sách gói đặt sân cố định.",
      };
    }

    const endpoint = `https://sep490-g19-zxph.onrender.com/api/BookingPackage/owner/${ownerId}`;

    const response = await apiClient.get(endpoint);

    return {
      success: true,
      data: Array.isArray(response.data) ? response.data : [],
    };
  } catch (error) {
    console.error("Error fetching booking packages by owner:", error);
    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}

// Owner: confirm booking package (after verifying payment)
export async function confirmBookingPackage(packageId) {
  try {
    const numericId = Number(packageId);
    if (!numericId || Number.isNaN(numericId)) {
      return { success: false, error: "BookingPackageId không hợp lệ." };
    }

    const endpoint = `https://sep490-g19-zxph.onrender.com/api/BookingPackage/confirm/${numericId}`;
    const response = await apiClient.post(endpoint);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error confirming booking package:", error);
    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}

// Owner: mark booking package as completed
export async function completeBookingPackage(packageId) {
  try {
    const numericId = Number(packageId);
    if (!numericId || Number.isNaN(numericId)) {
      return { success: false, error: "BookingPackageId không hợp lệ." };
    }

    const endpoint = `https://sep490-g19-zxph.onrender.com/api/BookingPackage/complete/${numericId}`;
    const response = await apiClient.put(endpoint);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error completing booking package:", error);
    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}

// Owner: cancel a specific session inside a booking package
export async function cancelBookingPackageSession(sessionId) {
  try {
    const numericId = Number(sessionId);
    if (!numericId || Number.isNaN(numericId)) {
      return { success: false, error: "SessionId không hợp lệ." };
    }

    const endpoint = `https://sep490-g19-zxph.onrender.com/api/BookingPackage/cancel-session/${numericId}`;
    const response = await apiClient.post(endpoint);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error cancelling booking package session:", error);
    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}

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
      "https://sep490-g19-zxph.onrender.com/api/BookingCancellationRe";

    const payload = {
      bookingId: Number(bookingId),
      reason: String(reason).trim(),
    };

    // Use apiClient instead of axios to ensure token is automatically included
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
    console.error("❌ [CANCEL BOOKING - API] Error:", error);

    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}

/**
 * Fetch all booking cancellation requests
 * Backend will return cancellation requests based on token (Owner sees requests for their fields, Player sees their own requests)
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export async function fetchCancellationRequests() {
  try {
    const endpoint =
      "https://sep490-g19-zxph.onrender.com/api/BookingCancellationRe";

    // Use apiClient instead of axios to ensure token is automatically included
    const response = await apiClient.get(endpoint);

    return {
      success: true,
      data: Array.isArray(response.data)
        ? response.data
        : response.data?.data || [],
    };
  } catch (error) {
    console.error("❌ [FETCH CANCELLATION REQUESTS - API] Error:", error);

    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}

/**
 * Fetch a specific cancellation request by ID
 * @param {number|string} cancellationId - The cancellation request ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function fetchCancellationRequestById(cancellationId) {
  try {
    if (!cancellationId) {
      return {
        success: false,
        error: "Cancellation ID is required",
      };
    }

    const endpoint = `https://sep490-g19-zxph.onrender.com/api/BookingCancellationRe/${cancellationId}`;

    const response = await axios.get(endpoint, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error fetching cancellation request:", error);

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

/**
 * Confirm a cancellation request
 * @param {number} cancellationId - The cancellation request ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function confirmCancellation(cancellationId) {
  try {
    const endpoint = `https://sep490-g19-zxph.onrender.com/api/BookingCancellationRe/confirm/${cancellationId}`;

    const response = await axios.put(
      endpoint,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

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

/**
 * Delete a cancellation request
 * @param {number} cancellationId - The cancellation request ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteCancellationRequest(cancellationId) {
  try {
    const endpoint = `https://sep490-g19-zxph.onrender.com/api/BookingCancellationRe/${cancellationId}`;

    await axios.delete(endpoint, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    return {
      success: true,
      message: "Đã xóa yêu cầu hủy",
    };
  } catch (error) {
    console.error("Error deleting cancellation request:", error);

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

/**
 * Update booking status
 * @param {number|string} bookingId - The booking ID
 * @param {string} status - New status (e.g., "Completed", "Cancelled")
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
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

    // Check if user is authenticated
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

    // Try different endpoint variations for updating booking status
    const endpoints = [
      `https://sep490-g19-zxph.onrender.com/api/Booking/${numericBookingId}/status`,
      `https://sep490-g19-zxph.onrender.com/api/Booking/update-status/${numericBookingId}`,
      `https://sep490-g19-zxph.onrender.com/api/Booking/${numericBookingId}`,
    ];

    const payload = {
      status: String(status),
    };

    let lastError = null;
    for (const endpoint of endpoints) {
      try {
        // Try PUT first
        const response = await apiClient.put(endpoint, payload);
        return {
          success: true,
          data: response.data,
          message: `Đã cập nhật trạng thái booking sang "${status}"`,
        };
      } catch (putError) {
        lastError = putError;
        // If PUT fails with 404 or 405, try PATCH
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
        // If it's not a 404/405, stop trying
        if (
          putError.response?.status !== 404 &&
          putError.response?.status !== 405
        ) {
          break;
        }
      }
    }

    // If all endpoints failed, return error
    const errorMessage = handleApiError(lastError);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  } catch (error) {
    console.error("Error updating booking status:", error);
    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}
