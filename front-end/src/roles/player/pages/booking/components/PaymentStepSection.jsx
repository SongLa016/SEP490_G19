import { MapPin } from "lucide-react";
import { Button } from "../../../../../shared/components/ui";

export default function PaymentStepSection({
     bookingInfo,
     ownerBankAccount,
     paymentMethod,
     setPaymentMethod,
     bookingData,
     isRecurring,
     recurringWeeks,
     selectedDays,
     errors,
     isProcessing,
     formatPrice,
     onConfirmPayment
}) {
     const paymentMethods = [
          { value: "momo", label: "Ví MoMo", color: "bg-pink-500", icon: "M" },
          { value: "vnpay", label: "VNPay", color: "bg-blue-500", icon: "V" },
          { value: "zalopay", label: "ZaloPay", color: "bg-cyan-500", icon: "Z" },
          { value: "banking", label: "Chuyển khoản", color: "bg-green-500", icon: "B" }
     ];

     return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {/* Payment Methods */}
               <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Phương thức thanh toán</h3>
                    
                    {/* QR Code và Mã Booking */}
                    {bookingInfo && (
                         <div className="mb-6 p-4 border border-teal-200 rounded-lg bg-teal-50">
                              <div className="flex items-center justify-between mb-3">
                                   <div>
                                        <div className="text-sm text-teal-700">Mã đặt sân</div>
                                        <div className="text-lg font-semibold text-teal-800">#{bookingInfo.bookingId}</div>
                                        {bookingInfo.qrExpiresAt && (
                                             <div className="text-xs text-teal-600">Hết hạn: {new Date(bookingInfo.qrExpiresAt).toLocaleTimeString('vi-VN')}</div>
                                        )}
                                   </div>
                                   {bookingInfo.qrCodeUrl && (
                                        <img src={bookingInfo.qrCodeUrl} alt="QR Code" className="w-24 h-24 border-2 border-teal-300 rounded" />
                                   )}
                              </div>
                         </div>
                    )}

                    {/* Thông tin ngân hàng Owner khi chọn chuyển khoản */}
                    {paymentMethod === "banking" && ownerBankAccount && (
                         <div className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
                              <h4 className="font-semibold text-blue-900 mb-3">Thông tin chuyển khoản</h4>
                              <div className="space-y-2 text-sm">
                                   <div className="flex justify-between">
                                        <span className="text-blue-700">Ngân hàng:</span>
                                        <span className="font-medium text-blue-900">{ownerBankAccount.bankName}</span>
                                   </div>
                                   <div className="flex justify-between">
                                        <span className="text-blue-700">Số tài khoản:</span>
                                        <span className="font-medium text-blue-900">{ownerBankAccount.accountNumber}</span>
                                   </div>
                                   <div className="flex justify-between">
                                        <span className="text-blue-700">Chủ tài khoản:</span>
                                        <span className="font-medium text-blue-900">{ownerBankAccount.accountHolder}</span>
                                   </div>
                                   <div className="mt-3 pt-3 border-t border-blue-200">
                                        <div className="flex justify-between">
                                             <span className="text-blue-700 font-semibold">Số tiền cần chuyển:</span>
                                             <span className="font-bold text-lg text-blue-900">{formatPrice(bookingInfo?.depositAmount || bookingData.depositAmount || 0)}</span>
                                        </div>
                                        <div className="text-xs text-blue-600 mt-1">
                                             Nội dung: BOOKING-{bookingInfo?.bookingId || 'XXX'}
                                        </div>
                                   </div>
                              </div>
                         </div>
                    )}

                    <div className="space-y-3">
                         {paymentMethods.map((method) => (
                              <label key={method.value} className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                   <input
                                        type="radio"
                                        name="payment"
                                        value={method.value}
                                        checked={paymentMethod === method.value}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="mr-3"
                                   />
                                   <div className="flex items-center">
                                        <div className={`w-8 h-8 ${method.color} rounded mr-3 flex items-center justify-center`}>
                                             <span className="text-white font-bold text-sm">{method.icon}</span>
                                        </div>
                                        <span className="font-medium">{method.label}</span>
                                   </div>
                              </label>
                         ))}
                    </div>
                    {errors.payment && (
                         <p className="text-red-500 text-sm mt-2">{errors.payment}</p>
                    )}
               </div>

               {/* Summary */}
               <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tóm tắt đặt sân</h3>
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                         {/* Field Information */}
                         <div className="mb-4 pb-4 border-b border-gray-200">
                              <h4 className="font-semibold text-gray-900 mb-2">{bookingData.fieldName}</h4>
                              <div className="flex items-center text-gray-600 mb-1">
                                   <MapPin className="w-4 h-4 mr-2" />
                                   <span className="text-sm">{bookingData.fieldAddress}</span>
                              </div>
                              {bookingData.fieldType && (
                                   <div className="text-sm text-gray-500">
                                        Loại: {bookingData.fieldType}
                                        {bookingData.fieldSize && ` - ${bookingData.fieldSize}`}
                                   </div>
                              )}
                         </div>

                         {/* Booking Details */}
                         <div className="space-y-3 text-sm">
                              <div className="flex justify-between">
                                   <span className="text-gray-600">Ngày</span>
                                   <span className="font-medium">{bookingData.date}</span>
                              </div>
                              {bookingData.slotName && (
                                   <div className="flex justify-between">
                                        <span className="text-gray-600">Thời gian</span>
                                        <span className="font-medium">{bookingData.slotName}</span>
                                   </div>
                              )}
                              <div className="flex justify-between">
                                   <span className="text-gray-600">Thời lượng</span>
                                   <span className="font-medium">{bookingData.duration} giờ</span>
                              </div>
                              {isRecurring && (
                                   <div className="flex justify-between">
                                        <span className="text-gray-600">Số tuần</span>
                                        <span className="font-medium text-teal-600">{recurringWeeks} tuần</span>
                                   </div>
                              )}
                              {isRecurring && (
                                   <div className="flex justify-between">
                                        <span className="text-gray-600">Tổng số buổi</span>
                                        <span className="font-medium text-teal-600">{bookingData.totalSessions || (recurringWeeks * selectedDays.length)} buổi</span>
                                   </div>
                              )}
                         </div>
                    </div>

                    {/* Price Summary */}
                    <div className="bg-teal-50 rounded-lg p-4">
                         <h4 className="font-semibold text-gray-900 mb-3">Chi phí</h4>
                         <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                   <span className="text-gray-600">Giá/giờ</span>
                                   <span className="font-medium">{formatPrice(bookingData.price)}</span>
                              </div>
                              {isRecurring && (
                                   <div className="flex justify-between">
                                        <span className="text-gray-600">Số buổi</span>
                                        <span className="font-medium">{bookingData.totalSessions || (recurringWeeks * selectedDays.length)} buổi</span>
                                   </div>
                              )}
                              <div className="flex justify-between">
                                   <span className="text-gray-600">Giá mỗi buổi</span>
                                   <span className="font-medium">{formatPrice((bookingData.price || 0) * (bookingData.duration || 1))}</span>
                              </div>
                              {isRecurring && (
                                   <div className="flex justify-between">
                                        <span className="text-gray-600">Tổng giá ({bookingData.totalSessions || (recurringWeeks * selectedDays.length)} buổi)</span>
                                        <span className="font-medium">{formatPrice((bookingData.price || 0) * (bookingData.duration || 1) * (bookingData.totalSessions || recurringWeeks))}</span>
                                   </div>
                              )}
                              {bookingData.depositAmount > 0 && (
                                   <div className="flex justify-between">
                                        <span className="text-gray-600">Tiền cọc (30%)</span>
                                        <span className="font-medium">{formatPrice(bookingData.depositAmount)}</span>
                                   </div>
                              )}
                              {bookingData.remainingAmount > 0 && (
                                   <div className="flex justify-between">
                                        <span className="text-gray-600">Còn lại</span>
                                        <span className="font-medium">{formatPrice(bookingData.remainingAmount)}</span>
                                   </div>
                              )}
                              <div className="flex justify-between pt-2 border-t border-teal-200">
                                   <span className="font-semibold text-gray-900">Tổng cộng</span>
                                   <span className="font-bold text-lg text-teal-600">{formatPrice(bookingData.totalPrice)}</span>
                              </div>
                         </div>
                    </div>

                    <Button
                         onClick={onConfirmPayment}
                         disabled={isProcessing}
                         className={`w-full mt-4 py-3 rounded-lg text-white font-semibold ${isProcessing ? "bg-gray-400" : "bg-teal-600 hover:bg-teal-700"}`}
                    >
                         {isProcessing ? "Đang xử lý..." : "Xác nhận thanh toán"}
                    </Button>
               </div>
          </div>
     );
}


