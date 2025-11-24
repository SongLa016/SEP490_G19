import React, { useState, useEffect, useCallback, useMemo } from "react";
import OwnerLayout from "../layouts/OwnerLayout";
import { useAuth } from "../../../contexts/AuthContext";
import {
     Card,
     Button,
     Badge,
     Alert,
     AlertDescription,
     Modal,
     Input,
     Select,
     SelectContent,
     SelectItem,
     SelectTrigger,
     SelectValue
} from "../../../shared/components/ui";
import {
     Clock,
     Calendar,
     ChevronLeft,
     ChevronRight,
     Loader2,
     Info,
     BarChart3,
     Filter,
     DollarSign,
     Plus,
     Timer,
     Edit,
     Trash2,
     Save,
     X
} from "lucide-react";
import { fetchAllComplexesWithFields } from "../../../shared/services/fields";
import { fetchTimeSlots, createTimeSlot, updateTimeSlot, deleteTimeSlot } from "../../../shared/services/timeSlots";
import { createFieldSchedule, fetchFieldSchedulesByField, fetchFieldSchedules, updateFieldScheduleStatus, deleteFieldSchedule } from "../../../shared/services/fieldSchedules";
import Swal from "sweetalert2";

// Components đã được tách ra - sẵn sàng để sử dụng khi cần
// import {
//      StatisticsCards,
//      WeekNavigator,
//      ScheduleTable,
//      TimeSlotModal,
//      FieldCard
// } from "./ScheduleManagement";

