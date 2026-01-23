import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { Container, Section, LoadingPage, LoadingSpinner } from "../../../../shared/components/ui";
import { fetchComplexDetail, fetchTimeSlotsByField, fetchFieldDetail, fetchPublicFieldSchedulesByField, fetchFieldTypes, fetchDepositPolicyByField, fetchFavoriteFields, toggleFavoriteField as toggleFavoriteFieldApi, fetchBookingsByPlayer } from "../../../../shared/index";
import { fetchRatingsByComplex, fetchRatingsByField } from "../../../../shared/services/ratings";
import { normalizeFieldType } from "../../../../shared/services/fieldTypes";
import { useFieldSchedules } from "../../../../shared/hooks";
import { fetchBookingPackageSessionsByPlayerToken } from "../../../../shared/services/bookings";
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

const DEBUG_COMPLEX_DETAIL = false;

// Chuẩn hóa trạng thái sân để xem có hiển thị hay không
const normalizeFieldStatus = (status) =>
     (typeof status === "string" ? status.trim().toLowerCase() : "");
const ALLOWED_COMPLEX_FIELD_STATUSES = new Set(["available", "active"]);

// cho phép hiển thị sân nếu trạng thái hợp lệ
const shouldDisplayField = (field) => {
     const normalizedStatus = normalizeFieldStatus(field?.status ?? field?.Status ?? "");
     if (!normalizedStatus) return true;
     return ALLOWED_COMPLEX_FIELD_STATUSES.has(normalizedStatus);
};

// Chuẩn hóa định dạng thời gian "HH:MM" thành "HH:MM:SS"
const normalizeTime = (timeStr = "") => {
     if (!timeStr || typeof timeStr !== "string") return "";
     const trimmed = timeStr.trim();
     if (!trimmed) return "";
     return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
};

//tính độ dài khung giờ từ startTime và endTime
const calculateSlotDurationHours = (startTime, endTime) => {
     if (!startTime || !endTime) return null;
     try {
          const normalizedStart = normalizeTime(startTime);
          const normalizedEnd = normalizeTime(endTime);
          const start = new Date(`2000-01-01T${normalizedStart}`);
          const end = new Date(`2000-01-01T${normalizedEnd}`);
          const diff = (end - start) / (1000 * 60 * 60); // chuyển đổi từ phút sang giờ
          if (!Number.isNaN(diff) && diff > 0) {
               return diff;
          }
     } catch (error) {
          console.warn("Unable to compute slot duration:", { startTime, endTime, error });
     }
     return null;
};

// Chuẩn hóa giá trị ngày thành chuỗi "YYYY-MM-DD"
const normalizeDateValue = (value) => {
     if (!value) return "";
     if (typeof value === "string") return value.split("T")[0];
     if (value && typeof value === "object" && value.year && value.month && value.day) {
          return `${value.year}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`;
     }
     try {
          const parsed = new Date(value);
          if (!Number.isNaN(parsed.getTime())) {
               return parsed.toISOString().split("T")[0];
          }
     } catch {
          // ignore parse error
     }
     return String(value);
};

