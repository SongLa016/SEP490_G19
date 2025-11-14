import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Star } from "lucide-react";
import { Section, Container, Card, CardContent, StaggerContainer } from "../../../../shared/components/ui";
import { ScrollReveal } from "../../../../shared/components/ScrollReveal";
import { LoginPromotionModal } from "../../../../shared/components/LoginPromotionModal";
import { useNavigate } from "react-router-dom";
import MapSearch from "./components/MapSearch";
import { fetchComplexes, fetchFields, fetchTimeSlots } from "../../../../shared/index";
import Swal from 'sweetalert2';
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
     const heroRef = useRef(null);

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
     useEffect(() => {
          window.scrollTo(0, 0);
     }, []);
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
               setTimeSlots(Array.isArray(slots) ? slots : []);
          }).catch((error) => {
               console.error("Error loading time slots:", error);
               if (!mounted) return;
               setTimeSlots([]);
          });
          return () => { mounted = false; };
     }, []);

     // Load data whenever key filters change (fetch both complexes and fields to support grouped view)
     useEffect(() => {
          let ignore = false;
          const hasNoData = complexes.length === 0 && fields.length === 0;

          const loadData = async () => {
               try {
                    // Only show loading if we don't have any data yet
                    if (hasNoData) {
                         setIsLoading(true);
                    }
                    // Start fetching immediately for better perceived performance
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
          };

          // Use requestAnimationFrame to ensure smooth navigation before starting fetch
          const rafId = requestAnimationFrame(() => {
               loadData();
          });

          return () => {
               cancelAnimationFrame(rafId);
               ignore = true;
          };
          // eslint-disable-next-line react-hooks/exhaustive-deps
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

     const toggleFavoriteComplex = (complexId) => {
          setComplexes(prev => prev.map(c =>
               c.complexId === complexId ? { ...c, isFavorite: !c.isFavorite } : c
          ));
     };

     // Toast notification helper
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

     const handleToggleFavorite = (fieldId) => {
          if (!user) {
               showToastMessage("Vui lòng đăng nhập để sử dụng danh sách yêu thích.", 'warning');
               return;
          }
          toggleFavorite(fieldId);
     };

     const handleToggleFavoriteComplex = (complexId) => {
          if (!user) {
               showToastMessage("Vui lòng đăng nhập để sử dụng danh sách yêu thích.", 'warning');
               return;
          }
          toggleFavoriteComplex(complexId);
     };

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
               <motion.div
                    ref={heroRef}
                    className="py-32 mx-5 md:py-44 bg-[url('https://i.pinimg.com/originals/a3/c7/79/a3c779e5d5b622eeb598ac1d50c05cb8.png')] bg-cover bg-center rounded-b-3xl overflow-hidden relative"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
               >
                    {/* Floating particles for hero */}
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
                                        <SearchHeader
                                             entityTab={entityTab}
                                             setEntityTab={setEntityTab}
                                             resultCount={entityTab === "complexes" ? complexes.length : filteredFields.length}
                                             user={user}
                                        />
                                        <SearchFiltersBar
                                             searchQuery={searchQuery}
                                             setSearchQuery={setSearchQuery}
                                             selectedLocation={selectedLocation}
                                             handleLocationChange={handleLocationChange}
                                             getLocationValue={getLocationValue}
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
                                                  setDate(new Date().toISOString().split('T')[0]);
                                                  setSlotId("");
                                                  setMapSearchKey(prev => prev + 1);
                                                  localStorage.removeItem('searchPreset');
                                             }}
                                        />
                                        <QuickPresets
                                             quickPresets={quickPresets}
                                             activeTab={activeTab}
                                             setActiveTab={setActiveTab}
                                             typeTab={typeTab}
                                             setTypeTab={setTypeTab}
                                             setPage={setPage}
                                        />
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
                                                  setDate(new Date().toISOString().split('T')[0]);
                                                  setSlotId("");
                                             }}
                                        />
                                   </CardContent>
                              </Card>
                         </motion.div>
                    </motion.div>

                    {/* Results Header với Animation */}
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

                    {/* Loading State với Animation */}
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
                                   {/* Gần bạn - Scroll trigger animation */}
                                   <ScrollReveal direction="up" delay={0.1}>
                                        <GroupedViewSection
                                             title="Gần bạn"
                                             icon={MapPin}
                                             iconColor="text-teal-800"
                                             bgColor="bg-teal-50"
                                             borderColor="border-teal-300"
                                             items={complexes.slice(0, 4)}
                                             type="complex"
                                             navigate={navigate}
                                             formatPrice={formatPrice}
                                             user={user}
                                             handleLoginRequired={(msg) => showToastMessage(msg, 'warning')}
                                             onToggleFavoriteComplex={handleToggleFavoriteComplex}
                                             handleViewAll={() => { setActiveTab("near"); setForceList(true); setPage(1); setEntityTab("complexes"); }}
                                        />
                                   </ScrollReveal>

                                   {/* Giá tốt - Scroll trigger animation */}
                                   <ScrollReveal direction="up" delay={0.2}>
                                        <GroupedViewSection
                                             title="Giá tốt"
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

                                   {/* Đánh giá cao - Scroll trigger animation */}
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

                    {/* Pagination for complexes */}
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

                    {/* Pagination for fields (only when viewing Sân nhỏ list) */}
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

               {/* Map Search Modal */}
               <MapSearch
                    key={mapSearchKey}
                    isOpen={showMapSearch}
                    onClose={() => setShowMapSearch(false)}
                    onLocationSelect={handleMapLocationSelect}
               />

               {/* Login Promotion Modal */}
               <LoginPromotionModal user={user} />
          </Section >
     );
}

