/**
 * Test suite cho Booking Cancellation Request Service
 * Kiểm tra các chức năng yêu cầu hủy booking
 */
import axios from 'axios';
import {
  fetchOwnerCancellationRequests,
  fetchCancellationRequestById,
  createCancellationRequest,
  confirmCancellationRequest,
  deleteCancellationRequest,
} from '../../shared/services/bookingCancellationRequest';

// Mock axios
jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return {
    create: jest.fn(() => mockAxiosInstance),
    ...mockAxiosInstance,
  };
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Booking Cancellation Request Service', () => {
  let mockAxiosInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('mock-token');
    mockAxiosInstance = axios.create();
  });

  // ==================== fetchOwnerCancellationRequests ====================
  describe('fetchOwnerCancellationRequests', () => {
    test('trả về danh sách yêu cầu hủy của owner', async () => {
      const mockData = [
        { id: 1, bookingId: 'BK-1', status: 'Pending', refundAmount: 50000 },
        { id: 2, bookingId: 'BK-2', status: 'Confirmed', refundAmount: 100000 },
      ];
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchOwnerCancellationRequests();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[0].bookingId).toBe('BK-1');
    });

    test('normalize response với các tên field khác nhau', async () => {
      const mockData = [{
        Id: 1,
        BookingId: 'BK-1',
        Reason: 'Test reason',
        Status: 'Pending',
        RefundAmount: 50000,
        CreatedAt: '2025-01-01T00:00:00Z',
      }];
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchOwnerCancellationRequests();

      expect(result[0].id).toBe(1);
      expect(result[0].bookingId).toBe('BK-1');
      expect(result[0].reason).toBe('Test reason');
      expect(result[0].status).toBe('Pending');
      expect(result[0].refundAmount).toBe(50000);
    });

    test('trả về mảng rỗng khi không có data', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: null });

      const result = await fetchOwnerCancellationRequests();

      expect(result).toEqual([]);
    });
  });

  // ==================== fetchCancellationRequestById ====================
  describe('fetchCancellationRequestById', () => {
    test('trả về yêu cầu hủy theo ID', async () => {
      const mockData = {
        id: 1,
        bookingId: 'BK-1',
        reason: 'Bận việc',
        status: 'Pending',
      };
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchCancellationRequestById(1);

      expect(result.id).toBe(1);
      expect(result.reason).toBe('Bận việc');
    });

    test('trả về null khi 404', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce({
        response: { status: 404 },
      });

      const result = await fetchCancellationRequestById(999);

      expect(result).toBeNull();
    });
  });

  // ==================== createCancellationRequest ====================
  describe('createCancellationRequest', () => {
    test('tạo yêu cầu hủy mới thành công', async () => {
      const mockData = {
        id: 1,
        bookingId: 'BK-123',
        reason: 'Thay đổi kế hoạch',
        status: 'Pending',
      };
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockData });

      const result = await createCancellationRequest({
        bookingId: 'BK-123',
        reason: 'Thay đổi kế hoạch',
      });

      expect(result.id).toBe(1);
      expect(result.status).toBe('Pending');
    });

    test('throw error khi validation fail', async () => {
      mockAxiosInstance.post.mockRejectedValueOnce({
        response: { status: 400, data: { message: 'Invalid booking' } },
      });

      await expect(createCancellationRequest({})).rejects.toThrow();
    });
  });

  // ==================== confirmCancellationRequest ====================
  describe('confirmCancellationRequest', () => {
    test('xác nhận yêu cầu hủy thành công', async () => {
      const mockData = {
        id: 1,
        status: 'Confirmed',
        confirmedAt: '2025-01-01T12:00:00Z',
      };
      mockAxiosInstance.put.mockResolvedValueOnce({ data: mockData });

      const result = await confirmCancellationRequest(1);

      expect(result.status).toBe('Confirmed');
      expect(result.confirmedAt).toBeDefined();
    });

    test('throw error khi không tìm thấy request', async () => {
      mockAxiosInstance.put.mockRejectedValueOnce({
        response: { status: 404, statusText: 'Not Found' },
      });

      await expect(confirmCancellationRequest(999)).rejects.toThrow();
    });
  });

  // ==================== deleteCancellationRequest ====================
  describe('deleteCancellationRequest', () => {
    test('xóa/từ chối yêu cầu hủy thành công', async () => {
      mockAxiosInstance.delete.mockResolvedValueOnce({ data: { success: true } });

      const result = await deleteCancellationRequest(1);

      expect(result.success).toBe(true);
    });

    test('throw error khi không có quyền', async () => {
      mockAxiosInstance.delete.mockRejectedValueOnce({
        response: { status: 403, statusText: 'Forbidden' },
      });

      await expect(deleteCancellationRequest(1)).rejects.toThrow('không có quyền');
    });
  });

  // ==================== Error Handling ====================
  describe('Error Handling', () => {
    test('xử lý lỗi 401 - phiên hết hạn', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce({
        response: { status: 401, statusText: 'Unauthorized' },
      });

      await expect(fetchOwnerCancellationRequests()).rejects.toThrow('đăng nhập');
    });

    test('xử lý lỗi 500 - server error', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce({
        response: { status: 500, statusText: 'Internal Server Error' },
      });

      await expect(fetchOwnerCancellationRequests()).rejects.toThrow('máy chủ');
    });

    test('xử lý lỗi network', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce({
        request: {},
        message: 'Network Error',
      });

      await expect(fetchOwnerCancellationRequests()).rejects.toThrow('kết nối');
    });
  });
});
