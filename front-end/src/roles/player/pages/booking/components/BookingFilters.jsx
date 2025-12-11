import React from "react";
import { Search, X } from "lucide-react";
import { Input, Button, Select, SelectTrigger, SelectContent, SelectItem, SelectValue, DatePicker } from "../../../../../shared/components/ui";

export default function BookingFilters({
     query,
     setQuery,
     statusFilter,
     setStatusFilter,
     dateFrom,
     setDateFrom,
     dateTo,
     setDateTo,
     sortBy,
     setSortBy,
     onReset
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