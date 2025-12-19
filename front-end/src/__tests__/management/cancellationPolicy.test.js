/**
 * Test suite cho Cancellation Policy Service
 * Kiểm tra các chức năng quản lý chính sách hủy
 */
import axios from 'axios';
import {
  fetchCancellationPolicies,
  fetchCancellationPolicy,
  fetchCancellationPolicyByComplex,
  createCancellationPolicy,
  updateCancellationPolicy,
  deleteCancellationPolicy,
  calculateCancellationFee,
} from '../../shared/services/cancellationPolicies';

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

describe('Cancellation Policy Service', () => {
  let mockAxiosInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('mock-token');
    mockAxiosInstance = axios.create();
  });

  // ==================== fetchCancellationPolicies ====================
  describe('fetchCancellationPolicies', () => {
    test('trả về danh sách policies thành công', async () => {
      const mockData = [
        { policyId: 1, name: 'Policy 1', freeCancellationHours: 24 },
        { policyId: 2, name: 'Policy 2', freeCancellationHours: 12 },
      ];
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchCancellationPolicies();

      expect(result).toHaveLength(2);
      expect(result[0].policyId).toBe(1);
    });

    test('trả về policies theo ownerId', async () => {
      const mockData = [{ policyId: 1, ownerId: 'owner-1' }];
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchCancellationPolicies('owner-1');

      expect(result).toHaveLength(1);
      expect(result[0].ownerId).toBe('owner-1');
    });

    test('normalize response với các tên field khác nhau', async () => {
      const mockData = [{
        PolicyID: 1,
        OwnerID: 'owner-1',
        Name: 'Test Policy',
        FreeCancellationHours: 24,
        CancellationFeePercentage: 50,
        IsActive: true,
      }];
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchCancellationPolicies();

      expect(result[0].policyId).toBe(1);
      expect(result[0].ownerId).toBe('owner-1');
      expect(result[0].name).toBe('Test Policy');
      expect(result[0].freeCancellationHours).toBe(24);
      expect(result[0].cancellationFeePercentage).toBe(50);
      expect(result[0].isActive).toBe(true);
    });
  });

  // ==================== fetchCancellationPolicy ====================
  describe('fetchCancellationPolicy', () => {
    test('trả về policy theo ID', async () => {
      const mockData = { policyId: 1, name: 'Test Policy' };
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchCancellationPolicy(1);

      expect(result.policyId).toBe(1);
      expect(result.name).toBe('Test Policy');
    });

    test('trả về null khi 404', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce({
        response: { status: 404 },
      });

      const result = await fetchCancellationPolicy(999);

      expect(result).toBeNull();
    });
  });

  // ==================== fetchCancellationPolicyByComplex ====================
  describe('fetchCancellationPolicyByComplex', () => {
    test('trả về policy theo complexId', async () => {
      const mockData = { policyId: 1, complexId: 100 };
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockData });

      const result = await fetchCancellationPolicyByComplex(100);

      expect(result.complexId).toBe(100);
    });

    test('trả về null khi không tìm thấy', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce({
        response: { status: 404 },
      });

      const result = await fetchCancellationPolicyByComplex(999);

      expect(result).toBeNull();
    });
  });

  // ==================== createCancellationPolicy ====================
  describe('createCancellationPolicy', () => {
    test('tạo policy mới thành công', async () => {
      const mockData = {
        policyId: 1,
        name: 'New Policy',
        freeCancellationHours: 24,
        cancellationFeePercentage: 30,
      };
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockData });

      const result = await createCancellationPolicy({
        ownerId: 'owner-1',
        complexId: 100,
        name: 'New Policy',
        freeCancellationHours: 24,
        cancellationFeePercentage: 30,
      });

      expect(result.policyId).toBe(1);
      expect(result.name).toBe('New Policy');
    });
  });

  // ==================== updateCancellationPolicy ====================
  describe('updateCancellationPolicy', () => {
    test('cập nhật policy thành công', async () => {
      const mockData = {
        policyId: 1,
        name: 'Updated Policy',
        freeCancellationHours: 48,
      };
      mockAxiosInstance.put.mockResolvedValueOnce({ data: mockData });

      const result = await updateCancellationPolicy(1, {
        name: 'Updated Policy',
        freeCancellationHours: 48,
      });

      expect(result.name).toBe('Updated Policy');
      expect(result.freeCancellationHours).toBe(48);
    });
  });

  // ==================== deleteCancellationPolicy ====================
  describe('deleteCancellationPolicy', () => {
    test('xóa policy thành công', async () => {
      mockAxiosInstance.delete.mockResolvedValueOnce({ data: { success: true } });

      const result = await deleteCancellationPolicy(1);

      expect(result.success).toBe(true);
    });
  });

  // ==================== calculateCancellationFee ====================
  describe('calculateCancellationFee', () => {
    const activePolicy = {
      isActive: true,
      freeCancellationHours: 24,
      cancellationFeePercentage: 50,
    };

    test('miễn phí khi hủy trước freeCancellationHours', () => {
      const result = calculateCancellationFee(activePolicy, 100000, 25);

      expect(result.isFree).toBe(true);
      expect(result.fee).toBe(0);
      expect(result.percentage).toBe(0);
    });

    test('tính phí khi hủy sau freeCancellationHours', () => {
      const result = calculateCancellationFee(activePolicy, 100000, 12);

      expect(result.isFree).toBe(false);
      expect(result.fee).toBe(50000); // 50% of 100000
      expect(result.percentage).toBe(50);
    });

    test('miễn phí khi policy không active', () => {
      const inactivePolicy = { ...activePolicy, isActive: false };
      const result = calculateCancellationFee(inactivePolicy, 100000, 12);

      expect(result.isFree).toBe(true);
      expect(result.fee).toBe(0);
    });

    test('miễn phí khi không có policy', () => {
      const result = calculateCancellationFee(null, 100000, 12);

      expect(result.isFree).toBe(true);
      expect(result.fee).toBe(0);
    });

    test('tính đúng với các mức phí khác nhau', () => {
      const policy30 = { isActive: true, freeCancellationHours: 12, cancellationFeePercentage: 30 };
      const result = calculateCancellationFee(policy30, 200000, 6);

      expect(result.fee).toBe(60000); // 30% of 200000
      expect(result.percentage).toBe(30);
    });
  });
});
