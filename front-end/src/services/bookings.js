// Mocked booking/payment services

export async function createPendingBooking({
  fieldId,
  date,
  slotId,
  customer,
  pricing,
  deposit,
}) {
  // Simulate creating a pending booking and returning a QR session
  return {
    bookingId: Math.floor(Math.random() * 1000000),
    status: "Pending",
    qrCodeUrl:
      "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=BOOKING",
    qrExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  };
}

export async function confirmPayment({ bookingId, method }) {
  // Simulate payment confirmation
  return { bookingId, status: "Confirmed", paymentStatus: "Paid" };
}

// Check field availability
export async function checkFieldAvailability(fieldId, date, slotId) {
  // Simulate API call to check availability
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock availability check - 90% chance of available
  const isAvailable = Math.random() > 0.1;

  return {
    available: isAvailable,
    message: isAvailable ? "Sân còn trống" : "Sân đã được đặt",
    alternativeSlots: isAvailable
      ? []
      : [
          { slotId: 1, name: "07:15 - 08:45", available: true },
          { slotId: 2, name: "08:45 - 10:15", available: true },
        ],
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

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
