import { useState, useEffect } from "react";
import { Search, MapPin, Star, Clock, Filter, Grid, List, Heart, Eye } from "lucide-react";
import { Section, Container, Card, CardContent, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui";
import { useNavigate } from "react-router-dom";

export default function FieldSearch({ user }) {
     const navigate = useNavigate();
     const [searchQuery, setSearchQuery] = useState("");
     const [selectedLocation, setSelectedLocation] = useState("all");
     const [selectedPrice, setSelectedPrice] = useState("all");
     const [selectedRating, setSelectedRating] = useState("all");
     const [viewMode, setViewMode] = useState("grid"); // grid or list
     const [showFilters, setShowFilters] = useState(false);
     const [sortBy, setSortBy] = useState("relevance");

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
               location: "Quận 1, TP.HCM",
               address: "123 Đường ABC, Phường Bến Nghé",
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
               location: "Quận 3, TP.HCM",
               address: "456 Đường XYZ, Phường Võ Thị Sáu",
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
               location: "Quận 7, TP.HCM",
               address: "789 Đường DEF, Phường Tân Phú",
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
               location: "Quận 10, TP.HCM",
               address: "321 Đường GHI, Phường 15",
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
               location: "Quận 1, TP.HCM",
               address: "654 Đường JKL, Phường Đa Kao",
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

     useEffect(() => {
          // Apply preset from quick categories (if any)
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
               }
          } catch { }

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

          setFilteredFields(filtered);
     }, [searchQuery, selectedLocation, selectedPrice, selectedRating, sortBy, fields]);

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

     const handleBook = () => {
          if (!user) {
               alert("Bạn cần đăng nhập để đặt sân.");
               navigate("/auth");
               return;
          }
          navigate("/booking");
     };

     const formatPrice = (price) => {
          return new Intl.NumberFormat('vi-VN', {
               style: 'currency',
               currency: 'VND'
          }).format(price);
     };

     return (
          <Section className="min-h-screen bg-gray-50">
               <Container className="py-8">
                    <div className="mb-6">
                         <h1 className="text-2xl font-bold text-gray-900">Danh sách sân</h1>
                    </div>
                    {/* Search Header */}
                    <Card className="mb-6"><CardContent>
                         <div className="flex flex-col lg:flex-row gap-4">
                              <div className="flex-1">
                                   <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <Input placeholder="Tìm kiếm sân bóng..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                                   </div>
                              </div>
                              <div className="lg:w-48">
                                   <Select value={getLocationValue()} onValueChange={handleLocationChange}>
                                        <SelectTrigger>
                                             <SelectValue placeholder="Tất cả khu vực" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="all">Tất cả khu vực</SelectItem>
                                             <SelectItem value="Quận 1">Quận 1</SelectItem>
                                             <SelectItem value="Quận 3">Quận 3</SelectItem>
                                             <SelectItem value="Quận 7">Quận 7</SelectItem>
                                             <SelectItem value="Quận 10">Quận 10</SelectItem>
                                        </SelectContent>
                                   </Select>
                              </div>
                              <div className="lg:w-48">
                                   <Select value={getPriceValue()} onValueChange={handlePriceChange}>
                                        <SelectTrigger>
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
                              <button
                                   onClick={() => setShowFilters(!showFilters)}
                                   className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg transition-colors flex items-center"
                              >
                                   <Filter className="w-5 h-5 mr-2" />
                                   Bộ lọc
                              </button>
                         </div>

                         {/* Advanced Filters */}
                         {showFilters && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-2">Đánh giá tối thiểu</label>
                                             <Select value={getRatingValue()} onValueChange={handleRatingChange}>
                                                  <SelectTrigger>
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
                                             <label className="block text-sm font-medium text-gray-700 mb-2">Sắp xếp theo</label>
                                             <Select value={sortBy} onValueChange={setSortBy}>
                                                  <SelectTrigger>
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
                                   </div>
                              </div>
                         )}
                    </CardContent></Card>

                    {/* Results Header */}
                    <div className="flex justify-between items-center mb-6">
                         <div>
                              <h1 className="text-2xl font-bold text-gray-900">
                                   Tìm thấy {filteredFields.length} sân bóng
                              </h1>
                              <p className="text-gray-600">
                                   {searchQuery && `Kết quả cho "${searchQuery}"`}
                              </p>
                         </div>
                         <div className="flex items-center space-x-2">
                              <button
                                   onClick={() => setViewMode("grid")}
                                   className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-teal-500 text-white" : "bg-gray-100 text-gray-600"}`}
                              >
                                   <Grid className="w-5 h-5" />
                              </button>
                              <button
                                   onClick={() => setViewMode("list")}
                                   className={`p-2 rounded-lg ${viewMode === "list" ? "bg-teal-500 text-white" : "bg-gray-100 text-gray-600"}`}
                              >
                                   <List className="w-5 h-5" />
                              </button>
                         </div>
                    </div>

                    {/* Results */}
                    {viewMode === "grid" ? (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {filteredFields.map((field) => (
                                   <div key={field.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                        <div className="relative">
                                             <img
                                                  src={field.image}
                                                  alt={field.name}
                                                  className="w-full h-48 object-cover"
                                             />
                                             <div className="absolute top-4 right-4 flex space-x-2">
                                                  <button
                                                       onClick={() => handleToggleFavorite(field.id)}
                                                       className={`p-2 rounded-full ${field.isFavorite ? "bg-red-500 text-white" : "bg-white text-gray-600"}`}
                                                  >
                                                       <Heart className="w-4 h-4" />
                                                  </button>
                                                  <div className="bg-white px-2 py-1 rounded-full text-sm font-semibold text-green-600">
                                                       {field.availableSlots} slot trống
                                                  </div>
                                             </div>
                                        </div>
                                        <div className="p-6">
                                             <h3 className="text-xl font-semibold text-gray-900 mb-2">{field.name}</h3>
                                             <div className="flex items-center text-gray-600 mb-2">
                                                  <MapPin className="w-4 h-4 mr-1" />
                                                  <span className="text-sm">{field.location}</span>
                                             </div>
                                             <div className="flex items-center justify-between mb-4">
                                                  <div className="flex items-center">
                                                       <Star className="w-4 h-4 text-teal-400 mr-1" />
                                                       <span className="text-sm font-semibold">{field.rating}</span>
                                                       <span className="text-sm text-gray-500 ml-1">({field.reviewCount})</span>
                                                  </div>
                                                  <div className="text-lg font-bold text-teal-500">{formatPrice(field.price)}/giờ</div>
                                             </div>
                                             <div className="flex flex-wrap gap-2 mb-4">
                                                  {field.amenities.slice(0, 3).map((amenity, index) => (
                                                       <span
                                                            key={index}
                                                            className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                                                       >
                                                            {amenity}
                                                       </span>
                                                  ))}
                                                  {field.amenities.length > 3 && (
                                                       <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                                                            +{field.amenities.length - 3} khác
                                                       </span>
                                                  )}
                                             </div>
                                             <div className="flex space-x-2">
                                                  <button
                                                       onClick={() => navigate(`/field/${field.id}`)}
                                                       className="flex-1 bg-teal-500 hover:bg-teal-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                                                  >
                                                       Xem chi tiết
                                                  </button>
                                                  <button
                                                       onClick={handleBook}
                                                       className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                                                  >
                                                       Đặt sân
                                                  </button>
                                             </div>
                                        </div>
                                   </div>
                              ))}
                         </div>
                    ) : (
                         <div className="space-y-4">
                              {filteredFields.map((field) => (
                                   <div key={field.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                        <div className="flex">
                                             <div className="w-64 h-48 flex-shrink-0">
                                                  <img
                                                       src={field.image}
                                                       alt={field.name}
                                                       className="w-full h-full object-cover"
                                                  />
                                             </div>
                                             <div className="flex-1 p-6">
                                                  <div className="flex justify-between items-start mb-2">
                                                       <h3 className="text-xl font-semibold text-gray-900">{field.name}</h3>
                                                       <button
                                                            onClick={() => handleToggleFavorite(field.id)}
                                                            className={`p-2 rounded-full ${field.isFavorite ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600"}`}
                                                       >
                                                            <Heart className="w-4 h-4" />
                                                       </button>
                                                  </div>
                                                  <div className="flex items-center text-gray-600 mb-2">
                                                       <MapPin className="w-4 h-4 mr-1" />
                                                       <span className="text-sm">{field.address}</span>
                                                  </div>
                                                  <div className="flex items-center justify-between mb-4">
                                                       <div className="flex items-center">
                                                            <Star className="w-4 h-4 text-teal-400 mr-1" />
                                                            <span className="text-sm font-semibold">{field.rating}</span>
                                                            <span className="text-sm text-gray-500 ml-1">({field.reviewCount} đánh giá)</span>
                                                       </div>
                                                       <div className="text-lg font-bold text-teal-500">{formatPrice(field.price)}/giờ</div>
                                                  </div>
                                                  <div className="flex flex-wrap gap-2 mb-4">
                                                       {field.amenities.map((amenity, index) => (
                                                            <span
                                                                 key={index}
                                                                 className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                                                            >
                                                                 {amenity}
                                                            </span>
                                                       ))}
                                                  </div>
                                                  <div className="flex justify-between items-center">
                                                       <div className="text-sm text-gray-500">
                                                            <Clock className="w-4 h-4 inline mr-1" />
                                                            {field.availableSlots} slot trống • {field.distance}
                                                       </div>
                                                       <div className="flex space-x-2">
                                                            <button
                                                                 onClick={() => navigate(`/field/${field.id}`)}
                                                                 className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold transition-colors flex items-center"
                                                            >
                                                                 <Eye className="w-4 h-4 mr-2" />
                                                                 Xem chi tiết
                                                            </button>
                                                            <button
                                                                 onClick={handleBook}
                                                                 className="bg-teal-500 hover:bg-teal-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                                                            >
                                                                 Đặt sân
                                                            </button>
                                                       </div>
                                                  </div>
                                             </div>
                                        </div>
                                   </div>
                              ))}
                         </div>
                    )}

                    {filteredFields.length === 0 && (
                         <div className="text-center py-12">
                              <div className="text-gray-400 mb-4">
                                   <Search className="w-16 h-16 mx-auto" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy sân bóng</h3>
                              <p className="text-gray-600 mb-4">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                              <button
                                   onClick={() => {
                                        setSearchQuery("");
                                        setSelectedLocation("");
                                        setSelectedPrice("");
                                        setSelectedRating("");
                                   }}
                                   className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                              >
                                   Xóa bộ lọc
                              </button>
                         </div>
                    )}
               </Container>
          </Section>
     );
}
