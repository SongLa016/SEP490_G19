import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
     Calendar,
     CheckCircle,
     XCircle,
     Download,
     RefreshCw,
     User,
     Phone,
     Mail,
     Clock,
     MapPin,
     DollarSign,
     FileText,
     AlertCircle,
     CreditCard,
     CheckSquare,
     QrCode,
     Repeat
} from "lucide-react";

import { Modal, Button, usePagination } from "../../../shared/components/ui";
import { useAuth } from "../../../contexts/AuthContext";
import { DemoRestrictedModal } from "../../../shared";
import { OwnerFilters, OwnerBookingsTable, OwnerPackagesTable, OwnerCancellationsTable } from "./components/bookingManagement";
import {
     cancelBooking,
     fetchCancellationRequests,
     confirmCancellation,
     deleteCancellationRequest,
     fetchBookingsByOwner,
     confirmPaymentAPI,
     confirmByOwner,
     fetchCancellationRequestById,
} from "../../../shared/services/bookings";
import { fetchFieldScheduleById, updateFieldScheduleStatus } from "../../../shared/services/fieldSchedules";
import Swal from "sweetalert2";
import axios from "axios";

/**
 * Trang quản lý đặt sân của chủ sân (Owner)
 * URL: /owner/bookings
 * 
 * Chức năng:
 * - Tab "Đặt sân": Danh sách booking, xác nhận thanh toán, xác nhận booking
 * - Tab "Yêu cầu hủy": Danh sách yêu cầu hủy, duyệt/từ chối hủy
 * - Tab "Gói cố định": Danh sách gói đặt sân cố định
 * - Bộ lọc theo ngày, trạng thái, sân, tìm kiếm
 * - Xuất Excel danh sách booking
 */

/**
 * Lấy thông tin profile của người chơi từ API
 * @param {number} playerId - ID của người chơi
 * @returns {Object} Thông tin profile { fullName, phone, email, avatar... }
 */
const fetchPlayerProfile = async (playerId) => {
     try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
               `https://sep490-g19-zxph.onrender.com/api/PlayerProfile/${playerId}`,
               {
                    headers: {
                         "Content-Type": "application/json",
                         ...(token && { Authorization: `Bearer ${token}` }),
                    },
               }
          );
          // API returns: {fullName, phone, email, avatar, dateOfBirth, gender, address, preferredPositions, skillLevel}
          const profileData = response.data || {};
          return {
               ok: true,
               data: profileData,
               profile: profileData,
          };
     } catch (error) {
          console.error(`Failed to fetch player profile ${playerId}:`, error);
          return {
               ok: false,
               reason: error.message || "Lấy thông tin khách hàng thất bại",
          };
     }
};

