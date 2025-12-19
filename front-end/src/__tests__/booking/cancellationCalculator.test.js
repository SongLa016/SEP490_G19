/**
 * Test suite cho Cancellation Calculator
 * Kiểm tra tính toán hoàn tiền và phạt khi hủy booking
 */
import {
  calculateCancellationRefund,
  getCancellationPolicyRanges,
  formatCurrency,
} from '../../shared/utils/cancellationCalculator';

describe('Cancellation Calculator', () => {
  const depositAmount = 100000; // 100k VND

  // ==================== calculateCancellationRefund ====================
  describe('calculateCancellationRefund', () => {
    const confirmedAt = new Date(Date.now() - 60 * 60 * 1000); // 1h trước

    test('hoàn 100% khi hủy trong 0-2h trước giờ đặt', () => {
      const now = new Date();
      const bookingStart = new Date(now.getTime() + 1 * 60 * 60 * 1000); // 1h sau

      const result = calculateCancellationRefund(confirmedAt, bookingStart, depositAmount);

      expect(result.refundRate).toBe(100);
      expect(result.penaltyRate).toBe(0);
      expect(result.refundAmount).toBe(100000);
      expect(result.penaltyAmount).toBe(0);
      expect(result.timeRange).toBe('0-2h');
    });

    test('hoàn 70% khi hủy trong 2-3h trước giờ đặt', () => {
      const now = new Date();
      const bookingStart = new Date(now.getTime() + 2.5 * 60 * 60 * 1000); // 2.5h sau

      const result = calculateCancellationRefund(confirmedAt, bookingStart, depositAmount);

      expect(result.refundRate).toBe(70);
      expect(result.penaltyRate).toBe(30);
      expect(result.refundAmount).toBe(70000);
      expect(result.penaltyAmount).toBe(30000);
      expect(result.timeRange).toBe('2-3h');
    });

    test('hoàn 40% khi hủy trong 3-4h trước giờ đặt', () => {
      const now = new Date();
      const bookingStart = new Date(now.getTime() + 3.5 * 60 * 60 * 1000); // 3.5h sau

      const result = calculateCancellationRefund(confirmedAt, bookingStart, depositAmount);

      expect(result.refundRate).toBe(40);
      expect(result.penaltyRate).toBe(60);
      expect(result.refundAmount).toBe(40000);
      expect(result.penaltyAmount).toBe(60000);
      expect(result.timeRange).toBe('3-4h');
    });

    test('hoàn 10% khi hủy trong 4-5h trước giờ đặt', () => {
      const now = new Date();
      const bookingStart = new Date(now.getTime() + 4.5 * 60 * 60 * 1000); // 4.5h sau

      const result = calculateCancellationRefund(confirmedAt, bookingStart, depositAmount);

      expect(result.refundRate).toBe(10);
      expect(result.penaltyRate).toBe(90);
      expect(result.refundAmount).toBe(10000);
      expect(result.penaltyAmount).toBe(90000);
      expect(result.timeRange).toBe('4-5h');
    });

    test('không hoàn khi hủy trên 5h trước giờ đặt', () => {
      const now = new Date();
      const bookingStart = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6h sau

      const result = calculateCancellationRefund(confirmedAt, bookingStart, depositAmount);

      expect(result.refundRate).toBe(0);
      expect(result.penaltyRate).toBe(100);
      expect(result.refundAmount).toBe(0);
      expect(result.penaltyAmount).toBe(100000);
      expect(result.timeRange).toBe('> 5h');
    });

    test('không hoàn khi đã quá giờ booking', () => {
      const now = new Date();
      const bookingStart = new Date(now.getTime() - 60 * 60 * 1000); // 1h trước (đã qua)

      const result = calculateCancellationRefund(confirmedAt, bookingStart, depositAmount);

      expect(result.refundRate).toBe(0);
      expect(result.penaltyRate).toBe(100);
      expect(result.isPastBooking).toBe(true);
      expect(result.timeRange).toBe('Đã quá giờ');
    });

    test('xử lý depositAmount = 0', () => {
      const now = new Date();
      const bookingStart = new Date(now.getTime() + 1 * 60 * 60 * 1000);

      const result = calculateCancellationRefund(confirmedAt, bookingStart, 0);

      expect(result.refundAmount).toBe(0);
      expect(result.penaltyAmount).toBe(0);
    });

    test('xử lý string date inputs', () => {
      const now = new Date();
      const bookingStart = new Date(now.getTime() + 1 * 60 * 60 * 1000);

      const result = calculateCancellationRefund(
        confirmedAt.toISOString(),
        bookingStart.toISOString(),
        depositAmount
      );

      expect(result.refundRate).toBe(100);
    });

    test('hoursUntilBooking không âm', () => {
      const now = new Date();
      const bookingStart = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2h trước

      const result = calculateCancellationRefund(confirmedAt, bookingStart, depositAmount);

      expect(result.hoursUntilBooking).toBe(0);
    });
  });

  // ==================== getCancellationPolicyRanges ====================
  describe('getCancellationPolicyRanges', () => {
    test('trả về đúng 5 mốc thời gian', () => {
      const ranges = getCancellationPolicyRanges();
      expect(ranges).toHaveLength(5);
    });

    test('mốc 0-2h có refundRate 100%', () => {
      const ranges = getCancellationPolicyRanges();
      const range = ranges.find(r => r.range === '0-2h');

      expect(range).toBeDefined();
      expect(range.refundRate).toBe(100);
      expect(range.penaltyRate).toBe(0);
      expect(range.label).toBe('0-2 giờ');
    });

    test('mốc 2-3h có refundRate 70%', () => {
      const ranges = getCancellationPolicyRanges();
      const range = ranges.find(r => r.range === '2-3h');

      expect(range.refundRate).toBe(70);
      expect(range.penaltyRate).toBe(30);
    });

    test('mốc 3-4h có refundRate 40%', () => {
      const ranges = getCancellationPolicyRanges();
      const range = ranges.find(r => r.range === '3-4h');

      expect(range.refundRate).toBe(40);
      expect(range.penaltyRate).toBe(60);
    });

    test('mốc 4-5h có refundRate 10%', () => {
      const ranges = getCancellationPolicyRanges();
      const range = ranges.find(r => r.range === '4-5h');

      expect(range.refundRate).toBe(10);
      expect(range.penaltyRate).toBe(90);
    });

    test('mốc >5h có refundRate 0%', () => {
      const ranges = getCancellationPolicyRanges();
      const range = ranges.find(r => r.range === '>5h');

      expect(range.refundRate).toBe(0);
      expect(range.penaltyRate).toBe(100);
    });

    test('tổng refundRate + penaltyRate = 100 cho mỗi mốc', () => {
      const ranges = getCancellationPolicyRanges();
      ranges.forEach(range => {
        expect(range.refundRate + range.penaltyRate).toBe(100);
      });
    });
  });

  // ==================== formatCurrency ====================
  describe('formatCurrency', () => {
    test('format đúng định dạng VNĐ', () => {
      const result = formatCurrency(100000);
      expect(result).toContain('100.000');
      expect(result).toContain('₫');
    });

    test('format số lớn', () => {
      const result = formatCurrency(1500000);
      expect(result).toContain('1.500.000');
    });

    test('format số 0', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0');
    });

    test('format số thập phân', () => {
      const result = formatCurrency(99999.5);
      // VND không có số thập phân, sẽ làm tròn
      expect(result).toBeDefined();
    });

    test('format số âm', () => {
      const result = formatCurrency(-50000);
      expect(result).toContain('50.000');
      expect(result).toContain('-');
    });
  });
});
