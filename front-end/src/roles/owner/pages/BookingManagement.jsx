import React, { useState, useMemo, useEffect } from "react";
import {
     Calendar,
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
     Repeat
} from "lucide-react";

import { Modal, Button, usePagination } from "../../../shared/components/ui";
import { useAuth } from "../../../contexts/AuthContext";
import { DemoRestrictedModal } from "../../../shared";
import { OwnerFilters, OwnerBookingsTable, OwnerPackagesTable, OwnerCancellationsTable } from "./components/bookingManagement";
import { useBookingActions } from "./hooks";

const BookingManagement = ({ isDemo = false }) => {
     const { user } = useAuth();
     const [selectedDate, setSelectedDate] = useState("");
     const [statusFilter, setStatusFilter] = useState("all");
     const [fieldFilter, setFieldFilter] = useState("all");
     const [searchTerm, setSearchTerm] = useState("");
     const [selectedBooking, setSelectedBooking] = useState(null);
     const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
     const [showDemoRestrictedModal, setShowDemoRestrictedModal] = useState(false);
     const [activeTab, setActiveTab] = useState("bookings");
     const [bookings, setBookings] = useState([]);
     const [selectedCancellation, setSelectedCancellation] = useState(null);
     const [isCancellationDetailModalOpen, setIsCancellationDetailModalOpen] = useState(false);
     const [loadingCancellationDetail, setLoadingCancellationDetail] = useState(false);

     const ownerId = user?.userID || user?.UserID || user?.id || user?.userId;

     // Utility functions
     const formatCurrency = (amount) => {
          return new Intl.NumberFormat('vi-VN', {
               style: 'currency',
               currency: 'VND'
          }).format(amount);
     };

     const formatDate = (dateString) => {
          return new Date(dateString).toLocaleDateString('vi-VN');
     };

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

     const isBookingPassed = (booking) => {
          if (!booking.endTime) return false;
          const endTime = new Date(booking.endTime);
          return endTime < new Date();
     };

     // Hook quản lý booking actions
     const {
          loadingBookings,
          bookingError,
          cancellationRequests,
          loadingCancellations,
          exporting,
          loadBookings,
          loadCancellationRequests,
          handleConfirmBooking,
          handleCancelBooking,
          handleConfirmCancellation,
          handleDeleteCancellation,
          handleViewCancellationDetails,
          handleExportReport,
     } = useBookingActions({
          ownerId,
          isDemo,
          bookings,
          setBookings,
          setShowDemoRestrictedModal,
          formatCurrency,
          formatDate,
          getStatusText,
          getPaymentStatusText,
     });

     // Load data on mount
     useEffect(() => {
          if (ownerId) {
               loadBookings();
               loadCancellationRequests();
          }
     }, [ownerId, loadBookings, loadCancellationRequests]);

     // Fields filter options
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

     // Filter bookings
     const filteredBookings = useMemo(() => {
          return bookings.filter(booking => {
               if (selectedDate && booking.date !== selectedDate) return false;
               if (statusFilter !== "all" && booking.status !== statusFilter) return false;
               if (fieldFilter !== "all" && booking.field !== fieldFilter) return false;
               if (searchTerm) {
                    const search = searchTerm.toLowerCase();
                    return (
                         booking.customer?.toLowerCase().includes(search) ||
                         booking.phone?.toLowerCase().includes(search) ||
                         booking.field?.toLowerCase().includes(search) ||
                         String(booking.bookingId).includes(search)
                    );
               }
               return true;
          });
     }, [bookings, selectedDate, statusFilter, fieldFilter, searchTerm]);

     // Pagination
     const bookingsPagination = usePagination(filteredBookings, 10);
     const cancellationsPagination = usePagination(cancellationRequests, 10);

     // Reset pagination when tab changes
     useEffect(() => {
          if (activeTab === 'bookings' && bookingsPagination.currentPage !== 1) {
               bookingsPagination.handlePageChange(1);
          } else if (activeTab === 'cancellations' && cancellationsPagination.currentPage !== 1) {
               cancellationsPagination.handlePageChange(1);
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [activeTab]);

     // View booking details
     const handleViewDetails = (booking) => {
          setSelectedBooking(booking);
          setIsDetailModalOpen(true);
     };

     return (
          <>
               <div className="space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 rounded-2xl">
                         <div>
                              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                                   <Calendar className="w-8 h-8 mr-3 text-teal-600" />
                                   Quản lý đặt sân
                              </h1>
                              <p className="text-gray-600 mt-1">Xác nhận, hủy và theo dõi các đặt sân</p>
                         </div>

                         <div className="flex items-center space-x-3">
                              <Button
                                   variant="outline"
                                   className="rounded-2xl border-teal-300 text-teal-700 hover:bg-teal-50"
                                   onClick={() => handleExportReport(filteredBookings)}
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
                                   <span>Danh sách đặt sân</span>
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
                         </>
                    )}

                    {/* Cancellations Tab */}
                    {activeTab === 'cancellations' && (
                         <OwnerCancellationsTable
                              loading={loadingCancellations}
                              cancellationRequests={cancellationRequests}
                              cancellationsPagination={cancellationsPagination}
                              formatDate={formatDate}
                              handleConfirmCancellation={handleConfirmCancellation}
                              handleDeleteCancellation={handleDeleteCancellation}
                              handleViewCancellationDetails={(id) => handleViewCancellationDetails(
                                   id,
                                   setSelectedCancellation,
                                   setIsCancellationDetailModalOpen,
                                   setLoadingCancellationDetail
                              )}
                         />
                    )}

                    {/* Packages Tab */}
                    {activeTab === 'packages' && (
                         <OwnerPackagesTable />
                    )}
               </div>

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
                                             <p className="text-sm font-semibold text-gray-900">{selectedBooking.phone || "Chưa cập nhật"}</p>
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

                              {/* Notes */}
                              {selectedBooking.notes && (
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
                                   <Button
                                        variant="outline"
                                        onClick={() => setIsDetailModalOpen(false)}
                                   >
                                        Đóng
                                   </Button>
                              </div>
                         </div>
                    )}
               </Modal>

               {/* Demo Restricted Modal */}
               <DemoRestrictedModal
                    isOpen={showDemoRestrictedModal}
                    onClose={() => setShowDemoRestrictedModal(false)}
               />
          </>
     );
};

export default BookingManagement;
