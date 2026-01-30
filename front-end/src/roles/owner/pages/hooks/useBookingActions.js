import { useCallback, useState } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import {
  cancelBooking,
  fetchCancellationRequests,
  confirmCancellation,
  deleteCancellationRequest,
  fetchBookingsByOwner,
  confirmPaymentAPI,
  confirmByOwner,
  fetchCancellationRequestById,
} from "../../../../shared/services/bookings";
import { fetchFieldScheduleById, updateFieldScheduleStatus } from "../../../../shared/services/fieldSchedules";
import { API_BASE_URL } from "../../../../shared/config/api";

// Lấy thông tin profile người chơi
const fetchPlayerProfile = async (playerId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(
      `${API_BASE_URL}/api/PlayerProfile/${playerId}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );
    const profileData = response.data || {};
    return { ok: true, data: profileData, profile: profileData };
  } catch (error) {
    console.error(`Failed to fetch player profile ${playerId}:`, error);
    return { ok: false, reason: error.message || "Lấy thông tin khách hàng thất bại" };
  }
};

export const useBookingActions = ({
  ownerId,
  isDemo,
  bookings,
  setBookings,
  setShowDemoRestrictedModal,
  formatCurrency,
  formatDate,
  getStatusText,
  getPaymentStatusText,
}) => {
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [cancellationRequests, setCancellationRequests] = useState([]);
  const [loadingCancellations, setLoadingCancellations] = useState(false);
  const [autoCompletedIds, setAutoCompletedIds] = useState({});
  const [exporting, setExporting] = useState(false);

  // Chuẩn hóa dữ liệu booking từ API
  const normalizeBookingData = useCallback((apiBookings = []) => {
    return apiBookings.map((item, index) => {
      let startTime = null;
      let endTime = null;
      if (item.startTime) {
        const startDate = new Date(item.startTime);
        if (!isNaN(startDate.getTime())) startTime = startDate;
      }
      if (item.endTime) {
        const endDate = new Date(item.endTime);
        if (!isNaN(endDate.getTime())) endTime = endDate;
      }

      let bookingDate = '';
      if (item.date) {
        if (typeof item.date === 'string' && item.date.match(/^\d{4}-\d{2}-\d{2}/)) {
          bookingDate = item.date.split('T')[0];
        } else {
          const dateObj = new Date(item.date);
          if (!isNaN(dateObj.getTime())) {
            bookingDate = dateObj.toISOString().split('T')[0];
          }
        }
      } else if (startTime && !isNaN(startTime.getTime())) {
        bookingDate = startTime.toISOString().split('T')[0];
      }

      let timeSlot = '';
      if (startTime && endTime && !isNaN(startTime.getTime()) && !isNaN(endTime.getTime())) {
        try {
          const startTimeStr = startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
          const endTimeStr = endTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
          timeSlot = `${startTimeStr} - ${endTimeStr}`;
        } catch (error) {
          console.error('Error formatting time slot:', error);
        }
      }
      if (!timeSlot && item.startTime && item.endTime) {
        try {
          const startTimeStr = typeof item.startTime === 'string' ? item.startTime.substring(0, 5) : item.startTime;
          const endTimeStr = typeof item.endTime === 'string' ? item.endTime.substring(0, 5) : item.endTime;
          if (startTimeStr && endTimeStr) timeSlot = `${startTimeStr} - ${endTimeStr}`;
        } catch (error) {
          console.error('Error formatting time slot from strings:', error);
        }
      }
      if (!timeSlot) timeSlot = item.slotName || item.SlotName || item.timeSlot || '';

      const rawStatus = item.bookingStatus || item.BookingStatus || item.status || item.Status || 'pending';
      const status = String(rawStatus).toLowerCase();

      let normalizedStatus;
      if (status.includes('cancel')) normalizedStatus = 'cancelled';
      else if (status === 'completed' || status.includes('complete')) normalizedStatus = 'completed';
      else if (status === 'confirmed' || status.includes('confirm')) normalizedStatus = 'confirmed';
      else if (status.includes('pending')) normalizedStatus = 'pending';
      else normalizedStatus = status;

      const rawPaymentStatus = item.paymentStatus || item.PaymentStatus || 'pending';
      const paymentStatus = String(rawPaymentStatus).toLowerCase().trim();

      let normalizedPaymentStatus;
      if (paymentStatus === 'unpaid') normalizedPaymentStatus = 'unpaid';
      else if (paymentStatus === 'paid') normalizedPaymentStatus = 'paid';
      else if (paymentStatus.includes('unpaid')) normalizedPaymentStatus = 'unpaid';
      else if (paymentStatus.includes('paid')) normalizedPaymentStatus = 'paid';
      else if (paymentStatus.includes('refund')) normalizedPaymentStatus = 'refunded';
      else if (paymentStatus.includes('fail')) normalizedPaymentStatus = 'failed';
      else normalizedPaymentStatus = 'pending';

      const rawBookingId = item.bookingId || item.bookingID || item.id;
      const numericBookingId = rawBookingId ? Number(rawBookingId) : null;
      const fieldName = item.fieldName || item.FieldName || item.field || "Chưa rõ sân";
      const slotName = item.slotName || item.SlotName || item.timeSlot || '';
      const finalTimeSlot = slotName || timeSlot;

      return {
        id: numericBookingId ? String(numericBookingId) : `booking-${index}`,
        bookingId: numericBookingId,
        field: fieldName,
        customer: item.customerName || item.customer || item.userName || "Khách hàng",
        phone: item.customerPhone || item.phone || item.Phone || "",
        email: item.customerEmail || item.email || item.Email || "",
        date: bookingDate,
        timeSlot: finalTimeSlot,
        status: normalizedStatus,
        amount: Number(item.totalPrice || item.price || 0),
        paymentStatus: normalizedPaymentStatus,
        createdAt: (() => {
          if (item.createdAt) {
            const createdDate = new Date(item.createdAt);
            if (!isNaN(createdDate.getTime())) return createdDate.toISOString();
          }
          if (item.createdDate) {
            const createdDate = new Date(item.createdDate);
            if (!isNaN(createdDate.getTime())) return createdDate.toISOString();
          }
          return new Date().toISOString();
        })(),
        notes: item.notes || item.note || "",
        userId: item.userId || item.userID,
        scheduleId: item.scheduleId || item.scheduleID,
        depositAmount: Number(item.depositAmount || 0),
        hasOpponent: Boolean(item.hasOpponent),
        address: item.complexName || item.address || "",
        startTime: startTime && !isNaN(startTime.getTime()) ? startTime.toISOString() : null,
        endTime: endTime && !isNaN(endTime.getTime()) ? endTime.toISOString() : null,
        originalStatus: rawStatus
      };
    });
  }, []);

  // Tải danh sách booking
  const loadBookings = useCallback(async () => {
    if (!ownerId) {
      setBookings([]);
      return;
    }

    setLoadingBookings(true);
    setBookingError("");
    try {
      const result = await fetchBookingsByOwner(ownerId);
      if (result.success) {
        const bookingsWithUserInfo = await Promise.all(
          result.data.map(async (booking) => {
            let enrichedBooking = { ...booking };
            if (booking.userId || booking.userID) {
              try {
                const userId = booking.userId || booking.userID;
                const userResult = await fetchPlayerProfile(userId);
                if (userResult.ok && userResult.data) {
                  const userData = userResult.profile || userResult.data;
                  enrichedBooking = {
                    ...enrichedBooking,
                    customerName: userData.fullName || userData.name || userData.userName || 'Khách hàng',
                    customerPhone: userData.phone || userData.Phone || userData.phoneNumber || '',
                    customerEmail: userData.email || userData.Email || '',
                  };
                }
              } catch (error) {
                console.error(`Failed to fetch customer profile:`, error);
              }
            }

            const scheduleId = booking.scheduleId || booking.scheduleID || booking.ScheduleID;
            if (scheduleId) {
              try {
                const scheduleResult = await fetchFieldScheduleById(scheduleId);
                if (scheduleResult.success && scheduleResult.data) {
                  const scheduleData = scheduleResult.data;
                  const scheduleDate = scheduleData.date || scheduleData.Date || enrichedBooking.date;
                  const scheduleStartTime = scheduleData.startTime || scheduleData.StartTime;
                  const scheduleEndTime = scheduleData.endTime || scheduleData.EndTime;

                  if (scheduleDate && scheduleStartTime && scheduleEndTime) {
                    let dateStr = '';
                    if (typeof scheduleDate === 'string') {
                      dateStr = scheduleDate.split('T')[0];
                    } else if (scheduleDate.year) {
                      dateStr = `${scheduleDate.year}-${String(scheduleDate.month).padStart(2, '0')}-${String(scheduleDate.day).padStart(2, '0')}`;
                    }

                    const startTimeStr = typeof scheduleStartTime === 'string'
                      ? scheduleStartTime.substring(0, 5)
                      : `${String(scheduleStartTime.hour || 0).padStart(2, '0')}:${String(scheduleStartTime.minute || 0).padStart(2, '0')}`;

                    const endTimeStr = typeof scheduleEndTime === 'string'
                      ? scheduleEndTime.substring(0, 5)
                      : `${String(scheduleEndTime.hour || 0).padStart(2, '0')}:${String(scheduleEndTime.minute || 0).padStart(2, '0')}`;

                    if (dateStr) {
                      enrichedBooking.startTime = `${dateStr}T${startTimeStr}:00`;
                      enrichedBooking.endTime = `${dateStr}T${endTimeStr}:00`;
                    }
                  }
                }
              } catch (error) {
                console.error(`Failed to fetch schedule:`, error);
              }
            }

            return enrichedBooking;
          })
        );

        const normalizedBookings = normalizeBookingData(bookingsWithUserInfo);
        setBookings(normalizedBookings);
      } else {
        console.warn("Failed to load bookings:", result.error);
        setBookingError(result.error || "Không thể tải danh sách booking");
        setBookings([]);
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
      setBookingError(error.message || "Có lỗi xảy ra khi tải booking");
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }, [ownerId, setBookings, normalizeBookingData]);

  // Tải danh sách yêu cầu hủy
  const loadCancellationRequests = useCallback(async () => {
    setLoadingCancellations(true);
    try {
      const result = await fetchCancellationRequests();
      if (result.success) {
        setCancellationRequests(result.data || []);
      } else {
        console.error('Error loading cancellations:', result.error);
      }
    } catch (error) {
      console.error('Error loading cancellations:', error);
    } finally {
      setLoadingCancellations(false);
    }
  }, []);

  // Xác nhận booking
  const handleConfirmBooking = useCallback(async (bookingId) => {
    if (isDemo) {
      setShowDemoRestrictedModal(true);
      return;
    }

    const numericBookingId = Number(bookingId);
    if (isNaN(numericBookingId) || numericBookingId <= 0) {
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Booking ID không hợp lệ',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    const booking = bookings.find(b => (b.bookingId || b.id) === numericBookingId);
    if (booking) {
      if (booking.status === 'completed') {
        await Swal.fire({
          icon: 'warning',
          title: 'Đã hoàn thành',
          text: 'Booking này đã hoàn thành rồi.',
          confirmButtonColor: '#10b981'
        });
        loadBookings();
        return;
      }

      if (booking.status === 'cancelled') {
        await Swal.fire({
          icon: 'error',
          title: 'Không thể xác nhận',
          text: 'Không thể xác nhận booking đã bị hủy.',
          confirmButtonColor: '#ef4444'
        });
        return;
      }
    }

    const isPending = booking?.status === 'pending';
    const paymentStatusLower = String(booking?.paymentStatus || '').toLowerCase();
    const isPaid = paymentStatusLower === 'paid';
    const isPendingAndPaid = isPending && isPaid;

    const dialogTitle = isPendingAndPaid ? 'Hoàn thành booking' : 'Xác nhận thanh toán';
    const dialogMessage = isPendingAndPaid
      ? 'Bạn có chắc muốn hoàn thành booking này?'
      : 'Bạn có chắc muốn xác nhận thanh toán cho booking này?';
    const confirmButtonText = isPendingAndPaid ? 'Hoàn thành' : 'Xác nhận thanh toán';

    const result = await Swal.fire({
      title: dialogTitle,
      html: `
        <div class="text-left">
          <p class="mb-3">${dialogMessage}</p>
          ${booking ? `
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
              <p class="text-sm text-blue-800 font-semibold mb-1">📋 Thông tin booking:</p>
              <div class="text-xs text-blue-700 space-y-1">
                <p><strong>Khách hàng:</strong> ${booking.customer}</p>
                <p><strong>Sân:</strong> ${booking.field}</p>
                <p><strong>Ngày:</strong> ${formatDate(booking.date)}</p>
                <p><strong>Giờ:</strong> ${booking.timeSlot}</p>
                <p><strong>Số tiền:</strong> <span class="font-bold text-green-600">${formatCurrency(booking.amount)}</span></p>
              </div>
            </div>
          ` : ''}
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: confirmButtonText,
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
    });

    if (result.isConfirmed) {
      try {
        let confirmResult;
        if (isPendingAndPaid) {
          confirmResult = await confirmByOwner(numericBookingId);
        } else {
          const amount = booking?.amount || 0;
          confirmResult = await confirmPaymentAPI(numericBookingId, amount);
          if (confirmResult.success && (booking?.scheduleId || booking?.scheduleID)) {
            const scheduleId = booking.scheduleId || booking.scheduleID;
            try {
              await updateFieldScheduleStatus(Number(scheduleId), "Booked");
            } catch (error) {
              console.error(`Error updating schedule:`, error);
            }
          }
        }

        if (confirmResult.success) {
          await Swal.fire({
            icon: 'success',
            title: isPendingAndPaid ? 'Đã hoàn thành!' : 'Đã xác nhận thanh toán!',
            text: confirmResult.message || 'Thao tác thành công.',
            confirmButtonColor: '#10b981'
          });
          await loadBookings();
        } else {
          await Swal.fire({
            icon: 'error',
            title: 'Lỗi',
            text: confirmResult.error || 'Có lỗi xảy ra',
            confirmButtonColor: '#ef4444'
          });
          loadBookings();
        }
      } catch (error) {
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Có lỗi xảy ra. Vui lòng thử lại.',
          confirmButtonColor: '#ef4444'
        });
        loadBookings();
      }
    }
  }, [isDemo, bookings, setShowDemoRestrictedModal, formatCurrency, formatDate, loadBookings]);

  // Hủy booking
  const handleCancelBooking = useCallback(async (bookingId) => {
    if (isDemo) {
      setShowDemoRestrictedModal(true);
      return;
    }

    const numericBookingId = Number(bookingId);
    if (isNaN(numericBookingId) || numericBookingId <= 0) {
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Booking ID không hợp lệ',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    const booking = bookings.find(b => (b.bookingId || b.id) === numericBookingId);

    const { value: reason, isConfirmed } = await Swal.fire({
      title: 'Hủy booking',
      html: `
        <div class="text-left">
          <p class="text-sm text-gray-700 mb-1">Vui lòng nhập lý do hủy booking:</p>
          <textarea 
            id="cancel-reason" 
            class="w-full p-3 border text-gray-700 text-sm border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500" 
            rows="3" 
            placeholder="Ví dụ: Sân bị hỏng, thời tiết xấu, khách hàng yêu cầu..."
          ></textarea>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận hủy',
      cancelButtonText: 'Đóng',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      preConfirm: () => {
        const reason = document.getElementById('cancel-reason').value;
        if (!reason || !reason.trim()) {
          Swal.showValidationMessage('Vui lòng nhập lý do hủy');
          return false;
        }
        return reason;
      }
    });

    if (isConfirmed && reason) {
      try {
        const scheduleId = booking?.scheduleId || booking?.scheduleID;
        const result = await cancelBooking(numericBookingId, reason);

        if (result.success) {
          const finalScheduleId = scheduleId || result.data?.scheduleId;
          if (finalScheduleId && Number(finalScheduleId) > 0) {
            try {
              await updateFieldScheduleStatus(Number(finalScheduleId), "Available");
            } catch (error) {
              console.error(`Error updating schedule:`, error);
            }
          }

          const cancellationId = result.data?.cancellationId || result.data?.id;
          if (cancellationId) {
            try {
              await confirmCancellation(cancellationId);
            } catch (confirmError) {
              console.warn("Error auto-confirming cancellation:", confirmError);
            }
          }

          await Swal.fire({
            icon: 'success',
            title: 'Đã hủy booking thành công!',
            text: result.message || 'Booking đã được hủy.',
            confirmButtonColor: '#10b981'
          });
          await loadBookings();
          loadCancellationRequests();
        } else {
          await Swal.fire({
            icon: 'error',
            title: 'Không thể hủy booking',
            text: result.error || 'Có lỗi xảy ra',
            confirmButtonColor: '#ef4444'
          });
        }
      } catch (error) {
        console.error('Error cancelling booking:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: error.message || 'Có lỗi xảy ra khi hủy booking',
          confirmButtonColor: '#ef4444'
        });
      }
    }
  }, [isDemo, bookings, setShowDemoRestrictedModal, loadBookings, loadCancellationRequests]);

  // Xác nhận yêu cầu hủy
  const handleConfirmCancellation = useCallback(async (cancellationId) => {
    const result = await Swal.fire({
      title: 'Xác nhận hủy booking',
      text: 'Bạn có chắc muốn xác nhận yêu cầu hủy này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
    });

    if (result.isConfirmed) {
      try {
        const confirmResult = await confirmCancellation(cancellationId);
        if (confirmResult.success) {
          await Swal.fire({
            icon: 'success',
            title: 'Đã xác nhận!',
            text: 'Yêu cầu hủy đã được xác nhận',
            confirmButtonColor: '#10b981'
          });
          loadCancellationRequests();
          await loadBookings();
        } else {
          await Swal.fire({
            icon: 'error',
            title: 'Lỗi',
            text: confirmResult.error || 'Không thể xác nhận',
            confirmButtonColor: '#ef4444'
          });
        }
      } catch (error) {
        console.error('Error confirming cancellation:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Có lỗi xảy ra',
          confirmButtonColor: '#ef4444'
        });
      }
    }
  }, [loadCancellationRequests, loadBookings]);

  // Xóa yêu cầu hủy
  const handleDeleteCancellation = useCallback(async (cancellationId) => {
    const result = await Swal.fire({
      title: 'Xóa yêu cầu hủy',
      text: 'Bạn có chắc muốn xóa yêu cầu này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
    });

    if (result.isConfirmed) {
      try {
        const deleteResult = await deleteCancellationRequest(cancellationId);
        if (deleteResult.success) {
          await Swal.fire({
            icon: 'success',
            title: 'Đã xóa!',
            text: 'Yêu cầu hủy đã được xóa',
            confirmButtonColor: '#10b981'
          });
          loadCancellationRequests();
        } else {
          await Swal.fire({
            icon: 'error',
            title: 'Lỗi',
            text: deleteResult.error || 'Không thể xóa',
            confirmButtonColor: '#ef4444'
          });
        }
      } catch (error) {
        console.error('Error deleting cancellation:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Có lỗi xảy ra',
          confirmButtonColor: '#ef4444'
        });
      }
    }
  }, [loadCancellationRequests]);

  // Xem chi tiết yêu cầu hủy
  const handleViewCancellationDetails = useCallback(async (cancellationId) => {
    try {
      Swal.fire({
        title: 'Đang tải...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const result = await fetchCancellationRequestById(cancellationId);
      
      if (result.success && result.data) {
        const data = result.data;
        const requestDate = data.requestedAt || data.createdAt;
        const formattedDate = requestDate 
          ? new Date(requestDate).toLocaleString('vi-VN')
          : 'N/A';
        
        const status = data.requestStatus || data.status || 'Pending';
        const statusColor = status === 'Confirmed' ? 'green' : status === 'Pending' ? 'yellow' : 'gray';
        const statusText = status === 'Confirmed' ? 'Đã xác nhận' : status === 'Pending' ? 'Chờ xử lý' : status;

        await Swal.fire({
          title: 'Chi tiết yêu cầu hủy',
          html: `
            <div class="text-left space-y-3">
              <div class="bg-gray-50 p-3 rounded-lg">
                <p class="text-sm text-gray-600">Mã yêu cầu</p>
                <p class="font-semibold text-gray-900">#${data.requestId || data.id || cancellationId}</p>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg">
                <p class="text-sm text-gray-600">Booking ID</p>
                <p class="font-semibold text-teal-600">#${data.bookingId || 'N/A'}</p>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg">
                <p class="text-sm text-gray-600">Lý do hủy</p>
                <p class="font-medium text-gray-900">${data.requestReason?.split('|')[0]?.trim() || data.reason || 'Không có lý do'}</p>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg">
                <p class="text-sm text-gray-600">Ngày yêu cầu</p>
                <p class="font-medium text-gray-900">${formattedDate}</p>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg">
                <p class="text-sm text-gray-600">Trạng thái</p>
                <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-${statusColor}-100 text-${statusColor}-700">
                  ${statusText}
                </span>
              </div>
            </div>
          `,
          icon: 'info',
          confirmButtonText: 'Đóng',
          confirmButtonColor: '#0d9488',
          width: '450px'
        });
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: result.error || 'Không thể tải chi tiết yêu cầu hủy',
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (error) {
      console.error('Error loading cancellation details:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Có lỗi xảy ra khi tải chi tiết',
        confirmButtonColor: '#ef4444'
      });
    }
  }, []);

  // Xuất báo cáo
  const handleExportReport = useCallback(async (filteredBookings) => {
    if (isDemo) {
      setShowDemoRestrictedModal(true);
      return;
    }
    if (!filteredBookings.length) {
      await Swal.fire({
        icon: "info",
        title: "Không có dữ liệu",
        text: "Không có booking nào để xuất theo bộ lọc hiện tại.",
        confirmButtonColor: "#0ea5e9",
      });
      return;
    }
    try {
      setExporting(true);
      const toCsvValue = (value) => {
        if (value === null || value === undefined) return "";
        const str = String(value);
        if (str.includes('"') || str.includes(",") || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const headers = [
        "Mã booking", "Khách hàng", "Số điện thoại", "Email", "Sân",
        "Ngày", "Khung giờ", "Trạng thái", "Thanh toán", "Tiền cọc", "Tổng tiền",
      ];
      const rows = filteredBookings.map((b) => [
        b.bookingId || b.id || "",
        b.customer || "",
        b.phone || "",
        b.email || "",
        b.field || "",
        formatDate(b.date),
        b.timeSlot || "",
        getStatusText(String(b.status || "").toLowerCase()),
        getPaymentStatusText(String(b.paymentStatus || "").toLowerCase()),
        b.depositAmount ?? 0,
        b.amount ?? 0,
      ]);

      const csv = [
        "\uFEFF" + headers.map(toCsvValue).join(","),
        ...rows.map((row) => row.map(toCsvValue).join(",")),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `booking-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export report error:", error);
      await Swal.fire({
        icon: "error",
        title: "Xuất báo cáo thất bại",
        text: "Vui lòng thử lại sau.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setExporting(false);
    }
  }, [isDemo, setShowDemoRestrictedModal, formatDate, getStatusText, getPaymentStatusText]);

  return {
    loadingBookings,
    bookingError,
    cancellationRequests,
    loadingCancellations,
    autoCompletedIds,
    setAutoCompletedIds,
    exporting,
    loadBookings,
    loadCancellationRequests,
    normalizeBookingData,
    handleConfirmBooking,
    handleCancelBooking,
    handleConfirmCancellation,
    handleDeleteCancellation,
    handleViewCancellationDetails,
    handleExportReport,
  };
};
