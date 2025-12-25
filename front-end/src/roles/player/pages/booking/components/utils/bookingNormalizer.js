import { parseDateValue, formatTimeLabel } from "./bookingHelpers";
import { deriveStatusFromApi } from "./bookingValidation";

// Chuẩn hóa api đặt sân
export const normalizeApiBookings = (items = []) =>
  items.map((item, index) => {
    const start = parseDateValue(item.startTime);
    const end = parseDateValue(item.endTime);
    const timeLabel =
      start && end
        ? `${formatTimeLabel(start)} - ${formatTimeLabel(end)}`
        : item.slotName || item.time || "";
    // tính thời gian đặt sân
    const durationMinutes =
      start && end
        ? Math.max(15, Math.round((end - start) / 60000))
        : item.duration;
    // tính giá đặt sân
    const normalized = {
      id: String(item.bookingId ?? item.bookingID ?? item.id ?? `API-${index}`),
      bookingId: item.bookingId ?? item.bookingID ?? item.id ?? `API-${index}`,
      userId: item.userId ?? item.userID ?? item.UserID,
      scheduleId: item.scheduleId ?? item.scheduleID ?? item.ScheduleID,
      slotId: item.slotId ?? item.slotID ?? item.SlotID,
      totalPrice: Number(item.totalPrice ?? item.TotalPrice ?? item.price ?? 0),
      depositAmount: Number(item.depositAmount ?? item.DepositAmount ?? 0),
      bookingStatus: item.bookingStatus ?? item.BookingStatus ?? item.status,
      paymentStatus: item.paymentStatus ?? item.PaymentStatus ?? "Pending",
      hasOpponent: Boolean(item.hasOpponent ?? item.HasOpponent ?? false),
      matchRequestId:
        item.matchRequestId ??
        item.matchRequestID ??
        item.MatchRequestID ??
        null,
      qrCode: item.qrCode ?? item.QRCode ?? item.qrCodeUrl ?? item.QRCodeUrl ?? item.depositQrCode ?? item.DepositQrCode ?? null,
      qrCodeUrl: item.qrCodeUrl ?? item.QRCodeUrl ?? item.qrCode ?? item.QRCode ?? item.depositQrCode ?? item.DepositQrCode ?? null,
      qrExpiresAt: item.qrExpiresAt ?? item.QRExpiresAt ?? item.qrExpiry ?? item.QRExpiry ?? item.qrCodeExpiresAt ?? item.QRCodeExpiresAt ?? null,
      createdAt: item.createdAt ?? item.CreatedAt ?? item.startTime,
      confirmedAt: item.confirmedAt ?? item.ConfirmedAt ?? null,
      cancelledAt: item.cancelledAt ?? item.CancelledAt ?? null,
      cancelledBy: item.cancelledBy ?? item.CancelledBy ?? null,
      cancelReason: item.cancelReason ?? item.CancelReason ?? null,
      ratingId: item.ratingId ?? item.RatingId ?? item.ratingID ?? null,
      ratingStars: item.stars ?? item.rating ?? item.Rating ?? null,
      ratingComment: item.comment ?? item.Comment ?? null,
      fieldName: item.fieldName || "Chưa rõ sân",
      address: item.complexName || item.fieldAddress || item.address || "",
      date: start ? start.toLocaleDateString("vi-VN") : item.date || "",
      time: timeLabel,
      slotName: item.slotName,
      startTime: item.startTime,
      endTime: item.endTime,
      duration: durationMinutes,
      price: Number(item.totalPrice ?? item.TotalPrice ?? item.price ?? 0),
      paymentMethod: item.paymentMethod,
      status: deriveStatusFromApi(
        item.status || item.bookingStatus || item.BookingStatus
      ),
      isRecurring: Boolean(item.isRecurring),
      recurringGroupId: item.recurringGroupId,
      weekNumber: item.weekNumber,
      totalWeeks:
        item.totalWeeks || item.recurringWeeks || item.totalSessions || 0,
      apiSource: item,
    };

    return normalized;
  });

// tạo nhóm đặt sân lặp lại
export const buildRecurringGroups = (bookingList = []) => {
  const grouped = {};
  bookingList.forEach((booking) => {
    if (booking.isRecurring && booking.recurringGroupId) {
      if (!grouped[booking.recurringGroupId]) {
        grouped[booking.recurringGroupId] = {
          groupId: booking.recurringGroupId,
          fieldName: booking.fieldName,
          address: booking.address,
          time: booking.time,
          duration: booking.duration,
          price: booking.price,
          paymentMethod: booking.paymentMethod,
          totalWeeks: booking.totalWeeks || 0,
          bookings: [],
        };
      }
      grouped[booking.recurringGroupId].bookings.push(booking);
    }
  });
  return grouped;
};
