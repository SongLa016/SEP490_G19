import React from "react";
import {
  Calendar,
  MapPin,
  Clock,
  Phone,
  Mail,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Info,
  User,
} from "lucide-react";
import { Card, Table, TableHeader, TableHead, TableRow, TableBody, TableCell, Button, Pagination } from "../../../../../shared/components/ui";

// component hiển thị bảng danh sách booking của Owner
export default function OwnerBookingsTable({
  loading,
  error,
  filteredCount,
  bookingsPagination,
  formatDate,
  isBookingPassed,
  handleViewDetails,
  handleConfirmBooking,
  handleCancelBooking,
  formatCurrency,
  getStatusColor,
  getStatusText,
  getPaymentStatusColor,
  getPaymentStatusText,
}) {
  // hàm lấy icon tương ứng với trạng thái booking
  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <AlertTriangle className="w-3 h-3" />;
      case "confirmed":
      case "completed":
        return <CheckCircle className="w-3 h-3" />;
      case "cancelled":
        return <XCircle className="w-3 h-3" />;
      default:
        return <Info className="w-3 h-3" />;
    }
  };

  // hàm lấy icon tương ứng với trạng thái thanh toán
  const getPaymentIcon = (status) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-3 h-3" />;
      case "unpaid":
      case "pending":
        return <AlertTriangle className="w-3 h-3" />;
      case "refunded":
        return <RotateCcw className="w-3 h-3" />;
      case "failed":
        return <XCircle className="w-3 h-3" />;
      default:
        return <Info className="w-3 h-3" />;
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl border border-teal-200 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
      <div className="bg-gradient-to-r from-teal-500 to-emerald-700 p-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Danh sách đặt sân ({filteredCount})
        </h3>
      </div>
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Đang tải danh sách đặt sân...</p>
        </div>
      ) : error ? (
        <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200">{error}</div>
      ) : bookingsPagination.currentItems.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Không có đặt sân nào</h3>
          <p className="text-gray-500">Không tìm thấy đặt sân nào phù hợp với bộ lọc hiện tại.</p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow className="bg-teal-700">
                <TableHead className="text-white font-semibold">Khách hàng</TableHead>
                <TableHead className="text-white font-semibold">Sân & Thời gian</TableHead>
                <TableHead className="text-white font-semibold">Trạng thái</TableHead>
                <TableHead className="text-white font-semibold">Thanh toán</TableHead>
                <TableHead className="text-white font-semibold">Tiền cọc</TableHead>
                <TableHead className="text-white font-semibold">Số tiền</TableHead>
                <TableHead className="text-white font-semibold text-center">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookingsPagination.currentItems.map((booking) => (
                <TableRow key={booking.id} className="hover:bg-teal-50/50 transition-colors">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-semibold flex items-center text-gray-900">
                        <User className="w-3 h-3 mr-1" />
                        {booking.customer}</div>

                      {booking.phone && (
                        <div className="text-xs text-teal-600 font-medium flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {booking.phone}
                        </div>
                      )}

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
                    {(() => {
                      const effectiveStatus =
                        booking.status === "confirmed" && isBookingPassed(booking)
                          ? "completed"
                          : booking.status;
                      const statusLower = String(effectiveStatus || "").toLowerCase();
                      const Icon = getStatusIcon(statusLower);
                      return (
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(statusLower)}`}>
                          {Icon}
                          {getStatusText(statusLower)}
                        </span>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const payLower = String(booking.paymentStatus || "").toLowerCase();
                      const Icon = getPaymentIcon(payLower);
                      return (
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(payLower)}`}>
                          {Icon}
                          {getPaymentStatusText(payLower)}
                        </span>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-sm font-bold text-yellow-500">
                    {formatCurrency(booking.depositAmount)}
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
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      {!isBookingPassed(booking) && (
                        <>
                          {(booking.status === "pending" ||
                            (booking.status === "confirmed" && booking.paymentStatus === "paid")) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleConfirmBooking(booking.bookingId || booking.id)}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                title={booking.status === "pending" ? "Xác nhận thanh toán" : "Hoàn thành booking"}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                          {booking.status !== "cancelled" && booking.status !== "completed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelBooking(booking.bookingId || booking.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Hủy booking"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </>
                      )}
                      {isBookingPassed(booking) && (
                        <span className="text-xs text-gray-500 italic" title="Lịch trình đã qua">
                          Đã qua
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {bookingsPagination.totalPages > 1 && (
            <div className="p-4">
              <Pagination
                currentPage={bookingsPagination.currentPage}
                totalPages={bookingsPagination.totalPages}
                onPageChange={bookingsPagination.handlePageChange}
                itemsPerPage={bookingsPagination.itemsPerPage}
                totalItems={bookingsPagination.totalItems}
              />
            </div>
          )}
        </>
      )}
    </Card>
  );
}

