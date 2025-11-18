import { Repeat, Tag, Clock } from "lucide-react";
import { Card, CardContent, Button, DatePicker } from "../../../../../../shared/components/ui";
import { useFieldSchedules, useMultipleFieldSchedules } from "../../../../../../shared/hooks";

export default function BookingWidget({
     selectedField,
     fields = [], // Array of all fields for "all courts" view
     selectedDate,
     selectedSlotId,
     fieldTimeSlots = [],
     isRecurring,
     repeatDays,
     rangeStart,
     rangeEnd,
     daysOfWeek,
     currentWeeks,
     minRecurringWeeks,
     recurringSummary,
     selectedSlotPrice = 0,
     minPrice = 0,
     calculateTotalSessions,
     onDateChange,
     onSlotChange,
     onToggleRecurring,
     onRangeStartChange,
     onRangeEndChange,
     onToggleDay,
     onBook
}) {
     // Get field IDs for all fields when no specific field is selected
     const allFieldIds = fields.map(f => f.fieldId || f.fieldID).filter(Boolean);

     // Use React Query hook for field schedules with caching
     // If selectedField exists, fetch for that field only
     // If no selectedField, fetch for all fields
     const { data: singleFieldSchedules = [], isLoading: isLoadingSingleSchedules } = useFieldSchedules(
          selectedField?.fieldId,
          selectedDate,
          !!selectedField?.fieldId // Only fetch when fieldId exists
     );

     const { data: allFieldSchedules = [], isLoading: isLoadingAllSchedules } = useMultipleFieldSchedules(
          allFieldIds,
          selectedDate,
          !selectedField && allFieldIds.length > 0 // Only fetch when no field is selected and we have field IDs
     );

     // Use the appropriate schedules based on whether a field is selected
     const fieldSchedules = selectedField ? singleFieldSchedules : allFieldSchedules;
     const isLoadingSchedules = selectedField ? isLoadingSingleSchedules : isLoadingAllSchedules;
     return (
          <Card className="bg-gradient-to-br from-white via-teal-50/30 to-white border border-teal-200/50 shadow-xl rounded-2xl lg:sticky lg:top-24">
               <CardContent className="p-6">
                    <h3 className="text-2xl font-bold text-center bg-gradient-to-r from-teal-700 to-emerald-700 bg-clip-text text-transparent mb-1">
                         {selectedField ? "Đặt sân nhỏ" : "Đặt Sân"}
                    </h3>
                    <p className="text-teal-600 font-medium text-sm mb-5 text-center">
                         {selectedField ? "Chọn ngày/giờ hoặc bật đặt cố định" : "Chọn sân nhỏ để bắt đầu đặt lịch"}
                    </p>

                    {/* Show schedules for all fields or selected field */}
                    {!selectedField ? (
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
                                        Giờ (Tất cả sân)
                                   </div>
                                   <div className={`grid grid-cols-1 gap-2 max-h-96 overflow-y-auto border rounded-lg border-teal-200/50 p-2 bg-white shadow-inner`}>
                                        {isLoadingSchedules ? (
                                             <div className="text-center text-gray-500 text-sm py-4">
                                                  Đang tải lịch trình...
                                             </div>
                                        ) : Array.isArray(fieldSchedules) && fieldSchedules.length > 0 ? (
                                             fieldSchedules
                                                  .filter(schedule => schedule.status === "Available")
                                                  .map((schedule) => {
                                                       const scheduleSlotId = schedule.slotId || schedule.SlotId;
                                                       const scheduleId = schedule.scheduleId || schedule.ScheduleId;
                                                       const scheduleFieldId = schedule.fieldId || schedule.FieldId;
                                                       const isSelected = String(selectedSlotId) === String(scheduleSlotId);
                                                       const slotName = schedule.slotName || schedule.SlotName || `Slot ${scheduleSlotId}`;

                                                       // Get field name when viewing all fields
                                                       const fieldName = !selectedField && scheduleFieldId
                                                            ? (fields.find(f => String(f.fieldId || f.fieldID) === String(scheduleFieldId))?.name || `Sân ${scheduleFieldId}`)
                                                            : null;

                                                       // Time is already string from API (e.g., "06:00", "07:30")
                                                       const startTime = schedule.startTime || schedule.StartTime || "";
                                                       const endTime = schedule.endTime || schedule.EndTime || "";
                                                       const timeRange = startTime && endTime
                                                            ? `${startTime} - ${endTime}`
                                                            : "";

                                                       // Check if slot is in the past
                                                       const isPastSlot = (() => {
                                                            if (!selectedDate || !startTime) return false;

                                                            const now = new Date();
                                                            const scheduleDate = new Date(selectedDate);

                                                            // If schedule date is in the past, it's a past slot
                                                            if (scheduleDate.toDateString() < now.toDateString()) {
                                                                 return true;
                                                            }

                                                            // If schedule date is today, check the time
                                                            if (scheduleDate.toDateString() === now.toDateString()) {
                                                                 const [hours, minutes] = startTime.split(':').map(Number);
                                                                 const slotTime = new Date(now);
                                                                 slotTime.setHours(hours, minutes, 0, 0);

                                                                 return slotTime < now;
                                                            }

                                                            return false;
                                                       })();

                                                       const isDisabled = schedule.status !== "Available" || isPastSlot;

                                                       return (
                                                            <Button
                                                                 key={`${scheduleId || scheduleSlotId}-${scheduleFieldId || 'unknown'}`}
                                                                 type="button"
                                                                 onClick={() => !isDisabled && onSlotChange(isSelected ? "" : scheduleSlotId)}
                                                                 disabled={isDisabled}
                                                                 className={`p-2 text-xs rounded-lg border transition-all ${isSelected
                                                                      ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-teal-600 shadow-md"
                                                                      : isDisabled
                                                                           ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                                                           : "bg-white text-teal-800 border-teal-200/50 hover:text-teal-900 hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 hover:border-teal-300 hover:shadow-sm"
                                                                      }`}
                                                            >
                                                                 <div className="flex flex-col items-start w-full">
                                                                      {fieldName && (
                                                                           <span className="text-xs font-semibold text-teal-700 mb-0.5">{fieldName}</span>
                                                                      )}
                                                                      <span className="font-medium">{slotName}</span>
                                                                      {timeRange && <span className="text-xs opacity-75 mt-0.5">{timeRange}</span>}
                                                                      {isPastSlot && <span className="text-xs text-red-400 mt-0.5">(Đã qua giờ)</span>}
                                                                 </div>
                                                            </Button>
                                                       );
                                                  })
                                        ) : (
                                             <div className="text-center text-gray-500 text-sm py-4">
                                                  Không có lịch trình khả dụng cho ngày này
                                             </div>
                                        )}
                                   </div>
                              </div>
                              <div className="bg-gradient-to-br from-blue-50 via-indigo-50/50 to-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                                   <p className="text-sm text-gray-600">
                                        Đang hiển thị lịch trình của tất cả sân. Chọn một sân nhỏ từ danh sách bên dưới để đặt sân.
                                   </p>
                              </div>
                         </div>
                    ) : (
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
                                   <div className={`grid ${selectedField ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-2 ${selectedField ? 'max-h-40' : 'max-h-96'} overflow-y-auto border rounded-lg border-teal-200/50 p-2 bg-white shadow-inner`}>
                                        {isLoadingSchedules ? (
                                             <div className="col-span-2 text-center text-gray-500 text-sm py-4">
                                                  Đang tải lịch trình...
                                             </div>
                                        ) : Array.isArray(fieldSchedules) && fieldSchedules.length > 0 ? (
                                             fieldSchedules
                                                  .filter(schedule => schedule.status === "Available")
                                                  .map((schedule) => {
                                                       const scheduleSlotId = schedule.slotId || schedule.SlotId;
                                                       const scheduleId = schedule.scheduleId || schedule.ScheduleId;
                                                       const scheduleFieldId = schedule.fieldId || schedule.FieldId;
                                                       const isSelected = String(selectedSlotId) === String(scheduleSlotId);
                                                       const slotName = schedule.slotName || schedule.SlotName || `Slot ${scheduleSlotId}`;

                                                       // Get field name when viewing all fields
                                                       const fieldName = !selectedField && scheduleFieldId
                                                            ? (fields.find(f => String(f.fieldId || f.fieldID) === String(scheduleFieldId))?.name || `Sân ${scheduleFieldId}`)
                                                            : null;

                                                       // Time is already string from API (e.g., "06:00", "07:30")
                                                       const startTime = schedule.startTime || schedule.StartTime || "";
                                                       const endTime = schedule.endTime || schedule.EndTime || "";
                                                       const timeRange = startTime && endTime
                                                            ? `${startTime} - ${endTime}`
                                                            : "";

                                                       // Check if slot is in the past
                                                       const isPastSlot = (() => {
                                                            if (!selectedDate || !startTime) return false;

                                                            const now = new Date();
                                                            const scheduleDate = new Date(selectedDate);

                                                            // If schedule date is in the past, it's a past slot
                                                            if (scheduleDate.toDateString() < now.toDateString()) {
                                                                 return true;
                                                            }

                                                            // If schedule date is today, check the time
                                                            if (scheduleDate.toDateString() === now.toDateString()) {
                                                                 const [hours, minutes] = startTime.split(':').map(Number);
                                                                 const slotTime = new Date(now);
                                                                 slotTime.setHours(hours, minutes, 0, 0);

                                                                 return slotTime < now;
                                                            }

                                                            return false;
                                                       })();

                                                       const isDisabled = schedule.status !== "Available" || isPastSlot;

                                                       return (
                                                            <Button
                                                                 key={`${scheduleId || scheduleSlotId}-${scheduleFieldId || 'unknown'}`}
                                                                 type="button"
                                                                 onClick={() => !isDisabled && onSlotChange(isSelected ? "" : scheduleSlotId)}
                                                                 disabled={isDisabled}
                                                                 className={`p-2 text-xs rounded-lg border transition-all ${isSelected
                                                                      ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-teal-600 shadow-md"
                                                                      : isDisabled
                                                                           ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                                                           : "bg-white text-teal-800 border-teal-200/50 hover:text-teal-900 hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 hover:border-teal-300 hover:shadow-sm"
                                                                      }`}
                                                            >
                                                                 <div className="flex flex-col items-start w-full">
                                                                      {fieldName && (
                                                                           <span className="text-xs font-semibold text-teal-700 mb-0.5">{fieldName}</span>
                                                                      )}
                                                                      <span className="font-medium">{slotName}</span>
                                                                      {timeRange && <span className="text-xs opacity-75 mt-0.5">{timeRange}</span>}
                                                                      {isPastSlot && <span className="text-xs text-red-400 mt-0.5">(Đã qua giờ)</span>}
                                                                 </div>
                                                            </Button>
                                                       );
                                                  })
                                        ) : (
                                             <div className="col-span-2 text-center text-gray-500 text-sm py-4">
                                                  Không có lịch trình khả dụng cho ngày này
                                             </div>
                                        )}
                                   </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                   <div className="bg-gradient-to-br from-orange-50/50 to-amber-50/50 border border-orange-200/50 rounded-xl p-3 shadow-sm">
                                        <div className="text-gray-600 text-xs mb-1">{selectedSlotId ? "Giá slot (sân nhỏ)" : "Giá từ (sân nhỏ)"}</div>
                                        <div className="text-orange-600 font-bold text-sm">{
                                             (selectedSlotId ? selectedSlotPrice : minPrice) > 0
                                                  ? (selectedSlotId ? selectedSlotPrice : minPrice).toLocaleString("vi-VN") + "₫"
                                                  : "—"
                                        }</div>
                                   </div>
                                   <div className="bg-gradient-to-br from-teal-50/50 to-emerald-50/50 border border-teal-200/50 rounded-xl p-3 shadow-sm">
                                        <div className="text-gray-600 text-xs mb-1">Sân nhỏ còn trống</div>
                                        <div className="text-teal-700 font-bold text-sm">{selectedSlotId ? (selectedField?.isAvailableForSelectedSlot ? 1 : 0) : 1}/1</div>
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
                                   {isRecurring ? "Đặt định kỳ" : "Đặt sân nhỏ"}
                              </Button>
                         </div>
                    )}
               </CardContent>
          </Card>
     );
}

