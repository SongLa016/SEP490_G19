import { useState, useEffect } from "react";
import { X, MapPin, User, Phone, Mail, AlertCircle, CheckCircle, Repeat, CalendarDays } from "lucide-react";
import { Button, Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui";
import { createPendingBooking, confirmPayment, validateBookingData, checkFieldAvailability } from "../services/bookings";
import { createBooking } from "../utils/bookingStore";
import { createMatchRequest, createCommunityPost } from "../utils/communityStore";
import EmailVerificationModal from "./EmailVerificationModal";

export default function BookingModal({
     isOpen,
     onClose,
     fieldData,
     user,
     onSuccess,
     bookingType = "field", // "field" | "complex" | "quick"
     navigate
}) {
     const [step, setStep] = useState("details"); // details | payment | confirmation
     const [isProcessing, setIsProcessing] = useState(false);
     const [errors, setErrors] = useState({});
     const [paymentMethod, setPaymentMethod] = useState("");
     const [pendingInfo, setPendingInfo] = useState(null);
     const [createdMatchRequest, setCreatedMatchRequest] = useState(null);
     const [createdCommunityPost, setCreatedCommunityPost] = useState(null);
     // Opponent flow: always assume user may find opponent after booking via BookingHistory
     const hasOpponent = "unknown";
     const [showEmailVerification, setShowEmailVerification] = useState(false);
     const [isRecurring, setIsRecurring] = useState(false);
     const [recurringWeeks, setRecurringWeeks] = useState(4);
     const [selectedDays, setSelectedDays] = useState([]);
     const [suggestedDays, setSuggestedDays] = useState([]); // weekdays 0..6
     const [isSuggesting, setIsSuggesting] = useState(false);

     const [bookingData, setBookingData] = useState({
          fieldId: fieldData?.fieldId || null,
          fieldName: fieldData?.fieldName || "",
          fieldAddress: fieldData?.fieldAddress || "",
          date: fieldData?.date || new Date().toISOString().split('T')[0],
          slotId: fieldData?.slotId || null,
          slotName: fieldData?.slotName || "",
          duration: fieldData?.duration || 1,
          price: fieldData?.price || 0,
          totalPrice: fieldData?.price || 0,
          depositPercent: 0.3,
          depositAmount: 0,
          remainingAmount: 0,
          discountPercent: 0,
          discountAmount: 0,
          customerName: user?.name || "",
          customerPhone: user?.phone || "",
          customerEmail: user?.email || "",
          notes: "",
          requiresEmail: !user?.email, // Require email if user doesn't have one
          isRecurring: false,
          recurringWeeks: 4,
          recurringEndDate: null
     });

     // Tạo danh sách các buổi định kỳ dự kiến từ ngày bắt đầu + số tuần + các ngày trong tuần
     const generateRecurringSessions = () => {
          if (!isRecurring || !bookingData?.date || !Array.isArray(selectedDays) || selectedDays.length === 0 || !recurringWeeks) return [];
          try {
               const sessions = [];
               const start = new Date(bookingData.date);
               start.setHours(0, 0, 0, 0);
               const end = new Date(start);
               end.setDate(end.getDate() + (recurringWeeks * 7) - 1);

               // Duyệt từ ngày bắt đầu đến ngày kết thúc, chọn ngày có weekday nằm trong selectedDays
               for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const weekday = d.getDay(); // 0=CN..6=T7
                    if (selectedDays.includes(weekday)) {
                         sessions.push({
                              date: new Date(d),
                              slotName: bookingData.slotName || ""
                         });
                    }
               }
               // Đảm bảo số phần tử = selectedDays.length * recurringWeeks
               return sessions.slice(0, selectedDays.length * recurringWeeks);
          } catch {
               return [];
          }
     };

     // Tính toán tổng tiền
     const getRecurringDiscountPercent = (totalSessions) => {
          if (!totalSessions || totalSessions <= 0) return 0;
          if (totalSessions >= 16) return 15;
          if (totalSessions >= 8) return 10;
          if (totalSessions >= 4) return 5;
          return 0;
     };
     useEffect(() => {
          const basePrice = (bookingData.price || 0) * (bookingData.duration || 1);
          const totalSessions = isRecurring ? (recurringWeeks * selectedDays.length) : 1;
          const subtotal = basePrice * totalSessions;
          const discountPercent = isRecurring ? getRecurringDiscountPercent(totalSessions) : 0;
          const discountAmount = Math.round(subtotal * (discountPercent / 100));
          const total = subtotal - discountAmount;
          const deposit = Math.round(total * (bookingData.depositPercent || 0));
          const remaining = Math.max(0, total - deposit);
          setBookingData(prev => ({
               ...prev,
               totalPrice: total,
               depositAmount: deposit,
               remainingAmount: remaining,
               totalSessions: totalSessions,
               discountPercent,
               discountAmount
          }));
     }, [bookingData.price, bookingData.duration, bookingData.depositPercent, isRecurring, recurringWeeks, selectedDays]);

     // Cập nhật bookingData khi fieldData thay đổi
     useEffect(() => {
          if (fieldData) {
               setBookingData(prev => ({
                    ...prev,
                    fieldId: fieldData.fieldId || prev.fieldId,
                    fieldName: fieldData.fieldName || prev.fieldName,
                    fieldAddress: fieldData.fieldAddress || prev.fieldAddress,
                    date: fieldData.date || prev.date,
                    slotId: fieldData.slotId || prev.slotId,
                    slotName: fieldData.slotName || prev.slotName,
                    duration: fieldData.duration || prev.duration,
                    price: fieldData.price || prev.price,
                    totalPrice: fieldData.totalPrice || fieldData.price || prev.price
               }));

               // Initialize recurring presets from caller (right panel)
               if (fieldData.isRecurringPreset !== undefined) {
                    setIsRecurring(!!fieldData.isRecurringPreset);
               }
               if (typeof fieldData.recurringWeeksPreset === 'number' && fieldData.recurringWeeksPreset > 0) {
                    setRecurringWeeks(fieldData.recurringWeeksPreset);
               }
               if (Array.isArray(fieldData.selectedDaysPreset)) {
                    setSelectedDays(fieldData.selectedDaysPreset);
               }
          }
     }, [fieldData]);

     // Reset khi modal mở/đóng, nhưng giữ preset định kỳ nếu được truyền vào
     useEffect(() => {
          if (isOpen) {
               setStep("details");
               setErrors({});
               setPaymentMethod("");
               setPendingInfo(null);
               if (fieldData?.isRecurringPreset) {
                    setIsRecurring(true);
                    if (typeof fieldData.recurringWeeksPreset === 'number' && fieldData.recurringWeeksPreset > 0) {
                         setRecurringWeeks(fieldData.recurringWeeksPreset);
                    } else {
                         setRecurringWeeks(4);
                    }
                    if (Array.isArray(fieldData.selectedDaysPreset)) {
                         setSelectedDays(fieldData.selectedDaysPreset);
                    } else {
                         setSelectedDays([]);
                    }
               } else {
                    setIsRecurring(false);
                    setRecurringWeeks(4);
                    setSelectedDays([]);
               }
          }
     }, [isOpen, fieldData]);

     const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

     const validateForm = () => {
          const validation = validateBookingData(bookingData);
          setErrors(validation.errors);
          return validation.isValid;
     };

     const handleInputChange = (field, value) => {
          setBookingData(prev => ({ ...prev, [field]: value }));
          // Clear error when user starts typing
          if (errors[field]) {
               setErrors(prev => ({ ...prev, [field]: "" }));
          }
     };

     const handleDayToggle = (day) => {
          setSelectedDays(prev =>
               prev.includes(day)
                    ? prev.filter(d => d !== day)
                    : [...prev, day]
          );
     };

     // Suggest alternative weekdays for recurring schedule based on availability
     useEffect(() => {
          async function computeSuggestions() {
               try {
                    setIsSuggesting(true);
                    setSuggestedDays([]);
                    if (!isRecurring) return;
                    const fieldId = bookingData.fieldId;
                    const slotId = bookingData.slotId;
                    const startDateStr = bookingData.date;
                    if (!fieldId || !slotId || !startDateStr) return;

                    const startDate = new Date(startDateStr + "T00:00:00");
                    const weeks = Math.max(1, parseInt(recurringWeeks));

                    function formatDate(d) {
                         const y = d.getFullYear();
                         const m = String(d.getMonth() + 1).padStart(2, "0");
                         const day = String(d.getDate()).padStart(2, "0");
                         return `${y}-${m}-${day}`;
                    }

                    function getFirstOccurrence(start, weekday) {
                         const s = new Date(start);
                         const sW = s.getDay();
                         const diff = (weekday - sW + 7) % 7;
                         s.setDate(s.getDate() + diff);
                         s.setHours(0, 0, 0, 0);
                         return s;
                    }

                    const candidates = [0, 1, 2, 3, 4, 5, 6].filter(w => !selectedDays.includes(w));
                    const scored = await Promise.all(candidates.map(async (w) => {
                         const first = getFirstOccurrence(startDate, w);
                         const checks = [];
                         for (let i = 0; i < weeks; i += 1) {
                              const d = new Date(first);
                              d.setDate(d.getDate() + i * 7);
                              checks.push(checkFieldAvailability(fieldId, formatDate(d), bookingData.slotId));
                         }
                         const results = await Promise.all(checks);
                         const availableCount = results.filter(r => r && r.available).length;
                         const ratio = availableCount / Math.max(1, weeks);
                         return { weekday: w, ratio };
                    }));

                    const good = scored
                         .filter(s => s.ratio >= 0.7)
                         .sort((a, b) => b.ratio - a.ratio)
                         .slice(0, 3)
                         .map(s => s.weekday);
                    setSuggestedDays(good);
               } catch {
                    setSuggestedDays([]);
               } finally {
                    setIsSuggesting(false);
               }
          }
          computeSuggestions();
     }, [isRecurring, bookingData.fieldId, bookingData.slotId, bookingData.date, recurringWeeks, selectedDays]);

     const handlePayment = async () => {
          if (!validateForm()) return;

          setIsProcessing(true);
          try {
               const booking = {
                    ...bookingData,
                    recurring: isRecurring ? {
                         weeks: recurringWeeks,
                         endDate: new Date(Date.now() + recurringWeeks * 7 * 24 * 60 * 60 * 1000).toISOString()
                    } : null
               };

               if (booking.requiresEmail && !booking.customerEmail) {
                    setShowEmailVerification(true);
                    setIsProcessing(false);
                    return;
               }

               // Check availability before holding
               const avail = await checkFieldAvailability(booking.fieldId, booking.date, booking.slotId);
               if (!avail?.available) {
                    setErrors({ general: avail?.message || "Sân đã có người đặt trong khung giờ này." });
                    setIsProcessing(false);
                    return;
               }

               const result = await createPendingBooking(booking);
               setPendingInfo(result);
               setStep("payment");
          } catch (error) {
               console.error("Booking error:", error);
               const code = error?.code;
               let msg = "Có lỗi xảy ra khi đặt sân. Vui lòng thử lại.";
               if (code === "DURATION_LIMIT") msg = "Thời lượng vượt giới hạn (tối đa 1 tiếng 30 phút).";
               if (code === "CONFLICT") msg = "Khung giờ đã có người khác giữ hoặc đặt. Chọn khung giờ khác.";
               if (code === "VALIDATION_ERROR") msg = error?.message || msg;
               setErrors({ general: msg });
          } finally {
               setIsProcessing(false);
          }
     };

     const handleConfirmPayment = async () => {
          if (!paymentMethod) {
               setErrors({ payment: "Vui lòng chọn phương thức thanh toán" });
               return;
          }

          setIsProcessing(true);
          try {
               const result = await confirmPayment(pendingInfo.bookingId, paymentMethod);

               // Save to local storage
               createBooking({
                    userId: user?.id || user?.userId || "guest",
                    data: {
                         ...bookingData,
                         bookingId: result.bookingId,
                         status: "confirmed",
                         paymentMethod,
                         createdAt: new Date().toISOString()
                    }
               });

               // Auto-create find-opponent request/post if user marked no opponent
               if (false) {
                    try {
                         const req = createMatchRequest({
                              bookingId: result.bookingId,
                              ownerId: user?.id || user?.userId || "guest",
                              level: "any",
                              note: `${bookingData.fieldName} • ${bookingData.date} • ${bookingData.slotName}`
                         });
                         setCreatedMatchRequest(req);
                    } catch { /* ignore */ }
                    try {
                         const post = createCommunityPost({
                              userId: user?.id || user?.userId || "guest",
                              content: `Tìm đối cho trận ${bookingData.fieldName} – ${bookingData.slotName}`,
                              location: bookingData.fieldAddress,
                              time: `${bookingData.date} ${bookingData.slotName}`
                         });
                         setCreatedCommunityPost(post);
                    } catch { /* ignore */ }
               }

               setStep("confirmation");
          } catch (error) {
               console.error("Payment error:", error);
               const code = error?.code;
               let msg = "Có lỗi xảy ra khi thanh toán. Vui lòng thử lại.";
               if (code === "EXPIRED") msg = "Mã QR đã hết hạn. Vui lòng giữ chỗ lại.";
               if (code === "HOLD_NOT_FOUND") msg = "Phiên thanh toán không hợp lệ hoặc đã hết hạn.";
               setErrors({ general: msg });
          } finally {
               setIsProcessing(false);
          }
     };

     const handleEmailVerificationSuccess = () => {
          setShowEmailVerification(false);
          handlePayment();
     };

     if (!isOpen) return null;

     return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
               <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                         <h2 className="text-2xl font-bold text-teal-800">
                              {bookingType === "complex" ? "Đặt Sân Lớn" :
                                   bookingType === "quick" ? "Đặt Nhanh" : "Đặt Sân"}
                         </h2>
                         <Button
                              onClick={onClose}
                              variant="ghost"
                              className="p-2 h-auto"
                         >
                              <X className="w-5 h-5" />
                         </Button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                         {errors.general && (
                              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                                   <AlertCircle className="w-5 h-5 text-red-500" />
                                   <span className="text-red-700">{errors.general}</span>
                              </div>
                         )}

                         {step === "details" && (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                   {/* Left Column - Field Info + Contact Form */}
                                   <div className="space-y-6">
                                        {/* Field Information */}
                                        <div className="bg-teal-50 rounded-lg p-4">
                                             <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                                  <MapPin className="w-5 h-5 mr-2 text-teal-600" />
                                                  Thông tin đặt sân
                                             </h3>
                                             <div className="space-y-3">
                                                  <div>
                                                       <h4 className="font-semibold text-lg text-teal-600 mb-2">{bookingData.fieldName}</h4>
                                                       <div className="flex items-center text-gray-600 mb-1">
                                                            <MapPin className="w-4 h-4 mr-2 text-teal-600" />
                                                            <span className="text-sm font-medium">{bookingData.fieldAddress}</span>
                                                       </div>
                                                       {bookingData.fieldType && (
                                                            <div className="text-sm text-gray-500 font-medium">
                                                                 <span className="font-medium">Loại:</span> {bookingData.fieldType}
                                                                 {bookingData.fieldSize && ` - ${bookingData.fieldSize}`}
                                                            </div>
                                                       )}
                                                  </div>
                                                  <div className="space-y-2 text-sm">
                                                       <div className="flex justify-between">
                                                            <span className="text-gray-600 flex items-center">
                                                                 <span className="mr-2">📅</span>
                                                                 Ngày
                                                            </span>
                                                            <span className="font-medium">{bookingData.date}</span>
                                                       </div>
                                                       {bookingData.slotName && (
                                                            <div className="flex justify-between">
                                                                 <span className="text-gray-600 flex items-center">
                                                                      <span className="mr-2">⏰</span>
                                                                      Thời gian
                                                                 </span>
                                                                 <span className="font-medium">{bookingData.slotName}</span>
                                                            </div>
                                                       )}
                                                       <div className="flex justify-between">
                                                            <span className="text-gray-600 flex items-center">
                                                                 <span className="mr-2">⏱️</span>
                                                                 Thời lượng
                                                            </span>
                                                            <span className="font-medium">{bookingData.duration} giờ</span>
                                                       </div>
                                                       {isRecurring && (
                                                            <div className="mt-3 p-3 bg-teal-100 rounded-lg">
                                                                 <div className="flex justify-between">
                                                                      <span className="text-gray-600 flex items-center">
                                                                           <span className="mr-2">📅</span>
                                                                           Số tuần
                                                                      </span>
                                                                      <span className="font-medium text-teal-600">{recurringWeeks} tuần</span>
                                                                 </div>
                                                                 {selectedDays.length > 0 && (
                                                                      <div className="flex justify-between">
                                                                           <span className="text-gray-600 flex items-center">
                                                                                <span className="mr-2">🗓️</span>
                                                                                Ngày trong tuần
                                                                           </span>
                                                                           <span className="font-medium text-teal-600">
                                                                                {selectedDays.map(day => {
                                                                                     const dayNames = { 0: "CN", 1: "T2", 2: "T3", 3: "T4", 4: "T5", 5: "T6", 6: "T7" };
                                                                                     return dayNames[day];
                                                                                }).join(", ")}
                                                                           </span>
                                                                      </div>
                                                                 )}
                                                                 <div className="flex justify-between">
                                                                      <span className="text-gray-600 flex items-center">
                                                                           <span className="mr-2">🎯</span>
                                                                           Tổng số buổi
                                                                      </span>
                                                                      <span className="font-medium text-teal-600">{bookingData.totalSessions || (recurringWeeks * selectedDays.length)} buổi</span>
                                                                 </div>
                                                                 {/* Preview danh sách buổi */}
                                                                 <div className="mt-3 bg-white/70 rounded-lg p-2  border border-teal-200">
                                                                      <div className="text-xs text-gray-600 font-semibold mb-1">Lịch các buổi dự kiến</div>
                                                                      <div className="overflow-y-auto max-h-24 scrollbar-thin scrollbar-thumb-teal-200 scrollbar-track-white space-y-1 text-xs">
                                                                           {generateRecurringSessions().map((s, idx) => (
                                                                                <div key={idx} className="flex justify-between">
                                                                                     <span>{s.date.toLocaleDateString('vi-VN')}</span>
                                                                                     <span className="text-teal-700">{s.slotName}</span>
                                                                                </div>
                                                                           ))}
                                                                           {generateRecurringSessions().length === 0 && (
                                                                                <div className="text-gray-500">Chọn ngày trong tuần để xem danh sách buổi</div>
                                                                           )}
                                                                      </div>
                                                                 </div>
                                                            </div>
                                                       )}
                                                  </div>
                                             </div>
                                        </div>

                                        {/* Contact Form */}
                                        <div className="bg-teal-50 rounded-lg p-4">
                                             <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                                  <User className="w-5 h-5 mr-2 text-teal-600" />
                                                  Thông tin liên hệ
                                             </h3>
                                             <div className="space-y-4">
                                                  <div>
                                                       <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            <User className="w-4 h-4 inline mr-1" />
                                                            Họ và tên *
                                                       </label>
                                                       <Input
                                                            value={bookingData.customerName}
                                                            onChange={(e) => handleInputChange("customerName", e.target.value)}
                                                            className={errors.customerName ? "border-red-500" : ""}
                                                            placeholder="Nhập họ và tên"
                                                       />
                                                       {errors.customerName && (
                                                            <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>
                                                       )}
                                                  </div>

                                                  <div>
                                                       <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            <Phone className="w-4 h-4 inline mr-1" />
                                                            Số điện thoại *
                                                       </label>
                                                       <Input
                                                            value={bookingData.customerPhone}
                                                            onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                                                            className={errors.customerPhone ? "border-red-500" : ""}
                                                            placeholder="Nhập số điện thoại"
                                                       />
                                                       {errors.customerPhone && (
                                                            <p className="text-red-500 text-sm mt-1">{errors.customerPhone}</p>
                                                       )}
                                                  </div>

                                                  <div>
                                                       <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            <Mail className="w-4 h-4 inline mr-1" />
                                                            Email {bookingData.requiresEmail ? "*" : ""}
                                                       </label>
                                                       <Input
                                                            type="email"
                                                            value={bookingData.customerEmail}
                                                            onChange={(e) => handleInputChange("customerEmail", e.target.value)}
                                                            className={errors.customerEmail ? "border-red-500" : ""}
                                                            placeholder={bookingData.requiresEmail ? "Nhập email (bắt buộc)" : "Nhập email (tùy chọn)"}
                                                       />
                                                       {errors.customerEmail && (
                                                            <p className="text-red-500 text-sm mt-1">{errors.customerEmail}</p>
                                                       )}
                                                       {bookingData.requiresEmail && (
                                                            <p className="text-gray-500 text-sm mt-1">Email cần thiết để xác nhận đặt sân</p>
                                                       )}
                                                  </div>

                                                  <div>
                                                       <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
                                                       <Textarea
                                                            value={bookingData.notes}
                                                            onChange={(e) => handleInputChange("notes", e.target.value)}
                                                            placeholder="Ghi chú thêm (nếu có)"
                                                            rows={3}
                                                       />
                                                  </div>
                                             </div>
                                        </div>
                                   </div>

                                   {/* Right Column - Recurring Options + Price Summary + Button */}
                                   <div className="space-y-6">
                                        {/* Opponent section removed per requirement */}
                                        {/* Recurring Booking Toggle */}
                                        <div className="bg-teal-50 rounded-lg p-4">
                                             <div className="flex items-center justify-between mb-3">
                                                  <div className="flex items-center gap-2">
                                                       <Repeat className="w-5 h-5 text-teal-600" />
                                                       <span className="font-medium text-teal-800">Đặt lịch cố định hàng tuần</span>
                                                  </div>
                                                  <label className="relative inline-flex items-center cursor-pointer">
                                                       <input
                                                            type="checkbox"
                                                            checked={isRecurring}
                                                            onChange={(e) => {
                                                                 setIsRecurring(e.target.checked);
                                                                 setBookingData(prev => ({ ...prev, isRecurring: e.target.checked }));
                                                            }}
                                                            className="sr-only peer"
                                                       />
                                                       <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                                                  </label>
                                             </div>
                                             {isRecurring && (
                                                  <div className="space-y-3">
                                                       <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                 Số tuần đặt lịch
                                                            </label>
                                                            <Select
                                                                 value={recurringWeeks.toString()}
                                                                 onValueChange={(value) => {
                                                                      const weeks = parseInt(value);
                                                                      setRecurringWeeks(weeks);
                                                                      setBookingData(prev => ({ ...prev, recurringWeeks: weeks }));
                                                                 }}
                                                            >
                                                                 <SelectTrigger className="w-full">
                                                                      <SelectValue placeholder="Chọn số tuần" />
                                                                 </SelectTrigger>
                                                                 <SelectContent>
                                                                      <SelectItem value="4">4 tuần</SelectItem>
                                                                      <SelectItem value="8">8 tuần</SelectItem>
                                                                      <SelectItem value="12">12 tuần</SelectItem>
                                                                      <SelectItem value="16">16 tuần</SelectItem>
                                                                      <SelectItem value="20">20 tuần</SelectItem>
                                                                 </SelectContent>
                                                            </Select>
                                                       </div>

                                                       <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                 Chọn ngày trong tuần
                                                            </label>
                                                            <div className="grid grid-cols-7 gap-2">
                                                                 {[
                                                                      { value: 1, label: "T2", name: "Thứ 2" },
                                                                      { value: 2, label: "T3", name: "Thứ 3" },
                                                                      { value: 3, label: "T4", name: "Thứ 4" },
                                                                      { value: 4, label: "T5", name: "Thứ 5" },
                                                                      { value: 5, label: "T6", name: "Thứ 6" },
                                                                      { value: 6, label: "T7", name: "Thứ 7" },
                                                                      { value: 0, label: "CN", name: "Chủ nhật" }
                                                                 ].map((day) => (
                                                                      <Button
                                                                           key={day.value}
                                                                           type="button"
                                                                           onClick={() => handleDayToggle(day.value)}
                                                                           variant={selectedDays.includes(day.value) ? "default" : "outline"}
                                                                           size="sm"
                                                                           className={`p-2 text-sm font-medium ${selectedDays.includes(day.value)
                                                                                ? "bg-teal-500 text-white border-teal-500 hover:bg-teal-600"
                                                                                : "bg-white text-gray-700 hover:text-teal-500 hover:bg-teal-50 border-teal-300"
                                                                                }`}
                                                                           title={day.name}
                                                                      >
                                                                           {day.label}
                                                                      </Button>
                                                                 ))}
                                                            </div>
                                                            {selectedDays.length === 0 && (
                                                                 <p className="text-red-500 text-sm mt-1">Vui lòng chọn ít nhất một ngày</p>
                                                            )}
                                                            {/* Suggestions for other days */}
                                                            {isRecurring && suggestedDays.length > 0 && (
                                                                 <div className="mt-3">
                                                                      <div className="text-xs text-gray-600 mb-1">Gợi ý ngày khác (phù hợp):</div>
                                                                      <div className="flex flex-wrap gap-2">
                                                                           {[
                                                                                { value: 1, label: "T2" },
                                                                                { value: 2, label: "T3" },
                                                                                { value: 3, label: "T4" },
                                                                                { value: 4, label: "T5" },
                                                                                { value: 5, label: "T6" },
                                                                                { value: 6, label: "T7" },
                                                                                { value: 0, label: "CN" }
                                                                           ]
                                                                                .filter(d => suggestedDays.includes(d.value))
                                                                                .map(d => (
                                                                                     <Button key={d.value} type="button" onClick={() => handleDayToggle(d.value)} className="px-2 py-1 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100">
                                                                                          + {d.label}
                                                                                     </Button>
                                                                                ))}
                                                                      </div>
                                                                 </div>
                                                            )}
                                                            {isRecurring && isSuggesting && (
                                                                 <div className="mt-2 text-xs text-gray-500">Đang gợi ý ngày phù hợp…</div>
                                                            )}
                                                       </div>

                                                       <div className="text-sm text-teal-700">
                                                            <CalendarDays className="w-4 h-4 inline mr-1" />
                                                            Sẽ tạo {recurringWeeks * selectedDays.length} đặt sân cho {recurringWeeks} tuần liên tiếp
                                                            {selectedDays.length > 0 && (
                                                                 <span className="block mt-1">
                                                                      ({selectedDays.length} ngày/tuần × {recurringWeeks} tuần = {recurringWeeks * selectedDays.length} buổi)
                                                                 </span>
                                                            )}
                                                       </div>
                                                  </div>
                                             )}
                                        </div>

                                        {/* Price Summary */}
                                        <div className="bg-teal-50 rounded-lg p-4">
                                             <h4 className=" text-gray-900 mb-3 flex font-bold justify-center text-lg items-center">
                                                  <span className="text-lg mr-2">💰</span>
                                                  Chi phí
                                             </h4>
                                             <div className="space-y-2 text-sm">
                                                  <div className="flex justify-between">
                                                       <span className="text-gray-600 font-medium flex items-center">
                                                            <span className="mr-2">💵</span>
                                                            Giá/giờ
                                                       </span>
                                                       <span className="font-medium">{formatPrice(bookingData.price)}</span>
                                                  </div>
                                                  {isRecurring && (
                                                       <div className="flex justify-between">
                                                            <span className="text-gray-600 font-medium flex items-center">
                                                                 <span className="mr-2">🎯</span>
                                                                 Số buổi
                                                            </span>
                                                            <span className="font-medium">{bookingData.totalSessions || (recurringWeeks * selectedDays.length)} buổi</span>
                                                       </div>
                                                  )}
                                                  <div className="flex justify-between">
                                                       <span className="text-gray-600 font-medium flex items-center">
                                                            <span className="mr-2">💸</span>
                                                            Giá mỗi buổi
                                                       </span>
                                                       <span className="font-medium">{formatPrice((bookingData.price || 0) * (bookingData.duration || 1))}</span>
                                                  </div>
                                                  {isRecurring && (
                                                       <div className="flex justify-between">
                                                            <span className="text-gray-600 font-medium flex items-center">
                                                                 <span className="mr-2">📊</span>
                                                                 Tổng giá ({bookingData.totalSessions || (recurringWeeks * selectedDays.length)} buổi)
                                                            </span>
                                                            <span className="font-medium">{formatPrice(((bookingData.price || 0) * (bookingData.duration || 1)) * (bookingData.totalSessions || (recurringWeeks * selectedDays.length)))}</span>
                                                       </div>
                                                  )}
                                                  {isRecurring && bookingData.discountPercent > 0 && (
                                                       <div className="flex justify-between">
                                                            <span className="text-emerald-700 font-medium flex items-center">
                                                                 <span className="mr-2">🎁</span>
                                                                 Giảm giá ({bookingData.discountPercent}%)
                                                            </span>
                                                            <span className="font-medium text-emerald-700">- {formatPrice(bookingData.discountAmount)}</span>
                                                       </div>
                                                  )}
                                                  {bookingData.depositAmount > 0 && (
                                                       <div className="flex justify-between">
                                                            <span className="text-yellow-600 font-medium flex items-center">
                                                                 <span className="mr-2">🏦</span>
                                                                 Tiền cọc (30%)
                                                            </span>
                                                            <span className="font-medium text-yellow-600">{formatPrice(bookingData.depositAmount)}</span>
                                                       </div>
                                                  )}
                                                  {bookingData.remainingAmount > 0 && (
                                                       <div className="flex justify-between">
                                                            <span className="text-blue-600 font-medium flex items-center">
                                                                 <span className="mr-2">💳</span>
                                                                 Còn lại
                                                            </span>
                                                            <span className="font-medium text-blue-600">{formatPrice(bookingData.remainingAmount)}</span>
                                                       </div>
                                                  )}
                                                  <div className="flex justify-between pt-2 border-t border-teal-200">
                                                       <span className="font-bold text-gray-900 flex items-center">
                                                            <span className="mr-2">🎉</span>
                                                            Tổng cộng
                                                       </span>
                                                       <span className="font-bold text-lg text-teal-600">{formatPrice(bookingData.totalPrice)}</span>
                                                  </div>
                                             </div>
                                        </div>

                                        {/* Submit Button */}
                                        <Button
                                             onClick={handlePayment}
                                             disabled={isProcessing}
                                             className={`w-full py-3 rounded-lg text-white font-semibold ${isProcessing ? "bg-gray-400" : "bg-teal-600 hover:bg-teal-700"}`}
                                        >
                                             {isProcessing ? "Đang xử lý..." :
                                                  isRecurring ? `Giữ chỗ ${recurringWeeks} tuần & tiếp tục thanh toán` :
                                                       "Giữ chỗ & tiếp tục thanh toán"
                                             }
                                        </Button>
                                   </div>
                              </div>
                         )}

                         {step === "payment" && (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                   {/* Payment Methods */}
                                   <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Phương thức thanh toán</h3>
                                        {pendingInfo && (
                                             <div className="mb-6 p-4 border border-teal-200 rounded-lg bg-teal-50">
                                                  <div className="flex items-center justify-between">
                                                       <div>
                                                            <div className="text-sm text-teal-700">Mã đặt chỗ tạm thời</div>
                                                            <div className="text-lg font-semibold text-teal-800">#{pendingInfo.bookingId}</div>
                                                            <div className="text-xs text-teal-600">Hết hạn: {new Date(pendingInfo.qrExpiresAt).toLocaleTimeString()}</div>
                                                       </div>
                                                       <img src={pendingInfo.qrCodeUrl} alt="QR" className="w-24 h-24" />
                                                  </div>
                                             </div>
                                        )}

                                        <div className="space-y-3">
                                             {[
                                                  { value: "momo", label: "Ví MoMo", color: "bg-pink-500", icon: "M" },
                                                  { value: "vnpay", label: "VNPay", color: "bg-blue-500", icon: "V" },
                                                  { value: "zalopay", label: "ZaloPay", color: "bg-cyan-500", icon: "Z" },
                                                  { value: "banking", label: "Chuyển khoản", color: "bg-green-500", icon: "B" }
                                             ].map((method) => (
                                                  <label key={method.value} className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                                       <input
                                                            type="radio"
                                                            name="payment"
                                                            value={method.value}
                                                            checked={paymentMethod === method.value}
                                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                                            className="mr-3"
                                                       />
                                                       <div className="flex items-center">
                                                            <div className={`w-8 h-8 ${method.color} rounded mr-3 flex items-center justify-center`}>
                                                                 <span className="text-white font-bold text-sm">{method.icon}</span>
                                                            </div>
                                                            <span className="font-medium">{method.label}</span>
                                                       </div>
                                                  </label>
                                             ))}
                                        </div>
                                        {errors.payment && (
                                             <p className="text-red-500 text-sm mt-2">{errors.payment}</p>
                                        )}
                                   </div>

                                   {/* Summary */}
                                   <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tóm tắt đặt sân</h3>
                                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                             {/* Field Information */}
                                             <div className="mb-4 pb-4 border-b border-gray-200">
                                                  <h4 className="font-semibold text-gray-900 mb-2">{bookingData.fieldName}</h4>
                                                  <div className="flex items-center text-gray-600 mb-1">
                                                       <MapPin className="w-4 h-4 mr-2" />
                                                       <span className="text-sm">{bookingData.fieldAddress}</span>
                                                  </div>
                                                  {bookingData.fieldType && (
                                                       <div className="text-sm text-gray-500">
                                                            Loại: {bookingData.fieldType}
                                                            {bookingData.fieldSize && ` - ${bookingData.fieldSize}`}
                                                       </div>
                                                  )}
                                             </div>

                                             {/* Booking Details */}
                                             <div className="space-y-3 text-sm">
                                                  <div className="flex justify-between">
                                                       <span className="text-gray-600">Ngày</span>
                                                       <span className="font-medium">{bookingData.date}</span>
                                                  </div>
                                                  {bookingData.slotName && (
                                                       <div className="flex justify-between">
                                                            <span className="text-gray-600">Thời gian</span>
                                                            <span className="font-medium">{bookingData.slotName}</span>
                                                       </div>
                                                  )}
                                                  <div className="flex justify-between">
                                                       <span className="text-gray-600">Thời lượng</span>
                                                       <span className="font-medium">{bookingData.duration} giờ</span>
                                                  </div>
                                                  {isRecurring && (
                                                       <div className="flex justify-between">
                                                            <span className="text-gray-600">Số tuần</span>
                                                            <span className="font-medium text-teal-600">{recurringWeeks} tuần</span>
                                                       </div>
                                                  )}
                                                  {isRecurring && (
                                                       <div className="flex justify-between">
                                                            <span className="text-gray-600">Tổng số buổi</span>
                                                            <span className="font-medium text-teal-600">{bookingData.totalSessions || (recurringWeeks * selectedDays.length)} buổi</span>
                                                       </div>
                                                  )}
                                             </div>
                                        </div>

                                        {/* Price Summary */}
                                        <div className="bg-teal-50 rounded-lg p-4">
                                             <h4 className="font-semibold text-gray-900 mb-3">Chi phí</h4>
                                             <div className="space-y-2 text-sm">
                                                  <div className="flex justify-between">
                                                       <span className="text-gray-600">Giá/giờ</span>
                                                       <span className="font-medium">{formatPrice(bookingData.price)}</span>
                                                  </div>
                                                  {isRecurring && (
                                                       <div className="flex justify-between">
                                                            <span className="text-gray-600">Số buổi</span>
                                                            <span className="font-medium">{bookingData.totalSessions || (recurringWeeks * selectedDays.length)} buổi</span>
                                                       </div>
                                                  )}
                                                  <div className="flex justify-between">
                                                       <span className="text-gray-600">Giá mỗi buổi</span>
                                                       <span className="font-medium">{formatPrice((bookingData.price || 0) * (bookingData.duration || 1))}</span>
                                                  </div>
                                                  {isRecurring && (
                                                       <div className="flex justify-between">
                                                            <span className="text-gray-600">Tổng giá ({bookingData.totalSessions || (recurringWeeks * selectedDays.length)} buổi)</span>
                                                            <span className="font-medium">{formatPrice((bookingData.price || 0) * (bookingData.duration || 1) * (bookingData.totalSessions || recurringWeeks))}</span>
                                                       </div>
                                                  )}
                                                  {bookingData.depositAmount > 0 && (
                                                       <div className="flex justify-between">
                                                            <span className="text-gray-600">Tiền cọc (30%)</span>
                                                            <span className="font-medium">{formatPrice(bookingData.depositAmount)}</span>
                                                       </div>
                                                  )}
                                                  {bookingData.remainingAmount > 0 && (
                                                       <div className="flex justify-between">
                                                            <span className="text-gray-600">Còn lại</span>
                                                            <span className="font-medium">{formatPrice(bookingData.remainingAmount)}</span>
                                                       </div>
                                                  )}
                                                  <div className="flex justify-between pt-2 border-t border-teal-200">
                                                       <span className="font-semibold text-gray-900">Tổng cộng</span>
                                                       <span className="font-bold text-lg text-teal-600">{formatPrice(bookingData.totalPrice)}</span>
                                                  </div>
                                             </div>
                                        </div>

                                        <Button
                                             onClick={handleConfirmPayment}
                                             disabled={isProcessing}
                                             className={`w-full mt-4 py-3 rounded-lg text-white font-semibold ${isProcessing ? "bg-gray-400" : "bg-teal-600 hover:bg-teal-700"}`}
                                        >
                                             {isProcessing ? "Đang xử lý..." : "Xác nhận thanh toán"}
                                        </Button>
                                   </div>
                              </div>
                         )}

                         {step === "confirmation" && (
                              <div className="text-center py-8">
                                   <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                   <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                        {isRecurring ? `Đặt lịch ${recurringWeeks} tuần thành công!` : "Đặt sân thành công!"}
                                   </h3>
                                   <p className="text-gray-600 mb-6">
                                        {isRecurring
                                             ? `Bạn đã đặt lịch cho ${recurringWeeks} tuần liên tiếp. Có thể xem chi tiết trong mục Lịch sử đặt sân.`
                                             : "Bạn có thể xem chi tiết trong mục Lịch sử đặt sân."
                                        }
                                   </p>
                                   {/* Find opponent CTA when no opponent */}
                                   {false && (
                                        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-800">
                                             <div className="font-semibold mb-1">Đã tạo yêu cầu tìm đối</div>
                                             <div className="text-sm">
                                                  {createdMatchRequest ? `Mã yêu cầu: ${createdMatchRequest.requestId}` : "Yêu cầu đã được mở."}
                                             </div>
                                             <div className="text-sm">
                                                  {createdCommunityPost ? `Đã đăng bài trong Cộng đồng: ${createdCommunityPost.postId}` : "Đang đăng bài trong Cộng đồng..."}
                                             </div>
                                        </div>
                                   )}
                                   <div className="flex gap-4 justify-center">
                                        <Button
                                             onClick={() => {
                                                  onClose();
                                                  onSuccess?.();
                                             }}
                                             className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold"
                                        >
                                             Đóng
                                        </Button>
                                        <Button
                                             onClick={() => {
                                                  onClose();
                                                  if (navigate) {
                                                       if (false && createdCommunityPost) {
                                                            navigate("/community", { state: { highlightPostId: createdCommunityPost.postId, tab: "find-match" } });
                                                       } else {
                                                            navigate("/bookings");
                                                       }
                                                  }
                                             }}
                                             variant="outline"
                                             className="px-6 py-3 rounded-lg"
                                        >
                                             {hasOpponent === "no" ? "Xem bài tìm đối" : "Xem lịch sử đặt sân"}
                                        </Button>
                                   </div>
                              </div>
                         )}
                    </div>

                    {/* Email Verification Modal */}
                    <EmailVerificationModal
                         isOpen={showEmailVerification}
                         onClose={() => setShowEmailVerification(false)}
                         user={user}
                         onSuccess={handleEmailVerificationSuccess}
                         title="Xác thực Email để Đặt Sân"
                    />
               </div>
          </div>
     );
}