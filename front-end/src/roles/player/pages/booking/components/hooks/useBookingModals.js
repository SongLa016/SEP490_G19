import { useState, useCallback } from "react";
import Swal from "sweetalert2";
import { fetchBookingsByPlayer } from "../../../../../../shared/index";
import {
  extractRequestId,
  extractParticipants,
  normalizeApiBookings,
  buildRecurringGroups,
} from "../utils";

//Hook quản lý các modal trong BookingHistory
export function useBookingModals(
  playerId,
  bookings,
  setBookings,
  setGroupedBookings,
  setBookingIdToRequest,
  setRequestJoins,
  loadMatchRequestsForBookings
) {
  const [showFindOpponentModal, setShowFindOpponentModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editingRating, setEditingRating] = useState(null);
  const [invoiceBooking, setInvoiceBooking] = useState(null);

  // Mở modal tìm đối thủ
  const handleFindOpponent = useCallback((booking) => {
    setSelectedBooking(booking);
    setShowFindOpponentModal(true);
  }, []);

  // Xử lý khi tìm đối thủ thành công
  const handleFindOpponentSuccess = useCallback(
    async (result) => {
      setShowFindOpponentModal(false);
      if (result.matchRequest) {
        const matchRequest = result.matchRequest;
        const requestId = extractRequestId(matchRequest);
        const booking = selectedBooking || result.booking;
        const bookingDisplayId = booking?.id;
        const matchRequestBookingId =
          matchRequest.bookingId ||
          matchRequest.bookingID ||
          matchRequest.BookingID;

        if (requestId && bookingDisplayId) {
          setBookingIdToRequest((prev) => {
            const updated = { ...prev };
            updated[bookingDisplayId] = matchRequest;
            if (matchRequestBookingId) {
              const normalizedMatchRequestBookingId = String(
                matchRequestBookingId
              );
              bookings.forEach((b) => {
                if (
                  String(b.bookingId) === normalizedMatchRequestBookingId &&
                  b.id
                ) {
                  updated[b.id] = matchRequest;
                }
              });
            }
            return updated;
          });

          const participants = extractParticipants(matchRequest);
          if (participants && participants.length > 0) {
            setRequestJoins((prev) => ({ ...prev, [requestId]: participants }));
          }
        }
      }

      const preservedMatchRequest = result.matchRequest;
      const preservedRequestId = extractRequestId(preservedMatchRequest);
      const preservedBooking = selectedBooking || result.booking;
      const preservedBookingId =
        preservedBooking?.id || preservedBooking?.bookingId;
      const preservedBookingDatabaseId = preservedBooking?.bookingId;
      const maxRetries = 3;
      let bookingUpdated = false;

      for (
        let retryCount = 0;
        retryCount < maxRetries && !bookingUpdated;
        retryCount++
      ) {
        const delay = retryCount === 0 ? 2000 : 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));

        try {
          if (playerId) {
            const apiResult = await fetchBookingsByPlayer(playerId);
            if (apiResult.success) {
              const bookingList = normalizeApiBookings(apiResult.data);
              const updatedBooking = bookingList.find(
                (b) =>
                  (preservedBookingDatabaseId &&
                    b.bookingId &&
                    String(b.bookingId) ===
                      String(preservedBookingDatabaseId)) ||
                  b.id === preservedBookingId ||
                  (b.bookingId &&
                    String(b.bookingId) === String(preservedBookingId)) ||
                  (b.id && String(b.id) === String(preservedBookingId))
              );

              if (updatedBooking) {
                const hasMatchRequestId =
                  updatedBooking.matchRequestId ||
                  updatedBooking.matchRequestID ||
                  updatedBooking.MatchRequestID;
                if (hasMatchRequestId || retryCount === maxRetries - 1) {
                  setBookings(bookingList);
                  setGroupedBookings(buildRecurringGroups(bookingList));
                  if (
                    preservedMatchRequest &&
                    preservedRequestId &&
                    updatedBooking.id
                  ) {
                    setBookingIdToRequest((prev) => ({
                      ...prev,
                      [updatedBooking.id]: preservedMatchRequest,
                    }));
                  }
                  bookingUpdated = true;
                }
              }
            }
          }
        } catch (error) {
          console.error(
            "Error reloading bookings (retry",
            retryCount + 1,
            "):",
            error
          );
        }
      }

      await loadMatchRequestsForBookings();
      Swal.fire("Đã gửi!", "Yêu cầu tìm đối đã được tạo.", "success");
    },
    [
      selectedBooking,
      playerId,
      bookings,
      setBookings,
      setGroupedBookings,
      setBookingIdToRequest,
      setRequestJoins,
      loadMatchRequestsForBookings,
    ]
  );

  // Mở modal đánh giá
  const handleRating = useCallback((booking) => {
    setSelectedBooking(booking);
    setEditingRating(null);
    setShowRatingModal(true);
  }, []);

  // Xử lý khi đánh giá thành công
  const handleRatingSuccess = useCallback(async (loadBookings) => {
    setShowRatingModal(false);
    setSelectedBooking(null);
    setEditingRating(null);
    Swal.fire("Thành công!", "Đánh giá của bạn đã được lưu.", "success");
    if (loadBookings) await loadBookings();
  }, []);

  // Mở modal xem hóa đơn
  const handleViewInvoice = useCallback((bookingPayload) => {
    if (!bookingPayload) return;
    setInvoiceBooking(bookingPayload);
    setShowInvoiceModal(true);
  }, []);

  // Đóng modal tìm đối thủ
  const closeFindOpponentModal = useCallback(() => {
    setShowFindOpponentModal(false);
    setSelectedBooking(null);
  }, []);

  // Đóng modal đánh giá
  const closeRatingModal = useCallback(() => {
    setShowRatingModal(false);
    setSelectedBooking(null);
    setEditingRating(null);
  }, []);

  // Đóng modal hóa đơn
  const closeInvoiceModal = useCallback(() => {
    setShowInvoiceModal(false);
    setInvoiceBooking(null);
  }, []);

  return {
    showFindOpponentModal,
    showRatingModal,
    showInvoiceModal,
    selectedBooking,
    editingRating,
    invoiceBooking,
    handleFindOpponent,
    handleFindOpponentSuccess,
    handleRating,
    handleRatingSuccess,
    handleViewInvoice,
    closeFindOpponentModal,
    closeRatingModal,
    closeInvoiceModal,
  };
}

export default useBookingModals;
