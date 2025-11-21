import React, { useState, useEffect, useMemo } from "react";
import { Calendar, MapPin, Receipt, Search, Repeat, CalendarDays, Trash2, Star, SlidersHorizontal, ArrowUpDown, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, BarChart3, RotateCcw, Calendar as CalendarIcon, CreditCard, Clock, CheckCircle, AlertTriangle, XCircle, UserSearch, UserSearchIcon } from "lucide-react";
import { Section, Container, Card, CardContent, Input, Button, Badge, Select, SelectTrigger, SelectContent, SelectItem, SelectValue, DatePicker, LoadingList, FadeIn, SlideIn, StaggerContainer } from "../../../../shared/components/ui";
import { listBookingsByUser, updateBooking, fetchBookingsByPlayer } from "../../../../shared/index";
import { listMatchRequests, listMatchJoinsByRequest, acceptMatchJoin, rejectMatchJoin, expireMatchRequestsNow, listPlayerHistoriesByUser } from "../../../../shared/index";
import FindOpponentModal from "../../../../shared/components/FindOpponentModal";
import RecurringOpponentModal from "../../../../shared/components/RecurringOpponentModal";
import RatingModal from "../../../../shared/components/RatingModal";
import RescheduleModal from "../../../../shared/components/RescheduleModal";
import InvoiceModal from "../../../../shared/components/InvoiceModal";
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
          const start = parseDateValue(item.startTime);
          const end = parseDateValue(item.endTime);
          const timeLabel = start && end ? `${formatTimeLabel(start)} - ${formatTimeLabel(end)}` : (item.slotName || item.time || "");
          const durationMinutes = start && end ? Math.max(15, Math.round((end - start) / 60000)) : item.duration;
          return {
               id: String(item.bookingId ?? item.bookingID ?? item.id ?? `API-${index}`),
               bookingId: item.bookingId ?? item.bookingID ?? item.id ?? `API-${index}`,
               // Database fields
               userId: item.userId ?? item.userID ?? item.UserID,
               scheduleId: item.scheduleId ?? item.scheduleID ?? item.ScheduleID,
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
     const [showRescheduleModal, setShowRescheduleModal] = useState(false);
     const [showInvoiceModal, setShowInvoiceModal] = useState(false);
     const [selectedBooking, setSelectedBooking] = useState(null);
     const [invoiceBooking, setInvoiceBooking] = useState(null);
     const [opponentData, setOpponentData] = useState(null);
     const [isLoadingBookings, setIsLoadingBookings] = useState(false);
     const [bookingError, setBookingError] = useState("");
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

     // Load match requests mapping to bookings
     useEffect(() => {
          try {
               expireMatchRequestsNow();
          } catch { }
          const all = listMatchRequests({ status: "" });
          const map = {};
          all.forEach(r => { map[r.bookingId] = r; });
          setBookingIdToRequest(map);
          const joinsMap = {};
          all.forEach(r => { joinsMap[r.requestId] = listMatchJoinsByRequest(r.requestId); });
          setRequestJoins(joinsMap);
          if (user?.id) setPlayerHistories(listPlayerHistoriesByUser(user.id));
     }, [bookings, user?.id]);

     const formatPrice = (price) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

     const handleFindOpponent = (booking) => {
          setSelectedBooking(booking);
          setShowFindOpponentModal(true);
     };

     const handleFindOpponentSuccess = (result) => {
          if (result.type === "recurring") {
               setOpponentData(result);
               setShowFindOpponentModal(false);
               setShowRecurringOpponentModal(true);
          } else {
               // Single booking success
               const all = listMatchRequests({ status: "" });
               const map = {};
               all.forEach(r => { map[r.bookingId] = r; });
               setBookingIdToRequest(map);
               setShowFindOpponentModal(false);
               Swal.fire('Đã gửi!', 'Yêu cầu tìm đối đã được tạo.', 'success');
          }
     };

     const handleRecurringOpponentSuccess = () => {
          const all = listMatchRequests({ status: "" });
          const map = {};
          all.forEach(r => { map[r.bookingId] = r; });
          setBookingIdToRequest(map);
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

     const handleReschedule = (booking) => {
          // Show "Coming Soon" message
          Swal.fire({
               icon: 'info',
               title: '🚀 Chức năng đang phát triển',
               html: `
                    <div class="text-left space-y-3">
                         <p class="text-gray-700">Chức năng <strong>Đổi giờ đặt sân</strong> đang được phát triển và sẽ sớm ra mắt!</p>
                         <div class="bg-blue-50 p-3 rounded-lg border border-blue-200">
                              <p class="text-sm text-blue-800 font-medium mb-2">✨ Tính năng sắp có:</p>
                              <ul class="text-sm text-blue-700 space-y-1 list-disc list-inside">
                                   <li>Đổi ngày đặt sân linh hoạt</li>
                                   <li>Chọn khung giờ mới</li>
                                   <li>Tự động tính chênh lệch giá</li>
                                   <li>Xác nhận nhanh chóng</li>
                              </ul>
                         </div>
                         <p class="text-sm text-gray-600">Hiện tại, vui lòng liên hệ chủ sân để đổi giờ. Cảm ơn bạn đã thông cảm! 🙏</p>
                    </div>
               `,
               confirmButtonText: 'Đã hiểu',
               confirmButtonColor: '#0d9488',
               width: '500px',
          });

          // Keep the old code commented for future use
          // setSelectedBooking(booking);
          // setShowRescheduleModal(true);
     };

     const handleRescheduleSuccess = (result) => {
          setShowRescheduleModal(false);
          setSelectedBooking(null);
          Swal.fire('Thành công!', `Đã đổi giờ từ ${result.oldDate} sang ${result.newDate}`, 'success');
     };

     const handleViewInvoice = (bookingPayload) => {
          if (!bookingPayload) return;
          setInvoiceBooking(bookingPayload);
          setShowInvoiceModal(true);
     };

     const statusBadge = (status) => {
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
                    return <Badge variant="outline" className="bg-gray-500 text-white border border-gray-200 hover:bg-gray-600 hover:text-white">Hết hạn</Badge>;
               case "reactive":
                    return <Badge variant="outline" className="bg-blue-500 text-white border border-blue-200 hover:bg-blue-600 hover:text-white">Kích hoạt lại</Badge>;
               default:
                    return <Badge variant="outline" className="bg-gray-500 text-white border border-gray-200 hover:bg-gray-600 hover:text-white">Không rõ</Badge>;
          }
     };

     const paymentStatusBadge = (paymentStatus) => {
          const status = (paymentStatus ?? "").toString().toLowerCase();
          switch (status) {
               case "paid":
                    return <Badge variant="default" className="bg-green-500 text-white border border-green-200 hover:bg-green-600 hover:text-white">Đã thanh toán</Badge>;
               case "refunded":
                    return <Badge variant="secondary" className="bg-blue-500 text-white border border-blue-200 hover:bg-blue-600 hover:text-white">Đã hoàn tiền</Badge>;
               case "pending":
               default:
                    return <Badge variant="outline" className="bg-yellow-500 text-white border border-yellow-200 hover:bg-yellow-600 hover:text-white">Chờ thanh toán</Badge>;
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
          return { total, completed, cancelled, upcoming };
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
          Swal.fire({
               title: 'Xác nhận hủy đặt sân',
               text: 'Bạn có chắc muốn hủy đặt sân này?',
               icon: 'warning',
               showCancelButton: true,
               confirmButtonColor: '#d33',
               cancelButtonColor: '#3085d6',
               confirmButtonText: 'Xác nhận hủy',
               cancelButtonText: 'Hủy'
          }).then((result) => {
               if (result.isConfirmed) {
                    updateBooking(id, { status: "cancelled" });
                    setBookings(prev => prev.map(booking =>
                         booking.id === id ? { ...booking, status: "cancelled" } : booking
                    ));
                    Swal.fire('Đã hủy!', 'Đặt sân đã được hủy thành công.', 'success');
               }
          });
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
          Swal.fire({
               title: 'Xác nhận hủy đặt sân',
               text: 'Bạn có chắc muốn hủy buổi đặt sân này?',
               icon: 'warning',
               showCancelButton: true,
               confirmButtonColor: '#d33',
               cancelButtonColor: '#3085d6',
               confirmButtonText: 'Xác nhận hủy',
               cancelButtonText: 'Hủy'
          }).then((result) => {
               if (result.isConfirmed) {
                    updateBooking(id, { status: "cancelled" });
                    setBookings(prev => prev.map(booking =>
                         booking.id === id ? { ...booking, status: "cancelled" } : booking
                    ));
                    Swal.fire('Đã hủy!', 'Đặt sân đã được hủy thành công.', 'success');
               }
          });
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
                                                                           <div key={booking.id} className="flex justify-between items-center p-3 bg-white/80 backdrop-blur rounded-xl border border-teal-100">
                                                                                <div className="flex items-center gap-3 flex-wrap">
                                                                                     <span className="px-2 py-0.5 rounded-full text-xs bg-teal-50 text-teal-700 border border-teal-200">Tuần {booking.weekNumber}</span>
                                                                                     <span className="inline-flex items-center gap-1 text-sm text-gray-700 bg-gray-50 border border-gray-200 font-semibold px-2 py-1 rounded-full"><Calendar className="w-3.5 h-3.5" /> {booking.date}</span>
                                                                                     {statusBadge(booking.status)}
                                                                                     {paymentStatusBadge(booking.paymentStatus)}
                                                                                </div>
                                                                                <div className="flex gap-2">
                                                                                     {booking.status !== "cancelled" && (
                                                                                          <Button variant="outline" onClick={() => handleCancelSingleRecurring(booking.id)} className="px-2 !py-0.5 text-xs rounded-xl border border-red-200 text-red-700 hover:text-red-700 hover:bg-red-50">
                                                                                               Hủy
                                                                                          </Button>
                                                                                     )}
                                                                                     <Button
                                                                                          onClick={() => handleRating(booking)}
                                                                                          className="px-2 py-1 text-xs rounded-3xl bg-yellow-50 text-yellow-700 border hover:text-yellow-700 hover:bg-yellow-100 hover:border-yellow-300 transition-colors"
                                                                                     >
                                                                                          <Star className="w-3 h-3 mr-1" /> Đánh giá
                                                                                     </Button>
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
                                                                 {statusBadge(b.status)}
                                                                 {paymentStatusBadge(b.paymentStatus)}
                                                                 <span className="px-2 py-0.5 rounded-full text-xs bg-teal-50 text-teal-700 border border-teal-200 font-medium">#{b.id}</span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                 <div className="flex flex-wrap items-center gap-2 text-sm">
                                                                      <span className="inline-flex items-center gap-1 bg-teal-50 border border-teal-100 text-teal-700 px-2 py-1 rounded-full">
                                                                           <MapPin className="w-4 h-4" />
                                                                           <span className="font-medium">{b.address}</span>
                                                                      </span>
                                                                      <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-700 px-2 py-1 rounded-full">
                                                                           <Calendar className="w-4 h-4" />
                                                                           <span className="font-medium">{b.date} • {b.time}</span>
                                                                      </span>
                                                                 </div>

                                                                 {b.duration && (
                                                                      <div className="text-xs text-gray-600 flex items-center gap-1">
                                                                           <Clock className="w-3 h-3" />
                                                                           Thời lượng: <span className="font-medium text-teal-700">{b.duration} phút</span>
                                                                      </div>
                                                                 )}

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
                                                                 {b.cancelReason && (
                                                                      <div className="text-xs text-red-600 italic">
                                                                           Lý do hủy: {b.cancelReason}
                                                                      </div>
                                                                 )}
                                                            </div>
                                                       </div>
                                                       <div className="text-right shrink-0">
                                                            <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-500 mb-1">
                                                                 {formatPrice(b.totalPrice || b.price)}
                                                            </div>
                                                            {b.depositAmount > 0 && b.totalPrice > b.depositAmount && (
                                                                 <div className="text-xs text-gray-500 mb-1">
                                                                      (Còn lại: {formatPrice(b.totalPrice - b.depositAmount)})
                                                                 </div>
                                                            )}
                                                            <div className="text-xs text-gray-500">
                                                                 {b.createdAt && new Date(b.createdAt).toLocaleDateString('vi-VN')}
                                                            </div>
                                                            {b.confirmedAt && (
                                                                 <div className="text-xs text-green-600">
                                                                      Xác nhận: {new Date(b.confirmedAt).toLocaleDateString('vi-VN')}
                                                                 </div>
                                                            )}
                                                            {b.cancelledAt && (
                                                                 <div className="text-xs text-red-600">
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
                                                                 <Button
                                                                      variant="outline"
                                                                      onClick={() => handleReschedule(b)}
                                                                      className="px-3 py-2 text-sm bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300 transition-colors rounded-3xl"
                                                                 >
                                                                      <Calendar className="w-4 h-4 mr-2" />
                                                                      Đổi giờ
                                                                 </Button>
                                                                 {b.status !== "cancelled" && (
                                                                      <Button variant="destructive" onClick={() => handleCancel(b.id)} className="px-3 rounded-3xl py-2 text-sm">
                                                                           <Trash2 className="w-4 h-4 mr-2" />
                                                                           Hủy đặt
                                                                      </Button>
                                                                 )}
                                                                 <Button
                                                                      onClick={() => handleRating(b)}
                                                                      className="px-3 py-2 text-sm bg-yellow-50 text-yellow-700 border-yellow-400 hover:text-yellow-700 hover:bg-yellow-100 hover:border-yellow-600 transition-colors rounded-3xl"
                                                                 >
                                                                      <Star className="w-4 h-4 mr-2" />
                                                                      Đánh giá
                                                                 </Button>
                                                                 {/* MatchRequest actions */}
                                                                 {(() => {
                                                                      const req = bookingIdToRequest[b.id];
                                                                      if (!req) {
                                                                           return (
                                                                                <Button
                                                                                     variant="secondary"
                                                                                     onClick={() => handleFindOpponent(b)}
                                                                                     className="px-3 !rounded-full py-2 text-sm"
                                                                                >
                                                                                     <UserSearchIcon className="w-4 h-4 mr-2" />
                                                                                     Tìm đối thủ
                                                                                </Button>
                                                                           );
                                                                      }
                                                                      return (
                                                                           <div className="flex items-center gap-2">
                                                                                <Badge variant="outline" className="text-xs">Đã yêu cầu • {req.status}</Badge>
                                                                                <Button
                                                                                     variant="outline"
                                                                                     className="px-3 !rounded-full py-2 text-sm"
                                                                                     onClick={() => {
                                                                                          // refresh joins for this request
                                                                                          setRequestJoins(prev => ({ ...prev, [req.requestId]: listMatchJoinsByRequest(req.requestId) }));
                                                                                          Swal.fire({
                                                                                               toast: true,
                                                                                               position: 'top-end',
                                                                                               icon: 'success',
                                                                                               title: 'Đã tải danh sách đội tham gia',
                                                                                               showConfirmButton: false,
                                                                                               timer: 2200,
                                                                                               timerProgressBar: true
                                                                                          });
                                                                                     }}
                                                                                >
                                                                                     Tải đội tham gia
                                                                                </Button>
                                                                           </div>
                                                                      );
                                                                 })()}
                                                            </>
                                                       )}
                                                  </div>
                                                  {/* Joins list for this booking's request (owner view) */}
                                                  {bookingIdToRequest[b.id] && Array.isArray(requestJoins[bookingIdToRequest[b.id].requestId]) && requestJoins[bookingIdToRequest[b.id].requestId].length > 0 && (
                                                       <div className="mt-3 p-3 rounded-xl border border-teal-100 bg-white/70">
                                                            <div className="font-semibold text-teal-800 mb-2">Đội tham gia</div>
                                                            <div className="space-y-2">
                                                                 {requestJoins[bookingIdToRequest[b.id].requestId].map(j => (
                                                                      <div key={j.joinId} className="flex items-center justify-between text-sm">
                                                                           <div className="flex items-center gap-2">
                                                                                <Badge variant="outline" className="text-xs">{j.level || "any"}</Badge>
                                                                                <span className="text-gray-700">User: {j.userId}</span>
                                                                                <span className="text-gray-500">• {j.status}</span>
                                                                           </div>
                                                                           <div className="flex items-center gap-2">
                                                                                {j.status === "Pending" && (
                                                                                     <>
                                                                                          <Button className="px-2 py-1 text-xs" onClick={() => {
                                                                                               acceptMatchJoin({ joinId: j.joinId });
                                                                                               setRequestJoins(prev => ({ ...prev, [bookingIdToRequest[b.id].requestId]: listMatchJoinsByRequest(bookingIdToRequest[b.id].requestId) }));
                                                                                               const all = listMatchRequests({ status: "" });
                                                                                               const map = {};
                                                                                               all.forEach(r => { map[r.bookingId] = r; });
                                                                                               setBookingIdToRequest(map);
                                                                                          }}>Chấp nhận</Button>
                                                                                          <Button variant="outline" className="px-2 py-1 text-xs" onClick={() => {
                                                                                               rejectMatchJoin({ joinId: j.joinId });
                                                                                               setRequestJoins(prev => ({ ...prev, [bookingIdToRequest[b.id].requestId]: listMatchJoinsByRequest(bookingIdToRequest[b.id].requestId) }));
                                                                                          }}>Từ chối</Button>
                                                                                     </>
                                                                                )}
                                                                           </div>
                                                                      </div>
                                                                 ))}
                                                            </div>
                                                       </div>
                                                  )}
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

               {/* Reschedule Modal */}
               <RescheduleModal
                    isOpen={showRescheduleModal}
                    onClose={() => {
                         setShowRescheduleModal(false);
                         setSelectedBooking(null);
                    }}
                    booking={selectedBooking}
                    onSuccess={handleRescheduleSuccess}
               />

               <InvoiceModal
                    isOpen={showInvoiceModal}
                    booking={invoiceBooking}
                    onClose={() => {
                         setShowInvoiceModal(false);
                         setInvoiceBooking(null);
                    }}
               />
          </Section>
     );
}


