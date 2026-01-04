import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Star } from "lucide-react";
import { Section, Container, Card, CardContent, StaggerContainer } from "../../../../shared/components/ui";
import { ScrollReveal } from "../../../../shared/components/ScrollReveal";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchComplexes, fetchFields, fetchTimeSlots, fetchFavoriteFields, toggleFavoriteField, useFieldSearchQuery, useFieldRatings } from "../../../../shared/index";
import { usePublicFieldSchedulesByDate } from "../../../../shared/hooks/useFieldSchedules";
import { fetchFieldTypes, normalizeFieldType } from "../../../../shared/services/fieldTypes";
// import { fetchRatingsByField } from "../../../../shared/services/ratings"; // Removed as it is handled by useFieldRatings

import Swal from 'sweetalert2';
import MapSearch from "./components/MapSearch";
import SearchHeader from "./components/SearchHeader";
import SearchFiltersBar from "./components/SearchFiltersBar";
import QuickPresets from "./components/QuickPresets";
import AdvancedFilters from "./components/AdvancedFilters";
import ResultsHeader from "./components/ResultsHeader";
import LoadingState from "./components/LoadingState";
import EmptyState from "./components/EmptyState";
import Pagination from "./components/Pagination";
import FieldCard from "./components/FieldCard";
import FieldListItem from "./components/FieldListItem";
import ComplexCard from "./components/ComplexCard";
import ComplexListItem from "./components/ComplexListItem";
import GroupedViewSection from "./components/GroupedViewSection";

// Chuẩn hóa trạng thái sân (lowercase, trim)
const normalizeStatus = (status) => (typeof status === "string" ? status.trim().toLowerCase() : "");

// Chuẩn hóa text để so sánh (bỏ dấu, lowercase, trim)
const normalizeText = (text) => {
     if (typeof text !== "string") return "";
     return text
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .toLowerCase()
          .trim();
};

//Chuẩn hóa khóa quận/huyện để so sánh 
const normalizeDistrictKey = (text) => {
     const normalized = normalizeText(text);
     return normalized.replace(/^(quan|huyen|thi xa)\s+/i, "");
};
// Chỉ hiển thị sân có trạng thái "Available" - không hiển thị sân đang bảo trì
const ALLOWED_FIELD_STATUSES = new Set(["available"]);
const FIELD_TYPE_ALIASES = {
     "5vs5": ["5vs5", "5v5", "san5", "san5nguoi", "5nguoi"],
     "7vs7": ["7vs7", "7v7", "san7", "san7nguoi", "7nguoi"],
     "11vs11": ["11vs11", "11v11", "san11", "san11nguoi", "11nguoi"],
};

// Chuẩn hóa chuỗi loại sân để so sánh
const normalizeTypeString = (value = "") => value
     .toString()
     .normalize("NFD")
     .replace(/[\u0300-\u036f]/g, "")
     .toLowerCase()
     .replace(/[^a-z0-9]/g, "");
// Định dạng khoảng thời gian như "HH:mm - HH:mm" khi không có tên khung giờ
const formatTimeRange = (start, end) => {
     if (!start && !end) return "";
     const s = start ? String(start).slice(0, 5) : "";
     const e = end ? String(end).slice(0, 5) : "";
     if (s && e) return `${s} - ${e}`;
     return s || e;
};
// Xác định tên loại sân dựa trên đối tượng sân được cung cấp và một ánh xạ loại sân tùy chọn.
function resolveFieldTypeName(field, fieldTypeMap = {}) {
     if (!field) return "";
     if (field.typeName && field.typeName.trim()) return field.typeName;
     if (field.TypeName && field.TypeName.trim()) return field.TypeName;
     const typeId = field.typeId ?? field.TypeID ?? field.typeID;
     if (typeId != null) {
          return fieldTypeMap[String(typeId)] || "";
     }
     return "";
}

//Xác định xem sân có khớp với tab loại sân mong muốn dựa trên loại và các bí danh của nó hay không.
const doesFieldMatchTypeTab = (field, desiredType, fieldTypeMap = {}) => {
     if (desiredType === "all") return true;
     const directName = resolveFieldTypeName(field, fieldTypeMap);
     if (!directName) return false;
     const normalizedName = normalizeTypeString(directName);
     if (!normalizedName) return false;
     const aliases = FIELD_TYPE_ALIASES[desiredType] || [];
     if (aliases.length === 0) {
          return normalizedName === normalizeTypeString(desiredType);
     }
     return aliases.some(alias => normalizedName.includes(alias));
};
const isFieldDisplayable = (field) => {
     const normalizedStatus = normalizeStatus(field?.status ?? field?.Status ?? "");
     if (!normalizedStatus) return true;
     return ALLOWED_FIELD_STATUSES.has(normalizedStatus);
};

/**
 * Trang tìm kiếm sân bóng
 * URL: /search
 */
