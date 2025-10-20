import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { MapPin, Star, Clock, Repeat, Info, Images, User, MessageSquare, Send, ArrowLeft, Ruler, Leaf, CheckCircle, XCircle, Tag, DollarSign, EyeIcon, BadgeInfo } from "lucide-react";
import { Container, Card, CardContent, Button, Section, DatePicker, Textarea } from "../../components/ui/index.js";
import { fetchComplexDetail, fetchTimeSlots, fetchFieldDetail } from "../../services/fields.js";
import BookingModal from "../../components/BookingModal";
import { useModal } from "../../contexts/ModalContext";
import Swal from 'sweetalert2';

export default function ComplexDetail({ user }) {
     const navigate = useNavigate();
     const { id } = useParams();
     const [searchParams, setSearchParams] = useSearchParams();
     const location = useLocation();
     const { isBookingModalOpen, openBookingModal, closeBookingModal } = useModal();

     // Unified page: support entering via /complex/:id or /field/:id
     const isFieldRoute = location.pathname.startsWith("/field/");
     const [resolvedComplexId, setResolvedComplexId] = useState(null);
     const [selectedFieldId, setSelectedFieldId] = useState(null); // inline sub-field view within info tab

     const [selectedDate, setSelectedDate] = useState(() => searchParams.get("date") || new Date().toISOString().split("T")[0]);
     const [selectedSlotId, setSelectedSlotId] = useState(() => searchParams.get("slotId") || "");
     const [timeSlots, setTimeSlots] = useState([]);
     const [complexData, setComplexData] = useState({ complex: null, fields: [] });
     const [baseMinPrice, setBaseMinPrice] = useState(0); // lowest price across all slots (small field)
     const [cheapestSlot, setCheapestSlot] = useState(null); // { slotId, name, price }
     const [priciestSlot, setPriciestSlot] = useState(null); // { slotId, name, price }
     const [selectedFieldCheapestSlot, setSelectedFieldCheapestSlot] = useState(null); // { slotId, name, price }
     const [selectedFieldPriciestSlot, setSelectedFieldPriciestSlot] = useState(null); // { slotId, name, price }
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
     const [bookingModalData, setBookingModalData] = useState(null);
     const [bookingType, setBookingType] = useState("field"); // "field" | "complex" | "quick"

     // Reviews state (mirroring FieldDetail behaviors)
     const [newRating, setNewRating] = useState(0);
     const [newComment, setNewComment] = useState("");
     const [reviewPage, setReviewPage] = useState(1);
     const reviewsPerPage = 6;

     useEffect(() => {
          let ignore = false;

          async function loadData() {
               setIsLoading(true);
               setError(null);

               try {
                    let fieldData = null;
                    let complexIdToUse = id;

                    // Nếu là route field thì lấy thông tin sân (đồng thời chạy song song fetch slot & complex)
                    if (isFieldRoute) {
                         fieldData = await fetchFieldDetail(id);
                         if (fieldData?.complexId) complexIdToUse = String(fieldData.complexId);
                         if (fieldData?.fieldId) setSelectedFieldId(Number(fieldData.fieldId));
                    }

                    const [slots, complexData, complexDataNoSlot] = await Promise.all([
                         fetchTimeSlots(),
                         fetchComplexDetail(complexIdToUse, {
                              date: selectedDate,
                              slotId: selectedSlotId
                         }),
                         // Fetch once without slotId to compute the absolute minimum price
                         fetchComplexDetail(complexIdToUse, {
                              date: selectedDate,
                              slotId: ""
                         })
                    ]);

                    if (!ignore) {
                         setTimeSlots(slots);
                         setComplexData(complexData);
                         setResolvedComplexId(complexIdToUse);
                         // compute lowest price regardless of selected slot
                         try {
                              const fieldsForMin = complexDataNoSlot?.fields || [];
                              const minBase = fieldsForMin.reduce((acc, f) => {
                                   const p = Number(f.priceForSelectedSlot || 0);
                                   if (acc === 0) return p;
                                   return p > 0 ? Math.min(acc, p) : acc;
                              }, 0);
                              setBaseMinPrice(minBase || 0);
                         } catch { setBaseMinPrice(0); }
                         setIsLoading(false);
                    }
               } catch (e) {
                    console.error(e);
                    if (!ignore) {
                         setError("Không thể tải dữ liệu khu sân.");
                         setIsLoading(false);
                    }
               }
          }

          loadData();
          return () => { ignore = true; };
     }, [id, isFieldRoute, selectedDate, selectedSlotId]);

     // Compute the absolute cheapest slot price across all slots once data is ready
     useEffect(() => {
          let cancelled = false;
          async function computeCheapest() {
               try {
                    if (!resolvedComplexId || !timeSlots?.length) return;
                    const results = await Promise.all(
                         timeSlots.map(async (s) => {
                              const data = await fetchComplexDetail(resolvedComplexId, { date: selectedDate, slotId: s.slotId });
                              const fieldsForSlot = data?.fields || [];
                              const minForSlot = fieldsForSlot.reduce((acc, f) => {
                                   const p = Number(f.priceForSelectedSlot || 0);
                                   if (p <= 0) return acc;
                                   if (acc === 0) return p;
                                   return Math.min(acc, p);
                              }, 0);
                              return { slotId: s.slotId, name: s.name, price: minForSlot || 0 };
                         })
                    );
                    if (cancelled) return;
                    const cheapest = results.reduce((best, cur) => {
                         if (!best || (cur.price > 0 && cur.price < best.price)) return cur;
                         return best;
                    }, null);
                    setCheapestSlot(cheapest);
                    const priciest = results.reduce((best, cur) => {
                         if (!best) return cur;
                         if (cur.price > best.price) return cur;
                         return best;
                    }, null);
                    setPriciestSlot(priciest);
               } catch { /* ignore */ }
          }
          computeCheapest();
          return () => { cancelled = true; };
     }, [resolvedComplexId, timeSlots, selectedDate]);

     // Compute cheapest/priciest slot for the currently selected small field
     useEffect(() => {
          let cancelled = false;
          async function computeSelectedFieldExtremes() {
               try {
                    if (!resolvedComplexId || !timeSlots?.length || !selectedFieldId) {
                         setSelectedFieldCheapestSlot(null);
                         setSelectedFieldPriciestSlot(null);
                         return;
                    }
                    const results = await Promise.all(
                         timeSlots.map(async (s) => {
                              const data = await fetchComplexDetail(resolvedComplexId, { date: selectedDate, slotId: s.slotId });
                              const fieldsForSlot = data?.fields || [];
                              const fieldForSlot = fieldsForSlot.find(f => Number(f.fieldId) === Number(selectedFieldId));
                              const price = Number(fieldForSlot?.priceForSelectedSlot || 0);
                              return { slotId: s.slotId, name: s.name, price };
                         })
                    );
                    if (cancelled) return;
                    const cheapest = results.reduce((best, cur) => {
                         if (!best || (cur.price > 0 && cur.price < best.price)) return cur;
                         return best;
                    }, null);
                    const priciest = results.reduce((best, cur) => {
                         if (!best) return cur;
                         if (cur.price > best.price) return cur;
                         return best;
                    }, null);
                    setSelectedFieldCheapestSlot(cheapest);
                    setSelectedFieldPriciestSlot(priciest);
               } catch { /* ignore */ }
          }
          computeSelectedFieldExtremes();
          return () => { cancelled = true; };
     }, [resolvedComplexId, timeSlots, selectedDate, selectedFieldId]);

     useEffect(() => {
          const next = new URLSearchParams(searchParams);
          next.set("date", selectedDate);
          if (selectedSlotId) next.set("slotId", String(selectedSlotId)); else next.delete("slotId");
          setSearchParams(next, { replace: true });
     }, [selectedDate, selectedSlotId, searchParams, setSearchParams]);

     // Sync activeTab into query to preserve state on refresh/navigation
     useEffect(() => {
          const currentTab = searchParams.get("tab");
          if (currentTab !== activeTab) {
               const next = new URLSearchParams(searchParams);
               next.set("tab", activeTab);
               setSearchParams(next, { replace: true });
          }
     }, [activeTab]);

     // Use JS weekday mapping: 0=CN..6=T7 to align with recurring logic
     const daysOfWeek = [
          { id: 1, label: "T2" },
          { id: 2, label: "T3" },
          { id: 3, label: "T4" },
          { id: 4, label: "T5" },
          { id: 5, label: "T6" },
          { id: 6, label: "T7" },
          { id: 0, label: "CN" },
     ];

     const toggleDay = (d) => {
          setRepeatDays((prev) => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
     };

     const showToastMessage = (message, type = 'info') => {
          const config = {
               title: type === 'success' ? 'Thành công!' :
                    type === 'warning' ? 'Cảnh báo!' :
                         type === 'error' ? 'Lỗi!' : 'Thông báo',
               text: message,
               timer: 3000,
               timerProgressBar: true,
               showConfirmButton: false,
               toast: true,
               position: 'top-end',
               icon: type === 'success' ? 'success' :
                    type === 'warning' ? 'warning' :
                         type === 'error' ? 'error' : 'info'
          };
          Swal.fire(config);
     };

     const handleBookComplex = () => {
          if (!selectedDate || !selectedSlotId) {
               showToastMessage("Vui lòng chọn ngày và giờ.", 'warning');
               return;
          }
          if (isRecurring) {
               if (currentWeeks < minRecurringWeeks) {
                    showToastMessage(`Đặt định kỳ yêu cầu tối thiểu ${minRecurringWeeks} tuần.`, 'warning');
                    return;
               }
               if (!rangeStart || !rangeEnd || repeatDays.length === 0) {
                    showToastMessage("Vui lòng chọn khoảng ngày và các ngày trong tuần.", 'warning');
                    return;
               }
               // Cho phép mở modal đặt định kỳ ngay cả khi slot hiện tại hết chỗ (xung đột sẽ xử lý sau)
          } else {
               // Kiểm tra sân còn trống cho đặt 1 buổi
               if (availableBundles === 0) {
                    showToastMessage("Không còn sân trống cho slot đã chọn. Vui lòng chọn slot khác.", 'warning');
                    return;
               }
          }

          // Open booking modal for complex
          const selectedSlot = timeSlots.find(s => s.slotId === selectedSlotId);
          // Map recurring options to modal preset
          const weeksCount = isRecurring ? Math.max(1, Math.ceil((new Date(rangeEnd) - new Date(rangeStart)) / (7 * 24 * 60 * 60 * 1000))) : 0;
          const mappedDays = isRecurring ? repeatDays.slice() : [];

          const bookingData = {
               fieldId: `complex-${id}`,
               fieldName: complex?.name || "Khu sân",
               fieldAddress: complex?.address || "",
               date: selectedDate,
               slotId: selectedSlotId,
               slotName: selectedSlot?.name || "",
               duration: 1,
               price: selectedSlotPriceBig || minPriceBig || 0,
               totalPrice: selectedSlotPriceBig || minPriceBig || 0,
               availableFields: availableCount,
               totalFields: fields.length,
               fieldType: "Complex",
               complexId: id,
               isRecurringPreset: isRecurring,
               recurringWeeksPreset: weeksCount,
               selectedDaysPreset: mappedDays
          };

          setBookingModalData(bookingData);
          setBookingType("complex");
          openBookingModal();
     };

     const handleQuickBookField = (fieldId) => {
          if (!selectedDate || !selectedSlotId) {
               showToastMessage("Vui lòng chọn ngày và giờ.", 'warning');
               return;
          }

          // Find field data
          const field = fields.find(f => f.fieldId === fieldId);
          const selectedSlot = timeSlots.find(s => s.slotId === selectedSlotId);
          const weeksCount = isRecurring ? Math.max(1, Math.ceil((new Date(rangeEnd) - new Date(rangeStart)) / (7 * 24 * 60 * 60 * 1000))) : 0;
          const mappedDays = isRecurring ? repeatDays.slice() : [];

          if (!field) {
               showToastMessage("Không tìm thấy thông tin sân.", 'error');
               return;
          }

          // Với đặt định kỳ, cho phép mở modal để xử lý xung đột trong modal; đặt lẻ thì chặn khi hết chỗ
          if (!isRecurring) {
               if (!field.isAvailableForSelectedSlot) {
                    showToastMessage("Sân này đã được đặt cho slot đã chọn. Vui lòng chọn slot khác.", 'warning');
                    return;
               }
          } else {
               if (currentWeeks < minRecurringWeeks) {
                    showToastMessage(`Đặt định kỳ yêu cầu tối thiểu ${minRecurringWeeks} tuần.`, 'warning');
                    return;
               }
               if (!rangeStart || !rangeEnd || repeatDays.length === 0) {
                    showToastMessage("Vui lòng chọn khoảng ngày và các ngày trong tuần.", 'warning');
                    return;
               }
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
               complexName: complex?.name || "",
               isRecurringPreset: isRecurring,
               recurringWeeksPreset: weeksCount,
               selectedDaysPreset: mappedDays
          };

          setBookingModalData(bookingData);
          setBookingType(isRecurring ? "complex" : "quick");
          openBookingModal();
     };

     const handleBookingSuccess = () => {
          closeBookingModal();
          showToastMessage("Đặt sân thành công!", 'success');
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

     // Tính toán số sân còn trống (sân nhỏ)
     const availableCount = selectedSlotId ?
          fields.filter(f => f.isAvailableForSelectedSlot).length :
          fields.length;

     // Sân lớn gồm 4-6 sân nhỏ ghép lại => hệ số ghép
     const bigComposeCount = (() => {
          if (fields.length >= 6) return 6;
          if (fields.length >= 4) return 4;
          return Math.max(1, fields.length);
     })();

     // Tính giá tối thiểu (sân nhỏ)
     const minPrice = fields.reduce((acc, f) => {
          const p = Number(f.priceForSelectedSlot || 0);
          return acc === 0 ? p : (p > 0 ? Math.min(acc, p) : acc);
     }, 0);

     // Giá tối thiểu cho sân lớn
     const minPriceBig = (minPrice || 0) * bigComposeCount;

     // Tính giá cho slot đã chọn (sân nhỏ)
     const selectedSlotPrice = selectedSlotId ? (() => {
          const availableFields = fields.filter(f => f.isAvailableForSelectedSlot);
          if (availableFields.length === 0) return minPrice; // Fallback to minPrice if no available fields
          return Math.min(...availableFields.map(f => Number(f.priceForSelectedSlot || 0)));
     })() : minPrice;

     // Giá slot cho sân lớn = giá sân nhỏ x hệ số ghép
     const selectedSlotPriceBig = (selectedSlotPrice || 0) * bigComposeCount;

     // Số lượng gói sân lớn còn trống theo slot
     const availableBundles = selectedSlotId ?
          Math.floor((fields.filter(f => f.isAvailableForSelectedSlot).length) / bigComposeCount) :
          Math.floor(fields.length / bigComposeCount);
     const totalBundles = Math.max(1, Math.floor(fields.length / bigComposeCount));

     // Tính tổng số buổi cho đặt định kỳ
     const calculateTotalSessions = () => {
          if (!isRecurring || !rangeStart || !rangeEnd || repeatDays.length === 0) return 0;
          const startDate = new Date(rangeStart);
          const endDate = new Date(rangeEnd);
          const weeks = Math.ceil((endDate - startDate) / (7 * 24 * 60 * 60 * 1000));
          return repeatDays.length * weeks;
     };

     // Recurring constraints: require at least 4 weeks to enable weekday selection
     const minRecurringWeeks = 4;
     const currentWeeks = (() => {
          if (!rangeStart || !rangeEnd) return 0;
          const s = new Date(rangeStart);
          const e = new Date(rangeEnd);
          return Math.ceil((e - s) / (7 * 24 * 60 * 60 * 1000));
     })();

     // Chính sách giảm giá đặt cố định theo số buổi
     const getRecurringDiscountPercent = (totalSessions) => {
          if (!totalSessions || totalSessions <= 0) return 0;
          if (totalSessions >= 16) return 15; // 16 buổi trở lên: 15%
          if (totalSessions >= 8) return 10;  // 8-15 buổi: 10%
          if (totalSessions >= 4) return 5;   // 4-7 buổi: 5%
          return 0;                            // <4 buổi: không giảm
     };

     // Tính tóm tắt giá cho đặt cố định (sân lớn)
     const recurringSummary = (() => {
          if (!isRecurring) return null;
          const totalSessions = calculateTotalSessions();
          if (!totalSessions) return { totalSessions: 0, unitPrice: 0, discountPercent: 0, subtotal: 0, discountedTotal: 0, discountAmount: 0 };
          // Khi không xem sân nhỏ cụ thể, coi như đặt Sân lớn => dùng giá sân lớn
          const unitPrice = Number(selectedField ? (selectedSlotPrice || minPrice || 0) : (selectedSlotId ? selectedSlotPriceBig : minPriceBig));
          const subtotal = unitPrice * totalSessions;
          const discountPercent = getRecurringDiscountPercent(totalSessions);
          const discountAmount = Math.round(subtotal * (discountPercent / 100));
          const discountedTotal = subtotal - discountAmount;
          return { totalSessions, unitPrice, subtotal, discountPercent, discountAmount, discountedTotal };
     })();

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
                                                                 {/* Giá trị theo slot của sân nhỏ */}
                                                                 <div className="flex items-center justify-between"><span className="inline-flex items-center gap-2"><Tag className="w-4 h-4 text-emerald-600" /> Slot rẻ nhất</span><b className="text-orange-600">{(selectedFieldCheapestSlot?.price || 0).toLocaleString("vi-VN")}₫{selectedFieldCheapestSlot?.name ? ` • ${selectedFieldCheapestSlot.name}` : ""}</b></div>
                                                                 {selectedFieldPriciestSlot && (
                                                                      <div className="flex items-center justify-between"><span className="inline-flex items-center gap-2"><Tag className="w-4 h-4 text-red-600" /> Slot đắt nhất</span><b className="text-orange-600">{(selectedFieldPriciestSlot.price || 0).toLocaleString("vi-VN")}₫ • {selectedFieldPriciestSlot.name}</b></div>
                                                                 )}
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

                                                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3">
                                                                 <div className="mb-2">
                                                                      <div className="text-blue-700 text-lg text-center uppercase flex items-center justify-center font-semibold"><DollarSign className="w-5 h-5" /> <p className="inline-block">Giá cả</p></div>
                                                                      <div className="h-0.5 w-24 bg-blue-500/80 rounded-full mx-auto" />
                                                                 </div>
                                                                 <div className="space-y-2">

                                                                      <div className="flex items-center justify-between mt-1">
                                                                           <span className="text-gray-700 font-medium inline-flex items-center gap-1"><Tag className="w-4 h-4 text-emerald-600" />Slot rẻ nhất:</span>
                                                                           <span className="text-orange-600 font-bold">{(cheapestSlot?.price ? (cheapestSlot.price * bigComposeCount) : 0).toLocaleString("vi-VN")}₫ <p className="inline-block text-xs text-gray-500">/ trận{cheapestSlot?.name ? ` • ${cheapestSlot.name}` : ""}</p></span>
                                                                      </div>
                                                                      {priciestSlot && (
                                                                           <div className="flex items-center justify-between">
                                                                                <span className="text-gray-700 font-medium inline-flex items-center gap-1"><Tag className="w-4 h-4 text-red-600" />Slot đắt nhất:</span>
                                                                                <span className="text-orange-600 font-bold">{(priciestSlot.price * bigComposeCount).toLocaleString("vi-VN")}₫ <p className="inline-block text-xs text-gray-500">/ trận • {priciestSlot.name}</p></span>
                                                                           </div>
                                                                      )}

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
                                                            <Button type="button" onClick={() => { showToastMessage("Cảm ơn bạn! Đánh giá của bạn sẽ được xử lý.", 'success'); setNewRating(0); setNewComment(""); }} className="absolute right-2 bottom-2 inline-flex items-center gap-1  bg-teal-600 hover:bg-teal-700 text-white text-sm px-3 py-1.5 rounded-lg">
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
                                                            <div className="text-gray-600">{selectedField ? (selectedSlotId ? "Giá slot (sân nhỏ)" : "Giá từ (sân nhỏ)") : (selectedSlotId ? "Giá slot (sân lớn)" : "Giá từ (sân lớn)")}</div>
                                                            <div className="text-orange-600 font-bold">{
                                                                 (selectedField ?
                                                                      (selectedField.priceForSelectedSlot || 0)
                                                                      : (selectedSlotId ? selectedSlotPriceBig : minPriceBig)
                                                                 )
                                                                      ? ((selectedField ? (selectedField.priceForSelectedSlot || 0) : (selectedSlotId ? selectedSlotPriceBig : minPriceBig)).toLocaleString("vi-VN") + "₫")
                                                                      : "—"
                                                            }</div>
                                                       </div>
                                                       <div className="bg-gray-50 border border-teal-100 rounded-xl p-3">
                                                            <div className="text-gray-600">{selectedField ? "Sân nhỏ còn trống" : "Sân lớn còn trống"}</div>
                                                            <div className="text-teal-700 font-semibold">{selectedField ? (selectedSlotId ? (selectedField.isAvailableForSelectedSlot ? 1 : 0) : 1) : (selectedSlotId ? availableBundles : totalBundles)}/{selectedField ? 1 : totalBundles}</div>
                                                       </div>
                                                  </div>
                                                  <div className="p-3 border rounded-xl bg-teal-50/50">
                                                       <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                 <Repeat className="w-5 h-5 text-teal-700" />
                                                                 <div className="font-semibold text-teal-800">Đặt cố định</div>
                                                                 {isRecurring && recurringSummary && (
                                                                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full border ${recurringSummary.discountPercent > 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                                                                           Ưu đãi {recurringSummary.discountPercent}%
                                                                      </span>
                                                                 )}
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
                                                                                <Button
                                                                                     key={d.id}
                                                                                     type="button"
                                                                                     disabled={currentWeeks < minRecurringWeeks}
                                                                                     onClick={() => toggleDay(d.id)}
                                                                                     className={`px-3 py-1.5 rounded-lg border text-sm ${currentWeeks < minRecurringWeeks ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : repeatDays.includes(d.id) ? "bg-teal-600 text-white border-teal-600" : "bg-white text-teal-800 border-teal-200"}`}
                                                                                >{d.label}</Button>
                                                                           ))}
                                                                      </div>
                                                                      {currentWeeks < minRecurringWeeks && (
                                                                           <div className="mt-1 text-xs text-red-600">Cần chọn khoảng ngày tối thiểu {minRecurringWeeks} tuần để chọn thứ.</div>
                                                                      )}
                                                                 </div>
                                                                 {repeatDays.length > 0 && (
                                                                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                                                                           <div className="text-xs text-blue-600 font-semibold">Đã chọn {repeatDays.length} ngày/tuần</div>
                                                                           <div className="text-xs text-blue-500">Tổng số buổi: {calculateTotalSessions()}</div>
                                                                           {recurringSummary && recurringSummary.totalSessions > 0 && (
                                                                                <div className="mt-2 text-xs text-blue-700 space-y-1">
                                                                                     <div className="flex items-center justify-between"><span className="font-medium">Giá mỗi buổi</span><span className="font-semibold">{recurringSummary.unitPrice.toLocaleString("vi-VN")}₫</span></div>
                                                                                     <div className="flex items-center justify-between"><span className="font-medium">Tạm tính</span><span className="font-semibold">{recurringSummary.subtotal.toLocaleString("vi-VN")}₫</span></div>
                                                                                     <div className="flex items-center justify-between"><span className="font-medium">Giảm giá ({recurringSummary.discountPercent}%)</span><span className="font-semibold">-{recurringSummary.discountAmount.toLocaleString("vi-VN")}₫</span></div>
                                                                                     <div className="flex items-center justify-between"><span className="font-medium">Thành tiền</span><span className="font-bold text-blue-800">{recurringSummary.discountedTotal.toLocaleString("vi-VN")}₫</span></div>
                                                                                </div>
                                                                           )}
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
                                                       {isRecurring ? "Đặt định kỳ" : (selectedField ? "Đặt Sân nhỏ" : "Đặt Sân lớn")}
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
                         onClose={closeBookingModal}
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
