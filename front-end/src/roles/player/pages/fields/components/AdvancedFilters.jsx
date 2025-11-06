import { motion, AnimatePresence } from "framer-motion";
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
     return (
          <AnimatePresence>
               {showFilters && (
                    <motion.div
                         className="mt-4 pt-4 border-t border-teal-100 overflow-hidden"
                         initial={{ height: 0, opacity: 0 }}
                         animate={{ height: "auto", opacity: 1 }}
                         exit={{ height: 0, opacity: 0 }}
                         transition={{
                              height: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
                              opacity: { duration: 0.3, ease: "easeInOut" }
                         }}
                    >
                         <motion.div 
                              className="flex items-start justify-between gap-4"
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                         >
                              <div>
                                   <motion.div 
                                        className="flex items-center gap-2"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.05, duration: 0.3 }}
                                   >
                                        <motion.div
                                             animate={{ rotate: [0, 360] }}
                                             transition={{ duration: 0.6, ease: "easeOut" }}
                                        >
                                             <TuneIcon className="w-4 h-4 text-teal-600" />
                                        </motion.div>
                                        <h2 className="text-base font-semibold text-teal-800">Bộ lọc nâng cao</h2>
                                   </motion.div>
                                   <p className="text-xs text-gray-500 mt-1">Tinh chỉnh kết quả theo đánh giá và sắp xếp.</p>
                              </div>
                              <div className="flex items-center gap-2">
                                   <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                   >
                                        <Button
                                             onClick={onResetAdvancedFilters}
                                             variant="outline"
                                             className="h-9 px-3 rounded-xl border border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800"
                                        >
                                             Đặt lại
                                        </Button>
                                   </motion.div>
                                   <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                   >
                                        <Button
                                             onClick={() => setShowFilters(false)}
                                             className="h-9 px-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white"
                                        >
                                             Áp dụng
                                        </Button>
                                   </motion.div>
                              </div>
                         </motion.div>

                         <motion.div 
                              className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.2, duration: 0.3 }}
                         >
                         <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1, duration: 0.3 }}
                         >
                              <label className="flex items-center gap-1 text-sm font-medium text-teal-600 mb-2">
                                   <CalendarTodayIcon className="w-4 h-4" />
                                   Ngày
                              </label>
                              <DatePicker value={date} onChange={setDate} className="border border-teal-300 rounded-xl focus-visible:border-teal-500 focus-visible:ring-0" />
                         </motion.div>
                         <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.15, duration: 0.3 }}
                         >
                              <label className="flex items-center gap-1 text-sm font-medium text-teal-600 mb-2">
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
                         </motion.div>
                         <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2, duration: 0.3 }}
                         >
                              <label className="flex items-center gap-1 text-sm font-medium text-teal-600 mb-2">
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
                         </motion.div>
                         <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.25, duration: 0.3 }}
                         >
                              <label className="flex items-center gap-1 text-sm font-medium text-teal-600 mb-2">
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
                         </motion.div>
                              <motion.div 
                                   className="md:col-span-4"
                                   initial={{ opacity: 0, y: 10 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   transition={{ delay: 0.3, duration: 0.3 }}
                              >
                                   <label className="block text-sm font-medium text-teal-600 mb-2">Đang chọn</label>
                                   <motion.div 
                                        className="flex flex-wrap gap-2"
                                        layout
                                   >
                                        <AnimatePresence>
                                             {searchQuery && (
                                                  <motion.span
                                                       key="search-query"
                                                       initial={{ opacity: 0, scale: 0.8 }}
                                                       animate={{ opacity: 1, scale: 1 }}
                                                       exit={{ opacity: 0, scale: 0.8 }}
                                                       className="px-2 py-1 rounded-full text-xs bg-teal-50 text-teal-700 border border-teal-200"
                                                  >
                                                       Từ khóa: {searchQuery}
                                                  </motion.span>
                                             )}
                                             {selectedLocation && (
                                                  <motion.span
                                                       key="selected-location"
                                                       initial={{ opacity: 0, scale: 0.8 }}
                                                       animate={{ opacity: 1, scale: 1 }}
                                                       exit={{ opacity: 0, scale: 0.8 }}
                                                       className="px-2 py-1 rounded-full text-xs bg-teal-50 text-teal-700 border border-teal-200"
                                                  >
                                                       Khu vực
                                                  </motion.span>
                                             )}
                                             {date && (
                                                  <motion.span
                                                       key="date"
                                                       initial={{ opacity: 0, scale: 0.8 }}
                                                       animate={{ opacity: 1, scale: 1 }}
                                                       exit={{ opacity: 0, scale: 0.8 }}
                                                       className="px-2 py-1 rounded-full text-xs bg-teal-50 text-teal-700 border border-teal-200"
                                                  >
                                                       Ngày: {date}
                                                  </motion.span>
                                             )}
                                             {slotId && (
                                                  <motion.span
                                                       key="slot-id"
                                                       initial={{ opacity: 0, scale: 0.8 }}
                                                       animate={{ opacity: 1, scale: 1 }}
                                                       exit={{ opacity: 0, scale: 0.8 }}
                                                       className="px-2 py-1 rounded-full text-xs bg-teal-50 text-teal-700 border border-teal-200"
                                                  >
                                                       Slot: {timeSlots.find(s => String(s.slotId) === String(slotId))?.name}
                                                  </motion.span>
                                             )}
                                             {selectedPrice && (
                                                  <motion.span
                                                       key="selected-price"
                                                       initial={{ opacity: 0, scale: 0.8 }}
                                                       animate={{ opacity: 1, scale: 1 }}
                                                       exit={{ opacity: 0, scale: 0.8 }}
                                                       className="px-2 py-1 rounded-full text-xs bg-teal-50 text-teal-700 border border-teal-200"
                                                  >
                                                       Giá
                                                  </motion.span>
                                             )}
                                             {selectedRating && selectedRating !== "all" && (
                                                  <motion.span
                                                       key="selected-rating"
                                                       initial={{ opacity: 0, scale: 0.8 }}
                                                       animate={{ opacity: 1, scale: 1 }}
                                                       exit={{ opacity: 0, scale: 0.8 }}
                                                       className="px-2 py-1 rounded-full text-xs bg-teal-50 text-teal-700 border border-teal-200"
                                                  >
                                                       Đánh giá {selectedRating}+
                                                  </motion.span>
                                             )}
                                             {!searchQuery && !selectedLocation && !selectedPrice && (!selectedRating || selectedRating === "all") && !slotId && (
                                                  <motion.span
                                                       key="no-filters"
                                                       initial={{ opacity: 0 }}
                                                       animate={{ opacity: 1 }}
                                                       exit={{ opacity: 0 }}
                                                       className="text-xs text-gray-500"
                                                  >
                                                       Chưa có bộ lọc nào được chọn
                                                  </motion.span>
                                             )}
                                        </AnimatePresence>
                                   </motion.div>
                              </motion.div>
                         </motion.div>
                    </motion.div>
               )}
          </AnimatePresence>
     );
}

