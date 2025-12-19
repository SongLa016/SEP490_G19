/**
 * Test suite cho Match Request (Tìm đối)
 * Kiểm tra các chức năng tìm đối thủ
 */
import {
  createMatchRequest,
  listMatchRequests,
  getMatchRequestById,
  updateMatchRequest,
  expireMatchRequestsNow,
  joinMatchRequest,
  listMatchJoinsByRequest,
  acceptMatchJoin,
  rejectMatchJoin,
  listPlayerHistoriesByUser,
} from '../../shared/utils/communityStore';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value; }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Match Request (Tìm đối)', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  // ==================== Create Match Request ====================
  describe('createMatchRequest', () => {
    test('tạo yêu cầu tìm đối mới', () => {
      const request = createMatchRequest({
        bookingId: 'BK-123',
        ownerId: 'user-1',
        level: 'intermediate',
        note: 'Tìm đội giao hữu',
        fieldName: 'Sân A',
        address: 'Quận 7, TP.HCM',
        date: '2025-01-01',
        slotName: '18:00 - 19:00',
        price: 500000,
        createdByName: 'Nguyen Van A',
      });

      expect(request.requestId).toBeDefined();
      expect(request.requestId).toMatch(/^MR-/);
      expect(request.bookingId).toBe('BK-123');
      expect(request.ownerId).toBe('user-1');
      expect(request.level).toBe('intermediate');
      expect(request.status).toBe('Open');
      expect(request.expireAt).toBeDefined();
    });

    test('tạo yêu cầu với level mặc định là "any"', () => {
      const request = createMatchRequest({
        bookingId: 'BK-124',
        ownerId: 'user-1',
      });

      expect(request.level).toBe('any');
    });

    test('throw error khi đã có yêu cầu đang mở cho cùng booking', () => {
      createMatchRequest({
        bookingId: 'BK-125',
        ownerId: 'user-1',
      });

      expect(() => {
        createMatchRequest({
          bookingId: 'BK-125',
          ownerId: 'user-1',
        });
      }).toThrow('đang mở');
    });

    test('tạo nhiều yêu cầu cho recurring booking', () => {
      const requests = createMatchRequest({
        ownerId: 'user-1',
        isRecurring: true,
        recurringType: 'individual',
        recurringSessions: [
          { bookingId: 'BK-R1', date: '2025-01-01', slotName: '18:00' },
          { bookingId: 'BK-R2', date: '2025-01-08', slotName: '18:00' },
        ],
      });

      expect(Array.isArray(requests)).toBe(true);
      expect(requests.length).toBe(2);
    });
  });

  // ==================== List Match Requests ====================
  describe('listMatchRequests', () => {
    beforeEach(() => {
      createMatchRequest({
        bookingId: 'BK-1',
        ownerId: 'user-1',
        level: 'beginner',
        address: 'Quận 7',
        date: '2025-01-01',
      });
      createMatchRequest({
        bookingId: 'BK-2',
        ownerId: 'user-2',
        level: 'intermediate',
        address: 'Quận 1',
        date: '2025-01-02',
      });
    });

    test('lấy tất cả yêu cầu đang Open', () => {
      const requests = listMatchRequests();
      expect(requests.length).toBe(2);
    });

    test('filter theo level', () => {
      const requests = listMatchRequests({ level: 'beginner' });
      expect(requests.length).toBe(1);
      expect(requests[0].level).toBe('beginner');
    });

    test('filter theo location', () => {
      const requests = listMatchRequests({ location: 'Quận 7' });
      expect(requests.length).toBe(1);
    });

    test('filter theo date', () => {
      const requests = listMatchRequests({ date: '2025-01-01' });
      expect(requests.length).toBe(1);
    });

    test('filter với level = "all" lấy tất cả', () => {
      const requests = listMatchRequests({ level: 'all' });
      expect(requests.length).toBe(2);
    });
  });

  // ==================== Get & Update Match Request ====================
  describe('getMatchRequestById & updateMatchRequest', () => {
    let testRequest;

    beforeEach(() => {
      testRequest = createMatchRequest({
        bookingId: 'BK-100',
        ownerId: 'user-1',
      });
    });

    test('lấy request theo ID', () => {
      const request = getMatchRequestById(testRequest.requestId);
      expect(request).not.toBeNull();
      expect(request.bookingId).toBe('BK-100');
    });

    test('trả về null khi requestId không tồn tại', () => {
      const request = getMatchRequestById('invalid-id');
      expect(request).toBeNull();
    });

    test('cập nhật status của request', () => {
      const updated = updateMatchRequest(testRequest.requestId, {
        status: 'Pending',
      });
      expect(updated.status).toBe('Pending');
    });

    test('cập nhật note của request', () => {
      const updated = updateMatchRequest(testRequest.requestId, {
        note: 'Updated note',
      });
      expect(updated.note).toBe('Updated note');
    });
  });

  // ==================== Expire Match Requests ====================
  describe('expireMatchRequestsNow', () => {
    test('expire các request đã quá hạn', () => {
      // Tạo request với expireAt trong quá khứ
      const request = createMatchRequest({
        bookingId: 'BK-EXP',
        ownerId: 'user-1',
      });

      // Manually set expireAt to past
      updateMatchRequest(request.requestId, {
        expireAt: Date.now() - 1000,
      });

      expireMatchRequestsNow();

      const updated = getMatchRequestById(request.requestId);
      expect(updated.status).toBe('Expired');
    });

    test('không expire request đã Matched', () => {
      const request = createMatchRequest({
        bookingId: 'BK-MATCHED',
        ownerId: 'user-1',
      });

      updateMatchRequest(request.requestId, {
        status: 'Matched',
        expireAt: Date.now() - 1000,
      });

      expireMatchRequestsNow();

      const updated = getMatchRequestById(request.requestId);
      expect(updated.status).toBe('Matched');
    });
  });

  // ==================== Join Match Request ====================
  describe('joinMatchRequest', () => {
    let testRequest;

    beforeEach(() => {
      testRequest = createMatchRequest({
        bookingId: 'BK-JOIN',
        ownerId: 'owner-1',
      });
    });

    test('tham gia yêu cầu tìm đối', () => {
      const join = joinMatchRequest({
        requestId: testRequest.requestId,
        userId: 'user-2',
        level: 'intermediate',
      });

      expect(join.joinId).toBeDefined();
      expect(join.joinId).toMatch(/^MRJ-/);
      expect(join.requestId).toBe(testRequest.requestId);
      expect(join.status).toBe('Pending');

      // Request status chuyển sang Pending
      const request = getMatchRequestById(testRequest.requestId);
      expect(request.status).toBe('Pending');
    });

    test('throw error khi request không tồn tại', () => {
      expect(() => {
        joinMatchRequest({
          requestId: 'invalid-id',
          userId: 'user-2',
        });
      }).toThrow('không tồn tại');
    });

    test('throw error khi đã gửi yêu cầu tham gia', () => {
      joinMatchRequest({
        requestId: testRequest.requestId,
        userId: 'user-2',
      });

      expect(() => {
        joinMatchRequest({
          requestId: testRequest.requestId,
          userId: 'user-2',
        });
      }).toThrow('đã gửi yêu cầu');
    });

    test('throw error khi request đã Matched', () => {
      updateMatchRequest(testRequest.requestId, { status: 'Matched' });

      expect(() => {
        joinMatchRequest({
          requestId: testRequest.requestId,
          userId: 'user-2',
        });
      }).toThrow('không còn mở');
    });
  });

  // ==================== Accept & Reject Match Join ====================
  describe('acceptMatchJoin & rejectMatchJoin', () => {
    let testRequest;
    let testJoin;

    beforeEach(() => {
      testRequest = createMatchRequest({
        bookingId: 'BK-ACCEPT',
        ownerId: 'owner-1',
        fieldName: 'Sân Test',
        date: '2025-01-01',
      });

      testJoin = joinMatchRequest({
        requestId: testRequest.requestId,
        userId: 'user-2',
      });
    });

    test('chấp nhận yêu cầu tham gia', () => {
      const result = acceptMatchJoin({ joinId: testJoin.joinId });

      expect(result.join.status).toBe('Accepted');
      expect(result.request.status).toBe('Matched');
    });

    test('tự động reject các join khác khi accept một join', () => {
      const join2 = joinMatchRequest({
        requestId: testRequest.requestId,
        userId: 'user-3',
      });

      acceptMatchJoin({ joinId: testJoin.joinId });

      const joins = listMatchJoinsByRequest(testRequest.requestId);
      const rejectedJoin = joins.find((j) => j.joinId === join2.joinId);
      expect(rejectedJoin.status).toBe('Rejected');
    });

    test('tạo player history khi match thành công', () => {
      acceptMatchJoin({ joinId: testJoin.joinId });

      const ownerHistory = listPlayerHistoriesByUser('owner-1');
      const joinerHistory = listPlayerHistoriesByUser('user-2');

      expect(ownerHistory.length).toBe(1);
      expect(ownerHistory[0].role).toBe('Creator');
      expect(joinerHistory.length).toBe(1);
      expect(joinerHistory[0].role).toBe('Joiner');
    });

    test('từ chối yêu cầu tham gia', () => {
      const rejected = rejectMatchJoin({ joinId: testJoin.joinId });
      expect(rejected.status).toBe('Rejected');

      // Request quay về Open nếu không còn pending join
      const request = getMatchRequestById(testRequest.requestId);
      expect(request.status).toBe('Open');
    });
  });

  // ==================== List Match Joins ====================
  describe('listMatchJoinsByRequest', () => {
    test('lấy danh sách joins của request', () => {
      const request = createMatchRequest({
        bookingId: 'BK-LIST',
        ownerId: 'owner-1',
      });

      joinMatchRequest({ requestId: request.requestId, userId: 'user-2' });
      joinMatchRequest({ requestId: request.requestId, userId: 'user-3' });

      const joins = listMatchJoinsByRequest(request.requestId);
      expect(joins.length).toBe(2);
    });
  });
});
