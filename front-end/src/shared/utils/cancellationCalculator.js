/**
 * Tính toán mức hoàn cọc và phạt dựa trên thời gian hủy sau khi confirm
 */
export function calculateCancellationRefund(
  confirmedAt,
  bookingStartTime,
  depositAmount = 0
) {
  // Convert to Date objects if strings
  const confirmed = new Date(confirmedAt);
  const startTime = new Date(bookingStartTime);
  const now = new Date();

  // Calculate hours from now until booking start
  const hoursUntilBooking = (startTime - now) / (1000 * 60 * 60);

  // Determine refund and penalty rates based on time range
  let refundRate = 0;
  let penaltyRate = 0;
  let timeRange = "";

  if (hoursUntilBooking > 5) {
    // > 5h: 0% hoàn, 100% phạt
    refundRate = 0;
    penaltyRate = 100;
    timeRange = "> 5h";
  } else if (hoursUntilBooking > 4) {
    // 4-5h: 10% hoàn, 90% phạt
    refundRate = 10;
    penaltyRate = 90;
    timeRange = "4-5h";
  } else if (hoursUntilBooking > 3) {
    // 3-4h: 40% hoàn, 60% phạt
    refundRate = 40;
    penaltyRate = 60;
    timeRange = "3-4h";
  } else if (hoursUntilBooking > 2) {
    // 2-3h: 70% hoàn, 30% phạt
    refundRate = 70;
    penaltyRate = 30;
    timeRange = "2-3h";
  } else if (hoursUntilBooking >= 0) {
    // 0-2h: 100% hoàn, 0% phạt
    refundRate = 100;
    penaltyRate = 0;
    timeRange = "0-2h";
  } else {
    // Đã quá giờ booking (âm)
    refundRate = 0;
    penaltyRate = 100;
    timeRange = "Đã quá giờ";
  }

  // Calculate amounts
  const refundAmount = (depositAmount * refundRate) / 100;
  const penaltyAmount = (depositAmount * penaltyRate) / 100;

  return {
    hoursUntilBooking: Math.max(0, hoursUntilBooking),
    refundRate,
    penaltyRate,
    refundAmount,
    penaltyAmount,
    timeRange,
    isPastBooking: hoursUntilBooking < 0,
  };
}

/**
 * Lấy danh sách các mốc thời gian và mức hoàn/phạt
 * @returns {Array} - Array of time ranges with refund and penalty rates
 */
export function getCancellationPolicyRanges() {
  return [
    { range: "0-2h", refundRate: 100, penaltyRate: 0, label: "0-2 giờ" },
    { range: "2-3h", refundRate: 70, penaltyRate: 30, label: "2-3 giờ" },
    { range: "3-4h", refundRate: 40, penaltyRate: 60, label: "3-4 giờ" },
    { range: "4-5h", refundRate: 10, penaltyRate: 90, label: "4-5 giờ" },
    { range: ">5h", refundRate: 0, penaltyRate: 100, label: "Trên 5 giờ" },
  ];
}

/**
 * Format số tiền VNĐ
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}
