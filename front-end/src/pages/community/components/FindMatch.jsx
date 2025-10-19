import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
     MapPin,
     Users,
     Clock,
     Target,
     UserCheck,
     AlertCircle,
     CheckCircle2,
     UserPlus,
     Calendar
} from "lucide-react";

import {
     Card,
     CardContent,
     Button,
     Input,
     Badge,
     DatePicker,
     Select,
     SelectContent,
     SelectItem,
     SelectTrigger,
     SelectValue,
} from "../../../components/ui/index.js";
import { useAuth } from "../../../contexts/AuthContext";
import { listMatchRequests, joinMatchRequest } from "../../../utils/communityStore";
import { getBookingById } from "../../../utils/bookingStore";
import Swal from "sweetalert2";

export default function FindMatch() {
     const locationRouter = useLocation();
     const { user } = useAuth();
     const [filterLocation, setFilterLocation] = useState("");
     const [filterDate, setFilterDate] = useState("");
     const [filterLevel, setFilterLevel] = useState("all");
     const [matchRequests, setMatchRequests] = useState([]);
     const [matchPage, setMatchPage] = useState(1);
     const [highlightPostId, setHighlightPostId] = useState(null);

     const highlightRef = useRef(null);
     const matchEndRef = useRef(null);
     const pageSize = 10;
     const visibleMatchRequests = matchRequests.slice(0, matchPage * pageSize);

     // Helper function to get booking info
     const getBookingInfo = (bookingId) => {
          return getBookingById(bookingId);
     };

     // Accept navigation state to focus a specific post
     useEffect(() => {
          const st = locationRouter?.state || {};
          if (st.highlightPostId) setHighlightPostId(st.highlightPostId);
     }, [locationRouter?.state]);

     // Auto scroll to highlighted post
     useEffect(() => {
          if (!highlightPostId) return;
          if (highlightRef.current) {
               highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
               const timer = setTimeout(() => setHighlightPostId(null), 6000);
               return () => clearTimeout(timer);
          }
     }, [highlightPostId]);

     // Load match requests
     useEffect(() => {
          setMatchRequests(listMatchRequests({
               status: "Open",
               level: filterLevel,
               location: filterLocation,
               date: filterDate
          }));
     }, [filterLocation, filterDate, filterLevel]);

     // Observe end for match infinite scroll
     useEffect(() => {
          const el = matchEndRef.current;
          if (!el) return;
          const io = new IntersectionObserver((entries) => {
               entries.forEach((e) => {
                    if (e.isIntersecting) {
                         setMatchPage((p) => (visibleMatchRequests.length >= matchRequests.length ? p : p + 1));
                    }
               });
          }, { root: null, threshold: 0.1 });
          io.observe(el);
          return () => io.disconnect();
     }, [matchRequests.length, visibleMatchRequests.length]);

     return (
          <div className="border border-b-0 overflow-y-auto scrollbar-hide rounded-t-3xl bg-white border-gray-400 flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
               {/* Filter for Tìm đối thủ */}
               <div className="grid sticky top-0 z-10 grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-gray-50 border-b border-gray-200">
                    <div className="md:col-span-1">
                         <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <Input
                                   placeholder="Địa điểm (ví dụ: Quận 7)"
                                   value={filterLocation}
                                   onChange={(e) => setFilterLocation(e.target.value)}
                                   className="rounded-2xl pl-10"
                              />
                         </div>
                    </div>
                    <div className="md:col-span-1">
                         <div className="relative">
                              <DatePicker value={filterDate} onChange={setFilterDate} />
                         </div>
                    </div>
                    <div className="md:col-span-1">
                         <div className="relative">
                              <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <Select value={filterLevel} onValueChange={setFilterLevel}>
                                   <SelectTrigger className="rounded-2xl pl-10">
                                        <SelectValue placeholder="Mức độ" />
                                   </SelectTrigger>
                                   <SelectContent>
                                        <SelectItem value="all">Tất cả mức độ</SelectItem>
                                        <SelectItem value="Beginner">Beginner</SelectItem>
                                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                                        <SelectItem value="Advanced">Advanced</SelectItem>
                                        <SelectItem value="any">Any</SelectItem>
                                   </SelectContent>
                              </Select>
                         </div>
                    </div>
                    <div className="md:col-span-1 flex items-center justify-end text-sm text-gray-600">
                         <span className="inline-flex items-center gap-2 bg-teal-50 border border-teal-100 px-3 py-2 rounded-xl">
                              <Users className="w-4 h-4 text-teal-500" />
                              {matchRequests.length} yêu cầu
                         </span>
                    </div>
               </div>

               {/* Match Requests Feed */}
               <div className="divide-y divide-gray-200">
                    {visibleMatchRequests.map((mr) => {
                         const bookingInfo = getBookingInfo(mr.bookingId);
                         return (
                              <Card
                                   key={mr.requestId}
                                   ref={highlightPostId === mr.requestId ? highlightRef : null}
                                   className={`border m-2 rounded-3xl transition-all duration-200 ${highlightPostId === mr.requestId
                                        ? "border-emerald-500 ring-2 ring-emerald-200"
                                        : "border-teal-100 hover:shadow-lg"
                                        }`}
                              >
                                   <CardContent className="p-3">
                                        <div className="flex items-start justify-between">
                                             <div className="flex-1">
                                                  <div className="flex items-center gap-3 mb-2">
                                                       <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 border border-teal-200">
                                                            <Target className="w-4 h-4" />
                                                       </div>
                                                       <div className="flex-1">
                                                            <div className="font-semibold text-teal-800">Tìm đối thủ cho booking #{mr.bookingId}</div>
                                                            {mr.createdByName && (
                                                                 <div className="text-sm font-semibold text-gray-600 mt-1">
                                                                      <span className="font-medium">Người gửi:</span> {mr.createdByName}
                                                                 </div>
                                                            )}
                                                       </div>
                                                  </div>
                                                  {/* Thông tin sân và ngày từ booking */}
                                                  {bookingInfo && (
                                                       <div className="group h-7 hover:h-auto transition-all duration-300 ">
                                                            {/* Thông tin cơ bản - luôn hiển thị */}
                                                            <div className="text-xs mx-auto text-center text-gray-400 italic group-hover:hidden">
                                                                 Chạm vào để xem thêm chi tiết
                                                            </div>

                                                            {/* Thông tin chi tiết - chỉ hiển thị khi hover */}
                                                            <div className="opacity-0  group-hover:opacity-100 transition-transform duration-300 translate-y-2 group-hover:translate-y-0 text-sm text-gray-600 mb-2 space-y-1">
                                                                 <div className="text-sm text-gray-600 mb-2 space-y-1 ">
                                                                      {bookingInfo.fieldName && (
                                                                           <div className="flex items-center gap-2">
                                                                                <MapPin className="w-4 h-4 text-gray-500" />
                                                                                <span className="font-medium">Sân:</span>
                                                                                <span>{bookingInfo.fieldName}</span>
                                                                           </div>
                                                                      )}
                                                                      {bookingInfo.date && (
                                                                           <div className="flex items-center gap-2">
                                                                                <Calendar className="w-4 h-4 text-gray-500" />
                                                                                <span className="font-medium">Ngày:</span>
                                                                                <span>{new Date(bookingInfo.date).toLocaleDateString('vi-VN')}</span>
                                                                           </div>
                                                                      )}
                                                                      {bookingInfo.slotName && (
                                                                           <div className="flex items-center gap-2">
                                                                                <Clock className="w-4 h-4 text-gray-500" />
                                                                                <span className="font-medium">Giờ:</span>
                                                                                <span>{bookingInfo.slotName}</span>
                                                                           </div>
                                                                      )}

                                                                 </div>
                                                                 {bookingInfo.fieldAddress && (
                                                                      <div className="flex items-center gap-2">
                                                                           <MapPin className="w-4 h-4 text-gray-500" />
                                                                           <span className="font-medium">Địa chỉ:</span>
                                                                           <span>{bookingInfo.fieldAddress}</span>
                                                                      </div>
                                                                 )}
                                                                 {bookingInfo.price && (
                                                                      <div className="flex items-center gap-2">
                                                                           <span className="font-medium">Giá:</span>
                                                                           <span className="text-green-600 font-semibold">
                                                                                {bookingInfo.price.toLocaleString('vi-VN')} VNĐ
                                                                           </span>
                                                                      </div>
                                                                 )}
                                                                 {bookingInfo.customerName && (
                                                                      <div className="flex items-center gap-2">
                                                                           <span className="font-medium">Khách hàng:</span>
                                                                           <span>{bookingInfo.customerName}</span>
                                                                      </div>
                                                                 )}
                                                                 {bookingInfo.customerPhone && (
                                                                      <div className="flex items-center gap-2">
                                                                           <span className="font-medium">SĐT:</span>
                                                                           <span>{bookingInfo.customerPhone}</span>
                                                                      </div>
                                                                 )}
                                                                 {bookingInfo.totalPrice && (
                                                                      <div className="flex items-center gap-2">
                                                                           <span className="font-medium">Tổng tiền:</span>
                                                                           <span className="text-blue-600 font-semibold">
                                                                                {bookingInfo.totalPrice.toLocaleString('vi-VN')} VNĐ
                                                                           </span>
                                                                      </div>
                                                                 )}
                                                                 {bookingInfo.duration && (
                                                                      <div className="flex items-center gap-2">
                                                                           <span className="font-medium">Số buổi:</span>
                                                                           <span>{bookingInfo.duration} buổi</span>
                                                                      </div>
                                                                 )}
                                                            </div>
                                                       </div>
                                                  )}
                                                  <div className="text-sm text-gray-600 flex items-center gap-3 flex-wrap mb-2">
                                                       <Badge className="text-xs bg-yellow-50 text-yellow-700 flex items-center gap-1">
                                                            <UserCheck className="w-3 h-3" />
                                                            Mức độ: {mr.level || "Any"}
                                                       </Badge>
                                                       <Badge className="text-xs bg-teal-50 text-teal-700 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            Trạng thái: {mr.status}
                                                       </Badge>
                                                  </div>
                                                  {mr.note && (
                                                       <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded-lg border flex items-start gap-2">
                                                            <AlertCircle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                                            <div>
                                                                 <strong>Ghi chú:</strong> {mr.note}
                                                            </div>
                                                       </div>
                                                  )}
                                                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                                                       <Clock className="w-3 h-3" />
                                                       Yêu cầu hết hạn: {new Date(mr.expireAt).toLocaleString('vi-VN')}
                                                  </div>
                                             </div>
                                             <div className="flex items-center gap-2 ml-4">
                                                  {user?.id === mr.ownerId ? (
                                                       <Button disabled className="bg-gray-200 !rounded-full py-2 text-sm text-gray-500 cursor-not-allowed flex items-center gap-2">
                                                            <UserCheck className="w-4 h-4" />
                                                            Yêu cầu của bạn
                                                       </Button>
                                                  ) : (
                                                       <Button onClick={() => {
                                                            if (!user) {
                                                                 Swal.fire({
                                                                      icon: 'warning',
                                                                      title: 'Yêu cầu đăng nhập',
                                                                      text: 'Vui lòng đăng nhập để tham gia.',
                                                                      confirmButtonText: 'Đồng ý'
                                                                 });
                                                                 return;
                                                            }
                                                            const level = prompt("Mức độ đội của bạn (ví dụ: Beginner/Intermediate/Advanced)", "Intermediate") || "";
                                                            try {
                                                                 joinMatchRequest({ requestId: mr.requestId, userId: user.id, level });
                                                                 Swal.fire({
                                                                      toast: true,
                                                                      position: 'top-end',
                                                                      timer: 1800,
                                                                      showConfirmButton: false,
                                                                      icon: 'success',
                                                                      title: 'Đã gửi yêu cầu tham gia'
                                                                 });
                                                                 setMatchRequests(listMatchRequests({
                                                                      status: "Open",
                                                                      level: filterLevel,
                                                                      location: filterLocation,
                                                                      date: filterDate
                                                                 })); // Refresh list
                                                            } catch (e) {
                                                                 Swal.fire({
                                                                      icon: 'error',
                                                                      title: 'Lỗi',
                                                                      text: e.message || 'Không thể tham gia',
                                                                      confirmButtonText: 'Đồng ý'
                                                                 });
                                                            }
                                                       }} className="bg-teal-500 hover:bg-teal-600 text-white flex items-center gap-2">
                                                            <UserPlus className="w-4 h-4" />
                                                            Tham gia
                                                       </Button>
                                                  )}
                                             </div>
                                        </div>
                                   </CardContent>
                              </Card>
                         );
                    })}
                    <div ref={matchEndRef} className="h-6" />
                    {matchRequests.length === 0 && (
                         <Card>
                              <CardContent className="p-8 text-center text-gray-600 flex flex-col items-center gap-3">
                                   <Target className="w-12 h-12 text-gray-400" />
                                   <div className="text-lg font-medium">Không có yêu cầu tìm đối thủ nào</div>
                                   <div className="text-sm">Hãy thử điều chỉnh bộ lọc để tìm thêm kết quả</div>
                              </CardContent>
                         </Card>
                    )}
               </div>
          </div>
     );
}
