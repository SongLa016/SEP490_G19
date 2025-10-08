import { useEffect, useMemo, useState } from "react";
import { MapPin, Star, Phone, Mail, User, Info, Images, MessageSquare, Send } from "lucide-react";
import { Container, Card, CardContent, Button, Input, Section, Textarea, DatePicker } from "../../components/ui";
import { useNavigate } from "react-router-dom";
import { fetchFieldAvailability, fetchTimeSlots, fetchFieldMeta } from "../../services/fields";

export default function FieldDetail({ user }) {
     const navigate = useNavigate();
     const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
     const [selectedSlotId, setSelectedSlotId] = useState("");
     const [timeSlots, setTimeSlots] = useState([]);
     const [availability, setAvailability] = useState([]);
     const [activeTab, setActiveTab] = useState("information"); // information | review | location | gallery
     const [complexMeta, setComplexMeta] = useState(null);
     const [isLoading, setIsLoading] = useState(false);
     const [error, setError] = useState(null);

     // Booking form fields (Package Detail style)
     const [customerName, setCustomerName] = useState("");
     const [customerEmail, setCustomerEmail] = useState("");
     const [customerPhone, setCustomerPhone] = useState("");
     const [message, setMessage] = useState("");
     const [newRating, setNewRating] = useState(0);
     const [newComment, setNewComment] = useState("");
     const [reviewPage, setReviewPage] = useState(1);
     const reviewsPerPage = 6;

     // Mock data for field details
     const field = {
          id: 1,
          name: "Sân bóng đá ABC",
          location: "Quận 1, TP.HCM",
          address: "",
          price: 200000,
          rating: 4.8,
          reviewCount: 156,
          images: [
               "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
               "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
               "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg"
          ],
          amenities: [
               "Có nước uống miễn phí",
               "Có WC sạch sẽ",
               "Có chỗ đậu xe",
               "Có phòng thay đồ",
               "Có máy lạnh",
               "Có wifi miễn phí"
          ],
          description: "Sân bóng đá ABC là một trong những sân bóng chất lượng cao nhất tại Quận 1. Với mặt sân cỏ nhân tạo mới, hệ thống chiếu sáng hiện đại và các tiện ích đầy đủ, đây là lựa chọn lý tưởng cho các trận đấu bóng đá.",
          owner: {
               name: "Nguyễn Văn A",
               phone: "0901234567",
               email: "owner@example.com"
          },
          availableSlots: [],
          reviews: [
               {
                    id: 1,
                    user: "Nguyễn Văn B",
                    rating: 5,
                    comment: "Sân rất đẹp, mặt cỏ mềm, chủ sân thân thiện. Sẽ quay lại!",
                    date: "2024-12-10"
               },
               {
                    id: 2,
                    user: "Trần Thị C",
                    rating: 4,
                    comment: "Sân tốt, giá hợp lý. Chỉ có điều WC hơi xa một chút.",
                    date: "2024-12-08"
               }
          ]
     };

     const reviewStats = useMemo(() => {
          const total = field.reviews.length || 0;
          const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          field.reviews.forEach(r => { const k = Math.max(1, Math.min(5, r.rating)); counts[k] = (counts[k] || 0) + 1; });
          const average = total === 0 ? 0 : (field.reviews.reduce((s, r) => s + r.rating, 0) / total);
          return { total, counts, average };
     }, [field.reviews]);

     const formatPrice = (price) => {
          return new Intl.NumberFormat('vi-VN', {
               style: 'currency',
               currency: 'VND'
          }).format(price);
     };

     // Load time slots once
     useEffect(() => {
          let mounted = true;
          setIsLoading(true);
          setError(null);
          fetchTimeSlots()
               .then((slots) => {
                    if (mounted) {
                         setTimeSlots(slots);
                         setIsLoading(false);
                    }
               })
               .catch((err) => {
                    if (mounted) {
                         setError("Không thể tải danh sách giờ. Vui lòng thử lại.");
                         setIsLoading(false);
                         console.error("Error loading time slots:", err);
                    }
               });
          return () => { mounted = false; };
     }, []);

     // Load availability when date changes
     useEffect(() => {
          let ignore = false;
          async function load() {
               try {
                    setIsLoading(true);
                    setError(null);
                    const data = await fetchFieldAvailability(field.id, selectedDate);
                    if (!ignore) {
                         setAvailability(data);
                         setIsLoading(false);
                    }
               } catch (err) {
                    if (!ignore) {
                         setError("Không thể tải lịch trống. Vui lòng thử lại.");
                         setIsLoading(false);
                         console.error("Error loading availability:", err);
                    }
               }
          }
          load();
          return () => { ignore = true; };
     }, [field.id, selectedDate]);

     const availabilityWithSlotMeta = useMemo(() => {
          const byId = Object.fromEntries(timeSlots.map(s => [String(s.slotId), s]));
          return availability.map(a => ({ ...a, slotMeta: byId[String(a.slotId)] }));
     }, [availability, timeSlots]);

     // Load parent complex meta (address/name) for the field
     useEffect(() => {
          let ignore = false;
          async function load() {
               try {
                    const meta = await fetchFieldMeta(field.id);
                    if (!ignore) setComplexMeta(meta);
               } catch (err) {
                    if (!ignore) {
                         console.error("Error loading field meta:", err);
                    }
               }
          }
          load();
          return () => { ignore = true; };
     }, [field.id]);

     const handleBooking = () => {
          if (!selectedDate) {
               alert("Vui lòng chọn ngày");
               return;
          }
          if (!customerName || !customerEmail || !customerPhone) {
               alert("Vui lòng điền đầy đủ thông tin liên hệ.");
               return;
          }
          if (!user) {
               alert("Bạn cần đăng nhập để đặt sân.");
               navigate("/auth");
               return;
          }
          navigate("/booking", { state: { fieldId: field.id, date: selectedDate, fieldName: field.name, fieldAddress: complexMeta?.complex?.address || "", contact: { customerName, customerEmail, customerPhone, message } } });
     };

     const requireLogin = () => {
          if (!user) {
               alert("Vui lòng đăng nhập để thực hiện thao tác này.");
               navigate("/auth");
               return true;
          }
          return false;
     };

     const handleSubmitReview = () => {
          if (requireLogin()) return;
          if (!newRating || !newComment.trim()) {
               alert("Vui lòng chọn số sao và nhập nội dung đánh giá.");
               return;
          }
          // TODO: Gọi API tạo review thật sự
          alert("Cảm ơn bạn! Đánh giá của bạn sẽ được xử lý.");
          setNewRating(0);
          setNewComment("");
     };

     return (
          <Section className="min-h-screen bg-[url('https://mixivivu.com/section-background.png')] bg-cover bg-center">
               <div className="py-28 mx-5 md:py-36 bg-[url('https://i.pinimg.com/originals/a3/c7/79/a3c779e5d5b622eeb598ac1d50c05cb8.png')] bg-cover bg-center rounded-b-3xl overflow-hidden">
                    <Container className="py-5">
                         <div className="text-center text-white">
                              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Đặt sân nhanh chóng</h1>
                              <p className="mt-2 opacity-90">Điền thông tin để đặt sân bóng một cách nhanh chóng và dễ dàng.</p>
                         </div>
                    </Container>
               </div>
               {/* Navigation Tabs */}
               <Container className="-mt-32 md:-mt-20 px-5 py-2 relative z-10 ">
                    <Card className="border p-1 mx-auto bg-white/80 backdrop-blur rounded-2xl shadow-xl">
                         <CardContent className="p-1">
                              <div className="relative">
                                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                                        {[
                                             { key: "information", label: "Information", icon: Info },
                                             { key: "review", label: "Review", icon: Star },
                                             { key: "location", label: "Location", icon: MapPin },
                                             { key: "gallery", label: "Gallery", icon: Images },
                                        ].map(t => (
                                             <button
                                                  key={t.key}
                                                  type="button"
                                                  onClick={() => setActiveTab(t.key)}
                                                  className={`group relative flex items-center justify-center gap-2 h-14 sm:h-16 rounded-xl border transition-all ${activeTab === t.key
                                                       ? "bg-gradient-to-b from-teal-50 to-white border-teal-300 shadow-sm"
                                                       : "bg-white/70 hover:bg-teal-50 border-teal-200/60"}
                                                  `}
                                             >
                                                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full border text-teal-700 ${activeTab === t.key ? "border-teal-400 bg-white" : "border-teal-200 bg-teal-50 group-hover:border-teal-300"}`}>
                                                       <t.icon className={`w-5 h-5 ${activeTab === t.key ? "text-teal-700" : "text-teal-600"}`} />
                                                  </span>
                                                  <span className={`font-semibold ${activeTab === t.key ? "text-teal-800" : "text-gray-600 group-hover:text-teal-700"}`}>{t.label}</span>
                                                  {activeTab === t.key && (
                                                       <span className="absolute -bottom-1 left-6 right-6 h-1 rounded-full bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-500" />
                                                  )}
                                             </button>
                                        ))}
                                   </div>
                              </div>
                         </CardContent>
                    </Card>
                    {/* Error Display */}
                    {
                         error && (
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
                         )
                    }

                    {/* Main Content */}
                    <Container className="py-10">
                         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 ">
                              {/* Left Column - Field Information */}
                              <div className="lg:col-span-2 p-5 bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-teal-100">
                                   <div className="space-y-6 ">
                                        {/* Field Title and Price */}
                                        <div className="flex justify-between items-start ">
                                             <div>
                                                  <h2 className="text-[32px] font-bold text-teal-800 mb-2">{field.name}</h2>
                                                  <div className="flex items-center gap-4 mb-4">
                                                       <div className="flex items-center">
                                                            {[...Array(5)].map((_, i) => (
                                                                 <Star key={i} className={`w-5 h-5 ${i < Math.floor(field.rating) ? "text-yellow-400" : "text-gray-300"}`} />
                                                            ))}
                                                            <span className="ml-2 font-semibold text-gray-600">({field.reviewCount} đánh giá)</span>
                                                       </div>
                                                  </div>
                                             </div>
                                             <div className="text-right flex items-center gap-2">
                                                  <div className="text-3xl font-bold text-orange-600">{formatPrice(field.price)}</div>
                                                  <div className="text-gray-600 font-semibold">/ trận</div>
                                             </div>
                                        </div>

                                        {/* Description */}
                                        <p className="text-gray-700  leading-relaxed">{field.description}</p>

                                        {/* Tab Content */}
                                        {activeTab === "information" && (
                                             <div className="space-y-10">
                                                  {/* Title on top */}
                                                  <div className="text-center">
                                                       <h3 className="text-2xl font-extrabold text-teal-800">Thông tin chi tiết</h3>
                                                       <div className="mt-2 h-1 w-24 bg-teal-500/80 rounded-full mx-auto" />
                                                  </div>

                                                  {/* Details centered in the middle */}
                                                  <div className="max-w-3xl mx-auto bg-gray-100 border border-teal-100 rounded-2xl p-5 shadow-lg">
                                                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                            <div className="text-center sm:text-left">
                                                                 <div className="text-teal-700 text-lg font-semibold">Địa điểm</div>
                                                                 <div className="text-gray-900 mt-1">{complexMeta?.complex?.address || ""}</div>
                                                            </div>
                                                            <div className="text-center sm:text-left">
                                                                 <div className="text-teal-700 text-lg font-semibold">Giờ mở cửa</div>
                                                                 <div className="text-gray-900 mt-1">06:00 - 22:00</div>
                                                            </div>
                                                            <div className="text-center sm:text-left">
                                                                 <div className="text-teal-700 text-lg font-semibold">Loại sân</div>
                                                                 <div className="text-gray-900 mt-1">Cỏ nhân tạo</div>
                                                            </div>
                                                            <div className="text-center sm:text-left">
                                                                 <div className="text-teal-700 text-lg font-semibold">Sức chứa</div>
                                                                 <div className="text-gray-900 mt-1">5-7 người</div>
                                                            </div>
                                                       </div>
                                                  </div>
                                                  {/* Amenities under details */}
                                                  <div>
                                                       <h3 className="font-semibold text-teal-800 text-lg mb-4">Tiện ích</h3>
                                                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {field.amenities.map((amenity, i) => (
                                                                 <div key={i} className="flex items-center text-gray-700">
                                                                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                                                                      <span>{amenity}</span>
                                                                 </div>
                                                            ))}
                                                       </div>
                                                  </div>

                                                  {/* Gallery Preview */}
                                                  <div>
                                                       <h3 className="font-bold text-xl text-teal-800 mb-1">Từ thư viện ảnh</h3>
                                                       <p className="text-gray-600 mb-4">Khám phá những hình ảnh đẹp nhất về sân bóng này.</p>
                                                       <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                            {field.images.slice(0, 6).map((img, i) => (
                                                                 <img key={i} src={img} alt={`gallery-${i}`} className="w-full h-32 object-cover rounded-lg hover:scale-105 transition-transform cursor-pointer" />
                                                            ))}
                                                       </div>
                                                  </div>
                                             </div>
                                        )}

                                        {activeTab === "review" && (
                                             <div className="space-y-6">
                                                  {/* Summary card */}
                                                  <div className="text-center">
                                                       <h3 className="text-2xl font-extrabold text-teal-800">Đánh giá</h3>
                                                       <div className="mt-2 h-1 w-24 bg-teal-500/80 rounded-full mx-auto" />
                                                  </div>
                                                  <div className="rounded-2xl border border-teal-100 bg-white p-6 shadow-sm">
                                                       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                                                            {/* Average */}
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

                                                            {/* Distribution */}
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

                                                  <div className="space-y-6">
                                                       {/* Write review (visible, but requires login on submit) */}
                                                       <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                 <MessageSquare className="w-5 h-5 text-teal-600" />
                                                                 <h4 className="font-semibold text-teal-800">Viết đánh giá</h4>
                                                            </div>
                                                            <div className="flex items-center gap-1 mb-3">
                                                                 {[...Array(5)].map((_, i) => (
                                                                      <button key={i} type="button" onClick={() => setNewRating(i + 1)} className="focus:outline-none">
                                                                           <Star className={`w-6 h-6 ${i < newRating ? "text-yellow-400" : "text-gray-300"}`} />
                                                                      </button>
                                                                 ))}
                                                                 <span className="ml-2 text-sm text-gray-600">{newRating ? `${newRating}/5` : "Chọn số sao"}</span>
                                                            </div>
                                                            <div className="relative">
                                                                 <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Chia sẻ trải nghiệm của bạn..." className="min-h-[90px] border-teal-200 pr-28 " />
                                                                 <Button type="button" onClick={handleSubmitReview} className="absolute right-2 bottom-2 inline-flex items-center gap-1  bg-teal-600 hover:bg-teal-700 text-white text-sm px-3 py-1.5 rounded-lg">
                                                                      <Send className="w-4 h-4" /> Gửi đánh giá
                                                                 </Button>
                                                            </div>
                                                            {!user && (
                                                                 <div className="mt-2 text-xs text-red-500">Bạn không thể đánh giá khi chưa đăng nhập. <b onClick={() => navigate("/auth")} className="text-blue-500 font-semibold hover:text-blue-600 hover:underline cursor-pointer">Đăng nhập</b> ngay để viết đánh giá.</div>
                                                            )}
                                                       </div>

                                                       {field.reviews.slice((reviewPage - 1) * reviewsPerPage, reviewPage * reviewsPerPage).map((review) => (
                                                            <div key={review.id} className="border border-teal-100 rounded-xl p-4 shadow-sm">
                                                                 <div className="flex justify-between items-start mb-2">
                                                                      <div>
                                                                           <h4 className="font-semibold text-gray-900">{review.user}</h4>
                                                                           <div className="flex items-center mt-1">
                                                                                {[...Array(5)].map((_, i) => (
                                                                                     <Star key={i} className={`w-4 h-4 ${i < review.rating ? "text-yellow-400" : "text-gray-300"}`} />
                                                                                ))}
                                                                                {reviewStats.total > reviewsPerPage && (
                                                                                     <div className="flex items-center justify-center gap-2">
                                                                                          <Button type="button" variant="outline" className="px-3 py-1 rounded-full border-teal-200 text-teal-700" disabled={reviewPage === 1} onClick={() => setReviewPage(p => Math.max(1, p - 1))}>Trước</Button>
                                                                                          <div className="text-sm text-gray-600">Trang {reviewPage}/{Math.ceil(reviewStats.total / reviewsPerPage)}</div>
                                                                                          <Button type="button" variant="outline" className="px-3 py-1 rounded-full border-teal-200 text-teal-700" disabled={reviewPage === Math.ceil(reviewStats.total / reviewsPerPage)} onClick={() => setReviewPage(p => Math.min(Math.ceil(reviewStats.total / reviewsPerPage), p + 1))}>Sau</Button>
                                                                                     </div>
                                                                                )}
                                                                           </div>
                                                                      </div>
                                                                      <span className="text-sm text-gray-500">{review.date}</span>
                                                                 </div>
                                                                 <p className="text-gray-700">{review.comment}</p>
                                                            </div>
                                                       ))}
                                                  </div>
                                             </div>
                                        )}

                                        {activeTab === "location" && (
                                             <div className="space-y-6">
                                                  <div className="text-center">
                                                       <h3 className="text-2xl font-extrabold text-teal-800">Vị trí sân</h3>
                                                       <div className="mt-2 h-1 w-24 bg-teal-500/80 rounded-full mx-auto" />
                                                  </div>

                                                  <div className="border border-teal-100 bg-white rounded-2xl p-4 shadow-sm">
                                                       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                            <div className="flex items-start gap-2">
                                                                 <MapPin className="w-5 h-5 text-teal-600 mt-0.5" />
                                                                 <div>
                                                                      <div className="text-sm text-gray-500">Địa chỉ</div>
                                                                      <div className="font-medium text-teal-800">{complexMeta?.complex?.address || ""}</div>
                                                                 </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                 <Button
                                                                      type="button"
                                                                      variant="outline"
                                                                      className="rounded-xl border-teal-200 text-teal-700 hover:bg-teal-50"
                                                                      onClick={() => {
                                                                           const addr = complexMeta?.complex?.address || "";
                                                                           if (!addr) return;
                                                                           if (navigator?.clipboard?.writeText) {
                                                                                navigator.clipboard.writeText(addr);
                                                                           }
                                                                      }}
                                                                 >
                                                                      Sao chép địa chỉ
                                                                 </Button>
                                                                 <a
                                                                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(complexMeta?.complex?.address || "")}`}
                                                                      target="_blank"
                                                                      rel="noreferrer"
                                                                      className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
                                                                 >
                                                                      Mở Google Maps
                                                                 </a>
                                                            </div>
                                                       </div>
                                                  </div>

                                                  <div className="overflow-hidden rounded-2xl border border-teal-500 shadow-md bg-white">
                                                       <div className="relative w-full h-[480px] md:h-[500px]">
                                                            <iframe
                                                                 title="map"
                                                                 className="absolute inset-0 w-full h-full"
                                                                 style={{ border: 0 }}
                                                                 loading="lazy"
                                                                 referrerPolicy="no-referrer-when-downgrade"
                                                                 src={`https://www.google.com/maps?q=${encodeURIComponent(complexMeta?.complex?.address || "")}&output=embed`}
                                                            />
                                                       </div>
                                                  </div>
                                             </div>
                                        )}

                                        {activeTab === "gallery" && (
                                             <div className="space-y-6">
                                                  <div><h3 className="text-xl font-bold text-teal-800">Thư viện ảnh</h3>
                                                       <p className="text-gray-600">Khám phá những hình ảnh đẹp nhất về sân bóng này.</p>
                                                  </div>
                                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                       {field.images.map((img, i) => (
                                                            <img key={i} src={img} alt={`gallery-${i}`} className="w-full h-48 object-cover rounded-lg hover:scale-105 transition-transform cursor-pointer" />
                                                       ))}
                                                  </div>
                                             </div>
                                        )}
                                   </div>
                              </div>
                              {/* Right Column - Booking Form */}
                              <div className="lg:col-span-1">
                                   <Card className="bg-white border border-teal-100 shadow-lg rounded-2xl">
                                        <CardContent className="p-6">
                                             <h3 className="text-3xl font-bold leading-tight tracking-tight text-center text-teal-800 mb-2">Đặt sân này</h3>
                                             <p className="text-teal-700/80 text-sm mb-6">Điền thông tin để đặt sân bóng một cách nhanh chóng và dễ dàng.</p>

                                             <div className="grid grid-cols-1 gap-3">
                                                  <div>
                                                       <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                                                       <div className="relative">
                                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                            <Input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="pl-9" placeholder="Nguyễn Văn A" />
                                                       </div>
                                                  </div>
                                                  <div>
                                                       <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                                       <div className="relative">
                                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                            <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="pl-9" placeholder="ban@vidu.com" />
                                                       </div>
                                                  </div>

                                                  <div>
                                                       <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                                                       <div className="relative">
                                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                            <Input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="pl-9" placeholder="090xxxxxxx" />
                                                       </div>
                                                  </div>
                                                  <div>
                                                       <label className="block text-sm font-medium text-gray-700 mb-1">Chọn ngày</label>
                                                       <DatePicker value={selectedDate} onChange={setSelectedDate} min={new Date().toISOString().split('T')[0]} />
                                                  </div>
                                                  <div>
                                                       <label className="block text-sm font-medium text-gray-700 mb-1">Chọn giờ</label>
                                                       {isLoading ? (
                                                            <div className="flex items-center justify-center p-4 border rounded-lg border-teal-200">
                                                                 <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500"></div>
                                                                 <span className="ml-2 text-sm text-gray-600">Đang tải...</span>
                                                            </div>
                                                       ) : (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg border-teal-200 p-2 bg-white">
                                                                 {availabilityWithSlotMeta.map((slot) => (
                                                                      <button
                                                                           key={slot.slotId}
                                                                           type="button"
                                                                           onClick={() => slot.available && setSelectedSlotId(slot.slotId)}
                                                                           disabled={!slot.available}
                                                                           className={`p-2 text-xs rounded-lg border transition-colors ${selectedSlotId === slot.slotId
                                                                                ? "bg-teal-600 text-white border-teal-600"
                                                                                : slot.available
                                                                                     ? "bg-white text-teal-800 border-teal-200 hover:bg-teal-50 hover:border-teal-300"
                                                                                     : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                                                                }`}
                                                                      >
                                                                           <div className="font-medium">{slot.slotMeta?.name || `Slot ${slot.slotId}`}</div>
                                                                           <div className="text-xs opacity-75">
                                                                                {slot.available ? "Còn chỗ" : "Hết chỗ"}
                                                                           </div>
                                                                      </button>
                                                                 ))}
                                                            </div>
                                                       )}
                                                  </div>

                                                  <div>
                                                       <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                                                       <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="w-full min-h-[80px] md:min-h-[90px] border rounded-lg border-gray-300 px-3 py-2 text-sm" placeholder="Yêu cầu thêm (nếu có)" />
                                                  </div>
                                                  <div className="flex flex-col sm:flex-row gap-2">
                                                       <Button
                                                            onClick={() => {
                                                                 if (!selectedDate) {
                                                                      alert("Vui lòng chọn ngày");
                                                                      return;
                                                                 }
                                                                 if (!selectedSlotId) {
                                                                      alert("Vui lòng chọn giờ");
                                                                      return;
                                                                 }
                                                                 alert("Đang kiểm tra lịch trống...");
                                                            }}
                                                            variant="outline"
                                                            className="flex-1 rounded-lg border-teal-500 text-teal-600 hover:bg-teal-50 text-sm py-2"
                                                       >
                                                            Kiểm tra lịch trống
                                                       </Button>
                                                       <Button
                                                            onClick={handleBooking}
                                                            className="flex-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm py-2"
                                                            disabled={!selectedDate || !selectedSlotId}
                                                       >
                                                            Đặt ngay
                                                       </Button>
                                                  </div>
                                             </div>
                                        </CardContent>
                                   </Card>

                                   {/* Contact Info */}
                                   <Card className="mt-4 p-5">
                                        <CardContent>
                                             <h3 className="font-bold text-center text-teal-800 text-lg mb-4">Liên hệ chủ sân</h3>
                                             <div className="gap-2 text-sm">
                                                  <div className="flex items-center text-gray-600">
                                                       <Phone className="w-4 h-4 mr-2" />
                                                       <span>{field.owner.phone}</span>
                                                  </div>
                                                  <div className="flex items-center text-gray-600">
                                                       <Mail className="w-4 h-4 mr-2" />
                                                       <span>{field.owner.email}</span>
                                                  </div>
                                             </div>
                                        </CardContent>
                                   </Card>
                              </div>
                         </div>
                    </Container>
               </Container>



          </Section >
     );
}
