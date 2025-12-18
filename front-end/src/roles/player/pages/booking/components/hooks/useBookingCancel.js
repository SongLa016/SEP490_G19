import { useState, useCallback } from "react";
import Swal from "sweetalert2";
import { updateBooking, fetchBookingsByPlayer } from "../../../../../../shared/index";
import {
  cancelBooking as cancelBookingAPI,
  updateBookingStatus,
} from "../../../../../../shared/services/bookings";
import { updateFieldScheduleStatus } from "../../../../../../shared/services/fieldSchedules";
import { normalizeApiBookings, buildRecurringGroups, stripRefundQrInfo } from "../utils";

/**
 * Hook quản lý hủy đặt sân
 */
export function useBookingCancel(playerId, bookings, setBookings, groupedBookings, setGroupedBookings) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelBooking, setCancelBooking] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Mở modal hủy đặt sân
  const handleCancel = useCallback(
    (id) => {
      const booking = bookings.find((b) => b.id === id);
      if (booking) {
        setCancelBooking(booking);
        setShowCancelModal(true);
      }
    },
    [bookings]
  );

  // Xác nhận hủy đặt sân
  const handleConfirmCancel = useCallback(
    async (reason) => {
      if (!cancelBooking) return;

      setIsCancelling(true);
      try {
        const isPending =
          cancelBooking.status === "pending" ||
          cancelBooking.bookingStatus === "Pending" ||
          cancelBooking.bookingStatus === "pending";

        const bookingId = cancelBooking.bookingId || cancelBooking.id;
        if (!isPending && (!reason || !reason.trim())) {
          await Swal.fire({
            icon: "warning",
            title: "Thiếu thông tin",
            text: "Vui lòng nhập lý do hủy.",
            confirmButtonColor: "#ef4444",
          });
          setIsCancelling(false);
          return;
        }

        const scheduleId =
          cancelBooking?.scheduleId ||
          cancelBooking?.scheduleID ||
          cancelBooking?.ScheduleID ||
          cancelBooking?.ScheduleId ||
          cancelBooking?.apiSource?.scheduleId ||
          cancelBooking?.apiSource?.scheduleID;

        let result;
        if (isPending) {
          result = await updateBookingStatus(bookingId, "Canceled");
          if (!result.success) {
            result = await cancelBookingAPI(bookingId, reason || "Hủy booking chưa được xác nhận");
          } else {
            result.message = "Đã hủy booking thành công!";
          }
        } else {
          result = await cancelBookingAPI(bookingId, reason || "Hủy booking");
        }

        if (result.success) {
          const responseScheduleId =
            result.data?.scheduleId ||
            result.data?.scheduleID ||
            result.data?.ScheduleID ||
            result.data?.booking?.scheduleId;

          const finalScheduleId = scheduleId || responseScheduleId;

          if (finalScheduleId && Number(finalScheduleId) > 0) {
            try {
              await updateFieldScheduleStatus(Number(finalScheduleId), "Available");
            } catch (error) {
              console.error(`Error updating schedule ${finalScheduleId}:`, error);
            }
          }

          const bookingKey = String(cancelBooking.id || cancelBooking.bookingId);
          const refundInfo = {
            message: result.message || result.data?.message,
            cancelReason: result.cancelReason || result.data?.cancelReason,
          };
          const cleanReason = stripRefundQrInfo(refundInfo.cancelReason || result.data?.cancelReason || "");

          if (bookingKey) {
            setBookings((prev) => {
              const updated = prev.map((b) => {
                const key = String(b.id || b.bookingId);
                if (key !== bookingKey) return b;
                return {
                  ...b,
                  status: "cancelled",
                  bookingStatus: "cancelled",
                  cancelReason: cleanReason || b.cancelReason,
                  cancelledAt: new Date().toISOString(),
                  paymentStatus: result.data?.paymentStatus || b.paymentStatus,
                };
              });
              setGroupedBookings(buildRecurringGroups(updated));
              return updated;
            });
          }

          let successHtml = `<p class="mb-3">${refundInfo.message || "Đã hủy booking thành công!"}</p>`;
          if (cleanReason) {
            successHtml += `<div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 text-left"><p class="text-sm text-blue-800">${cleanReason}</p></div>`;
          }

          setShowCancelModal(false);
          setCancelBooking(null);

          await Swal.fire({
            icon: "success",
            title: "Đã hủy thành công!",
            html: successHtml,
            confirmButtonColor: "#10b981",
            width: "500px",
          });

          // Làm mới đặt sân
          if (playerId) {
            const apiResult = await fetchBookingsByPlayer(playerId);
            if (apiResult.success) {
              const bookingList = normalizeApiBookings(apiResult.data);
              setBookings(bookingList);
              setGroupedBookings(buildRecurringGroups(bookingList));
            }
          }
        } else {
          throw new Error(result.error || "Không thể hủy booking");
        }
      } catch (error) {
        console.error("Error cancelling booking:", error);
        await Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: error.message || "Không thể hủy đặt sân. Vui lòng thử lại.",
          confirmButtonColor: "#ef4444",
        });
      } finally {
        setIsCancelling(false);
      }
    },
    [cancelBooking, playerId, setBookings, setGroupedBookings]
  );

  // Hủy lịch định kỳ
  const handleCancelRecurring = useCallback(
    (groupId) => {
      Swal.fire({
        title: "Xác nhận hủy lịch định kỳ",
        text: "Bạn có chắc muốn hủy toàn bộ lịch định kỳ này?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Xác nhận hủy",
        cancelButtonText: "Hủy",
      }).then((result) => {
        if (result.isConfirmed) {
          const group = groupedBookings[groupId];
          group.bookings.forEach((booking) => {
            updateBooking(booking.id, { status: "cancelled" });
          });
          setBookings((prev) =>
            prev.map((booking) =>
              group.bookings.some((b) => b.id === booking.id)
                ? { ...booking, status: "cancelled" }
                : booking
            )
          );
          Swal.fire("Đã hủy!", "Toàn bộ lịch định kỳ đã được hủy.", "success");
        }
      });
    },
    [groupedBookings, setBookings]
  );

  // Hủy một buổi trong lịch định kỳ
  const handleCancelSingleRecurring = useCallback(
    (id) => {
      const booking = bookings.find((b) => b.id === id);
      if (booking) {
        setCancelBooking(booking);
        setShowCancelModal(true);
      }
    },
    [bookings]
  );

  // Đóng modal hủy
  const closeCancelModal = useCallback(() => {
    setShowCancelModal(false);
    setCancelBooking(null);
  }, []);

  return {
    showCancelModal,
    cancelBooking,
    isCancelling,
    handleCancel,
    handleConfirmCancel,
    handleCancelRecurring,
    handleCancelSingleRecurring,
    closeCancelModal,
  };
}

export default useBookingCancel;
