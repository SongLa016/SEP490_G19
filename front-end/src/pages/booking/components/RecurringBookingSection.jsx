import { Repeat, CalendarDays } from "lucide-react";
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui";

export default function RecurringBookingSection({
     isRecurring,
     setIsRecurring,
     recurringWeeks,
     setRecurringWeeks,
     selectedDays,
     handleDayToggle,
     suggestedDays,
     isSuggesting,
     onBookingDataChange,
     generateRecurringSessions
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

     const suggestedDayOptions = [
          { value: 1, label: "T2" },
          { value: 2, label: "T3" },
          { value: 3, label: "T4" },
          { value: 4, label: "T5" },
          { value: 5, label: "T6" },
          { value: 6, label: "T7" },
          { value: 0, label: "CN" }
     ];

     return (
          <div className="bg-teal-50 rounded-lg p-4">
               <div className="flex items-center justify-between mb-3">
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
                    <div className="space-y-3">
                         <div>
                              <label className="block text_sm font-medium text-gray-700 mb-2">
                                   Số tuần đặt lịch
                              </label>
                              <Select
                                   value={recurringWeeks.toString()}
                                   onValueChange={(value) => {
                                        const weeks = parseInt(value);
                                        setRecurringWeeks(weeks);
                                        onBookingDataChange("recurringWeeks", weeks);
                                   }}
                              >
                                   <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Chọn số tuần" />
                                   </SelectTrigger>
                                   <SelectContent>
                                        <SelectItem value="4">4 tuần</SelectItem>
                                        <SelectItem value="8">8 tuần</SelectItem>
                                        <SelectItem value="12">12 tuần</SelectItem>
                                        <SelectItem value="16">16 tuần</SelectItem>
                                        <SelectItem value="20">20 tuần</SelectItem>
                                   </SelectContent>
                              </Select>
                         </div>

                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                   Chọn ngày trong tuần
                              </label>
                              <div className="grid grid-cols-7 gap-2">
                                   {dayOptions.map((day) => (
                                        <Button
                                             key={day.value}
                                             type="button"
                                             onClick={() => handleDayToggle(day.value)}
                                             variant={selectedDays.includes(day.value) ? "default" : "outline"}
                                             size="sm"
                                             className={`p-2 text-sm font-medium ${selectedDays.includes(day.value)
                                                  ? "bg-teal-500 text-white border-teal-500 hover:bg-teal-600"
                                                  : "bg-white text-gray-700 hover:text-teal-500 hover:bg-teal-50 border-teal-300"
                                                  }`}
                                             title={day.name}
                                        >
                                             {day.label}
                                        </Button>
                                   ))}
                              </div>
                              {selectedDays.length === 0 && (
                                   <p className="text-red-500 text-sm mt-1">Vui lòng chọn ít nhất một ngày</p>
                              )}
                              {/* Suggestions for other days */}
                              {isRecurring && suggestedDays.length > 0 && (
                                   <div className="mt-3">
                                        <div className="text-xs text-gray-600 mb-1">Gợi ý ngày khác (phù hợp):</div>
                                        <div className="flex flex-wrap gap-2">
                                             {suggestedDayOptions
                                                  .filter(d => suggestedDays.includes(d.value))
                                                  .map(d => (
                                                       <Button
                                                            key={d.value}
                                                            type="button"
                                                            onClick={() => handleDayToggle(d.value)}
                                                            className="px-2 py-1 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                                       >
                                                            + {d.label}
                                                       </Button>
                                                  ))}
                                        </div>
                                   </div>
                              )}
                              {isRecurring && isSuggesting && (
                                   <div className="mt-2 text-xs text-gray-500">Đang gợi ý ngày phù hợp…</div>
                              )}
                         </div>

                         <div className="text-sm text-teal-700">
                              <CalendarDays className="w-4 h-4 inline mr-1" />
                              Sẽ tạo {recurringWeeks * selectedDays.length} đặt sân cho {recurringWeeks} tuần liên tiếp
                              {selectedDays.length > 0 && (
                                   <span className="block mt-1">
                                        ({selectedDays.length} ngày/tuần × {recurringWeeks} tuần = {recurringWeeks * selectedDays.length} buổi)
                                   </span>
                              )}
                         </div>

                         {isRecurring && selectedDays.length > 0 && recurringWeeks > 0 && typeof generateRecurringSessions === "function" && (
                              (() => {
                                   const sessions = generateRecurringSessions() || [];
                                   if (sessions.length === 0) return null;
                                   const first = sessions[0]?.date;
                                   const last = sessions[sessions.length - 1]?.date;
                                   const fmt = (d) => {
                                        try {
                                             const date = d instanceof Date ? d : new Date(d);
                                             return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
                                        } catch {
                                             return "--/--/----";
                                        }
                                   };
                                   return (
                                        <div className="mt-2 text-sm text-teal-800">
                                             Khoảng thời gian: từ <span className="font-semibold">{fmt(first)}</span> đến <span className="font-semibold">{fmt(last)}</span>
                                        </div>
                                   );
                              })()
                         )}
                    </div>
               )}
          </div>
     );
}


