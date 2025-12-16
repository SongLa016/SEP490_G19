import React from "react";
import { XCircle, RefreshCw, CheckCircle, Eye, QrCode } from "lucide-react";
import { Card, Table, TableHeader, TableHead, TableRow, TableBody, TableCell, Button, Pagination } from "../../../../../shared/components/ui";
import Swal from "sweetalert2";

/**
 * Component hiển thị bảng danh sách yêu cầu hủy booking của Owner
 * 
 * Chức năng:
 * - Hiển thị danh sách yêu cầu hủy với thông tin booking, lý do, ngày tạo
 * - Hiển thị QR code hoàn tiền (nếu có)
 * - Các nút thao tác: Xem chi tiết, Xác nhận hủy, Xóa yêu cầu
 * - Phân trang danh sách
 * 
 * @param {Object} props - Props của component
 * @param {Array} props.cancellationRequests - Danh sách yêu cầu hủy
 * @param {boolean} props.loading - Trạng thái đang tải
 * @param {Object} props.pagination - Object chứa thông tin phân trang
 * @param {Function} props.onRefresh - Callback làm mới danh sách
 * @param {Function} props.onViewDetails - Callback xem chi tiết yêu cầu
 * @param {Function} props.onConfirm - Callback xác nhận yêu cầu hủy
 * @param {Function} props.onDelete - Callback xóa yêu cầu hủy
 */
export default function OwnerCancellationsTable({
  cancellationRequests = [],
  loading,
  pagination,
  onRefresh,
  onViewDetails,
  onConfirm,
  onDelete,
}) {
  return (
    <Card className="p-6 rounded-2xl shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <XCircle className="w-6 h-6 mr-2 text-red-600" />
          Yêu cầu hủy booking
        </h3>
        <Button onClick={onRefresh} variant="outline" className="rounded-xl">
          <RefreshCw className="w-4 h-4 mr-2" />
          Làm mới
        </Button>
      </div>

      {loading ? (
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
        <>
          <div className="overflow-x-auto">
            <Table className="rounded-2xl border border-teal-300">
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Lý do</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>QR Hoàn tiền</TableHead>
                  <TableHead className="text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.currentItems.map((request) => {
                  const qrMatch = request.requestReason?.match(/RefundQR:\s*(https?:\/\/[^\s]+)/);
                  const qrUrl = qrMatch ? qrMatch[1] : null;
                  return (
                    <TableRow key={request.requestId || request.id || request.cancellationId}>
                      <TableCell className="font-medium">
                        #{request.requestId || request.id || request.cancellationId}
                      </TableCell>
                      <TableCell>
                        <span className="text-teal-600 font-semibold">#{request.bookingId}</span>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {request.requestReason?.split("|")[0]?.trim() || request.reason || "Không có lý do"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="text-gray-900">
                            {(request.requestedAt || request.createdAt)
                              ? new Date(request.requestedAt || request.createdAt).toLocaleDateString("vi-VN")
                              : "N/A"}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {(request.requestedAt || request.createdAt)
                              ? new Date(request.requestedAt || request.createdAt).toLocaleTimeString("vi-VN")
                              : ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {qrUrl ? (
                          <button
                            onClick={() => {
                              Swal.fire({
                                title: "QR Code Hoàn tiền",
                                html: `
                                  <div class="flex flex-col items-center">
                                    <img src="${qrUrl}" alt="QR Code" class="max-w-full h-auto rounded-lg shadow-lg" style="max-height: 400px;" />
                                    <p class="text-sm text-gray-600 mt-3">Quét mã QR để hoàn tiền</p>
                                  </div>
                                `,
                                showConfirmButton: true,
                                confirmButtonText: "Đóng",
                                width: "500px",
                              });
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <QrCode className="w-4 h-4" />
                            Xem QR
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">Không có</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            onClick={() => onViewDetails(request.requestId || request.id || request.cancellationId)}
                            size="sm"
                            variant="ghost"
                            className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-xl"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                          </Button>
                          {(request.requestStatus || request.status) === "Pending" && (
                            <>
                              <Button
                                onClick={() => onConfirm(request.requestId || request.id || request.cancellationId)}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 rounded-xl"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Xác nhận
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => onDelete(request.requestId || request.id || request.cancellationId)}
                                size="sm"
                                className="border-red-300 text-red-600 hover:bg-red-50 rounded-xl"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Xóa
                              </Button>
                            </>
                          )}
                          {(request.requestStatus || request.status) === "Confirmed" && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Đã xác nhận
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {pagination.totalPages > 1 && (
            <div className="p-4">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={pagination.handlePageChange}
                itemsPerPage={pagination.itemsPerPage}
                totalItems={pagination.totalItems}
              />
            </div>
          )}
        </>
      )}
    </Card>
  );
}

