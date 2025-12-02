import React, { useState } from "react";
import {
     TrendingUp,
     Download,
     FileText,
     BarChart3,
     PieChart,
     RefreshCw,
     Eye,
     DollarSign,
     Users,
     Clock,
     MapPin
} from "lucide-react";
import { Button } from "../../../shared/components/ui";
import { Card } from "../../../shared/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../shared/components/ui";
import { DatePicker } from "../../../shared/components/ui";
import { useAuth } from "../../../contexts/AuthContext";
import { DemoRestrictedModal } from "../../../shared";

const RevenueReports = ({ isDemo = false }) => {
     const { user, logout } = useAuth();
     const [reportType, setReportType] = useState("daily");
     const [dateRange, setDateRange] = useState({
          startDate: "",
          endDate: ""
     });
     const [selectedField, setSelectedField] = useState("all");
     const [chartType, setChartType] = useState("bar");
     const [isExporting, setIsExporting] = useState(false);
     const [showDemoRestrictedModal, setShowDemoRestrictedModal] = useState(false);

     // Mock data - replace with actual API calls
     const fields = [
          { value: "all", label: "Tất cả sân" },
          { value: "Sân A1", label: "Sân A1" },
          { value: "Sân A2", label: "Sân A2" },
          { value: "Sân B1", label: "Sân B1" },
          { value: "Sân B2", label: "Sân B2" },
          { value: "Sân C1", label: "Sân C1" }
     ];

     const reportTypes = [
          { value: "daily", label: "Báo cáo theo ngày" },
          { value: "weekly", label: "Báo cáo theo tuần" },
          { value: "monthly", label: "Báo cáo theo tháng" },
          { value: "yearly", label: "Báo cáo theo năm" }
     ];

     const dailyData = [
          { date: "2025-01-15", revenue: 2500000, bookings: 12, avgPrice: 208333 },
          { date: "2025-01-16", revenue: 3200000, bookings: 15, avgPrice: 213333 },
          { date: "2025-01-17", revenue: 2800000, bookings: 13, avgPrice: 215385 },
          { date: "2025-01-18", revenue: 3500000, bookings: 16, avgPrice: 218750 },
          { date: "2025-01-19", revenue: 4200000, bookings: 18, avgPrice: 233333 },
          { date: "2025-01-20", revenue: 3800000, bookings: 17, avgPrice: 223529 },
          { date: "2025-01-21", revenue: 2900000, bookings: 14, avgPrice: 207143 }
     ];

     const fieldPerformance = [
          { field: "Sân A1", revenue: 8500000, bookings: 45, utilization: 85 },
          { field: "Sân A2", revenue: 7200000, bookings: 38, utilization: 78 },
          { field: "Sân B1", revenue: 6800000, bookings: 42, utilization: 82 },
          { field: "Sân B2", revenue: 5900000, bookings: 31, utilization: 75 },
          { field: "Sân C1", revenue: 4800000, bookings: 28, utilization: 70 }
     ];

     const timeSlotPerformance = [
          { timeSlot: "18:00-20:00", revenue: 12000000, bookings: 60, popularity: 95 },
          { timeSlot: "20:00-22:00", revenue: 10500000, bookings: 55, popularity: 90 },
          { timeSlot: "16:00-18:00", revenue: 8500000, bookings: 45, popularity: 75 },
          { timeSlot: "14:00-16:00", revenue: 6500000, bookings: 35, popularity: 60 },
          { timeSlot: "10:00-12:00", revenue: 4500000, bookings: 25, popularity: 45 },
          { timeSlot: "08:00-10:00", revenue: 3000000, bookings: 20, popularity: 35 }
     ];

     const summaryStats = {
          totalRevenue: 25000000,
          totalBookings: 184,
          averageBookingValue: 135870,
          topPerformingField: "Sân A1",
          peakTimeSlot: "18:00-20:00",
          revenueGrowth: 15.5,
          bookingGrowth: 8.2
     };

     const handleExportCSV = () => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          setIsExporting(true);
          // Simulate export process
          setTimeout(() => {
               setIsExporting(false);
               alert("Xuất file CSV thành công!");
          }, 2000);
     };

     const handleExportExcel = () => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          setIsExporting(true);
          // Simulate export process
          setTimeout(() => {
               setIsExporting(false);
               alert("Xuất file Excel thành công!");
          }, 2000);
     };

     const formatCurrency = (amount) => {
          return new Intl.NumberFormat('vi-VN', {
               style: 'currency',
               currency: 'VND'
          }).format(amount);
     };

     const formatDate = (dateString) => {
          return new Date(dateString).toLocaleDateString('vi-VN');
     };

     const getRevenueChangeColor = (change) => {
          return change >= 0 ? 'text-green-600' : 'text-red-600';
     };

     const getRevenueChangeIcon = (change) => {
          return change >= 0 ? '↗' : '↘';
     };

     return (
          <div className="space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                         <div>
                              <h1 className="text-3xl font-bold text-gray-900">Báo cáo doanh thu</h1>
                              <p className="text-gray-600 mt-1">Phân tích và xuất báo cáo doanh thu chi tiết</p>
                         </div>

                         <div className="flex items-center space-x-3">
                              <Button
                                   variant="outline"
                                   className="rounded-xl"
                                   onClick={handleExportCSV}
                                   disabled={isExporting}
                              >
                                   <FileText className="w-4 h-4 mr-2" />
                                   Xuất CSV
                              </Button>
                              <Button
                                   className="rounded-xl"
                                   onClick={handleExportExcel}
                                   disabled={isExporting}
                              >
                                   <Download className="w-4 h-4 mr-2" />
                                   Xuất Excel
                              </Button>
                         </div>
                    </div>

                    {/* Filters */}
                    <Card className="p-6 rounded-2xl border border-gray-200 shadow-lg">
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Loại báo cáo
                                   </label>
                                   <Select value={reportType} onValueChange={setReportType}>
                                        <SelectTrigger className="rounded-2xl">
                                             <SelectValue placeholder="Chọn loại báo cáo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             {reportTypes.map(type => (
                                                  <SelectItem key={type.value} value={type.value}>
                                                       {type.label}
                                                  </SelectItem>
                                             ))}
                                        </SelectContent>
                                   </Select>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Từ ngày
                                   </label>
                                   <DatePicker
                                        value={dateRange.startDate}
                                        onChange={(value) => setDateRange(prev => ({ ...prev, startDate: value }))}
                                        placeholder="Chọn ngày bắt đầu"
                                        minDate={new Date().toISOString().split('T')[0]}
                                        className="rounded-2xl"
                                   />
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Đến ngày
                                   </label>
                                   <DatePicker
                                        value={dateRange.endDate}
                                        onChange={(value) => setDateRange(prev => ({ ...prev, endDate: value }))}
                                        placeholder="Chọn ngày kết thúc"
                                        minDate={dateRange.startDate || new Date().toISOString().split('T')[0]}
                                        className="rounded-2xl"
                                   />
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Sân
                                   </label>
                                   <Select value={selectedField} onValueChange={setSelectedField}>
                                        <SelectTrigger className="rounded-2xl">
                                             <SelectValue placeholder="Chọn sân" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             {fields.map(field => (
                                                  <SelectItem key={field.value} value={field.value}>
                                                       {field.label}
                                                  </SelectItem>
                                             ))}
                                        </SelectContent>
                                   </Select>
                              </div>

                         </div>
                         <div className="flex justify-end items-end mt-4">
                              <Button
                                   variant="outline"
                                   className="rounded-2xl"
                                   onClick={() => {
                                        setDateRange({ startDate: "", endDate: "" });
                                        setSelectedField("all");
                                   }}
                              >
                                   <RefreshCw className="w-4 h-4 mr-2" />
                                   Làm mới
                              </Button>
                         </div>
                    </Card>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                         <Card className="p-6 rounded-2xl border border-gray-200 shadow-lg">
                              <div className="flex items-center">
                                   <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                        <DollarSign className="w-6 h-6 text-green-600" />
                                   </div>
                                   <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                             {formatCurrency(summaryStats.totalRevenue)}
                                        </p>
                                        <div className="flex items-center mt-1">
                                             <span className={`text-sm ${getRevenueChangeColor(summaryStats.revenueGrowth)}`}>
                                                  {getRevenueChangeIcon(summaryStats.revenueGrowth)} {summaryStats.revenueGrowth}%
                                             </span>
                                        </div>
                                   </div>
                              </div>
                         </Card>

                         <Card className="p-6 rounded-2xl border border-gray-200 shadow-lg">
                              <div className="flex items-center">
                                   <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Users className="w-6 h-6 text-blue-600" />
                                   </div>
                                   <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Tổng booking</p>
                                        <p className="text-2xl font-bold text-gray-900">{summaryStats.totalBookings}</p>
                                        <div className="flex items-center mt-1">
                                             <span className={`text-sm ${getRevenueChangeColor(summaryStats.bookingGrowth)}`}>
                                                  {getRevenueChangeIcon(summaryStats.bookingGrowth)} {summaryStats.bookingGrowth}%
                                             </span>
                                        </div>
                                   </div>
                              </div>
                         </Card>

                         <Card className="p-6 rounded-2xl border border-gray-200 shadow-lg">
                              <div className="flex items-center">
                                   <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <TrendingUp className="w-6 h-6 text-purple-600" />
                                   </div>
                                   <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Giá trị TB/booking</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                             {formatCurrency(summaryStats.averageBookingValue)}
                                        </p>
                                   </div>
                              </div>
                         </Card>

                         <Card className="p-6 rounded-2xl border border-gray-200 shadow-lg">
                              <div className="flex items-center">
                                   <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                        <MapPin className="w-6 h-6 text-yellow-600" />
                                   </div>
                                   <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Sân tốt nhất</p>
                                        <p className="text-lg font-bold text-gray-900">{summaryStats.topPerformingField}</p>
                                        <p className="text-sm text-gray-500">Khung giờ: {summaryStats.peakTimeSlot}</p>
                                   </div>
                              </div>
                         </Card>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                         {/* Revenue Chart */}
                         <Card className="p-6 rounded-2xl border border-gray-200 shadow-lg">
                              <div className="flex items-center justify-between mb-4">
                                   <h3 className="text-lg font-semibold text-gray-900">Doanh thu theo ngày</h3>
                                   <div className="flex items-center space-x-2">
                                        <Button
                                             variant={chartType === "bar" ? "default" : "outline"}
                                             size="sm"
                                             onClick={() => setChartType("bar")}
                                        >
                                             <BarChart3 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                             variant={chartType === "pie" ? "default" : "outline"}
                                             size="sm"
                                             onClick={() => setChartType("pie")}
                                        >
                                             <PieChart className="w-4 h-4" />
                                        </Button>
                                   </div>
                              </div>

                              <div className="space-y-4">
                                   {dailyData.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                             <span className="text-sm text-gray-600">{formatDate(item.date)}</span>
                                             <div className="flex items-center space-x-3">
                                                  <div className="w-32 bg-gray-200 rounded-full h-2">
                                                       <div
                                                            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                                                            style={{ width: `${(item.revenue / 5000000) * 100}%` }}
                                                       ></div>
                                                  </div>
                                                  <span className="text-sm font-medium text-gray-900 w-20 text-right">
                                                       {formatCurrency(item.revenue)}
                                                  </span>
                                             </div>
                                        </div>
                                   ))}
                              </div>
                         </Card>

                         {/* Field Performance */}
                         <Card className="p-6 rounded-2xl border border-gray-200 shadow-lg">
                              <div className="flex items-center justify-between mb-4">
                                   <h3 className="text-lg font-semibold text-gray-900">Hiệu suất sân</h3>
                                   <Button variant="outline" size="sm">
                                        <Eye className="w-4 h-4 mr-2" />
                                        Xem chi tiết
                                   </Button>
                              </div>

                              <div className="space-y-4">
                                   {fieldPerformance.map((field, index) => (
                                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                                             <div className="flex items-center justify-between mb-2">
                                                  <h4 className="font-medium text-gray-900">{field.field}</h4>
                                                  <span className="text-sm text-gray-600">{field.utilization}% sử dụng</span>
                                             </div>
                                             <div className="grid grid-cols-2 gap-4 text-sm">
                                                  <div>
                                                       <span className="text-gray-600">Doanh thu: </span>
                                                       <span className="font-medium">{formatCurrency(field.revenue)}</span>
                                                  </div>
                                                  <div>
                                                       <span className="text-gray-600">Booking: </span>
                                                       <span className="font-medium">{field.bookings}</span>
                                                  </div>
                                             </div>
                                             <div className="mt-2">
                                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                                       <div
                                                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                                                            style={{ width: `${field.utilization}%` }}
                                                       ></div>
                                                  </div>
                                             </div>
                                        </div>
                                   ))}
                              </div>
                         </Card>
                    </div>

                    {/* Time Slot Performance */}
                    <Card className="p-6 rounded-2xl border border-gray-200 shadow-lg">
                         <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold text-gray-900">Hiệu suất khung giờ</h3>
                              <Button variant="outline" size="sm">
                                   <Clock className="w-4 h-4 mr-2" />
                                   Xem lịch chi tiết
                              </Button>
                         </div>

                         <div className="overflow-x-auto">
                              <table className="w-full">
                                   <thead>
                                        <tr className="border-b border-gray-200">
                                             <th className="text-left py-3 px-4 font-medium text-gray-600">Khung giờ</th>
                                             <th className="text-left py-3 px-4 font-medium text-gray-600">Doanh thu</th>
                                             <th className="text-left py-3 px-4 font-medium text-gray-600">Số booking</th>
                                             <th className="text-left py-3 px-4 font-medium text-gray-600">Mức độ phổ biến</th>
                                             <th className="text-left py-3 px-4 font-medium text-gray-600">Trung bình/booking</th>
                                        </tr>
                                   </thead>
                                   <tbody>
                                        {timeSlotPerformance.map((slot, index) => (
                                             <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{slot.timeSlot}</td>
                                                  <td className="py-3 px-4 text-sm text-gray-900">{formatCurrency(slot.revenue)}</td>
                                                  <td className="py-3 px-4 text-sm text-gray-900">{slot.bookings}</td>
                                                  <td className="py-3 px-4">
                                                       <div className="flex items-center">
                                                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                                                 <div
                                                                      className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full"
                                                                      style={{ width: `${slot.popularity}%` }}
                                                                 ></div>
                                                            </div>
                                                            <span className="text-sm text-gray-600">{slot.popularity}%</span>
                                                       </div>
                                                  </td>
                                                  <td className="py-3 px-4 text-sm text-gray-900">
                                                       {formatCurrency(slot.revenue / slot.bookings)}
                                                  </td>
                                             </tr>
                                        ))}
                                   </tbody>
                              </table>
                         </div>
                    </Card>

                    {/* Export Options */}
                    <Card className="p-6 rounded-2xl border border-gray-200 shadow-lg">
                         <h3 className="text-lg font-semibold text-gray-900 mb-4">Tùy chọn xuất báo cáo</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                   <h4 className="font-medium text-gray-900 mb-3">Định dạng file</h4>
                                   <div className="space-y-2">
                                        <label className="flex items-center">
                                             <input type="radio" name="format" value="csv" defaultChecked className="mr-2" />
                                             <span className="text-sm text-gray-700">CSV (Comma Separated Values)</span>
                                        </label>
                                        <label className="flex items-center">
                                             <input type="radio" name="format" value="excel" className="mr-2" />
                                             <span className="text-sm text-gray-700">Excel (.xlsx)</span>
                                        </label>
                                        <label className="flex items-center">
                                             <input type="radio" name="format" value="pdf" className="mr-2" />
                                             <span className="text-sm text-gray-700">PDF</span>
                                        </label>
                                   </div>
                              </div>

                              <div>
                                   <h4 className="font-medium text-gray-900 mb-3">Nội dung báo cáo</h4>
                                   <div className="space-y-2">
                                        <label className="flex items-center">
                                             <input type="checkbox" defaultChecked className="mr-2" />
                                             <span className="text-sm text-gray-700">Tổng quan doanh thu</span>
                                        </label>
                                        <label className="flex items-center">
                                             <input type="checkbox" defaultChecked className="mr-2" />
                                             <span className="text-sm text-gray-700">Chi tiết theo sân</span>
                                        </label>
                                        <label className="flex items-center">
                                             <input type="checkbox" defaultChecked className="mr-2" />
                                             <span className="text-sm text-gray-700">Phân tích khung giờ</span>
                                        </label>
                                        <label className="flex items-center">
                                             <input type="checkbox" className="mr-2" />
                                             <span className="text-sm text-gray-700">Biểu đồ và đồ thị</span>
                                        </label>
                                   </div>
                              </div>
                         </div>

                         <div className="mt-6 flex justify-end space-x-3">
                              <Button variant="outline" disabled={isExporting}>
                                   <RefreshCw className={`w-4 h-4 mr-2 ${isExporting ? 'animate-spin' : ''}`} />
                                   Tạo báo cáo mới
                              </Button>
                              <Button onClick={handleExportCSV} disabled={isExporting}>
                                   <Download className="w-4 h-4 mr-2" />
                                   {isExporting ? 'Đang xuất...' : 'Xuất báo cáo'}
                              </Button>
                         </div>
                    </Card>

                    {/* Demo Restricted Modal */}
                    <DemoRestrictedModal
                         isOpen={showDemoRestrictedModal}
                         onClose={() => setShowDemoRestrictedModal(false)}
                         featureName="Báo cáo doanh thu"
                    />
               </div>
     );
};

export default RevenueReports;
