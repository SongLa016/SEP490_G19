import React from "react";
import { Card, Badge } from "../../../../shared/components/ui";
import { DollarSign } from "lucide-react";
import Swal from "sweetalert2";

export default function ScheduleTable({
     fields,
     timeSlots,
     weekDates,
     filterStatus,
     isSlotBooked,
     getBookingInfo,
     getFieldPrice,
     formatDate,
     getDayName
}) {

     return (
          <Card className="p-6 overflow-x-auto">
               <table className="w-full border-collapse">
                    <thead>
                         <tr>
                              <th className="border border-gray-300 bg-gray-100 p-3 text-left font-semibold text-gray-700 min-w-[120px]">
                                   Sân
                              </th>
                              {weekDates.map((date, index) => (
                                   <th key={index} className="border border-gray-300 bg-gray-100 p-3 text-center font-semibold text-gray-700 min-w-[120px]">
                                        <div>{getDayName(date)}</div>
                                        <div className="text-sm font-normal">{formatDate(date)}</div>
                                   </th>
                              ))}
                         </tr>
                    </thead>
                    <tbody>
                         {fields.length === 0 ? (
                              <tr>
                                   <td colSpan={8} className="border border-gray-300 p-8 text-center text-gray-500">
                                        Khu sân này chưa có sân nào
                                   </td>
                              </tr>
                         ) : (
                              fields.map((field) => (
                                   <React.Fragment key={field.fieldId}>
                                        {/* Field name row */}
                                        <tr>
                                             <td colSpan={8} className="border border-gray-300 bg-teal-50 p-2 font-semibold text-teal-900">
                                                  {field.name}
                                             </td>
                                        </tr>

                                        {/* Time slots rows */}
                                        {timeSlots.map((slot) => {
                                             const price = getFieldPrice(field, slot.SlotID);

                                             return (
                                                  <tr key={`${field.fieldId}-${slot.SlotID}`}>
                                                       <td className="border border-gray-300 p-2 text-sm text-gray-700">
                                                            <div className="font-medium">{slot.SlotName}</div>
                                                            <div className="text-xs text-gray-500">
                                                                 {slot.StartTime.substring(0, 5)} - {slot.EndTime.substring(0, 5)}
                                                            </div>
                                                            {price > 0 && (
                                                                 <div className="text-xs text-teal-600 font-medium flex items-center gap-1 mt-1">
                                                                      <DollarSign className="w-3 h-3" />
                                                                      {price.toLocaleString('vi-VN')}đ
                                                                 </div>
                                                            )}
                                                       </td>
                                                       {weekDates.map((date, dateIndex) => {
                                                            const booked = isSlotBooked(field.fieldId, date, slot.SlotID);
                                                            const bookingInfo = booked ? getBookingInfo(field.fieldId, date, slot.SlotID) : null;

                                                            // Apply filter
                                                            const shouldShow =
                                                                 filterStatus === 'all' ||
                                                                 (filterStatus === 'booked' && booked) ||
                                                                 (filterStatus === 'available' && !booked);

                                                            if (!shouldShow) {
                                                                 return (
                                                                      <td
                                                                           key={dateIndex}
                                                                           className="border border-gray-300 p-2 text-center text-sm bg-gray-100"
                                                                      >
                                                                           <span className="text-gray-300">-</span>
                                                                      </td>
                                                                 );
                                                            }

                                                            return (
                                                                 <td
                                                                      key={dateIndex}
                                                                      className={`border border-gray-300 p-2 text-center text-sm cursor-pointer transition-colors ${booked ? 'bg-green-50 hover:bg-green-100' : 'bg-white hover:bg-gray-50'
                                                                           }`}
                                                                      onClick={() => {
                                                                           if (booked && bookingInfo) {
                                                                                Swal.fire({
                                                                                     title: 'Thông tin đặt sân',
                                                                                     html: `
                                                                                          <div class="text-left space-y-2">
                                                                                               <p><strong>Sân:</strong> ${field.name}</p>
                                                                                               <p><strong>Khung giờ:</strong> ${slot.SlotName} (${slot.StartTime.substring(0, 5)} - ${slot.EndTime.substring(0, 5)})</p>
                                                                                               <p><strong>Ngày:</strong> ${date.toLocaleDateString('vi-VN')}</p>
                                                                                               <p><strong>Khách hàng:</strong> ${bookingInfo.customerName}</p>
                                                                                               <p><strong>SĐT:</strong> ${bookingInfo.customerPhone}</p>
                                                                                               <p><strong>Giá:</strong> ${price.toLocaleString('vi-VN')}đ</p>
                                                                                               <p><strong>Trạng thái:</strong> <span class="text-green-600">${bookingInfo.status}</span></p>
                                                                                          </div>
                                                                                     `,
                                                                                     icon: 'info',
                                                                                     confirmButtonColor: '#0d9488'
                                                                                });
                                                                           }
                                                                      }}
                                                                 >
                                                                      {booked ? (
                                                                           <div className="space-y-1">
                                                                                <Badge className="bg-green-100 text-green-800 text-xs">
                                                                                     Đã đặt
                                                                                </Badge>
                                                                                {bookingInfo && (
                                                                                     <div className="text-xs text-gray-600 truncate">
                                                                                          {bookingInfo.customerName}
                                                                                     </div>
                                                                                )}
                                                                           </div>
                                                                      ) : (
                                                                           <span className="text-gray-400">-</span>
                                                                      )}
                                                                 </td>
                                                            );
                                                       })}
                                                  </tr>
                                             );
                                        })}
                                   </React.Fragment>
                              ))
                         )}
                    </tbody>
               </table>
          </Card>
     );
}
