import React from "react";
import { Search, Calendar, AlertCircle, MapPin, Filter } from "lucide-react";
import {
  Card,
  Input,
  DatePicker,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
} from "../../../../../shared/components/ui";

/**
 * Component bộ lọc tìm kiếm booking cho Owner
 * 
 * Chức năng:
 * - Tìm kiếm theo tên, SĐT, email khách hàng
 * - Lọc theo ngày đặt sân
 * - Lọc theo trạng thái booking (pending, confirmed, cancelled, completed)
 * - Lọc theo sân
 * - Nút xóa tất cả bộ lọc
 * 
 * @param {Object} props - Props của component
 * @param {string} props.selectedDate - Ngày đang lọc
 * @param {string} props.statusFilter - Trạng thái đang lọc
 * @param {string} props.fieldFilter - Sân đang lọc
 * @param {string} props.searchTerm - Từ khóa tìm kiếm
 * @param {Array} props.statusOptions - Danh sách options trạng thái
 * @param {Array} props.fields - Danh sách sân
 * @param {Function} props.onDateChange - Callback thay đổi ngày
 * @param {Function} props.onStatusChange - Callback thay đổi trạng thái
 * @param {Function} props.onFieldChange - Callback thay đổi sân
 * @param {Function} props.onSearchChange - Callback thay đổi từ khóa
 * @param {Function} props.onClearFilters - Callback xóa tất cả bộ lọc
 */
export default function OwnerFilters({
  selectedDate,
  statusFilter,
  fieldFilter,
  searchTerm,
  statusOptions,
  fields,
  onDateChange,
  onStatusChange,
  onFieldChange,
  onSearchChange,
  onClearFilters,
}) {
  return (
    <Card className="p-6 rounded-2xl shadow-lg border border-teal-200 bg-gradient-to-br from-white to-teal-50/30">
      <h3 className="text-lg font-semibold text-teal-800 mb-4 flex items-center">
        <Filter className="w-5 h-5 mr-2" />
        Bộ lọc tìm kiếm
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="text-sm font-semibold text-teal-700 mb-2 flex items-center">
            <Search className="w-4 h-4 mr-1" />
            Tìm kiếm
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-500 w-4 h-4" />
            <Input
              placeholder="Tên, SĐT, email..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 rounded-2xl border-teal-200 focus:border-teal-500 focus:ring-teal-500"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-teal-700 mb-2 flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            Ngày
          </label>
          <DatePicker
            value={selectedDate}
            onChange={onDateChange}
            placeholder="Chọn ngày"
            minDate={new Date().toISOString().split("T")[0]}
            className="rounded-2xl border-teal-200 focus:border-teal-500 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-teal-700 mb-2 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            Trạng thái
          </label>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="rounded-2xl border-teal-200 focus:border-teal-500">
              <SelectValue placeholder="Chọn trạng thái" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-semibold text-teal-700 mb-2 flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            Sân
          </label>
          <Select value={fieldFilter} onValueChange={onFieldChange}>
            <SelectTrigger className="rounded-2xl border-teal-200 focus:border-teal-500">
              <SelectValue placeholder="Chọn sân" />
            </SelectTrigger>
            <SelectContent>
              {fields.map((field) => (
                <SelectItem key={field.value} value={field.value}>
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center justify-end mt-4">
        <Button
          variant="outline"
          onClick={onClearFilters}
          className="rounded-2xl border-teal-300 text-teal-700 hover:bg-teal-50"
        >
          <Filter className="w-4 h-4 mr-2" />
          Xóa bộ lọc
        </Button>
      </div>
    </Card>
  );
}


