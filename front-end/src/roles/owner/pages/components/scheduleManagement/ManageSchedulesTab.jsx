import React, { useState, useMemo } from "react";
import { Card, Button, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, DatePicker, Pagination, usePagination, Input, Checkbox } from "../../../../../shared/components/ui";
import { Plus, Calendar, Loader2, Trash2, Loader, Search, X, ChevronDown, ChevronUp, Grid3x3, Table2, Clock, MapPin, User, Phone } from "lucide-react";
import Swal from "sweetalert2";

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
     onDeleteSchedule,
     getBookingInfo
}) {
     const [searchTerm, setSearchTerm] = useState('');
     const [selectedSchedules, setSelectedSchedules] = useState(new Set());
     const [sortBy, setSortBy] = useState('date'); // date, field, slot, status
     const [sortOrder, setSortOrder] = useState('asc'); // asc, desc
     const [viewMode, setViewMode] = useState('table'); // table, grouped
     const [groupBy, setGroupBy] = useState('date'); // date, field, status
     const [filterMonth, setFilterMonth] = useState('all');
     const [filterQuarter, setFilterQuarter] = useState('all');
     const [filterYear, setFilterYear] = useState('all');
     const getStatusBadge = (status) => {
          const statusLower = status.toLowerCase();
          if (statusLower === 'available') {
               return <Badge className="bg-green-100 rounded-2xl hover:bg-green-200 cursor-pointer text-green-800">Available</Badge>;
          } else if (statusLower === 'booked') {
               return <Badge className="bg-blue-100 rounded-2xl hover:bg-blue-200 cursor-pointer text-blue-800">Booked</Badge>;
          } else if (statusLower === 'maintenance') {
               return <Badge className="bg-orange-100 rounded-2xl hover:bg-orange-200 cursor-pointer text-orange-800">Maintenance</Badge>;
          }
          return <Badge className="bg-gray-100 rounded-2xl hover:bg-gray-200 cursor-pointer text-gray-800">{status}</Badge>;
     };

     const formatTimeObj = (time) => {
          if (typeof time === 'string') {
               return time.substring(0, 5);
          } else if (time && time.hour !== undefined) {
               return `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;
          }
          return '00:00';
     };

     // Helper to get date from schedule
     const getScheduleDate = (schedule) => {
          const scheduleDate = schedule.date || schedule.scheduleDate || schedule.ScheduleDate;
          if (typeof scheduleDate === 'string') {
               // If it's a date string in YYYY-MM-DD format, parse it as local date to avoid timezone issues
               if (/^\d{4}-\d{2}-\d{2}$/.test(scheduleDate)) {
                    const [year, month, day] = scheduleDate.split('-').map(Number);
                    return new Date(year, month - 1, day);
               }
               // If it's an ISO string, parse it
               if (scheduleDate.includes('T')) {
                    const datePart = scheduleDate.split('T')[0];
                    const [year, month, day] = datePart.split('-').map(Number);
                    return new Date(year, month - 1, day);
               }
               // Otherwise, try to parse as date
               return new Date(scheduleDate);
          } else if (scheduleDate && scheduleDate.year) {
               return new Date(scheduleDate.year, scheduleDate.month - 1, scheduleDate.day);
          }
          return null;
     };

     // Filter and sort schedules
     const filteredSchedules = useMemo(() => {
          let filtered = fieldSchedules.filter((schedule) => {
               const fieldId = schedule.fieldId || schedule.FieldID;
               const status = schedule.status || schedule.Status || '';
               const fieldName = (schedule.fieldName || schedule.FieldName || '').toLowerCase();
               const slotName = (schedule.slotName || schedule.SlotName || '').toLowerCase();
               const date = getScheduleDate(schedule);

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
                    // Handle both Date object and string
                    let filterDateStr;
                    if (scheduleFilterDate instanceof Date) {
                         filterDateStr = scheduleFilterDate.toISOString().split('T')[0];
                    } else if (typeof scheduleFilterDate === 'string') {
                         // If it's already in YYYY-MM-DD format, use it directly
                         if (/^\d{4}-\d{2}-\d{2}$/.test(scheduleFilterDate)) {
                              filterDateStr = scheduleFilterDate;
                         } else {
                              // Try to parse it as a date
                              const parsedDate = new Date(scheduleFilterDate);
                              if (!isNaN(parsedDate.getTime())) {
                                   filterDateStr = parsedDate.toISOString().split('T')[0];
                              } else {
                                   return false; // Invalid date format
                              }
                         }
                    } else {
                         return false; // Invalid type
                    }
                    
                    const scheduleDateStr = date ? date.toISOString().split('T')[0] : '';
                    if (scheduleDateStr !== filterDateStr) {
                         return false;
                    }
               }

               // Filter by month
               if (filterMonth && filterMonth !== 'all' && date) {
                    if (date.getMonth() + 1 !== Number(filterMonth)) {
                         return false;
                    }
               }

               // Filter by quarter
               if (filterQuarter && filterQuarter !== 'all' && date) {
                    const quarter = Math.floor(date.getMonth() / 3) + 1;
                    if (quarter !== Number(filterQuarter)) {
                         return false;
                    }
               }

               // Filter by year
               if (filterYear && filterYear !== 'all' && date) {
                    if (date.getFullYear() !== Number(filterYear)) {
                         return false;
                    }
               }

               // Search filter
               if (searchTerm) {
                    const search = searchTerm.toLowerCase();
                    const scheduleId = (schedule.scheduleId || schedule.ScheduleID || '').toString();
                    if (!fieldName.includes(search) &&
                         !slotName.includes(search) &&
                         !scheduleId.includes(search)) {
                         return false;
                    }
               }

               return true;
          });

          // Sort schedules
          filtered.sort((a, b) => {
               let aValue, bValue;

               if (sortBy === 'date') {
                    const dateA = getScheduleDate(a);
                    const dateB = getScheduleDate(b);
                    aValue = dateA ? dateA.getTime() : 0;
                    bValue = dateB ? dateB.getTime() : 0;
               } else if (sortBy === 'field') {
                    aValue = (a.fieldName || a.FieldName || '').toLowerCase();
                    bValue = (b.fieldName || b.FieldName || '').toLowerCase();
               } else if (sortBy === 'slot') {
                    aValue = (a.slotName || a.SlotName || '').toLowerCase();
                    bValue = (b.slotName || b.SlotName || '').toLowerCase();
               } else if (sortBy === 'status') {
                    aValue = (a.status || a.Status || '').toLowerCase();
                    bValue = (b.status || b.Status || '').toLowerCase();
               }

               if (sortOrder === 'asc') {
                    return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
               } else {
                    return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
               }
          });

          return filtered;
     }, [fieldSchedules, scheduleFilterField, scheduleFilterStatus, scheduleFilterDate,
          filterMonth, filterQuarter, filterYear, searchTerm, sortBy, sortOrder]);

     // Group schedules for grouped view
     const groupedSchedules = useMemo(() => {
          if (viewMode !== 'grouped') return null;

          const groups = {};

          filteredSchedules.forEach(schedule => {
               let groupKey = '';

               if (groupBy === 'date') {
                    const date = getScheduleDate(schedule);
                    if (date) {
                         groupKey = date.toISOString().split('T')[0];
                    } else {
                         groupKey = 'Không xác định';
                    }
               } else if (groupBy === 'field') {
                    groupKey = schedule.fieldName || schedule.FieldName || 'Không xác định';
               } else if (groupBy === 'status') {
                    groupKey = schedule.status || schedule.Status || 'Available';
               }

               if (!groups[groupKey]) {
                    groups[groupKey] = [];
               }
               groups[groupKey].push(schedule);
          });

          // Sort groups
          const sortedGroups = Object.keys(groups).sort((a, b) => {
               if (groupBy === 'date') {
                    return new Date(a) - new Date(b);
               } else if (groupBy === 'status') {
                    const order = { 'Available': 1, 'Booked': 2, 'Maintenance': 3 };
                    return (order[a] || 99) - (order[b] || 99);
               }
               return a.localeCompare(b);
          });

          return sortedGroups.map(key => ({
               key,
               schedules: groups[key]
          }));
     }, [filteredSchedules, viewMode, groupBy]);

     const handleSort = (column) => {
          if (sortBy === column) {
               setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
          } else {
               setSortBy(column);
               setSortOrder('asc');
          }
     };

     const handleSelectAll = (checked) => {
          if (checked) {
               setSelectedSchedules(new Set(paginatedSchedules.map(s => s.scheduleId || s.ScheduleID)));
          } else {
               setSelectedSchedules(new Set());
          }
     };

     const handleSelectSchedule = (scheduleId, checked) => {
          const newSet = new Set(selectedSchedules);
          if (checked) {
               newSet.add(scheduleId);
          } else {
               newSet.delete(scheduleId);
          }
          setSelectedSchedules(newSet);
     };

     const handleBulkDelete = async () => {
          if (selectedSchedules.size === 0) return;

          const confirm = await Swal.fire({
               title: 'Xác nhận xóa',
               html: `Bạn có chắc muốn xóa <strong>${selectedSchedules.size}</strong> lịch trình đã chọn?`,
               icon: 'warning',
               showCancelButton: true,
               confirmButtonColor: '#ef4444',
               cancelButtonColor: '#6b7280',
               confirmButtonText: 'Xóa',
               cancelButtonText: 'Hủy'
          });

          if (confirm.isConfirmed) {
               // Import deleteFieldSchedule directly
               const { deleteFieldSchedule } = await import('../../../../../shared/services/fieldSchedules');

               let successCount = 0;
               let errorCount = 0;
               const errors = [];

               for (const scheduleId of selectedSchedules) {
                    try {
                         const result = await deleteFieldSchedule(scheduleId);
                         if (result.success) {
                              successCount++;
                         } else {
                              errorCount++;
                              // Check if error is related to booking
                              const errorMessage = result.error || '';
                              const isBookingError = errorMessage.toLowerCase().includes('booking') || 
                                                   errorMessage.toLowerCase().includes('đặt sân') ||
                                                   errorMessage.toLowerCase().includes('entity changes') ||
                                                   errorMessage.toLowerCase().includes('foreign key') ||
                                                   errorMessage.toLowerCase().includes('constraint');
                              
                              errors.push(`ID ${scheduleId}: ${isBookingError ? 'Bạn không thể xóa vì đang có lịch đặt sân này' : (result.error || 'Lỗi không xác định')}`);
                         }
                         // Small delay to avoid overwhelming server
                         await new Promise(resolve => setTimeout(resolve, 100));
                    } catch (error) {
                         errorCount++;
                         // Check if error is related to booking
                         const errorMessage = error.message || error.response?.data?.message || '';
                         const isBookingError = errorMessage.toLowerCase().includes('booking') || 
                                              errorMessage.toLowerCase().includes('đặt sân') ||
                                              errorMessage.toLowerCase().includes('entity changes') ||
                                              errorMessage.toLowerCase().includes('foreign key') ||
                                              errorMessage.toLowerCase().includes('constraint');
                         
                         errors.push(`ID ${scheduleId}: ${isBookingError ? 'Bạn không thể xóa vì đang có lịch đặt sân này' : (error.message || 'Lỗi không xác định')}`);
                    }
               }

               setSelectedSchedules(new Set());

               const errorList = errors.slice(0, 5);
               const moreErrors = errors.length > 5 ? `<p class="text-xs text-gray-500 mt-2">...và ${errors.length - 5} lỗi khác</p>` : '';

               await Swal.fire({
                    icon: successCount > 0 ? (errorCount > 0 ? 'warning' : 'success') : 'error',
                    title: successCount > 0 ? (errorCount > 0 ? 'Xóa một phần thành công' : 'Xóa thành công') : 'Xóa thất bại',
                    html: `
                         <div class="text-left">
                              <div class="mb-3 p-3 bg-gray-50 rounded">
                                   <p class="font-semibold">Kết quả:</p>
                                   <p class="text-green-600">✓ Thành công: ${successCount}</p>
                                   <p class="text-red-600">✗ Thất bại: ${errorCount}</p>
                              </div>
                              ${errorList.length > 0 ? `
                                   <div class="mt-2">
                                        <p class="font-semibold text-sm mb-1">Chi tiết lỗi:</p>
                                        <div class="text-xs space-y-1 max-h-40 overflow-y-auto">
                                             ${errorList.map(err => `<p class="text-red-600">• ${err}</p>`).join('')}
                                        </div>
                                        ${moreErrors}
                                   </div>
                              ` : ''}
                         </div>
                    `,
                    confirmButtonColor: successCount > 0 ? '#10b981' : '#ef4444',
                    width: '600px'
               });

               // Refresh the list
               onRefresh();
          }
     };

     // Pagination for schedules (10 per page)
     const {
          currentPage,
          totalPages,
          currentItems: paginatedSchedules,
          handlePageChange,
          totalItems,
          itemsPerPage,
     } = usePagination(filteredSchedules, 10);

     // Pagination for grouped view (5 groups per page)
     const {
          currentPage: currentGroupPage,
          totalPages: totalGroupPages,
          currentItems: paginatedGroups,
          handlePageChange: handleGroupPageChange,
          totalItems: totalGroupItems,
          itemsPerPage: groupsPerPage,
     } = usePagination(groupedSchedules || [], 5);

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
                              <Plus className="w-4 h-4 mr-2 animate-pulse" />
                              Thêm lịch trình
                         </Button>
                         <Button
                              onClick={onRefresh}
                              variant="outline"
                              className="text-teal-600 hover:text-teal-700 rounded-2xl hover:bg-teal-50 border-teal-200"
                         >
                              <Loader className="w-4 h-4 mr-2 " />
                              Làm mới
                         </Button>
                    </div>
               </div>

               {/* Search and View Mode */}
               <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                         <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <Input
                                   placeholder="Tìm kiếm theo sân, slot, ID..."
                                   value={searchTerm}
                                   onChange={(e) => setSearchTerm(e.target.value)}
                                   className="pl-10 rounded-2xl"
                              />
                         </div>
                    </div>
                    <div className="flex items-center gap-2">
                         <Select value={viewMode} onValueChange={setViewMode}>
                              <SelectTrigger className="w-[150px] rounded-2xl">
                                   <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                   <SelectItem value="table">
                                        <div className="flex items-center gap-2">
                                             <Table2 className="w-4 h-4" />
                                             <span>Xem bảng</span>
                                        </div>
                                   </SelectItem>
                                   <SelectItem value="grouped">
                                        <div className="flex items-center gap-2">
                                             <Grid3x3 className="w-4 h-4" />
                                             <span>Xem nhóm</span>
                                        </div>
                                   </SelectItem>
                              </SelectContent>
                         </Select>
                         {viewMode === 'grouped' && (
                              <Select value={groupBy} onValueChange={setGroupBy}>
                                   <SelectTrigger className="w-[150px] rounded-2xl">
                                        <SelectValue />
                                   </SelectTrigger>
                                   <SelectContent>
                                        <SelectItem value="date">
                                             <div className="flex items-center gap-2">
                                                  <Calendar className="w-4 h-4" />
                                                  <span>Theo ngày</span>
                                             </div>
                                        </SelectItem>
                                        <SelectItem value="field">
                                             <div className="flex items-center gap-2">
                                                  <MapPin className="w-4 h-4" />
                                                  <span>Theo sân</span>
                                             </div>
                                        </SelectItem>
                                        <SelectItem value="status">
                                             <div className="flex items-center gap-2">
                                                  <Clock className="w-4 h-4" />
                                                  <span>Theo trạng thái</span>
                                             </div>
                                        </SelectItem>
                                   </SelectContent>
                              </Select>
                         )}
                    </div>
               </div>

               {/* Filters */}
               <Card className="p-4 rounded-3xl border border-teal-100">
                    <div className="space-y-3">
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

                         {/* Month/Quarter/Year Filters */}
                         <div className="flex items-center gap-4 flex-wrap border-t pt-3">
                              <div className="flex items-center gap-2">
                                   <span className="font-medium text-gray-700">Tháng:</span>
                                   <Select value={filterMonth || 'all'} onValueChange={setFilterMonth}>
                                        <SelectTrigger className="w-[150px] rounded-2xl">
                                             <SelectValue placeholder="Tất cả tháng" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="all">Tất cả tháng</SelectItem>
                                             {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                                                  <SelectItem key={m} value={m.toString()}>
                                                       Tháng {m}
                                                  </SelectItem>
                                             ))}
                                        </SelectContent>
                                   </Select>
                              </div>

                              <div className="flex items-center gap-2">
                                   <span className="font-medium text-gray-700">Quý:</span>
                                   <Select value={filterQuarter || 'all'} onValueChange={(val) => {
                                        setFilterQuarter(val);
                                        setFilterMonth('all'); // Clear month when quarter is selected
                                   }}>
                                        <SelectTrigger className="w-[150px] rounded-2xl">
                                             <SelectValue placeholder="Tất cả quý" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="all">Tất cả quý</SelectItem>
                                             {[1, 2, 3, 4].map(q => (
                                                  <SelectItem key={q} value={q.toString()}>
                                                       Quý {q}
                                                  </SelectItem>
                                             ))}
                                        </SelectContent>
                                   </Select>
                              </div>

                              <div className="flex items-center gap-2">
                                   <span className="font-medium text-gray-700">Năm:</span>
                                   <Select value={filterYear || 'all'} onValueChange={setFilterYear}>
                                        <SelectTrigger className="w-[120px] rounded-2xl">
                                             <SelectValue placeholder="Tất cả năm" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="all">Tất cả năm</SelectItem>
                                             {[new Date().getFullYear(), new Date().getFullYear() + 1, new Date().getFullYear() + 2].map(y => (
                                                  <SelectItem key={y} value={y.toString()}>
                                                       {y}
                                                  </SelectItem>
                                             ))}
                                        </SelectContent>
                                   </Select>
                              </div>

                              {(filterMonth !== 'all' || filterQuarter !== 'all' || filterYear !== 'all' || scheduleFilterDate) && (
                                   <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                             setFilterMonth('all');
                                             setFilterQuarter('all');
                                             setFilterYear('all');
                                             onScheduleFilterDateChange('');
                                        }}
                                        className="rounded-2xl"
                                   >
                                        <X className="w-4 h-4 mr-1" />
                                        Xóa bộ lọc
                                   </Button>
                              )}
                         </div>
                    </div>
               </Card>

               {/* Bulk Actions */}
               {selectedSchedules.size > 0 && (
                    <Card className="p-3 rounded-2xl border-2 border-teal-400 bg-teal-50">
                         <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-teal-900">
                                   Đã chọn <strong>{selectedSchedules.size}</strong> lịch trình
                              </span>
                              <div className="flex items-center gap-2">
                                   <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedSchedules(new Set())}
                                        className="rounded-xl"
                                   >
                                        Bỏ chọn
                                   </Button>
                                   <Button
                                        size="sm"
                                        onClick={handleBulkDelete}
                                        className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                                   >
                                        <Trash2 className="w-4 h-4 mr-1" />
                                        Xóa đã chọn
                                   </Button>
                              </div>
                         </div>
                    </Card>
               )}

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
               ) : viewMode === 'grouped' ? (
                    // Grouped View
                    <div className="space-y-4">
                         {paginatedGroups && paginatedGroups.length > 0 ? (
                              paginatedGroups.map((group) => {
                                   let groupTitle = '';
                                   let groupIcon = <Calendar className="w-5 h-5" />;

                                   if (groupBy === 'date') {
                                        const date = new Date(group.key);
                                        groupTitle = date.toLocaleDateString('vi-VN', {
                                             weekday: 'long',
                                             year: 'numeric',
                                             month: 'long',
                                             day: 'numeric'
                                        });
                                        groupIcon = <Calendar className="w-5 h-5" />;
                                   } else if (groupBy === 'field') {
                                        groupTitle = group.key;
                                        groupIcon = <MapPin className="w-5 h-5" />;
                                   } else if (groupBy === 'status') {
                                        const statusLower = group.key.toLowerCase();
                                        if (statusLower === 'available') {
                                             groupTitle = 'Available';
                                        } else if (statusLower === 'booked') {
                                             groupTitle = 'Booked';
                                        } else if (statusLower === 'maintenance') {
                                             groupTitle = 'Maintenance';
                                        } else {
                                             groupTitle = group.key;
                                        }
                                        groupIcon = <Clock className="w-5 h-5" />;
                                   }

                                   return (
                                        <Card key={group.key} className="rounded-2xl border-2 border-teal-200 overflow-hidden">
                                             <div className="bg-gradient-to-r from-teal-50 to-blue-50 px-4 py-3 border-b-2 border-teal-200">
                                                  <div className="flex items-center justify-between">
                                                       <div className="flex items-center gap-2">
                                                            {groupIcon}
                                                            <h3 className="font-bold text-gray-900">{groupTitle}</h3>
                                                            <Badge className="bg-teal-100 text-teal-800">
                                                                 {group.schedules.length} lịch trình
                                                            </Badge>
                                                       </div>
                                                  </div>
                                             </div>
                                             <div className="p-4">
                                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                       {group.schedules.map((schedule, cardIndex) => {
                                                            const scheduleId = schedule.scheduleId || schedule.ScheduleID;
                                                            const fieldName = schedule.fieldName || schedule.FieldName || 'N/A';
                                                            const slotName = schedule.slotName || schedule.SlotName || 'N/A';
                                                            const status = schedule.status || schedule.Status || 'Available';
                                                            const isSelected = selectedSchedules.has(scheduleId);

                                                            // Format date
                                                            let dateStr = 'N/A';
                                                            const date = getScheduleDate(schedule);
                                                            if (date) {
                                                                 dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
                                                            }

                                                            // Format time
                                                            let timeStr = 'N/A';
                                                            const startTime = schedule.startTime || schedule.StartTime;
                                                            const endTime = schedule.endTime || schedule.EndTime;
                                                            if (startTime && endTime) {
                                                                 timeStr = `${formatTimeObj(startTime)} - ${formatTimeObj(endTime)}`;
                                                            }
                                                            
                                                            // Create unique key for grouped view
                                                            const fieldId = schedule.fieldId ?? schedule.FieldID ?? schedule.fieldID;
                                                            const slotId = schedule.slotId ?? schedule.SlotID ?? schedule.SlotId ?? schedule.slotID;
                                                            const scheduleDateRaw = schedule.date || schedule.scheduleDate || schedule.ScheduleDate;
                                                            const uniqueCardKey = `${scheduleId}-${fieldId}-${slotId}-${scheduleDateRaw}-${cardIndex}`;

                                                            return (
                                                                 <Card
                                                                      key={uniqueCardKey}
                                                                      className={`p-3 rounded-xl border-2 transition-all hover:shadow-lg ${isSelected
                                                                           ? 'border-teal-500 bg-teal-50'
                                                                           : 'border-gray-200 hover:border-teal-300'
                                                                           }`}
                                                                 >
                                                                      <div className="flex items-start justify-between mb-2">
                                                                           <Checkbox
                                                                                checked={isSelected}
                                                                                onCheckedChange={(checked) => handleSelectSchedule(scheduleId, checked)}
                                                                                className="mt-1"
                                                                           />
                                                                           {getStatusBadge(status)}
                                                                      </div>
                                                                      {groupBy !== 'date' && (
                                                                           <div className="mb-2">
                                                                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                                                                     <Calendar className="w-3 h-3" />
                                                                                     <span>{dateStr}</span>
                                                                                </div>
                                                                           </div>
                                                                      )}
                                                                      {groupBy !== 'field' && (
                                                                           <div className="mb-2">
                                                                                <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                                                                                     <MapPin className="w-4 h-4 text-teal-600" />
                                                                                     <span>{fieldName}</span>
                                                                                </div>
                                                                           </div>
                                                                      )}
                                                                      <div className="mb-2">
                                                                           <div className="flex items-center gap-1 text-sm text-gray-700">
                                                                                <Clock className="w-4 h-4 text-blue-600" />
                                                                                <span className="font-medium">{slotName}</span>
                                                                           </div>
                                                                           <div className="text-xs text-gray-500 ml-5 mt-1">
                                                                                {timeStr}
                                                                           </div>
                                                                      </div>
                                                                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                                                                           {/* Check if there's a booking for this schedule */}
                                                                           {(() => {
                                                                                const fieldId = schedule.fieldId ?? schedule.FieldID ?? schedule.fieldID;
                                                                                const slotId = schedule.slotId ?? schedule.SlotID ?? schedule.SlotId ?? schedule.slotID;
                                                                                const scheduleDateRaw = schedule.date || schedule.scheduleDate || schedule.ScheduleDate;
                                                                                let bookingDate = null;
                                                                                if (typeof scheduleDateRaw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(scheduleDateRaw)) {
                                                                                     const [year, month, day] = scheduleDateRaw.split('-').map(Number);
                                                                                     bookingDate = new Date(year, month - 1, day);
                                                                                     bookingDate.setHours(12, 0, 0, 0);
                                                                                } else if (date) {
                                                                                     bookingDate = new Date(date);
                                                                                     bookingDate.setHours(12, 0, 0, 0);
                                                                                }
                                                                                const hasBooking = getBookingInfo && bookingDate && fieldId && slotId ? getBookingInfo(Number(fieldId), bookingDate, Number(slotId)) : null;
                                                                                
                                                                                return (
                                                                                     <Select
                                                                                          value={status}
                                                                                          onValueChange={(newStatus) => {
                                                                                               if (hasBooking) {
                                                                                                    Swal.fire({
                                                                                                         icon: 'warning',
                                                                                                         title: 'Không thể thay đổi trạng thái',
                                                                                                         text: 'Lịch trình này đã có booking. Không thể thay đổi trạng thái khi đã có booking.',
                                                                                                         confirmButtonColor: '#f59e0b'
                                                                                                    });
                                                                                                    return;
                                                                                               }
                                                                                               onUpdateStatus(scheduleId, newStatus);
                                                                                          }}
                                                                                          disabled={!!hasBooking}
                                                                                     >
                                                                                          <SelectTrigger className={`w-[120px] h-7 text-xs flex-1 ${hasBooking ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                                                               <SelectValue />
                                                                                          </SelectTrigger>
                                                                                          <SelectContent>
                                                                                               <SelectItem value="Available">Available</SelectItem>
                                                                                               <SelectItem value="Booked">Booked</SelectItem>
                                                                                               <SelectItem value="Maintenance">Maintenance</SelectItem>
                                                                                          </SelectContent>
                                                                                     </Select>
                                                                                );
                                                                           })()}
                                                                           <Button
                                                                                onClick={() => onDeleteSchedule(scheduleId, `${fieldName} - ${slotName} - ${dateStr}`)}
                                                                                variant="outline"
                                                                                size="sm"
                                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-7 px-2"
                                                                           >
                                                                                <Trash2 className="w-3 h-3" />
                                                                           </Button>
                                                                      </div>
                                                                 </Card>
                                                            );
                                                       })}
                                                  </div>
                                             </div>
                                        </Card>
                                   );
                              })
                         ) : (
                              <Card className="p-12 rounded-3xl border-2 border-teal-400">
                                   <div className="text-center">
                                        <Grid3x3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">Không có lịch trình nào</h3>
                                        <p className="text-gray-500">Thử thay đổi bộ lọc hoặc tạo lịch trình mới</p>
                                   </div>
                              </Card>
                         )}

                         {/* Pagination for Grouped View */}
                         {groupedSchedules && groupedSchedules.length > 0 && (
                              <div className="pt-4 border-t border-gray-200">
                                   <Pagination
                                        currentPage={currentGroupPage}
                                        totalPages={totalGroupPages}
                                        onPageChange={handleGroupPageChange}
                                        itemsPerPage={groupsPerPage}
                                        totalItems={totalGroupItems}
                                   />
                              </div>
                         )}
                    </div>
               ) : (
                    // Table View
                    <Card className="overflow-hidden rounded-3xl border-2 border-teal-400">
                         <div className="overflow-x-auto">
                              <table className="w-full border-collapse border border-teal-200">
                                   <thead>
                                        <tr className="bg-gradient-to-r  from-teal-50 to-blue-50 border-b-2 border-teal-200">
                                             <th className="p-2 text-center font-bold text-gray-800 w-12">
                                                  <Checkbox
                                                       checked={paginatedSchedules.length > 0 && paginatedSchedules.every(s => selectedSchedules.has(s.scheduleId || s.ScheduleID))}
                                                       onCheckedChange={handleSelectAll}
                                                  />
                                             </th>
                                             <th
                                                  className="p-2 text-center font-bold text-gray-800 cursor-pointer hover:bg-teal-100 transition-colors"
                                                  onClick={() => handleSort('date')}
                                             >
                                                  <div className="flex items-center justify-center gap-1">
                                                       Ngày
                                                       {sortBy === 'date' && (
                                                            sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                                                       )}
                                                  </div>
                                             </th>
                                             <th
                                                  className="p-2 text-center font-bold text-gray-800 cursor-pointer hover:bg-teal-100 transition-colors"
                                                  onClick={() => handleSort('field')}
                                             >
                                                  <div className="flex items-center justify-center gap-1">
                                                       Sân
                                                       {sortBy === 'field' && (
                                                            sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                                                       )}
                                                  </div>
                                             </th>
                                             <th
                                                  className="p-2 text-center font-bold text-gray-800 cursor-pointer hover:bg-teal-100 transition-colors"
                                                  onClick={() => handleSort('slot')}
                                             >
                                                  <div className="flex items-center justify-center gap-1">
                                                       Slot
                                                       {sortBy === 'slot' && (
                                                            sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                                                       )}
                                                  </div>
                                             </th>
                                             <th className="p-2 text-center font-bold text-gray-800">Thời gian</th>
                                             <th
                                                  className="p-2 text-center font-bold text-gray-800 cursor-pointer hover:bg-teal-100 transition-colors"
                                                  onClick={() => handleSort('status')}
                                             >
                                                  <div className="flex items-center justify-center gap-1">
                                                       Trạng thái
                                                       {sortBy === 'status' && (
                                                            sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                                                       )}
                                                  </div>
                                             </th>
                                             <th className="p-2 text-center font-bold text-gray-800">Thông tin Booking</th>
                                             <th className="p-2 text-center font-bold text-gray-800">Thao tác</th>
                                        </tr>
                                   </thead>
                                   <tbody>
                                        {paginatedSchedules.map((schedule, index) => {
                                             const scheduleId = schedule.scheduleId || schedule.ScheduleID;
                                             const fieldName = schedule.fieldName || schedule.FieldName || 'N/A';
                                             const slotName = schedule.slotName || schedule.SlotName || 'N/A';
                                             
                                             // Get fieldId, slotId, and scheduleDateRaw first (needed for multiple purposes)
                                             const fieldId = schedule.fieldId ?? schedule.FieldID ?? schedule.fieldID;
                                             const slotId = schedule.slotId ?? schedule.SlotID ?? schedule.SlotId ?? schedule.slotID;
                                             const scheduleDateRaw = schedule.date || schedule.scheduleDate || schedule.ScheduleDate;
                                             
                                             // Format date for display
                                             let dateStr = 'N/A';
                                             const date = getScheduleDate(schedule);
                                             if (date) {
                                                  dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
                                             }
                                             
                                             // Create unique key combining scheduleId, fieldId, slotId, and date to avoid duplicate keys
                                             const uniqueKey = `${scheduleId}-${fieldId}-${slotId}-${scheduleDateRaw}-${index}`;
                                             
                                             // Get base status from schedule
                                             let status = schedule.status || schedule.Status || 'Available';
                                             
                                             // Calculate bookingDate for checking booking
                                             let bookingDate = null;
                                             if (typeof scheduleDateRaw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(scheduleDateRaw)) {
                                                  const [year, month, day] = scheduleDateRaw.split('-').map(Number);
                                                  bookingDate = new Date(year, month - 1, day);
                                                  bookingDate.setHours(12, 0, 0, 0);
                                             } else if (date) {
                                                  bookingDate = new Date(date);
                                                  bookingDate.setHours(12, 0, 0, 0);
                                             }
                                             
                                             // Check if there's a booking for this schedule and update status to "Booked"
                                             // This ensures that if a schedule has a booking, it shows as "Booked" even if the status in DB is "Available"
                                             let bookingInfo = null;
                                             if (getBookingInfo && status.toLowerCase() !== 'maintenance' && bookingDate && fieldId && slotId) {
                                                  bookingInfo = getBookingInfo(Number(fieldId), bookingDate, Number(slotId));
                                                  if (bookingInfo) {
                                                       // If there's a booking, status must be "Booked"
                                                       status = 'Booked';
                                                  } else if (status.toLowerCase() === 'available') {
                                                       // If no booking and current status is Available, keep it as Available (Trống)
                                                       status = 'Available';
                                                  }
                                             }
                                             
                                             const isSelected = selectedSchedules.has(scheduleId);

                                             // Format time
                                             let timeStr = 'N/A';
                                             const startTime = schedule.startTime || schedule.StartTime;
                                             const endTime = schedule.endTime || schedule.EndTime;
                                             if (startTime && endTime) {
                                                  timeStr = `${formatTimeObj(startTime)} - ${formatTimeObj(endTime)}`;
                                             }

                                             // bookingInfo đã được tính ở trên khi check status
                                             // Nếu có booking, status đã được set thành 'Booked'
                                             // Nếu không có booking và status là 'Available', giữ nguyên 'Available' (Trống)

                                             return (
                                                  <tr
                                                       key={uniqueKey}
                                                       className={`border border-gray-200 hover:bg-gray-50 transition-colors text-center ${isSelected ? 'bg-teal-50' : ''} ${status.toLowerCase() === 'booked' && bookingInfo ? 'bg-blue-50/50' : ''}`}
                                                  >
                                                       <td className="p-2 text-center border-r border-gray-200">
                                                            <Checkbox
                                                                 checked={isSelected}
                                                                 onCheckedChange={(checked) => handleSelectSchedule(scheduleId, checked)}
                                                            />
                                                       </td>
                                                       <td className="p-2 text-gray-700 border-r border-gray-200">{dateStr}</td>
                                                       <td className="p-4 text-gray-900 font-medium border-r border-gray-200">{fieldName}</td>
                                                       <td className="p-2 text-gray-700 border-r border-gray-200">{slotName}</td>
                                                       <td className="p-2 text-gray-700 font-mono text-sm border-r border-gray-200">{timeStr}</td>
                                                       <td className="p-2 text-center border-r border-gray-200">{getStatusBadge(status)}</td>
                                                       <td className="p-2 text-center border-r border-gray-200">
                                                            {bookingInfo ? (
                                                                 <div className="flex flex-col items-start gap-1 px-2 py-1 bg-blue-50 rounded-lg border border-blue-200">
                                                                      <div className="flex items-center gap-1 text-xs text-blue-900">
                                                                           <User className="w-3 h-3" />
                                                                           <span className="font-semibold">{bookingInfo.customerName || 'N/A'}</span>
                                                                      </div>
                                                                      <div className="flex items-center gap-1 text-xs text-blue-700">
                                                                           <Phone className="w-3 h-3" />
                                                                           <span>{bookingInfo.customerPhone || 'N/A'}</span>
                                                                      </div>
                                                                      {bookingInfo.bookingId && (
                                                                           <div className="text-xs text-blue-600 font-medium">
                                                                                Booking #{bookingInfo.bookingId}
                                                                           </div>
                                                                      )}
                                                                 </div>
                                                            ) : (
                                                                 <span className="text-gray-400 text-xs">-</span>
                                                            )}
                                                       </td>
                                                       <td className="p-2 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                 <Select
                                                                      value={status}
                                                                      onValueChange={(newStatus) => {
                                                                           if (bookingInfo) {
                                                                                Swal.fire({
                                                                                     icon: 'warning',
                                                                                     title: 'Không thể thay đổi trạng thái',
                                                                                     text: 'Lịch trình này đã có booking. Không thể thay đổi trạng thái khi đã có booking.',
                                                                                     confirmButtonColor: '#f59e0b'
                                                                                });
                                                                                return;
                                                                           }
                                                                           onUpdateStatus(scheduleId, newStatus);
                                                                      }}
                                                                      disabled={!!bookingInfo}
                                                                      className="rounded-2xl"
                                                                 >
                                                                      <SelectTrigger className={`w-[140px] h-8 text-xs ${bookingInfo ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                                           <SelectValue />
                                                                      </SelectTrigger>
                                                                      <SelectContent>
                                                                           <SelectItem value="Available" className="text-green-600">Available</SelectItem>
                                                                           <SelectItem value="Booked" className="text-blue-600">Booked</SelectItem>
                                                                           <SelectItem value="Maintenance" className="text-orange-600">Maintenance</SelectItem>
                                                                      </SelectContent>
                                                                 </Select>
                                                                 <Button
                                                                      onClick={() => onDeleteSchedule(scheduleId, `${fieldName} - ${slotName} - ${dateStr}`)}
                                                                      variant="outline"
                                                                      size="sm"
                                                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-2xl px-2"
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

