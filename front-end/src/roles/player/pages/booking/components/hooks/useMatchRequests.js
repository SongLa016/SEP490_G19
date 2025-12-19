import { useState, useCallback, useEffect } from "react";
import Swal from "sweetalert2";
import {
  fetchMatchRequestById,
  fetchMatchRequests,
  fetchMatchRequestByBookingId,
  checkBookingHasMatchRequest,
  checkMatchRequestByBooking,
  acceptMatchParticipant,
  rejectOrWithdrawParticipant,
  expireOldMatchRequests,
  fetchMyMatchHistory,
} from "../../../../../../shared/services/matchRequest";
import {
  extractRequestId,
  extractParticipants,
  getParticipantId,
  filterParticipantsForDisplay,
} from "../utils";

// Hook quản lý yêu cầu tìm đối thủ
export function useMatchRequests(bookings, user) {
  const [bookingIdToRequest, setBookingIdToRequest] = useState({});
  const [requestJoins, setRequestJoins] = useState({});
  const [playerHistories, setPlayerHistories] = useState([]);
  const [refreshingRequests, setRefreshingRequests] = useState({});
  const [processingParticipants, setProcessingParticipants] = useState({});

  // Lấy lịch sử trận đấu
  useEffect(() => {
    const loadPlayerHistory = async () => {
      if (!user?.id && !user?.userID) {
        setPlayerHistories([]);
        return;
      }
      try {
        const response = await fetchMyMatchHistory({ page: 1, size: 50 });
        if (response.success) {
          setPlayerHistories(response.data || []);
        }
      } catch (error) {
        console.warn("Error loading player history:", error);
      }
    };
    loadPlayerHistory();
  }, [user?.id, user?.userID]);

  // Tải yêu cầu tham gia trận đấu cho các booking
  const loadMatchRequestsForBookings = useCallback(async () => {
    if (!bookings || bookings.length === 0) {
      setBookingIdToRequest({});
      setRequestJoins({});
      return;
    }

    try {
      await expireOldMatchRequests();
    } catch (error) {
      console.warn("Error expiring old match requests:", error);
    }

    const map = {};
    const joinsMap = {};

    const bookingsWithRequestId = bookings.filter((booking) => {
      const requestId =
        booking.matchRequestId ||
        booking.matchRequestID ||
        booking.MatchRequestID;
      return requestId && booking.id;
    });

    if (bookingsWithRequestId.length > 0) {
      await Promise.all(
        bookingsWithRequestId.map(async (booking) => {
          const requestId =
            booking.matchRequestId ||
            booking.matchRequestID ||
            booking.MatchRequestID;
          if (!requestId || !booking.id) return;
          try {
            const detailResp = await fetchMatchRequestById(requestId);
            if (detailResp?.success && detailResp.data) {
              map[booking.id] = detailResp.data;
              joinsMap[requestId] = extractParticipants(detailResp.data);
            }
          } catch (error) {
            console.warn(
              "Error fetching match request by ID:",
              requestId,
              error
            );
          }
        })
      );
    }

    try {
      const matchRequestsResp = await fetchMatchRequests({
        page: 1,
        size: 1000,
      });
      if (matchRequestsResp.success && Array.isArray(matchRequestsResp.data)) {
        const bookingIdToMatchRequestMap = {};
        matchRequestsResp.data.forEach((matchRequest) => {
          const matchRequestBookingId =
            matchRequest.bookingId ||
            matchRequest.bookingID ||
            matchRequest.BookingID;
          if (matchRequestBookingId) {
            bookingIdToMatchRequestMap[String(matchRequestBookingId)] =
              matchRequest;
          }
        });

        await Promise.all(
          bookings.map(async (booking) => {
            const bookingId = booking.bookingId
              ? String(booking.bookingId)
              : null;
            let matchRequest = null;

            if (bookingId && bookingIdToMatchRequestMap[bookingId]) {
              matchRequest = bookingIdToMatchRequestMap[bookingId];
            }

            if (!matchRequest && bookingId) {
              try {
                const hasRequestResp = await checkBookingHasMatchRequest(
                  bookingId
                );
                if (hasRequestResp?.success && hasRequestResp.hasRequest) {
                  const matchRequestId =
                    hasRequestResp.data?.data?.matchRequestId ||
                    hasRequestResp.data?.matchRequestId;
                  if (matchRequestId) {
                    try {
                      const detailResp = await fetchMatchRequestById(
                        matchRequestId
                      );
                      if (detailResp?.success && detailResp.data) {
                        matchRequest = detailResp.data;
                      } else {
                        matchRequest = {
                          bookingId,
                          hasRequest: true,
                          placeholder: true,
                          matchRequestId,
                          id: matchRequestId,
                        };
                      }
                    } catch {
                      matchRequest = {
                        bookingId,
                        hasRequest: true,
                        placeholder: true,
                        matchRequestId,
                        id: matchRequestId,
                      };
                    }
                  } else {
                    matchRequest = {
                      bookingId,
                      hasRequest: true,
                      placeholder: true,
                    };
                  }
                }
              } catch (error) {
                console.warn(
                  "Error checking booking has match request:",
                  bookingId,
                  error
                );
              }
            }

            if (matchRequest) {
              const requestId = extractRequestId(matchRequest);
              if (booking.id) {
                map[booking.id] = matchRequest;
                if (requestId) {
                  joinsMap[requestId] = extractParticipants(matchRequest);
                }
              }
            }
          })
        );
      }
    } catch (error) {
      console.warn("Error loading match requests:", error);
    }

    const unmappedBookings = bookings.filter(
      (booking) => !map[booking.id] && booking.bookingId
    );
    if (unmappedBookings.length > 0) {
      await Promise.all(
        unmappedBookings.map(async (booking) => {
          const bookingId = booking.bookingId;
          if (!bookingId) return;
          try {
            const hasRequestResp = await checkMatchRequestByBooking(bookingId);
            if (!hasRequestResp?.success) return;
            const requestId = extractRequestId(
              hasRequestResp.data ?? hasRequestResp
            );
            if (!requestId) return;
            const detailResp = await fetchMatchRequestById(requestId);
            if (!detailResp?.success) return;
            if (booking.id) {
              map[booking.id] = detailResp.data;
              joinsMap[requestId] = extractParticipants(detailResp.data);
            }
          } catch (error) {
            console.warn("Không thể tải kèo cho booking", bookingId, error);
          }
        })
      );
    }

    setBookingIdToRequest((prev) => ({ ...prev, ...map }));
    setRequestJoins((prev) => ({ ...prev, ...joinsMap }));
  }, [bookings]);

  // Làm mới yêu cầu tham gia trận đấu
  const refreshRequestForBooking = useCallback(
    async (bookingKey, requestIdOrBookingId) => {
      if (!bookingKey || !requestIdOrBookingId) return;
      setRefreshingRequests((prev) => ({
        ...prev,
        [requestIdOrBookingId]: true,
      }));

      try {
        const currentReq = bookingIdToRequest[bookingKey];
        const isPlaceholder = currentReq?.placeholder === true;
        let detailResp;
        let actualRequestId;

        if (isPlaceholder) {
          detailResp = await fetchMatchRequestByBookingId(requestIdOrBookingId);
          actualRequestId = extractRequestId(detailResp?.data);
        } else {
          detailResp = await fetchMatchRequestById(requestIdOrBookingId);
          actualRequestId = requestIdOrBookingId;
        }

        if (!detailResp?.success) {
          Swal.fire({
            icon: "error",
            title: "Lỗi",
            text: "Không thể tải thông tin đội tham gia.",
            timer: 2000,
            showConfirmButton: false,
          });
          return;
        }

        const participants = extractParticipants(detailResp.data);
        setBookingIdToRequest((prev) => ({
          ...prev,
          [bookingKey]: detailResp.data,
        }));
        if (actualRequestId) {
          setRequestJoins((prev) => ({
            ...prev,
            [actualRequestId]: participants,
          }));
        }

        const joiningTeams = filterParticipantsForDisplay(
          participants,
          detailResp.data
        );
        if (joiningTeams && joiningTeams.length > 0) {
          const pendingCount = joiningTeams.filter(
            (p) => String(p.statusFromB || "").toLowerCase() === "pending"
          ).length;
          Swal.fire({
            icon: "success",
            title: "Đã tải đội tham gia",
            text:
              pendingCount > 0
                ? `Có ${joiningTeams.length} đội tham gia (${pendingCount} đang chờ xử lý)`
                : `Có ${joiningTeams.length} đội tham gia`,
            timer: 2000,
            showConfirmButton: false,
          });
        } else {
          Swal.fire({
            icon: "info",
            title: "Chưa có đội tham gia",
            text: "Yêu cầu của bạn chưa có đội nào tham gia.",
            timer: 2000,
            showConfirmButton: false,
          });
        }
      } catch (error) {
        console.warn("Không thể làm mới kèo:", error);
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: error.message || "Không thể tải thông tin đội tham gia.",
          timer: 2000,
          showConfirmButton: false,
        });
      } finally {
        setRefreshingRequests((prev) => {
          const updated = { ...prev };
          delete updated[requestIdOrBookingId];
          return updated;
        });
      }
    },
    [bookingIdToRequest]
  );

  // Chấp nhận người tham gia
  const handleAcceptParticipant = useCallback(
    async (bookingKey, requestId, participant) => {
      const participantId = getParticipantId(participant);
      if (!requestId || !participantId) {
        Swal.fire({
          icon: "error",
          title: "Thiếu thông tin",
          text: "Không thể xác định đội tham gia.",
        });
        return;
      }

      const confirm = await Swal.fire({
        icon: "question",
        title: "Chấp nhận đội tham gia?",
        html: `<div class="text-left space-y-2">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p class="text-sm mb-2"><strong>Thông tin đội:</strong></p>
            <div class="space-y-1 text-sm">
              <p><strong>Tên đội:</strong> ${
                participant.teamName || "Chưa có"
              }</p>
              ${
                participant.fullName
                  ? `<p><strong>Người liên hệ:</strong> ${participant.fullName}</p>`
                  : ""
              }
              ${
                participant.contactPhone
                  ? `<p><strong>Số điện thoại:</strong> ${participant.contactPhone}</p>`
                  : ""
              }
              <p><strong>Số người:</strong> ${
                participant.playerCount || "Chưa rõ"
              } người</p>
            </div>
          </div>
        </div>`,
        showCancelButton: true,
        confirmButtonText: "Chấp nhận",
        cancelButtonText: "Hủy",
        confirmButtonColor: "#10b981",
        width: "500px",
      });

      if (!confirm.isConfirmed) return;

      const processingKey = `${requestId}-${participantId}`;
      setProcessingParticipants((prev) => ({ ...prev, [processingKey]: true }));

      try {
        const response = await acceptMatchParticipant(requestId, participantId);
        if (!response.success)
          throw new Error(response.error || "Không thể chấp nhận đội này.");
        await refreshRequestForBooking(bookingKey, requestId);
        Swal.fire({
          icon: "success",
          title: "Đã chấp nhận đội tham gia",
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: error.message || "Không thể chấp nhận đội.",
        });
      } finally {
        setProcessingParticipants((prev) => {
          const updated = { ...prev };
          delete updated[processingKey];
          return updated;
        });
      }
    },
    [refreshRequestForBooking]
  );

  // Từ chối người tham gia
  const handleRejectParticipant = useCallback(
    async (bookingKey, requestId, participant) => {
      const participantId = getParticipantId(participant);
      if (!requestId || !participantId) {
        Swal.fire({
          icon: "error",
          title: "Thiếu thông tin",
          text: "Không thể xác định đội tham gia.",
        });
        return;
      }

      const confirm = await Swal.fire({
        icon: "warning",
        title: "Từ chối đội tham gia?",
        showCancelButton: true,
        confirmButtonText: "Từ chối",
        cancelButtonText: "Hủy",
        confirmButtonColor: "#ef4444",
      });

      if (!confirm.isConfirmed) return;

      const processingKey = `${requestId}-${participantId}`;
      setProcessingParticipants((prev) => ({ ...prev, [processingKey]: true }));

      try {
        const response = await rejectOrWithdrawParticipant(
          requestId,
          participantId
        );
        if (!response.success)
          throw new Error(response.error || "Không thể từ chối đội này.");
        await refreshRequestForBooking(bookingKey, requestId);
        Swal.fire({
          icon: "success",
          title: "Đã từ chối đội tham gia",
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: error.message || "Không thể từ chối đội.",
        });
      } finally {
        setProcessingParticipants((prev) => {
          const updated = { ...prev };
          delete updated[processingKey];
          return updated;
        });
      }
    },
    [refreshRequestForBooking]
  );

  useEffect(() => {
    if (bookings && bookings.length > 0) {
      loadMatchRequestsForBookings();
    }
  }, [bookings, loadMatchRequestsForBookings]);

  return {
    bookingIdToRequest,
    setBookingIdToRequest,
    requestJoins,
    setRequestJoins,
    playerHistories,
    refreshingRequests,
    processingParticipants,
    loadMatchRequestsForBookings,
    refreshRequestForBooking,
    handleAcceptParticipant,
    handleRejectParticipant,
  };
}

export default useMatchRequests;
