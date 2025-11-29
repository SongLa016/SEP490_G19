import React, { useState } from "react";
import { Modal } from "./ui";
import { AlertTriangle, XCircle, CheckCircle, Info } from "lucide-react";
import { Button, Input } from "./ui";
import { calculateCancellationRefund, formatCurrency, getCancellationPolicyRanges } from "../utils/cancellationCalculator";

export default function CancelBookingModal({
     isOpen,
     onClose,
     onConfirm,
     booking,
     isLoading = false
}) {
     const [cancelReason, setCancelReason] = useState("");

     if (!booking) return null;

     // Check if booking is pending (chưa được xác nhận)
     const isPending = booking.status === "pending" || booking.bookingStatus === "Pending" || booking.bookingStatus === "pending";

     // Calculate refund/penalty (only for confirmed bookings)
     const confirmedAt = booking.confirmedAt || booking.createdAt;
     const bookingStartTime = booking.startTime;
     const depositAmount = booking.depositAmount || booking.totalPrice || 0;

     const cancellationInfo = isPending ? {
          refundRate: 100,
          penaltyRate: 0,
          refundAmount: depositAmount,
          penaltyAmount: 0,
          timeRange: "Chưa xác nhận",
          hoursUntilBooking: 0
     } : calculateCancellationRefund(
          confirmedAt,
          bookingStartTime,
          depositAmount
     );

     const policyRanges = getCancellationPolicyRanges();

     const handleConfirm = () => {
          if (!isPending && !cancelReason.trim()) {
               // For confirmed bookings, reason is required
               return;
          }
          onConfirm(cancelReason.trim() || "Hủy booking chưa được xác nhận");
          setCancelReason(""); // Reset after confirm
     };

     return (
          <Modal
               isOpen={isOpen}
               onClose={onClose}
               title={
                    <div className="flex items-center gap-3">
                         <div className="p-2 bg-red-100 rounded-xl">
                              <XCircle className="w-6 h-6 text-red-600" />
                         </div>
                         <span className="text-xl font-bold text-gray-900">Xác nhận hủy đặt sân</span>
                    </div>
               }
               className="max-w-3xl w-full rounded-2xl shadow-2xl max-h-[90vh]"
          >
               <div className="flex flex-col flex-1 min-h-0">
                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-4 space-y-2 min-h-0" style={{
                         scrollbarWidth: 'thin',
                         scrollbarColor: '#cbd5e1 #f1f5f9'
                    }}>
                         {/* Booking Info */}
                         <div className="bg-teal-50 rounded-2xl px-4 py-2 border border-teal-200 shadow-sm">
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                   <div>
                                        <p className="text-gray-500 mb-1">Sân</p>
                                        <p className="font-semibold text-gray-900">{booking.fieldName}</p>
                                   </div>
                                   <div>
                                        <p className="text-gray-500 mb-1">Thời gian</p>
                                        <p className="font-semibold text-gray-900">{booking.date} - {booking.time}</p>
                                   </div>
                                   <div>
                                        <p className="text-gray-500 mb-1">Số tiền cọc</p>
                                        <p className="font-semibold text-teal-600">{formatCurrency(depositAmount)}</p>
                                   </div>
                                   <div>
                                        <p className="text-gray-500 mb-1">Trạng thái</p>
                                        <p className={`font-semibold border border-green-200 rounded-2xl px-2 py-1 w-fit ${isPending ? "text-yellow-600" : "text-green-600"}`}>
                                             {isPending ? "Chờ xác nhận" : "Đã xác nhận"}
                                        </p>
                                   </div>
                              </div>
                         </div>

                         {/* Special message for pending bookings */}
                         {isPending && (
                              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
                                   <div className="flex items-start gap-3">
                                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                             <h4 className="font-bold text-green-900 mb-2">Hủy booking chưa được xác nhận</h4>
                                             <p className="text-sm text-green-800 mb-2">
                                                  Booking của bạn chưa được chủ sân xác nhận, nên bạn có thể hủy trực tiếp mà không cần chờ phê duyệt.
                                             </p>
                                             <div className="bg-white rounded-lg p-3 border border-green-200">
                                                  <p className="text-sm font-semibold text-green-900 mb-1">Số tiền được hoàn:</p>
                                                  <p className="text-2xl font-bold text-green-600">
                                                       {formatCurrency(depositAmount)}
                                                  </p>
                                                  <p className="text-xs text-green-700 mt-1">
                                                       (100% số tiền cọc sẽ được hoàn lại)
                                                  </p>
                                             </div>
                                        </div>
                                   </div>
                              </div>
                         )}

                         {/* Cancellation Policy Table - Only show for confirmed bookings */}
                         {!isPending && (
                              <div className="space-y-2">
                                   <div className="flex items-center gap-1">
                                        <Info className="w-5 h-5 text-blue-600" />
                                        <h3 className="text-lg font-bold text-gray-900">Chính sách hủy đặt sân</h3>
                                   </div>
                                   <div className="border-2 border-teal-200 rounded-xl overflow-hidden">
                                        <table className="w-full">
                                             <thead>
                                                  <tr className="bg-gradient-to-r from-teal-500 to-teal-600 text-white">
                                                       <th className="px-4 py-3 text-center text-sm font-bold">Mốc thời gian sau Confirm</th>
                                                       <th className="px-4 py-3 text-center text-sm font-bold">Mức hoàn cọc</th>
                                                       <th className="px-4 py-3 text-center text-sm font-bold">Mức phạt</th>
                                                  </tr>
                                             </thead>
                                             <tbody>
                                                  {policyRanges.map((range, index) => {
                                                       const isCurrentRange = range.range === cancellationInfo.timeRange ||
                                                            (range.range === ">5h" && cancellationInfo.timeRange === "> 5h");
                                                       return (
                                                            <tr
                                                                 key={index}
                                                                 className={`border-b border-gray-200 ${isCurrentRange
                                                                      ? "bg-yellow-50 border-yellow-300"
                                                                      : index % 2 === 0
                                                                           ? "bg-white"
                                                                           : "bg-gray-100"
                                                                      }`}
                                                            >
                                                                 <td className="px-4 py-3">
                                                                      <div className="flex items-center justify-center gap-2">
                                                                           {isCurrentRange && (
                                                                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                                           )}
                                                                           <span className={`text-sm font-medium ${isCurrentRange ? "text-yellow-700 font-bold" : "text-gray-700"}`}>
                                                                                {range.label}
                                                                           </span>
                                                                      </div>
                                                                 </td>
                                                                 <td className="px-4 py-3 text-center">
                                                                      <span className={`text-sm font-semibold ${range.refundRate === 100 ? "text-green-600" : range.refundRate === 0 ? "text-red-600" : "text-orange-600"}`}>
                                                                           {range.refundRate}% hoàn
                                                                      </span>
                                                                 </td>
                                                                 <td className="px-4 py-3 text-center">
                                                                      <span className={`text-sm font-semibold ${range.penaltyRate === 0 ? "text-green-600" : range.penaltyRate === 100 ? "text-red-600" : "text-orange-600"}`}>
                                                                           {range.penaltyRate}% phạt
                                                                      </span>
                                                                 </td>
                                                            </tr>
                                                       );
                                                  })}
                                             </tbody>
                                        </table>
                                   </div>
                              </div>
                         )}

                         {/* Current Cancellation Info - Only show for confirmed bookings */}
                         {!isPending && (
                              <div className={`rounded-2xl p-3 border-2 ${cancellationInfo.refundRate === 100
                                   ? "bg-green-50 border-green-300"
                                   : cancellationInfo.refundRate === 0
                                        ? "bg-red-50 border-red-300"
                                        : "bg-orange-50 border-orange-300"
                                   }`}>
                                   <div className="flex items-start gap-2">
                                        {cancellationInfo.refundRate === 100 ? (
                                             <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                                        ) : (
                                             <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                                        )}
                                        <div className="flex-1">
                                             <h4 className="font-bold text-gray-900 mb-2">
                                                  Áp dụng cho đặt sân này: {cancellationInfo.timeRange}
                                             </h4>
                                             <div className="grid grid-cols-2 gap-3">
                                                  <div>
                                                       <p className="text-sm text-gray-600 mb-1">Số tiền được hoàn</p>
                                                       <p className={`text-lg font-bold ${cancellationInfo.refundRate === 100 ? "text-green-600" : cancellationInfo.refundRate === 0 ? "text-gray-400" : "text-orange-600"}`}>
                                                            {formatCurrency(cancellationInfo.refundAmount)}
                                                       </p>
                                                       <p className="text-xs text-gray-500 mt-1">
                                                            ({cancellationInfo.refundRate}% của {formatCurrency(depositAmount)})
                                                       </p>
                                                  </div>
                                                  <div>
                                                       <p className="text-sm text-gray-600 mb-1">Số tiền bị phạt</p>
                                                       <p className={`text-lg font-bold ${cancellationInfo.penaltyRate === 0 ? "text-green-600" : cancellationInfo.penaltyRate === 100 ? "text-red-600" : "text-orange-600"}`}>
                                                            {formatCurrency(cancellationInfo.penaltyAmount)}
                                                       </p>
                                                       <p className="text-xs text-gray-500 mt-1">
                                                            ({cancellationInfo.penaltyRate}% của {formatCurrency(depositAmount)})
                                                       </p>
                                                  </div>
                                             </div>
                                        </div>
                                   </div>
                              </div>
                         )}

                         {/* Warning Message - Only for confirmed bookings */}
                         {!isPending && cancellationInfo.penaltyRate > 0 && (
                              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-3">
                                   <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-amber-800">
                                             <p className="font-semibold mb-1">Lưu ý quan trọng:</p>
                                             <p>
                                                  Nếu bạn hủy đặt sân này, bạn sẽ bị phạt {cancellationInfo.penaltyRate}% số tiền cọc ({formatCurrency(cancellationInfo.penaltyAmount)}).
                                                  Chỉ có {cancellationInfo.refundRate}% số tiền cọc ({formatCurrency(cancellationInfo.refundAmount)}) sẽ được hoàn lại.
                                             </p>
                                        </div>
                                   </div>
                              </div>
                         )}

                         {/* Reason input for confirmed bookings */}
                         {!isPending && (
                              <div className="space-y-2 mb-2">
                                   <label className="block text-sm font-medium text-gray-700">
                                        Lý do hủy <span className="text-red-500">*</span>
                                   </label>
                                   <Input
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        placeholder="Vui lòng nhập lý do hủy booking..."
                                        className="w-full rounded-2xl"
                                        disabled={isLoading}
                                   />
                                   <p className="text-xs text-gray-500">
                                        Lý do hủy là bắt buộc cho booking đã được xác nhận. Yêu cầu hủy sẽ được gửi đến chủ sân để xem xét.
                                   </p>
                              </div>
                         )}

                    </div>

                    {/* Fixed Action Buttons */}
                    <div className="flex-shrink-0 pt-5 bg-white flex justify-end gap-3 rounded-b-2xl">
                         <Button
                              variant="outline"
                              onClick={onClose}
                              disabled={isLoading}
                              className="rounded-xl px-6"
                         >
                              Không hủy
                         </Button>
                         <Button
                              onClick={handleConfirm}
                              disabled={isLoading || (!isPending && !cancelReason.trim())}
                              className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 disabled:bg-gray-400 disabled:cursor-not-allowed"
                         >
                              {isLoading ? "Đang xử lý..." : isPending ? "Xác nhận hủy" : "Gửi yêu cầu hủy"}
                         </Button>
                    </div>
               </div>
          </Modal>
     );
}

