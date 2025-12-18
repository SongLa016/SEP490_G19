import { useState, useCallback, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { generateQRCode, confirmPaymentAPI, fetchBookingsByPlayer } from "../../../../../../shared/index";
import { normalizeApiBookings, buildRecurringGroups, formatPrice } from "../utils";

/**
 * Hook quản lý thanh toán đặt sân
 */
export function useBookingPayment(playerId, setBookings, setGroupedBookings, scheduleDataMap = {}) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState(null);
  const [paymentQRCode, setPaymentQRCode] = useState(null);
  const [isLoadingQR, setIsLoadingQR] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [paymentCountdown, setPaymentCountdown] = useState(0); // Countdown tính bằng milliseconds
  const countdownIntervalRef = useRef(null);

  // Kiểm tra QR code còn hạn không
  const isQRCodeValid = (qrExpiresAt) => {
    if (!qrExpiresAt) return false;
    const expiryTime = new Date(qrExpiresAt).getTime();
    const now = Date.now();
    // QR còn hạn nếu chưa hết hạn (có thể thêm buffer 1 phút)
    return expiryTime > now + 60000; // còn ít nhất 1 phút
  };

  // Bắt đầu countdown timer
  const startCountdown = useCallback((qrExpiresAt) => {
    // Clear interval cũ nếu có
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    if (!qrExpiresAt) {
      setPaymentCountdown(0);
      return;
    }

    const expiryTime = new Date(qrExpiresAt).getTime();
    
    // Cập nhật countdown ngay lập tức
    const updateCountdown = () => {
      const now = Date.now();
      const remaining = Math.max(0, expiryTime - now);
      setPaymentCountdown(remaining);
      
      // Nếu hết thời gian, dừng interval
      if (remaining <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
      }
    };

    updateCountdown();
    // Cập nhật mỗi giây
    countdownIntervalRef.current = setInterval(updateCountdown, 1000);
  }, []);

  // Dừng countdown khi đóng modal
  const stopCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setPaymentCountdown(0);
  }, []);

  // Cleanup interval khi unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Helper: Lấy thông tin ngày giờ từ scheduleDataMap
  const getScheduleDateTime = useCallback((booking) => {
    if (!booking?.scheduleId || !scheduleDataMap) return { scheduleDate: null, scheduleTime: null };
    
    const scheduleData = scheduleDataMap[booking.scheduleId];
    if (!scheduleData) return { scheduleDate: null, scheduleTime: null };

    // Lấy date từ schedule
    let scheduleDate = null;
    if (scheduleData.date) {
      if (typeof scheduleData.date === 'string') {
        // Format: "2025-12-01" -> "01/12/2025"
        const dateParts = scheduleData.date.split('T')[0].split('-');
        if (dateParts.length === 3) {
          scheduleDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
        } else {
          scheduleDate = scheduleData.date;
        }
      } else if (scheduleData.date.year && scheduleData.date.month && scheduleData.date.day) {
        scheduleDate = `${String(scheduleData.date.day).padStart(2, '0')}/${String(scheduleData.date.month).padStart(2, '0')}/${scheduleData.date.year}`;
      }
    }

    // Lấy time từ schedule (startTime - endTime)
    let scheduleTime = null;
    const startTime = scheduleData.startTime;
    const endTime = scheduleData.endTime;
    
    if (startTime && endTime) {
      // Format time string (có thể là "07:15:00" hoặc "07:15")
      const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const parts = String(timeStr).split(':');
        return `${parts[0]}:${parts[1]}`;
      };
      scheduleTime = `${formatTime(startTime)} - ${formatTime(endTime)}`;
    } else if (scheduleData.slotName) {
      scheduleTime = scheduleData.slotName;
    }

    return { scheduleDate, scheduleTime };
  }, [scheduleDataMap]);

  // Tiếp tục thanh toán
  const handleContinuePayment = useCallback(async (booking) => {
    if (!booking) return;
    
    // Lấy thông tin ngày giờ từ scheduleDataMap
    const { scheduleDate, scheduleTime } = getScheduleDateTime(booking);
    
    // Kiểm tra paymentStatus để tính số tiền cần thanh toán
    const paymentStatus = (booking.paymentStatus || "").toLowerCase();
    const isDepositPaid = paymentStatus === "partiallypaid" || paymentStatus === "deposit" || paymentStatus === "deposited";
    
    const depositAmount = booking.depositAmount || 0;
    const totalPrice = booking.totalPrice || booking.price || 0;
    const remainingAmount = Math.max(0, totalPrice - depositAmount);
    
    // Số tiền cần thanh toán: nếu đã cọc thì thanh toán số còn lại, nếu chưa thì thanh toán tiền cọc
    const amountToPay = isDepositPaid ? remainingAmount : depositAmount;
    
    // Tạo booking với thông tin ngày giờ từ schedule và số tiền cần thanh toán
    const enrichedBooking = {
      ...booking,
      scheduleDate: scheduleDate || booking.date,
      scheduleTime: scheduleTime || booking.time,
      amountToPay: amountToPay, // Số tiền cần thanh toán
      isDepositPaid: isDepositPaid, // Đã thanh toán cọc chưa
    };
    
    console.log("📱 [QR] enrichedBooking:", {
      bookingId: booking.bookingId || booking.id,
      paymentStatus,
      isDepositPaid,
      depositAmount,
      totalPrice,
      remainingAmount,
      amountToPay
    });
    
    setPaymentBooking(enrichedBooking);
    setShowPaymentModal(true);
    setIsLoadingQR(true);
    setPaymentQRCode(null);

    try {
      const bookingId = booking.bookingId || booking.id;
      
      // Lấy qrCodeUrl từ API response gốc (apiSource) nếu có
      // API createBooking trả về qrCodeUrl trong response.data
      const apiSource = booking.apiSource || {};
      const existingQrCodeUrl = apiSource.qrCodeUrl || apiSource.QRCodeUrl || apiSource.qrCode || apiSource.QRCode 
        || booking.qrCodeUrl || booking.qrCode;
      const existingQrExpiresAt = apiSource.qrExpiresAt || apiSource.QRExpiresAt || apiSource.qrExpiry || apiSource.QRExpiry
        || booking.qrExpiresAt || booking.QRExpiresAt;
      
      // Helper: Kiểm tra QR code có đúng số tiền không (parse từ URL)
      const isQRAmountCorrect = (qrUrl, expectedAmount) => {
        if (!qrUrl || !expectedAmount) return false;
        try {
          // Parse amount từ URL: ?amount=105000
          const url = new URL(qrUrl);
          const qrAmount = url.searchParams.get('amount');
          if (qrAmount) {
            const parsedAmount = parseInt(qrAmount, 10);
            console.log("📱 [QR] Kiểm tra amount trong QR:", parsedAmount, "expected:", expectedAmount);
            return parsedAmount === expectedAmount;
          }
        } catch (e) {
          console.warn("📱 [QR] Không thể parse URL:", e);
        }
        return false;
      };
      
      // Kiểm tra nếu booking đã có qrCodeUrl, còn hạn VÀ đúng số tiền thì sử dụng luôn
      const qrAmountMatches = isQRAmountCorrect(existingQrCodeUrl, amountToPay);
      
      if (existingQrCodeUrl && isQRCodeValid(existingQrExpiresAt) && qrAmountMatches) {
        // Sử dụng QR code đã có từ khi tạo booking (đúng số tiền)
        console.log("📱 [QR] Sử dụng QR code có sẵn từ API (đúng số tiền):", existingQrCodeUrl);
        setPaymentQRCode(existingQrCodeUrl);
        setPaymentBooking((prev) => (prev ? { ...prev, qrExpiresAt: existingQrExpiresAt, qrCode: existingQrCodeUrl } : prev));
        startCountdown(existingQrExpiresAt);
        setIsLoadingQR(false);
        return;
      }
      
      // Log lý do không sử dụng QR có sẵn
      if (existingQrCodeUrl) {
        if (!isQRCodeValid(existingQrExpiresAt)) {
          console.log("📱 [QR] QR có sẵn đã hết hạn, cần tạo mới");
        } else if (!qrAmountMatches) {
          console.log("📱 [QR] QR có sẵn không đúng số tiền cần thanh toán, cần tạo mới");
        }
      }

      // Nếu không có QR, QR đã hết hạn, hoặc QR không đúng số tiền -> gọi API tạo mới
      const paymentType = isDepositPaid ? "remaining" : "deposit";
      
      console.log("📱 [QR] Gọi API tạo QR mới với bookingId:", bookingId);
      console.log("📱 [QR] paymentStatus:", paymentStatus, "isDepositPaid:", isDepositPaid);
      console.log("📱 [QR] paymentType:", paymentType, "amount:", amountToPay);
      console.log("📱 [QR] depositAmount:", depositAmount, "totalPrice:", totalPrice, "remainingAmount:", remainingAmount);
      
      const result = await generateQRCode(bookingId, {
        paymentType: paymentType,
        amount: amountToPay,
      });

      if (result.success) {
        // Ưu tiên lấy qrCodeUrl từ response
        const qrCodeUrl = result.qrCodeUrl || result.data?.qrCodeUrl || result.data?.QRCodeUrl 
          || result.data?.qrCode || result.data?.QRCode;
        let qrExpiresAt = result.data?.qrExpiresAt || result.data?.QRExpiresAt 
          || result.data?.qrExpiry || result.qrExpiresAt;
        
        if (!qrExpiresAt) {
          const defaultExpiry = new Date();
          defaultExpiry.setMinutes(defaultExpiry.getMinutes() + 10);
          qrExpiresAt = defaultExpiry.toISOString();
        }

        console.log("📱 [QR] Nhận được QR code mới:", qrCodeUrl);
        setPaymentQRCode(qrCodeUrl);
        setBookings((prevBookings) =>
          prevBookings.map((b) =>
            b.id === booking.id || b.bookingId === bookingId
              ? { ...b, qrExpiresAt, qrCode: qrCodeUrl, qrCodeUrl: qrCodeUrl }
              : b
          )
        );
        setPaymentBooking((prev) => (prev ? { ...prev, qrExpiresAt, qrCode: qrCodeUrl, qrCodeUrl: qrCodeUrl } : prev));
        startCountdown(qrExpiresAt);
      } else {
        console.error("❌ [QR] Lỗi tạo QR:", result.error);
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
  }, [setBookings, startCountdown, getScheduleDateTime]);

  // Xác nhận thanh toán
  const handleConfirmPayment = useCallback(async () => {
    if (!paymentBooking) return;

    const amountToPay = paymentBooking.amountToPay || paymentBooking.depositAmount || paymentBooking.totalPrice || 0;
    const confirmResult = await Swal.fire({
      title: "Xác nhận thanh toán",
      html: `
        <div class="text-left space-y-3">
          <p class="text-gray-700">Bạn có chắc chắn đã thanh toán thành công cho booking này?</p>
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p class="text-sm text-blue-800 font-semibold mb-2">📋 Thông tin booking:</p>
            <div class="text-sm text-blue-700 space-y-1">
              <p><strong>Sân:</strong> ${paymentBooking.fieldName}</p>
              <p><strong>Thời gian:</strong> ${paymentBooking.scheduleDate || paymentBooking.date} • ${paymentBooking.scheduleTime || paymentBooking.time}</p>
              <p><strong>Số tiền:</strong> <span class="font-bold text-green-600">${formatPrice(amountToPay)}</span></p>
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

      const result = await confirmPaymentAPI(bookingId, amountToPay);
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
                  <p><strong>Số tiền đã thanh toán:</strong> <span class="font-bold">${formatPrice(amountToPay)}</span></p>
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
    stopCountdown();
  }, [stopCountdown]);

  return {
    showPaymentModal,
    paymentBooking,
    paymentQRCode,
    isLoadingQR,
    isConfirmingPayment,
    paymentCountdown,
    handleContinuePayment,
    handleConfirmPayment,
    closePaymentModal,
  };
}

export default useBookingPayment;
