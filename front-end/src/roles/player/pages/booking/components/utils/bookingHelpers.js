// Chuyển đổi và định dạng ngày giowf
export const parseDateValue = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
// Định dạng nhãn ngày
export const formatTimeLabel = (dateObj) => {
  if (!dateObj) return "";
  return dateObj.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};
// Định dạng ngày với tên ngày trong tuần
export const formatDateWithDay = (dateStr, startTime) => {
  if (!dateStr) return "Chưa có ngày";
  try {
    let dateObj = null;
    if (startTime) {
      dateObj = new Date(startTime);
    } else if (dateStr.includes("/")) {
      const [d, m, y] = dateStr.split("/").map(Number);
      dateObj = new Date(y, m - 1, d);
    } else {
      dateObj = new Date(dateStr);
    }

    if (dateObj && !isNaN(dateObj.getTime())) {
      const dayNames = [
        "Chủ nhật",
        "Thứ hai",
        "Thứ ba",
        "Thứ tư",
        "Thứ năm",
        "Thứ sáu",
        "Thứ bảy",
      ];
      const dayName = dayNames[dateObj.getDay()];
      return `${dayName}, ${dateStr}`;
    }
  } catch (e) {}
  return dateStr;
};

// định dạng giá
export const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};
// ddeems ngược thời gian
export const formatTimeRemaining = (milliseconds) => {
  if (!milliseconds || milliseconds <= 0) return "0:00";
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

// Hiển thị thông tin mã qr
export const stripRefundQrInfo = (text) => {
  if (!text) return "";
  const markerIndex = text.toLowerCase().indexOf("refundqr");
  if (markerIndex === -1) return text;
  const stripped = text.substring(0, markerIndex);
  return stripped.replace(/\|\s*$/, "").trim();
};
