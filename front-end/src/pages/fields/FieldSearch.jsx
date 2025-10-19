import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Star, Clock, Grid, List, Heart, SlidersHorizontal, ChevronLeft, ChevronRight, Sparkles, User, Map, RefreshCcw, CircleDollarSign, EyeIcon } from "lucide-react";
import { Section, Container, Card, CardContent, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button, DatePicker } from "../../components/ui/index.js";
import { Link, useNavigate } from "react-router-dom";
import MapSearch from "./components/MapSearch";
import { fetchComplexes, fetchFields, fetchTimeSlots } from "../../services/fields";
export default function FieldSearch({ user }) {
     const navigate = useNavigate();
     const [entityTab, setEntityTab] = useState("fields"); // complexes | fields
     const [searchQuery, setSearchQuery] = useState("");
     const [selectedLocation, setSelectedLocation] = useState("all");
     const [selectedPrice, setSelectedPrice] = useState("all");
     const [selectedRating, setSelectedRating] = useState("all");
     const [viewMode, setViewMode] = useState("grid"); // grid or list
     const [showFilters, setShowFilters] = useState(false);
     const [sortBy, setSortBy] = useState("relevance");
     const [activeTab, setActiveTab] = useState("all"); // all | near | best-price | top-rated | favorites
     const [typeTab, setTypeTab] = useState("all"); // all | 5vs5 | 7vs7 | 11vs11
     const [page, setPage] = useState(1);
     const [pageComplex, setPageComplex] = useState(1);
     const fieldPageSize = 12;    // sân nhỏ
     const complexPageSize = 9;   // khu sân
     const [forceList, setForceList] = useState(false);
     const [showMapSearch, setShowMapSearch] = useState(false);
     // removed unused mapLocation state
     const [mapSearchKey, setMapSearchKey] = useState(0); // Key to force MapSearch reset
     const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
     const [slotId, setSlotId] = useState("");
     const [timeSlots, setTimeSlots] = useState([]);

     // Helper functions to convert between "all" and empty string
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

     const [fields, setFields] = useState([]);
     const [complexes, setComplexes] = useState([]);
     const [filteredFields, setFilteredFields] = useState([]);
     const [isLoading, setIsLoading] = useState(false);

     const didInitRef = useRef(false);

     // Run only once on mount to decide initial state based on presets or defaults
     useEffect(() => {
          if (didInitRef.current) return;
          didInitRef.current = true;
          try {
               const raw = window.localStorage.getItem("searchPreset");
               if (raw) {
                    const preset = JSON.parse(raw);
                    if (preset.searchQuery !== undefined) setSearchQuery(preset.searchQuery);
                    if (preset.selectedLocation !== undefined) setSelectedLocation(preset.selectedLocation);
                    if (preset.selectedPrice !== undefined) setSelectedPrice(preset.selectedPrice);
                    if (preset.selectedRating !== undefined) setSelectedRating(preset.selectedRating);
                    if (preset.sortBy !== undefined) setSortBy(preset.sortBy);
                    window.localStorage.removeItem("searchPreset");
                    setForceList(true);
               } else {
                    setSearchQuery("");
                    setSelectedLocation("");
                    setSelectedPrice("");
                    setSelectedRating("");
                    setSortBy("relevance");
                    setActiveTab("all");
                    setViewMode("grid");
                    setPage(1);
                    setForceList(false);
               }

               // Load persisted preferences
               const saved = window.localStorage.getItem("fieldSearchPrefs");
               if (saved) {
                    const prefs = JSON.parse(saved);
                    if (prefs.viewMode) setViewMode(prefs.viewMode);
                    if (prefs.activeTab) setActiveTab(prefs.activeTab);
                    if (prefs.page) setPage(prefs.page);
                    if (prefs.entityTab) setEntityTab(prefs.entityTab);
                    if (prefs.date) setDate(prefs.date);
                    if (prefs.slotId) setSlotId(prefs.slotId);
                    if (prefs.typeTab) setTypeTab(prefs.typeTab);
               }
          } catch { }
     }, []);

     // Load time slots once
     useEffect(() => {
          let mounted = true;
          fetchTimeSlots().then((slots) => {
               if (!mounted) return;
               setTimeSlots(slots);
          });
          return () => { mounted = false; };
     }, []);

     // Load data whenever key filters change (fetch both complexes and fields to support grouped view)
     useEffect(() => {
          let ignore = false;
          async function load() {
               try {
                    setIsLoading(true);
                    const [cList, fList] = await Promise.all([
                         fetchComplexes({ query: searchQuery, date, slotId }),
                         fetchFields({ query: searchQuery, date, slotId, sortBy })
                    ]);
                    if (!ignore) {
                         setComplexes(cList);
                         setFields(fList);
                    }
               } catch (error) {
                    console.error("Error loading data:", error);
                    if (!ignore) {
                         setComplexes([]);
                         setFields([]);
                    }
               } finally {
                    if (!ignore) {
                         setIsLoading(false);
                    }
               }
          }
          load();
          return () => { ignore = true; };
     }, [searchQuery, date, slotId, sortBy]);

     useEffect(() => {
          let filtered = fields;

          // Filter by search query
          if (searchQuery) {
               filtered = filtered.filter(field =>
                    field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (field.address || "").toLowerCase().includes(searchQuery.toLowerCase())
               );
          }

          // Filter by location
          if (selectedLocation) {
               filtered = filtered.filter(field => (field.address || "").includes(selectedLocation));
          }

          // Filter by field type via tabs
          if (typeTab !== "all") {
               filtered = filtered.filter(field => (field.typeName || "").toLowerCase() === typeTab.toLowerCase());
          }

          // Filter by price
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

          // Filter by rating
          if (selectedRating) {
               const minRating = parseFloat(selectedRating);
               filtered = filtered.filter(field => field.rating >= minRating);
          }

          // Sort
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
                    // relevance - keep original order
                    break;
          }

          // Apply tab presets (computed filtering helper)
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

          setFilteredFields(filtered);

          // Reset trang chỉ khi thực sự là thay đổi filter, không reset khi chỉ chuyển trang
     }, [searchQuery, selectedLocation, selectedPrice, selectedRating, sortBy, activeTab, typeTab, fields]);

     // Persist preferences
     useEffect(() => {
          try {
               const prefs = { viewMode, activeTab, page, entityTab, date, slotId, typeTab };
               window.localStorage.setItem("fieldSearchPrefs", JSON.stringify(prefs));
          } catch { }
     }, [viewMode, activeTab, page, entityTab, date, slotId, typeTab]);

     const toggleFavorite = (fieldId) => {
          setFields(prev => prev.map(field =>
               field.fieldId === fieldId ? { ...field, isFavorite: !field.isFavorite } : field
          ));
     };

     const handleToggleFavorite = (fieldId) => {
          if (!user) {
               navigate("/auth", { state: { msg: "Vui lòng đăng nhập để sử dụng danh sách yêu thích." } });
               return;
          }
          toggleFavorite(fieldId);
     };

     const handleBook = (fieldId) => {
          if (!user) {
               navigate("/auth", { state: { msg: "Bạn cần đăng nhập để đặt sân." } });
               return;
          }
          navigate(`/booking/${fieldId}`);
     };

     const handleMapLocationSelect = (location) => {
          // Apply location filter based on selected map location
          if (location.field) {
               // If a specific field was selected, filter to show only that field
               setSearchQuery(location.field.name);
               setSelectedLocation("");
          } else {
               // If a general location was selected, filter by area
               const locationParts = location.address.split(',');
               const district = locationParts.find(part => part.includes('Quận'));
               if (district) {
                    setSelectedLocation(district.trim());
               }
          }

          // Reset to first page when applying new filter
          setPage(1);
          setForceList(true);
     };

     const formatPrice = (price) => {
          return new Intl.NumberFormat('vi-VN', {
               style: 'currency',
               currency: 'VND'
          }).format(price);
     };

     // Pagination helpers
     // Fields pagination (sân nhỏ)
     const totalItems = filteredFields.length;
     const totalPages = Math.max(1, Math.ceil(totalItems / fieldPageSize));
     const currentPage = Math.min(page, totalPages);
     const startIdx = (currentPage - 1) * fieldPageSize;
     const endIdx = startIdx + fieldPageSize;
     const pageItems = filteredFields.slice(startIdx, endIdx);

     // Complexes pagination (khu sân)
     const totalComplex = complexes.length;
     const totalPagesComplex = Math.max(1, Math.ceil(totalComplex / complexPageSize));
     const currentPageComplex = Math.min(pageComplex, totalPagesComplex);
     const startIdxComplex = (currentPageComplex - 1) * complexPageSize;
     const endIdxComplex = startIdxComplex + complexPageSize;
     const pageItemsComplex = complexes.slice(startIdxComplex, endIdxComplex);

     const handlePrev = () => { setForceList(true); setPage(prev => Math.max(1, prev - 1)); };
     const handleNext = () => { setForceList(true); setPage(prev => Math.min(totalPages, prev + 1)); };
     const handlePrevComplex = () => { setForceList(true); setPageComplex(prev => Math.max(1, prev - 1)); };
     const handleNextComplex = () => { setForceList(true); setPageComplex(prev => Math.min(totalPagesComplex, prev + 1)); };

     const quickPresets = [
          { key: "near", label: "Gần bạn" },
          { key: "best-price", label: "Giá tốt" },
          { key: "top-rated", label: "Đánh giá cao" },
     ];

     const isNoFilter = !searchQuery && !selectedLocation && !selectedPrice && !selectedRating;
     const isGroupedView = activeTab === "all" && isNoFilter && !forceList && entityTab === "fields";

     // Flip to list view whenever user adjusts any filter/search/sort or tab is not "all"
     useEffect(() => {
          const hasAny = !!searchQuery || !!selectedLocation || !!selectedPrice || !!selectedRating || sortBy !== "relevance";
          setForceList(hasAny || activeTab !== "all");
     }, [searchQuery, selectedLocation, selectedPrice, selectedRating, sortBy, activeTab]);

     const updateViewMode = (mode) => {
          setViewMode(mode);
          if (mode === "grid") {
               const noFilter = !searchQuery && !selectedLocation && !selectedPrice && !selectedRating && sortBy === "relevance" && activeTab === "all";
               setForceList(!noFilter);
          } else {
               setForceList(true);
          }
     };

     // Compute user distance for complexes (using geolocation if available) and propagate to fields
     useEffect(() => {
          let cancelled = false;
          function haversineKm(lat1, lng1, lat2, lng2) {
               const R = 6371;
               const dLat = (lat2 - lat1) * Math.PI / 180;
               const dLng = (lng2 - lng1) * Math.PI / 180;
               const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
               const d = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
               return R * d;
          }
          function updateDistances(lat, lng) {
               setComplexes(prev => prev.map(c => (typeof c.lat === "number" && typeof c.lng === "number") ? { ...c, distanceKm: haversineKm(lat, lng, c.lat, c.lng) } : c));
               setFields(prev => prev.map(f => {
                    const cx = complexes.find(cc => cc.complexId === f.complexId);
                    return cx && typeof cx.lat === "number" && typeof cx.lng === "number" ? { ...f, distanceKm: haversineKm(lat, lng, cx.lat, cx.lng) } : f;
               }));
          }
          const fallbackLat = 21.0285; // Hà Nội center
          const fallbackLng = 105.8542;
          if (navigator.geolocation) {
               navigator.geolocation.getCurrentPosition(
                    pos => { if (!cancelled) updateDistances(pos.coords.latitude, pos.coords.longitude); },
                    () => { if (!cancelled) updateDistances(fallbackLat, fallbackLng); },
                    { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }
               );
          } else {
               if (!cancelled) updateDistances(fallbackLat, fallbackLng);
          }
          return () => { cancelled = true; };
     }, [complexes]);

     // const nearGroup = [...filteredFields].sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0)).slice(0, 4);
     const bestPriceGroup = [...filteredFields].sort((a, b) => (a.priceForSelectedSlot || 0) - (b.priceForSelectedSlot || 0)).slice(0, 4);
     const topRatedGroup = [...filteredFields].sort((a, b) => b.rating - a.rating).slice(0, 4);

     return (
          <Section className="min-h-screen bg-[url('https://mixivivu.com/section-background.png')] bg-cover bg-center">
               <div className="py-32 mx-5 md:py-44 bg-[url('https://i.pinimg.com/originals/a3/c7/79/a3c779e5d5b622eeb598ac1d50c05cb8.png')] bg-cover bg-center rounded-b-3xl overflow-hidden">
                    <Container className="py-12">
                         <div className="text-center text-white">
                              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Tìm sân bóng phù hợp trong vài giây</h1>
                              <p className="mt-2 opacity-90">Lọc theo khu vực, giá, đánh giá và đặt sân ngay</p>
                         </div>
                    </Container>
               </div>
               <Container className="-mt-32 md:-mt-36 px-5 py-2 relative z-10 mb-20" >
                    {/* Search Header */}
                    <Card className="mb-4 border p-1 bg-white/80 backdrop-blur rounded-[30px] shadow-xl ring-1 ring-teal-100 border-teal-200"><CardContent>
                         {/* SaaS-style header */}
                         <div className="pt-4">
                              <div className="flex items-center justify-between">
                                   <div>
                                        <h1 className="text-2xl font-bold text-teal-800">Danh sách sân</h1>
                                        <div className="mt-1 h-1.5 w-24 bg-gradient-to-r from-teal-500 via-emerald-400 to-transparent rounded-full" />
                                        <p className="text-teal-700 font-semibold mt-2">Dành cho {user ? "người dùng đã đăng nhập" : "khách truy cập"}</p>
                                   </div>
                                   <div className="hidden md:flex items-center gap-2">
                                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 shadow-sm">
                                             {entityTab === "complexes" ? complexes.length : filteredFields.length} kết quả
                                        </span>
                                   </div>
                              </div>
                         </div>
                         <div className="lg:w-64 pt-4 mb-4">
                              <div className="inline-flex rounded-xl overflow-hidden border border-teal-200 bg-white/80">
                                   <Button
                                        type="button"
                                        onClick={() => setEntityTab("fields")}
                                        variant={entityTab === "fields" ? "default" : "outline"}
                                        className={`${entityTab === "fields" ? "bg-teal-500 text-white hover:bg-teal-600" : "border-0 text-teal-700 hover:bg-teal-50"} rounded-none px-4 py-2 text-sm font-medium`}
                                   >
                                        Sân nhỏ
                                   </Button>
                                   <Button
                                        type="button"
                                        onClick={() => setEntityTab("complexes")}
                                        variant={entityTab === "complexes" ? "default" : "outline"}
                                        className={`${entityTab === "complexes" ? "bg-teal-500 text-white hover:bg-teal-600" : "border-l border-teal-200 text-teal-700 hover:bg-teal-50"} rounded-none px-4 py-2 text-sm font-medium`}
                                   >
                                        Khu vực
                                   </Button>
                              </div>
                         </div>
                         <div className="flex flex-col lg:flex-row gap-2 md:gap-4">
                              <div className="flex-1">
                                   <div className="relative">
                                        <Search color="teal" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none z-10" />
                                        <Input
                                             placeholder="Tìm kiếm sân bóng, địa điểm..."
                                             value={searchQuery}
                                             onChange={(e) => setSearchQuery(e.target.value)}
                                             className="pl-10 pr-10 border rounded-xl border-teal-300 focus-visible:border-teal-500 focus-visible:ring-0 focus-visible:outline-none"
                                        />
                                        {searchQuery && (
                                             <Button
                                                  onClick={() => setSearchQuery("")}
                                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0 h-auto bg-transparent border-0 hover:bg-transparent"
                                             >
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                  </svg>
                                             </Button>
                                        )}
                                   </div>
                              </div>

                              <div className="lg:w-48">
                                   <Select value={getLocationValue()} onValueChange={handleLocationChange}>
                                        <SelectTrigger className="border rounded-xl border-teal-300 focus-visible:border-teal-500 focus-visible:ring-0 bg-white/80">
                                             <SelectValue placeholder="Tất cả khu vực" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="all">Tất cả khu vực</SelectItem>
                                             <SelectItem value="Quận Hoàn Kiếm">Quận Hoàn Kiếm</SelectItem>
                                             <SelectItem value="Quận Ba Đình">Quận Ba Đình</SelectItem>
                                             <SelectItem value="Quận Đống Đa">Quận Đống Đa</SelectItem>
                                             <SelectItem value="Quận Cầu Giấy">Quận Cầu Giấy</SelectItem>
                                             <SelectItem value="Quận Hai Bà Trưng">Quận Hai Bà Trưng</SelectItem>
                                        </SelectContent>
                                   </Select>
                              </div>
                              <div className="lg:w-48">
                                   <Select value={getPriceValue()} onValueChange={handlePriceChange}>
                                        <SelectTrigger className="border rounded-xl border-teal-300 focus-visible:border-teal-500 focus-visible:ring-0 bg-white/80">
                                             <SelectValue placeholder="Mọi mức giá" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="all">Mọi mức giá</SelectItem>
                                             <SelectItem value="under100">Dưới 100k</SelectItem>
                                             <SelectItem value="100-200">100k - 200k</SelectItem>
                                             <SelectItem value="200-300">200k - 300k</SelectItem>
                                             <SelectItem value="over300">Trên 300k</SelectItem>
                                        </SelectContent>
                                   </Select>
                              </div>

                              <Button
                                   onClick={() => setShowFilters(!showFilters)}
                                   variant="outline"
                                   className="px-4 py-2 rounded-xl transition-all bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 flex items-center shadow-sm"
                              >
                                   <SlidersHorizontal className="w-5 h-5 mr-2" />
                                   Bộ lọc
                              </Button>
                              <Button
                                   onClick={() => setShowMapSearch(true)}
                                   className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold transition-colors flex items-center gap-2 shadow-sm"
                              >
                                   <Map className="w-4 h-4" />
                                   Tìm bằng bản đồ
                              </Button>
                              <Button
                                   onClick={() => {
                                        setSearchQuery("");
                                        setSelectedLocation("");
                                        setSelectedPrice("");
                                        setSelectedRating("");
                                        setActiveTab("all");
                                        setSortBy("relevance");
                                        setPage(1);

                                        setForceList(false);
                                        setEntityTab("fields");
                                        setDate(new Date().toISOString().split('T')[0]);
                                        setSlotId("");
                                        setMapSearchKey(prev => prev + 1); // Force MapSearch reset
                                        localStorage.removeItem('searchPreset');
                                   }}
                                   variant="outline"
                                   className="px-4 py-3 rounded-xl border border-red-200 text-red-700 hover:text-red-700 hover:bg-red-50"
                              >
                                   <RefreshCcw className="w-4 h-4" />
                              </Button>
                         </div>

                         {/* Quick presets */}
                         <div className="mt-4 flex flex-wrap gap-2 items-center">
                              {quickPresets.map(p => (
                                   <Button
                                        key={p.key}
                                        onClick={() => setActiveTab(p.key)}
                                        className={`px-2 h-8 rounded-full text-xs border ${activeTab === p.key ? "bg-teal-100 hover:bg-teal-100 text-teal-700 border-teal-200" : "bg-white text-teal-600 transition-all duration-200 border-gray-200 hover:bg-teal-600 hover:text-white hover:border-gray-300"}`}
                                   >
                                        <Sparkles className="w-3 h-3 inline mr-1" /> {p.label}
                                   </Button>
                              ))}

                              {/* Type tabs for viewing more small fields by type */}
                              <div className="ml-3 inline-flex rounded-full overflow-hidden border border-teal-200">
                                   {[
                                        { k: "all", l: "Tất cả" },
                                        { k: "5vs5", l: "5 người" },
                                        { k: "7vs7", l: "7 người" },

                                   ].map(t => (
                                        <Button
                                             key={t.k}
                                             type="button"
                                             onClick={() => { setTypeTab(t.k); setPage(1); }}
                                             className={`px-3 h-8 text-xs rounded-none ${typeTab === t.k ? "bg-teal-500 text-white" : "bg-white text-teal-700 hover:bg-teal-50"}`}
                                        >
                                             {t.l}
                                        </Button>
                                   ))}
                              </div>
                         </div>

                         {/* Advanced Filters */}
                         {showFilters && (
                              <div className="mt-4 pt-4 border-t border-teal-100">
                                   <div className="flex items-start justify-between gap-4">
                                        <div>
                                             <div className="flex items-center gap-2">
                                                  <SlidersHorizontal className="w-4 h-4 text-teal-600" />
                                                  <h2 className="text-base font-semibold text-teal-800">Bộ lọc nâng cao</h2>
                                             </div>
                                             <p className="text-xs text-gray-500 mt-1">Tinh chỉnh kết quả theo đánh giá và sắp xếp.</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                             <Button
                                                  onClick={() => {
                                                       setSelectedRating("");
                                                       setSortBy("relevance");
                                                       setDate(new Date().toISOString().split('T')[0]);
                                                       setSlotId("");
                                                  }}
                                                  variant="outline"
                                                  className="h-9 px-3 rounded-xl border border-teal-200 text-teal-700 hover:bg-teal-50"
                                             >
                                                  Đặt lại
                                             </Button>
                                             <Button
                                                  onClick={() => setShowFilters(false)}
                                                  className="h-9 px-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white"
                                             >
                                                  Áp dụng
                                             </Button>
                                        </div>
                                   </div>

                                   <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                             <label className="block text-sm font-medium text-teal-600 mb-2">Ngày</label>
                                             <DatePicker value={date} onChange={setDate} className="border border-teal-300 rounded-xl focus-visible:border-teal-500 focus-visible:ring-0" />
                                        </div>
                                        <div>
                                             <label className="block text-sm font-medium text-teal-600 mb-2">Slot</label>
                                             <Select value={getSlotValue()} onValueChange={(v) => setSlotId(v === "all" ? "" : v)}>
                                                  <SelectTrigger className="border border-teal-300 rounded-xl focus-visible:border-teal-500 focus-visible:ring-0 bg-white/80">
                                                       <SelectValue placeholder="Tất cả slot" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                       <SelectItem value="all">Tất cả slot</SelectItem>
                                                       {timeSlots.map((s) => (
                                                            <SelectItem key={s.slotId} value={String(s.slotId)}>{s.name}</SelectItem>
                                                       ))}
                                                  </SelectContent>
                                             </Select>
                                        </div>
                                        <div>
                                             <label className="block text-sm font-medium text-teal-600 mb-2">Đánh giá tối thiểu</label>
                                             <Select value={getRatingValue()} onValueChange={handleRatingChange}>
                                                  <SelectTrigger className="border border-teal-300 rounded-xl focus-visible:border-teal-500 focus-visible:ring-0">
                                                       <SelectValue placeholder="Tất cả" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                       <SelectItem value="all">Tất cả</SelectItem>
                                                       <SelectItem value="4.5">4.5+ sao</SelectItem>
                                                       <SelectItem value="4.0">4.0+ sao</SelectItem>
                                                       <SelectItem value="3.5">3.5+ sao</SelectItem>
                                                       <SelectItem value="3.0">3.0+ sao</SelectItem>
                                                  </SelectContent>
                                             </Select>
                                        </div>
                                        <div>
                                             <label className="block text-sm font-medium text-teal-600 mb-2">Sắp xếp theo</label>
                                             <Select value={sortBy} onValueChange={setSortBy}>
                                                  <SelectTrigger className="border border-teal-300 rounded-xl focus-visible:border-teal-500 focus-visible:ring-0">
                                                       <SelectValue placeholder="Liên quan" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                       <SelectItem value="relevance">Liên quan</SelectItem>
                                                       <SelectItem value="price-low">Giá thấp đến cao</SelectItem>
                                                       <SelectItem value="price-high">Giá cao đến thấp</SelectItem>
                                                       <SelectItem value="rating">Đánh giá cao</SelectItem>
                                                       <SelectItem value="distance">Khoảng cách gần</SelectItem>
                                                  </SelectContent>
                                             </Select>
                                        </div>
                                        <div className="md:col-span-4">
                                             <label className="block text-sm font-medium text-teal-600 mb-2">Đang chọn</label>
                                             <div className="flex flex-wrap gap-2">
                                                  {searchQuery && (
                                                       <span className="px-2 py-1 rounded-full text-xs bg-teal-50 text-teal-700 border border-teal-200">Từ khóa: {searchQuery}</span>
                                                  )}
                                                  {selectedLocation && (
                                                       <span className="px-2 py-1 rounded-full text-xs bg-teal-50 text-teal-700 border border-teal-200">Khu vực</span>
                                                  )}
                                                  {date && (
                                                       <span className="px-2 py-1 rounded-full text-xs bg-teal-50 text-teal-700 border border-teal-200">Ngày: {date}</span>
                                                  )}
                                                  {slotId && (
                                                       <span className="px-2 py-1 rounded-full text-xs bg-teal-50 text-teal-700 border border-teal-200">Slot: {timeSlots.find(s => String(s.slotId) === String(slotId))?.name}</span>
                                                  )}
                                                  {selectedPrice && (
                                                       <span className="px-2 py-1 rounded-full text-xs bg-teal-50 text-teal-700 border border-teal-200">Giá</span>
                                                  )}
                                                  {selectedRating && selectedRating !== "all" && (
                                                       <span className="px-2 py-1 rounded-full text-xs bg-teal-50 text-teal-700 border border-teal-200">Đánh giá {selectedRating}+</span>
                                                  )}
                                                  {!searchQuery && !selectedLocation && !selectedPrice && (!selectedRating || selectedRating === "all") && !slotId && (
                                                       <span className="text-xs text-gray-500">Chưa có bộ lọc nào được chọn</span>
                                                  )}
                                             </div>
                                        </div>
                                   </div>
                              </div>
                         )}

                    </CardContent></Card>

                    {/* Results Header */}
                    <div className="flex justify-between items-center mb-5">
                         <div>
                              <h1 className="text-2xl font-bold text-teal-800">
                                   {(() => {
                                        const count = entityTab === "complexes" ? complexes.length : filteredFields.length;
                                        const noun = entityTab === "complexes" ? "khu sân" : "sân bóng";
                                        const filterLabel = activeTab === "near" ? "• Gần bạn" : activeTab === "best-price" ? "• Giá tốt" : activeTab === "top-rated" ? "• Đánh giá cao" : activeTab === "favorites" ? "• Yêu thích" : "";
                                        return `Tìm thấy ${count} ${noun} ${filterLabel}`.trim();
                                   })()}
                              </h1>
                              <div className="mt-1 h-1.5 w-44 bg-gradient-to-l from-teal-500 via-emerald-400 to-transparent rounded-full justify-self-end" />

                              <p className="text-teal-700">
                                   {searchQuery && `Kết quả cho "${searchQuery}"`}
                              </p>
                         </div>
                         <div className="flex items-center space-x-2">
                              <Button
                                   type="button"
                                   onClick={() => updateViewMode("grid")}
                                   className={`p-2 rounded-xl ${viewMode === "grid" ? "bg-teal-500 text-white hover:bg-teal-600" : "bg-teal-50 text-gray-400 border border-gray-200 hover:bg-teal-600"}`}
                              >
                                   <Grid className="w-5 h-5" />
                              </Button>
                              <Button
                                   type="button"
                                   onClick={() => updateViewMode("list")}
                                   className={`px-2 rounded-xl ${viewMode === "list" ? "bg-teal-500 text-white hover:bg-teal-600" : "bg-teal-50 text-gray-400 border border-gray-200 hover:bg-teal-600"}`}
                              >
                                   <List className="w-5 h-5" />
                              </Button>
                         </div>
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                         <div className="flex items-center justify-center py-12">
                              <div className="flex items-center space-x-2 text-teal-600">
                                   <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
                                   <span className="text-lg font-medium">Đang tải...</span>
                              </div>
                         </div>
                    )}

                    {/* Results */}
                    {!isLoading && entityTab === "complexes" ? (
                         <>
                              {viewMode === "grid" ? (
                                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6  items-stretch">
                                        {pageItemsComplex.map((c) => (
                                             <Link
                                                  key={c.complexId}
                                                  to={`/complex/${c.complexId}`}
                                                  onClick={(e) => { e.preventDefault(); navigate(`/complex/${c.complexId}`); }}
                                                  className="group bg-white rounded-xl shadow-lg overflow-hidden h-full flex flex-col cursor-pointer"
                                             >
                                                  <div className="relative overflow-hidden">
                                                       <img src={c.image} alt={c.name} className="w-full h-40 object-cover" draggable={false} />
                                                  </div>
                                                  <div className="p-5 flex-1 flex flex-col">
                                                       <h3 className="text-xl font-semibold text-teal-800 mb-1">{c.name}</h3>
                                                       <div className="flex items-center text-teal-700 mb-2">
                                                            <MapPin className="w-4 h-4 mr-1" />
                                                            <span className="text-sm">{c.address}</span>
                                                       </div>
                                                       <div className="flex items-center justify-between mb-3">
                                                            <span className="text-sm bg-teal-50 text-teal-700 px-2 py-1 rounded-full border border-teal-200">{c.availableFields}/{c.totalFields} sân trống</span>
                                                            <span className="text-lg font-bold text-teal-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(c.minPriceForSelectedSlot)}</span>
                                                       </div>
                                                       <div className="mt-auto">
                                                            <Button className=" bg-teal-500 hover:bg-teal-600 text-white text-xs rounded-xl font-semibold"><EyeIcon className="w-6 h-6" /></Button>
                                                       </div>
                                                  </div>
                                             </Link>
                                        ))}
                                   </div>
                              ) : (
                                   <div className="space-y-4">
                                        {pageItemsComplex.map((c) => (
                                             <Link
                                                  key={c.complexId}
                                                  to={`/complex/${c.complexId}`}
                                                  onClick={(e) => { e.preventDefault(); navigate(`/complex/${c.complexId}`); }}
                                                  className="bg-white px-5 py-4 rounded-3xl shadow-lg overflow-hidden border border-teal-100 cursor-pointer"
                                             >
                                                  <div className="flex">
                                                       <div className="w-96 h-52 flex-shrink-0">
                                                            <img src={c.image} alt={c.name} className="w-full h-full rounded-2xl object-cover" draggable={false} />
                                                       </div>
                                                       <div className="flex-1 px-4 py-1">
                                                            <div className="flex justify-between items-start">
                                                                 <div className="flex bg-teal-50 border border-teal-100 px-2 py-1 rounded-full w-fit items-center text-teal-700 mb-1">
                                                                      <MapPin className="w-4 h-4 mr-1" />
                                                                      <span className="text-xs font-semibold">{c.address}</span>
                                                                 </div>
                                                            </div>
                                                            <div className="flex items-center justify-between mb-3">
                                                                 <div className="flex-1 items-center">
                                                                      <h3 className="text-2xl font-bold text-teal-800 px-2">{c.name}</h3>
                                                                 </div>
                                                                 <div className="text-xl font-bold text-teal-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(c.minPriceForSelectedSlot)}</div>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                 <div className="text-sm items-center flex text-gray-500">
                                                                      <span className="bg-teal-50 border border-teal-100 text-teal-600 px-2 py-1 rounded-full text-xs">{c.availableFields}/{c.totalFields} sân</span>
                                                                 </div>
                                                                 <div className="flex space-x-2">
                                                                      <Button type="button" className="bg-teal-500 hover:bg-teal-600 text-white py-1 px-4 rounded-xl font-semibold"><EyeIcon className="w-4 h-4" /></Button>
                                                                 </div>
                                                            </div>
                                                       </div>
                                                  </div>
                                             </Link>
                                        ))}
                                   </div>
                              )}
                              {/* Pagination for complexes */}
                              {totalComplex > 0 && (
                                   <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="text-sm text-teal-700">
                                             Trang {currentPageComplex}/{totalPagesComplex} • {Math.min(endIdxComplex, totalComplex)} trên {totalComplex} khu sân
                                        </div>
                                        <div className="flex items-center gap-2">
                                             <Button type="button" onClick={handlePrevComplex} disabled={currentPageComplex === 1} className={`px-3 py-1 rounded-full items-center justify-center border transition-colors ${currentPageComplex === 1 ? "bg-gray-50 text-gray-400 border-gray-300 cursor-not-allowed" : "bg-white text-teal-600 border-teal-200 hover:border-teal-300 hover:bg-teal-50"}`}>
                                                  <ChevronLeft className="w-4 h-4" />
                                             </Button>
                                             <div className="flex items-center gap-1">
                                                  {(() => {
                                                       const pages = [];
                                                       const maxVisiblePages = 5;
                                                       let startPage = Math.max(1, currentPageComplex - Math.floor(maxVisiblePages / 2));
                                                       let endPage = Math.min(totalPagesComplex, startPage + maxVisiblePages - 1);
                                                       if (endPage - startPage + 1 < maxVisiblePages) startPage = Math.max(1, endPage - maxVisiblePages + 1);
                                                       if (startPage > 1) {
                                                            pages.push(<Button key={1} onClick={() => setPageComplex(1)} className="px-3 py-1 rounded-full border border-teal-200 text-teal-600 bg-teal-50 hover:bg-teal-500 hover:text-white hover:border-teal-300 transition-colors">1</Button>);
                                                            if (startPage > 2) pages.push(<span key="ellipsis1" className="px-2 text-teal-400 bg-teal-50">...</span>);
                                                       }
                                                       for (let i = startPage; i <= endPage; i++) {
                                                            pages.push(<Button key={i} onClick={() => setPageComplex(i)} className={`px-4 py-1 rounded-full border transition-colors ${i === currentPageComplex ? "bg-teal-500 text-white border-teal-500 hover:bg-teal-600" : "border-teal-200 text-teal-600 bg-teal-50 hover:bg-teal-500 hover:text-white hover:border-teal-300"}`}>{i}</Button>);
                                                       }
                                                       if (endPage < totalPagesComplex) {
                                                            if (endPage < totalPagesComplex - 1) pages.push(<span key="ellipsis2" className="px-2 text-teal-400 bg-teal-50">...</span>);
                                                            pages.push(<Button key={totalPagesComplex} onClick={() => setPageComplex(totalPagesComplex)} className="px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-600 hover:bg-teal-50 hover:border-teal-300 transition-colors">{totalPagesComplex}</Button>);
                                                       }
                                                       return pages;
                                                  })()}
                                             </div>
                                             <Button type="button" onClick={handleNextComplex} disabled={currentPageComplex === totalPagesComplex} className={`px-3 py-1 rounded-full border transition-colors ${currentPageComplex === totalPagesComplex ? "bg-gray-50 text-gray-400 border-gray-300 cursor-not-allowed" : "bg-white text-teal-600 border-teal-200 hover:border-teal-300 hover:bg-teal-50"}`}>
                                                  <ChevronRight className="w-4 h-4 " />
                                             </Button>
                                        </div>
                                   </div>
                              )}
                         </>
                    ) : !isLoading && isGroupedView ? (
                         <div className="space-y-10">
                              <div>
                                   <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-extrabold text-teal-800 tracking-tight">
                                             <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full border border-teal-300 bg-teal-50">
                                                  <MapPin className="w-5 h-5 text-teal-600" />
                                                  <span>Gần bạn</span>
                                             </span>
                                        </h2>
                                        <Button
                                             type="button"
                                             onClick={() => { setActiveTab("near"); setForceList(true); setPage(1); setEntityTab("complexes"); }}
                                             className="px-3 py-1 rounded-2xl hover:border-b-2 bg-transparent hover:bg-teal-50 hover:border-teal-300 text-teal-700 text-sm"
                                        >
                                             Xem tất cả
                                        </Button>
                                   </div>
                                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                                        {complexes.slice(0, 4).map((c) => (
                                             <Link
                                                  key={c.complexId}
                                                  to={`/complex/${c.complexId}`}
                                                  onClick={(e) => { e.preventDefault(); navigate(`/complex/${c.complexId}`); }}
                                                  className="group pt-3 px-3 border border-teal-100 bg-white rounded-xl shadow-lg overflow-hidden h-full flex flex-col cursor-pointer"
                                             >
                                                  <div className="relative overflow-hidden">
                                                       <img src={c.image} alt={c.name} className="w-full h-48 object-cover rounded-xl" draggable={false} />
                                                  </div>
                                                  <div className="px-2 py-3 flex-1 flex flex-col">
                                                       <div className="flex bg-teal-50 border border-teal-100 px-2 py-1 rounded-full w-fit items-center text-teal-700 mb-2">
                                                            <MapPin className="w-4 h-4 mr-1" />
                                                            <span className="text-xs font-semibold line-clamp-1">{c.address}</span>
                                                       </div>
                                                       <div className="flex items-center justify-between mb-3">
                                                            <h3 className="text-lg font-bold text-teal-800 line-clamp-1">{c.name}</h3>
                                                       </div>


                                                       <div className="flex items-center justify-between gap-2 mb-4">
                                                            <span className="bg-teal-50 border border-teal-100 text-teal-600 px-2 py-1 rounded-full text-xs">{c.availableFields}/{c.totalFields} sân</span>
                                                            <div className="text-xs flex items-center text-gray-500">
                                                                 <MapPin className="w-4 h-4 mr-1" /> <p> {c.distanceKm ? `${c.distanceKm.toFixed(1)} km` : ""}</p>
                                                            </div>
                                                       </div>
                                                       <div className="mt-auto flex items-center justify-between">
                                                            <div className="text-lg font-bold text-teal-500">{formatPrice(c.minPriceForSelectedSlot || 0)}/trận</div>
                                                            <Button type="button" className="w-fit bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-full font-semibold">
                                                                 <EyeIcon className="w-4 h-4" />
                                                            </Button>
                                                       </div>
                                                  </div>
                                             </Link>
                                        ))}
                                   </div>
                              </div>
                              <div>
                                   <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-extrabold text-red-700 tracking-tight">
                                             <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full border border-red-300 bg-red-50">
                                                  <CircleDollarSign className="w-4 h-4 text-red-600" />
                                                  <span>Giá tốt</span>
                                             </span>
                                        </h2>
                                        <Button
                                             type="button"
                                             onClick={() => { setActiveTab("best-price"); setForceList(true); setPage(1); }}

                                             className="px-3 py-1 rounded-2xl hover:border-b-2 bg-transparent hover:bg-teal-50 hover:border-teal-300 text-teal-700 text-sm"
                                        >
                                             Xem tất cả
                                        </Button>
                                   </div>
                                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                                        {bestPriceGroup.map((field) => (
                                             <Link
                                                  key={field.fieldId}
                                                  to={`/field/${field.fieldId}`}
                                                  onClick={(e) => { e.preventDefault(); navigate(`/field/${field.fieldId}`); }}
                                                  className="group pt-3 px-3 border border-teal-100 bg-white rounded-xl shadow-lg overflow-hidden transition-all hover:scale-100 duration-200 hover:shadow-xl hover:ring-1 hover:ring-teal-100 h-full flex flex-col cursor-pointer"
                                             >
                                                  <div className="relative overflow-hidden">
                                                       <img src={field.image} alt={field.name} className="w-full h-48 object-cover rounded-xl" draggable={false} />
                                                       <div className="absolute top-4 right-4 flex space-x-2">
                                                            <div className="bg-white/95 backdrop-blur-md border border-teal-100 px-2 py-1 rounded-full text-xs font-semibold text-teal-600 shadow-sm flex items-center gap-1"><User size={16} /> <p>{slotId ? (field.isAvailableForSelectedSlot ? "Còn chỗ" : "Hết chỗ") : field.typeName}</p></div>
                                                       </div>
                                                  </div>
                                                  <div className="px-2 py-3 flex-1 flex flex-col">
                                                       <div className="flex bg-teal-50 border border-teal-100 px-2 py-1 rounded-full w-fit items-center text-teal-700 mb-2">
                                                            <MapPin className="w-4 h-4 mr-1" />
                                                            <span className="text-xs font-semibold line-clamp-1">{field.address}</span>
                                                       </div>

                                                       <div className="flex items-center justify-between mb-3">
                                                            <h3 className="text-lg font-bold text-teal-800 line-clamp-1">{field.name}</h3>
                                                            <div className="flex items-center">
                                                                 <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">Giá tốt nhất</span>
                                                            </div>
                                                       </div>
                                                       <div className="flex items-center gap-2 mb-4">
                                                            {Array.isArray(field.amenities) && field.amenities.length > 0 && (
                                                                 <>
                                                                      <span className="bg-teal-50 border border-teal-100 text-teal-600 px-2 py-1 rounded-full text-xs">{field.amenities[0]}</span>
                                                                      {field.amenities.length > 1 && (
                                                                           <span className="bg-teal-50 border border-teal-100 text-teal-600 px-2 py-1 rounded-full text-xs">+{field.amenities.length - 1}</span>
                                                                      )}
                                                                 </>
                                                            )}
                                                       </div>
                                                       <div className="mt-auto flex items-center justify-between">
                                                            <div className="text-lg font-bold text-teal-500">{formatPrice(field.priceForSelectedSlot || 0)}/trận</div>
                                                            <Button
                                                                 type="button"
                                                                 onClick={(e) => {
                                                                      e.stopPropagation();
                                                                      handleBook(field.fieldId);
                                                                 }}
                                                                 className="w-fit hover:scale-90 duration-200 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-full font-semibold transition-colors"
                                                            >
                                                                 Đặt sân
                                                            </Button>
                                                       </div>
                                                  </div>
                                             </Link>
                                        ))}
                                   </div>
                              </div>
                              <div>
                                   <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-extrabold text-teal-800 tracking-tight">
                                             <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full border border-yellow-300 bg-yellow-50">
                                                  <Star className="w-5 h-5 text-yellow-500" />
                                                  <span>Đánh giá cao</span>
                                             </span>
                                        </h2>
                                        <Button
                                             type="button"
                                             onClick={() => { setActiveTab("top-rated"); setForceList(true); setPage(1); }}
                                             className="px-3 py-1 rounded-2xl hover:border-b-2 bg-transparent hover:bg-teal-50 hover:border-teal-300 text-teal-700 text-sm"
                                        >
                                             Xem tất cả
                                        </Button>
                                   </div>
                                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                                        {topRatedGroup.map((field) => (
                                             <Link
                                                  key={field.fieldId}
                                                  to={`/field/${field.fieldId}`}
                                                  onClick={(e) => { e.preventDefault(); navigate(`/field/${field.fieldId}`); }}
                                                  className="group pt-3 px-3 border border-teal-100 bg-white rounded-xl shadow-lg overflow-hidden transition-all hover:scale-100 duration-200 hover:shadow-xl hover:ring-1 hover:ring-teal-100 h-full flex flex-col cursor-pointer"
                                             >
                                                  <div className="relative overflow-hidden">
                                                       <img src={field.image} alt={field.name} className="w-full h-48 object-cover rounded-xl" draggable={false} />
                                                       <div className="absolute top-4 right-4 flex space-x-2">
                                                            <div className="bg-white/95 backdrop-blur-md border border-teal-100 px-2 py-1 rounded-full text-xs font-semibold text-teal-600 shadow-sm flex items-center gap-1"><User size={16} /> <p>{slotId ? (field.isAvailableForSelectedSlot ? "Còn chỗ" : "Hết chỗ") : field.typeName}</p></div>
                                                       </div>
                                                  </div>
                                                  <div className="px-2 py-3 flex-1 flex flex-col">
                                                       <div className="flex bg-teal-50 border border-teal-100 px-2 py-1 rounded-full w-fit items-center text-teal-700 mb-2">
                                                            <MapPin className="w-4 h-4 mr-1" />
                                                            <span className="text-xs font-semibold line-clamp-1">{field.address}</span>
                                                       </div>

                                                       <div className="flex items-center justify-between mb-3">
                                                            <h3 className="text-lg font-bold text-teal-800 line-clamp-1">{field.name}</h3>
                                                            <div className="flex items-center">
                                                                 <Star className="w-4 h-4 text-red-500 mr-1" />
                                                                 <span className="text-sm font-bold text-red-600">{field.rating}</span>
                                                                 <span className="text-sm text-red-500 ml-1">({field.reviewCount})</span>
                                                            </div>
                                                       </div>
                                                       <div className="flex items-center gap-2 mb-4">
                                                            {Array.isArray(field.amenities) && field.amenities.length > 0 && (
                                                                 <>
                                                                      <span className="bg-teal-50 border border-teal-100 text-teal-600 px-2 py-1 rounded-full text-xs">{field.amenities[0]}</span>
                                                                      {field.amenities.length > 1 && (
                                                                           <span className="bg-teal-50 border border-teal-100 text-teal-600 px-2 py-1 rounded-full text-xs">+{field.amenities.length - 1}</span>
                                                                      )}
                                                                 </>
                                                            )}
                                                       </div>
                                                       <div className="mt-auto flex items-center justify-between">
                                                            <div className="text-lg font-bold text-teal-500">{formatPrice(field.priceForSelectedSlot || 0)}/trận</div>
                                                            <Button
                                                                 type="button"
                                                                 onClick={(e) => {
                                                                      e.stopPropagation();
                                                                      handleBook(field.fieldId);
                                                                 }}
                                                                 className="w-fit hover:scale-90 duration-200 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-full font-semibold transition-colors"
                                                            >
                                                                 Đặt sân
                                                            </Button>
                                                       </div>
                                                  </div>
                                             </Link>
                                        ))}
                                   </div>
                              </div>
                         </div>
                    ) : !isLoading && viewMode === "grid" ? (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                              {pageItems.map((field) => (
                                   <Link
                                        key={field.fieldId}
                                        to={`/field/${field.fieldId}`}
                                        onClick={(e) => { e.preventDefault(); navigate(`/field/${field.fieldId}`); }}
                                        className="group bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-xl hover:ring-1 hover:ring-teal-100 h-full flex flex-col cursor-pointer"
                                   >
                                        <div className="relative overflow-hidden">
                                             <img
                                                  src={field.image}
                                                  alt={field.name}
                                                  className="w-full h-40 object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                                                  draggable={false}
                                             />
                                             <div className="absolute top-4 right-4 flex space-x-2">
                                                  <Button
                                                       type="button"
                                                       onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleFavorite(field.id);
                                                       }}
                                                       variant="outline"
                                                       className={`h-8 w-8 p-0 rounded-full shadow-sm transition-colors border ${field.isFavorite ? "bg-teal-500 text-white border-teal-500" : "bg-white text-teal-700 border-teal-200 hover:bg-teal-50"}`}
                                                  >
                                                       <Heart className="w-4 h-4" />
                                                  </Button>
                                                  <div className="bg-white/95 backdrop-blur px-2 py-1 rounded-full text-sm font-semibold text-teal-600 border border-teal-200 shadow-sm">
                                                       {slotId ? (field.isAvailableForSelectedSlot ? "Còn chỗ" : "Hết chỗ") : field.typeName}
                                                  </div>
                                             </div>
                                        </div>
                                        <div className="p-4 flex-1 flex flex-col">
                                             <h3 className="text-xl font-semibold text-teal-800 mb-2">{field.name}</h3>
                                             <div className="flex bg-teal-50 border border-teal-100 p-1 rounded-full w-fit items-center text-teal-700 mb-2">
                                                  <MapPin className="w-4 h-4 mr-1" />
                                                  <span className="text-xs line-clamp-1">{field.address}</span>
                                             </div>

                                             <div className="flex items-center justify-between mb-4">
                                                  <div className="flex items-center">
                                                       {activeTab === "near" ? (
                                                            <>
                                                                 <MapPin className="w-4 h-4 text-red-500 mr-1" />
                                                                 <span className="text-sm font-bold text-red-600">{field.distanceKm ? `${Number(field.distanceKm).toFixed(1)} km` : ""}</span>
                                                            </>
                                                       ) : activeTab === "best-price" ? (
                                                            <span className="text-sm font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">Giá tốt nhất</span>
                                                       ) : activeTab === "top-rated" ? (
                                                            <>
                                                                 <Star className="w-4 h-4 text-red-500 mr-1" />
                                                                 <span className="text-sm font-bold text-red-600">{field.rating}</span>
                                                                 <span className="text-sm text-red-500 ml-1">({field.reviewCount})</span>
                                                            </>
                                                       ) : (
                                                            <>
                                                                 <Star className="w-4 h-4 text-teal-400 mr-1" />
                                                                 <span className="text-sm font-semibold">{field.rating}</span>
                                                                 <span className="text-sm text-gray-500 ml-1">({field.reviewCount})</span>
                                                            </>
                                                       )}
                                                  </div>
                                                  <div className={`text-lg font-bold ${activeTab === "best-price" ? "text-red-500" : "text-teal-600"}`}>{formatPrice(field.priceForSelectedSlot || 0)}/trận</div>
                                             </div>
                                             <div className="flex items-center gap-2 mb-4">
                                                  {Array.isArray(field.amenities) && field.amenities.length > 0 && (
                                                       <>
                                                            <span className="bg-teal-50 text-teal-700 px-2 py-1 rounded-full text-xs border border-teal-200">{field.amenities[0]}</span>
                                                            {field.amenities.length > 1 && (
                                                                 <span className="bg-teal-50 text-teal-700 px-2 py-1 rounded-full text-xs border border-teal-200">+{field.amenities.length - 1}</span>
                                                            )}
                                                       </>
                                                  )}
                                             </div>
                                             <div className="mt-auto">
                                                  <Button
                                                       type="button"
                                                       onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleBook(field.fieldId);
                                                       }}
                                                       className="w-full bg-teal-500 hover:bg-teal-600 text-white py-2 px-4 rounded-xl font-semibold transition-colors"
                                                  >
                                                       Đặt sân
                                                  </Button>
                                             </div>
                                        </div>
                                   </Link>
                              ))}
                         </div>
                    ) : (
                         <div className="space-y-4">
                              {pageItems.map((field) => (
                                   <Link
                                        key={field.fieldId}
                                        to={`/field/${field.fieldId}`}
                                        onClick={(e) => { e.preventDefault(); navigate(`/field/${field.fieldId}`); }}
                                        className="bg-white px-5 py-4 rounded-3xl shadow-lg overflow-hidden hover:scale-105 duration-300 transition-all border border-teal-100 hover:border-teal-200 cursor-pointer"
                                   >
                                        <div className="flex">
                                             <div className="w-96 h-52 flex-shrink-0">
                                                  <img
                                                       src={field.image}
                                                       alt={field.name}
                                                       className="w-full h-full rounded-2xl object-cover"
                                                       draggable={false}
                                                  />
                                             </div>
                                             <div className="flex-1 px-4 py-1">
                                                  <div className="flex justify-between items-start">
                                                       <div className="flex  bg-teal-50 border border-teal-100 px-2 py-1 rounded-full w-fit items-center text-teal-700 mb-1">
                                                            <MapPin className="w-4 h-4 mr-1" />
                                                            <span className="text-xs font-semibold">{field.address}</span>
                                                       </div>
                                                       <Button
                                                            onClick={(e) => {
                                                                 e.stopPropagation();
                                                                 handleToggleFavorite(field.id);
                                                            }}
                                                            className={`px-3 rounded-full ${field.isFavorite ? "bg-red-500 text-white hover:bg-red-600" : "bg-teal-100 text-teal-700 hover:border-red-100 hover:border hover:text-red-600 hover:bg-red-50"}`}
                                                       >
                                                            <Heart className="w-4 h-4" />
                                                       </Button>
                                                  </div>

                                                  <div className="flex items-center justify-between mb-3">
                                                       <div className="flex-1 items-center">
                                                            <h3 className="text-2xl font-bold text-teal-800 px-2">{field.name}</h3>
                                                            <div className="flex items-center"> <Star className="w-4 h-4 text-teal-400 mr-1" />
                                                                 <span className="text-sm font-semibold">{field.rating}</span>
                                                                 <span className="text-sm text-gray-500 ml-1">({field.reviewCount} đánh giá)</span>
                                                            </div>
                                                       </div>
                                                       <div className="text-xl font-bold text-teal-600">{formatPrice(field.priceForSelectedSlot || 0)}/trận</div>
                                                  </div>
                                                  <div className="text-xs text-teal-700 mb-2 break-words">
                                                       {field.address}
                                                       <a
                                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(field.address || "")}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="ml-2 text-teal-600 underline"
                                                       >
                                                            Xem bản đồ
                                                       </a>
                                                  </div>
                                                  <div className="flex flex-wrap gap-2 mb-5">
                                                       {(field.amenities || []).map((amenity, index) => (
                                                            <span
                                                                 key={index}
                                                                 className="bg-teal-50 text-teal-700 px-2 py-1 rounded-full text-xs border border-teal-200"
                                                            >
                                                                 {amenity}
                                                            </span>
                                                       ))}
                                                  </div>
                                                  <div className="flex justify-between items-center">
                                                       <div className="text-sm items-center flex text-gray-500">
                                                            <Clock className="w-4 h-4 inline mr-1" />
                                                            <p> {slotId ? (field.isAvailableForSelectedSlot ? "Còn chỗ" : "Hết chỗ") : field.typeName} • {field.distanceKm ? `${Number(field.distanceKm).toFixed(1)} km` : ""} </p>
                                                       </div>
                                                       <div className="flex space-x-2">
                                                            <Button
                                                                 type="button"
                                                                 onClick={(e) => {
                                                                      e.stopPropagation();
                                                                      handleBook(field.fieldId);
                                                                 }}
                                                                 className="bg-teal-500 hover:bg-teal-600 text-white py-1 px-4 rounded-xl font-semibold"
                                                            >
                                                                 Đặt sân
                                                            </Button>
                                                       </div>
                                                  </div>
                                             </div>
                                        </div>
                                   </Link>
                              ))}
                         </div>
                    )}

                    {/* Pagination for fields (only when viewing Sân nhỏ list) */}
                    {entityTab === "fields" && filteredFields.length > 0 && !isGroupedView && (
                         <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                              <div className="text-sm text-teal-700">
                                   Trang {currentPage}/{totalPages} • {Math.min(endIdx, totalItems)} trên {totalItems} sân
                              </div>
                              <div className="flex items-center gap-2">
                                   <Button
                                        type="button"
                                        onClick={handlePrev}
                                        disabled={currentPage === 1}
                                        className={`px-3 py-1 rounded-full items-center justify-center border transition-colors ${currentPage === 1 ? "bg-gray-50 text-gray-400 border-gray-300 cursor-not-allowed" : "bg-white text-teal-600 border-teal-200 hover:border-teal-300 hover:bg-teal-50"}`}
                                   >
                                        <ChevronLeft className="w-4 h-4" />
                                   </Button>

                                   {/* Page numbers */}
                                   <div className="flex items-center gap-1">
                                        {(() => {
                                             const pages = [];
                                             const maxVisiblePages = 5;
                                             let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                                             let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                                             if (endPage - startPage + 1 < maxVisiblePages) {
                                                  startPage = Math.max(1, endPage - maxVisiblePages + 1);
                                             }

                                             // First page
                                             if (startPage > 1) {
                                                  pages.push(
                                                       <Button
                                                            key={1}
                                                            onClick={() => setPage(1)}
                                                            className="px-3 py-1 rounded-full border border-teal-200 text-teal-600 hover:bg-teal-50 hover:border-teal-300 transition-colors"
                                                       >
                                                            1
                                                       </Button>
                                                  );
                                                  if (startPage > 2) {
                                                       pages.push(
                                                            <span key="ellipsis1" className="px-2 text-teal-400">...</span>
                                                       );
                                                  }
                                             }

                                             // Middle pages
                                             for (let i = startPage; i <= endPage; i++) {
                                                  pages.push(
                                                       <Button
                                                            key={i}
                                                            onClick={() => setPage(i)}
                                                            className={`px-4 py-1 rounded-full border transition-colors ${i === currentPage
                                                                 ? "bg-teal-500 text-white border-teal-500 hover:bg-teal-600"
                                                                 : "border-teal-200 text-teal-600 bg-teal-50 hover:bg-teal-500 hover:text-white hover:border-teal-300"
                                                                 }`}
                                                       >
                                                            {i}
                                                       </Button>
                                                  );
                                             }

                                             // Last page
                                             if (endPage < totalPages) {
                                                  if (endPage < totalPages - 1) {
                                                       pages.push(
                                                            <span key="ellipsis2" className="px-2 text-teal-400 bg-teal-50">...</span>
                                                       );
                                                  }
                                                  pages.push(
                                                       <Button
                                                            key={totalPages}
                                                            onClick={() => setPage(totalPages)}
                                                            className="px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-600 hover:bg-teal-50 hover:border-teal-300 transition-colors"
                                                       >
                                                            {totalPages}
                                                       </Button>
                                                  );
                                             }

                                             return pages;
                                        })()}
                                   </div>

                                   <Button
                                        onClick={handleNext}
                                        disabled={currentPage === totalPages}
                                        className={`px-3 py-1 rounded-full border transition-colors ${currentPage === totalPages ? "bg-gray-50 text-gray-400 border-gray-300 cursor-not-allowed" : "bg-white text-teal-600 border-teal-200 hover:border-teal-300 hover:bg-teal-50"}`}
                                   >
                                        <ChevronRight className="w-4 h-4 " />
                                   </Button>
                              </div>
                         </div>
                    )}

                    {!isLoading && filteredFields.length === 0 && (
                         <div className="text-center py-12">
                              <div className="text-gray-400 mb-4">
                                   <Search className="w-16 h-16 mx-auto" />
                              </div>
                              <h3 className="text-lg font-semibold text-teal-800 mb-2">Không tìm thấy sân bóng</h3>
                              <p className="text-teal-700 mb-4">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                              <Button
                                   onClick={() => {
                                        setSearchQuery("");
                                        setSelectedLocation("");
                                        setSelectedPrice("");
                                        setSelectedRating("");
                                        setActiveTab("all");
                                        setViewMode("grid");
                                        setPage(1);
                                        // reset map-driven filters
                                        setForceList(false);
                                        setMapSearchKey(prev => prev + 1); // Force MapSearch reset

                                   }}
                                   className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-xl font-semibold transition-colors"
                              >
                                   <RefreshCcw className="w-4 h-4" />
                              </Button>
                         </div>
                    )}
               </Container>

               {/* Map Search Modal */}
               <MapSearch
                    key={mapSearchKey}
                    isOpen={showMapSearch}
                    onClose={() => setShowMapSearch(false)}
                    onLocationSelect={handleMapLocationSelect}
               />
          </Section>
     );
}

