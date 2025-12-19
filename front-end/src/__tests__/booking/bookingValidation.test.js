/**
 * Test suite cho Booking Validation
 * Kiểm tra các hàm validation liên quan đến đặt sân
 */
import {
  deriveStatusFromApi,
  shouldShowCancelButton,
  formatPaymentCountdown,
  getPaymentRemainingMs,
  isPendingUnpaidWithin10Minutes,
  shouldShowFindOpponentButton,
  hasExistingMatchRequest,
  getRecurringStatus,
} from '../../roles/player/pages/booking/components/utils/bookingValidation';

describe('Booking Validation', () => {
  // ==================== deriveStatusFromApi ====================
  describe('deriveStatusFromApi', () => {
    test('trả về "cancelled" khi status chứa "cancel"', () => {
      expect(deriveStatusFromApi('cancelled')).toBe('cancelled');
      expect(deriveStatusFromApi('CANCELLED')).toBe('cancelled');
      expect(deriveStatusFromApi('cancel')).toBe('cancelled');
    });

    test('trả về "cancelled" khi status là "0" hoặc "reject"', () => {
      expect(deriveStatusFromApi('0')).toBe('cancelled');
      expect(deriveStatusFromApi('rejected')).toBe('cancelled');
    });

    test('trả về "completed" khi status chứa "complete" hoặc "done"', () => {
      expect(deriveStatusFromApi('completed')).toBe('completed');
      expect(deriveStatusFromApi('COMPLETE')).toBe('completed');
      expect(deriveStatusFromApi('done')).toBe('completed');
    });

    test('trả về "pending" khi status chứa "pending" hoặc "wait"', () => {
      expect(deriveStatusFromApi('pending')).toBe('pending');
      expect(deriveStatusFromApi('waiting')).toBe('pending');
      expect(deriveStatusFromApi('PENDING')).toBe('pending');
    });

    test('trả về "confirmed" khi status chứa "confirm"', () => {
      expect(deriveStatusFromApi('confirmed')).toBe('confirmed');
      expect(deriveStatusFromApi('CONFIRM')).toBe('confirmed');
    });

    test('trả về "confirmed" khi status rỗng hoặc null/undefined', () => {
      expect(deriveStatusFromApi('')).toBe('confirmed');
      expect(deriveStatusFromApi(null)).toBe('confirmed');
      expect(deriveStatusFromApi(undefined)).toBe('confirmed');
    });

    test('trả về raw status khi không match pattern nào', () => {
      expect(deriveStatusFromApi('unknown')).toBe('unknown');
      expect(deriveStatusFromApi('active')).toBe('active');
    });
  });

  // ==================== shouldShowCancelButton ====================
  describe('shouldShowCancelButton', () => {
    test('hiển thị nút hủy khi pending và chưa thanh toán', () => {
      const booking = { status: 'pending', paymentStatus: 'unpaid' };
      expect(shouldShowCancelButton(booking)).toBe(true);
    });

    test('hiển thị nút hủy khi pending và đã thanh toán', () => {
      const booking = { status: 'pending', paymentStatus: 'paid' };
      expect(shouldShowCancelButton(booking)).toBe(true);
    });

    test('hiển thị nút hủy khi confirmed và đã thanh toán', () => {
      const booking = { status: 'confirmed', paymentStatus: 'paid' };
      expect(shouldShowCancelButton(booking)).toBe(true);
    });

    test('hiển thị nút hủy với paymentStatus tiếng Việt', () => {
      const booking = { status: 'confirmed', paymentStatus: 'đã thanh toán' };
      expect(shouldShowCancelButton(booking)).toBe(true);
    });

    test('ẩn nút hủy khi đã cancelled', () => {
      const booking = { status: 'cancelled', paymentStatus: 'paid' };
      expect(shouldShowCancelButton(booking)).toBe(false);
    });

    test('ẩn nút hủy khi đã expired', () => {
      const booking = { status: 'expired', paymentStatus: 'unpaid' };
      expect(shouldShowCancelButton(booking)).toBe(false);
    });

    test('ẩn nút hủy khi confirmed nhưng chưa thanh toán', () => {
      const booking = { status: 'confirmed', paymentStatus: 'unpaid' };
      expect(shouldShowCancelButton(booking)).toBe(false);
    });

    test('xử lý booking với bookingStatus thay vì status', () => {
      const booking = { bookingStatus: 'pending', paymentStatus: 'pending' };
      expect(shouldShowCancelButton(booking)).toBe(true);
    });
  });

  // ==================== formatPaymentCountdown ====================
  describe('formatPaymentCountdown', () => {
    test('format đúng định dạng mm:ss', () => {
      expect(formatPaymentCountdown(60000)).toBe('01:00');   // 1 phút
      expect(formatPaymentCountdown(125000)).toBe('02:05'); // 2 phút 5 giây
      expect(formatPaymentCountdown(600000)).toBe('10:00'); // 10 phút
    });

    test('trả về 00:00 khi thời gian <= 0', () => {
      expect(formatPaymentCountdown(0)).toBe('00:00');
      expect(formatPaymentCountdown(-1000)).toBe('00:00');
      expect(formatPaymentCountdown(-60000)).toBe('00:00');
    });

    test('format đúng với số giây lẻ', () => {
      expect(formatPaymentCountdown(61000)).toBe('01:01');
      expect(formatPaymentCountdown(599000)).toBe('09:59');
    });
  });

  // ==================== getPaymentRemainingMs ====================
  describe('getPaymentRemainingMs', () => {
    test('trả về 0 khi booking null/undefined', () => {
      expect(getPaymentRemainingMs(null)).toBe(0);
      expect(getPaymentRemainingMs(undefined)).toBe(0);
    });

    test('trả về 0 khi không có createdAt', () => {
      expect(getPaymentRemainingMs({})).toBe(0);
      expect(getPaymentRemainingMs({ status: 'pending' })).toBe(0);
    });

    test('trả về thời gian còn lại khi booking mới tạo', () => {
      const now = new Date();
      const booking = { createdAt: now.toISOString() };
      const remaining = getPaymentRemainingMs(booking);
      // Booking mới tạo nên còn gần 10 phút (600000ms)
      expect(remaining).toBeGreaterThan(590000);
      expect(remaining).toBeLessThanOrEqual(600000);
    });

    test('trả về 0 khi đã quá 10 phút', () => {
      const past = new Date(Date.now() - 11 * 60 * 1000); // 11 phút trước
      const booking = { createdAt: past.toISOString() };
      expect(getPaymentRemainingMs(booking)).toBe(0);
    });

    test('xử lý các tên field khác nhau cho createdAt', () => {
      const now = new Date().toISOString();
      expect(getPaymentRemainingMs({ CreatedAt: now })).toBeGreaterThan(0);
      expect(getPaymentRemainingMs({ createAt: now })).toBeGreaterThan(0);
      expect(getPaymentRemainingMs({ CreateAt: now })).toBeGreaterThan(0);
    });
  });

  // ==================== isPendingUnpaidWithin10Minutes ====================
  describe('isPendingUnpaidWithin10Minutes', () => {
    test('trả về false khi booking null', () => {
      expect(isPendingUnpaidWithin10Minutes(null)).toBe(false);
      expect(isPendingUnpaidWithin10Minutes(undefined)).toBe(false);
    });

    test('trả về true khi pending, unpaid và trong 10 phút', () => {
      const booking = {
        status: 'pending',
        paymentStatus: 'unpaid',
        createdAt: new Date().toISOString(),
      };
      expect(isPendingUnpaidWithin10Minutes(booking)).toBe(true);
    });

    test('trả về false khi đã thanh toán', () => {
      const booking = {
        status: 'pending',
        paymentStatus: 'paid',
        createdAt: new Date().toISOString(),
      };
      expect(isPendingUnpaidWithin10Minutes(booking)).toBe(false);
    });

    test('trả về false khi đã cancelled', () => {
      const booking = {
        status: 'cancelled',
        paymentStatus: 'unpaid',
        createdAt: new Date().toISOString(),
      };
      expect(isPendingUnpaidWithin10Minutes(booking)).toBe(false);
    });

    test('trả về false khi đã quá 10 phút', () => {
      const past = new Date(Date.now() - 11 * 60 * 1000);
      const booking = {
        status: 'pending',
        paymentStatus: 'unpaid',
        createdAt: past.toISOString(),
      };
      expect(isPendingUnpaidWithin10Minutes(booking)).toBe(false);
    });
  });

  // ==================== shouldShowFindOpponentButton ====================
  describe('shouldShowFindOpponentButton', () => {
    test('hiển thị khi confirmed và đã thanh toán', () => {
      const booking = { status: 'confirmed', paymentStatus: 'paid' };
      expect(shouldShowFindOpponentButton(booking)).toBe(true);
    });

    test('hiển thị khi completed và đã thanh toán', () => {
      const booking = { status: 'completed', paymentStatus: 'paid' };
      expect(shouldShowFindOpponentButton(booking)).toBe(true);
    });

    test('hiển thị với paymentStatus tiếng Việt', () => {
      const booking = { status: 'confirmed', paymentStatus: 'đã thanh toán' };
      expect(shouldShowFindOpponentButton(booking)).toBe(true);
    });

    test('ẩn khi chưa thanh toán', () => {
      const booking = { status: 'confirmed', paymentStatus: 'unpaid' };
      expect(shouldShowFindOpponentButton(booking)).toBe(false);
    });

    test('ẩn khi pending dù đã thanh toán', () => {
      const booking = { status: 'pending', paymentStatus: 'paid' };
      expect(shouldShowFindOpponentButton(booking)).toBe(false);
    });

    test('ẩn khi cancelled', () => {
      const booking = { status: 'cancelled', paymentStatus: 'paid' };
      expect(shouldShowFindOpponentButton(booking)).toBe(false);
    });
  });

  // ==================== hasExistingMatchRequest ====================
  describe('hasExistingMatchRequest', () => {
    test('trả về false khi booking hoặc map null', () => {
      expect(hasExistingMatchRequest(null, {})).toBe(false);
      expect(hasExistingMatchRequest({}, null)).toBe(false);
      expect(hasExistingMatchRequest(null, null)).toBe(false);
    });

    test('trả về true khi có trong bookingIdToRequest map', () => {
      const booking = { id: 123 };
      const map = { 123: true };
      expect(hasExistingMatchRequest(booking, map)).toBe(true);
    });

    test('trả về true khi booking có matchRequestId', () => {
      const booking = { id: 123, matchRequestId: 'MR-456' };
      expect(hasExistingMatchRequest(booking, {})).toBe(true);
    });

    test('trả về true với các tên field khác nhau', () => {
      expect(hasExistingMatchRequest({ matchRequestID: 'MR-1' }, {})).toBe(true);
      expect(hasExistingMatchRequest({ MatchRequestID: 'MR-1' }, {})).toBe(true);
    });

    test('trả về false khi không có match request', () => {
      const booking = { id: 123 };
      expect(hasExistingMatchRequest(booking, {})).toBe(false);
    });
  });

  // ==================== getRecurringStatus ====================
  describe('getRecurringStatus', () => {
    test('trả về "cancelled" khi tất cả bookings đã hủy', () => {
      const group = {
        bookings: [
          { status: 'cancelled' },
          { status: 'cancelled' },
        ],
      };
      expect(getRecurringStatus(group)).toBe('cancelled');
    });

    test('trả về "completed" khi tất cả bookings đã hoàn thành', () => {
      const group = {
        bookings: [
          { status: 'completed' },
          { status: 'completed' },
        ],
      };
      expect(getRecurringStatus(group)).toBe('completed');
    });

    test('trả về "partial" khi có một số bookings bị hủy', () => {
      const group = {
        bookings: [
          { status: 'confirmed' },
          { status: 'cancelled' },
        ],
      };
      expect(getRecurringStatus(group)).toBe('partial');
    });

    test('trả về "active" khi không có booking nào bị hủy', () => {
      const group = {
        bookings: [
          { status: 'confirmed' },
          { status: 'pending' },
        ],
      };
      expect(getRecurringStatus(group)).toBe('active');
    });
  });
});
