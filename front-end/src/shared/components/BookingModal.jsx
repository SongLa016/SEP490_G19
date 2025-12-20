import { useState, useEffect, useCallback } from "react";
import { AlertCircle } from "lucide-react";
import Swal from 'sweetalert2';
import { Button, Modal } from "./ui";
import { validateBookingData, checkFieldAvailability, cancelBooking } from "../services/bookings";
import { validateVietnamPhone } from "../services/authService";
import {
     createBooking,
     createBookingAPI,
     createBookingPackage,
     fetchOwnerBankAccounts,
     fetchBankAccount,
     fetchPublicFieldSchedulesByField,
     fetchTimeSlotsByField
} from "../index";
import { updateFieldScheduleStatus } from "../services/fieldSchedules";
import EmailVerificationModal from "./EmailVerificationModal";
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
     bookingType = "field",
     navigate,
     fieldSchedules = []
}) {
     const { openBookingModal, closeBookingModal } = useModal();
     const [step, setStep] = useState("details");
     const [isProcessing, setIsProcessing] = useState(false);
     const [errors, setErrors] = useState({});
     const [bookingInfo, setBookingInfo] = useState(null); // Lưu thông tin booking từ API
     const [ownerBankAccount, setOwnerBankAccount] = useState(null); // Thông tin ngân hàng owner
     const [createdMatchRequest, setCreatedMatchRequest] = useState(null);
     const [createdCommunityPost, setCreatedCommunityPost] = useState(null);
     const hasOpponent = "unknown";
     const [showEmailVerification, setShowEmailVerification] = useState(false);
     const [isRecurring, setIsRecurring] = useState(false);
     const [recurringStartDate, setRecurringStartDate] = useState(null); // Ngày bắt đầu gói cố định
     const [recurringEndDate, setRecurringEndDate] = useState(null); // Ngày kết thúc gói cố định
     const [selectedDays, setSelectedDays] = useState([]);
     const [selectedSlotsByDay, setSelectedSlotsByDay] = useState({}); // { dayOfWeek: slotId } - slot đã chọn cho mỗi thứ
     const [suggestedDays, setSuggestedDays] = useState([]);
     const [isSuggesting, setIsSuggesting] = useState(false);
     const PAYMENT_LOCK_DURATION_MS = 10 * 60 * 1000;
     const [paymentLockExpiresAt, setPaymentLockExpiresAt] = useState(null);
     const [lockRemainingMs, setLockRemainingMs] = useState(0);
     const lockCountdownSeconds = lockRemainingMs > 0 ? Math.ceil(lockRemainingMs / 1000) : 0;
     const isPaymentLockActive = step === "payment" && paymentLockExpiresAt !== null;

     // Tính số tuần từ ngày bắt đầu đến ngày kết thúc
     const recurringWeeks = (() => {
          if (!isRecurring || !recurringStartDate || !recurringEndDate) return 0;
          try {
               const start = new Date(recurringStartDate);
               const end = new Date(recurringEndDate);
               if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return 0;
               const diffTime = end.getTime() - start.getTime();
               const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // tính số ngày
               return Math.max(1, Math.ceil(diffDays / 7));
          } catch {
               return 0;
          }
     })();

     // chặn layout shift khi modal mở
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

          }
     }, [isOpen]);

     // Nếu sân chưa được owner cấu hình chính sách đặt cọc, mặc định không yêu cầu cọc (0%)
     const DEFAULT_DEPOSIT_PERCENT = 0; // 0% 

     // tính thời gian từ thời gian bắt đầu đến thời gian kết thúc
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
     // chuẩn hóa giá trị phần trăm
     const normalizePercentValue = (value) => {
          if (value === null || value === undefined || value === "") return null;
          const numeric = Number(value);
          if (Number.isNaN(numeric) || numeric < 0) return null;
          return numeric > 1 ? numeric / 100 : numeric;
     };
     // chuẩn hóa tiền 
     const normalizeMoneyValue = (value) => {
          if (value === null || value === undefined || value === "") return 0;
          const numeric = Number(value);
          if (Number.isNaN(numeric) || numeric <= 0) return 0;
          return Math.round(numeric);
     };
     // lấy cấu hình đặt cọc
     const extractDepositConfig = useCallback((source) => {
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
     }, []);
     // tính số tiền đặt cọc
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
     // tính thời gian
     const initialDuration = fieldData?.duration ||
          (fieldData?.startTime && fieldData?.endTime
               ? calculateDuration(fieldData.startTime, fieldData.endTime)
               : 1);
     // lấy cấu hình đặt cọc
     const initialDepositConfig = extractDepositConfig(fieldData);
     // chuẩn hóa giá trị phần trăm
     const initialDepositPercent = typeof initialDepositConfig.percent === "number"
          ? initialDepositConfig.percent
          : DEFAULT_DEPOSIT_PERCENT;
     const resolvedUserName = user?.fullName || user?.FullName || user?.name || user?.Name || "";
     const resolvedUserPhone = user?.phone || user?.Phone || user?.phoneNumber || user?.PhoneNumber || "";
     const resolvedUserEmail = user?.email || user?.Email || user?.mail || user?.Mail || "";
     // lấy thông tin booking
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
          requiresEmail: !resolvedUserEmail,
          isRecurring: false,
          fieldSchedules: Array.isArray(fieldData?.fieldSchedules) ? fieldData.fieldSchedules : [],
          fieldTimeSlots: Array.isArray(fieldData?.fieldTimeSlots) ? fieldData.fieldTimeSlots : []
     });

     // Tạo danh sách các buổi định kỳ dự kiến từ startDate + endDate + các ngày trong tuần
     const generateRecurringSessions = useCallback(() => {
          if (!isRecurring || !recurringStartDate || !recurringEndDate || !Array.isArray(selectedDays) || selectedDays.length === 0) {
               return [];
          }
          try {
               const sessions = [];
               // định dạng ngày
               const parseDateString = (dateStr) => {
                    if (!dateStr) return null;
                    if (typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                         const [year, month, day] = dateStr.split("-").map(Number);
                         return new Date(year, month - 1, day);
                    }
                    const date = new Date(dateStr);
                    if (!isNaN(date.getTime())) {
                         const year = date.getFullYear();
                         const month = date.getMonth();
                         const day = date.getDate();
                         return new Date(year, month, day);
                    }
                    return null;
               };
               // lấy ngày bắt đầu và ngày kết thúc
               const start = parseDateString(recurringStartDate);
               const end = parseDateString(recurringEndDate);

               if (!start || !end) {
                    return [];
               }

               const normalizeDateString = (value) => {
                    if (!value) return "";
                    if (value instanceof Date) {
                         const year = value.getFullYear();
                         const month = value.getMonth() + 1;
                         const day = value.getDate();
                         return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    }
                    if (typeof value === "string") return value.split("T")[0];
                    if (value.year && value.month && value.day) {
                         return `${value.year}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`;
                    }
                    return "";
               };

               // lấy các ngày có schedule
               const scheduleDatesSet = new Set();
               if (Array.isArray(bookingData?.fieldSchedules)) {
                    bookingData.fieldSchedules.forEach(s => {
                         const scheduleDate = s.date ?? s.Date ?? s.scheduleDate ?? s.ScheduleDate;
                         if (scheduleDate) {
                              try {
                                   const date = typeof scheduleDate === 'string'
                                        ? new Date(scheduleDate)
                                        : (scheduleDate.year && scheduleDate.month && scheduleDate.day
                                             ? new Date(scheduleDate.year, scheduleDate.month - 1, scheduleDate.day)
                                             : new Date(scheduleDate));
                                   if (!isNaN(date.getTime())) {
                                        // Chỉ thêm vào set nếu ngày nằm trong khoảng start-end
                                        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                                        const startOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
                                        const endOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());

                                        if (dateOnly >= startOnly && dateOnly <= endOnly) {
                                             scheduleDatesSet.add(normalizeDateString(date));
                                        }
                                   }
                              } catch (e) {
                                   return;
                              }
                         }
                    });
               }
               // duyệt từ ngày bắt đầu đến ngày kết thúc, chọn ngày có weekday nằm trong selectedDays
               const compareDates = (date1, date2) => {
                    const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
                    const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
                    return d1 <= d2;
               };

               let d = new Date(start);
               while (compareDates(d, end)) {
                    const weekday = d.getDay();
                    const sessionDateStr = normalizeDateString(d);

                    // CHỈ tạo session nếu ngày đó có schedule VÀ thuộc ngày trong tuần đã chọn
                    if (selectedDays.includes(weekday) && scheduleDatesSet.has(sessionDateStr)) {
                         const selectedSlotId = selectedSlotsByDay?.[weekday];
                         if (selectedSlotId) {
                              let slotName = "";
                              let startTime = "";
                              let endTime = "";

                              // Ưu tiên: tìm schedule cho ngày cụ thể
                              if (Array.isArray(bookingData?.fieldSchedules) && sessionDateStr) {
                                   const matchingSchedule = bookingData.fieldSchedules.find(s => {
                                        const scheduleSlotId = s.slotId || s.SlotId || s.slotID || s.SlotID;
                                        const scheduleDateStr = normalizeDateString(s.date || s.Date || s.scheduleDate || s.ScheduleDate);
                                        return String(scheduleSlotId) === String(selectedSlotId) && scheduleDateStr === sessionDateStr;
                                   });

                                   if (matchingSchedule) {
                                        startTime = matchingSchedule.startTime || matchingSchedule.StartTime || "";
                                        endTime = matchingSchedule.endTime || matchingSchedule.EndTime || "";
                                        if (startTime && endTime) {
                                             slotName = `${startTime} - ${endTime}`;
                                        }
                                   }
                              }

                              // Fallback 1: nếu không tìm thấy schedule cho ngày cụ thể, tìm schedule cùng slotId và dayOfWeek
                              if (!slotName && Array.isArray(bookingData?.fieldSchedules)) {
                                   const scheduleByDayOfWeek = bookingData.fieldSchedules.find(s => {
                                        const scheduleSlotId = s.slotId || s.SlotId || s.slotID || s.SlotID;
                                        const scheduleDayOfWeek = s.dayOfWeek ?? s.DayOfWeek ?? s.weekday ?? s.Weekday;
                                        // Nếu không có dayOfWeek, tính từ date
                                        let calculatedDayOfWeek = scheduleDayOfWeek;
                                        if (calculatedDayOfWeek === undefined || calculatedDayOfWeek === null) {
                                             const scheduleDate = s.date || s.Date || s.scheduleDate || s.ScheduleDate;
                                             if (scheduleDate) {
                                                  try {
                                                       const date = typeof scheduleDate === 'string'
                                                            ? new Date(scheduleDate)
                                                            : (scheduleDate.year && scheduleDate.month && scheduleDate.day
                                                                 ? new Date(scheduleDate.year, scheduleDate.month - 1, scheduleDate.day)
                                                                 : new Date(scheduleDate));
                                                       if (!isNaN(date.getTime())) {
                                                            calculatedDayOfWeek = date.getDay();
                                                       }
                                                  } catch (e) {
                                                       return;
                                                  }
                                             }
                                        }
                                        return String(scheduleSlotId) === String(selectedSlotId) &&
                                             calculatedDayOfWeek !== undefined &&
                                             Number(calculatedDayOfWeek) === Number(weekday);
                                   });

                                   if (scheduleByDayOfWeek) {
                                        startTime = scheduleByDayOfWeek.startTime || scheduleByDayOfWeek.StartTime || "";
                                        endTime = scheduleByDayOfWeek.endTime || scheduleByDayOfWeek.EndTime || "";
                                        if (startTime && endTime) {
                                             slotName = `${startTime} - ${endTime}`;
                                        }
                                   }
                              }

                              // Fallback 2: nếu vẫn không tìm thấy, lấy từ fieldTimeSlots
                              if (!slotName && Array.isArray(bookingData?.fieldTimeSlots)) {
                                   const timeSlot = bookingData.fieldTimeSlots.find(ts =>
                                        String(ts.slotId || ts.SlotId || ts.slotID || ts.SlotID) === String(selectedSlotId)
                                   );
                                   if (timeSlot) {
                                        startTime = timeSlot.startTime || timeSlot.StartTime || "";
                                        endTime = timeSlot.endTime || timeSlot.EndTime || "";
                                        if (startTime && endTime) {
                                             slotName = `${startTime} - ${endTime}`;
                                        }
                                   }
                              }

                              // luôn thêm session vào danh sách, kể cả khi không có slotName
                              sessions.push({
                                   date: new Date(d),
                                   dayOfWeek: weekday,
                                   slotId: selectedSlotId,
                                   slotName: slotName || `Slot ${selectedSlotId}`,
                                   startTime: startTime,
                                   endTime: endTime
                              });
                         }
                    }
                    // Tăng ngày lên 1
                    d.setDate(d.getDate() + 1);
               }

               return sessions;
          } catch (error) {
               console.error("Error generating recurring sessions:", error);
               return [];
          }
     }, [isRecurring, recurringStartDate, recurringEndDate, selectedDays, selectedSlotsByDay, bookingData.fieldSchedules, bookingData.fieldTimeSlots]);

     // tính giá cho từng slot dựa trên TimeSlots hoặc fieldSchedules
     const getSlotPrice = useCallback((slotId) => {
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
     }, [bookingData.fieldTimeSlots, bookingData.price, fieldSchedules]);

     useEffect(() => {
          if (!isRecurring) {
               // Đặt lẻ
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

          // Đặt cố định
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
          generateRecurringSessions,
          getSlotPrice
     ]);

     // Cập nhật bookingData khi fieldData thay đổi
     useEffect(() => {
          if (fieldData) {
               const providedStartTime = fieldData.startTime || fieldData.StartTime || "";
               const providedEndTime = fieldData.endTime || fieldData.EndTime || "";
               let computedDuration = null;
               // tính thời gian
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
                    scheduleId: fieldData.scheduleId || prev.scheduleId || 0,
                    startTime: providedStartTime || prev.startTime || "",
                    endTime: providedEndTime || prev.endTime || "",
                    duration: computedDuration ?? prev.duration,
                    price: fieldData.price || prev.price,
                    totalPrice: fieldData.totalPrice || fieldData.price || prev.price,
                    fieldSchedules: Array.isArray(fieldData.fieldSchedules) ? fieldData.fieldSchedules : (prev.fieldSchedules || []),
                    fieldTimeSlots: Array.isArray(fieldData.fieldTimeSlots) ? fieldData.fieldTimeSlots : (prev.fieldTimeSlots || []),
                    depositPercent: nextDepositPercent,
                    minDeposit: depositConfig.min,
                    maxDeposit: depositConfig.max
               }));
               // lấy thông tin đặt cố định
               if (fieldData.isRecurringPreset !== undefined) {
                    setIsRecurring(!!fieldData.isRecurringPreset);
               }
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
     }, [extractDepositConfig, fieldData]);

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

     // Reset khi modal mở/đóng
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
                    // lấy ngày bắt đầu và ngày kết thúc
                    if (fieldData.recurringStartDatePreset && fieldData.recurringEndDatePreset) {
                         setRecurringStartDate(fieldData.recurringStartDatePreset);
                         setRecurringEndDate(fieldData.recurringEndDatePreset);
                    } else if (typeof fieldData.recurringWeeksPreset === 'number' && fieldData.recurringWeeksPreset > 0) {
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

     // Fetch schedule và TimeSlots khi chọn ngày bắt đầu và ngày kết thúc
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
                    // xử lý schedule
                    if (schedulesResult.success && Array.isArray(schedulesResult.data)) {
                         // thêm dayOfWeek vào mỗi schedule nếu chưa có
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
                    } else {
                         console.warn("⚠️ [FETCH SCHEDULES] No schedules found or invalid response:", schedulesResult);
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
     // cập nhật thời gian thanh toán
     useEffect(() => {
          if (!paymentLockExpiresAt || step !== "payment") {
               setLockRemainingMs(0);
               return;
          }
          const updateRemaining = async () => {
               const remaining = paymentLockExpiresAt - Date.now();
               if (remaining <= 0) {
                    setPaymentLockExpiresAt(null);
                    setLockRemainingMs(0);
                    // QR đã hết hạn
                    setBookingInfo(null);
                    setStep("details");
                    onClose?.();

                    const Swal = (await import('sweetalert2')).default;
                    Swal.fire({
                         icon: 'warning',
                         title: 'Mã QR đã hết hạn',
                         text: 'Thời gian thanh toán đã hết. Vui lòng đặt sân lại nếu bạn muốn tiếp tục.',
                         confirmButtonColor: '#f59e0b',
                         confirmButtonText: 'Đã hiểu'
                    });
               } else {
                    setLockRemainingMs(remaining);
               }
          };

          updateRemaining();
          const timer = setInterval(updateRemaining, 1000);
          return () => clearInterval(timer);
     }, [paymentLockExpiresAt, step, onClose]);

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
     // lấy thông tin ngân hàng dựa vào BankAccountID
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

     // lấy thông tin ngân hàng dựa vào BankAccountID
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
          const errors = {};

          // Kiểm tra fieldId (bắt buộc cho cả hai)
          if (!bookingData.fieldId) {
               errors.fieldId = "Vui lòng chọn sân";
          }

          // Kiểm tra thông tin liên hệ (bắt buộc cho cả hai)
          if (!bookingData.customerName?.trim()) {
               errors.customerName = "Vui lòng nhập họ và tên";
          }

          // Validate số điện thoại Việt Nam
          const phoneValidation = validateVietnamPhone(bookingData.customerPhone);
          if (!phoneValidation.isValid) {
               errors.customerPhone = phoneValidation.message;
          }

          // Email validation
          if (bookingData.requiresEmail && !bookingData.customerEmail?.trim()) {
               errors.customerEmail = "Vui lòng nhập email";
          } else if (bookingData.customerEmail?.trim()) {
               // Validate email format
               const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
               if (!emailRegex.test(bookingData.customerEmail.trim())) {
                    errors.customerEmail = "Email không hợp lệ (VD: example@gmail.com)";
               }
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
     //thay đổi input
     const handleInputChange = (field, value) => {
          setBookingData(prev => ({ ...prev, [field]: value }));
          if (errors[field]) {
               setErrors(prev => ({ ...prev, [field]: "" }));
          }
     };
     //thay đổi ngày
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
     // chọn slot
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

     // kiểm tra button có được enable không
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

     // đề xuất ngày khả dụng cho đặt cố định
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
                    // lấy ngày đầu tiên của tuần
                    function getFirstOccurrence(start, weekday) {
                         const s = new Date(start);
                         const sW = s.getDay();
                         const diff = (weekday - sW + 7) % 7;
                         s.setDate(s.getDate() + diff);
                         s.setHours(0, 0, 0, 0);
                         return s;
                    }
                    // lấy ngày khả dụng
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
     //thanh toán
     const handlePayment = async () => {
          if (!validateForm()) {
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
                              const uniqueDaySlotCombos = new Set();
                              selectedDays.forEach(dayOfWeek => {
                                   const slotId = selectedSlotsByDay?.[dayOfWeek];
                                   if (slotId) {
                                        uniqueDaySlotCombos.add(`${dayOfWeek}-${slotId}`);
                                   }
                              });
                              // lấy dayOfWeek từ schedule
                              const getDayOfWeekFromSchedule = (schedule) => {
                                   let scheduleDayOfWeek = schedule.dayOfWeek ?? schedule.DayOfWeek ?? schedule.weekday ?? schedule.Weekday;
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

                              let hasScheduleCount = 0;
                              const sessionDetails = [];

                              // Kiểm tra từng combination
                              uniqueDaySlotCombos.forEach(combo => {
                                   const [dayOfWeekStr, slotIdStr] = combo.split('-');
                                   const dayOfWeek = Number(dayOfWeekStr);
                                   const slotId = Number(slotIdStr);
                                   // lấy schedules có cùng slotId
                                   const schedulesWithSlotId = schedules.filter(sch => {
                                        const scheduleSlotId = sch.slotId || sch.SlotId || sch.slotID || sch.SlotID;
                                        return String(scheduleSlotId) === String(slotId);
                                   });

                                   // Tìm schedules có cùng slotId và dayOfWeek
                                   const matchingSchedules = schedules.filter((sch) => {
                                        const scheduleSlotId = sch.slotId || sch.SlotId || sch.slotID || sch.SlotID;
                                        const scheduleDayOfWeek = getDayOfWeekFromSchedule(sch);
                                        const slotMatches = String(scheduleSlotId) === String(slotId);
                                        const dayMatches = scheduleDayOfWeek !== undefined && scheduleDayOfWeek !== null && Number(scheduleDayOfWeek) === Number(dayOfWeek);
                                        return slotMatches && dayMatches;
                                   });

                                   if (matchingSchedules.length > 0) {
                                        hasScheduleCount += 1;
                                   } else {
                                   }

                                   sessionDetails.push({
                                        dayOfWeek: dayOfWeek,
                                        slotId: slotId,
                                        found: matchingSchedules.length > 0,
                                        matchingSchedulesCount: matchingSchedules.length
                                   });
                              });

                              if (hasScheduleCount < uniqueDaySlotCombos.size) {
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
                         } else {
                              setIsProcessing(false);
                              await Swal.fire({
                                   icon: "warning",
                                   title: "Không tìm thấy lịch",
                                   text: "Vui lòng chọn ngày bắt đầu, ngày kết thúc, các ngày trong tuần và khung giờ cho từng ngày trước khi đặt cố định.",
                                   confirmButtonColor: "#f59e0b",
                              });
                              return;
                         }
                    } catch (err) {
                    }
               }
               // lấy thông tin booking
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

               // kiểm tra sân có khả dụng không
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
                         scheduleId: scheduleId,
                         totalPrice: totalPrice,
                         depositAmount: depositAmount,
                         hasOpponent: Boolean(booking.hasOpponent)
                    };
                    // gọi API tạo booking
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
                    // lấy QR code
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

                    // // lấy scheduleId từ fieldSchedules
                    let finalScheduleId =
                         apiResult.data?.scheduleID ||
                         apiResult.data?.scheduleId ||
                         apiResult.data?.ScheduleID ||
                         apiResult.data?.ScheduleId ||
                         apiResult.data?.fieldScheduleId ||
                         apiResult.data?.FieldScheduleID ||
                         scheduleId;

                    if ((!finalScheduleId || Number(finalScheduleId) === 0) && booking.fieldSchedules && Array.isArray(booking.fieldSchedules)) {
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

                         const matchingSchedule = booking.fieldSchedules.find(s => {
                              const scheduleSlotId = s.slotId || s.SlotId || s.slotID || s.SlotID;
                              const scheduleDate = s.date || s.Date;
                              return String(scheduleSlotId) === String(booking.slotId) &&
                                   compareDate(scheduleDate, booking.date);
                         });

                         if (matchingSchedule) {
                              finalScheduleId = matchingSchedule.scheduleId || matchingSchedule.ScheduleId ||
                                   matchingSchedule.scheduleID || matchingSchedule.ScheduleID || 0;
                         }
                    }

                    setBookingInfo({
                         bookingId: bookingId,
                         scheduleId: finalScheduleId,
                         bookingStatus: apiResult.data?.bookingStatus || "Pending",
                         paymentStatus: apiResult.data?.paymentStatus || "Pending",
                         qrCodeUrl: normalizedQrCode,
                         qrExpiresAt: qrExpiresAt,
                         totalPrice: apiTotalPrice,
                         depositAmount: apiDepositAmount,
                         remainingAmount: apiRemainingAmount
                    });

                    // Cập nhật FieldSchedule status thành "Booked" ngay khi tạo booking thành công
                    if (finalScheduleId && Number(finalScheduleId) > 0) {
                         try {
                              const updateResult = await updateFieldScheduleStatus(Number(finalScheduleId), "Booked");
                              if (updateResult.success) {
                              } else {
                              }
                         } catch (error) {
                         }
                    }
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

                    // định dạng date string (YYYY-MM-DD) thành Date object
                    const parseDateStringForBackend = (dateStr) => {
                         if (!dateStr) return null;
                         if (typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                              const [year, month, day] = dateStr.split("-").map(Number);
                              return new Date(year, month - 1, day);
                         }
                         const date = new Date(dateStr);
                         if (!isNaN(date.getTime())) {
                              const year = date.getFullYear();
                              const month = date.getMonth();
                              const day = date.getDate();
                              return new Date(year, month, day);
                         }
                         return null;
                    };

                    // lấy start và end date
                    const startDateParsed = parseDateStringForBackend(recurringStartDate);
                    const endDateParsed = parseDateStringForBackend(recurringEndDate);

                    if (!startDateParsed || !endDateParsed) {
                         setIsProcessing(false);
                         await Swal.fire({
                              icon: 'error',
                              title: 'Lỗi',
                              text: 'Ngày bắt đầu hoặc ngày kết thúc không hợp lệ.',
                              confirmButtonColor: '#ef4444'
                         });
                         return;
                    }

                    // tạo tất cả sessions cho từng ngày cụ thể
                    const generateBackendSessions = () => {
                         try {
                              const sessions = [];
                              // so sánh date bằng cách so sánh year, month, day
                              const compareDates = (date1, date2) => {
                                   const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
                                   const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
                                   return d1 <= d2;
                              };

                              // Duyệt từ ngày bắt đầu đến ngày kết thúc, chọn ngày có weekday nằm trong selectedDays
                              let d = new Date(startDateParsed);
                              while (compareDates(d, endDateParsed)) {
                                   const weekday = d.getDay();
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
                                   // tăng lên 1 ngày
                                   d.setDate(d.getDate() + 1);
                              }

                              return sessions;
                         } catch (error) {
                              return [];
                         }
                    };

                    // Tìm scheduleId cho pattern (duyệt toàn bộ khoảng thời gian để tìm ngày có schedule)
                    const buildSelectedSlots = () => {
                         if (!Array.isArray(booking.fieldSchedules) || booking.fieldSchedules.length === 0) {
                              return [];
                         }

                         const result = [];
                         const seenDaySlot = new Set();

                         const normalizeDateString = (value) => {
                              if (!value) return "";
                              if (value instanceof Date) {
                                   const year = value.getFullYear();
                                   const month = value.getMonth() + 1;
                                   const day = value.getDate();
                                   return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                              }
                              if (typeof value === "string") return value.split("T")[0];
                              // lấy year, month, day
                              if (value.year && value.month && value.day) {
                                   return `${value.year}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`;
                              }
                              return "";
                         };

                         const compareDates = (date1, date2) => {
                              const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
                              const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
                              return d1 <= d2;
                         };

                         // duyệt toàn bộ khoảng thời gian để tìm ngày có schedule
                         let d = new Date(startDateParsed);
                         while (compareDates(d, endDateParsed)) {
                              const weekday = d.getDay();
                              if (selectedDays.includes(weekday)) {
                                   const selectedSlotId = selectedSlotsByDay?.[weekday];
                                   if (selectedSlotId) {
                                        const key = `${weekday}-${selectedSlotId}`;
                                        if (seenDaySlot.has(key)) {
                                             d.setDate(d.getDate() + 1);
                                             continue;
                                        }
                                        // lấy session date string
                                        const sessionDateStr = normalizeDateString(d);
                                        const matchingSchedule = booking.fieldSchedules.find(s => {
                                             const scheduleSlotId = s.slotId || s.SlotId || s.slotID || s.SlotID;
                                             const scheduleDateStr = normalizeDateString(s.date || s.Date || s.scheduleDate || s.ScheduleDate);
                                             return String(scheduleSlotId) === String(selectedSlotId) && scheduleDateStr === sessionDateStr;
                                        });

                                        if (matchingSchedule) {
                                             const scheduleId = matchingSchedule.scheduleId || matchingSchedule.ScheduleId || matchingSchedule.scheduleID || matchingSchedule.ScheduleID || 0;
                                             if (scheduleId) {
                                                  seenDaySlot.add(key);
                                                  result.push({
                                                       slotId: Number(selectedSlotId) || 0,
                                                       dayOfWeek: Number(weekday) || 0,
                                                       fieldId: Number(booking.fieldId) || 0,
                                                       scheduleId: Number(scheduleId) || 0
                                                  });
                                             }
                                        }
                                   }
                              }
                              // Tăng ngày lên 1
                              d.setDate(d.getDate() + 1);
                         }
                         return result;
                    };

                    // Tạo tất cả sessions với scheduleId cụ thể cho từng ngày (để tạo booking sessions)
                    const buildAllSessions = () => {
                         if (!Array.isArray(booking.fieldSchedules) || booking.fieldSchedules.length === 0) {
                              return [];
                         }

                         const result = [];
                         const allSessions = generateBackendSessions();

                         const normalizeDateString = (value) => {
                              if (!value) return "";
                              if (value instanceof Date) return value.toISOString().split("T")[0];
                              if (typeof value === "string") return value.split("T")[0];
                              if (value.year && value.month && value.day) {
                                   return `${value.year}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`;
                              }
                              return "";
                         };

                         // Map mỗi session với scheduleId cụ thể cho ngày đó
                         allSessions.forEach((session, index) => {
                              const slotId = session.slotId;
                              const dayOfWeek = session.dayOfWeek;
                              const sessionDateStr = normalizeDateString(session.date);
                              if (!slotId || !sessionDateStr) return;

                              // Tìm schedule matching với slotId VÀ date cụ thể
                              const matchingSchedule = booking.fieldSchedules.find(s => {
                                   const scheduleSlotId = s.slotId || s.SlotId || s.slotID || s.SlotID;
                                   const scheduleDateStr = normalizeDateString(s.date || s.Date || s.scheduleDate || s.ScheduleDate);
                                   return String(scheduleSlotId) === String(slotId) && scheduleDateStr === sessionDateStr;
                              });

                              if (!matchingSchedule) {
                                   console.warn("⚠️ [BUILD ALL SESSIONS] No schedule found for session", {
                                        index,
                                        slotId,
                                        dayOfWeek,
                                        sessionDateStr
                                   });
                                   return;
                              }

                              const scheduleId = matchingSchedule.scheduleId || matchingSchedule.ScheduleId || matchingSchedule.scheduleID || matchingSchedule.ScheduleID || 0;
                              if (!scheduleId) {
                                   console.warn("⚠️ [BUILD ALL SESSIONS] Schedule has no scheduleId", matchingSchedule);
                                   return;
                              }

                              // Thêm session với scheduleId cụ thể cho ngày này
                              result.push({
                                   slotId: Number(slotId) || 0,
                                   dayOfWeek: Number(dayOfWeek) || 0,
                                   fieldId: Number(booking.fieldId) || 0,
                                   scheduleId: Number(scheduleId) || 0,
                                   date: sessionDateStr // Date cụ thể để backend tạo booking session
                              });
                         });

                         console.log("✅ [BUILD ALL SESSIONS] Generated", result.length, "sessions with specific scheduleIds and dates:", result);
                         return result;
                    };

                    // Pattern 1 tuần để tính giá (x4)
                    const selectedSlots = buildSelectedSlots();

                    // Tất cả sessions với date cụ thể để tạo booking sessions
                    const allSessions = buildAllSessions();

                    if (selectedSlots.length === 0) {
                         setIsProcessing(false);
                         await Swal.fire({
                              icon: 'warning',
                              title: 'Không thể đặt lịch',
                              text: 'Không có lịch trình nào trong khoảng thời gian đã chọn. Vui lòng chọn khoảng thời gian khác hoặc liên hệ chủ sân để mở lịch.',
                              confirmButtonColor: '#f59e0b'
                         });
                         return;
                    }

                    // Tính giá từ tất cả các ngày có schedule trong khoảng thời gian
                    // (không chỉ tuần đầu tiên, để hỗ trợ trường hợp một phần khoảng thời gian không có lịch)
                    const normalizeDateStringForPrice = (value) => {
                         if (!value) return "";
                         if (value instanceof Date) {
                              const year = value.getFullYear();
                              const month = value.getMonth() + 1;
                              const day = value.getDate();
                              return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                         }
                         if (typeof value === "string") return value.split("T")[0];
                         if (value.year && value.month && value.day) {
                              return `${value.year}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`;
                         }
                         return "";
                    };

                    // Tạo Set các ngày có schedule để lookup nhanh
                    // CHỈ lấy schedule trong khoảng thời gian đã chọn (startDateParsed - endDateParsed)
                    const scheduleDatesSet = new Set();
                    if (Array.isArray(booking.fieldSchedules)) {
                         booking.fieldSchedules.forEach(s => {
                              const scheduleDate = s.date ?? s.Date ?? s.scheduleDate ?? s.ScheduleDate;
                              if (scheduleDate) {
                                   const date = typeof scheduleDate === 'string'
                                        ? new Date(scheduleDate)
                                        : (scheduleDate.year && scheduleDate.month && scheduleDate.day
                                             ? new Date(scheduleDate.year, scheduleDate.month - 1, scheduleDate.day)
                                             : new Date(scheduleDate));

                                   if (!isNaN(date.getTime())) {
                                        // Chỉ thêm vào set nếu ngày nằm trong khoảng startDateParsed-endDateParsed
                                        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                                        const startOnly = new Date(startDateParsed.getFullYear(), startDateParsed.getMonth(), startDateParsed.getDate());
                                        const endOnly = new Date(endDateParsed.getFullYear(), endDateParsed.getMonth(), endDateParsed.getDate());

                                        if (dateOnly >= startOnly && dateOnly <= endOnly) {
                                             const dateStr = normalizeDateStringForPrice(date);
                                             if (dateStr) scheduleDatesSet.add(dateStr);
                                        }
                                   }
                              }
                         });
                    }

                    // So sánh date bằng cách so sánh year, month, day để tránh timezone issues
                    const compareDatesForPattern = (date1, date2) => {
                         const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
                         const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
                         return d1 <= d2;
                    };

                    // Tính giá cho tất cả các ngày có schedule
                    const patternSessions = [];
                    let d = new Date(startDateParsed);
                    while (compareDatesForPattern(d, endDateParsed)) {
                         const weekday = d.getDay();
                         const dateStr = normalizeDateStringForPrice(d);
                         // Chỉ tính nếu ngày đó có schedule VÀ thuộc ngày trong tuần đã chọn
                         if (selectedDays.includes(weekday) && scheduleDatesSet.has(dateStr)) {
                              const selectedSlotId = selectedSlotsByDay?.[weekday];
                              if (selectedSlotId) {
                                   patternSessions.push({
                                        date: new Date(d),
                                        dayOfWeek: weekday,
                                        slotId: selectedSlotId
                                   });
                              }
                         }
                         // Tăng ngày lên 1
                         d.setDate(d.getDate() + 1);
                    }
                    const safeTotal = (() => {
                         if (!Array.isArray(patternSessions) || patternSessions.length === 0) return 0;
                         try {
                              return patternSessions.reduce((sum, session) => {
                                   const price = getSlotPrice(session.slotId);
                                   return sum + (Number(price) || 0);
                              }, 0);
                         } catch {
                              return 0;
                         }
                    })();

                    const formatDateForBackend = (date) => {
                         if (!date) return "";
                         const year = date.getFullYear();
                         const month = date.getMonth() + 1;
                         const day = date.getDate();
                         return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00.000Z`;
                    };

                    // Tìm ngày đầu tiên và cuối cùng có schedule trong patternSessions
                    let actualStartDate = startDateParsed;
                    let actualEndDate = endDateParsed;

                    if (patternSessions.length > 0) {
                         const sessionDates = patternSessions
                              .map(s => s.date)
                              .filter(d => d instanceof Date && !isNaN(d.getTime()))
                              .sort((a, b) => a.getTime() - b.getTime());

                         if (sessionDates.length > 0) {
                              actualStartDate = sessionDates[0];
                              actualEndDate = sessionDates[sessionDates.length - 1];
                              console.log("📅 [ADJUSTED DATES] Actual date range with schedule:",
                                   formatDateForBackend(actualStartDate), "to", formatDateForBackend(actualEndDate));
                         }
                    }

                    const packagePayload = {
                         userId: userId,
                         fieldId: booking.fieldId,
                         packageName: booking.packageName || `Gói định kỳ`,
                         startDate: formatDateForBackend(actualStartDate), // Ngày đầu tiên có schedule
                         endDate: formatDateForBackend(actualEndDate), // Ngày cuối cùng có schedule
                         totalPrice: safeTotal, // Tổng giá cho tất cả các ngày có schedule
                         selectedSlots: selectedSlots // Pattern các ngày đã chọn
                    };

                    const packageResult = await createBookingPackage(packagePayload);
                    if (!packageResult.success) {
                         setIsProcessing(false);
                         await Swal.fire({
                              icon: 'error',
                              title: 'Lỗi đặt định kỳ',
                              text: packageResult.error || "Không thể tạo gói đặt định kỳ. Vui lòng thử lại.",
                              confirmButtonColor: '#ef4444'
                         });
                         return;
                    }

                    // lấy data từ response
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

                    // lấy số lượng sessions thực tế từ allSessions hoặc generateRecurringSessions
                    const actualTotalSessions = allSessions?.length || generateRecurringSessions()?.length || 0;

                    setBookingData(prev => ({
                         ...prev,
                         totalPrice: apiTotalPrice || prev.totalPrice,
                         subtotal: apiTotalPrice || prev.subtotal,
                         totalSessions: actualTotalSessions || prev.totalSessions,
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

                    // Lấy danh sách scheduleId từ sessions
                    const sessionsToUpdate = generateRecurringSessions();
                    if (sessionsToUpdate && sessionsToUpdate.length > 0) {
                         for (const session of sessionsToUpdate) {
                              // Tìm scheduleId cho session này từ fieldSchedules
                              const sessionDate = session.date instanceof Date
                                   ? `${session.date.getFullYear()}-${String(session.date.getMonth() + 1).padStart(2, '0')}-${String(session.date.getDate()).padStart(2, '0')}`
                                   : session.date;

                              const matchingSchedule = bookingData.fieldSchedules?.find(s => {
                                   const scheduleSlotId = s.slotId || s.SlotId || s.slotID || s.SlotID;
                                   const scheduleDate = s.date || s.Date;
                                   const scheduleDateStr = typeof scheduleDate === 'string'
                                        ? scheduleDate.split('T')[0]
                                        : (scheduleDate?.year ? `${scheduleDate.year}-${String(scheduleDate.month).padStart(2, '0')}-${String(scheduleDate.day).padStart(2, '0')}` : '');
                                   return String(scheduleSlotId) === String(session.slotId) && scheduleDateStr === sessionDate;
                              });

                              const sessionScheduleId = matchingSchedule?.scheduleId || matchingSchedule?.ScheduleId || matchingSchedule?.scheduleID || matchingSchedule?.ScheduleID;

                              if (sessionScheduleId && Number(sessionScheduleId) > 0) {
                                   try {
                                        const updateResult = await updateFieldScheduleStatus(Number(sessionScheduleId), "Booked");
                                        if (updateResult.success) {
                                        } else {
                                        }
                                   } catch (error) {
                                   }
                              }
                         }
                    }
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
     // hủy đặt sân trong quá trình thanh toán
     const handleCancelBookingDuringPayment = async () => {
          if (isProcessing) return;

          // Nếu là đặt cố định, chỉ đóng modal mà không hiện dialog lý do
          if (isRecurring) {
               setPaymentLockExpiresAt(null);
               setLockRemainingMs(0);
               setBookingInfo(null);
               setStep("details");
               onClose?.();
               return;
          }

          // Hiển thị dialog nhập lý do hủy (chỉ cho đặt lẻ)
          const { value: reason, isConfirmed } = await Swal.fire({
               title: 'Xác nhận hủy đặt sân',
               input: 'textarea',
               inputLabel: 'Lý do hủy đặt sân',
               inputPlaceholder: 'Nhập lý do hủy đặt sân...',
               inputAttributes: {
                    'aria-label': 'Lý do hủy đặt sân'
               },
               showCancelButton: true,
               confirmButtonText: 'Gửi yêu cầu hủy',
               cancelButtonText: 'Không',
               confirmButtonColor: '#ef4444',
               cancelButtonColor: '#6b7280',
               inputValidator: (value) => {
                    if (!value || !value.trim()) {
                         return 'Vui lòng nhập lý do hủy đặt sân';
                    }
               }
          });

          if (!isConfirmed || !reason) return;

          setIsProcessing(true);
          try {
               // Gọi API tạo yêu cầu hủy booking
               const bookingId = bookingInfo?.bookingId;
               if (bookingId) {
                    const result = await cancelBooking(bookingId, reason.trim());
                    if (!result.success) {
                         throw new Error(result.error || "Không thể gửi yêu cầu hủy");
                    }
               }

               setPaymentLockExpiresAt(null);
               setLockRemainingMs(0);
               setBookingInfo(null);
               setStep("details");
               onClose?.();

               // Hiển thị thông báo gửi yêu cầu hủy thành công
               Swal.fire({
                    icon: 'success',
                    title: 'Đã gửi yêu cầu hủy',
                    text: 'Yêu cầu hủy đặt sân của bạn đã được gửi. Vui lòng chờ xác nhận từ chủ sân.',
                    confirmButtonColor: '#10b981'
               });
          } catch (error) {
               console.error("Lỗi khi gửi yêu cầu hủy đặt sân:", error);
               await Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: error.message || 'Có lỗi xảy ra khi gửi yêu cầu hủy. Vui lòng thử lại.',
                    confirmButtonColor: '#ef4444'
               });
          } finally {
               setIsProcessing(false);
          }
     };

     const handleModalClose = useCallback(() => {
          if (isPaymentLockActive) return;
          onClose();
     }, [isPaymentLockActive, onClose]);

     //thanh toán
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
               setStep("confirmation");
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

               {/* Removed: Recurring Opponent Selection Modal - recurring opponent feature */}
          </Modal >
     );
}