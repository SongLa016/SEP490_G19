import React, { useEffect } from "react";
import { Calendar, MapPin, Receipt, Repeat, CalendarDays, Trash2, Star, SlidersHorizontal, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, BarChart3, CreditCard, Clock, CheckCircle, AlertTriangle, XCircle, UserSearch, Info, RefreshCw, Loader2, User, Phone, Calendar as CalendarIcon } from "lucide-react";
import { Section, Container, Card, CardContent, Button, Badge, LoadingList, FadeIn, StaggerContainer, Modal } from "../../../../shared/components/ui";

import FindOpponentModal from "../../../../shared/components/FindOpponentModal";
import RatingModal from "../../../../shared/components/RatingModal";
import InvoiceModal from "../../../../shared/components/InvoiceModal";
import CancelBookingModal from "../../../../shared/components/CancelBookingModal";

import {
     BookingStats,
     BookingFilters,
     FixedPackagesTab,
} from './components';
import {
     formatPrice,
     formatTimeRemaining,
     stripRefundQrInfo,
     extractRequestId,
     extractParticipants,
     getRequestOwnerId,
     normalizeParticipantStatus,
     participantNeedsOwnerAction,
     isParticipantAcceptedByOwner,
     isParticipantRejectedByOwner,
     filterParticipantsForDisplay,
     shouldShowCancelButton,
     getRecurringStatus,
} from './components/utils';

// Import custom hooks
import {
     useBookingHistory,
     useBookingPackages,
     useMatchRequests,
     useBookingPayment,
     useBookingCancel,
     useBookingFilters,
     useBookingModals,
     useBookingUtils,
} from './components/hooks';

