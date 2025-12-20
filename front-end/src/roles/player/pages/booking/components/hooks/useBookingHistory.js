import { useState, useEffect, useCallback, useRef } from "react";
import {
  listBookingsByUser,
  fetchBookingsByPlayer,
} from "../../../../../../shared/index";
import { fetchFieldScheduleById } from "../../../../../../shared/services/fieldSchedules";
import { normalizeApiBookings, buildRecurringGroups } from "../utils";

// Hook quản lý lịch sử đặt sân

export function useBookingHistory(playerId) {
  const [bookings, setBookings] = useState([]);
  const [groupedBookings, setGroupedBookings] = useState({});
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [scheduleDataMap, setScheduleDataMap] = useState({});
  const [timeRemaining, setTimeRemaining] = useState({});
  const isReloadingRef = useRef(false);
  const lastReloadTimeRef = useRef(0);

  // Tải danh sách đặt sân
  const loadBookings = useCallback(async () => {
    if (!playerId) {
      setBookings([]);
      setGroupedBookings({});
      return;
    }
    setIsLoadingBookings(true);
    setBookingError("");
    try {
      const apiResult = await fetchBookingsByPlayer(playerId);
      let bookingList = [];
      if (apiResult.success) {
        bookingList = normalizeApiBookings(apiResult.data);
      } else {
        bookingList = listBookingsByUser(String(playerId));
        setBookingError(
          apiResult.error ||
            "Không thể tải dữ liệu đặt sân từ API. Đang hiển thị dữ liệu cục bộ (nếu có)."
        );
      }

      setBookings(bookingList);
      setGroupedBookings(buildRecurringGroups(bookingList));

      // Tải lịch trình cho mỗi đặt sân
      const schedulePromises = bookingList
        .filter((b) => b.scheduleId)
        .map(async (booking) => {
          try {
            const scheduleResult = await fetchFieldScheduleById(
              booking.scheduleId
            );
            if (scheduleResult.success && scheduleResult.data) {
              return {
                scheduleId: booking.scheduleId,
                data: scheduleResult.data,
              };
            }
          } catch (error) {
            console.error(
              `Error fetching schedule ${booking.scheduleId}:`,
              error
            );
          }
          return null;
        });

      const scheduleResults = await Promise.all(schedulePromises);
      const scheduleMap = {};
      scheduleResults.forEach((result) => {
        if (result && result.scheduleId) {
          scheduleMap[result.scheduleId] = result.data;
        }
      });
      setScheduleDataMap(scheduleMap);
    } catch (error) {
      const fallback = listBookingsByUser(String(playerId));
      setBookingError(error.message || "Không thể tải lịch sử đặt sân.");
      setBookings(fallback);
      setGroupedBookings(buildRecurringGroups(fallback));
    } finally {
      setIsLoadingBookings(false);
    }
  }, [playerId]);

  // Kiểm tra và cập nhật trạng thái đặt sân hết hạn
  useEffect(() => {
    if (!playerId) return;
    const checkExpiredBookings = () => {
      const now = Date.now();
      if (isReloadingRef.current || now - lastReloadTimeRef.current < 5000) {
        return;
      }

      const currentTime = new Date().getTime();
      const TEN_MINUTES = 10 * 60 * 1000;

      setBookings((prevBookings) => {
        let hasExpiredBookings = false;
        const updatedTimeRemaining = {};

        prevBookings.forEach((booking) => {
          const statusLower = String(
            booking.status || booking.bookingStatus || ""
          ).toLowerCase();
          const paymentLower = String(
            booking.paymentStatus || ""
          ).toLowerCase();
          const isPendingOrConfirmed =
            statusLower === "pending" || statusLower === "confirmed";
          const isUnpaid =
            paymentLower === "unpaid" ||
            paymentLower === "pending" ||
            paymentLower === "";
          const isPaid =
            paymentLower === "paid" || paymentLower === "đã thanh toán";
          const hasActiveQR =
            booking.qrExpiresAt &&
            new Date(booking.qrExpiresAt).getTime() > currentTime;

          if (
            !isPaid &&
            (hasActiveQR ||
              (isPendingOrConfirmed && isUnpaid && booking.createdAt))
          ) {
            let remaining = 0;
            if (hasActiveQR) {
              remaining = new Date(booking.qrExpiresAt).getTime() - currentTime;
            } else if (booking.createdAt) {
              const createdAt = new Date(booking.createdAt).getTime();
              const timeElapsed = currentTime - createdAt;
              if (timeElapsed <= TEN_MINUTES) {
                remaining = TEN_MINUTES - timeElapsed;
              }
            }

            if (remaining > 0) {
              updatedTimeRemaining[booking.id] = remaining;
            } else if (statusLower !== "expired") {
              hasExpiredBookings = true;
            }
          }
        });

        if (Object.keys(updatedTimeRemaining).length > 0) {
          setTimeRemaining((prev) => ({ ...prev, ...updatedTimeRemaining }));
        }

        if (hasExpiredBookings && !isReloadingRef.current) {
          isReloadingRef.current = true;
          lastReloadTimeRef.current = now;

          fetchBookingsByPlayer(playerId)
            .then((apiResult) => {
              if (apiResult.success) {
                const bookingList = normalizeApiBookings(apiResult.data);
                setBookings(bookingList);
                setGroupedBookings(buildRecurringGroups(bookingList));
              }
            })
            .catch((error) => {
              console.error(
                "Error reloading bookings after expiration:",
                error
              );
            })
            .finally(() => {
              setTimeout(() => {
                isReloadingRef.current = false;
              }, 3000);
            });
        }
        return prevBookings;
      });
    };
    checkExpiredBookings();
    const interval = setInterval(checkExpiredBookings, 30000);
    return () => clearInterval(interval);
  }, [playerId]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  return {
    bookings,
    setBookings,
    groupedBookings,
    setGroupedBookings,
    isLoadingBookings,
    bookingError,
    scheduleDataMap,
    timeRemaining,
    loadBookings,
  };
}

export default useBookingHistory;
