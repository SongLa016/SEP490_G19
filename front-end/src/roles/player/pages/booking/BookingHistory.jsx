import React, { useState, useEffect, useMemo } from "react";
import { Calendar, MapPin, Receipt, Search, Repeat, CalendarDays, Trash2, Star, SlidersHorizontal, ArrowUpDown, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, BarChart3, RotateCcw, Calendar as CalendarIcon, CreditCard, Clock, CheckCircle, AlertTriangle, XCircle, UserSearch, UserSearchIcon, Info, RefreshCw, Loader2 } from "lucide-react";
import { Section, Container, Card, CardContent, Input, Button, Badge, Select, SelectTrigger, SelectContent, SelectItem, SelectValue, DatePicker, LoadingList, FadeIn, SlideIn, StaggerContainer, Modal } from "../../../../shared/components/ui";
import { listBookingsByUser, updateBooking, fetchBookingsByPlayer, generateQRCode, confirmPaymentAPI } from "../../../../shared/index";
import { cancelBooking as cancelBookingAPI } from "../../../../shared/services/bookings";
import {
     fetchMatchRequestById,
     fetchMatchRequests,
     checkMatchRequestByBooking,
     acceptMatchParticipant,
     rejectOrWithdrawParticipant,
     expireOldMatchRequests,
     fetchMyMatchHistory
} from "../../../../shared/services/matchRequests";
import FindOpponentModal from "../../../../shared/components/FindOpponentModal";
import RecurringOpponentModal from "../../../../shared/components/RecurringOpponentModal";
import RatingModal from "../../../../shared/components/RatingModal";
import InvoiceModal from "../../../../shared/components/InvoiceModal";
import CancelBookingModal from "../../../../shared/components/CancelBookingModal";
import { fetchFieldScheduleById } from "../../../../shared/services/fieldSchedules";
import Swal from 'sweetalert2';

const parseDateValue = (value) => {
     if (!value) return null;
     const date = new Date(value);
     return Number.isNaN(date.getTime()) ? null : date;
};

const formatTimeLabel = (dateObj) => {
     if (!dateObj) return "";
     return dateObj.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit"
     });
};

const formatDateWithDay = (dateStr, startTime) => {
     if (!dateStr) return "Chưa có ngày";
     try {
          let dateObj = null;
          if (startTime) {
               dateObj = new Date(startTime);
          } else if (dateStr.includes('/')) {
               const [d, m, y] = dateStr.split('/').map(Number);
               dateObj = new Date(y, m - 1, d);
          } else {
               dateObj = new Date(dateStr);
          }

          if (dateObj && !isNaN(dateObj.getTime())) {
               const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
               const dayName = dayNames[dateObj.getDay()];
               return `${dayName}, ${dateStr}`;
          }
     } catch (e) {
          // Fallback to original date string
     }
     return dateStr;
};

const stripRefundQrInfo = (text) => {
     if (!text) return "";
     const markerIndex = text.toLowerCase().indexOf("refundqr");
     if (markerIndex === -1) return text;
     const stripped = text.substring(0, markerIndex);
     return stripped.replace(/\|\s*$/, "").trim();
};

const extractRequestId = (payload) => {
     if (!payload) return null;
     if (typeof payload === "number") return payload;
     if (payload.requestId) return payload.requestId;
     if (payload.matchRequestId) return payload.matchRequestId;
     if (payload.id) return payload.id;
     if (payload.data) return extractRequestId(payload.data);
     if (payload.hasRequest && payload.request) return extractRequestId(payload.request);
     if (payload.hasRequest && payload.id) return payload.id;
     return null;
};

const extractParticipants = (detail) => {
     if (!detail) return [];

     // Direct arrays that already represent participants
     if (Array.isArray(detail)) return detail;

     const candidateKeys = [
          "participants",
          "participantsList",
          "joinRequests",
          "joins",
          "joinResponses",
          "matchJoinResponses",
          "matchJoinRequests",
          "matchJoins",
          "matchParticipants",
          "pendingParticipants"
     ];

     for (const key of candidateKeys) {
          if (Array.isArray(detail[key])) {
               return detail[key];
          }
     }

     // Some APIs wrap the payload in data/result fields
     if (detail.data) {
          const nested = extractParticipants(detail.data);
          if (Array.isArray(nested) && nested.length > 0) {
               return nested;
          }
     }
     if (detail.result) {
          const nested = extractParticipants(detail.result);
          if (Array.isArray(nested) && nested.length > 0) {
               return nested;
          }
     }

     return [];
};

const getRequestOwnerId = (request) => {
     if (!request) return null;
     return (
          request.ownerId ||
          request.ownerID ||
          request.userId ||
          request.userID ||
          request.createdById ||
          request.createdByID ||
          request.createdByUserId ||
          request.createdByUserID ||
          request.creatorUserId ||
          request.creatorId ||
          request.creatorID ||
          request.createdBy ||
          null
     );
};

const getOwnerTeamNames = (request) => {
     if (!request) return [];
     const names = [
          request.creatorTeamName,
          request.homeTeamName,
          request.hostTeamName,
          request.ownerTeamName,
          request.teamName,
          request.ownerTeam,
          request?.owner?.teamName,
          request?.homeTeam?.name,
          request?.hostTeam?.name,
          request?.booking?.teamName
     ];
     return names
          .filter((name) => typeof name === "string" && name.trim().length > 0)
          .map((name) => name.trim().toLowerCase());
};

const isOwnerParticipant = (participant, ownerId, ownerTeamNames = []) => {
     if (!participant) return false;
     if (participant.isOwnerTeam || participant.isHostTeam || participant.role === "owner") return true;

     const participantTeamName = (participant.teamName || participant.fullName || "")
          .toString()
          .trim()
          .toLowerCase();

     if (participantTeamName && ownerTeamNames.includes(participantTeamName)) {
          return true;
     }

     if (ownerId == null) return false;

     const ownerValue = String(ownerId);
     const possibleOwnerIds = [
          participant.ownerId,
          participant.ownerID,
          participant.userId,
          participant.userID,
          participant.playerId,
          participant.playerID,
          participant.createdById,
          participant.createdByID,
          participant.creatorId,
          participant.creatorID,
          participant.createdByUserId,
          participant.createdByUserID,
          participant.hostUserId,
          participant.hostUserID,
          participant.teamOwnerId,
          participant.teamOwnerID,
          participant?.user?.id,
          participant?.user?.userId,
          participant?.user?.userID,
          participant?.owner?.id,
          participant?.owner?.userId,
          participant?.owner?.userID
     ]
          .filter((val) => val !== undefined && val !== null)
          .map((val) => String(val));

     if (!possibleOwnerIds.includes(ownerValue)) {
          return false;
     }

     if (ownerTeamNames.length === 0) {
          return true;
     }

     return ownerTeamNames.includes(participantTeamName);
};

const normalizeStatusValue = (value) => {
     if (value === undefined || value === null) return "";
     const raw = value.toString().trim().toLowerCase();
     if (!raw) return "";
     if (raw.includes("accept") || raw.includes("approve") || raw.includes("confirm") || raw.includes("match")) return "accepted";
     if (raw.includes("reject") || raw.includes("deny") || raw.includes("decline")) return "rejected";
     if (raw.includes("withdraw")) return "withdrawn";
     if (raw.includes("cancel")) return "cancelled";
     if (raw.includes("pending") || raw.includes("wait")) return "pending";
     if (raw === "0") return "pending";
     return raw;
};

const getOwnerDecisionStatus = (participant) => {
     if (!participant) return "";
     const ownerStatusSources = [
          participant.statusFromA,
          participant.statusFromOwner,
          participant.statusFromHost,
          participant.statusFromCreator,
          participant.statusFromTeamA,
          participant.statusFromRequester,
          participant.ownerStatus,
          participant.hostDecision,
          participant.approvalStatus,
          participant.status
     ];

     for (const source of ownerStatusSources) {
          const normalized = normalizeStatusValue(source);
          if (normalized) return normalized;
     }
     return "";
};

const getOpponentDecisionStatus = (participant) => {
     if (!participant) return "";
     const opponentStatusSources = [
          participant.statusFromB,
          participant.statusFromParticipant,
          participant.statusFromTeam,
          participant.statusFromTeamB,
          participant.opponentStatus,
          participant.teamStatus,
          participant.joinStatus,
          participant.state,
          participant.participantStatus,
          participant.responseStatus
     ];

     for (const source of opponentStatusSources) {
          const normalized = normalizeStatusValue(source);
          if (normalized) return normalized;
     }
     return "";
};

const participantNeedsOwnerAction = (participant) => {
     const ownerStatus = getOwnerDecisionStatus(participant);
     return !ownerStatus || ownerStatus === "pending";
};

const isParticipantAcceptedByOwner = (participant) => getOwnerDecisionStatus(participant) === "accepted";

const isParticipantRejectedByOwner = (participant) => getOwnerDecisionStatus(participant) === "rejected";

const normalizeParticipantStatus = (participant) => {
     const ownerStatus = getOwnerDecisionStatus(participant);
     const opponentStatus = getOpponentDecisionStatus(participant);

     if (ownerStatus === "accepted" && opponentStatus === "accepted") {
          return "Hai đội đã xác nhận";
     }

     if (ownerStatus === "accepted" && (!opponentStatus || opponentStatus === "pending")) {
          return "Đã chấp nhận • Chờ đội bạn";
     }

     if (participantNeedsOwnerAction(participant)) {
          return "Chờ bạn duyệt";
     }

     if (ownerStatus === "rejected") {
          return "Đã từ chối";
     }

     if (opponentStatus === "rejected" || opponentStatus === "cancelled") {
          return "Đội bạn đã hủy";
     }

     if (opponentStatus === "withdrawn") {
          return "Đội bạn đã rút";
     }

     const fallback =
          ownerStatus ||
          opponentStatus ||
          normalizeStatusValue(
               participant?.status ??
               participant?.state ??
               participant?.joinStatus ??
               participant?.joinState
          ) ||
          "pending";

     return fallback.charAt(0).toUpperCase() + fallback.slice(1);
};

const filterParticipantsForDisplay = (participants, request) => {
     if (!Array.isArray(participants)) return [];
     const ownerId = getRequestOwnerId(request);
     const ownerTeamNames = getOwnerTeamNames(request);
     return participants.filter((participant) => !isOwnerParticipant(participant, ownerId, ownerTeamNames));
};

const getParticipantId = (participant) => {
     if (!participant) return null;
     return participant.participantId || participant.joinId || participant.id || null;
};

const deriveStatusFromApi = (statusInput) => {
     const raw = (statusInput ?? "").toString().toLowerCase();
     if (!raw) return "confirmed";
     if (raw.includes("cancel") || raw.includes("reject") || raw === "0") return "cancelled";
     if (raw.includes("complete") || raw.includes("done")) return "completed";
     if (raw.includes("pending") || raw.includes("wait")) return "pending";
     if (raw.includes("confirm")) return "confirmed";
     return raw;
};

const normalizeApiBookings = (items = []) =>
     items.map((item, index) => {
          // Debug: Log raw data từ API
          console.log(`🔍 [Normalize Booking ${index}] Raw API data:`, {
               bookingId: item.bookingId ?? item.bookingID ?? item.id,
               scheduleId: item.scheduleId ?? item.scheduleID ?? item.ScheduleID,
               slotId: item.slotId ?? item.slotID ?? item.SlotID,
               date: item.date,
               startTime: item.startTime,
               endTime: item.endTime,
               slotName: item.slotName,
               time: item.time,
               duration: item.duration,
               fullItem: item
          });

          const start = parseDateValue(item.startTime);
          const end = parseDateValue(item.endTime);
          const timeLabel = start && end ? `${formatTimeLabel(start)} - ${formatTimeLabel(end)}` : (item.slotName || item.time || "");
          const durationMinutes = start && end ? Math.max(15, Math.round((end - start) / 60000)) : item.duration;

          const normalized = {
               id: String(item.bookingId ?? item.bookingID ?? item.id ?? `API-${index}`),
               bookingId: item.bookingId ?? item.bookingID ?? item.id ?? `API-${index}`,
               // Database fields
               userId: item.userId ?? item.userID ?? item.UserID,
               scheduleId: item.scheduleId ?? item.scheduleID ?? item.ScheduleID,
               slotId: item.slotId ?? item.slotID ?? item.SlotID,
               totalPrice: Number(item.totalPrice ?? item.TotalPrice ?? item.price ?? 0),
               depositAmount: Number(item.depositAmount ?? item.DepositAmount ?? 0),
               bookingStatus: item.bookingStatus ?? item.BookingStatus ?? item.status,
               paymentStatus: item.paymentStatus ?? item.PaymentStatus ?? "Pending",
               hasOpponent: Boolean(item.hasOpponent ?? item.HasOpponent ?? false),
               matchRequestId: item.matchRequestId ?? item.matchRequestID ?? item.MatchRequestID ?? null,
               qrCode: item.qrCode ?? item.QRCode ?? null,
               qrExpiresAt: item.qrExpiresAt ?? item.QRExpiresAt ?? null,
               createdAt: item.createdAt ?? item.CreatedAt ?? item.startTime,
               confirmedAt: item.confirmedAt ?? item.ConfirmedAt ?? null,
               cancelledAt: item.cancelledAt ?? item.CancelledAt ?? null,
               cancelledBy: item.cancelledBy ?? item.CancelledBy ?? null,
               cancelReason: item.cancelReason ?? item.CancelReason ?? null,
               // Display fields
               fieldName: item.fieldName || "Chưa rõ sân",
               address: item.complexName || item.fieldAddress || item.address || "",
               date: start ? start.toLocaleDateString("vi-VN") : item.date || "",
               time: timeLabel,
               slotName: item.slotName,
               startTime: item.startTime,
               endTime: item.endTime,
               duration: durationMinutes,
               price: Number(item.totalPrice ?? item.TotalPrice ?? item.price ?? 0),
               paymentMethod: item.paymentMethod,
               status: deriveStatusFromApi(item.status || item.bookingStatus || item.BookingStatus),
               isRecurring: Boolean(item.isRecurring),
               recurringGroupId: item.recurringGroupId,
               weekNumber: item.weekNumber,
               totalWeeks: item.totalWeeks || item.recurringWeeks || item.totalSessions || 0,
               apiSource: item
          };

          // Debug: Log normalized data
          console.log(`🔍 [Normalize Booking ${index}] Normalized data:`, {
               id: normalized.id,
               scheduleId: normalized.scheduleId,
               slotId: normalized.slotId,
               date: normalized.date,
               time: normalized.time,
               startTime: normalized.startTime,
               endTime: normalized.endTime,
               duration: normalized.duration,
               slotName: normalized.slotName
          });

          // Kiểm tra nếu chuẩn: 06:00 - 07:30, Thứ 2 ngày 1/12/2025
          const expectedTime = "06:00 - 07:30";
          const expectedDateStr = "01/12/2025";
          if (normalized.time === expectedTime && normalized.date && normalized.date.includes("01/12/2025")) {
               console.log(`✅ [Normalize Booking ${index}] Dữ liệu CHUẨN sau normalize:`, {
                    time: normalized.time,
                    date: normalized.date,
                    startTime: normalized.startTime,
                    endTime: normalized.endTime
               });
          } else if (normalized.scheduleId || normalized.slotId) {
               console.log(`⚠️ [Normalize Booking ${index}] Dữ liệu KHÔNG CHUẨN sau normalize:`, {
                    actualTime: normalized.time,
                    expectedTime: expectedTime,
                    actualDate: normalized.date,
                    expectedDate: expectedDateStr,
                    startTime: normalized.startTime,
                    endTime: normalized.endTime
               });
          }

          return normalized;
     });

