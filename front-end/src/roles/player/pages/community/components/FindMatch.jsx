import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
     MapPin,
     Users,
     Clock,
     Target,
     UserCheck,
     AlertCircle,
     CheckCircle2,
     UserPlus,
     Calendar,
     Phone,
     User,
     FileText,
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
     Modal,
     Textarea,
} from "../../../../../shared/components/ui";
import { useAuth } from "../../../../../contexts/AuthContext";
import {
     fetchMatchRequests,
     joinMatchRequestAPI,
} from "../../../../../shared/services/matchRequest";
import { getBookingById } from "../../../../../shared/utils/bookingStore";
import Swal from "sweetalert2";

const normalizeText = (value) => (value || "").toLowerCase();

const getBookingInfoFromApi = (request) => {
     if (!request) return {};
     const booking =
          request.booking || request.bookingInfo || request.bookingDetails || {};

     const apiDate = request.matchDate || booking.date;

     return {
          fieldName: booking.fieldName || request.fieldName || "",
          fieldAddress:
               booking.fieldAddress || booking.address || request.complexName || "",
          date: apiDate,
          slotName:
               booking.slotName ||
               booking.time ||
               (request.startTime && request.endTime
                    ? `${request.startTime} - ${request.endTime}`
                    : ""),
          totalPrice: booking.totalPrice || booking.price || 0,
     };
};

