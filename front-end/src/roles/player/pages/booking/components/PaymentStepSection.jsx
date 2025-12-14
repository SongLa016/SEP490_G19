import { MapPin, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "../../../../../shared/components/ui";

export default function PaymentStepSection({
     bookingInfo,
     ownerBankAccount,
     bookingData,
     isRecurring,
     recurringWeeks,
     selectedDays,
     selectedSlotsByDay,
     isProcessing,
     formatPrice,
     errors = {},
     onConfirmPayment,
     onCancelBooking = () => { },
     isPaymentLocked = false,
     lockCountdownSeconds = 0,
     // Khoảng thời gian gói cố định (từ BookingModal truyền xuống)
     startDate,
     endDate,
     fieldSchedules = []
}) {
     const fallbackAccount = ownerBankAccount || {
          bankName: bookingData.bankName,
          bankShortCode: bookingData.bankShortCode,
          accountNumber: bookingData.accountNumber,
          accountHolder: bookingData.accountHolder || bookingData.ownerName
     };
     const hasBankInfo = !!(fallbackAccount?.bankName || fallbackAccount?.accountNumber || fallbackAccount?.accountHolder);

     // Với đặt sân cố định (isRecurring = true), không dùng logic cọc/giảm giá – chỉ thanh toán toàn bộ tổng giá
     const isRecurringPackage = !!isRecurring;
     const rawDepositAmount = bookingData.depositAmount || bookingInfo?.depositAmount || 0;
     const depositAmount = isRecurringPackage ? 0 : rawDepositAmount;
     const depositAvailable = !isRecurringPackage && depositAmount > 0;
     const formatCountdown = (seconds) => {
          const safeSeconds = Math.max(0, seconds || 0);
          const minutes = Math.floor(safeSeconds / 60);
          const secs = safeSeconds % 60;
          return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
     };
     const formatDurationLabel = (hours) => {
          if (hours == null) return "—";
          const numericHours = Number(hours);
          if (Number.isNaN(numericHours) || numericHours <= 0) return "—";
          const totalMinutes = Math.round(numericHours * 60);
          const wholeHours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          if (wholeHours > 0 && minutes > 0) {
               return `${wholeHours}h${String(minutes).padStart(2, "0")} phút`;
          }
          if (wholeHours > 0) return `${wholeHours}h`;
          if (minutes > 0) return `${minutes} phút`;
          return "—";
     };
     // Tạo danh sách buổi định kỳ (local) từ startDate + endDate + selectedDays + selectedSlotsByDay
     const generateRecurringSessionsLocal = () => {
          if (!isRecurringPackage || !startDate || !endDate || !Array.isArray(selectedDays) || selectedDays.length === 0) {
               return [];
          }
          try {
               const sessions = [];
               const start = new Date(startDate);
               start.setHours(0, 0, 0, 0);
               const end = new Date(endDate);
               end.setHours(23, 59, 59, 999);

               for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const weekday = d.getDay(); // 0=CN..6=T7
                    if (selectedDays.includes(weekday)) {
                         const selectedSlotId = selectedSlotsByDay?.[weekday];
                         if (selectedSlotId) {
                              sessions.push({
                                   date: new Date(d),
                                   dayOfWeek: weekday,
                                   slotId: selectedSlotId
                              });
                         }
                    }
               }
               return sessions;
          } catch {
               return [];
          }
     };

     const recurringSessions = generateRecurringSessionsLocal();

     // Số buổi thực tế: với gói cố định ưu tiên theo sessions local, fallback bookingData
     const totalSessions = isRecurringPackage
          ? (recurringSessions.length || bookingData.totalSessions || 0)
          : (bookingData.totalSessions || 1);

     // Lấy giá theo slotId từ TimeSlots (ưu tiên) hoặc schedule, giống BookingModal/PriceSummarySection
     const getSlotPrice = (slotId) => {
          if (!slotId) return bookingData.price || 0;

          if (Array.isArray(bookingData?.fieldTimeSlots) && bookingData.fieldTimeSlots.length > 0) {
               const timeSlot = bookingData.fieldTimeSlots.find((s) =>
                    String(s.slotId || s.SlotId || s.slotID || s.SlotID) === String(slotId)
               );
               if (timeSlot) {
                    return (
                         timeSlot.price ||
                         timeSlot.Price ||
                         timeSlot.unitPrice ||
                         timeSlot.UnitPrice ||
                         0
                    );
               }
          }

          if (Array.isArray(fieldSchedules) && fieldSchedules.length > 0) {
               const schedule = fieldSchedules.find((s) =>
                    String(s.slotId || s.SlotId || s.slotID || s.SlotID) === String(slotId)
               );
               if (schedule) {
                    return (
                         schedule.price ||
                         schedule.Price ||
                         schedule.unitPrice ||
                         schedule.UnitPrice ||
                         0
                    );
               }
          }

          return bookingData.price || 0;
     };

     // Tính min/max giá từ các slot đã chọn để hiển thị khoảng giá (250k - 300k)
     const getRecurringPriceStats = () => {
          if (!isRecurringPackage || !selectedSlotsByDay || Object.keys(selectedSlotsByDay).length === 0) {
               const base = bookingData.price || 0;
               return {
                    minPrice: base,
                    maxPrice: base,
                    hasMultiplePrices: false
               };
          }

          const prices = Object.values(selectedSlotsByDay)
               .map((slotId) => getSlotPrice(slotId))
               .filter((price) => price > 0);

          if (prices.length === 0) {
               const fallback = bookingData.price || 0;
               return {
                    minPrice: fallback,
                    maxPrice: fallback,
                    hasMultiplePrices: false
               };
          }

          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);

          return {
               minPrice,
               maxPrice,
               hasMultiplePrices: minPrice !== maxPrice
          };
     };

     const {
          minPrice,
          maxPrice,
          hasMultiplePrices
     } = getRecurringPriceStats();

     // Giá đại diện để hiển thị khi không phải gói cố định hoặc tất cả slot cùng giá
     const slotPrice = isRecurringPackage ? (minPrice || bookingData.price || 0) : (bookingData.price || 0);

     // Tổng tiền gói cố định: ưu tiên dùng totalPrice từ backend (đã tính từ pattern 1 tuần x4)
     // Nếu không có, tính từ tất cả sessions (fallback)
     const recurringTotal = isRecurringPackage
          ? (bookingData.totalPrice || bookingInfo?.totalPrice || (() => {
               if (recurringSessions.length === 0) return 0;
               return recurringSessions.reduce((sum, session) => {
                    const price = getSlotPrice(session.slotId);
                    return sum + (Number(price) || 0);
               }, 0);
          })())
          : (bookingData.totalPrice || bookingInfo?.totalPrice || bookingData.subtotal || 0);

     const subtotal = isRecurringPackage
          ? recurringTotal
          : (bookingData.subtotal || (slotPrice * (totalSessions || 1)));

     // Số tiền cần thanh toán phải khớp với phần "Tổng cộng" bên dưới
     const transferAmount = isRecurringPackage ? subtotal : depositAmount;

     return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">Thanh toán</h3>
                    {isPaymentLocked && (
                         <div className="p-3 border border-amber-200 bg-amber-50 rounded-2xl text-xs text-amber-800">
                              <p className="font-semibold">QR thanh toán đang hoạt động</p>
                              <p>Vui lòng giữ cửa sổ mở trong <span className="font-semibold text-blue-600">{formatCountdown(lockCountdownSeconds)}</span> hoặc sử dụng nút <span className="font-semibold text-red-600 underline">Hủy đặt sân</span> nếu muốn thoát.</p>
                         </div>
                    )}
                    <div className="p-4 border border-teal-400 rounded-2xl bg-white shadow-sm space-y-2">
                         {bookingInfo?.bookingId && (
                              <div className="flex items-center justify-between text-base font-medium text-gray-600">
                                   <span>Mã đặt sân</span>
                                   <span className="font-semibold text-teal-700">#{bookingInfo.bookingId}</span>
                              </div>
                         )}

                         <div className="space-y-2 text-sm">
                              <div className="text-gray-600 font-medium">Số tiền cần thanh toán</div>
                              {isRecurringPackage ? (
                                   <div className="flex items-center justify-between py-2 px-4 border border-teal-200 rounded-2xl bg-emerald-50">
                                        <span className="text-sm font-medium text-gray-700">Thanh toán toàn bộ gói đặt cố định</span>
                                        <span className="text-xl font-bold text-emerald-700">
                                             {formatPrice(transferAmount)}
                                        </span>
                                   </div>
                              ) : depositAvailable ? (
                                   <>
                                        <div className="flex items-center justify-between py-2 px-4 border rounded-2xl bg-amber-50">
                                             <span className="text-sm font-medium text-gray-700">Thanh toán tiền cọc</span>
                                             <span className="text-xl font-bold text-yellow-600">
                                                  {formatPrice(depositAmount)}
                                             </span>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                             Hệ thống chỉ yêu cầu thanh toán tiền cọc để giữ sân. Số tiền còn lại sẽ được thanh toán sau khi trận đấu hoàn tất.
                                        </p>
                                   </>
                              ) : (
                                   <p className="text-sm text-gray-500">Sân này chưa cấu hình tiền cọc. Vui lòng liên hệ chủ sân.</p>
                              )}
                              {errors.payment && (
                                   <p className="text-xs text-red-500">{errors.payment}</p>
                              )}
                         </div>

                         {(isRecurringPackage || depositAvailable) ? (
                              bookingInfo?.qrCodeUrl ? (
                                   <div className="flex flex-col items-center text-center">
                                        <div className="p-2 bg-white border-4 border-teal-100 rounded-2xl shadow-lg mb-3">
                                             <img
                                                  src={bookingInfo.qrCodeUrl}
                                                  alt="QR thanh toán"
                                                  className="w-72 h-[350px]"
                                                  onError={(e) => {
                                                       e.target.src = bookingInfo.qrCodeUrl + '&force=' + Date.now();
                                                  }}
                                             />
                                        </div>
                                        {bookingInfo.qrExpiresAt && (
                                             <div className="text-xs text-gray-500">
                                                  QR hết hạn: {new Date(bookingInfo.qrExpiresAt).toLocaleString("vi-VN")}
                                             </div>
                                        )}
                                   </div>
                              ) : (
                                   <div className="text-sm text-gray-600 text-center">
                                        Đang tải mã QR tiền cọc từ hệ thống...
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
                                   {depositAvailable && transferAmount > 0 && (
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
                              <h4 className="font-semibold text-teal-900 mb-2">{bookingData.fieldName}</h4>
                              <div className="flex items-center font-medium border border-teal-200 rounded-2xl p-1 text-teal-600 mb-1">
                                   <MapPin className="w-4 h-4 mr-2" />
                                   <span className="text-sm">{bookingData.fieldAddress}</span>
                              </div>
                              {bookingData.fieldType && (
                                   <div className="text-sm text-teal-500">
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
                                   <span className="text-gray-600">
                                        {isRecurringPackage ? "Thời lượng gói" : "Thời lượng"}
                                   </span>
                                   <span className="font-medium">
                                        {isRecurringPackage && startDate && endDate
                                             ? `${new Date(startDate).toLocaleDateString("vi-VN")} - ${new Date(endDate).toLocaleDateString("vi-VN")}`
                                             : formatDurationLabel(bookingData.duration)}
                                   </span>
                              </div>
                              {isRecurring && (
                                   <>

                                        <div className="flex justify-between">
                                             <span className="text-gray-600">Tổng số buổi</span>
                                             <span className="font-medium text-teal-600">{totalSessions} buổi</span>
                                        </div>
                                   </>
                              )}
                         </div>
                    </div>

                    <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3">
                         <h4 className="font-semibold text-gray-900 mb-1">Chi phí</h4>
                         <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                   <span className="text-gray-600">Giá/trận (1h30')</span>
                                   <span className="font-medium text-teal-600">
                                        {isRecurringPackage && hasMultiplePrices
                                             ? `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`
                                             : formatPrice(slotPrice)}
                                   </span>
                              </div>
                              {isRecurring && (
                                   <div className="flex justify-between">
                                        <span className="text-gray-600">Số buổi</span>
                                        <span className="font-medium text-teal-600">{totalSessions} buổi</span>
                                   </div>
                              )}

                              {isRecurring && (
                                   <div className="flex justify-between">
                                        <span className="text-gray-600">Tổng giá ({totalSessions} buổi)</span>
                                        <span className="font-medium text-teal-600">{formatPrice(subtotal)}</span>
                                   </div>
                              )}
                              {isRecurringPackage && hasMultiplePrices && (
                                   <div className="mt-1 text-xs text-gray-600 italic">
                                        Giá thay đổi theo khung giờ từng ngày, tổng giá đã tính theo đúng từng slot.
                                   </div>
                              )}
                              {!isRecurringPackage && (
                                   <>
                                        <div className="flex justify-between">
                                             <span className="text-gray-600">Tạm tính</span>
                                             <span className="font-medium text-teal-600">{formatPrice(subtotal)}</span>
                                        </div>
                                        {bookingData.discountPercent > 0 && (
                                             <div className="flex text-emerald-600 justify-between">
                                                  <span className="font-medium">Giảm giá ({bookingData.discountPercent}%)</span>
                                                  <span className="font-medium">- {formatPrice(bookingData.discountAmount)}</span>
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
                                   </>
                              )}
                              <div className="flex justify-between pt-2 border-t border-teal-200">
                                   <span className="font-semibold text-gray-900">Tổng cộng</span>
                                   <span className="font-bold text-lg text-red-600">
                                        {formatPrice(isRecurringPackage ? subtotal : bookingData.totalPrice)}
                                   </span>
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
                    <div className="flex flex-col lg:flex-row gap-3 mt-4">
                         <Button
                              onClick={onConfirmPayment}
                              disabled={isProcessing || !bookingInfo?.qrCodeUrl}
                              className={`w-full py-3 rounded-2xl text-white font-semibold ${(isProcessing || !bookingInfo?.qrCodeUrl) ? "bg-gray-400" : "bg-teal-600 hover:bg-teal-700"}`}
                         >
                              {isProcessing ? "Đang xử lý..." : "Hoàn tất đặt sân"}
                         </Button>
                         <Button
                              type="button"
                              variant="destructive"
                              disabled={isProcessing}
                              onClick={onCancelBooking}
                              className="w-full py-3 rounded-2xl font-semibold"
                         >
                              Hủy đặt sân
                         </Button>
                    </div>
               </div>
          </div>
     );
}
