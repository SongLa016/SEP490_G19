import { Repeat, Tag, Clock } from "lucide-react";
import { Card, CardContent, Button, DatePicker } from "../../../../../../shared/components/ui";

export default function BookingWidget({
     selectedField,
     fields = [],
     selectedDate,
     selectedSlotId,
     fieldSchedules = [],
     isLoadingSchedules = false,
     isRecurring,
     repeatDays,
     rangeStart,
     rangeEnd,
     daysOfWeek,
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

     const isSlotInPast = (startTimeValue) => {
          if (!selectedDate || !startTimeValue) return false;

          const scheduleDate = new Date(selectedDate);
          if (Number.isNaN(scheduleDate.getTime())) return false;

          const today = new Date();
          const startOfScheduleDay = new Date(scheduleDate);
          startOfScheduleDay.setHours(0, 0, 0, 0);

          const startOfToday = new Date(today);
          startOfToday.setHours(0, 0, 0, 0);

          if (startOfScheduleDay.getTime() < startOfToday.getTime()) {
               return true;
          }

          if (startOfScheduleDay.getTime() > startOfToday.getTime()) {
               return false;
          }

          const [hours = 0, minutes = 0] = startTimeValue.split(':').map(Number);
          const slotDateTime = new Date(scheduleDate);
          slotDateTime.setHours(hours || 0, minutes || 0, 0, 0);

          return slotDateTime.getTime() < today.getTime();
     };

     // Use the provided schedules only when a field is selected
     const displaySchedules = selectedField ? fieldSchedules : [];
     const displaySchedulesLoading = selectedField ? isLoadingSchedules : false;

     // Tính trạng thái còn chỗ cho slot đang chọn & cho cả ngày dựa trên fieldSchedules
     const { hasScheduleForSelectedSlot, isSelectedSlotAvailable, anyAvailableToday } = (() => {
          if (!selectedField || !Array.isArray(fieldSchedules)) {
               return {
                    hasScheduleForSelectedSlot: false,
                    isSelectedSlotAvailable: false,
                    anyAvailableToday: false
               };
          }

          // Chỉ tính là còn chỗ nếu status = Available và CHƯA qua giờ
          let anyAvailable = fieldSchedules.some((s) => {
               const startTime = s.startTime || s.StartTime || "";
               const status = s.status || s.Status || "Available";
               const past = isSlotInPast(startTime);
               return status === "Available" && !past;
          });

          if (!selectedSlotId) {
               return {
                    hasScheduleForSelectedSlot: false,
                    isSelectedSlotAvailable: false,
                    anyAvailableToday: anyAvailable
               };
          }

          const slotIdStr = String(selectedSlotId);
          const relatedSchedules = fieldSchedules.filter((s) => {
               const scheduleSlotId = s.slotId || s.SlotId || s.slotID || s.SlotID;
               const startTime = s.startTime || s.StartTime || "";
               const status = s.status || s.Status || "Available";
               const past = isSlotInPast(startTime);
               // Chỉ coi là hợp lệ nếu chưa qua giờ
               return String(scheduleSlotId) === slotIdStr && !past && status === "Available";
          });
          if (!relatedSchedules.length) {
               return {
                    hasScheduleForSelectedSlot: false,
                    isSelectedSlotAvailable: false,
                    anyAvailableToday: anyAvailable
               };
          }
          const isAvailable = relatedSchedules.length > 0;
          return {
               hasScheduleForSelectedSlot: true,
               isSelectedSlotAvailable: isAvailable,
               anyAvailableToday: anyAvailable
          };
     })();
     return (
          <Card className="bg-gradient-to-br from-white via-teal-50/30 to-white border border-teal-200/50 shadow-xl rounded-2xl lg:sticky lg:top-24">
               <CardContent className="p-6">
                    <h3 className="text-2xl font-bold text-center bg-gradient-to-r from-teal-700 to-emerald-700 bg-clip-text text-transparent mb-1">
                         {selectedField ? "Đặt sân nhỏ" : "Đặt Sân"}
                    </h3>
                    <p className="text-teal-600 font-medium text-sm mb-5 text-center">
                         {selectedField ? "Chọn ngày/giờ hoặc bật đặt cố định" : "Chọn sân nhỏ để bắt đầu đặt lịch"}
                    </p>

                    {/* Show friendly notice when no field is selected */}
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
                                        Giờ
                                   </div>
                                   <div className="border border-dashed border-teal-200 rounded-xl bg-white/80 p-4 text-center">
                                        <p className="text-sm text-gray-600 mb-2">
                                             Bạn đang xem thông tin <span className="font-semibold text-teal-700">khu sân tổng</span>.
                                        </p>
                                        <p className="text-sm text-gray-600">
                                             Hãy chọn một <span className="font-semibold text-teal-700">sân nhỏ</span> trong danh sách để xem lịch và đặt sân.
                                        </p>
                                   </div>
                              </div>
                              <div className="bg-gradient-to-br from-blue-50 via-indigo-50/50 to-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                                   <p className="text-sm text-gray-600">
                                        Đang hiển thị tổng quan khu sân. Chọn một sân nhỏ từ danh sách bên dưới để bắt đầu đặt lịch.
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
                                        {displaySchedulesLoading ? (
                                             <div className="col-span-2 text-center text-gray-500 text-sm py-4">
                                                  Đang tải lịch trình...
                                             </div>
                                        ) : Array.isArray(displaySchedules) && displaySchedules.length > 0 ? (
                                             displaySchedules
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

                                                       const isPastSlot = isSlotInPast(startTime);
                                                       const normalizedStatus = schedule.status || schedule.Status || "Available";
                                                       const isDisabled = normalizedStatus !== "Available" || isPastSlot;

                                                       return (
                                                            <Button
                                                                 key={`${scheduleId || scheduleSlotId}-${scheduleFieldId || 'unknown'}`}
                                                                 type="button"
                                                                 onClick={() => !isDisabled && onSlotChange(isSelected ? "" : scheduleSlotId)}
                                                                 disabled={isDisabled}
                                                                 className={`p-2 text-xs rounded-lg border transition-all relative ${isSelected
                                                                      ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-teal-600 shadow-md"
                                                                      : isDisabled
                                                                           ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                                                           : "bg-white text-teal-800 border-teal-200/50 hover:text-teal-900 hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 hover:border-teal-300 hover:shadow-sm"
                                                                      }`}
                                                            >

                                                                 <div className="flex flex-col items-start w-full">
                                                                      {isPastSlot && <span className="text-xs absolute -top-1.5 right-0 text-red-400 ">(Đã qua giờ)</span>}
                                                                      {isDisabled && <span className="text-xs absolute -top-1.5 right-0 text-red-400 ">(Hết chỗ)</span>}
                                                                      {fieldName && (
                                                                           <span className="text-xs  font-semibold text-teal-700">{fieldName}</span>
                                                                      )}
                                                                      <span className="font-medium">{slotName}</span>
                                                                      {timeRange && <span className="text-xs opacity-75 ">{timeRange}</span>}

                                                                 </div>
                                                            </Button>
                                                       );
                                                  })
                                        ) : (
                                             <div className="col-span-2 text-center text-gray-500 text-sm py-4">
                                                  Không có lịch trình cho sân này trong ngày được chọn
                                             </div>
                                        )}
                                   </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                   <div className="bg-gradient-to-br from-orange-50/50 to-amber-50/50 border border-orange-200/50 rounded-xl p-2 px-3 shadow-sm">
                                        <div className="text-gray-600 text-xs mb-1">{selectedSlotId ? "Giá slot (sân nhỏ)" : "Giá từ (sân nhỏ)"}</div>
                                        <div className="text-orange-600 font-bold text-sm">{
                                             (selectedSlotId ? selectedSlotPrice : minPrice) > 0
                                                  ? (selectedSlotId ? selectedSlotPrice : minPrice).toLocaleString("vi-VN") + "₫"
                                                  : "—"
                                        }</div>
                                   </div>
                                   <div className="bg-gradient-to-br from-teal-50/50 to-emerald-50/50 border border-teal-200/50 rounded-xl p-2 px-3 shadow-sm">
                                        <div className="text-gray-600 text-xs mb-1">Sân nhỏ còn trống</div>
                                        <div className="text-teal-700 font-bold text-sm">
                                             {selectedField
                                                  ? (
                                                       selectedSlotId
                                                            ? (isSelectedSlotAvailable ? 1 : 0)
                                                            : (anyAvailableToday ? 1 : 0)
                                                  )
                                                  : 1
                                             }/1
                                        </div>
                                   </div>
                              </div>
                              <div className="px-2 py-3 border rounded-xl bg-gradient-to-br from-teal-50/70 via-emerald-50/50 to-teal-50/70 border-teal-200/50 shadow-sm">
                                   <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-sm">
                                                  <Repeat className="w-5 h-5 text-white" />
                                             </div>
                                             <div className="font-semibold text-teal-800">Đặt cố định</div>
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
                                        <div className="space-y-2">
                                             <div
                                                  className={`bg-white border border-teal-200 rounded-2xl p-2 px-3 transition-all duration-500 ease-out ${isRecurring
                                                       ? "transform translate-y-0 opacity-100"
                                                       : "transform -translate-y-4 opacity-0"
                                                       }`}
                                                  style={{ transitionDelay: isRecurring ? "50ms" : "0ms" }}
                                             >
                                                  <div className="text-xs text-teal-600 mb-1">Thông tin đặt định kỳ</div>
                                                  <div className="text-sm text-teal-700">• Đặt sân cho nhiều tuần liên tiếp</div>
                                                  <div className="text-sm text-teal-700">• Chọn các ngày trong tuần cố định</div>

                                             </div>
                                             <div
                                                  className={`transition-all duration-500 ease-out ${isRecurring
                                                       ? "transform translate-y-0 opacity-100"
                                                       : "transform -translate-y-4 opacity-0"
                                                       }`}
                                                  style={{ transitionDelay: isRecurring ? "100ms" : "0ms" }}
                                             >
                                                  <div className="text-sm text-gray-600 mb-1">Từ ngày</div>
                                                  <DatePicker value={rangeStart} onChange={onRangeStartChange} className="rounded-xl mx-auto w-[97%]" min={selectedDate} />
                                             </div>
                                             <div
                                                  className={`transition-all duration-500 ease-out ${isRecurring
                                                       ? "transform translate-y-0 opacity-100"
                                                       : "transform -translate-y-4 opacity-0"
                                                       }`}
                                                  style={{ transitionDelay: isRecurring ? "150ms" : "0ms" }}
                                             >
                                                  <div className="text-sm text-gray-600 mb-1">Đến ngày</div>
                                                  <DatePicker value={rangeEnd} onChange={onRangeEndChange} className="rounded-xl mx-auto w-[97%]" min={rangeStart || selectedDate} />
                                             </div>
                                             <div
                                                  className={`transition-all duration-500 ease-out ${isRecurring
                                                       ? "transform translate-y-0 opacity-100"
                                                       : "transform -translate-y-4 opacity-0"
                                                       }`}
                                                  style={{ transitionDelay: isRecurring ? "200ms" : "0ms" }}
                                             >
                                                  <div className="text-sm text-gray-600 mb-1">Ngày trong tuần</div>
                                                  {!rangeStart || !rangeEnd ? (
                                                       <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                                                            Vui lòng chọn ngày bắt đầu và ngày kết thúc trước.
                                                       </div>
                                                  ) : (
                                                       <div className="flex flex-wrap gap-1">
                                                            {daysOfWeek.map(d => (
                                                                 <Button
                                                                      key={d.id}
                                                                      type="button"
                                                                      onClick={() => onToggleDay(d.id)}
                                                                      className={`px-3 py-0.5 rounded-full border text-sm transition-all ${repeatDays.includes(d.id) ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-teal-600 shadow-md" : "bg-white text-teal-800 border-teal-200 hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 hover:border-teal-300"}`}
                                                                 >
                                                                      {d.label}
                                                                 </Button>
                                                            ))}
                                                       </div>
                                                  )}
                                             </div>
                                             {repeatDays.length > 0 && (
                                                  <div
                                                       className={`bg-gradient-to-br from-blue-50 via-indigo-50/50 to-blue-50 border border-blue-200/50 rounded-2xl p-3 shadow-sm transition-all duration-500 ease-out ${isRecurring
                                                            ? "transform translate-y-0 opacity-100"
                                                            : "transform -translate-y-4 opacity-0"
                                                            }`}
                                                       style={{ transitionDelay: isRecurring ? "250ms" : "0ms" }}
                                                  >
                                                       <div className="text-xs text-blue-700 font-bold mb-1">Đã chọn {repeatDays.length} ngày/tuần</div>
                                                       <div className="text-xs text-blue-600 mb-2">Tổng số buổi: {calculateTotalSessions()}</div>
                                                       {recurringSummary && recurringSummary.totalSessions > 0 && (
                                                            <div className="mt-2 text-xs text-blue-800 space-y-1 bg-white/60 p-2 rounded-xl border border-blue-200/50">
                                                                 <div className="flex items-center justify-between"><span className="font-medium">Giá mỗi buổi</span><span className="font-semibold text-yellow-700">{recurringSummary.unitPrice.toLocaleString("vi-VN")}₫</span></div>
                                                                 <div className="flex items-center justify-between"><span className="font-medium">Tạm tính</span><span className="font-semibold text-red-700">{recurringSummary.subtotal.toLocaleString("vi-VN")}₫</span></div>

                                                            </div>
                                                       )}
                                                  </div>
                                             )}
                                        </div>
                                   </div>
                              </div>
                              {isRecurring && repeatDays.length > 0 && rangeStart && rangeEnd && (
                                   <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-start gap-2">
                                        <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                             <p className="text-sm font-medium text-blue-800">
                                                  Tiếp tục để chọn giờ và thanh toán
                                             </p>
                                             <p className="text-xs text-blue-600 mt-1">
                                                  Sau khi nhấn "Đặt cố định", bạn sẽ được chuyển đến màn hình đặt sân để chọn khung giờ cho từng ngày trong tuần đã chọn.
                                             </p>
                                        </div>
                                   </div>
                              )}
                              <Button
                                   type="button"
                                   onClick={onBook}
                                   className="rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 hover:from-teal-700 hover:via-emerald-700 hover:to-teal-700 text-white font-bold py-3 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
                              >
                                   {isRecurring ? "Đặt cố định" : "Đặt sân nhỏ"}
                              </Button>
                         </div>
                    )}
               </CardContent>
          </Card>
     );
}
