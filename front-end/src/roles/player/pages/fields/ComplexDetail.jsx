import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { Container, Section, LoadingPage, LoadingSpinner } from "../../../../shared/components/ui";
import { fetchComplexDetail, fetchTimeSlots, fetchTimeSlotsByField, fetchFieldDetail, fetchCancellationPolicyByComplex, fetchPromotionsByComplex, fetchPublicFieldSchedulesByField } from "../../../../shared/index";
import BookingModal from "../../../../shared/components/BookingModal";
import { useModal } from "../../../../contexts/ModalContext";
import Swal from 'sweetalert2';
import HeaderSection from "./components/componentDetailField/HeaderSection";
import TabsHeader from "./components/componentDetailField/TabsHeader";
import InfoTabContent from "./components/componentDetailField/InfoTabContent";
import ReviewTabContent from "./components/componentDetailField/ReviewTabContent";
import LocationTabContent from "./components/componentDetailField/LocationTabContent";
import GalleryTabContent from "./components/componentDetailField/GalleryTabContent";
import BookingWidget from "./components/componentDetailField/BookingWidget";
import LightboxModal from "./components/componentDetailField/LightboxModal";

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
     const [cancellationPolicy, setCancellationPolicy] = useState(null);
     const [promotions, setPromotions] = useState([]);
     const [fieldTimeSlots, setFieldTimeSlots] = useState([]); // TimeSlots for selected field with prices
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
     const [isSwitchingField, setIsSwitchingField] = useState(false); // loading when switching between complex and field
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

     const toggleFavoriteField = (fieldId) => {
          setComplexData(prev => ({
               ...prev,
               fields: (prev.fields || []).map(f => Number(f.fieldId) === Number(fieldId) ? { ...f, isFavorite: !f.isFavorite } : f)
          }));
     };

     const toggleFavoriteComplex = (complexId) => {
          setComplexData(prev => ({
               ...prev,
               complex: prev.complex && String(prev.complex.complexId) === String(complexId)
                    ? { ...prev.complex, isFavorite: !prev.complex.isFavorite }
                    : prev.complex
          }));
     };

     const handleToggleFavoriteField = (fieldId) => {
          if (!user) {
               showToastMessage("Vui lòng đăng nhập để sử dụng danh sách yêu thích.", 'warning');
               return;
          }
          toggleFavoriteField(fieldId);
     };

     const handleToggleFavoriteComplex = (complexId) => {
          if (!user) {
               showToastMessage("Vui lòng đăng nhập để sử dụng danh sách yêu thích.", 'warning');
               return;
          }
          toggleFavoriteComplex(complexId);
     };

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

                    // Fetch complex data first to get field list
                    const [complexData, complexDataNoSlot] = await Promise.all([
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
                    
                    // Only fetch cancellation policy and promotions when viewing a specific field
                    // Do not fetch for complex view
                    let policyData = null;
                    let promotionsData = [];
                    
                    const fieldIdForPolicy = (fieldData?.fieldId ? Number(fieldData.fieldId) : null) || selectedFieldId;
                    
                    if (fieldIdForPolicy) {
                         // Get field to find ownerId for fetching policies
                         const fieldForPolicy = complexData?.fields?.find(f => Number(f.fieldId) === Number(fieldIdForPolicy));
                         const ownerId = fieldForPolicy?.ownerId || complexData?.complex?.ownerId;
                         
                         // For now, use complex-based APIs (will need to update to field-based APIs when available)
                         // Using complexId as fallback since field-based APIs may not exist yet
                         try {
                              [policyData, promotionsData] = await Promise.all([
                                   fetchCancellationPolicyByComplex(complexIdToUse).catch(() => null),
                                   fetchPromotionsByComplex(complexIdToUse).catch(() => [])
                              ]);
                         } catch (error) {
                              console.warn("Error fetching policies/promotions:", error);
                         }
                    }

                    if (!ignore) {
                         // Determine which field to fetch timeslots for
                         // Priority: fieldData from route > selectedFieldId from state > first field in complex
                         const fieldIdToUse = (fieldData?.fieldId ? Number(fieldData.fieldId) : null)
                              || selectedFieldId
                              || (complexData?.fields?.[0]?.fieldId ? Number(complexData.fields[0].fieldId) : null);

                         // Fetch timeslots only if viewing complex (not a specific field)
                         // If viewing a specific field (via route or selectedFieldId), BookingWidget will fetch schedules from public API
                         let slots = [];

                         // No longer fetch timeSlots for complex view - only fetch for selected field
                         // BookingWidget will fetch schedules from public API
                         console.log('Using schedules from public API in BookingWidget');

                         setTimeSlots(slots);
                         setComplexData(complexData);
                         setCancellationPolicy(policyData);
                         setPromotions(Array.isArray(promotionsData) ? promotionsData : []);
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
     
     // Separate effect to handle selectedFieldId changes - fetch TimeSlots for selected field
     useEffect(() => {
          let cancelled = false;
          
          async function loadFieldTimeSlots() {
               if (!selectedFieldId) {
                    setFieldTimeSlots([]);
                    return;
               }
               
               try {
                    const slotsResult = await fetchTimeSlotsByField(selectedFieldId);
                    if (cancelled) return;
                    
                    if (slotsResult?.success && Array.isArray(slotsResult.data)) {
                         setFieldTimeSlots(slotsResult.data);
                         console.log(`Loaded ${slotsResult.data.length} time slots for field ${selectedFieldId}`);
                    } else {
                         setFieldTimeSlots([]);
                         console.warn('Failed to load time slots for field:', slotsResult?.error);
                    }
               } catch (error) {
                    if (cancelled) return;
                    console.error('Error fetching time slots for field:', error);
                    setFieldTimeSlots([]);
               }
          }
          
          loadFieldTimeSlots();
          return () => { cancelled = true; };
     }, [selectedFieldId]);
     
     // Separate effect to handle selectedFieldId changes without refetching all data
     // Only refetch if the selected field is not in the current fields array
     useEffect(() => {
          if (!selectedFieldId || !complexData.fields || complexData.fields.length === 0) {
               return;
          }
          
          // Check if selectedFieldId exists in current fields
          const fieldExists = complexData.fields.some(f => Number(f.fieldId) === Number(selectedFieldId));
          
          if (!fieldExists) {
               // Field not found in current data, might need to refetch
               // But don't refetch immediately - wait a bit to avoid too many requests
               console.warn(`Selected field ${selectedFieldId} not found in current fields. Available fields:`, complexData.fields.map(f => f.fieldId));
          }
     }, [selectedFieldId, complexData.fields]);

     // Compute cheapest/priciest slot price from TimeSlots for selected field
     useEffect(() => {
          if (!selectedFieldId || !Array.isArray(fieldTimeSlots) || fieldTimeSlots.length === 0) {
               setCheapestSlot(null);
               setPriciestSlot(null);
               return;
          }
          
          const slotsWithPrices = fieldTimeSlots
               .filter(s => s.price && s.price > 0)
               .map(s => ({ slotId: s.slotId, name: s.name || s.slotName, price: Number(s.price) || 0 }));
          
          if (slotsWithPrices.length === 0) {
               setCheapestSlot(null);
               setPriciestSlot(null);
               return;
          }
          
          const cheapest = slotsWithPrices.reduce((best, cur) => {
               if (!best || (cur.price > 0 && cur.price < best.price)) return cur;
               return best;
          }, null);
          
          const priciest = slotsWithPrices.reduce((best, cur) => {
               if (!best) return cur;
               if (cur.price > best.price) return cur;
               return best;
          }, null);
          
          setCheapestSlot(cheapest);
          setPriciestSlot(priciest);
     }, [selectedFieldId, fieldTimeSlots]);

     // Compute cheapest/priciest slot for the currently selected small field from TimeSlots
     useEffect(() => {
          if (!selectedFieldId || !Array.isArray(fieldTimeSlots) || fieldTimeSlots.length === 0) {
               setSelectedFieldCheapestSlot(null);
               setSelectedFieldPriciestSlot(null);
               return;
          }
          
          const slotsWithPrices = fieldTimeSlots
               .filter(s => s.price && s.price > 0)
               .map(s => ({ slotId: s.slotId, name: s.name || s.slotName, price: Number(s.price) || 0 }));
          
          if (slotsWithPrices.length === 0) {
               setSelectedFieldCheapestSlot(null);
               setSelectedFieldPriciestSlot(null);
               return;
          }
          
          const cheapest = slotsWithPrices.reduce((best, cur) => {
               if (!best || (cur.price > 0 && cur.price < best.price)) return cur;
               return best;
          }, null);
          
          const priciest = slotsWithPrices.reduce((best, cur) => {
               if (!best) return cur;
               if (cur.price > best.price) return cur;
               return best;
          }, null);
          
          setSelectedFieldCheapestSlot(cheapest);
          setSelectedFieldPriciestSlot(priciest);
     }, [selectedFieldId, fieldTimeSlots]);

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
     }, [activeTab, searchParams, setSearchParams]);

     // Scroll to top and show loading when switching from complex to field detail
     useEffect(() => {
          if (selectedFieldId) {
               setIsSwitchingField(true);
               // Scroll to tabs header when field is selected
               const tabsElement = document.getElementById('tabs-header');
               if (tabsElement) {
                    const offset = 100; // Offset from top
                    const elementPosition = tabsElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;

                    window.scrollTo({
                         top: offsetPosition,
                         behavior: 'smooth'
                    });
               } else {
                    // Fallback: scroll to top
                    window.scrollTo({
                         top: 0,
                         behavior: 'smooth'
                    });
               }
               // Hide loading after a short delay
               setTimeout(() => {
                    setIsSwitchingField(false);
               }, 300);
          } else {
               setIsSwitchingField(false);
          }
     }, [selectedFieldId]);

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



     const handleQuickBookField = async (fieldId) => {
          if (!user) {
               showToastMessage("Bạn cần đăng nhập để đặt sân.", 'warning');
               return;
          }
          if (!selectedDate || !selectedSlotId) {
               showToastMessage("Vui lòng chọn ngày và giờ.", 'warning');
               return;
          }

          // Find field data
          const field = fields.find(f => f.fieldId === fieldId);
          const weeksCount = isRecurring ? Math.max(1, Math.ceil((new Date(rangeEnd) - new Date(rangeStart)) / (7 * 24 * 60 * 60 * 1000))) : 0;
          const mappedDays = isRecurring ? repeatDays.slice() : [];

          if (!field) {
               showToastMessage("Không tìm thấy thông tin sân.", 'error');
               return;
          }

          // Lấy lịch trình từ API public cho sân nhỏ (đặc biệt là field 32)
          let fieldSchedules = [];
          try {
               const schedulesResult = await fetchPublicFieldSchedulesByField(fieldId);
               if (schedulesResult.success && Array.isArray(schedulesResult.data)) {
                    fieldSchedules = schedulesResult.data;
                    console.log(`Đã lấy ${fieldSchedules.length} lịch trình cho sân ${fieldId}`);
               }
          } catch (error) {
               console.error("Lỗi khi lấy lịch trình sân:", error);
          }

          // Lấy thông tin slot từ fieldTimeSlots (đã được fetch trong effect)
          let selectedSlot = fieldTimeSlots.find(s => s.slotId === selectedSlotId || s.SlotID === selectedSlotId);
          
          // Nếu không tìm thấy trong fieldTimeSlots, thử lấy từ schedules
          if (!selectedSlot && fieldSchedules.length > 0) {
               const scheduleForSlot = fieldSchedules.find(s =>
                    String(s.slotId || s.SlotId) === String(selectedSlotId)
               );
               if (scheduleForSlot) {
                    selectedSlot = {
                         slotId: scheduleForSlot.slotId || scheduleForSlot.SlotId,
                         name: scheduleForSlot.slotName || scheduleForSlot.SlotName || `Slot ${selectedSlotId}`,
                         startTime: scheduleForSlot.startTime || scheduleForSlot.StartTime,
                         endTime: scheduleForSlot.endTime || scheduleForSlot.EndTime,
                         price: 0 // Default price if not found
                    };
               }
          }
          
          // Get price from TimeSlot, fallback to 0
          const slotPrice = selectedSlot?.price || selectedSlot?.Price || 0;

          // Helper function để so sánh date
          const compareDate = (scheduleDate, targetDate) => {
               if (!scheduleDate) return false;
               if (typeof scheduleDate === 'string') {
                    return scheduleDate === targetDate;
               }
               if (scheduleDate.year && scheduleDate.month && scheduleDate.day) {
                    const formattedDate = `${scheduleDate.year}-${String(scheduleDate.month).padStart(2, '0')}-${String(scheduleDate.day).padStart(2, '0')}`;
                    return formattedDate === targetDate;
               }
               return false;
          };

          // Với đặt định kỳ, cho phép mở modal để xử lý xung đột trong modal; đặt lẻ thì chặn khi hết chỗ
          if (!isRecurring) {
               // Kiểm tra lịch trình từ API để xác định slot có còn trống không
               const scheduleForSlot = fieldSchedules.find(s =>
                    String(s.slotId) === String(selectedSlotId) &&
                    compareDate(s.date, selectedDate)
               );

               // Nếu có lịch trình từ API, kiểm tra status
               if (scheduleForSlot) {
                    if (scheduleForSlot.status !== 'Available') {
                         showToastMessage("Sân này đã được đặt cho slot đã chọn. Vui lòng chọn slot khác.", 'warning');
                         return;
                    }
               } else if (!field.isAvailableForSelectedSlot) {
                    // Fallback về kiểm tra từ field data nếu không có lịch trình từ API
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

          // Tìm scheduleId từ fieldSchedules dựa trên slotId và date
          let scheduleId = 0;
          if (fieldSchedules && Array.isArray(fieldSchedules) && fieldSchedules.length > 0) {
               const scheduleForSlot = fieldSchedules.find(s => {
                    const scheduleSlotId = s.slotId || s.SlotId || s.slotID || s.SlotID;
                    return String(scheduleSlotId) === String(selectedSlotId) &&
                         compareDate(s.date, selectedDate);
               });

               if (scheduleForSlot) {
                    scheduleId = scheduleForSlot.scheduleId || scheduleForSlot.ScheduleId ||
                         scheduleForSlot.scheduleID || scheduleForSlot.ScheduleID || 0;
                    console.log("✅ [ComplexDetail] Tìm thấy scheduleId:", scheduleId, "từ schedule:", scheduleForSlot);
               } else {
                    console.warn("⚠️ [ComplexDetail] Không tìm thấy scheduleId từ fieldSchedules cho slotId:", selectedSlotId, "date:", selectedDate);
               }
          }

          const bookingData = {
               fieldId: fieldId,
               fieldName: field.name,
               fieldAddress: field.address,
               date: selectedDate,
               slotId: selectedSlotId,
               slotName: selectedSlot?.name || selectedSlot?.slotName || "",
               scheduleId: scheduleId, // Thêm scheduleId vào booking data
               duration: 1,
               price: slotPrice, // Use price from TimeSlot
               totalPrice: slotPrice, // Use price from TimeSlot
               fieldType: field.typeName,
               fieldSize: field.size || "Không xác định",
               complexId: id,
               complexName: complex?.name || "",
               ownerId: complex?.ownerId || complex?.ownerID, // Thêm ownerId để lấy bank account
               isRecurringPreset: isRecurring,
               recurringWeeksPreset: weeksCount,
               selectedDaysPreset: mappedDays,
               fieldSchedules: fieldSchedules // Thêm lịch trình vào booking data
          };

          setBookingModalData(bookingData);
          setBookingType(isRecurring ? "field" : "quick"); // Changed from "complex" to "field"
          openBookingModal();
     };

     const handleBookingSuccess = () => {
          closeBookingModal();
          showToastMessage("Đặt sân thành công!", 'success');
     };

     const complex = complexData.complex;
     const fields = complexData.fields || [];
     const selectedField = selectedFieldId ? fields.find(f => Number(f.fieldId) === Number(selectedFieldId)) : null;
     
     // Log warning if selectedField is not found
     useEffect(() => {
          if (selectedFieldId && !selectedField && fields.length > 0) {
               console.warn(`Selected field ${selectedFieldId} not found in fields array. Available fieldIds:`, fields.map(f => f.fieldId));
          }
     }, [selectedFieldId, selectedField, fields]);

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

     // Get price from TimeSlot for selected field
     const selectedSlotPrice = selectedSlotId && selectedField ? (() => {
          const slot = fieldTimeSlots.find(s => s.slotId === selectedSlotId || s.SlotID === selectedSlotId);
          return slot?.price || slot?.Price || 0;
     })() : 0;

     // Get minimum price from TimeSlots
     const minPrice = fieldTimeSlots.length > 0 ? (() => {
          const prices = fieldTimeSlots
               .map(s => s.price || s.Price || 0)
               .filter(p => p > 0);
          return prices.length > 0 ? Math.min(...prices) : 0;
     })() : 0;

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

     // Tính tóm tắt giá cho đặt cố định (sân nhỏ)
     const recurringSummary = (() => {
          if (!isRecurring || !selectedField) return null;
          const totalSessions = calculateTotalSessions();
          if (!totalSessions) return { totalSessions: 0, unitPrice: 0, discountPercent: 0, subtotal: 0, discountedTotal: 0, discountAmount: 0 };
          // Use price from TimeSlot
          const unitPrice = Number(selectedSlotPrice || minPrice || 0);
          const subtotal = unitPrice * totalSessions;
          const discountPercent = getRecurringDiscountPercent(totalSessions);
          const discountAmount = Math.round(subtotal * (discountPercent / 100));
          const discountedTotal = subtotal - discountAmount;
          return { totalSessions, unitPrice, subtotal, discountPercent, discountAmount, discountedTotal };
     })();

     return (
          <Section className="min-h-screen bg-[url('https://mixivivu.com/section-background.png')] bg-cover bg-center">
               <HeaderSection complex={complex} user={user} onToggleFavoriteComplex={handleToggleFavoriteComplex} />

               <TabsHeader activeTab={activeTab} setActiveTab={setActiveTab} />

               {isLoading && (
                    <LoadingPage message="Đang tải thông tin khu sân..." />
               )}

               {isSwitchingField && !isLoading && (
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
                         <div className="bg-white rounded-xl shadow-2xl p-6 flex flex-col items-center gap-4">
                              <LoadingSpinner size="lg" />
                              <p className="text-teal-700 font-medium text-lg">Đang tải thông tin sân...</p>
                         </div>
                    </div>
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
               <Container className="py-5">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                         {/* Left - Content */}
                         <div className="lg:col-span-2 p-5 bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-teal-100 space-y-6">
                              {activeTab === "info" && (
                                   <InfoTabContent
                                        selectedField={selectedField}
                                        complex={complex}
                                        fields={fields}
                                        selectedSlotId={selectedSlotId}
                                        availableCount={availableCount}
                                        cheapestSlot={cheapestSlot}
                                        priciestSlot={priciestSlot}
                                        cancellationPolicy={cancellationPolicy}
                                        promotions={promotions}
                                        selectedFieldCheapestSlot={selectedFieldCheapestSlot}
                                        selectedFieldPriciestSlot={selectedFieldPriciestSlot}
                                        onBack={() => setSelectedFieldId(null)}
                                        onFieldSelect={(fieldId) => setSelectedFieldId(fieldId)}
                                        onQuickBookField={handleQuickBookField}
                                        onToggleFavoriteField={handleToggleFavoriteField}
                                   />
                              )}

                              {activeTab === "review" && (
                                   <ReviewTabContent
                                        reviewStats={reviewStats}
                                        complexReviews={complexReviews}
                                        reviewPage={reviewPage}
                                        reviewsPerPage={reviewsPerPage}
                                        user={user}
                                        newRating={newRating}
                                        newComment={newComment}
                                        setNewRating={setNewRating}
                                        setNewComment={setNewComment}
                                        setReviewPage={setReviewPage}
                                        onShowToast={showToastMessage}
                                        onLoginPrompt={() => navigate('/login')}
                                   />
                              )}

                              {activeTab === "location" && (
                                   <LocationTabContent complex={complex} />
                              )}

                              {activeTab === "gallery" && (
                                   <GalleryTabContent
                                        galleryImages={galleryImages}
                                        onImageClick={openLightbox}
                                   />
                              )}
                         </div>

                         {/* Right - Sticky booking widget */}
                         <div className="lg:col-span-1">
                              <BookingWidget
                                   selectedField={selectedField}
                                   selectedDate={selectedDate}
                                   selectedSlotId={selectedSlotId}
                                   fieldTimeSlots={fieldTimeSlots}
                                   isRecurring={isRecurring}
                                   repeatDays={repeatDays}
                                   rangeStart={rangeStart}
                                   rangeEnd={rangeEnd}
                                   daysOfWeek={daysOfWeek}
                                   currentWeeks={currentWeeks}
                                   minRecurringWeeks={minRecurringWeeks}
                                   recurringSummary={recurringSummary}
                                   selectedSlotPrice={selectedSlotPrice}
                                   minPrice={minPrice}
                                   calculateTotalSessions={calculateTotalSessions}
                                   onDateChange={setSelectedDate}
                                   onSlotChange={setSelectedSlotId}
                                   onToggleRecurring={() => setIsRecurring(v => !v)}
                                   onRangeStartChange={setRangeStart}
                                   onRangeEndChange={setRangeEnd}
                                   onToggleDay={toggleDay}
                                   onBook={() => selectedField ? handleQuickBookField(selectedFieldId) : null}
                              />
                         </div>
                    </div>
               </Container>

               {/* Lightbox Modal */}
               <LightboxModal
                    isOpen={isLightboxOpen}
                    images={galleryImages}
                    currentIndex={lightboxIndex}
                    onClose={closeLightbox}
                    onPrevious={() => setLightboxIndex(i => (i - 1 + galleryImages.length) % galleryImages.length)}
                    onNext={() => setLightboxIndex(i => (i + 1) % galleryImages.length)}
               />

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
          </Section>
     );
}
