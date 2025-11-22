import React, { useState, useMemo, useEffect } from "react";
import {
     Calendar,
     CheckCircle,
     XCircle,
     Search,
     Download,
     Eye,
     RefreshCw,
     Filter,
     User,
     Phone,
     Mail,
     Clock,
     MapPin,
     DollarSign,
     FileText,
     AlertCircle,
     CreditCard,
     CheckSquare
} from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, DatePicker, Modal, Input, Card, Button, Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "../../../shared/components/ui";
import OwnerLayout from "../layouts/OwnerLayout";
import { useAuth } from "../../../contexts/AuthContext";
import { DemoRestrictedModal } from "../../../shared";
import { cancelBooking, fetchCancellationRequests, confirmCancellation, deleteCancellationRequest, fetchBookingsByOwner, confirmByOwner, fetchCancellationRequestById } from "../../../shared/services/bookings";
import Swal from "sweetalert2";


const BookingManagement = ({ isDemo = false }) => {
     const { user, logout } = useAuth();
     const [selectedDate, setSelectedDate] = useState("");
     const [statusFilter, setStatusFilter] = useState("all");
     const [fieldFilter, setFieldFilter] = useState("all");
     const [searchTerm, setSearchTerm] = useState("");
     const [selectedBooking, setSelectedBooking] = useState(null);
     const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
     const [showDemoRestrictedModal, setShowDemoRestrictedModal] = useState(false);
     const [activeTab, setActiveTab] = useState("bookings"); // bookings, cancellations
     const [cancellationRequests, setCancellationRequests] = useState([]);
     const [loadingCancellations, setLoadingCancellations] = useState(false);
     const [bookings, setBookings] = useState([]);
     const [loadingBookings, setLoadingBookings] = useState(false);
     const [bookingError, setBookingError] = useState("");
     const [selectedCancellation, setSelectedCancellation] = useState(null);
     const [isCancellationDetailModalOpen, setIsCancellationDetailModalOpen] = useState(false);
     const [loadingCancellationDetail, setLoadingCancellationDetail] = useState(false);

     // Get owner ID from user
     const ownerId = user?.userID || user?.UserID || user?.id || user?.userId;

     // Extract unique fields from bookings
     const fields = useMemo(() => {
          const fieldSet = new Set();
          fieldSet.add("all");
          bookings.forEach(booking => {
               if (booking.field) {
                    fieldSet.add(booking.field);
               }
          });
          return Array.from(fieldSet).map(field => ({
               value: field,
               label: field === "all" ? "Tất cả sân" : field
          }));
     }, [bookings]);

     const statusOptions = [
          { value: "all", label: "Tất cả trạng thái" },
          { value: "pending", label: "Chờ xác nhận" },
          { value: "confirmed", label: "Đã xác nhận" },
          { value: "cancelled", label: "Đã hủy" },
          { value: "completed", label: "Hoàn thành" }
     ];

     const handleConfirmBooking = async (bookingId) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }

          // Ensure bookingId is a valid number
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

          // Find the booking to check its status
          const booking = bookings.find(b => (b.bookingId || b.id) === numericBookingId);
          if (booking) {
               // Check if booking is already confirmed
               if (booking.status === 'confirmed') {
                    await Swal.fire({
                         icon: 'warning',
                         title: 'Đã được xác nhận',
                         text: booking.status === 'confirmed'
                              ? 'Booking này đã hoàn thành rồi.'
                              : 'Booking này đã được xác nhận rồi.',
                         confirmButtonColor: '#10b981'
                    });
                    // Reload to get latest data
                    loadBookings();
                    return;
               }

               // Check if booking is cancelled
               if (booking.status === 'cancelled') {
                    await Swal.fire({
                         icon: 'error',
                         title: 'Không thể xác nhận',
                         text: 'Không thể xác nhận booking đã bị hủy.',
                         confirmButtonColor: '#ef4444'
                    });
                    return;
               }

               // Check payment status - must be paid before confirming
               const paymentStatusLower = String(booking.paymentStatus || '').toLowerCase();
               const isPaid = paymentStatusLower === 'paid';

               console.log('[handleConfirmBooking] Payment status check:', {
                    bookingId: numericBookingId,
                    paymentStatus: booking.paymentStatus,
                    paymentStatusLower: paymentStatusLower,
                    isPaid: isPaid
               });

               if (!isPaid) {
                    await Swal.fire({
                         icon: 'warning',
                         title: 'Chưa thanh toán',
                         html: `
                              <div class="text-left">
                                   <p class="mb-2">Booking này chưa được thanh toán.</p>
                                   <p class="text-sm text-gray-600">Vui lòng đợi khách hàng thanh toán trước khi xác nhận booking.</p>
                                   <div class="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <p class="text-xs text-yellow-800">
                                             <strong>Trạng thái thanh toán hiện tại:</strong> ${booking.paymentStatus === 'unpaid' ? 'Chờ Thanh Toán' : booking.paymentStatus}
                                        </p>
                                   </div>
                              </div>
                         `,
                         confirmButtonText: 'Đã hiểu',
                         confirmButtonColor: '#f59e0b',
                         width: '500px'
                    });
                    return;
               }
          }

          const result = await Swal.fire({
               title: 'Xác nhận booking',
               html: `
                    <div class="text-left">
                         <p class="mb-3">Bạn có chắc muốn xác nhận booking này?</p>
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
                              <div class="bg-green-50 border border-green-200 rounded-lg p-2">
                                   <p class="text-xs text-green-800">
                                        ✅ <strong>Đã thanh toán</strong> - Booking sẽ chuyển sang trạng thái "Đã xác nhận"
                                   </p>
                              </div>
                         ` : ''}
                    </div>
               `,
               icon: 'question',
               showCancelButton: true,
               confirmButtonText: 'Xác nhận',
               cancelButtonText: 'Hủy',
               confirmButtonColor: '#10b981',
               cancelButtonColor: '#6b7280',
               width: '550px'
          });

          if (result.isConfirmed) {
               try {
                    console.log(`[BookingManagement] Attempting to confirm booking ${numericBookingId}`, {
                         bookingId: numericBookingId,
                         currentStatus: booking?.status,
                         currentPaymentStatus: booking?.paymentStatus
                    });

                    const confirmResult = await confirmByOwner(numericBookingId);

                    if (confirmResult.success) {
                         // Log response from backend to check actual status
                         console.log('[BookingManagement] Confirm booking response:', {
                              bookingId: numericBookingId,
                              responseData: confirmResult.data,
                              bookingStatus: confirmResult.data?.bookingStatus || confirmResult.data?.status,
                              paymentStatus: confirmResult.data?.paymentStatus
                         });

                         await Swal.fire({
                              icon: 'success',
                              title: 'Đã xác nhận!',
                              text: 'Booking đã được xác nhận thành công',
                              confirmButtonColor: '#10b981'
                         });

                         // Reload bookings to get updated status from backend
                         await loadBookings();

                         // Log normalized bookings after reload to verify status
                         setTimeout(() => {
                              const updatedBooking = bookings.find(b => (b.bookingId || b.id) === numericBookingId);
                              if (updatedBooking) {
                                   console.log('[BookingManagement] Updated booking status after confirm:', {
                                        bookingId: numericBookingId,
                                        normalizedStatus: updatedBooking.status,
                                        originalStatus: updatedBooking.bookingStatus
                                   });
                              }
                         }, 500);
                    } else {
                         // Show detailed error message
                         const errorMsg = confirmResult.error || 'Không thể xác nhận booking';
                         console.error('[BookingManagement] Confirm booking failed:', errorMsg);

                         await Swal.fire({
                              icon: 'error',
                              title: 'Lỗi xác nhận booking',
                              html: `
                                   <div class="text-left">
                                        <p class="mb-2">${errorMsg}</p>
                                        <p class="text-sm text-gray-600 mt-2">
                                             Có thể booking đã được xác nhận hoặc có vấn đề với dữ liệu.
                                        </p>
                                   </div>
                              `,
                              confirmButtonColor: '#ef4444'
                         });
                         // Reload to get latest status
                         loadBookings();
                    }
               } catch (error) {
                    console.error('[BookingManagement] Error confirming booking:', error);
                    await Swal.fire({
                         icon: 'error',
                         title: 'Lỗi',
                         text: 'Có lỗi xảy ra khi xác nhận booking. Vui lòng thử lại.',
                         confirmButtonColor: '#ef4444'
                    });
                    // Reload to get latest status
                    loadBookings();
               }
          }
     };

     const handleCancelBooking = async (bookingId) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }

          // Ensure bookingId is a valid number
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

          // Find booking to check status and payment status
          const booking = bookings.find(b => (b.bookingId || b.id) === numericBookingId);
          const isPending = booking && (booking.status === 'pending' || booking.status === 'Pending');
          const paymentStatusLower = booking ? String(booking.paymentStatus || '').toLowerCase() : '';
          const isPaid = paymentStatusLower === 'paid';
          const isConfirmedAndPaid = booking &&
               (booking.status === 'confirmed' || booking.status === 'Confirmed') &&
               isPaid;
          const isPendingButPaid = isPending && isPaid; // Chưa xác nhận nhưng đã trả cọc

          // Show SweetAlert2 input dialog
          const { value: reason, isConfirmed } = await Swal.fire({
               title: 'Hủy booking',
               html: `
                    <div class="text-left">
                         <p class="text-sm text-gray-700 mb-1">Vui lòng nhập lý do hủy booking:</p>
                         ${isPendingButPaid ? `
                              <div class="bg-blue-50 border border-blue-200 rounded-xl p-2 mb-2">
                                   <p class="text-sm text-blue-800 font-semibold mb-1">ℹ️ Lưu ý:</p>
                                   <p class="text-xs text-blue-700 pr-3">Booking này chưa được xác nhận nhưng khách hàng đã trả cọc. Bạn sẽ cần hoàn lại 100% số tiền cọc (${formatCurrency(booking?.depositAmount || booking?.amount || 0)}) cho khách hàng.</p>
                              </div>
                         ` : ''}
                         ${isConfirmedAndPaid ? `
                              <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-2 mb-2">
                                   <p class="text-sm text-yellow-800 font-semibold mb-1">⚠️ Lưu ý:</p>
                                   <p class="text-xs text-yellow-700 pr-3">Booking này đã được xác nhận và đã thanh toán. Bạn sẽ cần hoàn tiền cho khách hàng theo chính sách hủy đặt sân.</p>
                              </div>
                         ` : ''}
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
               width: (isConfirmedAndPaid || isPendingButPaid) ? '600px' : '500px',
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
                    // Use the same API as player - backend will check token to determine if Owner or Player is cancelling
                    const result = await cancelBooking(numericBookingId, reason);

                    if (result.success) {
                         // Extract cancellation request ID from response (if available)
                         const cancellationId = result.data?.cancellationId || result.data?.id || result.data?.cancellationRequestId;

                         // If owner is cancelling, automatically confirm the cancellation request
                         // This ensures the booking status is updated in the database immediately
                         if (cancellationId) {
                              try {
                                   const confirmResult = await confirmCancellation(cancellationId);
                                   if (!confirmResult.success) {
                                        console.warn("Failed to auto-confirm cancellation request:", confirmResult.error);
                                        // Continue anyway - backend might have auto-confirmed
                                   }
                              } catch (confirmError) {
                                   console.warn("Error auto-confirming cancellation:", confirmError);
                                   // Continue anyway - backend might have auto-confirmed
                              }
                         }

                         // Extract refund information from response
                         const refundInfo = {
                              message: result.message || result.data?.message,
                              cancelReason: result.cancelReason || result.data?.cancelReason,
                              refundAmount: result.refundAmount ?? result.data?.refundAmount ?? 0,
                              penaltyAmount: result.penaltyAmount ?? result.data?.penaltyAmount ?? 0,
                              finalRefundAmount: result.finalRefundAmount ?? result.data?.finalRefundAmount ?? 0,
                              refundQR: result.refundQR || result.data?.refundQR,
                         };

                         // Build success message with refund details
                         let successHtml = `
                              <p class="mb-3">${refundInfo.message || 'Đã hủy booking thành công!'}</p>
                         `;

                         if (refundInfo.cancelReason) {
                              successHtml += `
                                   <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 text-left">
                                        <p class="text-sm text-blue-800">${refundInfo.cancelReason}</p>
                                   </div>
                              `;
                         }

                         // Show refund information if booking was paid (confirmed and paid, or pending but paid)
                         if ((isConfirmedAndPaid || isPendingButPaid) && refundInfo.finalRefundAmount > 0) {
                              successHtml += `
                                   <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
                                        <p class="text-sm font-semibold text-gray-700 mb-2">Thông tin hoàn tiền:</p>
                                        <div class="space-y-2">
                                             <div class="flex justify-between items-center">
                                                  <span class="text-sm text-gray-600">Số tiền phải hoàn:</span>
                                                  <span class="text-lg font-bold text-green-600">${formatCurrency(refundInfo.finalRefundAmount)}</span>
                                             </div>
                                             ${isPendingButPaid ? `
                                                  <p class="text-xs text-green-700 mt-1">(100% số tiền cọc sẽ được hoàn lại vì booking chưa được xác nhận)</p>
                                             ` : ''}
                                             ${refundInfo.penaltyAmount > 0 ? `
                                                  <div class="flex justify-between items-center">
                                                       <span class="text-sm text-gray-600">Số tiền bị phạt:</span>
                                                       <span class="text-sm font-semibold text-red-600">${formatCurrency(refundInfo.penaltyAmount)}</span>
                                                  </div>
                                             ` : ''}
                                        </div>
                                   </div>
                              `;

                              // Add QR code if available
                              if (refundInfo.refundQR) {
                                   successHtml += `
                                        <div class="mt-3 text-center">
                                             <p class="text-sm font-semibold text-gray-700 mb-2">Mã QR để chuyển tiền hoàn lại cho khách hàng:</p>
                                             <img src="${refundInfo.refundQR}" alt="Refund QR Code" class="mx-auto border-2 border-gray-300 rounded-lg shadow-md" style="max-width: 250px;" />
                                             <p class="text-xs text-gray-500 mt-2">Vui lòng quét mã QR để chuyển tiền hoàn lại cho khách hàng</p>
                                        </div>
                                   `;
                              }
                         }

                         await Swal.fire({
                              icon: 'success',
                              title: 'Đã hủy booking thành công!',
                              html: successHtml,
                              confirmButtonColor: '#10b981',
                              width: (isConfirmedAndPaid || isPendingButPaid) && refundInfo.refundQR ? '600px' : '500px',
                              customClass: {
                                   popup: 'text-left'
                              }
                         });

                         // Reload bookings from BE to get updated status
                         // BE will update: bookingStatus = "Cancelled", paymentStatus = "Refunded" (if refunded)
                         await loadBookings();

                         // Also reload cancellation requests if on that tab
                         if (activeTab === 'cancellations') {
                              loadCancellationRequests();
                         }
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
     };

     // Load cancellation requests
     const loadCancellationRequests = async () => {
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
     };

     // Handle confirm cancellation
     const handleConfirmCancellation = async (cancellationId) => {
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

                         // Reload cancellation requests
                         loadCancellationRequests();

                         // Reload bookings to get updated status from BE
                         // BE will update: bookingStatus = "Cancelled", paymentStatus = "Refunded" (if refunded)
                         if (activeTab === 'bookings') {
                              await loadBookings();
                         }
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
     };

     // Handle delete cancellation request
     const handleDeleteCancellation = async (cancellationId) => {
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
     };

     // Handle view cancellation details
     const handleViewCancellationDetails = async (cancellationId) => {
          setLoadingCancellationDetail(true);
          setIsCancellationDetailModalOpen(true);
          try {
               const result = await fetchCancellationRequestById(cancellationId);
               if (result.success) {
                    setSelectedCancellation(result.data);
               } else {
                    await Swal.fire({
                         icon: 'error',
                         title: 'Lỗi',
                         text: result.error || 'Không thể tải chi tiết yêu cầu hủy',
                         confirmButtonColor: '#ef4444'
                    });
                    setIsCancellationDetailModalOpen(false);
               }
          } catch (error) {
               console.error('Error loading cancellation details:', error);
               await Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: 'Có lỗi xảy ra khi tải chi tiết',
                    confirmButtonColor: '#ef4444'
               });
               setIsCancellationDetailModalOpen(false);
          } finally {
               setLoadingCancellationDetail(false);
          }
     };

     // Normalize API booking data to match component format
     const normalizeBookingData = (apiBookings = []) => {
          const now = new Date();
          return apiBookings.map((item, index) => {
               // Parse date and time
               const startTime = item.startTime ? new Date(item.startTime) : null;
               const endTime = item.endTime ? new Date(item.endTime) : null;
               const bookingDate = item.date || (startTime ? startTime.toISOString().split('T')[0] : '');
               const timeSlot = startTime && endTime
                    ? `${startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
                    : (item.slotName || item.timeSlot || '');

               // Normalize status - IMPORTANT: Check for 'confirmed' BEFORE 'completed'
               // because 'completed' contains 'confirm' substring
               const rawStatus = item.bookingStatus || item.status || 'pending';
               const status = String(rawStatus).toLowerCase();

               // Check if booking has passed (endTime is in the past)
               // "Completed" should only show when booking time has passed
               const hasPassed = endTime ? endTime < now : false;

               // Normalize status: 
               // - If cancelled, always cancelled
               // - If confirmed AND booking time has passed, show as completed
               // - If confirmed AND booking time hasn't passed, show as confirmed
               // - Otherwise, use the status from backend
               let normalizedStatus;
               if (status.includes('cancel')) {
                    normalizedStatus = 'cancelled';
               } else if (status.includes('confirm') || status === 'confirmed') {
                    // If booking is confirmed and time has passed, show as completed
                    if (hasPassed) {
                         normalizedStatus = 'completed';
                    } else {
                         normalizedStatus = 'confirmed';
                    }
               } else if (status === 'completed' || (status.includes('complete') && !status.includes('confirm'))) {
                    // Backend says completed, but check if it's actually past the booking time
                    normalizedStatus = hasPassed ? 'completed' : 'confirmed';
               } else if (status.includes('pending')) {
                    normalizedStatus = 'pending';
               } else {
                    normalizedStatus = status;
               }

               // Normalize payment status - handle both "Paid"/"Unpaid" (capitalized) and "paid"/"unpaid" (lowercase)
               const rawPaymentStatus = item.paymentStatus || item.PaymentStatus || 'pending';
               const paymentStatus = String(rawPaymentStatus).toLowerCase().trim();

               // Log for debugging
               if (rawPaymentStatus !== paymentStatus) {
                    console.log(`[normalizeBookingData] Payment status normalized: "${rawPaymentStatus}" -> "${paymentStatus}"`);
               }

               let normalizedPaymentStatus;
               if (paymentStatus === 'paid' || paymentStatus.includes('paid')) {
                    normalizedPaymentStatus = 'paid';
               } else if (paymentStatus === 'unpaid' || paymentStatus.includes('unpaid')) {
                    normalizedPaymentStatus = 'unpaid';
               } else if (paymentStatus.includes('refund')) {
                    normalizedPaymentStatus = 'refunded';
               } else if (paymentStatus.includes('fail')) {
                    normalizedPaymentStatus = 'failed';
               } else {
                    normalizedPaymentStatus = 'pending';
               }

               // Extract and normalize bookingId
               const rawBookingId = item.bookingId || item.bookingID || item.id;
               const numericBookingId = rawBookingId ? Number(rawBookingId) : null;

               return {
                    id: numericBookingId ? String(numericBookingId) : `booking-${index}`,
                    bookingId: numericBookingId,
                    field: item.fieldName || item.field || "Chưa rõ sân",
                    customer: item.customerName || item.customer || item.userName || "Khách hàng",
                    phone: item.customerPhone || item.phone || "",
                    email: item.customerEmail || item.email || "",
                    date: bookingDate,
                    timeSlot: timeSlot,
                    status: normalizedStatus,
                    amount: Number(item.totalPrice || item.price || 0),
                    paymentStatus: normalizedPaymentStatus,
                    createdAt: item.createdAt || item.createdDate || new Date().toISOString(),
                    notes: item.notes || item.note || "",
                    // Additional fields for detail modal
                    userId: item.userId || item.userID,
                    scheduleId: item.scheduleId || item.scheduleID,
                    depositAmount: Number(item.depositAmount || 0),
                    hasOpponent: Boolean(item.hasOpponent),
                    address: item.complexName || item.address || "",
                    // Store startTime and endTime for checking if booking has passed
                    startTime: startTime ? startTime.toISOString() : null,
                    endTime: endTime ? endTime.toISOString() : null,
                    // Store original status from backend for debugging
                    originalStatus: rawStatus
               };
          });
     };

     // Load bookings from API
     const loadBookings = async () => {
          if (!ownerId) {
               setBookings([]);
               return;
          }

          setLoadingBookings(true);
          setBookingError("");
          try {
               const result = await fetchBookingsByOwner(ownerId);
               if (result.success) {
                    const normalizedBookings = normalizeBookingData(result.data);
                    setBookings(normalizedBookings);
               } else {
                    setBookingError(result.error || "Không thể tải danh sách booking.");
                    setBookings([]);
               }
          } catch (error) {
               console.error("Error loading bookings:", error);
               setBookingError(error.message || "Có lỗi xảy ra khi tải danh sách booking.");
               setBookings([]);
          } finally {
               setLoadingBookings(false);
          }
     };

     // Load bookings on mount and when ownerId changes
     useEffect(() => {
          if (activeTab === 'bookings') {
               loadBookings();
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [ownerId, activeTab]);

     // Load cancellations when tab changes
     useEffect(() => {
          if (activeTab === 'cancellations') {
               loadCancellationRequests();
          }
     }, [activeTab]);

     const handleViewDetails = (booking) => {
          setSelectedBooking(booking);
          setIsDetailModalOpen(true);
     };

     const filteredBookings = useMemo(() => {
          return bookings.filter(booking => {
               const matchesDate = !selectedDate || booking.date === selectedDate;
               const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
               const matchesField = fieldFilter === "all" || booking.field === fieldFilter;
               const matchesSearch = !searchTerm ||
                    booking.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    booking.phone.includes(searchTerm) ||
                    booking.email.toLowerCase().includes(searchTerm.toLowerCase());

               return matchesDate && matchesStatus && matchesField && matchesSearch;
          });
     }, [bookings, selectedDate, statusFilter, fieldFilter, searchTerm]);

     const getStatusColor = (status) => {
          switch (status) {
               case 'pending': return 'bg-yellow-100 text-yellow-800';
               case 'confirmed': return 'bg-green-100 text-green-800';
               case 'cancelled': return 'bg-red-100 text-red-800';
               case 'completed': return 'bg-blue-100 text-blue-800';
               default: return 'bg-gray-100 text-gray-800';
          }
     };

     const getStatusText = (status) => {
          switch (status) {
               case 'pending': return 'Chờ xác nhận';
               case 'confirmed': return 'Đã xác nhận';
               case 'cancelled': return 'Đã hủy';
               case 'completed': return 'Hoàn thành';
               default: return status;
          }
     };

     const getPaymentStatusColor = (status) => {
          switch (status) {
               case 'paid': return 'bg-green-100 text-green-800';
               case 'unpaid': return 'bg-yellow-100 text-yellow-800';
               case 'refunded': return 'bg-blue-100 text-blue-800';
               case 'failed': return 'bg-red-100 text-red-800';
               default: return 'bg-gray-100 text-gray-800';
          }
     };

     const getPaymentStatusText = (status) => {
          switch (status) {
               case 'paid': return 'Đã thanh toán';
               case 'unpaid': return 'Chờ Thanh Toán';
               case 'refunded': return 'Đã hoàn tiền';
               case 'failed': return 'Thanh toán thất bại';
               default: return status;
          }
     };

     const formatCurrency = (amount) => {
          return new Intl.NumberFormat('vi-VN', {
               style: 'currency',
               currency: 'VND'
          }).format(amount);
     };

     const formatDate = (dateString) => {
          return new Date(dateString).toLocaleDateString('vi-VN');
     };


     return (
          <OwnerLayout user={user} onLoggedOut={logout} isDemo={isDemo}>
               <div className="space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 rounded-2xl">
                         <div>
                              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                                   <Calendar className="w-8 h-8 mr-3 text-teal-600" />
                                   Quản lý booking
                              </h1>
                              <p className="text-gray-600 mt-1">Xác nhận, hủy và theo dõi các booking</p>
                         </div>

                         <div className="flex items-center space-x-3">
                              <Button variant="outline" className="rounded-2xl border-teal-300 text-teal-700 hover:bg-teal-50">
                                   <Download className="w-4 h-4 mr-2" />
                                   Xuất báo cáo
                              </Button>
                              <Button
                                   className="rounded-2xl bg-teal-600 hover:bg-teal-700"
                                   onClick={loadBookings}
                                   disabled={loadingBookings}
                              >
                                   <RefreshCw className={`w-4 h-4 mr-2 ${loadingBookings ? 'animate-spin' : ''}`} />
                                   Làm mới
                              </Button>
                         </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                         <nav className="flex space-x-8">
                              <button
                                   onClick={() => setActiveTab('bookings')}
                                   className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'bookings'
                                        ? 'border-teal-500 text-teal-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                              >
                                   <Calendar className="w-4 h-4" />
                                   <span>Danh sách Booking</span>
                              </button>
                              <button
                                   onClick={() => setActiveTab('cancellations')}
                                   className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'cancellations'
                                        ? 'border-teal-500 text-teal-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                              >
                                   <XCircle className="w-4 h-4" />
                                   <span>Yêu cầu hủy</span>
                                   {cancellationRequests.length > 0 && (
                                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                             {cancellationRequests.length}
                                        </span>
                                   )}
                              </button>
                         </nav>
                    </div>

                    {/* Bookings Tab */}
                    {activeTab === 'bookings' && (
                         <>
                              {/* Filters */}
                              <Card className="p-6 rounded-2xl shadow-lg border border-teal-200 bg-gradient-to-br from-white to-teal-50/30">
                                   <h3 className="text-lg font-semibold text-teal-800 mb-4 flex items-center">
                                        <Filter className="w-5 h-5 mr-2" />
                                        Bộ lọc tìm kiếm
                                   </h3>
                                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div>
                                             <label className="text-sm font-semibold text-teal-700 mb-2 flex items-center">
                                                  <Search className="w-4 h-4 mr-1" />
                                                  Tìm kiếm
                                             </label>
                                             <div className="relative">
                                                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-500 w-4 h-4" />
                                                  <Input
                                                       placeholder="Tên, SĐT, email..."
                                                       value={searchTerm}
                                                       onChange={(e) => setSearchTerm(e.target.value)}
                                                       className="pl-10 rounded-2xl border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                                                  />
                                             </div>
                                        </div>

                                        <div>
                                             <label className="text-sm font-semibold text-teal-700 mb-2 flex items-center">
                                                  <Calendar className="w-4 h-4 mr-1" />
                                                  Ngày
                                             </label>
                                             <DatePicker
                                                  value={selectedDate}
                                                  onChange={setSelectedDate}
                                                  placeholder="Chọn ngày"
                                                  minDate={new Date().toISOString().split('T')[0]}
                                             />
                                        </div>

                                        <div>
                                             <label className="text-sm font-semibold text-teal-700 mb-2 flex items-center">
                                                  <AlertCircle className="w-4 h-4 mr-1" />
                                                  Trạng thái
                                             </label>
                                             <Select value={statusFilter} onValueChange={setStatusFilter}>
                                                  <SelectTrigger className="rounded-2xl border-teal-200 focus:border-teal-500">
                                                       <SelectValue placeholder="Chọn trạng thái" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                       {statusOptions.map(option => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                 {option.label}
                                                            </SelectItem>
                                                       ))}
                                                  </SelectContent>
                                             </Select>
                                        </div>

                                        <div>
                                             <label className="text-sm font-semibold text-teal-700 mb-2 flex items-center">
                                                  <MapPin className="w-4 h-4 mr-1" />
                                                  Sân
                                             </label>
                                             <Select value={fieldFilter} onValueChange={setFieldFilter}>
                                                  <SelectTrigger className="rounded-2xl border-teal-200 focus:border-teal-500">
                                                       <SelectValue placeholder="Chọn sân" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                       {fields.map(field => (
                                                            <SelectItem key={field.value} value={field.value}>
                                                                 {field.label}
                                                            </SelectItem>
                                                       ))}
                                                  </SelectContent>
                                             </Select>
                                        </div>


                                   </div>
                                   <div className="flex items-center justify-end mt-4">
                                        <Button
                                             variant="outline"
                                             onClick={() => {
                                                  setSelectedDate("");
                                                  setStatusFilter("all");
                                                  setFieldFilter("all");
                                                  setSearchTerm("");
                                             }}
                                             className="rounded-2xl border-teal-300 text-teal-700 hover:bg-teal-50"
                                        >
                                             <Filter className="w-4 h-4 mr-2" />
                                             Xóa bộ lọc
                                        </Button>
                                   </div>
                              </Card>

                              {/* Error Message */}
                              {bookingError && (
                                   <Card className="p-4 rounded-2xl border border-red-200 bg-red-50 mb-4">
                                        <div className="flex items-center text-red-700">
                                             <AlertCircle className="w-5 h-5 mr-2" />
                                             <span className="text-sm">{bookingError}</span>
                                        </div>
                                   </Card>
                              )}

                              {/* Bookings Table */}
                              <Card className="overflow-hidden rounded-2xl border border-teal-200 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
                                   <div className="bg-gradient-to-r from-teal-500 to-emerald-700 p-4">
                                        <h3 className="text-lg font-semibold text-white flex items-center">
                                             <Calendar className="w-5 h-5 mr-2" />
                                             Danh sách booking ({filteredBookings.length})
                                        </h3>
                                   </div>
                                   {loadingBookings ? (
                                        <div className="text-center py-12">
                                             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                                             <p className="text-gray-600 mt-4">Đang tải danh sách booking...</p>
                                        </div>
                                   ) : (
                                        <Table>
                                             <TableHeader>
                                                  <TableRow className="bg-teal-700">
                                                       <TableHead className="text-white font-semibold">Khách hàng</TableHead>
                                                       <TableHead className="text-white font-semibold">Sân & Thời gian</TableHead>
                                                       <TableHead className="text-white font-semibold">Trạng thái</TableHead>
                                                       <TableHead className="text-white font-semibold">Thanh toán</TableHead>
                                                       <TableHead className="text-white font-semibold">Số tiền</TableHead>
                                                       <TableHead className="text-white font-semibold">Thao tác</TableHead>
                                                  </TableRow>
                                             </TableHeader>
                                             <TableBody>
                                                  {filteredBookings.map((booking) => (
                                                       <TableRow key={booking.id} className="hover:bg-teal-50/50 transition-colors">
                                                            <TableCell>
                                                                 <div className="space-y-1">
                                                                      <div className="text-sm font-semibold text-gray-900">{booking.customer}</div>
                                                                      <div className="text-xs text-teal-600 font-medium flex items-center">
                                                                           <Phone className="w-3 h-3 mr-1" />
                                                                           {booking.phone}
                                                                      </div>
                                                                      <div className="text-xs text-gray-500 font-medium flex items-center">
                                                                           <Mail className="w-3 h-3 mr-1" />
                                                                           {booking.email}
                                                                      </div>
                                                                 </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                 <div className="space-y-1">
                                                                      <div className="text-sm font-semibold text-gray-900 flex items-center">
                                                                           <MapPin className="w-3 h-3 mr-1 text-teal-600" />
                                                                           {booking.field}
                                                                      </div>
                                                                      <div className="text-xs text-gray-600 flex items-center">
                                                                           <Calendar className="w-3 h-3 mr-1" />
                                                                           {formatDate(booking.date)}
                                                                      </div>
                                                                      <div className="text-xs text-gray-600 flex items-center">
                                                                           <Clock className="w-3 h-3 mr-1" />
                                                                           {booking.timeSlot}
                                                                      </div>
                                                                 </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                 <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                                                                      {getStatusText(booking.status)}
                                                                 </span>
                                                            </TableCell>
                                                            <TableCell>
                                                                 <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(booking.paymentStatus)}`}>
                                                                      {getPaymentStatusText(booking.paymentStatus)}
                                                                 </span>
                                                            </TableCell>
                                                            <TableCell className="text-sm font-bold text-emerald-600">
                                                                 {formatCurrency(booking.amount)}
                                                            </TableCell>
                                                            <TableCell className="text-sm font-medium">
                                                                 <div className="flex items-center space-x-2">
                                                                      <Button
                                                                           variant="ghost"
                                                                           size="sm"
                                                                           onClick={() => handleViewDetails(booking)}
                                                                           className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                                                                      >
                                                                           <Eye className="w-4 h-4" />
                                                                      </Button>

                                                                      {booking.status === 'pending' && (
                                                                           <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => handleConfirmBooking(booking.bookingId || booking.id)}
                                                                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                                title="Xác nhận booking"
                                                                           >
                                                                                <CheckCircle className="w-4 h-4" />
                                                                           </Button>
                                                                      )}
                                                                      <Button
                                                                           variant="ghost"
                                                                           size="sm"
                                                                           onClick={() => handleCancelBooking(booking.bookingId || booking.id)}
                                                                           className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                      >
                                                                           <XCircle className="w-4 h-4" />
                                                                      </Button>
                                                                 </div>
                                                            </TableCell>
                                                       </TableRow>
                                                  ))}
                                             </TableBody>
                                        </Table>
                                   )}

                                   {!loadingBookings && filteredBookings.length === 0 && (
                                        <div className="text-center py-12">
                                             <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                             <h3 className="text-lg font-medium text-gray-900 mb-2">Không có booking nào</h3>
                                             <p className="text-gray-500">Không tìm thấy booking nào phù hợp với bộ lọc hiện tại.</p>
                                        </div>
                                   )}
                              </Card>

                              {/* Booking Detail Modal */}
                              <Modal
                                   isOpen={isDetailModalOpen}
                                   onClose={() => setIsDetailModalOpen(false)}
                                   title="Chi tiết booking"
                                   className="max-w-2xl rounded-2xl border border-teal-200 shadow-lg h-[90vh] overflow-y-auto scrollbar-hide bg-gray-300"
                              >
                                   {selectedBooking && (
                                        <div className="space-y-6">
                                             {/* Customer Info */}
                                             <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-4 rounded-xl border border-teal-200">
                                                  <h3 className="text-lg font-semibold text-teal-800 mb-3 flex items-center">
                                                       <User className="w-5 h-5 mr-2" />
                                                       Thông tin khách hàng
                                                  </h3>
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                       <div className="bg-white p-3 rounded-lg border border-teal-100">
                                                            <label className="text-sm font-semibold text-teal-700 flex items-center mb-2">
                                                                 <User className="w-4 h-4 mr-1" />
                                                                 Tên khách hàng
                                                            </label>
                                                            <p className="text-sm font-semibold text-gray-900">{selectedBooking.customer}</p>
                                                       </div>
                                                       <div className="bg-white p-3 rounded-lg border border-teal-100">
                                                            <label className="text-sm font-semibold text-teal-700 flex items-center mb-2">
                                                                 <Phone className="w-4 h-4 mr-1" />
                                                                 Số điện thoại
                                                            </label>
                                                            <p className="text-sm font-semibold text-gray-900">{selectedBooking.phone}</p>
                                                       </div>
                                                       <div className="bg-white p-3 rounded-lg border border-teal-100">
                                                            <label className="text-sm font-semibold text-teal-700 flex items-center mb-2">
                                                                 <Mail className="w-4 h-4 mr-1" />
                                                                 Email
                                                            </label>
                                                            <p className="text-sm font-semibold text-gray-900">{selectedBooking.email}</p>
                                                       </div>
                                                       <div className="bg-white p-3 rounded-lg border border-teal-100">
                                                            <label className="text-sm font-semibold text-teal-700 flex items-center mb-2">
                                                                 <Calendar className="w-4 h-4 mr-1" />
                                                                 Ngày đặt
                                                            </label>
                                                            <p className="text-sm font-semibold text-gray-900">{formatDate(selectedBooking.createdAt)}</p>
                                                       </div>
                                                  </div>
                                             </div>

                                             {/* Booking Info */}
                                             <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                                                  <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                                                       <Calendar className="w-5 h-5 mr-2" />
                                                       Thông tin booking
                                                  </h3>
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                       <div className="bg-white p-3 rounded-lg border border-blue-100">
                                                            <label className="text-sm font-semibold text-blue-700 flex items-center mb-2">
                                                                 <MapPin className="w-4 h-4 mr-1" />
                                                                 Sân
                                                            </label>
                                                            <p className="text-sm font-semibold text-gray-900">{selectedBooking.field}</p>
                                                       </div>
                                                       <div className="bg-white p-3 rounded-lg border border-blue-100">
                                                            <label className="text-sm font-semibold text-blue-700 flex items-center mb-2">
                                                                 <Calendar className="w-4 h-4 mr-1" />
                                                                 Ngày
                                                            </label>
                                                            <p className="text-sm font-semibold text-gray-900">{formatDate(selectedBooking.date)}</p>
                                                       </div>
                                                       <div className="bg-white p-3 rounded-lg border border-blue-100">
                                                            <label className="text-sm font-semibold text-blue-700 flex items-center mb-2">
                                                                 <Clock className="w-4 h-4 mr-1" />
                                                                 Khung giờ
                                                            </label>
                                                            <p className="text-sm font-semibold text-gray-900">{selectedBooking.timeSlot}</p>
                                                       </div>
                                                       <div className="bg-white p-3 rounded-lg border border-blue-100">
                                                            <label className="text-sm font-semibold text-blue-700 flex items-center mb-2">
                                                                 <DollarSign className="w-4 h-4 mr-1" />
                                                                 Số tiền
                                                            </label>
                                                            <p className="text-lg font-bold text-emerald-600">{formatCurrency(selectedBooking.amount)}</p>
                                                       </div>
                                                  </div>
                                             </div>

                                             {/* Status */}
                                             <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-xl border border-amber-200">
                                                  <h3 className="text-lg font-semibold text-amber-800 mb-3 flex items-center">
                                                       <AlertCircle className="w-5 h-5 mr-2" />
                                                       Trạng thái
                                                  </h3>
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                       <div className="bg-white p-3 rounded-lg border border-amber-100">
                                                            <label className="text-sm font-semibold text-amber-700 flex items-center mb-2">
                                                                 <CheckSquare className="w-4 h-4 mr-1" />
                                                                 Trạng thái booking
                                                            </label>
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedBooking.status)}`}>
                                                                 {getStatusText(selectedBooking.status)}
                                                            </span>
                                                       </div>
                                                       <div className="bg-white p-3 rounded-lg border border-amber-100">
                                                            <label className="text-sm font-semibold text-amber-700 flex items-center mb-2">
                                                                 <CreditCard className="w-4 h-4 mr-1" />
                                                                 Trạng thái thanh toán
                                                            </label>
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(selectedBooking.paymentStatus)}`}>
                                                                 {getPaymentStatusText(selectedBooking.paymentStatus)}
                                                            </span>
                                                       </div>
                                                  </div>
                                             </div>

                                             {/* Notes */}
                                             {selectedBooking.notes && (
                                                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                                                       <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center">
                                                            <FileText className="w-5 h-5 mr-2" />
                                                            Ghi chú
                                                       </h3>
                                                       <div className="bg-white p-4 rounded-lg border border-purple-100">
                                                            <p className="text-sm font-medium text-gray-900 leading-relaxed">
                                                                 {selectedBooking.notes}
                                                            </p>
                                                       </div>
                                                  </div>
                                             )}

                                             {/* Actions */}
                                             <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                                                  {selectedBooking.status === 'pending' && (
                                                       <>
                                                            <Button
                                                                 onClick={() => {
                                                                      handleConfirmBooking(selectedBooking.bookingId || selectedBooking.id);
                                                                      setIsDetailModalOpen(false);
                                                                 }}
                                                                 className="rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold"
                                                            >
                                                                 <CheckCircle className="w-4 h-4 mr-2" />
                                                                 Xác nhận
                                                            </Button>
                                                            <Button
                                                                 variant="outline"
                                                                 onClick={() => {
                                                                      handleCancelBooking(selectedBooking.bookingId || selectedBooking.id);
                                                                      setIsDetailModalOpen(false);
                                                                 }}
                                                                 className="rounded-xl border-red-300 text-red-600 hover:bg-red-50 font-semibold"
                                                            >
                                                                 <XCircle className="w-4 h-4 mr-2" />
                                                                 Hủy booking
                                                            </Button>
                                                       </>
                                                  )}
                                             </div>
                                        </div>
                                   )}
                              </Modal>

                              {/* Demo Restricted Modal */}
                              <DemoRestrictedModal
                                   isOpen={showDemoRestrictedModal}
                                   onClose={() => setShowDemoRestrictedModal(false)}
                                   featureName="Quản lý booking"
                              />
                         </>
                    )}

                    {/* Cancellations Tab */}
                    {activeTab === 'cancellations' && (
                         <Card className="p-6 rounded-2xl shadow-lg">
                              <div className="flex items-center justify-between mb-6">
                                   <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                        <XCircle className="w-6 h-6 mr-2 text-red-600" />
                                        Yêu cầu hủy booking
                                   </h3>
                                   <Button
                                        onClick={loadCancellationRequests}
                                        variant="outline"
                                        className="rounded-xl"
                                   >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Làm mới
                                   </Button>
                              </div>

                              {loadingCancellations ? (
                                   <div className="text-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                                        <p className="text-gray-600 mt-4">Đang tải...</p>
                                   </div>
                              ) : cancellationRequests.length === 0 ? (
                                   <div className="text-center py-12">
                                        <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">Không có yêu cầu hủy nào</p>
                                   </div>
                              ) : (
                                   <div className="overflow-x-auto">
                                        <Table>
                                             <TableHeader>
                                                  <TableRow>
                                                       <TableHead>ID</TableHead>
                                                       <TableHead>Booking ID</TableHead>
                                                       <TableHead>Lý do</TableHead>
                                                       <TableHead>Ngày tạo</TableHead>
                                                       <TableHead className="text-right">Thao tác</TableHead>
                                                  </TableRow>
                                             </TableHeader>
                                             <TableBody>
                                                  {cancellationRequests.map((request) => (
                                                       <TableRow key={request.id || request.cancellationId}>
                                                            <TableCell className="font-medium">
                                                                 #{request.id || request.cancellationId}
                                                            </TableCell>
                                                            <TableCell>
                                                                 <span className="text-teal-600 font-semibold">
                                                                      #{request.bookingId}
                                                                 </span>
                                                            </TableCell>
                                                            <TableCell>
                                                                 <div className="max-w-md">
                                                                      <p className="text-sm text-gray-700 line-clamp-2">
                                                                           {request.reason}
                                                                      </p>
                                                                 </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                 <div className="text-sm">
                                                                      <p className="text-gray-900">
                                                                           {request.createdAt ? new Date(request.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                                                                      </p>
                                                                      <p className="text-gray-500 text-xs">
                                                                           {request.createdAt ? new Date(request.createdAt).toLocaleTimeString('vi-VN') : ''}
                                                                      </p>
                                                                 </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                 <div className="flex items-center justify-end gap-2">
                                                                      <Button
                                                                           onClick={() => handleViewCancellationDetails(request.id || request.cancellationId)}
                                                                           size="sm"
                                                                           variant="ghost"
                                                                           className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-xl"
                                                                      >
                                                                           <Eye className="w-4 h-4 mr-1" />
                                                                           Chi tiết
                                                                      </Button>
                                                                      <Button
                                                                           onClick={() => handleConfirmCancellation(request.id || request.cancellationId)}
                                                                           size="sm"
                                                                           className="bg-green-600 hover:bg-green-700 rounded-xl"
                                                                      >
                                                                           <CheckCircle className="w-4 h-4 mr-1" />
                                                                           Xác nhận
                                                                      </Button>
                                                                      <Button
                                                                           onClick={() => handleDeleteCancellation(request.id || request.cancellationId)}
                                                                           size="sm"
                                                                           variant="outline"
                                                                           className="border-red-300 text-red-600 hover:bg-red-50 rounded-xl"
                                                                      >
                                                                           <XCircle className="w-4 h-4 mr-1" />
                                                                           Xóa
                                                                      </Button>
                                                                 </div>
                                                            </TableCell>
                                                       </TableRow>
                                                  ))}
                                             </TableBody>
                                        </Table>
                                   </div>
                              )}
                         </Card>
                    )}
               </div>

               {/* Cancellation Detail Modal - Outside conditional blocks */}
               <Modal
                    isOpen={isCancellationDetailModalOpen}
                    onClose={() => {
                         setIsCancellationDetailModalOpen(false);
                         setSelectedCancellation(null);
                    }}
                    title="Chi tiết yêu cầu hủy booking"
                    className="max-w-2xl rounded-2xl border border-red-200 shadow-lg h-[90vh] overflow-y-auto scrollbar-hide bg-gray-300"
               >
                    {loadingCancellationDetail ? (
                         <div className="text-center py-12">
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                              <p className="text-gray-600 mt-4">Đang tải chi tiết...</p>
                         </div>
                    ) : selectedCancellation ? (
                         <div className="space-y-6">
                              {/* Cancellation Info */}
                              <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-xl border border-red-200">
                                   <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
                                        <XCircle className="w-5 h-5 mr-2" />
                                        Thông tin yêu cầu hủy
                                   </h3>
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white p-3 rounded-lg border border-red-100">
                                             <label className="text-sm font-semibold text-red-700 flex items-center mb-2">
                                                  <FileText className="w-4 h-4 mr-1" />
                                                  ID yêu cầu
                                             </label>
                                             <p className="text-sm font-semibold text-gray-900">
                                                  #{selectedCancellation.id || selectedCancellation.cancellationId || selectedCancellation.requestID || 'N/A'}
                                             </p>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-red-100">
                                             <label className="text-sm font-semibold text-red-700 flex items-center mb-2">
                                                  <Calendar className="w-4 h-4 mr-1" />
                                                  Booking ID
                                             </label>
                                             <p className="text-sm font-semibold text-teal-600">
                                                  #{selectedCancellation.bookingId || selectedCancellation.bookingID || 'N/A'}
                                             </p>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-red-100">
                                             <label className="text-sm font-semibold text-red-700 flex items-center mb-2">
                                                  <Calendar className="w-4 h-4 mr-1" />
                                                  Ngày tạo
                                             </label>
                                             <p className="text-sm font-semibold text-gray-900">
                                                  {selectedCancellation.createdAt
                                                       ? new Date(selectedCancellation.createdAt).toLocaleString('vi-VN')
                                                       : 'N/A'}
                                             </p>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-red-100">
                                             <label className="text-sm font-semibold text-red-700 flex items-center mb-2">
                                                  <AlertCircle className="w-4 h-4 mr-1" />
                                                  Trạng thái
                                             </label>
                                             <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                                  {selectedCancellation.status || 'Pending'}
                                             </span>
                                        </div>
                                   </div>
                              </div>

                              {/* Reason */}
                              <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200">
                                   <h3 className="text-lg font-semibold text-orange-800 mb-3 flex items-center">
                                        <FileText className="w-5 h-5 mr-2" />
                                        Lý do hủy
                                   </h3>
                                   <div className="bg-white p-4 rounded-lg border border-orange-100">
                                        <p className="text-sm font-medium text-gray-900 leading-relaxed whitespace-pre-wrap">
                                             {selectedCancellation.reason || selectedCancellation.Reason || 'Không có lý do'}
                                        </p>
                                   </div>
                              </div>

                              {/* Actions */}
                              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                                   <Button
                                        variant="outline"
                                        onClick={() => {
                                             setIsCancellationDetailModalOpen(false);
                                             setSelectedCancellation(null);
                                        }}
                                        className="rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold"
                                   >
                                        Đóng
                                   </Button>
                                   <Button
                                        onClick={async () => {
                                             setIsCancellationDetailModalOpen(false);
                                             await handleConfirmCancellation(selectedCancellation.id || selectedCancellation.cancellationId || selectedCancellation.requestID);
                                             setSelectedCancellation(null);
                                        }}
                                        className="rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold"
                                   >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Xác nhận hủy
                                   </Button>
                                   <Button
                                        variant="outline"
                                        onClick={async () => {
                                             setIsCancellationDetailModalOpen(false);
                                             await handleDeleteCancellation(selectedCancellation.id || selectedCancellation.cancellationId || selectedCancellation.requestID);
                                             setSelectedCancellation(null);
                                        }}
                                        className="rounded-xl border-red-300 text-red-600 hover:bg-red-50 font-semibold"
                                   >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Xóa yêu cầu
                                   </Button>
                              </div>
                         </div>
                    ) : (
                         <div className="text-center py-12">
                              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-600">Không tìm thấy thông tin yêu cầu hủy</p>
                         </div>
                    )}
               </Modal>

          </OwnerLayout >
     );
};

export default BookingManagement;
