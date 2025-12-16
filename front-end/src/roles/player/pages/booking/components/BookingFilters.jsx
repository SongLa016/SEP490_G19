import React from "react";
import { Search, X } from "lucide-react";
import { Input, Button, Select, SelectTrigger, SelectContent, SelectItem, SelectValue, DatePicker } from "../../../../../shared/components/ui";

/**
 * Component bộ lọc cho danh sách booking
 * Trang: Lịch sử đặt sân (BookingHistory)
 * Vị trí: Phần đầu trang, trên danh sách booking
 * 
 * Chức năng:
 * - Tìm kiếm theo mã booking, tên sân, địa chỉ
 * - Lọc theo trạng thái (chờ xác nhận, đã xác nhận, hoàn tất, đã hủy, hết hạn)
 * - Lọc theo khoảng ngày (từ ngày - đến ngày)
 * - Sắp xếp theo mã booking hoặc giá
 */
export default function BookingFilters({
     query,              // Từ khóa tìm kiếm
     setQuery,           // Hàm cập nhật từ khóa tìm kiếm
     statusFilter,       // Trạng thái đang lọc
     setStatusFilter,    // Hàm cập nhật trạng thái lọc
     dateFrom,           // Ngày bắt đầu lọc
     setDateFrom,        // Hàm cập nhật ngày bắt đầu
     dateTo,             // Ngày kết thúc lọc
     setDateTo,          // Hàm cập nhật ngày kết thúc
     sortBy,             // Kiểu sắp xếp hiện tại
     setSortBy,          // Hàm cập nhật kiểu sắp xếp
     onReset             // Hàm xử lý khi nhấn nút reset bộ lọc (nút X)
}) {
     return (
          <>
               {/* Search Bar */}
               <div className="pt-4 flex items-center justify-between gap-3 mb-4">
                    <div className="relative w-full">
                         <Search color="teal" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none z-10" />
                         <Input
                              placeholder="Tìm theo mã, tên sân, địa chỉ..."
                              value={query}
                              onChange={(e) => setQuery(e.target.value)}
                              className="pl-10 pr-10 border rounded-xl border-teal-300 focus-visible:border-teal-500 focus-visible:ring-0 focus-visible:outline-none"
                         />
                         {query && (
                              <Button
                                   onClick={() => setQuery("")}
                                   className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0 h-auto bg-transparent border-0 hover:bg-transparent"
                              >
                                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                   </svg>
                              </Button>
                         )}
                    </div>
                    <div className="flex justify-end gap-2">
                         <Button
                              onClick={onReset}
                              variant="outline"
                              className="px-4 py-2 rounded-xl border border-red-200 text-red-700 hover:text-red-700 hover:bg-red-50"
                         >
                              <X className="w-4 h-4" />
                         </Button>
                    </div>
               </div>

               {/* Filter Controls */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <div>
                         <label className="block text-sm font-medium text-teal-600 mb-2">Trạng thái</label>
                         <Select value={statusFilter} onValueChange={setStatusFilter}>
                              <SelectTrigger className="rounded-xl border-teal-300 focus:border-teal-500">
                                   <SelectValue placeholder="Tất cả" />
                              </SelectTrigger>
                              <SelectContent>
                                   <SelectItem value="all">Tất cả</SelectItem>
                                   <SelectItem value="pending">Chờ xác nhận</SelectItem>
                                   <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                                   <SelectItem value="completed">Hoàn tất</SelectItem>
                                   <SelectItem value="cancelled">Đã hủy</SelectItem>
                                   <SelectItem value="expired">Hết hạn</SelectItem>
                              </SelectContent>
                         </Select>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-teal-600 mb-2">Từ ngày</label>
                         <DatePicker
                              value={dateFrom}
                              onChange={setDateFrom}
                              className="rounded-xl border-teal-300 focus:border-teal-500"
                         />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-teal-600 mb-2">Đến ngày</label>
                         <DatePicker
                              value={dateTo}
                              onChange={setDateTo}
                              className="rounded-xl border-teal-300 focus:border-teal-500"
                         />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-teal-600 mb-2">Sắp xếp</label>
                         <Select value={sortBy} onValueChange={setSortBy}>
                              <SelectTrigger className="rounded-xl border-teal-300 focus:border-teal-500">
                                   <SelectValue placeholder="Mã booking (#)" />
                              </SelectTrigger>
                              <SelectContent>
                                   <SelectItem value="newest">Mã booking mới nhất (#↓)</SelectItem>
                                   <SelectItem value="oldest">Mã booking cũ nhất (#↑)</SelectItem>
                                   <SelectItem value="price-asc">Giá tăng dần</SelectItem>
                                   <SelectItem value="price-desc">Giá giảm dần</SelectItem>
                              </SelectContent>
                         </Select>
                    </div>
               </div>
          </>
     );
}