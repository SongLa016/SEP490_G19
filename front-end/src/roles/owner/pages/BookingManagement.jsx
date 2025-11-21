import React, { useState, useMemo } from "react";
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
import { cancelBooking, fetchCancellationRequests, confirmCancellation, deleteCancellationRequest } from "../../../shared/services/bookings";
import Swal from "sweetalert2";
import { useEffect } from "react";


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

     // Mock data - replace with actual API calls
     const bookings = useMemo(() => [
          {
               id: 1,
               field: "Sân A1",
               customer: "Nguyễn Văn A",
               phone: "0123456789",
               email: "nguyenvana@email.com",
               date: "2025-01-15",
               timeSlot: "18:00-20:00",
               status: "pending",
               amount: 500000,
               paymentStatus: "pending",
               createdAt: "2025-01-14T10:30:00Z",
               notes: "Khách hàng yêu cầu chuẩn bị nước uống"
          },
          {
               id: 2,
               field: "Sân B2",
               customer: "Trần Thị B",
               phone: "0987654321",
               email: "tranthib@email.com",
               date: "2025-01-15",
               timeSlot: "20:00-22:00",
               status: "confirmed",
               amount: 600000,
               paymentStatus: "paid",
               createdAt: "2025-01-14T09:15:00Z",
               notes: ""
          },
          {
               id: 3,
               field: "Sân C1",
               customer: "Lê Văn C",
               phone: "0369258147",
               email: "levanc@email.com",
               date: "2025-01-16",
               timeSlot: "16:00-18:00",
               status: "confirmed",
               amount: 450000,
               paymentStatus: "paid",
               createdAt: "2025-01-15T14:20:00Z",
               notes: ""
          },
          {
               id: 4,
               field: "Sân A2",
               customer: "Phạm Thị D",
               phone: "0741852963",
               email: "phamthid@email.com",
               date: "2025-01-16",
               timeSlot: "14:00-16:00",
               status: "cancelled",
               amount: 500000,
               paymentStatus: "refunded",
               createdAt: "2025-01-15T11:45:00Z",
               notes: "Khách hủy do thời tiết xấu"
          }
     ], []);

     const fields = [
          { value: "all", label: "Tất cả sân" },
          { value: "Sân A1", label: "Sân A1" },
          { value: "Sân A2", label: "Sân A2" },
          { value: "Sân B1", label: "Sân B1" },
          { value: "Sân B2", label: "Sân B2" },
          { value: "Sân C1", label: "Sân C1" }
     ];

     const statusOptions = [
          { value: "all", label: "Tất cả trạng thái" },
          { value: "pending", label: "Chờ xác nhận" },
          { value: "confirmed", label: "Đã xác nhận" },
          { value: "cancelled", label: "Đã hủy" },
          { value: "completed", label: "Hoàn thành" }
     ];

     const handleConfirmBooking = (bookingId) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          if (window.confirm("Xác nhận booking này?")) {
               // Handle confirm booking
               console.log("Confirm booking:", bookingId);
          }
     };

     const handleCancelBooking = async (bookingId) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }

          // Show SweetAlert2 input dialog
          const { value: reason, isConfirmed } = await Swal.fire({
               title: 'Hủy booking',
               html: `
                    <div class="text-left">
                         <p class="text-sm text-gray-600 mb-3">Vui lòng nhập lý do hủy booking:</p>
                         <textarea 
                              id="cancel-reason" 
                              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500" 
                              rows="4" 
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
                    const result = await cancelBooking(bookingId, reason);

                    if (result.success) {
                         await Swal.fire({
                              icon: 'success',
                              title: 'Đã gửi yêu cầu hủy!',
                              text: 'Yêu cầu hủy booking đã được ghi nhận',
                              confirmButtonColor: '#10b981'
                         });
                         // Reload bookings or update UI
                         // You might want to add a refresh function here
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
                         text: 'Có lỗi xảy ra khi hủy booking',
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
                         loadCancellationRequests();
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
               case 'pending': return 'bg-yellow-100 text-yellow-800';
               case 'refunded': return 'bg-blue-100 text-blue-800';
               case 'failed': return 'bg-red-100 text-red-800';
               default: return 'bg-gray-100 text-gray-800';
          }
     };

     const getPaymentStatusText = (status) => {
          switch (status) {
               case 'paid': return 'Đã thanh toán';
               case 'pending': return 'Chờ thanh toán';
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
                              <Button className="rounded-2xl bg-teal-600 hover:bg-teal-700">
                                   <RefreshCw className="w-4 h-4 mr-2" />
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

                              {/* Bookings Table */}
                              <Card className="overflow-hidden rounded-2xl border border-teal-200 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
                                   <div className="bg-gradient-to-r from-teal-500 to-emerald-700 p-4">
                                        <h3 className="text-lg font-semibold text-white flex items-center">
                                             <Calendar className="w-5 h-5 mr-2" />
                                             Danh sách booking ({filteredBookings.length})
                                        </h3>
                                   </div>
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

                                                                 <Button
                                                                      variant="ghost"
                                                                      size="sm"
                                                                      onClick={() => handleConfirmBooking(booking.id)}
                                                                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                 >
                                                                      <CheckCircle className="w-4 h-4" />
                                                                 </Button>
                                                                 <Button
                                                                      variant="ghost"
                                                                      size="sm"
                                                                      onClick={() => handleCancelBooking(booking.id)}
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

                                   {filteredBookings.length === 0 && (
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
                                                                      handleConfirmBooking(selectedBooking.id);
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
                                                                      handleCancelBooking(selectedBooking.id);
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
          </OwnerLayout>
     );
};

export default BookingManagement;