export default function ComplexDetail({ user }) {
     const navigate = useNavigate();
     const { id } = useParams(); // lưu id của complex hoặc field
     const [searchParams, setSearchParams] = useSearchParams();
     const location = useLocation();
     const { isBookingModalOpen, openBookingModal, closeBookingModal } = useModal(); // 

     const isFieldRoute = location.pathname.startsWith("/field/");// trang chi tiết sân hay khu sân
     const [selectedFieldId, setSelectedFieldId] = useState(null); // lấy id sân từ url nếu là trang sân nhỏ
     const [selectedDate, setSelectedDate] = useState(() => searchParams.get("date") || new Date().toISOString().split("T")[0]); // lấy ngày từ quẻy hoặc ngày hiện tại
     const [selectedSlotId, setSelectedSlotId] = useState(() => searchParams.get("slotId") || "");
     const [complexData, setComplexData] = useState({ complex: null, fields: [] }); // dữ liệu khu sân và danh sách sân con
     const [depositPolicy, setDepositPolicy] = useState(null);
     const [fieldTimeSlots, setFieldTimeSlots] = useState([]); // Thời gian của sân được chọn
     const [cheapestSlot, setCheapestSlot] = useState(null); // thông tin slot rẻ nhất
     const [priciestSlot, setPriciestSlot] = useState(null); // thông tin slot đắt nhất
     const [fieldTypeMap, setFieldTypeMap] = useState({});
     const [activeTab, setActiveTab] = useState(() => {
          const q = new URLSearchParams(location.search);
          const t = q.get("tab");
          return (t === "info" || t === "review" || t === "location" || t === "gallery") ? t : "info";
     }); // lựa chọn tabs
     const [isLoading, setIsLoading] = useState(true);
     const [isSwitchingField, setIsSwitchingField] = useState(false); // trạng thái chuyển đổi sân 
     const [error, setError] = useState(null);
     // trạng thái sân đặt cố định
     const [isRecurring, setIsRecurring] = useState(false);
     const [repeatDays, setRepeatDays] = useState([]); // ngày trong tuần lặp lại
     const [rangeStart, setRangeStart] = useState(() => selectedDate);
     const [rangeEnd, setRangeEnd] = useState(() => selectedDate);
     const [isLightboxOpen, setIsLightboxOpen] = useState(false);
     const [lightboxIndex, setLightboxIndex] = useState(0);
     const [bookingModalData, setBookingModalData] = useState(null); // dữ liệu truyền vào modal đặt sân
     const [bookingType, setBookingType] = useState("field"); // loại đặt sân: lẻ hoặc cố định
     const [favoriteFieldIds, setFavoriteFieldIds] = useState(new Set());
     const favoritesLoadedRef = useRef(false);
     const [playerPackageSessions, setPlayerPackageSessions] = useState([]); // lịch đặt cố định của người chơi
     const [isLoadingPlayerPackages, setIsLoadingPlayerPackages] = useState(false);
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

     // Lấy lịch trình sân cho sân được chọn và ngày được chọn
     const { data: selectedFieldSchedules = [], isLoading: isLoadingSelectedFieldSchedules } = useFieldSchedules(
          selectedFieldId,
          selectedDate,
          !!selectedFieldId
     );
     // Chuẩn hóa dữ liệu đặt cố định 
     const normalizePlayerPackageSession = useCallback((session) => {
          if (!session) return null;
          return {
               bookingPackageId: session.bookingPackageId || session.bookingPackageID || session.packageId || session.packageID,
               scheduleId: session.scheduleId || session.scheduleID || session.ScheduleID,
               fieldId: session.fieldId || session.fieldID || session.FieldID,
               slotId: session.slotId || session.slotID || session.SlotID,
               date: session.sessionDate || session.date || session.Date || session.startDate,
               status: session.sessionStatus || session.status || "",
          };
     }, []);
     // Lấy lịch đặt cố định 
     useEffect(() => {
          if (!user) {
               setPlayerPackageSessions([]);
               return;
          }
          let ignore = false;
          const loadPlayerPackageSessions = async () => { // tải lịch đặt cố định
               setIsLoadingPlayerPackages(true);
               try {
                    const resp = await fetchBookingPackageSessionsByPlayerToken();
                    if (ignore) return;
                    if (resp.success && Array.isArray(resp.data)) {
                         const normalized = resp.data.map(normalizePlayerPackageSession).filter(Boolean);
                         setPlayerPackageSessions(normalized);
                    } else {
                         setPlayerPackageSessions([]);
                    }
               } catch (error) {
                    if (!ignore) {
                         console.warn("Không thể tải lịch đặt cố định của bạn:", error);
                         setPlayerPackageSessions([]);
                    }
               } finally {
                    if (!ignore) {
                         setIsLoadingPlayerPackages(false);
                    }
               }
          };
          loadPlayerPackageSessions();
          return () => { ignore = true; };
     }, [user, normalizePlayerPackageSession]);
     // chọn lịch trình sân cho gói đặt cố định
     const selectedFieldSchedulesWithPackages = useMemo(() => {
          if (!Array.isArray(selectedFieldSchedules)) return [];
          if (!selectedFieldId || !playerPackageSessions.length) return selectedFieldSchedules;
          // lọc các buổi trong gói cố định cho sân được chọn
          const sessionsForField = playerPackageSessions.filter((ps) => {
               const psFieldId = ps?.fieldId || ps?.fieldID || ps?.FieldID;
               if (psFieldId === undefined || psFieldId === null) return true;
               return Number(psFieldId) === Number(selectedFieldId);
          });

          if (!sessionsForField.length) return selectedFieldSchedules;
          // đánh dấu các lịch trình sân đã được đặt trong gói cố định
          return selectedFieldSchedules.map((schedule) => {
               const scheduleId = schedule.scheduleId || schedule.ScheduleID || schedule.id;
               const scheduleSlotId = schedule.slotId || schedule.SlotId || schedule.slotID || schedule.SlotID;
               const scheduleDateStr = normalizeDateValue(schedule.date);
               // kiểm tra xem lịch trình sân có khớp với bất kỳ buổi nào trong gói cố định không
               const matched = sessionsForField.some((ps) => {
                    const statusLower = (ps?.status || "").toLowerCase();
                    if (statusLower.includes("cancel")) return false; // bỏ qua các buổi đã hủy
                    // so sánh lịch trình
                    const psScheduleId = ps.scheduleId || ps.scheduleID || ps.ScheduleID;
                    if (psScheduleId && scheduleId && Number(psScheduleId) === Number(scheduleId)) {
                         return true;
                    }
                    // so sánh ngay và khung giờ
                    const psSlotId = ps.slotId || ps.slotID || ps.SlotID;
                    const psDateStr = normalizeDateValue(ps.date);
                    if (!psSlotId || !psDateStr) return false;
                    return Number(psSlotId) === Number(scheduleSlotId) && psDateStr === scheduleDateStr;
               });
               return matched ? { ...schedule, status: "Booked", bookingType: "package" } : schedule;
          });
     }, [selectedFieldSchedules, playerPackageSessions, selectedFieldId]);
     // Lấy loại sân
     useEffect(() => {
          let ignore = false;
          async function loadFieldTypes() {
               try {
                    const result = await fetchFieldTypes();
                    if (ignore) return;
                    const rawList = (() => {
                         if (!result || !result.success) return [];
                         if (Array.isArray(result.data)) return result.data;
                         if (result.data && Array.isArray(result.data.data)) return result.data.data;
                         if (result.data && Array.isArray(result.data.value)) return result.data.value;
                         return [];
                    })();
                    if (rawList.length > 0) {
                         const map = rawList.reduce((acc, raw) => {
                              const normalized = normalizeFieldType(raw);
                              if (normalized?.typeId) {
                                   acc[String(normalized.typeId)] = normalized.typeName || "";
                              }
                              return acc;
                         }, {});
                         if (DEBUG_COMPLEX_DETAIL) {
                         }
                         setFieldTypeMap(map);
                    }
               } catch (err) {
                    console.warn("Unable to load field types:", err);
               }
          }
          loadFieldTypes();
          return () => { ignore = true; };
     }, []);
     // Lọc các sân hiển thị
     const rawFields = useMemo(() => {
          const source = Array.isArray(complexData.fields) ? complexData.fields : [];
          return source.filter(shouldDisplayField);
     }, [complexData.fields]);
     // Hàm chuyển đổi trạng thái yêu thích sân
     const toggleFavoriteFieldLocal = (fieldId, nextIsFavorite) => {
          const idNum = Number(fieldId);
          setComplexData(prev => ({
               ...prev,
               fields: (prev.fields || []).map(f =>
                    Number(f.fieldId) === idNum ? { ...f, isFavorite: nextIsFavorite } : f
               )
          }));
          setFavoriteFieldIds(prev => {
               const updated = new Set(prev);
               if (nextIsFavorite) {
                    updated.add(idNum);
               } else {
                    updated.delete(idNum);
               }
               return updated;
          });
     };
     // yeu thích hoặc bỏ yêu thích sân
     const handleToggleFavoriteField = async (fieldId) => {
          if (!user) {
               showToastMessage("Vui lòng đăng nhập để sử dụng danh sách yêu thích.", 'warning');
               return;
          }
          const idNum = Number(fieldId);
          const current = favoriteFieldIds.has(idNum);
          const nextIsFavorite = !current;
          toggleFavoriteFieldLocal(fieldId, nextIsFavorite);
          try {
               await toggleFavoriteFieldApi(fieldId, current);
          } catch (error) {
               toggleFavoriteFieldLocal(fieldId, current);
               showToastMessage(error.message || "Không thể cập nhật danh sách yêu thích.", 'error');
          }
     };

     // Đánh giá và bình luận
     const [newRating, setNewRating] = useState(0);
     const [newComment, setNewComment] = useState("");
     const [reviewPage, setReviewPage] = useState(1);
     const reviewsPerPage = 6;
     const [fieldRatings, setFieldRatings] = useState([]); // đánh giá sân 
     const [isLoadingRatings, setIsLoadingRatings] = useState(false);
     const [hasCompletedBooking, setHasCompletedBooking] = useState(false); // User có booking completed cho complex này không

     // Lấy đánh giá sân
     useEffect(() => {
          let ignore = false;
          async function loadData() {
               if (!id) return;
               setIsLoading(true);
               setError(null);

               try {
                    let fieldData = null;
                    let complexIdToUse = id;

                    // Nếu là route field thì lấy thông tin sân (đồng thời chạy song song fetch slot & complex)
                    if (isFieldRoute) {
                         fieldData = await fetchFieldDetail(id);
                         if (fieldData?.complexId) complexIdToUse = String(fieldData.complexId);
                         // Set selectedFieldId từ fieldData hoặc từ URL id
                         const fieldIdToSet = fieldData?.fieldId || id;
                         if (fieldIdToSet) setSelectedFieldId(Number(fieldIdToSet));
                    }

                    // Lấy thông tin khu sân
                    const complexData = await fetchComplexDetail(complexIdToUse, {
                         date: selectedDate,
                         slotId: selectedSlotId
                    });
                    const fieldIdForPolicy = (fieldData?.fieldId ? Number(fieldData.fieldId) : null) || selectedFieldId;
                    if (fieldIdForPolicy) {
                         // Lấy chính sách đặt cọc cho sân được chọn
                         try {
                              const depositPolicyResult = await fetchDepositPolicyByField(fieldIdForPolicy).catch(() => null);
                              if (!ignore) {
                                   setDepositPolicy(depositPolicyResult);
                              }
                         } catch (error) {
                              console.warn("Error fetching deposit policy:", error);
                         }
                    } else {
                         if (!ignore) {
                              setDepositPolicy(null);
                         }
                    }

                    if (!ignore) {
                         // Cập nhật thông tin typeId và typeName cho sân nếu thiếu
                         let updatedComplexData = complexData;
                         if (fieldData && fieldData.fieldId && Array.isArray(complexData.fields)) {
                              updatedComplexData = {
                                   ...complexData,
                                   fields: complexData.fields.map(field => {
                                        if (Number(field.fieldId) === Number(fieldData.fieldId)) {
                                             return {
                                                  ...field,
                                                  typeId: fieldData.typeId ?? field.typeId,
                                                  typeName: fieldData.typeName || field.typeName || ""
                                             };
                                        }
                                        return field;
                                   })
                              };
                         }

                         // Áp dụng cờ isFavorite từ favoriteFieldIds
                         const complexWithFavorites = {
                              ...updatedComplexData,
                              fields: (updatedComplexData.fields || []).map(f => ({
                                   ...f,
                                   isFavorite: favoriteFieldIds.has(Number(f.fieldId)),
                              })),
                         };

                         setComplexData(complexWithFavorites);
                         setIsLoading(false);
                    }
               } catch (e) {
                    console.error(e);
                    if (!ignore) {
                         setError("Không thể tải dữ liệu khu sân.");
                         setIsLoading(false);
                    }
               } finally {
                    if (!ignore) {
                         setIsLoading(false);
                    }
               }
          }
          const timer = setTimeout(() => {
               loadData();
          }, 300);

          return () => { ignore = true; clearTimeout(timer); };
     }, [id, selectedDate, selectedSlotId, selectedFieldId, isFieldRoute, favoriteFieldIds]);

     // Load danh sách sân yêu thích khi người dùng đã đăng nhập
     useEffect(() => {
          const loadFavorites = async () => {
               if (!user || favoritesLoadedRef.current) return;
               try {
                    const list = await fetchFavoriteFields();
                    const ids = new Set(
                         (list || [])
                              .map(item => Number(item.fieldId))
                              .filter(id => !Number.isNaN(id))
                    );
                    setFavoriteFieldIds(ids);
                    favoritesLoadedRef.current = true;
               } catch (error) {
                    console.error("Error loading favorite fields in ComplexDetail:", error);
               }
          };
          loadFavorites();
     }, [user]);

     // Khi favoriteFieldIds thay đổi, đồng bộ lại cờ isFavorite cho fields hiện tại
     useEffect(() => {
          setComplexData(prev => ({
               ...prev,
               fields: (prev.fields || []).map(f => ({
                    ...f,
                    isFavorite: favoriteFieldIds.has(Number(f.fieldId)),
               })),
          }));
     }, [favoriteFieldIds]);

     // Lấy thời gian và chính sách đặt cọc khi selectedFieldId thay đổi
     useEffect(() => {
          let cancelled = false;
          async function loadFieldData() {
               if (!selectedFieldId) {
                    setFieldTimeSlots([]);
                    setDepositPolicy(null);
                    return;
               }
               try {
                    // Kiểm tra xem sân hiện tại đã có typeId và typeName chưa
                    const currentField = rawFields.find(f => Number(f.fieldId) === Number(selectedFieldId));
                    const needsTypeId = !currentField?.typeId;
                    const needsTypeName = !currentField?.typeName || currentField.typeName.trim() === "";

                    const promises = [
                         fetchTimeSlotsByField(selectedFieldId),
                         fetchDepositPolicyByField(selectedFieldId)
                    ];

                    if (needsTypeId || needsTypeName) {
                         promises.push(fetchFieldDetail(selectedFieldId).catch(() => null));
                    }

                    const results = await Promise.all(promises);
                    if (cancelled) return;
                    const [slotsResult, depositPolicyResult, fieldDetailResult] = results;

                    if (slotsResult?.success && Array.isArray(slotsResult.data)) {
                         setFieldTimeSlots(slotsResult.data);
                    } else {
                         setFieldTimeSlots([]);
                    }

                    if (depositPolicyResult) {
                         setDepositPolicy(depositPolicyResult);
                    } else {
                         setDepositPolicy(null);
                    }

                    if (fieldDetailResult && fieldDetailResult.typeId) {
                         setComplexData(prev => {
                              if (!prev.fields || !Array.isArray(prev.fields)) return prev;
                              const updatedFields = prev.fields.map(field => {
                                   if (Number(field.fieldId) === Number(selectedFieldId)) {
                                        return {
                                             ...field,
                                             typeId: fieldDetailResult.typeId,
                                             typeName: fieldDetailResult.typeName || field.typeName || ""
                                        };
                                   }
                                   return field;
                              });
                              return {
                                   ...prev,
                                   fields: updatedFields
                              };
                         });
                    }
               } catch (error) {
                    if (cancelled) return;
                    setFieldTimeSlots([]);
                    setDepositPolicy(null);
               }
          }

          const timer = setTimeout(() => {
               loadFieldData();
          }, 300);
          return () => { cancelled = true; clearTimeout(timer); };
     }, [selectedFieldId, rawFields]);

     // Kiểm tra selectedFieldId có tồn tại trong rawFields không
     useEffect(() => {
          if (!selectedFieldId || rawFields.length === 0) {
               return;
          }

          // Kiểm tra selectedFieldId trong rawFields
          const fieldExists = rawFields.some(f => Number(f.fieldId) === Number(selectedFieldId));

          if (!fieldExists) {
               console.warn(`Selected field ${selectedFieldId} not found in current fields. Available fields:`, rawFields.map(f => f.fieldId));
          }
     }, [selectedFieldId, rawFields]);

     // Tìm slot rẻ nhất và đắt nhất khi fieldTimeSlots hoặc selectedFieldId thay đổi
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

          // Tìm slot rẻ nhất
          const cheapest = slotsWithPrices.reduce((best, cur) => {
               if (!best || (cur.price > 0 && cur.price < best.price)) return cur;
               return best;
          }, null);
          // Tìm slot đắt nhất
          const priciest = slotsWithPrices.reduce((best, cur) => {
               if (!best) return cur;
               if (cur.price > best.price) return cur;
               return best;
          }, null);

          setCheapestSlot(cheapest);
          setPriciestSlot(priciest);
     }, [selectedFieldId, fieldTimeSlots]);
     // Chuẩn hóa lịch trình sân với giá từ fieldTimeSlots
     const slotPriceMap = useMemo(() => {
          const map = new Map();
          if (Array.isArray(fieldTimeSlots)) {
               fieldTimeSlots.forEach(slot => {
                    const slotId = slot.slotId || slot.SlotID || slot.slotID || slot.SlotId;
                    if (!slotId) return;
                    const priceValue = Number(slot.price ?? slot.Price ?? slot.pricePerHour ?? slot.PricePerHour ?? 0);
                    map.set(String(slotId), priceValue);
               });
          }
          return map;
     }, [fieldTimeSlots]);
     // Chuẩn hóa các mục lịch trình sân đã chọn
     const normalizedFieldScheduleEntries = useMemo(() => {
          if (!selectedFieldId) return [];
          return (selectedFieldSchedulesWithPackages || [])
               .map(schedule => {
                    const slotId = schedule.slotId || schedule.SlotId || schedule.slotID || schedule.SlotID;
                    if (!slotId) return null;
                    return {
                         slotId,
                         name: schedule.slotName || schedule.SlotName || `Slot ${slotId}`,
                         status: schedule.status || schedule.Status || "Available",
                         price: slotPriceMap.get(String(slotId)) ?? 0
                    };
               })
               .filter(Boolean);
     }, [selectedFieldId, selectedFieldSchedulesWithPackages, slotPriceMap]);
     // Lọc các mục lịch trình sân hiển thị
     const visibleScheduleEntries = useMemo(
          () => {
               return normalizedFieldScheduleEntries.filter(entry => {
                    const status = (entry.status || "").trim();
                    return status === "Available" || status === "";
               });
          },
          [normalizedFieldScheduleEntries]
     );
     // Lấy các mục lịch trình có giá
     const priceEntries = useMemo(
          () => visibleScheduleEntries.filter(entry => entry.price > 0),
          [visibleScheduleEntries]
     );
     // Tìm mục lịch trình rẻ nhất
     const cheapestScheduleEntry = useMemo(() => {
          if (!priceEntries.length) return null;
          return priceEntries.reduce((best, cur) => (cur.price < best.price ? cur : best), priceEntries[0]);
     }, [priceEntries]);
     // Tìm mục lịch trình đắt nhất
     const priciestScheduleEntry = useMemo(() => {
          if (!priceEntries.length) return null;
          return priceEntries.reduce((best, cur) => (cur.price > best.price ? cur : best), priceEntries[0]);
     }, [priceEntries]);
     // Lấy mục lịch trình đã chọn
     const selectedScheduleEntry = useMemo(() => {
          if (!selectedSlotId) return null;
          const slotIdStr = String(selectedSlotId);
          return (
               visibleScheduleEntries.find(entry => String(entry.slotId) === slotIdStr) ||
               normalizedFieldScheduleEntries.find(entry => String(entry.slotId) === slotIdStr) ||
               null
          );
     }, [visibleScheduleEntries, normalizedFieldScheduleEntries, selectedSlotId]);

     const selectedSlotPriceFromSchedule = selectedScheduleEntry?.price || 0;
     const minPriceFromSchedule = cheapestScheduleEntry?.price || 0;
     // Đồng bộ state vào query params (Consolidated)
     useEffect(() => {
          const params = new URLSearchParams(searchParams);
          let changed = false;

          // Sync activeTab
          const currentTab = params.get("tab");
          if (currentTab !== activeTab) {
               params.set("tab", activeTab);
               changed = true;
          }

          // Sync selectedDate
          const currentDate = params.get("date");
          if (currentDate !== selectedDate) {
               params.set("date", selectedDate);
               changed = true;
          }

          // Sync selectedSlotId
          const currentSlotId = params.get("slotId");
          if (selectedSlotId) {
               if (currentSlotId !== String(selectedSlotId)) {
                    params.set("slotId", String(selectedSlotId));
                    changed = true;
               }
          } else {
               if (params.has("slotId")) {
                    params.delete("slotId");
                    changed = true;
               }
          }

          if (changed) {
               setSearchParams(params, { replace: true });
          }
     }, [activeTab, selectedDate, selectedSlotId, searchParams, setSearchParams]);


     // Xử lý chuyển đổi sân
     useEffect(() => {
          if (selectedFieldId) {
               setIsSwitchingField(true);
               const tabsElement = document.getElementById('tabs-header');
               if (tabsElement) {
                    const offset = 100;
                    const elementPosition = tabsElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;

                    window.scrollTo({
                         top: offsetPosition,
                         behavior: 'smooth'
                    });
               } else {
                    window.scrollTo({
                         top: 0,
                         behavior: 'smooth'
                    });
               }
               setTimeout(() => {
                    setIsSwitchingField(false);
               }, 300);
          } else {
               setIsSwitchingField(false);
          }
     }, [selectedFieldId]);

     // Ngày trong tuần cho đặt cố định
     const daysOfWeek = [
          { id: 1, label: "T2" },
          { id: 2, label: "T3" },
          { id: 3, label: "T4" },
          { id: 4, label: "T5" },
          { id: 5, label: "T6" },
          { id: 6, label: "T7" },
          { id: 0, label: "CN" },
     ];
     // Chuyển đổi chọn ngayf trong tuần
     const toggleDay = (d) => {
          setRepeatDays((prev) => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
     };
     // Xử lý đặt sân nhanh
     const handleQuickBookField = async (fieldId) => {
          if (!user) {
               showToastMessage("Bạn cần đăng nhập để đặt sân.", 'warning');
               return;
          }
          // Với đặt lẻ: yêu cầu chọn ngày và slot
          // Với đặt cố định: chỉ cần chọn rangeStart, rangeEnd và repeatDays
          if (!isRecurring) {
               if (!selectedDate || !selectedSlotId) {
                    showToastMessage("Vui lòng chọn ngày và giờ.", 'warning');
                    return;
               }
          } else {
               if (!rangeStart || !rangeEnd) {
                    showToastMessage('Vui lòng chọn ngày bắt đầu và ngày kết thúc.', 'warning');
                    return;
               }
               if (new Date(rangeStart) > new Date(rangeEnd)) {
                    showToastMessage('Ngày kết thúc phải sau ngày bắt đầu.', 'warning');
                    return;
               }
               if (repeatDays.length === 0) {
                    showToastMessage("Vui lòng chọn ít nhất một ngày trong tuần.", 'warning');
                    return;
               }
          }

          // Lấy thông tin sân từ complexData
          const field = fields.find(f => f.fieldId === fieldId);
          const weeksCount = isRecurring ? Math.max(1, Math.ceil((new Date(rangeEnd) - new Date(rangeStart)) / (7 * 24 * 60 * 60 * 1000))) : 0;
          const mappedDays = isRecurring ? repeatDays.slice() : [];

          if (!field) {
               showToastMessage("Không tìm thấy thông tin sân.", 'error');
               return;
          }

          // Lấy lịch trình từ API public cho sân nhỏ
          let fieldSchedules = [];
          try {
               const schedulesResult = await fetchPublicFieldSchedulesByField(fieldId);
               if (schedulesResult.success && Array.isArray(schedulesResult.data)) {
                    fieldSchedules = schedulesResult.data;
                    if (DEBUG_COMPLEX_DETAIL) {

                    }
               }
          } catch (error) {
               console.error("Lỗi khi lấy lịch trình sân:", error);
          }

          // Lấy thông tin slot từ fieldTimeSlots
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
                         price: 0
                    };
               }
          }

          // Lấy giá của slot đã chọn
          const slotPrice = selectedSlot?.price || selectedSlot?.Price || 0;

          // Hàm so sánh ngày giữa lịch trình và ngày đã chọn
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

          // Tìm scheduleId và thời gian bắt đầu/kết thúc
          let scheduleId = 0;
          let matchedSchedule = null;
          let slotStartTime = "";
          let slotEndTime = "";
          let computedDurationHours = 1;

          if (!isRecurring) {
               // Đặt lẻ: kiểm tra lịch trình từ API để xác định slot có còn trống không
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
                    matchedSchedule = scheduleForSlot;
                    scheduleId = scheduleForSlot.scheduleId || scheduleForSlot.ScheduleId ||
                         scheduleForSlot.scheduleID || scheduleForSlot.ScheduleID || 0;
               } else if (!field.isAvailableForSelectedSlot) {
                    // Fallback về kiểm tra từ field data nếu không có lịch trình từ API
                    showToastMessage("Sân này đã được đặt cho slot đã chọn. Vui lòng chọn slot khác.", 'warning');
                    return;
               }

               // Tìm scheduleId từ fieldSchedules dựa trên slotId và date
               if (fieldSchedules && Array.isArray(fieldSchedules) && fieldSchedules.length > 0 && selectedSlotId) {
                    const scheduleForSlot = fieldSchedules.find(s => {
                         const scheduleSlotId = s.slotId || s.SlotId || s.slotID || s.SlotID;
                         return String(scheduleSlotId) === String(selectedSlotId) &&
                              compareDate(s.date, selectedDate);
                    });

                    if (scheduleForSlot) {
                         matchedSchedule = scheduleForSlot;
                         scheduleId = scheduleForSlot.scheduleId || scheduleForSlot.ScheduleId ||
                              scheduleForSlot.scheduleID || scheduleForSlot.ScheduleID || 0;
                    } else {
                         console.warn("⚠️ [ComplexDetail] Không tìm thấy scheduleId từ fieldSchedules cho slotId:", selectedSlotId, "date:", selectedDate);
                    }
               }

               slotStartTime = selectedSlot?.startTime || selectedSlot?.StartTime ||
                    matchedSchedule?.startTime || matchedSchedule?.StartTime || "";
               slotEndTime = selectedSlot?.endTime || selectedSlot?.EndTime ||
                    matchedSchedule?.endTime || matchedSchedule?.EndTime || "";
               computedDurationHours = calculateSlotDurationHours(slotStartTime, slotEndTime) ?? 1;
          }
          // Với đặt cố định: không cần slotId và scheduleId ở đây, sẽ chọn trong modal
          const bookingData = {
               fieldId: fieldId,
               fieldName: field.name,
               fieldAddress: field.address,
               date: isRecurring ? rangeStart : selectedDate, // Với đặt cố định dùng rangeStart
               slotId: isRecurring ? null : selectedSlotId, // Với đặt cố định không cần slotId ở đây
               slotName: isRecurring ? "" : (selectedSlot?.name || selectedSlot?.slotName || ""),
               scheduleId: isRecurring ? 0 : scheduleId, // Với đặt cố định sẽ chọn trong modal
               startTime: slotStartTime,
               endTime: slotEndTime,
               duration: computedDurationHours,
               price: isRecurring ? 0 : slotPrice, // Với đặt cố định sẽ tính trong modal
               totalPrice: isRecurring ? 0 : slotPrice, // Với đặt cố định sẽ tính trong modal
               fieldType: field.typeName,
               fieldSize: field.size || "Không xác định",
               complexId: id,
               complexName: complex?.name || "",
               ownerId: complex?.ownerId || complex?.ownerID, // Thêm ownerId để lấy bank account
               isRecurringPreset: isRecurring,
               recurringWeeksPreset: weeksCount,
               selectedDaysPreset: mappedDays,
               recurringStartDatePreset: isRecurring ? rangeStart : null, // Thêm startDate preset
               recurringEndDatePreset: isRecurring ? rangeEnd : null, // Thêm endDate preset
               fieldSchedules: fieldSchedules, // Thêm lịch trình vào booking data để chọn slot trong modal
               fieldTimeSlots: fieldTimeSlots, // Thêm TimeSlots để lấy giá
               depositPolicy: depositPolicy // Thêm chính sách đặt cọc vào booking data
          };

          setBookingModalData(bookingData);
          setBookingType(isRecurring ? "field" : "quick"); // Changed from "complex" to "field"
          openBookingModal();
     };

     const handleBookingSuccess = () => {
          closeBookingModal();
          showToastMessage("Đặt sân thành công!", 'success');
     };

     // Xử lý quay lại khu sân - nếu đang ở route /field/:id thì navigate về /complex/:complexId
     const handleBackToComplex = () => {
          if (isFieldRoute) {
               const complexId = complexData.complex?.complexId || complexData.complex?.id;
               if (complexId) {
                    navigate(`/complex/${complexId}`);
               } else {
                    navigate(-1);
               }
          } else {
               setSelectedFieldId(null);
          }
     };

     // Chuẩn hóa danh sách sân với typeName từ fieldTypeMap
     const complex = complexData.complex;
     const fields = useMemo(() => {
          if (!rawFields.length) return rawFields;
          return rawFields.map(field => {
               const currentTypeName = field.typeName || field.TypeName || "";
               const typeId = field.typeId ?? field.TypeID ?? field.typeID ?? null;
               // Nếu đã có typeName, giữ nguyên TypeName
               if (fieldTypeMap && Object.keys(fieldTypeMap).length > 0 && typeId != null) {
                    const typeIdKey = String(typeId);
                    const mappedName = fieldTypeMap[typeIdKey];
                    if (mappedName && mappedName.trim() !== "") {
                         return { ...field, typeName: mappedName, typeId: typeId };
                    }
               }
               if (typeId != null && !currentTypeName) {
                    return { ...field, typeId: typeId };
               }
               return field;
          });
     }, [rawFields, fieldTypeMap]);
     // Tìm sân được chọn
     const selectedField = selectedFieldId ? fields.find(f => Number(f.fieldId) === Number(selectedFieldId)) : null;
     const selectedFieldForDisplay = useMemo(() => {
          if (!selectedField) return null;
          let resolvedTypeName = selectedField.typeName || "";
          const typeId = selectedField.typeId;
          if ((!resolvedTypeName || resolvedTypeName.trim() === "") && typeId != null && fieldTypeMap && Object.keys(fieldTypeMap).length > 0) {
               const mappedName = fieldTypeMap[String(typeId)];
               if (mappedName && mappedName.trim() !== "") {
                    resolvedTypeName = mappedName;

               }
          }
          // Xác định giá hiển thị
          const resolvedPrice = selectedSlotId
               ? (selectedSlotPriceFromSchedule || minPriceFromSchedule || selectedField.priceForSelectedSlot || 0)
               : (minPriceFromSchedule || selectedField.priceForSelectedSlot || 0);
          return {
               ...selectedField,
               typeName: resolvedTypeName,
               priceForSelectedSlot: resolvedPrice
          };
     }, [selectedField, selectedSlotId, selectedSlotPriceFromSchedule, minPriceFromSchedule, fieldTypeMap]);

     // Cảnh báo nếu selectedFieldId không tìm thấy trong fields
     useEffect(() => {
          if (selectedFieldId && !selectedField && fields.length > 0) {
               console.warn(`Selected field ${selectedFieldId} not found in fields array. Available fieldIds:`, fields.map(f => f.fieldId));
          }
     }, [selectedFieldId, selectedField, fields]);

     // Lấy danh sách đánh giá:
     // - Nếu đang xem sân nhỏ (selectedFieldId), dùng /api/ratings/field/{fieldId}
     // - Nếu đang xem cả khu sân, dùng /api/ratings/complex/{complexId}
     const complexIdForRatings = useMemo(() => {
          if (complex?.complexId) return complex.complexId;
          if (complex?.id) return complex.id;
          return !isFieldRoute && id ? Number(id) : null;
     }, [complex, id, isFieldRoute]);

     // Hàm tải đánh giá có thể tái sử dụng
     const loadRatings = useCallback(async () => {
          // Nếu đang xem một field cụ thể, lấy ratings theo fieldId
          if (selectedFieldId) {
               setIsLoadingRatings(true);
               try {
                    const ratings = await fetchRatingsByField(selectedFieldId);
                    setFieldRatings(ratings || []);
               } catch (error) {
                    console.error("Error loading field ratings:", error);
                    setFieldRatings([]);
               } finally {
                    setIsLoadingRatings(false);
               }
               return;
          }

          // Nếu không có selectedFieldId, lấy ratings theo complexId
          if (!complexIdForRatings) {
               setFieldRatings([]);
               return;
          }
          setIsLoadingRatings(true);
          try {
               const ratings = await fetchRatingsByComplex(complexIdForRatings);
               setFieldRatings(ratings || []);
          } catch (error) {
               console.error("Error loading complex ratings:", error);
               setFieldRatings([]);
          } finally {
               setIsLoadingRatings(false);
          }
     }, [selectedFieldId, complexIdForRatings]);

     // Hàm xử lý gửi đánh giá mới
     const handleRatingSubmit = useCallback(async ({ fieldId, stars, comment }) => {
          const { createRating } = await import("../../../../shared/services/ratings");

          // Tìm booking completed cho field này để lấy bookingId
          const playerId = user?.userID || user?.UserID || user?.id || user?.Id || user?.userId;
          if (!playerId) {
               throw new Error("Vui lòng đăng nhập để đánh giá");
          }

          const bookingsResult = await fetchBookingsByPlayer(playerId);
          if (!bookingsResult.success || !Array.isArray(bookingsResult.data)) {
               throw new Error("Không thể lấy thông tin booking");
          }

          // Lấy danh sách fieldIds của complex hiện tại
          const currentFieldIds = new Set();
          fields.forEach(f => {
               const fid = f.fieldId || f.FieldID || f.id;
               if (fid) currentFieldIds.add(String(fid));
          });
          if (fieldId) currentFieldIds.add(String(fieldId));
          if (selectedFieldId) currentFieldIds.add(String(selectedFieldId));

          // Lấy complexId hiện tại
          const currentComplexId = complex?.complexId || complex?.id || (!isFieldRoute ? id : null);

          // Tìm tất cả booking completed của user
          const completedBookings = bookingsResult.data.filter(booking => {
               const bookingStatus = String(booking.status || booking.Status || booking.bookingStatus || "").toLowerCase();
               return bookingStatus === "completed";
          });

          // Tìm booking completed phù hợp nhất
          let completedBooking = null;

          // 1. Ưu tiên booking cho fieldId đang đánh giá
          if (fieldId) {
               completedBooking = completedBookings.find(booking => {
                    const bookingFieldId = String(booking.fieldId || booking.FieldID || booking.fieldID || "");
                    return bookingFieldId === String(fieldId);
               });
          }

          // 2. Tìm booking cho bất kỳ field nào trong complex
          if (!completedBooking && currentFieldIds.size > 0) {
               completedBooking = completedBookings.find(booking => {
                    const bookingFieldId = booking.fieldId || booking.FieldID || booking.fieldID;
                    return bookingFieldId && currentFieldIds.has(String(bookingFieldId));
               });
          }

          // 3. Tìm booking có cùng complexId
          if (!completedBooking && currentComplexId) {
               completedBooking = completedBookings.find(booking => {
                    const bookingComplexId = booking.complexId || booking.ComplexID || booking.complexID;
                    return bookingComplexId && String(bookingComplexId) === String(currentComplexId);
               });
          }

          // 4. Nếu vẫn không tìm thấy, lấy booking completed đầu tiên (user đã có quyền đánh giá)
          if (!completedBooking && completedBookings.length > 0) {
               completedBooking = completedBookings[0];
          }

          if (!completedBooking) {
               throw new Error("Bạn cần có booking đã hoàn thành cho sân này để đánh giá");
          }

          const bookingId = completedBooking.bookingId || completedBooking.BookingId || completedBooking.id || completedBooking.BookingID;

          if (!bookingId) {
               throw new Error("Không tìm thấy mã booking hợp lệ");
          }

          await createRating({
               bookingId,
               stars,
               comment
          });

          // Reload ratings sau khi tạo thành công
          await loadRatings();
     }, [user, loadRatings, fields, selectedFieldId, complex, id, isFieldRoute]);

     // Tải danh sách đánh giá khi selectedFieldId hoặc complexIdForRatings thay đổi
     useEffect(() => {
          loadRatings();
     }, [loadRatings]);

     // Chuẩn hóa danh sách đánh giá từ fieldRatings thành complexReviews
     const complexReviews = useMemo(() => {
          return fieldRatings.map(raw => ({
               id: raw.id || raw.ratingId || undefined,
               ratingId: raw.id || raw.ratingId || undefined,
               userId: raw.userId,
               fieldId: raw.fieldId,
               fieldName: raw.fieldName,
               bookingStatus: raw.bookingStatus || "",
               user: raw.userName || "Người dùng",
               rating: raw.stars || 0,
               comment: raw.comment || "",
               date: raw.createdAt ? new Date(raw.createdAt).toLocaleDateString('vi-VN') : "",
               replies: Array.isArray(raw.replies)
                    ? raw.replies.map(reply => ({
                         replyId: reply.replyId,
                         userId: reply.userId,
                         userName: reply.userName,
                         replyText: reply.replyText,
                         createdAt: reply.createdAt
                    }))
                    : []
          }));
     }, [fieldRatings]);

     // Kiểm tra xem user hiện tại đã có rating trong danh sách chưa
     // Nếu có nghĩa là họ đã có booking completed
     const userHasExistingRating = useMemo(() => {
          if (!user) return false;
          const currentUserId = user?.userID || user?.UserID || user?.id || user?.Id || user?.userId;
          if (!currentUserId) return false;
          return complexReviews.some(review =>
               review.userId && String(review.userId) === String(currentUserId)
          );
     }, [user, complexReviews]);

     // Tính toán thống kê đánh giá
     const reviewStats = useMemo(() => {
          const total = complexReviews.length || 0;
          const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }; // Số lượng đánh giá theo sao
          complexReviews.forEach(r => { const k = Math.max(1, Math.min(5, r.rating || 0)); counts[k] = (counts[k] || 0) + 1; }); // Giới hạn từ 1-5 sao
          const average = total === 0 ? 0 : (complexReviews.reduce((s, r) => s + (r.rating || 0), 0) / total);
          return { total, counts, average };
     }, [complexReviews]);

     // Kiểm tra user có booking completed cho complex/field này không
     // Chỉ user có booking completed mới được phép viết đánh giá
     useEffect(() => {
          const checkCompletedBooking = async () => {
               if (!user) {
                    setHasCompletedBooking(false);
                    return;
               }

               const playerId = user?.userID || user?.UserID || user?.id || user?.Id || user?.userId;
               if (!playerId) {
                    setHasCompletedBooking(false);
                    return;
               }

               try {
                    const result = await fetchBookingsByPlayer(playerId);
                    if (result.success && Array.isArray(result.data)) {
                         // Lấy danh sách fieldIds của complex hiện tại
                         const currentFieldIds = new Set();

                         // Thêm các fieldId từ fields array
                         fields.forEach(f => {
                              const fid = f.fieldId || f.FieldID || f.id;
                              if (fid) currentFieldIds.add(String(fid));
                         });

                         // Nếu đang xem field cụ thể, thêm fieldId đó vào set
                         if (selectedFieldId) {
                              currentFieldIds.add(String(selectedFieldId));
                         }

                         // Lấy complexId hiện tại
                         const currentComplexId = complex?.complexId || complex?.id || (!isFieldRoute ? id : null);

                         // Kiểm tra có booking nào completed không
                         const hasCompleted = result.data.some(booking => {
                              const bookingStatus = String(booking.status || booking.Status || booking.bookingStatus || "").toLowerCase();
                              if (bookingStatus !== "completed") return false;

                              // Kiểm tra theo fieldId
                              const bookingFieldId = booking.fieldId || booking.FieldID || booking.fieldID;
                              if (bookingFieldId && currentFieldIds.size > 0 && currentFieldIds.has(String(bookingFieldId))) {
                                   return true;
                              }

                              // Kiểm tra theo complexId (nếu booking có complexId)
                              const bookingComplexId = booking.complexId || booking.ComplexID || booking.complexID;
                              if (currentComplexId && bookingComplexId && String(bookingComplexId) === String(currentComplexId)) {
                                   return true;
                              }

                              // Nếu đang xem field cụ thể và booking có cùng fieldId
                              if (selectedFieldId && bookingFieldId && String(bookingFieldId) === String(selectedFieldId)) {
                                   return true;
                              }

                              return false;
                         });

                         setHasCompletedBooking(hasCompleted);
                    } else {
                         setHasCompletedBooking(false);
                    }
               } catch (error) {
                    console.error("Error checking completed bookings:", error);
                    setHasCompletedBooking(false);
               }
          };

          checkCompletedBooking();
     }, [user, fields, selectedFieldId, complex, id, isFieldRoute]);
     // Thư viện ảnh bao gồm ảnh khu sân (complex) và tất cả ảnh sân nhỏ (fields)
     const galleryImages = [];
     // Thêm ảnh của complex (khu sân) - imageUrl từ Cloudinary
     if (complex?.imageUrl) {
          galleryImages.push({
               url: complex.imageUrl,
               type: 'complex',
               label: 'Khu sân'
          });
     }
     // Thêm ảnh của các field (sân nhỏ) - mainImageUrl và imageUrls từ Cloudinary
     fields.forEach(field => {
          // Thêm mainImageUrl nếu có
          if (field.mainImageUrl) {
               galleryImages.push({
                    url: field.mainImageUrl,
                    type: 'field',
                    label: field.name || 'Sân nhỏ'
               });
          }
          // Thêm các ảnh trong imageUrls (gallery)
          if (Array.isArray(field.imageUrls) && field.imageUrls.length > 0) {
               field.imageUrls.forEach(imageUrl => {
                    if (imageUrl) {
                         galleryImages.push({
                              url: imageUrl,
                              type: 'field',
                              label: field.name || 'Sân nhỏ'
                         });
                    }
               });
          }
     });

     // lấy danh sách URL ảnh để sử dụng trong lightbox
     const galleryImageUrls = galleryImages.map(img => img.url);
     const openLightbox = (index) => {
          if (!galleryImageUrls.length) return;
          setLightboxIndex(Math.max(0, Math.min(index, galleryImageUrls.length - 1)));
          setIsLightboxOpen(true);
     };

     const closeLightbox = () => setIsLightboxOpen(false);
     // Xử lý phím tắt trong lightbox
     useEffect(() => {
          if (!isLightboxOpen) return;
          const onKeyDown = (e) => {
               if (e.key === "Escape") closeLightbox();
               if (e.key === "ArrowRight") setLightboxIndex(i => (i + 1) % galleryImageUrls.length);
               if (e.key === "ArrowLeft") setLightboxIndex(i => (i - 1 + galleryImageUrls.length) % galleryImageUrls.length);
          };
          window.addEventListener("keydown", onKeyDown);
          return () => window.removeEventListener("keydown", onKeyDown);
     }, [isLightboxOpen, galleryImageUrls.length]);

     // Tính toán số sân còn trống (sân nhỏ)
     // Nếu đã chọn slot & field cụ thể: dựa trên lịch trình của sân đó trong ngày được chọn
     const availableCount = useMemo(() => {
          // Đã chọn một sân cụ thể
          if (selectedFieldId && Array.isArray(selectedFieldSchedulesWithPackages)) {
               // Nếu không có bất kỳ lịch trình nào cho ngày đã chọn → coi như hết chỗ
               if (selectedFieldSchedulesWithPackages.length === 0) {
                    return 0;
               }

               // Nếu đã chọn slot cụ thể: kiểm tra lịch trình của slot đó
               if (selectedSlotId) {
                    const slotIdStr = String(selectedSlotId);
                    const relatedSchedules = selectedFieldSchedulesWithPackages.filter((s) => {
                         const scheduleSlotId = s.slotId || s.SlotId || s.slotID || s.SlotID;
                         return String(scheduleSlotId) === slotIdStr;
                    });
                    if (!relatedSchedules.length) {
                         // Không có lịch trình cho slot này trong ngày đã chọn
                         return 0;
                    }
                    const hasAvailable = relatedSchedules.some(
                         (s) => (s.status || s.Status || "Available") === "Available"
                    );
                    return hasAvailable ? 1 : 0;
               }

               // Chưa chọn slot nhưng đã chọn sân: nếu có ít nhất một lịch trình Available trong ngày → 1, ngược lại 0
               const hasAnyAvailable = selectedFieldSchedulesWithPackages.some(
                    (s) => (s.status || s.Status || "Available") === "Available"
               );
               return hasAnyAvailable ? 1 : 0;
          }

          // Chưa chọn sân nhỏ: hiển thị tổng số sân nhỏ trong khu
          return fields.length;
     }, [selectedFieldId, selectedSlotId, selectedFieldSchedulesWithPackages, fields.length]);

     // Dynamic pricing derived from visible schedules
     const selectedSlotPrice = selectedSlotId
          ? (selectedSlotPriceFromSchedule || selectedField?.priceForSelectedSlot || 0)
          : 0;

     const minPrice = minPriceFromSchedule || selectedField?.priceForSelectedSlot || 0;

     const selectedFieldCheapestSlot = cheapestScheduleEntry;
     const selectedFieldPriciestSlot = priciestScheduleEntry;

     // Tính tổng số buổi cho đặt định kỳ
     const calculateTotalSessions = () => {
          if (!isRecurring || !rangeStart || !rangeEnd || repeatDays.length === 0) return 0;
          const startDate = new Date(rangeStart);
          const endDate = new Date(rangeEnd);
          const weeks = Math.ceil((endDate - startDate) / (7 * 24 * 60 * 60 * 1000));
          return repeatDays.length * weeks;
     };

     // Tính tóm tắt giá cho đặt cố định 
     const recurringSummary = (() => {
          if (!isRecurring || !selectedField) return null;
          const totalSessions = calculateTotalSessions();
          if (!totalSessions) return { totalSessions: 0, unitPrice: 0, subtotal: 0 };
          // sử dụng selectedSlotPrice nếu có, ngược lại dùng minPrice
          const unitPrice = Number(selectedSlotPrice || minPrice || 0);
          const subtotal = unitPrice * totalSessions;
          return { totalSessions, unitPrice, subtotal };
     })();

     return (
          <Section className="min-h-screen bg-[url('https://mixivivu.com/section-background.png')] bg-cover bg-center">
               <HeaderSection complex={complex} user={user} />
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

               {/* 2 layout: nội dung bên trái, đặt sân bên pahir */}
               <Container className="py-5">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                         {/* Left - Content */}
                         <div className="lg:col-span-2 p-5 bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-teal-100 space-y-6">
                              {activeTab === "info" && (
                                   <InfoTabContent
                                        selectedField={selectedFieldForDisplay || selectedField}
                                        complex={complex}
                                        fields={fields}
                                        selectedSlotId={selectedSlotId}
                                        availableCount={availableCount}
                                        cheapestSlot={cheapestSlot}
                                        priciestSlot={priciestSlot}
                                        depositPolicy={depositPolicy}
                                        fieldTypeMap={fieldTypeMap}
                                        selectedFieldCheapestSlot={selectedFieldCheapestSlot}
                                        selectedFieldPriciestSlot={selectedFieldPriciestSlot}
                                        reviewStats={reviewStats}
                                        onBack={handleBackToComplex}
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
                                        fieldId={selectedFieldId}
                                        isLoadingRatings={isLoadingRatings}
                                        canWriteReview={hasCompletedBooking || userHasExistingRating}
                                        hasCompletedBooking={hasCompletedBooking || userHasExistingRating}
                                        onRatingSubmit={handleRatingSubmit}
                                        onRatingUpdated={loadRatings}
                                        onRatingDeleted={loadRatings}
                                   />
                              )}

                              {activeTab === "location" && (
                                   <LocationTabContent complex={complex} />
                              )}

                              {activeTab === "gallery" && (
                                   <GalleryTabContent
                                        galleryImages={galleryImageUrls}
                                        galleryImagesWithMeta={galleryImages}
                                        onImageClick={openLightbox}
                                   />
                              )}
                         </div>

                         {/* Right - Sticky booking widget */}
                         <div className="lg:col-span-1">
                              <BookingWidget
                                   selectedField={selectedField}
                                   fields={fields}
                                   selectedDate={selectedDate}
                                   selectedSlotId={selectedSlotId}
                                   fieldSchedules={selectedFieldSchedulesWithPackages}
                                   isLoadingSchedules={isLoadingSelectedFieldSchedules}
                                   isRecurring={isRecurring}
                                   repeatDays={repeatDays}
                                   rangeStart={rangeStart}
                                   rangeEnd={rangeEnd}
                                   daysOfWeek={daysOfWeek}
                                   recurringSummary={recurringSummary}
                                   selectedSlotPrice={selectedSlotPrice}
                                   minPrice={minPrice}
                                   calculateTotalSessions={calculateTotalSessions}
                                   onDateChange={(newDate) => {
                                        setSelectedDate(newDate);
                                        // Reset slot đã chọn khi chuyển ngày
                                        setSelectedSlotId("");
                                   }}
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
                    images={galleryImageUrls}
                    currentIndex={lightboxIndex}
                    onClose={closeLightbox}
                    onPrevious={() => setLightboxIndex(i => (i - 1 + galleryImageUrls.length) % galleryImageUrls.length)}
                    onNext={() => setLightboxIndex(i => (i + 1) % galleryImageUrls.length)}
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