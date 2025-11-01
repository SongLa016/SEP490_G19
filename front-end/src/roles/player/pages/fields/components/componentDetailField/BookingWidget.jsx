import { Repeat, Tag, Clock } from "lucide-react";
import { Card, CardContent, Button, DatePicker } from "../../../../../../shared/components/ui";

export default function BookingWidget({
     selectedField,
     selectedDate,
     selectedSlotId,
     timeSlots,
     isRecurring,
     repeatDays,
     rangeStart,
     rangeEnd,
     daysOfWeek,
     currentWeeks,
     minRecurringWeeks,
     recurringSummary,
     selectedSlotPriceBig,
     minPriceBig,
     availableBundles,
     totalBundles,
     calculateTotalSessions,
     onDateChange,
     onSlotChange,
     onToggleRecurring,
     onRangeStartChange,
     onRangeEndChange,
     onToggleDay,
     onBook
}) {
     return (
          <Card className="bg-gradient-to-br from-white via-teal-50/30 to-white border border-teal-200/50 shadow-xl rounded-2xl lg:sticky lg:top-24">
               <CardContent className="p-6">
                    <h3 className="text-2xl font-bold text-center bg-gradient-to-r from-teal-700 to-emerald-700 bg-clip-text text-transparent mb-1">{selectedField ? "Đặt Sân nhỏ" : "Đặt Sân lớn"}</h3>
                    <p className="text-teal-600 font-medium text-sm mb-5 text-center">Chọn ngày/giờ hoặc bật đặt cố định</p>
                    <div className="grid grid-cols-1 gap-3">
                         <div>
                              <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                   <Tag className="w-4 h-4 text-teal-600" />
                                   Ngày
                              </div>
                              <DatePicker value={selectedDate} onChange={onDateChange} min={new Date().toISOString().split('T')[0]} />
                         </div>
                         <div>
                              <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                   <Clock className="w-4 h-4 text-teal-600" />
                                   Giờ
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg border-teal-200/50 p-2 bg-white shadow-inner">
                                   {Array.isArray(timeSlots) && timeSlots.length > 0 ? (
                                        timeSlots.map((s) => {
                                             const isSelected = String(selectedSlotId) === String(s.slotId);
                                             return (
                                                  <Button
                                                       key={s.slotId}
                                                       type="button"
                                                       onClick={() => onSlotChange(isSelected ? "" : s.slotId)}
                                                       className={`p-2 text-xs rounded-lg border transition-all ${isSelected ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-teal-600 shadow-md" : "bg-white text-teal-800 border-teal-200/50 hover:text-teal-900 hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 hover:border-teal-300 hover:shadow-sm"}`}
                                                  >
                                                       {s.name}
                                                  </Button>
                                             );
                                        })
                                   ) : (
                                        <div className="col-span-2 text-center text-gray-500 text-sm py-4">
                                             Đang tải giờ chơi...
                                        </div>
                                   )}
                              </div>
                         </div>
                         <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="bg-gradient-to-br from-orange-50/50 to-amber-50/50 border border-orange-200/50 rounded-xl p-3 shadow-sm">
                                   <div className="text-gray-600 text-xs mb-1">{selectedField ? (selectedSlotId ? "Giá slot (sân nhỏ)" : "Giá từ (sân nhỏ)") : (selectedSlotId ? "Giá slot (sân lớn)" : "Giá từ (sân lớn)")}</div>
                                   <div className="text-orange-600 font-bold text-sm">{
                                        (selectedField ?
                                             (selectedField.priceForSelectedSlot || 0)
                                             : (selectedSlotId ? selectedSlotPriceBig : minPriceBig)
                                        )
                                             ? ((selectedField ? (selectedField.priceForSelectedSlot || 0) : (selectedSlotId ? selectedSlotPriceBig : minPriceBig)).toLocaleString("vi-VN") + "₫")
                                             : "—"
                                   }</div>
                              </div>
                              <div className="bg-gradient-to-br from-teal-50/50 to-emerald-50/50 border border-teal-200/50 rounded-xl p-3 shadow-sm">
                                   <div className="text-gray-600 text-xs mb-1">{selectedField ? "Sân nhỏ còn trống" : "Sân lớn còn trống"}</div>
                                   <div className="text-teal-700 font-bold text-sm">{selectedField ? (selectedSlotId ? (selectedField.isAvailableForSelectedSlot ? 1 : 0) : 1) : (selectedSlotId ? availableBundles : totalBundles)}/{selectedField ? 1 : totalBundles}</div>
                              </div>
                         </div>
                         <div className="p-4 border rounded-xl bg-gradient-to-br from-teal-50/70 via-emerald-50/50 to-teal-50/70 border-teal-200/50 shadow-sm">
                              <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-2">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-sm">
                                             <Repeat className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                             <div className="font-semibold text-teal-800">Đặt cố định</div>
                                             {isRecurring && recurringSummary && (
                                                  <span className={`text-xs px-2 py-0.5 rounded-full border shadow-sm mt-1 inline-block ${recurringSummary.discountPercent > 0 ? "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-300" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                                       Ưu đãi {recurringSummary.discountPercent}%
                                                  </span>
                                             )}
                                        </div>
                                   </div>
                                   {/* Toggle Switch */}
                                   <button
                                        type="button"
                                        onClick={onToggleRecurring}
                                        className={`relative inline-flex h-5 w-12 items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${isRecurring ? "bg-gradient-to-r from-teal-600 to-emerald-600 shadow-lg" : "bg-gray-300"}`}
                                        role="switch"
                                        aria-checked={isRecurring}
                                   >
                                        <span
                                             className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-lg transition-all duration-300 ease-in-out ${isRecurring ? "translate-x-8" : "translate-x-1"
                                                  }`}
                                        />
                                   </button>
                              </div>
                              <div
                                   className={`overflow-hidden transition-all duration-500 ease-in-out ${isRecurring
                                        ? "max-h-[2000px] opacity-100 mt-3"
                                        : "max-h-0 opacity-0 mt-0"
                                        }`}
                              >
                                   <div className="space-y-3">
                                        <div
                                             className={`bg-white border border-teal-200 rounded-lg p-2 transition-all duration-500 ease-out ${isRecurring
                                                  ? "transform translate-y-0 opacity-100"
                                                  : "transform -translate-y-4 opacity-0"
                                                  }`}
                                             style={{ transitionDelay: isRecurring ? "50ms" : "0ms" }}
                                        >
                                             <div className="text-xs text-gray-500 mb-1">Thông tin đặt định kỳ</div>
                                             <div className="text-sm text-gray-700">• Đặt sân cho nhiều tuần liên tiếp</div>
                                             <div className="text-sm text-gray-700">• Chọn các ngày trong tuần cố định</div>
                                             <div className="text-sm text-gray-700">• Tự động kiểm tra xung đột</div>
                                        </div>
                                        <div
                                             className={`transition-all duration-500 ease-out ${isRecurring
                                                  ? "transform translate-y-0 opacity-100"
                                                  : "transform -translate-y-4 opacity-0"
                                                  }`}
                                             style={{ transitionDelay: isRecurring ? "100ms" : "0ms" }}
                                        >
                                             <div className="text-sm text-gray-600 mb-1">Từ ngày</div>
                                             <DatePicker value={rangeStart} onChange={onRangeStartChange} min={selectedDate} />
                                        </div>
                                        <div
                                             className={`transition-all duration-500 ease-out ${isRecurring
                                                  ? "transform translate-y-0 opacity-100"
                                                  : "transform -translate-y-4 opacity-0"
                                                  }`}
                                             style={{ transitionDelay: isRecurring ? "150ms" : "0ms" }}
                                        >
                                             <div className="text-sm text-gray-600 mb-1">Đến ngày</div>
                                             <DatePicker value={rangeEnd} onChange={onRangeEndChange} min={rangeStart || selectedDate} />
                                        </div>
                                        <div
                                             className={`transition-all duration-500 ease-out ${isRecurring
                                                  ? "transform translate-y-0 opacity-100"
                                                  : "transform -translate-y-4 opacity-0"
                                                  }`}
                                             style={{ transitionDelay: isRecurring ? "200ms" : "0ms" }}
                                        >
                                             <div className="text-sm text-gray-600 mb-1">Ngày trong tuần</div>
                                             <div className="flex flex-wrap gap-2">
                                                  {daysOfWeek.map(d => (
                                                       <Button
                                                            key={d.id}
                                                            type="button"
                                                            disabled={currentWeeks < minRecurringWeeks}
                                                            onClick={() => onToggleDay(d.id)}
                                                            className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${currentWeeks < minRecurringWeeks ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : repeatDays.includes(d.id) ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-teal-600 shadow-md" : "bg-white text-teal-800 border-teal-200 hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 hover:border-teal-300"}`}
                                                       >
                                                            {d.label}
                                                       </Button>
                                                  ))}
                                             </div>
                                             {currentWeeks < minRecurringWeeks && (
                                                  <div className="mt-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-lg border border-red-200">Cần chọn khoảng ngày tối thiểu {minRecurringWeeks} tuần để chọn thứ.</div>
                                             )}
                                        </div>
                                        {repeatDays.length > 0 && (
                                             <div
                                                  className={`bg-gradient-to-br from-blue-50 via-indigo-50/50 to-blue-50 border border-blue-200/50 rounded-lg p-3 shadow-sm transition-all duration-500 ease-out ${isRecurring
                                                       ? "transform translate-y-0 opacity-100"
                                                       : "transform -translate-y-4 opacity-0"
                                                       }`}
                                                  style={{ transitionDelay: isRecurring ? "250ms" : "0ms" }}
                                             >
                                                  <div className="text-xs text-blue-700 font-bold mb-1">Đã chọn {repeatDays.length} ngày/tuần</div>
                                                  <div className="text-xs text-blue-600 mb-2">Tổng số buổi: {calculateTotalSessions()}</div>
                                                  {recurringSummary && recurringSummary.totalSessions > 0 && (
                                                       <div className="mt-2 text-xs text-blue-800 space-y-1 bg-white/60 p-2 rounded border border-blue-200/50">
                                                            <div className="flex items-center justify-between"><span className="font-medium">Giá mỗi buổi</span><span className="font-semibold text-teal-700">{recurringSummary.unitPrice.toLocaleString("vi-VN")}₫</span></div>
                                                            <div className="flex items-center justify-between"><span className="font-medium">Tạm tính</span><span className="font-semibold text-gray-700">{recurringSummary.subtotal.toLocaleString("vi-VN")}₫</span></div>
                                                            <div className="flex items-center justify-between"><span className="font-medium">Giảm giá ({recurringSummary.discountPercent}%)</span><span className="font-semibold text-emerald-600">-{recurringSummary.discountAmount.toLocaleString("vi-VN")}₫</span></div>
                                                            <div className="flex items-center justify-between pt-1 border-t border-blue-200"><span className="font-bold">Thành tiền</span><span className="font-bold text-blue-800 text-base">{recurringSummary.discountedTotal.toLocaleString("vi-VN")}₫</span></div>
                                                       </div>
                                                  )}
                                             </div>
                                        )}
                                   </div>
                              </div>
                         </div>
                         <Button
                              type="button"
                              onClick={onBook}
                              className="rounded-lg bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 hover:from-teal-700 hover:via-emerald-700 hover:to-teal-700 text-white font-bold py-3 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
                         >
                              {isRecurring ? "Đặt định kỳ" : (selectedField ? "Đặt Sân nhỏ" : "Đặt Sân lớn")}
                         </Button>

                    </div>
               </CardContent>
          </Card>
     );
}

