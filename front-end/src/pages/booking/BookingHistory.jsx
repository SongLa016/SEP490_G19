import React, { useState, useEffect, useMemo } from "react";
import { Calendar, MapPin, Receipt, Search, Repeat, CalendarDays, MoreHorizontal, Trash2, Star, Filter, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { Section, Container, Card, CardContent, Input, Button, Badge, Select, SelectTrigger, SelectContent, SelectItem, SelectValue, DatePicker } from "../../components/ui";
import { useNavigate } from "react-router-dom";
import { listBookingsByUser, updateBooking } from "../../utils/bookingStore";
import Swal from 'sweetalert2';

export default function BookingHistory({ user }) {
     const navigate = useNavigate();
     const [query, setQuery] = useState("");
     const [bookings, setBookings] = useState([]);
     const [groupedBookings, setGroupedBookings] = useState({});
     const [showRecurringDetails, setShowRecurringDetails] = useState({});
     const [statusFilter, setStatusFilter] = useState("all");
     const [dateFrom, setDateFrom] = useState("");
     const [dateTo, setDateTo] = useState("");
     const [sortBy, setSortBy] = useState("newest");

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

     const handleReschedule = (id) => {
          Swal.fire({
               title: 'Đổi lịch đặt sân',
               html: `
                    <div style="text-align: left;">
                         <label style="display: block; margin-bottom: 5px; font-weight: bold;">Ngày mới:</label>
                         <input id="newDate" type="date" style="width: 100%; padding: 8px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px;">
                         <label style="display: block; margin-bottom: 5px; font-weight: bold;">Giờ mới:</label>
                         <input id="newTime" type="text" placeholder="Ví dụ: 18:00-20:00" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
               `,
               showCancelButton: true,
               confirmButtonText: 'Xác nhận',
               cancelButtonText: 'Hủy',
               preConfirm: () => {
                    const newDate = document.getElementById('newDate').value;
                    const newTime = document.getElementById('newTime').value;
                    if (!newDate || !newTime) {
                         Swal.showValidationMessage('Vui lòng nhập đầy đủ thông tin');
                         return false;
                    }
                    return { newDate, newTime };
               }
          }).then((result) => {
               if (result.isConfirmed) {
                    const { newDate, newTime } = result.value;
                    updateBooking(id, { date: newDate, time: newTime });
                    setBookings(prev => prev.map(booking =>
                         booking.id === id ? { ...booking, date: newDate, time: newTime } : booking
                    ));
                    Swal.fire('Thành công!', 'Lịch đặt sân đã được cập nhật.', 'success');
               }
          });
     };

     const handleRate = (id) => {
          Swal.fire({
               title: 'Đánh giá sân',
               html: `
                    <div style="text-align: left;">
                         <label style="display: block; margin-bottom: 10px; font-weight: bold;">Đánh giá sao (1-5):</label>
                         <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                              ${[1, 2, 3, 4, 5].map(star => `
                                   <button type="button" onclick="document.getElementById('rating').value = ${star}; updateStars(${star})" 
                                           style="width: 40px; height: 40px; border: 2px solid #ddd; border-radius: 50%; background: white; cursor: pointer;" 
                                           id="star-${star}">
                                        ⭐
                                   </button>
                              `).join('')}
                         </div>
                         <input type="hidden" id="rating" value="0">
                         <label style="display: block; margin-bottom: 5px; font-weight: bold;">Nhận xét:</label>
                         <textarea id="comment" placeholder="Chia sẻ trải nghiệm của bạn..." 
                                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; height: 80px; resize: vertical;"></textarea>
                    </div>
                    <script>
                         function updateStars(rating) {
                              for (let i = 1; i <= 5; i++) {
                                   const star = document.getElementById('star-' + i);
                                   if (i <= rating) {
                                        star.style.background = '#ffd700';
                                        star.style.borderColor = '#ffd700';
                                   } else {
                                        star.style.background = 'white';
                                        star.style.borderColor = '#ddd';
                                   }
                              }
                         }
                    </script>
               `,
               showCancelButton: true,
               confirmButtonText: 'Gửi đánh giá',
               cancelButtonText: 'Hủy',
               preConfirm: () => {
                    const rating = parseInt(document.getElementById('rating').value);
                    const comment = document.getElementById('comment').value;
                    if (rating === 0) {
                         Swal.showValidationMessage('Vui lòng chọn số sao đánh giá');
                         return false;
                    }
                    return { rating, comment };
               }
          }).then((result) => {
               if (result.isConfirmed) {
                    const { rating, comment } = result.value;
                    updateBooking(id, { rating, comment });
                    Swal.fire('Cảm ơn bạn!', 'Đánh giá của bạn đã được gửi thành công.', 'success');
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
                         <div className="pt-4">
                              <div className="flex items-center justify-between">
                                   <div>
                                        <h2 className="text-2xl font-bold text-teal-800">Lịch sử đặt sân</h2>
                                        <div className="mt-1 h-1.5 w-24 bg-gradient-to-r from-teal-500 via-emerald-400 to-transparent rounded-full" />
                                        <p className="text-teal-700 font-semibold mt-2">Tổng cộng {stats.total} lượt • Sắp tới {stats.upcoming}</p>
                                   </div>
                                   <div className="hidden md:flex items-center gap-2">
                                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 shadow-sm">
                                             Hoàn tất {stats.completed} • Hủy {stats.cancelled}
                                        </span>
                                   </div>
                              </div>
                         </div>
                         <div className="flex flex-col lg:flex-row gap-2 md:gap-4 pt-4 mb-2">
                              <div className="flex-1">
                                   <div className="relative">
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
                              </div>

                              <div className="lg:w-48">
                                   <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="border rounded-xl border-teal-300 focus-visible:border-teal-500 focus-visible:ring-0 bg-white/80">
                                             <SelectValue placeholder="Trạng thái" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                             <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                                             <SelectItem value="completed">Hoàn tất</SelectItem>
                                             <SelectItem value="cancelled">Đã hủy</SelectItem>
                                        </SelectContent>
                                   </Select>
                              </div>
                              <div className="lg:w-48">
                                   <DatePicker value={dateFrom} onChange={setDateFrom} className="border rounded-xl border-teal-300 focus-visible:border-teal-500 focus-visible:ring-0" />
                              </div>
                              <div className="lg:w-48">
                                   <DatePicker value={dateTo} onChange={setDateTo} className="border rounded-xl border-teal-300 focus-visible:border-teal-500 focus-visible:ring-0" />
                              </div>
                              <div className="lg:w-56">
                                   <Select value={sortBy} onValueChange={setSortBy}>
                                        <SelectTrigger className="border rounded-xl border-teal-300 focus-visible:border-teal-500 focus-visible:ring-0">
                                             <div className="flex items-center gap-2 text-gray-600 w-full">
                                                  <ArrowUpDown className="w-4 h-4" />
                                                  <SelectValue placeholder="Sắp xếp" />
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
                              <Button
                                   onClick={() => { setQuery(""); setStatusFilter("all"); setDateFrom(""); setDateTo(""); setSortBy("newest"); }}
                                   variant="outline"
                                   className="px-4 py-3 rounded-xl border border-red-200 text-red-700 hover:text-red-700 hover:bg-red-50"
                              >
                                   <Filter className="w-4 h-4 mr-2" /> Đặt lại
                              </Button>
                         </div>
                    </CardContent></Card>

                    <div className="space-y-4">
                         {/* Recurring Bookings */}
                         {visibleGroups.map((group) => {
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
                                                            <div key={booking.id} className="flex justify-between items-center p-3 bg-white/80 backdrop-blur rounded-xl border border-teal-100">
                                                                 <div className="flex items-center gap-3 flex-wrap">
                                                                      <span className="px-2 py-0.5 rounded-full text-xs bg-teal-50 text-teal-700 border border-teal-200">Tuần {booking.weekNumber}</span>
                                                                      <span className="inline-flex items-center gap-1 text-sm text-gray-700 bg-gray-50 border border-gray-200 px-2 py-1 rounded-full"><Calendar className="w-3.5 h-3.5" /> {booking.date}</span>
                                                                      {statusBadge(booking.status)}
                                                                 </div>
                                                                 <div className="flex gap-2">
                                                                      {booking.status !== "cancelled" && (
                                                                           <Button variant="outline" onClick={() => handleCancelSingleRecurring(booking.id)} className="px-2 py-1 text-xs rounded-full">
                                                                                Hủy
                                                                           </Button>
                                                                      )}
                                                                      <Button onClick={() => handleRate(booking.id)} className="px-2 py-1 text-xs rounded-full">
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
                         {visibleSingles.map((b) => (
                              <div key={b.id} className="p-5 rounded-2xl border border-teal-100 bg-white/80 backdrop-blur hover:shadow-lg transition-shadow">
                                   <div className="flex justify-between items-start gap-4">
                                        <div className="min-w-0">
                                             <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                  <h3 className="text-lg font-semibold text-teal-900 truncate max-w-[60vw]">{b.fieldName}</h3>
                                                  {statusBadge(b.status)}
                                                  <span className="px-2 py-0.5 rounded-full text-xs bg-teal-50 text-teal-700 border border-teal-200">{b.id}</span>
                                             </div>
                                             <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                                                  <span className="inline-flex items-center gap-1 bg-teal-50 border border-teal-100 text-teal-700 px-2 py-1 rounded-full"><MapPin className="w-4 h-4" /> {b.address}</span>
                                                  <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-700 px-2 py-1 rounded-full"><Calendar className="w-4 h-4" /> {b.date} • {b.time}</span>
                                             </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                             <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-500">{formatPrice(b.price)}</div>
                                             {b.paymentMethod && (
                                                  <div className="text-xs text-gray-500 mt-1">{b.paymentMethod}</div>
                                             )}
                                        </div>
                                   </div>
                                   <div className="mt-4 pt-3 border-t border-teal-100 flex flex-wrap gap-2">
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
          </Section>
     );
}


