import { MapPin, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "../../../../../shared/components/ui";

export default function PaymentStepSection({
     bookingInfo,
     ownerBankAccount,
     bookingData,
     isRecurring,
     recurringWeeks,
     selectedDays,
     isProcessing,
     formatPrice,
     paymentAmountType,
     isQrGenerating,
     errors = {},
     onPaymentAmountChange,
     onConfirmPayment
}) {
     const fallbackAccount = ownerBankAccount || {
          bankName: bookingData.bankName,
          bankShortCode: bookingData.bankShortCode,
          accountNumber: bookingData.accountNumber,
          accountHolder: bookingData.accountHolder || bookingData.ownerName
     };
     const hasBankInfo = !!(fallbackAccount?.bankName || fallbackAccount?.accountNumber || fallbackAccount?.accountHolder);
     const depositAvailable = (bookingData.depositAmount || 0) > 0;
     const hasSelection = Boolean(paymentAmountType);
     const transferAmount = hasSelection
          ? (paymentAmountType === "full"
               ? (bookingData.totalPrice || 0)
               : (bookingData.depositAmount || 0))
          : 0;

     return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">Thanh toán</h3>
                    <div className="p-4 border border-blue-400 rounded-2xl bg-white shadow-sm space-y-4">
                         {bookingInfo?.bookingId && (
                              <div className="flex items-center justify-between text-base font-medium text-gray-600">
                                   <span>Mã đặt sân</span>
                                   <span className="font-semibold text-teal-700">#{bookingInfo.bookingId}</span>
                              </div>
                         )}

                         <div className="space-y-2 text-sm">
                              <div className="text-gray-600 font-medium">Chọn hình thức thanh toán</div>
                              <div className="space-y-2">
                                   {depositAvailable && (
                                        <label className={`flex items-center justify-between p-3 border rounded-lg ${depositAvailable ? "cursor-pointer hover:bg-gray-50" : "opacity-60 cursor-not-allowed"}`}>
                                             <span className="text-sm text-gray-700">Thanh toán tiền cọc ({formatPrice(bookingData.depositAmount)})</span>
                                             <input
                                                  type="radio"
                                                  name="paymentAmountType"
                                                  value="deposit"
                                                  checked={paymentAmountType === "deposit"}
                                                  onChange={() => onPaymentAmountChange("deposit")}
                                                  disabled={!depositAvailable}
                                             />
                                        </label>
                                   )}
                                   <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                        <span className="text-sm text-gray-700">Thanh toán toàn bộ ({formatPrice(bookingData.totalPrice)})</span>
                                        <input
                                             type="radio"
                                             name="paymentAmountType"
                                             value="full"
                                             checked={paymentAmountType === "full"}
                                             onChange={() => onPaymentAmountChange("full")}
                                        />
                                   </label>
                              </div>
                              {errors.payment && (
                                   <p className="text-xs text-red-500">{errors.payment}</p>
                              )}
                         </div>

                         {hasSelection ? (
                              isQrGenerating ? (
                                   <div className="text-sm text-gray-600 text-center">
                                        Đang tạo mã QR cho số tiền bạn chọn...
                                   </div>
                              ) : bookingInfo?.qrCodeUrl ? (
                                   <div className="flex flex-col items-center text-center">
                                        <div className="p-2 bg-white border-4 border-teal-100 rounded-2xl shadow-lg mb-3">
                                             <img
                                                  src={bookingInfo.qrCodeUrl}
                                                  alt="QR thanh toán"
                                                  className="w-80 h-[400px]"
                                             />
                                        </div>
                                        {bookingInfo.qrExpiresAt && (
                                             <div className="text-xs text-gray-500">
                                                  QR hết hạn: {new Date(bookingInfo.qrExpiresAt).toLocaleString("vi-VN")}
                                             </div>
                                        )}
                                   </div>
                              ) : (
                                   <div className="text-sm text-red-500 text-center">
                                        Không thể tạo mã QR cho lựa chọn này. Vui lòng thử lại hoặc liên hệ chủ sân.
                                   </div>
                              )
                         ) : (
                              <div className="text-sm text-gray-600 text-center">
                                   Vui lòng chọn số tiền thanh toán để hiển thị mã QR.
                              </div>
                         )}

                         {hasBankInfo && (
                              <div className="space-y-2 text-sm border border-blue-100 rounded-2xl p-3">
                                   <div className="flex justify-between">
                                        <span className="text-gray-500">Ngân hàng</span>
                                        <span className="font-semibold text-gray-900 text-right">{fallbackAccount.bankName}</span>
                                   </div>
                                   <div className="flex justify-between">
                                        <span className="text-gray-500">Số tài khoản</span>
                                        <span className="font-semibold text-gray-900 text-right">{fallbackAccount.accountNumber}</span>
                                   </div>
                                   <div className="flex justify-between">
                                        <span className="text-gray-500">Chủ tài khoản</span>
                                        <span className="font-semibold text-gray-900 text-right">{fallbackAccount.accountHolder}</span>
                                   </div>
                                   {hasSelection && transferAmount > 0 && (
                                        <div className="pt-2 border-t border-blue-50">
                                             <div className="flex justify-between">
                                                  <span className="text-gray-600 font-medium">Số tiền cần thanh toán</span>
                                                  <span className="font-bold text-lg text-blue-700">{formatPrice(transferAmount)}</span>
                                             </div>
                                             <div className="text-xs text-gray-500 mt-1">
                                                  Nội dung chuyển khoản gợi ý: <span className="font-semibold">BOOKING-{bookingInfo?.bookingId || "XXXX"}</span>
                                             </div>
                                        </div>
                                   )}
                              </div>
                         )}

                    </div>
               </div>

               <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 ">Tóm tắt đặt sân</h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3">
                         <div className="mb-4 pb-1 border-b border-gray-200">
                              <h4 className="font-semibold text-gray-900 mb-2">{bookingData.fieldName}</h4>
                              <div className="flex items-center font-medium border border-gray-200 rounded-2xl p-1 text-gray-600 mb-1">
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

                         <div className="space-y-2 text-sm">
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
                                   <>
                                        <div className="flex justify-between">
                                             <span className="text-gray-600">Số tuần</span>
                                             <span className="font-medium text-teal-600">{recurringWeeks} tuần</span>
                                        </div>
                                        <div className="flex justify-between">
                                             <span className="text-gray-600">Tổng số buổi</span>
                                             <span className="font-medium text-teal-600">{bookingData.totalSessions || (recurringWeeks * selectedDays.length)} buổi</span>
                                        </div>
                                   </>
                              )}
                         </div>
                    </div>

                    <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3">
                         <h4 className="font-semibold text-gray-900 mb-1">Chi phí</h4>
                         <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                   <span className="text-gray-600">Giá/giờ</span>
                                   <span className="font-medium text-teal-600">{formatPrice(bookingData.price)}</span>
                              </div>
                              {isRecurring && (
                                   <div className="flex justify-between">
                                        <span className="text-gray-600">Số buổi</span>
                                        <span className="font-medium text-teal-600">{bookingData.totalSessions || (recurringWeeks * selectedDays.length)} buổi</span>
                                   </div>
                              )}
                              <div className="flex justify-between">
                                   <span className="text-gray-600">Giá mỗi buổi</span>
                                   <span className="font-medium text-teal-600">{formatPrice((bookingData.price || 0) * (bookingData.duration || 1))}</span>
                              </div>
                              {isRecurring && (
                                   <div className="flex justify-between">
                                        <span className="text-gray-600">Tổng giá ({bookingData.totalSessions || (recurringWeeks * selectedDays.length)} buổi)</span>
                                        <span className="font-medium text-teal-600">{formatPrice((bookingData.price || 0) * (bookingData.duration || 1) * (bookingData.totalSessions || recurringWeeks))}</span>
                                   </div>
                              )}
                              {bookingData.depositAmount > 0 && (
                                   <div className="flex text-yellow-600 justify-between">
                                        <span className="font-medium">Tiền cọc ({Math.round((bookingData.depositPercent || 0) * 100)}%)</span>
                                        <span className="font-medium">{formatPrice(bookingData.depositAmount)}</span>
                                   </div>
                              )}
                              {bookingData.remainingAmount > 0 && (
                                   <div className="flex text-blue-600 justify-between">
                                        <span className="font-medium">Còn lại</span>
                                        <span className="font-medium">{formatPrice(bookingData.remainingAmount)}</span>
                                   </div>
                              )}
                              <div className="flex justify-between pt-2 border-t border-teal-200">
                                   <span className="font-semibold text-gray-900">Tổng cộng</span>
                                   <span className="font-bold text-lg text-red-600">{formatPrice(bookingData.totalPrice)}</span>
                              </div>
                         </div>
                    </div>
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3">
                         <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                         <div className="text-xs text-amber-800">
                              <p className="font-semibold">Lưu ý</p>
                              <p>Việc thanh toán được thực hiện trực tiếp giữa bạn và chủ sân. BallSport chỉ giữ vai trò kết nối, hỗ trợ tìm và đặt sân cũng như nhắc lịch, hoàn toàn không nhận tiền hộ.</p>
                         </div>
                    </div>

                    <div className="p-3 border border-gray-200 rounded-2xl bg-white shadow-sm">
                         <div className="flex items-center gap-2 text-gray-900 font-semibold">
                              <ShieldCheck className="w-5 h-5 text-teal-600" />
                              Điều khoản & Chính sách
                         </div>
                         <p className="text-xs text-gray-600 leading-relaxed">
                              Việc đặt sân tuân theo điều khoản sử dụng của BallSport và chính sách hoàn tiền của chủ sân.
                              Vui lòng đọc kỹ <a href="/terms" className="text-teal-600 font-semibold underline" target="_blank" rel="noreferrer">Điều khoản đặt sân</a> và
                              <a href="/refund-policy" className="text-teal-600 font-semibold underline ml-1" target="_blank" rel="noreferrer">Chính sách hoàn tiền</a> để nắm rõ quyền lợi cũng như trách nhiệm của bạn trước khi thanh toán.
                         </p>
                    </div>
                    <Button
                         onClick={onConfirmPayment}
                         disabled={isProcessing || !paymentAmountType || isQrGenerating}
                         className={`w-full mt-4 py-3 rounded-2xl text-white font-semibold ${(isProcessing || !paymentAmountType || isQrGenerating) ? "bg-gray-400" : "bg-teal-600 hover:bg-teal-700"}`}
                    >
                         {isProcessing ? "Đang xử lý..." : "Hoàn tất đặt sân"}
                    </Button>
               </div>
          </div>
     );
}
