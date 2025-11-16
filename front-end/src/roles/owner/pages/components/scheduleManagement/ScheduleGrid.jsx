import React from "react";
import { Card, Badge, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../../../../../shared/components/ui";
import { Clock, Plus } from "lucide-react";
import Swal from "sweetalert2";
import { createFieldSchedule } from "../../../../../shared/services/fieldSchedules";

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
     onScheduleAdded
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

     const handleAddSchedule = async (slotId, date) => {
          Swal.fire({
               icon: 'question',
               title: 'Thêm lịch trình',
               html: `
                    <div class="text-left space-y-3 mt-4">
                         <p class="text-sm text-gray-600">Chọn sân để thêm lịch trình:</p>
                         <div class="space-y-2">
                              ${fields.filter(f => selectedFieldForSchedule === 'all' || f.fieldId.toString() === selectedFieldForSchedule).map(field => `
                              <button 
                                   class="w-full text-left p-3 border-2 border-gray-200 rounded-lg hover:border-teal-400 hover:bg-teal-50 transition-all field-option-btn"
                                   data-field-id="${field.fieldId}"
                                   data-slot-id="${slotId}"
                                   data-date="${date.toISOString().split('T')[0]}"
                              >
                                   <div class="flex items-center gap-2">
                                        <div class="w-4 h-4 rounded ${getFieldColor(field.fieldId)}"></div>
                                        <span class="font-semibold">${field.name}</span>
                                   </div>
                              </button>
                              `).join('')}
                         </div>
                    </div>
               `,
               showCancelButton: true,
               confirmButtonText: 'Hủy',
               confirmButtonColor: '#6b7280',
               didOpen: () => {
                    document.querySelectorAll('.field-option-btn').forEach(btn => {
                         btn.addEventListener('click', async (e) => {
                              const fieldId = e.currentTarget.dataset.fieldId;
                              const slotId = e.currentTarget.dataset.slotId;
                              const dateStr = e.currentTarget.dataset.date;

                              Swal.close();

                              try {
                                   const result = await createFieldSchedule({
                                        fieldId: Number(fieldId),
                                        slotId: Number(slotId),
                                        date: dateStr,
                                        status: 'Available'
                                   });

                                   if (result.success) {
                                        Swal.fire({
                                             icon: 'success',
                                             title: 'Thành công',
                                             text: 'Đã thêm lịch trình thành công!',
                                             confirmButtonColor: '#0d9488',
                                             timer: 1500
                                        });
                                        onScheduleAdded();
                                   } else {
                                        Swal.fire({
                                             icon: 'error',
                                             title: 'Lỗi',
                                             text: result.error || 'Không thể thêm lịch trình',
                                             confirmButtonColor: '#ef4444'
                                        });
                                   }
                              } catch (error) {
                                   Swal.fire({
                                        icon: 'error',
                                        title: 'Lỗi',
                                        text: error.message || 'Có lỗi xảy ra',
                                        confirmButtonColor: '#ef4444'
                                   });
                              }
                         });
                    });
               }
          });
     };

     return (
          <Card className="p-2 shadow-lg bg-white rounded-2xl border-2 border-teal-100">
               <div className="relative">
                    <div className="overflow-x-auto overflow-y-visible rounded-2xl">
                         <Table className="w-full border-collapse">
                              <TableHeader>
                                   <TableRow className="border-none">
                                        <TableHead className="sticky left-0 z-20 border-2 border-gray-300 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 p-4 text-left font-bold text-gray-800 min-w-[140px] shadow-lg backdrop-blur-sm">
                                             <div className="flex items-center gap-2">
                                                  <div className="p-2 bg-teal-100 rounded-lg">
                                                       <Clock className="w-5 h-5 text-teal-700" />
                                                  </div>
                                                  <span className="text-base">Khung giờ</span>
                                             </div>
                                        </TableHead>
                                        <TableHead className={`border-2 p-4 text-center font-bold min-w-[200px] transition-all duration-200 ${isToday(selectedDate)
                                             ? 'bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700 text-white border-teal-800 shadow-xl'
                                             : selectedDate.getDay() === 0 || selectedDate.getDay() === 6
                                                  ? 'bg-gradient-to-br from-orange-100 to-amber-100 text-gray-800 border-orange-300'
                                                  : 'bg-gradient-to-br from-blue-50 to-indigo-50 text-gray-800 border-blue-200'
                                             }`}>
                                             <div className="flex items-center gap-2">
                                                  <div className={`text-lg font-bold ${isToday(selectedDate) ? 'text-white' : 'text-gray-900'}`}>
                                                       {getDayName(selectedDate)}
                                                  </div>
                                                  <div className={`text-base font-semibold ${isToday(selectedDate) ? 'text-teal-100' : 'text-gray-700'}`}>
                                                       {selectedDate.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                  </div>
                                                  {isToday(selectedDate) && (
                                                       <p className="bg-teal-600 text-white text-[10px] font-semibold py-0.5 px-2 rounded-full">
                                                            Hôm nay
                                                       </p>
                                                  )}
                                                  {(selectedDate.getDay() === 0 || selectedDate.getDay() === 6) && !isToday(selectedDate) && (
                                                       <p className="bg-orange-200 text-orange-800 text-[10px] font-semibold py-0.5 px-2 rounded-full">
                                                            Cuối tuần
                                                       </p>
                                                  )}
                                             </div>
                                        </TableHead>
                                   </TableRow>
                              </TableHeader>
                              <TableBody>
                                   {timeSlots.length === 0 ? (
                                        <TableRow>
                                             <TableCell colSpan={2} className="border-2 border-gray-300 p-16 text-center">
                                                  <div className="flex flex-col items-center gap-4">
                                                       <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full">
                                                            <Clock className="w-16 h-16 text-gray-400" />
                                                       </div>
                                                       <div>
                                                            <p className="text-xl font-bold text-gray-700 mb-1">Chưa có khung giờ</p>
                                                            <p className="text-sm text-gray-500">Vui lòng thêm khung giờ để quản lý lịch trình</p>
                                                       </div>
                                                  </div>
                                             </TableCell>
                                        </TableRow>
                                   ) : (
                                        timeSlots.map((slot, slotIndex) => {
                                             const slotId = slot.slotId || slot.SlotID;
                                             const isPastSlot = isSlotTimePassed(selectedDate, slot);
                                             const schedules = getSchedulesForTimeSlot(slotId, selectedDate);

                                             // Filter schedules by selected field if needed
                                             const filteredSchedules = selectedFieldForSchedule === 'all'
                                                  ? schedules
                                                  : schedules.filter(s => {
                                                       const scheduleFieldId = s.fieldId ?? s.FieldId ?? s.fieldID ?? s.FieldID;
                                                       return Number(scheduleFieldId) === Number(selectedFieldForSchedule);
                                                  });

                                             // Apply status filter
                                             const visibleSchedules = filteredSchedules.filter(s => {
                                                  const status = s.status || s.Status || 'Available';
                                                  const booked = status === 'Booked' || status === 'booked';
                                                  const available = status === 'Available' || status === 'available';
                                                  return filterStatus === 'all' ||
                                                       (filterStatus === 'booked' && booked) ||
                                                       (filterStatus === 'available' && available);
                                             });

                                             return (
                                                  <TableRow key={slotId} className={`group transition-colors ${slotIndex % 2 === 0 ? 'bg-gray-50/30' : 'bg-white'} hover:bg-teal-50/50 border-none`}>
                                                       <TableCell className="sticky left-0 z-10 border-2 border-gray-300 p-4 text-sm bg-white shadow-lg backdrop-blur-sm font-medium text-gray-700">
                                                            <div className="flex items-center gap-3">
                                                                 <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-teal-500 via-teal-600 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                                      {(slot.SlotName || slot.slotName || slot.name || '').replace('Slot ', '')}
                                                                 </div>
                                                                 <div className="flex flex-col gap-1">
                                                                      <span className="font-semibold text-base">{formatTime(slot.StartTime || slot.startTime)}</span>
                                                                      <span className="text-xs text-gray-500">- {formatTime(slot.EndTime || slot.endTime)}</span>
                                                                 </div>
                                                            </div>
                                                       </TableCell>
                                                       <TableCell
                                                            className={`border-2 p-4 text-left text-sm relative min-h-[120px] ${isToday(selectedDate) ? 'bg-teal-50/20' : selectedDate.getDay() === 0 || selectedDate.getDay() === 6 ? 'bg-orange-50/20' : 'bg-white'
                                                                 } ${isPastSlot ? 'opacity-60' : ''}`}
                                                            onClick={() => {
                                                                 if (isPastSlot) return;
                                                                 handleAddSchedule(slotId, selectedDate);
                                                            }}
                                                       >
                                                            {visibleSchedules.length === 0 ? (
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
                                                            ) : (
                                                                 <div className="space-y-2.5">
                                                                      {visibleSchedules.map((schedule, idx) => {
                                                                           const scheduleFieldId = schedule.fieldId ?? schedule.FieldId ?? schedule.fieldID ?? schedule.FieldID;
                                                                           const field = fields.find(f => f.fieldId === Number(scheduleFieldId));
                                                                           const status = schedule.status || schedule.Status || 'Available';
                                                                           const booked = status === 'Booked' || status === 'booked';
                                                                           const available = status === 'Available' || status === 'available';
                                                                           const maintenance = status === 'Maintenance' || status === 'maintenance';
                                                                           const fieldColor = field ? getFieldColor(field.fieldId) : 'bg-gray-500';

                                                                           return (
                                                                                <div
                                                                                     key={idx}
                                                                                     className={`${fieldColor} text-white p-3.5 rounded-lg text-sm font-medium cursor-pointer hover:opacity-90 hover:shadow-lg transition-all shadow-md`}
                                                                                     onClick={(e) => {
                                                                                          e.stopPropagation();
                                                                                          if (booked) {
                                                                                               const bookingInfo = getBookingInfo(Number(scheduleFieldId), selectedDate, slotId);
                                                                                               Swal.fire({
                                                                                                    title: '📋 Thông tin đặt sân',
                                                                                                    html: `
                                                                                                         <div class="text-left space-y-3 mt-4">
                                                                                                              <div class="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                                                                                                   <p class="text-sm text-gray-600 mb-1"><strong class="text-gray-800">Sân:</strong></p>
                                                                                                                   <p class="text-base font-semibold text-blue-900">${field?.name || 'N/A'}</p>
                                                                                                              </div>
                                                                                                              <div class="bg-teal-50 p-3 rounded-lg border border-teal-200">
                                                                                                                   <p class="text-sm text-gray-600 mb-1"><strong class="text-gray-800">Slot:</strong></p>
                                                                                                                   <p class="text-base font-semibold text-teal-900">${slot.SlotName || slot.slotName || slot.name || 'N/A'}</p>
                                                                                                                   <p class="text-xs text-gray-600 mt-1">${formatTime(slot.StartTime || slot.startTime)} - ${formatTime(slot.EndTime || slot.endTime)}</p>
                                                                                                              </div>
                                                                                                              <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                                                                                   <p class="text-sm text-gray-600 mb-1"><strong class="text-gray-800">Ngày:</strong></p>
                                                                                                                   <p class="text-base font-semibold text-gray-900">${selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                                                                                              </div>
                                                                                                              ${bookingInfo ? `
                                                                                                              <div class="bg-green-50 p-3 rounded-lg border border-green-200">
                                                                                                                   <p class="text-sm text-gray-600 mb-1"><strong class="text-gray-800">Khách hàng:</strong></p>
                                                                                                                   <p class="text-base font-semibold text-green-900">${bookingInfo.customerName}</p>
                                                                                                                   <p class="text-xs text-gray-600 mt-1">📞 ${bookingInfo.customerPhone}</p>
                                                                                                              </div>
                                                                                                              ` : ''}
                                                                                                         </div>
                                                                                                    `,
                                                                                                    icon: 'info',
                                                                                                    confirmButtonColor: '#0d9488',
                                                                                                    confirmButtonText: 'Đóng',
                                                                                                    width: '500px'
                                                                                               });
                                                                                          }
                                                                                     }}
                                                                                >
                                                                                     <div className="flex items-center gap-2 mb-1.5">
                                                                                          <Clock className="w-3.5 h-3.5 opacity-90" />
                                                                                          <div className="font-bold text-base truncate">{field?.name || 'N/A'}</div>
                                                                                     </div>
                                                                                     <div className="text-xs opacity-90 flex items-center gap-1.5">
                                                                                          <span>{formatTime(slot.StartTime || slot.startTime)} - {formatTime(slot.EndTime || slot.endTime)}</span>
                                                                                          {booked && (
                                                                                               <span className="ml-auto flex items-center gap-1">
                                                                                                    <span>✓</span>
                                                                                                    <span>Đã đặt</span>
                                                                                               </span>
                                                                                          )}
                                                                                          {maintenance && (
                                                                                               <span className="ml-auto flex items-center gap-1">
                                                                                                    <span>🔧</span>
                                                                                                    <span>Bảo trì</span>
                                                                                               </span>
                                                                                          )}
                                                                                          {available && (
                                                                                               <span className="ml-auto flex items-center gap-1">
                                                                                                    <span>○</span>
                                                                                                    <span>Trống</span>
                                                                                               </span>
                                                                                          )}
                                                                                     </div>
                                                                                </div>
                                                                           );
                                                                      })}
                                                                 </div>
                                                            )}
                                                       </TableCell>
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