export default function ScheduleManagement({ isDemo = false }) {
     const { user, logout } = useAuth();
     const [loading, setLoading] = useState(true);
     const [complexes, setComplexes] = useState([]);
     const [selectedComplex, setSelectedComplex] = useState(null);
     const [fields, setFields] = useState([]);
     const [timeSlots, setTimeSlots] = useState([]);
     const [currentWeek, setCurrentWeek] = useState(new Date());
     const [filterStatus, setFilterStatus] = useState('all'); // all, booked, available
     const [activeTab, setActiveTab] = useState('schedule'); // schedule, timeslots, manage-schedules
     const [showSlotModal, setShowSlotModal] = useState(false);
     const [editingSlot, setEditingSlot] = useState(null);
     const [slotFormData, setSlotFormData] = useState({
          fieldId: '',
          slotName: '',
          startTime: '',
          endTime: ''
     });
     const [slotFormErrors, setSlotFormErrors] = useState({});
     const [isSubmittingSlot, setIsSubmittingSlot] = useState(false);
     const [selectedQuickSlots, setSelectedQuickSlots] = useState([]);
     const [selectedFieldFilter, setSelectedFieldFilter] = useState('all'); // Filter for timeslots tab
     const [selectedFieldForSchedule, setSelectedFieldForSchedule] = useState('all'); // Filter for schedule tab
     const [fieldSchedules, setFieldSchedules] = useState([]); // Danh sách FieldSchedules
     const [loadingSchedules, setLoadingSchedules] = useState(false);
     const [scheduleFilterField, setScheduleFilterField] = useState('all'); // Filter cho bảng quản lý
     const [scheduleFilterStatus, setScheduleFilterStatus] = useState('all'); // Filter status cho bảng
     const [scheduleFilterDate, setScheduleFilterDate] = useState(''); // Filter date cho bảng
     const [showScheduleModal, setShowScheduleModal] = useState(false); // Modal thêm lịch trình
     const [scheduleFormData, setScheduleFormData] = useState({
          fieldId: '',
          slotId: '',
          date: '',
          status: 'Available'
     });
     const [scheduleFormErrors, setScheduleFormErrors] = useState({});
     const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);
     // TODO: Add bookings state when API is ready
     // const [bookings, setBookings] = useState([]);

     // Quick slot templates
     const quickSlotTemplates = [
          { name: 'Slot 1', start: '06:00', end: '07:30' },
          { name: 'Slot 2', start: '07:30', end: '09:00' },
          { name: 'Slot 3', start: '09:00', end: '10:30' },
          { name: 'Slot 4', start: '10:30', end: '12:00' },
          { name: 'Slot 5', start: '12:00', end: '13:30' },
          { name: 'Slot 6', start: '13:30', end: '15:00' },
          { name: 'Slot 7', start: '15:00', end: '16:30' },
          { name: 'Slot 8', start: '16:30', end: '18:00' },
          { name: 'Slot 9', start: '18:00', end: '19:30' },
          { name: 'Slot 10', start: '19:30', end: '21:00' },
          { name: 'Slot 11', start: '21:00', end: '22:30' },
          { name: 'Slot 12', start: '22:30', end: '00:00' },
     ];

     // Get current user ID
     const currentUserId = user?.userID || user?.UserID || user?.id || user?.userId;

     // Check if a time slot already exists for a field
     const isSlotExistsForField = useCallback((fieldId, startTime, endTime) => {
          if (!fieldId) return false;

          // Filter timeSlots by fieldId first, then check time overlap
          return timeSlots.some(slot => {
               // Check if this slot belongs to the specified field
               const slotFieldId = slot.fieldId ?? slot.FieldId;
               if (!slotFieldId || Number(slotFieldId) !== Number(fieldId)) {
                    return false; // Skip slots from other fields
               }

               // Check if times overlap
               const slotStart = slot.startTime?.substring(0, 5) || '';
               const slotEnd = slot.endTime?.substring(0, 5) || '';
               return startTime < slotEnd && endTime > slotStart;
          });
     }, [timeSlots]);

     // Load timeslots for a specific field
     const loadTimeSlotsForField = useCallback(async (fieldId) => {
          if (!fieldId) {
               setTimeSlots([]);
               return;
          }

          try {
               const slotsResponse = await fetchTimeSlots(fieldId);
               if (slotsResponse.success) {
                    setTimeSlots(slotsResponse.data || []);
               } else {
                    setTimeSlots([]);
               }
          } catch (error) {
               console.error('Error loading timeslots for field:', error);
               setTimeSlots([]);
          }
     }, []);

     // Handle Time Slot Modal
     const handleOpenSlotModal = (slot = null) => {
          if (slot) {
               setEditingSlot(slot);
               const fieldIdValue = slot.fieldId || slot.FieldId || '';
               setSlotFormData({
                    fieldId: fieldIdValue ? fieldIdValue.toString() : '',
                    slotName: slot.name || '',
                    startTime: slot.startTime?.substring(0, 5) || '',
                    endTime: slot.endTime?.substring(0, 5) || ''
               });
               // Load timeslots for this field
               if (fieldIdValue) {
                    loadTimeSlotsForField(fieldIdValue);
               }
          } else {
               setEditingSlot(null);
               setSlotFormData({
                    fieldId: '',
                    slotName: '',
                    startTime: '',
                    endTime: ''
               });
          }
          setSlotFormErrors({});
          setSelectedQuickSlots([]);
          setShowSlotModal(true);
     };

     // Handle quick slot selection
     const handleQuickSlotSelect = (template) => {
          const slotKey = `${template.start}-${template.end}`;

          // Check if already exists for selected field
          if (slotFormData.fieldId && isSlotExistsForField(slotFormData.fieldId, template.start, template.end)) {
               return; // Don't allow selection of existing slots
          }

          // Toggle selection
          if (selectedQuickSlots.some(s => s.key === slotKey)) {
               setSelectedQuickSlots(selectedQuickSlots.filter(s => s.key !== slotKey));
          } else {
               setSelectedQuickSlots([...selectedQuickSlots, {
                    key: slotKey,
                    name: template.name,
                    start: template.start,
                    end: template.end
               }]);
          }
     };

     const handleCloseSlotModal = () => {
          setShowSlotModal(false);
          setEditingSlot(null);
          setSlotFormData({
               fieldId: '',
               slotName: '',
               startTime: '',
               endTime: ''
          });
          setSlotFormErrors({});
          setSelectedQuickSlots([]);
     };

     const validateSlotForm = () => {
          const errors = {};

          // If using quick slots, skip individual validation
          if (selectedQuickSlots.length > 0) {
               if (!slotFormData.fieldId) {
                    errors.fieldId = 'Vui lòng chọn sân';
               }
               setSlotFormErrors(errors);
               return Object.keys(errors).length === 0;
          }

          if (!slotFormData.fieldId) {
               errors.fieldId = 'Vui lòng chọn sân';
          }

          if (!slotFormData.slotName.trim()) {
               errors.slotName = 'Vui lòng nhập tên slot';
          }

          if (!slotFormData.startTime) {
               errors.startTime = 'Vui lòng chọn giờ bắt đầu';
          }

          if (!slotFormData.endTime) {
               errors.endTime = 'Vui lòng chọn giờ kết thúc';
          }

          if (slotFormData.startTime && slotFormData.endTime) {
               if (slotFormData.startTime >= slotFormData.endTime) {
                    errors.endTime = 'Giờ kết thúc phải lớn hơn giờ bắt đầu';
               }
          }

          setSlotFormErrors(errors);
          return Object.keys(errors).length === 0;
     };

     const handleSubmitSlot = async (e) => {
          e.preventDefault();

          if (!validateSlotForm()) {
               return;
          }

          // Validate that fieldId belongs to owner's fields
          const fieldId = parseInt(slotFormData.fieldId);
          const fieldBelongsToOwner = fields.some(f => f.fieldId === fieldId);

          if (!fieldBelongsToOwner) {
               await Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: 'Sân này không thuộc quyền quản lý của bạn',
                    confirmButtonColor: '#ef4444'
               });
               return;
          }

          setIsSubmittingSlot(true);
          try {
               // Handle batch creation from quick slots
               if (selectedQuickSlots.length > 0) {
                    let successCount = 0;
                    let errorCount = 0;
                    const errors = [];

                    for (const quickSlot of selectedQuickSlots) {
                         try {
                              // Check if slot already exists for this field
                              const exists = isSlotExistsForField(fieldId, quickSlot.start, quickSlot.end);
                              if (exists) {
                                   errorCount++;
                                   errors.push(`${quickSlot.name}: Slot đã tồn tại cho sân này`);
                                   continue;
                              }

                              // Get field name to make slot name unique
                              const field = fields.find(f => f.fieldId === fieldId);
                              const fieldName = field?.name || `Field${fieldId}`;
                              const uniqueSlotName = `${quickSlot.name} - ${fieldName}`;

                              console.log(`Creating slot: ${uniqueSlotName} for field ${fieldId}`);
                              const result = await createTimeSlot({
                                   fieldId: fieldId,
                                   slotName: uniqueSlotName,
                                   startTime: quickSlot.start,
                                   endTime: quickSlot.end
                              });

                              if (result.success) {
                                   successCount++;
                                   console.log(`✓ Created: ${quickSlot.name}`);
                              } else {
                                   errorCount++;
                                   errors.push(`${quickSlot.name}: ${result.error}`);
                                   console.error(`✗ Failed: ${quickSlot.name} - ${result.error}`);
                              }

                              // Add small delay between requests to avoid overwhelming the server
                              await new Promise(resolve => setTimeout(resolve, 200));
                         } catch (error) {
                              errorCount++;
                              const errorMsg = error.message || 'Lỗi không xác định';
                              errors.push(`${quickSlot.name}: ${errorMsg}`);
                              console.error(`✗ Error: ${quickSlot.name}`, error);
                         }
                    }

                    if (errorCount === 0) {
                         await Swal.fire({
                              icon: 'success',
                              title: 'Thêm slots thành công!',
                              text: `Đã thêm ${successCount} slots cho sân`,
                              confirmButtonColor: '#10b981',
                              timer: 2000
                         });
                         handleCloseSlotModal();
                         await loadData();
                    } else {
                         const errorList = errors.slice(0, 5); // Chỉ hiển thị 5 lỗi đầu
                         const moreErrors = errors.length > 5 ? `<p class="text-xs text-gray-500 mt-2">...và ${errors.length - 5} lỗi khác</p>` : '';

                         await Swal.fire({
                              icon: errorCount === selectedQuickSlots.length ? 'error' : 'warning',
                              title: errorCount === selectedQuickSlots.length ? 'Thêm slots thất bại' : 'Thêm một phần thành công',
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
                              confirmButtonColor: errorCount === selectedQuickSlots.length ? '#ef4444' : '#f59e0b',
                              width: '600px'
                         });
                         if (successCount > 0) {
                              handleCloseSlotModal();
                              await loadData();
                         }
                    }
                    return;
               }

               // Handle single slot creation/update
               let result;
               if (editingSlot) {
                    result = await updateTimeSlot(editingSlot.slotId, {
                         fieldId: fieldId,
                         slotName: slotFormData.slotName,
                         startTime: slotFormData.startTime,
                         endTime: slotFormData.endTime
                    });
               } else {
                    result = await createTimeSlot({
                         fieldId: fieldId,
                         slotName: slotFormData.slotName,
                         startTime: slotFormData.startTime,
                         endTime: slotFormData.endTime
                    });
               }

               if (result.success) {
                    await Swal.fire({
                         icon: 'success',
                         title: editingSlot ? 'Cập nhật slot thành công!' : 'Tạo slot thành công!',
                         text: `${slotFormData.slotName} (${slotFormData.startTime} - ${slotFormData.endTime})`,
                         confirmButtonColor: '#10b981'
                    });
                    handleCloseSlotModal();
                    await loadData();
               } else {
                    await Swal.fire({
                         icon: 'error',
                         title: 'Không thể lưu slot',
                         text: result.error || 'Có lỗi xảy ra',
                         confirmButtonColor: '#ef4444'
                    });
               }
          } catch (error) {
               console.error('Error saving slot:', error);
               await Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: error.message || 'Có lỗi xảy ra khi lưu slot',
                    confirmButtonColor: '#ef4444'
               });
          } finally {
               setIsSubmittingSlot(false);
          }
     };

     const handleDeleteSlot = async (slotId) => {
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
               console.error('Error deleting slot:', error);
               await Swal.fire({
                    title: 'Có lỗi xảy ra',
                    text: 'Có lỗi xảy ra khi xóa slot thời gian',
                    icon: 'error',
                    confirmButtonText: 'OK'
               });
          }
     };

     const formatTime = (timeString) => {
          if (!timeString) return '00:00';
          const [hours, minutes] = timeString.split(':');
          return `${hours || '00'}:${minutes || '00'}`;
     };

     // Load data
     const loadData = useCallback(async () => {
          try {
               setLoading(true);

               // Fetch all complexes with fields
               const allComplexesWithFields = await fetchAllComplexesWithFields();

               // Filter only owner's complexes
               const ownerComplexes = allComplexesWithFields.filter(
                    complex => complex.ownerId === currentUserId || complex.ownerId === Number(currentUserId)
               );

               setComplexes(ownerComplexes);

               // Select first complex by default
               if (ownerComplexes.length > 0 && !selectedComplex) {
                    setSelectedComplex(ownerComplexes[0]);
                    setFields(ownerComplexes[0].fields || []);
               }

               // Fetch time slots
               const slotsResponse = await fetchTimeSlots();
               if (slotsResponse.success) {
                    setTimeSlots(slotsResponse.data || []);
               }

               // Fetch field schedules
               const schedulesResponse = await fetchFieldSchedules();
               if (schedulesResponse.success) {
                    setFieldSchedules(schedulesResponse.data || []);
               }
          } catch (error) {
               console.error('Error loading data:', error);
               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi tải dữ liệu',
                    text: error.message || 'Không thể tải dữ liệu',
                    confirmButtonColor: '#ef4444'
               });
          } finally {
               setLoading(false);
          }
     }, [currentUserId, selectedComplex]);

     useEffect(() => {
          loadData();
     }, [loadData]);

     // Load FieldSchedules
     const loadFieldSchedules = useCallback(async () => {
          try {
               setLoadingSchedules(true);
               let result;

               // Nếu có filter field, lấy theo field
               if (scheduleFilterField !== 'all' && selectedComplex) {
                    const fieldId = Number(scheduleFilterField);
                    result = await fetchFieldSchedulesByField(fieldId);
               } else {
                    // Lấy tất cả schedules
                    result = await fetchFieldSchedules();
               }

               if (result.success && result.data) {
                    // Filter theo complex của owner
                    let schedules = result.data;
                    if (selectedComplex) {
                         const fieldIds = (selectedComplex.fields || []).map(f => f.fieldId);
                         schedules = schedules.filter(s =>
                              fieldIds.includes(s.fieldId || s.FieldID)
                         );
                    }
                    setFieldSchedules(schedules);
               } else {
                    setFieldSchedules([]);
               }
          } catch (error) {
               console.error('Error loading field schedules:', error);
               setFieldSchedules([]);
          } finally {
               setLoadingSchedules(false);
          }
     }, [scheduleFilterField, selectedComplex]);

     useEffect(() => {
          if (activeTab === 'manage-schedules') {
               loadFieldSchedules();
          }
     }, [activeTab, loadFieldSchedules, scheduleFilterField]);

     // Handle update schedule status
     const handleUpdateScheduleStatus = async (scheduleId, newStatus) => {
          try {
               const result = await updateFieldScheduleStatus(scheduleId, newStatus);
               if (result.success) {
                    await Swal.fire({
                         icon: 'success',
                         title: 'Cập nhật thành công!',
                         text: `Đã cập nhật trạng thái sang "${newStatus}"`,
                         confirmButtonColor: '#10b981'
                    });
                    await loadFieldSchedules();
               } else {
                    await Swal.fire({
                         icon: 'error',
                         title: 'Lỗi',
                         text: result.error || 'Không thể cập nhật trạng thái',
                         confirmButtonColor: '#ef4444'
                    });
               }
          } catch (error) {
               console.error('Error updating schedule status:', error);
               await Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: error.message || 'Có lỗi xảy ra',
                    confirmButtonColor: '#ef4444'
               });
          }
     };

     // Handle open schedule modal
     const handleOpenScheduleModal = () => {
          setScheduleFormData({
               fieldId: scheduleFilterField !== 'all' ? scheduleFilterField : '',
               slotId: '',
               date: '',
               status: 'Available'
          });
          setScheduleFormErrors({});
          setShowScheduleModal(true);
     };

     // Handle close schedule modal
     const handleCloseScheduleModal = () => {
          setShowScheduleModal(false);
          setScheduleFormData({
               fieldId: '',
               slotId: '',
               date: '',
               status: 'Available'
          });
          setScheduleFormErrors({});
     };

     // Handle submit schedule
     const handleSubmitSchedule = async (e) => {
          e.preventDefault();

          // Validate
          const errors = {};
          if (!scheduleFormData.fieldId) errors.fieldId = 'Vui lòng chọn sân';
          if (!scheduleFormData.slotId) errors.slotId = 'Vui lòng chọn slot';
          if (!scheduleFormData.date) errors.date = 'Vui lòng chọn ngày';

          if (Object.keys(errors).length > 0) {
               setScheduleFormErrors(errors);
               return;
          }

          setIsSubmittingSchedule(true);
          try {
               // Tìm field và slot để lấy thông tin
               const field = fields.find(f => f.fieldId.toString() === scheduleFormData.fieldId);
               const slot = timeSlots.find(s => {
                    const slotId = s.slotId || s.SlotID;
                    return slotId.toString() === scheduleFormData.slotId;
               });

               if (!field || !slot) {
                    await Swal.fire({
                         icon: 'error',
                         title: 'Lỗi',
                         text: 'Không tìm thấy thông tin sân hoặc slot',
                         confirmButtonColor: '#ef4444'
                    });
                    return;
               }

               // Lấy thông tin time từ slot
               const slotStartTime = slot.startTime || slot.StartTime || '00:00';
               const slotEndTime = slot.endTime || slot.EndTime || '00:00';
               const slotName = slot.slotName || slot.SlotName || slot.name || "";

               // Tạo schedule với đầy đủ thông tin
               const result = await createFieldSchedule({
                    scheduleId: 0, // Luôn là 0 khi tạo mới
                    fieldId: Number(scheduleFormData.fieldId),
                    fieldName: String(field.name || ""),
                    slotId: Number(scheduleFormData.slotId),
                    slotName: String(slotName),
                    date: scheduleFormData.date, // Format: "YYYY-MM-DD"
                    startTime: slotStartTime, // Format: "HH:MM" hoặc "HH:MM:SS"
                    endTime: slotEndTime, // Format: "HH:MM" hoặc "HH:MM:SS"
                    status: String(scheduleFormData.status || "Available")
               });

               if (result.success) {
                    await Swal.fire({
                         icon: 'success',
                         title: 'Tạo lịch trình thành công!',
                         text: `Đã tạo lịch trình cho ${field.name} - ${slot.slotName || slot.SlotName || slot.name}`,
                         confirmButtonColor: '#10b981'
                    });
                    handleCloseScheduleModal();
                    await loadFieldSchedules();
               } else {
                    await Swal.fire({
                         icon: 'error',
                         title: 'Lỗi',
                         text: result.error || 'Không thể tạo lịch trình',
                         confirmButtonColor: '#ef4444'
                    });
               }
          } catch (error) {
               console.error('Error creating schedule:', error);
               await Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: error.message || 'Có lỗi xảy ra',
                    confirmButtonColor: '#ef4444'
               });
          } finally {
               setIsSubmittingSchedule(false);
          }
     };

     // Handle delete schedule
     const handleDeleteSchedule = async (scheduleId, scheduleInfo) => {
          const result = await Swal.fire({
               title: 'Xác nhận xóa',
               html: `Bạn có chắc muốn xóa lịch trình này?<br><small>${scheduleInfo}</small>`,
               icon: 'warning',
               showCancelButton: true,
               confirmButtonColor: '#ef4444',
               cancelButtonColor: '#6b7280',
               confirmButtonText: 'Xóa',
               cancelButtonText: 'Hủy'
          });

          if (result.isConfirmed) {
               try {
                    const deleteResult = await deleteFieldSchedule(scheduleId);
                    if (deleteResult.success) {
                         await Swal.fire({
                              icon: 'success',
                              title: 'Xóa thành công!',
                              text: 'Đã xóa lịch trình',
                              confirmButtonColor: '#10b981'
                         });
                         await loadFieldSchedules();
                    } else {
                         await Swal.fire({
                              icon: 'error',
                              title: 'Lỗi',
                              text: deleteResult.error || 'Không thể xóa lịch trình',
                              confirmButtonColor: '#ef4444'
                         });
                    }
               } catch (error) {
                    console.error('Error deleting schedule:', error);
                    await Swal.fire({
                         icon: 'error',
                         title: 'Lỗi',
                         text: error.message || 'Có lỗi xảy ra',
                         confirmButtonColor: '#ef4444'
                    });
               }
          }
     };

     // Get week dates
     const getWeekDates = () => {
          const start = new Date(currentWeek);
          start.setDate(start.getDate() - start.getDay() + 1); // Monday

          const dates = [];
          for (let i = 0; i < 7; i++) {
               const date = new Date(start);
               date.setDate(start.getDate() + i);
               dates.push(date);
          }
          return dates;
     };

     const weekDates = getWeekDates();

     // Navigate week
     const goToPreviousWeek = () => {
          const newDate = new Date(currentWeek);
          newDate.setDate(newDate.getDate() - 7);
          setCurrentWeek(newDate);
     };

     const goToNextWeek = () => {
          const newDate = new Date(currentWeek);
          newDate.setDate(newDate.getDate() + 7);
          setCurrentWeek(newDate);
     };

     const goToToday = () => {
          setCurrentWeek(new Date());
     };

     // Format date
     const formatDate = (date) => {
          return `${date.getDate()}/${date.getMonth() + 1}`;
     };

     const getDayName = (date) => {
          const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
          return days[date.getDay()];
     };

     // Check if date is today
     const isToday = (date) => {
          const today = new Date();
          return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
     };

     // Handle complex change
     const handleComplexChange = (complex) => {
          setSelectedComplex(complex);
          setFields(complex.fields || []);
     };

     // Check if schedule exists for field/date/slot
     const getScheduleForSlot = (fieldId, date, slotId) => {
          const dateStr = date.toISOString().split('T')[0];
          return fieldSchedules.find(schedule => {
               const scheduleFieldId = schedule.fieldId ?? schedule.FieldId;
               const scheduleSlotId = schedule.slotId ?? schedule.SlotId ?? schedule.SlotID;

               // Parse schedule date
               let scheduleDateStr = '';
               if (typeof schedule.date === 'string') {
                    scheduleDateStr = schedule.date.split('T')[0];
               } else if (schedule.date && schedule.date.year) {
                    scheduleDateStr = `${schedule.date.year}-${String(schedule.date.month).padStart(2, '0')}-${String(schedule.date.day).padStart(2, '0')}`;
               }

               return Number(scheduleFieldId) === Number(fieldId) &&
                    Number(scheduleSlotId) === Number(slotId) &&
                    scheduleDateStr === dateStr;
          });
     };

     // Check if slot is booked
     const isSlotBooked = (fieldId, date, slotId) => {
          const schedule = getScheduleForSlot(fieldId, date, slotId);
          // Nếu có schedule và status là "Booked" thì coi như đã đặt
          return schedule && (schedule.status === 'Booked' || schedule.status === 'booked');
     };

     // Get booking info
     const getBookingInfo = (fieldId, date, slotId) => {
          const schedule = getScheduleForSlot(fieldId, date, slotId);
          if (!schedule) return null;

          // TODO: Lấy thông tin booking thực tế từ API
          return {
               customerName: 'Khách hàng',
               customerPhone: '0912345678',
               status: schedule.status || 'Available'
          };
     };

     // Get field price for slot (TODO: Replace with real API data)
     const getFieldPrice = (field, _slotId) => {
          // Return field's base price per hour
          return field.pricePerHour || 0;
     };

     // Calculate statistics
     const statistics = useMemo(() => {
          if (!fields.length || !timeSlots.length) {
               return {
                    totalSlots: 0,
                    bookedSlots: 0,
                    availableSlots: 0,
                    occupancyRate: 0
               };
          }

          const totalSlots = fields.length * timeSlots.length * 7; // 7 days
          let bookedSlots = 0;

          fields.forEach(field => {
               timeSlots.forEach(slot => {
                    weekDates.forEach(date => {
                         const slotId = slot.slotId || slot.SlotID;
                         if (isSlotBooked(field.fieldId, date, slotId)) {
                              bookedSlots++;
                         }
                    });
               });
          });

          return {
               totalSlots,
               bookedSlots,
               availableSlots: totalSlots - bookedSlots,
               occupancyRate: totalSlots > 0 ? ((bookedSlots / totalSlots) * 100).toFixed(1) : 0
          };
     }, [fields, isSlotBooked, timeSlots, weekDates]);

     if (loading) {
          return (
               <OwnerLayout user={user} onLoggedOut={logout} isDemo={isDemo}>
                    <div className="flex items-center justify-center h-64">
                         <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                    </div>
               </OwnerLayout>
          );
     }

     if (complexes.length === 0) {
          return (
               <OwnerLayout user={user} onLoggedOut={logout} isDemo={isDemo}>
                    <div className="space-y-6">
                         <div className="flex items-center justify-between">
                              <div>
                                   <h1 className="text-3xl font-bold text-gray-900">Quản lý lịch trình</h1>
                                   <p className="text-gray-600 mt-1">Xem lịch đặt sân theo tuần</p>
                              </div>
                         </div>

                         <Card className="p-12">
                              <div className="text-center">
                                   <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                   <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có khu sân nào</h3>
                                   <p className="text-gray-500">Vui lòng thêm khu sân để quản lý lịch trình</p>
                              </div>
                         </Card>
                    </div>
               </OwnerLayout>
          );
     }

     return (
          <OwnerLayout user={user} onLoggedOut={logout} isDemo={isDemo}>
               <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between flex-wrap gap-4">
                         <div>
                              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                   <Timer className="w-8 h-8 text-teal-600" />
                                   Lịch trình & Time Slots
                              </h1>
                              <p className="text-gray-600 mt-1">Quản lý khung giờ và xem lịch đặt sân</p>
                         </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                         <nav className="flex space-x-8">
                              <button
                                   onClick={() => setActiveTab('schedule')}
                                   className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'schedule'
                                        ? 'border-teal-500 text-teal-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                              >
                                   <Calendar className="w-4 h-4" />
                                   <span>Lịch trình</span>
                              </button>
                              <button
                                   onClick={() => setActiveTab('timeslots')}
                                   className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'timeslots'
                                        ? 'border-teal-500 text-teal-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                              >
                                   <Timer className="w-4 h-4" />
                                   <span>Quản lý Time Slots</span>
                              </button>
                              <button
                                   onClick={() => setActiveTab('manage-schedules')}
                                   className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'manage-schedules'
                                        ? 'border-teal-500 text-teal-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                              >
                                   <BarChart3 className="w-4 h-4" />
                                   <span>Quản lý Lịch trình</span>
                              </button>
                         </nav>
                    </div>

                    {/* Schedule Tab Content */}
                    {activeTab === 'schedule' && (
                         <>
                              {/* Info Alert */}
                              {timeSlots.length === 0 && (
                                   <Alert className="border-amber-200 bg-amber-50">
                                        <Info className="h-4 w-4 text-amber-600" />
                                        <AlertDescription className="text-amber-800">
                                             Bạn chưa có Time Slot nào. Vui lòng chuyển sang tab{' '}
                                             <button
                                                  onClick={() => setActiveTab('timeslots')}
                                                  className="underline font-semibold hover:text-amber-900"
                                             >
                                                  Quản lý Time Slots
                                             </button>
                                             {' '}để tạo khung giờ hoạt động.
                                        </AlertDescription>
                                   </Alert>
                              )}

                              {/* Statistics Cards */}
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                   <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                                        <div className="flex items-center justify-between">
                                             <div>
                                                  <p className="text-sm font-medium text-blue-600">Tổng Slots</p>
                                                  <p className="text-2xl font-bold text-blue-900">{statistics.totalSlots}</p>
                                             </div>
                                             <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                                  <BarChart3 className="w-5 h-5 text-white" />
                                             </div>
                                        </div>
                                   </Card>

                                   <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                                        <div className="flex items-center justify-between">
                                             <div>
                                                  <p className="text-sm font-medium text-green-600">Đã đặt</p>
                                                  <p className="text-2xl font-bold text-green-900">{statistics.bookedSlots}</p>
                                             </div>
                                             <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                                                  <Calendar className="w-5 h-5 text-white" />
                                             </div>
                                        </div>
                                   </Card>

                                   <Card className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
                                        <div className="flex items-center justify-between">
                                             <div>
                                                  <p className="text-sm font-medium text-gray-600">Còn trống</p>
                                                  <p className="text-2xl font-bold text-gray-900">{statistics.availableSlots}</p>
                                             </div>
                                             <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
                                                  <Clock className="w-5 h-5 text-white" />
                                             </div>
                                        </div>
                                   </Card>

                                   <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                                        <div className="flex items-center justify-between">
                                             <div>
                                                  <p className="text-sm font-medium text-purple-600">Tỷ lệ lấp đầy</p>
                                                  <p className="text-2xl font-bold text-purple-900">{statistics.occupancyRate}%</p>
                                             </div>
                                             <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                                                  <BarChart3 className="w-5 h-5 text-white" />
                                             </div>
                                        </div>
                                   </Card>
                              </div>

                              {/* Complex Selector & Filter */}
                              <Card className="p-4">
                                   <div className="flex items-center justify-between gap-4 flex-wrap">
                                        <div className="flex items-center gap-4 flex-wrap">
                                             <span className="font-medium text-gray-700">Khu sân:</span>
                                             <Select
                                                  value={selectedComplex?.complexId?.toString()}
                                                  onValueChange={(value) => {
                                                       const complex = complexes.find(c => c.complexId.toString() === value);
                                                       if (complex) {
                                                            handleComplexChange(complex);
                                                            setSelectedFieldForSchedule('all'); // Reset field filter when changing complex
                                                       }
                                                  }}
                                             >
                                                  <SelectTrigger className="w-[250px]">
                                                       <SelectValue placeholder="Chọn khu sân" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                       {complexes.map((complex) => (
                                                            <SelectItem key={complex.complexId} value={complex.complexId.toString()}>
                                                                 {complex.name}
                                                            </SelectItem>
                                                       ))}
                                                  </SelectContent>
                                             </Select>

                                             <span className="font-medium text-gray-700">Sân:</span>
                                             <Select value={selectedFieldForSchedule} onValueChange={setSelectedFieldForSchedule}>
                                                  <SelectTrigger className="w-[200px]">
                                                       <SelectValue placeholder="Chọn sân" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                       <SelectItem value="all">
                                                            Tất cả ({fields.length} sân)
                                                       </SelectItem>
                                                       {fields.map((field) => (
                                                            <SelectItem key={field.fieldId} value={field.fieldId.toString()}>
                                                                 {field.name}
                                                            </SelectItem>
                                                       ))}
                                                  </SelectContent>
                                             </Select>
                                        </div>

                                        <div className="flex items-center gap-2">
                                             <Filter className="w-4 h-4 text-gray-600" />
                                             <span className="text-sm font-medium text-gray-700">Trạng thái:</span>
                                             <Select value={filterStatus} onValueChange={setFilterStatus}>
                                                  <SelectTrigger className="w-[150px]">
                                                       <SelectValue placeholder="Chọn trạng thái" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                       <SelectItem value="all">Tất cả</SelectItem>
                                                       <SelectItem value="booked">Đã đặt</SelectItem>
                                                       <SelectItem value="available">Còn trống</SelectItem>
                                                  </SelectContent>
                                             </Select>
                                        </div>
                                   </div>
                              </Card>

                              {/* Week Navigator */}
                              <Card className="p-4">
                                   <div className="flex items-center justify-between">
                                        <Button onClick={goToPreviousWeek} variant="outline" size="sm">
                                             <ChevronLeft className="w-4 h-4 mr-1" />
                                             Tuần trước
                                        </Button>

                                        <div className="flex items-center gap-4">
                                             <Calendar className="w-5 h-5 text-teal-600" />
                                             <span className="font-semibold text-gray-900">
                                                  Tuần {Math.ceil((weekDates[0].getDate()) / 7)} - Tháng {weekDates[0].getMonth() + 1}, {weekDates[0].getFullYear()}
                                             </span>
                                             <Button onClick={goToToday} variant="outline" size="sm">
                                                  Hôm nay
                                             </Button>
                                        </div>

                                        <Button onClick={goToNextWeek} variant="outline" size="sm">
                                             Tuần sau
                                             <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>
                                   </div>
                              </Card>

                              {/* Field Info - Show when specific field is selected */}
                              {selectedFieldForSchedule !== 'all' && (
                                   <Alert className="border-teal-300 bg-gradient-to-r from-teal-50 to-blue-50">
                                        <Info className="h-5 w-5 text-teal-600" />
                                        <AlertDescription className="text-teal-900 text-sm font-medium">
                                             Đang xem lịch trình của: <strong>{fields.find(f => f.fieldId.toString() === selectedFieldForSchedule)?.name}</strong>
                                        </AlertDescription>
                                   </Alert>
                              )}

                              {/* Timetable */}
                              <Card className="p-6 overflow-x-auto shadow-lg">
                                   <table className="w-full border-collapse">
                                        <thead>
                                             <tr>
                                                  <th className="sticky left-0 z-10 border-2 border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200 p-4 text-left font-bold text-gray-800 min-w-[140px] shadow-sm">
                                                       <div className="flex items-center gap-2">
                                                            <Clock className="w-4 h-4" />
                                                            Khung giờ
                                                       </div>
                                                  </th>
                                                  {weekDates.map((date, index) => {
                                                       const today = isToday(date);
                                                       return (
                                                            <th
                                                                 key={index}
                                                                 className={`border-2 p-4 text-center font-bold min-w-[140px] ${today
                                                                      ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white border-teal-700 shadow-lg'
                                                                      : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 border-gray-300'
                                                                      }`}
                                                            >
                                                                 <div className="flex flex-col items-center gap-1">
                                                                      <div className={`text-lg font-bold ${today ? 'text-white' : 'text-gray-900'}`}>
                                                                           {getDayName(date)}
                                                                      </div>
                                                                      <div className={`text-sm font-semibold ${today ? 'text-teal-100' : 'text-gray-600'}`}>
                                                                           {formatDate(date)}
                                                                      </div>
                                                                      {today && (
                                                                           <Badge className="bg-white text-teal-700 text-xs font-bold mt-1 px-2 py-0.5">
                                                                                HÔM NAY
                                                                           </Badge>
                                                                      )}
                                                                 </div>
                                                            </th>
                                                       );
                                                  })}
                                             </tr>
                                        </thead>
                                        <tbody>
                                             {fields.length === 0 ? (
                                                  <tr>
                                                       <td colSpan={8} className="border-2 border-gray-300 p-12 text-center text-gray-500">
                                                            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                                                            <p className="text-lg font-medium">Khu sân này chưa có sân nào</p>
                                                       </td>
                                                  </tr>
                                             ) : (
                                                  fields
                                                       .filter(field => selectedFieldForSchedule === 'all' || field.fieldId.toString() === selectedFieldForSchedule)
                                                       .map((field) => (
                                                            <React.Fragment key={field.fieldId}>
                                                                 {/* Field name row */}
                                                                 <tr>
                                                                      <td colSpan={8} className="border-2 border-teal-300 bg-gradient-to-r from-teal-100 to-teal-50 p-3 font-bold text-teal-900 text-base shadow-sm">
                                                                           <div className="flex items-center gap-2">
                                                                                <div className="w-2 h-2 bg-teal-600 rounded-full"></div>
                                                                                {field.name}
                                                                           </div>
                                                                      </td>
                                                                 </tr>

                                                                 {/* Time slots rows */}
                                                                 {timeSlots.map((slot, slotIndex) => {
                                                                      const slotId = slot.slotId || slot.SlotID;
                                                                      const price = getFieldPrice(field, slotId);

                                                                      return (
                                                                           <tr key={`${field.fieldId}-${slotId}`} className={slotIndex % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}>
                                                                                <td className="sticky left-0 z-10 border-2 border-gray-300 p-3 text-sm bg-white shadow-sm">
                                                                                     <div className="flex items-start gap-2">
                                                                                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                                                                                               {(slot.SlotName || slot.slotName || slot.name || '').replace('Slot ', '')}
                                                                                          </div>
                                                                                          <div className="flex-1">
                                                                                               <div className="font-bold text-gray-900">{slot.SlotName || slot.slotName || slot.name || 'N/A'}</div>
                                                                                               <div className="text-xs text-gray-600 font-medium mt-0.5 flex items-center gap-1">
                                                                                                    <Clock className="w-3 h-3" />
                                                                                                    {formatTime(slot.StartTime || slot.startTime)} - {formatTime(slot.EndTime || slot.endTime)}
                                                                                               </div>
                                                                                               {price > 0 && (
                                                                                                    <div className="text-xs text-teal-700 font-bold flex items-center gap-1 mt-1 bg-teal-50 px-2 py-0.5 rounded">
                                                                                                         <DollarSign className="w-3 h-3" />
                                                                                                         {price.toLocaleString('vi-VN')}đ
                                                                                                    </div>
                                                                                               )}
                                                                                          </div>
                                                                                     </div>
                                                                                </td>
                                                                                {weekDates.map((date, dateIndex) => {
                                                                                     const schedule = getScheduleForSlot(field.fieldId, date, slotId);
                                                                                     const status = schedule?.status || 'empty';
                                                                                     const booked = status === 'Booked' || status === 'booked';
                                                                                     const available = status === 'Available' || status === 'available';
                                                                                     const maintenance = status === 'Maintenance' || status === 'maintenance';
                                                                                     const hasSchedule = !!schedule;
                                                                                     const bookingInfo = booked ? getBookingInfo(field.fieldId, date, slotId) : null;
                                                                                     const today = isToday(date);

                                                                                     // Apply filter
                                                                                     const shouldShow =
                                                                                          filterStatus === 'all' ||
                                                                                          (filterStatus === 'booked' && booked) ||
                                                                                          (filterStatus === 'available' && (available || !hasSchedule));

                                                                                     if (!shouldShow) {
                                                                                          return (
                                                                                               <td
                                                                                                    key={dateIndex}
                                                                                                    className={`border-2 p-3 text-center text-sm ${today ? 'bg-teal-50/30 border-teal-200' : 'bg-gray-100 border-gray-300'
                                                                                                         }`}
                                                                                               >
                                                                                                    <span className="text-gray-300 text-lg">-</span>
                                                                                               </td>
                                                                                          );
                                                                                     }

                                                                                     // Determine cell color based on status
                                                                                     let cellClass = 'bg-white border-gray-300'; // Default: no schedule
                                                                                     if (maintenance) {
                                                                                          cellClass = today ? 'bg-gradient-to-br from-yellow-100 to-yellow-50 border-yellow-300' : 'bg-yellow-50 border-gray-300';
                                                                                     } else if (booked) {
                                                                                          cellClass = today ? 'bg-gradient-to-br from-blue-100 to-blue-50 border-blue-300' : 'bg-blue-50 border-gray-300';
                                                                                     } else if (available) {
                                                                                          cellClass = today ? 'bg-gradient-to-br from-green-100 to-green-50 border-green-300' : 'bg-green-50 border-gray-300';
                                                                                     }

                                                                                     return (
                                                                                          <td
                                                                                               key={dateIndex}
                                                                                               className={`border-2 p-3 text-center text-sm cursor-pointer transition-all duration-200 hover:shadow-sm ${cellClass}`}
                                                                                               onClick={() => {
                                                                                                    if (booked && bookingInfo) {
                                                                                                         Swal.fire({
                                                                                                              title: 'Thông tin đặt sân',
                                                                                                              html: `
                                                                                                    <div class="text-left space-y-2">
                                                                                                         <p><strong>Sân:</strong> ${field.name}</p>
                                                                                                         <p><strong>Slot:</strong> ${slot.SlotName || slot.slotName || slot.name || 'N/A'} (${formatTime(slot.StartTime || slot.startTime)} - ${formatTime(slot.EndTime || slot.endTime)})</p>
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
                                                                                               {!hasSchedule ? (
                                                                                                    <div className="text-gray-400 text-xs">
                                                                                                         Chưa setup
                                                                                                    </div>
                                                                                               ) : maintenance ? (
                                                                                                    <div className="space-y-1">
                                                                                                         <Badge className="text-xs font-bold bg-yellow-600 text-white">
                                                                                                              🔧 Bảo trì
                                                                                                         </Badge>
                                                                                                    </div>
                                                                                               ) : booked ? (
                                                                                                    <div className="space-y-1.5">
                                                                                                         <Badge className="text-xs font-bold bg-blue-600 text-white">
                                                                                                              ✓ Đã đặt
                                                                                                         </Badge>
                                                                                                         {bookingInfo && (
                                                                                                              <div className="text-xs text-gray-700 font-medium truncate bg-white/60 px-2 py-1 rounded">
                                                                                                                   {bookingInfo.customerName}
                                                                                                              </div>
                                                                                                         )}
                                                                                                    </div>
                                                                                               ) : (
                                                                                                    <div className="flex flex-col items-center gap-1">
                                                                                                         <span className={`text-2xl ${today ? 'text-teal-300' : 'text-gray-300'}`}>○</span>
                                                                                                         <span className={`text-xs font-medium ${today ? 'text-teal-600' : 'text-gray-400'}`}>
                                                                                                              Trống
                                                                                                         </span>
                                                                                                    </div>
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
                         </>
                    )}

                    {/* Time Slots Management Tab */}
                    {activeTab === 'timeslots' && (
                         <>
                              <div className="flex items-center justify-between flex-wrap gap-4">
                                   <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Quản lý Time Slots</h3>
                                        <p className="text-gray-600">Xem thời gian hoạt động của từng sân</p>
                                   </div>
                                   <Button
                                        onClick={() => handleOpenSlotModal()}
                                        className="bg-teal-600 hover:bg-teal-700 text-white"
                                   >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Thêm Time Slot
                                   </Button>
                              </div>

                              {/* Field Filter */}
                              <Card className="p-4">
                                   <div className="flex items-center gap-4 flex-wrap">
                                        <span className="font-medium text-gray-700">Lọc theo sân:</span>
                                        <Select value={selectedFieldFilter} onValueChange={setSelectedFieldFilter}>
                                             <SelectTrigger className="w-[280px]">
                                                  <SelectValue placeholder="Chọn sân" />
                                             </SelectTrigger>
                                             <SelectContent>
                                                  <SelectItem value="all">Tất cả các sân ({fields.length})</SelectItem>
                                                  {fields.map((field) => (
                                                       <SelectItem key={field.fieldId} value={field.fieldId.toString()}>
                                                            {field.name} - {field.complexName}
                                                       </SelectItem>
                                                  ))}
                                             </SelectContent>
                                        </Select>
                                   </div>
                              </Card>

                              <Alert className="border-blue-200 bg-blue-50">
                                   <Info className="h-4 w-4 text-blue-600" />
                                   <AlertDescription className="text-blue-800 text-sm">
                                        Mỗi sân có thể có các khung giờ hoạt động riêng. Sau khi tạo, bạn có thể gán giá cho từng slot ở trang "Giá theo slot".
                                   </AlertDescription>
                              </Alert>

                              {/* Display fields with their time slots */}
                              {fields.length === 0 ? (
                                   <Card className="p-12">
                                        <div className="text-center">
                                             <Timer className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                             <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có sân nào</h3>
                                             <p className="text-gray-500">Vui lòng thêm sân trước khi quản lý time slots</p>
                                        </div>
                                   </Card>
                              ) : (
                                   <div className="space-y-4">
                                        {fields
                                             .filter(field => selectedFieldFilter === 'all' || field.fieldId.toString() === selectedFieldFilter)
                                             .map((field) => {
                                                  // Get slots for this field and add fieldId to each slot
                                                  const fieldSlots = timeSlots
                                                       .filter(slot => {
                                                            // Filter by slot.fieldId if available, otherwise show all
                                                            return !slot.fieldId || slot.fieldId === field.fieldId || slot.FieldId === field.fieldId;
                                                       })
                                                       .map(slot => ({
                                                            ...slot,
                                                            fieldId: slot.fieldId || slot.FieldId || field.fieldId
                                                       }));

                                                  return (
                                                       <Card key={field.fieldId} className="p-6">
                                                            {/* Field Header */}
                                                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                                                                 <div className="flex items-center gap-4">
                                                                      <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center">
                                                                           <Timer className="w-6 h-6 text-white" />
                                                                      </div>
                                                                      <div>
                                                                           <h4 className="text-lg font-semibold text-gray-900">{field.name}</h4>
                                                                           <p className="text-sm text-gray-500">{field.complexName}</p>
                                                                      </div>
                                                                 </div>
                                                                 <div className="flex items-center gap-2">
                                                                      <Badge className="bg-teal-100 text-teal-800">
                                                                           {fieldSlots.length} slots
                                                                      </Badge>
                                                                      <Button
                                                                           onClick={() => {
                                                                                setSlotFormData({ ...slotFormData, fieldId: field.fieldId.toString() });
                                                                                handleOpenSlotModal();
                                                                           }}
                                                                           variant="outline"
                                                                           size="sm"
                                                                           className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 border-teal-200"
                                                                      >
                                                                           <Plus className="w-4 h-4 mr-1" />
                                                                           Thêm slot
                                                                      </Button>
                                                                 </div>
                                                            </div>

                                                            {/* Time Slots List */}
                                                            {fieldSlots.length === 0 ? (
                                                                 <div className="text-center py-8 text-gray-500">
                                                                      <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                                                      <p className="text-sm">Sân này chưa có time slot nào</p>
                                                                      <Button
                                                                           onClick={() => {
                                                                                setSlotFormData({ ...slotFormData, fieldId: field.fieldId.toString() });
                                                                                handleOpenSlotModal();
                                                                           }}
                                                                           variant="outline"
                                                                           size="sm"
                                                                           className="mt-3"
                                                                      >
                                                                           <Plus className="w-4 h-4 mr-1" />
                                                                           Thêm slot đầu tiên
                                                                      </Button>
                                                                 </div>
                                                            ) : (
                                                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                      {fieldSlots.map((slot) => {
                                                                           const start = new Date(`2000-01-01T${slot.StartTime || slot.startTime || '00:00:00'}`);
                                                                           const end = new Date(`2000-01-01T${slot.EndTime || slot.endTime || '00:00:00'}`);
                                                                           const duration = (end - start) / (1000 * 60 * 60);

                                                                           return (
                                                                                <div
                                                                                     key={slot.SlotID}
                                                                                     className="bg-gradient-to-br from-teal-50 to-blue-50 p-4 rounded-lg border border-teal-200 hover:shadow-md transition-shadow"
                                                                                >
                                                                                     <div className="flex items-start justify-between mb-2">
                                                                                          <div>
                                                                                               <h5 className="font-semibold text-gray-900">{slot.SlotName || slot.slotName || slot.name || 'N/A'}</h5>
                                                                                               <p className="text-sm text-gray-600 mt-1">
                                                                                                    {formatTime(slot.StartTime || slot.startTime || '00:00:00')} - {formatTime(slot.EndTime || slot.endTime || '00:00:00')}
                                                                                               </p>
                                                                                          </div>
                                                                                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                                                                                               {duration}h
                                                                                          </Badge>
                                                                                     </div>
                                                                                     <div className="flex items-center gap-2 mt-3">
                                                                                          <Button
                                                                                               onClick={() => handleOpenSlotModal(slot)}
                                                                                               variant="outline"
                                                                                               size="sm"
                                                                                               className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                                                                                          >
                                                                                               <Edit className="w-3 h-3 mr-1" />
                                                                                               Sửa
                                                                                          </Button>
                                                                                          <Button
                                                                                               onClick={() => handleDeleteSlot(slot.SlotID)}
                                                                                               variant="outline"
                                                                                               size="sm"
                                                                                               className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                                                          >
                                                                                               <Trash2 className="w-3 h-3 mr-1" />
                                                                                               Xóa
                                                                                          </Button>
                                                                                     </div>
                                                                                </div>
                                                                           );
                                                                      })}
                                                                 </div>
                                                            )}
                                                       </Card>
                                                  );
                                             })}
                                   </div>
                              )}
                         </>
                    )}

                    {/* Manage Schedules Tab - Bảng quản lý lịch trình */}
                    {activeTab === 'manage-schedules' && (
                         <>
                              <div className="flex items-center justify-between flex-wrap gap-4">
                                   <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Quản lý Lịch trình</h3>
                                        <p className="text-gray-600">Xem và quản lý tất cả lịch trình đã tạo</p>
                                   </div>
                                   <div className="flex items-center gap-2">
                                        <Button
                                             onClick={handleOpenScheduleModal}
                                             className="bg-teal-600 hover:bg-teal-700 text-white"
                                        >
                                             <Plus className="w-4 h-4 mr-2" />
                                             Thêm lịch trình
                                        </Button>
                                        <Button
                                             onClick={loadFieldSchedules}
                                             variant="outline"
                                             className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 border-teal-200"
                                        >
                                             <Calendar className="w-4 h-4 mr-2" />
                                             Làm mới
                                        </Button>
                                   </div>
                              </div>

                              {/* Filters */}
                              <Card className="p-4">
                                   <div className="flex items-center gap-4 flex-wrap">
                                        <div className="flex items-center gap-2">
                                             <span className="font-medium text-gray-700">Sân:</span>
                                             <Select value={scheduleFilterField} onValueChange={setScheduleFilterField}>
                                                  <SelectTrigger className="w-[200px]">
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
                                             <Select value={scheduleFilterStatus} onValueChange={setScheduleFilterStatus}>
                                                  <SelectTrigger className="w-[150px]">
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
                                             <Input
                                                  type="date"
                                                  value={scheduleFilterDate}
                                                  onChange={(e) => setScheduleFilterDate(e.target.value)}
                                                  className="w-[180px]"
                                             />
                                        </div>
                                   </div>
                              </Card>

                              {/* Table */}
                              {loadingSchedules ? (
                                   <Card className="p-12">
                                        <div className="text-center">
                                             <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-4" />
                                             <p className="text-gray-600">Đang tải dữ liệu...</p>
                                        </div>
                                   </Card>
                              ) : fieldSchedules.length === 0 ? (
                                   <Card className="p-12">
                                        <div className="text-center">
                                             <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                             <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lịch trình nào</h3>
                                             <p className="text-gray-500">Tạo Time Slot để tự động tạo lịch trình</p>
                                        </div>
                                   </Card>
                              ) : (
                                   <Card className="overflow-hidden">
                                        <div className="overflow-x-auto">
                                             <table className="w-full border-collapse">
                                                  <thead>
                                                       <tr className="bg-gradient-to-r from-teal-50 to-blue-50 border-b-2 border-teal-200">
                                                            <th className="p-4 text-left font-bold text-gray-800">ID</th>
                                                            <th className="p-4 text-left font-bold text-gray-800">Sân</th>
                                                            <th className="p-4 text-left font-bold text-gray-800">Slot</th>
                                                            <th className="p-4 text-left font-bold text-gray-800">Ngày</th>
                                                            <th className="p-4 text-left font-bold text-gray-800">Thời gian</th>
                                                            <th className="p-4 text-left font-bold text-gray-800">Trạng thái</th>
                                                            <th className="p-4 text-center font-bold text-gray-800">Thao tác</th>
                                                       </tr>
                                                  </thead>
                                                  <tbody>
                                                       {fieldSchedules
                                                            .filter(schedule => {
                                                                 // Filter by field
                                                                 if (scheduleFilterField !== 'all') {
                                                                      const fieldId = schedule.fieldId || schedule.FieldID;
                                                                      if (Number(fieldId) !== Number(scheduleFilterField)) return false;
                                                                 }

                                                                 // Filter by status
                                                                 if (scheduleFilterStatus !== 'all') {
                                                                      const status = schedule.status || schedule.Status;
                                                                      if (status !== scheduleFilterStatus) return false;
                                                                 }

                                                                 // Filter by date
                                                                 if (scheduleFilterDate) {
                                                                      const scheduleDate = schedule.date;
                                                                      let dateStr = '';
                                                                      if (typeof scheduleDate === 'string') {
                                                                           dateStr = scheduleDate.split('T')[0];
                                                                      } else if (scheduleDate && scheduleDate.year) {
                                                                           dateStr = `${scheduleDate.year}-${String(scheduleDate.month).padStart(2, '0')}-${String(scheduleDate.day).padStart(2, '0')}`;
                                                                      }
                                                                      if (dateStr !== scheduleFilterDate) return false;
                                                                 }

                                                                 return true;
                                                            })
                                                            .map((schedule) => {
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
                                                                      const formatTimeObj = (time) => {
                                                                           if (typeof time === 'string') {
                                                                                return time.substring(0, 5);
                                                                           } else if (time && time.hour !== undefined) {
                                                                                return `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;
                                                                           }
                                                                           return '00:00';
                                                                      };
                                                                      timeStr = `${formatTimeObj(startTime)} - ${formatTimeObj(endTime)}`;
                                                                 }

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

                                                                 return (
                                                                      <tr key={scheduleId} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                                                           <td className="p-4 text-gray-700 font-mono text-sm">#{scheduleId}</td>
                                                                           <td className="p-4 text-gray-900 font-medium">{fieldName}</td>
                                                                           <td className="p-4 text-gray-700">{slotName}</td>
                                                                           <td className="p-4 text-gray-700">{dateStr}</td>
                                                                           <td className="p-4 text-gray-700 font-mono text-sm">{timeStr}</td>
                                                                           <td className="p-4">{getStatusBadge(status)}</td>
                                                                           <td className="p-4">
                                                                                <div className="flex items-center justify-center gap-2">
                                                                                     <Select
                                                                                          value={status}
                                                                                          onValueChange={(newStatus) => handleUpdateScheduleStatus(scheduleId, newStatus)}
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
                                                                                          onClick={() => handleDeleteSchedule(scheduleId, `${fieldName} - ${slotName} - ${dateStr}`)}
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

                                        {/* Summary */}
                                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                                             <p className="text-sm text-gray-600">
                                                  Tổng cộng: <strong>{fieldSchedules.length}</strong> lịch trình
                                             </p>
                                        </div>
                                   </Card>
                              )}
                         </>
                    )}

                    {/* Legend & Info - Only show in schedule tab */}
                    {activeTab === 'schedule' && (
                         <Card className="p-5 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200">
                              <div className="space-y-4">
                                   <div className="flex items-center gap-8 flex-wrap">
                                        <span className="font-bold text-gray-800 flex items-center gap-2">
                                             <Info className="w-5 h-5 text-teal-600" />
                                             Chú thích:
                                        </span>
                                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-300 shadow-sm">
                                             <div className="w-6 h-6 bg-white border-2 border-gray-300 rounded flex items-center justify-center">
                                                  <span className="text-gray-300 text-lg">○</span>
                                             </div>
                                             <span className="text-sm font-medium text-gray-700">Trống</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-green-300 shadow-sm">
                                             <div className="w-6 h-6 bg-green-500 border-2 border-green-600 rounded flex items-center justify-center">
                                                  <span className="text-white text-xs font-bold">✓</span>
                                             </div>
                                             <span className="text-sm font-medium text-gray-700">Đã đặt</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-gradient-to-br from-teal-500 to-teal-600 px-3 py-2 rounded-lg border-2 border-teal-700 shadow-md">
                                             <Calendar className="w-5 h-5 text-white" />
                                             <span className="text-sm font-bold text-white">Cột hôm nay</span>
                                        </div>
                                   </div>

                                   <Alert className="border-blue-300 bg-gradient-to-r from-blue-50 to-blue-100 shadow-sm">
                                        <Info className="h-5 w-5 text-blue-600" />
                                        <AlertDescription className="text-blue-900 text-sm font-medium">
                                             <strong>💡 Mẹo:</strong> Click vào ô đã đặt để xem chi tiết booking.
                                             Để thay đổi khung giờ hoạt động, chuyển sang tab{' '}
                                             <button
                                                  onClick={() => setActiveTab('timeslots')}
                                                  className="underline font-bold hover:text-blue-700 transition-colors"
                                             >
                                                  Quản lý Time Slots
                                             </button>.
                                        </AlertDescription>
                                   </Alert>
                              </div>
                         </Card>
                    )}

                    {/* Time Slot Modal */}
                    <Modal
                         isOpen={showSlotModal}
                         onClose={handleCloseSlotModal}
                         title={editingSlot ? 'Chỉnh sửa Time Slot' : 'Thêm Time Slot mới'}
                         size="lg"
                    >
                         <form onSubmit={handleSubmitSlot} className="space-y-4">
                              {/* Field Selection */}
                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Chọn sân <span className="text-red-500">*</span>
                                   </label>
                                   {slotFormData.fieldId && (editingSlot || !editingSlot) ? (
                                        editingSlot ? (
                                             <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                                                  <span className="text-gray-900 font-medium">
                                                       {fields.find(f => f.fieldId.toString() === slotFormData.fieldId || f.fieldId === parseInt(slotFormData.fieldId))?.name || 'Sân đã chọn'}
                                                       <span className="text-gray-600 text-sm ml-1">
                                                            ({fields.find(f => f.fieldId.toString() === slotFormData.fieldId || f.fieldId === parseInt(slotFormData.fieldId))?.complexName})
                                                       </span>
                                                  </span>
                                             </div>
                                        ) : (
                                             <div className="w-full px-3 py-2 border border-teal-300 rounded-lg bg-teal-50">
                                                  <div className="flex items-center justify-between">
                                                       <span className="text-gray-900 font-medium">
                                                            {fields.find(f => f.fieldId.toString() === slotFormData.fieldId)?.name || 'Sân đã chọn'}
                                                            <span className="text-gray-600 text-sm ml-1">
                                                                 ({fields.find(f => f.fieldId.toString() === slotFormData.fieldId)?.complexName})
                                                            </span>
                                                       </span>
                                                       <button
                                                            type="button"
                                                            onClick={() => setSlotFormData({ ...slotFormData, fieldId: '' })}
                                                            className="text-teal-600 hover:text-teal-700 text-sm underline"
                                                       >
                                                            Đổi sân
                                                       </button>
                                                  </div>
                                             </div>
                                        )
                                   ) : (
                                        <Select
                                             value={slotFormData.fieldId}
                                             onValueChange={(value) => {
                                                  setSlotFormData({ ...slotFormData, fieldId: value });
                                                  setSelectedQuickSlots([]); // Reset quick slots when field changes
                                                  loadTimeSlotsForField(value); // Load timeslots for selected field
                                             }}
                                             disabled={editingSlot}
                                        >
                                             <SelectTrigger className={`w-full ${slotFormErrors.fieldId ? 'border-red-500' : ''}`}>
                                                  <SelectValue placeholder="-- Chọn sân --" />
                                             </SelectTrigger>
                                             <SelectContent>
                                                  {fields.map((field) => (
                                                       <SelectItem key={field.fieldId} value={field.fieldId.toString()}>
                                                            {field.name} ({field.complexName})
                                                       </SelectItem>
                                                  ))}
                                             </SelectContent>
                                        </Select>
                                   )}
                                   {slotFormErrors.fieldId && (
                                        <p className="text-xs text-red-600 mt-1">{slotFormErrors.fieldId}</p>
                                   )}
                              </div>

                              {/* Quick Slots - Only show when creating new and field is selected */}
                              {!editingSlot && slotFormData.fieldId && (
                                   <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-4 rounded-lg border border-teal-200">
                                        <div className="flex items-center justify-between mb-3">
                                             <div>
                                                  <h4 className="text-sm font-semibold text-gray-900">Chọn nhanh khung giờ</h4>
                                                  <p className="text-xs text-gray-600">Click để chọn nhiều khung giờ cùng lúc</p>
                                             </div>
                                             {selectedQuickSlots.length > 0 && (
                                                  <Badge className="bg-teal-100 text-teal-800">
                                                       {selectedQuickSlots.length} đã chọn
                                                  </Badge>
                                             )}
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                                             {quickSlotTemplates.map((template, index) => {
                                                  const isSelected = selectedQuickSlots.some(s => s.key === `${template.start}-${template.end}`);
                                                  const isExists = isSlotExistsForField(slotFormData.fieldId, template.start, template.end);

                                                  return (
                                                       <button
                                                            key={index}
                                                            type="button"
                                                            onClick={() => handleQuickSlotSelect(template)}
                                                            disabled={isExists}
                                                            className={`px-3 py-2.5 text-xs rounded-lg transition-all text-left ${isExists
                                                                 ? 'bg-gray-200 text-gray-500 cursor-not-allowed border-2 border-gray-300'
                                                                 : isSelected
                                                                      ? 'bg-teal-100 border-2 border-teal-500 hover:bg-teal-200 text-teal-900'
                                                                      : 'bg-white border-2 border-teal-200 hover:bg-teal-50 hover:border-teal-400'
                                                                 }`}
                                                       >
                                                            <div className="font-semibold">{template.name}</div>
                                                            <div className="text-xs mt-0.5">{template.start} - {template.end}</div>
                                                            {isExists && (
                                                                 <div className="text-xs text-gray-500 mt-1">Đã thêm</div>
                                                            )}
                                                       </button>
                                                  );
                                             })}
                                        </div>
                                   </div>
                              )}

                              {/* Manual Input - Only show when not using quick slots */}
                              {selectedQuickSlots.length === 0 && (
                                   <>
                                        <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-2">
                                                  Tên Slot <span className="text-red-500">*</span>
                                             </label>
                                             <Input
                                                  value={slotFormData.slotName}
                                                  onChange={(e) => setSlotFormData({ ...slotFormData, slotName: e.target.value })}
                                                  placeholder="Ví dụ: Slot 1, Sáng sớm, ..."
                                                  className={slotFormErrors.slotName ? 'border-red-500' : ''}
                                             />
                                             {slotFormErrors.slotName && (
                                                  <p className="text-xs text-red-600 mt-1">{slotFormErrors.slotName}</p>
                                             )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                             <div>
                                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                                       Giờ bắt đầu <span className="text-red-500">*</span>
                                                  </label>
                                                  <Input
                                                       type="time"
                                                       value={slotFormData.startTime}
                                                       onChange={(e) => setSlotFormData({ ...slotFormData, startTime: e.target.value })}
                                                       className={slotFormErrors.startTime ? 'border-red-500' : ''}
                                                  />
                                                  {slotFormErrors.startTime && (
                                                       <p className="text-xs text-red-600 mt-1">{slotFormErrors.startTime}</p>
                                                  )}
                                             </div>

                                             <div>
                                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                                       Giờ kết thúc <span className="text-red-500">*</span>
                                                  </label>
                                                  <Input
                                                       type="time"
                                                       value={slotFormData.endTime}
                                                       onChange={(e) => setSlotFormData({ ...slotFormData, endTime: e.target.value })}
                                                       className={slotFormErrors.endTime ? 'border-red-500' : ''}
                                                  />
                                                  {slotFormErrors.endTime && (
                                                       <p className="text-xs text-red-600 mt-1">{slotFormErrors.endTime}</p>
                                                  )}
                                             </div>
                                        </div>
                                   </>
                              )}

                              <div className="flex justify-end gap-2 pt-4">
                                   <Button
                                        type="button"
                                        onClick={handleCloseSlotModal}
                                        variant="outline"
                                   >
                                        <X className="w-4 h-4 mr-2" />
                                        Hủy
                                   </Button>
                                   <Button
                                        type="submit"
                                        disabled={isSubmittingSlot}
                                        className="bg-teal-600 hover:bg-teal-700"
                                   >
                                        {isSubmittingSlot ? (
                                             <>
                                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                  Đang lưu...
                                             </>
                                        ) : (
                                             <>
                                                  <Save className="w-4 h-4 mr-2" />
                                                  {editingSlot ? 'Cập nhật' : selectedQuickSlots.length > 0 ? `Thêm ${selectedQuickSlots.length} slots` : 'Tạo mới'}
                                             </>
                                        )}
                                   </Button>
                              </div>
                         </form>
                    </Modal>

                    {/* Schedule Modal - Thêm lịch trình */}
                    <Modal
                         isOpen={showScheduleModal}
                         onClose={handleCloseScheduleModal}
                         title="Thêm lịch trình mới"
                         size="lg"
                    >
                         <form onSubmit={handleSubmitSchedule} className="space-y-4">
                              {/* Field Selection */}
                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Chọn sân <span className="text-red-500">*</span>
                                   </label>
                                   <Select
                                        value={scheduleFormData.fieldId}
                                        onValueChange={(value) => {
                                             setScheduleFormData({ ...scheduleFormData, fieldId: value });
                                        }}
                                   >
                                        <SelectTrigger className={`w-full ${scheduleFormErrors.fieldId ? 'border-red-500' : ''}`}>
                                             <SelectValue placeholder="-- Chọn sân --" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             {fields.map((field) => (
                                                  <SelectItem key={field.fieldId} value={field.fieldId.toString()}>
                                                       {field.name} ({field.complexName})
                                                  </SelectItem>
                                             ))}
                                        </SelectContent>
                                   </Select>
                                   {scheduleFormErrors.fieldId && (
                                        <p className="text-xs text-red-600 mt-1">{scheduleFormErrors.fieldId}</p>
                                   )}
                              </div>

                              {/* Slot Selection */}
                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Chọn slot <span className="text-red-500">*</span>
                                   </label>
                                   <Select
                                        value={scheduleFormData.slotId}
                                        onValueChange={(value) => {
                                             setScheduleFormData({ ...scheduleFormData, slotId: value });
                                        }}
                                        disabled={!scheduleFormData.fieldId}
                                   >
                                        <SelectTrigger className={`w-full ${scheduleFormErrors.slotId ? 'border-red-500' : ''}`}>
                                             <SelectValue placeholder={scheduleFormData.fieldId ? "-- Chọn slot --" : "Vui lòng chọn sân trước"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                             {timeSlots
                                                  .filter(slot => {
                                                       // Filter slots by field if field is selected
                                                       if (scheduleFormData.fieldId) {
                                                            const slotFieldId = slot.fieldId || slot.FieldId;
                                                            return !slotFieldId || slotFieldId.toString() === scheduleFormData.fieldId;
                                                       }
                                                       return true;
                                                  })
                                                  .map((slot) => {
                                                       const slotId = slot.slotId || slot.SlotID;
                                                       const slotName = slot.slotName || slot.SlotName || slot.name || 'N/A';
                                                       const startTime = formatTime(slot.startTime || slot.StartTime || '00:00');
                                                       const endTime = formatTime(slot.endTime || slot.EndTime || '00:00');

                                                       return (
                                                            <SelectItem key={slotId} value={slotId.toString()}>
                                                                 {slotName} ({startTime} - {endTime})
                                                            </SelectItem>
                                                       );
                                                  })}
                                        </SelectContent>
                                   </Select>
                                   {scheduleFormErrors.slotId && (
                                        <p className="text-xs text-red-600 mt-1">{scheduleFormErrors.slotId}</p>
                                   )}
                                   {!scheduleFormData.fieldId && (
                                        <p className="text-xs text-gray-500 mt-1">Vui lòng chọn sân trước để xem danh sách slot</p>
                                   )}
                              </div>

                              {/* Date Selection */}
                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Chọn ngày <span className="text-red-500">*</span>
                                   </label>
                                   <Input
                                        type="date"
                                        value={scheduleFormData.date}
                                        onChange={(e) => {
                                             setScheduleFormData({ ...scheduleFormData, date: e.target.value });
                                        }}
                                        className={scheduleFormErrors.date ? 'border-red-500' : ''}
                                        min={new Date().toISOString().split('T')[0]} // Không cho chọn ngày quá khứ
                                   />
                                   {scheduleFormErrors.date && (
                                        <p className="text-xs text-red-600 mt-1">{scheduleFormErrors.date}</p>
                                   )}
                              </div>

                              {/* Status Selection */}
                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Trạng thái
                                   </label>
                                   <Select
                                        value={scheduleFormData.status}
                                        onValueChange={(value) => {
                                             setScheduleFormData({ ...scheduleFormData, status: value });
                                        }}
                                   >
                                        <SelectTrigger className="w-full">
                                             <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="Available">Available</SelectItem>
                                             <SelectItem value="Booked">Booked</SelectItem>
                                             <SelectItem value="Maintenance">Maintenance</SelectItem>
                                        </SelectContent>
                                   </Select>
                              </div>

                              {/* Info Alert */}
                              {scheduleFormData.fieldId && scheduleFormData.slotId && scheduleFormData.date && (
                                   <Alert className="border-blue-200 bg-blue-50">
                                        <Info className="h-4 w-4 text-blue-600" />
                                        <AlertDescription className="text-blue-800 text-sm">
                                             Bạn đang tạo lịch trình cho ngày <strong>{new Date(scheduleFormData.date).toLocaleDateString('vi-VN')}</strong>
                                        </AlertDescription>
                                   </Alert>
                              )}

                              {/* Action Buttons */}
                              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                                   <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCloseScheduleModal}
                                        disabled={isSubmittingSchedule}
                                   >
                                        Hủy
                                   </Button>
                                   <Button
                                        type="submit"
                                        className="bg-teal-600 hover:bg-teal-700 text-white"
                                        disabled={isSubmittingSchedule}
                                   >
                                        {isSubmittingSchedule ? (
                                             <>
                                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                  Đang tạo...
                                             </>
                                        ) : (
                                             <>
                                                  <Save className="w-4 h-4 mr-2" />
                                                  Tạo lịch trình
                                             </>
                                        )}
                                   </Button>
                              </div>
                         </form>
                    </Modal>
               </div>
          </OwnerLayout >
     );
}
