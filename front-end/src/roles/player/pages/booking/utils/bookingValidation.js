// lấy trạng thái từ api
export const deriveStatusFromApi = (statusInput) => {
  const raw = (statusInput ?? "").toString().toLowerCase();
  if (!raw) return "confirmed";
  if (raw.includes("cancel") || raw.includes("reject") || raw === "0")
    return "cancelled";
  if (raw.includes("complete") || raw.includes("done")) return "completed";
  if (raw.includes("pending") || raw.includes("wait")) return "pending";
  if (raw.includes("confirm")) return "confirmed";
  return raw;
};

// kiểm tra hủy đặt sân
export const shouldShowCancelButton = (booking) => {
  const statusLower = String(
    booking.status || booking.bookingStatus || ""
  ).toLowerCase();
  const paymentLower = String(booking.paymentStatus || "").toLowerCase();
  const isPending = statusLower === "pending";
  const isConfirmed = statusLower === "confirmed";
  const isUnpaid =
    paymentLower === "" ||
    paymentLower === "pending" ||
    paymentLower === "unpaid" ||
    paymentLower === "chờ thanh toán";
  const isPaid = paymentLower === "paid" || paymentLower === "đã thanh toán";
  const isPendingWaitingPayment = isPending && isUnpaid;
  const isPendingPaid = isPending && isPaid;
  const isConfirmedPaid = isConfirmed && isPaid;
  const allowed = isPendingWaitingPayment || isPendingPaid || isConfirmedPaid;
  if (!allowed) return false;
  if (statusLower === "cancelled" || statusLower === "expired") return false;
  return true;
};

// kiểm tra đặt sân chưa thanh toán trong 2 giờ
export const isPendingUnpaidWithin2Hours = (booking) => {
  const statusLower = String(
    booking.status || booking.bookingStatus || ""
  ).toLowerCase();
  const paymentLower = String(booking.paymentStatus || "").toLowerCase();
  const isPending = statusLower === "pending";
  const isUnpaid =
    paymentLower === "" ||
    paymentLower === "pending" ||
    paymentLower === "unpaid";

  if (!isPending || !isUnpaid) return false;
  if (!booking.createdAt) return false;

  const createdAt = new Date(booking.createdAt).getTime();
  const currentTime = new Date().getTime();
  const TWO_HOURS = 2 * 60 * 60 * 1000;
  const timeElapsed = currentTime - createdAt;
  return timeElapsed <= TWO_HOURS;
};

// kiểm tra nút "Tìm đối thủ"
export const shouldShowFindOpponentButton = (booking) => {
  const statusLower = String(
    booking.status || booking.bookingStatus || ""
  ).toLowerCase();
  const paymentLower = String(booking.paymentStatus || "").toLowerCase();
  // phải được xác nhận hoặc hoàn thành
  const isConfirmed = statusLower === "confirmed";
  const isCompleted = statusLower === "completed";

  // phải được thanh toán
  const isPaid = paymentLower === "paid" || paymentLower === "đã thanh toán";
  return (isConfirmed || isCompleted) && isPaid;
};

// kiểm tra yêu cầu tham gia trận đấu
export const hasExistingMatchRequest = (booking, bookingIdToRequest) => {
  if (!booking || !bookingIdToRequest) return false;
  if (bookingIdToRequest[booking.id]) return true;
  // kiểm tra yêu cầu tham gia trận đấu trong dữ liệu
  const matchRequestId =
    booking.matchRequestId || booking.matchRequestID || booking.MatchRequestID;
  return Boolean(matchRequestId);
};

// lấy trạng thái lặp lại
export const getRecurringStatus = (group) => {
  const totalBookings = group.bookings.length;
  const cancelledBookings = group.bookings.filter(
    (b) => b.status === "cancelled"
  ).length;
  const completedBookings = group.bookings.filter(
    (b) => b.status === "completed"
  ).length;

  if (cancelledBookings === totalBookings) return "cancelled";
  if (completedBookings === totalBookings) return "completed";
  if (cancelledBookings > 0) return "partial";
  return "active";
};
