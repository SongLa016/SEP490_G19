
export default function PriceSummarySection({
     bookingData,
     isRecurring,
     recurringWeeks,
     selectedDays,
     selectedSlotsByDay,
     fieldSchedules,
     formatPrice
}) {
     const totalSessions = bookingData.totalSessions || 0;  // Tổng số buổi đặt

     // Lấy giá từ TimeSlots hoặc schedule đã chọn cho từng thứ

     const getSlotPrice = (slotId) => {
          if (!slotId) {
               return bookingData.price || 0;
          }
          // Ưu tiên lấy từ TimeSlots (có giá)
          if (Array.isArray(bookingData?.fieldTimeSlots) && bookingData.fieldTimeSlots.length > 0) {
               const timeSlot = bookingData.fieldTimeSlots.find(s =>
                    String(s.slotId || s.SlotId || s.slotID || s.SlotID) === String(slotId)
               );
               if (timeSlot) {
                    const price = timeSlot.price || timeSlot.Price || timeSlot.unitPrice || timeSlot.UnitPrice || 0;
                    return price;
               } else {
               }
          } else {

          }

          // Fallback: lấy từ fieldSchedules nếu có
          if (Array.isArray(fieldSchedules)) {
               const schedule = fieldSchedules.find(s =>
                    String(s.slotId || s.SlotId || s.slotID || s.SlotID) === String(slotId)
               );
               if (schedule) {
                    const price = schedule.price || schedule.Price || schedule.unitPrice || schedule.UnitPrice || 0;
                    return price;
               }
          }

          return bookingData.price || 0;
     };

     //Tính thống kê giá từ các slot đã chọn
     const getRecurringPriceStats = () => {
          if (!isRecurring || !selectedSlotsByDay || Object.keys(selectedSlotsByDay).length === 0) {
               const base = bookingData.price || 0;
               return {
                    minPrice: base,
                    maxPrice: base,
                    hasMultiplePrices: false
               };
          }

          const prices = Object.values(selectedSlotsByDay)
               .map(slotId => getSlotPrice(slotId))
               .filter(price => price > 0);

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

     // Giá đại diện để tính subtotal khi cần đặt lẻ
     const slotPrice = isRecurring ? (minPrice || bookingData.price || 0) : (bookingData.price || 0);
     // Với đặt sân cố định, không áp dụng giảm giá/cọc
     const subtotal = isRecurring
          ? (bookingData.totalPrice || bookingData.subtotal || (slotPrice * (totalSessions || 1)))
          : (bookingData.subtotal || (slotPrice * (totalSessions || 1)));

     return (
          <div className="bg-teal-50 rounded-2xl shadow-sm border border-teal-200 p-4">
               <h4 className="text-gray-900 flex font-bold justify-center text-lg items-center">
                    <span className="text-lg mr-2">💰</span>
                    Chi phí
               </h4>
               <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                         <span className="text-gray-600 font-medium flex items-center">
                              <span className="mr-2">💵</span>
                              Giá/trận (1h30')
                         </span>
                         <span className="font-medium">
                              {isRecurring && hasMultiplePrices
                                   ? `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`
                                   : formatPrice(slotPrice)}
                         </span>
                    </div>
                    {isRecurring && (
                         <div className="flex justify-between">
                              <span className="text-gray-600 font-medium flex items_center">
                                   <span className="mr-2">🎯</span>
                                   Số buổi
                              </span>
                              <span className="font-medium">{totalSessions} buổi</span>
                         </div>
                    )}
                    {isRecurring && (
                         <>
                              <div className="flex justify-between items-center">
                                   <span className="text-gray-600 font-medium flex items-center">
                                        <span className="mr-2">💸</span>
                                        Giá mỗi trận
                                   </span>
                                   <span className="font-medium">
                                        {hasMultiplePrices
                                             ? `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`
                                             : formatPrice(slotPrice)}
                                   </span>
                              </div>
                              <div className="flex justify-between items-center">
                                   <span className="text-gray-600 font-medium flex items-center">
                                        <span className="mr-2">📊</span>
                                        Tổng giá ({totalSessions} trận)
                                   </span>
                                   <span className="font-medium">{formatPrice(subtotal)}</span>
                              </div>
                              {hasMultiplePrices && (
                                   <div className="mt-1 text-xs text-gray-600 italic">
                                        Giá thay đổi theo khung giờ từng ngày, tổng giá đã tính theo đúng từng slot.
                                   </div>
                              )}
                         </>
                    )}
                    {!isRecurring && (
                         <>
                              <div className="flex justify-between items-center">
                                   <span className="text-gray-700 font-medium flex items-center">
                                        <span className="mr-2">💼</span>
                                        Tạm tính
                                   </span>
                                   <span className="font-medium">{formatPrice(subtotal)}</span>
                              </div>
                              {bookingData.discountPercent > 0 && (
                                   <div className="flex justify-between items-center">
                                        <span className="text-emerald-700 font-medium flex items-center">
                                             <span className="mr-2">🎁</span>
                                             Giảm giá ({bookingData.discountPercent}%)
                                        </span>
                                        <span className="font-medium text-emerald-700">- {formatPrice(bookingData.discountAmount)}</span>
                                   </div>
                              )}
                              {bookingData.depositAmount > 0 && (
                                   <div className="flex justify-between items-center">
                                        <span className="text-yellow-600 font-medium flex items-center">
                                             <span className="mr-2">🏦</span>
                                             Tiền cọc ({Math.round((bookingData.depositPercent || 0) * 100)}%):
                                        </span>
                                        <span className="font-medium text-yellow-600">{formatPrice(bookingData.depositAmount)}</span>
                                   </div>
                              )}
                              {bookingData.remainingAmount > 0 && (
                                   <div className="flex justify-between items-center">
                                        <span className="text-blue-600 font-medium flex items-center">
                                             <span className="mr-2">💳</span>
                                             Còn lại
                                        </span>
                                        <span className="font-medium text-blue-600">{formatPrice(bookingData.remainingAmount)}</span>
                                   </div>
                              )}
                         </>
                    )}
                    <div className="flex justify-between pt-2 border-t border-teal-200">
                         <span className="font-bold text-gray-900 flex items-center">
                              <span className="mr-2">🎉</span>
                              Tổng cộng:
                         </span>
                         <span className="font-bold text-lg text-teal-600">
                              {formatPrice(isRecurring ? subtotal : bookingData.totalPrice)}
                         </span>
                    </div>
               </div>
          </div>
     );
}
