// hàm tính khoảng cách giữa 2 điểm
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

// hàm chuyển đổi độ sang radian
function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

// hàm định dạng khoảng cách
export function formatDistance(distance) {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
}

// hàm lấy vị trí hiện tại của người dùng
export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  });
}

// hàm phân tích tọa độ từ chuỗi hoặc đối tượng
export function parseCoordinates(location) {
  if (!location) {
    return { latitude: null, longitude: null };
  }

  // nếu vị trí là đối tượng với lat/lng
  if (typeof location === "object") {
    return {
      latitude: location.latitude || location.lat || null,
      longitude: location.longitude || location.lng || location.lon || null,
    };
  }

  // nếu vị trí là chuỗi, thử trích xuất tọa độ
  // định dạng: "lat,lng" hoặc "lat, lng"
  if (typeof location === "string") {
    const parts = location.split(",").map((s) => s.trim());
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { latitude: lat, longitude: lng };
      }
    }
  }

  return { latitude: null, longitude: null };
}
