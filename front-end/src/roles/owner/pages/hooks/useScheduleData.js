import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAllComplexesWithFields } from "../../../../shared/services/fields";
import { fetchTimeSlotsByField } from "../../../../shared/services/timeSlots";
import {
  fetchFieldSchedulesByField,
  updateFieldScheduleStatus,
  deleteFieldSchedule,
} from "../../../../shared/services/fieldSchedules";
import Swal from "sweetalert2";

export const useScheduleData = (currentUserId, isDemo = false) => {
  const [loading, setLoading] = useState(true);
  const [complexes, setComplexes] = useState([]);
  const [selectedComplex, setSelectedComplex] = useState(null);
  const [fields, setFields] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [fieldSchedules, setFieldSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [modalTimeSlots, setModalTimeSlots] = useState([]);

  // Maintenance fields
  const maintenanceFields = useMemo(
    () => fields.filter(field => 
      (field.status || field.Status || '').toLowerCase() === 'maintenance'
    ),
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
    () => fields.some(field => 
      (field.status || field.Status || '').toLowerCase() !== 'maintenance'
    ),
    [fields]
  );

  const maintenanceNoticeText = useMemo(() => {
    if (!maintenanceFields.length) return '';
    const names = maintenanceFields.map(field => field.name).filter(Boolean);
    if (names.length <= 3) {
      return names.join(', ');
    }
    return `${names.slice(0, 3).join(', ')} và ${names.length - 3} sân khác`;
  }, [maintenanceFields]);

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

  // Check if a time slot already exists for a field
  const isSlotExistsForField = useCallback((fieldId, startTime, endTime) => {
    if (!fieldId) return false;
    return modalTimeSlots.some(slot => {
      const slotFieldId = slot.fieldId ?? slot.FieldId;
      if (!slotFieldId || Number(slotFieldId) !== Number(fieldId)) {
        return false;
      }
      const slotStart = slot.startTime?.substring(0, 5) || '';
      const slotEnd = slot.endTime?.substring(0, 5) || '';
      return startTime < slotEnd && endTime > slotStart;
    });
  }, [modalTimeSlots]);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const allComplexesWithFields = await fetchAllComplexesWithFields();

      // Filter only owner's complexes that are Active
      const ownerComplexes = allComplexesWithFields.filter(
        complex =>
          (complex.ownerId === currentUserId || complex.ownerId === Number(currentUserId)) &&
          (complex.status || complex.Status || "Active") === "Active"
      );

      setComplexes(ownerComplexes);

      // Select first complex by default
      if (ownerComplexes.length > 0 && !selectedComplex) {
        setSelectedComplex(ownerComplexes[0]);
        setFields(ownerComplexes[0].fields || []);
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

  // Process expired schedules
  const processExpiredSchedules = useCallback(async (schedules) => {
    if (!schedules || schedules.length === 0) return;

    const now = new Date();
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    for (const schedule of schedules) {
      try {
        const scheduleId = schedule.scheduleId ?? schedule.ScheduleID ?? schedule.id;
        if (!scheduleId) continue;

        let scheduleDate = null;
        if (typeof schedule.date === 'string') {
          scheduleDate = new Date(schedule.date);
        } else if (schedule.date && schedule.date.year) {
          scheduleDate = new Date(schedule.date.year, schedule.date.month - 1, schedule.date.day);
        }

        if (!scheduleDate) continue;

        let endTime = schedule.endTime || schedule.EndTime || '23:59:59';
        if (typeof endTime === 'object' && endTime.hour !== undefined) {
          endTime = `${String(endTime.hour).padStart(2, '0')}:${String(endTime.minute).padStart(2, '0')}:00`;
        }

        const [hours, minutes] = endTime.split(':').map(Number);
        const scheduleEndDateTime = new Date(scheduleDate);
        scheduleEndDateTime.setHours(hours || 23, minutes || 59, 0, 0);

        if (scheduleEndDateTime < now) {
          const status = (schedule.status || schedule.Status || '').toLowerCase();

          if (scheduleEndDateTime < twoDaysAgo) {
            try {
              await deleteFieldSchedule(scheduleId);
            } catch (error) {
              // ignore best-effort delete
            }
          } else if (status !== 'maintenance') {
            try {
              const updateResult = await updateFieldScheduleStatus(scheduleId, 'Maintenance');
              if (updateResult.success) {
                schedule.status = 'Maintenance';
                schedule.Status = 'Maintenance';
              }
            } catch (error) {
              // ignore best-effort update
            }
          }
        }
      } catch (error) {
        // continue loop on error
      }
    }
  }, []);

  // Load time slots for table based on selected field
  const loadTimeSlotsForTable = useCallback(async (selectedFieldForSchedule = 'all') => {
    try {
      if (!selectedComplex || !fields.length) {
        setTimeSlots([]);
        return;
      }

      if (selectedFieldForSchedule !== 'all') {
        const fieldId = Number(selectedFieldForSchedule);
        const slotsResponse = await fetchTimeSlotsByField(fieldId);
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
        // Fetch time slots for ALL fields in the complex
        const allSlots = [];
        const slotMap = new Map();

        for (const field of fields) {
          const fieldId = field.fieldId || field.FieldId;
          if (!fieldId) continue;

          try {
            const slotsResponse = await fetchTimeSlotsByField(fieldId);
            if (slotsResponse.success && slotsResponse.data) {
              for (const slot of slotsResponse.data) {
                const slotKey = `${slot.startTime}-${slot.endTime}`;
                if (slotMap.has(slotKey)) {
                  const existingSlot = slotMap.get(slotKey);
                  existingSlot.slotIdsByField[fieldId] = slot.slotId || slot.SlotID;
                } else {
                  const newSlot = {
                    ...slot,
                    slotIdsByField: {
                      [fieldId]: slot.slotId || slot.SlotID
                    }
                  };
                  slotMap.set(slotKey, newSlot);
                  allSlots.push(newSlot);
                }
              }
            }
          } catch (error) {
            console.error(`Error loading slots for field ${fieldId}:`, error);
          }
        }

        allSlots.sort((a, b) => {
          const startA = a.startTime || '';
          const startB = b.startTime || '';
          return startA.localeCompare(startB);
        });

        setTimeSlots(allSlots);
      }
    } catch (error) {
      console.error('Error loading time slots:', error);
      setTimeSlots([]);
    }
  }, [selectedComplex, fields]);

  // Load schedules for table
  const loadSchedulesForTable = useCallback(async (scheduleFilterField = 'all') => {
    try {
      setLoadingSchedules(true);

      if (!selectedComplex || !fields.length) {
        setFieldSchedules([]);
        return;
      }

      let allSchedules = [];

      if (scheduleFilterField !== 'all') {
        const fieldId = Number(scheduleFilterField);
        const schedulesResponse = await fetchFieldSchedulesByField(fieldId);
        if (schedulesResponse.success && schedulesResponse.data) {
          allSchedules = schedulesResponse.data;
        }
      } else {
        for (const field of fields) {
          const fieldId = field.fieldId || field.FieldId;
          if (!fieldId) continue;

          try {
            const schedulesResponse = await fetchFieldSchedulesByField(fieldId);
            if (schedulesResponse.success && schedulesResponse.data) {
              allSchedules.push(...schedulesResponse.data);
            }
          } catch (error) {
            console.error(`Error loading schedules for field ${fieldId}:`, error);
          }
        }
      }

      // Process expired schedules
      await processExpiredSchedules(allSchedules);

      setFieldSchedules(allSchedules);
    } catch (error) {
      console.error('Error loading schedules:', error);
      setFieldSchedules([]);
    } finally {
      setLoadingSchedules(false);
    }
  }, [selectedComplex, fields, processExpiredSchedules]);

  useEffect(() => {
    if (currentUserId) {
      loadData();
    }
  }, [currentUserId, loadData]);

  return {
    loading,
    setLoading,
    complexes,
    setComplexes,
    selectedComplex,
    setSelectedComplex,
    fields,
    setFields,
    timeSlots,
    setTimeSlots,
    fieldSchedules,
    setFieldSchedules,
    loadingSchedules,
    modalTimeSlots,
    setModalTimeSlots,
    maintenanceFields,
    maintenanceFieldIds,
    isFieldMaintenance,
    hasActiveFields,
    maintenanceNoticeText,
    loadTimeSlotsForField,
    isSlotExistsForField,
    loadData,
    processExpiredSchedules,
    loadTimeSlotsForTable,
    loadSchedulesForTable,
  };
};
