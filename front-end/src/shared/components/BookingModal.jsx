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
     navigate,
     fieldSchedules = []
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
     const [recurringStartDate, setRecurringStartDate] = useState(null); // Ngày bắt đầu gói cố định
     const [recurringEndDate, setRecurringEndDate] = useState(null); // Ngày kết thúc gói cố định
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

     // Tính số tuần từ recurringStartDate và recurringEndDate để hiển thị ở các bước sau
     const recurringWeeks = (() => {
          if (!isRecurring || !recurringStartDate || !recurringEndDate) return 0;
          try {
               const start = new Date(recurringStartDate);
               const end = new Date(recurringEndDate);
               if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return 0;
               const diffTime = end.getTime() - start.getTime();
               const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
               return Math.max(1, Math.ceil(diffDays / 7));
          } catch {
               return 0;
          }
     })();

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
          if (!isRecurring || !recurringStartDate || !recurringEndDate || !Array.isArray(selectedDays) || selectedDays.length === 0) {
               return [];
          }
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
          } catch (error) {

               return [];
          }
     };
     // Tính giá cho từng slot dựa trên TimeSlots (chứa giá) hoặc fieldSchedules
     const getSlotPrice = (slotId) => {
          if (!slotId) return bookingData.price || 0;

          if (Array.isArray(bookingData?.fieldTimeSlots) && bookingData.fieldTimeSlots.length > 0) {
               const timeSlot = bookingData.fieldTimeSlots.find((s) =>
                    String(s.slotId || s.SlotId || s.slotID || s.SlotID) === String(slotId)
               );
               if (timeSlot) {
                    return (
                         timeSlot.price ||
                         timeSlot.Price ||
                         timeSlot.unitPrice ||
                         timeSlot.UnitPrice ||
                         0
                    );
               }
          }

          if (Array.isArray(fieldSchedules) && fieldSchedules.length > 0) {
               const schedule = fieldSchedules.find((s) =>
                    String(s.slotId || s.SlotId || s.slotID || s.SlotID) === String(slotId)
               );
               if (schedule) {
                    return (
                         schedule.price ||
                         schedule.Price ||
                         schedule.unitPrice ||
                         schedule.UnitPrice ||
                         0
                    );
               }
          }

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


          const total = subtotal; // Không áp dụng giảm giá, tổng = đơn giá * số buổi
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
               discountPercent: 0,
               discountAmount: 0
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
                    console.log("📥 [FETCH SCHEDULES] Fetching schedules for fieldId:", bookingData.fieldId);
                    const [schedulesResult, timeSlotsResult] = await Promise.all([
                         fetchPublicFieldSchedulesByField(bookingData.fieldId),
                         fetchTimeSlotsByField(bookingData.fieldId)
                    ]);

                    console.log("📥 [FETCH SCHEDULES] schedulesResult:", schedulesResult);
                    console.log("📥 [FETCH SCHEDULES] timeSlotsResult:", timeSlotsResult);

                    // Xử lý schedules
                    if (schedulesResult.success && Array.isArray(schedulesResult.data)) {
                         console.log("📥 [FETCH SCHEDULES] Raw schedules count:", schedulesResult.data.length);

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
                                        console.warn("⚠️ [FETCH SCHEDULES] Error parsing date:", scheduleDate, e);
                                   }
                              }

                              return schedule;
                         });

                         console.log("📥 [FETCH SCHEDULES] Processed schedules with dayOfWeek:", schedulesWithDayOfWeek);
                         console.log("📥 [FETCH SCHEDULES] Sample schedule:", schedulesWithDayOfWeek[0]);

                         setBookingData(prev => {
                              // Chỉ update nếu fieldId thay đổi hoặc chưa có schedule
                              if (!prev.fieldSchedules || prev.fieldSchedules.length === 0 || prev.fieldId !== bookingData.fieldId) {
                                   console.log("✅ [FETCH SCHEDULES] Updating fieldSchedules with", schedulesWithDayOfWeek.length, "schedules");
                                   return {
                                        ...prev,
                                        fieldSchedules: schedulesWithDayOfWeek
                                   };
                              }
                              console.log("⏭️ [FETCH SCHEDULES] Skipping update - schedules already exist");
                              return prev;
                         });
                    } else {
                         console.warn("⚠️ [FETCH SCHEDULES] No schedules found or invalid response:", schedulesResult);
                    }

                    // Xử lý TimeSlots (để lấy giá)
                    if (timeSlotsResult && Array.isArray(timeSlotsResult.data)) {
                         console.log("📥 [FETCH SCHEDULES] TimeSlots count:", timeSlotsResult.data.length);
                         setBookingData(prev => {
                              // Chỉ update nếu fieldId thay đổi hoặc chưa có TimeSlots
                              if (!prev.fieldTimeSlots || prev.fieldTimeSlots.length === 0 || prev.fieldId !== bookingData.fieldId) {
                                   console.log("✅ [FETCH SCHEDULES] Updating fieldTimeSlots with", timeSlotsResult.data.length, "time slots");
                                   return {
                                        ...prev,
                                        fieldTimeSlots: timeSlotsResult.data
                                   };
                              }
                              return prev;
                         });
                    } else {
                         console.warn("⚠️ [FETCH SCHEDULES] No TimeSlots found or invalid response:", timeSlotsResult);
                    }
               } catch (error) {
                    console.error("❌ [FETCH SCHEDULES] Error fetching schedules:", error);
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
          // Validation khác nhau cho đặt lẻ và đặt cố định
          const errors = {};

          // Kiểm tra fieldId (bắt buộc cho cả hai)
          if (!bookingData.fieldId) {
               errors.fieldId = "Vui lòng chọn sân";
          }

          // Kiểm tra thông tin liên hệ (bắt buộc cho cả hai)
          if (!bookingData.customerName?.trim()) {
               errors.customerName = "Vui lòng nhập họ và tên";
          }

          if (!bookingData.customerPhone?.trim()) {
               errors.customerPhone = "Vui lòng nhập số điện thoại";
          } else if (!/^[0-9+\-\s()]{10,15}$/.test(bookingData.customerPhone)) {
               errors.customerPhone = "Số điện thoại không hợp lệ";
          }

          // Email validation
          if (bookingData.requiresEmail && !bookingData.customerEmail?.trim()) {
               errors.customerEmail = "Vui lòng nhập email";
          } else if (
               bookingData.customerEmail &&
               !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingData.customerEmail)
          ) {
               errors.customerEmail = "Email không hợp lệ";
          }

          if (isRecurring) {
               // Validation cho đặt cố định
               if (!recurringStartDate) {
                    errors.startDate = "Vui lòng chọn ngày bắt đầu";
               }
               if (!recurringEndDate) {
                    errors.endDate = "Vui lòng chọn ngày kết thúc";
               }
               if (selectedDays.length === 0) {
                    errors.selectedDays = "Vui lòng chọn ít nhất một ngày trong tuần";
               }
               // Kiểm tra tất cả các ngày đã chọn đều có slot
               const daysWithoutSlots = selectedDays.filter(day => !selectedSlotsByDay?.[day]);
               if (daysWithoutSlots.length > 0) {
                    errors.selectedSlots = "Vui lòng chọn khung giờ cho tất cả các ngày đã chọn";
               }
               // Kiểm tra có ít nhất một session được tạo
               const sessions = generateRecurringSessions();
               if (sessions.length === 0) {
                    errors.sessions = "Không có buổi nào được tạo. Vui lòng kiểm tra lại ngày và khung giờ đã chọn";
               }
          } else {
               // Validation cho đặt lẻ
               if (!bookingData.date) {
                    errors.date = "Vui lòng chọn ngày";
               }
               if (!bookingData.slotId) {
                    errors.slotId = "Vui lòng chọn giờ";
               }
               // Duration validation chỉ cho đặt lẻ
               const durationNum = Number(bookingData.duration || 0);
               if (Number.isNaN(durationNum) || durationNum <= 0) {
                    errors.duration = "Thời lượng không hợp lệ";
               } else if (durationNum > 1.5) {
                    errors.duration = "Thời lượng tối đa 1 tiếng 30 phút";
               }
          }

          setErrors(errors);
          const isValid = Object.keys(errors).length === 0;

          if (!isValid) {
               console.warn("⚠️ [VALIDATE FORM] Validation failed:", errors);
          } else {
               console.log("✅ [VALIDATE FORM] Validation passed");
          }

          return isValid;
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
               if (slotId === null || slotId === undefined || slotId === 0) {
                    const newSlots = { ...prev };
                    delete newSlots[dayOfWeek];
                    return newSlots;
               } else {
                    return { ...prev, [dayOfWeek]: slotId };
               }
          });
     };

     // Helper function để kiểm tra button có được enable không
     const isButtonDisabled = () => {
          if (isProcessing) {

               return true;
          }

          if (isRecurring) {
               if (!recurringStartDate) {

                    return true;
               }
               if (!recurringEndDate) {

                    return true;
               }
               if (selectedDays.length === 0) {

                    return true;
               }

               // Kiểm tra xem tất cả các ngày đã chọn có slot chưa
               const allDaysHaveSlots = selectedDays.every(day => {
                    const slotId = selectedSlotsByDay?.[day];
                    const hasSlot = slotId !== null && slotId !== undefined && slotId !== 0;
                    if (!hasSlot) {

                    }
                    return hasSlot;
               });

               if (!allDaysHaveSlots) {

                    return true;
               }


               return false;
          } else {
               // Đặt lẻ
               if (!bookingData.slotId) {
                    return true;
               }
               if (!bookingData.date) {

                    return true;
               }

               return false;
          }
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
          console.log("🚀 [HANDLE PAYMENT] Starting handlePayment...");
          console.log("🚀 [HANDLE PAYMENT] isRecurring:", isRecurring);
          console.log("🚀 [HANDLE PAYMENT] bookingData:", bookingData);

          if (!validateForm()) {
               console.warn("⚠️ [HANDLE PAYMENT] Form validation failed");
               return;
          }
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
               console.log("🚀 [HANDLE PAYMENT] After validation, isRecurring:", isRecurring);
               // Nếu là đặt cố định: kiểm tra trước xem đủ số buổi có schedule trong khoảng chọn hay không
               if (isRecurring) {
                    console.log("✅ [HANDLE PAYMENT] Entering isRecurring block");
                    try {
                         console.log("🔍 [RECURRING CHECK] Starting schedule validation...");
                         console.log("📅 [RECURRING CHECK] recurringStartDate:", recurringStartDate);
                         console.log("📅 [RECURRING CHECK] recurringEndDate:", recurringEndDate);
                         console.log("📅 [RECURRING CHECK] selectedDays:", selectedDays);
                         console.log("📅 [RECURRING CHECK] selectedSlotsByDay:", selectedSlotsByDay);

                         const sessions = generateRecurringSessions() || [];
                         console.log("📋 [RECURRING CHECK] Generated sessions:", sessions);
                         console.log("📋 [RECURRING CHECK] Total sessions count:", sessions.length);

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

                         console.log("📚 [RECURRING CHECK] bookingData.fieldSchedules:", bookingData.fieldSchedules);
                         console.log("📚 [RECURRING CHECK] bookingData.fieldSchedules type:", typeof bookingData.fieldSchedules);
                         console.log("📚 [RECURRING CHECK] bookingData.fieldSchedules isArray:", Array.isArray(bookingData.fieldSchedules));

                         const schedules = Array.isArray(bookingData.fieldSchedules) ? bookingData.fieldSchedules : [];
                         console.log("📚 [RECURRING CHECK] Available schedules:", schedules);
                         console.log("📚 [RECURRING CHECK] Total schedules count:", schedules.length);

                         // Log sample schedule để xem format
                         if (schedules.length > 0) {
                              console.log("📚 [RECURRING CHECK] Sample schedule (first 3):", schedules.slice(0, 3).map(sch => ({
                                   scheduleId: sch.scheduleId || sch.ScheduleId,
                                   slotId: sch.slotId || sch.SlotId || sch.slotID || sch.SlotID,
                                   slotIdType: typeof (sch.slotId || sch.SlotId || sch.slotID || sch.SlotID),
                                   date: sch.date || sch.Date,
                                   dateType: typeof (sch.date || sch.Date),
                                   dayOfWeek: sch.dayOfWeek ?? sch.DayOfWeek ?? sch.weekday ?? sch.Weekday,
                                   dayOfWeekType: typeof (sch.dayOfWeek ?? sch.DayOfWeek ?? sch.weekday ?? sch.Weekday),
                                   rawSchedule: sch
                              })));

                              // Log tất cả các slotId và dayOfWeek unique trong schedules
                              const uniqueSlotIds = [...new Set(schedules.map(sch => String(sch.slotId || sch.SlotId || sch.slotID || sch.SlotID)))];
                              const uniqueDayOfWeeks = [...new Set(schedules.map(sch => {
                                   const dow = sch.dayOfWeek ?? sch.DayOfWeek ?? sch.weekday ?? sch.Weekday;
                                   return dow !== undefined && dow !== null ? Number(dow) : null;
                              }).filter(d => d !== null))];

                              console.log("📚 [RECURRING CHECK] Unique slotIds in schedules:", uniqueSlotIds);
                              console.log("📚 [RECURRING CHECK] Unique dayOfWeeks in schedules:", uniqueDayOfWeeks);
                              console.log("📚 [RECURRING CHECK] Looking for slotId=66, dayOfWeek=1 or 2");

                              // Tìm schedules có slotId=66
                              const schedulesWithSlot66 = schedules.filter(sch => {
                                   const slotId = sch.slotId || sch.SlotId || sch.slotID || sch.SlotID;
                                   return String(slotId) === "66";
                              });
                              console.log("📚 [RECURRING CHECK] Schedules with slotId=66:", schedulesWithSlot66.length);
                              if (schedulesWithSlot66.length > 0) {
                                   console.log("📚 [RECURRING CHECK] Sample schedule with slotId=66:", schedulesWithSlot66[0]);
                                   const dayOfWeeksInSlot66 = [...new Set(schedulesWithSlot66.map(sch => {
                                        const dow = sch.dayOfWeek ?? sch.DayOfWeek ?? sch.weekday ?? sch.Weekday;
                                        return dow !== undefined && dow !== null ? Number(dow) : null;
                                   }).filter(d => d !== null))];
                                   console.log("📚 [RECURRING CHECK] DayOfWeeks in schedules with slotId=66:", dayOfWeeksInSlot66);
                              }
                         }

                         if (schedules.length > 0) {
                              // Kiểm tra: với mỗi dayOfWeek + slotId combination trong selectedSlotsByDay, 
                              // cần có ít nhất 1 schedule có cùng dayOfWeek và slotId
                              // (Không cần match theo date vì selectedSlots chỉ cần dayOfWeek và slotId)
                              const uniqueDaySlotCombos = new Set();
                              selectedDays.forEach(dayOfWeek => {
                                   const slotId = selectedSlotsByDay?.[dayOfWeek];
                                   if (slotId) {
                                        uniqueDaySlotCombos.add(`${dayOfWeek}-${slotId}`);
                                   }
                              });

                              console.log("🔍 [RECURRING CHECK] Unique dayOfWeek-slotId combinations needed:", Array.from(uniqueDaySlotCombos));

                              // Helper function để tính dayOfWeek từ date - ĐỊNH NGHĨA TRƯỚC KHI SỬ DỤNG
                              const getDayOfWeekFromSchedule = (schedule) => {
                                   // Thử lấy dayOfWeek trực tiếp
                                   let scheduleDayOfWeek = schedule.dayOfWeek ?? schedule.DayOfWeek ?? schedule.weekday ?? schedule.Weekday;

                                   // Nếu không có, tính từ date
                                   if (scheduleDayOfWeek === undefined || scheduleDayOfWeek === null) {
                                        const scheduleDate = schedule.date ?? schedule.Date ?? schedule.scheduleDate ?? schedule.ScheduleDate;
                                        if (scheduleDate) {
                                             try {
                                                  const date = typeof scheduleDate === 'string'
                                                       ? new Date(scheduleDate)
                                                       : (scheduleDate.year && scheduleDate.month && scheduleDate.day
                                                            ? new Date(scheduleDate.year, scheduleDate.month - 1, scheduleDate.day)
                                                            : new Date(scheduleDate));
                                                  if (!isNaN(date.getTime())) {
                                                       scheduleDayOfWeek = date.getDay(); // 0 = CN, 1 = T2, ..., 6 = T7
                                                  }
                                             } catch (e) {
                                                  console.warn("⚠️ [RECURRING CHECK] Error parsing date:", scheduleDate, e);
                                             }
                                        }
                                   }

                                   return scheduleDayOfWeek;
                              };

                              // Log sample schedules để debug
                              if (schedules.length > 0) {
                                   const sampleSchedule = schedules[0];
                                   console.log("📋 [RECURRING CHECK] Sample schedule structure:", {
                                        scheduleId: sampleSchedule.scheduleId || sampleSchedule.ScheduleId,
                                        slotId: sampleSchedule.slotId || sampleSchedule.SlotId,
                                        date: sampleSchedule.date || sampleSchedule.Date || sampleSchedule.scheduleDate || sampleSchedule.ScheduleDate,
                                        dayOfWeek: getDayOfWeekFromSchedule(sampleSchedule),
                                        allKeys: Object.keys(sampleSchedule)
                                   });
                              }

                              let hasScheduleCount = 0;
                              const sessionDetails = [];

                              // Kiểm tra từng combination
                              uniqueDaySlotCombos.forEach(combo => {
                                   const [dayOfWeekStr, slotIdStr] = combo.split('-');
                                   const dayOfWeek = Number(dayOfWeekStr);
                                   const slotId = Number(slotIdStr);

                                   console.log(`🔎 [RECURRING CHECK] Checking combo: dayOfWeek=${dayOfWeek} (${['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][dayOfWeek]}), slotId=${slotId}`);

                                   // Log tất cả schedules có cùng slotId để debug
                                   const schedulesWithSlotId = schedules.filter(sch => {
                                        const scheduleSlotId = sch.slotId || sch.SlotId || sch.slotID || sch.SlotID;
                                        return String(scheduleSlotId) === String(slotId);
                                   });
                                   console.log(`📋 [RECURRING CHECK] Found ${schedulesWithSlotId.length} schedules with slotId=${slotId}`);
                                   if (schedulesWithSlotId.length > 0) {
                                        const dayOfWeeksInSlot = schedulesWithSlotId.map(sch => getDayOfWeekFromSchedule(sch)).filter(d => d !== undefined && d !== null);
                                        console.log(`📋 [RECURRING CHECK] DayOfWeeks in schedules with slotId=${slotId}:`, [...new Set(dayOfWeeksInSlot)]);
                                   }

                                   // Tìm schedules có cùng slotId và dayOfWeek
                                   const matchingSchedules = schedules.filter((sch) => {
                                        const scheduleSlotId = sch.slotId || sch.SlotId || sch.slotID || sch.SlotID;
                                        const scheduleDayOfWeek = getDayOfWeekFromSchedule(sch);

                                        const slotMatches = String(scheduleSlotId) === String(slotId);
                                        const dayMatches = scheduleDayOfWeek !== undefined && scheduleDayOfWeek !== null && Number(scheduleDayOfWeek) === Number(dayOfWeek);

                                        if (slotMatches && dayMatches) {
                                             console.log(`✅ [RECURRING CHECK] Match found:`, {
                                                  scheduleId: sch.scheduleId || sch.ScheduleId,
                                                  slotId: scheduleSlotId,
                                                  dayOfWeek: scheduleDayOfWeek,
                                                  date: sch.date || sch.Date
                                             });
                                        }

                                        return slotMatches && dayMatches;
                                   });

                                   if (matchingSchedules.length > 0) {
                                        console.log(`✅ [RECURRING CHECK] Found ${matchingSchedules.length} schedules for dayOfWeek=${dayOfWeek}, slotId=${slotId}`);
                                        console.log(`✅ [RECURRING CHECK] Sample schedule:`, {
                                             scheduleId: matchingSchedules[0].scheduleId || matchingSchedules[0].ScheduleId,
                                             slotId: matchingSchedules[0].slotId || matchingSchedules[0].SlotId,
                                             dayOfWeek: getDayOfWeekFromSchedule(matchingSchedules[0])
                                        });
                                        hasScheduleCount += 1;
                                   } else {
                                        console.warn(`⚠️ [RECURRING CHECK] No schedules found for dayOfWeek=${dayOfWeek}, slotId=${slotId}`);
                                   }

                                   sessionDetails.push({
                                        dayOfWeek: dayOfWeek,
                                        slotId: slotId,
                                        found: matchingSchedules.length > 0,
                                        matchingSchedulesCount: matchingSchedules.length
                                   });
                              });

                              console.log("📊 [RECURRING CHECK] Combination matching details:", sessionDetails);
                              console.log("📊 [RECURRING CHECK] hasScheduleCount:", hasScheduleCount, "out of", uniqueDaySlotCombos.size);

                              if (hasScheduleCount < uniqueDaySlotCombos.size) {
                                   console.error("❌ [RECURRING CHECK] Not enough schedules! Missing:", uniqueDaySlotCombos.size - hasScheduleCount);
                                   setIsProcessing(false);
                                   await Swal.fire({
                                        icon: "warning",
                                        title: "Không đủ lịch để đặt cố định",
                                        html: `
                                             <p class="mb-2">Không tìm thấy lịch cho <strong>${uniqueDaySlotCombos.size - hasScheduleCount}</strong> trong số <strong>${uniqueDaySlotCombos.size}</strong> khung giờ đã chọn.</p>
                                             <p class="text-sm text-gray-600">Vui lòng liên hệ chủ sân để thêm lịch cho các khung giờ còn thiếu, hoặc chọn khung giờ khác.</p>
                                        `,
                                        confirmButtonColor: "#f59e0b",
                                   });
                                   return;
                              }

                              console.log("✅ [RECURRING CHECK] All dayOfWeek-slotId combinations have matching schedules!");
                         } else {
                              console.warn("⚠️ [RECURRING CHECK] No schedules available in bookingData.fieldSchedules");
                         }
                    } catch (err) {
                         console.error("❌ [RECURRING CHECK] Error during schedule validation:", err);
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

                    }
               } else if (!scheduleId) {

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


                    const apiResult = await createBookingAPI(bookingPayload);


                    if (!apiResult.success) {

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

                    // Sinh session CHO BACKEND: chỉ lấy pattern 1 tuần đầu tiên (BE tự nhân theo số tuần)
                    const generateBackendSessions = () => {
                         try {
                              const sessions = [];
                              const oneWeekEnd = new Date(start);
                              oneWeekEnd.setDate(oneWeekEnd.getDate() + 6);
                              oneWeekEnd.setHours(23, 59, 59, 999);
                              const rangeEnd = end < oneWeekEnd ? end : oneWeekEnd;

                              for (let d = new Date(start); d <= rangeEnd; d.setDate(d.getDate() + 1)) {
                                   const weekday = d.getDay(); // 0 = CN .. 6 = T7
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

                    // Tìm scheduleId tương ứng cho từng session backend (1 tuần)
                    const buildSelectedSlots = () => {
                         if (!Array.isArray(booking.fieldSchedules) || booking.fieldSchedules.length === 0) {
                              console.warn("⚠️ [BUILD SELECTED SLOTS] fieldSchedules is empty");
                              return [];
                         }

                         const result = [];
                         const seenDaySlot = new Set(); // đảm bảo mỗi (dayOfWeek, slotId) chỉ 1 entry
                         const backendSessions = generateBackendSessions();

                         const normalizeDateString = (value) => {
                              if (!value) return "";
                              if (value instanceof Date) return value.toISOString().split("T")[0];
                              if (typeof value === "string") return value.split("T")[0];
                              if (value.year && value.month && value.day) {
                                   return `${value.year}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`;
                              }
                              return "";
                         };

                         backendSessions.forEach((session, index) => {
                              const slotId = session.slotId;
                              const dayOfWeek = session.dayOfWeek;
                              const sessionDateStr = normalizeDateString(session.date);
                              if (!slotId || !sessionDateStr) return;

                              const key = `${dayOfWeek}-${slotId}`;
                              if (seenDaySlot.has(key)) return;

                              const matchingSchedule = booking.fieldSchedules.find(s => {
                                   const scheduleSlotId = s.slotId || s.SlotId || s.slotID || s.SlotID;
                                   const scheduleDateStr = normalizeDateString(s.date || s.Date || s.scheduleDate || s.ScheduleDate);
                                   return String(scheduleSlotId) === String(slotId) && scheduleDateStr === sessionDateStr;
                              });

                              if (!matchingSchedule) {
                                   console.warn("⚠️ [BUILD SELECTED SLOTS] No schedule found for backend session", {
                                        index,
                                        slotId,
                                        sessionDateStr
                                   });
                                   return;
                              }

                              const scheduleId = matchingSchedule.scheduleId || matchingSchedule.ScheduleId || matchingSchedule.scheduleID || matchingSchedule.ScheduleID || 0;
                              if (!scheduleId) {
                                   console.warn("⚠️ [BUILD SELECTED SLOTS] Schedule has no scheduleId", matchingSchedule);
                                   return;
                              }

                              seenDaySlot.add(key);

                              result.push({
                                   slotId: Number(slotId) || 0,
                                   dayOfWeek: Number(dayOfWeek) || 0,
                                   fieldId: Number(booking.fieldId) || 0,
                                   scheduleId: Number(scheduleId) || 0
                              });
                         });

                         console.log("✅ [BUILD SELECTED SLOTS] Generated (backend pattern)", result.length, "slot entries:", result);
                         return result;
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

                    // Tính lại số buổi & tổng tiền gói CHO BACKEND (pattern 1 tuần)
                    const backendSessions = generateBackendSessions();
                    const totalSessionsForBackend =
                         backendSessions.length || booking.totalSessions || bookingData.totalSessions || 0;

                    const safeTotal = (() => {
                         if (!Array.isArray(backendSessions) || backendSessions.length === 0) return 0;
                         try {
                              return backendSessions.reduce((sum, session) => {
                                   const price = getSlotPrice(session.slotId);
                                   return sum + (Number(price) || 0);
                              }, 0);
                         } catch {
                              return 0;
                         }
                    })();
                    const packagePayload = {
                         userId: userId,
                         fieldId: booking.fieldId,
                         packageName: booking.packageName || `Gói định kỳ`,
                         startDate: start.toISOString().split("T")[0],
                         endDate: end.toISOString().split("T")[0],
                         totalPrice: safeTotal,
                         selectedSlots: selectedSlots
                    };



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
                    const apiTotalPrice = Number(data.totalPrice ?? packagePayload.totalPrice ?? 0);
                    const apiDepositAmount = Number(data.depositAmount ?? 0);
                    const apiRemainingAmount = Math.max(0, apiTotalPrice - apiDepositAmount);

                    setBookingData(prev => ({
                         ...prev,
                         totalPrice: apiTotalPrice || prev.totalPrice,
                         subtotal: apiTotalPrice || prev.subtotal,
                         totalSessions: totalSessionsForBackend || prev.totalSessions,
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

               setStep("confirmation");
          }
     };

     return (
          <Modal
               isOpen={isOpen}
               onClose={handleModalClose}
               title={bookingType === "complex" ? "Đặt Sân Lớn" : bookingType === "quick" ? "Đặt Nhanh" : "Đặt Sân"}
               className="max-w-6xl z-[100] w-full mx-4 max-h-[90vh] overflow-y-auto rounded-xl shadow-lg scrollbar-hide"
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
                                             fieldTimeSlots={bookingData.fieldTimeSlots || []}
                                        />
                                        <PriceSummarySection
                                             bookingData={bookingData}
                                             isRecurring={isRecurring}
                                             recurringWeeks={recurringWeeks}
                                             selectedDays={selectedDays}
                                             selectedSlotsByDay={selectedSlotsByDay}
                                             fieldSchedules={bookingData.fieldSchedules || []}
                                             formatPrice={formatPrice}
                                        />
                                        <Button
                                             type="button"
                                             onClick={(e) => {
                                                  console.log("🖱️ [BUTTON CLICK] Button clicked!", {
                                                       disabled: isButtonDisabled(),
                                                       isProcessing,
                                                       event: e
                                                  });

                                                  const buttonDisabled = isButtonDisabled();
                                                  if (buttonDisabled || isProcessing) {
                                                       console.warn("⚠️ [BUTTON CLICK] Button click ignored", {
                                                            buttonDisabled,
                                                            isProcessing
                                                       });
                                                       e.preventDefault();
                                                       e.stopPropagation();
                                                       return;
                                                  }

                                                  console.log("✅ [BUTTON CLICK] Calling handlePayment()...");
                                                  try {
                                                       handlePayment();
                                                  } catch (error) {
                                                       console.error("❌ [BUTTON CLICK] Error calling handlePayment:", error);
                                                  }
                                             }}
                                             className={`w-full py-3 rounded-lg text-white font-semibold transition-all ${isButtonDisabled() || isProcessing ? "bg-gray-400 cursor-not-allowed opacity-50" : "bg-teal-600 hover:bg-teal-700 cursor-pointer active:scale-95"}`}
                                             style={{
                                                  position: 'relative',
                                                  zIndex: 10,
                                             }}
                                             aria-disabled={isButtonDisabled() || isProcessing}
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
                                   recurringWeeks={recurringWeeks}
                                   selectedDays={selectedDays}
                                   selectedSlotsByDay={selectedSlotsByDay}
                                   isProcessing={isProcessing}
                                   formatPrice={formatPrice}
                                   errors={errors}
                                   onConfirmPayment={handleConfirmPayment}
                                   isPaymentLocked={isPaymentLockActive}
                                   lockCountdownSeconds={lockCountdownSeconds}
                                   startDate={recurringStartDate}
                                   endDate={recurringEndDate}
                                   fieldSchedules={bookingData.fieldSchedules || []}
                                   onCancelBooking={handleCancelBookingDuringPayment}
                              />
                         )
                    }

                    {
                         step === "confirmation" && (
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