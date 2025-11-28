import React from "react";
import { MapPin, Calendar, Clock, CreditCard, Receipt, Trash2, Star, UserSearchIcon } from "lucide-react";
import { Badge, Button } from "../../../../../shared/components/ui";
import BookingActions from "./BookingActions";
import BookingMatchRequest from "./BookingMatchRequest";
import BookingParticipants from "./BookingParticipants";

const formatPrice = (price) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

const stripRefundQrInfo = (text) => {
     if (!text) return "";
     const markerIndex = text.toLowerCase().indexOf("refundqr");
     if (markerIndex === -1) return text;
     const stripped = text.substring(0, markerIndex);
     return stripped.replace(/\|\s*$/, "").trim();
};

const statusBadge = (status) => {
     const s = (status ?? "").toString().toLowerCase();
     switch (s) {
          case "confirmed": return <Badge className="bg-green-500 text-white">Đã xác nhận</Badge>;
          case "pending": return <Badge className="bg-yellow-500 text-white">Chờ xác nhận</Badge>;
          case "completed": return <Badge className="bg-blue-500 text-white">Hoàn tất</Badge>;
          case "cancelled": return <Badge className="bg-red-500 text-white">Đã hủy</Badge>;
          case "expired": return <Badge className="bg-gray-500 text-white">Hết hạn</Badge>;
          default: return <Badge variant="outline">{status}</Badge>;
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

export default function BookingCard({ booking, user, handlers, matchRequestData }) {
     const { b } = { b: booking };

     return (
          <div className="bg-white border border-teal-100 rounded-2xl p-4 hover:shadow-lg transition-all duration-300">
               <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                         <div className="flex items-center gap-2 mb-2">
                              {statusBadge(b.status)}
                              {paymentStatusBadge(b.paymentStatus)}
                         </div>
                         <h3 className="text-lg font-bold text-teal-800 mb-1">{b.fieldName}</h3>
                         <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                   <MapPin className="w-4 h-4 text-teal-600" />
                                   <span>{b.address || "Chưa có địa chỉ"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                   <Calendar className="w-4 h-4 text-teal-600" />
                                   <span>{b.date}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                   <Clock className="w-4 h-4 text-teal-600" />
                                   <span>{b.time || "Chưa có thời gian"}</span>
                              </div>
                         </div>
                    </div>
                    <div className="text-right">
                         <div className="text-xl font-bold text-teal-600">{formatPrice(b.totalPrice || b.price)}</div>
                         {b.depositAmount > 0 && b.totalPrice > b.depositAmount && (
                              <div className="text-sm text-gray-500">
                                   (Còn lại: {formatPrice(b.totalPrice - b.depositAmount)})
                              </div>
                         )}
                    </div>
               </div>

               {stripRefundQrInfo(b.cancelReason) && (
                    <div className="text-xs text-red-600 italic mb-2">
                         Lý do hủy: {stripRefundQrInfo(b.cancelReason)}
                    </div>
               )}

               <BookingActions
                    booking={b}
                    user={user}
                    handlers={handlers}
               />

               <BookingMatchRequest
                    booking={b}
                    user={user}
                    matchRequestData={matchRequestData}
                    handlers={handlers}
               />

               <BookingParticipants
                    booking={b}
                    user={user}
                    matchRequestData={matchRequestData}
                    handlers={handlers}
               />
          </div>
     );
}
