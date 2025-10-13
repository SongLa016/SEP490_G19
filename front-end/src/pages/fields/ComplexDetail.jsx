import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { MapPin, Star, Clock, Repeat, Info, Images, User, MessageSquare, Send, ArrowLeft, Ruler, Leaf, CheckCircle, XCircle, Tag, DollarSign, EyeIcon, BadgeInfo } from "lucide-react";
import { Container, Card, CardContent, Button, Section, DatePicker, Textarea } from "../../components/ui";
import { fetchComplexDetail, fetchTimeSlots, fetchFieldDetail } from "../../services/fields";
import BookingModal from "../../components/BookingModal";

export default function ComplexDetail({ user }) {
     const navigate = useNavigate();
     const { id } = useParams();
     const [searchParams, setSearchParams] = useSearchParams();
     const location = useLocation();

     // Unified page: support entering via /complex/:id or /field/:id
     const isFieldRoute = location.pathname.startsWith("/field/");
     const [resolvedComplexId, setResolvedComplexId] = useState(null);
     const [selectedFieldId, setSelectedFieldId] = useState(null); // inline sub-field view within info tab

     const [selectedDate, setSelectedDate] = useState(() => searchParams.get("date") || new Date().toISOString().split("T")[0]);
     const [selectedSlotId, setSelectedSlotId] = useState(() => searchParams.get("slotId") || "");
     const [timeSlots, setTimeSlots] = useState([]);
     const [complexData, setComplexData] = useState({ complex: null, fields: [] });
     const [activeTab, setActiveTab] = useState(() => {
          const q = new URLSearchParams(location.search);
          const t = q.get("tab");
          return (t === "info" || t === "review" || t === "location" || t === "gallery") ? t : "info";
     }); // info | review | location | gallery
     const [isLoading, setIsLoading] = useState(true); // kept for future loading states
     const [error, setError] = useState(null);

     // Recurring booking UI state
     const [isRecurring, setIsRecurring] = useState(false);
     const [repeatDays, setRepeatDays] = useState([]); // [1..7] Mon..Sun
     const [rangeStart, setRangeStart] = useState(() => selectedDate);
     const [rangeEnd, setRangeEnd] = useState(() => selectedDate);

     // Lightbox state for gallery preview
     const [isLightboxOpen, setIsLightboxOpen] = useState(false);
     const [lightboxIndex, setLightboxIndex] = useState(0);

     // Booking modal state
     const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
     const [bookingModalData, setBookingModalData] = useState(null);
     const [bookingType, setBookingType] = useState("field"); // "field" | "complex" | "quick"

     // Reviews state (mirroring FieldDetail behaviors)
     const [newRating, setNewRating] = useState(0);
     const [newComment, setNewComment] = useState("");
     const [reviewPage, setReviewPage] = useState(1);
     const reviewsPerPage = 6;

     useEffect(() => {
          // When entering via /field/:id, resolve its complex and set inline selected field
          let ignore = false;
          if (isFieldRoute) {
               fetchFieldDetail(id)
                    .then((f) => {
                         if (ignore) return;
                         if (f?.complexId) setResolvedComplexId(String(f.complexId));
                         if (f?.fieldId) setSelectedFieldId(Number(f.fieldId));
                    })
                    .catch(() => { });
          } else {
               setResolvedComplexId(String(id));
          }
          return () => { ignore = true; };
     }, [id, isFieldRoute]);

     useEffect(() => {
          setIsLoading(true);
          setError(null);
          Promise.all([
               fetchTimeSlots(),
               fetchComplexDetail(resolvedComplexId || id, { date: selectedDate, slotId: selectedSlotId })
          ])
               .then(([slots, data]) => {
                    setTimeSlots(slots);
                    setComplexData(data);
                    setIsLoading(false);
               })
               .catch((e) => {
                    console.error(e);
                    setError("Không thể tải dữ liệu khu sân.");
                    setIsLoading(false);
               });
     }, [id, resolvedComplexId, selectedDate, selectedSlotId]); // Remove location.search dependency

     useEffect(() => {
          const next = new URLSearchParams(searchParams);
          next.set("date", selectedDate);
          if (selectedSlotId) next.set("slotId", String(selectedSlotId)); else next.delete("slotId");
          setSearchParams(next, { replace: true });
     }, [selectedDate, selectedSlotId, searchParams, setSearchParams]);

     // Sync activeTab into query to preserve state on refresh/navigation
     useEffect(() => {
          const next = new URLSearchParams(searchParams);
          next.set("tab", activeTab);
          setSearchParams(next, { replace: true });
     }, [activeTab, searchParams, setSearchParams]);

     const daysOfWeek = [
          { id: 1, label: "T2" },
          { id: 2, label: "T3" },
          { id: 3, label: "T4" },
          { id: 4, label: "T5" },
          { id: 5, label: "T6" },
          { id: 6, label: "T7" },
          { id: 7, label: "CN" },
     ];

     const toggleDay = (d) => {
          setRepeatDays((prev) => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
     };

     const handleBookComplex = () => {
          if (!selectedDate || !selectedSlotId) {
               alert("Vui lòng chọn ngày và giờ.");
               return;
          }
          if (isRecurring) {
               if (!rangeStart || !rangeEnd || repeatDays.length === 0) {
                    alert("Vui lòng chọn khoảng ngày và các ngày trong tuần.");
                    return;
               }
               const totalSessions = calculateTotalSessions();
               const totalPrice = totalSessions * selectedSlotPrice;
               alert(`Xem trước lịch định kỳ:\n- Tổng số buổi: ${totalSessions}\n- Giá mỗi buổi: ${selectedSlotPrice.toLocaleString("vi-VN")}₫\n- Tổng giá: ${totalPrice.toLocaleString("vi-VN")}₫\n\nSẽ liệt kê các buổi và xung đột nếu có.`);
               return;
          }

          // Kiểm tra sân còn trống
          if (availableCount === 0) {
               alert("Không còn sân trống cho slot đã chọn. Vui lòng chọn slot khác.");
               return;
          }

          // Open booking modal for complex
          const selectedSlot = timeSlots.find(s => s.slotId === selectedSlotId);

          const bookingData = {
               fieldId: `complex-${id}`,
               fieldName: complex?.name || "Khu sân",
               fieldAddress: complex?.address || "",
               date: selectedDate,
               slotId: selectedSlotId,
               slotName: selectedSlot?.name || "",
               duration: 1,
               price: selectedSlotPrice || minPrice || 0,
               totalPrice: selectedSlotPrice || minPrice || 0,
               availableFields: availableCount,
               totalFields: fields.length,
               fieldType: "Complex",
               complexId: id
          };

          setBookingModalData(bookingData);
          setBookingType("complex");
          setIsBookingModalOpen(true);
     };

     const handleQuickBookField = (fieldId) => {
          if (!selectedDate || !selectedSlotId) {
               alert("Vui lòng chọn ngày và giờ.");
               return;
          }

          // Find field data
          const field = fields.find(f => f.fieldId === fieldId);
          const selectedSlot = timeSlots.find(s => s.slotId === selectedSlotId);

          if (!field) {
               alert("Không tìm thấy thông tin sân.");
               return;
          }

          // Kiểm tra sân có còn trống không
          if (!field.isAvailableForSelectedSlot) {
               alert("Sân này đã được đặt cho slot đã chọn. Vui lòng chọn slot khác.");
               return;
          }

          const bookingData = {
               fieldId: fieldId,
               fieldName: field.name,
               fieldAddress: field.address,
               date: selectedDate,
               slotId: selectedSlotId,
               slotName: selectedSlot?.name || "",
               duration: 1,
               price: field.priceForSelectedSlot || 0,
               totalPrice: field.priceForSelectedSlot || 0,
               fieldType: field.typeName,
               fieldSize: field.size || "Không xác định",
               complexId: id,
               complexName: complex?.name || ""
          };

          setBookingModalData(bookingData);
          setBookingType("quick");
          setIsBookingModalOpen(true);
     };

     const handleBookingSuccess = () => {
          setIsBookingModalOpen(false);
          // Refresh data or show success message
          alert("Đặt sân thành công!");
     };

     const complex = complexData.complex;
     const fields = complexData.fields || [];
     const selectedField = selectedFieldId ? fields.find(f => Number(f.fieldId) === Number(selectedFieldId)) : null;

     const complexReviews = useMemo(() => complex?.reviews || [], [complex?.reviews]);
     const reviewStats = useMemo(() => {
          const total = complexReviews.length || 0;
          const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          complexReviews.forEach(r => { const k = Math.max(1, Math.min(5, r.rating || 0)); counts[k] = (counts[k] || 0) + 1; });
          const average = total === 0 ? 0 : (complexReviews.reduce((s, r) => s + (r.rating || 0), 0) / total);
          return { total, counts, average };
     }, [complexReviews]);
     // Thư viện ảnh bao gồm ảnh sân lớn và tất cả ảnh sân nhỏ
     const galleryImages = [
          complex?.image,
          ...fields.map(f => f.image)
     ].filter(Boolean);

     const openLightbox = (index) => {
          if (!galleryImages.length) return;
          setLightboxIndex(Math.max(0, Math.min(index, galleryImages.length - 1)));
          setIsLightboxOpen(true);
     };

     const closeLightbox = () => setIsLightboxOpen(false);

     useEffect(() => {
          if (!isLightboxOpen) return;
          const onKeyDown = (e) => {
               if (e.key === "Escape") closeLightbox();
               if (e.key === "ArrowRight") setLightboxIndex(i => (i + 1) % galleryImages.length);
               if (e.key === "ArrowLeft") setLightboxIndex(i => (i - 1 + galleryImages.length) % galleryImages.length);
          };
          window.addEventListener("keydown", onKeyDown);
          return () => window.removeEventListener("keydown", onKeyDown);
     }, [isLightboxOpen, galleryImages.length]);

     // Tính toán số sân còn trống
     const availableCount = selectedSlotId ?
          fields.filter(f => f.isAvailableForSelectedSlot).length :
          fields.length;

     // Tính giá tối thiểu
     const minPrice = fields.reduce((acc, f) => {
          const p = Number(f.priceForSelectedSlot || 0);
          return acc === 0 ? p : (p > 0 ? Math.min(acc, p) : acc);
     }, 0);

     // Tính giá cho slot đã chọn
     const selectedSlotPrice = selectedSlotId ? (() => {
          const availableFields = fields.filter(f => f.isAvailableForSelectedSlot);
          if (availableFields.length === 0) return minPrice; // Fallback to minPrice if no available fields
          return Math.min(...availableFields.map(f => Number(f.priceForSelectedSlot || 0)));
     })() : minPrice;

     // Tính tổng số buổi cho đặt định kỳ
     const calculateTotalSessions = () => {
          if (!isRecurring || !rangeStart || !rangeEnd || repeatDays.length === 0) return 0;
          const startDate = new Date(rangeStart);
          const endDate = new Date(rangeEnd);
          const weeks = Math.ceil((endDate - startDate) / (7 * 24 * 60 * 60 * 1000));
          return repeatDays.length * weeks;
     };

     return (
          <Section className="min-h-screen bg-[url('https://mixivivu.com/section-background.png')] bg-cover bg-center">
               <div className="py-28 mx-5 md:py-36 bg-[url('https://i.pinimg.com/originals/a3/c7/79/a3c779e5d5b622eeb598ac1d50c05cb8.png')] bg-cover bg-center rounded-b-3xl overflow-hidden">
                    <Container className="py-5">
                         <div className="text-center text-white">
                              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{complex?.name || "Khu sân"}</h1>
                              <div className="mt-2 flex items-center justify-center gap-4 opacity-90">
                                   <span className="inline-flex items-center gap-2"><MapPin className="w-4 h-4" /> {complex?.address || ""}</span>
                                   {complex?.rating && (
                                        <span className="inline-flex items-center gap-1"><Star className="w-4 h-4 text-yellow-300" /> {complex.rating}</span>
                                   )}
                              </div>
                         </div>
                    </Container>
               </div>

               {/* Tabs header matching FieldDetail */}
               <Container className="-mt-32 md:-mt-20 px-5 py-2 relative z-10">
                    <Card className="border p-1 mx-20 bg-white/80 backdrop-blur rounded-2xl shadow-xl">
                         <CardContent className="p-1">
                              <div className="relative">
                                   <div className="grid grid-cols-4 gap-1">
                                        {[
                                             { key: "info", label: "Thông tin", icon: Info },
                                             { key: "review", label: "Đánh giá", icon: Star },
                                             { key: "location", label: "Vị trí", icon: MapPin },
                                             { key: "gallery", label: "Thư viện ảnh", icon: Images },
                                        ].map(t => (
                                             <Button
                                                  key={t.key}
                                                  type="button"
                                                  onClick={() => setActiveTab(t.key)}
                                                  className={`group relative flex items-center justify-center gap-2 h-14 sm:h-16 rounded-xl border transition-all ${activeTab === t.key ? "bg-gradient-to-b from-teal-50 to-white border-teal-300 shadow-sm" : "bg-white/70 hover:bg-teal-50 border-teal-200/60"}`}
                                             >
                                                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-teal-700 ${activeTab === t.key ? "border-teal-400 bg-white" : "border-teal-200 bg-teal-50 group-hover:border-teal-300"}`}>
                                                       <t.icon className={`w-5 h-5 ${activeTab === t.key ? "text-teal-700" : "text-teal-600"}`} />
                                                  </span>
                                                  <span className={`font-semibold text-xl ${activeTab === t.key ? "text-teal-800" : "text-gray-600 group-hover:text-teal-700"}`}>{t.label}</span>
                                                  {activeTab === t.key && (
                                                       <span className="absolute -bottom-1 left-6 right-6 h-1 rounded-full bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-500" />
                                                  )}
                                             </Button>
                                        ))}
                                   </div>
                              </div>
                         </CardContent>
                    </Card>

                    {isLoading && (
                         <Container className="py-10">
                              <div className="flex items-center justify-center p-8 bg-white/80 backdrop-blur rounded-2xl border border-teal-100">
                                   <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-200 border-t-teal-600"></div>
                                   <span className="ml-3 text-teal-700">Đang tải dữ liệu...</span>
                              </div>
                         </Container>
                    )}

                    {/* Error Display */}
                    {error && (
                         <Container className="py-4">
                              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                   <div className="flex items-center">
                                        <div className="text-red-600 mr-3">
                                             <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                             </svg>
                                        </div>
                                        <div>
                                             <h3 className="text-sm font-medium text-red-800">Lỗi tải dữ liệu</h3>
                                             <p className="text-sm text-red-700 mt-1">{error}</p>
                                        </div>
                                   </div>
                              </div>
                         </Container>
                    )}

                    {/* Two-column layout: Left content, Right sticky booking */}
                    <Container className="py-10">
                         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                              {/* Left - Content */}
                              <div className="lg:col-span-2 p-5 bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-teal-100 space-y-6">

                                   {/* Removed Sân nhỏ tab */}

                                   {activeTab === "info" && (
                                        <div className="space-y-6">
                                             <div className="text-center">
                                                  <h3 className="text-2xl font-extrabold text-teal-800">{selectedField ? "Thông tin sân nhỏ" : "Thông tin khu sân"}</h3>
                                                  <div className="mt-2 h-1 w-24 bg-teal-500/80 rounded-full mx-auto" />
                                             </div>

                                             {selectedField ? (
                                                  <div className="space-y-4">
                                                       <div>
                                                            <Button type="button" variant="outline" className="border-teal-300 text-teal-700 hover:text-teal-700 rounded-2xl hover:bg-teal-50" onClick={() => setSelectedFieldId(null)}><ArrowLeft className="w-4 h-4 mr-1" /> <p className="text-xs hover:underline">Quay lại thông tin khu sân</p></Button>
                                                       </div>
                                                       <div className="flex items-start gap-4">
                                                            {selectedField.image && (
                                                                 <img src={selectedField.image} alt={selectedField.name} className="w-28 h-28 object-cover rounded-xl border border-teal-100" />
                                                            )}
                                                            <div className="flex flex-row justify-between w-full">
                                                                 <div>
                                                                      <div className="text-xl font-bold text-teal-800">{selectedField.name}</div>
                                                                      <div className="mt-2 flex flex-wrap gap-2">
                                                                           {selectedField.typeName && (
                                                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200"><User className="w-3 h-3" /> Loại: {selectedField.typeName}</span>
                                                                           )}

                                                                           <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${selectedSlotId ? (selectedField.isAvailableForSelectedSlot ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200") : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                                                                                {selectedSlotId ? (selectedField.isAvailableForSelectedSlot ? (<><CheckCircle className="w-3 h-3" /> Còn chỗ</>) : (<><XCircle className="w-3 h-3" /> Hết chỗ</>)) : "Chưa chọn slot"}
                                                                           </span>
                                                                      </div>
                                                                 </div>
                                                                 <div className="flex ">
                                                                      {selectedSlotId && (
                                                                           <div className="mt-2 text-sm text-gray-700 inline-flex items-center gap-1"><Tag className="w-4 h-4 text-orange-500" /> Giá slot đã chọn: <b className="text-orange-600">{(selectedField.priceForSelectedSlot || 0).toLocaleString("vi-VN")}₫</b></div>
                                                                      )}
                                                                      {!selectedSlotId && (
                                                                           <div className="mt-2 text-sm text-gray-700 inline-flex items-center gap-1"><Tag className="w-4 h-4 text-orange-500" /> Giá tham khảo: <b className="text-orange-600">{(selectedField.priceForSelectedSlot || 0) > 0 ? (selectedField.priceForSelectedSlot).toLocaleString("vi-VN") + "₫" : "Liên hệ"}</b></div>
                                                                      )}
                                                                 </div>
                                                            </div>
                                                       </div>
                                                       <div className="bg-white border border-blue-100 rounded-2xl p-4 shadow-sm">
                                                            <div className="text-blue-700 text-lg text-center font-semibold">Mô tả</div>
                                                            <div className="h-0.5 w-24 bg-blue-500/80 rounded-full mx-auto  mb-2" />
                                                            <div className="text-gray-700">{selectedField.description || "Chưa có mô tả chi tiết về sân nhỏ."}</div>
                                                       </div>
                                                       <div className="bg-white border border-teal-100 rounded-2xl p-4 shadow-sm">
                                                            <div className="text-teal-700 text-lg text-center font-semibold">Chi tiết</div>
                                                            <div className="h-0.5 w-24 bg-teal-500/80 rounded-full mx-auto  mb-2" />
                                                            <div className="space-y-2 text-sm text-gray-700">
                                                                 <div className="flex items-center justify-between"><span className="inline-flex items-center gap-2"><User className="w-4 h-4 text-teal-600" /> Loại sân</span><b className="text-teal-700">{selectedField.typeName || "—"}</b></div>
                                                                 <div className="flex items-center justify-between"><span className="inline-flex items-center gap-2"><Ruler className="w-4 h-4 text-blue-600" /> Kích thước</span><b className="text-teal-700">{selectedField.size || "—"}</b></div>
                                                                 <div className="flex items-center justify-between"><span className="inline-flex items-center gap-2"><Leaf className="w-4 h-4 text-emerald-600" /> Mặt cỏ</span><b className="text-teal-700">{selectedField.grassType || "—"}</b></div>
                                                                 <div className="flex items-center justify-between"><span className="inline-flex items-center gap-2"><MapPin className="w-4 h-4 text-teal-600" /> Thuộc khu sân</span><b className="text-teal-700">{complex?.name || "—"}</b></div>
                                                            </div>
                                                       </div>

                                                  </div>
                                             ) : null}

                                             {!selectedField && (
                                                  <div className="grid grid-cols-1 gap-5">
                                                       <img src={complex?.image} alt={complex?.name} className="w-full h-64 object-cover rounded-2xl" />

                                                       {/* Thông tin chi tiết */}
                                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4">
                                                                 <div className="mb-2">
                                                                      <div className="text-teal-700 text-lg text-center uppercase flex items-center justify-center font-semibold"><Info className="w-5 h-5 mr-1" /> <p className="inline-block">Thông tin cơ bản</p></div>
                                                                      <div className="h-0.5 w-24 bg-teal-500/80 rounded-full mx-auto" />
                                                                 </div>
                                                                 <div className="space-y-2">
                                                                      <div className="flex items-center gap-2">
                                                                           <MapPin className="w-4 h-4 text-teal-600" />
                                                                           <span className="text-gray-700 text-sm font-medium">{complex?.address}</span>
                                                                      </div>
                                                                      <div className="flex items-center gap-2">
                                                                           <Star className="w-4 h-4 text-yellow-500" />
                                                                           <span className="text-gray-700 font-medium">Đánh giá: <b className="text-yellow-500">{complex?.rating || "Chưa có đánh giá"}</b> <p className="inline-block text-xs text-gray-500"> / 5</p></span>
                                                                      </div>
                                                                      <div className="flex items-center gap-2">
                                                                           <Clock className="w-4 h-4 text-teal-600" />
                                                                           <span className="text-gray-700 font-medium">Tổng số sân: <b className="text-teal-600">{fields.length}</b></span>
                                                                      </div>
                                                                      <div className="flex items-center gap-2">
                                                                           <User className="w-4 h-4 text-teal-600" />
                                                                           <span className="text-gray-700 font-medium">Sân còn trống: <b className="text-teal-600">{availableCount}</b></span>
                                                                      </div>
                                                                 </div>
                                                            </div>

                                                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                                                                 <div className="mb-2">
                                                                      <div className="text-blue-700 text-lg text-center uppercase flex items-center justify-center font-semibold"><DollarSign className="w-5 h-5" /> <p className="inline-block">Giá cả</p></div>
                                                                      <div className="h-0.5 w-24 bg-blue-500/80 rounded-full mx-auto" />
                                                                 </div>
                                                                 <div className="space-y-2">
                                                                      <div className="flex items-center justify-between">
                                                                           <span className="text-gray-700 font-medium">Giá từ:</span>
                                                                           <span className="text-orange-600 font-bold">{minPrice ? minPrice.toLocaleString("vi-VN") + "₫" : "Liên hệ"} <p className="inline-block text-xs text-gray-500"> / trận</p></span>
                                                                      </div>
                                                                      {selectedSlotId && (
                                                                           <div className="flex items-center justify-between">
                                                                                <span className="text-gray-700 font-medium">Giá slot đã chọn:</span>
                                                                                <span className="text-orange-600 font-bold">{selectedSlotPrice ? selectedSlotPrice.toLocaleString("vi-VN") + "₫" : "—"} <p className="inline-block text-xs text-gray-500"> / trận</p></span>
                                                                           </div>
                                                                      )}
                                                                      <div className="text-xs text-gray-500 mt-2">
                                                                           * Giá có thể thay đổi theo từng slot thời gian
                                                                      </div>
                                                                 </div>
                                                            </div>
                                                       </div>

                                                       <div className="bg-gray-50 border border-teal-100 rounded-2xl p-4">
                                                            <div className="text-teal-700 text-lg text-center uppercase flex items-center justify-center font-semibold"><BadgeInfo className="w-5 h-5 mr-1" /> <p className="inline-block">Mô tả</p></div>
                                                            <div className="h-0.5 w-24 bg-teal-500/80 rounded-full mx-auto mb-2" />
                                                            <div className="text-gray-700">{complex?.description || "Chưa có mô tả chi tiết về khu sân."}</div>
                                                       </div>

                                                       {/* Danh sách Sân nhỏ (moved from removed tab) */}
                                                       <div className="space-y-4">
                                                            <div className="text-center">
                                                                 <h3 className="text-2xl font-extrabold text-teal-800">Danh sách Sân nhỏ</h3>
                                                                 <div className="mt-2 h-1 w-24 bg-teal-500/80 rounded-full mx-auto" />
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                 {fields.map((f) => (
                                                                      <Card key={f.fieldId} className="border border-teal-100 rounded-xl overflow-hidden shadow-sm bg-white group cursor-pointer transition-all duration-200 hover:shadow-xl hover:ring-1 hover:ring-teal-100">
                                                                           <CardContent className="p-0">
                                                                                <div className="relative overflow-hidden" onClick={() => setSelectedFieldId(f.fieldId)}>
                                                                                     <img src={f.image} alt={f.name} className="w-full h-48 object-cover transition-transform duration-300 ease-out group-hover:scale-105" loading="lazy" />
                                                                                     <div className="absolute top-3 right-3 bg-teal-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                                                                          <User className="w-3 h-3" />
                                                                                          {f.typeName}
                                                                                     </div>
                                                                                </div>
                                                                                <div className="p-4 flex-1 flex flex-col">
                                                                                     <div className="flex items-center gap-1 mb-3">
                                                                                          <div className="bg-teal-50 border border-teal-200 px-2 py-1 rounded-full text-xs text-teal-700 flex items-center gap-1">
                                                                                               <MapPin className="w-3 h-3" />
                                                                                               <span className="line-clamp-1">{f.address}</span>
                                                                                          </div>
                                                                                     </div>
                                                                                     <div className="flex items-center justify-between mb-3">
                                                                                          <h3 className="text-lg font-bold text-teal-800 flex-1">{f.name}</h3>
                                                                                          <div className="text-lg font-bold text-teal-600">
                                                                                               {selectedSlotId ?
                                                                                                    (f.priceForSelectedSlot ? f.priceForSelectedSlot.toLocaleString("vi-VN") + "₫" : "Liên hệ") :
                                                                                                    (f.priceForSelectedSlot ? f.priceForSelectedSlot.toLocaleString("vi-VN") + "₫" : "Liên hệ")
                                                                                               }/trận
                                                                                          </div>
                                                                                     </div>

                                                                                     <div className="flex items-center gap-2 justify-end">
                                                                                          <Button type="button" variant="outline" className="border-teal-300 text-teal-700 rounded-xl hover:text-teal-700 hover:bg-teal-100" onClick={() => setSelectedFieldId(f.fieldId)} title="Xem chi tiết"><EyeIcon className="w-4 h-4" /></Button>
                                                                                          <Button type="button" onClick={() => handleQuickBookField(f.fieldId)} disabled={selectedSlotId && !f.isAvailableForSelectedSlot} className={`${selectedSlotId && !f.isAvailableForSelectedSlot ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-teal-500 hover:bg-teal-600 text-white"} rounded-xl font-semibold transition-colors`}>{selectedSlotId && !f.isAvailableForSelectedSlot ? "Hết chỗ" : "Đặt sân"}</Button>
                                                                                     </div>
                                                                                </div>
                                                                           </CardContent>
                                                                      </Card>
                                                                 ))}
                                                            </div>
                                                       </div>
                                                  </div>
                                             )}
                                        </div>
                                   )}

                                   {activeTab === "review" && (
                                        <div className="space-y-6">
                                             <div className="text-center">
                                                  <h3 className="text-2xl font-extrabold text-teal-800">Đánh giá</h3>
                                                  <div className="mt-2 h-1 w-24 bg-teal-500/80 rounded-full mx-auto" />
                                             </div>
                                             <div className="grid grid-cols-1 gap-5">
                                                  <div className="rounded-2xl border border-teal-100 bg-white p-6 shadow-sm">
                                                       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                                                            <div className="flex items-center gap-4">
                                                                 <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center">
                                                                      <span className="text-2xl font-extrabold text-teal-700">{reviewStats.average.toFixed(1)}</span>
                                                                 </div>
                                                                 <div>
                                                                      <div className="flex items-center">
                                                                           {[...Array(5)].map((_, i) => (
                                                                                <Star key={i} className={`w-5 h-5 ${i < Math.round(reviewStats.average) ? "text-yellow-400" : "text-gray-300"}`} />
                                                                           ))}
                                                                      </div>
                                                                      <div className="text-sm text-gray-500">{reviewStats.total} đánh giá</div>
                                                                 </div>
                                                            </div>
                                                            <div className="w-full md:w-[420px] space-y-2">
                                                                 {[5, 4, 3, 2, 1].map(st => {
                                                                      const pct = reviewStats.total ? Math.round((reviewStats.counts[st] / reviewStats.total) * 100) : 0;
                                                                      return (
                                                                           <div key={st} className="flex items-center gap-3">
                                                                                <div className="flex items-center w-14 justify-end gap-1 text-gray-600">
                                                                                     <span className="font-semibold">{st}</span>
                                                                                     <Star className="w-4 h-4 text-yellow-400" />
                                                                                </div>
                                                                                <div className="flex-1 h-2 rounded-full bg-teal-50 overflow-hidden border border-teal-200">
                                                                                     <div className="h-full bg-teal-500" style={{ width: `${pct}%` }} />
                                                                                </div>
                                                                                <div className="w-16 text-right text-xs text-gray-500">{reviewStats.counts[st]} ({pct}%)</div>
                                                                           </div>
                                                                      );
                                                                 })}
                                                            </div>
                                                       </div>
                                                  </div>
                                                  <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
                                                       <div className="flex items-center gap-2 mb-3">
                                                            <MessageSquare className="w-5 h-5 text-teal-600" />
                                                            <h4 className="font-semibold text-teal-800">Viết đánh giá</h4>
                                                       </div>
                                                       <div className="flex items-center gap-1 mb-3">
                                                            {[...Array(5)].map((_, i) => (
                                                                 <Button key={i} type="button" onClick={() => setNewRating(i + 1)} className="focus:outline-none p-0 h-auto bg-transparent border-0 hover:bg-transparent">
                                                                      <Star className={`w-6 h-6 ${i < newRating ? "text-yellow-400" : "text-gray-300"}`} />
                                                                 </Button>
                                                            ))}
                                                            <span className="ml-2 text-sm text-gray-600">{newRating ? `${newRating}/5` : "Chọn số sao"}</span>
                                                       </div>
                                                       <div className="relative">
                                                            <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Chia sẻ trải nghiệm của bạn..." className="min-h-[90px] border-teal-200 pr-28 " />
                                                            <Button type="button" onClick={() => { alert("Cảm ơn bạn! Đánh giá của bạn sẽ được xử lý."); setNewRating(0); setNewComment(""); }} className="absolute right-2 bottom-2 inline-flex items-center gap-1  bg-teal-600 hover:bg-teal-700 text-white text-sm px-3 py-1.5 rounded-lg">
                                                                 <Send className="w-4 h-4" /> Gửi đánh giá
                                                            </Button>
                                                       </div>
                                                  </div>
                                                  {reviewStats.total > 0 && (
                                                       <div className="space-y-4">
                                                            {complexReviews.slice((reviewPage - 1) * reviewsPerPage, reviewPage * reviewsPerPage).map((review, idx) => (
                                                                 <div key={idx} className="border border-teal-100 rounded-xl p-4 shadow-sm">
                                                                      <div className="flex justify-between items-start mb-2">
                                                                           <div>
                                                                                <h4 className="font-semibold text-gray-900">{review.user || "Người dùng"}</h4>
                                                                                <div className="flex items-center mt-1">
                                                                                     {[...Array(5)].map((_, i) => (
                                                                                          <Star key={i} className={`w-4 h-4 ${i < (review.rating || 0) ? "text-yellow-400" : "text-gray-300"}`} />
                                                                                     ))}
                                                                                </div>
                                                                           </div>
                                                                           <span className="text-sm text-gray-500">{review.date || ""}</span>
                                                                      </div>
                                                                      <p className="text-gray-700">{review.comment || ""}</p>
                                                                 </div>
                                                            ))}
                                                            {reviewStats.total > reviewsPerPage && (
                                                                 <div className="flex items-center justify-center gap-2">
                                                                      <Button type="button" variant="outline" className="px-3 py-1 rounded-full border-teal-200 text-teal-700" disabled={reviewPage === 1} onClick={() => setReviewPage(p => Math.max(1, p - 1))}>Trước</Button>
                                                                      <div className="text-sm text-gray-600">Trang {reviewPage}/{Math.ceil(reviewStats.total / reviewsPerPage)}</div>
                                                                      <Button type="button" variant="outline" className="px-3 py-1 rounded-full border-teal-200 text-teal-700" disabled={reviewPage === Math.ceil(reviewStats.total / reviewsPerPage)} onClick={() => setReviewPage(p => Math.min(Math.ceil(reviewStats.total / reviewsPerPage), p + 1))}>Sau</Button>
                                                                 </div>
                                                            )}
                                                       </div>
                                                  )}
                                             </div>
                                        </div>
                                   )}

                                   {activeTab === "location" && (
                                        <div className="space-y-6">
                                             <div className="text-center">
                                                  <h3 className="text-2xl font-extrabold text-teal-800">Vị trí sân</h3>
                                                  <div className="mt-2 h-1 w-24 bg-teal-500/80 rounded-full mx-auto" />
                                             </div>
                                             <div className="space-y-4">
                                                  <div className="border border-teal-100 bg-white rounded-2xl p-4 shadow-sm">
                                                       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                            <div className="flex items-start gap-2">
                                                                 <MapPin className="w-5 h-5 text-teal-600 mt-0.5" />
                                                                 <div>
                                                                      <div className="text-sm text-gray-500">Địa chỉ</div>
                                                                      <div className="font-medium text-teal-800">{complex?.address || ""}</div>
                                                                 </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                 <Button type="button" variant="outline" className="rounded-xl border-teal-200 text-teal-700 hover:text-teal-700 hover:bg-teal-50" onClick={() => { const addr = complex?.address || ""; if (!addr) return; if (navigator?.clipboard?.writeText) { navigator.clipboard.writeText(addr); } }}>Sao chép địa chỉ</Button>
                                                                 <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(complex?.address || "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl">Mở Google Maps</a>
                                                            </div>
                                                       </div>
                                                  </div>
                                                  <div className="overflow-hidden rounded-2xl border border-teal-500 shadow-md bg-white">
                                                       <div className="relative w-full h-[420px] md:h-[600px]">
                                                            <iframe title="map" className="absolute inset-0 w-full h-full" style={{ border: 0 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={`https://www.google.com/maps?q=${encodeURIComponent(complex?.address || "")}&output=embed`} />
                                                       </div>
                                                  </div>
                                             </div>
                                        </div>
                                   )}

                                   {activeTab === "gallery" && (
                                        <div className="space-y-6">
                                             <div className="text-center">
                                                  <h3 className="text-2xl font-extrabold text-teal-800">Thư viện ảnh</h3>
                                                  <div className="mt-2 h-1 w-24 bg-teal-500/80 rounded-full mx-auto" />
                                                  <p className="text-gray-600 mt-2">Bao gồm ảnh khu sân và tất cả sân nhỏ</p>
                                             </div>

                                             {galleryImages.length > 0 ? (
                                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                       {galleryImages.map((img, i) => (
                                                            <div key={i} className="relative group cursor-pointer" onClick={() => openLightbox(i)}>
                                                                 <img
                                                                      src={img}
                                                                      alt={`gallery-${i}`}
                                                                      className="w-full h-40 object-cover rounded-lg hover:scale-105 transition-transform shadow-md hover:shadow-lg"
                                                                 />
                                                                 <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center pointer-events-none">
                                                                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                           <div className="bg-white bg-opacity-90 rounded-full p-2">
                                                                                <Images className="w-6 h-6 text-teal-600" />
                                                                           </div>
                                                                      </div>
                                                                 </div>
                                                                 {i === 0 && (
                                                                      <div className="absolute top-2 left-2 bg-teal-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                                                                           Khu sân
                                                                      </div>
                                                                 )}
                                                            </div>
                                                       ))}
                                                  </div>
                                             ) : (
                                                  <div className="text-center py-12">
                                                       <Images className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                                       <p className="text-gray-500">Chưa có ảnh nào</p>
                                                  </div>
                                             )}
                                        </div>
                                   )}
                              </div>

                              {/* Right - Sticky booking widget */}
                              <div className="lg:col-span-1">
                                   <Card className="bg-white border border-teal-100 shadow-lg rounded-2xl lg:sticky lg:top-24">
                                        <CardContent className="p-6">
                                             <h3 className="text-2xl font-bold text-center text-teal-800">{selectedField ? "Đặt Sân nhỏ" : "Đặt Sân lớn"}</h3>
                                             <p className="text-teal-700/80 font-medium text-sm mb-4 text-center">Chọn ngày/giờ hoặc bật đặt cố định</p>
                                             <div className="grid grid-cols-1 gap-3">
                                                  <div>
                                                       <div className="text-sm font-medium text-gray-700 mb-1">Ngày</div>
                                                       <DatePicker value={selectedDate} onChange={setSelectedDate} min={new Date().toISOString().split('T')[0]} />
                                                  </div>
                                                  <div>
                                                       <div className="text-sm font-medium text-gray-700 mb-1">Giờ</div>
                                                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40  overflow-y-auto border rounded-lg border-teal-200 p-2 bg-white">
                                                            {timeSlots.map((s) => {
                                                                 const isSelected = String(selectedSlotId) === String(s.slotId);
                                                                 return (
                                                                      <Button
                                                                           key={s.slotId}
                                                                           type="button"
                                                                           onClick={() => setSelectedSlotId(isSelected ? "" : s.slotId)}
                                                                           className={`p-2 text-xs rounded-lg border transition-colors ${isSelected ? "bg-teal-600 text-white border-teal-600" : "bg-white text-teal-800 border-teal-200 hover:text-teal-800 hover:bg-teal-50 hover:border-teal-300"}`}
                                                                      >
                                                                           {s.name}
                                                                      </Button>
                                                                 );
                                                            })}
                                                       </div>
                                                  </div>
                                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                                       <div className="bg-gray-50 border border-teal-100 rounded-xl p-3">
                                                            <div className="text-gray-600">{selectedSlotId ? "Giá slot đã chọn" : "Giá từ"}</div>
                                                            <div className="text-orange-600 font-bold">{
                                                                 (selectedField ? (selectedField.priceForSelectedSlot || 0) : (selectedSlotPrice || 0))
                                                                      ? ((selectedField ? (selectedField.priceForSelectedSlot || 0) : (selectedSlotPrice || 0)).toLocaleString("vi-VN") + "₫")
                                                                      : "—"
                                                            }</div>
                                                       </div>
                                                       <div className="bg-gray-50 border border-teal-100 rounded-xl p-3">
                                                            <div className="text-gray-600">Sân còn trống</div>
                                                            <div className="text-teal-700 font-semibold">{selectedField ? (selectedSlotId ? (selectedField.isAvailableForSelectedSlot ? 1 : 0) : 1) : availableCount}/{selectedField ? 1 : fields.length}</div>
                                                       </div>
                                                  </div>
                                                  <div className="p-3 border rounded-xl bg-teal-50/50">
                                                       <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                 <Repeat className="w-5 h-5 text-teal-700" />
                                                                 <div className="font-semibold text-teal-800">Đặt cố định</div>
                                                            </div>
                                                            <Button type="button" onClick={() => setIsRecurring(v => !v)} className={`px-3 py-1.5 rounded-lg border ${isRecurring ? "bg-teal-600 text-white border-teal-600" : "bg-white text-teal-800 border-teal-200"}`}>{isRecurring ? "Bật" : "Tắt"}</Button>
                                                       </div>
                                                       {isRecurring && (
                                                            <div className="space-y-3">
                                                                 <div className="bg-white border border-teal-200 rounded-lg p-2">
                                                                      <div className="text-xs text-gray-500 mb-1">Thông tin đặt định kỳ</div>
                                                                      <div className="text-sm text-gray-700">
                                                                           • Đặt sân cho nhiều tuần liên tiếp
                                                                      </div>
                                                                      <div className="text-sm text-gray-700">
                                                                           • Chọn các ngày trong tuần cố định
                                                                      </div>
                                                                      <div className="text-sm text-gray-700">
                                                                           • Tự động kiểm tra xung đột
                                                                      </div>
                                                                 </div>
                                                                 <div>
                                                                      <div className="text-sm text-gray-600 mb-1">Từ ngày</div>
                                                                      <DatePicker value={rangeStart} onChange={setRangeStart} min={selectedDate} />
                                                                 </div>
                                                                 <div>
                                                                      <div className="text-sm text-gray-600 mb-1">Đến ngày</div>
                                                                      <DatePicker value={rangeEnd} onChange={setRangeEnd} min={rangeStart || selectedDate} />
                                                                 </div>
                                                                 <div>
                                                                      <div className="text-sm text-gray-600 mb-1">Ngày trong tuần</div>
                                                                      <div className="flex flex-wrap gap-2">
                                                                           {daysOfWeek.map(d => (
                                                                                <Button key={d.id} type="button" onClick={() => toggleDay(d.id)} className={`px-3 py-1.5 rounded-lg border text-sm ${repeatDays.includes(d.id) ? "bg-teal-600 text-white border-teal-600" : "bg-white text-teal-800 border-teal-200"}`}>{d.label}</Button>
                                                                           ))}
                                                                      </div>
                                                                 </div>
                                                                 {repeatDays.length > 0 && (
                                                                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                                                                           <div className="text-xs text-blue-600 font-semibold">Đã chọn {repeatDays.length} ngày/tuần</div>
                                                                           <div className="text-xs text-blue-500">
                                                                                Tổng số buổi: {calculateTotalSessions()}
                                                                           </div>
                                                                      </div>
                                                                 )}
                                                            </div>
                                                       )}
                                                  </div>
                                                  <Button
                                                       type="button"
                                                       onClick={() => selectedField ? handleQuickBookField(selectedFieldId) : handleBookComplex()}
                                                       className="rounded-lg bg-teal-600 hover:bg-teal-700 text-white"
                                                  >
                                                       {isRecurring ? "Xem trước lịch định kỳ" : (selectedField ? "Đặt Sân này" : "Đặt Sân lớn")}
                                                  </Button>
                                                  <div className="text-xs text-gray-500 text-center">Mock UI – chưa gọi backend</div>
                                             </div>
                                        </CardContent>
                                   </Card>
                              </div>
                         </div>
                    </Container>

                    {/* Lightbox Modal */}
                    {isLightboxOpen && (
                         <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/90" onClick={closeLightbox}>
                              <div className="relative max-w-5xl w-full px-4" onClick={(e) => e.stopPropagation()}>
                                   <img src={galleryImages[lightboxIndex]} alt={`preview-${lightboxIndex}`} className="max-h-[85vh] max-w-[90vw] w-auto mx-auto object-contain rounded-2xl shadow-2xl" />
                                   <Button type="button" aria-label="Close" onClick={closeLightbox} className="absolute top-2 right-2 text-white/90 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2 h-auto">✕</Button>
                                   {galleryImages.length > 1 && (
                                        <>
                                             <Button type="button" aria-label="Previous" onClick={() => setLightboxIndex(i => (i - 1 + galleryImages.length) % galleryImages.length)} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/95 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-4 h-auto text-xl">‹</Button>
                                             <Button type="button" aria-label="Next" onClick={() => setLightboxIndex(i => (i + 1) % galleryImages.length)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/95 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-4 h-auto text-xl">›</Button>
                                        </>
                                   )}
                                   <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/95 text-sm bg-black/50 px-3 py-1 rounded-full">{lightboxIndex + 1} / {galleryImages.length}</div>
                              </div>
                         </div>
                    )}

                    {/* Booking Modal */}
                    <BookingModal
                         isOpen={isBookingModalOpen}
                         onClose={() => setIsBookingModalOpen(false)}
                         fieldData={bookingModalData}
                         user={user}
                         onSuccess={handleBookingSuccess}
                         bookingType={bookingType}
                         navigate={navigate}
                    />
               </Container>
          </Section>
     );
}