export default function FieldSearch({ user }) {
     const navigate = useNavigate();
     const location = useLocation();
     const [entityTab, setEntityTab] = useState("fields");       // Tab hiển thị: complexes | fields
     const [searchQuery, setSearchQuery] = useState("");
     const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(""); // Debounced search query
     const [selectedLocation, setSelectedLocation] = useState("");
     const [selectedPrice, setSelectedPrice] = useState("all");
     const [selectedRating, setSelectedRating] = useState("all");
     const [viewMode, setViewMode] = useState("grid");
     const [showFilters, setShowFilters] = useState(false);      // Hiển thị bộ lọc nâng cao
     const [sortBy, setSortBy] = useState("relevance");
     const [activeTab, setActiveTab] = useState("all");
     const [typeTab, setTypeTab] = useState("all");
     const [page, setPage] = useState(1);
     const [pageComplex, setPageComplex] = useState(1);
     const fieldPageSize = 12;
     const complexPageSize = 9;
     const [forceList, setForceList] = useState(false);
     const [showMapSearch, setShowMapSearch] = useState(false);
     const [mapSearchKey, setMapSearchKey] = useState(0);        // Key để reset MapSearch
     const [date, setDate] = useState("");                       // Ngày đã chọn để lọc
     const [slotId, setSlotId] = useState("");                   // Khung giờ đã chọn
     const [timeSlots, setTimeSlots] = useState([]);             // Danh sách khung giờ
     const [availableFieldIds, setAvailableFieldIds] = useState(null); // Set fieldIds có lịch cho ngày đã chọn
     // const [fields, setFields] = useState([]);                   // Removed: Managed by React Query
     // const [complexes, setComplexes] = useState([]);                  // Removed: Managed by React Query
     // const [filteredFields, setFilteredFields] = useState([]); // Removed state for performance

     const [selectedComplexId, setSelectedComplexId] = useState(null); // ComplexId được chọn từ bản đồ
     const [favoriteFieldIds, setFavoriteFieldIds] = useState(new Set()); // Set fieldIds yêu thích của user
     // const [isLoading, setIsLoading] = useState(false);               // Removed: Managed by React Query
     const [userLocation, setUserLocation] = useState(null);        //  Vị trí người dùng (nếu có)
     const [fieldTypeMap, setFieldTypeMap] = useState({});           // Ánh xạ typeId -> typeName
     const favoritesLoadedRef = useRef(false);                        // Đánh dấu đã tải danh sách yêu thích
     const heroRef = useRef(null);
     const hasExistingDataRef = useRef(false);
     const complexesRef = useRef([]);                                 // Lưu trữ tạm thời danh sách complexes
     const didInitRef = useRef(false);
     const prevSearchRef = useRef(location.search);
     // Cập nhật timeSlots một cách an toàn để tránh re-render không cần thiết
     const setTimeSlotsSafe = (nextSlots) => {
          setTimeSlots((prev) => {
               if (!Array.isArray(prev) || !Array.isArray(nextSlots)) return nextSlots;
               if (prev.length !== nextSlots.length) return nextSlots;
               for (let i = 0; i < prev.length; i++) {
                    const a = prev[i];
                    const b = nextSlots[i];
                    if ((a.slotId || a.slotID) !== (b.slotId || b.slotID) || a.name !== b.name) {
                         return nextSlots;
                    }
               }
               return prev;
          });
     };
     // Cập nhật availableFieldIds một cách an toàn để tránh re-render không cần thiết
     const setAvailableFieldIdsSafe = (nextSet) => {
          setAvailableFieldIds((prev) => {
               if (prev === null && nextSet === null) return prev;
               if (prev instanceof Set && nextSet instanceof Set) {
                    if (prev.size === nextSet.size) {
                         for (const v of prev) {
                              if (!nextSet.has(v)) return nextSet;
                         }
                         return prev;
                    }
               }
               return nextSet;
          });
     };


     // Xử lý thay đổi bộ lọc
     const handleLocationChange = (value) => {
          setSelectedLocation(value === "all" ? "" : value);
     };
     const handlePriceChange = (value) => {
          setSelectedPrice(value === "all" ? "" : value);
     };
     const handleRatingChange = (value) => {
          setSelectedRating(value === "all" ? "" : value);
     };
     const getLocationValue = () => {
          return selectedLocation === "" ? "all" : selectedLocation;
     };
     const getPriceValue = () => {
          return selectedPrice === "" ? "all" : selectedPrice;
     };
     const getRatingValue = () => {
          return selectedRating === "" ? "all" : selectedRating;
     };
     const getSlotValue = () => {
          return slotId === "" ? "all" : String(slotId);
     };

     // Debounce searchQuery
     useEffect(() => {
          const timer = setTimeout(() => {
               setDebouncedSearchQuery(searchQuery);
          }, 500);
          return () => clearTimeout(timer);
     }, [searchQuery]);

     // React Query hooks
     const {
          complexes: rawComplexes,
          fields: rawFields,
          isLoading: isQueryLoading,
     } = useFieldSearchQuery({
          searchQuery: debouncedSearchQuery,
          date,
          slotId,
          sortBy
     });

     // Fetch ratings using useQueries (Parallel fetching)
     const { ratingsMap, isLoading: isRatingsLoading } = useFieldRatings(rawFields);

     const isLoading = isQueryLoading || isRatingsLoading;

     // Helper function for distance
     const haversineKm = (lat1, lng1, lat2, lng2) => {
          if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
          const R = 6371;
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLng = (lng2 - lng1) * Math.PI / 180;
          const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
          const d = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return R * d;
     };

     // Process complexes with distance
     const complexes = useMemo(() => {
          const list = Array.isArray(rawComplexes) ? rawComplexes : [];
          if (!userLocation) return list;

          return list.map(c => {
               const lat = c.lat ?? c.latitude;
               const lng = c.lng ?? c.longitude;
               if (typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng)) {
                    return { ...c, distanceKm: haversineKm(userLocation.lat, userLocation.lng, lat, lng) };
               }
               return c;
          });
     }, [rawComplexes, userLocation]);

     // Update complexesRef for distance calculation
     useEffect(() => {
          if (complexes.length > 0) {
               complexesRef.current = complexes;
          }
     }, [complexes]);











     // Process fields with ratings and distance
     const fields = useMemo(() => {
          if (!Array.isArray(rawFields)) return [];
          return rawFields.map(field => {
               // Normalize typeName
               let typeName = field.typeName;
               const typeId = field.typeId ?? field.TypeID ?? field.typeID ?? null;
               if (typeId != null && (!typeName || typeName.trim() === "")) {
                    typeName = fieldTypeMap[String(typeId)] || "";
               }

               // Merge ratings
               const fieldId = field.fieldId || field.FieldID;
               const ratingInfo = ratingsMap[fieldId] || { rating: 0, reviewCount: 0 };

               // Calculate distance
               let distanceKm = field.distanceKm;
               if (userLocation) {
                    const complexId = field.complexId || field.ComplexId;
                    // Find complex in the processed complexes list (which has distanceKm)
                    const complex = complexes.find(c => c.complexId === complexId);

                    if (complex && typeof complex.distanceKm === "number") {
                         distanceKm = complex.distanceKm;
                    } else {
                         // Fallback to field coordinates if available
                         const lat = field.lat ?? field.latitude;
                         const lng = field.lng ?? field.longitude;
                         if (typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng)) {
                              distanceKm = haversineKm(userLocation.lat, userLocation.lng, lat, lng);
                         }
                    }
               }

               return {
                    ...field,
                    typeName,
                    typeId,
                    rating: ratingInfo.rating,
                    reviewCount: ratingInfo.reviewCount,
                    distanceKm
               };
          });
     }, [rawFields, fieldTypeMap, ratingsMap, complexes, userLocation]);

     // Tạo danh sách tùy chọn quận/huyện từ dữ liệu khu sân
     const districtOptions = useMemo(() => {
          const map = new Map(); // baseKey -> label
          complexes.forEach((c) => {
               const raw = typeof c?.district === "string" ? c.district.trim() : "";
               if (!raw) return;
               const baseKey = normalizeDistrictKey(raw);
               const hasPrefix = /^(Quận|Huyện|Thị xã)/i.test(raw);
               if (!map.has(baseKey)) {
                    map.set(baseKey, raw);
                    return;
               }
               const current = map.get(baseKey);
               const currentHasPrefix = /^(Quận|Huyện|Thị xã)/i.test(current);
               // Prefer label with administrative prefix if available
               if (hasPrefix && !currentHasPrefix) {
                    map.set(baseKey, raw);
               }
          });
          return Array.from(map.values()).sort((a, b) => a.localeCompare(b, "vi"));
     }, [complexes]);

     // Cập nhật ref đánh dấu có dữ liệu tồn tại
     useEffect(() => {
          hasExistingDataRef.current = (fields.length > 0) || (complexes.length > 0);
     }, [fields.length, complexes.length]);

     // Tải loại sân khi component được gắn
     useEffect(() => {
          async function loadFieldTypes() {
               let ignore = false;
               try {
                    // tải dữ liệu loại sân
                    const result = await fetchFieldTypes();
                    if (ignore) return;
                    if (result.success && Array.isArray(result.data)) {
                         const map = result.data.reduce((acc, raw) => {
                              const normalized = normalizeFieldType(raw);
                              if (normalized?.typeId) {
                                   acc[String(normalized.typeId)] = normalized.typeName || "";
                              }
                              return acc;
                         }, {});
                         setFieldTypeMap(map);
                    }
               } catch (error) {
                    console.error("Error loading field types:", error);
               }
          }
          loadFieldTypes();
     }, []);

     useEffect(() => {
          window.scrollTo(0, 0);
     }, []);

     // cập nhật bộ lọc từ homepage khi nhấn tìm kiếm
     useEffect(() => {
          const currentSearch = location.search || "";
          const isFirstLoad = !didInitRef.current;
          const searchChanged = prevSearchRef.current !== currentSearch;
          prevSearchRef.current = currentSearch;
          if (!isFirstLoad && !searchChanged) return;
          didInitRef.current = true;
          try {
               const params = new URLSearchParams(currentSearch);
               let foundUrlParams = false;

               // Đọc các tham số từ URL query và cập nhật state tương ứng
               const q = params.get("searchQuery");
               setSearchQuery(q || "");
               if (q !== null) foundUrlParams = true;

               const sl = params.get("selectedLocation");
               setSelectedLocation(sl === "all" ? "" : (sl || ""));
               if (sl !== null) foundUrlParams = true;

               const sp = params.get("selectedPrice");
               setSelectedPrice(sp === "all" ? "" : (sp || ""));
               if (sp !== null) foundUrlParams = true;

               const sr = params.get("selectedRating");
               setSelectedRating(sr === "all" ? "" : (sr || ""));
               if (sr !== null) foundUrlParams = true;

               const sb = params.get("sortBy");
               setSortBy(sb || "relevance");
               if (sb !== null) foundUrlParams = true;

               const tt = params.get("typeTab");
               setTypeTab(tt || "all");
               if (tt !== null) foundUrlParams = true;

               const at = params.get("activeTab");
               setActiveTab(at || "all");
               if (at !== null) foundUrlParams = true;

               // Trang hiện tại
               const p = params.get("page");
               if (p !== null) {
                    const pn = parseInt(p, 10);
                    if (!Number.isNaN(pn)) setPage(pn);
                    foundUrlParams = true;
               } else {
                    setPage(1);
               }

               const et = params.get("entityTab");
               setEntityTab(et || "fields");
               if (et !== null) foundUrlParams = true;

               const d = params.get("date");
               setDate(d || "");
               if (d !== null) foundUrlParams = true;

               const s = params.get("slotId");
               setSlotId(s || "");
               if (s !== null) foundUrlParams = true;

               if (foundUrlParams) {
                    setForceList(true);
               } else {
                    setForceList(false);
               }
               // Tải tùy chọn người dùng từ localStorage nếu không có tham số URL
               if (isFirstLoad && !foundUrlParams) {
                    const saved = window.localStorage.getItem("fieldSearchPrefs");
                    if (saved) {
                         const prefs = JSON.parse(saved);
                         if (prefs.viewMode) setViewMode(prefs.viewMode);
                    }
               }
          } catch (e) {
               console.error("Error parsing search query params:", e);
          }
     }, [location.search]);

     // Load danh sách sân yêu thích khi đã có user đăng nhập
     useEffect(() => {
          const loadFavorites = async () => {
               if (!user || favoritesLoadedRef.current) return;
               try {
                    const list = await fetchFavoriteFields();
                    const ids = new Set(
                         (list || []).map(item => Number(item.fieldId)).filter(id => !Number.isNaN(id))
                    );
                    setFavoriteFieldIds(ids);
                    favoritesLoadedRef.current = true;
               } catch (error) {
                    console.error("Error loading favorite fields:", error);
               }
          };
          loadFavorites();
     }, [user]);

     // Load dữ liệu lịch sử theo ngày đã chọn 
     // React Query: fetch schedules by date (cached)
     const { data: schedulesByDate = [], } = usePublicFieldSchedulesByDate(
          date ? date.split("T")[0] : ""
     );
     const schedulesData = useMemo(() => (Array.isArray(schedulesByDate) ? schedulesByDate : []), [schedulesByDate]);

     // Cập nhật khung giờ và fieldId có lịch khi ngày thay đổi
     useEffect(() => {
          let mounted = true;
          const loadAllSlotsWhenNoDate = async () => {
               try {
                    const response = await fetchTimeSlots();
                    if (!mounted) return;
                    const slots = response?.success && Array.isArray(response.data) ? response.data : [];
                    setTimeSlotsSafe(
                         slots.map((slot) => {
                              const timeLabel = formatTimeRange(slot.startTime || slot.StartTime, slot.endTime || slot.EndTime);
                              const baseName = slot.name || slot.slotName || slot.SlotName;
                              const label = baseName
                                   ? timeLabel
                                        ? `${baseName} (${timeLabel})`
                                        : baseName
                                   : timeLabel || `Slot ${slot.slotId || slot.SlotID}`;
                              return { ...slot, name: label };
                         })
                    );
                    setAvailableFieldIdsSafe(null);
               } catch (error) {
                    console.error("Error loading all time slots:", error);
                    if (!mounted) return;
                    setTimeSlotsSafe([]);
                    setAvailableFieldIdsSafe(null);
               }
          };

          if (!date) {
               loadAllSlotsWhenNoDate();
               return () => {
                    mounted = false;
               };
          }
          const slotMap = new Map();
          const fieldIdSet = new Set();

          // Duyệt qua dữ liệu lịch để xây dựng danh sách khung giờ và fieldId có lịch
          schedulesData.forEach((schedule) => {
               const status = normalizeStatus(schedule.status || schedule.Status);
               if (status && status !== "available") return;
               const slotId = schedule.slotId || schedule.SlotId;
               const fieldId = schedule.fieldId || schedule.FieldId || schedule.fieldID || schedule.FieldID;
               const slotName = schedule.slotName || schedule.SlotName;
               const timeLabel = formatTimeRange(schedule.startTime || schedule.StartTime, schedule.endTime || schedule.EndTime);
               const label = slotName
                    ? timeLabel
                         ? `${slotName} (${timeLabel})`
                         : slotName
                    : timeLabel || (slotId ? `Slot ${slotId}` : "");

               if (slotId && !slotMap.has(slotId)) {
                    slotMap.set(slotId, {
                         slotId,
                         name: label || `Slot ${slotId}`,
                         startTime: schedule.startTime || schedule.StartTime,
                         endTime: schedule.endTime || schedule.EndTime,
                    });
               }

               if (fieldId) {
                    fieldIdSet.add(String(fieldId));
               }
          });
          setTimeSlotsSafe(slotMap.size > 0 ? Array.from(slotMap.values()) : []);
          setAvailableFieldIdsSafe(fieldIdSet.size > 0 ? new Set(fieldIdSet) : null);
          return () => {
               mounted = false;
          };
     }, [date, schedulesData]);

     // Reset slotId khi ngày thay đổi
     useEffect(() => {
          if (slotId) {
               setSlotId("");
          }
     }, [date, slotId]);     // Tối ưu hóa: Sử dụng useMemo thay vì useEffect để tránh render thừa
     const filteredFields = useMemo(() => {
          // Thêm thông tin isFavorite
          let filtered = Array.isArray(fields) ? fields.map(f => ({
               ...f,
               isFavorite: favoriteFieldIds.has(Number(f.fieldId)),
          })) : [];

          // Lọc theo complexId được chọn từ bản đồ
          if (selectedComplexId) {
               filtered = filtered.filter(field => {
                    const fieldComplexId = field.complexId ?? field.ComplexId ?? field.complexID;
                    return fieldComplexId && Number(fieldComplexId) === Number(selectedComplexId);
               });
          }

          // Tìm kiếm theo tên và địa chỉ
          if (searchQuery) {
               filtered = filtered.filter(field =>
                    field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (field.address || "").toLowerCase().includes(searchQuery.toLowerCase())
               );
          }

          // Tìm sân theo ngày và khung giờ đã chọn
          if (date && availableFieldIds instanceof Set) {
               filtered = filtered.filter(field => {
                    const fid = field.fieldId ?? field.FieldID ?? field.fieldID ?? field.id;
                    if (!fid) return false;
                    return availableFieldIds.has(String(fid));
               });
          }

          //Tìm theo vị trí đã chọn
          if (selectedLocation) {
               const normalizedLocation = normalizeText(selectedLocation);
               const normalizedBase = normalizeDistrictKey(selectedLocation);
               const patterns = [normalizedLocation];
               if (normalizedBase) patterns.push(normalizedBase);
               const numMatch = normalizedLocation.match(/\d+/);
               if (numMatch) {
                    const num = numMatch[0];
                    patterns.push(`q.${num}`, `q${num}`, `quan${num}`, `quan ${num}`);
               }

               filtered = filtered.filter(field => {
                    const addr = normalizeText(field.address || "");
                    const dist = normalizeText(field.district || "");
                    const ward = normalizeText(field.ward || field.Ward || "");
                    const complexName = normalizeText(field.complexName || field.fieldName || field.name || "");
                    const locationText = normalizeText(field.location || field.Location || "");
                    const complexAddress = normalizeText(field.complexAddress || "");

                    // Kết hợp tất cả text để tìm kiếm
                    const allText = [addr, dist, ward, complexName, locationText, complexAddress].join(" ");
                    const matchesAnyPattern = patterns.some(pattern => allText.includes(pattern));

                    // Kiểm tra khớp chính xác quận/huyện
                    const exactDistrictMatch = dist && (
                         dist === normalizedLocation ||
                         dist === normalizedBase ||
                         normalizeDistrictKey(dist) === normalizedBase
                    );
                    return matchesAnyPattern || exactDistrictMatch;
               });
          }

          // Tìm theo loại sân
          if (typeTab !== "all") {
               filtered = filtered.filter(field => doesFieldMatchTypeTab(field, typeTab, fieldTypeMap));
          }

          // tìm theo giá
          if (selectedPrice) {
               switch (selectedPrice) {
                    case "under100":
                         filtered = filtered.filter(field => (field.priceForSelectedSlot || 0) < 100000);
                         break;
                    case "100-200":
                         filtered = filtered.filter(field => (field.priceForSelectedSlot || 0) >= 100000 && (field.priceForSelectedSlot || 0) <= 200000);
                         break;
                    case "200-300":
                         filtered = filtered.filter(field => (field.priceForSelectedSlot || 0) >= 200000 && (field.priceForSelectedSlot || 0) <= 300000);
                         break;
                    case "over300":
                         filtered = filtered.filter(field => (field.priceForSelectedSlot || 0) > 300000);
                         break;
                    default:
                         break;
               }
          }

          // tìm theo ddnahs giá
          if (selectedRating) {
               const minRating = parseFloat(selectedRating);
               filtered = filtered.filter(field => field.rating >= minRating);
          }

          // sắp xêp
          switch (sortBy) {
               case "price-low":
                    filtered.sort((a, b) => (a.priceForSelectedSlot || 0) - (b.priceForSelectedSlot || 0));
                    break;
               case "price-high":
                    filtered.sort((a, b) => (b.priceForSelectedSlot || 0) - (a.priceForSelectedSlot || 0));
                    break;
               case "rating":
                    filtered.sort((a, b) => b.rating - a.rating);
                    break;
               case "distance":
                    filtered.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
                    break;
               default:
                    break;
          }

          // Tabs hoạt động
          switch (activeTab) {
               case "near":
                    filtered = [...filtered].sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
                    break;
               case "best-price":
                    filtered = [...filtered].sort((a, b) => (a.priceForSelectedSlot || 0) - (b.priceForSelectedSlot || 0));
                    break;
               case "top-rated":
                    filtered = [...filtered].sort((a, b) => b.rating - a.rating);
                    break;
               case "favorites":
                    filtered = filtered.filter(f => f.isFavorite);
                    break;
               default:
                    break;
          }
          const fieldsWithTypeName = filtered.map(field => {
               const typeId = field.typeId ?? field.TypeID ?? field.typeID ?? null;
               if (typeId != null && (!field.typeName || field.typeName.trim() === "")) {
                    const typeName = fieldTypeMap[String(typeId)];
                    if (typeName) {
                         return { ...field, typeName, typeId };
                    }
               }
               return field;
          });
          return fieldsWithTypeName;
     }, [searchQuery, selectedLocation, selectedPrice, selectedRating, sortBy, activeTab, typeTab, fields, fieldTypeMap, date, availableFieldIds, favoriteFieldIds, selectedComplexId]);


     // Lưu tùy chọn người dùng vào localStorage khi thay đổi
     useEffect(() => {
          try {
               const prefs = { viewMode, activeTab, page, entityTab, date, slotId, typeTab };
               window.localStorage.setItem("fieldSearchPrefs", JSON.stringify(prefs));
          } catch { }
     }, [viewMode, activeTab, page, entityTab, date, slotId, typeTab]);
     const toggleFavoriteLocal = (fieldId, nextIsFavorite) => {
          // setFields(prev => prev.map(field =>
          //      field.fieldId === fieldId ? { ...field, isFavorite: nextIsFavorite } : field
          // ));
          // No need to update fields state directly as it is derived from favoriteFieldIds
          setFavoriteFieldIds(prev => {
               const updated = new Set(prev);
               const idNum = Number(fieldId);
               if (nextIsFavorite) {
                    updated.add(idNum);
               } else {
                    updated.delete(idNum);
               }
               return updated;
          });
     };


     // Thong báo 
     const showToastMessage = (message, type = 'info') => {
          const config = {
               text: message,
               icon: type,
               toast: true,
               position: 'top-end',
               showConfirmButton: false,
               timer: 3000,
               timerProgressBar: true,
          };
          Swal.fire(config);
     };

     //yêu thích sân
     const handleToggleFavorite = async (fieldId) => {
          if (!user) {
               showToastMessage("Vui lòng đăng nhập để sử dụng danh sách yêu thích.", 'warning');
               return;
          }
          const current = favoriteFieldIds.has(Number(fieldId));
          const nextIsFavorite = !current;

          toggleFavoriteLocal(fieldId, nextIsFavorite);
          try {
               await toggleFavoriteField(fieldId, current);
          } catch (error) {
               toggleFavoriteLocal(fieldId, current);
               showToastMessage(error.message || "Không thể cập nhật danh sách yêu thích.", 'error');
          }
     };

     // đặt sân
     const handleBook = (fieldId) => {
          if (!user) {
               Swal.fire({
                    title: 'Cần đăng nhập',
                    text: 'Bạn cần đăng nhập để đặt sân. Vui lòng đăng nhập để tiếp tục.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Đăng nhập ngay',
                    cancelButtonText: 'Đóng',
                    confirmButtonColor: '#14b8a6',
                    cancelButtonColor: '#6b7280',
                    allowOutsideClick: true,
                    allowEscapeKey: true,
               }).then((result) => {
                    if (result.isConfirmed) {
                         Swal.close();
                         navigate('/login');
                    }
               });
               return;
          }
          navigate(`/booking/${fieldId}`);
     };

     // chọn từ bản đồ
     const handleMapLocationSelect = (location) => {
          // Cập nhật bộ lọc dựa trên vị trí được chọn từ bản đồ
          if (location.field) {
               // location.field là complex, lọc các sân thuộc complex này
               const complexId = location.field.complexId || location.field.id;
               if (complexId) {
                    setSelectedComplexId(Number(complexId));
                    // Reset các bộ lọc khác để hiển thị tất cả sân của complex
                    setSearchQuery("");
                    setSelectedLocation("");
                    setSelectedPrice("");
                    setSelectedRating("");
                    setActiveTab("all");
                    setTypeTab("all");
                    setPage(1);
                    setForceList(true);
                    return;
               }
               // Fallback: tìm theo địa chỉ hoặc quận/huyện
               const address = location.field.address || location.address || "";
               const district = location.field.district || "";
               if (district) {
                    setSelectedLocation(district.trim());
               } else if (address) {
                    const locationParts = address.split(',');
                    const districtPart = locationParts.find(part =>
                         part.includes('Quận') || part.includes('Huyện') || part.includes('Thị xã')
                    );
                    if (districtPart) {
                         setSelectedLocation(districtPart.trim());
                    }
               }
               setSearchQuery("");
          } else {
               const locationParts = (location.address || "").split(',');
               const district = locationParts.find(part =>
                    part.includes('Quận') || part.includes('Huyện') || part.includes('Thị xã')
               );
               if (district) {
                    setSelectedLocation(district.trim());
               }
          }
          setSelectedComplexId(null);
          setPage(1);
          setForceList(true);
     };

     const formatPrice = (price) => {
          return new Intl.NumberFormat('vi-VN', {
               style: 'currency',
               currency: 'VND'
          }).format(price);
     };

     // phân trang sân nhỏ
     const totalItems = filteredFields.length;
     const totalPages = Math.max(1, Math.ceil(totalItems / fieldPageSize));
     const currentPage = Math.min(page, totalPages);
     const startIdx = (currentPage - 1) * fieldPageSize;
     const endIdx = startIdx + fieldPageSize;
     const pageItems = filteredFields.slice(startIdx, endIdx);

     // phân trang khu sân
     const totalComplex = complexes.length;
     const totalPagesComplex = Math.max(1, Math.ceil(totalComplex / complexPageSize));
     const currentPageComplex = Math.min(pageComplex, totalPagesComplex);
     const startIdxComplex = (currentPageComplex - 1) * complexPageSize;
     const endIdxComplex = startIdxComplex + complexPageSize;
     const pageItemsComplex = complexes.slice(startIdxComplex, endIdxComplex);

     // chuyenr trang
     const handlePrev = () => { setForceList(true); setPage(prev => Math.max(1, prev - 1)); };
     const handleNext = () => { setForceList(true); setPage(prev => Math.min(totalPages, prev + 1)); };
     const handlePrevComplex = () => { setForceList(true); setPageComplex(prev => Math.max(1, prev - 1)); };
     const handleNextComplex = () => { setForceList(true); setPageComplex(prev => Math.min(totalPagesComplex, prev + 1)); };

     const quickPresets = [
          { key: "near", label: "Gần bạn" },
          { key: "best-price", label: "Giá tốt" },
          { key: "top-rated", label: "Đánh giá cao" },
     ];

     const isNoFilter = !searchQuery && !selectedLocation && !selectedPrice && !selectedRating && !selectedComplexId;  //không lọc
     const isGroupedView = activeTab === "all" && isNoFilter && !forceList && entityTab === "fields";

     // Lấy tên complex đang được lọc
     const selectedComplexName = useMemo(() => {
          if (!selectedComplexId) return null;
          const complex = complexes.find(c => Number(c.complexId) === selectedComplexId);
          return complex?.name || `Khu sân #${selectedComplexId}`;
     }, [selectedComplexId, complexes]);

     // Điều khiển chế độ hiển thị danh sách hoặc lưới dựa trên bộ lọc
     useEffect(() => {
          const hasAny = !!searchQuery || !!selectedLocation || !!selectedPrice || !!selectedRating || sortBy !== "relevance";
          const nextForceList = hasAny || activeTab !== "all";
          setForceList((prev) => (prev === nextForceList ? prev : nextForceList));
     }, [searchQuery, selectedLocation, selectedPrice, selectedRating, sortBy, activeTab]);

     // cập nhật chế độ hiển thị
     const updateViewMode = (mode) => {
          setViewMode(mode);
          if (mode === "grid") {
               const noFilter = !searchQuery && !selectedLocation && !selectedPrice && !selectedRating && sortBy === "relevance" && activeTab === "all";
               setForceList((prev) => (prev === !noFilter ? prev : !noFilter));
          } else {
               setForceList((prev) => (prev === true ? prev : true));
          }
     };

     // lấy vị trí người dùng
     useEffect(() => {
          let cancelled = false;
          const fallbackLat = 21.0285; // Hà Nội
          const fallbackLng = 105.8542;
          if (navigator.geolocation) {
               navigator.geolocation.getCurrentPosition(
                    pos => {
                         if (!cancelled) setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    },
                    () => {
                         if (!cancelled) setUserLocation({ lat: fallbackLat, lng: fallbackLng });
                    },
                    { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }
               );
          } else {
               if (!cancelled) setUserLocation({ lat: fallbackLat, lng: fallbackLng });
          }
          return () => { cancelled = true; };
     }, []);



     // Lấy 4 khu sân gần nhất có toạ độ
     const nearGroup = [...complexes]
          .filter(c => {
               const lat = c.lat ?? c.latitude;
               const lng = c.lng ?? c.longitude;
               return typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng);
          })
          .sort((a, b) => {
               const distA = typeof a.distanceKm === "number" && !isNaN(a.distanceKm) ? a.distanceKm : Infinity;
               const distB = typeof b.distanceKm === "number" && !isNaN(b.distanceKm) ? b.distanceKm : Infinity;
               return distA - distB;
          })
          .slice(0, 4);

     const bestPriceGroup = [...filteredFields].sort((a, b) => (a.priceForSelectedSlot || 0) - (b.priceForSelectedSlot || 0)).slice(0, 4);
     const topRatedGroup = [...filteredFields].sort((a, b) => b.rating - a.rating).slice(0, 4);

     return (
          <Section className="min-h-screen bg-[url('https://mixivivu.com/section-background.png')] bg-cover bg-center">
               <motion.div
                    ref={heroRef}
                    className="py-32 mx-5 md:py-44 bg-[url('https://i.pinimg.com/originals/a3/c7/79/a3c779e5d5b622eeb598ac1d50c05cb8.png')] bg-cover bg-center rounded-b-3xl overflow-hidden relative"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
               >
                    <div className="absolute inset-0 pointer-events-none">
                         {[...Array(15)].map((_, i) => (
                              <motion.div
                                   key={i}
                                   className="absolute w-1 h-1 bg-white/30 rounded-full"
                                   style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`,
                                   }}
                                   animate={{
                                        y: [0, -30, 0],
                                        x: [0, Math.random() * 20 - 10, 0],
                                        opacity: [0.3, 0.6, 0.3],
                                   }}
                                   transition={{
                                        duration: 3 + Math.random() * 2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: i * 0.2,
                                   }}
                              />
                         ))}
                    </div>

                    <Container className="py-12 relative z-10">
                         <motion.div
                              className="text-center text-white"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2, duration: 0.6 }}
                         >
                              <motion.h1
                                   className="text-4xl md:text-5xl font-extrabold tracking-tight"
                                   animate={{
                                        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                                   }}
                                   transition={{
                                        duration: 5,
                                        repeat: Infinity,
                                        ease: "linear",
                                   }}
                                   style={{
                                        backgroundImage: "linear-gradient(90deg, #fff, #14b8a6, #fff)",
                                        backgroundSize: "200% 100%",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                   }}
                              >
                                   Tìm sân bóng phù hợp trong vài giây
                              </motion.h1>
                              <motion.p
                                   className="mt-2 opacity-90 text-xl"
                                   initial={{ opacity: 0 }}
                                   animate={{ opacity: 0.9 }}
                                   transition={{ delay: 0.4, duration: 0.6 }}
                              >
                                   Lọc theo khu vực, giá, đánh giá và đặt sân ngay
                              </motion.p>
                         </motion.div>
                    </Container>
               </motion.div>
               <Container className="-mt-32 md:-mt-36 px-5 py-2 relative z-10 mb-20" >
                    {/* Search Header với Animation */}
                    <motion.div
                         initial={{ opacity: 0, y: 30 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: 0.3, duration: 0.6 }}
                    >
                         <motion.div
                              animate={{
                                   boxShadow: [
                                        "0 10px 40px rgba(20, 184, 166, 0.1)",
                                        "0 10px 40px rgba(20, 184, 166, 0.2)",
                                        "0 10px 40px rgba(20, 184, 166, 0.1)",
                                   ],
                              }}
                              transition={{
                                   duration: 3,
                                   repeat: Infinity,
                                   ease: "easeInOut",
                              }}
                         >
                              <Card className="mb-4 border p-1 bg-white/80 backdrop-blur rounded-[30px] shadow-xl ring-1 ring-teal-100 border-teal-200">
                                   <CardContent>
                                        {/* Tìm kiếm */}
                                        <SearchHeader
                                             entityTab={entityTab}
                                             setEntityTab={setEntityTab}
                                             resultCount={entityTab === "complexes" ? complexes.length : filteredFields.length}
                                             user={user}
                                        />

                                        {/* thanh bộ lọc */}
                                        <SearchFiltersBar
                                             searchQuery={searchQuery}
                                             setSearchQuery={setSearchQuery}
                                             selectedLocation={selectedLocation}
                                             handleLocationChange={handleLocationChange}
                                             getLocationValue={getLocationValue}
                                             districtOptions={districtOptions}
                                             selectedPrice={selectedPrice}
                                             handlePriceChange={handlePriceChange}
                                             getPriceValue={getPriceValue}
                                             showFilters={showFilters}
                                             setShowFilters={setShowFilters}
                                             setShowMapSearch={setShowMapSearch}
                                             onResetFilters={() => {
                                                  setSearchQuery("");
                                                  setSelectedLocation("");
                                                  setSelectedPrice("");
                                                  setSelectedRating("");
                                                  setActiveTab("all");
                                                  setSortBy("relevance");
                                                  setPage(1);
                                                  setForceList(false);
                                                  setEntityTab("fields");
                                                  setDate("");
                                                  setSlotId("");
                                                  setSelectedComplexId(null);
                                                  setMapSearchKey(prev => prev + 1);
                                             }}
                                        />

                                        {/* Bộ lọc nâng cao và Quick Presets */}
                                        <QuickPresets
                                             quickPresets={quickPresets}
                                             activeTab={activeTab}
                                             setActiveTab={setActiveTab}
                                             typeTab={typeTab}
                                             setTypeTab={setTypeTab}
                                             setPage={setPage}
                                        />

                                        {/** Gợi ý bộ lọc */}
                                        <AdvancedFilters
                                             showFilters={showFilters}
                                             setShowFilters={setShowFilters}
                                             date={date}
                                             setDate={setDate}
                                             slotId={slotId}
                                             setSlotId={setSlotId}
                                             getSlotValue={getSlotValue}
                                             timeSlots={timeSlots}
                                             selectedRating={selectedRating}
                                             handleRatingChange={handleRatingChange}
                                             getRatingValue={getRatingValue}
                                             sortBy={sortBy}
                                             setSortBy={setSortBy}
                                             searchQuery={searchQuery}
                                             selectedLocation={selectedLocation}
                                             selectedPrice={selectedPrice}
                                             onResetAdvancedFilters={() => {
                                                  setSelectedRating("");
                                                  setSortBy("relevance");
                                                  setDate("");
                                                  setSlotId("");
                                             }}
                                        />
                                   </CardContent>
                              </Card>
                         </motion.div>
                    </motion.div>

                    {/* kết quả tiêu đề với hiệu ứng */}
                    <ScrollReveal direction="left" delay={0.1}>
                         <ResultsHeader
                              entityTab={entityTab}
                              complexesCount={complexes.length}
                              filteredFieldsCount={filteredFields.length}
                              activeTab={activeTab}
                              viewMode={viewMode}
                              updateViewMode={updateViewMode}
                         />
                    </ScrollReveal>

                    {/* Hiển thị khi đang lọc theo khu sân từ bản đồ */}
                    {selectedComplexId && selectedComplexName && (
                         <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mb-4 flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-xl px-4 py-2"
                         >
                              <MapPin className="w-4 h-4 text-teal-600" />
                              <span className="text-teal-800 font-medium">
                                   Đang hiển thị sân của: <span className="font-bold">{selectedComplexName}</span>
                              </span>
                              <button
                                   onClick={() => setSelectedComplexId(null)}
                                   className="ml-auto text-teal-600 hover:text-teal-800 hover:bg-teal-100 rounded-full p-1 transition-colors"
                                   title="Xóa bộ lọc"
                              >
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                   </svg>
                              </button>
                         </motion.div>
                    )}

                    {/* Tải trạng thái */}
                    <AnimatePresence>
                         {isLoading && (
                              <motion.div
                                   initial={{ opacity: 0 }}
                                   animate={{ opacity: 1 }}
                                   exit={{ opacity: 0 }}
                                   transition={{ duration: 0.3 }}
                              >
                                   <LoadingState />
                              </motion.div>
                         )}
                    </AnimatePresence>

                    {/* Results với View Mode Transition */}
                    <AnimatePresence mode="wait">
                         {!isLoading && entityTab === "complexes" ? (
                              <motion.div
                                   key={`complexes-${viewMode}`}
                                   initial={{ opacity: 0, scale: 0.95 }}
                                   animate={{ opacity: 1, scale: 1 }}
                                   exit={{ opacity: 0, scale: 0.95 }}
                                   transition={{ duration: 0.4 }}
                              >
                                   {viewMode === "grid" ? (
                                        <StaggerContainer staggerDelay={50} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 items-stretch">
                                             {pageItemsComplex.map((c, index) => (
                                                  <ComplexCard
                                                       key={c.complexId}
                                                       complex={c}
                                                       index={index}
                                                       navigate={navigate}
                                                       formatPrice={formatPrice}
                                                  />
                                             ))}
                                        </StaggerContainer>
                                   ) : (
                                        <motion.div
                                             className="space-y-4"
                                             initial={{ opacity: 0, y: 20 }}
                                             animate={{ opacity: 1, y: 0 }}
                                             transition={{ delay: 0.2 }}
                                        >
                                             {pageItemsComplex.map((c, index) => (
                                                  <motion.div
                                                       key={c.complexId}
                                                       initial={{ opacity: 0, x: -20 }}
                                                       animate={{ opacity: 1, x: 0 }}
                                                       transition={{ delay: index * 0.05 }}
                                                  >
                                                       <ComplexListItem
                                                            complex={c}
                                                            index={index}
                                                            navigate={navigate}
                                                            formatPrice={formatPrice}
                                                       />
                                                  </motion.div>
                                             ))}
                                        </motion.div>
                                   )}
                              </motion.div>
                         ) : !isLoading && isGroupedView ? (
                              <motion.div
                                   className="space-y-6"
                                   key="grouped"
                              >
                                   {/* Gần bạn */}
                                   <ScrollReveal direction="up" delay={0.1}>
                                        <GroupedViewSection
                                             title="Gần bạn"
                                             icon={MapPin}
                                             iconColor="text-teal-800"
                                             bgColor="bg-teal-50"
                                             borderColor="border-teal-300"
                                             items={nearGroup}
                                             type="complex"
                                             navigate={navigate}
                                             formatPrice={formatPrice}
                                             user={user}
                                             handleLoginRequired={(msg) => showToastMessage(msg, 'warning')}
                                             handleViewAll={() => { setActiveTab("near"); setForceList(true); setPage(1); setEntityTab("complexes"); }}
                                             showDistance={true}
                                        />
                                   </ScrollReveal>

                                   {/* Giá tốt */}
                                   <ScrollReveal direction="up" delay={0.2}>
                                        <GroupedViewSection
                                             title="Giá tốt nhất"
                                             icon={Star}
                                             iconColor="text-red-700"
                                             bgColor="bg-red-50"
                                             borderColor="border-red-300"
                                             items={bestPriceGroup}
                                             type="field"
                                             navigate={navigate}
                                             formatPrice={formatPrice}
                                             handleBook={handleBook}
                                             slotId={slotId}
                                             user={user}
                                             handleLoginRequired={(msg) => showToastMessage(msg, 'warning')}
                                             onToggleFavoriteField={handleToggleFavorite}
                                             handleViewAll={() => { setActiveTab("best-price"); setForceList(true); setPage(1); }}
                                             delay={300}
                                        />
                                   </ScrollReveal>

                                   {/*Đánh giá cao */}
                                   <ScrollReveal direction="up" delay={0.3}>
                                        <GroupedViewSection
                                             title="Đánh giá cao"
                                             icon={Star}
                                             iconColor="text-yellow-700"
                                             bgColor="bg-yellow-50"
                                             borderColor="border-yellow-300"
                                             items={topRatedGroup}
                                             type="field"
                                             navigate={navigate}
                                             formatPrice={formatPrice}
                                             handleBook={handleBook}
                                             slotId={slotId}
                                             user={user}
                                             handleLoginRequired={(msg) => showToastMessage(msg, 'warning')}
                                             onToggleFavoriteField={handleToggleFavorite}
                                             handleViewAll={() => { setActiveTab("top-rated"); setForceList(true); setPage(1); }}
                                             delay={500}
                                        />
                                   </ScrollReveal>
                              </motion.div>
                         ) : !isLoading && viewMode === "grid" ? (
                              <motion.div
                                   key={`fields-grid`}
                                   initial={{ opacity: 0, scale: 0.95 }}
                                   animate={{ opacity: 1, scale: 1 }}
                                   exit={{ opacity: 0, scale: 0.95 }}
                                   transition={{ duration: 0.4 }}
                              >
                                   <StaggerContainer staggerDelay={50} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                                        {pageItems.map((field, index) => (
                                             <FieldCard
                                                  key={field.fieldId}
                                                  field={field}
                                                  index={index}
                                                  activeTab={activeTab}
                                                  slotId={slotId}
                                                  formatPrice={formatPrice}
                                                  handleToggleFavorite={handleToggleFavorite}
                                                  handleBook={handleBook}
                                                  navigate={navigate}
                                             />
                                        ))}
                                   </StaggerContainer>
                              </motion.div>
                         ) : !isLoading ? (
                              <motion.div
                                   className="space-y-4"
                                   key={`fields-list`}
                                   initial={{ opacity: 0, y: 20 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   exit={{ opacity: 0, y: -20 }}
                                   transition={{ duration: 0.4 }}
                              >
                                   {pageItems.map((field, index) => (
                                        <motion.div
                                             key={field.fieldId}
                                             initial={{ opacity: 0, x: -20 }}
                                             animate={{ opacity: 1, x: 0 }}
                                             transition={{ delay: index * 0.05 }}
                                        >
                                             <FieldListItem
                                                  field={field}
                                                  index={index}
                                                  slotId={slotId}
                                                  formatPrice={formatPrice}
                                                  handleToggleFavorite={handleToggleFavorite}
                                                  handleBook={handleBook}
                                                  navigate={navigate}
                                                  user={user}
                                                  handleLoginRequired={(msg) => showToastMessage(msg, 'warning')}
                                             />
                                        </motion.div>
                                   ))}
                              </motion.div>
                         ) : null}
                    </AnimatePresence>

                    {/* Phân trang cho khu sân */}
                    {totalComplex > 0 && entityTab === "complexes" && (
                         <ScrollReveal direction="up" delay={0.1}>
                              <Pagination
                                   currentPage={currentPageComplex}
                                   totalPages={totalPagesComplex}
                                   onPrev={handlePrevComplex}
                                   onNext={handleNextComplex}
                                   onPageChange={setPageComplex}
                                   totalItems={totalComplex}
                                   startIdx={startIdxComplex}
                                   endIdx={endIdxComplex}
                              />
                         </ScrollReveal>
                    )}

                    {/* phân trang cho sân nhỏ khi ở dạng "list" */}
                    {entityTab === "fields" && filteredFields.length > 0 && !isGroupedView && (
                         <ScrollReveal direction="up" delay={0.1}>
                              <Pagination
                                   currentPage={currentPage}
                                   totalPages={totalPages}
                                   onPrev={handlePrev}
                                   onNext={handleNext}
                                   onPageChange={setPage}
                                   totalItems={totalItems}
                                   startIdx={startIdx}
                                   endIdx={endIdx}
                              />
                         </ScrollReveal>
                    )}

                    {!isLoading && filteredFields.length === 0 && (
                         <ScrollReveal direction="up" delay={0.1}>
                              <EmptyState
                                   onReset={() => {
                                        setSearchQuery("");
                                        setSelectedLocation("");
                                        setSelectedPrice("");
                                        setSelectedRating("");
                                        setActiveTab("all");
                                        setViewMode("grid");
                                        setPage(1);
                                        setForceList(false);
                                        setMapSearchKey(prev => prev + 1);
                                   }}
                              />
                         </ScrollReveal>
                    )}

               </Container>

               {/* Tìm kiếm trên bản đồ */}
               <MapSearch
                    key={mapSearchKey}
                    isOpen={showMapSearch}
                    onClose={() => setShowMapSearch(false)}
                    onLocationSelect={handleMapLocationSelect}
               />
          </Section >
     );
}
