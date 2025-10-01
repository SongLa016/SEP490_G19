import React, { useMemo, useState } from "react";
import { Calendar, MapPin, Receipt, Search } from "lucide-react";
import { Section, Container, Card, CardContent, Input, Button, Badge } from "../../components/ui";
import { useNavigate } from "react-router-dom";
import { listBookingsByUser, updateBooking } from "../../utils/bookingStore";

export default function BookingHistory({ user }) {
     const navigate = useNavigate();
     const [query, setQuery] = useState("");
     const bookings = useMemo(() => listBookingsByUser(user?.id || ""), [user]);

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
          window.location.reload();
     };

     const handleReschedule = (id) => {
          const newDate = window.prompt("Nhập ngày mới (YYYY-MM-DD):");
          if (!newDate) return;
          const newTime = window.prompt("Nhập giờ mới (ví dụ 18:00-20:00):");
          if (!newTime) return;
          updateBooking(id, { date: newDate, time: newTime });
          window.location.reload();
     };

     const handleRate = (id) => {
          const ratingStr = window.prompt("Đánh giá sao (1-5):");
          if (!ratingStr) return;
          const rating = Math.max(1, Math.min(5, parseInt(ratingStr, 10)));
          const comment = window.prompt("Nhận xét của bạn:") || "";
          updateBooking(id, { rating, comment });
          alert("Cảm ơn bạn đã đánh giá!");
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
                              {bookings.filter(b =>
                                   b.id.toLowerCase().includes(query.toLowerCase()) ||
                                   (b.fieldName || "").toLowerCase().includes(query.toLowerCase())
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


