import { MapPin } from "lucide-react";

export default function FieldInfoSection({
     bookingData,
     isRecurring,
     recurringWeeks,
     selectedDays,
     generateRecurringSessions
}) {
     const dayNames = { 0: "CN", 1: "T2", 2: "T3", 3: "T4", 4: "T5", 5: "T6", 6: "T7" };

     return (
          <div className="bg-teal-50 rounded-lg p-4">
               <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-teal-600" />
                    Thông tin đặt sân
               </h3>
               <div className="space-y-3">
                    <div>
                         <h4 className="font-semibold text-lg text-teal-600 mb-2">{bookingData.fieldName}</h4>
                         <div className="flex items-center text-gray-600 mb-1">
                              <MapPin className="w-4 h-4 mr-2 text-teal-600" />
                              <span className="text-sm font-medium">{bookingData.fieldAddress}</span>
                         </div>
                         {bookingData.fieldType && (
                              <div className="text-sm text-gray-500 font-medium">
                                   <span className="font-medium">Loại:</span> {bookingData.fieldType}
                                   {bookingData.fieldSize && ` - ${bookingData.fieldSize}`}
                              </div>
                         )}
                    </div>
                    <div className="space-y-2 text-sm">
                         <div className="flex justify-between">
                              <span className="text-gray-600 flex items-center">
                                   <span className="mr-2">📅</span>
                                   Ngày
                              </span>
                              <span className="font-medium">{bookingData.date}</span>
                         </div>
                         {bookingData.slotName && (
                              <div className="flex justify-between">
                                   <span className="text-gray-600 flex items-center">
                                        <span className="mr-2">⏰</span>
                                        Thời gian
                                   </span>
                                   <span className="font-medium">{bookingData.slotName}</span>
                              </div>
                         )}
                         <div className="flex justify-between">
                              <span className="text-gray-600 flex items-center">
                                   <span className="mr-2">⏱️</span>
                                   Thời lượng
                              </span>
                              <span className="font-medium">{bookingData.duration} giờ</span>
                         </div>
                         {isRecurring && (
                              <div className="mt-3 p-3 bg-teal-100 rounded-lg">
                                   <div className="flex justify-between">
                                        <span className="text-gray-600 flex items-center">
                                             <span className="mr-2">📅</span>
                                             Số tuần
                                        </span>
                                        <span className="font-medium text-teal-600">{recurringWeeks} tuần</span>
                                   </div>
                                   {selectedDays.length > 0 && (
                                        <div className="flex justify-between">
                                             <span className="text-gray-600 flex items-center">
                                                  <span className="mr-2">🗓️</span>
                                                  Ngày trong tuần
                                             </span>
                                             <span className="font-medium text-teal-600">
                                                  {selectedDays.map(day => dayNames[day]).join(", ")}
                                             </span>
                                        </div>
                                   )}
                                   <div className="flex justify-between">
                                        <span className="text-gray-600 flex items-center">
                                             <span className="mr-2">🎯</span>
                                             Tổng số buổi
                                        </span>
                                        <span className="font-medium text-teal-600">{bookingData.totalSessions || (recurringWeeks * selectedDays.length)} buổi</span>
                                   </div>
                                   {/* Preview danh sách buổi */}
                                   <div className="mt-3 bg-white/70 rounded-lg p-2 border border-teal-200">
                                        <div className="text-xs text-gray-600 font-semibold mb-1">Lịch các buổi dự kiến</div>
                                        <div className="overflow-y-auto max-h-24 scrollbar-thin scrollbar-thumb-teal-200 scrollbar-track-white space-y-1 text-xs">
                                             {generateRecurringSessions().map((s, idx) => (
                                                  <div key={idx} className="flex justify-between">
                                                       <span>{s.date.toLocaleDateString('vi-VN')}</span>
                                                       <span className="text-teal-700">{s.slotName}</span>
                                                  </div>
                                             ))}
                                             {generateRecurringSessions().length === 0 && (
                                                  <div className="text-gray-500">Chọn ngày trong tuần để xem danh sách buổi</div>
                                             )}
                                        </div>
                                   </div>
                              </div>
                         )}
                    </div>
               </div>
          </div>
     );
}

