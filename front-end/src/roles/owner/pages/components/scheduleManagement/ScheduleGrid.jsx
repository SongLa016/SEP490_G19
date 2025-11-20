import React from "react";
import { Card, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../../../../../shared/components/ui";
import { Clock, Plus, Wrench } from "lucide-react";
import Swal from "sweetalert2";

export default function ScheduleGrid({
     timeSlots,
     selectedDate,
     fieldSchedules,
     fields,
     selectedFieldForSchedule,
     filterStatus,
     isSlotTimePassed,
     getSchedulesForTimeSlot,
     getFieldColor,
     formatTime,
     getBookingInfo,
     isFieldMaintenance,
     onRequestAddSchedule
}) {
     const isToday = (date) => {
          const today = new Date();
          return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
     };

     const getDayName = (date) => {
          const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
          return days[date.getDay()];
     };

     // Determine which fields to display
     const displayFields = selectedFieldForSchedule === 'all'
          ? fields
          : fields.filter(f => f.fieldId.toString() === selectedFieldForSchedule);

     const renderScheduleCell = (schedule, field, slot, fieldMaintenance = false) => {
          const status = schedule.status || schedule.Status || 'Available';
          const normalizedStatus = fieldMaintenance ? 'Maintenance' : status;
          const statusLower = normalizedStatus.toLowerCase();
          const booked = statusLower === 'booked';
          const available = statusLower === 'available';
          const maintenance = statusLower === 'maintenance';
          const fieldColor = getFieldColor(field.fieldId);
          const baseColorClasses = maintenance
               ? 'bg-gradient-to-br from-orange-100 via-amber-100 to-orange-100 text-orange-900 border border-orange-200'
               : `${fieldColor} text-white`;

          return (
               <div
                    className={`${baseColorClasses} p-3 rounded-xl w-full text-sm font-medium cursor-pointer hover:opacity-90 hover:shadow-lg transition-all shadow-md`}
                    onClick={(e) => {
                         e.stopPropagation();
                         const bookingInfo = getBookingInfo(Number(field.fieldId), selectedDate, slot.slotId || slot.SlotID);

                         let statusIcon = '📋';
                         let statusBadge = '';

                         if (booked) {
                              statusIcon = '✅';
                              statusBadge = '<span class="inline-block px-3 bg-green-100 text-green-800 rounded-full text-sm font-semibold">Đã đặt</span>';
                         } else if (maintenance) {
                              statusIcon = '🔧';
                              statusBadge = '<span class="inline-block px-3 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">Bảo trì</span>';
                         } else if (available) {
                              statusIcon = '⭕';
                              statusBadge = '<span class="inline-block px-3  bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">Trống</span>';
                         }

                         Swal.fire({
                              title: `${statusIcon} Thông tin lịch trình`,
                              html: `
                                   <div class="text-left space-y-2">
                                        <div class="text-center">
                                             ${statusBadge}
                                        </div>
                                        <div class="bg-blue-50  px-4 py-1 rounded-2xl border border-blue-200">
                                             <p class="text-sm text-gray-600 mb-1"><strong class="text-gray-800">Sân:</strong></p>
                                             <p class="text-base font-semibold text-blue-900">${field.name}</p>
                                        </div>
                                        <div class="bg-teal-50 px-4 py-1 rounded-2xl border border-teal-200">
                                             <p class="text-sm text-gray-600 mb-1"><strong class="text-gray-800">Khung giờ:</strong></p>
                                             <p class="text-base font-semibold text-teal-900">${slot.SlotName || slot.slotName || slot.name || 'N/A'}</p>
                                             <p class="text-xs text-gray-600 mt-1">⏰ ${formatTime(slot.StartTime || slot.startTime)} - ${formatTime(slot.EndTime || slot.endTime)}</p>
                                        </div>
                                        <div class="bg-gray-50 px-4 py-1 rounded-2xl border border-gray-200">
                                             <p class="text-sm text-gray-600 mb-1"><strong class="text-gray-800">Ngày:</strong></p>
                                             <p class="text-base font-semibold text-gray-900">📅 ${selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                        </div>
                                        ${booked && bookingInfo ? `
                                        <div class="bg-green-50 px-4 rounded-2xl border border-green-200">
                                             <p class="text-sm text-gray-600 mb-1"><strong class="text-gray-800">Thông tin khách hàng:</strong></p>
                                             <p class="text-base font-semibold text-green-900">👤 ${bookingInfo.customerName}</p>
                                             <p class="text-xs text-gray-600 mt-1">📞 ${bookingInfo.customerPhone}</p>
                                        </div>
                                        ` : ''}
                                   </div>
                              `,
                              icon: 'info',
                              confirmButtonColor: '#0d9488',
                              confirmButtonText: 'Đóng',
                              width: '550px'
                         });
                    }}
               >
                    <div className="flex items-center justify-center">
                         <Clock className="w-4 h-4 mr-1 opacity-90" />
                         <div className="font-bold text-sm line-clamp-1 truncate">{field.name}</div>
                    </div>
                    <div className="text-xs opacity-90 flex items-center gap-1 justify-center mt-1">
                         {booked && <span>✅ Đã đặt</span>}
                         {maintenance && <span>🔧 Bảo trì</span>}
                         {available && <span>⭕ Trống</span>}
                    </div>
               </div>
          );
     };

     return (
          <Card className="p-2 shadow-lg bg-white rounded-2xl border-2 border-teal-100">
               <div className="relative">
                    <div className="overflow-x-auto overflow-y-visible rounded-2xl">
                         <Table className="w-full border-collapse">
                              <TableHeader>
                                   <TableRow className="border-none">
                                        <TableHead className="sticky left-0 z-20 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 p-3 text-left font-bold text-gray-800 min-w-[100px] shadow-lg backdrop-blur-sm">
                                             <div className="flex items-center text-teal-600 gap-2">
                                                  <Clock className="w-5 h-5" />
                                                  <span className="text-sm">Khung giờ</span>
                                             </div>
                                        </TableHead>
                                        {displayFields.map((field) => {
                                             const fieldMaintenance = isFieldMaintenance?.(field.fieldId);
                                             return (
                                                  <TableHead
                                                       key={field.fieldId}
                                                       className={`px-3 text-center font-semibold min-w-[180px] transition-all duration-200 ${isToday(selectedDate)
                                                            ? 'bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700 text-white shadow-xl'
                                                            : selectedDate.getDay() === 0 || selectedDate.getDay() === 6
                                                                 ? 'bg-gradient-to-br from-orange-100 to-amber-100 text-gray-800 border-orange-300'
                                                                 : 'bg-gradient-to-br from-blue-50 to-indigo-50 text-gray-800 border-blue-200'
                                                            }`}
                                                  >
                                                       <div className="flex flex-col items-center gap-1">
                                                            <div className="flex items-center gap-1">
                                                                 <div className={`w-4 h-4 border border-gray-300 rounded ${getFieldColor(field.fieldId)}`}></div>
                                                                 <div className={`text-sm font-bold line-clamp-1 ${isToday(selectedDate) ? 'text-white' : 'text-gray-900'}`}>
                                                                      <span className="truncate">{field.name}</span>
                                                                 </div>
                                                            </div>
                                                            <div className={`text-xs font-semibold ${isToday(selectedDate) ? 'text-teal-100' : 'text-gray-600'}`}>
                                                                 {getDayName(selectedDate)} - {selectedDate.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long' })}
                                                            </div>
                                                            {fieldMaintenance && (
                                                                 <span className="bg-orange-100 text-orange-700 text-[10px] border border-orange-200 px-2 py-0.5 font-semibold rounded-full">
                                                                      Bảo trì
                                                                 </span>
                                                            )}
                                                            {isToday(selectedDate) && (
                                                                 <span className="bg-teal-50 text-teal-600 text-[9px] border px-2 py-0.5s font-semibold  rounded-full">
                                                                      Hôm nay
                                                                 </span>
                                                            )}
                                                       </div>
                                                  </TableHead>
                                             );
                                        })}
                                   </TableRow>
                              </TableHeader>
                              <TableBody>
                                   {timeSlots.length === 0 ? (
                                        <TableRow>
                                             <TableCell colSpan={displayFields.length + 1} className="border-2 border-gray-300 p-16 text-center">
                                                  <div className="flex flex-col items-center gap-2">
                                                       <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full">
                                                            <Clock className="w-10 h-10 text-gray-400" />
                                                       </div>
                                                       <div>
                                                            <p className="text-lg font-bold text-gray-700 mb-1">Chưa có khung giờ</p>
                                                            <p className="text-sm text-gray-500">Vui lòng thêm khung giờ để quản lý lịch trình</p>
                                                       </div>
                                                  </div>
                                             </TableCell>
                                        </TableRow>
                                   ) : (
                                        timeSlots
                                             .filter(slot => {
                                                  if (selectedFieldForSchedule === 'all') {
                                                       return true;
                                                  }
                                                  const slotFieldId = slot.fieldId ?? slot.FieldId;
                                                  return slotFieldId && Number(slotFieldId) === Number(selectedFieldForSchedule);
                                             })
                                             .map((slot, slotIndex) => {
                                                  const slotKey = slot.timeKey || slot.slotId || slot.SlotID || `${slot.startTime || slot.StartTime}-${slot.endTime || slot.EndTime}-${slotIndex}`;
                                                  const isPastSlot = isSlotTimePassed(selectedDate, slot);
                                                  const schedulesCache = new Map();
                                                  const getCachedSchedules = (slotId) => {
                                                       if (!slotId) return [];
                                                       if (!schedulesCache.has(slotId)) {
                                                            schedulesCache.set(slotId, getSchedulesForTimeSlot(slotId, selectedDate));
                                                       }
                                                       return schedulesCache.get(slotId);
                                                  };

                                                  return (
                                                       <TableRow key={slotKey} className={`group transition-colors ${slotIndex % 2 === 0 ? 'bg-gray-50/30' : 'bg-white'} hover:bg-teal-50/50 border-none`}>
                                                            <TableCell className="sticky left-0 z-10 border-2 border-gray-300 p-3 text-sm bg-white shadow-lg backdrop-blur-sm font-medium text-gray-700">
                                                                 <div className="flex items-center gap-1">
                                                                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-teal-500 via-teal-600 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                                           {(slot.SlotName || slot.slotName || slot.name || '').replace('Slot ', '')}
                                                                      </div>
                                                                      <div className="flex flex-col gap-1">
                                                                           <span className="font-semibold text-base">{formatTime(slot.StartTime || slot.startTime)}</span>
                                                                           <span className="text-xs text-gray-500">- {formatTime(slot.EndTime || slot.endTime)}</span>
                                                                      </div>
                                                                 </div>
                                                            </TableCell>
                                                            {displayFields.map((field) => {
                                                                 const fieldMaintenance = isFieldMaintenance?.(field.fieldId);
                                                                 const slotIdForField = slot.slotIdsByField
                                                                      ? slot.slotIdsByField[field.fieldId]
                                                                      : (slot.slotId || slot.SlotID);

                                                                 if (!slotIdForField) {
                                                                      return (
                                                                           <TableCell
                                                                                key={`${field.fieldId}-no-slot`}
                                                                                className={`border-2 p-3 text-center text-xs italic text-gray-400 relative min-h-[120px] ${isToday(selectedDate) ? 'bg-teal-50/20' : 'bg-white'}`}
                                                                           >
                                                                                Không có khung giờ
                                                                           </TableCell>
                                                                      );
                                                                 }

                                                                 // Get schedule for this specific field and slot
                                                                 const fieldSchedule = getCachedSchedules(slotIdForField).find(s => {
                                                                      const scheduleFieldId = s.fieldId ?? s.FieldId ?? s.fieldID ?? s.FieldID;
                                                                      return Number(scheduleFieldId) === Number(field.fieldId);
                                                                 });

                                                                 // Apply status filter
                                                                 const shouldShow = fieldMaintenance || !fieldSchedule || (() => {
                                                                      const status = fieldSchedule.status || fieldSchedule.Status || 'Available';
                                                                      const normalizedStatus = fieldMaintenance ? 'Maintenance' : status;
                                                                      const statusLower = normalizedStatus.toLowerCase();
                                                                      const booked = statusLower === 'booked';
                                                                      const available = statusLower === 'available';
                                                                      return filterStatus === 'all' ||
                                                                           (filterStatus === 'booked' && booked) ||
                                                                           (filterStatus === 'available' && available);
                                                                 })();

                                                                 if (!shouldShow) {
                                                                      return (
                                                                           <TableCell
                                                                                key={field.fieldId}
                                                                                className={`border-2 p-3 text-center text-sm relative min-h-[120px] ${isToday(selectedDate) ? 'bg-teal-50/20' : 'bg-white'}`}
                                                                           >
                                                                                <span className="text-gray-400 text-xs">Đã lọc</span>
                                                                           </TableCell>
                                                                      );
                                                                 }

                                                                 return (
                                                                      <TableCell
                                                                           key={field.fieldId}
                                                                           className={`border-2 p-3 text-center text-sm relative min-h-[120px] ${fieldMaintenance
                                                                                ? 'bg-orange-50/70 border-orange-200'
                                                                                : isToday(selectedDate)
                                                                                     ? 'bg-teal-50/20'
                                                                                     : selectedDate.getDay() === 0 || selectedDate.getDay() === 6
                                                                                          ? 'bg-orange-50/20'
                                                                                          : 'bg-white'
                                                                                } ${isPastSlot ? 'opacity-60' : ''}`}
                                                                           onClick={() => {
                                                                                if (isPastSlot || fieldSchedule || fieldMaintenance) return;
                                                                                onRequestAddSchedule?.(field.fieldId, slotIdForField, selectedDate);
                                                                           }}
                                                                      >
                                                                           {!fieldSchedule ? (
                                                                                fieldMaintenance ? (
                                                                                     <div className="flex flex-col items-center justify-center h-full min-h-[100px] text-orange-600 text-sm font-semibold">
                                                                                          <Wrench className="w-6 h-6 mb-1" />
                                                                                          <span>Đang bảo trì</span>
                                                                                     </div>
                                                                                ) : (
                                                                                     !isPastSlot && (
                                                                                          <div className="flex items-center justify-center h-full min-h-[100px] text-gray-400 text-sm cursor-pointer hover:text-teal-600 transition-colors group">
                                                                                               <div className="flex flex-col items-center gap-2">
                                                                                                    <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center group-hover:border-teal-400 group-hover:bg-teal-50 transition-all">
                                                                                                         <Plus className="w-7 h-7" />
                                                                                                    </div>
                                                                                                    <span className="text-xs font-medium">Thêm lịch trình</span>
                                                                                               </div>
                                                                                          </div>
                                                                                     )
                                                                                )
                                                                           ) : (
                                                                                renderScheduleCell(fieldSchedule, field, slot, fieldMaintenance)
                                                                           )}
                                                                      </TableCell>
                                                                 );
                                                            })}
                                                       </TableRow>
                                                  );
                                             })
                                   )}
                              </TableBody>
                         </Table>
                    </div>
               </div>
          </Card>
     );
}
