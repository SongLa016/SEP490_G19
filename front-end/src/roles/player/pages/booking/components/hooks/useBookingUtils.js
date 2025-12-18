import { useCallback } from "react";
import { Badge } from "../../../../../../shared/components/ui";
import {
  extractParticipants,
  filterParticipantsForDisplay,
  participantNeedsOwnerAction,
  isParticipantAcceptedByOwner,
} from "../utils";

/**
 * Hook chứa các utility functions cho BookingHistory
 */
export function useBookingUtils(bookingIdToRequest, scheduleDataMap) {
  // Kiểm tra nếu đặt sân chưa thanh toán
  const isPendingUnpaidWithin2Hours = useCallback((booking) => {
    if (!booking) return false;
    const statusLower = String(booking.status || booking.bookingStatus || "").toLowerCase();
    const paymentLower = String(booking.paymentStatus || "").toLowerCase();
    const isPendingOrConfirmed = statusLower === "pending" || statusLower === "confirmed";
    const isUnpaid = paymentLower === "unpaid" || paymentLower === "pending" || paymentLower === "";
    const isPaid = paymentLower === "paid" || paymentLower === "đã thanh toán";

    if (isPaid) return false;
    if (statusLower === "cancelled" || statusLower === "expired" || statusLower === "completed") return false;

    const hasActiveQR = booking.qrExpiresAt && new Date(booking.qrExpiresAt).getTime() > new Date().getTime();
    if (hasActiveQR && isUnpaid) return true;
    if (isPendingOrConfirmed && isUnpaid) return true;
    return false;
  }, []);

  // Kiểm tra nếu đặt sân có yêu cầu tham gia trận đấu
  const hasExistingMatchRequest = useCallback(
    (booking) => {
      if (!booking) return false;
      const hasMatchRequestId = booking.matchRequestId || booking.matchRequestID || booking.MatchRequestID;
      if (hasMatchRequestId) return true;
      if (booking.hasOpponent) return true;
      if (!booking.id) return false;
      const matchRequest = bookingIdToRequest[booking.id];
      return Boolean(matchRequest);
    },
    [bookingIdToRequest]
  );

  // Nút tìm đối thủ
  const shouldShowFindOpponentButton = useCallback(
    (booking) => {
      if (!booking) return false;
      const statusLower = String(booking.status || booking.bookingStatus || "").toLowerCase();
      const paymentLower = String(booking.paymentStatus || "").toLowerCase();

      const isPendingWaitingPayment =
        statusLower === "pending" && (paymentLower === "" || paymentLower === "pending" || paymentLower === "unpaid");
      const isPendingPaid = statusLower === "pending" && (paymentLower === "paid" || paymentLower === "đã thanh toán");
      const isCompleted = statusLower === "completed";
      const isCancelled = statusLower === "cancelled" || statusLower === "expired";

      if (isPendingWaitingPayment || isPendingPaid || isCompleted || isCancelled) return false;
      if (hasExistingMatchRequest(booking)) return false;
      return true;
    },
    [hasExistingMatchRequest]
  );

  // Chuẩn hóa trạng thái yêu cầu tham gia trận đấu
  const normalizeRequestStatus = useCallback((request) => {
    const raw = (request?.status || request?.state || "").toString().toLowerCase();
    if (raw.includes("match")) return "matched";
    if (raw.includes("pending") || raw.includes("waiting")) return "pending";
    if (raw.includes("expire")) return "expired";
    if (raw.includes("cancel")) return "cancelled";
    if (raw.includes("reject")) return "cancelled";
    if (raw.includes("open") || raw.includes("active")) return "open";

    const participants = extractParticipants(request);
    if (participants.some((p) => (p.status || "").toLowerCase() === "accepted")) {
      return "pending";
    }
    if (!raw || raw === "0") return "open";
    return raw;
  }, []);

  // Cấu hình badge yêu cầu tham gia trận đấu
  const getRequestBadgeConfig = useCallback(
    (request) => {
      const status = normalizeRequestStatus(request);
      const participants = filterParticipantsForDisplay(extractParticipants(request), request);
      const pendingCount = participants.filter(participantNeedsOwnerAction).length;
      const acceptedCount = participants.filter(isParticipantAcceptedByOwner).length;

      const configMap = {
        open: { text: "Đang mở ", className: "border-blue-200 text-blue-600 bg-blue-50" },
        pending: {
          text: acceptedCount > 0
            ? `Đang chờ xác nhận • ${acceptedCount} đội đã được duyệt`
            : `Đang chờ xác nhận${pendingCount ? ` • ${pendingCount} đội chờ duyệt` : ""}`,
          className: "border-amber-200 text-amber-700 bg-amber-50",
        },
        matched: { text: "Đã tìm được đối • Trận đấu đã xác nhận", className: "border-emerald-300 text-emerald-700 bg-emerald-50" },
        expired: { text: "Đã hết hạn", className: "border-gray-300 text-gray-600 bg-gray-50" },
        cancelled: { text: "Đã hủy", className: "border-red-300 text-red-600 bg-red-50" },
      };

      return { status, ...(configMap[status] || { text: "Đang mở", className: "border-blue-200 text-blue-600 bg-blue-50" }) };
    },
    [normalizeRequestStatus]
  );

  // Kiểm tra nếu yêu cầu tham gia trận đấu đã bị khóa
  const isRequestLocked = useCallback(
    (request) => {
      const status = normalizeRequestStatus(request);
      return status === "matched" || status === "expired" || status === "cancelled";
    },
    [normalizeRequestStatus]
  );

  // Lấy người tham gia đã được duyệt
  const getAcceptedParticipants = useCallback((request) => {
    const participants = filterParticipantsForDisplay(extractParticipants(request), request);
    return participants.filter(isParticipantAcceptedByOwner);
  }, []);

  // Kiểm tra nếu đặt sân cũ hơn 2 giờ
  const isBookingOlderThan2Hours = useCallback((booking) => {
    if (!booking || !booking.createdAt) return false;
    const now = new Date().getTime();
    const createdAt = new Date(booking.createdAt).getTime();
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    return now - createdAt > TWO_HOURS;
  }, []);

  // Trong 12h không hiện button hủy
  const shouldHideCancelButtonByDate = useCallback(
    (booking) => {
      if (!booking) return false;
      const scheduleData = booking.scheduleId ? scheduleDataMap[booking.scheduleId] : null;
      let matchDate = null;
      let matchTime = null;

      if (scheduleData && scheduleData.date) {
        try {
          const [year, month, day] = scheduleData.date.split("-").map(Number);
          if (year && month && day) {
            matchDate = new Date(year, month - 1, day);
          }
        } catch {
          // ignore
        }
      }

      if (!matchDate && booking.date) {
        try {
          if (booking.date.includes("/")) {
            const [d, m, y] = booking.date.split("/").map(Number);
            if (y && m && d) {
              matchDate = new Date(y, m - 1, d);
            }
          } else {
            matchDate = new Date(booking.date);
            if (isNaN(matchDate.getTime())) {
              matchDate = null;
            }
          }
        } catch {
          matchDate = null;
        }
      }

      if (scheduleData && scheduleData.startTime) {
        matchTime = scheduleData.startTime;
      } else if (booking.startTime) {
        matchTime = booking.startTime;
      } else if (booking.time) {
        const timeMatch = booking.time.match(/^(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          matchTime = `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
        }
      }

      if (!matchDate) return false;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const matchDateOnly = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());

      if (matchDateOnly < today) return true;

      if (matchDateOnly.getTime() === today.getTime() && matchTime) {
        try {
          const [hours, minutes] = matchTime.split(":").map(Number);
          if (!isNaN(hours) && !isNaN(minutes)) {
            const matchDateTime = new Date(matchDate);
            matchDateTime.setHours(hours, minutes, 0, 0);
            const nowTime = new Date().getTime();
            const matchTimeMs = matchDateTime.getTime();
            const TWELVE_HOURS = 12 * 60 * 60 * 1000;
            const timeUntilMatch = matchTimeMs - nowTime;
            if (timeUntilMatch < TWELVE_HOURS && timeUntilMatch > 0) {
              return true;
            }
          }
        } catch {
          // ignore
        }
      }

      return false;
    },
    [scheduleDataMap]
  );

  // Status badge
  const statusBadge = useCallback((status) => {
    const badgeMap = {
      confirmed: { variant: "default", className: "bg-teal-500 text-white border border-teal-200 hover:bg-teal-600", text: "Đã xác nhận" },
      completed: { variant: "secondary", className: "bg-teal-500 text-white border border-teal-200 hover:bg-teal-600", text: "Hoàn tất" },
      cancelled: { variant: "destructive", className: "bg-red-500 text-white border border-red-200 hover:bg-red-600", text: "Đã hủy" },
      pending: { variant: "outline", className: "bg-yellow-500 text-white border border-yellow-200 hover:bg-yellow-600", text: "Chờ xác nhận" },
      expired: { variant: "outline", className: "bg-gray-500 text-white border border-gray-200 hover:bg-gray-600", text: "Hủy do quá thời gian thanh toán" },
      reactive: { variant: "outline", className: "bg-blue-500 text-white border border-blue-200 hover:bg-blue-600", text: "Kích hoạt lại" },
    };
    const config = badgeMap[status] || { variant: "outline", className: "bg-gray-500 text-white border border-gray-200 hover:bg-gray-600", text: "Không rõ" };
    return <Badge variant={config.variant} className={config.className}>{config.text}</Badge>;
  }, []);

  // Payment status badge
  const paymentStatusBadge = useCallback((paymentStatus) => {
    const status = (paymentStatus ?? "").toString().toLowerCase();
    const badgeMap = {
      paid: { variant: "default", className: "bg-green-500 text-white border border-green-200 hover:bg-green-600", text: "Đã thanh toán" },
      refunded: { variant: "secondary", className: "bg-blue-500 text-white border border-blue-200 hover:bg-blue-600", text: "Đã hoàn tiền" },
    };
    const config = badgeMap[status] || { variant: "outline", className: "bg-yellow-500 text-white border border-yellow-200 hover:bg-yellow-600", text: "Chờ Thanh Toán" };
    return <Badge variant={config.variant} className={config.className}>{config.text}</Badge>;
  }, []);

  return {
    isPendingUnpaidWithin2Hours,
    hasExistingMatchRequest,
    shouldShowFindOpponentButton,
    normalizeRequestStatus,
    getRequestBadgeConfig,
    isRequestLocked,
    getAcceptedParticipants,
    isBookingOlderThan2Hours,
    shouldHideCancelButtonByDate,
    statusBadge,
    paymentStatusBadge,
  };
}

export default useBookingUtils;
