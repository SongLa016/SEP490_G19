// Format HH:MM values defensively
export const formatTime = (timeString = "00:00") => {
  if (!timeString) return "00:00";
  const [hours, minutes] = String(timeString).split(":");
  return `${hours || "00"}:${minutes || "00"}`;
};

// Format JS Date to YYYY-MM-DD without timezone shifts
export const formatDateToLocalString = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// chuẩn hóa chuỗi ngày tháng về định dạng YYYY-MM-DD
export const normalizeDateString = (dateValue) => {
  if (!dateValue) return "";

  if (typeof dateValue === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return dateValue;
    if (dateValue.includes("T")) return dateValue.split("T")[0];
    if (dateValue.includes(" ")) return dateValue.split(" ")[0];
    try {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const day = String(date.getUTCDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
    } catch (e) {
      return formatDateToLocalString(new Date(dateValue));
    }
  }

  if (
    dateValue &&
    typeof dateValue === "object" &&
    dateValue.year &&
    dateValue.month &&
    dateValue.day
  ) {
    return `${dateValue.year}-${String(dateValue.month).padStart(
      2,
      "0"
    )}-${String(dateValue.day).padStart(2, "0")}`;
  }

  if (dateValue instanceof Date) {
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, "0");
    const day = String(dateValue.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  try {
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  } catch (e) {
    // ignore
  }

  return "";
};

// Build list of future dates for month/quarter schedules
export const getAllDatesForPeriod = (scheduleType, month, quarter, year) => {
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (scheduleType === "month" && month && year) {
    const yearNum = Number(year);
    const monthNum = Number(month);
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(yearNum, monthNum - 1, day);
      if (date >= today) {
        dates.push(formatDateToLocalString(date));
      }
    }
  } else if (scheduleType === "quarter" && quarter && year) {
    const yearNum = Number(year);
    const quarterNum = Number(quarter);
    const startMonth = (quarterNum - 1) * 3 + 1;

    for (let m = startMonth; m < startMonth + 3; m++) {
      const daysInMonth = new Date(yearNum, m, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(yearNum, m - 1, day);
        if (date >= today) {
          dates.push(formatDateToLocalString(date));
        }
      }
    }
  }

  return dates;
};

// Build week (Mon-Sun) for a given selected date
export const getWeekDates = (selectedDate) => {
  const start = new Date(selectedDate);
  start.setDate(start.getDate() - start.getDay() + 1);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date);
  }
  return dates;
};

// Color palette by field
export const getFieldColor = (fieldId) => {
  const colors = [
    "border-blue-500 border-l-4 text-blue-500",
    "border-teal-500 border-l-4 text-teal-500",
    "border-green-500 border-l-4 text-green-500",
    "border-yellow-500 border-l-4 text-yellow-500",
    "border-orange-500 border-l-4 text-orange-500",
    "border-red-500 border-l-4 text-red-500",
    "border-pink-500 border-l-4 text-pink-500",
    "border-purple-500 border-l-4 text-purple-500",
    "border-indigo-500 border-l-4 text-indigo-500",
    "border-cyan-500 border-l-4 text-cyan-500",
    "border-emerald-500 border-l-4 text-emerald-500",
    "border-lime-500 border-l-4 text-lime-500 ",
  ];
  const index = Number(fieldId) % colors.length;
  return colors[index];
};

// Determine if schedule is in the past using endTime
export const isSchedulePast = (date, endTime) => {
  const now = new Date();
  const scheduleDate = new Date(date);
  const [hours, minutes] = (endTime || "00:00").split(":");
  scheduleDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
  return scheduleDate < now;
};
