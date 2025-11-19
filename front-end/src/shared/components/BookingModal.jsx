import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button, Modal } from "./ui";
import { validateBookingData, checkFieldAvailability, generateQRCode } from "../services/bookings";
import { createBooking, createBookingAPI, fetchOwnerBankAccounts, fetchBankAccount } from "../index";
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
     const [bookingInfo, setBookingInfo] = useState(null); // Lưu thông tin booking từ API
     const [ownerBankAccount, setOwnerBankAccount] = useState(null); // Thông tin ngân hàng owner
     const [paymentAmountType, setPaymentAmountType] = useState(""); // deposit | full
     const [isQrGenerating, setIsQrGenerating] = useState(false);
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
          ownerName: fieldData?.ownerName || "",
          bankAccountId: fieldData?.bankAccountId || fieldData?.BankAccountId || null,
          bankName: fieldData?.bankName || "",
          bankShortCode: fieldData?.bankShortCode || "",
          accountNumber: fieldData?.accountNumber || "",
          accountHolder: fieldData?.accountHolder || "",
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
                    ownerName: fieldData.ownerName || prev.ownerName,
                    bankAccountId: fieldData.bankAccountId || fieldData.BankAccountId || prev.bankAccountId,
                    bankName: fieldData.bankName || prev.bankName,
                    bankShortCode: fieldData.bankShortCode || prev.bankShortCode,
                    accountNumber: fieldData.accountNumber || prev.accountNumber,
                    accountHolder: fieldData.accountHolder || prev.accountHolder,
                    date: fieldData.date || prev.date,
                    slotId: fieldData.slotId || prev.slotId,
                    slotName: fieldData.slotName || prev.slotName,
                    scheduleId: fieldData.scheduleId || prev.scheduleId || 0, // Thêm scheduleId
                    duration: fieldData.duration || prev.duration,
                    price: fieldData.price || prev.price,
                    totalPrice: fieldData.totalPrice || fieldData.price || prev.price,
                    fieldSchedules: fieldData.fieldSchedules || prev.fieldSchedules // Thêm fieldSchedules
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
               setBookingInfo(null);
               setOwnerBankAccount(null);
               setPaymentAmountType("");
               setIsQrGenerating(false);
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

     const buildFallbackAccount = (data) => {
          if (!data) return null;
          const shortCode = data.bankShortCode || "";
          const baseName = data.bankName || "";
          const composedName = baseName
               ? (shortCode ? `${shortCode} - ${baseName}` : baseName)
               : shortCode;
          const accountNumber = data.accountNumber || "";
          const accountHolder = data.accountHolder || data.ownerName || "";
          if (!composedName && !accountNumber && !accountHolder) return null;
          return {
               bankAccountId: data.bankAccountId || data.BankAccountId || null,
               ownerId: data.ownerId || data.ownerID || null,
               bankName: composedName,
               bankShortCode: shortCode,
               accountNumber,
               accountHolder
          };
     };

     // Lấy thông tin ngân hàng dựa vào BankAccountID (ưu tiên) hoặc owner
     useEffect(() => {
          if (!isOpen || !fieldData) return;
          let ignore = false;

          const fetchBankInfo = async () => {
               try {
                    if (fieldData.bankAccountId || fieldData.BankAccountId) {
                         const account = await fetchBankAccount(fieldData.bankAccountId || fieldData.BankAccountId);
                         if (!ignore && account) {
                              setOwnerBankAccount(account);
                              return;
                         }
                    }

                    const fallback = buildFallbackAccount(fieldData);
                    if (fallback) {
                         if (!ignore) setOwnerBankAccount(fallback);
                         return;
                    }

                    const ownerId = fieldData.ownerId || fieldData.ownerID;
                    if (ownerId) {
                         const accounts = await fetchOwnerBankAccounts(ownerId);
                         if (!ignore && accounts && accounts.length > 0) {
                              const defaultAccount = accounts.find(acc => acc.isDefault) || accounts[0];
                              setOwnerBankAccount(defaultAccount);
                              return;
                         }
                    }
               } catch (error) {
                    console.error("Error fetching owner bank account:", error);
                    const fallback = buildFallbackAccount(fieldData);
                    if (!ignore && fallback) {
                         setOwnerBankAccount(fallback);
                    }
               }
          };

          fetchBankInfo();
          return () => { ignore = true; };
     }, [isOpen, fieldData]);

     useEffect(() => {
          if (paymentAmountType === "deposit" && (bookingData.depositAmount || 0) <= 0) {
               setPaymentAmountType("");
          }
     }, [paymentAmountType, bookingData.depositAmount]);

     const buildLocalQrUrl = (amount) => {
          if (!ownerBankAccount?.accountNumber || !ownerBankAccount?.bankShortCode) return null;
          const normalizedCode = String(ownerBankAccount.bankShortCode).replace(/\s+/g, "").toUpperCase();
          const accountNumber = String(ownerBankAccount.accountNumber).replace(/\s+/g, "");
          if (!normalizedCode || !accountNumber) return null;

          const base = `https://img.vietqr.io/image/${normalizedCode}-${accountNumber}-compact2.png`;
          const params = new URLSearchParams({
               amount: Math.round(Number(amount) || 0),
               addInfo: `BOOKING-${bookingInfo?.bookingId || ""}`
          });
          if (ownerBankAccount.accountHolder) {
               params.set("accountName", ownerBankAccount.accountHolder);
          }
          return `${base}?${params.toString()}`;
     };

     const handlePaymentAmountChange = async (type) => {
          if (type === paymentAmountType || !bookingInfo?.bookingId) {
               setPaymentAmountType(type);
               return;
          }

          const targetAmount = type === "full"
               ? (bookingData.totalPrice || 0)
               : (bookingData.depositAmount || 0);

          if (!targetAmount || targetAmount <= 0) {
               setErrors(prev => ({ ...prev, payment: "Số tiền không hợp lệ để tạo QR." }));
               return;
          }

          setPaymentAmountType(type);
          setErrors(prev => ({ ...prev, payment: "" }));
          setIsQrGenerating(true);
          try {
               const localUrl = buildLocalQrUrl(targetAmount);
               if (localUrl) {
                    setBookingInfo(prev => ({
                         ...prev,
                         qrCodeUrl: localUrl,
                         qrExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
                    }));
               } else {
                    const qrResult = await generateQRCode(bookingInfo.bookingId, {
                         paymentType: type,
                         amount: targetAmount
                    });

                    if (qrResult?.success && qrResult.qrCodeUrl) {
                         setBookingInfo(prev => ({
                              ...prev,
                              qrCodeUrl: qrResult.qrCodeUrl,
                              qrExpiresAt: qrResult.data?.qrExpiresAt || new Date(Date.now() + 7 * 60 * 1000).toISOString()
                         }));
                    } else {
                         setErrors(prev => ({ ...prev, payment: "Không thể tạo QR. Vui lòng thử lại." }));
                    }
               }
          } catch (error) {
               console.error("Failed to regenerate QR code:", error);
               setErrors(prev => ({ ...prev, payment: "Không thể tạo QR. Vui lòng thử lại." }));
          } finally {
               setIsQrGenerating(false);
          }
     };

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

          // Check if user is logged in
          if (!user) {
               setErrors({ general: "Bạn cần đăng nhập để tạo booking. Vui lòng đăng nhập trước." });
               return;
          }

          // Check if user is a player
          const userRole = user?.role || user?.Role || user?.roleName || user?.RoleName;
          const roleId = user?.roleId || user?.roleID || user?.RoleId || user?.RoleID;
          const isPlayer = roleId === 3 || 
                          userRole?.toLowerCase() === 'player' || 
                          userRole?.toLowerCase() === 'người chơi' ||
                          userRole === 'Player';
          
          if (!isPlayer) {
               console.warn("⚠️ [GỬI GIỮ CHỖ] User is not a player:", { userRole, roleId, user });
               setErrors({ general: "Chỉ người chơi (Player) mới có thể tạo booking. Vui lòng đăng nhập bằng tài khoản người chơi." });
               return;
          }

          console.log("✅ [GỬI GIỮ CHỖ] User validated - is a player:", { userRole, roleId, userId: user?.id || user?.userId });

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
               const userId = user?.id || user?.userId || user?.userID;
               if (!userId) {
                    setErrors({ general: "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại." });
                    setIsProcessing(false);
                    return;
               }

               // Tính toán depositAmount nếu chưa có
               const totalPrice = booking.totalPrice || booking.price || 0;
               const depositPercent = booking.depositPercent || 0.3;
               const depositAmount = booking.depositAmount || Math.round(totalPrice * depositPercent);

               // Tìm scheduleId từ fieldSchedules dựa trên slotId và date
               let scheduleId = booking.scheduleId || 0;
               
               if (!scheduleId && booking.fieldSchedules && Array.isArray(booking.fieldSchedules)) {
                    // Helper function để so sánh date
                    const compareDate = (scheduleDate, targetDate) => {
                         if (!scheduleDate) return false;
                         if (typeof scheduleDate === 'string') {
                              return scheduleDate === targetDate || scheduleDate.split('T')[0] === targetDate;
                         }
                         if (scheduleDate.year && scheduleDate.month && scheduleDate.day) {
                              const formattedDate = `${scheduleDate.year}-${String(scheduleDate.month).padStart(2, '0')}-${String(scheduleDate.day).padStart(2, '0')}`;
                              return formattedDate === targetDate;
                         }
                         return false;
                    };

                    // Tìm schedule matching với slotId và date
                    const matchingSchedule = booking.fieldSchedules.find(s => {
                         const scheduleSlotId = s.slotId || s.SlotId || s.slotID || s.SlotID;
                         const scheduleDate = s.date || s.Date;
                         return String(scheduleSlotId) === String(booking.slotId) && 
                                compareDate(scheduleDate, booking.date);
                    });

                    if (matchingSchedule) {
                         scheduleId = matchingSchedule.scheduleId || matchingSchedule.ScheduleId || 
                                     matchingSchedule.scheduleID || matchingSchedule.ScheduleID || 0;
                         console.log("✅ [GỬI GIỮ CHỖ] Tìm thấy scheduleId từ fieldSchedules:", scheduleId);
                         console.log("✅ [GỬI GIỮ CHỖ] Matching schedule:", matchingSchedule);
                    } else {
                         console.warn("⚠️ [GỬI GIỮ CHỖ] Không tìm thấy scheduleId từ fieldSchedules, sẽ dùng 0 (backend tự tạo)");
                         console.log("⚠️ [GỬI GIỮ CHỖ] fieldSchedules:", booking.fieldSchedules);
                         console.log("⚠️ [GỬI GIỮ CHỖ] slotId:", booking.slotId);
                         console.log("⚠️ [GỬI GIỮ CHỖ] date:", booking.date);
                    }
               } else if (!scheduleId) {
                    console.warn("⚠️ [GỬI GIỮ CHỖ] Không có fieldSchedules hoặc scheduleId, sẽ dùng 0 (backend tự tạo)");
               }

               // Prepare payload for booking creation
               const bookingPayload = {
                    userId: userId,
                    scheduleId: scheduleId, // Sử dụng scheduleId đã tìm được hoặc 0
                    totalPrice: totalPrice,
                    depositAmount: depositAmount,
                    hasOpponent: Boolean(booking.hasOpponent)
               };

               console.log("📤 [GỬI GIỮ CHỖ] Payload:", JSON.stringify(bookingPayload, null, 2));
               console.log("📤 [GỬI GIỮ CHỖ] Payload (Object):", bookingPayload);

               const apiResult = await createBookingAPI(bookingPayload);

               console.log("✅ [GỬI GIỮ CHỖ] API Result:", apiResult);
               console.log("✅ [GỬI GIỮ CHỖ] API Result (JSON):", JSON.stringify(apiResult, null, 2));

               if (!apiResult.success) {
                    console.error("❌ [GỬI GIỮ CHỖ] Error:", apiResult.error);
                    setErrors({ general: apiResult.error || "Không thể tạo booking. Vui lòng thử lại." });
                    setIsProcessing(false);
                    return;
               }

               // Lấy thông tin booking từ API response
               const bookingId = apiResult.data?.bookingID || apiResult.data?.bookingId || apiResult.data?.id;
               console.log("✅ [GỬI GIỮ CHỖ] Booking ID:", bookingId);
               if (!bookingId) {
                    setErrors({ general: "Không nhận được booking ID từ server." });
                    setIsProcessing(false);
                    return;
               }

               // Lưu thông tin booking (QR sẽ được tạo sau khi người dùng chọn số tiền)
               setBookingInfo({
                    bookingId: bookingId,
                    scheduleId: apiResult.data?.scheduleID || apiResult.data?.scheduleId,
                    bookingStatus: apiResult.data?.bookingStatus || "Pending",
                    paymentStatus: apiResult.data?.paymentStatus || "Pending",
                    qrCodeUrl: null,
                    qrExpiresAt: null,
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
          if (!bookingInfo?.bookingId) {
               setErrors({ general: "Không tìm thấy thông tin booking." });
               return;
          }

          if (!paymentAmountType) {
               setErrors(prev => ({ ...prev, payment: "Vui lòng chọn số tiền thanh toán và tạo QR trước khi hoàn tất." }));
               return;
          }

          setIsProcessing(true);
          try {
               // Lưu lịch sử booking vào local storage để người chơi theo dõi
               createBooking({
                    userId: user?.id || user?.userId || "guest",
                    data: {
                         ...bookingData,
                         bookingId: bookingInfo.bookingId,
                         status: "pending",
                         paymentMethod: paymentAmountType,
                         createdAt: new Date().toISOString()
                    }
               });

               setBookingInfo(prev => ({
                    ...prev,
                    bookingStatus: prev?.bookingStatus || "Pending",
                    paymentStatus: prev?.paymentStatus || "Pending"
               }));

               if (isRecurring && generateRecurringSessions().length > 0) {
                    setShowOpponentSelection(true);
               } else {
                    setStep("confirmation");
               }
          } catch (error) {
               console.error("Payment confirmation error:", error);
               setErrors({ general: "Có lỗi xảy ra khi xử lý xác nhận. Vui lòng thử lại." });
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
                              bookingData={bookingData}
                              isRecurring={isRecurring}
                              recurringWeeks={recurringWeeks}
                              selectedDays={selectedDays}
                              isProcessing={isProcessing}
                              formatPrice={formatPrice}
                              paymentAmountType={paymentAmountType}
                              isQrGenerating={isQrGenerating}
                              errors={errors}
                              onPaymentAmountChange={handlePaymentAmountChange}
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