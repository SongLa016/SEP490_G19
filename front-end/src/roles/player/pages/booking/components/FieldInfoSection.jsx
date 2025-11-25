import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { fetchFieldTypes, normalizeFieldType } from "../../../../../shared/services/fieldTypes";

export default function FieldInfoSection({
     bookingData,
     isRecurring,
     recurringWeeks,
     selectedDays,
     generateRecurringSessions
}) {
     const dayNames = { 0: "CN", 1: "T2", 2: "T3", 3: "T4", 4: "T5", 5: "T6", 6: "T7" };
     const [fieldTypeMap, setFieldTypeMap] = useState({});

     // Load field types để map typeId -> typeName
     useEffect(() => {
          let ignore = false;
          async function loadFieldTypes() {
               try {
                    const result = await fetchFieldTypes();
                    if (ignore) return;
                    const rawList = (() => {
                         if (!result || !result.success) return [];
                         if (Array.isArray(result.data)) return result.data;
                         if (result.data && Array.isArray(result.data.data)) return result.data.data;
                         if (result.data && Array.isArray(result.data.value)) return result.data.value;
                         return [];
                    })();
                    if (rawList.length > 0) {
                         const map = rawList.reduce((acc, raw) => {
                              const normalized = normalizeFieldType(raw);
                              if (normalized?.typeId) {
                                   acc[String(normalized.typeId)] = normalized.typeName || "";
                              }
                              return acc;
                         }, {});
                         setFieldTypeMap(map);
                    }
               } catch (err) {
                    console.warn("Unable to load field types:", err);
               }
          }
          loadFieldTypes();
          return () => { ignore = true; };
     }, []);

     // Lấy tên loại sân từ typeId hoặc sử dụng fieldType có sẵn
     const getFieldTypeName = () => {
          // Nếu đã có fieldType (tên), ưu tiên sử dụng
          if (bookingData?.fieldType) {
               return bookingData.fieldType;
          }
          // Nếu có typeId, map từ fieldTypeMap
          const typeId = bookingData?.typeId || bookingData?.TypeID || bookingData?.typeID;
          if (typeId && fieldTypeMap[String(typeId)]) {
               return fieldTypeMap[String(typeId)];
          }
          return null;
     };

     const fieldTypeName = getFieldTypeName();

     // Tính thời lượng theo cách TimeSlotsTab.jsx
     const calculateDuration = () => {
          const durationValue = bookingData?.duration;
          if (durationValue != null && durationValue !== "") {
               const normalized = Number(durationValue);
               if (!Number.isNaN(normalized) && normalized > 0) {
                    return normalized;
               }
          }

          const startTimeStr = bookingData?.startTime || bookingData?.StartTime || '00:00:00';
          const endTimeStr = bookingData?.endTime || bookingData?.EndTime || '00:00:00';

          try {
               // Tạo Date objects với ngày giả định, giống TimeSlotsTab
               const start = new Date(`2000-01-01T${startTimeStr}`);
               const end = new Date(`2000-01-01T${endTimeStr}`);

               // Tính duration bằng giờ (giống TimeSlotsTab: (end - start) / (1000 * 60 * 60))
               const durationHours = (end - start) / (1000 * 60 * 60);

               if (!Number.isNaN(durationHours) && durationHours > 0) {
                    return durationHours;
               }
          } catch (error) {
               console.warn("Error calculating duration from startTime/endTime:", error);
          }

          return null;
     };

     // Format duration để hiển thị (ví dụ: 1.5h -> "1h30 phút", 2h -> "2h")
     const formatDuration = (hours) => {
          if (hours == null || Number.isNaN(hours)) {
               return "—";
          }

          const totalHours = Math.floor(hours);
          const minutes = Math.round((hours - totalHours) * 60);

          if (totalHours > 0 && minutes > 0) {
               return `${totalHours}h${String(minutes).padStart(2, "0")} phút`;
          }
          if (totalHours > 0) {
               return `${totalHours}h`;
          }
          if (minutes > 0) {
               return `${minutes} phút`;
          }
          return "—";
     };

     const durationHours = calculateDuration();
     const durationLabel = formatDuration(durationHours);

     return (
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4">
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
                         {fieldTypeName && (
                              <div className="text-sm text-gray-500 font-medium">
                                   <span className="font-medium">Loại:</span> {fieldTypeName}
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
                              <span className="font-medium">{durationLabel}</span>
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


