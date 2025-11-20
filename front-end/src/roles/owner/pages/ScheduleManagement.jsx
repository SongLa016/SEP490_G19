import React, { useState, useEffect, useCallback, useMemo } from "react";
import OwnerLayout from "../layouts/OwnerLayout";
import { useAuth } from "../../../contexts/AuthContext";
import {
     Card,
     Alert,
     AlertDescription
} from "../../../shared/components/ui";
import {
     Clock,
     Calendar,
     Loader2,
     Info,
     BarChart3,
     Timer
} from "lucide-react";
import { fetchAllComplexesWithFields } from "../../../shared/services/fields";
import { fetchTimeSlots, fetchTimeSlotsByField, createTimeSlot, updateTimeSlot, deleteTimeSlot } from "../../../shared/services/timeSlots";
import { createFieldSchedule, fetchFieldSchedulesByField, fetchFieldSchedules, updateFieldScheduleStatus, deleteFieldSchedule } from "../../../shared/services/fieldSchedules";
import Swal from "sweetalert2";
import { DateSelector, MonthlyCalendar, FieldList, ComplexAndFieldSelector, ScheduleGrid, ScheduleModal, TimeSlotModal, TimeSlotsTab, ManageSchedulesTab, StatisticsCards } from "./components/scheduleManagement";


