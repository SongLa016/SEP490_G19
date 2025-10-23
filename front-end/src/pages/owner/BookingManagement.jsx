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

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, DatePicker, Modal, Input, Card, Button, Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "../../components/ui/index";
import OwnerLayout from "../../layouts/owner/OwnerLayout";
import { useAuth } from "../../contexts/AuthContext";
import DemoRestrictedModal from "../../components/DemoRestrictedModal";

const BookingManagement = ({ isDemo = false }) => {
     const { user, logout } = useAuth();
     const [selectedDate, setSelectedDate] = useState("");
     const [statusFilter, setStatusFilter] = useState("all");
     const [fieldFilter, setFieldFilter] = useState("all");
     const [searchTerm, setSearchTerm] = useState("");
     const [selectedBooking, setSelectedBooking] = useState(null);
     const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
     const [showDemoRestrictedModal, setShowDemoRestrictedModal] = useState(false);

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

     const handleCancelBooking = (bookingId) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          const reason = window.prompt("Lý do hủy booking:");
          if (reason) {
               // Handle cancel booking
               console.log("Cancel booking:", bookingId, "Reason:", reason);
          }
     };

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
               </div>
          </OwnerLayout>
     );
};

export default BookingManagement;