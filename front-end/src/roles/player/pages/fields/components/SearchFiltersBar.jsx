import { Search, Map, RefreshCcw } from "lucide-react";
import FilterListIcon from '@mui/icons-material/FilterList';

import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button } from "../../../../../shared/components/ui";

export default function SearchFiltersBar({
     searchQuery,
     setSearchQuery,
     selectedLocation,
     handleLocationChange,
     getLocationValue,
     districtOptions = [],
     selectedPrice,
     handlePriceChange,
     getPriceValue,
     showFilters,
     setShowFilters,
     setShowMapSearch,
     onResetFilters
}) {
     return (
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
                              {districtOptions.length === 0 && (
                                   <SelectItem value="__loading__" disabled>Đang tải khu vực...</SelectItem>
                              )}
                              {districtOptions.map((district) => (
                                   <SelectItem key={district} value={district}>{district}</SelectItem>
                              ))}
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
                    className="px-4 py-2 rounded-xl transition-all bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 hover:text-teal-800 flex items-center shadow-sm"
               >
                    <FilterListIcon className="w-5 h-5 mr-2" />
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
                    onClick={onResetFilters}
                    variant="outline"
                    className="px-4 py-3 rounded-xl border border-red-200 text-red-700 hover:text-red-700 hover:bg-red-50"
               >
                    <RefreshCcw className="w-4 h-4" />
               </Button>
          </div>
     );
}

