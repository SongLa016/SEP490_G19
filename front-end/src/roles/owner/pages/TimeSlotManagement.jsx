import React, { useState } from 'react';
import { Button, Card, Input, Modal, Table, Badge, Alert, AlertDescription, Pagination, usePagination } from '../../../shared/components/ui';
import {
     Plus,
     Edit,
     Trash2,
     Clock,
     Save,
     X,
     Calendar,
     Timer,
     AlertCircle,
     Info,
     ChevronRight,
     Settings,
     BarChart3,
     Zap,
     XCircle,
     CheckSquare,
     Square
} from 'lucide-react';
import { createTimeSlot, updateTimeSlot, deleteTimeSlot } from '../../../shared/services/timeSlots';
import { useTimeSlots } from '../../../shared/hooks';
import { DemoRestrictedModal } from '../../../shared';
import OwnerLayout from '../layouts/OwnerLayout';
import { useAuth } from '../../../contexts/AuthContext';
import Swal from 'sweetalert2';


export default function TimeSlotManagement({ isDemo = false }) {
     // Use React Query hook for time slots with caching
     const { data: timeSlots = [], isLoading: loading, refetch: loadData } = useTimeSlots();

     const [showModal, setShowModal] = useState(false);
     const [editingSlot, setEditingSlot] = useState(null);
     const [showDemoRestrictedModal, setShowDemoRestrictedModal] = useState(false);
     const [activeTab, setActiveTab] = useState('manage');
     const [formData, setFormData] = useState({
          SlotName: '',
          StartTime: '',
          EndTime: '',
          FieldId: ''
     });
     const [formErrors, setFormErrors] = useState({});
     const [isSubmitting, setIsSubmitting] = useState(false);
     const [selectedSlots, setSelectedSlots] = useState([]);
     const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
     const { user, logout } = useAuth();

     // Pagination for time slots (10 per page)
     const {
          currentPage,
          totalPages,
          currentItems: paginatedTimeSlots,
          handlePageChange,
          totalItems,
          itemsPerPage,
     } = usePagination(timeSlots, 10);

     const handleOpenModal = (slot = null) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }

          if (slot) {
               setEditingSlot(slot);
               setFormData({
                    SlotName: slot.SlotName,
                    StartTime: slot.StartTime.substring(0, 5), // Convert HH:MM:SS to HH:MM
                    EndTime: slot.EndTime.substring(0, 5),
                    FieldId: (slot.FieldId ?? slot.fieldId ?? '').toString()
               });
          } else {
               setEditingSlot(null);
               setFormData({
                    SlotName: '',
                    StartTime: '',
                    EndTime: '',
                    FieldId: ''
               });
          }
          setFormErrors({});
          setSelectedSlots([]);
          setBatchProgress({ current: 0, total: 0 });
          setShowModal(true);
     };

     const handleCloseModal = () => {
          setShowModal(false);
          setEditingSlot(null);
          setFormData({
               SlotName: '',
               StartTime: '',
               EndTime: '',
               FieldId: ''
          });
          setFormErrors({});
          setIsSubmitting(false);
          setSelectedSlots([]);
          setBatchProgress({ current: 0, total: 0 });
     };

     const validateForm = () => {
          const errors = {};

          if (!formData.SlotName.trim()) {
               errors.SlotName = 'Vui lòng nhập tên slot';
          }

          if (!formData.FieldId) {
               errors.FieldId = 'Vui lòng nhập Field ID';
          } else if (Number.isNaN(Number(formData.FieldId))) {
               errors.FieldId = 'Field ID phải là số hợp lệ';
          }

          if (!formData.StartTime) {
               errors.StartTime = 'Vui lòng chọn giờ bắt đầu';
          }

          if (!formData.EndTime) {
               errors.EndTime = 'Vui lòng chọn giờ kết thúc';
          }

          if (formData.StartTime && formData.EndTime) {
               if (formData.StartTime >= formData.EndTime) {
                    errors.EndTime = 'Giờ kết thúc phải lớn hơn giờ bắt đầu';
               }

               // Check for conflicts with existing slots (only when creating new)
               if (!editingSlot) {
                    const conflictSlot = timeSlots.find((slot) => {
                         const slotStart = slot.StartTime.substring(0, 5);
                         const slotEnd = slot.EndTime.substring(0, 5);
                         return formData.StartTime < slotEnd && formData.EndTime > slotStart;
                    });

                    if (conflictSlot) {
                         errors.EndTime = 'Slot này trùng với slot đã có';
                         // Notify with SweetAlert2
                         Swal.fire({
                              title: 'Slot bị trùng',
                              html: `Đã có slot: <strong>${conflictSlot.SlotName}</strong><br/>` +
                                   `${formatTime(conflictSlot.StartTime)} - ${formatTime(conflictSlot.EndTime)}`,
                              icon: 'error',
                              confirmButtonText: 'OK'
                         });
                    }
               }
          }

          setFormErrors(errors);
          return Object.keys(errors).length === 0;
     };

     const handleSubmit = async (e) => {
          e.preventDefault();

          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }

          // If there are selected slots from quick add, use batch submit
          if (selectedSlots.length > 0) {
               await handleBatchSubmit();
               return;
          }

          // Otherwise, validate and submit single form
          if (!validateForm()) {
               return;
          }

          setIsSubmitting(true);
          try {
               let result;
               if (editingSlot) {
                    result = await updateTimeSlot(editingSlot.SlotID, formData);
               } else {
                    result = await createTimeSlot(formData);
               }

               if (result.success) {
                    await loadData();
                    await Swal.fire({
                         title: editingSlot ? 'Cập nhật thành công' : 'Tạo slot thành công',
                         text: editingSlot
                              ? `Đã cập nhật: ${formData.SlotName} (${formData.StartTime} - ${formData.EndTime})`
                              : `Đã tạo: ${formData.SlotName} (${formData.StartTime} - ${formData.EndTime})`,
                         icon: 'success',
                         confirmButtonText: 'OK'
                    });
                    handleCloseModal();
               } else {
                    setFormErrors({ submit: result.error });
                    // Show conflict message nicely if duplicate
                    const isDuplicate = typeof result.error === 'string' &&
                         (result.error.toLowerCase().includes('trùng') ||
                              result.error.toLowerCase().includes('duplicate') ||
                              result.error.toLowerCase().includes('exists'));
                    await Swal.fire({
                         title: isDuplicate ? 'Slot đã tồn tại' : 'Không thể lưu slot',
                         text: result.error,
                         icon: 'error',
                         confirmButtonText: 'OK'
                    });
               }
          } catch (error) {
               console.error('Error saving time slot:', error);
               setFormErrors({ submit: 'Có lỗi xảy ra khi lưu slot thời gian' });
               await Swal.fire({
                    title: 'Có lỗi xảy ra',
                    text: 'Có lỗi xảy ra khi lưu slot thời gian',
                    icon: 'error',
                    confirmButtonText: 'OK'
               });
          } finally {
               setIsSubmitting(false);
          }
     };

     const calculateDuration = () => {
          if (!formData.StartTime || !formData.EndTime) return null;
          if (formData.StartTime >= formData.EndTime) return null;

          const start = new Date(`2000-01-01T${formData.StartTime}`);
          const end = new Date(`2000-01-01T${formData.EndTime}`);
          const duration = (end - start) / (1000 * 60 * 60);
          return duration;
     };

     const handleQuickAdd = (slotName, startTime, endTime) => {
          // Always toggle selection in quick add
          const slotKey = `${slotName}-${startTime}-${endTime}`;
          if (selectedSlots.some(s => s.key === slotKey)) {
               setSelectedSlots(selectedSlots.filter(s => s.key !== slotKey));
          } else {
               setSelectedSlots([...selectedSlots, { key: slotKey, name: slotName, start: startTime, end: endTime }]);
          }
     };

     const handleSelectAllSlots = () => {
          if (selectedSlots.length === quickSlotTemplates.length) {
               setSelectedSlots([]);
          } else {
               setSelectedSlots(quickSlotTemplates.map(t => ({
                    key: `${t.name}-${t.start}-${t.end}`,
                    name: t.name,
                    start: t.start,
                    end: t.end
               })));
          }
     };

     const handleBatchSubmit = async () => {
          if (selectedSlots.length === 0) {
               setFormErrors({ submit: 'Vui lòng chọn ít nhất một slot để thêm' });
               return;
          }

          if (!formData.FieldId) {
               setFormErrors({ FieldId: 'Vui lòng nhập Field ID trước khi thêm hàng loạt' });
               return;
          }

          setIsSubmitting(true);
          setBatchProgress({ current: 0, total: selectedSlots.length });
          setFormErrors({});

          let successCount = 0;
          let errorCount = 0;
          const errors = [];

          for (let i = 0; i < selectedSlots.length; i++) {
               const slot = selectedSlots[i];
               setBatchProgress({ current: i + 1, total: selectedSlots.length });

               try {
                    const result = await createTimeSlot({
                         SlotName: slot.name,
                         StartTime: slot.start,
                         EndTime: slot.end,
                         FieldId: formData.FieldId
                    });

                    if (result.success) {
                         successCount++;
                    } else {
                         errorCount++;
                         errors.push(`${slot.name}: ${result.error}`);
                    }
               } catch (error) {
                    errorCount++;
                    errors.push(`${slot.name}: ${error.message}`);
               }

               // Small delay to show progress
               await new Promise(resolve => setTimeout(resolve, 100));
          }

          setIsSubmitting(false);
          setBatchProgress({ current: 0, total: 0 });

          if (errorCount === 0) {
               // All successful
               await loadData();
               await Swal.fire({
                    title: 'Thêm hàng loạt thành công',
                    text: `Đã thêm ${successCount} slot.`,
                    icon: 'success',
                    confirmButtonText: 'OK'
               });
               handleCloseModal();
          } else if (successCount > 0) {
               // Some succeeded, some failed
               setFormErrors({
                    submit: `${successCount} slot đã được thêm thành công. ${errorCount} slot thất bại:\n${errors.join('\n')}`
               });
               await loadData(); // Reload to show successful ones
               await Swal.fire({
                    title: 'Đã thêm một phần',
                    html: `<div style="text-align:left"><div><strong>Thành công:</strong> ${successCount}</div><div><strong>Thất bại:</strong> ${errorCount}</div><div style="margin-top:8px;max-height:160px;overflow:auto"><pre style="white-space:pre-wrap;margin:0">${errors.join('\n')}</pre></div></div>`,
                    icon: 'info',
                    confirmButtonText: 'OK'
               });
          } else {
               // All failed
               setFormErrors({
                    submit: `Không thể thêm slot. Lỗi:\n${errors.join('\n')}`
               });
               await Swal.fire({
                    title: 'Thêm hàng loạt thất bại',
                    html: `<div style="text-align:left;max-height:220px;overflow:auto"><pre style="white-space:pre-wrap;margin:0">${errors.join('\n')}</pre></div>`,
                    icon: 'error',
                    confirmButtonText: 'OK'
               });
          }
     };

     const quickSlotTemplates = [
          { name: 'Slot 11', start: '07:15', end: '08:45' },
          { name: 'Slot 10', start: '08:45', end: '10:15' },
          { name: 'Slot 9', start: '10:15', end: '11:45' },
          { name: 'Slot 8', start: '11:45', end: '13:15' },
          { name: 'Slot 7', start: '13:15', end: '14:45' },
          { name: 'Slot 6', start: '14:45', end: '16:15' },
          { name: 'Slot 5', start: '16:15', end: '17:45' },
          { name: 'Slot 4', start: '17:45', end: '19:15' },
          { name: 'Slot 3', start: '19:15', end: '20:45' },
          { name: 'Slot 2', start: '20:45', end: '22:15' },
          { name: 'Slot 1', start: '22:15', end: '23:45' },
     ];

     const handleDelete = async (slotId) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }

          try {
               const confirm = await Swal.fire({
                    title: 'Xác nhận xóa',
                    text: 'Bạn có chắc chắn muốn xóa slot thời gian này?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Xóa',
                    cancelButtonText: 'Hủy',
                    confirmButtonColor: '#dc2626'
               });
               if (!confirm.isConfirmed) return;

               const result = await deleteTimeSlot(slotId);
               if (result.success) {
                    await loadData();
                    await Swal.fire({
                         title: 'Đã xóa',
                         text: 'Xóa slot thời gian thành công',
                         icon: 'success',
                         confirmButtonText: 'OK'
                    });
               } else {
                    await Swal.fire({
                         title: 'Không thể xóa slot',
                         text: result.error,
                         icon: 'error',
                         confirmButtonText: 'OK'
                    });
               }
          } catch (error) {
               console.error('Error deleting time slot:', error);
               await Swal.fire({
                    title: 'Có lỗi xảy ra',
                    text: 'Có lỗi xảy ra khi xóa slot thời gian',
                    icon: 'error',
                    confirmButtonText: 'OK'
               });
          }
     };

     const formatTime = (timeString) => {
          const [hours, minutes] = timeString.split(':');
          return `${hours}:${minutes}`;
     };

     const getTotalHours = () => {
          return timeSlots.reduce((total, slot) => {
               const start = new Date(`2000-01-01T${slot.StartTime}`);
               const end = new Date(`2000-01-01T${slot.EndTime}`);
               const duration = (end - start) / (1000 * 60 * 60);
               return total + duration;
          }, 0);
     };

     const navigationItems = [
          { id: 'manage', label: 'Quản lý', icon: Settings },
          { id: 'calendar', label: 'Lịch trình', icon: Calendar },
          { id: 'overview', label: 'Tổng quan', icon: BarChart3 }
     ];

     const columns = [
          {
               key: 'SlotName',
               title: 'Tên Slot',
               render: (slot) => (
                    <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <Timer className="w-5 h-5 text-white" />
                         </div>
                         <div>
                              <span className="font-semibold text-gray-900">{slot.SlotName}</span>
                              <p className="text-sm text-gray-500">Slot thời gian</p>
                         </div>
                    </div>
               )
          },
          {
               key: 'StartTime',
               title: 'Giờ Bắt Đầu',
               render: (slot) => (
                    <div className="flex items-center space-x-2">
                         <Clock className="w-4 h-4 text-green-500" />
                         <span className="font-medium text-gray-900">{formatTime(slot.StartTime)}</span>
                    </div>
               )
          },
          {
               key: 'EndTime',
               title: 'Giờ Kết Thúc',
               render: (slot) => (
                    <div className="flex items-center space-x-2">
                         <Clock className="w-4 h-4 text-red-500" />
                         <span className="font-medium text-gray-900">{formatTime(slot.EndTime)}</span>
                    </div>
               )
          },
          {
               key: 'Duration',
               title: 'Thời Gian',
               render: (slot) => {
                    const start = new Date(`2000-01-01T${slot.StartTime}`);
                    const end = new Date(`2000-01-01T${slot.EndTime}`);
                    const duration = (end - start) / (1000 * 60 * 60);
                    return (
                         <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              {duration} giờ
                         </Badge>
                    );
               }
          },
          {
               key: 'actions',
               title: 'Thao Tác',
               render: (slot) => (
                    <div className="flex items-center space-x-2">
                         <Button
                              onClick={() => handleOpenModal(slot)}
                              variant="outline"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                         >
                              <Edit className="w-4 h-4" />
                         </Button>
                         <Button
                              onClick={() => handleDelete(slot.SlotID)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                         >
                              <Trash2 className="w-4 h-4" />
                         </Button>
                    </div>
               )
          }
     ];

     const renderOverview = () => (
          <div className="space-y-6">
               {/* Stats Cards */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-blue-600">Tổng Slot</p>
                                   <p className="text-3xl font-bold text-blue-900">{timeSlots.length}</p>
                              </div>
                              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                                   <Timer className="w-6 h-6 text-white" />
                              </div>
                         </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-green-600">Tổng Giờ</p>
                                   <p className="text-3xl font-bold text-green-900">{getTotalHours()}</p>
                              </div>
                              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                                   <Clock className="w-6 h-6 text-white" />
                              </div>
                         </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-purple-600">Trung Bình</p>
                                   <p className="text-3xl font-bold text-purple-900">
                                        {timeSlots.length > 0 ? (getTotalHours() / timeSlots.length).toFixed(1) : 0}
                                   </p>
                              </div>
                              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                                   <BarChart3 className="w-6 h-6 text-white" />
                              </div>
                         </div>
                    </Card>
               </div>

               {/* Recent Activity */}
               <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                         <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                              <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                              Hoạt Động Gần Đây
                         </h3>
                    </div>
                    <div className="space-y-3">
                         {timeSlots.slice(0, 3).map((slot, index) => (
                              <div key={slot.SlotID} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                   <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Timer className="w-4 h-4 text-blue-600" />
                                   </div>
                                   <div className="flex-1">
                                        <p className="font-medium text-gray-900">{slot.SlotName}</p>
                                        <p className="text-sm text-gray-500">
                                             {formatTime(slot.StartTime)} - {formatTime(slot.EndTime)}
                                        </p>
                                   </div>
                                   <ChevronRight className="w-4 h-4 text-gray-400" />
                              </div>
                         ))}
                    </div>
               </Card>
          </div>
     );

     const renderManage = () => (
          <div className="space-y-6">
               {/* Action Bar */}
               <div className="flex items-center justify-between">
                    <div>
                         <h3 className="text-lg font-semibold text-gray-900">Quản Lý Slot Thời Gian</h3>
                         <p className="text-gray-600">Thêm, sửa, xóa các slot thời gian</p>
                    </div>
                    <Button
                         onClick={() => handleOpenModal()}
                         className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                    >
                         <Plus className="w-4 h-4 mr-2" />
                         Thêm Slot Mới
                    </Button>
               </div>

               {/* Info Alert */}
               <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                         Slot thời gian sẽ được sử dụng để thiết lập giá và quản lý đặt sân.
                         Đảm bảo không có slot nào trùng lặp thời gian.
                    </AlertDescription>
               </Alert>

               {/* Time Slots Table */}
               <Card className="p-6">
                    <Table
                         data={paginatedTimeSlots}
                         columns={columns}
                         loading={loading}
                         emptyMessage="Chưa có slot thời gian nào"
                    />
                    {timeSlots.length > 0 && (
                         <div className="mt-4 pt-4 border-t">
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
          </div>
     );

     const renderCalendar = () => (
          <div className="space-y-6">
               <div className="flex items-center justify-between">
                    <div>
                         <h3 className="text-lg font-semibold text-gray-900">Lịch Trình Slot</h3>
                         <p className="text-gray-600">Xem lịch trình các slot thời gian trong ngày</p>
                    </div>
               </div>

               <Card className="p-6">
                    <div className="space-y-4">
                         {timeSlots.map((slot, index) => {
                              const start = new Date(`2000-01-01T${slot.StartTime}`);
                              const end = new Date(`2000-01-01T${slot.EndTime}`);
                              const duration = (end - start) / (1000 * 60 * 60);
                              const startHour = start.getHours();
                              const startMinute = start.getMinutes();
                              const leftPosition = (startHour * 60 + startMinute) / 60 * 4; // 4rem per hour
                              const width = duration * 4;

                              return (
                                   <div key={slot.SlotID} className="relative">
                                        <div className="flex items-center space-x-4 mb-2">
                                             <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                                  <Timer className="w-4 h-4 text-white" />
                                             </div>
                                             <div>
                                                  <h4 className="font-semibold text-gray-900">{slot.SlotName}</h4>
                                                  <p className="text-sm text-gray-500">
                                                       {formatTime(slot.StartTime)} - {formatTime(slot.EndTime)} ({duration} giờ)
                                                  </p>
                                             </div>
                                        </div>

                                        {/* Timeline Bar */}
                                        <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                                             <div
                                                  className="absolute top-0 h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"
                                                  style={{
                                                       left: `${leftPosition}rem`,
                                                       width: `${width}rem`
                                                  }}
                                             >
                                                  <span className="text-white text-xs font-medium">
                                                       {formatTime(slot.StartTime)} - {formatTime(slot.EndTime)}
                                                  </span>
                                             </div>
                                        </div>
                                   </div>
                              );
                         })}
                    </div>
               </Card>
          </div>
     );

     return (
          <OwnerLayout user={user} onLoggedOut={logout} isDemo={isDemo}>
               <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                         <div>
                              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                                   <Timer className="w-8 h-8 mr-3 text-blue-600" />
                                   Quản Lý Slot Thời Gian
                              </h1>
                              <p className="text-gray-600 mt-1">
                                   Thiết lập và quản lý các khung giờ hoạt động cho sân bóng
                              </p>
                         </div>
                         {isDemo && (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                   <AlertCircle className="w-4 h-4 mr-1" />
                                   Demo Mode
                              </Badge>
                         )}
                    </div>

                    {/* Navigation */}
                    <div className="border-b border-gray-200">
                         <nav className="flex space-x-8">
                              {navigationItems.map((item) => {
                                   const Icon = item.icon;
                                   return (
                                        <button
                                             key={item.id}
                                             onClick={() => setActiveTab(item.id)}
                                             className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === item.id
                                                  ? 'border-blue-500 text-blue-600'
                                                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                  }`}
                                        >
                                             <Icon className="w-4 h-4" />
                                             <span>{item.label}</span>
                                        </button>
                                   );
                              })}
                         </nav>
                    </div>

                    {/* Content */}
                    <div>
                         {activeTab === 'overview' && renderOverview()}
                         {activeTab === 'manage' && renderManage()}
                         {activeTab === 'calendar' && renderCalendar()}
                    </div>

                    {/* Add/Edit Modal */}
                    <Modal
                         isOpen={showModal}
                         onClose={handleCloseModal}
                         title={editingSlot ? 'Chỉnh Sửa Slot Thời Gian' : 'Thêm Slot Thời Gian Mới'}
                         size="lg"
                         className="max-w-2xl rounded-2xl"
                    >
                         <form onSubmit={handleSubmit} className="space-y-6">
                              {/* Quick Add Templates - Only show when creating new */}
                              {!editingSlot && (
                                   <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                                        <div className="flex items-center justify-between mb-3">
                                             <div className="flex items-center">
                                                  <Zap className="w-4 h-4 mr-2 text-blue-600" />
                                                  <span className="text-sm font-semibold text-gray-700">
                                                       Thêm Nhanh - Chọn nhiều slot để thêm cùng lúc
                                                  </span>
                                                  {selectedSlots.length > 0 && (
                                                       <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                                                            {selectedSlots.length} đã chọn
                                                       </Badge>
                                                  )}
                                             </div>
                                             <button
                                                  type="button"
                                                  onClick={handleSelectAllSlots}
                                                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center"
                                             >
                                                  {selectedSlots.length === quickSlotTemplates.length ? (
                                                       <>
                                                            <Square className="w-3 h-3 mr-1" />
                                                            Bỏ chọn tất cả
                                                       </>
                                                  ) : (
                                                       <>
                                                            <CheckSquare className="w-3 h-3 mr-1" />
                                                            Chọn tất cả
                                                       </>
                                                  )}
                                             </button>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                                             {quickSlotTemplates.map((template, index) => {
                                                  const slotKey = `${template.name}-${template.start}-${template.end}`;
                                                  const isSelected = selectedSlots.some(s => s.key === slotKey);

                                                  return (
                                                       <button
                                                            key={index}
                                                            type="button"
                                                            onClick={() => handleQuickAdd(template.name, template.start, template.end)}
                                                            className={`px-3 py-2.5 text-xs rounded-xl transition-all text-left shadow-sm ${isSelected
                                                                 ? 'bg-blue-100 border-2 border-blue-500 hover:bg-blue-200'
                                                                 : 'bg-white border border-blue-200 hover:bg-blue-50 hover:border-blue-400'
                                                                 }`}
                                                       >
                                                            <div className="flex items-center mb-1">
                                                                 {isSelected ? (
                                                                      <CheckSquare className="w-3 h-3 text-blue-600 mr-1" />
                                                                 ) : (
                                                                      <Square className="w-3 h-3 text-gray-400 mr-1" />
                                                                 )}
                                                            </div>
                                                            <div className="font-semibold text-gray-800 mb-0.5">{template.name}</div>
                                                            <div className="text-gray-600 text-xs">{template.start} - {template.end}</div>
                                                       </button>
                                                  );
                                             })}
                                        </div>
                                   </div>
                              )}

                              {/* Batch Progress */}
                              {isSubmitting && batchProgress.total > 0 && (
                                   <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <div className="flex items-center justify-between mb-2">
                                             <span className="text-sm font-medium text-blue-800">
                                                  Đang thêm slot {batchProgress.current}/{batchProgress.total}...
                                             </span>
                                             <span className="text-sm text-blue-600">
                                                  {Math.round((batchProgress.current / batchProgress.total) * 100)}%
                                             </span>
                                        </div>
                                        <div className="w-full bg-blue-200 rounded-full h-2">
                                             <div
                                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                  style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                                             ></div>
                                        </div>
                                   </div>
                              )}

                              {/* Error Alert */}
                              {formErrors.submit && (
                                   <Alert className="border-red-200 bg-red-50">
                                        <XCircle className="h-4 w-4 text-red-600" />
                                        <AlertDescription className="text-red-800">
                                             {formErrors.submit}
                                        </AlertDescription>
                                   </Alert>
                              )}

                              {/* Divider */}
                              {!editingSlot && selectedSlots.length > 0 && (
                                   <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                             <div className="w-full border-t border-gray-300"></div>
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                             <span className="bg-white px-2 text-gray-500">Hoặc thêm thủ công</span>
                                        </div>
                                   </div>
                              )}

                              {/* Manual Form */}
                              <div>
                                   {/* Slot Name */}
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                             Tên Slot *
                                        </label>
                                        <Input
                                             type="text"
                                             value={formData.SlotName}
                                             onChange={(e) => {
                                                  setFormData({ ...formData, SlotName: e.target.value });
                                                  if (formErrors.SlotName) {
                                                       setFormErrors({ ...formErrors, SlotName: '' });
                                                  }
                                             }}
                                             placeholder="Ví dụ: Slot Sáng, Slot Chiều, Slot Tối..."
                                             className={formErrors.SlotName ? 'border-red-500' : ''}
                                             required={selectedSlots.length === 0}
                                        />
                                        {formErrors.SlotName && (
                                             <p className="mt-1 text-sm text-red-600 flex items-center">
                                                  <AlertCircle className="w-3 h-3 mr-1" />
                                                  {formErrors.SlotName}
                                             </p>
                                        )}
                                   </div>

                                   {/* Field ID */}
                                   <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                             Sân áp dụng (Field ID) *
                                        </label>
                                        <Input
                                             type="number"
                                             value={formData.FieldId}
                                             onChange={(e) => {
                                                  setFormData({ ...formData, FieldId: e.target.value });
                                                  if (formErrors.FieldId) {
                                                       setFormErrors({ ...formErrors, FieldId: '' });
                                                  }
                                             }}
                                             placeholder="Ví dụ: 49"
                                             className={formErrors.FieldId ? 'border-red-500' : ''}
                                             required={selectedSlots.length === 0}
                                        />
                                        {formErrors.FieldId && (
                                             <p className="mt-1 text-sm text-red-600 flex items-center">
                                                  <AlertCircle className="w-3 h-3 mr-1" />
                                                  {formErrors.FieldId}
                                             </p>
                                        )}
                                   </div>

                                   {/* Time Selection */}
                                   <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-2">
                                                  <Clock className="w-4 h-4 inline mr-1 text-green-600" />
                                                  Giờ Bắt Đầu *
                                             </label>
                                             <Input
                                                  type="time"
                                                  value={formData.StartTime}
                                                  onChange={(e) => {
                                                       setFormData({ ...formData, StartTime: e.target.value });
                                                       if (formErrors.StartTime || formErrors.EndTime) {
                                                            setFormErrors({ ...formErrors, StartTime: '', EndTime: '' });
                                                       }
                                                  }}
                                                  className={formErrors.StartTime ? 'border-red-500' : ''}
                                                  required={selectedSlots.length === 0}
                                             />
                                             {formErrors.StartTime && (
                                                  <p className="mt-1 text-sm text-red-600 flex items-center">
                                                       <AlertCircle className="w-3 h-3 mr-1" />
                                                       {formErrors.StartTime}
                                                  </p>
                                             )}
                                        </div>
                                        <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-2">
                                                  <Clock className="w-4 h-4 inline mr-1 text-red-600" />
                                                  Giờ Kết Thúc *
                                             </label>
                                             <Input
                                                  type="time"
                                                  value={formData.EndTime}
                                                  onChange={(e) => {
                                                       setFormData({ ...formData, EndTime: e.target.value });
                                                       if (formErrors.EndTime) {
                                                            setFormErrors({ ...formErrors, EndTime: '' });
                                                       }
                                                  }}
                                                  className={formErrors.EndTime ? 'border-red-500' : ''}
                                                  required={selectedSlots.length === 0}
                                             />
                                             {formErrors.EndTime && (
                                                  <p className="mt-1 text-sm text-red-600 flex items-center">
                                                       <AlertCircle className="w-3 h-3 mr-1" />
                                                       {formErrors.EndTime}
                                                  </p>
                                             )}
                                        </div>
                                   </div>
                              </div>

                              {/* Duration Preview */}
                              {formData.StartTime && formData.EndTime && calculateDuration() && (
                                   <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                                        <div className="flex items-center justify-between">
                                             <div className="flex items-center">
                                                  <Timer className="w-5 h-5 text-green-600 mr-2" />
                                                  <span className="text-sm font-medium text-gray-700">Thời lượng slot:</span>
                                             </div>
                                             <Badge variant="secondary" className="bg-green-100 text-green-800 text-base px-3 py-1">
                                                  {calculateDuration().toFixed(1)} giờ
                                             </Badge>
                                        </div>
                                        <div className="mt-2 text-sm text-gray-600">
                                             <span className="font-medium">{formData.StartTime}</span>
                                             <span className="mx-2">→</span>
                                             <span className="font-medium">{formData.EndTime}</span>
                                        </div>
                                   </div>
                              )}

                              {/* Preview Card */}
                              {formData.SlotName && formData.StartTime && formData.EndTime && calculateDuration() && (
                                   <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <div className="flex items-center mb-2">
                                             <Info className="w-4 h-4 mr-2 text-blue-600" />
                                             <span className="text-sm font-semibold text-gray-700">Preview Slot</span>
                                        </div>
                                        <div className="bg-white p-3 rounded border border-blue-200">
                                             <div className="flex items-center justify-between">
                                                  <div>
                                                       <div className="font-semibold text-gray-900">{formData.SlotName}</div>
                                                       <div className="text-sm text-gray-600 mt-1">
                                                            {formData.StartTime} - {formData.EndTime}
                                                       </div>
                                                  </div>
                                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                                       {calculateDuration().toFixed(1)}h
                                                  </Badge>
                                             </div>
                                        </div>
                                   </div>
                              )}

                              {/* Action Buttons */}
                              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                   <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCloseModal}
                                        disabled={isSubmitting}
                                   >
                                        <X className="w-4 h-4 mr-2" />
                                        Hủy
                                   </Button>
                                   <Button
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                        disabled={isSubmitting || (!editingSlot && selectedSlots.length === 0 && !formData.SlotName)}
                                   >
                                        {isSubmitting ? (
                                             <>
                                                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                  {batchProgress.total > 0
                                                       ? `Đang thêm ${batchProgress.current}/${batchProgress.total}...`
                                                       : 'Đang xử lý...'
                                                  }
                                             </>
                                        ) : (
                                             <>
                                                  {selectedSlots.length > 0 ? (
                                                       <>
                                                            <CheckSquare className="w-4 h-4 mr-2" />
                                                            Thêm {selectedSlots.length} Slot
                                                       </>
                                                  ) : (
                                                       <>
                                                            <Save className="w-4 h-4 mr-2" />
                                                            {editingSlot ? 'Cập Nhật' : 'Tạo Slot'}
                                                       </>
                                                  )}
                                             </>
                                        )}
                                   </Button>
                              </div>
                         </form>
                    </Modal>

                    {/* Demo Restricted Modal */}
                    <DemoRestrictedModal
                         isOpen={showDemoRestrictedModal}
                         onClose={() => setShowDemoRestrictedModal(false)}
                         featureName="Quản Lý Slot Thời Gian"
                    />
               </div>
          </OwnerLayout>
     );
}
