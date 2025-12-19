const BOOKINGS_KEY = "bookings";

// hàm lấy tất cả các đặt sân
function loadAll() {
  try {
    const raw = localStorage.getItem(BOOKINGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// hàm lưu tất cả các đặt sân
function saveAll(bookings) {
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
}

// hàm tạo đặt sân
export function createBooking({ userId, data }) {
  const bookings = loadAll();
  const id = `BK-${Date.now()}`;
  const booking = {
    id,
    userId,
    createdAt: Date.now(),
    status: "confirmed",
    ...data,
  };
  bookings.unshift(booking);
  saveAll(bookings);
  return booking;
}

// hàm lấy danh sách đặt sân theo người dùng
export function listBookingsByUser(userId) {
  const bookings = loadAll();
  return bookings.filter((b) => b.userId === userId);
}

// hàm lấy đặt sân theo ID
export function getBookingById(id) {
  const bookings = loadAll();
  return bookings.find((b) => b.id === id) || null;
}

// hàm cập nhật đặt sân
export function updateBooking(id, updates) {
  const bookings = loadAll();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx < 0) return null;
  bookings[idx] = { ...bookings[idx], ...updates };
  saveAll(bookings);
  return bookings[idx];
}
