import { useState, useCallback } from "react";
import Swal from "sweetalert2";
import { generateQRCode, confirmPaymentAPI, fetchBookingsByPlayer } from "../../../../../../shared/index";
import { normalizeApiBookings, buildRecurringGroups, formatPrice } from "../utils";

/**
 * Hook quản lý thanh toán đặt sân
 */
export function useBookingPayment(playerId, setBookings, setGroupedBookings) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState(null);
  const [paymentQRCode, setPaymentQRCode] = useState(null);
  const [isLoadingQR, setIsLoadingQR] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);

  // Tiếp tục thanh toán
  const handleContinuePayment = useCallback(async (booking) => {
    if (!booking) return;
    setPaymentBooking(booking);
    setShowPaymentModal(true);
    setIsLoadingQR(true);
    setPaymentQRCode(null);

    try {
      const bookingId = booking.bookingId || booking.id;
      const result = await generateQRCode(bookingId, {
        paymentType: "deposit",
        amount: booking.depositAmount || booking.totalPrice || 0,
      });

      if (result.success) {
        const qrCodeUrl = result.qrCodeUrl || result.data?.qrCodeUrl || result.data?.qrCode;
        let qrExpiresAt = result.data?.qrExpiresAt || result.data?.QRExpiresAt || result.qrExpiresAt;
        if (!qrExpiresAt) {
          const defaultExpiry = new Date();
          defaultExpiry.setMinutes(defaultExpiry.getMinutes() + 10);
          qrExpiresAt = defaultExpiry.toISOString();
        }

        setPaymentQRCode(qrCodeUrl);
        setBookings((prevBookings) =>
          prevBookings.map((b) =>
            b.id === booking.id || b.bookingId === bookingId
              ? { ...b, qrExpiresAt, qrCode: qrCodeUrl }
              : b
          )
        );
        setPaymentBooking((prev) => (prev ? { ...prev, qrExpiresAt, qrCode: qrCodeUrl } : prev));
      } else {
        await Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: result.error || "Không thể tạo mã QR thanh toán",
          confirmButtonColor: "#ef4444",
        });
        setShowPaymentModal(false);
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
      await Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: error.message || "Không thể tạo mã QR thanh toán",
        confirmButtonColor: "#ef4444",
      });
      setShowPaymentModal(false);
    } finally {
      setIsLoadingQR(false);
    }
  }, [setBookings]);

  // Xác nhận thanh toán
  const handleConfirmPayment = useCallback(async () => {
    if (!paymentBooking) return;

    const confirmResult = await Swal.fire({
      title: "Xác nhận thanh toán",
      html: `
        <div class="text-left space-y-3">
          <p class="text-gray-700">Bạn có chắc chắn đã thanh toán thành công cho booking này?</p>
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p class="text-sm text-blue-800 font-semibold mb-2">📋 Thông tin booking:</p>
            <div class="text-sm text-blue-700 space-y-1">
              <p><strong>Sân:</strong> ${paymentBooking.fieldName}</p>
              <p><strong>Thời gian:</strong> ${paymentBooking.date} • ${paymentBooking.time}</p>
              <p><strong>Số tiền:</strong> <span class="font-bold text-green-600">${formatPrice(paymentBooking.depositAmount || paymentBooking.totalPrice || 0)}</span></p>
            </div>
          </div>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Đã thanh toán, xác nhận",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      width: "500px",
    });

    if (!confirmResult.isConfirmed) return;

    setIsConfirmingPayment(true);
    try {
      const bookingId = paymentBooking.bookingId || paymentBooking.id;
      Swal.fire({
        title: "Đang xử lý...",
        html: "Vui lòng đợi trong giây lát",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading(),
      });

      const result = await confirmPaymentAPI(bookingId);
      if (result.success) {
        Swal.close();
        await Swal.fire({
          icon: "success",
          title: "✅ Thanh toán thành công!",
          html: `
            <div class="text-left space-y-3">
              <p class="text-gray-700">Booking của bạn đã được thanh toán thành công!</p>
              <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="text-sm text-green-700 space-y-1">
                  <p><strong>Booking ID:</strong> #${bookingId}</p>
                  <p><strong>Sân:</strong> ${paymentBooking.fieldName}</p>
                  <p><strong>Số tiền đã thanh toán:</strong> <span class="font-bold">${formatPrice(paymentBooking.depositAmount || paymentBooking.totalPrice || 0)}</span></p>
                </div>
              </div>
            </div>
          `,
          confirmButtonText: "Đã hiểu",
          confirmButtonColor: "#10b981",
          width: "550px",
        });

        setShowPaymentModal(false);
        setPaymentBooking(null);
        setPaymentQRCode(null);

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
        Swal.close();
        await Swal.fire({
          icon: "error",
          title: "❌ Không thể xác nhận thanh toán",
          text: result.error || "Có lỗi xảy ra khi xác nhận thanh toán",
          confirmButtonColor: "#ef4444",
        });
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      Swal.close();
      await Swal.fire({
        icon: "error",
        title: "❌ Lỗi hệ thống",
        text: error.message || "Không thể xác nhận thanh toán. Vui lòng thử lại sau.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setIsConfirmingPayment(false);
    }
  }, [paymentBooking, playerId, setBookings, setGroupedBookings]);

  // Đóng modal thanh toán
  const closePaymentModal = useCallback(() => {
    setShowPaymentModal(false);
    setPaymentBooking(null);
    setPaymentQRCode(null);
  }, []);

  return {
    showPaymentModal,
    paymentBooking,
    paymentQRCode,
    isLoadingQR,
    isConfirmingPayment,
    handleContinuePayment,
    handleConfirmPayment,
    closePaymentModal,
  };
}

export default useBookingPayment;
