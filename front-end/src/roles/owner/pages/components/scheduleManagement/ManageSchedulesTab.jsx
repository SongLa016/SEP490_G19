import React from "react";
import { Card, Button, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, DatePicker, Pagination, usePagination } from "../../../../../shared/components/ui";
import { Plus, Calendar, Loader2, Trash2, Loader } from "lucide-react";

export default function ManageSchedulesTab({
     fields,
     scheduleFilterField,
     onScheduleFilterFieldChange,
     scheduleFilterStatus,
     onScheduleFilterStatusChange,
     scheduleFilterDate,
     onScheduleFilterDateChange,
     loadingSchedules,
     fieldSchedules,
     onAddSchedule,
     onRefresh,
     onUpdateStatus,
     onDeleteSchedule
}) {
     const getStatusBadge = (status) => {
          const statusLower = status.toLowerCase();
          if (statusLower === 'available') {
               return <Badge className="bg-green-100 text-green-800">Available</Badge>;
          } else if (statusLower === 'booked') {
               return <Badge className="bg-blue-100 text-blue-800">Booked</Badge>;
          } else if (statusLower === 'maintenance') {
               return <Badge className="bg-orange-100 text-orange-800">Maintenance</Badge>;
          }
          return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
     };

     const formatTimeObj = (time) => {
          if (typeof time === 'string') {
               return time.substring(0, 5);
          } else if (time && time.hour !== undefined) {
               return `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;
          }
          return '00:00';
     };

     // Filter schedules based on filters
     const filteredSchedules = fieldSchedules.filter((schedule) => {
          const fieldId = schedule.fieldId || schedule.FieldID;
          const status = schedule.status || schedule.Status || '';
          const scheduleDate = schedule.scheduleDate || schedule.ScheduleDate;

          // Filter by field
          if (scheduleFilterField !== 'all' && fieldId.toString() !== scheduleFilterField) {
               return false;
          }

          // Filter by status
          if (scheduleFilterStatus !== 'all' && status.toLowerCase() !== scheduleFilterStatus.toLowerCase()) {
               return false;
          }

          // Filter by date
          if (scheduleFilterDate) {
               const filterDateStr = scheduleFilterDate.toISOString().split('T')[0];
               const scheduleDateStr = scheduleDate ? new Date(scheduleDate).toISOString().split('T')[0] : '';
               if (scheduleDateStr !== filterDateStr) {
                    return false;
               }
          }

          return true;
     });

     // Pagination for schedules (10 per page)
     const {
          currentPage,
          totalPages,
          currentItems: paginatedSchedules,
          handlePageChange,
          totalItems,
          itemsPerPage,
     } = usePagination(filteredSchedules, 10);

     return (
          <>
               <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                         <h3 className="text-lg font-semibold text-gray-900">Quản lý Lịch trình</h3>
                         <p className="text-gray-600">Xem và quản lý tất cả lịch trình đã tạo</p>
                    </div>
                    <div className="flex items-center gap-2">
                         <Button
                              onClick={onAddSchedule}
                              className="bg-teal-600 hover:bg-teal-700 rounded-2xl text-white"
                         >
                              <Plus className="w-4 h-4 mr-2" />
                              Thêm lịch trình
                         </Button>
                         <Button
                              onClick={onRefresh}
                              variant="outline"
                              className="text-teal-600 hover:text-teal-700 rounded-2xl hover:bg-teal-50 border-teal-200"
                         >
                              <Loader className="w-4 h-4 mr-2 animate-spin" />
                              Làm mới
                         </Button>
                    </div>
               </div>

               {/* Filters */}
               <Card className="p-4 rounded-3xl border border-teal-100">
                    <div className="flex items-center gap-4 flex-wrap">
                         <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">Sân:</span>
                              <Select value={scheduleFilterField} onValueChange={onScheduleFilterFieldChange}>
                                   <SelectTrigger className="w-[200px] rounded-2xl">
                                        <SelectValue placeholder="Chọn sân" />
                                   </SelectTrigger>
                                   <SelectContent>
                                        <SelectItem value="all">Tất cả</SelectItem>
                                        {fields.map((field) => (
                                             <SelectItem key={field.fieldId} value={field.fieldId.toString()}>
                                                  {field.name}
                                             </SelectItem>
                                        ))}
                                   </SelectContent>
                              </Select>
                         </div>

                         <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">Trạng thái:</span>
                              <Select value={scheduleFilterStatus} onValueChange={onScheduleFilterStatusChange}>
                                   <SelectTrigger className="w-[150px] rounded-2xl">
                                        <SelectValue placeholder="Chọn trạng thái" />
                                   </SelectTrigger>
                                   <SelectContent>
                                        <SelectItem value="all">Tất cả</SelectItem>
                                        <SelectItem value="Available">Available</SelectItem>
                                        <SelectItem value="Booked">Booked</SelectItem>
                                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                                   </SelectContent>
                              </Select>
                         </div>

                         <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">Ngày:</span>
                              <DatePicker
                                   value={scheduleFilterDate}
                                   onChange={onScheduleFilterDateChange}
                                   className="w-[180px] rounded-2xl"
                                   placeholder="Chọn ngày"
                              />
                         </div>
                    </div>
               </Card>

               {/* Table */}
               {loadingSchedules ? (
                    <Card className="p-12 rounded-3xl border-2 border-teal-400">
                         <div className="text-center">
                              <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-4" />
                              <p className="text-gray-600">Đang tải dữ liệu...</p>
                         </div>
                    </Card>
               ) : fieldSchedules.length === 0 ? (
                    <Card className="p-12 rounded-3xl border-2 border-teal-400">
                         <div className="text-center">
                              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lịch trình nào</h3>
                              <p className="text-gray-500">Tạo Time Slot để tự động tạo lịch trình</p>
                         </div>
                    </Card>
               ) : (
                    <Card className="overflow-hidden rounded-3xl border-2 border-teal-400">
                         <div className="overflow-x-auto">
                              <table className="w-full border-collapse border border-teal-200">
                                   <thead>
                                        <tr className="bg-gradient-to-r  from-teal-50 to-blue-50 border-b-2 border-teal-200">
                                             <th className="p-2 text-center font-bold text-gray-800">ID</th>
                                             <th className="p-2 text-center font-bold text-gray-800">Sân</th>
                                             <th className="p-2 text-center font-bold text-gray-800">Slot</th>
                                             <th className="p-4 text-center font-bold text-gray-800">Ngày</th>
                                             <th className="p-2 text-center font-bold text-gray-800">Thời gian</th>
                                             <th className="p-2 text-center font-bold text-gray-800">Trạng thái</th>
                                             <th className="p-2 text-center font-bold text-gray-800">Thao tác</th>
                                        </tr>
                                   </thead>
                                   <tbody>
                                        {paginatedSchedules.map((schedule) => {
                                             const scheduleId = schedule.scheduleId || schedule.ScheduleID;
                                             const fieldName = schedule.fieldName || schedule.FieldName || 'N/A';
                                             const slotName = schedule.slotName || schedule.SlotName || 'N/A';
                                             const status = schedule.status || schedule.Status || 'Available';

                                             // Format date
                                             let dateStr = 'N/A';
                                             const scheduleDate = schedule.date;
                                             if (typeof scheduleDate === 'string') {
                                                  const date = new Date(scheduleDate);
                                                  dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
                                             } else if (scheduleDate && scheduleDate.year) {
                                                  dateStr = `${scheduleDate.day}/${scheduleDate.month}/${scheduleDate.year}`;
                                             }

                                             // Format time
                                             let timeStr = 'N/A';
                                             const startTime = schedule.startTime || schedule.StartTime;
                                             const endTime = schedule.endTime || schedule.EndTime;
                                             if (startTime && endTime) {
                                                  timeStr = `${formatTimeObj(startTime)} - ${formatTimeObj(endTime)}`;
                                             }

                                             return (
                                                  <tr key={scheduleId} className="border border-gray-200  hover:bg-gray-50 transition-colors text-center">
                                                       <td className="p-2  text-gray-700 font-mono text-sm border-r border-gray-200">#{scheduleId}</td>
                                                       <td className="p-4 text-gray-900 font-medium border-r border-gray-200">{fieldName}</td>
                                                       <td className="p-2 text-gray-700 border-r border-gray-200">{slotName}</td>
                                                       <td className="p-2 text-gray-700 border-r border-gray-200">{dateStr}</td>
                                                       <td className="p-2 text-gray-700 font-mono text-sm border-r border-gray-200">{timeStr}</td>
                                                       <td className="p-2 text-center border-r border-gray-200">{getStatusBadge(status)}</td>
                                                       <td className="p-2 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                 <Select
                                                                      value={status}
                                                                      onValueChange={(newStatus) => onUpdateStatus(scheduleId, newStatus)}
                                                                 >
                                                                      <SelectTrigger className="w-[140px] h-8 text-xs">
                                                                           <SelectValue />
                                                                      </SelectTrigger>
                                                                      <SelectContent>
                                                                           <SelectItem value="Available">Available</SelectItem>
                                                                           <SelectItem value="Booked">Booked</SelectItem>
                                                                           <SelectItem value="Maintenance">Maintenance</SelectItem>
                                                                      </SelectContent>
                                                                 </Select>
                                                                 <Button
                                                                      onClick={() => onDeleteSchedule(scheduleId, `${fieldName} - ${slotName} - ${dateStr}`)}
                                                                      variant="outline"
                                                                      size="sm"
                                                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                                 >
                                                                      <Trash2 className="w-4 h-4" />
                                                                 </Button>
                                                            </div>
                                                       </td>
                                                  </tr>
                                             );
                                        })}
                                   </tbody>
                              </table>
                         </div>

                         {/* Pagination */}
                         {filteredSchedules.length > 0 && (
                              <div className="p-4 border-t border-gray-200">
                                   <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={handlePageChange}
                                        itemsPerPage={itemsPerPage}
                                        totalItems={totalItems}
                                   />
                              </div>
                         )}
                    </Card>
               )}
          </>
     );
}

