import React, { useState, useEffect } from "react";
import { Calendar, MapPin, Receipt, Search, Repeat, CalendarDays, MoreHorizontal, Trash2, Star } from "lucide-react";
import { Container, Card, CardContent, Input, Button, Badge } from "../../components/ui";
import { useNavigate } from "react-router-dom";
import { listBookingsByUser, updateBooking } from "../../utils/bookingStore";

export default function BookingHistory({ user }) {
     const navigate = useNavigate();
     const [query, setQuery] = useState("");
     const [bookings, setBookings] = useState([]);
     const [groupedBookings, setGroupedBookings] = useState({});
     const [showRecurringDetails, setShowRecurringDetails] = useState({});

     useEffect(() => {
          const userBookings = listBookingsByUser(user?.id || "");
          setBookings(userBookings);

          // Group recurring bookings
          const grouped = {};
          userBookings.forEach(booking => {
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
                              totalWeeks: booking.totalWeeks,
                              bookings: []
                         };
                    }
                    grouped[booking.recurringGroupId].bookings.push(booking);
               }
          });
          setGroupedBookings(grouped);
     }, [user]);

     const formatPrice = (price) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

     const statusBadge = (status) => {
          switch (status) {
               case "confirmed":
                    return <Badge variant="default">Đã xác nhận</Badge>;
               case "completed":
                    return <Badge variant="secondary">Hoàn tất</Badge>;
               case "cancelled":
                    return <Badge variant="destructive">Đã hủy</Badge>;
               default:
                    return <Badge variant="outline">Không rõ</Badge>;
          }
     };

     const handleCancel = (id) => {
          if (!window.confirm("Bạn có chắc muốn hủy đặt sân này?")) return;
          updateBooking(id, { status: "cancelled" });
          // Refresh bookings data instead of reloading page
          setBookings(prev => prev.map(booking =>
               booking.id === id ? { ...booking, status: "cancelled" } : booking
          ));
     };

     const handleReschedule = (id) => {
          const newDate = window.prompt("Nhập ngày mới (YYYY-MM-DD):");
          if (!newDate) return;
          const newTime = window.prompt("Nhập giờ mới (ví dụ 18:00-20:00):");
          if (!newTime) return;
          updateBooking(id, { date: newDate, time: newTime });
          // Refresh bookings data instead of reloading page
          setBookings(prev => prev.map(booking =>
               booking.id === id ? { ...booking, date: newDate, time: newTime } : booking
          ));
     };

     const handleRate = (id) => {
          const ratingStr = window.prompt("Đánh giá sao (1-5):");
          if (!ratingStr) return;
          const rating = Math.max(1, Math.min(5, parseInt(ratingStr, 10)));
          const comment = window.prompt("Nhận xét của bạn:") || "";
          updateBooking(id, { rating, comment });
          alert("Cảm ơn bạn đã đánh giá!");
     };

     const handleCancelRecurring = (groupId) => {
          if (!window.confirm("Bạn có chắc muốn hủy toàn bộ lịch định kỳ này?")) return;
          const group = groupedBookings[groupId];
          group.bookings.forEach(booking => {
               updateBooking(booking.id, { status: "cancelled" });
          });
          // Refresh bookings data
          setBookings(prev => prev.map(booking =>
               group.bookings.some(b => b.id === booking.id)
                    ? { ...booking, status: "cancelled" }
                    : booking
          ));
     };

     const handleCancelSingleRecurring = (id) => {
          if (!window.confirm("Bạn có chắc muốn hủy buổi đặt sân này?")) return;
          updateBooking(id, { status: "cancelled" });
          // Refresh bookings data
          setBookings(prev => prev.map(booking =>
               booking.id === id ? { ...booking, status: "cancelled" } : booking
          ));
     };

     const toggleRecurringDetails = (groupId) => {
          setShowRecurringDetails(prev => ({
               ...prev,
               [groupId]: !prev[groupId]
          }));
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

     return (
          <Container className="p-6 max-w-6xl">
               <Card className="overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-500 to-orange-500 px-6 py-8 text-white">
                         <h1 className="text-2xl font-bold">Lịch sử đặt sân</h1>
                         <p className="text-teal-100">Xem và quản lý các đặt sân trước đây</p>
                    </div>
                    <CardContent>
                         <div className="flex items-center mb-4">
                              <div className="relative w-full md:w-80">
                                   <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                   <Input value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" placeholder="Tìm theo mã, tên sân..." />
                              </div>
                         </div>

                         <div className="space-y-4">
                              {/* Recurring Bookings */}
                              {Object.values(groupedBookings).map((group) => {
                                   const status = getRecurringStatus(group);
                                   const sortedBookings = (group.bookings || []).slice().sort((a, b) => new Date(a.date) - new Date(b.date));
                                   const firstBooking = sortedBookings.length > 0 ? sortedBookings[0] : null;
                                   const lastBooking = sortedBookings.length > 0 ? sortedBookings[sortedBookings.length - 1] : null;

                                   return (
                                        <div key={group.groupId} className="p-4 rounded-lg border border-teal-200 bg-teal-50 hover:shadow-sm transition-shadow">
                                             <div className="flex justify-between items-start mb-3">
                                                  <div className="flex items-center gap-2">
                                                       <Repeat className="w-5 h-5 text-teal-600" />
                                                       <h3 className="font-semibold text-gray-900">{group.fieldName}</h3>
                                                       <Badge variant="outline" className="text-teal-600 border-teal-300">
                                                            Lịch định kỳ
                                                       </Badge>
                                                       {status === "active" && <Badge variant="default">Đang hoạt động</Badge>}
                                                       {status === "partial" && <Badge variant="secondary">Một phần</Badge>}
                                                       {status === "completed" && <Badge variant="secondary">Hoàn tất</Badge>}
                                                       {status === "cancelled" && <Badge variant="destructive">Đã hủy</Badge>}
                                                  </div>
                                                  <Button
                                                       variant="ghost"
                                                       onClick={() => toggleRecurringDetails(group.groupId)}
                                                       className="p-2 h-auto"
                                                  >
                                                       <MoreHorizontal className="w-4 h-4" />
                                                  </Button>
                                             </div>

                                             <div className="text-sm text-gray-600 mb-3">
                                                  <div className="flex items-center mb-1">
                                                       <MapPin className="w-4 h-4 mr-1" /> {group.address}
                                                  </div>
                                                  <div className="flex items-center mb-1">
                                                       <Calendar className="w-4 h-4 mr-1" />
                                                       {firstBooking && lastBooking ? `${firstBooking.date} - ${lastBooking.date}` : "Chưa có ngày"} • {group.time}
                                                  </div>
                                                  <div className="flex items-center">
                                                       <CalendarDays className="w-4 h-4 mr-1" />
                                                       {group.totalWeeks} tuần • {sortedBookings.length} buổi
                                                  </div>
                                             </div>

                                             <div className="flex justify-between items-center">
                                                  <div className="text-lg font-bold text-teal-600">
                                                       {formatPrice(group.price * group.totalWeeks)}
                                                  </div>
                                                  <div className="flex gap-2">
                                                       <Button variant="secondary" onClick={() => navigate("/invoice")} className="px-3 py-2 text-sm">
                                                            <Receipt className="w-4 h-4 mr-2" /> Xem hóa đơn
                                                       </Button>
                                                       {status !== "cancelled" && (
                                                            <Button variant="destructive" onClick={() => handleCancelRecurring(group.groupId)} className="px-3 py-2 text-sm">
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
                                                                 <div key={booking.id} className="flex justify-between items-center p-2 bg-white rounded border">
                                                                      <div className="flex items-center gap-2">
                                                                           <span className="text-sm font-medium">Tuần {booking.weekNumber}</span>
                                                                           <span className="text-sm text-gray-600">{booking.date}</span>
                                                                           {statusBadge(booking.status)}
                                                                      </div>
                                                                      <div className="flex gap-1">
                                                                           {booking.status !== "cancelled" && (
                                                                                <Button variant="outline" onClick={() => handleCancelSingleRecurring(booking.id)} className="px-2 py-1 text-xs">
                                                                                     Hủy
                                                                                </Button>
                                                                           )}
                                                                           <Button onClick={() => handleRate(booking.id)} className="px-2 py-1 text-xs">
                                                                                <Star className="w-3 h-3 mr-1" /> Đánh giá
                                                                           </Button>
                                                                      </div>
                                                                 </div>
                                                            ))}
                                                       </div>
                                                  </div>
                                             )}
                                        </div>
                                   );
                              })}

                              {/* Single Bookings */}
                              {bookings.filter(b =>
                                   !b.isRecurring &&
                                   (b.id.toLowerCase().includes(query.toLowerCase()) ||
                                        (b.fieldName || "").toLowerCase().includes(query.toLowerCase()))
                              ).map((b) => (
                                   <div key={b.id} className="p-4 rounded-lg border hover:shadow-sm transition-shadow">
                                        <div className="flex justify-between items-start">
                                             <div>
                                                  <div className="flex items-center gap-2 mb-1">
                                                       <h3 className="font-semibold text-gray-900">{b.fieldName}</h3>
                                                       {statusBadge(b.status)}
                                                  </div>
                                                  <div className="text-sm text-gray-600 flex items-center">
                                                       <MapPin className="w-4 h-4 mr-1" /> {b.address}
                                                  </div>
                                                  <div className="text-sm text-gray-600 flex items-center mt-1">
                                                       <Calendar className="w-4 h-4 mr-1" /> {b.date} • {b.time}
                                                  </div>
                                             </div>
                                             <div className="text-right">
                                                  <div className="text-gray-900 font-semibold">{formatPrice(b.price)}</div>
                                                  <div className="text-xs text-gray-500">Mã: {b.id}</div>
                                             </div>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                             <Button variant="secondary" onClick={() => navigate("/invoice")} className="px-3 py-2 text-sm">
                                                  <Receipt className="w-4 h-4 mr-2" /> Xem hóa đơn
                                             </Button>
                                             {user && (
                                                  <>
                                                       <Button variant="outline" onClick={() => handleReschedule(b.id)} className="px-3 py-2 text-sm">
                                                            Đổi giờ
                                                       </Button>
                                                       {b.status !== "cancelled" && (
                                                            <Button variant="destructive" onClick={() => handleCancel(b.id)} className="px-3 py-2 text-sm">
                                                                 Hủy đặt
                                                            </Button>
                                                       )}
                                                       <Button onClick={() => handleRate(b.id)} className="px-3 py-2 text-sm">
                                                            Đánh giá
                                                       </Button>
                                                  </>
                                             )}
                                        </div>
                                   </div>
                              ))}
                         </div>
                    </CardContent>
               </Card>
          </Container>
     );
}


