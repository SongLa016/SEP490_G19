import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Star, Clock, Grid, List, Heart, SlidersHorizontal, ChevronLeft, ChevronRight, Sparkles, User, Map } from "lucide-react";
import { Section, Container, Card, CardContent, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button } from "../../components/ui";
import { useNavigate } from "react-router-dom";
import MapSearch from "../../components/MapSearch";
export default function FieldSearch({ user }) {
     const navigate = useNavigate();
     const [searchQuery, setSearchQuery] = useState("");
     const [selectedLocation, setSelectedLocation] = useState("all");
     const [selectedPrice, setSelectedPrice] = useState("all");
     const [selectedRating, setSelectedRating] = useState("all");
     const [viewMode, setViewMode] = useState("grid"); // grid or list
     const [showFilters, setShowFilters] = useState(false);
     const [sortBy, setSortBy] = useState("relevance");
     const [activeTab, setActiveTab] = useState("all"); // all | near | best-price | top-rated | favorites
     const [page, setPage] = useState(1);
     const [pageSize] = useState(12);
     const [forceList, setForceList] = useState(false);
     const [showMapSearch, setShowMapSearch] = useState(false);
     const [mapLocation, setMapLocation] = useState(null);
     const [mapSearchKey, setMapSearchKey] = useState(0); // Key to force MapSearch reset

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

     // Mock data for fields
     const [fields, setFields] = useState([
          {
               id: 1,
               name: "Sân bóng đá ABC",
               location: "Quận Hoàn Kiếm, Hà Nội",
               address: "123 Phố Hàng Bạc, Phường Hàng Bạc",
               price: 200000,
               rating: 4.8,
               reviewCount: 156,
               image: "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
               amenities: ["Có nước uống", "Có WC", "Có chỗ đậu xe", "Có thay đồ"],
               availableSlots: 3,
               isFavorite: false,
               distance: "0.5 km"
          },
          {
               id: 2,
               name: "Sân bóng đá XYZ",
               location: "Quận Ba Đình, Hà Nội",
               address: "456 Đường Kim Mã, Phường Kim Mã",
               price: 180000,
               rating: 4.6,
               reviewCount: 89,
               image: "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
               amenities: ["Có nước uống", "Có WC"],
               availableSlots: 5,
               isFavorite: false,
               distance: "1.2 km"
          },
          {
               id: 3,
               name: "Sân bóng đá DEF",
               location: "Quận Đống Đa, Hà Nội",
               address: "789 Đường Láng, Phường Láng Thượng",
               price: 220000,
               rating: 4.9,
               reviewCount: 203,
               image: "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
               amenities: ["Có nước uống", "Có WC", "Có chỗ đậu xe", "Có thay đồ", "Có máy lạnh"],
               availableSlots: 2,
               isFavorite: false,
               distance: "2.1 km"
          },
          {
               id: 4,
               name: "Sân bóng đá GHI",
               location: "Quận Cầu Giấy, Hà Nội",
               address: "321 Đường Trần Duy Hưng, Phường Trung Hòa",
               price: 150000,
               rating: 4.4,
               reviewCount: 67,
               image: "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
               amenities: ["Có nước uống", "Có WC"],
               availableSlots: 8,
               isFavorite: false,
               distance: "3.5 km"
          },
          {
               id: 5,
               name: "Sân bóng đá JKL",
               location: "Quận Hai Bà Trưng, Hà Nội",
               address: "654 Đường Bạch Mai, Phường Bạch Mai",
               price: 250000,
               rating: 4.7,
               reviewCount: 134,
               image: "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
               amenities: ["Có nước uống", "Có WC", "Có chỗ đậu xe", "Có thay đồ", "Có máy lạnh", "Có wifi"],
               availableSlots: 1,
               isFavorite: false,
               distance: "0.8 km"
          }
     ]);

     const [filteredFields, setFilteredFields] = useState(fields);

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
               }
          } catch { }
     }, []);

     useEffect(() => {
          let filtered = fields;

          // Filter by search query
          if (searchQuery) {
               filtered = filtered.filter(field =>
                    field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    field.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    field.address.toLowerCase().includes(searchQuery.toLowerCase())
               );
          }

          // Filter by location
          if (selectedLocation) {
               filtered = filtered.filter(field => field.location.includes(selectedLocation));
          }

          // Filter by price
          if (selectedPrice) {
               switch (selectedPrice) {
                    case "under100":
                         filtered = filtered.filter(field => field.price < 100000);
                         break;
                    case "100-200":
                         filtered = filtered.filter(field => field.price >= 100000 && field.price <= 200000);
                         break;
                    case "200-300":
                         filtered = filtered.filter(field => field.price >= 200000 && field.price <= 300000);
                         break;
                    case "over300":
                         filtered = filtered.filter(field => field.price > 300000);
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
                    filtered.sort((a, b) => a.price - b.price);
                    break;
               case "price-high":
                    filtered.sort((a, b) => b.price - a.price);
                    break;
               case "rating":
                    filtered.sort((a, b) => b.rating - a.rating);
                    break;
               case "distance":
                    filtered.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
                    break;
               default:
                    // relevance - keep original order
                    break;
          }

          // Apply tab presets (computed filtering helper)
          switch (activeTab) {
               case "near":
                    filtered = [...filtered].sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
                    break;
               case "best-price":
                    filtered = [...filtered].sort((a, b) => a.price - b.price);
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

          // Reset to first page whenever filters change
          setPage(1);
     }, [searchQuery, selectedLocation, selectedPrice, selectedRating, sortBy, activeTab, fields]);

     // Persist preferences
     useEffect(() => {
          try {
               const prefs = { viewMode, activeTab, page };
               window.localStorage.setItem("fieldSearchPrefs", JSON.stringify(prefs));
          } catch { }
     }, [viewMode, activeTab, page]);

     const toggleFavorite = (fieldId) => {
          setFields(prev => prev.map(field =>
               field.id === fieldId ? { ...field, isFavorite: !field.isFavorite } : field
          ));
     };

     const handleToggleFavorite = (fieldId) => {
          if (!user) {
               alert("Vui lòng đăng nhập để sử dụng danh sách yêu thích.");
               navigate("/auth");
               return;
          }
          toggleFavorite(fieldId);
     };

     const handleBook = (fieldId) => {
          if (!user) {
               alert("Bạn cần đăng nhập để đặt sân.");
               navigate("/auth");
               return;
          }
          navigate(`/booking/${fieldId}`);
     };

     const handleMapLocationSelect = (location) => {
          setMapLocation(location);

          // Apply location filter based on selected map location
          if (location.field) {
               // If a specific field was selected, filter to show only that field
               setSearchQuery(location.field.name);
               setSelectedLocation(location.field.location);
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
     const totalItems = filteredFields.length;
     const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
     const currentPage = Math.min(page, totalPages);
     const startIdx = (currentPage - 1) * pageSize;
     const endIdx = startIdx + pageSize;
     const pageItems = filteredFields.slice(startIdx, endIdx);

     const handlePrev = () => setPage(prev => Math.max(1, prev - 1));
     const handleNext = () => setPage(prev => Math.min(totalPages, prev + 1));

     const quickPresets = [
          { key: "near", label: "Gần bạn" },
          { key: "best-price", label: "Giá tốt" },
          { key: "top-rated", label: "Đánh giá cao" },
     ];

     const isNoFilter = !searchQuery && !selectedLocation && !selectedPrice && !selectedRating;
     const isGroupedView = activeTab === "all" && isNoFilter && !forceList;

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

     const nearGroup = [...filteredFields].sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance)).slice(0, 4);
     const bestPriceGroup = [...filteredFields].sort((a, b) => a.price - b.price).slice(0, 4);
     const topRatedGroup = [...filteredFields].sort((a, b) => b.rating - a.rating).slice(0, 4);

     return (
          <Section className="min-h-screen bg-gray-50">
               <div className=" py-20 bg-[url('https://i.pinimg.com/originals/a3/c7/79/a3c779e5d5b622eeb598ac1d50c05cb8.png')] bg-cover bg-center">
                    <Container className="py-12">
                         <div className="text-center text-white">
                              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Tìm sân bóng phù hợp trong vài giây</h1>
                              <p className="mt-2 opacity-90">Lọc theo khu vực, giá, đánh giá và đặt sân ngay</p>
                              <div className="mt-6 max-w-2xl mx-auto">
                                   <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-500 w-5 h-5 pointer-events-none z-10" />
                                        <Input
                                             placeholder="Nhập từ khóa: tên sân, khu vực, địa chỉ..."
                                             value={searchQuery}
                                             onChange={(e) => setSearchQuery(e.target.value)}
                                             className="pl-12 h-12 rounded-xl bg-white/95 backdrop-blur border border-teal-300 focus-visible:border-teal-500 focus-visible:ring-0 focus-visible:outline-none text-teal-900  placeholder:text-gray-400"
                                        />
                                   </div>
                              </div>
                         </div>
                    </Container>
               </div>
               <Container className="py-8 bg-[url('https://mixivivu.com/section-background.png')] bg-cover bg-center bg-gray-50 relative" >
                    {/* SaaS-style header */}
                    <div className="mb-6">
                         <div className="flex items-center justify-between">
                              <div>
                                   <h1 className="text-2xl font-bold text-teal-800">Danh sách sân</h1>
                                   <div className="mt-1 h-1.5 w-24 bg-gradient-to-r from-teal-500 via-emerald-400 to-transparent rounded-full" />
                                   <p className="text-teal-700 mt-2">Dành cho {user ? "người dùng đã đăng nhập" : "khách truy cập"}</p>
                              </div>
                              <div className="hidden md:flex items-center gap-2">
                                   <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 shadow-sm">{filteredFields.length} kết quả</span>
                              </div>
                         </div>


                    </div>
                    {/* Search Header */}
                    <Card className="mb-6 border p-4 bg-white/60 backdrop-blur rounded-xl shadow-sm ring-1 ring-teal-100 border-teal-200"><CardContent>
                         <div className="flex flex-col lg:flex-row gap-4">
                              <div className="flex-1">
                                   <div className="relative">
                                        <Search color="teal" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none z-10" />
                                        <Input placeholder="Tìm kiếm sân bóng..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 border rounded-xl border-teal-300 focus-visible:border-teal-500 focus-visible:ring-0 focus-visible:outline-none" />
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
                                        setMapLocation(null);
                                        setForceList(false);
                                        setMapSearchKey(prev => prev + 1); // Force MapSearch reset
                                        // Clear localStorage search preset
                                        localStorage.removeItem('searchPreset');
                                   }}
                                   variant="outline"
                                   className="px-4 py-3 rounded-xl border border-red-200 text-red-700 hover:text-red-700 hover:bg-red-50"
                              >
                                   Xóa bộ lọc
                              </Button>
                         </div>

                         {/* Quick presets */}
                         <div className="mt-4 flex flex-wrap gap-2">
                              {quickPresets.map(p => (
                                   <button
                                        key={p.key}
                                        onClick={() => setActiveTab(p.key)}
                                        className={`px-3 py-1.5 rounded-full text-xs border ${activeTab === p.key ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-white text-teal-600 border-gray-200 hover:border-gray-300"}`}
                                   >
                                        <Sparkles className="w-3.5 h-3.5 inline mr-1" /> {p.label}
                                   </button>
                              ))}
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
                                                  onClick={() => { setSelectedRating(""); setSortBy("relevance"); }}
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

                                   <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                        <div>
                                             <label className="block text-sm font-medium text-teal-600 mb-2">Đang chọn</label>
                                             <div className="flex flex-wrap gap-2">
                                                  {searchQuery && (
                                                       <span className="px-2 py-1 rounded-full text-xs bg-teal-50 text-teal-700 border border-teal-200">Từ khóa: {searchQuery}</span>
                                                  )}
                                                  {selectedLocation && (
                                                       <span className="px-2 py-1 rounded-full text-xs bg-teal-50 text-teal-700 border border-teal-200">Khu vực</span>
                                                  )}
                                                  {selectedPrice && (
                                                       <span className="px-2 py-1 rounded-full text-xs bg-teal-50 text-teal-700 border border-teal-200">Giá</span>
                                                  )}
                                                  {selectedRating && selectedRating !== "all" && (
                                                       <span className="px-2 py-1 rounded-full text-xs bg-teal-50 text-teal-700 border border-teal-200">Đánh giá {selectedRating}+</span>
                                                  )}
                                                  {!searchQuery && !selectedLocation && !selectedPrice && (!selectedRating || selectedRating === "all") && (
                                                       <span className="text-xs text-gray-500">Chưa có bộ lọc nào được chọn</span>
                                                  )}
                                             </div>
                                        </div>
                                   </div>
                              </div>
                         )}
                    </CardContent></Card>

                    {/* Results Header */
                    }
                    <div className="flex justify-between items-center mb-6">
                         <div>
                              <h1 className="text-2xl font-bold text-teal-800">
                                   Tìm thấy {filteredFields.length} sân bóng
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

                    {/* Results */}
                    {isGroupedView ? (
                         <div className="space-y-10">
                              <div>
                                   <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg flex gap-1 font-semibold text-teal-800">
                                             <MapPin />
                                             <p> Gần bạn </p></h2>
                                        <Button
                                             type="button"
                                             onClick={() => { setActiveTab("near"); setForceList(true); setPage(1); }}

                                             className="px-3 py-1 rounded-2xl hover:border-b-2 bg-transparent hover:bg-teal-50 hover:border-teal-300 text-teal-700 text-sm"
                                        >
                                             Xem tất cả
                                        </Button>
                                   </div>
                                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                                        {nearGroup.map((field) => (
                                             <div key={field.id} className="group pt-3 px-3 border border-teal-100 bg-white rounded-xl shadow-sm overflow-hidden transition-all hover:scale-100 duration-200 hover:shadow-xl hover:ring-1 hover:ring-teal-100 h-full flex flex-col cursor-pointer" onClick={() => navigate(`/field/${field.id}`)}>
                                                  <div className="relative overflow-hidden">
                                                       <img src={field.image} alt={field.name} className="w-full h-48 object-cover rounded-xl" />
                                                       <div className="absolute top-4 right-4 flex space-x-2">
                                                            <div className="bg-white/95 backdrop-blur-md border border-teal-100 px-2 py-1 rounded-full text-xs font-semibold text-teal-600 shadow-sm flex items-center gap-1"><User size={16} /> <p>{field.availableSlots} slot trống </p></div>
                                                       </div>
                                                  </div>
                                                  <div className="px-2 py-3 flex-1 flex flex-col">
                                                       <div className="flex bg-teal-50 border border-teal-100 px-2 py-1 rounded-full w-fit items-center text-teal-700 mb-2">
                                                            <MapPin className="w-4 h-4 mr-1" />
                                                            <span className="text-xs font-semibold line-clamp-1">{field.location}</span>
                                                       </div>

                                                       <div className="flex items-center justify-between mb-3">
                                                            <h3 className="text-lg font-bold text-teal-800 line-clamp-1">{field.name}</h3>
                                                            <div className="flex items-center">
                                                                 <MapPin className="w-4 h-4 text-red-500 mr-1" />
                                                                 <span className="text-sm font-bold text-red-600">{field.distance}</span>
                                                            </div>

                                                       </div>
                                                       <div className="flex items-center gap-2 mb-4">
                                                            <span className="bg-teal-50 border border-teal-100 text-teal-600 px-2 py-1 rounded-full text-xs">{field.amenities[0]}</span>
                                                            {field.amenities.length > 1 && (
                                                                 <span className="bg-teal-50 border border-teal-100 text-teal-600 px-2 py-1 rounded-full text-xs">+{field.amenities.length - 1}</span>
                                                            )}
                                                       </div>
                                                       <div className="mt-auto flex items-center justify-between">
                                                            <div className="text-lg font-bold text-teal-500">{formatPrice(field.price)}/trận</div>
                                                            <Button
                                                                 type="button"
                                                                 onClick={(e) => {
                                                                      e.stopPropagation();
                                                                      handleBook(field.id);
                                                                 }}
                                                                 className="w-fit hover:scale-90 duration-200 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-full font-semibold transition-colors"
                                                            >
                                                                 Đặt sân
                                                            </Button>
                                                       </div>
                                                  </div>
                                             </div>
                                        ))}
                                   </div>
                              </div>
                              <div>
                                   <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-semibold text-teal-800">Giá tốt</h2>
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
                                             <div key={field.id} className="group pt-3 px-3 border border-teal-100 bg-white rounded-xl shadow-sm overflow-hidden transition-all hover:scale-100 duration-200 hover:shadow-xl hover:ring-1 hover:ring-teal-100 h-full flex flex-col cursor-pointer" onClick={() => navigate(`/field/${field.id}`)}>
                                                  <div className="relative overflow-hidden">
                                                       <img src={field.image} alt={field.name} className="w-full h-48 object-cover rounded-xl" />
                                                       <div className="absolute top-4 right-4 flex space-x-2">
                                                            <div className="bg-white/95 backdrop-blur-md border border-teal-100 px-2 py-1 rounded-full text-xs font-semibold text-teal-600 shadow-sm flex items-center gap-1"><User size={16} /> <p>{field.availableSlots} slot trống </p></div>
                                                       </div>
                                                  </div>
                                                  <div className="px-2 py-3 flex-1 flex flex-col">
                                                       <div className="flex bg-teal-50 border border-teal-100 px-2 py-1 rounded-full w-fit items-center text-teal-700 mb-2">
                                                            <MapPin className="w-4 h-4 mr-1" />
                                                            <span className="text-xs font-semibold line-clamp-1">{field.location}</span>
                                                       </div>

                                                       <div className="flex items-center justify-between mb-3">
                                                            <h3 className="text-lg font-bold text-teal-800 line-clamp-1">{field.name}</h3>
                                                            <div className="flex items-center">
                                                                 <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">Giá tốt nhất</span>
                                                            </div>
                                                       </div>
                                                       <div className="flex items-center gap-2 mb-4">
                                                            <span className="bg-teal-50 border border-teal-100 text-teal-600 px-2 py-1 rounded-full text-xs">{field.amenities[0]}</span>
                                                            {field.amenities.length > 1 && (
                                                                 <span className="bg-teal-50 border border-teal-100 text-teal-600 px-2 py-1 rounded-full text-xs">+{field.amenities.length - 1}</span>
                                                            )}
                                                       </div>
                                                       <div className="mt-auto flex items-center justify-between">
                                                            <div className="text-lg font-bold text-teal-500">{formatPrice(field.price)}/trận</div>
                                                            <Button
                                                                 type="button"
                                                                 onClick={(e) => {
                                                                      e.stopPropagation();
                                                                      handleBook(field.id);
                                                                 }}
                                                                 className="w-fit hover:scale-90 duration-200 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-full font-semibold transition-colors"
                                                            >
                                                                 Đặt sân
                                                            </Button>
                                                       </div>
                                                  </div>
                                             </div>
                                        ))}
                                   </div>
                              </div>
                              <div>
                                   <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-semibold text-teal-800">Đánh giá cao</h2>
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
                                             <div key={field.id} className="group pt-3 px-3 border border-teal-100 bg-white rounded-xl shadow-sm overflow-hidden transition-all hover:scale-100 duration-200 hover:shadow-xl hover:ring-1 hover:ring-teal-100 h-full flex flex-col cursor-pointer" onClick={() => navigate(`/field/${field.id}`)}>
                                                  <div className="relative overflow-hidden">
                                                       <img src={field.image} alt={field.name} className="w-full h-48 object-cover rounded-xl" />
                                                       <div className="absolute top-4 right-4 flex space-x-2">
                                                            <div className="bg-white/95 backdrop-blur-md border border-teal-100 px-2 py-1 rounded-full text-xs font-semibold text-teal-600 shadow-sm flex items-center gap-1"><User size={16} /> <p>{field.availableSlots} slot trống </p></div>
                                                       </div>
                                                  </div>
                                                  <div className="px-2 py-3 flex-1 flex flex-col">
                                                       <div className="flex bg-teal-50 border border-teal-100 px-2 py-1 rounded-full w-fit items-center text-teal-700 mb-2">
                                                            <MapPin className="w-4 h-4 mr-1" />
                                                            <span className="text-xs font-semibold line-clamp-1">{field.location}</span>
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
                                                            <span className="bg-teal-50 border border-teal-100 text-teal-600 px-2 py-1 rounded-full text-xs">{field.amenities[0]}</span>
                                                            {field.amenities.length > 1 && (
                                                                 <span className="bg-teal-50 border border-teal-100 text-teal-600 px-2 py-1 rounded-full text-xs">+{field.amenities.length - 1}</span>
                                                            )}
                                                       </div>
                                                       <div className="mt-auto flex items-center justify-between">
                                                            <div className="text-lg font-bold text-teal-500">{formatPrice(field.price)}/trận</div>
                                                            <Button
                                                                 type="button"
                                                                 onClick={(e) => {
                                                                      e.stopPropagation();
                                                                      handleBook(field.id);
                                                                 }}
                                                                 className="w-fit hover:scale-90 duration-200 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-full font-semibold transition-colors"
                                                            >
                                                                 Đặt sân
                                                            </Button>
                                                       </div>
                                                  </div>
                                             </div>
                                        ))}
                                   </div>
                              </div>
                         </div>
                    ) :
                         viewMode === "grid" ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                                   {pageItems.map((field) => (
                                        <div key={field.id} className="group bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-xl hover:ring-1 hover:ring-teal-100 h-full flex flex-col cursor-pointer" onClick={() => navigate(`/field/${field.id}`)}>
                                             <div className="relative overflow-hidden">
                                                  <img
                                                       src={field.image}
                                                       alt={field.name}
                                                       className="w-full h-40 object-cover transition-transform duration-300 ease-out group-hover:scale-105"
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
                                                            {field.availableSlots} slot trống
                                                       </div>
                                                  </div>
                                             </div>
                                             <div className="p-5 flex-1 flex flex-col">
                                                  <h3 className="text-xl font-semibold text-teal-800 mb-2">{field.name}</h3>
                                                  <div className="flex items-center text-teal-700 mb-2">
                                                       <MapPin className="w-4 h-4 mr-1" />
                                                       <span className="text-sm">{field.location}</span>
                                                  </div>
                                                  <div className="flex items-center justify-between mb-4">
                                                       <div className="flex items-center">
                                                            {activeTab === "near" ? (
                                                                 <>
                                                                      <MapPin className="w-4 h-4 text-red-500 mr-1" />
                                                                      <span className="text-sm font-bold text-red-600">{field.distance}</span>
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
                                                       <div className={`text-lg font-bold ${activeTab === "best-price" ? "text-red-500" : "text-teal-600"}`}>{formatPrice(field.price)}/trận</div>
                                                  </div>
                                                  <div className="flex items-center gap-2 mb-4">
                                                       <span className="bg-teal-50 text-teal-700 px-2 py-1 rounded-full text-xs border border-teal-200">{field.amenities[0]}</span>
                                                       {field.amenities.length > 1 && (
                                                            <span className="bg-teal-50 text-teal-700 px-2 py-1 rounded-full text-xs border border-teal-200">+{field.amenities.length - 1}</span>
                                                       )}
                                                  </div>
                                                  <div className="mt-auto">
                                                       <Button
                                                            type="button"
                                                            onClick={(e) => {
                                                                 e.stopPropagation();
                                                                 handleBook(field.id);
                                                            }}
                                                            className="w-full bg-teal-500 hover:bg-teal-600 text-white py-2 px-4 rounded-xl font-semibold transition-colors"
                                                       >
                                                            Đặt sân
                                                       </Button>
                                                  </div>
                                             </div>
                                        </div>
                                   ))}
                              </div>
                         ) : (
                              <div className="space-y-4">
                                   {pageItems.map((field) => (
                                        <div key={field.id} className="bg-white px-5 py-4 rounded-3xl shadow-lg overflow-hidden hover:scale-105 duration-300 transition-all border border-teal-100 hover:border-teal-200 cursor-pointer" onClick={() => navigate(`/field/${field.id}`)}>
                                             <div className="flex">
                                                  <div className="w-96 h-52 flex-shrink-0">
                                                       <img
                                                            src={field.image}
                                                            alt={field.name}
                                                            className="w-full h-full rounded-2xl object-cover"
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
                                                            <div className="text-xl font-bold text-teal-600">{formatPrice(field.price)}/trận</div>
                                                       </div>
                                                       <div className="flex flex-wrap gap-2 mb-7">
                                                            {field.amenities.map((amenity, index) => (
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
                                                                 <p> {field.availableSlots} slot trống • {field.distance} </p>
                                                            </div>
                                                            <div className="flex space-x-2">
                                                                 <Button
                                                                      type="button"
                                                                      onClick={(e) => {
                                                                           e.stopPropagation();
                                                                           handleBook(field.id);
                                                                      }}
                                                                      className="bg-teal-500 hover:bg-teal-600 text-white py-1 px-4 rounded-xl font-semibold"
                                                                 >
                                                                      Đặt sân
                                                                 </Button>
                                                            </div>
                                                       </div>
                                                  </div>
                                             </div>
                                        </div>
                                   ))}
                              </div>
                         )}

                    {/* Pagination */}
                    {filteredFields.length > 0 && !isGroupedView && (
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
                                                                 : "border-teal-200 text-teal-600 hover:bg-teal-50 hover:border-teal-300"
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
                                                            <span key="ellipsis2" className="px-2 text-teal-400">...</span>
                                                       );
                                                  }
                                                  pages.push(
                                                       <Button
                                                            key={totalPages}
                                                            onClick={() => setPage(totalPages)}
                                                            className="px-3 py-1 rounded-full border border-teal-200 text-teal-600 hover:bg-teal-50 hover:border-teal-300 transition-colors"
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

                    {filteredFields.length === 0 && (
                         <div className="text-center py-12">
                              <div className="text-gray-400 mb-4">
                                   <Search className="w-16 h-16 mx-auto" />
                              </div>
                              <h3 className="text-lg font-semibold text-teal-800 mb-2">Không tìm thấy sân bóng</h3>
                              <p className="text-teal-700 mb-4">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                              <button
                                   onClick={() => {
                                        setSearchQuery("");
                                        setSelectedLocation("");
                                        setSelectedPrice("");
                                        setSelectedRating("");
                                        setActiveTab("all");
                                        setViewMode("grid");
                                        setPage(1);
                                        setMapLocation(null);
                                        setForceList(false);
                                        setMapSearchKey(prev => prev + 1); // Force MapSearch reset
                                        // Clear localStorage search preset
                                        localStorage.removeItem('searchPreset');
                                   }}
                                   className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-xl font-semibold transition-colors"
                              >
                                   Xóa bộ lọc
                              </button>
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
