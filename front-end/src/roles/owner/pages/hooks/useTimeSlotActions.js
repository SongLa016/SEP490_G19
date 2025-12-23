import { useCallback, useState } from "react";
import Swal from "sweetalert2";
import {
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
} from "../../../../shared/services/timeSlots";

export const useTimeSlotActions = ({
  fields,
  isFieldMaintenance,
  isSlotExistsForField,
  loadTimeSlotsForField,
  loadData,
  loadTimeSlotsForTable,
}) => {
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

  // Mở modal thêm/sửa Time Slot
  const handleOpenSlotModal = useCallback((slot = null, fieldId = null) => {
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
      if (fieldIdValue) {
        loadTimeSlotsForField(fieldIdValue);
      }
    } else {
      setEditingSlot(null);
      const fieldIdToUse = fieldId !== null && fieldId !== undefined ? fieldId.toString() : '';
      setSlotFormData({
        fieldId: fieldIdToUse,
        slotName: '',
        startTime: '',
        endTime: '',
        price: ''
      });
      if (fieldIdToUse) {
        loadTimeSlotsForField(fieldIdToUse);
      }
    }
    setSlotFormErrors({});
    setSelectedQuickSlots([]);
    setShowSlotModal(true);
  }, [loadTimeSlotsForField]);

  // Xử lý chọn/bỏ chọn slot nhanh từ template
  const handleQuickSlotSelect = useCallback((template) => {
    const slotKey = `${template.start}-${template.end}`;

    if (slotFormData.fieldId && isSlotExistsForField(slotFormData.fieldId, template.start, template.end)) {
      return;
    }

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
  }, [slotFormData.fieldId, isSlotExistsForField, selectedQuickSlots]);

  // Đóng modal Time Slot
  const handleCloseSlotModal = useCallback(() => {
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
  }, []);

  // Validate dữ liệu form Time Slot
  const validateSlotForm = useCallback(() => {
    const errors = {};

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
  }, [selectedQuickSlots, slotFormData]);

  // Xử lý submit form tạo/cập nhật Time Slot
  const handleSubmitSlot = useCallback(async (e) => {
    e.preventDefault();

    if (!validateSlotForm()) {
      return;
    }

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
            const exists = isSlotExistsForField(fieldId, quickSlot.start, quickSlot.end);
            if (exists) {
              errorCount++;
              errors.push(`${quickSlot.name}: Slot đã tồn tại cho sân này`);
              continue;
            }

            const result = await createTimeSlot({
              fieldId: fieldId,
              slotName: quickSlot.name,
              startTime: quickSlot.start,
              endTime: quickSlot.end,
              price: Number(slotFormData.price)
            });

            if (result.success) {
              successCount++;
            } else {
              errorCount++;
              errors.push(`${quickSlot.name}: ${result.error}`);
            }

            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (error) {
            errorCount++;
            errors.push(`${quickSlot.name}: ${error.message || 'Lỗi không xác định'}`);
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
          await loadTimeSlotsForTable();
        } else {
          await Swal.fire({
            icon: errorCount === selectedQuickSlots.length ? 'error' : 'warning',
            title: errorCount === selectedQuickSlots.length ? 'Thêm slots thất bại' : 'Thêm một phần thành công',
            html: `<p>Thành công: ${successCount}, Thất bại: ${errorCount}</p>`,
            confirmButtonColor: errorCount === selectedQuickSlots.length ? '#ef4444' : '#f59e0b'
          });
          if (successCount > 0) {
            handleCloseSlotModal();
            await loadData();
            await loadTimeSlotsForTable();
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
        await loadTimeSlotsForTable();
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
  }, [validateSlotForm, slotFormData, fields, editingSlot, isFieldMaintenance, selectedQuickSlots, isSlotExistsForField, handleCloseSlotModal, loadData, loadTimeSlotsForTable]);

  // Xử lý xóa Time Slot
  const handleDeleteSlot = useCallback(async (slotId) => {
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
        await loadTimeSlotsForTable();
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
  }, [loadData, loadTimeSlotsForTable]);

  return {
    showSlotModal,
    setShowSlotModal,
    editingSlot,
    setEditingSlot,
    slotFormData,
    setSlotFormData,
    slotFormErrors,
    setSlotFormErrors,
    isSubmittingSlot,
    selectedQuickSlots,
    setSelectedQuickSlots,
    quickSlotTemplates,
    handleOpenSlotModal,
    handleQuickSlotSelect,
    handleCloseSlotModal,
    validateSlotForm,
    handleSubmitSlot,
    handleDeleteSlot,
  };
};
