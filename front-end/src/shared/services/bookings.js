// Mocked booking/payment services with pending hold logic
import axios from "axios";

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
  // Simulate network
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

// ============================================
// Real API endpoints for Booking
// ============================================

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

export async function createBooking(bookingData) {
  try {
    const endpoint = "https://sep490-g19-zxph.onrender.com/api/Booking/create";

    // Prepare payload
    const payload = {
      userId: Number(bookingData.userId) || 0,
      scheduleId: Number(bookingData.scheduleId) || 0,
      totalPrice: Number(bookingData.totalPrice) || 0,
      depositAmount: Number(bookingData.depositAmount) || 0,
      hasOpponent: Boolean(bookingData.hasOpponent ?? false),
      matchRequestId: bookingData.matchRequestId
        ? Number(bookingData.matchRequestId)
        : 0,
    };

    console.log("Creating booking with payload:", payload);

    const response = await apiClient.post(endpoint, payload);

    return {
      success: true,
      data: response.data,
      message: "Tạo booking thành công",
    };
  } catch (error) {
    console.error("Error creating booking:", error);
    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}

/**
 * Confirm payment for a booking
 * @param {number|string} bookingId - Booking ID
 * @returns {Promise<Object>} Confirmation result
 */
export async function confirmPaymentAPI(bookingId) {
  try {
    const endpoint = `https://sep490-g19-zxph.onrender.com/api/Booking/confirm-payment/${bookingId}`;

    console.log(`Confirming payment for booking: ${bookingId}`);

    const response = await apiClient.put(endpoint);

    return {
      success: true,
      data: response.data,
      message: "Xác nhận thanh toán thành công",
    };
  } catch (error) {
    console.error("Error confirming payment:", error);
    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}

/**
 * Generate QR code for a booking
 * @param {number|string} bookingId - Booking ID
 * @returns {Promise<Object>} QR code data
 */
export async function generateQRCode(bookingId) {
  try {
    const endpoint = `https://sep490-g19-zxph.onrender.com/api/Booking/generate-qr/${bookingId}`;

    console.log(`Generating QR code for booking: ${bookingId}`);

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
 * Confirm booking by owner
 * @param {number|string} bookingId - Booking ID
 * @returns {Promise<Object>} Confirmation result
 */
export async function confirmByOwner(bookingId) {
  try {
    const endpoint = `https://sep490-g19-zxph.onrender.com/api/Booking/confirm-by-owner/${bookingId}`;

    console.log(`Owner confirming booking: ${bookingId}`);

    const response = await apiClient.put(endpoint);

    return {
      success: true,
      data: response.data,
      message: "Xác nhận booking thành công",
    };
  } catch (error) {
    console.error("Error confirming booking by owner:", error);
    const errorMessage = handleApiError(error);
    return {
      success: false,
      error:
        errorMessage instanceof Error ? errorMessage.message : errorMessage,
    };
  }
}