const buildRecurringGroups = (bookingList = []) => {
     const grouped = {};
     bookingList.forEach((booking) => {
          if (booking.isRecurring && booking.recurringGroupId) {
               if (!grouped[booking.recurringGroupId]) {
                    grouped[booking.recurringGroupId] = {
                         groupId: booking.recurringGroupId,
                         fieldName: booking.fieldName,
                         address: booking.address,
                         time: booking.time,
                         duration: booking.duration,
                         price: booking.price,
                         paymentMethod: booking.paymentMethod,
                         totalWeeks: booking.totalWeeks || 0,
                         bookings: []
                    };
               }
               grouped[booking.recurringGroupId].bookings.push(booking);
          }
     });
     return grouped;
};

export default function BookingHistory({ user }) {
     const [query, setQuery] = useState("");
     const [bookings, setBookings] = useState([]);
     const [groupedBookings, setGroupedBookings] = useState({});
     const [showRecurringDetails, setShowRecurringDetails] = useState({});
     const [statusFilter, setStatusFilter] = useState("all");
     const [dateFrom, setDateFrom] = useState("");
     const [dateTo, setDateTo] = useState("");
     const [sortBy, setSortBy] = useState("newest");
     const [currentPage, setCurrentPage] = useState(1);
     const pageSize = 5;
     const [bookingIdToRequest, setBookingIdToRequest] = useState({});
     const [requestJoins, setRequestJoins] = useState({});
     const [playerHistories, setPlayerHistories] = useState([]);
     const [showFindOpponentModal, setShowFindOpponentModal] = useState(false);
     const [showRecurringOpponentModal, setShowRecurringOpponentModal] = useState(false);
     const [showRatingModal, setShowRatingModal] = useState(false);
     const [showInvoiceModal, setShowInvoiceModal] = useState(false);
     const [showCancelModal, setShowCancelModal] = useState(false);
     const [cancelBooking, setCancelBooking] = useState(null);
     const [isCancelling, setIsCancelling] = useState(false);
     const [selectedBooking, setSelectedBooking] = useState(null);
     const [invoiceBooking, setInvoiceBooking] = useState(null);
     const [opponentData, setOpponentData] = useState(null);
     const [isLoadingBookings, setIsLoadingBookings] = useState(false);
     const [bookingError, setBookingError] = useState("");
     const [showPaymentModal, setShowPaymentModal] = useState(false);
     const [paymentBooking, setPaymentBooking] = useState(null);
     const [paymentQRCode, setPaymentQRCode] = useState(null);
     const [isLoadingQR, setIsLoadingQR] = useState(false);
     const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
     const [timeRemaining, setTimeRemaining] = useState({}); // Track time remaining for each booking
     const [scheduleDataMap, setScheduleDataMap] = useState({}); // Map scheduleId -> schedule data from API
     const playerId = user?.userID || user?.UserID || user?.id || user?.Id || user?.userId;

     // Scroll to top when filters or sorting change
     useEffect(() => {
          window.scrollTo({
               top: 0,
               behavior: 'smooth'
          });
          // Brief loading indication for filter changes
     }, [statusFilter, sortBy, dateFrom, dateTo, currentPage]);

     useEffect(() => {
          let isMounted = true;

          const loadBookings = async () => {
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
                         setBookingError(apiResult.error || "Không thể tải dữ liệu đặt sân từ API. Đang hiển thị dữ liệu cục bộ (nếu có).");
                    }

                    if (!isMounted) return;
                    setBookings(bookingList);
                    setGroupedBookings(buildRecurringGroups(bookingList));

                    // Fetch schedule data for each booking
                    const schedulePromises = bookingList
                         .filter(b => b.scheduleId)
                         .map(async (booking) => {
                              try {
                                   const scheduleResult = await fetchFieldScheduleById(booking.scheduleId);
                                   if (scheduleResult.success && scheduleResult.data) {
                                        return {
                                             scheduleId: booking.scheduleId,
                                             data: scheduleResult.data
                                        };
                                   }
                              } catch (error) {
                                   console.error(`Error fetching schedule ${booking.scheduleId}:`, error);
                              }
                              return null;
                         });

                    const scheduleResults = await Promise.all(schedulePromises);
                    const scheduleMap = {};
                    scheduleResults.forEach(result => {
                         if (result && result.scheduleId) {
                              scheduleMap[result.scheduleId] = result.data;
                         }
                    });

                    if (!isMounted) return;
                    setScheduleDataMap(scheduleMap);
                    console.log("📅 [Booking History] Loaded schedule data:", scheduleMap);
               } catch (error) {
                    console.error("Error loading booking history:", error);
                    const fallback = listBookingsByUser(String(playerId));
                    if (isMounted) {
                         setBookingError(error.message || "Không thể tải lịch sử đặt sân.");
                         setBookings(fallback);
                         setGroupedBookings(buildRecurringGroups(fallback));
                    }
               } finally {
                    if (isMounted) {
                         setIsLoadingBookings(false);
                    }
               }
          };

          loadBookings();

          return () => {
               isMounted = false;
          };
     }, [playerId]);

     const loadMatchRequestsForBookings = React.useCallback(async () => {
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

          // First pass: Check bookings that already have matchRequestId in their data
          // This is the most reliable way to find match requests after reload
          const bookingsWithRequestId = bookings.filter(booking => {
               const requestId = booking.matchRequestId || booking.matchRequestID || booking.MatchRequestID;
               return requestId && booking.id;
          });

          if (bookingsWithRequestId.length > 0) {
               await Promise.all(
                    bookingsWithRequestId.map(async (booking) => {
                         const requestId = booking.matchRequestId || booking.matchRequestID || booking.MatchRequestID;
                         if (!requestId || !booking.id) return;

                         try {
                              // Fetch detail of the match request using the ID from booking data
                              const detailResp = await fetchMatchRequestById(requestId);
                              if (detailResp?.success && detailResp.data) {
                                   map[booking.id] = detailResp.data;
                                   joinsMap[requestId] = extractParticipants(detailResp.data);

                                   console.log("✅ [loadMatchRequests] Mapped from booking.matchRequestId:", {
                                        bookingId: booking.bookingId,
                                        bookingDisplayId: booking.id,
                                        requestId: requestId
                                   });
                              }
                         } catch (error) {
                              console.warn("Error fetching match request by ID:", requestId, error);
                         }
                    })
               );
          }

          try {
               // Second pass: Fetch all match requests from database and match by bookingId
               const matchRequestsResp = await fetchMatchRequests({ page: 1, size: 1000 });

               if (matchRequestsResp.success && Array.isArray(matchRequestsResp.data)) {
                    // Create a map from bookingId to matchRequest (normalize to string for comparison)
                    const bookingIdToMatchRequestMap = {};

                    matchRequestsResp.data.forEach((matchRequest) => {
                         const matchRequestBookingId = matchRequest.bookingId || matchRequest.bookingID || matchRequest.BookingID;
                         if (matchRequestBookingId) {
                              // Normalize to string for consistent comparison
                              const normalizedId = String(matchRequestBookingId);
                              bookingIdToMatchRequestMap[normalizedId] = matchRequest;
                         }
                    });

                    // Map match requests to bookings that don't already have a match request
                    bookings.forEach((booking) => {
                         // Skip if already mapped in first pass
                         if (map[booking.id]) return;

                         // Only compare booking.bookingId (database ID) with matchRequest.bookingId
                         // booking.id is just a display key, not the actual database ID
                         const bookingId = booking.bookingId ? String(booking.bookingId) : null;

                         // Try to find match request by bookingId
                         let matchRequest = null;
                         if (bookingId && bookingIdToMatchRequestMap[bookingId]) {
                              matchRequest = bookingIdToMatchRequestMap[bookingId];
                         }

                         if (matchRequest) {
                              const requestId = extractRequestId(matchRequest);
                              if (requestId && booking.id) {
                                   // Use booking.id as key (for display), but match by booking.bookingId
                                   map[booking.id] = matchRequest;
                                   joinsMap[requestId] = extractParticipants(matchRequest);

                                   console.log("✅ [loadMatchRequests] Mapped match request by bookingId:", {
                                        bookingId: booking.bookingId,
                                        bookingDisplayId: booking.id,
                                        requestId: requestId,
                                        matchRequestBookingId: matchRequest.bookingId
                                   });
                              }
                         } else if (bookingId) {
                              // Log when no match found for debugging
                              console.log("⚠️ [loadMatchRequests] No match request found for booking:", {
                                   bookingId: booking.bookingId,
                                   bookingDisplayId: booking.id,
                                   availableMatchRequestIds: Object.keys(bookingIdToMatchRequestMap)
                              });
                         }
                    });

                    console.log("Match requests loaded:", {
                         totalMatchRequests: matchRequestsResp.data.length,
                         mappedBookings: Object.keys(map).length,
                         bookingIdMap: Object.keys(bookingIdToMatchRequestMap),
                         bookings: bookings.map(b => ({ id: b.id, bookingId: b.bookingId, matchRequestId: b.matchRequestId }))
                    });
               }
          } catch (error) {
               console.warn("Error loading match requests:", error);
          }

          // Third pass: Fallback for bookings that still don't have match requests
          // Try individual checks for each booking that wasn't mapped yet
          const unmappedBookings = bookings.filter(booking => !map[booking.id] && booking.bookingId);
          if (unmappedBookings.length > 0) {
               await Promise.all(
                    unmappedBookings.map(async (booking) => {
                         // Use booking.bookingId (database ID) for API calls, not booking.id (display key)
                         const bookingId = booking.bookingId;
                         if (!bookingId) {
                              console.log("⚠️ [loadMatchRequests] Booking missing bookingId:", {
                                   bookingDisplayId: booking.id,
                                   booking: booking
                              });
                              return;
                         }
                         try {
                              // Check via API using booking.bookingId (database ID)
                              const hasRequestResp = await checkMatchRequestByBooking(bookingId);
                              if (!hasRequestResp?.success) return;
                              const requestId = extractRequestId(hasRequestResp.data ?? hasRequestResp);

                              if (!requestId) return;

                              // Fetch detail of the match request
                              const detailResp = await fetchMatchRequestById(requestId);
                              if (!detailResp?.success) return;

                              // Map using booking.id (display key) but matched by booking.bookingId
                              if (booking.id) {
                                   map[booking.id] = detailResp.data;
                                   joinsMap[requestId] = extractParticipants(detailResp.data);

                                   console.log("✅ [loadMatchRequests] Fallback mapped match request:", {
                                        bookingId: booking.bookingId,
                                        bookingDisplayId: booking.id,
                                        requestId: requestId
                                   });
                              }
                         } catch (error) {
                              console.warn("Không thể tải kèo cho booking", bookingId, error);
                         }
                    })
               );
          }

          // Merge with existing state instead of replacing completely
          // This preserves match requests that were just created but might not be in API yet
          setBookingIdToRequest(prev => {
               const merged = { ...prev, ...map };
               console.log("🔄 [loadMatchRequests] Merged bookingIdToRequest:", {
                    previous: Object.keys(prev).length,
                    new: Object.keys(map).length,
                    merged: Object.keys(merged).length
               });
               return merged;
          });
          setRequestJoins(prev => ({ ...prev, ...joinsMap }));
     }, [bookings]);

     useEffect(() => {
          loadMatchRequestsForBookings();
     }, [loadMatchRequestsForBookings]);

     const [refreshingRequests, setRefreshingRequests] = useState({}); // Track which requests are being refreshed
     const [processingParticipants, setProcessingParticipants] = useState({}); // Track which participants are being processed (accept/reject)

     const refreshRequestForBooking = React.useCallback(async (bookingKey, requestId) => {
          if (!bookingKey || !requestId) return;

          // Set loading state
          setRefreshingRequests(prev => ({ ...prev, [requestId]: true }));

          try {
               const detailResp = await fetchMatchRequestById(requestId);
               if (!detailResp?.success) {
                    Swal.fire({
                         icon: 'error',
                         title: 'Lỗi',
                         text: 'Không thể tải thông tin đội tham gia.',
                         timer: 2000,
                         showConfirmButton: false
                    });
                    return;
               }

               const participants = extractParticipants(detailResp.data);
               setBookingIdToRequest(prev => ({ ...prev, [bookingKey]: detailResp.data }));
               setRequestJoins(prev => ({ ...prev, [requestId]: participants }));

               // Show success message if there are new participants
               if (participants && participants.length > 0) {
                    const pendingCount = participants.filter(p => p.status === "Pending").length;
                    if (pendingCount > 0) {
                         Swal.fire({
                              icon: 'success',
                              title: 'Đã tải đội tham gia',
                              text: `Có ${participants.length} đội tham gia (${pendingCount} đang chờ xử lý)`,
                              timer: 2000,
                              showConfirmButton: false
                         });
                    } else {
                         Swal.fire({
                              icon: 'success',
                              title: 'Đã tải đội tham gia',
                              text: `Có ${participants.length} đội tham gia`,
                              timer: 1500,
                              showConfirmButton: false
                         });
                    }
               } else {
                    Swal.fire({
                         icon: 'info',
                         title: 'Chưa có đội tham gia',
                         text: 'Yêu cầu của bạn chưa có đội nào tham gia.',
                         timer: 2000,
                         showConfirmButton: false
                    });
               }
          } catch (error) {
               console.warn("Không thể làm mới kèo:", error);
               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: error.message || 'Không thể tải thông tin đội tham gia.',
                    timer: 2000,
                    showConfirmButton: false
               });
          } finally {
               // Clear loading state
               setRefreshingRequests(prev => {
                    const updated = { ...prev };
                    delete updated[requestId];
                    return updated;
               });
          }
     }, []);

     const handleAcceptParticipant = async (bookingKey, requestId, participant) => {
          const participantId = getParticipantId(participant);
          if (!requestId || !participantId) {
               Swal.fire({
                    icon: 'error',
                    title: 'Thiếu thông tin',
                    text: 'Không thể xác định đội tham gia.',
               });
               return;
          }

          const confirm = await Swal.fire({
               icon: 'question',
               title: 'Chấp nhận đội tham gia?',
               html: `
                   <div class="text-left space-y-1">
                        <p class="text-sm"><strong>Đội:</strong> ${participant.teamName || `User: ${participantId}`}</p>
                        <p class="text-sm"><strong>Trình độ:</strong> ${participant.level || participant.skillLevel || 'N/A'}</p>
                        <p class="text-sm"><strong>Trạng thái:</strong> ${participant.status}</p>
                   </div>
              `,
               showCancelButton: true,
               confirmButtonText: 'Chấp nhận',
               cancelButtonText: 'Hủy',
               confirmButtonColor: '#10b981'
          });

          if (!confirm.isConfirmed) return;

          // Set loading state
          const processingKey = `${requestId}-${participantId}`;
          setProcessingParticipants(prev => ({ ...prev, [processingKey]: true }));

          try {
               console.log("✅ [AcceptParticipant] Calling API:", {
                    requestId,
                    participantId,
                    endpoint: `/api/match-requests/${requestId}/accept/${participantId}`
               });

               const response = await acceptMatchParticipant(requestId, participantId);

               if (!response.success) {
                    throw new Error(response.error || "Không thể chấp nhận đội này.");
               }

               console.log("✅ [AcceptParticipant] API success:", response.data);

               // Refresh the request to get updated participant list
               await refreshRequestForBooking(bookingKey, requestId);

               Swal.fire({
                    icon: 'success',
                    title: 'Đã chấp nhận đội tham gia',
                    text: `Đội "${participant.teamName || `User: ${participantId}`}" đã được chấp nhận tham gia.`,
                    timer: 2000,
                    showConfirmButton: false
               });
          } catch (error) {
               console.error("❌ [AcceptParticipant] Error:", error);
               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: error.message || 'Không thể chấp nhận đội. Vui lòng thử lại.',
                    confirmButtonText: 'Đóng'
               });
          } finally {
               // Clear loading state
               setProcessingParticipants(prev => {
                    const updated = { ...prev };
                    delete updated[processingKey];
                    return updated;
               });
          }
     };

     const handleRejectParticipant = async (bookingKey, requestId, participant) => {
          const participantId = getParticipantId(participant);
          if (!requestId || !participantId) {
               Swal.fire({
                    icon: 'error',
                    title: 'Thiếu thông tin',
                    text: 'Không thể xác định đội tham gia.',
               });
               return;
          }

          const confirm = await Swal.fire({
               icon: 'warning',
               title: 'Từ chối đội tham gia?',
               html: `
                   <div class="text-left space-y-1">
                        <p class="text-sm"><strong>Đội:</strong> ${participant.teamName || `User: ${participantId}`}</p>
                        <p class="text-sm"><strong>Trình độ:</strong> ${participant.level || participant.skillLevel || 'N/A'}</p>
                        <p class="text-sm text-red-600"><strong>⚠️ Hành động này không thể hoàn tác.</strong></p>
                   </div>
              `,
               showCancelButton: true,
               confirmButtonText: 'Từ chối',
               cancelButtonText: 'Hủy',
               confirmButtonColor: '#ef4444'
          });

          if (!confirm.isConfirmed) return;

          // Set loading state
          const processingKey = `${requestId}-${participantId}`;
          setProcessingParticipants(prev => ({ ...prev, [processingKey]: true }));

          try {
               console.log("❌ [RejectParticipant] Calling API:", {
                    requestId,
                    participantId,
                    endpoint: `/api/match-requests/${requestId}/reject-or-withdraw/${participantId}`
               });

               const response = await rejectOrWithdrawParticipant(requestId, participantId);

               if (!response.success) {
                    throw new Error(response.error || "Không thể từ chối đội này.");
               }

               console.log("✅ [RejectParticipant] API success:", response.data);

               // Refresh the request to get updated participant list
               await refreshRequestForBooking(bookingKey, requestId);

               Swal.fire({
                    icon: 'success',
                    title: 'Đã từ chối đội tham gia',
                    text: `Đội "${participant.teamName || `User: ${participantId}`}" đã bị từ chối.`,
                    timer: 2000,
                    showConfirmButton: false
               });
          } catch (error) {
               console.error("❌ [RejectParticipant] Error:", error);
               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: error.message || 'Không thể từ chối đội. Vui lòng thử lại.',
                    confirmButtonText: 'Đóng'
               });
          } finally {
               // Clear loading state
               setProcessingParticipants(prev => {
                    const updated = { ...prev };
                    delete updated[processingKey];
                    return updated;
               });
          }
     };

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
                    } else {
                         console.warn("Không thể tải lịch sử kèo:", response.error);
                    }
               } catch (error) {
                    console.warn("Error loading player history:", error);
               }
          };
          loadPlayerHistory();
     }, [user?.id, user?.userID]);

     // Use ref to track reloading state to prevent infinite loops
     const isReloadingRef = React.useRef(false);
     const lastReloadTimeRef = React.useRef(0);

     // Check and update booking status for pending + unpaid bookings (2 hours timeout)
     useEffect(() => {
          if (!playerId) return;

          const checkExpiredBookings = () => {
               // Skip if already reloading or reloaded recently (within 5 seconds)
               const now = Date.now();
               if (isReloadingRef.current || (now - lastReloadTimeRef.current < 5000)) {
                    return;
               }

               const currentTime = new Date().getTime();
               const TWO_HOURS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

               setBookings(prevBookings => {
                    let hasExpiredBookings = false;
                    const updatedTimeRemaining = {};

                    // First, update time remaining without changing bookings
                    prevBookings.forEach(booking => {
                         const isPending = (booking.status === "pending" || booking.bookingStatus === "Pending" || booking.bookingStatus === "pending");
                         const isUnpaid = (booking.paymentStatus === "Unpaid" || booking.paymentStatus === "unpaid" || booking.paymentStatus === "Pending");

                         if (isPending && isUnpaid && booking.createdAt) {
                              const createdAt = new Date(booking.createdAt).getTime();
                              const timeElapsed = currentTime - createdAt;

                              if (timeElapsed <= TWO_HOURS) {
                                   // Calculate time remaining
                                   const remaining = TWO_HOURS - timeElapsed;
                                   updatedTimeRemaining[booking.id] = remaining;
                              } else {
                                   // Check if expired
                                   if (booking.status !== "expired" && booking.bookingStatus !== "Expired") {
                                        hasExpiredBookings = true;
                                   }
                              }
                         }
                    });

                    // Update time remaining separately (doesn't trigger bookings dependency)
                    if (Object.keys(updatedTimeRemaining).length > 0) {
                         setTimeRemaining(prev => ({
                              ...prev,
                              ...updatedTimeRemaining
                         }));
                    }

                    // Only reload from API if there are newly expired bookings
                    if (hasExpiredBookings && !isReloadingRef.current) {
                         isReloadingRef.current = true;
                         lastReloadTimeRef.current = now;

                         // Reload bookings from API to sync with backend (only once)
                         fetchBookingsByPlayer(playerId).then(apiResult => {
                              if (apiResult.success) {
                                   const bookingList = normalizeApiBookings(apiResult.data);
                                   setBookings(bookingList);
                                   setGroupedBookings(buildRecurringGroups(bookingList));
                              }
                         }).catch(error => {
                              console.error("Error reloading bookings after expiration:", error);
                         }).finally(() => {
                              // Reset flag after a delay to allow reload to complete
                              setTimeout(() => {
                                   isReloadingRef.current = false;
                              }, 3000);
                         });
                    }

                    // Return unchanged bookings if only updating time remaining
                    return prevBookings;
               });
          };

          // Check immediately
          checkExpiredBookings();

          // Check every 30 seconds (increased from 10 to reduce API calls)
          const interval = setInterval(checkExpiredBookings, 30000);

          return () => clearInterval(interval);
     }, [playerId]);

     const formatPrice = (price) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

     const handleFindOpponent = (booking) => {
          setSelectedBooking(booking);
          setShowFindOpponentModal(true);
     };

     const handleFindOpponentSuccess = async (result) => {
          if (result.type === "recurring") {
               setOpponentData(result);
               setShowFindOpponentModal(false);
               setShowRecurringOpponentModal(true);
          } else {
               setShowFindOpponentModal(false);

               // If we have the match request data, add it to state immediately
               if (result.matchRequest) {
                    const matchRequest = result.matchRequest;
                    const requestId = extractRequestId(matchRequest);
                    // Use selectedBooking if available, otherwise use result.booking
                    const booking = selectedBooking || result.booking;
                    // Use booking.id as display key (consistent with loadMatchRequestsForBookings)
                    const bookingDisplayId = booking?.id;
                    const bookingDatabaseId = booking?.bookingId;
                    const matchRequestBookingId = matchRequest.bookingId || matchRequest.bookingID || matchRequest.BookingID;

                    console.log("✅ [FindOpponentSuccess] Match request created:", {
                         requestId,
                         bookingDisplayId,
                         bookingDatabaseId,
                         matchRequestBookingId,
                         booking: booking,
                         matchRequest: matchRequest
                    });

                    if (requestId && bookingDisplayId) {
                         // Add to bookingIdToRequest map using booking.id (display key)
                         // This is consistent with how loadMatchRequestsForBookings maps
                         setBookingIdToRequest(prev => {
                              const updated = { ...prev };

                              // Map by booking.id (display key) - this is what we use in the UI
                              updated[bookingDisplayId] = matchRequest;

                              // Also try to find and map any other bookings with the same bookingId
                              // in case the booking list hasn't updated yet
                              if (matchRequestBookingId) {
                                   const normalizedMatchRequestBookingId = String(matchRequestBookingId);
                                   bookings.forEach(b => {
                                        if (String(b.bookingId) === normalizedMatchRequestBookingId && b.id) {
                                             updated[b.id] = matchRequest;
                                        }
                                   });
                              }

                              console.log("📝 [FindOpponentSuccess] Updated bookingIdToRequest:", {
                                   keys: Object.keys(updated),
                                   bookingDisplayId,
                                   matchRequestBookingId
                              });
                              return updated;
                         });

                         // Add participants to requestJoins
                         const participants = extractParticipants(matchRequest);
                         if (participants && participants.length > 0) {
                              setRequestJoins(prev => ({
                                   ...prev,
                                   [requestId]: participants
                              }));
                         }
                    } else {
                         console.warn("⚠️ [FindOpponentSuccess] Missing requestId:", {
                              matchRequest
                         });
                    }
               }

               // Preserve the match request we just added to state
               const preservedMatchRequest = result.matchRequest;
               const preservedRequestId = extractRequestId(preservedMatchRequest);
               const preservedBooking = selectedBooking || result.booking;
               const preservedBookingId = preservedBooking?.id || preservedBooking?.bookingId;
               const preservedBookingDatabaseId = preservedBooking?.bookingId;

               // Wait longer to ensure backend has updated the booking with matchRequestId
               // Retry mechanism to ensure backend has processed the update
               const maxRetries = 3;
               let bookingUpdated = false;

               for (let retryCount = 0; retryCount < maxRetries && !bookingUpdated; retryCount++) {
                    // Wait before checking (longer delay for first retry)
                    const currentRetry = retryCount;
                    const delay = currentRetry === 0 ? 2000 : 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));

                    try {
                         if (playerId) {
                              const apiResult = await fetchBookingsByPlayer(playerId);
                              if (apiResult.success) {
                                   const bookingList = normalizeApiBookings(apiResult.data);

                                   // Find the booking in the new list that matches our preserved booking
                                   const updatedBooking = bookingList.find(b =>
                                        (preservedBookingDatabaseId && b.bookingId && String(b.bookingId) === String(preservedBookingDatabaseId)) ||
                                        (b.id === preservedBookingId) ||
                                        (b.bookingId && String(b.bookingId) === String(preservedBookingId)) ||
                                        (b.id && String(b.id) === String(preservedBookingId))
                                   );

                                   if (updatedBooking) {
                                        // Check if booking now has matchRequestId (backend has updated)
                                        const hasMatchRequestId = updatedBooking.matchRequestId || updatedBooking.matchRequestID || updatedBooking.MatchRequestID;

                                        if (hasMatchRequestId || currentRetry === maxRetries - 1) {
                                             // Backend has updated or this is the last retry
                                             setBookings(bookingList);
                                             setGroupedBookings(buildRecurringGroups(bookingList));

                                             // Ensure our newly created match request is mapped
                                             if (preservedMatchRequest && preservedRequestId && updatedBooking.id) {
                                                  setBookingIdToRequest(prev => ({
                                                       ...prev,
                                                       [updatedBooking.id]: preservedMatchRequest
                                                  }));
                                                  console.log("✅ [FindOpponentSuccess] Preserved match request after booking reload:", {
                                                       updatedBookingId: updatedBooking.id,
                                                       preservedRequestId,
                                                       hasMatchRequestId: !!hasMatchRequestId,
                                                       retryCount: currentRetry + 1
                                                  });
                                             }
                                             bookingUpdated = true;
                                        }
                                   }
                              }
                         }
                    } catch (error) {
                         console.error("Error reloading bookings (retry", currentRetry + 1, "):", error);
                    }
               }

               // Then load match requests to ensure everything is in sync
               // This will merge with our preserved state, not replace it
               // The improved loadMatchRequestsForBookings will now prioritize matchRequestId from booking data
               await loadMatchRequestsForBookings();

               Swal.fire('Đã gửi!', 'Yêu cầu tìm đối đã được tạo.', 'success');
          }
     };

     const handleRecurringOpponentSuccess = async () => {
          await loadMatchRequestsForBookings();
          setShowRecurringOpponentModal(false);
          setOpponentData(null);
          Swal.fire('Đã gửi!', 'Yêu cầu tìm đối cho lịch cố định đã được tạo.', 'success');
     };

     const handleRating = (booking) => {
          setSelectedBooking(booking);
          setShowRatingModal(true);
     };

     const handleRatingSuccess = (result) => {
          setShowRatingModal(false);
          setSelectedBooking(null);
          Swal.fire('Cảm ơn bạn!', 'Đánh giá của bạn đã được gửi thành công.', 'success');
     };



     const handleViewInvoice = (bookingPayload) => {
          if (!bookingPayload) return;
          setInvoiceBooking(bookingPayload);
          setShowInvoiceModal(true);
     };

     const statusBadge = (status, cancelReason) => {
          switch (status) {
               case "confirmed":
                    return <Badge variant="default" className="bg-teal-500 text-white border border-teal-200 hover:bg-teal-600 hover:text-white">Đã xác nhận</Badge>;
               case "completed":
                    return <Badge variant="secondary" className="bg-teal-500 text-white border border-teal-200 hover:bg-teal-600 hover:text-white">Hoàn tất</Badge>;
               case "cancelled":
                    return <Badge variant="destructive" className="bg-red-500 text-white border border-red-200 hover:bg-red-600 hover:text-white">Đã hủy</Badge>;
               case "pending":
                    return <Badge variant="outline" className="bg-yellow-500 text-white border border-yellow-200 hover:bg-yellow-600 hover:text-white">Chờ xác nhận</Badge>;
               case "expired":
                    return <Badge variant="outline" className="bg-gray-500 text-white border border-gray-200 hover:bg-gray-600 hover:text-white">Hủy do quá thời gian thanh toán</Badge>;
               case "reactive":
                    return <Badge variant="outline" className="bg-blue-500 text-white border border-blue-200 hover:bg-blue-600 hover:text-white">Kích hoạt lại</Badge>;
               default:
                    return <Badge variant="outline" className="bg-gray-500 text-white border border-gray-200 hover:bg-gray-600 hover:text-white">Không rõ</Badge>;
          }
     };

     // Helper function to check if booking is pending + unpaid and within 2 hours
     const isPendingUnpaidWithin2Hours = (booking) => {
          if (!booking) return false;
          const isPending = (booking.status === "pending" || booking.bookingStatus === "Pending" || booking.bookingStatus === "pending");
          const isUnpaid = (booking.paymentStatus === "Unpaid" || booking.paymentStatus === "unpaid" || booking.paymentStatus === "Pending");

          if (!isPending || !isUnpaid || !booking.createdAt) return false;

          const now = new Date().getTime();
          const createdAt = new Date(booking.createdAt).getTime();
          const TWO_HOURS = 2 * 60 * 60 * 1000;
          const timeElapsed = now - createdAt;

          return timeElapsed <= TWO_HOURS;
     };

     const hasExistingMatchRequest = (booking) => {
          if (!booking) return false;
          if (booking.matchRequestId || booking.matchRequestID || booking.MatchRequestID) return true;
          if (booking.hasOpponent) return true;
          if (!booking.id) return false;
          return Boolean(bookingIdToRequest[booking.id]);
     };

     const shouldShowFindOpponentButton = (booking) => {
          if (!booking) return false;
          const statusLower = String(booking.status || booking.bookingStatus || "").toLowerCase();
          const paymentLower = String(booking.paymentStatus || "").toLowerCase();

          const isPendingWaitingPayment =
               statusLower === "pending" &&
               (paymentLower === "" || paymentLower === "pending" || paymentLower === "unpaid");

          const isPendingPaid =
               statusLower === "pending" &&
               (paymentLower === "paid" || paymentLower === "đã thanh toán");

          const isCompleted = statusLower === "completed";
          const isCancelled = statusLower === "cancelled" || statusLower === "expired";

          if (isPendingWaitingPayment || isPendingPaid || isCompleted || isCancelled) {
               return false;
          }

          if (hasExistingMatchRequest(booking)) {
               return false;
          }

          return true;
     };

     const normalizeRequestStatus = (request) => {
          const raw = (request?.status || request?.state || "").toString().toLowerCase();
          if (raw.includes("match")) return "matched";
          if (raw.includes("pending") || raw.includes("waiting")) return "pending";
          if (raw.includes("expire")) return "expired";
          if (raw.includes("cancel")) return "cancelled";
          if (raw.includes("reject")) return "cancelled";
          if (raw.includes("open") || raw.includes("active")) return "open";

          const participants = extractParticipants(request);
          if (participants.some(p => (p.status || "").toLowerCase() === "accepted")) {
               return "pending";
          }

          if (!raw || raw === "0") return "open";
          return raw;
     };

     const getRequestBadgeConfig = (request) => {
          const status = normalizeRequestStatus(request);
          const participants = filterParticipantsForDisplay(extractParticipants(request), request);
          const pendingCount = participants.filter(participantNeedsOwnerAction).length;
          const acceptedCount = participants.filter(isParticipantAcceptedByOwner).length;

          const configMap = {
               open: {
                    text: "Đang mở • Chờ đội tham gia",
                    className: "border-blue-200 text-blue-600 bg-blue-50"
               },
               pending: {
                    text: acceptedCount > 0
                         ? `Đang chờ xác nhận • ${acceptedCount} đội đã được duyệt`
                         : `Đang chờ xác nhận${pendingCount ? ` • ${pendingCount} đội chờ duyệt` : ""}`,
                    className: "border-amber-200 text-amber-700 bg-amber-50"
               },
               matched: {
                    text: "Đã tìm được đối • Trận đấu đã xác nhận",
                    className: "border-emerald-300 text-emerald-700 bg-emerald-50"
               },
               expired: {
                    text: "Đã hết hạn",
                    className: "border-gray-300 text-gray-600 bg-gray-50"
               },
               cancelled: {
                    text: "Đã hủy",
                    className: "border-red-300 text-red-600 bg-red-50"
               }
          };

          return {
               status,
               ...(
                    configMap[status] || {
                         text: "Đang mở",
                         className: "border-blue-200 text-blue-600 bg-blue-50"
                    }
               )
          };
     };

     const isRequestLocked = (request) => {
          const status = normalizeRequestStatus(request);
          return status === "matched" || status === "expired" || status === "cancelled";
     };

     const getAcceptedParticipants = (request) => {
          const participants = filterParticipantsForDisplay(extractParticipants(request), request);
          return participants.filter(isParticipantAcceptedByOwner);
     };

     // Helper function to check if booking is older than 2 hours (to hide cancel button)
     const isBookingOlderThan2Hours = (booking) => {
          if (!booking || !booking.createdAt) return false;
          const now = new Date().getTime();
          const createdAt = new Date(booking.createdAt).getTime();
          const TWO_HOURS = 2 * 60 * 60 * 1000;
          const timeElapsed = now - createdAt;
          return timeElapsed > TWO_HOURS;
     };

     const shouldShowCancelButton = (booking) => {
          if (!booking) return false;
          const statusLower = String(booking.status || booking.bookingStatus || "").toLowerCase();
          const paymentLower = String(booking.paymentStatus || "").toLowerCase();
          const isPending = statusLower === "pending";
          const isConfirmed = statusLower === "confirmed";
          const isUnpaid = paymentLower === "" || paymentLower === "pending" || paymentLower === "unpaid" || paymentLower === "chờ thanh toán";
          const isPaid = paymentLower === "paid" || paymentLower === "đã thanh toán";

          const isPendingWaitingPayment = isPending && isUnpaid;
          const isPendingPaid = isPending && isPaid;
          const isConfirmedPaid = isConfirmed && isPaid;

          const allowed = isPendingWaitingPayment || isPendingPaid || isConfirmedPaid;

          if (!allowed) return false;
          if (statusLower === "cancelled" || statusLower === "expired") return false;
          return true;
     };

     // Format time remaining (supports hours and minutes)
     const formatTimeRemaining = (milliseconds) => {
          if (!milliseconds || milliseconds <= 0) return "0:00";
          const totalSeconds = Math.floor(milliseconds / 1000);
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;
          if (hours > 0) {
               return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          }
          return `${minutes}:${seconds.toString().padStart(2, '0')}`;
     };

     // Handle continue payment
     const handleContinuePayment = async (booking) => {
          if (!booking) return;

          setPaymentBooking(booking);
          setShowPaymentModal(true);
          setIsLoadingQR(true);
          setPaymentQRCode(null);

          try {
               const bookingId = booking.bookingId || booking.id;
               const result = await generateQRCode(bookingId, {
                    paymentType: "deposit", // or "full" depending on your logic
                    amount: booking.depositAmount || booking.totalPrice || 0
               });

               if (result.success) {
                    setPaymentQRCode(result.qrCodeUrl || result.data?.qrCodeUrl || result.data?.qrCode);
               } else {
                    await Swal.fire({
                         icon: 'error',
                         title: 'Lỗi',
                         text: result.error || 'Không thể tạo mã QR thanh toán',
                         confirmButtonColor: '#ef4444'
                    });
                    setShowPaymentModal(false);
               }
          } catch (error) {
               console.error('Error generating QR code:', error);
               await Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: error.message || 'Không thể tạo mã QR thanh toán',
                    confirmButtonColor: '#ef4444'
               });
               setShowPaymentModal(false);
          } finally {
               setIsLoadingQR(false);
          }
     };

     // Handle confirm payment
     const handleConfirmPayment = async () => {
          if (!paymentBooking) return;

          // Show confirmation dialog first
          const confirmResult = await Swal.fire({
               title: 'Xác nhận thanh toán',
               html: `
                    <div class="text-left space-y-3">
                         <p class="text-gray-700">Bạn có chắc chắn đã thanh toán thành công cho booking này?</p>
                         <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p class="text-sm text-blue-800 font-semibold mb-2">📋 Thông tin booking:</p>
                              <div class="text-sm text-blue-700 space-y-1">
                                   <p><strong>Sân:</strong> ${paymentBooking.fieldName}</p>
                                   <p><strong>Thời gian:</strong> ${paymentBooking.date} • ${paymentBooking.time}</p>
                                   <p><strong>Số tiền:</strong> <span class="font-bold text-green-600">${formatPrice(paymentBooking.depositAmount || paymentBooking.totalPrice || 0)}</span></p>
                              </div>
                         </div>
                         <p class="text-xs text-gray-600">⚠️ Vui lòng đảm bảo bạn đã quét mã QR và thanh toán thành công trước khi xác nhận.</p>
                    </div>
               `,
               icon: 'question',
               showCancelButton: true,
               confirmButtonText: 'Đã thanh toán, xác nhận',
               cancelButtonText: 'Hủy',
               confirmButtonColor: '#10b981',
               cancelButtonColor: '#6b7280',
               width: '500px',
               customClass: {
                    popup: 'text-left'
               }
          });

          if (!confirmResult.isConfirmed) {
               return;
          }

          setIsConfirmingPayment(true);
          try {
               const bookingId = paymentBooking.bookingId || paymentBooking.id;

               // Show loading state
               Swal.fire({
                    title: 'Đang xử lý...',
                    html: 'Vui lòng đợi trong giây lát',
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    didOpen: () => {
                         Swal.showLoading();
                    }
               });

               const result = await confirmPaymentAPI(bookingId);

               if (result.success) {
                    // Close loading
                    Swal.close();

                    // Show success message with more details
                    await Swal.fire({
                         icon: 'success',
                         title: '✅ Thanh toán thành công!',
                         html: `
                              <div class="text-left space-y-3">
                                   <p class="text-gray-700">Booking của bạn đã được thanh toán thành công!</p>
                                   <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <div class="flex items-center gap-2 mb-2">
                                             <CheckCircle className="w-5 h-5 text-green-600" />
                                             <p class="text-sm font-semibold text-green-800">Trạng thái thanh toán</p>
                                        </div>
                                        <div class="text-sm text-green-700 space-y-1">
                                             <p><strong>Booking ID:</strong> #${bookingId}</p>
                                             <p><strong>Sân:</strong> ${paymentBooking.fieldName}</p>
                                             <p><strong>Số tiền đã thanh toán:</strong> <span class="font-bold">${formatPrice(paymentBooking.depositAmount || paymentBooking.totalPrice || 0)}</span></p>
                                        </div>
                                   </div>
                                   <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                        <p class="text-sm text-yellow-800">
                                             <strong>📌 Lưu ý:</strong> Booking của bạn đang chờ chủ sân xác nhận. Bạn sẽ nhận được thông báo khi booking được xác nhận.
                                        </p>
                                   </div>
                              </div>
                         `,
                         confirmButtonText: 'Đã hiểu',
                         confirmButtonColor: '#10b981',
                         width: '550px',
                         customClass: {
                              popup: 'text-left'
                         }
                    });

                    setShowPaymentModal(false);
                    setPaymentBooking(null);
                    setPaymentQRCode(null);

                    // Reload bookings
                    if (playerId) {
                         const apiResult = await fetchBookingsByPlayer(playerId);
                         if (apiResult.success) {
                              const bookingList = normalizeApiBookings(apiResult.data);
                              setBookings(bookingList);
                              setGroupedBookings(buildRecurringGroups(bookingList));
                         }
                    }
               } else {
                    Swal.close();
                    await Swal.fire({
                         icon: 'error',
                         title: '❌ Không thể xác nhận thanh toán',
                         html: `
                              <div class="text-left space-y-2">
                                   <p class="text-gray-700">${result.error || 'Có lỗi xảy ra khi xác nhận thanh toán'}</p>
                                   <div class="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                                        <p class="text-sm text-red-800">
                                             <strong>💡 Gợi ý:</strong> Vui lòng kiểm tra lại:
                                        </p>
                                        <ul class="text-sm text-red-700 list-disc list-inside mt-2 space-y-1">
                                             <li>Đã quét mã QR và thanh toán thành công</li>
                                             <li>Kết nối internet ổn định</li>
                                             <li>Thử lại sau vài giây</li>
                                        </ul>
                                   </div>
                              </div>
                         `,
                         confirmButtonText: 'Đã hiểu',
                         confirmButtonColor: '#ef4444',
                         width: '500px',
                         customClass: {
                              popup: 'text-left'
                         }
                    });
               }
          } catch (error) {
               console.error('Error confirming payment:', error);
               Swal.close();
               await Swal.fire({
                    icon: 'error',
                    title: '❌ Lỗi hệ thống',
                    html: `
                         <div class="text-left space-y-2">
                              <p class="text-gray-700">${error.message || 'Không thể xác nhận thanh toán. Vui lòng thử lại sau.'}</p>
                              <div class="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                                   <p class="text-sm text-red-800">
                                        Nếu vấn đề vẫn tiếp tục, vui lòng liên hệ hỗ trợ khách hàng.
                                   </p>
                              </div>
                         </div>
                    `,
                    confirmButtonText: 'Đã hiểu',
                    confirmButtonColor: '#ef4444',
                    width: '500px',
                    customClass: {
                         popup: 'text-left'
                    }
               });
          } finally {
               setIsConfirmingPayment(false);
          }
     };

     const paymentStatusBadge = (paymentStatus) => {
          const status = (paymentStatus ?? "").toString().toLowerCase();
          switch (status) {
               case "paid":
                    return <Badge variant="default" className="bg-green-500 text-white border border-green-200 hover:bg-green-600 hover:text-white">Đã thanh toán</Badge>;
               case "refunded":
                    return <Badge variant="secondary" className="bg-blue-500 text-white border border-blue-200 hover:bg-blue-600 hover:text-white">Đã hoàn tiền</Badge>;
               case "unpaid":
               case "pending":
               default:
                    return <Badge variant="outline" className="bg-yellow-500 text-white border border-yellow-200 hover:bg-yellow-600 hover:text-white">Chờ Thanh Toán</Badge>;
          }
     };

     const getRecurringStatus = (group) => {
          const totalBookings = group.bookings.length;
          const cancelledBookings = group.bookings.filter(b => b.status === "cancelled").length;
          const completedBookings = group.bookings.filter(b => b.status === "completed").length;

          if (cancelledBookings === totalBookings) return "cancelled";
          if (completedBookings === totalBookings) return "completed";
          if (cancelledBookings > 0) return "partial";
          return "active";
     };

     const stats = useMemo(() => {
          const total = bookings.length;
          const completed = bookings.filter(b => b.status === "completed").length;
          const cancelled = bookings.filter(b => b.status === "cancelled").length;
          const upcoming = bookings.filter(b => b.status === "confirmed").length;
          const pending = bookings.filter(b => b.status === "pending").length;
          return { total, completed, cancelled, upcoming, pending };
     }, [bookings]);

     const withinDateRange = React.useCallback(function withinDateRange(dateStr) {
          if (!dateStr) return true;
          const d = new Date(dateStr);
          if (dateFrom && d < new Date(dateFrom)) return false;
          if (dateTo && d > new Date(dateTo)) return false;
          return true;
     }, [dateFrom, dateTo]);

     const visibleSingles = useMemo(() => {
          const base = bookings.filter(b => !b.isRecurring);
          const filtered = base.filter(b => {
               const q = query.trim().toLowerCase();
               const matchQuery = !q || b.id.toLowerCase().includes(q) || (b.fieldName || "").toLowerCase().includes(q) || (b.address || "").toLowerCase().includes(q);
               const matchStatus = statusFilter === "all" || b.status === statusFilter;
               const matchDate = withinDateRange(b.date);
               return matchQuery && matchStatus && matchDate;
          });
          const sorted = filtered.sort((a, b) => {
               if (sortBy === "newest") return new Date(b.date) - new Date(a.date);
               if (sortBy === "oldest") return new Date(a.date) - new Date(b.date);
               if (sortBy === "price-asc") return (a.price || 0) - (b.price || 0);
               if (sortBy === "price-desc") return (b.price || 0) - (a.price || 0);
               return 0;
          });
          return sorted;
     }, [bookings, query, statusFilter, sortBy, withinDateRange]);

     // Pagination for single bookings
     const totalSingleBookings = visibleSingles.length;
     const totalPages = Math.max(1, Math.ceil(totalSingleBookings / pageSize));
     const startIndex = (currentPage - 1) * pageSize;
     const endIndex = startIndex + pageSize;
     const paginatedSingles = visibleSingles.slice(startIndex, endIndex);

     const visibleGroups = useMemo(() => {
          const groups = Object.values(groupedBookings || {});
          const filtered = groups.filter(group => {
               const q = query.trim().toLowerCase();
               const matchQuery = !q || (group.fieldName || "").toLowerCase().includes(q) || (group.address || "").toLowerCase().includes(q);
               const groupStatus = getRecurringStatus(group);
               const matchStatus = statusFilter === "all" || groupStatus === statusFilter;
               const anyInRange = (group.bookings || []).some(b => withinDateRange(b.date));
               return matchQuery && matchStatus && anyInRange;
          });
          const sorted = filtered.sort((a, b) => {
               const aFirst = (a.bookings || []).reduce((min, cur) => new Date(cur.date) < new Date(min) ? cur.date : min, (a.bookings?.[0]?.date || "1970-01-01"));
               const bFirst = (b.bookings || []).reduce((min, cur) => new Date(cur.date) < new Date(min) ? cur.date : min, (b.bookings?.[0]?.date || "1970-01-01"));
               if (sortBy === "newest") return new Date(bFirst) - new Date(aFirst);
               if (sortBy === "oldest") return new Date(aFirst) - new Date(bFirst);
               if (sortBy === "price-asc") return ((a.price || 0) * (a.totalWeeks || 1)) - ((b.price || 0) * (b.totalWeeks || 1));
               if (sortBy === "price-desc") return ((b.price || 0) * (b.totalWeeks || 1)) - ((a.price || 0) * (a.totalWeeks || 1));
               return 0;
          });
          return sorted;
     }, [groupedBookings, query, statusFilter, sortBy, withinDateRange]);

     const handleCancel = (id) => {
          const booking = bookings.find(b => b.id === id);
          if (booking) {
               setCancelBooking(booking);
               setShowCancelModal(true);
          }
     };

     const handleConfirmCancel = async (reason) => {
          if (!cancelBooking) return;

          setIsCancelling(true);
          try {
               // Check if booking is pending (chưa được xác nhận)
               const isPending = cancelBooking.status === "pending" ||
                    cancelBooking.bookingStatus === "Pending" ||
                    cancelBooking.bookingStatus === "pending";

               // For all bookings (pending or confirmed), use the same API
               // Backend will automatically determine if it's player or owner based on token
               const bookingId = cancelBooking.bookingId || cancelBooking.id;

               // For confirmed bookings, reason is required
               if (!isPending && (!reason || !reason.trim())) {
                    await Swal.fire({
                         icon: 'warning',
                         title: 'Thiếu thông tin',
                         text: 'Vui lòng nhập lý do hủy.',
                         confirmButtonColor: '#ef4444'
                    });
                    setIsCancelling(false);
                    return;
               }

               // Call cancellation API (backend will handle based on token)
               const result = await cancelBookingAPI(bookingId, reason || "Hủy booking chưa được xác nhận");

               if (result.success) {
                    const bookingKey = String(cancelBooking.id || cancelBooking.bookingId);

                    // Extract refund information from response
                    const refundInfo = {
                         message: result.message || result.data?.message,
                         cancelReason: result.cancelReason || result.data?.cancelReason,
                         refundAmount: result.refundAmount ?? result.data?.refundAmount ?? 0,
                         penaltyAmount: result.penaltyAmount ?? result.data?.penaltyAmount ?? 0,
                         finalRefundAmount: result.finalRefundAmount ?? result.data?.finalRefundAmount ?? 0,
                         refundQR: result.refundQR || result.data?.refundQR,
                    };

                    const cleanReason = stripRefundQrInfo(refundInfo.cancelReason || result.data?.cancelReason || "");

                    if (bookingKey) {
                         setBookings(prev => {
                              const updated = prev.map(b => {
                                   const key = String(b.id || b.bookingId);
                                   if (key !== bookingKey) return b;
                                   return {
                                        ...b,
                                        status: "cancelled",
                                        bookingStatus: "cancelled",
                                        cancelReason: cleanReason || b.cancelReason,
                                        cancelledAt: new Date().toISOString(),
                                        paymentStatus: result.data?.paymentStatus || b.paymentStatus
                                   };
                              });
                              setGroupedBookings(buildRecurringGroups(updated));
                              return updated;
                         });
                    }

                    // Build success message with cancellation reason only
                    let successHtml = `
                         <p class="mb-3">${refundInfo.message || 'Đã hủy booking thành công!'}</p>
                    `;

                    if (cleanReason) {
                         successHtml += `
                              <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 text-left">
                                   <p class="text-sm text-blue-800">${cleanReason}</p>
                              </div>
                         `;
                    }

                    setShowCancelModal(false);
                    setCancelBooking(null);

                    await Swal.fire({
                         icon: 'success',
                         title: 'Đã hủy thành công!',
                         html: successHtml,
                         confirmButtonColor: '#10b981',
                         width: '500px',
                         customClass: {
                              popup: 'text-left'
                         }
                    });

                    // Reload bookings from BE to get updated status
                    // BE will update: bookingStatus = "Cancelled", paymentStatus = "Refunded" (if refunded)
                    const playerId = user?.userID || user?.UserID || user?.id || user?.Id || user?.userId;
                    if (playerId) {
                         const apiResult = await fetchBookingsByPlayer(playerId);
                         if (apiResult.success) {
                              const bookingList = normalizeApiBookings(apiResult.data);
                              setBookings(bookingList);
                              setGroupedBookings(buildRecurringGroups(bookingList));
                         }
                    }
               } else {
                    throw new Error(result.error || "Không thể hủy booking");
               }
          } catch (error) {
               console.error('Error cancelling booking:', error);
               await Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: error.message || 'Không thể hủy đặt sân. Vui lòng thử lại.',
                    confirmButtonColor: '#ef4444'
               });
          } finally {
               setIsCancelling(false);
          }
     };



     const handleCancelRecurring = (groupId) => {
          Swal.fire({
               title: 'Xác nhận hủy lịch định kỳ',
               text: 'Bạn có chắc muốn hủy toàn bộ lịch định kỳ này?',
               icon: 'warning',
               showCancelButton: true,
               confirmButtonColor: '#d33',
               cancelButtonColor: '#3085d6',
               confirmButtonText: 'Xác nhận hủy',
               cancelButtonText: 'Hủy'
          }).then((result) => {
               if (result.isConfirmed) {
                    const group = groupedBookings[groupId];
                    group.bookings.forEach(booking => {
                         updateBooking(booking.id, { status: "cancelled" });
                    });
                    setBookings(prev => prev.map(booking =>
                         group.bookings.some(b => b.id === booking.id)
                              ? { ...booking, status: "cancelled" }
                              : booking
                    ));
                    Swal.fire('Đã hủy!', 'Toàn bộ lịch định kỳ đã được hủy.', 'success');
               }
          });
     };

     const handleCancelSingleRecurring = (id) => {
          const booking = bookings.find(b => b.id === id);
          if (booking) {
               setCancelBooking(booking);
               setShowCancelModal(true);
          }
     };

     const toggleRecurringDetails = (groupId) => {
          setShowRecurringDetails(prev => ({
               ...prev,
               [groupId]: !prev[groupId]
          }));
     };

     return (
          <Section className="min-h-screen bg-[url('https://mixivivu.com/section-background.png')] bg-cover bg-center">
               <div className="py-32 mx-5 md:py-44 bg-[url('https://i.pinimg.com/originals/a3/c7/79/a3c779e5d5b622eeb598ac1d50c05cb8.png')] bg-cover bg-center rounded-b-3xl overflow-hidden">
                    <Container className="py-12">
                         <div className="text-center text-white">
                              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Lịch sử đặt sân của bạn</h1>
                              <p className="mt-2 opacity-90">Theo dõi các đặt sân, lọc nhanh và quản lý tiện lợi</p>
                         </div>
                    </Container>
               </div>
               <Container className="-mt-32 md:-mt-36 px-5 py-2 relative z-10 max-w-6xl">
                    <Card className="mb-4 border p-1 bg-white/80 backdrop-blur rounded-[30px] shadow-xl ring-1 ring-teal-100 border-teal-200"><CardContent>
                         <div className="pt-2">
                              <div className="flex items-center justify-between">
                                   <div>
                                        <h2 className="text-2xl font-bold text-teal-800">Lịch sử đặt sân</h2>
                                        <div className="mt-1 h-1.5 w-24 bg-gradient-to-r from-teal-500 via-emerald-400 to-transparent rounded-full" />
                                        {/* <p className="text-teal-700 font-semibold mt-2">Tổng cộng {stats.total} lượt - Sắp tới {stats.upcoming}</p> */}
                                   </div>
                                   <div className="hidden md:flex items-center gap-2">
                                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 shadow-sm">
                                             Hoàn tất {stats.completed} • Hủy {stats.cancelled}
                                        </span>
                                        {stats.pending > 0 && (
                                             <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200 shadow-sm flex items-center gap-1">
                                                  <Clock className="w-3 h-3" />
                                                  Chờ xác nhận: {stats.pending}
                                             </span>
                                        )}
                                   </div>
                              </div>
                         </div>
                         {/* Search Bar */}
                         <div className="pt-4 flex items-center justify-between gap-3 mb-4">
                              <div className="relative w-full">
                                   <Search color="teal" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none z-10" />
                                   <Input
                                        placeholder="Tìm theo mã, tên sân, địa chỉ..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        className="pl-10 pr-10 border rounded-xl border-teal-300 focus-visible:border-teal-500 focus-visible:ring-0 focus-visible:outline-none"
                                   />
                                   {query && (
                                        <Button
                                             onClick={() => setQuery("")}
                                             className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0 h-auto bg-transparent border-0 hover:bg-transparent"
                                        >
                                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                             </svg>
                                        </Button>
                                   )}
                              </div>
                              <div className="flex justify-end gap-2 ">
                                   <Button
                                        onClick={() => { setQuery(""); setStatusFilter("all"); setDateFrom(""); setDateTo(""); setSortBy("newest"); setCurrentPage(1); }}
                                        variant="outline"
                                        className="px-4 py-2 rounded-xl border border-red-200 text-red-700 hover:text-red-700 hover:bg-red-50"
                                   >
                                        <X className="w-4 h-4" />
                                   </Button>
                              </div>
                         </div>

                         {/* Filter Controls */}
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                              <div>
                                   <label className="block text-sm font-medium text-teal-600 mb-2">Trạng thái</label>
                                   <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="border rounded-xl border-teal-300 focus-visible:border-teal-500 focus-visible:ring-0 bg-white/80">
                                             <SelectValue placeholder="Chọn trạng thái" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                             <SelectItem value="pending">Chờ xác nhận</SelectItem>
                                             <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                                             <SelectItem value="completed">Hoàn tất</SelectItem>
                                             <SelectItem value="cancelled">Đã hủy</SelectItem>
                                        </SelectContent>
                                   </Select>
                              </div>
                              <div>
                                   <label className="block text-sm font-medium text-teal-600 mb-2">Từ ngày</label>
                                   <DatePicker value={dateFrom} onChange={setDateFrom} className="border rounded-xl border-teal-300 focus-visible:border-teal-500 focus-visible:ring-0" />
                              </div>
                              <div>
                                   <label className="block text-sm font-medium text-teal-600 mb-2">Đến ngày</label>
                                   <DatePicker value={dateTo} onChange={setDateTo} className="border rounded-xl border-teal-300 focus-visible:border-teal-500 focus-visible:ring-0" />
                              </div>
                              <div>
                                   <label className="block text-sm font-medium text-teal-600 mb-2">Sắp xếp</label>
                                   <Select value={sortBy} onValueChange={setSortBy}>
                                        <SelectTrigger className="border rounded-xl border-teal-300 focus-visible:border-teal-500 focus-visible:ring-0">
                                             <div className="flex items-center gap-2 text-gray-600 w-full">
                                                  <ArrowUpDown className="w-4 h-4" />
                                                  <SelectValue placeholder="Chọn cách sắp xếp" />
                                             </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="newest">Mới nhất</SelectItem>
                                             <SelectItem value="oldest">Cũ nhất</SelectItem>
                                             <SelectItem value="price-asc">Giá tăng dần</SelectItem>
                                             <SelectItem value="price-desc">Giá giảm dần</SelectItem>
                                        </SelectContent>
                                   </Select>
                              </div>
                         </div>

                         {bookingError && (
                              <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
                                   {bookingError}
                              </div>
                         )}

                         {isLoadingBookings && (
                              <div className="mb-4">
                                   <LoadingList count={3} />
                              </div>
                         )}

                         {/* Results Summary */}
                         <div className=" p-2 px-3 bg-teal-50 border border-teal-200 rounded-3xl">
                              <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-4 text-sm">
                                        <span className="text-red-700 font-semibold flex items-center gap-1">
                                             <BarChart3 className="w-4 h-4" />
                                             Tổng cộng: <span className="text-red-800 font-bold">{visibleGroups.length + visibleSingles.length}</span> đặt sân
                                        </span>
                                        <span className="text-yellow-600 flex items-center gap-1">
                                             <RotateCcw className="w-4 h-4" />
                                             Lịch định kỳ: <span className="font-semibold">{visibleGroups.length}</span>
                                        </span>
                                        <span className="text-blue-600 flex items-center gap-1">
                                             <CalendarIcon className="w-4 h-4" />
                                             Đặt đơn: <span className="font-semibold">{visibleSingles.length}</span>
                                        </span>
                                   </div>
                                   <div className="text-xs text-teal-600">
                                        Hiển thị {Math.min(endIndex, totalSingleBookings)}/{totalSingleBookings} đặt đơn
                                   </div>
                              </div>
                         </div>

                         {/* Action Buttons */}

                    </CardContent></Card>

                    <div className="space-y-4">
                         {/* Recurring Bookings */}
                         {visibleGroups.length > 0 && (
                              <StaggerContainer staggerDelay={50}>
                                   {visibleGroups.map((group, index) => {
                                        const status = getRecurringStatus(group);
                                        const sortedBookings = (group.bookings || []).slice().sort((a, b) => new Date(a.date) - new Date(b.date));
                                        const firstBooking = sortedBookings.length > 0 ? sortedBookings[0] : null;
                                        const lastBooking = sortedBookings.length > 0 ? sortedBookings[sortedBookings.length - 1] : null;
                                        return (
                                             <FadeIn key={group.groupId} delay={index * 50}>
                                                  <div key={group.groupId} className="p-5 rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
                                                       <div className="flex justify-between items-start mb-4">
                                                            <div className="flex items-center gap-3 flex-wrap">
                                                                 <div className="flex items-center gap-2">
                                                                      <Repeat className="w-6 h-6 text-teal-600" />
                                                                      <h3 className="text-xl font-bold text-teal-900">{group.fieldName}</h3>
                                                                 </div>
                                                                 <div className="flex items-center gap-2 flex-wrap">
                                                                      <Badge variant="outline" className="text-teal-700 border-teal-400 bg-teal-100 font-semibold px-3 py-1 flex items-center gap-1">
                                                                           <Repeat className="w-3 h-3" />
                                                                           Lịch định kỳ
                                                                      </Badge>
                                                                      {status === "active" && (
                                                                           <Badge variant="default" className="bg-green-500 text-white font-semibold flex items-center gap-1">
                                                                                <CheckCircle className="w-3 h-3" />
                                                                                Đang hoạt động
                                                                           </Badge>
                                                                      )}
                                                                      {status === "partial" && (
                                                                           <Badge variant="secondary" className="bg-yellow-500 text-white font-semibold flex items-center gap-1">
                                                                                <AlertTriangle className="w-3 h-3" />
                                                                                Một phần
                                                                           </Badge>
                                                                      )}
                                                                      {status === "completed" && (
                                                                           <Badge variant="secondary" className="bg-blue-500 text-white font-semibold flex items-center gap-1">
                                                                                <CheckCircle className="w-3 h-3" />
                                                                                Hoàn tất
                                                                           </Badge>
                                                                      )}
                                                                      {status === "cancelled" && (
                                                                           <Badge variant="destructive" className="bg-red-500 text-white font-semibold flex items-center gap-1">
                                                                                <XCircle className="w-3 h-3" />
                                                                                Đã hủy
                                                                           </Badge>
                                                                      )}
                                                                 </div>
                                                            </div>
                                                            <Button
                                                                 variant="outline"
                                                                 onClick={() => toggleRecurringDetails(group.groupId)}
                                                                 className=" text-sm border border-teal-200 text-teal-700 rounded-full"
                                                            >
                                                                 {showRecurringDetails[group.groupId] ? <ChevronUp className="w-5 h-5 mr-1" /> : <ChevronDown className="w-5 h-5 mr-1" />} {showRecurringDetails[group.groupId] ? "Ẩn chi tiết" : "Xem chi tiết"}
                                                            </Button>
                                                       </div>

                                                       <div className="text-sm text-gray-600 mb-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                 <div className="space-y-2">
                                                                      <div className="flex border w-fit border-teal-200 rounded-full px-3 py-2 items-center bg-white/80">
                                                                           <MapPin className="w-4 h-4 mr-2 text-teal-600" />
                                                                           <span className="text-teal-700 font-semibold">{group.address}</span>
                                                                      </div>
                                                                      <div className="flex px-3 py-2 items-center bg-white/80 rounded-full border border-teal-200">
                                                                           <Calendar className="w-4 h-4 mr-2 text-teal-600" />
                                                                           <span className="text-teal-700 font-semibold">
                                                                                {firstBooking && lastBooking ? `Từ ${firstBooking.date} đến ${lastBooking.date}` : "Chưa có ngày"} • {group.time}
                                                                           </span>
                                                                      </div>
                                                                 </div>
                                                                 <div className="space-y-2">
                                                                      <div className="flex px-3 py-2 items-center bg-white/80 rounded-full border border-teal-200">
                                                                           <CalendarDays className="w-4 h-4 mr-2 text-teal-600" />
                                                                           <span className="text-teal-700 font-semibold">{group.totalWeeks} tuần • {sortedBookings.length} buổi</span>
                                                                      </div>
                                                                      <div className="flex px-3 py-2 items-center bg-white/80 rounded-full border border-teal-200">
                                                                           <Receipt className="w-4 h-4 mr-2 text-teal-600" />
                                                                           <span className="text-teal-700 font-semibold">Giá: {formatPrice(group.price)}/buổi</span>
                                                                      </div>
                                                                 </div>
                                                            </div>
                                                       </div>

                                                       <div className="flex justify-between items-center bg-white/60 rounded-xl p-4 border border-teal-200">
                                                            <div className="flex items-center gap-4">
                                                                 <div className="text-center">
                                                                      <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-500">
                                                                           {formatPrice(group.price * group.totalWeeks)}
                                                                      </div>
                                                                      <div className="text-xs text-teal-600 font-medium">Tổng thanh toán</div>
                                                                 </div>
                                                                 <div className="text-center">
                                                                      <div className="text-lg font-bold text-teal-700">
                                                                           {sortedBookings.length}/{group.totalWeeks}
                                                                      </div>
                                                                      <div className="text-xs text-teal-600 font-medium">Buổi đã đặt</div>
                                                                 </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                 <Button variant="secondary" onClick={() => handleViewInvoice(firstBooking || group.bookings?.[0])} className="px-4 py-2 border border-teal-200 rounded-full text-sm font-semibold">
                                                                      <Receipt className="w-4 h-4 mr-2" /> Xem hóa đơn
                                                                 </Button>
                                                                 {status !== "cancelled" && (
                                                                      <Button variant="destructive" onClick={() => handleCancelRecurring(group.groupId)} className="px-4 py-2 border border-red-200 rounded-full text-sm font-semibold">
                                                                           <Trash2 className="w-4 h-4 mr-2" /> Hủy lịch
                                                                      </Button>
                                                                 )}
                                                            </div>
                                                       </div>

                                                       {showRecurringDetails[group.groupId] && (
                                                            <div className="mt-4 pt-4 border-t border-teal-200">
                                                                 <h4 className="font-medium text-gray-900 mb-3">Chi tiết các buổi đặt sân:</h4>
                                                                 <div className="space-y-2">
                                                                      {sortedBookings.map((booking) => (
                                                                           <div key={booking.id} className="flex flex-col gap-2 p-3 bg-white/80 backdrop-blur rounded-xl border border-teal-100">
                                                                                <div className="flex justify-between items-center">
                                                                                     <div className="flex items-center gap-3 flex-wrap">
                                                                                          <span className="px-2 py-0.5 rounded-full text-xs bg-teal-50 text-teal-700 border border-teal-200">Tuần {booking.weekNumber}</span>
                                                                                          <span className="inline-flex items-center gap-1 text-sm text-gray-700 bg-gray-50 border border-gray-200 font-semibold px-2 py-1 rounded-full"><Calendar className="w-3.5 h-3.5" /> {booking.date}</span>
                                                                                          {statusBadge(booking.status, booking.cancelReason)}
                                                                                          {paymentStatusBadge(booking.paymentStatus)}
                                                                                     </div>
                                                                                </div>

                                                                                {/* Thông báo cho booking đang chờ xác nhận trong recurring */}
                                                                                {booking.status === 'pending' && (booking.paymentStatus === 'paid' || booking.paymentStatus === 'Paid') && (
                                                                                     <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                                                          <div className="flex items-start gap-2">
                                                                                               <Clock className="w-3 h-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                                                                                               <p className="text-xs text-yellow-800">
                                                                                                    Buổi này đang chờ chủ sân xác nhận
                                                                                               </p>
                                                                                          </div>
                                                                                     </div>
                                                                                )}

                                                                                {/* Thông báo và button thanh toán cho booking pending + unpaid trong 2 tiếng (recurring) */}
                                                                                {isPendingUnpaidWithin2Hours(booking) && (
                                                                                     <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg mb-2">
                                                                                          <div className="flex items-start gap-2">
                                                                                               <Clock className="w-3 h-3 text-orange-600 mt-0.5 flex-shrink-0" />
                                                                                               <div className="flex-1">
                                                                                                    <p className="text-xs text-orange-800 font-medium mb-1">
                                                                                                         ⏰ Cần thanh toán trong {formatTimeRemaining(timeRemaining[booking.id] || 0)}
                                                                                                    </p>
                                                                                                    <Button
                                                                                                         onClick={() => handleContinuePayment(booking)}
                                                                                                         className="mt-1 bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-1 rounded-lg"
                                                                                                    >
                                                                                                         <CreditCard className="w-3 h-3 mr-1" />
                                                                                                         Thanh toán
                                                                                                    </Button>
                                                                                               </div>
                                                                                          </div>
                                                                                     </div>
                                                                                )}

                                                                                {/* Thông báo cho booking đã hết hạn thanh toán (recurring) */}
                                                                                {booking.status === 'expired' && (
                                                                                     <div className="p-2 bg-gray-50 border border-gray-200 rounded-lg mb-2">
                                                                                          <div className="flex items-start gap-2">
                                                                                               <XCircle className="w-3 h-3 text-gray-600 mt-0.5 flex-shrink-0" />
                                                                                               <p className="text-xs text-gray-800">
                                                                                                    Đã hết hạn thanh toán
                                                                                               </p>
                                                                                          </div>
                                                                                     </div>
                                                                                )}

                                                                                <div className="flex justify-end gap-2">
                                                                                     {booking.status !== "cancelled" && booking.status !== "expired" && !isBookingOlderThan2Hours(booking) && (
                                                                                          <Button variant="outline" onClick={() => handleCancelSingleRecurring(booking.id)} className="px-2 !py-0.5 text-xs rounded-xl border border-red-200 text-red-700 hover:text-red-700 hover:bg-red-50">
                                                                                               Hủy
                                                                                          </Button>
                                                                                     )}
                                                                                     {booking.status === "completed" && (
                                                                                          <Button
                                                                                               onClick={() => handleRating(booking)}
                                                                                               className="px-2 py-1 text-xs rounded-3xl bg-yellow-50 text-yellow-700 border hover:text-yellow-700 hover:bg-yellow-100 hover:border-yellow-300 transition-colors"
                                                                                          >
                                                                                               <Star className="w-3 h-3 mr-1" /> Đánh giá
                                                                                          </Button>
                                                                                     )}
                                                                                </div>
                                                                           </div>
                                                                      ))}
                                                                 </div>
                                                            </div>
                                                       )}
                                                  </div>
                                             </FadeIn>
                                        );
                                   })}
                              </StaggerContainer>
                         )}

                         {/* Single Bookings */}
                         {paginatedSingles.length > 0 && (
                              <StaggerContainer staggerDelay={50} className="space-y-4">
                                   {paginatedSingles.map((b, index) => (
                                        <FadeIn key={b.id} delay={index * 50}>
                                             <div key={b.id} className="p-4 rounded-2xl border border-teal-200 bg-white/80 backdrop-blur hover:shadow-lg shadow-sm transition-all duration-300 hover:scale-[1.01]">
                                                  <div className="flex justify-between items-start gap-4">
                                                       <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                                 <h3 className="text-lg font-semibold text-teal-900 truncate">{b.fieldName}</h3>
                                                                 {statusBadge(b.status, b.cancelReason)}
                                                                 {paymentStatusBadge(b.paymentStatus)}
                                                                 <span className="px-2 py-0.5 rounded-full text-xs bg-teal-50 text-teal-700 border border-teal-200 font-medium">#{b.id}</span>
                                                            </div>

                                                            {/* Thông báo cho booking đang chờ xác nhận */}
                                                            {b.status === 'pending' && (b.paymentStatus === 'paid' || b.paymentStatus === 'Paid') && (
                                                                 <div className="mt-2 mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                                      <div className="flex items-start gap-2">
                                                                           <Clock className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                                                           <div className="text-sm text-yellow-800">
                                                                                <p className="font-medium mb-1">Đang chờ chủ sân xác nhận</p>
                                                                                <p className="text-xs text-yellow-700">
                                                                                     Booking của bạn đang chờ chủ sân xem xét và xác nhận.
                                                                                     Bạn sẽ nhận được thông báo khi booking được xác nhận.
                                                                                </p>
                                                                           </div>
                                                                      </div>
                                                                 </div>
                                                            )}

                                                            {/* Thông báo và button thanh toán cho booking pending + unpaid trong 2 tiếng */}
                                                            {isPendingUnpaidWithin2Hours(b) && (
                                                                 <div className="mt-2 mb-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                                                      <div className="flex items-start gap-2">
                                                                           <Clock className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                                                           <div className="flex-1">
                                                                                <div className="text-sm text-orange-800">
                                                                                     <p className="font-medium mb-1">⏰ Cần thanh toán trong {formatTimeRemaining(timeRemaining[b.id] || 0)}</p>
                                                                                     <p className="text-xs text-orange-700 mb-2">
                                                                                          Booking của bạn sẽ tự động hủy sau 2 tiếng nếu chưa thanh toán.
                                                                                          Vui lòng thanh toán ngay để giữ chỗ.
                                                                                     </p>
                                                                                </div>
                                                                                <Button
                                                                                     onClick={() => handleContinuePayment(b)}
                                                                                     className="mt-2 bg-orange-600 hover:bg-orange-700 text-white text-sm px-4 py-2 rounded-lg"
                                                                                >
                                                                                     <CreditCard className="w-4 h-4 mr-2" />
                                                                                     Tiếp tục thanh toán
                                                                                </Button>
                                                                           </div>
                                                                      </div>
                                                                 </div>
                                                            )}

                                                            {/* Thông báo cho booking đã hết hạn thanh toán */}
                                                            {b.status === 'expired' && (
                                                                 <div className="mt-2 mb-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                                                      <div className="flex items-start gap-2">
                                                                           <XCircle className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                                                                           <div className="text-sm text-gray-800">
                                                                                <p className="font-medium mb-1">Đã hết hạn thanh toán</p>
                                                                                <p className="text-xs text-gray-700">
                                                                                     Booking đã bị hủy do quá thời gian thanh toán (2 tiếng).
                                                                                </p>
                                                                           </div>
                                                                      </div>
                                                                 </div>
                                                            )}

                                                            <div className="space-y-2">
                                                                 <div className="flex flex-wrap items-center gap-2 text-sm">
                                                                      <span className="inline-flex items-center gap-1 bg-teal-50 border border-teal-100 text-teal-700 px-2 py-1 rounded-full">
                                                                           <MapPin className="w-4 h-4" />
                                                                           <span className="font-medium">{b.address || "Chưa có địa chỉ"}</span>
                                                                      </span>
                                                                 </div>

                                                                 {/* Lịch trình chi tiết */}
                                                                 {(() => {
                                                                      // Lấy thông tin từ API FieldSchedule/public/{scheduleId}
                                                                      const scheduleData = b.scheduleId ? scheduleDataMap[b.scheduleId] : null;

                                                                      // Lấy date từ schedule API (format: "2025-12-01")
                                                                      let displayDate = null;
                                                                      if (scheduleData && scheduleData.date) {
                                                                           try {
                                                                                // Parse date từ format "2025-12-01" hoặc "YYYY-MM-DD"
                                                                                const [year, month, day] = scheduleData.date.split('-').map(Number);
                                                                                if (year && month && day) {
                                                                                     const dateObj = new Date(year, month - 1, day);
                                                                                     displayDate = dateObj.toLocaleDateString("vi-VN");
                                                                                } else {
                                                                                     const dateObj = new Date(scheduleData.date);
                                                                                     if (!isNaN(dateObj.getTime())) {
                                                                                          displayDate = dateObj.toLocaleDateString("vi-VN");
                                                                                     }
                                                                                }
                                                                           } catch (e) {

                                                                                displayDate = scheduleData.date;
                                                                           }
                                                                      }

                                                                      // Fallback về booking date nếu không có trong schedule
                                                                      if (!displayDate) {
                                                                           displayDate = b.date;
                                                                      }

                                                                      // Lấy time từ schedule API (startTime và endTime)
                                                                      let displayTime = null;
                                                                      if (scheduleData && scheduleData.startTime && scheduleData.endTime) {
                                                                           // Format time từ "06:00" và "07:30"
                                                                           const formatTime = (timeStr) => {
                                                                                if (!timeStr) return "";
                                                                                // Remove seconds if present (06:00:00 -> 06:00)
                                                                                return timeStr.split(':').slice(0, 2).join(':');
                                                                           };
                                                                           displayTime = `${formatTime(scheduleData.startTime)} - ${formatTime(scheduleData.endTime)}`;
                                                                      }

                                                                      // Fallback về booking time nếu không có trong schedule
                                                                      if (!displayTime) {
                                                                           displayTime = b.time;
                                                                      }

                                                                      // Tính duration từ startTime và endTime
                                                                      let displayDuration = b.duration;
                                                                      if (scheduleData && scheduleData.startTime && scheduleData.endTime) {
                                                                           try {
                                                                                const [startHour, startMin] = scheduleData.startTime.split(':').map(Number);
                                                                                const [endHour, endMin] = scheduleData.endTime.split(':').map(Number);
                                                                                if (!isNaN(startHour) && !isNaN(startMin) && !isNaN(endHour) && !isNaN(endMin)) {
                                                                                     const startMinutes = startHour * 60 + startMin;
                                                                                     const endMinutes = endHour * 60 + endMin;
                                                                                     displayDuration = Math.max(15, endMinutes - startMinutes);
                                                                                }
                                                                           } catch (e) {

                                                                           }
                                                                      }



                                                                      // Kiểm tra nếu chuẩn: 06:00 - 07:30, Thứ 2 ngày 1/12/2025
                                                                      const expectedTime = "06:00 - 07:30";
                                                                      const expectedDate = "Thứ hai, 01/12/2025";
                                                                      const actualDateWithDay = displayDate ? formatDateWithDay(displayDate, null) : null;
                                                                      if (displayTime === expectedTime && actualDateWithDay === expectedDate) {

                                                                      } else {

                                                                      }

                                                                      return (
                                                                           <div className="flex flex-col gap-2 p-3 bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-xl">
                                                                                <div className="flex items-center gap-2 text-sm">
                                                                                     <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                                                                     <div className="flex-1">
                                                                                          <span className="font-semibold text-gray-900">
                                                                                               {displayDate ? formatDateWithDay(displayDate, b.startTime) : "Chưa có ngày"}
                                                                                          </span>
                                                                                     </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-2 text-sm">
                                                                                     <Clock className="w-4 h-4 text-teal-600 flex-shrink-0" />
                                                                                     <div className="flex-1">
                                                                                          {displayTime ? (
                                                                                               <span className="font-medium text-gray-900">{displayTime}</span>
                                                                                          ) : (
                                                                                               <span className="text-gray-500 italic">Chưa có thời gian</span>
                                                                                          )}

                                                                                     </div>
                                                                                </div>
                                                                                {displayDuration && (
                                                                                     <div className="flex items-center gap-2 text-xs text-gray-600">
                                                                                          <Clock className="w-3 h-3 text-gray-500" />
                                                                                          <span>Thời lượng: <span className="font-medium text-teal-700">{displayDuration} phút</span> ({Math.floor(displayDuration / 60)}h{displayDuration % 60 > 0 ? `${displayDuration % 60}p` : ''})</span>
                                                                                     </div>
                                                                                )}

                                                                           </div>
                                                                      );
                                                                 })()}

                                                                 {/* Additional booking information */}
                                                                 <div className="flex flex-wrap items-center gap-2 text-xs">
                                                                      {b.depositAmount > 0 && (
                                                                           <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                                                                <CreditCard className="w-3 h-3" />
                                                                                Cọc: <span className="font-medium">{formatPrice(b.depositAmount)}</span>
                                                                           </span>
                                                                      )}
                                                                      {b.hasOpponent && (
                                                                           <span className="inline-flex items-center gap-1 bg-green-50 border border-green-100 text-green-700 px-2 py-1 rounded-full">
                                                                                <UserSearch className="w-3 h-3" />
                                                                                Đã có đối
                                                                           </span>
                                                                      )}
                                                                      {b.qrCode && (
                                                                           <span className="inline-flex items-center gap-1 bg-purple-50 border border-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                                                                Mã QR: <span className="font-medium">{b.qrCode}</span>
                                                                           </span>
                                                                      )}
                                                                      {b.cancelledBy && (
                                                                           <span className="inline-flex items-center gap-1 bg-red-50 border border-red-100 text-red-700 px-2 py-1 rounded-full">
                                                                                Hủy bởi: <span className="font-medium">{b.cancelledBy}</span>
                                                                           </span>
                                                                      )}
                                                                 </div>
                                                                 {stripRefundQrInfo(b.cancelReason) && (
                                                                      <div className="text-xs text-red-600 italic">
                                                                           Lý do hủy: {stripRefundQrInfo(b.cancelReason)}
                                                                      </div>
                                                                 )}
                                                            </div>
                                                       </div>
                                                       <div className="text-right shrink-0">
                                                            <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-500 mb-1">
                                                                 {formatPrice(b.totalPrice || b.price)}
                                                            </div>
                                                            {b.depositAmount > 0 && b.totalPrice > b.depositAmount && (
                                                                 <div className="text-sm flex items-center gap-1 text-gray-500 mb-1">
                                                                      (Còn lại: <span className="font-medium text-orange-500">{formatPrice(b.totalPrice - b.depositAmount)}</span>)
                                                                 </div>
                                                            )}
                                                            <div className="text-xs text-gray-700">
                                                                 {b.createdAt && new Date(b.createdAt).toLocaleDateString('vi-VN')}
                                                            </div>
                                                            {b.confirmedAt && (
                                                                 <div className="text-sm font-medium text-green-600">
                                                                      Xác nhận: {new Date(b.confirmedAt).toLocaleDateString('vi-VN')}
                                                                 </div>
                                                            )}
                                                            {b.cancelledAt && (
                                                                 <div className="text-sm font-medium text-red-600">
                                                                      Hủy: {new Date(b.cancelledAt).toLocaleDateString('vi-VN')}
                                                                 </div>
                                                            )}
                                                       </div>
                                                  </div>
                                                  <div className="mt-4 pt-3 border-t border-teal-100 flex flex-wrap gap-2">
                                                       <Button variant="secondary" onClick={() => handleViewInvoice(b)} className="px-2 !py-1 text-sm rounded-3xl">
                                                            <Receipt className="w-4 h-4 mr-2" /> Xem hóa đơn
                                                       </Button>
                                                       {user && (
                                                            <>
                                                                 {/* Button tiếp tục thanh toán cho booking pending + unpaid trong 2 tiếng */}
                                                                 {isPendingUnpaidWithin2Hours(b) && (
                                                                      <Button
                                                                           onClick={() => handleContinuePayment(b)}
                                                                           className="px-3 py-2 text-sm bg-orange-600 hover:bg-orange-700 text-white rounded-3xl"
                                                                      >
                                                                           <CreditCard className="w-4 h-4 mr-2" />
                                                                           Tiếp tục thanh toán
                                                                      </Button>
                                                                 )}

                                                                 {shouldShowCancelButton(b) && (
                                                                      <Button variant="destructive" onClick={() => handleCancel(b.id)} className="px-3 rounded-3xl py-2 text-sm">
                                                                           <Trash2 className="w-4 h-4 mr-2" />
                                                                           Hủy đặt
                                                                      </Button>
                                                                 )}
                                                                 {b.status === "completed" && (
                                                                      <Button
                                                                           onClick={() => handleRating(b)}
                                                                           className="px-3 py-2 text-sm bg-yellow-50 text-yellow-700 border-yellow-400 hover:text-yellow-700 hover:bg-yellow-100 hover:border-yellow-600 transition-colors rounded-3xl"
                                                                      >
                                                                           <Star className="w-4 h-4 mr-2" />
                                                                           Đánh giá
                                                                      </Button>
                                                                 )}
                                                                 {/* MatchRequest actions */}
                                                                 {(() => {
                                                                      const req = bookingIdToRequest[b.id];
                                                                      const fallbackRequestId = b.matchRequestId || b.matchRequestID || b.MatchRequestID;
                                                                      const hasRequest = hasExistingMatchRequest(b);
                                                                      const canShowFindOpponent = shouldShowFindOpponentButton(b);

                                                                      if (!hasRequest && canShowFindOpponent) {
                                                                           return (
                                                                                <Button
                                                                                     variant="secondary"
                                                                                     onClick={() => handleFindOpponent(b)}
                                                                                     className="px-4 !rounded-full py-2.5 text-sm font-medium bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                                                                                >
                                                                                     <UserSearchIcon className="w-4 h-4" />
                                                                                     <span>Tìm đối thủ</span>
                                                                                </Button>
                                                                           );
                                                                      }

                                                                      if (hasRequest) {
                                                                           const currentRequestId = extractRequestId(req) || fallbackRequestId;
                                                                           const badgeConfig = req ? getRequestBadgeConfig(req) : {
                                                                                text: "Đang tải thông tin kèo...",
                                                                                className: "border-teal-200 text-teal-700 bg-teal-50"
                                                                           };
                                                                           const requestLocked = req ? isRequestLocked(req) : false;
                                                                           const canRefresh = req ? !requestLocked : Boolean(currentRequestId);

                                                                           return (
                                                                                <div className="flex flex-col gap-2">
                                                                                     <Badge variant="outline" className={`text-xs ${badgeConfig.className}`}>
                                                                                          Đã yêu cầu • {badgeConfig.text}
                                                                                     </Badge>
                                                                                     {canRefresh && currentRequestId && (
                                                                                          <Button
                                                                                               variant="outline"
                                                                                               className="px-3 !rounded-full py-2 text-sm flex items-center gap-2"
                                                                                               onClick={() => refreshRequestForBooking(b.id, currentRequestId)}
                                                                                               disabled={refreshingRequests[currentRequestId]}
                                                                                          >
                                                                                               {refreshingRequests[currentRequestId] ? (
                                                                                                    <>
                                                                                                         <Loader2 className="w-4 h-4 animate-spin" />
                                                                                                         <span>Đang tải...</span>
                                                                                                    </>
                                                                                               ) : (
                                                                                                    <>
                                                                                                         <RefreshCw className="w-4 h-4" />
                                                                                                         <span>Tải đội tham gia</span>
                                                                                                    </>
                                                                                               )}
                                                                                          </Button>
                                                                                     )}
                                                                                </div>
                                                                           );
                                                                      }

                                                                      return null;
                                                                 })()}
                                                            </>
                                                       )}
                                                  </div>
                                                  {/* Joins list for this booking's request (owner view) */}
                                                  {(() => {
                                                       const req = bookingIdToRequest[b.id];
                                                       if (!req) return null;
                                                       const requestId = extractRequestId(req);
                                                       const participants = requestId
                                                            ? (requestJoins[requestId] || extractParticipants(req))
                                                            : extractParticipants(req);
                                                       const requestOwnerId = getRequestOwnerId(req);
                                                       const displayParticipants = filterParticipantsForDisplay(participants, req);
                                                       if (!displayParticipants || displayParticipants.length === 0) return null;
                                                       const isRequestOwner = user && requestOwnerId && String(requestOwnerId) === String(user?.userID || user?.UserID || user?.id || user?.userId);
                                                       const badgeConfig = getRequestBadgeConfig(req);
                                                       const acceptedTeams = getAcceptedParticipants(req);
                                                       const requestLocked = isRequestLocked(req);
                                                       return (
                                                            <div className="mt-3 p-3 rounded-xl border border-teal-100 bg-white/70">
                                                                 <div className="flex flex-col gap-1 mb-3">
                                                                      <div className="font-semibold text-teal-800">Đội tham gia</div>
                                                                      <Badge variant="outline" className={`text-xs w-fit ${badgeConfig.className}`}>
                                                                           {badgeConfig.text}
                                                                      </Badge>
                                                                      {requestLocked && acceptedTeams.length > 0 && (
                                                                           <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg">
                                                                                Trận đấu đã được xác nhận với {acceptedTeams.length} đội.
                                                                           </div>
                                                                      )}
                                                                 </div>
                                                                 <div className="space-y-2">
                                                                      {displayParticipants.map((j) => {
                                                                           const participantId = j.participantId || j.joinId || j.id;
                                                                           const participantTeamName =
                                                                                j.teamName ||
                                                                                j.fullName ||
                                                                                j.participantName ||
                                                                                j.userName ||
                                                                                `User: ${j.userId || participantId}`;
                                                                           const participantStatus = normalizeParticipantStatus(j);
                                                                           const needsOwnerAction = participantNeedsOwnerAction(j);
                                                                           const isAccepted = isParticipantAcceptedByOwner(j);
                                                                           const isRejected = isParticipantRejectedByOwner(j);
                                                                           return (
                                                                                <div key={participantId || Math.random()} className="flex items-center justify-between text-sm">
                                                                                     <div className="flex flex-wrap items-center gap-2 text-gray-700">
                                                                                          <span className="font-medium">{participantTeamName}</span>
                                                                                          {j.playerCount && <span className="text-gray-500">• {j.playerCount} người</span>}
                                                                                          <span className="text-gray-500">• {participantStatus}</span>
                                                                                     </div>
                                                                                     <div className="flex items-center gap-2">
                                                                                          {needsOwnerAction && isRequestOwner && (() => {
                                                                                               const processingKey = `${requestId}-${participantId}`;
                                                                                               const isProcessing = processingParticipants[processingKey];
                                                                                               return (
                                                                                                    <>
                                                                                                         <Button
                                                                                                              className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-1"
                                                                                                              onClick={() => handleAcceptParticipant(b.id, requestId, j)}
                                                                                                              disabled={isProcessing}
                                                                                                         >
                                                                                                              {isProcessing ? (
                                                                                                                   <>
                                                                                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                                                                                        <span>Đang xử lý...</span>
                                                                                                                   </>
                                                                                                              ) : (
                                                                                                                   <>
                                                                                                                        <CheckCircle className="w-3 h-3" />
                                                                                                                        <span>Chấp nhận</span>
                                                                                                                   </>
                                                                                                              )}
                                                                                                         </Button>
                                                                                                         <Button
                                                                                                              variant="outline"
                                                                                                              className="px-3 py-1.5 text-xs border-red-300 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1"
                                                                                                              onClick={() => handleRejectParticipant(b.id, requestId, j)}
                                                                                                              disabled={isProcessing}
                                                                                                         >
                                                                                                              {isProcessing ? (
                                                                                                                   <>
                                                                                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                                                                                        <span>Đang xử lý...</span>
                                                                                                                   </>
                                                                                                              ) : (
                                                                                                                   <>
                                                                                                                        <XCircle className="w-3 h-3" />
                                                                                                                        <span>Từ chối</span>
                                                                                                                   </>
                                                                                                              )}
                                                                                                         </Button>
                                                                                                    </>
                                                                                               );
                                                                                          })()}
                                                                                          {isAccepted && (
                                                                                               <Badge className="text-xs bg-green-100 text-green-700 border-green-300">
                                                                                                    Đã chấp nhận
                                                                                               </Badge>
                                                                                          )}
                                                                                          {isRejected && (
                                                                                               <Badge className="text-xs bg-red-100 text-red-700 border-red-300">
                                                                                                    Đã từ chối
                                                                                               </Badge>
                                                                                          )}
                                                                                     </div>
                                                                                </div>
                                                                           );
                                                                      })}
                                                                 </div>
                                                            </div>
                                                       );
                                                  })()}
                                             </div>
                                        </FadeIn>
                                   ))}
                              </StaggerContainer>
                         )}

                         {/* Player Match History */}
                         {playerHistories && playerHistories.length > 0 && (
                              <SlideIn direction="up" delay={200}>
                                   <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/50">
                                        <div className="text-lg font-bold text-emerald-800 mb-2">Lịch sử ghép đối</div>
                                        <div className="space-y-2">
                                             {playerHistories.map((h, index) => (
                                                  <FadeIn key={h.historyId} delay={index * 50}>
                                                       <div key={h.historyId} className="flex justify-between items-center bg-white/80 border border-emerald-100 rounded-xl p-3 transition-all duration-200 hover:shadow-md hover:scale-[1.01]">
                                                            <div className="flex flex-col">
                                                                 <div className="font-semibold text-emerald-800">{h.fieldName || "Sân"}</div>
                                                                 <div className="text-sm text-gray-700">{h.address}</div>
                                                                 <div className="text-xs text-gray-600">{h.date} • {h.slotName}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                 <div className="text-xs text-gray-500">{new Date(h.createdAt).toLocaleString('vi-VN')}</div>
                                                                 <div className="text-xs font-semibold text-emerald-700">{h.role} • {h.finalStatus}</div>
                                                            </div>
                                                       </div>
                                                  </FadeIn>
                                             ))}
                                        </div>
                                   </div>
                              </SlideIn>
                         )}

                         {/* Pagination for Single Bookings */}
                         {totalSingleBookings > pageSize && (
                              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                                   <div className="text-sm text-teal-700">
                                        Trang {currentPage}/{totalPages} • {Math.min(endIndex, totalSingleBookings)} trên {totalSingleBookings} đặt sân
                                   </div>
                                   <div className="flex items-center gap-2">
                                        <Button
                                             onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                             disabled={currentPage === 1}
                                             className={`px-3 py-1 rounded-full border transition-colors ${currentPage === 1 ? "bg-gray-50 text-gray-400 border-gray-300 cursor-not-allowed" : "bg-white text-teal-600 border-teal-200 hover:border-teal-300 hover:bg-teal-50"}`}
                                        >
                                             <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                        <div className="flex items-center gap-1">
                                             {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                  <Button
                                                       key={page}
                                                       onClick={() => setCurrentPage(page)}
                                                       className={`px-3 py-1 rounded-full border transition-colors ${page === currentPage ? "bg-teal-500 text-white border-teal-500 hover:bg-teal-600" : "border-teal-200 text-teal-600 bg-teal-50 hover:bg-teal-500 hover:text-white hover:border-teal-300"}`}
                                                  >
                                                       {page}
                                                  </Button>
                                             ))}
                                        </div>
                                        <Button
                                             onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                             disabled={currentPage === totalPages}
                                             className={`px-3 py-1 rounded-full border transition-colors ${currentPage === totalPages ? "bg-gray-50 text-gray-400 border-gray-300 cursor-not-allowed" : "bg-white text-teal-600 border-teal-200 hover:border-teal-300 hover:bg-teal-50"}`}
                                        >
                                             <ChevronRight className="w-4 h-4" />
                                        </Button>
                                   </div>
                              </div>
                         )}

                         {visibleGroups.length === 0 && visibleSingles.length === 0 && (
                              <div className="text-center py-16">
                                   <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-50 text-teal-600 mb-3">
                                        <SlidersHorizontal className="w-6 h-6" />
                                   </div>
                                   <div className="text-gray-900 font-medium">Không có kết quả phù hợp</div>
                                   <div className="text-gray-500 text-sm">Thử thay đổi từ khóa hoặc bộ lọc.</div>
                              </div>
                         )}
                    </div>
               </Container>

               {/* Find Opponent Modal */}
               <FindOpponentModal
                    isOpen={showFindOpponentModal}
                    onClose={() => setShowFindOpponentModal(false)}
                    booking={selectedBooking}
                    user={user}
                    onSuccess={handleFindOpponentSuccess}
               />

               {/* Recurring Opponent Modal */}
               {opponentData && (
                    <RecurringOpponentModal
                         isOpen={showRecurringOpponentModal}
                         onClose={() => {
                              setShowRecurringOpponentModal(false);
                              setOpponentData(null);
                         }}
                         booking={opponentData.booking}
                         user={user}
                         level={opponentData.level}
                         note={opponentData.note}
                         onSuccess={handleRecurringOpponentSuccess}
                    />
               )}

               {/* Rating Modal */}
               <RatingModal
                    isOpen={showRatingModal}
                    onClose={() => {
                         setShowRatingModal(false);
                         setSelectedBooking(null);
                    }}
                    booking={selectedBooking}
                    onSuccess={handleRatingSuccess}
               />

               <InvoiceModal
                    isOpen={showInvoiceModal}
                    booking={invoiceBooking}
                    onClose={() => {
                         setShowInvoiceModal(false);
                         setInvoiceBooking(null);
                    }}
               />

               {/* Cancel Booking Modal */}
               <CancelBookingModal
                    isOpen={showCancelModal}
                    onClose={() => {
                         setShowCancelModal(false);
                         setCancelBooking(null);
                    }}
                    onConfirm={handleConfirmCancel}
                    booking={cancelBooking}
                    isLoading={isCancelling}
               />

               {/* Payment Modal */}
               <Modal
                    isOpen={showPaymentModal}
                    onClose={() => {
                         if (!isConfirmingPayment) {
                              setShowPaymentModal(false);
                              setPaymentBooking(null);
                              setPaymentQRCode(null);
                         }
                    }}
                    title={
                         <div className="flex items-center gap-2">
                              <CreditCard className="w-5 h-5 text-teal-600" />
                              <span>Thanh toán booking</span>
                         </div>
                    }
                    className="max-w-lg rounded-2xl border border-teal-200 shadow-xl"
               >
                    {paymentBooking && (
                         <div className="space-y-5">
                              {/* Booking Info Card */}
                              <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-5 border-2 border-teal-200 shadow-sm">
                                   <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                             <div>
                                                  <p className="text-xs text-teal-600 font-medium mb-1">Sân bóng</p>
                                                  <p className="text-lg font-bold text-teal-900">{paymentBooking.fieldName}</p>
                                             </div>
                                             <div className="bg-white/80 rounded-lg px-3 py-2 border border-teal-200">
                                                  <p className="text-xs text-teal-600 font-medium">Booking ID</p>
                                                  <p className="text-sm font-bold text-teal-700">#{paymentBooking.bookingId || paymentBooking.id}</p>
                                             </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-teal-200">
                                             <div>
                                                  <p className="text-xs text-teal-600 font-medium mb-1">📅 Ngày & Giờ</p>
                                                  <p className="text-sm font-semibold text-teal-900">{paymentBooking.date}</p>
                                                  <p className="text-sm font-semibold text-teal-900">{paymentBooking.time}</p>
                                             </div>
                                             <div>
                                                  <p className="text-xs text-teal-600 font-medium mb-1">💰 Số tiền</p>
                                                  <p className="text-xl font-bold text-teal-600">{formatPrice(paymentBooking.depositAmount || paymentBooking.totalPrice || 0)}</p>
                                             </div>
                                        </div>
                                   </div>
                              </div>

                              {/* QR Code Section */}
                              {isLoadingQR ? (
                                   <div className="text-center py-12">
                                        <div className="relative inline-block">
                                             <div className="animate-spin rounded-full h-16 w-16 border-4 border-teal-200 border-t-teal-600 mx-auto mb-4"></div>
                                             <div className="absolute inset-0 flex items-center justify-center">
                                                  <CreditCard className="w-6 h-6 text-teal-600" />
                                             </div>
                                        </div>
                                        <p className="text-gray-700 font-medium mt-4">Đang tạo mã QR thanh toán...</p>
                                        <p className="text-xs text-gray-500 mt-2">Vui lòng đợi trong giây lát</p>
                                   </div>
                              ) : paymentQRCode ? (
                                   <div className="space-y-4">
                                        {/* Instructions */}
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                             <div className="flex items-start gap-2">
                                                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                                  <div className="text-xs text-blue-800">
                                                       <p className="font-semibold mb-1">Hướng dẫn thanh toán:</p>
                                                       <ol className="list-decimal list-inside space-y-1 text-blue-700">
                                                            <li>Mở ứng dụng ngân hàng trên điện thoại</li>
                                                            <li>Chọn tính năng quét mã QR</li>
                                                            <li>Quét mã QR bên dưới</li>
                                                            <li>Xác nhận thanh toán</li>
                                                       </ol>
                                                  </div>
                                             </div>
                                        </div>

                                        {/* QR Code Display */}
                                        <div className="text-center">
                                             <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center justify-center gap-2">
                                                  <CreditCard className="w-4 h-4 text-teal-600" />
                                                  Mã QR thanh toán
                                             </p>
                                             <div className="bg-white p-5 rounded-xl border-2 border-teal-300 shadow-lg inline-block">
                                                  <img
                                                       src={paymentQRCode}
                                                       alt="Payment QR Code"
                                                       className="w-72 h-72 mx-auto"
                                                  />
                                             </div>
                                             <p className="text-xs text-gray-500 mt-3 flex items-center justify-center gap-1">
                                                  <AlertTriangle className="w-3 h-3" />
                                                  Sau khi thanh toán thành công, nhấn nút "Đã thanh toán" bên dưới
                                             </p>
                                        </div>

                                        {/* Countdown timer */}
                                        {timeRemaining[paymentBooking.id] && timeRemaining[paymentBooking.id] > 0 && (
                                             <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300 rounded-lg p-4 shadow-sm">
                                                  <div className="flex items-center justify-center gap-2">
                                                       <Clock className="w-5 h-5 text-orange-600 animate-pulse" />
                                                       <div>
                                                            <p className="text-xs text-orange-600 font-medium">Thời gian còn lại</p>
                                                            <p className="text-lg font-bold text-orange-800">
                                                                 {formatTimeRemaining(timeRemaining[paymentBooking.id])}
                                                            </p>
                                                       </div>
                                                  </div>
                                                  <p className="text-xs text-orange-700 text-center mt-2">
                                                       ⚠️ Booking sẽ tự động hủy nếu không thanh toán trong thời gian này
                                                  </p>
                                             </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex gap-3 pt-2">
                                             <Button
                                                  variant="outline"
                                                  onClick={() => {
                                                       if (!isConfirmingPayment) {
                                                            setShowPaymentModal(false);
                                                            setPaymentBooking(null);
                                                            setPaymentQRCode(null);
                                                       }
                                                  }}
                                                  disabled={isConfirmingPayment}
                                                  className="flex-1 border-gray-300 hover:bg-gray-50"
                                             >
                                                  Đóng
                                             </Button>
                                             <Button
                                                  onClick={handleConfirmPayment}
                                                  disabled={isConfirmingPayment}
                                                  className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all"
                                             >
                                                  {isConfirmingPayment ? (
                                                       <div className="flex items-center gap-2">
                                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                            <span>Đang xử lý...</span>
                                                       </div>
                                                  ) : (
                                                       <div className="flex items-center gap-2">
                                                            <CheckCircle className="w-4 h-4" />
                                                            <span>Đã thanh toán</span>
                                                       </div>
                                                  )}
                                             </Button>
                                        </div>
                                   </div>
                              ) : (
                                   <div className="text-center py-12">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
                                             <XCircle className="w-8 h-8" />
                                        </div>
                                        <p className="text-gray-700 font-medium">Không thể tạo mã QR thanh toán</p>
                                        <p className="text-xs text-gray-500 mt-2">Vui lòng thử lại sau hoặc liên hệ hỗ trợ</p>
                                        <Button
                                             onClick={() => {
                                                  setShowPaymentModal(false);
                                                  setPaymentBooking(null);
                                                  setPaymentQRCode(null);
                                             }}
                                             className="mt-4"
                                             variant="outline"
                                        >
                                             Đóng
                                        </Button>
                                   </div>
                              )}
                         </div>
                    )}
               </Modal>
          </Section>
     );
}