const BookingManagement = ({ isDemo = false }) => {
     const { user } = useAuth();
     const [selectedDate, setSelectedDate] = useState("");           // Ngày đang lọc
     const [statusFilter, setStatusFilter] = useState("all");        // Trạng thái đang lọc
     const [fieldFilter, setFieldFilter] = useState("all");          // Sân đang lọc
     const [searchTerm, setSearchTerm] = useState("");               // Từ khóa tìm kiếm
     const [selectedBooking, setSelectedBooking] = useState(null);   // Booking đang xem chi tiết
     const [isDetailModalOpen, setIsDetailModalOpen] = useState(false); // Modal chi tiết booking
     const [showDemoRestrictedModal, setShowDemoRestrictedModal] = useState(false);
     const [activeTab, setActiveTab] = useState("bookings");         // Tab hiện tại: bookings | cancellations | packages
     const [cancellationRequests, setCancellationRequests] = useState([]); // Danh sách yêu cầu hủy
     const [loadingCancellations, setLoadingCancellations] = useState(false);
     const [bookings, setBookings] = useState([]);                   // Danh sách booking
     const [loadingBookings, setLoadingBookings] = useState(false);
     const [bookingError, setBookingError] = useState("");
     const [selectedCancellation, setSelectedCancellation] = useState(null); // Yêu cầu hủy đang xem
     const [isCancellationDetailModalOpen, setIsCancellationDetailModalOpen] = useState(false);
     const [loadingCancellationDetail, setLoadingCancellationDetail] = useState(false);
     const [autoCompletedIds, setAutoCompletedIds] = useState({});   // Các booking đã tự động hoàn tất
     const [exporting, setExporting] = useState(false);              // Đang xuất Excel

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


     /**
      * Xử lý xác nhận thanh toán hoặc hoàn thành booking
      * - Nếu booking đang pending: Xác nhận thanh toán -> chuyển sang confirmed
      * - Nếu booking đã confirmed và paid: Hoàn thành booking -> chuyển sang completed
      * - Hiển thị QR code để thanh toán số tiền còn lại (nếu có)
      * @param {number} bookingId - ID của booking cần xác nhận
      */
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
               // Check if booking is already completed
               if (booking.status === 'completed') {
                    await Swal.fire({
                         icon: 'warning',
                         title: 'Đã hoàn thành',
                         text: 'Booking này đã hoàn thành rồi.',
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
          }

          // Determine action based on current status
          const isConfirmed = booking?.status === 'confirmed';
          const paymentStatusLower = String(booking?.paymentStatus || '').toLowerCase();
          const isPaid = paymentStatusLower === 'paid';
          const isConfirmedAndPaid = isConfirmed && isPaid;

          // Determine dialog content based on booking status
          const dialogTitle = isConfirmedAndPaid ? 'Hoàn thành booking' : 'Xác nhận thanh toán';
          const dialogMessage = isConfirmedAndPaid
               ? 'Bạn có chắc muốn hoàn thành booking này? Booking sẽ chuyển sang trạng thái "Hoàn thành".'
               : 'Bạn có chắc muốn xác nhận thanh toán cho booking này?';
          const confirmButtonText = isConfirmedAndPaid ? 'Hoàn thành' : 'Xác nhận thanh toán';
          const infoMessage = isConfirmedAndPaid
               ? '✅ <strong>Hoàn thành booking</strong> - Booking sẽ chuyển sang trạng thái "Hoàn thành"'
               : '💳 <strong>Xác nhận thanh toán</strong> - Booking sẽ chuyển sang trạng thái "Đã xác nhận" và thanh toán "Đã thanh toán"';

          // Tính số tiền còn lại và fetch QR code URL từ API cho dialog hoàn thành
          const totalAmount = booking?.amount || booking?.totalAmount || 0;
          const depositAmount = booking?.depositAmount || booking?.deposit || booking?.paidAmount || 0;
          const remainingAmount = Math.max(0, totalAmount - depositAmount);

          // Fetch QR code URL từ API nếu là hoàn thành booking
          let qrCodeImageUrl = '';
          if (isConfirmedAndPaid) {
               try {
                    const token = localStorage.getItem("token");
                    const qrResponse = await axios.get(
                         `https://sep490-g19-zxph.onrender.com/api/Booking/generate-qr/${numericBookingId}`,
                         {
                              headers: {
                                   "Content-Type": "application/json",
                                   ...(token && { Authorization: `Bearer ${token}` }),
                              },
                         }
                    );
                    qrCodeImageUrl = qrResponse.data?.qrCodeUrl || '';
                    console.log("✅ [QR CODE] Fetched QR code URL:", qrCodeImageUrl);
               } catch (error) {
                    console.error("❌ [QR CODE] Error fetching QR code:", error);
               }
          }

          // Luôn hiển thị QR code khi hoàn thành booking để player thanh toán số tiền còn lại
          const qrImageHtml = qrCodeImageUrl
               ? '<img src="' + qrCodeImageUrl + '" alt="Payment QR Code" id="qr-code-img" class="mx-auto border-2 border-orange-300 rounded-lg shadow-sm cursor-pointer hover:opacity-80 transition-opacity" style="max-width: 180px; max-height: 180px;" title="Click để xem to hơn" />'
               : '<p class="text-xs text-red-500 py-4">Không thể tải mã QR</p>';

          const qrCodeSection = isConfirmedAndPaid ? `
               <div class="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-2">
                    <p class="text-sm text-orange-800 font-semibold mb-2">💰 Thông tin thanh toán:</p>
                    <div class="text-xs text-orange-700 space-y-1 mb-3">
                         <p><strong>Tổng tiền:</strong> <span class="font-bold">${formatCurrency(totalAmount)}</span></p>
                         <p><strong>Đã cọc:</strong> <span class="font-bold text-green-600">${formatCurrency(depositAmount)}</span></p>
                         <p><strong>Còn lại:</strong> <span class="font-bold text-orange-600 text-base">${formatCurrency(remainingAmount)}</span></p>
                    </div>
                    <div class="bg-white rounded-lg p-3 text-center border border-orange-200">
                         <p class="text-xs font-semibold text-gray-700 mb-2">📱 Mã QR thanh toán số tiền còn lại:</p>
                         ${qrImageHtml}
                         <p class="text-xs text-gray-500 mt-2">${qrCodeImageUrl ? 'Click vào mã QR để xem to hơn' : ''}</p>
                    </div>
               </div>
          ` : '';

          // Lưu URL để dùng cho việc hiển thị QR to hơn
          const savedQrCodeUrl = qrCodeImageUrl;

          const result = await Swal.fire({
               title: dialogTitle,
               html: `
                    <div class="text-left">
                         <p class="mb-3">${dialogMessage}</p>
                         ${booking ? `
                              ${isConfirmedAndPaid ? `
                                   ${qrCodeSection}
                              ` : `
                                   <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                                        <p class="text-sm text-blue-800 font-semibold mb-1">📋 Thông tin booking:</p>
                                        <div class="text-xs text-blue-700 space-y-1">
                                             <p><strong>Khách hàng:</strong> ${booking.customer}</p>
                                             <p><strong>Sân:</strong> ${booking.field}</p>
                                             <p><strong>Ngày:</strong> ${formatDate(booking.date)}</p>
                                             <p><strong>Giờ:</strong> ${booking.timeSlot}</p>
                                             <p><strong>Số tiền:</strong> <span class="font-bold text-green-600">${formatCurrency(booking.amount)}</span></p>
                                             <p><strong>Trạng thái:</strong> ${getStatusText(booking.status)}</p>
                                             <p><strong>Thanh toán:</strong> ${getPaymentStatusText(booking.paymentStatus)}</p>
                                        </div>
                                   </div>
                              `}
                              <div class="bg-green-50 border border-green-200 rounded-lg p-2">
                                   <p class="text-xs text-green-800">
                                        ${infoMessage}
                                   </p>
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
               width: isConfirmedAndPaid ? '600px' : '550px',
               didOpen: () => {
                    // Thêm click handler cho QR code để hiển thị to hơn
                    const qrImg = document.getElementById('qr-code-img');
                    if (qrImg && savedQrCodeUrl) {
                         qrImg.addEventListener('click', () => {
                              Swal.fire({
                                   title: 'Mã QR thanh toán',
                                   html: `
                                        <div class="text-center">
                                             <img src="${savedQrCodeUrl}" alt="Payment QR Code" class="mx-auto border-2 border-orange-300 rounded-lg shadow-lg" style="max-width: 350px; max-height: 350px;" />
                                             <p class="text-sm text-gray-600 mt-3">Số tiền: <strong class="text-orange-600">${formatCurrency(remainingAmount)}</strong></p>
                                        </div>
                                   `,
                                   showConfirmButton: true,
                                   confirmButtonText: 'Đóng',
                                   confirmButtonColor: '#6b7280',
                                   width: '450px'
                              });
                         });
                    }
               }
          });

          if (result.isConfirmed) {
               try {
                    let confirmResult;
                    if (isConfirmedAndPaid) {
                         confirmResult = await confirmByOwner(numericBookingId);
                         if (confirmResult.success) {
                              // FieldSchedule status đã được cập nhật thành "Booked" khi confirm payment
                              // Không cần cập nhật lại ở đây vì booking đã hoàn thành

                              // Tính số tiền còn lại cần thanh toán
                              const totalAmount = booking?.amount || booking?.totalAmount || 0;
                              const depositAmount = booking?.depositAmount || booking?.deposit || 0;
                              const remainingAmount = Math.max(0, totalAmount - depositAmount);

                              // Tạo URL QR code để player thanh toán số tiền còn lại
                              const qrCodeUrl = `https://sep490-g19-zxph.onrender.com/api/Booking/generate-qr/${numericBookingId}`;

                              // Hiển thị thông báo với QR code nếu còn số tiền cần thanh toán
                              if (remainingAmount > 0) {
                                   await Swal.fire({
                                        icon: 'success',
                                        title: 'Đã hoàn thành!',
                                        html: `
                                             <div class="text-left">
                                                  <p class="mb-3">${confirmResult.message || 'Booking đã được hoàn thành thành công.'}</p>
                                                  <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                                                       <p class="text-sm text-blue-800 font-semibold mb-2">💰 Thông tin thanh toán:</p>
                                                       <div class="text-xs text-blue-700 space-y-1">
                                                            <p><strong>Tổng tiền:</strong> <span class="font-bold">${formatCurrency(totalAmount)}</span></p>
                                                            <p><strong>Đã cọc:</strong> <span class="font-bold text-green-600">${formatCurrency(depositAmount)}</span></p>
                                                            <p><strong>Đã thanh toán còn lại:</strong> <span class="font-bold text-orange-600">${formatCurrency(remainingAmount)}</span></p>
                                                       </div>
                                                  </div>
                                                 
                                             </div>
                                        `,
                                        confirmButtonColor: '#10b981',
                                        width: '500px'
                                   });
                              } else {
                                   await Swal.fire({
                                        icon: 'success',
                                        title: 'Đã hoàn thành!',
                                        text: confirmResult.message || 'Booking đã được hoàn thành thành công. Trạng thái đã chuyển sang "Hoàn thành".',
                                        confirmButtonColor: '#10b981'
                                   });
                              }
                         }
                    } else {
                         // Booking pending -> gọi confirm-payment để xác nhận thanh toán
                         const amount = booking?.amount || 0;

                         confirmResult = await confirmPaymentAPI(numericBookingId, amount);

                         if (confirmResult.success) {
                              // Cập nhật FieldSchedule status thành "Booked" khi owner xác nhận booking
                              if (booking?.scheduleId || booking?.scheduleID) {
                                   const scheduleId = booking.scheduleId || booking.scheduleID;
                                   try {
                                        console.log(`📝 [UPDATE SCHEDULE] Owner confirmed booking, updating FieldSchedule ${scheduleId} to Booked`);
                                        const updateResult = await updateFieldScheduleStatus(Number(scheduleId), "Booked");
                                        if (updateResult.success) {
                                             console.log(`✅ [UPDATE SCHEDULE] Successfully updated schedule ${scheduleId} to Booked`);
                                        } else {
                                             console.warn(`⚠️ [UPDATE SCHEDULE] Failed to update schedule ${scheduleId}:`, updateResult.error);
                                        }
                                   } catch (error) {
                                        console.error(`❌ [UPDATE SCHEDULE] Error updating schedule:`, error);
                                   }
                              }

                              await Swal.fire({
                                   icon: 'success',
                                   title: 'Đã xác nhận thanh toán!',
                                   text: confirmResult.message || 'Booking đã được xác nhận thanh toán thành công. Trạng thái đã chuyển sang "Đã xác nhận".',
                                   confirmButtonColor: '#10b981'
                              });
                         }
                    }

                    if (confirmResult.success) {
                         // Reload bookings to get updated status from backend
                         await loadBookings();

                         // Log normalized bookings after reload to verify status
                         setTimeout(() => {
                              const updatedBooking = bookings.find(b => (b.bookingId || b.id) === numericBookingId);
                              if (updatedBooking) {

                              }
                         }, 500);
                    } else {
                         // Kiểm tra nếu là lỗi CORS - có thể request đã thành công
                         const isCorsError = confirmResult.isCorsError;
                         const errorMsg = confirmResult.error || (isConfirmedAndPaid ? 'Không thể hoàn thành booking' : 'Không thể xác nhận thanh toán');

                         // Nếu là lỗi CORS, reload dữ liệu để kiểm tra xem có thay đổi không
                         if (isCorsError) {
                              await loadBookings();

                              // Đợi một chút để dữ liệu được load
                              await new Promise(resolve => setTimeout(resolve, 500));

                              // Kiểm tra xem booking có thay đổi không
                              const updatedBooking = bookings.find(b => (b.bookingId || b.id) === numericBookingId);
                              const hasStatusChanged = updatedBooking && (
                                   (isConfirmedAndPaid && updatedBooking.status === 'completed') ||
                                   (!isConfirmedAndPaid && updatedBooking.status === 'confirmed' && updatedBooking.paymentStatus === 'paid')
                              );

                              if (hasStatusChanged) {
                                   // Request đã thành công dù có lỗi CORS
                                   await Swal.fire({
                                        icon: 'success',
                                        title: isConfirmedAndPaid ? 'Đã hoàn thành!' : 'Đã xác nhận thanh toán!',
                                        html: `
                                             <div class="text-left">
                                                  <p class="mb-2">${isConfirmedAndPaid ? 'Booking đã được hoàn thành thành công.' : 'Booking đã được xác nhận thanh toán thành công.'}</p>
                                                  <p class="text-sm text-yellow-600 mt-2">
                                                       ⚠️ Lưu ý: Có lỗi CORS trong response nhưng request đã được xử lý thành công.
                                                  </p>
                                             </div>
                                        `,
                                        confirmButtonColor: '#10b981'
                                   });
                                   return; // Thoát sớm vì đã thành công
                              }
                         }

                         // Nếu không phải CORS error hoặc không có thay đổi, hiển thị lỗi
                         await Swal.fire({
                              icon: 'error',
                              title: isConfirmedAndPaid ? 'Lỗi hoàn thành booking' : 'Lỗi xác nhận thanh toán',
                              html: `
                                   <div class="text-left">
                                        <p class="mb-2">${errorMsg}</p>
                                        <p class="text-sm text-gray-600 mt-2">
                                             Có thể booking đã được xử lý hoặc có vấn đề với dữ liệu.
                                        </p>
                                        ${isCorsError ? '<p class="text-sm text-yellow-600 mt-2">⚠️ Lỗi CORS: Vui lòng kiểm tra lại sau hoặc thử refresh trang.</p>' : ''}
                                   </div>
                              `,
                              confirmButtonColor: '#ef4444'
                         });
                         // Reload to get latest status
                         loadBookings();
                    }
               } catch (error) {
                    console.error(`[BookingManagement] Error ${isConfirmedAndPaid ? 'completing' : 'confirming payment'} booking:`, error);
                    await Swal.fire({
                         icon: 'error',
                         title: 'Lỗi',
                         text: isConfirmedAndPaid
                              ? 'Có lỗi xảy ra khi hoàn thành booking. Vui lòng thử lại.'
                              : 'Có lỗi xảy ra khi xác nhận thanh toán. Vui lòng thử lại.',
                         confirmButtonColor: '#ef4444'
                    });
                    // Reload to get latest status
                    loadBookings();
               }
          }
     };

     /**
      * Xử lý hủy booking từ phía Owner
      * - Hiển thị dialog nhập lý do hủy
      * - Nếu booking đã thanh toán: Hiển thị thông tin hoàn tiền và QR code
      * - Cập nhật trạng thái FieldSchedule về "Available"
      * - Tự động xác nhận yêu cầu hủy nếu có
      * @param {number} bookingId - ID của booking cần hủy
      */
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
                    // Lấy scheduleId từ booking trước khi hủy để cập nhật FieldSchedule
                    const scheduleId = booking?.scheduleId
                         || booking?.scheduleID
                         || booking?.ScheduleID
                         || booking?.ScheduleId
                         || booking?.apiSource?.scheduleId
                         || booking?.apiSource?.scheduleID
                         || booking?.apiSource?.ScheduleID;

                    console.log("🔍 [OWNER CANCEL] Booking data:", {
                         bookingId: numericBookingId,
                         scheduleId,
                         bookingKeys: Object.keys(booking || {}),
                         apiSourceKeys: Object.keys(booking?.apiSource || {})
                    });

                    // Use the same API as player - backend will check token to determine if Owner or Player is cancelling
                    const result = await cancelBooking(numericBookingId, reason);

                    if (result.success) {
                         // Thử lấy scheduleId từ response của cancel API nếu có
                         const responseScheduleId = result.data?.scheduleId
                              || result.data?.scheduleID
                              || result.data?.ScheduleID
                              || result.data?.booking?.scheduleId;

                         const finalScheduleId = scheduleId || responseScheduleId;

                         console.log("🔍 [OWNER CANCEL] Schedule ID resolution:", {
                              fromBooking: scheduleId,
                              fromResponse: responseScheduleId,
                              final: finalScheduleId
                         });

                         // Cập nhật FieldSchedule status về "Available" khi hủy booking thành công
                         if (finalScheduleId && Number(finalScheduleId) > 0) {
                              try {
                                   console.log("📝 [UPDATE SCHEDULE] Updating FieldSchedule status to 'Available' for schedule", finalScheduleId);
                                   const updateResult = await updateFieldScheduleStatus(Number(finalScheduleId), "Available");
                                   if (updateResult.success) {
                                        console.log(`✅ [UPDATE SCHEDULE] Updated schedule ${finalScheduleId} to Available after canceling booking`);
                                   } else {
                                        console.warn(`⚠️ [UPDATE SCHEDULE] Failed to update schedule ${finalScheduleId}:`, updateResult.error);
                                   }
                              } catch (error) {
                                   console.error(`❌ [UPDATE SCHEDULE] Error updating schedule ${finalScheduleId}:`, error);
                              }
                         } else {
                              console.warn("⚠️ [OWNER CANCEL] No scheduleId found, cannot update FieldSchedule status. Backend should handle this automatically.");
                         }

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

     /**
      * Tải danh sách yêu cầu hủy booking từ API
      * Được gọi khi chuyển sang tab "Yêu cầu hủy" hoặc sau khi xử lý yêu cầu
      */
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

     /**
      * Xử lý xác nhận yêu cầu hủy booking
      * - Hiển thị dialog xác nhận
      * - Gọi API xác nhận hủy
      * - Cập nhật trạng thái FieldSchedule về "Available"
      * - Reload danh sách yêu cầu hủy và bookings
      * @param {number} cancellationId - ID của yêu cầu hủy
      */
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
                    // Tìm cancellation request để lấy scheduleId
                    const cancellationRequest = cancellationRequests.find(
                         c => (c.requestId || c.id || c.cancellationId) === cancellationId
                    );

                    // Lấy scheduleId từ cancellation request hoặc booking liên quan
                    let scheduleId = cancellationRequest?.scheduleId
                         || cancellationRequest?.scheduleID
                         || cancellationRequest?.ScheduleID;

                    // Nếu không có trong cancellation, tìm trong bookings
                    if (!scheduleId && cancellationRequest?.bookingId) {
                         const relatedBooking = bookings.find(
                              b => (b.bookingId || b.id) === cancellationRequest.bookingId
                         );
                         scheduleId = relatedBooking?.scheduleId
                              || relatedBooking?.scheduleID
                              || relatedBooking?.ScheduleID
                              || relatedBooking?.apiSource?.scheduleId;
                    }

                    console.log("🔍 [CONFIRM CANCELLATION] Data:", {
                         cancellationId,
                         scheduleId,
                         cancellationRequest: cancellationRequest ? Object.keys(cancellationRequest) : null
                    });

                    const confirmResult = await confirmCancellation(cancellationId);
                    if (confirmResult.success) {
                         // Cập nhật FieldSchedule status về "Available" khi confirm cancellation thành công
                         // Thử lấy scheduleId từ response nếu có
                         const responseScheduleId = confirmResult.data?.scheduleId
                              || confirmResult.data?.scheduleID
                              || confirmResult.data?.booking?.scheduleId;

                         const finalScheduleId = scheduleId || responseScheduleId;

                         if (finalScheduleId && Number(finalScheduleId) > 0) {
                              try {
                                   console.log("📝 [UPDATE SCHEDULE] Updating FieldSchedule status to 'Available' for schedule", finalScheduleId);
                                   const updateResult = await updateFieldScheduleStatus(Number(finalScheduleId), "Available");
                                   if (updateResult.success) {
                                        console.log(`✅ [UPDATE SCHEDULE] Updated schedule ${finalScheduleId} to Available after confirming cancellation`);
                                   } else {
                                        console.warn(`⚠️ [UPDATE SCHEDULE] Failed to update schedule ${finalScheduleId}:`, updateResult.error);
                                   }
                              } catch (error) {
                                   console.error(`❌ [UPDATE SCHEDULE] Error updating schedule ${finalScheduleId}:`, error);
                              }
                         } else {
                              console.warn("⚠️ [CONFIRM CANCELLATION] No scheduleId found, cannot update FieldSchedule status");
                         }

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

     /**
      * Xử lý xóa yêu cầu hủy booking (từ chối yêu cầu hủy)
      * - Hiển thị dialog xác nhận xóa
      * - Gọi API xóa yêu cầu hủy
      * - Reload danh sách yêu cầu hủy
      * @param {number} cancellationId - ID của yêu cầu hủy cần xóa
      */
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

     /**
      * Xem chi tiết yêu cầu hủy booking
      * - Mở modal chi tiết
      * - Gọi API lấy thông tin chi tiết yêu cầu hủy
      * @param {number} cancellationId - ID của yêu cầu hủy cần xem
      */
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
          return apiBookings.map((item, index) => {
               // Parse date and time with validation
               let startTime = null;
               let endTime = null;

               if (item.startTime) {
                    const startDate = new Date(item.startTime);
                    if (!isNaN(startDate.getTime())) {
                         startTime = startDate;
                    }
               }

               if (item.endTime) {
                    const endDate = new Date(item.endTime);
                    if (!isNaN(endDate.getTime())) {
                         endTime = endDate;
                    }
               }

               // Get booking date - prefer from item.date, then from startTime, then empty string
               let bookingDate = '';
               if (item.date) {
                    // If date is already a string in YYYY-MM-DD format, use it directly
                    if (typeof item.date === 'string' && item.date.match(/^\d{4}-\d{2}-\d{2}/)) {
                         bookingDate = item.date.split('T')[0];
                    } else {
                         // Try to parse as date
                         const dateObj = new Date(item.date);
                         if (!isNaN(dateObj.getTime())) {
                              bookingDate = dateObj.toISOString().split('T')[0];
                         }
                    }
               } else if (startTime && !isNaN(startTime.getTime())) {
                    bookingDate = startTime.toISOString().split('T')[0];
               }

               // Format time slot - prioritize time from schedule, then slot name
               let timeSlot = '';

               // First try to get time from startTime and endTime (from schedule)
               if (startTime && endTime && !isNaN(startTime.getTime()) && !isNaN(endTime.getTime())) {
                    try {
                         const startTimeStr = startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                         const endTimeStr = endTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                         timeSlot = `${startTimeStr} - ${endTimeStr}`;
                    } catch (error) {
                         console.error('Error formatting time slot from Date objects:', error);
                    }
               }

               // If timeSlot is still empty, try to parse from string format (HH:MM - HH:MM)
               if (!timeSlot && item.startTime && item.endTime) {
                    try {
                         // Handle string format like "06:00" or "06:00:00"
                         const startTimeStr = typeof item.startTime === 'string'
                              ? item.startTime.substring(0, 5)
                              : item.startTime;
                         const endTimeStr = typeof item.endTime === 'string'
                              ? item.endTime.substring(0, 5)
                              : item.endTime;

                         if (startTimeStr && endTimeStr) {
                              timeSlot = `${startTimeStr} - ${endTimeStr}`;
                         }
                    } catch (error) {
                         console.error('Error formatting time slot from strings:', error);
                    }
               }

               // If still empty, use slot name as fallback
               if (!timeSlot) {
                    timeSlot = item.slotName || item.SlotName || item.timeSlot || '';
               }

               const rawStatus = item.bookingStatus || item.BookingStatus || item.status || item.Status || 'pending';
               const status = String(rawStatus).toLowerCase();

               // Log for debugging status mapping
               if (index === 0 || item.bookingStatus || item.BookingStatus) {

               }

               let normalizedStatus;
               if (status.includes('cancel')) {
                    normalizedStatus = 'cancelled';
               } else if (status === 'completed' || status.includes('complete')) {
                    // Backend says completed
                    normalizedStatus = 'completed';
               } else if (status === 'confirmed' || status.includes('confirm')) {
                    // Luôn tin theo trạng thái từ BE, không tự chuyển sang completed trên FE
                    normalizedStatus = 'confirmed';
               } else if (status.includes('pending')) {
                    normalizedStatus = 'pending';
               } else {
                    normalizedStatus = status;
               }

               // Normalize payment status - handle both camelCase (paymentStatus) and PascalCase (PaymentStatus) from backend
               // Also handle both "Paid"/"Unpaid" (capitalized) and "paid"/"unpaid" (lowercase)
               const rawPaymentStatus = item.paymentStatus || item.PaymentStatus || 'pending';
               const paymentStatus = String(rawPaymentStatus).toLowerCase().trim();

               // Log for debugging payment status mapping
               if (index === 0 || item.paymentStatus || item.PaymentStatus) {

               }

               let normalizedPaymentStatus;
               // IMPORTANT: Check exact matches first, then check includes
               // Check 'unpaid' BEFORE 'paid' because 'unpaid' contains 'paid' substring
               if (paymentStatus === 'unpaid') {
                    normalizedPaymentStatus = 'unpaid';
               } else if (paymentStatus === 'paid') {
                    normalizedPaymentStatus = 'paid';
               } else if (paymentStatus.includes('unpaid')) {
                    normalizedPaymentStatus = 'unpaid';
               } else if (paymentStatus.includes('paid')) {
                    normalizedPaymentStatus = 'paid';
               } else if (paymentStatus.includes('refund')) {
                    normalizedPaymentStatus = 'refunded';
               } else if (paymentStatus.includes('fail')) {
                    normalizedPaymentStatus = 'failed';
               } else {
                    normalizedPaymentStatus = 'pending';
               }

               // Log final normalized payment status for debugging
               if (index === 0 || item.paymentStatus || item.PaymentStatus) {

               }

               // Extract and normalize bookingId
               const rawBookingId = item.bookingId || item.bookingID || item.id;
               const numericBookingId = rawBookingId ? Number(rawBookingId) : null;

               // Get field name from schedule data (preferred) or booking data
               const fieldName = item.fieldName || item.FieldName || item.field || "Chưa rõ sân";

               // Get slot name from schedule data (preferred) or booking data
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
                              if (!isNaN(createdDate.getTime())) {
                                   return createdDate.toISOString();
                              }
                         }
                         if (item.createdDate) {
                              const createdDate = new Date(item.createdDate);
                              if (!isNaN(createdDate.getTime())) {
                                   return createdDate.toISOString();
                              }
                         }
                         return new Date().toISOString();
                    })(),
                    notes: item.notes || item.note || "",
                    // Additional fields for detail modal
                    userId: item.userId || item.userID,
                    scheduleId: item.scheduleId || item.scheduleID,
                    depositAmount: Number(item.depositAmount || 0),
                    hasOpponent: Boolean(item.hasOpponent),
                    address: item.complexName || item.address || "",
                    // Store startTime and endTime for checking if booking has passed
                    startTime: startTime && !isNaN(startTime.getTime()) ? startTime.toISOString() : null,
                    endTime: endTime && !isNaN(endTime.getTime()) ? endTime.toISOString() : null,
                    // Store original status from backend for debugging
                    originalStatus: rawStatus
               };
          });
     };

     // Load bookings from API
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
                    // Fetch user info and schedule info for each booking
                    const bookingsWithUserAndScheduleInfo = await Promise.all(
                         result.data.map(async (booking) => {
                              let enrichedBooking = { ...booking };

                              // Fetch customer info using PlayerProfile API
                              if (booking.userId || booking.userID) {
                                   try {
                                        const userId = booking.userId || booking.userID;
                                        const userResult = await fetchPlayerProfile(userId);
                                        if (userResult.ok && userResult.data) {
                                             const userData = userResult.profile || userResult.data;
                                             // API returns: {fullName, phone, email, ...}
                                             const customerPhone = userData.phone || userData.Phone || userData.phoneNumber || userData.PhoneNumber || '';
                                             enrichedBooking = {
                                                  ...enrichedBooking,
                                                  customerName: userData.fullName || userData.name || userData.userName || userData.FullName || 'Khách hàng',
                                                  customerPhone: customerPhone,
                                                  customerEmail: userData.email || userData.Email || '',
                                             };
                                             // Debug log to verify phone is being set
                                             if (!customerPhone) {
                                                  console.warn(`No phone found for user ${userId}:`, userData);
                                             }
                                        }
                                   } catch (error) {
                                        console.error(`Failed to fetch customer profile ${booking.userId}:`, error);
                                   }
                              }

                              // Fetch schedule info to get accurate field and slot names
                              const scheduleId = booking.scheduleId || booking.scheduleID || booking.ScheduleID;
                              if (scheduleId) {
                                   try {
                                        const scheduleResult = await fetchFieldScheduleById(scheduleId);
                                        if (scheduleResult.success && scheduleResult.data) {
                                             const scheduleData = scheduleResult.data;

                                             // Get date from schedule
                                             const scheduleDate = scheduleData.date || scheduleData.Date || enrichedBooking.date;

                                             // Get time from schedule (format: "HH:MM" or "HH:MM:SS")
                                             const scheduleStartTime = scheduleData.startTime || scheduleData.StartTime;
                                             const scheduleEndTime = scheduleData.endTime || scheduleData.EndTime;

                                             // Combine date and time to create full datetime strings
                                             let fullStartTime = null;
                                             let fullEndTime = null;

                                             if (scheduleDate && scheduleStartTime && scheduleEndTime) {
                                                  // Parse date
                                                  let dateStr = '';
                                                  if (typeof scheduleDate === 'string') {
                                                       dateStr = scheduleDate.split('T')[0]; // Get YYYY-MM-DD part
                                                  } else if (scheduleDate.year) {
                                                       dateStr = `${scheduleDate.year}-${String(scheduleDate.month).padStart(2, '0')}-${String(scheduleDate.day).padStart(2, '0')}`;
                                                  }

                                                  // Parse time (handle both "HH:MM" and "HH:MM:SS")
                                                  const startTimeStr = typeof scheduleStartTime === 'string'
                                                       ? scheduleStartTime.substring(0, 5) // Get HH:MM part
                                                       : `${String(scheduleStartTime.hour || 0).padStart(2, '0')}:${String(scheduleStartTime.minute || 0).padStart(2, '0')}`;

                                                  const endTimeStr = typeof scheduleEndTime === 'string'
                                                       ? scheduleEndTime.substring(0, 5) // Get HH:MM part
                                                       : `${String(scheduleEndTime.hour || 0).padStart(2, '0')}:${String(scheduleEndTime.minute || 0).padStart(2, '0')}`;

                                                  // Create full datetime strings
                                                  if (dateStr && startTimeStr && endTimeStr) {
                                                       fullStartTime = `${dateStr}T${startTimeStr}:00`;
                                                       fullEndTime = `${dateStr}T${endTimeStr}:00`;
                                                  }
                                             }

                                             enrichedBooking = {
                                                  ...enrichedBooking,
                                                  // Use schedule data for accurate field and slot info
                                                  fieldName: scheduleData.fieldName || scheduleData.FieldName || enrichedBooking.fieldName || enrichedBooking.field,
                                                  slotName: scheduleData.slotName || scheduleData.SlotName || enrichedBooking.slotName || enrichedBooking.timeSlot,
                                                  // Also update date and time from schedule if available
                                                  date: scheduleDate || enrichedBooking.date,
                                                  // Use combined datetime if available, otherwise use original
                                                  startTime: fullStartTime || scheduleData.startTime || scheduleData.StartTime || enrichedBooking.startTime,
                                                  endTime: fullEndTime || scheduleData.endTime || scheduleData.EndTime || enrichedBooking.endTime,
                                             };
                                        }
                                   } catch (error) {
                                        console.error(`Failed to fetch schedule ${scheduleId}:`, error);
                                   }
                              }

                              return enrichedBooking;
                         })
                    );

                    const normalizedBookings = normalizeBookingData(bookingsWithUserAndScheduleInfo);
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
     }, [ownerId]);

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

     // Check if booking has passed (endTime is in the past)
     const isBookingPassed = (booking) => {
          if (!booking.endTime) {
               // If no endTime, try to check from date and timeSlot
               if (booking.date && booking.timeSlot) {
                    // Try to parse timeSlot (format: "HH:MM - HH:MM")
                    const timeMatch = booking.timeSlot.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
                    if (timeMatch) {
                         const [, , , endHour, endMin] = timeMatch;
                         const bookingDate = new Date(booking.date);
                         bookingDate.setHours(parseInt(endHour), parseInt(endMin), 0, 0);
                         return bookingDate < new Date();
                    }
               }
               return false;
          }

          try {
               const endTime = new Date(booking.endTime);
               if (isNaN(endTime.getTime())) {
                    return false;
               }
               return endTime < new Date();
          } catch (error) {
               console.error('Error checking if booking passed:', error);
               return false;
          }
     };

     const filteredBookings = useMemo(() => {
          return bookings.filter(booking => {
               // booking.date luôn normalize dạng "yyyy-MM-dd" trong normalizeBookingData
               const matchesDate =
                    !selectedDate ||
                    booking.date === selectedDate ||
                    (typeof booking.date === "string" &&
                         typeof selectedDate === "string" &&
                         booking.date.startsWith(selectedDate));

               const normalizedStatus = String(booking.status || "").toLowerCase();
               const matchesStatus = statusFilter === "all" || normalizedStatus === statusFilter;

               const matchesField = fieldFilter === "all" || booking.field === fieldFilter;
               const matchesSearch = !searchTerm ||
                    booking.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    booking.phone.includes(searchTerm) ||
                    booking.email.toLowerCase().includes(searchTerm.toLowerCase());

               return matchesDate && matchesStatus && matchesField && matchesSearch;
          });
     }, [bookings, selectedDate, statusFilter, fieldFilter, searchTerm]);

     // Auto gọi API confirmByOwner cho các booking đã xác nhận, đã thanh toán và đã qua thời gian
     useEffect(() => {
          if (!bookings || bookings.length === 0) return;

          const bookingsToAutoComplete = bookings.filter((b) => {
               const id = b.bookingId || b.id;
               if (!id) return false;
               if (autoCompletedIds[id]) return false;

               const isConfirmed = b.status === "confirmed";
               const isPaid = String(b.paymentStatus || "").toLowerCase() === "paid";

               return isConfirmed && isPaid && isBookingPassed(b);
          });

          if (bookingsToAutoComplete.length === 0) return;

          (async () => {
               let hasChanges = false;
               for (const booking of bookingsToAutoComplete) {
                    const id = booking.bookingId || booking.id;
                    try {
                         const result = await confirmByOwner(id);
                         if (result?.success) {
                              hasChanges = true;
                              setAutoCompletedIds((prev) => ({ ...prev, [id]: true }));
                         } else {
                              console.error("Không thể tự động hoàn thành booking", id, result?.error);
                         }
                    } catch (error) {
                         console.error("Lỗi khi tự động hoàn thành booking", id, error);
                    }
               }

               if (hasChanges) {
                    await loadBookings();
               }
          })();
     }, [bookings, autoCompletedIds, loadBookings]);

     // Pagination for bookings
     const bookingsPagination = usePagination(filteredBookings, 10);

     // Pagination for cancellation requests
     const cancellationsPagination = usePagination(cancellationRequests, 10);

     // Reset pagination when switching tabs
     useEffect(() => {
          if (activeTab === 'bookings' && bookingsPagination.currentPage !== 1) {
               bookingsPagination.handlePageChange(1);
          } else if (activeTab === 'cancellations' && cancellationsPagination.currentPage !== 1) {
               cancellationsPagination.handlePageChange(1);
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [activeTab]);

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

     const toCsvValue = (value) => {
          if (value === null || value === undefined) return "";
          const str = String(value);
          if (str.includes('"') || str.includes(",") || str.includes("\n")) {
               return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
     };

     const handleExportReport = async () => {
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
               const headers = [
                    "Mã booking",
                    "Khách hàng",
                    "Số điện thoại",
                    "Email",
                    "Sân",
                    "Ngày",
                    "Khung giờ",
                    "Trạng thái",
                    "Thanh toán",
                    "Tiền cọc",
                    "Tổng tiền",
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
                    headers.map(toCsvValue).join(","),
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
     };

     return (
          <>
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
                              <Button
                                   variant="outline"
                                   className="rounded-2xl border-teal-300 text-teal-700 hover:bg-teal-50"
                                   onClick={handleExportReport}
                                   disabled={exporting}
                              >
                                   <Download className="w-4 h-4 mr-2" />
                                   {exporting ? "Đang xuất..." : "Xuất báo cáo"}
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
                              <button
                                   onClick={() => setActiveTab('packages')}
                                   className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'packages'
                                        ? 'border-teal-500 text-teal-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                              >
                                   <Repeat className="w-4 h-4" />
                                   <span>Sân cố định</span>
                              </button>
                         </nav>
                    </div>

                    {/* Bookings Tab */}
                    {activeTab === 'bookings' && (
                         <>
                              <OwnerFilters
                                   selectedDate={selectedDate}
                                   statusFilter={statusFilter}
                                   fieldFilter={fieldFilter}
                                   searchTerm={searchTerm}
                                   statusOptions={statusOptions}
                                   fields={fields}
                                   onDateChange={setSelectedDate}
                                   onStatusChange={setStatusFilter}
                                   onFieldChange={setFieldFilter}
                                   onSearchChange={setSearchTerm}
                                   onClearFilters={() => {
                                        setSelectedDate("");
                                        setStatusFilter("all");
                                        setFieldFilter("all");
                                        setSearchTerm("");
                                   }}
                              />

                              <OwnerBookingsTable
                                   loading={loadingBookings}
                                   error={bookingError}
                                   filteredCount={filteredBookings.length}
                                   bookingsPagination={bookingsPagination}
                                   formatDate={formatDate}
                                   isBookingPassed={isBookingPassed}
                                   handleViewDetails={handleViewDetails}
                                   handleConfirmBooking={handleConfirmBooking}
                                   handleCancelBooking={handleCancelBooking}
                                   formatCurrency={formatCurrency}
                                   getStatusColor={getStatusColor}
                                   getStatusText={getStatusText}
                                   getPaymentStatusColor={getPaymentStatusColor}
                                   getPaymentStatusText={getPaymentStatusText}
                              />

                              {/* Booking Detail Modal */}
                              <Modal
                                   isOpen={isDetailModalOpen}
                                   onClose={() => setIsDetailModalOpen(false)}
                                   title="Chi tiết đặt sân"
                                   className="max-w-2xl rounded-2xl border border-teal-200 shadow-lg h-[90vh] overflow-y-auto scrollbar-hide bg-gray-300"
                              >
                                   {selectedBooking && (
                                        <div className="space-y-3">
                                             {/* Customer Info */}
                                             <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-3 rounded-2xl border border-teal-200">
                                                  <h3 className="text-lg font-semibold text-teal-800 mb-2 flex items-center">
                                                       <User className="w-5 h-5 mr-2" />
                                                       Thông tin khách hàng
                                                  </h3>
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                       <div className="bg-white py-2 px-3 rounded-2xl border border-teal-100">
                                                            <label className="text-sm font-semibold text-teal-700 flex items-center mb-1">
                                                                 <User className="w-4 h-4 mr-1" />
                                                                 Tên khách hàng
                                                            </label>
                                                            <p className="text-sm font-semibold text-gray-900">{selectedBooking.customer}</p>
                                                       </div>
                                                       <div className="bg-white py-2 px-3 rounded-2xl border border-teal-100">
                                                            <label className="text-sm font-semibold text-teal-700 flex items-center mb-1">
                                                                 <Phone className="w-4 h-4 mr-1" />
                                                                 Số điện thoại
                                                            </label>
                                                            <p className="text-sm font-semibold text-gray-900">{selectedBooking.phone}</p>
                                                       </div>
                                                       <div className="bg-white py-2 px-3 rounded-2xl border border-teal-100">
                                                            <label className="text-sm font-semibold text-teal-700 flex items-center mb-1">
                                                                 <Mail className="w-4 h-4 mr-1" />
                                                                 Email
                                                            </label>
                                                            <p className="text-sm font-semibold text-gray-900">{selectedBooking.email}</p>
                                                       </div>
                                                       <div className="bg-white py-2 px-3 rounded-2xl border border-teal-100">
                                                            <label className="text-sm font-semibold text-teal-700 flex items-center mb-1">
                                                                 <Calendar className="w-4 h-4 mr-1" />
                                                                 Ngày đặt
                                                            </label>
                                                            <p className="text-sm font-semibold text-gray-900">{formatDate(selectedBooking.createdAt)}</p>
                                                       </div>
                                                  </div>
                                             </div>

                                             {/* Booking Info */}
                                             <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-200">
                                                  <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center">
                                                       <Calendar className="w-5 h-5 mr-2" />
                                                       Thông tin booking
                                                  </h3>
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                       <div className="bg-white py-2 px-3 rounded-2xl border border-blue-100">
                                                            <label className="text-sm font-semibold text-blue-700 flex items-center mb-1">
                                                                 <MapPin className="w-4 h-4 mr-1" />
                                                                 Sân
                                                            </label>
                                                            <p className="text-sm font-semibold text-gray-900">{selectedBooking.field}</p>
                                                       </div>
                                                       <div className="bg-white py-2 px-3 rounded-2xl border border-blue-100">
                                                            <label className="text-sm font-semibold text-blue-700 flex items-center mb-1">
                                                                 <Calendar className="w-4 h-4 mr-1" />
                                                                 Ngày
                                                            </label>
                                                            <p className="text-sm font-semibold text-gray-900">{formatDate(selectedBooking.date)}</p>
                                                       </div>
                                                       <div className="bg-white py-2 px-3 rounded-2xl border border-blue-100">
                                                            <label className="text-sm font-semibold text-blue-700 flex items-center mb-1">
                                                                 <Clock className="w-4 h-4 mr-1" />
                                                                 Khung giờ
                                                            </label>
                                                            <p className="text-sm font-semibold text-gray-900">{selectedBooking.timeSlot}</p>
                                                       </div>
                                                       <div className="bg-white py-2 px-3 rounded-2xl border border-blue-100">
                                                            <label className="text-sm font-semibold text-blue-700 flex items-center mb-1">
                                                                 <DollarSign className="w-4 h-4 mr-1" />
                                                                 Số tiền
                                                            </label>
                                                            <p className="text-lg font-bold text-emerald-600">{formatCurrency(selectedBooking.amount)}</p>
                                                       </div>
                                                  </div>
                                             </div>

                                             {/* Status */}
                                             <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-3 rounded-2xl border border-amber-200">
                                                  <h3 className="text-lg font-semibold text-amber-800 mb-2 flex items-center">
                                                       <AlertCircle className="w-5 h-5 mr-2" />
                                                       Trạng thái
                                                  </h3>
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                       <div className="bg-white py-2 px-3 rounded-2xl border border-amber-100">
                                                            <label className="text-sm font-semibold text-amber-700 flex items-center mb-1">
                                                                 <CheckSquare className="w-4 h-4 mr-1" />
                                                                 Trạng thái booking
                                                            </label>
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedBooking.status)}`}>
                                                                 {getStatusText(selectedBooking.status)}
                                                            </span>
                                                       </div>
                                                       <div className="bg-white py-2 px-3 rounded-2xl border border-amber-100">
                                                            <label className="text-sm font-semibold text-amber-700 flex items-center mb-1">
                                                                 <CreditCard className="w-4 h-4 mr-1" />
                                                                 Trạng thái thanh toán
                                                            </label>
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(selectedBooking.paymentStatus)}`}>
                                                                 {getPaymentStatusText(selectedBooking.paymentStatus)}
                                                            </span>
                                                       </div>
                                                  </div>
                                             </div>

                                             {/* Cancellation Info for Cancelled Bookings */}
                                             {selectedBooking.status === 'cancelled' && selectedBooking.notes && (
                                                  <>
                                                       <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-2xl border border-red-200">
                                                            <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
                                                                 <AlertCircle className="w-5 h-5 mr-2" />
                                                                 Lý do hủy booking
                                                            </h3>
                                                            <div className="bg-white p-4 rounded-lg border border-red-100">
                                                                 <p className="text-sm font-medium text-gray-900 leading-relaxed whitespace-pre-wrap">
                                                                      {(() => {
                                                                           let displayNotes = selectedBooking.notes;
                                                                           if (displayNotes.includes('RefundQR:')) {
                                                                                displayNotes = displayNotes.split('|')[0].trim();
                                                                           }
                                                                           displayNotes = displayNotes.replace(/^Lý do hủy:\s*/i, '');
                                                                           return displayNotes;
                                                                      })()}
                                                                 </p>
                                                            </div>
                                                       </div>
                                                       {selectedBooking.amount > 0 && (
                                                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-200">
                                                                 <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                                                                      <DollarSign className="w-5 h-5 mr-2" />
                                                                      Thông tin hoàn tiền
                                                                 </h3>
                                                                 <div className="bg-white p-4 rounded-lg border border-green-100">
                                                                      <div className="space-y-2 text-sm">
                                                                           <div className="flex justify-between items-center">
                                                                                <span className="text-gray-600">Số tiền đã hoàn:</span>
                                                                                <span className="text-lg font-bold text-green-600">
                                                                                     {formatCurrency(selectedBooking.amount)}
                                                                                </span>
                                                                           </div>
                                                                           <p className="text-xs text-gray-500 mt-2">
                                                                                ✓ Đã hoàn tiền cho khách hàng
                                                                           </p>
                                                                      </div>
                                                                 </div>
                                                            </div>
                                                       )}
                                                  </>
                                             )}

                                             {/* Notes for non-cancelled bookings */}
                                             {selectedBooking.status !== 'cancelled' && selectedBooking.notes && (
                                                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-2xl border border-purple-200">
                                                       <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center">
                                                            <FileText className="w-5 h-5 mr-2" />
                                                            Ghi chú
                                                       </h3>
                                                       <div className="bg-white p-4 rounded-lg border border-purple-100">
                                                            <p className="text-sm font-medium text-gray-900 leading-relaxed whitespace-pre-wrap">
                                                                 {selectedBooking.notes}
                                                            </p>
                                                       </div>
                                                  </div>
                                             )}

                                             {/* Actions */}
                                             <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                                                  {isBookingPassed(selectedBooking) ? (
                                                       // Booking đã qua - chỉ hiển thị nút đóng
                                                       <Button
                                                            variant="outline"
                                                            onClick={() => {
                                                                 setIsDetailModalOpen(false);
                                                            }}
                                                            className="rounded-2xl"
                                                       >
                                                            Đóng
                                                       </Button>
                                                  ) : (selectedBooking.status === 'pending' || (selectedBooking.status === 'confirmed' && selectedBooking.paymentStatus === 'paid')) ? (
                                                       // Booking chưa qua và có thể thao tác - hiển thị đầy đủ các nút
                                                       <>
                                                            <Button
                                                                 variant="outline"
                                                                 onClick={() => {
                                                                      setIsDetailModalOpen(false);
                                                                 }}
                                                                 className="rounded-2xl"
                                                            >
                                                                 Đóng
                                                            </Button>
                                                            <Button
                                                                 onClick={() => {
                                                                      handleConfirmBooking(selectedBooking.bookingId || selectedBooking.id);
                                                                      setIsDetailModalOpen(false);
                                                                 }}
                                                                 className="rounded-2xl bg-green-600 hover:bg-green-700 text-white font-semibold"
                                                            >
                                                                 <CheckCircle className="w-4 h-4 mr-2" />
                                                                 {selectedBooking.status === 'pending' ? 'Xác nhận thanh toán' : 'Hoàn thành'}
                                                            </Button>
                                                            <Button
                                                                 variant="outline"
                                                                 onClick={() => {
                                                                      handleCancelBooking(selectedBooking.bookingId || selectedBooking.id);
                                                                      setIsDetailModalOpen(false);
                                                                 }}
                                                                 className="rounded-2xl border-red-300 text-red-600 hover:bg-red-50 font-semibold"
                                                            >
                                                                 <XCircle className="w-4 h-4 mr-2" />
                                                                 Hủy booking
                                                            </Button>
                                                       </>
                                                  ) : (
                                                       // Booking đã hủy hoặc hoàn thành - chỉ hiển thị nút đóng
                                                       <Button
                                                            variant="outline"
                                                            onClick={() => {
                                                                 setIsDetailModalOpen(false);
                                                            }}
                                                            className="rounded-2xl"
                                                       >
                                                            Đóng
                                                       </Button>
                                                  )}
                                             </div>
                                        </div>
                                   )}
                              </Modal>
                         </>
                    )}

                    {/* Fixed Booking Packages Tab */}
                    {activeTab === 'packages' && (
                         <OwnerPackagesTable
                              ownerId={ownerId}
                              getStatusColor={getStatusColor}
                              getStatusText={getStatusText}
                              getPaymentStatusColor={getPaymentStatusColor}
                              getPaymentStatusText={getPaymentStatusText}
                         />
                    )}

                    {/* Cancellations Tab */}
                    {activeTab === 'cancellations' && (
                         <OwnerCancellationsTable
                              cancellationRequests={cancellationRequests}
                              loading={loadingCancellations}
                              pagination={cancellationsPagination}
                              onRefresh={loadCancellationRequests}
                              onViewDetails={handleViewCancellationDetails}
                              onConfirm={handleConfirmCancellation}
                              onDelete={handleDeleteCancellation}
                         />
                    )}

                    {/* Demo Restricted Modal */}
                    <DemoRestrictedModal
                         isOpen={showDemoRestrictedModal}
                         onClose={() => setShowDemoRestrictedModal(false)}
                         featureName="Quản lý booking"
                    />
               </div >

               {/* Cancellation Detail Modal - Outside conditional blocks */}
               < Modal
                    isOpen={isCancellationDetailModalOpen}
                    onClose={() => {
                         setIsCancellationDetailModalOpen(false);
                         setSelectedCancellation(null);
                    }}
                    title="Chi tiết yêu cầu hủy booking"
                    className="max-w-2xl rounded-2xl border border-red-200 shadow-lg h-[90vh] overflow-y-auto scrollbar-hide bg-gray-300"
               >
                    {
                         loadingCancellationDetail ? (
                              <div className="text-center py-12" >
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
                                                       #{selectedCancellation.requestId || selectedCancellation.id || selectedCancellation.cancellationId || 'N/A'}
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
                                                       {selectedCancellation.requestedAt || selectedCancellation.createdAt
                                                            ? new Date(selectedCancellation.requestedAt || selectedCancellation.createdAt).toLocaleString('vi-VN')
                                                            : 'N/A'}
                                                  </p>
                                             </div>
                                             <div className="bg-white p-3 rounded-lg border border-red-100">
                                                  <label className="text-sm font-semibold text-red-700 flex items-center mb-2">
                                                       <AlertCircle className="w-4 h-4 mr-1" />
                                                       Trạng thái
                                                  </label>
                                                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                                       {selectedCancellation.requestStatus || selectedCancellation.status || 'Pending'}
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
                                                  {selectedCancellation.requestReason?.split('|')[0]?.trim() || selectedCancellation.reason || selectedCancellation.Reason || 'Không có lý do'}
                                             </p>
                                        </div>
                                   </div>

                                   {/* QR Code */}
                                   {(() => {
                                        const qrMatch = selectedCancellation.requestReason?.match(/RefundQR:\s*(https?:\/\/[^\s]+)/);
                                        const qrUrl = qrMatch ? qrMatch[1] : null;
                                        return qrUrl ? (
                                             <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                                                  <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                                                       <QrCode className="w-5 h-5 mr-2" />
                                                       QR Code Hoàn tiền
                                                  </h3>
                                                  <div className="bg-white p-4 rounded-lg border border-blue-100 flex flex-col items-center">
                                                       <img
                                                            src={qrUrl}
                                                            alt="QR Code Hoàn tiền"
                                                            className="max-w-full h-auto rounded-lg shadow-md"
                                                            style={{ maxHeight: '300px' }}
                                                       />
                                                       <p className="text-sm text-gray-600 mt-3">Quét mã QR để hoàn tiền cho khách hàng</p>
                                                  </div>
                                             </div>
                                        ) : null;
                                   })()}

                                   {/* Actions */}
                                   <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                                        {(selectedCancellation.requestStatus || selectedCancellation.status) === "Confirmed" && (
                                             <div className="px-4 py-2 rounded-xl bg-green-50 border border-green-200 flex items-center gap-2">
                                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                                  <span className="text-sm font-semibold text-green-700">
                                                       Yêu cầu đã được xác nhận
                                                  </span>
                                             </div>
                                        )}
                                        <div className="flex space-x-3 ml-auto">
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
                                             {(selectedCancellation.requestStatus || selectedCancellation.status) === "Pending" && (
                                                  <>
                                                       <Button
                                                            onClick={async () => {
                                                                 setIsCancellationDetailModalOpen(false);
                                                                 await handleConfirmCancellation(selectedCancellation.requestId || selectedCancellation.id || selectedCancellation.cancellationId);
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
                                                                 await handleDeleteCancellation(selectedCancellation.requestId || selectedCancellation.id || selectedCancellation.cancellationId);
                                                                 setSelectedCancellation(null);
                                                            }}
                                                            className="rounded-xl border-red-300 text-red-600 hover:bg-red-50 font-semibold"
                                                       >
                                                            <XCircle className="w-4 h-4 mr-2" />
                                                            Xóa yêu cầu
                                                       </Button>
                                                  </>
                                             )}
                                        </div>
                                   </div>
                              </div>
                         ) : (
                              <div className="text-center py-12">
                                   <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                   <p className="text-gray-600">Không tìm thấy thông tin yêu cầu hủy</p>
                              </div>
                         )}
               </Modal >
          </>
     );
};

export default BookingManagement;
