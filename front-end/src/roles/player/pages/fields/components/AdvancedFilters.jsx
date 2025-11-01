import { SlidersHorizontal } from "lucide-react";
import TuneIcon from '@mui/icons-material/Tune';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StarRateIcon from '@mui/icons-material/StarRate';
import SortIcon from '@mui/icons-material/Sort';
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, DatePicker } from "../../../../../shared/components/ui";

export default function AdvancedFilters({
     showFilters,
     setShowFilters,
     date,
     setDate,
     slotId,
     setSlotId,
     getSlotValue,
     timeSlots,
     selectedRating,
     handleRatingChange,
     getRatingValue,
     sortBy,
     setSortBy,
     searchQuery,
     selectedLocation,
     selectedPrice,
     onResetAdvancedFilters
}) {
     if (!showFilters) return null;

     return (
          <div className="mt-4 pt-4 border-t border-teal-100">
               <div className="flex items-start justify-between gap-4">
                    <div>
                         <div className="flex items-center gap-2">
                              <TuneIcon className="w-4 h-4 text-teal-600" />
                              <h2 className="text-base font-semibold text-teal-800">Bộ lọc nâng cao</h2>
                         </div>
                         <p className="text-xs text-gray-500 mt-1">Tinh chỉnh kết quả theo đánh giá và sắp xếp.</p>
                    </div>
                    <div className="flex items-center gap-2">
                         <Button
                              onClick={onResetAdvancedFilters}
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
                         <label className="block text-sm font-medium text-teal-600 mb-2 flex items-center gap-1">
                              <CalendarTodayIcon className="w-4 h-4" />
                              Ngày
                         </label>
                         <DatePicker value={date} onChange={setDate} className="border border-teal-300 rounded-xl focus-visible:border-teal-500 focus-visible:ring-0" />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-teal-600 mb-2 flex items-center gap-1">
                              <AccessTimeIcon className="w-4 h-4" />
                              Slot
                         </label>
                         <Select value={getSlotValue()} onValueChange={(v) => setSlotId(v === "all" ? "" : v)}>
                              <SelectTrigger className="border border-teal-300 rounded-xl focus-visible:border-teal-500 focus-visible:ring-0 bg-white/80">
                                   <SelectValue placeholder="Tất cả slot" />
                              </SelectTrigger>
                              <SelectContent>
                                   <SelectItem value="all">Tất cả slot</SelectItem>
                                   {Array.isArray(timeSlots) && timeSlots.map((s) => (
                                        <SelectItem key={s.slotId} value={String(s.slotId)}>{s.name}</SelectItem>
                                   ))}
                              </SelectContent>
                         </Select>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-teal-600 mb-2 flex items-center gap-1">
                              <StarRateIcon className="w-4 h-4" />
                              Đánh giá tối thiểu
                         </label>
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
                         <label className="block text-sm font-medium text-teal-600 mb-2 flex items-center gap-1">
                              <SortIcon className="w-4 h-4" />
                              Sắp xếp theo
                         </label>
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
     );
}

