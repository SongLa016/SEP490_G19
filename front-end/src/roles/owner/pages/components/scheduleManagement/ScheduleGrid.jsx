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

     const renderScheduleCell = (schedule, field, slot, fieldMaintenance = false, slotIdForField = null) => {
          const status = schedule.status || schedule.Status || 'Available';
          const normalizedStatus = fieldMaintenance ? 'Maintenance' : status;
          const statusLower = normalizedStatus.toLowerCase();
          const booked = statusLower === 'booked';
          const available = statusLower === 'available';
          const maintenance = statusLower === 'maintenance';
          const fieldColor = getFieldColor(field.fieldId);

          // Use slotIdForField if provided, otherwise fallback to slot.slotId
          const actualSlotId = slotIdForField || slot.slotId || slot.SlotID || schedule.slotId || schedule.SlotID;

          // Get booking info early to determine if it's a package booking
          const bookingInfo = booked ? getBookingInfo(Number(field.fieldId), selectedDate, Number(actualSlotId)) : null;
          const isPackageBooking = bookingInfo && (bookingInfo.isPackageSession || bookingInfo.bookingType === 'package');

          // Border color based on status and booking type
          const getBorderColor = () => {
               if (maintenance) return 'border-l-4 border-l-orange-500 border border-orange-200';
               if (booked && isPackageBooking) return 'border-l-4 border-l-blue-500 border border-blue-200';
               if (booked) return 'border-l-4 border-l-green-500 border border-green-200';
               if (available) return 'border-l-4 border-l-red-400 border border-red-200';
               return 'border border-gray-200';
          };

          const baseColorClasses = maintenance
               ? 'bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 text-orange-900'
               : available
                    ? 'bg-white text-gray-800'
                    : isPackageBooking
                         ? 'bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 text-blue-900'
                         : `${fieldColor} text-white`;

          return (
               <div
                    className={`${baseColorClasses} ${getBorderColor()} p-3 rounded-xl w-full text-sm font-medium cursor-pointer hover:opacity-90 hover:shadow-lg transition-all shadow-md`}
                    onClick={(e) => {
                         e.stopPropagation();
                         // bookingInfo and isPackageBooking already calculated above

                         let statusIcon = '📋';
                         let statusBadge = '';

                         if (booked) {
                              statusIcon = '✅';
                              if (isPackageBooking) {
                                   statusBadge = '<span class="inline-block px-3 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">🔄 Lịch cố định</span>';
                              } else {
                                   statusBadge = '<span class="inline-block px-3 bg-green-100 text-green-800 rounded-full text-sm font-semibold">Đã đặt</span>';
                              }
                         } else if (maintenance) {
                              statusIcon = '🔧';
                              statusBadge = '<span class="inline-block px-3 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">Bảo trì</span>';
                         } else if (available) {
                              statusIcon = '⭕';
                              statusBadge = '<span class="inline-block px-3  bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">Trống</span>';
                         }

                         // Build booking info HTML if booked
                         let bookingInfoHTML = '';
                         if (booked && bookingInfo && bookingInfo.bookingId) {
                              const formatCurrency = (amount) => {
                                   return new Intl.NumberFormat('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND'
                                   }).format(amount || 0);
                              };

                              const getPaymentStatusBadge = (status) => {
                                   const statusLower = (status || '').toLowerCase();
                                   if (statusLower === 'paid' || statusLower === 'đã thanh toán' || statusLower === 'thành công') {
                                        return '<span class="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Thành công</span>';
                                   } else if (statusLower === 'pending' || statusLower === 'chờ thanh toán') {
                                        return '<span class="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Chờ thanh toán</span>';
                                   } else if (statusLower === 'cancelled' || statusLower === 'đã hủy') {
                                        return '<span class="inline-block px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Đã hủy</span>';
                                   }
                                   // Default to "Thành công" for package sessions if status is not clear
                                   return '<span class="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Thành công</span>';
                              };

                              const isPackageBooking = bookingInfo.isPackageSession || bookingInfo.bookingType === 'package';
                              const bookingTitle = isPackageBooking ? 'Thông tin Lịch Cố Định' : 'Thông tin Booking';
                              const bookingIcon = isPackageBooking ? '🔄' : '📋';
                              const bgColor = isPackageBooking ? 'bg-purple-50' : 'bg-green-50';
                              const borderColor = isPackageBooking ? 'border-purple-300' : 'border-green-300';
                              const textColor = isPackageBooking ? 'text-purple-900' : 'text-green-900';

                              bookingInfoHTML = `
                                   <div class="${bgColor} px-4 py-3 rounded-2xl border-2 ${borderColor} mt-3">
                                        <p class="text-sm font-bold ${textColor} mb-3 flex items-center gap-2">
                                             <span>${bookingIcon}</span>
                                             <span>${bookingTitle}</span>
                                             ${isPackageBooking ? '<span class="ml-2 px-2 py-0.5 bg-purple-200 text-purple-800 rounded-full text-xs font-semibold">Lịch cố định</span>' : ''}
                                        </p>
                                        <div class="space-y-2">
                                             <div class="flex items-center justify-between">
                                                  <span class="text-xs text-gray-600">${isPackageBooking ? 'Mã Session:' : 'Mã Booking:'}</span>
                                                  <span class="text-sm font-semibold ${textColor}">#${bookingInfo.bookingId}</span>
                                                  ${bookingInfo.bookingPackageId ? `<span class="text-xs text-gray-500">(Gói: #${bookingInfo.bookingPackageId})</span>` : ''}
                                             </div>
                                             ${isPackageBooking && bookingInfo.packageName ? `
                                             <div class="flex items-center justify-between">
                                                  <span class="text-xs text-gray-600">Tên gói:</span>
                                                  <span class="text-sm font-semibold ${textColor}">${bookingInfo.packageName}</span>
                                             </div>
                                             ` : ''}
                                             <div class="border-t border-green-200 pt-2 mt-2">
                                                  <p class="text-xs font-semibold text-gray-700 mb-2">Thông tin khách hàng:</p>
                                                  <div class="space-y-1">
                                                       <div class="flex items-center gap-2">
                                                            <span class="text-xs text-gray-600">👤 Tên:</span>
                                                            <span class="text-sm font-medium ${textColor}">${bookingInfo.customerName || 'N/A'}</span>
                                                       </div>
                                                       <div class="flex items-center gap-2">
                                                            <span class="text-xs text-gray-600">📞 SĐT:</span>
                                                            <span class="text-sm font-medium ${textColor}">${bookingInfo.customerPhone || 'N/A'}</span>
                                                       </div>
                                                       ${bookingInfo.customerEmail && bookingInfo.customerEmail !== 'N/A' ? `
                                                       <div class="flex items-center gap-2">
                                                            <span class="text-xs text-gray-600">📧 Email:</span>
                                                            <span class="text-sm font-medium ${textColor}">${bookingInfo.customerEmail}</span>
                                                       </div>
                                                       ` : ''}
                                                  </div>
                                             </div>
                                             <div class="border-t border-green-200 pt-2 mt-2">
                                                  <p class="text-xs font-semibold text-gray-700 mb-2">Thông tin thanh toán:</p>
                                                  <div class="space-y-1">
                                                       <div class="flex items-center justify-between">
                                                            <span class="text-xs text-gray-600">${isPackageBooking ? 'Giá mỗi buổi:' : 'Tổng tiền:'}</span>
                                                            <span class="text-sm font-bold text-orange-500">${formatCurrency(bookingInfo.totalPrice)}</span>
                                                       </div>
                                                       ${bookingInfo.depositAmount > 0 ? `
                                                       <div class="flex items-center justify-between">
                                                            <span class="text-xs text-gray-600">Đặt cọc:</span>
                                                            <span class="text-sm font-semibold text-yellow-600">${formatCurrency(bookingInfo.depositAmount)}</span>
                                                       </div>
                                                       ` : ''}
                                                       ${isPackageBooking ? `
                                                       <div class="flex items-center justify-between">
                                                            <span class="text-xs text-gray-600">Loại:</span>
                                                            <span class="text-xs font-semibold ${textColor}">Gói đặt cố định</span>
                                                       </div>
                                                       ` : ''}
                                                       <div class="flex items-center justify-between">
                                                            <span class="text-xs text-gray-600">Trạng thái:</span>
                                                            ${getPaymentStatusBadge(bookingInfo.paymentStatus)}
                                                       </div>
                                                  </div>
                                             </div>
                                             ${bookingInfo.hasOpponent ? `
                                             <div class="border-t border-green-200 pt-2 mt-2">
                                                  <div class="flex items-center gap-2">
                                                       <span class="text-xs text-gray-600">⚽</span>
                                                       <span class="text-xs font-medium text-green-900">Có đối thủ</span>
                                                  </div>
                                             </div>
                                             ` : ''}
                                             ${bookingInfo.address && bookingInfo.address !== 'N/A' ? `
                                             <div class="border-t ${isPackageBooking ? 'border-purple-200' : 'border-green-200'} pt-2 mt-2">
                                                  <div class="flex items-start gap-2">
                                                       <span class="text-xs text-gray-600">📍</span>
                                                       <span class="text-xs font-medium ${textColor}">${bookingInfo.address}</span>
                                                  </div>
                                             </div>
                                             ` : ''}
                                        </div>
                                   </div>
                              `;
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
                                        ${bookingInfoHTML}
                                   </div>
                              `,
                              icon: 'info',
                              confirmButtonColor: '#0d9488',
                              confirmButtonText: 'Đóng',
                              width: '600px'
                         });
                    }}
               >
                    <div className={`flex items-center justify-center text-gray-600`}>
                         <Clock className="w-4 h-4 mr-1 opacity-90" />
                         <div className="font-bold text-sm line-clamp-1 truncate">{field.name}</div>
                    </div>
                    <div className={`text-xs opacity-90 flex items-center gap-1 justify-center mt-1`}>
                         {booked && (() => {
                              // Check if this is a package session by getting booking info
                              const bookingInfo = getBookingInfo(Number(field.fieldId), selectedDate, Number(actualSlotId));
                              const isPackageBooking = bookingInfo && (bookingInfo.isPackageSession || bookingInfo.bookingType === 'package');
                              return isPackageBooking ? (
                                   <span className="text-purple-600 font-semibold">🔄 Lịch cố định</span>
                              ) : (
                                   <span className="text-green-500">✅ Đã đặt</span>
                              );
                         })()}
                         {maintenance && <span>🔧 Bảo trì</span>}
                         {available && <span className={`text-red-600`}>⭕ Trống</span>}
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
                                                                      <span className="truncate ">{field.name}</span>
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
                                                                                renderScheduleCell(fieldSchedule, field, slot, fieldMaintenance, slotIdForField)
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
