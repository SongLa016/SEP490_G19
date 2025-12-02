import { useState, useEffect, useCallback } from "react";
import { AlertCircle } from "lucide-react";
import Swal from 'sweetalert2';
import { Button, Modal } from "./ui";
import { validateBookingData, checkFieldAvailability } from "../services/bookings";
import {
     createBooking,
     createBookingAPI,
     createBookingPackage,
     fetchOwnerBankAccounts,
     fetchBankAccount,
     fetchPublicFieldSchedulesByField,
     fetchTimeSlotsByField
} from "../index";
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
     const [createdMatchRequest, setCreatedMatchRequest] = useState(null);
     const [createdCommunityPost, setCreatedCommunityPost] = useState(null);
     // Opponent flow: always assume user may find opponent after booking via BookingHistory
     const hasOpponent = "unknown";
     const [showEmailVerification, setShowEmailVerification] = useState(false);
     const [showOpponentSelection, setShowOpponentSelection] = useState(false);
     const [isRecurring, setIsRecurring] = useState(false);
     const [recurringStartDate, setRecurringStartDate] = useState(null); // Thay recurringWeeks bằng startDate
     const [recurringEndDate, setRecurringEndDate] = useState(null); // Thay recurringWeeks bằng endDate
     const [selectedDays, setSelectedDays] = useState([]);
     const [selectedSlotsByDay, setSelectedSlotsByDay] = useState({}); // { dayOfWeek: slotId } - slot đã chọn cho mỗi thứ
     const [suggestedDays, setSuggestedDays] = useState([]); // weekdays 0..6
     const [isSuggesting, setIsSuggesting] = useState(false);
     // Thời gian giữ QR/khóa bước thanh toán: 10 phút
     const PAYMENT_LOCK_DURATION_MS = 10 * 60 * 1000;
     const [paymentLockExpiresAt, setPaymentLockExpiresAt] = useState(null);
     const [lockRemainingMs, setLockRemainingMs] = useState(0);
     const lockCountdownSeconds = lockRemainingMs > 0 ? Math.ceil(lockRemainingMs / 1000) : 0;
     const isPaymentLockActive = step === "payment" && paymentLockExpiresAt !== null;

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

     // Nếu sân chưa được owner cấu hình chính sách đặt cọc, mặc định không yêu cầu cọc (0%)
     const DEFAULT_DEPOSIT_PERCENT = 0; // 0% fallback when policy missing

     // Calculate duration from slot times if available
     const calculateDuration = (startTime, endTime) => {
          if (!startTime || !endTime) return 1;
          try {
               const start = new Date(`2000-01-01T${startTime}`);
               const end = new Date(`2000-01-01T${endTime}`);
               const hours = (end - start) / (1000 * 60 * 60);
               return hours > 0 ? hours : 1;
          } catch {
               return 1;
          }
     };

     const normalizePercentValue = (value) => {
          if (value === null || value === undefined || value === "") return null;
          const numeric = Number(value);
          if (Number.isNaN(numeric) || numeric < 0) return null;
          return numeric > 1 ? numeric / 100 : numeric;
     };

     const normalizeMoneyValue = (value) => {
          if (value === null || value === undefined || value === "") return 0;
          const numeric = Number(value);
          if (Number.isNaN(numeric) || numeric <= 0) return 0;
          return Math.round(numeric);
     };

     const extractDepositConfig = (source) => {
          if (!source) {
               return { percent: null, min: 0, max: 0 };
          }
          const policy = source.depositPolicy || {};
          const rawPercent = policy.depositPercent ?? source.depositPercent ?? null;
          const rawMin = policy.minDeposit ?? source.minDeposit ?? null;
          const rawMax = policy.maxDeposit ?? source.maxDeposit ?? null;
          return {
               percent: normalizePercentValue(rawPercent),
               min: normalizeMoneyValue(rawMin),
               max: normalizeMoneyValue(rawMax)
          };
     };

     const computeDepositAmount = (baseAmount, percent, minDeposit = 0, maxDeposit = 0) => {
          const normalizedBase = Number(baseAmount) || 0;
          if (normalizedBase <= 0) return 0;
          const normalizedPercent = typeof percent === "number" ? percent : DEFAULT_DEPOSIT_PERCENT;
          let deposit = Math.round(normalizedBase * Math.max(0, normalizedPercent));
          if (minDeposit && minDeposit > 0) {
               deposit = Math.max(deposit, minDeposit);
          }
          if (maxDeposit && maxDeposit > 0) {
               deposit = Math.min(deposit, maxDeposit);
          }
          return deposit;
     };

     const initialDuration = fieldData?.duration ||
          (fieldData?.startTime && fieldData?.endTime
               ? calculateDuration(fieldData.startTime, fieldData.endTime)
               : 1);
     const initialDepositConfig = extractDepositConfig(fieldData);
     const initialDepositPercent = typeof initialDepositConfig.percent === "number"
          ? initialDepositConfig.percent
          : DEFAULT_DEPOSIT_PERCENT;
     const resolvedUserName = user?.fullName || user?.FullName || user?.name || user?.Name || "";
     const resolvedUserPhone = user?.phone || user?.Phone || user?.phoneNumber || user?.PhoneNumber || "";
     const resolvedUserEmail = user?.email || user?.Email || user?.mail || user?.Mail || "";

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
          startTime: fieldData?.startTime || fieldData?.StartTime || "",
          endTime: fieldData?.endTime || fieldData?.EndTime || "",
          duration: initialDuration,
          price: fieldData?.price || 0,
          totalPrice: fieldData?.price || 0,
          depositPercent: initialDepositPercent,
          depositAmount: 0,
          minDeposit: initialDepositConfig.min,
          maxDeposit: initialDepositConfig.max,
          remainingAmount: 0,
          discountPercent: 0,
          discountAmount: 0,
          customerName: resolvedUserName,
          customerPhone: resolvedUserPhone,
          customerEmail: resolvedUserEmail,
          notes: "",
          requiresEmail: !resolvedUserEmail, // Require email if user doesn't have one
          isRecurring: false,
          fieldSchedules: Array.isArray(fieldData?.fieldSchedules) ? fieldData.fieldSchedules : [],
          fieldTimeSlots: Array.isArray(fieldData?.fieldTimeSlots) ? fieldData.fieldTimeSlots : []
     });

     // Tạo danh sách các buổi định kỳ dự kiến từ startDate + endDate + các ngày trong tuần
     const generateRecurringSessions = () => {
          if (!isRecurring || !recurringStartDate || !recurringEndDate || !Array.isArray(selectedDays) || selectedDays.length === 0) return [];
          try {
               const sessions = [];
               const start = new Date(recurringStartDate);
               start.setHours(0, 0, 0, 0);
               const end = new Date(recurringEndDate);
               end.setHours(23, 59, 59, 999);

               // Duyệt từ ngày bắt đầu đến ngày kết thúc, chọn ngày có weekday nằm trong selectedDays
               for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const weekday = d.getDay(); // 0=CN..6=T7
                    if (selectedDays.includes(weekday)) {
                         const selectedSlotId = selectedSlotsByDay?.[weekday];
                         if (selectedSlotId) {
                              sessions.push({
                                   date: new Date(d),
                                   dayOfWeek: weekday,
                                   slotId: selectedSlotId
                              });
                         }
                    }
               }
               return sessions;
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
     // Tính giá cho từng slot dựa trên TimeSlots (chứa giá) hoặc fieldSchedules
     const getSlotPrice = (slotId) => {
          // Ưu tiên lấy từ TimeSlots (có giá chính xác)
          if (Array.isArray(bookingData.fieldTimeSlots) && bookingData.fieldTimeSlots.length > 0) {
               const timeSlot = bookingData.fieldTimeSlots.find(s => 
                    String(s.slotId || s.SlotId || s.slotID || s.SlotID) === String(slotId)
               );
               if (timeSlot) {
                    return timeSlot.price || timeSlot.Price || timeSlot.unitPrice || timeSlot.UnitPrice || 0;
               }
          }
          
          // Fallback: lấy từ fieldSchedules nếu có
          if (Array.isArray(bookingData.fieldSchedules)) {
               const schedule = bookingData.fieldSchedules.find(s => 
                    String(s.slotId || s.SlotId || s.slotID || s.SlotID) === String(slotId)
               );
               if (schedule) {
                    return schedule.price || schedule.Price || schedule.unitPrice || schedule.UnitPrice || 0;
               }
          }
          
          // Cuối cùng: dùng giá mặc định từ bookingData
          return bookingData.price || 0;
     };

     useEffect(() => {
          if (!isRecurring) {
               // Đặt lẻ: giữ logic cũ
               const basePrice = bookingData.price || 0;
               const subtotal = basePrice;
               const deposit = computeDepositAmount(
                    subtotal,
                    bookingData.depositPercent,
                    bookingData.minDeposit,
                    bookingData.maxDeposit
               );
               const remaining = Math.max(0, subtotal - deposit);
               setBookingData(prev => ({
                    ...prev,
                    subtotal,
                    totalPrice: subtotal,
                    depositAmount: deposit,
                    remainingAmount: remaining,
                    totalSessions: 1,
                    discountPercent: 0,
                    discountAmount: 0
               }));
               return;
          }

          // Đặt cố định: tính tổng giá từ các slot đã chọn
          const sessions = generateRecurringSessions();
          const totalSessions = sessions.length;
          
          if (totalSessions === 0) {
               setBookingData(prev => ({
                    ...prev,
                    subtotal: 0,
                    totalPrice: 0,
                    depositAmount: 0,
                    remainingAmount: 0,
                    totalSessions: 0,
                    discountPercent: 0,
                    discountAmount: 0
               }));
               return;
          }

          // Tính tổng giá từ các slot đã chọn
          let subtotal = 0;
          sessions.forEach(session => {
               const slotPrice = getSlotPrice(session.slotId);
               subtotal += slotPrice;
          });

          const discountPercent = getRecurringDiscountPercent(totalSessions);
          const discountAmount = Math.round(subtotal * (discountPercent / 100));
          const total = subtotal - discountAmount;
          const deposit = computeDepositAmount(
               total,
               bookingData.depositPercent,
               bookingData.minDeposit,
               bookingData.maxDeposit
          );
          const remaining = Math.max(0, total - deposit);
          
          setBookingData(prev => ({
               ...prev,
               subtotal,
               totalPrice: total,
               depositAmount: deposit,
               remainingAmount: remaining,
               totalSessions: totalSessions,
               discountPercent,
               discountAmount
          }));
     }, [
          bookingData.price,
          bookingData.duration,
          bookingData.depositPercent,
          bookingData.minDeposit,
          bookingData.maxDeposit,
          bookingData.fieldSchedules,
          isRecurring,
          recurringStartDate,
          recurringEndDate,
          selectedDays,
          selectedSlotsByDay
     ]);

     // Cập nhật bookingData khi fieldData thay đổi
     useEffect(() => {
          if (fieldData) {
               const providedStartTime = fieldData.startTime || fieldData.StartTime || "";
               const providedEndTime = fieldData.endTime || fieldData.EndTime || "";
               let computedDuration = null;
               if (fieldData.duration != null) {
                    const numericDuration = Number(fieldData.duration);
                    if (!Number.isNaN(numericDuration) && numericDuration > 0) {
                         computedDuration = numericDuration;
                    }
               }
               if (computedDuration == null && providedStartTime && providedEndTime) {
                    computedDuration = calculateDuration(providedStartTime, providedEndTime);
               }
               const depositConfig = extractDepositConfig(fieldData);
               const nextDepositPercent = typeof depositConfig.percent === "number"
                    ? depositConfig.percent
                    : DEFAULT_DEPOSIT_PERCENT;

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
                    startTime: providedStartTime || prev.startTime || "",
                    endTime: providedEndTime || prev.endTime || "",
                    duration: computedDuration ?? prev.duration,
                    price: fieldData.price || prev.price,
                    totalPrice: fieldData.totalPrice || fieldData.price || prev.price,
                    fieldSchedules: Array.isArray(fieldData.fieldSchedules) ? fieldData.fieldSchedules : (prev.fieldSchedules || []), // Đảm bảo fieldSchedules là array
                    fieldTimeSlots: Array.isArray(fieldData.fieldTimeSlots) ? fieldData.fieldTimeSlots : (prev.fieldTimeSlots || []), // Thêm TimeSlots để lấy giá
                    depositPercent: nextDepositPercent,
                    minDeposit: depositConfig.min,
                    maxDeposit: depositConfig.max
               }));

               // Initialize recurring presets from caller (right panel)
               if (fieldData.isRecurringPreset !== undefined) {
                    setIsRecurring(!!fieldData.isRecurringPreset);
               }
               // recurringWeeksPreset không còn dùng nữa, thay bằng startDate/endDate
               // Có thể tính startDate/endDate từ recurringWeeksPreset nếu cần
               if (typeof fieldData.recurringWeeksPreset === 'number' && fieldData.recurringWeeksPreset > 0) {
                    const today = new Date();
                    const endDate = new Date(today);
                    endDate.setDate(endDate.getDate() + (fieldData.recurringWeeksPreset * 7) - 1);
                    setRecurringStartDate(today.toISOString().split('T')[0]);
                    setRecurringEndDate(endDate.toISOString().split('T')[0]);
               }
               if (Array.isArray(fieldData.selectedDaysPreset)) {
                    setSelectedDays(fieldData.selectedDaysPreset);
               }
          }
     }, [fieldData]);

     useEffect(() => {
          const nextName = user?.fullName || user?.FullName || user?.name || user?.Name || "";
          const nextPhone = user?.phone || user?.Phone || user?.phoneNumber || user?.PhoneNumber || "";
          const nextEmail = user?.email || user?.Email || user?.mail || user?.Mail || "";
          if (!nextName && !nextPhone && !nextEmail) {
               return;
          }
          setBookingData(prev => ({
               ...prev,
               customerName: prev.customerName || nextName,
               customerPhone: prev.customerPhone || nextPhone,
               customerEmail: prev.customerEmail || nextEmail,
               requiresEmail: !(prev.customerEmail || nextEmail)
          }));
     }, [user]);

     // Reset khi modal mở/đóng, nhưng giữ preset định kỳ nếu được truyền vào
     useEffect(() => {
          if (isOpen) {
               openBookingModal();
               setStep("details");
               setErrors({});
               setBookingInfo(null);
               setOwnerBankAccount(null);
               setPaymentLockExpiresAt(null);
               setLockRemainingMs(0);
               if (fieldData?.isRecurringPreset) {
                    setIsRecurring(true);
                    // Ưu tiên dùng recurringStartDatePreset và recurringEndDatePreset nếu có
                    if (fieldData.recurringStartDatePreset && fieldData.recurringEndDatePreset) {
                         setRecurringStartDate(fieldData.recurringStartDatePreset);
                         setRecurringEndDate(fieldData.recurringEndDatePreset);
                    } else if (typeof fieldData.recurringWeeksPreset === 'number' && fieldData.recurringWeeksPreset > 0) {
                         // Fallback: tính từ recurringWeeksPreset
                         const today = new Date();
                         const endDate = new Date(today);
                         endDate.setDate(endDate.getDate() + (fieldData.recurringWeeksPreset * 7) - 1);
                         setRecurringStartDate(today.toISOString().split('T')[0]);
                         setRecurringEndDate(endDate.toISOString().split('T')[0]);
                    } else {
                         // Mặc định 4 tuần
                         const today = new Date();
                         const endDate = new Date(today);
                         endDate.setDate(endDate.getDate() + (4 * 7) - 1);
                         setRecurringStartDate(today.toISOString().split('T')[0]);
                         setRecurringEndDate(endDate.toISOString().split('T')[0]);
                    }
                    if (Array.isArray(fieldData.selectedDaysPreset)) {
                         setSelectedDays(fieldData.selectedDaysPreset);
                    } else {
                         setSelectedDays([]);
                    }
                    setSelectedSlotsByDay({});
               } else {
                    setIsRecurring(false);
                    setRecurringStartDate(null);
                    setRecurringEndDate(null);
                    setSelectedDays([]);
                    setSelectedSlotsByDay({});
               }
          } else {
               closeBookingModal();
          }
     }, [isOpen, fieldData, openBookingModal, closeBookingModal]);

     // Fetch schedule khi chọn startDate/endDate và các thứ cho đặt cố định
     useEffect(() => {
          if (!isRecurring || !bookingData.fieldId || !recurringStartDate || !recurringEndDate || selectedDays.length === 0) {
               return;
          }

          // Fetch cả schedule và TimeSlots (để lấy giá)
          const fetchData = async () => {
               try {
                    const [schedulesResult, timeSlotsResult] = await Promise.all([
                         fetchPublicFieldSchedulesByField(bookingData.fieldId),
                         fetchTimeSlotsByField(bookingData.fieldId)
                    ]);
                    
                    // Xử lý schedules
                    if (schedulesResult.success && Array.isArray(schedulesResult.data)) {
                         // Thêm dayOfWeek vào mỗi schedule nếu chưa có
                         const schedulesWithDayOfWeek = schedulesResult.data.map(schedule => {
                              if (schedule.dayOfWeek !== undefined && schedule.dayOfWeek !== null) {
                                   return schedule;
                              }
                              
                              // Tính dayOfWeek từ date
                              const scheduleDate = schedule.date ?? schedule.Date ?? schedule.scheduleDate ?? schedule.ScheduleDate;
                              if (scheduleDate) {
                                   try {
                                        const date = typeof scheduleDate === 'string' 
                                             ? new Date(scheduleDate) 
                                             : (scheduleDate.year && scheduleDate.month && scheduleDate.day
                                                  ? new Date(scheduleDate.year, scheduleDate.month - 1, scheduleDate.day)
                                                  : new Date(scheduleDate));
                                        if (!isNaN(date.getTime())) {
                                             return {
                                                  ...schedule,
                                                  dayOfWeek: date.getDay() // 0 = CN, 1 = T2, ..., 6 = T7
                                             };
                                        }
                                   } catch (e) {
                                        // Silent fail
                                   }
                              }
                              
                              return schedule;
                         });
                         
                         setBookingData(prev => {
                              // Chỉ update nếu fieldId thay đổi hoặc chưa có schedule
                              if (!prev.fieldSchedules || prev.fieldSchedules.length === 0 || prev.fieldId !== bookingData.fieldId) {
                                   return {
                                        ...prev,
                                        fieldSchedules: schedulesWithDayOfWeek
                                   };
                              }
                              return prev;
                         });
                    }
                    
                    // Xử lý TimeSlots (để lấy giá)
                    if (timeSlotsResult && Array.isArray(timeSlotsResult.data)) {
                         setBookingData(prev => {
                              // Chỉ update nếu fieldId thay đổi hoặc chưa có TimeSlots
                              if (!prev.fieldTimeSlots || prev.fieldTimeSlots.length === 0 || prev.fieldId !== bookingData.fieldId) {
                                   return {
                                        ...prev,
                                        fieldTimeSlots: timeSlotsResult.data
                                   };
                              }
                              return prev;
                         });
                    }
               } catch (error) {
                    console.error("[BookingModal] Error fetching schedules/TimeSlots:", error);
               }
          };

          fetchData();
     }, [isRecurring, bookingData.fieldId, recurringStartDate, recurringEndDate, selectedDays]);

     useEffect(() => {
          if (step !== "payment") {
               setPaymentLockExpiresAt(null);
               setLockRemainingMs(0);
               return;
          }
     }, [step]);

     useEffect(() => {
          if (!paymentLockExpiresAt || step !== "payment") {
               setLockRemainingMs(0);
               return;
          }

          const updateRemaining = () => {
               const remaining = paymentLockExpiresAt - Date.now();
               if (remaining <= 0) {
                    setPaymentLockExpiresAt(null);
                    setLockRemainingMs(0);
               } else {
                    setLockRemainingMs(remaining);
               }
          };

          updateRemaining();
          const timer = setInterval(updateRemaining, 1000);
          return () => clearInterval(timer);
     }, [paymentLockExpiresAt, step]);

     useEffect(() => {
          if (typeof window === "undefined") return;
          const handleBeforeUnload = (event) => {
               if (isPaymentLockActive) {
                    event.preventDefault();
                    event.returnValue = "Bạn đang trong quá trình thanh toán. Hãy sử dụng nút Hủy đặt sân nếu muốn thoát.";
                    return event.returnValue;
               }
               return undefined;
          };
          window.addEventListener("beforeunload", handleBeforeUnload);
          return () => {
               window.removeEventListener("beforeunload", handleBeforeUnload);
          };
     }, [isPaymentLockActive]);

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
          setSelectedDays(prev => {
               if (prev.includes(day)) {
                    // Bỏ chọn: xóa slot đã chọn cho thứ này
                    setSelectedSlotsByDay(prevSlots => {
                         const newSlots = { ...prevSlots };
                         delete newSlots[day];
                         return newSlots;
                    });
                    return prev.filter(d => d !== day);
               } else {
                    return [...prev, day];
               }
          });
     };

     const handleSlotSelect = (dayOfWeek, slotId) => {
          setSelectedSlotsByDay(prev => {
               if (slotId === null) {
                    const newSlots = { ...prev };
                    delete newSlots[dayOfWeek];
                    return newSlots;
               } else {
                    return { ...prev, [dayOfWeek]: slotId };
               }
          });
     };

     // Suggest alternative weekdays for recurring schedule based on availability
     useEffect(() => {
          async function computeSuggestions() {
               try {
                    setIsSuggesting(true);
                    setSuggestedDays([]);
                    if (!isRecurring) return;
                    const fieldId = bookingData.fieldId;
                    if (!fieldId || !recurringStartDate || !recurringEndDate) return;

                    const startDate = new Date(recurringStartDate);
                    const endDate = new Date(recurringEndDate);
                    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate > endDate) return;
                    
                    // Tính số tuần từ startDate đến endDate
                    const diffTime = endDate - startDate;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const weeks = Math.max(1, Math.ceil(diffDays / 7));

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
     }, [isRecurring, bookingData.fieldId, bookingData.slotId, recurringStartDate, recurringEndDate, selectedDays]);

     const handlePayment = async () => {
          if (!validateForm()) return;
          if (!user) {
               await Swal.fire({
                    icon: 'warning',
                    title: 'Cần đăng nhập',
                    text: "Bạn cần đăng nhập để tạo booking. Vui lòng đăng nhập trước.",
                    confirmButtonColor: '#10b981'
               });
               return;
          }

          const userRole = user?.role || user?.Role || user?.roleName || user?.RoleName;
          const roleId = user?.roleId || user?.roleID || user?.RoleId || user?.RoleID;
          const isPlayer = roleId === 3 ||
               userRole?.toLowerCase() === 'player' ||
               userRole?.toLowerCase() === 'người chơi' ||
               userRole === 'Player';

          if (!isPlayer) {
               console.warn("⚠️ [GỬI GIỮ CHỖ] User is not a player:", { userRole, roleId, user });
               await Swal.fire({
                    icon: 'warning',
                    title: 'Không có quyền',
                    text: "Chỉ người chơi (Player) mới có thể tạo booking. Vui lòng đăng nhập bằng tài khoản người chơi.",
                    confirmButtonColor: '#10b981'
               });
               return;
          }
          setIsProcessing(true);
          try {
               // Nếu là đặt cố định: kiểm tra trước xem đủ số buổi có schedule trong khoảng chọn hay không
               if (isRecurring) {
                    try {
                         const sessions = generateRecurringSessions() || [];
                         if (!sessions.length) {
                              setIsProcessing(false);
                              await Swal.fire({
                                   icon: 'warning',
                                   title: 'Không thể đặt cố định',
                                   text: 'Vui lòng chọn ngày bắt đầu, ngày kết thúc, các ngày trong tuần và khung giờ cho từng ngày trước khi đặt cố định.',
                                   confirmButtonColor: '#f59e0b'
                              });
                              return;
                         }

                         const schedules = Array.isArray(bookingData.fieldSchedules) ? bookingData.fieldSchedules : [];

                         if (schedules.length > 0) {
                              // Helper so sánh ngày giữa schedule.date và targetDate (yyyy-MM-dd)
                              const compareDate = (scheduleDate, targetDate) => {
                                   if (!scheduleDate || !targetDate) return false;
                                   if (typeof scheduleDate === "string") {
                                        const d = scheduleDate.split("T")[0];
                                        return d === targetDate;
                                   }
                                   if (scheduleDate.year && scheduleDate.month && scheduleDate.day) {
                                        const formatted = `${scheduleDate.year}-${String(scheduleDate.month).padStart(2, "0")}-${String(scheduleDate.day).padStart(2, "0")}`;
                                        return formatted === targetDate;
                                   }
                                   try {
                                        const d = new Date(scheduleDate);
                                        return d.toISOString().split("T")[0] === targetDate;
                                   } catch {
                                        return false;
                                   }
                              };

                              let hasScheduleCount = 0;
                              sessions.forEach((s) => {
                                   const targetDate = (s.date instanceof Date
                                        ? s.date
                                        : new Date(s.date));
                                   const targetStr = targetDate.toISOString().split("T")[0];
                                   const sessionSlotId = s.slotId || bookingData.slotId;
                                   const found = schedules.some((sch) => {
                                        const scheduleSlotId = sch.slotId || sch.SlotId || sch.slotID || sch.SlotID;
                                        const scheduleDate = sch.date || sch.Date;
                                        const scheduleDayOfWeek = sch.dayOfWeek ?? sch.DayOfWeek ?? sch.weekday ?? sch.Weekday;
                                        // Kiểm tra cả slotId và dayOfWeek
                                        return String(scheduleSlotId) === String(sessionSlotId) &&
                                             Number(scheduleDayOfWeek) === Number(s.dayOfWeek) &&
                                             compareDate(scheduleDate, targetStr);
                                   });
                                   if (found) hasScheduleCount += 1;
                              });

                              console.log("[RECURRING SCHEDULE CHECK]", {
                                   fieldId: bookingData.fieldId,
                                   slotId: bookingData.slotId,
                                   sessions,
                                   schedulesCount: schedules.length,
                                   hasScheduleCount,
                                   totalSessions: sessions.length,
                              });

                              if (hasScheduleCount < sessions.length) {
                                   setIsProcessing(false);
                                   await Swal.fire({
                                        icon: "warning",
                                        title: "Không đủ lịch để đặt cố định",
                                        html: `
                                             <p class="mb-2">Chỉ có <strong>${hasScheduleCount}/${sessions.length}</strong> buổi có lịch được tạo sẵn trong khoảng bạn chọn.</p>
                                             <p class="text-sm text-gray-600">Vui lòng liên hệ chủ sân để thêm lịch cho các ngày còn thiếu, hoặc rút ngắn khoảng đặt.</p>
                                        `,
                                        confirmButtonColor: "#f59e0b",
                                   });
                                   return;
                              }
                         }
                    } catch (err) {
                         console.warn("⚠️ [RECURRING] Error checking schedules for package:", err);
                         // Nếu check bị lỗi vẫn tiếp tục, không chặn user
                    }
               }

               const booking = {
                    ...bookingData,
                    recurring: isRecurring ? {
                         startDate: recurringStartDate,
                         endDate: recurringEndDate
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
                    setIsProcessing(false);
                    await Swal.fire({
                         icon: 'warning',
                         title: 'Sân không khả dụng',
                         text: avail?.message || "Sân đã có người đặt trong khung giờ này.",
                         confirmButtonColor: '#f59e0b'
                    });
                    return;
               }

               // Gọi API tạo booking/gói booking
               const userId = user?.id || user?.userId || user?.userID;
               if (!userId) {
                    setIsProcessing(false);
                    await Swal.fire({
                         icon: 'error',
                         title: 'Lỗi xác thực',
                         text: "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.",
                         confirmButtonColor: '#ef4444'
                    });
                    return;
               }

               // Tính toán depositAmount nếu chưa có
               const totalPrice = booking.totalPrice || booking.price || 0;
               const depositAmount = typeof booking.depositAmount === "number"
                    ? booking.depositAmount
                    : computeDepositAmount(
                         totalPrice,
                         booking.depositPercent,
                         booking.minDeposit,
                         booking.maxDeposit
                    );

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
                    } else {
                         console.warn("⚠️ [GỬI GIỮ CHỖ] Không tìm thấy scheduleId từ fieldSchedules, sẽ dùng 0 (backend tự tạo)");
                    }
               } else if (!scheduleId) {
                    console.warn("⚠️ [GỬI GIỮ CHỖ] Không có fieldSchedules hoặc scheduleId, sẽ dùng 0 (backend tự tạo)");
               }

               // ----------------- ĐẶT LẺ: dùng Booking/create -----------------
               if (!isRecurring) {
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
                    console.log("✅ [GỬI GIỮ CHỖ] API Result (JSON):", JSON.stringify(apiResult, null, 2));

                    if (!apiResult.success) {
                         console.error("❌ [GỬI GIỮ CHỖ] Error:", apiResult.error);
                         setIsProcessing(false);
                         await Swal.fire({
                              icon: 'error',
                              title: 'Lỗi đặt sân',
                              text: apiResult.error || "Không thể tạo booking. Vui lòng thử lại.",
                              confirmButtonColor: '#ef4444'
                         });
                         return;
                    }

                    // Lấy thông tin booking từ API response
                    const bookingId = apiResult.data?.bookingID || apiResult.data?.bookingId || apiResult.data?.id;
                    if (!bookingId) {
                         setIsProcessing(false);
                         await Swal.fire({
                              icon: 'error',
                              title: 'Lỗi',
                              text: "Không nhận được booking ID từ server.",
                              confirmButtonColor: '#ef4444'
                         });
                         return;
                    }

                    const rawQrCode =
                         apiResult.data?.qrCodeUrl ||
                         apiResult.data?.qrCode ||
                         apiResult.data?.QRCode ||
                         apiResult.data?.qrImage ||
                         apiResult.data?.depositQrCode ||
                         null;
                    let normalizedQrCode = rawQrCode;
                    if (normalizedQrCode && typeof normalizedQrCode === "string") {
                         const lower = normalizedQrCode.toLowerCase();
                         const isHttp = lower.startsWith("http://") || lower.startsWith("https://");
                         const isData = lower.startsWith("data:");
                         if (!isHttp && !isData) {
                              normalizedQrCode = `data:image/png;base64,${normalizedQrCode}`;
                         }
                    }

                    const qrExpiresAt = apiResult.data?.qrExpiresAt || apiResult.data?.QRExpiresAt || apiResult.data?.qrExpiry || null;
                    const apiTotalPrice = Number(apiResult.data?.totalPrice ?? totalPrice ?? bookingData.totalPrice ?? 0);
                    const apiDepositAmount = Number(apiResult.data?.depositAmount ?? depositAmount ?? bookingData.depositAmount ?? 0);
                    const apiRemainingAmountRaw = apiResult.data?.remainingAmount ?? apiResult.data?.RemainingAmount;
                    const apiRemainingAmount = typeof apiRemainingAmountRaw === "number"
                         ? apiRemainingAmountRaw
                         : Math.max(0, apiTotalPrice - apiDepositAmount);

                    setBookingData(prev => ({
                         ...prev,
                         totalPrice: apiTotalPrice || prev.totalPrice,
                         depositAmount: apiDepositAmount || prev.depositAmount,
                         remainingAmount: apiRemainingAmount ?? prev.remainingAmount
                    }));

                    // Lưu thông tin booking cùng QR do backend trả về
                    setBookingInfo({
                         bookingId: bookingId,
                         scheduleId: apiResult.data?.scheduleID || apiResult.data?.scheduleId,
                         bookingStatus: apiResult.data?.bookingStatus || "Pending",
                         paymentStatus: apiResult.data?.paymentStatus || "Pending",
                         qrCodeUrl: normalizedQrCode,
                         qrExpiresAt: qrExpiresAt,
                         totalPrice: apiTotalPrice,
                         depositAmount: apiDepositAmount,
                         remainingAmount: apiRemainingAmount
                    });
               } else {
                    // ----------------- ĐẶT ĐỊNH KỲ: dùng BookingPackage/create -----------------
                    if (!recurringStartDate || !recurringEndDate) {
                         setIsProcessing(false);
                         await Swal.fire({
                              icon: 'warning',
                              title: 'Thiếu thông tin',
                              text: 'Vui lòng chọn ngày bắt đầu và ngày kết thúc cho gói đặt cố định.',
                              confirmButtonColor: '#f59e0b'
                         });
                         return;
                    }

                    const start = new Date(recurringStartDate);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(recurringEndDate);
                    end.setHours(23, 59, 59, 999);

                    // Tìm scheduleId cho từng dayOfWeek từ fieldSchedules
                    const buildSelectedSlots = () => {
                         return selectedDays
                              .filter(dayOfWeek => selectedSlotsByDay?.[dayOfWeek]) // Chỉ lấy các thứ đã chọn slot
                              .map(dayOfWeek => {
                                   const slotId = selectedSlotsByDay[dayOfWeek];
                                   // Tìm scheduleId từ fieldSchedules
                                   let foundScheduleId = 0;
                                   if (Array.isArray(booking.fieldSchedules)) {
                                        const schedule = booking.fieldSchedules.find(s => {
                                             const scheduleDayOfWeek = s.dayOfWeek ?? s.DayOfWeek ?? s.weekday ?? s.Weekday;
                                             const scheduleSlotId = s.slotId || s.SlotId || s.slotID || s.SlotID;
                                             return Number(scheduleDayOfWeek) === Number(dayOfWeek) &&
                                                  String(scheduleSlotId) === String(slotId);
                                        });
                                        if (schedule) {
                                             foundScheduleId = schedule.scheduleId || schedule.ScheduleId || schedule.scheduleID || schedule.ScheduleID || 0;
                                        }
                                   }
                                   return {
                                        slotId: Number(slotId) || 0,
                                        dayOfWeek: Number(dayOfWeek) || 0,
                                        fieldId: Number(booking.fieldId) || 0,
                                        scheduleId: Number(foundScheduleId) || 0
                                   };
                              });
                    };

                    const selectedSlots = buildSelectedSlots();

                    if (selectedSlots.length === 0) {
                         setIsProcessing(false);
                         await Swal.fire({
                              icon: 'warning',
                              title: 'Thiếu thông tin',
                              text: 'Vui lòng chọn khung giờ cho ít nhất một ngày trong tuần.',
                              confirmButtonColor: '#f59e0b'
                         });
                         return;
                    }

                    const packagePayload = {
                         userId: userId,
                         fieldId: booking.fieldId,
                         packageName: booking.packageName || `Gói định kỳ`,
                         startDate: start.toISOString().split("T")[0],
                         endDate: end.toISOString().split("T")[0],
                         totalPrice: booking.totalPrice || totalPrice,
                         selectedSlots: selectedSlots
                    };

                    console.log("📤 [BOOKING PACKAGE] Payload:", JSON.stringify(packagePayload, null, 2));

                    const packageResult = await createBookingPackage(packagePayload);
                    console.log("✅ [BOOKING PACKAGE] API Result (JSON):", JSON.stringify(packageResult, null, 2));

                    if (!packageResult.success) {
                         console.error("❌ [BOOKING PACKAGE] Error:", packageResult.error);
                         setIsProcessing(false);
                         await Swal.fire({
                              icon: 'error',
                              title: 'Lỗi đặt định kỳ',
                              text: packageResult.error || "Không thể tạo gói đặt định kỳ. Vui lòng thử lại.",
                              confirmButtonColor: '#ef4444'
                         });
                         return;
                    }

                    // Backend trả dạng: { message, data: { bookingPackageId, ..., qrcode, qrexpiresAt } }
                    // createBookingPackage() đang gói trong { success, data: response.data }
                    const data = (packageResult.data && packageResult.data.data)
                         ? packageResult.data.data
                         : (packageResult.data || {});
                    const bookingPackageId = data.bookingPackageId || data.bookingId || data.id;

                    const rawQrCode =
                         data.qrcode ||
                         data.qrCode ||
                         data.QRCode ||
                         data.qrCodeUrl ||
                         null;
                    let normalizedQrCode = rawQrCode;
                    if (normalizedQrCode && typeof normalizedQrCode === "string") {
                         const lower = normalizedQrCode.toLowerCase();
                         const isHttp = lower.startsWith("http://") || lower.startsWith("https://");
                         const isData = lower.startsWith("data:");
                         if (!isHttp && !isData) {
                              normalizedQrCode = `data:image/png;base64,${normalizedQrCode}`;
                         }
                    }

                    const qrExpiresAt = data.qrexpiresAt || data.qrExpiresAt || data.QRExpiresAt || null;
                    const apiTotalPrice = Number(data.totalPrice ?? packagePayload.totalPrice ?? bookingData.totalPrice ?? 0);
                    const apiDepositAmount = Number(data.depositAmount ?? depositAmount ?? bookingData.depositAmount ?? 0);
                    const apiRemainingAmount = Math.max(0, apiTotalPrice - apiDepositAmount);

                    setBookingData(prev => ({
                         ...prev,
                         totalPrice: apiTotalPrice || prev.totalPrice,
                         depositAmount: apiDepositAmount || prev.depositAmount,
                         remainingAmount: apiRemainingAmount ?? prev.remainingAmount
                    }));

                    setBookingInfo({
                         bookingId: bookingPackageId,
                         scheduleId: scheduleId || 0,
                         bookingStatus: data.bookingStatus || "Pending",
                         paymentStatus: data.paymentStatus || "Pending",
                         qrCodeUrl: normalizedQrCode,
                         qrExpiresAt: qrExpiresAt,
                         totalPrice: apiTotalPrice,
                         depositAmount: apiDepositAmount,
                         remainingAmount: apiRemainingAmount
                    });
               }

               // Chuyển sang bước thanh toán và khóa thao tác trong 5 phút hoặc đến khi hủy
               setStep("payment");
               setPaymentLockExpiresAt(Date.now() + PAYMENT_LOCK_DURATION_MS);
          } catch (error) {
               console.error("Booking error:", error);
               const code = error?.code;
               let msg = "Có lỗi xảy ra khi đặt sân. Vui lòng thử lại.";
               if (code === "DURATION_LIMIT") msg = "Thời lượng vượt giới hạn (tối đa 1 tiếng 30 phút).";
               if (code === "CONFLICT") msg = "Khung giờ đã có người khác giữ hoặc đặt. Chọn khung giờ khác.";
               if (code === "VALIDATION_ERROR") msg = error?.message || msg;
               setIsProcessing(false);
               await Swal.fire({
                    icon: 'error',
                    title: 'Lỗi đặt sân',
                    text: msg,
                    confirmButtonColor: '#ef4444'
               });
          } finally {
               setIsProcessing(false);
          }
     };
     const handleCancelBookingDuringPayment = async () => {
          if (isProcessing) return;

          const confirmResult = await Swal.fire({
               title: 'Xác nhận hủy đặt sân',
               text: 'Bạn có chắc muốn hủy đặt sân và đóng QR thanh toán không?',
               icon: 'question',
               showCancelButton: true,
               confirmButtonText: 'Hủy đặt sân',
               cancelButtonText: 'Không',
               confirmButtonColor: '#ef4444',
               cancelButtonColor: '#6b7280'
          });

          if (!confirmResult.isConfirmed) return;

          setPaymentLockExpiresAt(null);
          setLockRemainingMs(0);
          setBookingInfo(null);
          setStep("details");
          onClose?.();

          // Hiển thị thông báo hủy thành công
          Swal.fire({
               toast: true,
               position: 'top-end',
               icon: 'success',
               title: 'Hủy thành công',
               showConfirmButton: false,
               timer: 2000,
               timerProgressBar: true
          });
     };

     const handleModalClose = useCallback(() => {
          if (isPaymentLockActive) return;
          onClose();
     }, [isPaymentLockActive, onClose]);

     const handleConfirmPayment = async () => {
          if (!bookingInfo?.bookingId) {
               await Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: "Không tìm thấy thông tin booking.",
                    confirmButtonColor: '#ef4444'
               });
               return;
          }

          if (!bookingInfo?.qrCodeUrl) {
               setErrors(prev => ({ ...prev, payment: "Đang tạo mã QR tiền cọc. Vui lòng đợi trong giây lát." }));
               await Swal.fire({
                    icon: 'info',
                    title: 'Đang tạo QR',
                    text: 'Vui lòng đợi hệ thống tạo mã QR tiền cọc trước khi xác nhận.',
                    confirmButtonColor: '#10b981'
               });
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
                         paymentMethod: "deposit",
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
               await Swal.fire({
                    icon: 'error',
                    title: 'Lỗi xác nhận',
                    text: "Có lỗi xảy ra khi xử lý xác nhận. Vui lòng thử lại.",
                    confirmButtonColor: '#ef4444'
               });
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
               onClose={handleModalClose}
               title={bookingType === "complex" ? "Đặt Sân Lớn" : bookingType === "quick" ? "Đặt Nhanh" : "Đặt Sân"}
               className="max-w-6xl z-[100] w-full mx-4 max-h-[90vh] overflow-y-auto rounded-xl"
               showCloseButton={!isPaymentLockActive}
               closeOnOverlayClick={!isPaymentLockActive}
          >
               <div className="p-2 bg-cover bg-center bg-no-repeat bg-[url('https://mixivivu.com/section-background.png')]">
                    {errors.general && (
                         <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                              <AlertCircle className="w-5 h-5 text-red-500" />
                              <span className="text-red-700">{errors.general}</span>
                         </div>
                    )}
                    {
                         step === "details" && (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                   {/* Left Column - Field Info + Contact Form */}
                                   <div className="space-y-6">
                                        <FieldInfoSection
                                             bookingData={bookingData}
                                             isRecurring={isRecurring}
                                             recurringWeeks={0} // Không dùng nữa, để tương thích
                                             startDate={recurringStartDate}
                                             endDate={recurringEndDate}
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
                                             startDate={recurringStartDate}
                                             setStartDate={setRecurringStartDate}
                                             endDate={recurringEndDate}
                                             setEndDate={setRecurringEndDate}
                                             selectedDays={selectedDays}
                                             handleDayToggle={handleDayToggle}
                                             selectedSlotsByDay={selectedSlotsByDay}
                                             onSlotSelect={handleSlotSelect}
                                             fieldSchedules={bookingData.fieldSchedules || []}
                                             generateRecurringSessions={generateRecurringSessions}
                                             onBookingDataChange={handleInputChange}
                                        />
                                        <PriceSummarySection
                                             bookingData={bookingData}
                                             isRecurring={isRecurring}
                                             recurringWeeks={0} // Không dùng nữa, để tương thích
                                             selectedDays={selectedDays}
                                             selectedSlotsByDay={selectedSlotsByDay}
                                             fieldSchedules={bookingData.fieldSchedules || []}
                                             formatPrice={formatPrice}
                                        />
                                        <Button
                                             onClick={handlePayment}
                                             disabled={isProcessing || (isRecurring && (!recurringStartDate || !recurringEndDate || selectedDays.length === 0 || Object.keys(selectedSlotsByDay).length === 0))}
                                             className={`w-full py-3 rounded-lg text-white font-semibold ${isProcessing || (isRecurring && (!recurringStartDate || !recurringEndDate || selectedDays.length === 0 || Object.keys(selectedSlotsByDay).length === 0)) ? "bg-gray-400" : "bg-teal-600 hover:bg-teal-700"}`}
                                        >
                                             {isProcessing ? "Đang xử lý..." :
                                                  isRecurring ? (() => {
                                                       // Tính số tuần từ startDate và endDate
                                                       if (recurringStartDate && recurringEndDate) {
                                                            try {
                                                                 const start = new Date(recurringStartDate);
                                                                 const end = new Date(recurringEndDate);
                                                                 const diffTime = end - start;
                                                                 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                                 const weeks = Math.ceil(diffDays / 7);
                                                                 return `Giữ chỗ ${weeks} tuần & tiếp tục thanh toán`;
                                                            } catch {
                                                                 return "Giữ chỗ định kỳ & tiếp tục thanh toán";
                                                            }
                                                       }
                                                       return "Giữ chỗ định kỳ & tiếp tục thanh toán";
                                                  })() :
                                                       "Giữ chỗ & tiếp tục thanh toán"
                                             }
                                        </Button>
                                   </div>
                              </div>
                         )
                    }

                    {
                         step === "payment" && (
                              <PaymentStepSection
                                   bookingInfo={bookingInfo}
                                   ownerBankAccount={ownerBankAccount}
                                   bookingData={bookingData}
                                   isRecurring={isRecurring}
                                   recurringWeeks={0} // Không dùng nữa, để tương thích
                                   selectedDays={selectedDays}
                                   isProcessing={isProcessing}
                                   formatPrice={formatPrice}
                                   errors={errors}
                                   onConfirmPayment={handleConfirmPayment}
                                   isPaymentLocked={isPaymentLockActive}
                                   lockCountdownSeconds={lockCountdownSeconds}
                                   onCancelBooking={handleCancelBookingDuringPayment}
                              />
                         )
                    }

                    {
                         step === "confirmation" && (
                              <ConfirmationStepSection
                                   isRecurring={isRecurring}
                                   recurringWeeks={0} // Không dùng nữa, để tương thích
                                   hasOpponent={hasOpponent}
                                   createdMatchRequest={createdMatchRequest}
                                   createdCommunityPost={createdCommunityPost}
                                   onClose={onClose}
                                   onSuccess={onSuccess}
                                   navigate={navigate}
                              />
                         )
                    }
               </div >

               {/* Email Verification Modal */}
               < EmailVerificationModal
                    isOpen={showEmailVerification}
                    onClose={() => setShowEmailVerification(false)}
                    user={user}
                    onSuccess={handleEmailVerificationSuccess}
                    title="Xác thực Email để Đặt Sân"
               />

               {/* Recurring Opponent Selection Modal */}
               {
                    showOpponentSelection && (
                         <RecurringOpponentSelection
                              isRecurring={isRecurring}
                              recurringSessions={generateRecurringSessions()}
                              onOpponentSelection={handleOpponentSelection}
                              onClose={() => setShowOpponentSelection(false)}
                         />
                    )
               }
          </Modal >
     );
}