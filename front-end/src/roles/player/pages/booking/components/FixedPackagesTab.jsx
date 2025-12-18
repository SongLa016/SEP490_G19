import React from "react";
import {
  Repeat,
  Calendar,
  CalendarDays,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Info,
  ChevronDown,
  ChevronUp,
  Building2,
} from "lucide-react";
import { Badge, Button, LoadingList, StaggerContainer, FadeIn } from "../../../../../shared/components/ui";

// hiển thị tab "Lịch cố định" - danh sách các gói đặt sân cố định
export default function FixedPackagesTab({
  bookingPackages = [],
  packageSessionsMap = {},
  expandedPackageSessions = {},
  togglePackageSessions,
  packageError,
  isLoadingPackages,
  formatPrice,
  formatSessionDateLabel,
  formatSessionTimeRange,
  sessionScheduleDataMap = {},
}) {
  // format ngày ngắn gọn (dd/mm/yyyy)
  const formatDateShort = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("vi-VN");
  };

  // format ngày giờ đầy đủ (dd/mm/yyyy hh:mm)
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
  };

  //hiển thị cho trạng thái booking
  const getBookingStatusConfig = (status) => {
    const statusLower = (status || "").toLowerCase();
    if (statusLower.includes("confirmed") || statusLower.includes("active")) {
      return { label: "Đã xác nhận", badge: "bg-green-500 text-white", icon: CheckCircle };
    }
    if (statusLower.includes("pending") || statusLower.includes("waiting")) {
      return { label: "Chờ xác nhận", badge: "bg-yellow-500 text-white", icon: Clock };
    }
    if (statusLower.includes("cancelled") || statusLower.includes("canceled")) {
      return { label: "Đã hủy", badge: "bg-red-500 text-white", icon: XCircle };
    }
    if (statusLower.includes("completed") || statusLower.includes("finished")) {
      return { label: "Đã hoàn thành", badge: "bg-blue-500 text-white", icon: CheckCircle };
    }
    return { label: status || "Chưa xác định", badge: "bg-gray-500 text-white", icon: Info };
  };

  //hiển thị cho trạng thái thanh toán
  const getPaymentStatusConfig = (status) => {
    const statusLower = (status || "").toLowerCase();
    if (statusLower.includes("paid") || statusLower.includes("completed")) {
      return { label: "Đã thanh toán", badge: "bg-emerald-500 text-white", icon: CheckCircle };
    }
    if (statusLower.includes("pending") || statusLower.includes("waiting")) {
      return { label: "Chờ xác nhận", badge: "bg-orange-500 text-white", icon: AlertTriangle };
    }
    if (statusLower.includes("failed") || statusLower.includes("error")) {
      return { label: "Thanh toán thất bại", badge: "bg-red-500 text-white", icon: XCircle };
    }
    if (statusLower.includes("refunded")) {
      return { label: "Đã hoàn tiền", badge: "bg-purple-500 text-white", icon: RotateCcw };
    }
    return { label: status || "Chưa xác định", badge: "bg-gray-500 text-white", icon: Info };
  };

  //hiển thị cho trạng thái session (buổi đặt)
  const getSessionStatusConfig = (status) => {
    const statusLower = (status || "").toLowerCase();
    if (statusLower.includes("booking") || statusLower.includes("pending") || statusLower.includes("waiting")) {
      return { label: "Đã đặt", badge: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle };
    }
    if (statusLower.includes("cancelled") || statusLower.includes("canceled")) {
      return { label: "Đã hủy", badge: "bg-red-100 text-red-700 border-red-200", icon: XCircle };
    }
    return { label: status || "Chưa xác định", badge: "bg-gray-100 text-gray-700 border-gray-200", icon: Info };
  };

  // format khoảng thời gian của schedule
  const formatScheduleTimeRange = (scheduleData, session) => {
    // ưu tiên lấy thời gian từ schedule data
    if (scheduleData) {
      if (scheduleData.slotName) return scheduleData.slotName;
      if (scheduleData.startTime && scheduleData.endTime) {
        const startTime = typeof scheduleData.startTime === 'string'
          ? scheduleData.startTime
          : scheduleData.startTime;
        const endTime = typeof scheduleData.endTime === 'string'
          ? scheduleData.endTime
          : scheduleData.endTime;
        return `${startTime} - ${endTime}`;
      }
      if (scheduleData.startTime) {
        return typeof scheduleData.startTime === 'string'
          ? scheduleData.startTime
          : String(scheduleData.startTime);
      }
    }
    return formatSessionTimeRange(session);
  };

  return (
    <div className="mt-4 space-y-4">
      {packageError && (
        <div className="mb-2 p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
          {packageError}
        </div>
      )}
      {isLoadingPackages && <LoadingList count={3} />}
      {!isLoadingPackages && bookingPackages.length === 0 && !packageError && (
        <div className="p-4 rounded-2xl border border-dashed border-teal-200 bg-teal-50/40 text-center text-sm text-teal-700">
          Bạn chưa có gói sân cố định nào.
        </div>
      )}
      {!isLoadingPackages && bookingPackages.length > 0 && (
        <StaggerContainer staggerDelay={50}>
          {/* hiển thị danh sách gói đặt sân cố định */}
          {bookingPackages.map((pkg, index) => {
            const packageId = pkg.bookingPackageId;
            const sessions =
              packageSessionsMap[packageId] ||
              packageSessionsMap[String(packageId)] ||
              packageSessionsMap[Number(packageId)] ||
              [];
            const isExpanded = !!expandedPackageSessions[pkg.bookingPackageId];
            const sessionCount = sessions.length;

            const formattedStartDate = formatDateShort(pkg.startDate);
            const formattedEndDate = formatDateShort(pkg.endDate);
            const formattedCreatedAt = formatDateTime(pkg.createdAt);

            const bookingStatusConfig = getBookingStatusConfig(pkg.bookingStatus);
            const paymentStatusConfig = getPaymentStatusConfig(pkg.paymentStatus);
            const BookingStatusIcon = bookingStatusConfig.icon;
            const PaymentStatusIcon = paymentStatusConfig.icon;

            const isQRExpired = pkg.qrExpiresAt && new Date(pkg.qrExpiresAt) < new Date();
            const needsPayment = paymentStatusConfig.label.includes("Chờ thanh toán");

            return (
              <FadeIn key={pkg.id || index} delay={index * 50}>
                <div className="p-5 rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Repeat className="w-6 h-6 text-teal-600" />
                        <h3 className="text-xl font-bold text-teal-900">{pkg.packageName || "Gói sân cố định"}</h3>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {pkg.bookingStatus && (
                          <Badge variant="default" className={`${bookingStatusConfig.badge} font-semibold flex items-center gap-1`}>
                            <BookingStatusIcon className="w-3 h-3" />
                            {bookingStatusConfig.label}
                          </Badge>
                        )}
                        {pkg.paymentStatus && (
                          <Badge variant="default" className={`${paymentStatusConfig.badge} font-semibold flex items-center gap-1`}>
                            <PaymentStatusIcon className="w-3 h-3" />
                            {paymentStatusConfig.label}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-yellow-600">
                        {formatPrice(pkg.totalPrice || 0)}
                      </div>
                      <div className="text-xs text-orange-600 font-medium">Tổng thanh toán</div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <div className="flex border w-fit border-teal-200 rounded-full px-3 py-2 items-center bg-white/80">
                          <Building2 className="w-4 h-4 mr-2 text-teal-600" />
                          <span className="text-teal-700 font-semibold">{pkg.fieldName || "Chưa có tên sân"}</span>
                        </div>
                        <div className="flex flex-col gap-2 p-3 bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-xl">
                          <div className="flex items-center text-sm">
                            <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                            <span className="text-teal-700 font-semibold">
                              Từ ngày <span className="font-semibold text-yellow-600">{formattedStartDate}</span> đến ngày <span className="font-semibold text-yellow-600">{formattedEndDate}</span>
                            </span>
                          </div>
                          <div className="flex items-center text-xs">
                            <Clock className="w-4 h-4 mr-2 text-teal-600" />
                            <span className="text-teal-700 font-semibold">Tạo: {formattedCreatedAt}</span>
                          </div>
                        </div>

                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-col items-center gap-2">
                          {sessionCount > 0 && (
                            <div className="text-center  flex items-center gap-2">
                              <div className="text-base font-bold text-teal-700">Tổng <span className="text-red-500 font-bold">{sessionCount}</span> buổi</div>
                            </div>
                          )}
                          {pkg.qrCodeUrl && (
                            <div className="flex flex-col items-center gap-2">
                              <div
                                className={`relative p-2 rounded-xl border-2 ${isQRExpired || !needsPayment ? "border-gray-200 bg-gray-50" : "border-teal-200 bg-white shadow-md"
                                  }`}
                              >
                                {isQRExpired && (
                                  <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center z-10">
                                    <span className="text-white text-xs font-bold bg-red-500 px-2 py-1 rounded">Hết hạn</span>
                                  </div>
                                )}
                                <img
                                  src={pkg.qrCodeUrl}
                                  alt="QR Code thanh toán"
                                  className={`w-28 h-28 rounded-lg object-contain ${isQRExpired ? "opacity-50" : ""}`}
                                />
                              </div>
                              {pkg.qrExpiresAt && (
                                <div className={`text-xs text-right ${isQRExpired ? "text-red-600 font-semibold" : "text-gray-600"}`}>
                                  <div className="flex items-center gap-1 justify-end">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                      Hết hạn:{" "}
                                      {new Date(pkg.qrExpiresAt).toLocaleString("vi-VN", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="gap-2 justify-between px-4 py-2 items-center bg-white/80 rounded-2xl border border-teal-200">
                      <div className="flex justify-between items-center">
                        <div className="flex px-3 py-1 items-center justify-start bg-white/80 rounded-full border border-teal-200">
                          <CalendarDays className="w-4 h-4 mr-2 text-teal-600" />
                          <span className="text-teal-700 font-semibold">
                            {sessionCount > 0 ? (
                              <>
                                <span className="text-red-500 font-bold">{sessionCount}</span>
                                <span className="text-teal-700"> buổi</span>
                              </>
                            ) : "Đang tải..."}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => togglePackageSessions(pkg.bookingPackageId)}
                          className="text-sm border py-0.5 border-teal-200 text-teal-700 rounded-full justify-end w-fit"
                        >
                          {isExpanded ? <ChevronUp className="w-5 h-5 mr-1" /> : <ChevronDown className="w-5 h-5 mr-1" />}
                          {isExpanded ? "Ẩn chi tiết" : "Xem chi tiết"}
                        </Button>
                      </div>
                      <div>
                        {/* Chỉ hiển thị chi tiết buổi đặt khi booking package đã được confirm */}
                        {isExpanded && (
                          <div className="mt-2 pt-2 border-t border-teal-200">
                            {/* Kiểm tra trạng thái booking package - ẩn danh sách buổi nếu chưa confirm */}
                            {!bookingStatusConfig.label.includes("Đã xác nhận") && !bookingStatusConfig.label.includes("Đã hoàn thành") ? (
                              <div className="p-4 rounded-xl border border-yellow-200 bg-yellow-50 text-center">
                                <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                                <p className="text-sm text-yellow-700 font-medium">
                                  Danh sách buổi đặt sẽ hiển thị sau khi gói được xác nhận
                                </p>
                                <p className="text-xs text-yellow-600 mt-1">
                                  Vui lòng chờ chủ sân xác nhận thanh toán
                                </p>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-medium text-gray-900">Chi tiết các buổi đặt sân: {sessionCount > 0 && `(${sessionCount} buổi)`}</h4>
                                  {sessionCount > 0 && (() => {
                                    const cancelledCount = sessions.filter(s => {
                                      const status = (s.sessionStatus || s.status || "").toLowerCase();
                                      return status.includes("cancel");
                                    }).length;
                                    const bookedCount = sessions.filter(s => {
                                      const status = (s.sessionStatus || s.status || "").toLowerCase();
                                      return !status.includes("cancel");
                                    }).length;
                                    return (
                                      <div className="flex items-center gap-2 text-xs">
                                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
                                          <CheckCircle className="w-3 h-3" />
                                          <span className="font-semibold">Đã đặt: {bookedCount}</span>
                                        </div>
                                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
                                          <XCircle className="w-3 h-3" />
                                          <span className="font-semibold">Đã hủy: {cancelledCount}</span>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                                <div className="space-y-2">
                                  {sessionCount > 0 ? (
                                    sessions.map((session, sessionIndex) => {
                                      const scheduleData = session.scheduleId ? sessionScheduleDataMap[session.scheduleId] : null;
                                      const pricePerSession = session.pricePerSession;
                                      const sessionStatus = session.sessionStatus || session.status;
                                      const sessionStatusConfig = getSessionStatusConfig(sessionStatus);
                                      const SessionStatusIcon = sessionStatusConfig.icon;

                                      const isCancelled = (sessionStatus || "").toLowerCase().includes("cancel");

                                      return (
                                        <div key={session.id || sessionIndex} className="flex flex-col gap-2 p-3 bg-white/80 backdrop-blur rounded-xl border border-teal-100">
                                          <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3 flex-wrap">
                                              <span className="inline-flex items-center gap-1 text-sm text-gray-700 bg-gray-50 border border-gray-200 font-semibold px-2 py-1 rounded-full">
                                                <Calendar className="w-3.5 h-3.5" /> {formatSessionDateLabel(session.date)}
                                              </span>
                                              <span className="inline-flex items-center gap-1 text-sm text-gray-700 bg-gray-50 border border-gray-200 font-semibold px-2 py-1 rounded-full">
                                                <Clock className="w-3.5 h-3.5" /> {formatScheduleTimeRange(scheduleData, session)}
                                              </span>
                                              {sessionStatus && (
                                                <Badge className={`${sessionStatusConfig.badge} hover:${sessionStatusConfig.badge} text-xs flex items-center gap-1`}>
                                                  <SessionStatusIcon className="w-3 h-3" />
                                                  {sessionStatusConfig.label}
                                                </Badge>
                                              )}
                                              {isCancelled && (
                                                <Badge className="bg-purple-100 text-purple-700 hover:text-purple-700 hover:bg-purple-200 border-purple-200 text-xs flex items-center gap-1">
                                                  <RotateCcw className="w-3 h-3" />
                                                  Đã hoàn tiền
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                          {pricePerSession && (
                                            <div className="flex items-center gap-2 text-xs">
                                              <span className="font-semibold text-gray-600">Giá mỗi buổi:</span>
                                              <span className="font-bold text-orange-600">{formatPrice ? formatPrice(pricePerSession) : `${pricePerSession.toLocaleString('vi-VN')} VNĐ`}</span>
                                            </div>
                                          )}

                                        </div>
                                      );
                                    })
                                  ) : (
                                    <div className="text-sm text-gray-500 italic text-center py-4">Chưa có dữ liệu buổi cho gói này.</div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </StaggerContainer>
      )
      }
    </div >
  );
}