function MatchRequestCard({
     mr,
     index,
     highlightPostId,
     highlightRef,
     user,
     onJoinSuccess,
     onJoinClick,
     hasSentJoinRequest,
}) {
     const cardRef = useRef(null);
     const isInView = useInView(cardRef, { once: true, margin: "-50px" });

     const requestId =
          mr.requestId ||
          mr.id ||
          mr.matchRequestId ||
          mr.MatchRequestId ||
          mr.matchID;
     const localBooking =
          mr.bookingId != null ? getBookingById(mr.bookingId) : null;
     const bookingInfo = localBooking || getBookingInfoFromApi(mr);
     const ownerId =
          mr.ownerId || mr.userId || mr.createdById || mr.createdByUserId;
     const ownerName =
          mr.ownerName || mr.createdByName || mr.owner?.name || mr.createdBy;
     const creatorTeamName =
          mr.creatorTeamName || mr.homeTeamName || mr.hostTeamName || "";
     const expireAt = mr.expireAt || mr.expiresAt || mr.expireDate;
     const levelLabel = mr.level || mr.skillLevel || mr.difficulty || "Any";
     const statusLabel = mr.status || mr.state || "Open";
     const locationText =
          mr.location ||
          bookingInfo.fieldAddress ||
          bookingInfo.address ||
          mr.address ||
          "Không rõ địa điểm";

     // Check if request is rejected
     const isRejected = statusLabel === "Rejected" || statusLabel === "Đã từ chối" || statusLabel === "rejected";

     // Check if this is the current user's request
     // Priority: use isMyRequest from API if available, otherwise compare ownerId
     const ownerIsCurrentUser =
          user &&
          (mr.isMyRequest === true ||
               (ownerId &&
                    String(ownerId) ===
                    String(user.userID || user.UserID || user.id || user.userId)));

     const handleJoinClickLocal = () => {
          if (!user) {
               Swal.fire({
                    icon: "warning",
                    title: "Yêu cầu đăng nhập",
                    text: "Vui lòng đăng nhập để tham gia.",
                    confirmButtonText: "Đồng ý",
               });
               return;
          }

          if (!requestId) {
               Swal.fire({
                    icon: "error",
                    title: "Thiếu thông tin kèo",
                    text: "Không thể xác định mã yêu cầu để tham gia.",
                    confirmButtonText: "Đóng",
               });
               return;
          }

          onJoinClick?.(mr);
     };

     return (
          <motion.div
               ref={cardRef}
               initial={{ opacity: 0, y: 30, scale: 0.95 }}
               animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
               transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                    ease: "easeOut",
               }}
               whileHover={{
                    scale: 1.02,
                    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
               }}
          >
               <Card
                    ref={highlightPostId === requestId ? highlightRef : null}
                    className={`border m-2 rounded-3xl transition-all duration-200 ${highlightPostId === requestId
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
                                             <div className="font-semibold text-teal-800">
                                                  {bookingInfo.fieldName
                                                       ? `Tìm đối cho ${bookingInfo.fieldName}`
                                                       : `Tìm đối thủ cho booking #${mr.bookingId || bookingInfo.id || requestId}`}
                                             </div>
                                             <div className="flex flex-col text-sm text-gray-600 mt-1 gap-0.5">
                                                  {creatorTeamName && (
                                                       <span>
                                                            <span className="font-medium">Đội chủ sân:</span>{" "}
                                                            {creatorTeamName}
                                                       </span>
                                                  )}
                                                  {ownerName && (
                                                       <span>
                                                            <span className="font-medium">Người tạo kèo:</span>{" "}
                                                            {ownerName}
                                                       </span>
                                                  )}
                                                  <span className="text-xs text-gray-400">
                                                       Mã kèo: #{requestId}
                                                  </span>
                                             </div>
                                        </div>
                                   </div>

                                   <div className="text-sm text-gray-600 mb-3 space-y-1">
                                        <div className="flex items-center gap-2">
                                             <MapPin className="w-4 h-4 text-gray-500" />
                                             <span className="font-medium">Địa điểm:</span>
                                             <span>{locationText}</span>
                                        </div>
                                        {bookingInfo.date && (
                                             <div className="flex items-center gap-2">
                                                  <Calendar className="w-4 h-4 text-gray-500" />
                                                  <span className="font-medium">Ngày:</span>
                                                  <span>
                                                       {new Date(bookingInfo.date).toLocaleDateString("vi-VN")}
                                                  </span>
                                             </div>
                                        )}
                                        {(bookingInfo.slotName || bookingInfo.time) && (
                                             <div className="flex items-center gap-2">
                                                  <Clock className="w-4 h-4 text-gray-500" />
                                                  <span className="font-medium">Giờ:</span>
                                                  <span>{bookingInfo.slotName || bookingInfo.time}</span>
                                             </div>
                                        )}
                                   </div>

                                   <div className="text-sm text-gray-600 flex items-center gap-3 flex-wrap mb-2">
                                        <Badge className="text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-700 flex items-center gap-1">
                                             <UserCheck className="w-3 h-3" />
                                             Mức độ: {levelLabel}
                                        </Badge>
                                        <Badge className={`text-xs flex items-center gap-1 ${isRejected
                                             ? "bg-red-50 hover:bg-red-100 text-red-700"
                                             : "bg-teal-50 hover:bg-teal-100 text-teal-700"
                                             }`}>
                                             {isRejected ? (
                                                  <AlertCircle className="w-3 h-3" />
                                             ) : (
                                                  <CheckCircle2 className="w-3 h-3" />
                                             )}
                                             {isRejected ? "Bị từ chối" : `Trạng thái: ${statusLabel}`}
                                        </Badge>
                                        {mr.playerCount && (
                                             <Badge className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center gap-1">
                                                  <Users className="w-3 h-3" />
                                                  {mr.playerCount} người
                                             </Badge>
                                        )}
                                   </div>

                                   {mr.description && (
                                        <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded-lg border flex items-start gap-2">
                                             <AlertCircle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                             <div>
                                                  <strong>Ghi chú:</strong> {mr.description}
                                             </div>
                                        </div>
                                   )}
                                   <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Hết hạn:{" "}
                                        {expireAt
                                             ? new Date(expireAt).toLocaleString("vi-VN")
                                             : "Chưa rõ"}
                                   </div>
                              </div>

                              <div className="flex items-center gap-2 ml-4">
                                   {ownerIsCurrentUser ? (
                                        <Button
                                             disabled
                                             className="bg-gray-200 !rounded-full py-2 text-sm text-gray-500 cursor-not-allowed flex items-center gap-2 hover:bg-gray-200"
                                        >
                                             <UserCheck className="w-4 h-4" />
                                             Yêu cầu của bạn
                                        </Button>
                                   ) : isRejected ? (
                                        <Button
                                             disabled
                                             className="bg-red-200 !rounded-full py-2 text-sm text-red-700 cursor-not-allowed flex items-center gap-2 hover:bg-red-200"
                                        >
                                             <AlertCircle className="w-4 h-4" />
                                             Bị từ chối
                                        </Button>
                                   ) : hasSentJoinRequest ? (
                                        <Button
                                             disabled
                                             className="bg-gray-200 !rounded-full py-2 text-sm text-gray-500 cursor-not-allowed flex items-center gap-2 hover:bg-gray-200"
                                        >
                                             <CheckCircle2 className="w-4 h-4" />
                                             Đã gửi yêu cầu
                                        </Button>
                                   ) : (
                                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                             <Button
                                                  onClick={handleJoinClickLocal}
                                                  className="bg-teal-500 hover:bg-teal-600 text-white rounded-full flex items-center gap-2"
                                             >
                                                  <UserPlus className="w-4 h-4" />
                                                  Tham gia
                                             </Button>
                                        </motion.div>
                                   )}
                              </div>
                         </div>
                    </CardContent>
               </Card>
          </motion.div>
     );
}