export default function ScheduleManagement({ isDemo = false }) {
     const { user, logout } = useAuth();
     const [loading, setLoading] = useState(true);
     const [complexes, setComplexes] = useState([]);
     const [selectedComplex, setSelectedComplex] = useState(null);
     const [fields, setFields] = useState([]);
     const [timeSlots, setTimeSlots] = useState([]);
     const [selectedDate, setSelectedDate] = useState(new Date()); // Selected date for daily view
     const [filterStatus, setFilterStatus] = useState('all'); // all, booked, available
     const [activeTab, setActiveTab] = useState('schedule'); // schedule, timeslots, manage-schedules
     const [showSlotModal, setShowSlotModal] = useState(false);
     const [editingSlot, setEditingSlot] = useState(null);
     const [slotFormData, setSlotFormData] = useState({
          fieldId: '',
          slotName: '',
          startTime: '',
          endTime: '',
          price: ''
     });
     const [slotFormErrors, setSlotFormErrors] = useState({});
     const [isSubmittingSlot, setIsSubmittingSlot] = useState(false);
     const [selectedQuickSlots, setSelectedQuickSlots] = useState([]);
     const [modalTimeSlots, setModalTimeSlots] = useState([]); // Separate state for modal
     const [selectedFieldFilter, setSelectedFieldFilter] = useState('all'); // Filter for timeslots tab
     const [selectedFieldForSchedule, setSelectedFieldForSchedule] = useState('all'); // Filter for schedule tab
     const [fieldSchedules, setFieldSchedules] = useState([]); // Danh sách FieldSchedules
     const [loadingSchedules, setLoadingSchedules] = useState(false);
     const [scheduleFilterField, setScheduleFilterField] = useState('all'); // Filter cho bảng quản lý
     const [scheduleFilterStatus, setScheduleFilterStatus] = useState('all'); // Filter status cho bảng
     const [scheduleFilterDate, setScheduleFilterDate] = useState(''); // Filter date cho bảng
     const [showScheduleModal, setShowScheduleModal] = useState(false); // Modal thêm lịch trình
     const [calendarMonth, setCalendarMonth] = useState(new Date()); // Month for calendar view
     const [selectedFields, setSelectedFields] = useState(new Set()); // Selected fields for filtering
     const [scheduleFormData, setScheduleFormData] = useState({
          fieldId: '',
          slotId: '',
          date: '',
          status: 'Available'
     });
     const [scheduleFormErrors, setScheduleFormErrors] = useState({});
     const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);
     const maintenanceFields = useMemo(
          () => fields.filter(field => (field.status || field.Status || '').toLowerCase() === 'maintenance'),
          [fields]
     );
     const maintenanceFieldIds = useMemo(() => {
          const ids = new Set();
          maintenanceFields.forEach(field => {
               const numericId = Number(field.fieldId);
               if (!Number.isNaN(numericId)) {
                    ids.add(numericId);
               }
          });
          return ids;
     }, [maintenanceFields]);
     const isFieldMaintenance = useCallback(
          (fieldId) => {
               if (fieldId === null || fieldId === undefined) return false;
               const numericId = Number(fieldId);
               if (Number.isNaN(numericId)) return false;
               return maintenanceFieldIds.has(numericId);
          },
          [maintenanceFieldIds]
     );
     const hasActiveFields = useMemo(
          () => fields.some(field => (field.status || field.Status || '').toLowerCase() !== 'maintenance'),
          [fields]
     );
     const maintenanceNoticeText = useMemo(() => {
          if (!maintenanceFields.length) return '';
          const names = maintenanceFields
               .map(field => field.name)
               .filter(Boolean);
          if (names.length <= 3) {
               return names.join(', ');
          }
          return `${names.slice(0, 3).join(', ')} và ${names.length - 3} sân khác`;
     }, [maintenanceFields]);
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
          { name: 'Slot 12', start: '22:30', end: '23:59' },
     ];

     // Get current user ID
     const currentUserId = user?.userID || user?.UserID || user?.id || user?.userId;

     // Check if a time slot already exists for a field (using modal's separate state)
     const isSlotExistsForField = useCallback((fieldId, startTime, endTime) => {
          if (!fieldId) return false;

          // Filter modalTimeSlots by fieldId first, then check time overlap
          return modalTimeSlots.some(slot => {
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
     }, [modalTimeSlots]);

     // Load timeslots for a specific field (for modal only)
     const loadTimeSlotsForField = useCallback(async (fieldId) => {
          if (!fieldId) {
               setModalTimeSlots([]);
               return;
          }

          try {
               const slotsResponse = await fetchTimeSlotsByField(fieldId);
               if (slotsResponse.success) {
                    setModalTimeSlots(slotsResponse.data || []);
               } else {
                    setModalTimeSlots([]);
               }
          } catch (error) {

               setModalTimeSlots([]);
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
                    endTime: slot.endTime?.substring(0, 5) || '',
                    price: slot.price || slot.Price || ''
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
               endTime: '',
               price: ''
          });
          setSlotFormErrors({});
          setSelectedQuickSlots([]);
          setModalTimeSlots([]); // Clear modal slots
     };

     const validateSlotForm = () => {
          const errors = {};

          // If using quick slots, skip individual validation
          if (selectedQuickSlots.length > 0) {
               if (!slotFormData.fieldId) {
                    errors.fieldId = 'Vui lòng chọn sân';
               }
               if (!slotFormData.price || Number(slotFormData.price) <= 0) {
                    errors.price = 'Vui lòng nhập giá hợp lệ';
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

          if (!slotFormData.price || Number(slotFormData.price) <= 0) {
               errors.price = 'Vui lòng nhập giá hợp lệ';
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

          if (!editingSlot && isFieldMaintenance(fieldId)) {
               await Swal.fire({
                    icon: 'info',
                    title: 'Sân đang bảo trì',
                    text: 'Vui lòng đổi trạng thái sân sang "Available" trước khi thêm Time Slot mới.',
                    confirmButtonColor: '#f97316'
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
                                   endTime: quickSlot.end,
                                   price: Number(slotFormData.price)
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
                         endTime: slotFormData.endTime,
                         price: Number(slotFormData.price)
                    });
               } else {
                    result = await createTimeSlot({
                         fieldId: fieldId,
                         slotName: slotFormData.slotName,
                         startTime: slotFormData.startTime,
                         endTime: slotFormData.endTime,
                         price: Number(slotFormData.price)
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

     // Check if schedule is in the past (currently unused but kept for future use)
     // eslint-disable-next-line no-unused-vars
     const isSchedulePast = (date, endTime) => {
          const now = new Date();
          const scheduleDate = new Date(date);

          // Parse end time
          const [hours, minutes] = (endTime || '00:00').split(':');
          scheduleDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          return scheduleDate < now;
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

               // Fetch time slots will be handled by loadTimeSlotsForTable
               // Fetch field schedules will be handled by loadSchedulesForTable
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

     // Load time slots for table based on selected field
     const loadTimeSlotsForTable = useCallback(async () => {
          try {
               if (!selectedComplex || !fields.length) {
                    setTimeSlots([]);
                    return;
               }

               // If specific field is selected, fetch only that field's time slots
               if (selectedFieldForSchedule !== 'all') {
                    const fieldId = Number(selectedFieldForSchedule);
                    console.log(`Loading time slots for field ${fieldId}`);
                    const slotsResponse = await fetchTimeSlotsByField(fieldId);
                    console.log(`Received ${slotsResponse.data?.length || 0} slots for field ${fieldId}:`, slotsResponse.data);
                    if (slotsResponse.success && slotsResponse.data) {
                         const enrichedSlots = (slotsResponse.data || []).map(slot => ({
                              ...slot,
                              slotIdsByField: {
                                   [fieldId]: slot.slotId || slot.SlotID
                              }
                         }));
                         setTimeSlots(enrichedSlots);
                    } else {
                         setTimeSlots([]);
                    }
               } else {
                    // If "all" is selected, fetch time slots for ALL fields in the complex
                    console.log(`Loading time slots for all fields:`, fields.map(f => f.fieldId));
                    const allSlots = [];
                    const fetchPromises = fields.map(field =>
                         fetchTimeSlotsByField(field.fieldId)
                    );

                    const results = await Promise.all(fetchPromises);
                    results.forEach((result, index) => {
                         const fieldId = fields[index].fieldId;
                         console.log(`Field ${fieldId}: received ${result.data?.length || 0} slots`, result.data);
                         if (result.success && result.data && Array.isArray(result.data)) {
                              const slotsWithField = result.data.map(slot => ({
                                   ...slot,
                                   fieldId: slot.fieldId || slot.FieldId || fieldId
                              }));
                              allSlots.push(...slotsWithField);
                         }
                    });

                    console.log(`Total slots before deduplication: ${allSlots.length}`);

                    // Deduplicate slots by time range (startTime-endTime)
                    // Keep one slot per unique time range for display
                    const uniqueSlotsByTime = new Map();
                    allSlots.forEach((slot) => {
                         const startTime = slot.startTime || slot.StartTime || '';
                         const endTime = slot.endTime || slot.EndTime || '';
                         const timeKey = `${startTime}-${endTime}`;
                         const slotId = slot.slotId || slot.SlotID;
                         const fieldId = slot.fieldId || slot.FieldId || slot.FieldID;

                         if (!uniqueSlotsByTime.has(timeKey)) {
                              uniqueSlotsByTime.set(timeKey, {
                                   ...slot,
                                   slotIdsByField: fieldId ? { [fieldId]: slotId } : {},
                                   timeKey
                              });
                         } else if (fieldId) {
                              const existing = uniqueSlotsByTime.get(timeKey);
                              existing.slotIdsByField[fieldId] = slotId;
                         }
                    });

                    // Convert back to array and sort by start time
                    const uniqueSlots = Array.from(uniqueSlotsByTime.values()).sort((a, b) => {
                         const timeA = a.startTime || a.StartTime || '00:00';
                         const timeB = b.startTime || b.StartTime || '00:00';
                         return timeA.localeCompare(timeB);
                    });

                    console.log(`Total unique slots after deduplication: ${uniqueSlots.length}`, uniqueSlots);
                    setTimeSlots(uniqueSlots);
               }
          } catch (error) {
               console.error('Error loading time slots for table:', error);
               // Fallback: try to fetch all time slots
               try {
                    const allSlotsResponse = await fetchTimeSlots();
                    if (allSlotsResponse.success) {
                         setTimeSlots(allSlotsResponse.data || []);
                    } else {
                         setTimeSlots([]);
                    }
               } catch (fallbackError) {
                    console.error('Error loading all time slots:', fallbackError);
                    setTimeSlots([]);
               }
          }
     }, [selectedComplex, fields, selectedFieldForSchedule]);

     // Load schedules for table based on selected field
     const loadSchedulesForTable = useCallback(async () => {
          try {
               setLoadingSchedules(true);

               if (!selectedComplex || !fields.length) {
                    setFieldSchedules([]);
                    return;
               }

               let allSchedules = [];

               // If specific field is selected, fetch only that field's schedules
               if (selectedFieldForSchedule !== 'all') {
                    const fieldId = Number(selectedFieldForSchedule);
                    console.log(`Loading schedules for field ${fieldId}`);
                    const result = await fetchFieldSchedulesByField(fieldId);
                    console.log(`Received ${result.data?.length || 0} schedules for field ${fieldId}:`, result.data);
                    if (result.success && result.data) {
                         allSchedules = result.data;
                    }
               } else {
                    // If "all" is selected, fetch schedules for all fields in the complex
                    const fieldIds = fields.map(f => f.fieldId);
                    console.log(`Loading schedules for all fields:`, fieldIds);
                    const fetchPromises = fieldIds.map(fieldId =>
                         fetchFieldSchedulesByField(fieldId)
                    );

                    const results = await Promise.all(fetchPromises);
                    results.forEach((result, index) => {
                         const fieldId = fieldIds[index];
                         console.log(`Field ${fieldId}: received ${result.data?.length || 0} schedules`, result.data);
                         if (result.success && result.data && Array.isArray(result.data)) {
                              allSchedules = [...allSchedules, ...result.data];
                         }
                    });
               }

               console.log(`Total schedules loaded: ${allSchedules.length}`, allSchedules);
               setFieldSchedules(allSchedules);
          } catch (error) {
               console.error('Error loading schedules for table:', error);
               setFieldSchedules([]);
          } finally {
               setLoadingSchedules(false);
          }
     }, [selectedComplex, fields, selectedFieldForSchedule]);

     useEffect(() => {
          loadData();
     }, [loadData]);

     // Load time slots and schedules when complex, fields, or selectedFieldForSchedule changes
     useEffect(() => {
          if (selectedComplex && fields.length > 0) {
               loadTimeSlotsForTable();
               loadSchedulesForTable();
          }
     }, [selectedComplex, fields, selectedFieldForSchedule, loadTimeSlotsForTable, loadSchedulesForTable]);

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

     // Load all time slots when entering timeslots tab
     useEffect(() => {
          if (activeTab === 'timeslots' && selectedComplex && fields.length > 0) {
               // Load all slots for all fields
               const loadAllSlots = async () => {
                    try {
                         console.log('Loading all slots for timeslots tab');
                         const allSlots = [];
                         const fetchPromises = fields.map(field =>
                              fetchTimeSlotsByField(field.fieldId)
                         );

                         const results = await Promise.all(fetchPromises);
                         results.forEach((result, index) => {
                              const fieldId = fields[index].fieldId;
                              console.log(`Field ${fieldId}: received ${result.data?.length || 0} slots for timeslots tab`);
                              if (result.success && result.data && Array.isArray(result.data)) {
                                   allSlots.push(...result.data);
                              }
                         });

                         console.log(`Total slots for timeslots tab: ${allSlots.length}`);
                         setTimeSlots(allSlots);
                    } catch (error) {
                         console.error('Error loading slots for timeslots tab:', error);
                    }
               };
               loadAllSlots();
          }
     }, [activeTab, selectedComplex, fields]);

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
     const openScheduleModal = useCallback((defaults = {}) => {
          setScheduleFormData({
               fieldId: '',
               slotId: '',
               date: '',
               status: 'Available',
               ...defaults
          });
          setScheduleFormErrors({});
          setShowScheduleModal(true);
     }, []);

     const handleOpenScheduleModal = useCallback(() => {
          const defaultFieldId = scheduleFilterField !== 'all' && !isFieldMaintenance(Number(scheduleFilterField))
               ? scheduleFilterField
               : '';
          openScheduleModal({
               fieldId: defaultFieldId,
               slotId: '',
               date: '',
               status: 'Available'
          });
     }, [scheduleFilterField, isFieldMaintenance, openScheduleModal]);

     const handleQuickScheduleRequest = useCallback((fieldId, slotId, date) => {
          if (isFieldMaintenance(fieldId)) {
               Swal.fire({
                    icon: 'info',
                    title: 'Sân đang bảo trì',
                    text: 'Không thể tạo lịch trình cho sân đang bảo trì. Vui lòng đổi trạng thái sân trước khi tiếp tục.',
                    confirmButtonColor: '#f97316'
               });
               return;
          }

          openScheduleModal({
               fieldId: fieldId?.toString() || '',
               slotId: slotId?.toString() || '',
               date: date || ''
          });
     }, [isFieldMaintenance, openScheduleModal]);

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

          if (isFieldMaintenance(field.fieldId)) {
               await Swal.fire({
                    icon: 'info',
                    title: 'Sân đang bảo trì',
                    text: 'Không thể tạo lịch trình mới cho sân đang ở trạng thái bảo trì. Vui lòng đổi trạng thái trước khi tiếp tục.',
                    confirmButtonColor: '#f97316'
               });
               return;
          }

          setIsSubmittingSchedule(true);
          try {
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
          const start = new Date(selectedDate);
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

     // Check if slot time has passed
     const isSlotTimePassed = (date, slot) => {
          const now = new Date();
          const slotDate = new Date(date);

          // Get slot end time
          const endTimeStr = slot.EndTime || slot.endTime || '23:59:59';
          const [hours, minutes] = endTimeStr.split(':').map(Number);
          slotDate.setHours(hours || 23, minutes || 59, 59, 999);
          return slotDate < now;
     };

     // Get color for field
     const getFieldColor = (fieldId) => {
          const colors = [
               'border-blue-500 border-l-4 text-blue-500', 'border-teal-500 border-l-4 text-teal-500', 'border-green-500 border-l-4 text-green-500', 'border-yellow-500 border-l-4 text-yellow-500',
               'border-orange-500 border-l-4 text-orange-500', 'border-red-500 border-l-4 text-red-500', 'border-pink-500 border-l-4 text-pink-500', 'border-purple-500 border-l-4 text-purple-500',
               'border-indigo-500 border-l-4 text-indigo-500', 'border-cyan-500 border-l-4 text-cyan-500', 'border-emerald-500 border-l-4 text-emerald-500', 'border-lime-500 border-l-4 text-lime-500 '
          ];
          const index = Number(fieldId) % colors.length;
          return colors[index];
     };

     // Get schedules for a specific time slot and date (all fields)
     const getSchedulesForTimeSlot = (slotId, date) => {
          const dateStr = date.toISOString().split('T')[0];
          const matchingSchedules = fieldSchedules.filter(schedule => {
               const scheduleSlotId = schedule.slotId ?? schedule.SlotId ?? schedule.SlotID;
               let scheduleDateStr = '';
               if (typeof schedule.date === 'string') {
                    scheduleDateStr = schedule.date.split('T')[0];
               } else if (schedule.date && schedule.date.year) {
                    scheduleDateStr = `${schedule.date.year}-${String(schedule.date.month).padStart(2, '0')}-${String(schedule.date.day).padStart(2, '0')}`;
               }
               const matches = Number(scheduleSlotId) === Number(slotId) && scheduleDateStr === dateStr;
               if (matches) {
                    console.log(`Found schedule for slot ${slotId} on ${dateStr}:`, schedule);
               }
               return matches;
          });
          console.log(`getSchedulesForTimeSlot(${slotId}, ${dateStr}): found ${matchingSchedules.length} schedules`);
          return matchingSchedules;
     };


     // Update calendar month when selectedDate changes
     useEffect(() => {
          const selectedMonth = selectedDate.getMonth();
          const selectedYear = selectedDate.getFullYear();
          const currentMonth = calendarMonth.getMonth();
          const currentYear = calendarMonth.getFullYear();

          if (selectedMonth !== currentMonth || selectedYear !== currentYear) {
               setCalendarMonth(new Date(selectedDate));
          }
     }, [selectedDate, calendarMonth]);

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

     // Check if slot is booked - wrapped in useCallback for useMemo dependency
     const isSlotBooked = useCallback((fieldId, date, slotId) => {
          const dateStr = date.toISOString().split('T')[0];
          const schedule = fieldSchedules.find(s => {
               const scheduleFieldId = s.fieldId ?? s.FieldId;
               const scheduleSlotId = s.slotId ?? s.SlotId ?? s.SlotID;
               let scheduleDateStr = '';
               if (typeof s.date === 'string') {
                    scheduleDateStr = s.date.split('T')[0];
               } else if (s.date && s.date.year) {
                    scheduleDateStr = `${s.date.year}-${String(s.date.month).padStart(2, '0')}-${String(s.date.day).padStart(2, '0')}`;
               }
               return Number(scheduleFieldId) === Number(fieldId) &&
                    Number(scheduleSlotId) === Number(slotId) &&
                    scheduleDateStr === dateStr;
          });
          // Nếu có schedule và status là "Booked" thì coi như đã đặt
          return schedule && (schedule.status === 'Booked' || schedule.status === 'booked');
     }, [fieldSchedules]);

     // Get booking info
     const getBookingInfo = (fieldId, date, slotId) => {
          const schedule = getScheduleForSlot(fieldId, date, slotId);
          if (!schedule) return null;
          return {
               customerName: 'Khách hàng',
               customerPhone: '0912345678',
               status: schedule.status || 'Available'
          };
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
               <div className="space-y-4">
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
                              {maintenanceFields.length > 0 && (
                                   <Alert className="border-orange-200 bg-orange-50">
                                        <Info className="h-4 w-4 text-orange-600" />
                                        <AlertDescription className="text-orange-900">
                                             Có {maintenanceFields.length} sân đang ở trạng thái <strong>Bảo trì</strong>
                                             {maintenanceNoticeText ? `: ${maintenanceNoticeText}` : ''}. Các Time Slot và lịch trình mới sẽ bị khóa cho đến khi bạn đổi trạng thái sân sang "Available".
                                        </AlertDescription>
                                   </Alert>
                              )}

                              {/* Statistics Cards */}
                              <StatisticsCards statistics={statistics} />

                              {/* Complex Selector & Filter */}
                              <ComplexAndFieldSelector
                                   complexes={complexes}
                                   selectedComplex={selectedComplex}
                                   onComplexChange={(complex) => {
                                        handleComplexChange(complex);
                                        setSelectedFieldForSchedule('all');
                                   }}
                                   fields={fields}
                                   selectedFieldForSchedule={selectedFieldForSchedule}
                                   onFieldChange={setSelectedFieldForSchedule}
                                   filterStatus={filterStatus}
                                   onFilterStatusChange={setFilterStatus}
                              />

                              {/* Date Selector */}
                              <DateSelector
                                   selectedDate={selectedDate}
                                   onDateChange={setSelectedDate}
                                   weekDates={weekDates}
                              />

                              {/* Field Info - Show when specific field is selected */}
                              {selectedFieldForSchedule !== 'all' && (
                                   <Alert className="border-teal-300 bg-gradient-to-r items-center from-teal-50 to-blue-50 rounded-2xl">
                                        <Info className="h-5 w-5 text-teal-600" />
                                        <AlertDescription className="text-teal-900 text-sm font-medium">
                                             Đang xem lịch trình của: <strong>{fields.find(f => f.fieldId.toString() === selectedFieldForSchedule)?.name}</strong>
                                        </AlertDescription>
                                   </Alert>
                              )}

                              {/* Single Day Grid Timetable - Improved Design */}
                              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                   {/* Main Schedule Grid */}
                                   <div className="lg:col-span-3">
                                        <ScheduleGrid
                                             timeSlots={timeSlots}
                                             selectedDate={selectedDate}
                                             fieldSchedules={fieldSchedules}
                                             fields={fields}
                                             selectedFieldForSchedule={selectedFieldForSchedule}
                                             filterStatus={filterStatus}
                                             isSlotTimePassed={isSlotTimePassed}
                                             getSchedulesForTimeSlot={getSchedulesForTimeSlot}
                                             getFieldColor={getFieldColor}
                                             formatTime={formatTime}
                                             getBookingInfo={getBookingInfo}
                                             isFieldMaintenance={isFieldMaintenance}
                                             onRequestAddSchedule={handleQuickScheduleRequest}
                                        />
                                   </div>

                                   {/* Sidebar with Calendar and Field List */}
                                   <div className="lg:col-span-1 space-y-4">
                                        <MonthlyCalendar
                                             calendarMonth={calendarMonth}
                                             onMonthChange={setCalendarMonth}
                                             selectedDate={selectedDate}
                                             onDateSelect={(date) => {
                                                  setSelectedDate(date);
                                                  setCalendarMonth(new Date(date));
                                             }}
                                             weekDates={weekDates}
                                        />

                                        <FieldList
                                             fields={fields}
                                             selectedFieldForSchedule={selectedFieldForSchedule}
                                             selectedFields={selectedFields}
                                             onFieldToggle={(fieldIdStr) => {
                                                  const newSet = new Set(selectedFields);
                                                  if (newSet.has(fieldIdStr)) {
                                                       newSet.delete(fieldIdStr);
                                                  } else {
                                                       newSet.add(fieldIdStr);
                                                  }
                                                  setSelectedFields(newSet);
                                             }}
                                             onFieldSelect={setSelectedFieldForSchedule}
                                             getFieldColor={getFieldColor}
                                        />
                                   </div>
                              </div>
                         </>
                    )}

                    {/* Time Slots Management Tab */}
                    {activeTab === 'timeslots' && (
                         <TimeSlotsTab
                              fields={fields}
                              selectedFieldFilter={selectedFieldFilter}
                              onFieldFilterChange={setSelectedFieldFilter}
                              timeSlots={timeSlots}
                              formatTime={formatTime}
                              onAddSlot={(fieldId) => {
                                   if (!fieldId && !hasActiveFields) {
                                        Swal.fire({
                                             icon: 'info',
                                             title: 'Không có sân khả dụng',
                                             text: 'Tất cả các sân hiện đang ở trạng thái bảo trì. Vui lòng kích hoạt lại sân trước khi thêm Time Slot mới.',
                                             confirmButtonColor: '#f97316'
                                        });
                                        return;
                                   }
                                   if (fieldId && isFieldMaintenance(fieldId)) {
                                        Swal.fire({
                                             icon: 'info',
                                             title: 'Sân đang bảo trì',
                                             text: 'Không thể thêm Time Slot mới cho sân đang bảo trì.',
                                             confirmButtonColor: '#f97316'
                                        });
                                        return;
                                   }
                                   if (fieldId) {
                                        setSlotFormData({ ...slotFormData, fieldId: fieldId.toString() });
                                   }
                                   handleOpenSlotModal();
                              }}
                              onEditSlot={handleOpenSlotModal}
                              onDeleteSlot={handleDeleteSlot}
                         />
                    )}

                    {/* Manage Schedules Tab - Bảng quản lý lịch trình */}
                    {activeTab === 'manage-schedules' && (
                         <ManageSchedulesTab
                              fields={fields}
                              scheduleFilterField={scheduleFilterField}
                              onScheduleFilterFieldChange={setScheduleFilterField}
                              scheduleFilterStatus={scheduleFilterStatus}
                              onScheduleFilterStatusChange={setScheduleFilterStatus}
                              scheduleFilterDate={scheduleFilterDate}
                              onScheduleFilterDateChange={setScheduleFilterDate}
                              loadingSchedules={loadingSchedules}
                              fieldSchedules={fieldSchedules}
                              onAddSchedule={handleOpenScheduleModal}
                              onRefresh={loadFieldSchedules}
                              onUpdateStatus={handleUpdateScheduleStatus}
                              onDeleteSchedule={handleDeleteSchedule}
                         />
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
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-sm">
                                             <div className="w-6 h-6 bg-white border-2 border-gray-300 rounded flex items-center justify-center">
                                                  <span className="text-gray-300 text-lg">○</span>
                                             </div>
                                             <span className="text-sm font-medium text-gray-700">Trống</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-sm">
                                             <div className="w-6 h-6 bg-green-500 border-2 border-green-600 rounded flex items-center justify-center">
                                                  <span className="text-white text-xs font-bold">✓</span>
                                             </div>
                                             <span className="text-sm font-medium text-gray-700">Đã đặt</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg  shadow-md">
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
                    <TimeSlotModal
                         isOpen={showSlotModal}
                         onClose={handleCloseSlotModal}
                         editingSlot={editingSlot}
                         slotFormData={slotFormData}
                         setSlotFormData={setSlotFormData}
                         slotFormErrors={slotFormErrors}
                         fields={fields}
                         selectedQuickSlots={selectedQuickSlots}
                         setSelectedQuickSlots={setSelectedQuickSlots}
                         quickSlotTemplates={quickSlotTemplates}
                         isSlotExistsForField={isSlotExistsForField}
                         handleQuickSlotSelect={handleQuickSlotSelect}
                         isSubmittingSlot={isSubmittingSlot}
                         onSubmit={handleSubmitSlot}
                         loadTimeSlotsForField={loadTimeSlotsForField}
                    />

                    {/* Schedule Modal - Thêm lịch trình */}
                    <ScheduleModal
                         isOpen={showScheduleModal}
                         onClose={handleCloseScheduleModal}
                         scheduleFormData={scheduleFormData}
                         onFormDataChange={setScheduleFormData}
                         scheduleFormErrors={scheduleFormErrors}
                         fields={fields}
                         timeSlots={timeSlots}
                         formatTime={formatTime}
                         isSubmitting={isSubmittingSchedule}
                         onSubmit={handleSubmitSchedule}
                    />
               </div>
          </OwnerLayout >
     );
}
