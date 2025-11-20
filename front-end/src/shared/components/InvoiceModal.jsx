import React from "react";
import {
     MapPin,
     Calendar,
     Clock,
     Receipt,
     CreditCard,
     QrCode,
     AlertTriangle,
     CheckCircle,
     Printer,
     ShieldCheck
} from "lucide-react";
import { Modal, Button, Badge } from "./ui";

const formatPrice = (price = 0) =>
     new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

const formatDateTime = (value) => {
     if (!value) return "—";
     const parsed = new Date(value);
     if (Number.isNaN(parsed.getTime())) return value;
     return parsed.toLocaleString("vi-VN");
};

const statusDisplay = (status) => {
     const normalized = (status ?? "").toString().toLowerCase();
     switch (normalized) {
          case "confirmed":
               return { label: "Đã xác nhận", className: "bg-teal-50 text-teal-700 border-teal-200" };
          case "completed":
               return { label: "Hoàn tất", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
          case "cancelled":
               return { label: "Đã hủy", className: "bg-red-50 text-red-700 border-red-200" };
          case "pending":
               return { label: "Chờ xác nhận", className: "bg-yellow-50 text-yellow-700 border-yellow-200" };
          case "expired":
               return { label: "Hết hạn", className: "bg-gray-100 text-gray-700 border-gray-200" };
          default:
               return { label: status || "Không rõ", className: "bg-gray-100 text-gray-700 border-gray-200" };
     }
};

const paymentStatusDisplay = (status) => {
     const normalized = (status ?? "").toString().toLowerCase();
     switch (normalized) {
          case "paid":
               return { label: "Đã thanh toán", className: "bg-green-50 text-green-700 border-green-200" };
          case "refunded":
               return { label: "Đã hoàn tiền", className: "bg-blue-50 text-blue-700 border-blue-200" };
          default:
               return { label: "Chưa thanh toán", className: "bg-yellow-50 text-yellow-700 border-yellow-200" };
     }
};

export default function InvoiceModal({ isOpen, booking, onClose }) {
     if (!isOpen || !booking) return null;

     const paymentStatus = paymentStatusDisplay(booking.paymentStatus);
     const bookingStatus = statusDisplay(booking.status || booking.bookingStatus);
     const totalPrice = booking.totalPrice ?? booking.price ?? 0;
     const depositAmount = booking.depositAmount ?? 0;
     const remainingAmount = Math.max(0, totalPrice - depositAmount);
     const isPaid = (booking.paymentStatus ?? "").toString().toLowerCase() === "paid";

     const timelineItems = [
          booking.createdAt && { label: "Tạo lúc", value: booking.createdAt },
          booking.confirmedAt && { label: "Xác nhận lúc", value: booking.confirmedAt },
          booking.cancelledAt && { label: "Hủy lúc", value: booking.cancelledAt, highlight: true }
     ].filter(Boolean);

     return (
          <Modal
               isOpen={isOpen}
               onClose={onClose}
               title={`Hóa đơn đặt sân #${booking.bookingId || booking.id}`}
               className="max-w-3xl rounded-2xl"
          >
               <div className="p-1 space-y-4">
                    <div className={`p-4 rounded-2xl border ${isPaid ? "bg-emerald-50 border-emerald-200" : "bg-yellow-50 border-yellow-200"} flex items-start gap-3`}>
                         <div className={`p-2 rounded-full ${isPaid ? "bg-emerald-100" : "bg-yellow-100"}`}>
                              {isPaid ? (
                                   <CheckCircle className="w-5 h-5 text-emerald-600" />
                              ) : (
                                   <AlertTriangle className="w-5 h-5 text-yellow-600" />
                              )}
                         </div>
                         <div className="text-sm">
                              <p className="font-semibold">
                                   {isPaid ? "Thanh toán thành công" : "Chưa hoàn tất thanh toán"}
                              </p>
                              <p className="text-gray-600">
                                   {isPaid
                                        ? "Hóa đơn đã được thanh toán đầy đủ. Bạn có thể in hoặc lưu lại thông tin."
                                        : "Vui lòng hoàn tất thanh toán để giữ chỗ. Hóa đơn chỉ được xác nhận sau khi thanh toán thành công."}
                              </p>
                         </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                         <Badge className={`text-xs font-semibold ${bookingStatus.className}`}>{bookingStatus.label}</Badge>
                         <Badge className={`text-xs font-semibold ${paymentStatus.className}`}>{paymentStatus.label}</Badge>
                         {booking.hasOpponent && (
                              <Badge className="text-xs font-semibold bg-green-50 text-green-700 border border-green-200 flex items-center gap-1">
                                   <ShieldCheck className="w-3 h-3" /> Đã có đối
                              </Badge>
                         )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="p-4 rounded-2xl border border-gray-100 bg-white/80 space-y-2">
                              <div className="flex items-center gap-2 text-gray-900 font-semibold">
                                   <Receipt className="w-4 h-4 text-teal-600" />
                                   Thông tin đặt sân
                              </div>
                              <div className="text-sm space-y-2 text-gray-700">
                                   <div>
                                        <div className="font-semibold text-teal-800">{booking.fieldName}</div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                             <MapPin className="w-4 h-4 text-teal-500" />
                                             <span>{booking.address || "Chưa rõ địa chỉ"}</span>
                                        </div>
                                   </div>
                                   <div className="flex flex-wrap gap-3">
                                        <div className="flex items-center gap-1 bg-teal-50 px-2 py-1 rounded-full border border-teal-100 text-teal-700 text-xs">
                                             <Calendar className="w-3.5 h-3.5" />
                                             {booking.date}
                                        </div>
                                        <div className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-full border border-purple-100 text-purple-700 text-xs">
                                             <Clock className="w-3.5 h-3.5" />
                                             {booking.slotName || booking.time}
                                        </div>
                                   </div>
                                   {booking.qrCode && (
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                             <QrCode className="w-4 h-4 text-purple-600" />
                                             Mã QR: <span className="font-medium">{booking.qrCode}</span>
                                        </div>
                                   )}
                              </div>
                         </div>
                         <div className="p-4 rounded-2xl border border-gray-100 bg-white/80 space-y-3">
                              <div className="flex items-center gap-2 text-gray-900 font-semibold">
                                   <CreditCard className="w-4 h-4 text-teal-600" />
                                   Thông tin thanh toán
                              </div>
                              <div className="text-sm text-gray-700 space-y-1">
                                   <div>Phương thức: <span className="font-semibold">{booking.paymentMethod || "Chưa chọn"}</span></div>
                                   <div>Số tiền cọc: <span className="font-semibold text-blue-600">{formatPrice(depositAmount)}</span></div>
                                   <div>Tổng tiền: <span className="font-semibold text-teal-600">{formatPrice(totalPrice)}</span></div>
                                   {remainingAmount > 0 && (
                                        <div>Còn lại: <span className="font-semibold text-orange-600">{formatPrice(remainingAmount)}</span></div>
                                   )}
                                   {booking.matchRequestId && (
                                        <div>Mã yêu cầu đối: <span className="font-medium">{booking.matchRequestId}</span></div>
                                   )}
                              </div>
                              <div className="flex items-center justify-end gap-2">
                                   <Button
                                        variant="outline"
                                        onClick={() => window.print()}
                                        className="rounded-full px-3 py-1 text-xs flex items-center gap-2"
                                   >
                                        <Printer className="w-4 h-4" />
                                        In / Lưu lại
                                   </Button>
                              </div>
                         </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/80">
                         <div className="text-sm font-semibold text-gray-800 mb-2">Dòng thời gian</div>
                         {timelineItems.length > 0 ? (
                              <div className="space-y-1 text-sm">
                                   {timelineItems.map((item) => (
                                        <div
                                             key={item.label}
                                             className={`flex justify-between text-gray-700 ${item.highlight ? "text-red-600 font-semibold" : ""}`}
                                        >
                                             <span>{item.label}</span>
                                             <span>{formatDateTime(item.value)}</span>
                                        </div>
                                   ))}
                              </div>
                         ) : (
                              <div className="text-sm text-gray-500">Chưa có thông tin thời gian.</div>
                         )}
                    </div>
               </div>
          </Modal>
     );
}