export default function FindMatch() {
     const locationRouter = useLocation();
     const { user } = useAuth();
     const [filterLocation, setFilterLocation] = useState("");
     const [filterDate, setFilterDate] = useState("");
     const [filterLevel, setFilterLevel] = useState("all");
     const [rawRequests, setRawRequests] = useState([]);
     const [matchPage, setMatchPage] = useState(1);
     const [highlightPostId, setHighlightPostId] = useState(null);
     const [isLoading, setIsLoading] = useState(false);
     const [error, setError] = useState("");

     // Modal state
     const [isModalOpen, setIsModalOpen] = useState(false);
     const [selectedMatchRequest, setSelectedMatchRequest] = useState(null);
     const [isJoining, setIsJoining] = useState(false);
     const [formData, setFormData] = useState({
          teamName: "",
          playerCount: 7,
          contactPhone: "",
          note: "",
     });
     const [formErrors, setFormErrors] = useState({});
     // Track which match requests user has already sent join requests
     const [sentJoinRequests, setSentJoinRequests] = useState(new Set());

     const highlightRef = useRef(null);
     const matchEndRef = useRef(null);
     const pageSize = 10;

     const loadMatchRequests = useCallback(async () => {
          setIsLoading(true);
          const response = await fetchMatchRequests({ page: 1, size: 100 });
          if (response.success) {
               setRawRequests(Array.isArray(response.data) ? response.data : []);
               setError("");
          } else {
               setRawRequests([]);
               setError(response.error || "Không thể tải danh sách kèo");
          }
          setIsLoading(false);
     }, []);

     useEffect(() => {
          loadMatchRequests();
     }, [loadMatchRequests]);

     useEffect(() => {
          const state = locationRouter?.state || {};
          if (state.highlightPostId) {
               setHighlightPostId(state.highlightPostId);
          }
     }, [locationRouter?.state]);

     useEffect(() => {
          if (!highlightPostId) return;
          if (highlightRef.current) {
               highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
               const timer = setTimeout(() => setHighlightPostId(null), 6000);
               return () => clearTimeout(timer);
          }
     }, [highlightPostId]);

     const filteredMatchRequests = useMemo(() => {
          return rawRequests
               .filter((req) => {
                    if (!user || !req) return true;
                    const reqOwner =
                         req.ownerId || req.userId || req.createdById || req.createdByUserId;
                    if (!reqOwner) return true;
                    const currentUserId =
                         user.userID || user.UserID || user.id || user.userId;
                    return String(reqOwner) !== String(currentUserId);
               })
               .filter((req) => {
                    if (!filterLocation.trim()) return true;
                    const bookingInfo = getBookingInfoFromApi(req);
                    const location =
                         req.location ||
                         bookingInfo.fieldAddress ||
                         bookingInfo.address ||
                         req.address ||
                         "";
                    return normalizeText(location).includes(
                         normalizeText(filterLocation.trim())
                    );
               })
               .filter((req) => {
                    if (!filterDate) return true;
                    const bookingInfo = getBookingInfoFromApi(req);
                    if (!bookingInfo.date) return false;
                    const bookingDate = new Date(bookingInfo.date).toDateString();
                    const filterDateString = new Date(filterDate).toDateString();
                    return bookingDate === filterDateString;
               })
               .filter((req) => {
                    if (!filterLevel || filterLevel === "all") return true;
                    const level = (req.level || req.skillLevel || "any").toLowerCase();
                    return level === filterLevel.toLowerCase();
               });
     }, [rawRequests, filterLocation, filterDate, filterLevel, user]);

     useEffect(() => {
          setMatchPage(1);
     }, [filterLocation, filterDate, filterLevel, filteredMatchRequests.length]);

     const visibleMatchRequests = filteredMatchRequests.slice(
          0,
          matchPage * pageSize
     );

     useEffect(() => {
          const el = matchEndRef.current;
          if (!el) return;
          const observer = new IntersectionObserver(
               (entries) => {
                    entries.forEach((entry) => {
                         if (entry.isIntersecting) {
                              setMatchPage((p) =>
                                   visibleMatchRequests.length >= filteredMatchRequests.length
                                        ? p
                                        : p + 1
                              );
                         }
                    });
               },
               { root: null, threshold: 0.1 }
          );
          observer.observe(el);
          return () => observer.disconnect();
     }, [filteredMatchRequests.length, visibleMatchRequests.length]);

     // Modal handlers
     const handleJoinClick = (matchRequest) => {
          if (!matchRequest) return;

          const requestId =
               matchRequest.requestId ||
               matchRequest.id ||
               matchRequest.matchRequestId ||
               matchRequest.MatchRequestId ||
               matchRequest.matchID;

          if (!requestId) {
               Swal.fire({
                    icon: "error",
                    title: "Thiếu thông tin kèo",
                    text: "Không thể xác định mã yêu cầu để tham gia.",
                    confirmButtonText: "Đóng",
               });
               return;
          }

          setSelectedMatchRequest(matchRequest);
          setFormData({
               teamName: "",
               playerCount: matchRequest.playerCount || 7,
               contactPhone: "",
               note: "",
          });
          setFormErrors({});
          setIsModalOpen(true);
     };

     const validateForm = () => {
          const errors = {};
          if (!formData.teamName.trim()) {
               errors.teamName = "Vui lòng nhập tên đội";
          }
          if (!formData.contactPhone.trim()) {
               errors.contactPhone = "Vui lòng nhập số điện thoại liên hệ";
          }
          setFormErrors(errors);
          return Object.keys(errors).length === 0;
     };

     const handleSubmit = async () => {
          if (!validateForm() || !selectedMatchRequest) {
               return;
          }

          const requestId =
               selectedMatchRequest.requestId ||
               selectedMatchRequest.id ||
               selectedMatchRequest.matchRequestId ||
               selectedMatchRequest.MatchRequestId ||
               selectedMatchRequest.matchID;

          if (!requestId) {
               Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể xác định mã yêu cầu.",
                    confirmButtonText: "Đóng",
               });
               return;
          }

          try {
               setIsJoining(true);
               const payload = {
                    teamName: formData.teamName.trim(),
                    playerCount: Number(formData.playerCount) || selectedMatchRequest.playerCount || 7,
                    contactPhone: formData.contactPhone.trim(),
                    note: formData.note.trim(),
               };

               const response = await joinMatchRequestAPI(requestId, payload);
               if (response.success) {
                    // Mark this match request as having sent join request
                    setSentJoinRequests((prev) => new Set([...prev, requestId]));

                    await Swal.fire({
                         icon: "success",
                         title: "Đã gửi yêu cầu tham gia",
                         text: "Vui lòng chờ chủ kèo phản hồi.",
                         confirmButtonText: "Đóng",
                    });
                    setIsModalOpen(false);
                    setSelectedMatchRequest(null);
                    loadMatchRequests();
               } else {
                    throw new Error(response.error || "Không thể tham gia kèo");
               }
          } catch (error) {
               Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: error.message || "Không thể tham gia",
                    confirmButtonText: "Đóng",
               });
          } finally {
               setIsJoining(false);
          }
     };

     const handleCloseModal = () => {
          if (!isJoining) {
               setIsModalOpen(false);
               setSelectedMatchRequest(null);
               setFormErrors({});
          }
     };

     return (
          <div
               className="border border-b-0 overflow-y-auto scrollbar-hide rounded-t-3xl bg-white border-gray-400 flex flex-col"
               style={{ height: "calc(108.5vh - 120px)" }}
          >
               <motion.div
                    className="grid sticky top-0 z-10 grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-gray-50 border-b border-gray-200"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
               >
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
                              <DatePicker value={filterDate} onChange={setFilterDate} className="rounded-2xl pl-5" />
                         </div>
                    </div>
                    <div className="md:col-span-1">
                         <div className="relative">
                              <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <Select value={filterLevel} onValueChange={setFilterLevel} >
                                   <SelectTrigger className="rounded-2xl pl-8">
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
                         <span className="inline-flex items-center gap-2 bg-teal-100 border border-teal-300 px-3 py-2 rounded-xl">
                              <Users className="w-4 h-4 text-teal-500" />
                              {filteredMatchRequests.length} yêu cầu
                         </span>
                    </div>
               </motion.div>

               {error && (
                    <Card className="m-4 border-red-200 bg-red-50">
                         <CardContent className="p-4 text-red-700 flex items-center gap-2">
                              <AlertCircle className="w-5 h-5" />
                              <span>{error}</span>
                              <Button
                                   variant="outline"
                                   size="sm"
                                   className="ml-auto"
                                   onClick={loadMatchRequests}
                              >
                                   Thử lại
                              </Button>
                         </CardContent>
                    </Card>
               )}

               {isLoading && filteredMatchRequests.length === 0 && (
                    <Card className="m-4">
                         <CardContent className="p-8 text-center flex flex-col items-center gap-3 text-gray-600">
                              <Clock className="w-10 h-10 text-teal-500 animate-spin" />
                              <div className="text-lg font-medium">Đang tải danh sách kèo...</div>
                         </CardContent>
                    </Card>
               )}

               <div className="divide-y divide-gray-200">
                    {visibleMatchRequests.map((mr, index) => {
                         const requestId =
                              mr.requestId ||
                              mr.id ||
                              mr.matchRequestId ||
                              mr.MatchRequestId ||
                              mr.matchID;
                         const hasSentJoinRequest = requestId ? sentJoinRequests.has(requestId) : false;

                         return (
                              <MatchRequestCard
                                   key={requestId || `${index}`}
                                   mr={mr}
                                   index={index}
                                   highlightPostId={highlightPostId}
                                   highlightRef={highlightRef}
                                   user={user}
                                   onJoinSuccess={loadMatchRequests}
                                   onJoinClick={handleJoinClick}
                                   hasSentJoinRequest={hasSentJoinRequest}
                              />
                         );
                    })}
                    <div ref={matchEndRef} className="h-6" />
                    {!isLoading && filteredMatchRequests.length === 0 && (
                         <Card>
                              <CardContent className="p-8 text-center text-gray-600 flex flex-col items-center gap-3">
                                   <Target className="w-12 h-12 text-gray-400" />
                                   <div className="text-lg font-medium">
                                        Không có yêu cầu tìm đối thủ nào
                                   </div>
                                   <div className="text-sm">
                                        Hãy thử điều chỉnh bộ lọc để tìm thêm kết quả
                                   </div>
                              </CardContent>
                         </Card>
                    )}
               </div>

               {/* Join Match Modal - Shared for all match requests */}
               <Modal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    title="Tham gia kèo"
                    className="max-w-lg w-full mx-4"
               >
                    <div className="space-y-4 pb-2">
                         {/* Tên đội */}
                         <div className="space-y-1.5">
                              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                   <User className="w-4 h-4 text-teal-600 flex-shrink-0" />
                                   <span>
                                        Tên đội <span className="text-red-500">*</span>
                                   </span>
                              </label>
                              <div className="relative">
                                   <Input
                                        type="text"
                                        placeholder="Ví dụ: FC Đỉnh Cao"
                                        value={formData.teamName}
                                        onChange={(e) =>
                                             setFormData({ ...formData, teamName: e.target.value })
                                        }
                                        className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-sm ${formErrors.teamName
                                             ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                                             : "border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                                             }`}
                                   />
                                   <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                              </div>
                              {formErrors.teamName && (
                                   <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                        {formErrors.teamName}
                                   </p>
                              )}
                         </div>

                         {/* Số người */}
                         <div className="space-y-1.5">
                              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                   <Users className="w-4 h-4 text-teal-600 flex-shrink-0" />
                                   <span>Số người</span>
                              </label>
                              <div className="relative">
                                   <Input
                                        type="number"
                                        min="1"
                                        value={formData.playerCount}
                                        onChange={(e) =>
                                             setFormData({
                                                  ...formData,
                                                  playerCount: e.target.value,
                                             })
                                        }
                                        className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                                   />
                                   <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                              </div>
                         </div>

                         {/* Số điện thoại */}
                         <div className="space-y-1.5">
                              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                   <Phone className="w-4 h-4 text-teal-600 flex-shrink-0" />
                                   <span>
                                        Số điện thoại <span className="text-red-500">*</span>
                                   </span>
                              </label>
                              <div className="relative">
                                   <Input
                                        type="tel"
                                        placeholder="0909xxxxxx"
                                        value={formData.contactPhone}
                                        onChange={(e) =>
                                             setFormData({ ...formData, contactPhone: e.target.value })
                                        }
                                        className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-sm ${formErrors.contactPhone
                                             ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                                             : "border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                                             }`}
                                   />
                                   <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                              </div>
                              {formErrors.contactPhone && (
                                   <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                        {formErrors.contactPhone}
                                   </p>
                              )}
                         </div>

                         {/* Ghi chú */}
                         <div className="space-y-1.5">
                              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                   <FileText className="w-4 h-4 text-teal-600 flex-shrink-0" />
                                   <span>Ghi chú</span>
                              </label>
                              <Textarea
                                   placeholder="Thông tin thêm về đội của bạn"
                                   value={formData.note}
                                   onChange={(e) =>
                                        setFormData({ ...formData, note: e.target.value })
                                   }
                                   rows={4}
                                   className="w-full rounded-xl border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 resize-none text-sm"
                              />
                         </div>

                         {/* Buttons */}
                         <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
                              <Button
                                   variant="outline"
                                   onClick={handleCloseModal}
                                   disabled={isJoining}
                                   className="rounded-xl px-6 py-2.5 text-sm font-medium border-gray-300 hover:bg-gray-50 transition-colors"
                              >
                                   Hủy
                              </Button>
                              <Button
                                   onClick={handleSubmit}
                                   disabled={isJoining}
                                   className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl px-6 py-2.5 text-sm font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                   {isJoining ? (
                                        <span className="flex items-center gap-2">
                                             <Clock className="w-4 h-4 animate-spin" />
                                             Đang gửi...
                                        </span>
                                   ) : (
                                        <span className="flex items-center gap-2">
                                             <UserPlus className="w-4 h-4" />
                                             Gửi yêu cầu
                                        </span>
                                   )}
                              </Button>
                         </div>
                    </div>
               </Modal>
          </div>
     );
}