export default function BookingHistory({ user }) {
     const playerId = user?.userID || user?.UserID || user?.id || user?.Id || user?.userId;

     // ===== CUSTOM HOOKS =====

     // Booking History Hook
     const {
          bookings,
          setBookings,
          groupedBookings,
          setGroupedBookings,
          isLoadingBookings,
          bookingError,
          scheduleDataMap,
          timeRemaining,
          loadBookings,
     } = useBookingHistory(playerId);

     // Booking Packages Hook
     const {
          bookingPackages,
          isLoadingPackages,
          packageError,
          packageSessionsMap,
          expandedPackageSessions,
          sessionScheduleDataMap,
          loadBookingPackages,
          togglePackageSessions,
          formatSessionDateLabel,
          formatSessionTimeRange,
     } = useBookingPackages(user, playerId);

     // Match Requests Hook
     const {
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
     } = useMatchRequests(bookings, user);

     // Booking Filters Hook
     const {
          query,
          setQuery,
          statusFilter,
          setStatusFilter,
          dateFrom,
          setDateFrom,
          dateTo,
          setDateTo,
          sortBy,
          setSortBy,
          currentPage,
          setCurrentPage,
          activeTab,
          setActiveTab,
          showRecurringDetails,
          expandedParticipants,
          toggleRecurringDetails,
          toggleExpandedParticipants,
          visibleSingles,
          visibleGroups,
          paginatedSingles,
          sortedPlayerHistories,
          stats,
          totalSingleBookings,
          totalPages,
          startIndex,
          endIndex,
          pageSize,
          resetFilters,
     } = useBookingFilters(bookings, groupedBookings, playerHistories);

     // Booking Payment Hook
     const {
          showPaymentModal,
          paymentBooking,
          paymentQRCode,
          isLoadingQR,
          isConfirmingPayment,
          handleContinuePayment,
          handleConfirmPayment,
          closePaymentModal,
     } = useBookingPayment(playerId, setBookings, setGroupedBookings);

     // Booking Cancel Hook
     const {
          showCancelModal,
          cancelBooking,
          isCancelling,
          handleCancel,
          handleConfirmCancel,
          handleCancelRecurring,
          handleCancelSingleRecurring,
          closeCancelModal,
     } = useBookingCancel(playerId, bookings, setBookings, groupedBookings, setGroupedBookings);

     // Booking Modals Hook
     const {
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
     } = useBookingModals(
          playerId,
          bookings,
          setBookings,
          setGroupedBookings,
          setBookingIdToRequest,
          setRequestJoins,
          loadMatchRequestsForBookings
     );

     // Booking Utils Hook
     const {
          isPendingUnpaidWithin2Hours,
          hasExistingMatchRequest,
          shouldShowFindOpponentButton,
          normalizeRequestStatus,
          getRequestBadgeConfig,
          isRequestLocked,
          getAcceptedParticipants,
          isBookingOlderThan2Hours,
          shouldHideCancelButtonByDate,
          statusBadge,
          paymentStatusBadge,
     } = useBookingUtils(bookingIdToRequest, scheduleDataMap);

     // Load packages khi chuyển tab
     useEffect(() => {
          if (activeTab === "packages") {
               loadBookingPackages();
          }
     }, [activeTab, loadBookingPackages]);

     // ===== RENDER =====
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
                    <Card className="mb-4 border p-1 bg-white/80 backdrop-blur rounded-[30px] shadow-xl ring-1 ring-teal-100 border-teal-200">
                         <CardContent>
                              <BookingStats stats={stats} />

                              <BookingFilters
                                   query={query}
                                   setQuery={setQuery}
                                   statusFilter={statusFilter}
                                   setStatusFilter={setStatusFilter}
                                   dateFrom={dateFrom}
                                   setDateFrom={setDateFrom}
                                   dateTo={dateTo}
                                   setDateTo={setDateTo}
                                   sortBy={sortBy}
                                   setSortBy={setSortBy}
                                   onReset={() => {
                                        setQuery("");
                                        setStatusFilter("all");
                                        setDateFrom("");
                                        setDateTo("");
                                        setSortBy("newest");
                                        setCurrentPage(1);
                                   }}
                              />

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

                              {/* Tab nav */}
                              <div className="mb-4 flex items-center justify-center gap-2 border-b border-teal-200">
                                   <button
                                        onClick={() => setActiveTab("bookings")}
                                        className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all duration-300 ${activeTab === "bookings"
                                             ? "bg-teal-500 text-white border-b-2 border-teal-600"
                                             : "text-gray-600 hover:text-teal-600 hover:bg-teal-50"
                                             }`}
                                   >
                                        <CalendarIcon className="w-4 h-4 inline mr-2" />
                                        Lịch đơn
                                   </button>
                                   <button
                                        onClick={() => setActiveTab("matchHistory")}
                                        className={`px-4 py-2 text-sm  font-semibold rounded-t-lg transition-all duration-300 relative ${activeTab === "matchHistory"
                                             ? "bg-teal-500 text-white border-b-2 border-teal-600"
                                             : "text-gray-600 hover:text-teal-600 hover:bg-teal-50"
                                             }`}
                                   >
                                        <UserSearch className="w-4 h-4 inline mr-2" />
                                        Lịch sử ghép đối
                                        {playerHistories && playerHistories.length > 0 && (
                                             <span className="ml-2 px-1.5 py-0.5 text-xs border  bg-white/30  rounded-full">
                                                  {playerHistories.length}
                                             </span>
                                        )}
                                   </button>
                                   <button
                                        onClick={() => setActiveTab("packages")}
                                        className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all duration-300 ${activeTab === "packages"
                                             ? "bg-teal-500 text-white border-b-2 border-teal-600"
                                             : "text-gray-600 hover:text-teal-600 hover:bg-teal-50"
                                             }`}
                                   >
                                        <Repeat className="w-4 h-4 inline mr-2" />
                                        Lịch cố định
                                   </button>
                              </div>

                              {/* kêt quả sân */}
                              {activeTab === "bookings" && (
                                   <div className=" p-2 px-3 bg-teal-50 border border-teal-200 rounded-3xl">
                                        <div className="flex items-center justify-between">
                                             <div className="flex items-center gap-4 text-sm">
                                                  <span className="text-red-700 font-semibold flex items-center gap-1">
                                                       <BarChart3 className="w-4 h-4" />
                                                       Tổng cộng: <span className="text-red-800 font-bold">{visibleGroups.length + visibleSingles.length}</span> đặt sân
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
                              )}
                              {/* lịch cố định */}
                              {activeTab === "packages" && (
                                   <div className=" p-2 px-3 bg-teal-50 border border-teal-200 rounded-3xl">
                                        <div className="flex items-center justify-between">
                                             <div className="flex items-center gap-4 text-sm">
                                                  <span className="text-teal-700 font-semibold flex items-center gap-1">
                                                       <Repeat className="w-4 h-4" />
                                                       Tổng gói sân cố định: <span className="text-teal-800 font-bold">{bookingPackages.length}</span>
                                                  </span>
                                             </div>
                                        </div>
                                   </div>
                              )}


                         </CardContent></Card>

                    {/* lịch đơn */}
                    {activeTab === "bookings" && (
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

                                                                                     {/* Thông báo và button thanh toán cho booking chưa thanh toán (recurring) */}
                                                                                     {isPendingUnpaidWithin2Hours(booking) && (
                                                                                          <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg mb-2">
                                                                                               <div className="flex items-start gap-2">
                                                                                                    <Clock className="w-3 h-3 text-orange-600 mt-0.5 flex-shrink-0" />
                                                                                                    <div className="flex-1">
                                                                                                         <p className="text-xs text-orange-800 font-medium mb-1">
                                                                                                              {timeRemaining[booking.id] && timeRemaining[booking.id] > 0
                                                                                                                   ? `⏰ Cần thanh toán trong ${formatTimeRemaining(timeRemaining[booking.id])}`
                                                                                                                   : "⏰ Vui lòng thanh toán"
                                                                                                              }
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
                                                                                          {booking.status !== "cancelled" && booking.status !== "expired" && !isBookingOlderThan2Hours(booking) && !shouldHideCancelButtonByDate(booking) && (
                                                                                               <Button variant="outline" onClick={() => handleCancelSingleRecurring(booking.id)} className="px-2 !py-0.5 text-xs rounded-xl border border-red-200 text-red-700 hover:text-red-700 hover:bg-red-50">
                                                                                                    Hủy
                                                                                               </Button>
                                                                                          )}
                                                                                          {booking.status === "completed" && (
                                                                                               (() => {
                                                                                                    const hasRating = !!(booking.ratingId || booking.ratingStars);
                                                                                                    if (!hasRating) {
                                                                                                         return (
                                                                                                              <Button
                                                                                                                   onClick={() => handleRating(booking)}
                                                                                                                   className="px-2 py-1 text-xs rounded-3xl bg-yellow-50 text-yellow-700 border hover:text-yellow-700 hover:bg-yellow-100 hover:border-yellow-300 transition-colors"
                                                                                                              >
                                                                                                                   <Star className="w-3 h-3 mr-1" /> Đánh giá
                                                                                                              </Button>
                                                                                                         );
                                                                                                    }
                                                                                                    return (
                                                                                                         <span className="px-2 py-1 text-xs rounded-3xl bg-green-50 text-green-700 border border-green-300 font-medium">
                                                                                                              Đã đánh giá
                                                                                                         </span>
                                                                                                    );
                                                                                               })()
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

                                                                 {/* Thông báo và button thanh toán cho booking chưa thanh toán */}
                                                                 {isPendingUnpaidWithin2Hours(b) && (
                                                                      <div className="mt-2 mb-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                                                           <div className="flex items-start gap-2">
                                                                                <Clock className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                                                                <div className="flex-1">
                                                                                     <div className="text-sm text-orange-800">
                                                                                          <p className="font-medium mb-1">
                                                                                               {timeRemaining[b.id] && timeRemaining[b.id] > 0
                                                                                                    ? `⏰ Cần thanh toán trong ${formatTimeRemaining(timeRemaining[b.id])}`
                                                                                                    : "⏰ Vui lòng thanh toán để hoàn tất đặt sân"
                                                                                               }
                                                                                          </p>
                                                                                          <p className="text-xs text-orange-700 mb-2">
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
                                                                                          Booking đã bị hủy do quá thời gian thanh toán.
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
                                                                           let displayDateObj = null; // Store Date object to get correct day of week
                                                                           if (scheduleData && scheduleData.date) {
                                                                                try {
                                                                                     // Parse date từ format "2025-12-01" hoặc "YYYY-MM-DD"
                                                                                     const [year, month, day] = scheduleData.date.split('-').map(Number);
                                                                                     if (year && month && day) {
                                                                                          displayDateObj = new Date(year, month - 1, day);
                                                                                          displayDate = displayDateObj.toLocaleDateString("vi-VN");
                                                                                     } else {
                                                                                          displayDateObj = new Date(scheduleData.date);
                                                                                          if (!isNaN(displayDateObj.getTime())) {
                                                                                               displayDate = displayDateObj.toLocaleDateString("vi-VN");
                                                                                          }
                                                                                     }
                                                                                } catch (e) {
                                                                                     displayDate = scheduleData.date;
                                                                                }
                                                                           }

                                                                           // Fallback về booking date nếu không có trong schedule
                                                                           if (!displayDate) {
                                                                                displayDate = b.date;
                                                                                // Try to parse b.date to get Date object
                                                                                if (b.date) {
                                                                                     try {
                                                                                          // Try different date formats
                                                                                          if (b.date.includes('/')) {
                                                                                               const [d, m, y] = b.date.split('/').map(Number);
                                                                                               if (y && m && d) {
                                                                                                    displayDateObj = new Date(y, m - 1, d);
                                                                                               }
                                                                                          } else {
                                                                                               displayDateObj = new Date(b.date);
                                                                                               if (isNaN(displayDateObj.getTime())) {
                                                                                                    displayDateObj = null;
                                                                                               }
                                                                                          }
                                                                                     } catch (e) {
                                                                                          displayDateObj = null;
                                                                                     }
                                                                                }
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

                                                                           // Format date with correct day of week from displayDateObj
                                                                           let formattedDateWithDay = displayDate || "Chưa có ngày";
                                                                           if (displayDateObj && !isNaN(displayDateObj.getTime())) {
                                                                                const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
                                                                                const dayName = dayNames[displayDateObj.getDay()];
                                                                                // Format date as dd/mm/yyyy
                                                                                const day = String(displayDateObj.getDate()).padStart(2, '0');
                                                                                const month = String(displayDateObj.getMonth() + 1).padStart(2, '0');
                                                                                const year = displayDateObj.getFullYear();
                                                                                formattedDateWithDay = `${dayName}, ${day}/${month}/${year}`;
                                                                           } else if (displayDate) {
                                                                                // Fallback: try to parse displayDate string
                                                                                try {
                                                                                     let dateToParse = displayDate;
                                                                                     if (dateToParse.includes('/')) {
                                                                                          const [d, m, y] = dateToParse.split('/').map(Number);
                                                                                          if (y && m && d) {
                                                                                               const parsedDate = new Date(y, m - 1, d);
                                                                                               if (!isNaN(parsedDate.getTime())) {
                                                                                                    const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
                                                                                                    const dayName = dayNames[parsedDate.getDay()];
                                                                                                    formattedDateWithDay = `${dayName}, ${dateToParse}`;
                                                                                               }
                                                                                          }
                                                                                     }
                                                                                } catch (e) {
                                                                                     // Keep original displayDate if parsing fails
                                                                                }
                                                                           }

                                                                           return (
                                                                                <div className="flex flex-col gap-2 p-3 bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-xl">
                                                                                     <div className="flex items-center gap-2 text-sm">
                                                                                          <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                                                                          <div className="flex-1">
                                                                                               <span className="font-semibold text-gray-900">
                                                                                                    {formattedDateWithDay}
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
                                                       <div className="mt-4 pt-3 border-t items-center border-teal-100 flex flex-wrap gap-2">
                                                            <Button variant="secondary" onClick={() => handleViewInvoice(b)} className="px-2 !py-1 text-sm rounded-3xl">
                                                                 <Receipt className="w-4 h-4 mr-2" /> Xem hóa đơn
                                                            </Button>
                                                            {user && (
                                                                 <>
                                                                      {/* Button tiếp tục thanh toán cho booking chưa thanh toán */}
                                                                      {isPendingUnpaidWithin2Hours(b) && (
                                                                           <Button
                                                                                onClick={() => handleContinuePayment(b)}
                                                                                className="px-3 py-2 text-sm bg-orange-600 hover:bg-orange-700 text-white rounded-3xl"
                                                                           >
                                                                                <CreditCard className="w-4 h-4 mr-2" />
                                                                                Tiếp tục thanh toán
                                                                           </Button>
                                                                      )}

                                                                      {shouldShowCancelButton(b) && !shouldHideCancelButtonByDate(b) && (
                                                                           <Button variant="destructive" onClick={() => handleCancel(b.id)} className="px-3 rounded-3xl py-2 text-sm">
                                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                                Hủy đặt
                                                                           </Button>
                                                                      )}
                                                                      {b.status === "completed" && (
                                                                           (() => {
                                                                                const hasRating = !!(b.ratingId || b.ratingStars);
                                                                                if (!hasRating) {
                                                                                     return (
                                                                                          <Button
                                                                                               onClick={() => handleRating(b)}
                                                                                               className="px-3 py-2 text-sm bg-yellow-50 text-yellow-700 border-yellow-400 hover:text-yellow-700 hover:bg-yellow-100 hover:border-yellow-600 transition-colors rounded-3xl"
                                                                                          >
                                                                                               <Star className="w-4 h-4 mr-2" />
                                                                                               Đánh giá
                                                                                          </Button>
                                                                                     );
                                                                                }
                                                                                return (
                                                                                     <span className="px-3 py-1.5 text-sm rounded-3xl bg-green-50 text-green-700 border border-green-300 font-medium">
                                                                                          Đã đánh giá
                                                                                     </span>
                                                                                );
                                                                           })()
                                                                      )}
                                                                      {/* MatchRequest actions */}
                                                                      {(() => {
                                                                           // Ẩn toàn bộ khu vực yêu cầu ghép đội với các booking đã hoàn tất hoặc đã hủy
                                                                           const bookingStatus = String(b.status || b.bookingStatus || "").toLowerCase();
                                                                           const isCompletedOrCancelled = bookingStatus === "completed" || bookingStatus === "cancelled";
                                                                           if (isCompletedOrCancelled) return null;

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
                                                                                          <UserSearch className="w-4 h-4" />
                                                                                          <span>Tìm đối thủ</span>
                                                                                     </Button>
                                                                                );
                                                                           }

                                                                           if (hasRequest) {
                                                                                const currentRequestId = extractRequestId(req) || fallbackRequestId;
                                                                                const isPlaceholder = req?.placeholder === true;
                                                                                const badgeConfig = req ? getRequestBadgeConfig(req) : {
                                                                                     text: "Đã ghép thành công",
                                                                                     className: "border-teal-200 text-teal-700 bg-teal-50"
                                                                                };
                                                                                const requestLocked = req ? isRequestLocked(req) : false;
                                                                                const requestStatus = normalizeRequestStatus(req);
                                                                                const isMatched = requestStatus === "matched";

                                                                                // Get accepted participants for matched status
                                                                                const acceptedParticipants = isMatched ? getAcceptedParticipants(req) : [];

                                                                                // For placeholder, allow refresh to fetch full details
                                                                                const canRefresh = !isMatched && (isPlaceholder || (req ? !requestLocked : Boolean(currentRequestId)));

                                                                                return (
                                                                                     <div className="flex flex-col gap-2">
                                                                                          <div className="flex items-center gap-2">
                                                                                               <Badge variant="outline" className={`text-xs ${badgeConfig.className}`}>
                                                                                                    {isMatched ? 'Đã ghép đôi' : 'Đã yêu cầu'} • {badgeConfig.text}
                                                                                               </Badge>
                                                                                               {canRefresh && (
                                                                                                    <Button
                                                                                                         variant="outline"
                                                                                                         className="px-3 !rounded-full py-2 text-sm flex items-center gap-2"
                                                                                                         onClick={() => refreshRequestForBooking(b.id, currentRequestId || b.bookingId)}
                                                                                                         disabled={refreshingRequests[currentRequestId || b.bookingId]}
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

                                                                                          {isMatched && acceptedParticipants.length > 0 && (
                                                                                               <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                                                                                                    <div className="text-xs font-semibold text-green-800 mb-1">Đội đối thủ:</div>
                                                                                                    {acceptedParticipants.map((p, idx) => (
                                                                                                         <div key={idx} className="text-xs text-green-700">
                                                                                                              • {p.teamName || p.fullName} ({p.playerCount || 0} người)
                                                                                                         </div>
                                                                                                    ))}
                                                                                               </div>
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
                                                            const participantKey = `booking-${b.id}-request-${requestId || 'default'}`;
                                                            const isExpanded = expandedParticipants[participantKey] || false;

                                                            const toggleParticipants = () => {
                                                                 toggleExpandedParticipants(participantKey);
                                                            };

                                                            return (
                                                                 <div className="mt-3 p-3 rounded-xl border border-teal-100 bg-white/70">
                                                                      <div className="flex items-center justify-between mb-3">
                                                                           <div className="flex flex-col gap-1 flex-1">
                                                                                <div className="flex items-center gap-2">
                                                                                     <div className="font-semibold text-teal-800">Đội tham gia</div>
                                                                                     <Badge variant="outline" className={`text-xs w-fit ${badgeConfig.className}`}>
                                                                                          {badgeConfig.text}
                                                                                     </Badge>
                                                                                     {displayParticipants.length > 0 && (
                                                                                          <span className="text-xs text-gray-500">({displayParticipants.length} đội)</span>
                                                                                     )}
                                                                                </div>
                                                                                {requestLocked && acceptedTeams.length > 0 && (
                                                                                     <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg">
                                                                                          Trận đấu đã được xác nhận với {acceptedTeams.length} đội.
                                                                                     </div>
                                                                                )}
                                                                           </div>
                                                                           {displayParticipants.length > 0 && (
                                                                                <Button
                                                                                     variant="outline"
                                                                                     size="sm"
                                                                                     onClick={toggleParticipants}
                                                                                     className="text-xs px-2 py-1 h-auto border-teal-200 text-teal-700 rounded-full"
                                                                                >
                                                                                     {isExpanded ? (
                                                                                          <>
                                                                                               <ChevronUp className="w-3 h-3 mr-1" />
                                                                                               Thu gọn
                                                                                          </>
                                                                                     ) : (
                                                                                          <>
                                                                                               <ChevronDown className="w-3 h-3 mr-1" />
                                                                                               Mở rộng
                                                                                          </>
                                                                                     )}
                                                                                </Button>
                                                                           )}
                                                                      </div>
                                                                      {isExpanded && (
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
                                                                                          <div key={participantId || Math.random()} className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-sm transition-shadow">
                                                                                               <div className="flex items-start justify-between gap-3">
                                                                                                    <div className="flex-1 space-y-2">
                                                                                                         <div className="flex items-center gap-2 flex-wrap">
                                                                                                              <span className="font-semibold text-gray-900">{participantTeamName}</span>
                                                                                                              {j.playerCount && (
                                                                                                                   <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                                                                                                        {j.playerCount} người
                                                                                                                   </Badge>
                                                                                                              )}
                                                                                                              <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                                                                                                                   {participantStatus}
                                                                                                              </Badge>
                                                                                                         </div>

                                                                                                         {j.fullName && j.fullName !== participantTeamName && (
                                                                                                              <div className="text-sm text-gray-600 flex items-center gap-1">
                                                                                                                   <User className="w-3 h-3" />
                                                                                                                   <span>{j.fullName}</span>
                                                                                                              </div>
                                                                                                         )}

                                                                                                         {j.contactPhone && (
                                                                                                              <div className="text-sm text-gray-600 flex items-center gap-1">
                                                                                                                   <Phone className="w-3 h-3" />
                                                                                                                   <span>{j.contactPhone}</span>
                                                                                                              </div>
                                                                                                         )}

                                                                                                         {j.note && j.note.trim() && (
                                                                                                              <div className="text-sm text-gray-600 flex items-start gap-1">
                                                                                                                   <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                                                                                                   <span className="italic">{j.note}</span>
                                                                                                              </div>
                                                                                                         )}

                                                                                                         <div className="text-xs text-gray-500">
                                                                                                              Tham gia: {new Date(j.joinedAt).toLocaleString('vi-VN')}
                                                                                                         </div>
                                                                                                    </div>

                                                                                                    <div className="flex my-auto items-end gap-2">
                                                                                                         {needsOwnerAction && isRequestOwner && (() => {
                                                                                                              const processingKey = `${requestId}-${participantId}`;
                                                                                                              const isProcessing = processingParticipants[processingKey];
                                                                                                              return (
                                                                                                                   <>
                                                                                                                        <Button
                                                                                                                             className="px-3 py-1.5 rounded-2xl text-sm bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
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
                                                                                                                             className="px-3 py-1.5 text-sm border-red-300 text-red-600 hover:bg-red-50 rounded-2xl flex items-center gap-1"
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
                                                                                          </div>
                                                                                     );
                                                                                })}
                                                                           </div>
                                                                      )}
                                                                 </div>
                                                            );
                                                       })()}
                                                  </div>
                                             </FadeIn>
                                        ))}
                                   </StaggerContainer>
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
                    )}

                    {/* lịch cố định */}
                    {activeTab === "packages" && (
                         <FixedPackagesTab
                              bookingPackages={bookingPackages}
                              packageSessionsMap={packageSessionsMap}
                              expandedPackageSessions={expandedPackageSessions}
                              togglePackageSessions={togglePackageSessions}
                              packageError={packageError}
                              isLoadingPackages={isLoadingPackages}
                              formatPrice={formatPrice}
                              formatSessionDateLabel={formatSessionDateLabel}
                              formatSessionTimeRange={formatSessionTimeRange}
                              sessionScheduleDataMap={sessionScheduleDataMap}
                         />
                    )}

                    {/* lịch sử tham gia trận đấu */}
                    {activeTab === "matchHistory" && (
                         <div className="space-y-4">
                              {sortedPlayerHistories && sortedPlayerHistories.length > 0 ? (
                                   <StaggerContainer staggerDelay={50}>
                                        {sortedPlayerHistories.map((h, index) => {
                                             // Format date and time
                                             // Parse matchDate properly to avoid timezone issues
                                             let matchDate = null;
                                             if (h.matchDate) {
                                                  const dateStr = h.matchDate;
                                                  if (dateStr.includes('T')) {
                                                       // ISO format: extract date part and create date object
                                                       const [datePart] = dateStr.split('T');
                                                       const [year, month, day] = datePart.split('-').map(Number);
                                                       matchDate = new Date(year, month - 1, day);
                                                  } else {
                                                       matchDate = new Date(dateStr);
                                                  }
                                             }

                                             // Format date with day of week from matchDate (not current date)
                                             let formattedDate = "Chưa có ngày";
                                             if (matchDate && !isNaN(matchDate.getTime())) {
                                                  const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
                                                  const dayName = dayNames[matchDate.getDay()];
                                                  // Format date as dd/mm/yyyy
                                                  const day = String(matchDate.getDate()).padStart(2, '0');
                                                  const month = String(matchDate.getMonth() + 1).padStart(2, '0');
                                                  const year = matchDate.getFullYear();
                                                  const dateStr = `${day}/${month}/${year}`;
                                                  formattedDate = `${dayName}, ${dateStr}`;
                                             }
                                             const timeRange = h.startTime && h.endTime ? `${h.startTime} - ${h.endTime}` : h.startTime || "Chưa có giờ";

                                             // Status badge
                                             const getStatusBadge = (status) => {
                                                  const statusLower = (status || "").toLowerCase();
                                                  if (statusLower === "matched") {
                                                       return <Badge className="bg-green-500 hover:bg-green-600 text-white border-green-200">Đã ghép đôi</Badge>;
                                                  } else if (statusLower === "pending") {
                                                       return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-200">Đang chờ</Badge>;
                                                  } else if (statusLower === "cancelled" || statusLower === "expired") {
                                                       return <Badge className="bg-red-500 hover:bg-red-600 text-white border-red-200">Đã hủy</Badge>;
                                                  }
                                                  return <Badge className="bg-gray-500 hover:bg-gray-600 text-white border-gray-200">{status || "Không rõ"}</Badge>;
                                             };

                                             // Role badge
                                             const getRoleBadge = (role) => {
                                                  const roleLower = (role || "").toLowerCase();
                                                  if (roleLower === "creator") {
                                                       return <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-blue-200">Người tạo</Badge>;
                                                  } else if (roleLower === "participant") {
                                                       return <Badge className="bg-purple-500 hover:bg-purple-600 text-white border-purple-200">Người tham gia</Badge>;
                                                  }
                                                  return <Badge className="bg-gray-500 hover:bg-gray-600 text-white border-gray-200">{role || "Không rõ"}</Badge>;
                                             };

                                             return (
                                                  <FadeIn key={h.historyId} delay={index * 50}>
                                                       <div className="p-5 mb-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
                                                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                                                 {/* Left Section - Match Info */}
                                                                 <div className="flex-1 space-y-3">
                                                                      {/* Header */}
                                                                      <div className="flex items-start justify-between gap-3">
                                                                           <div>
                                                                                <h3 className="text-xl font-bold text-emerald-900 mb-1">{h.fieldName || "Sân bóng"}</h3>
                                                                                {h.complexName && (
                                                                                     <p className="text-sm text-emerald-700 flex items-center gap-1">
                                                                                          <MapPin className="w-4 h-4" />
                                                                                          {h.complexName}
                                                                                     </p>
                                                                                )}
                                                                           </div>
                                                                           <div className="flex flex-col items-end gap-2">
                                                                                {getStatusBadge(h.finalStatus)}
                                                                                {getRoleBadge(h.role)}
                                                                           </div>
                                                                      </div>

                                                                      {/* Match Date & Time */}
                                                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                           <div className="flex items-center gap-2 px-3 py-1 bg-white/80 rounded-2xl border border-emerald-200">
                                                                                <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                                                                <div>
                                                                                     <p className="text-xs text-blue-600 font-medium">Ngày bắt đầu</p>
                                                                                     <p className="text-sm font-semibold text-emerald-900">{formattedDate}</p>
                                                                                </div>
                                                                           </div>
                                                                           <div className="flex items-center gap-2 px-3 py-1 bg-white/80 rounded-2xl border border-emerald-200">
                                                                                <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                                                                                <div>
                                                                                     <p className="text-xs text-yellow-600 font-medium">Thời gian</p>
                                                                                     <p className="text-sm font-semibold text-emerald-900">{timeRange}</p>
                                                                                </div>
                                                                           </div>
                                                                      </div>

                                                                      {/* Opponent Info */}
                                                                      {h.opponentTeamName || h.opponentFullName ? (
                                                                           <div className="px-3 py-2 bg-white/80 rounded-2xl border border-emerald-200">
                                                                                <div className="flex items-center gap-2 mb-3">
                                                                                     <UserSearch className="w-5 h-5 text-emerald-600" />
                                                                                     <h4 className="font-semibold text-emerald-900">Thông tin đối thủ</h4>
                                                                                </div>
                                                                                <div className=" flex items-center gap-2">
                                                                                     {h.opponentTeamName && (
                                                                                          <div className="flex items-center gap-2">
                                                                                               <span className="text-sm font-medium text-gray-700">Tên đội:</span>
                                                                                               <span className="text-sm font-semibold text-emerald-900">{h.opponentTeamName}</span>
                                                                                          </div>
                                                                                     )}
                                                                                     -
                                                                                     {h.opponentFullName && (
                                                                                          <div className="flex items-center gap-1">
                                                                                               <User className="w-4 h-4 text-gray-500" />
                                                                                               <span className="text-sm text-gray-700">{h.opponentFullName}</span>
                                                                                          </div>
                                                                                     )}
                                                                                     -
                                                                                     {h.opponentPhone && (
                                                                                          <div className="flex items-center gap-1">
                                                                                               <Phone className="w-4 h-4 text-gray-500" />
                                                                                               <span className="text-sm text-gray-700">{h.opponentPhone}</span>
                                                                                          </div>
                                                                                     )}
                                                                                     -
                                                                                     {h.playerCount && (
                                                                                          <div className="flex items-center gap-1">
                                                                                               <span className="text-sm text-gray-600">Số người:</span>
                                                                                               <Badge className="bg-blue-50 hover:bg-blue-600 text-blue-700 border-blue-200 text-xs">
                                                                                                    {h.playerCount} người
                                                                                               </Badge>
                                                                                          </div>
                                                                                     )}
                                                                                </div>
                                                                           </div>
                                                                      ) : (
                                                                           <div className="px-3 py-1 bg-yellow-50 rounded-2xl border border-yellow-200">
                                                                                <p className="text-sm text-yellow-800 flex items-center gap-2">
                                                                                     <Info className="w-4 h-4" />
                                                                                     Chưa có thông tin đối thủ
                                                                                </p>
                                                                           </div>
                                                                      )}
                                                                 </div>

                                                                 {/* Right Section - Metadata */}
                                                                 <div className="md:w-48 space-y-3">
                                                                      <div className="p-3 bg-white/80 rounded-xl border border-emerald-200">
                                                                           <p className="text-xs text-emerald-600 font-medium mb-1">ID Yêu cầu</p>
                                                                           <p className="text-sm font-semibold text-emerald-900">#{h.matchRequestId || "N/A"}</p>
                                                                      </div>
                                                                      <div className="p-3 bg-white/80 rounded-xl border border-emerald-200">
                                                                           <p className="text-xs text-emerald-600 font-medium mb-1">Ngày tạo</p>
                                                                           <p className="text-sm font-semibold text-emerald-900">
                                                                                {h.createdAt ? new Date(h.createdAt).toLocaleDateString('vi-VN', {
                                                                                     year: 'numeric',
                                                                                     month: 'short',
                                                                                     day: 'numeric',
                                                                                     hour: '2-digit',
                                                                                     minute: '2-digit'
                                                                                }) : "N/A"}
                                                                           </p>
                                                                      </div>
                                                                 </div>
                                                            </div>
                                                       </div>
                                                  </FadeIn>
                                             );
                                        })}
                                   </StaggerContainer>
                              ) : (
                                   <div className="text-center py-16">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mb-4">
                                             <UserSearch className="w-8 h-8" />
                                        </div>
                                        <div className="text-gray-900 font-medium text-lg mb-2">Chưa có lịch sử ghép đối</div>
                                        <div className="text-gray-500 text-sm">Bạn chưa có lịch sử ghép đối nào. Hãy tìm đối thủ cho các booking của bạn!</div>
                                   </div>
                              )}
                         </div>
                    )}
               </Container>

               {/* tìm đối thủ */}
               <FindOpponentModal
                    isOpen={showFindOpponentModal}
                    onClose={closeFindOpponentModal}
                    booking={selectedBooking}
                    user={user}
                    onSuccess={handleFindOpponentSuccess}
               />


               {/* đánh giá */}
               <RatingModal
                    isOpen={showRatingModal}
                    onClose={closeRatingModal}
                    booking={selectedBooking}
                    mode={editingRating ? "edit" : "create"}
                    initialRating={editingRating?.stars || 0}
                    initialComment={editingRating?.comment || ""}
                    ratingId={editingRating?.ratingId || null}
                    onSuccess={handleRatingSuccess}
               />

               {/* hóa đơn */}
               <InvoiceModal
                    isOpen={showInvoiceModal}
                    booking={invoiceBooking}
                    onClose={closeInvoiceModal}
               />

               {/* hủy đặt sân */}
               <CancelBookingModal
                    isOpen={showCancelModal}
                    onClose={closeCancelModal}
                    onConfirm={handleConfirmCancel}
                    booking={cancelBooking}
                    isLoading={isCancelling}
               />

               {/* thanh toán */}
               <Modal
                    isOpen={showPaymentModal}
                    onClose={() => {
                         if (!isConfirmingPayment) {
                              closePaymentModal();
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
                              {/* thông tin đặt sân */}
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

                              {/* mã QR */}
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
                                                            closePaymentModal();
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
                                             onClick={closePaymentModal}
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

