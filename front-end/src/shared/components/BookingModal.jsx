import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button, Modal } from "./ui";
import { validateBookingData, checkFieldAvailability, confirmPaymentAPI, generateQRCode } from "../services/bookings";
import { createBooking, createBookingAPI, fetchOwnerBankAccounts } from "../index";
import { createMatchRequest, createCommunityPost } from "../index";
import EmailVerificationModal from "./EmailVerificationModal";
import RecurringOpponentSelection from "./RecurringOpponentSelection";
import FieldInfoSection from "../../roles/player/pages/booking/components/FieldInfoSection";
import ContactFormSection from "../../roles/player/pages/booking/components/ContactFormSection";
import RecurringBookingSection from "../../roles/player/pages/booking/components/RecurringBookingSection";
import PriceSummarySection from "../../roles/player/pages/booking/components/PriceSummarySection";
import PaymentStepSection from "../../roles/player/pages/booking/components/PaymentStepSection";
import ConfirmationStepSection from "../../roles/player/pages/booking/components/ConfirmationStepSection";
import { useModal } from "../../contexts/ModalContext";

export default function BookingModal({
     isOpen,
     onClose,
     fieldData,
     user,
     onSuccess,
     bookingType = "field", // "field" | "complex" | "quick"
     navigate
}) {
     const { openBookingModal, closeBookingModal } = useModal();
     const [step, setStep] = useState("details"); // details | payment | confirmation
     const [isProcessing, setIsProcessing] = useState(false);
     const [errors, setErrors] = useState({});
     const [paymentMethod, setPaymentMethod] = useState("");
     const [bookingInfo, setBookingInfo] = useState(null); // Lưu thông tin booking từ API
     const [ownerBankAccount, setOwnerBankAccount] = useState(null); // Thông tin ngân hàng owner
     const [createdMatchRequest, setCreatedMatchRequest] = useState(null);
     const [createdCommunityPost, setCreatedCommunityPost] = useState(null);
     // Opponent flow: always assume user may find opponent after booking via BookingHistory
     const hasOpponent = "unknown";
     const [showEmailVerification, setShowEmailVerification] = useState(false);
     const [showOpponentSelection, setShowOpponentSelection] = useState(false);
     const [isRecurring, setIsRecurring] = useState(false);
     const [recurringWeeks, setRecurringWeeks] = useState(4);
     const [selectedDays, setSelectedDays] = useState([]);
     const [suggestedDays, setSuggestedDays] = useState([]); // weekdays 0..6
     const [isSuggesting, setIsSuggesting] = useState(false);

     // Prevent layout shift when modal opens by locking body scroll and compensating scrollbar width
     useEffect(() => {
          if (!isOpen) return;
          try {
               const body = document.body;
               const html = document.documentElement;
               const scrollBarWidth = window.innerWidth - html.clientWidth;
               const prevOverflow = body.style.overflow;
               const prevPaddingRight = body.style.paddingRight;
               body.setAttribute("data-prev-overflow", prevOverflow || "");
               body.setAttribute("data-prev-padding-right", prevPaddingRight || "");
               body.style.overflow = "hidden";
               if (scrollBarWidth > 0) {
                    body.style.paddingRight = `${scrollBarWidth}px`;
               }
               return () => {
                    const restoreOverflow = body.getAttribute("data-prev-overflow") || "";
                    const restorePadding = body.getAttribute("data-prev-padding-right") || "";
                    body.style.overflow = restoreOverflow;
                    body.style.paddingRight = restorePadding;
                    body.removeAttribute("data-prev-overflow");
                    body.removeAttribute("data-prev-padding-right");
               };
          } catch {
               // no-op
          }
     }, [isOpen]);

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
               openBookingModal();
               setStep("details");
               setErrors({});
               setPaymentMethod("");
               setBookingInfo(null);
               setOwnerBankAccount(null);
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
          } else {
               closeBookingModal();
          }
     }, [isOpen, fieldData, openBookingModal, closeBookingModal]);

     // Lấy thông tin ngân hàng owner khi modal mở
     useEffect(() => {
          if (!isOpen || !fieldData) return;

          const fetchOwnerBank = async () => {
               try {
                    // Lấy ownerId từ fieldData
                    const ownerId = fieldData.ownerId || fieldData.ownerID;

                    if (ownerId) {
                         const accounts = await fetchOwnerBankAccounts(ownerId);
                         if (accounts && accounts.length > 0) {
                              // Lấy tài khoản mặc định hoặc tài khoản đầu tiên
                              const defaultAccount = accounts.find(acc => acc.isDefault) || accounts[0];
                              setOwnerBankAccount(defaultAccount);
                         }
                    }
               } catch (error) {
                    console.error("Error fetching owner bank account:", error);
               }
          };

          fetchOwnerBank();
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

               // Check availability
               const avail = await checkFieldAvailability(booking.fieldId, booking.date, booking.slotId);
               if (!avail?.available) {
                    setErrors({ general: avail?.message || "Sân đã có người đặt trong khung giờ này." });
                    setIsProcessing(false);
                    return;
               }

               // Gọi API tạo booking trực tiếp (không giữ tiền)
               const userId = user?.id || user?.userId || user?.userID || 0;

               // Tính toán depositAmount nếu chưa có
               const totalPrice = booking.totalPrice || booking.price || 0;
               const depositPercent = booking.depositPercent || 0.3;
               const depositAmount = booking.depositAmount || Math.round(totalPrice * depositPercent);

               console.log("Creating booking with data:", {
                    userId,
                    scheduleId: 0, // Backend tự tạo từ fieldId, slotId, date
                    totalPrice,
                    depositAmount,
                    hasOpponent: booking.hasOpponent || false
               });

               const apiResult = await createBookingAPI({
                    userId: userId,
                    scheduleId: 0, // Backend sẽ tự tạo scheduleId
                    totalPrice: totalPrice,
                    depositAmount: depositAmount,
                    hasOpponent: booking.hasOpponent || false,
                    matchRequestId: booking.matchRequestId || 0
               });

               if (!apiResult.success) {
                    setErrors({ general: apiResult.error || "Không thể tạo booking. Vui lòng thử lại." });
                    setIsProcessing(false);
                    return;
               }

               // Lấy thông tin booking từ API response
               const bookingId = apiResult.data?.bookingID || apiResult.data?.bookingId || apiResult.data?.id;
               if (!bookingId) {
                    setErrors({ general: "Không nhận được booking ID từ server." });
                    setIsProcessing(false);
                    return;
               }

               // Lấy QR code từ API
               const qrResult = await generateQRCode(bookingId);
               const qrCodeUrl = qrResult.success ? qrResult.qrCodeUrl : null;

               // Lưu thông tin booking
               setBookingInfo({
                    bookingId: bookingId,
                    scheduleId: apiResult.data?.scheduleID || apiResult.data?.scheduleId,
                    bookingStatus: apiResult.data?.bookingStatus || "Pending",
                    paymentStatus: apiResult.data?.paymentStatus || "Pending",
                    qrCodeUrl: qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=BOOKING-${bookingId}`,
                    qrExpiresAt: apiResult.data?.qrExpiresAt || new Date(Date.now() + 7 * 60 * 1000).toISOString(),
                    totalPrice: totalPrice,
                    depositAmount: depositAmount
               });

               // Chuyển sang bước thanh toán
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

          if (!bookingInfo?.bookingId) {
               setErrors({ general: "Không tìm thấy thông tin booking." });
               return;
          }

          setIsProcessing(true);
          try {
               // Gọi API xác nhận thanh toán
               const apiResult = await confirmPaymentAPI(bookingInfo.bookingId);

               if (!apiResult.success) {
                    setErrors({ general: apiResult.error || "Không thể xác nhận thanh toán. Vui lòng thử lại." });
                    setIsProcessing(false);
                    return;
               }

               // Cập nhật thông tin booking
               setBookingInfo(prev => ({
                    ...prev,
                    bookingStatus: apiResult.data?.bookingStatus || "Confirmed",
                    paymentStatus: apiResult.data?.paymentStatus || "Paid"
               }));

               // Save to local storage
               createBooking({
                    userId: user?.id || user?.userId || "guest",
                    data: {
                         ...bookingData,
                         bookingId: bookingInfo.bookingId,
                         status: "confirmed",
                         paymentMethod,
                         createdAt: new Date().toISOString()
                    }
               });

               // Handle opponent finding for recurring bookings
               if (isRecurring && generateRecurringSessions().length > 0) {
                    setShowOpponentSelection(true);
               } else {
                    // For single bookings, proceed to confirmation
                    setStep("confirmation");
               }
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

     const handleOpponentSelection = async (option, sessions) => {
          try {
               const baseData = {
                    ownerId: user?.id || user?.userId || "guest",
                    level: "any",
                    fieldName: bookingData.fieldName,
                    address: bookingData.fieldAddress,
                    price: bookingData.price,
                    createdByName: user?.name || "Khách",
                    isRecurring: true,
                    recurringSessions: sessions,
                    recurringType: option
               };

               if (option === "individual") {
                    // Create individual requests for each session
                    const requests = createMatchRequest({
                         ...baseData,
                         note: `Lịch cố định ${bookingData.fieldName} - ${sessions.length} buổi`
                    });
                    setCreatedMatchRequest(requests);
               } else {
                    // Create single request for all sessions or first session
                    const note = option === "all"
                         ? `Lịch cố định ${bookingData.fieldName} - Tất cả ${sessions.length} buổi`
                         : `Lịch cố định ${bookingData.fieldName} - Buổi đầu tiên`;

                    const request = createMatchRequest({
                         ...baseData,
                         note,
                         date: sessions[0]?.date ? (sessions[0].date instanceof Date ? sessions[0].date.toISOString().split('T')[0] : sessions[0].date) : bookingData.date,
                         slotName: sessions[0]?.slotName || bookingData.slotName
                    });
                    setCreatedMatchRequest(request);
               }

               // Also create community post
               try {
                    const post = createCommunityPost({
                         userId: user?.id || user?.userId || "guest",
                         content: `Tìm đối cho lịch cố định ${bookingData.fieldName} - ${sessions.length} buổi`,
                         location: bookingData.fieldAddress,
                         time: `${sessions[0]?.date ? (sessions[0].date instanceof Date ? sessions[0].date.toLocaleDateString("vi-VN") : sessions[0].date) : bookingData.date} ${sessions[0]?.slotName || bookingData.slotName}`,
                         fieldName: bookingData.fieldName,
                         date: bookingData.date,
                         slotName: bookingData.slotName
                    });
                    setCreatedCommunityPost(post);
               } catch { /* ignore */ }

               setStep("confirmation");
          } catch (error) {
               console.error("Error creating opponent requests:", error);
               // Still proceed to confirmation even if opponent creation fails
               setStep("confirmation");
          }
     };

     return (
          <Modal
               isOpen={isOpen}
               onClose={onClose}
               title={bookingType === "complex" ? "Đặt Sân Lớn" : bookingType === "quick" ? "Đặt Nhanh" : "Đặt Sân"}
               className="max-w-6xl z-[100] w-full mx-4 max-h-[90vh] overflow-y-auto rounded-xl"
          >
               <div className="p-2">
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
                                   <FieldInfoSection
                                        bookingData={bookingData}
                                        isRecurring={isRecurring}
                                        recurringWeeks={recurringWeeks}
                                        selectedDays={selectedDays}
                                        generateRecurringSessions={generateRecurringSessions}
                                   />
                                   <ContactFormSection
                                        bookingData={bookingData}
                                        errors={errors}
                                        onInputChange={handleInputChange}
                                   />
                              </div>

                              {/* Right Column - Recurring Options + Price Summary + Button */}
                              <div className="space-y-6">
                                   <RecurringBookingSection
                                        isRecurring={isRecurring}
                                        setIsRecurring={setIsRecurring}
                                        recurringWeeks={recurringWeeks}
                                        setRecurringWeeks={setRecurringWeeks}
                                        selectedDays={selectedDays}
                                        handleDayToggle={handleDayToggle}
                                        suggestedDays={suggestedDays}
                                        isSuggesting={isSuggesting}
                                        generateRecurringSessions={generateRecurringSessions}
                                        onBookingDataChange={handleInputChange}
                                   />
                                   <PriceSummarySection
                                        bookingData={bookingData}
                                        isRecurring={isRecurring}
                                        recurringWeeks={recurringWeeks}
                                        selectedDays={selectedDays}
                                        formatPrice={formatPrice}
                                   />
                                   <Button
                                        onClick={handlePayment}
                                        disabled={isProcessing || (isRecurring && (!bookingData.date || selectedDays.length === 0))}
                                        className={`w-full py-3 rounded-lg text-white font-semibold ${isProcessing || (isRecurring && (!bookingData.date || selectedDays.length === 0)) ? "bg-gray-400" : "bg-teal-600 hover:bg-teal-700"}`}
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
                         <PaymentStepSection
                              bookingInfo={bookingInfo}
                              ownerBankAccount={ownerBankAccount}
                              paymentMethod={paymentMethod}
                              setPaymentMethod={setPaymentMethod}
                              bookingData={bookingData}
                              isRecurring={isRecurring}
                              recurringWeeks={recurringWeeks}
                              selectedDays={selectedDays}
                              errors={errors}
                              isProcessing={isProcessing}
                              formatPrice={formatPrice}
                              onConfirmPayment={handleConfirmPayment}
                         />
                    )}

                    {step === "confirmation" && (
                         <ConfirmationStepSection
                              isRecurring={isRecurring}
                              recurringWeeks={recurringWeeks}
                              hasOpponent={hasOpponent}
                              createdMatchRequest={createdMatchRequest}
                              createdCommunityPost={createdCommunityPost}
                              onClose={onClose}
                              onSuccess={onSuccess}
                              navigate={navigate}
                         />
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

               {/* Recurring Opponent Selection Modal */}
               {showOpponentSelection && (
                    <RecurringOpponentSelection
                         isRecurring={isRecurring}
                         recurringSessions={generateRecurringSessions()}
                         onOpponentSelection={handleOpponentSelection}
                         onClose={() => setShowOpponentSelection(false)}
                    />
               )}
          </Modal>
     );
}