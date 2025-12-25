/**
 * Test suite cho Match Request Service (API)
 * Kiểm tra các hàm gọi API tìm đối
 */
import axios from 'axios';
import {
  fetchMatchRequests,
  fetchMatchRequestById,
  fetchMatchRequestByBookingId,
  checkBookingHasMatchRequest,
  createMatchRequestAPI,
  joinMatchRequestAPI,
  acceptMatchParticipant,
  rejectOrWithdrawParticipant,
  deleteMatchRequest,
  fetchMyMatchHistory,
} from '../../shared/services/matchRequest';

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

describe('Match Request Service (API)', () => {
  let mockAxiosInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('mock-token');
    mockAxiosInstance = axios.create();
  });

  // ==================== fetchMatchRequests ====================
  describe('fetchMatchRequests', () => {
    test('trả về danh sách match requests thành công', async () => {
      const mockData = [
        { requestId: 'MR-1', status: 'Open' },
        { requestId: 'MR-2', status: 'Open' },
      ];
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchMatchRequests({ page: 1, size: 20 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    test('xử lý response với data wrapper', async () => {
      const mockData = { data: [{ requestId: 'MR-1' }] };
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchMatchRequests();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    test('xử lý lỗi API', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce({
        response: { status: 500, statusText: 'Server Error' },
      });

      const result = await fetchMatchRequests();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ==================== fetchMatchRequestById ====================
  describe('fetchMatchRequestById', () => {
    test('trả về match request theo ID', async () => {
      const mockData = { requestId: 'MR-123', status: 'Open' };
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchMatchRequestById('MR-123');

      expect(result.success).toBe(true);
      expect(result.data.requestId).toBe('MR-123');
    });

    test('trả về lỗi khi thiếu requestId', async () => {
      const result = await fetchMatchRequestById(null);

      expect(result.success).toBe(false);
      expect(result.error).toContain('requestId');
    });

    test('xử lý lỗi 404', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce({
        response: { status: 404, statusText: 'Not Found' },
      });

      const result = await fetchMatchRequestById('invalid-id');

      expect(result.success).toBe(false);
    });
  });

  // ==================== fetchMatchRequestByBookingId ====================
  describe('fetchMatchRequestByBookingId', () => {
    test('trả về match request theo bookingId', async () => {
      const mockData = { requestId: 'MR-1', bookingId: 'BK-123' };
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchMatchRequestByBookingId('BK-123');

      expect(result.success).toBe(true);
      expect(result.data.bookingId).toBe('BK-123');
    });

    test('trả về lỗi khi thiếu bookingId', async () => {
      const result = await fetchMatchRequestByBookingId(null);

      expect(result.success).toBe(false);
      expect(result.error).toContain('bookingId');
    });
  });

  // ==================== checkBookingHasMatchRequest ====================
  describe('checkBookingHasMatchRequest', () => {
    test('trả về hasRequest = true khi có match request', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { hasRequest: true },
      });

      const result = await checkBookingHasMatchRequest('BK-123');

      expect(result.success).toBe(true);
      expect(result.hasRequest).toBe(true);
    });

    test('trả về hasRequest = false khi 404', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce({
        response: { status: 404 },
      });

      const result = await checkBookingHasMatchRequest('BK-123');

      expect(result.success).toBe(true);
      expect(result.hasRequest).toBe(false);
    });

    test('trả về lỗi khi thiếu bookingId', async () => {
      const result = await checkBookingHasMatchRequest(null);

      expect(result.success).toBe(false);
      expect(result.hasRequest).toBe(false);
    });
  });

  // ==================== createMatchRequestAPI ====================
  describe('createMatchRequestAPI', () => {
    test('tạo match request thành công', async () => {
      const mockData = { requestId: 'MR-NEW', status: 'Open' };
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockData });

      const result = await createMatchRequestAPI({
        bookingId: 'BK-123',
        level: 'intermediate',
      });

      expect(result.success).toBe(true);
      expect(result.data.requestId).toBe('MR-NEW');
    });

    test('xử lý lỗi validation', async () => {
      mockAxiosInstance.post.mockRejectedValueOnce({
        response: { status: 400, data: { message: 'Invalid data' } },
      });

      const result = await createMatchRequestAPI({});

      expect(result.success).toBe(false);
    });
  });

  // ==================== joinMatchRequestAPI ====================
  describe('joinMatchRequestAPI', () => {
    test('tham gia match request thành công', async () => {
      const mockData = { joinId: 'MRJ-1', status: 'Pending' };
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockData });

      const result = await joinMatchRequestAPI('MR-123', { level: 'beginner' });

      expect(result.success).toBe(true);
      expect(result.data.joinId).toBe('MRJ-1');
    });

    test('trả về lỗi khi thiếu requestId', async () => {
      const result = await joinMatchRequestAPI(null, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('requestId');
    });
  });

  // ==================== acceptMatchParticipant ====================
  describe('acceptMatchParticipant', () => {
    test('chấp nhận participant thành công', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: { success: true } });

      const result = await acceptMatchParticipant('MR-123', 'P-456');

      expect(result.success).toBe(true);
    });

    test('trả về lỗi khi thiếu tham số', async () => {
      const result = await acceptMatchParticipant(null, 'P-456');

      expect(result.success).toBe(false);
      expect(result.error).toContain('requestId');
    });
  });

  // ==================== rejectOrWithdrawParticipant ====================
  describe('rejectOrWithdrawParticipant', () => {
    test('từ chối participant thành công', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: { success: true } });

      const result = await rejectOrWithdrawParticipant('MR-123', 'P-456');

      expect(result.success).toBe(true);
    });

    test('trả về lỗi khi thiếu tham số', async () => {
      const result = await rejectOrWithdrawParticipant('MR-123', null);

      expect(result.success).toBe(false);
    });
  });

  // ==================== deleteMatchRequest ====================
  describe('deleteMatchRequest', () => {
    test('xóa match request thành công', async () => {
      mockAxiosInstance.delete.mockResolvedValueOnce({ data: { success: true } });

      const result = await deleteMatchRequest('MR-123');

      expect(result.success).toBe(true);
    });

    test('trả về lỗi khi thiếu requestId', async () => {
      const result = await deleteMatchRequest(null);

      expect(result.success).toBe(false);
    });
  });

  // ==================== fetchMyMatchHistory ====================
  describe('fetchMyMatchHistory', () => {
    test('trả về lịch sử match của user', async () => {
      const mockData = [
        { historyId: 'H-1', status: 'Matched' },
        { historyId: 'H-2', status: 'Expired' },
      ];
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchMyMatchHistory({ page: 1, size: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });
  });
});
