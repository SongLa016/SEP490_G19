export default function PriceSummarySection({
     bookingData,
     isRecurring,
     recurringWeeks,
     selectedDays,
     formatPrice
}) {
     return (
          <div className="bg-teal-50 rounded-lg p-4">
               <h4 className="text-gray-900 mb-3 flex font-bold justify-center text-lg items-center">
                    <span className="text-lg mr-2">💰</span>
                    Chi phí
               </h4>
               <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                         <span className="text-gray-600 font-medium flex items-center">
                              <span className="mr-2">💵</span>
                              Giá/giờ
                         </span>
                         <span className="font-medium">{formatPrice(bookingData.price)}</span>
                    </div>
                    {isRecurring && (
                         <div className="flex justify-between">
                              <span className="text-gray-600 font-medium flex items_center">
                                   <span className="mr-2">🎯</span>
                                   Số buổi
                              </span>
                              <span className="font-medium">{bookingData.totalSessions || (recurringWeeks * selectedDays.length)} buổi</span>
                         </div>
                    )}
                    <div className="flex justify-between items-center">
                         <span className="text-gray-600 font-medium flex items-center">
                              <span className="mr-2">💸</span>
                              Giá mỗi buổi:
                         </span>
                         <span className="font-medium">{formatPrice((bookingData.price || 0) * (bookingData.duration || 1))}</span>
                    </div>
                    {isRecurring && (
                         <div className="flex justify-between items-center">
                              <span className="text-gray-600 font-medium flex items-center">
                                   <span className="mr-2">📊</span>
                                   Tổng giá ({bookingData.totalSessions || (recurringWeeks * selectedDays.length)} buổi)
                              </span>
                              <span className="font-medium">{formatPrice(((bookingData.price || 0) * (bookingData.duration || 1)) * (bookingData.totalSessions || (recurringWeeks * selectedDays.length)))}</span>
                         </div>
                    )}
                    {isRecurring && bookingData.discountPercent > 0 && (
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
                                   Tiền cọc (30%):
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
                    <div className="flex justify-between pt-2 border-t border-teal-200">
                         <span className="font-bold text-gray-900 flex items-center">
                              <span className="mr-2">🎉</span>
                              Tổng cộng:
                         </span>
                         <span className="font-bold text-lg text-teal-600">{formatPrice(bookingData.totalPrice)}</span>
                    </div>
               </div>
          </div>
     );
}


