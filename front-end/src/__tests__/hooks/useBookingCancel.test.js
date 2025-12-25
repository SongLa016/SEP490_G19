/**
 * Test suite cho useBookingCancel Hook
 * Kiểm tra logic hủy đặt sân
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBookingCancel } from '../../roles/player/pages/booking/components/hooks/useBookingCancel';

// Mock dependencies
jest.mock('sweetalert2', () => ({
  fire: jest.fn(() => Promise.resolve({ isConfirmed: true })),
}));

jest.mock('../../shared/index', () => ({
  updateBooking: jest.fn(),
  fetchBookingsByPlayer: jest.fn(() => Promise.resolve({ success: true, data: [] })),
}));

jest.mock('../../shared/services/bookings', () => ({
  cancelBooking: jest.fn(() => Promise.resolve({ success: true, message: 'Đã hủy' })),
  updateBookingStatus: jest.fn(() => Promise.resolve({ success: true })),
}));

jest.mock('../../shared/services/fieldSchedules', () => ({
  updateFieldScheduleStatus: jest.fn(() => Promise.resolve({ success: true })),
}));

describe('useBookingCancel Hook', () => {
  const mockPlayerId = 'player-123';
  const mockBookings = [
    { id: 1, status: 'confirmed', paymentStatus: 'paid', scheduleId: 100 },
    { id: 2, status: 'pending', paymentStatus: 'unpaid', scheduleId: 101 },
  ];
  const mockSetBookings = jest.fn();
  const mockGroupedBookings = {};
  const mockSetGroupedBookings = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('khởi tạo với state mặc định', () => {
    const { result } = renderHook(() =>
      useBookingCancel(
        mockPlayerId,
        mockBookings,
        mockSetBookings,
        mockGroupedBookings,
        mockSetGroupedBookings
      )
    );

    expect(result.current.showCancelModal).toBe(false);
    expect(result.current.cancelBooking).toBeNull();
    expect(result.current.isCancelling).toBe(false);
  });

  test('handleCancel mở modal với booking đúng', () => {
    const { result } = renderHook(() =>
      useBookingCancel(
        mockPlayerId,
        mockBookings,
        mockSetBookings,
        mockGroupedBookings,
        mockSetGroupedBookings
      )
    );

    act(() => {
      result.current.handleCancel(1);
    });

    expect(result.current.showCancelModal).toBe(true);
    expect(result.current.cancelBooking).toEqual(mockBookings[0]);
  });

  test('handleCancel không mở modal khi booking không tồn tại', () => {
    const { result } = renderHook(() =>
      useBookingCancel(
        mockPlayerId,
        mockBookings,
        mockSetBookings,
        mockGroupedBookings,
        mockSetGroupedBookings
      )
    );

    act(() => {
      result.current.handleCancel(999);
    });

    expect(result.current.showCancelModal).toBe(false);
    expect(result.current.cancelBooking).toBeNull();
  });

  test('closeCancelModal đóng modal và reset state', () => {
    const { result } = renderHook(() =>
      useBookingCancel(
        mockPlayerId,
        mockBookings,
        mockSetBookings,
        mockGroupedBookings,
        mockSetGroupedBookings
      )
    );

    // Mở modal trước
    act(() => {
      result.current.handleCancel(1);
    });

    expect(result.current.showCancelModal).toBe(true);

    // Đóng modal
    act(() => {
      result.current.closeCancelModal();
    });

    expect(result.current.showCancelModal).toBe(false);
    expect(result.current.cancelBooking).toBeNull();
  });

  test('handleCancelSingleRecurring mở modal cho booking trong recurring group', () => {
    const { result } = renderHook(() =>
      useBookingCancel(
        mockPlayerId,
        mockBookings,
        mockSetBookings,
        mockGroupedBookings,
        mockSetGroupedBookings
      )
    );

    act(() => {
      result.current.handleCancelSingleRecurring(2);
    });

    expect(result.current.showCancelModal).toBe(true);
    expect(result.current.cancelBooking).toEqual(mockBookings[1]);
  });

  test('các hàm callback được memoized đúng cách', () => {
    const { result, rerender } = renderHook(() =>
      useBookingCancel(
        mockPlayerId,
        mockBookings,
        mockSetBookings,
        mockGroupedBookings,
        mockSetGroupedBookings
      )
    );

    const firstHandleCancel = result.current.handleCancel;
    const firstCloseCancelModal = result.current.closeCancelModal;

    rerender();

    // Callbacks nên được memoized (cùng reference)
    expect(result.current.handleCancel).toBe(firstHandleCancel);
    expect(result.current.closeCancelModal).toBe(firstCloseCancelModal);
  });
});
