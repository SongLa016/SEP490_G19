// Mock data for time slots
const mockTimeSlots = [
  {
    SlotID: 1,
    SlotName: "Slot Sáng",
    StartTime: "06:00:00",
    EndTime: "08:00:00",
  },
  {
    SlotID: 2,
    SlotName: "Slot Trưa",
    StartTime: "12:00:00",
    EndTime: "14:00:00",
  },
  {
    SlotID: 3,
    SlotName: "Slot Chiều",
    StartTime: "16:00:00",
    EndTime: "18:00:00",
  },
  {
    SlotID: 4,
    SlotName: "Slot Tối",
    StartTime: "19:00:00",
    EndTime: "21:00:00",
  },
];

// Simulate API delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchTimeSlots = async () => {
  try {
    await delay(500); // Simulate API call
    return {
      success: true,
      data: mockTimeSlots,
    };
  } catch (error) {
    console.error("Error fetching time slots:", error);
    return {
      success: false,
      error: "Không thể tải danh sách slot thời gian",
    };
  }
};

export const createTimeSlot = async (timeSlotData) => {
  try {
    await delay(300);

    // Validate time slot
    if (
      !timeSlotData.SlotName ||
      !timeSlotData.StartTime ||
      !timeSlotData.EndTime
    ) {
      throw new Error("Vui lòng điền đầy đủ thông tin");
    }

    // Check for time conflicts
    const startTime = timeSlotData.StartTime;
    const endTime = timeSlotData.EndTime;

    if (startTime >= endTime) {
      throw new Error("Giờ kết thúc phải lớn hơn giờ bắt đầu");
    }

    // Check for overlapping slots
    const hasConflict = mockTimeSlots.some((slot) => {
      return startTime < slot.EndTime && endTime > slot.StartTime;
    });

    if (hasConflict) {
      throw new Error("Slot thời gian này trùng với slot đã có");
    }

    const newSlot = {
      SlotID: mockTimeSlots.length + 1,
      SlotName: timeSlotData.SlotName,
      StartTime: timeSlotData.StartTime,
      EndTime: timeSlotData.EndTime,
    };

    mockTimeSlots.push(newSlot);

    return {
      success: true,
      data: newSlot,
      message: "Tạo slot thời gian thành công",
    };
  } catch (error) {
    console.error("Error creating time slot:", error);
    return {
      success: false,
      error: error.message || "Không thể tạo slot thời gian",
    };
  }
};

export const updateTimeSlot = async (slotId, timeSlotData) => {
  try {
    await delay(300);

    const slotIndex = mockTimeSlots.findIndex((slot) => slot.SlotID === slotId);
    if (slotIndex === -1) {
      throw new Error("Không tìm thấy slot thời gian");
    }

    // Validate time slot
    if (
      !timeSlotData.SlotName ||
      !timeSlotData.StartTime ||
      !timeSlotData.EndTime
    ) {
      throw new Error("Vui lòng điền đầy đủ thông tin");
    }

    const startTime = timeSlotData.StartTime;
    const endTime = timeSlotData.EndTime;

    if (startTime >= endTime) {
      throw new Error("Giờ kết thúc phải lớn hơn giờ bắt đầu");
    }

    // Check for overlapping slots (excluding current slot)
    const hasConflict = mockTimeSlots.some((slot) => {
      return (
        slot.SlotID !== slotId &&
        startTime < slot.EndTime &&
        endTime > slot.StartTime
      );
    });

    if (hasConflict) {
      throw new Error("Slot thời gian này trùng với slot đã có");
    }

    mockTimeSlots[slotIndex] = {
      ...mockTimeSlots[slotIndex],
      SlotName: timeSlotData.SlotName,
      StartTime: timeSlotData.StartTime,
      EndTime: timeSlotData.EndTime,
    };

    return {
      success: true,
      data: mockTimeSlots[slotIndex],
      message: "Cập nhật slot thời gian thành công",
    };
  } catch (error) {
    console.error("Error updating time slot:", error);
    return {
      success: false,
      error: error.message || "Không thể cập nhật slot thời gian",
    };
  }
};

export const deleteTimeSlot = async (slotId) => {
  try {
    await delay(300);

    const slotIndex = mockTimeSlots.findIndex((slot) => slot.SlotID === slotId);
    if (slotIndex === -1) {
      throw new Error("Không tìm thấy slot thời gian");
    }

    mockTimeSlots.splice(slotIndex, 1);

    return {
      success: true,
      message: "Xóa slot thời gian thành công",
    };
  } catch (error) {
    console.error("Error deleting time slot:", error);
    return {
      success: false,
      error: error.message || "Không thể xóa slot thời gian",
    };
  }
};
