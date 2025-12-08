import { Repeat, CalendarDays, Clock, DollarSign } from "lucide-react";
import { Button, DatePicker } from "../../../../../shared/components/ui";

export default function RecurringBookingSection({
     isRecurring,
     setIsRecurring,
     startDate,
     setStartDate,
     endDate,
     setEndDate,
     selectedDays,
     handleDayToggle,
     selectedSlotsByDay, // { dayOfWeek: slotId } - slot đã chọn cho mỗi thứ
     onSlotSelect, // (dayOfWeek, slotId) => void
     fieldSchedules = [], // Danh sách schedule để filter theo dayOfWeek
     onBookingDataChange,
     generateRecurringSessions,
     fieldTimeSlots = [] // TimeSlots chứa giá theo slotId
}) {
     const dayOptions = [
          { value: 1, label: "T2", name: "Thứ 2" },
          { value: 2, label: "T3", name: "Thứ 3" },
          { value: 3, label: "T4", name: "Thứ 4" },
          { value: 4, label: "T5", name: "Thứ 5" },
          { value: 5, label: "T6", name: "Thứ 6" },
          { value: 6, label: "T7", name: "Thứ 7" },
          { value: 0, label: "CN", name: "Chủ nhật" }
     ];

     // Chuẩn hoá khoảng ngày bắt đầu/kết thúc để so sánh
     const startDateObj = startDate ? new Date(startDate) : null;
     const endDateObj = endDate ? new Date(endDate) : null;
     if (startDateObj) startDateObj.setHours(0, 0, 0, 0);
     if (endDateObj) endDateObj.setHours(23, 59, 59, 999);

     // Lấy schedule cho một dayOfWeek cụ thể (unique theo slotId)
     const getSchedulesForDay = (dayOfWeek) => {
          if (!Array.isArray(fieldSchedules) || fieldSchedules.length === 0) {
               return [];
          }

          const filtered = fieldSchedules.filter(s => {
               // Thử lấy dayOfWeek trực tiếp từ schedule
               let scheduleDayOfWeek = s.dayOfWeek ?? s.DayOfWeek ?? s.weekday ?? s.Weekday;
               let scheduleDateObj = null;

               // Nếu không có, tính từ date
               if (scheduleDayOfWeek === undefined || scheduleDayOfWeek === null) {
                    const scheduleDate = s.date ?? s.Date ?? s.scheduleDate ?? s.ScheduleDate;
                    if (scheduleDate) {
                         try {
                              const date = typeof scheduleDate === 'string'
                                   ? new Date(scheduleDate)
                                   : (scheduleDate.year && scheduleDate.month && scheduleDate.day
                                        ? new Date(scheduleDate.year, scheduleDate.month - 1, scheduleDate.day)
                                        : new Date(scheduleDate));
                              if (!isNaN(date.getTime())) {
                                   scheduleDateObj = date;
                                   scheduleDayOfWeek = date.getDay(); // 0 = CN, 1 = T2, ..., 6 = T7
                              }
                         } catch (e) {
                              // Silent fail
                         }
                    }
               }

               // Nếu đã chọn khoảng ngày, chỉ lấy schedule nằm trong khoảng đó
               let inRange = true;
               if (startDateObj && endDateObj) {
                    if (!scheduleDateObj) {
                         const scheduleDate = s.date ?? s.Date ?? s.scheduleDate ?? s.ScheduleDate;
                         if (scheduleDate) {
                              try {
                                   const date = typeof scheduleDate === 'string'
                                        ? new Date(scheduleDate)
                                        : (scheduleDate.year && scheduleDate.month && scheduleDate.day
                                             ? new Date(scheduleDate.year, scheduleDate.month - 1, scheduleDate.day)
                                             : new Date(scheduleDate));
                                   if (!isNaN(date.getTime())) {
                                        scheduleDateObj = date;
                                   }
                              } catch (e) {
                                   // ignore parse error, coi như out of range
                              }
                         }
                    }
                    if (scheduleDateObj) {
                         const time = scheduleDateObj.getTime();
                         inRange = time >= startDateObj.getTime() && time <= endDateObj.getTime();
                    } else {
                         inRange = false;
                    }
               }

               return inRange && Number(scheduleDayOfWeek) === Number(dayOfWeek);
          });

          // Deduplicate theo slotId để chỉ lấy unique slot cho mỗi thứ
          // (vì có thể có nhiều schedule cho cùng slot nhưng khác ngày)
          const seenSlotIds = new Set();
          const uniqueSchedules = filtered.filter(s => {
               const slotId = s.slotId ?? s.SlotId ?? s.slotID ?? s.SlotID;
               if (seenSlotIds.has(String(slotId))) {
                    return false;
               }
               seenSlotIds.add(String(slotId));
               return true;
          });

          // Sắp xếp theo giờ bắt đầu tăng dần
          const parseTime = (timeStr) => {
               if (!timeStr || typeof timeStr !== "string") return Number.POSITIVE_INFINITY;
               const [h, m] = timeStr.split(":").map(Number);
               if (Number.isNaN(h) || Number.isNaN(m)) return Number.POSITIVE_INFINITY;
               return h * 60 + m;
          };

          return uniqueSchedules.sort((a, b) => {
               const startA = a.startTime || a.StartTime || "";
               const startB = b.startTime || b.StartTime || "";
               return parseTime(startA) - parseTime(startB);
          });
     };

     // Format time range
     const formatTimeRange = (startTime, endTime) => {
          if (!startTime || !endTime) return "";
          return `${startTime} - ${endTime}`;
     };

     // Tính số buổi sẽ tạo
     const calculateTotalSessions = () => {
          if (!startDate || !endDate || selectedDays.length === 0) return 0;
          try {
               const start = new Date(startDate);
               const end = new Date(endDate);
               if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;

               let count = 0;
               const current = new Date(start);
               while (current <= end) {
                    const weekday = current.getDay(); // 0 = CN, 1 = T2, ..., 6 = T7
                    if (selectedDays.includes(weekday)) {
                         count++;
                    }
                    current.setDate(current.getDate() + 1);
               }
               return count;
          } catch {
               return 0;
          }
     };

     // Tính số buổi theo từng mức giá
     const calculateSessionsByPrice = () => {
          if (!startDate || !endDate || selectedDays.length === 0 || !selectedSlotsByDay) return {};

          try {
               const start = new Date(startDate);
               const end = new Date(endDate);
               if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return {};

               // Đếm số buổi cho mỗi ngày được chọn
               const sessionsByDay = {};
               const current = new Date(start);
               while (current <= end) {
                    const weekday = current.getDay();
                    if (selectedDays.includes(weekday)) {
                         if (!sessionsByDay[weekday]) {
                              sessionsByDay[weekday] = 0;
                         }
                         sessionsByDay[weekday]++;
                    }
                    current.setDate(current.getDate() + 1);
               }

               // Tính số buổi theo từng mức giá
               const sessionsByPrice = {};
               Object.keys(sessionsByDay).forEach(dayOfWeek => {
                    const slotId = selectedSlotsByDay[Number(dayOfWeek)];
                    if (slotId) {
                         // Lấy giá từ fieldTimeSlots
                         const timeSlot = Array.isArray(fieldTimeSlots) && fieldTimeSlots.length > 0
                              ? fieldTimeSlots.find(ts =>
                                   String(ts.slotId || ts.SlotId || ts.slotID || ts.SlotID) === String(slotId)
                              )
                              : null;

                         const price = timeSlot
                              ? (timeSlot.price || timeSlot.Price || timeSlot.unitPrice || timeSlot.UnitPrice || 0)
                              : 0;

                         if (price > 0) {
                              if (!sessionsByPrice[price]) {
                                   sessionsByPrice[price] = 0;
                              }
                              sessionsByPrice[price] += sessionsByDay[dayOfWeek];
                         }
                    }
               });

               return sessionsByPrice;
          } catch {
               return {};
          }
     };

     const totalSessions = calculateTotalSessions();
     const sessionsByPrice = calculateSessionsByPrice();

     return (
          <div className="bg-teal-50 rounded-2xl shadow-sm border border-teal-200 p-4">
               <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                         <Repeat className="w-5 h-5 text-teal-600" />
                         <span className="font-medium text-teal-800">Đặt lịch cố định hàng tuần</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                         <input
                              type="checkbox"
                              checked={isRecurring}
                              onChange={(e) => {
                                   setIsRecurring(e.target.checked);
                                   onBookingDataChange("isRecurring", e.target.checked);
                              }}
                              className="sr-only peer"
                         />
                         <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
               </div>
               {isRecurring && (
                    <div className="space-y-3 mt-3">
                         {/* Bước 1: Chọn khoảng thời gian */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ngày bắt đầu
                                   </label>
                                   <DatePicker
                                        value={startDate}
                                        onChange={(date) => {
                                             setStartDate(date);
                                             onBookingDataChange("startDate", date);
                                        }}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="rounded-xl"
                                   />
                              </div>
                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ngày kết thúc
                                   </label>
                                   <DatePicker
                                        value={endDate}
                                        onChange={(date) => {
                                             setEndDate(date);
                                             onBookingDataChange("endDate", date);
                                        }}
                                        min={startDate || new Date().toISOString().split('T')[0]}
                                        className="rounded-xl"
                                   />
                              </div>
                         </div>

                         {/* Bước 2: Chọn các thứ trong tuần */}
                         {startDate && endDate && (
                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Chọn ngày trong tuần
                                   </label>
                                   <div className="grid grid-cols-7 gap-2">
                                        {dayOptions.map((day) => {
                                             const isSelected = selectedDays.includes(day.value);
                                             return (
                                                  <Button
                                                       key={day.value}
                                                       type="button"
                                                       onClick={() => handleDayToggle(day.value)}
                                                       variant={isSelected ? "default" : "outline"}
                                                       size="sm"
                                                       className={`p-2 text-sm rounded-xl font-medium ${isSelected
                                                            ? "bg-teal-500 text-white border-teal-500 hover:bg-teal-600"
                                                            : "bg-white text-gray-700 hover:text-teal-500 hover:bg-teal-50 border-teal-300"
                                                            }`}
                                                       title={day.name}
                                                  >
                                                       {day.label}
                                                  </Button>
                                             );
                                        })}
                                   </div>
                                   {selectedDays.length === 0 && (
                                        <p className="text-red-500 text-sm mt-1">Vui lòng chọn ít nhất một ngày</p>
                                   )}
                              </div>
                         )}

                         {/* Bước 3: Chọn slot cho từng thứ đã chọn */}
                         {selectedDays.length > 0 && startDate && endDate && (
                              <div className="space-y-2">
                                   <label className="block text-sm font-medium text-gray-700">
                                        Chọn khung giờ cho từng ngày
                                   </label>
                                   {selectedDays.slice().sort((a, b) => a - b).map((dayOfWeek) => {
                                        const dayOption = dayOptions.find(d => d.value === dayOfWeek);
                                        const schedules = getSchedulesForDay(dayOfWeek);
                                        const selectedSlotId = selectedSlotsByDay?.[dayOfWeek] || null;

                                        return (
                                             <div key={dayOfWeek} className="bg-white rounded-lg border border-teal-200 px-3 py-2">
                                                  <div className="flex items-center gap-2 mb-2">
                                                       <CalendarDays className="w-4 h-4 text-teal-600" />
                                                       <span className="font-semibold text-sm text-teal-800">{dayOption?.name || `Thứ ${dayOfWeek}`}</span>
                                                  </div>

                                                  {schedules.length === 0 ? (
                                                       <p className="text-sm text-gray-500 italic">Không có lịch trình cho {dayOption?.name}</p>
                                                  ) : (
                                                       <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                                                            {schedules.map((schedule) => {
                                                                 const scheduleSlotId = schedule.slotId || schedule.SlotId || schedule.slotID || schedule.SlotID;
                                                                 const scheduleId = schedule.scheduleId || schedule.ScheduleId || schedule.scheduleID || schedule.ScheduleID;
                                                                 const startTime = schedule.startTime || schedule.StartTime || "";
                                                                 const endTime = schedule.endTime || schedule.EndTime || "";
                                                                 const status = schedule.status || schedule.Status || "Available";
                                                                 const isSelected = String(selectedSlotId) === String(scheduleSlotId);
                                                                 const isAvailable = status === "Available";
                                                                 // Lấy giá từ bảng TimeSlots theo slotId (ưu tiên), không lấy giá trực tiếp từ schedule
                                                                 const price = (() => {
                                                                      if (Array.isArray(fieldTimeSlots) && fieldTimeSlots.length > 0) {
                                                                           const timeSlot = fieldTimeSlots.find(ts =>
                                                                                String(ts.slotId || ts.SlotId || ts.slotID || ts.SlotID) === String(scheduleSlotId)
                                                                           );
                                                                           if (timeSlot) {
                                                                                return timeSlot.price || timeSlot.Price || timeSlot.unitPrice || timeSlot.UnitPrice || 0;
                                                                           }
                                                                      }
                                                                      return 0;
                                                                 })();
                                                                 return (
                                                                      <Button
                                                                           key={scheduleId || scheduleSlotId}
                                                                           type="button"
                                                                           onClick={() => {
                                                                                if (isAvailable) {
                                                                                     onSlotSelect(dayOfWeek, isSelected ? null : scheduleSlotId);
                                                                                }
                                                                           }}
                                                                           disabled={!isAvailable}
                                                                           className={`text-xs py-3 px-4 rounded-lg transition-all relative ${isSelected
                                                                                ? "bg-teal-500 text-white border-teal-500 hover:bg-teal-600"
                                                                                : isAvailable
                                                                                     ? "bg-white text-gray-700 border border-teal-300 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-500"
                                                                                     : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                                                                                }`}
                                                                      >
                                                                           <div className="flex flex-col items-center gap-1 p-2">
                                                                                {!isAvailable && (
                                                                                     <span className="text-[10px] absolute -top-2.5 -right-1 text-red-500">Hết chỗ</span>
                                                                                )}
                                                                                <div className="flex items-center gap-1">
                                                                                     <Clock className="w-3 h-3" />
                                                                                     <span className="font-medium">{formatTimeRange(startTime, endTime)}</span>
                                                                                </div>
                                                                                {price > 0 && (
                                                                                     <span className={`text-xs font-semibold ${isSelected ? "text-yellow-400" : "text-orange-700"} flex items-center`}>
                                                                                          <DollarSign className="w-3 h-3" />
                                                                                          {price.toLocaleString("vi-VN")}₫
                                                                                     </span>
                                                                                )}

                                                                           </div>
                                                                      </Button>
                                                                 );
                                                            })}
                                                       </div>
                                                  )}
                                             </div>
                                        );
                                   })}
                              </div>
                         )}

                         {/* Tóm tắt */}
                         {totalSessions > 0 && (
                              <div className="bg-teal-100 rounded-lg p-3 gap-4 border border-teal-300">
                                   <div className="flex items-center gap-2 text-teal-800 mb-1">
                                        <CalendarDays className="w-4 h-4" />
                                        <span className="font-semibold">Tóm tắt:</span>
                                   </div>
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {/* Cột trái: Tổng số buổi và số buổi theo giá */}
                                        <div className="text-sm pl-3 space-y-0.5 text-teal-700">
                                             <p>Tổng số buổi: <span className="font-bold text-red-500">{totalSessions}</span> buổi đặt sân</p>
                                             {Object.keys(sessionsByPrice).length > 0 && (
                                                  <div className="space-y-0.5">
                                                       {Object.entries(sessionsByPrice)
                                                            .sort((a, b) => Number(b[0]) - Number(a[0])) // Sắp xếp theo giá giảm dần
                                                            .map(([price, count]) => (
                                                                 <p key={price} className="">
                                                                      <span className="font-semibold text-orange-600">{count}</span> buổi với giá{" "}
                                                                      <span className="font-semibold text-orange-600">{Number(price).toLocaleString("vi-VN")}₫</span>
                                                                 </p>
                                                            ))}
                                                  </div>
                                             )}
                                        </div>
                                        {/* Cột phải: Thông tin ngày và số ngày/tuần */}
                                        <div className="text-sm space-y-0.5 text-teal-700">
                                             {startDate && endDate && (
                                                  <p className="">
                                                       Từ <span className="font-semibold text-yellow-500">{new Date(startDate).toLocaleDateString("vi-VN")}</span> đến{" "}
                                                       <span className="font-semibold text-yellow-500">{new Date(endDate).toLocaleDateString("vi-VN")}</span>
                                                  </p>
                                             )}
                                             {selectedDays.length > 0 && (
                                                  <p className="">
                                                       {selectedDays.length} ngày/tuần: <span className="font-semibold text-blue-500">{selectedDays.map(d => dayOptions.find(o => o.value === d)?.label).join(", ")}</span>
                                                  </p>
                                             )}
                                        </div>
                                   </div>
                              </div>
                         )}
                    </div>
               )}
          </div>
     );
}