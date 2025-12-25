/**
 * Test suite cho Booking Service
 * Kiểm tra các hàm service liên quan đến đặt sân
 */
import { validateBookingDate, validateBookingData } from '../../shared/services/bookings';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Booking Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  // ==================== validateBookingDate ====================
  describe('validateBookingDate', () => {
    test('trả về invalid khi không có ngày', () => {
      const result = validateBookingDate('');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Vui lòng chọn ngày');
    });

    test('trả về invalid khi ngày null', () => {
      const result = validateBookingDate(null);
      expect(result.isValid).toBe(false);
    });

    test('trả về invalid khi ngày trong quá khứ', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];

      const result = validateBookingDate(dateStr);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('quá khứ');
    });

    test('trả về valid khi ngày hôm nay', () => {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];

      const result = validateBookingDate(dateStr);
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('');
    });

    test('trả về valid khi ngày trong tương lai (trong 30 ngày)', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const result = validateBookingDate(dateStr);
      expect(result.isValid).toBe(true);
    });

    test('trả về invalid khi ngày quá xa (> 30 ngày)', () => {
      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 31);
      const dateStr = farFuture.toISOString().split('T')[0];

      const result = validateBookingDate(dateStr);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('30 ngày');
    });

    test('trả về invalid khi ngày không hợp lệ', () => {
      const result = validateBookingDate('invalid-date');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Ngày không hợp lệ');
    });
  });

  // ==================== validateBookingData ====================
  describe('validateBookingData', () => {
    const validBookingData = {
      fieldId: 1,
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // ngày mai
      slotId: 1,
      duration: 1,
      customerName: 'Nguyen Van A',
      customerPhone: '0901234567',
    };

    test('trả về valid khi dữ liệu đầy đủ và hợp lệ', () => {
      const result = validateBookingData(validBookingData);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    test('trả về lỗi khi thiếu fieldId', () => {
      const data = { ...validBookingData, fieldId: null };
      const result = validateBookingData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.fieldId).toBeDefined();
    });

    test('trả về lỗi khi thiếu slotId', () => {
      const data = { ...validBookingData, slotId: null };
      const result = validateBookingData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.slotId).toBeDefined();
    });

    test('trả về lỗi khi thiếu customerName', () => {
      const data = { ...validBookingData, customerName: '' };
      const result = validateBookingData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.customerName).toContain('họ và tên');
    });

    test('trả về lỗi khi customerName quá ngắn', () => {
      const data = { ...validBookingData, customerName: 'A' };
      const result = validateBookingData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.customerName).toContain('2 ký tự');
    });

    test('trả về lỗi khi duration > 1.5h', () => {
      const data = { ...validBookingData, duration: 2 };
      const result = validateBookingData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.duration).toContain('1 tiếng 30 phút');
    });

    test('trả về lỗi khi duration không hợp lệ', () => {
      const data = { ...validBookingData, duration: 0 };
      const result = validateBookingData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.duration).toBeDefined();
    });

    test('trả về lỗi khi email không hợp lệ', () => {
      const data = { ...validBookingData, customerEmail: 'invalid-email' };
      const result = validateBookingData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.customerEmail).toContain('không hợp lệ');
    });

    test('chấp nhận email hợp lệ', () => {
      const data = { ...validBookingData, customerEmail: 'test@example.com' };
      const result = validateBookingData(data);
      expect(result.errors.customerEmail).toBeUndefined();
    });

    test('trả về nhiều lỗi khi có nhiều field không hợp lệ', () => {
      const data = {
        fieldId: null,
        date: '',
        slotId: null,
        customerName: '',
        customerPhone: '',
        duration: 0,
      };
      const result = validateBookingData(data);
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(1);
    });
  });
});
