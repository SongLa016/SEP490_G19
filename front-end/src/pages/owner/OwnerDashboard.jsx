import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import OwnerLayout from "../../layouts/owner/OwnerLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Card, Button } from "../../components/ui/index";
import {
     DollarSign,
     Calendar,
     Users,
     Star,
     TrendingUp,
     TrendingDown,
     MapPin,
     Eye,
     Plus,
     Settings,
     BarChart3,
     PieChart,
     Activity,
     AlertCircle,
     CheckCircle,
} from "lucide-react";

export default function OwnerDashboard({ isDemo = false }) {
     const { user, logout } = useAuth();
     const [timeRange, setTimeRange] = useState("7d");

     // Mock data for demo mode
     const demoStats = {
          totalRevenue: 25000000,
          totalBookings: 184,
          activeFields: 5,
          averageRating: 4.8,
          revenueGrowth: 12.5,
          bookingGrowth: 8.3,
          occupancyRate: 78.5,
          customerSatisfaction: 92
     };

     const stats = isDemo ? demoStats : {
          totalRevenue: 12500000,
          totalBookings: 156,
          activeFields: 8,
          averageRating: 4.7,
          revenueGrowth: 5.2,
          bookingGrowth: 3.1,
          occupancyRate: 65.2,
          customerSatisfaction: 88
     };

     // Revenue chart data
     const revenueData = [
          { day: "T2", amount: 1200000 },
          { day: "T3", amount: 1800000 },
          { day: "T4", amount: 1500000 },
          { day: "T5", amount: 2200000 },
          { day: "T6", amount: 2800000 },
          { day: "T7", amount: 3200000 },
          { day: "CN", amount: 2500000 }
     ];

     // Recent bookings
     const recentBookings = [
          { id: 1, customer: "Nguyễn Văn A", field: "Sân A1", time: "18:00-19:00", status: "confirmed", amount: 150000 },
          { id: 2, customer: "Trần Thị B", field: "Sân B2", time: "19:30-20:30", status: "pending", amount: 180000 },
          { id: 3, customer: "Lê Văn C", field: "Sân A2", time: "20:00-21:00", status: "confirmed", amount: 200000 },
          { id: 4, customer: "Phạm Thị D", field: "Sân C1", time: "17:00-18:00", status: "cancelled", amount: 120000 },
          { id: 5, customer: "Hoàng Văn E", field: "Sân B1", time: "21:00-22:00", status: "confirmed", amount: 160000 }
     ];

     // Field performance data
     const fieldPerformance = [
          { name: "Sân A1", bookings: 45, revenue: 6750000, rating: 4.8 },
          { name: "Sân A2", bookings: 38, revenue: 5700000, rating: 4.6 },
          { name: "Sân B1", bookings: 42, revenue: 6300000, rating: 4.7 },
          { name: "Sân B2", bookings: 35, revenue: 5250000, rating: 4.5 },
          { name: "Sân C1", bookings: 24, revenue: 3600000, rating: 4.3 }
     ];

     const getStatusColor = (status) => {
          switch (status) {
               case 'confirmed': return 'bg-green-100 text-green-800';
               case 'pending': return 'bg-yellow-100 text-yellow-800';
               case 'cancelled': return 'bg-red-100 text-red-800';
               default: return 'bg-gray-100 text-gray-800';
          }
     };

     const getStatusText = (status) => {
          switch (status) {
               case 'confirmed': return 'Đã xác nhận';
               case 'pending': return 'Chờ xác nhận';
               case 'cancelled': return 'Đã hủy';
               default: return 'Không xác định';
          }
     };

     const formatCurrency = (amount) => {
          return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
     };

     const cards = [
          {
               title: "Tổng doanh thu",
               value: formatCurrency(stats.totalRevenue),
               change: stats.revenueGrowth,
               icon: DollarSign,
               color: "bg-green-50 border-green-200",
               textColor: "text-green-700"
          },
          {
               title: "Tổng booking",
               value: stats.totalBookings.toString(),
               change: stats.bookingGrowth,
               icon: Calendar,
               color: "bg-blue-50 border-blue-200",
               textColor: "text-blue-700"
          },
          {
               title: "Tỷ lệ lấp đầy",
               value: `${stats.occupancyRate}%`,
               change: 2.1,
               icon: Users,
               color: "bg-purple-50 border-purple-200",
               textColor: "text-purple-700"
          },
          {
               title: "Hài lòng KH",
               value: `${stats.customerSatisfaction}%`,
               change: -1.2,
               icon: Star,
               color: "bg-yellow-50 border-yellow-200",
               textColor: "text-yellow-700"
          },
     ];

     return (
          <OwnerLayout user={user} onLoggedOut={logout} isDemo={isDemo}>
               <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                         <div>
                              <h1 className="text-3xl font-bold text-gray-900">
                                   {isDemo ? "Demo Dashboard" : "Tổng quan"}
                              </h1>
                              <p className="text-gray-600 mt-1">
                                   {isDemo ? "Trải nghiệm hệ thống quản lý sân bóng" : "Tổng quan hoạt động kinh doanh"}
                              </p>
                         </div>
                         <div className="flex items-center rounded-xl space-x-4">
                              <Select value={timeRange} onValueChange={setTimeRange}>
                                   <SelectTrigger className="w-32">
                                        <SelectValue />
                                   </SelectTrigger>
                                   <SelectContent>
                                        <SelectItem value="7d">7 ngày</SelectItem>
                                        <SelectItem value="30d">30 ngày</SelectItem>
                                        <SelectItem value="90d">90 ngày</SelectItem>
                                        <SelectItem value="1y">1 năm</SelectItem>
                                   </SelectContent>
                              </Select>
                              {isDemo && (
                                   <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium">
                                        <Eye className="w-4 h-4 inline mr-1" />
                                        Chế độ Demo
                                   </div>
                              )}
                         </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                         {cards.map((card, index) => {
                              const Icon = card.icon;
                              return (
                                   <Card key={index} className={`p-6 rounded-2xl shadow-lg ${card.color}`}>
                                        <div className="flex items-center justify-between">
                                             <div>
                                                  <div className="text-gray-600 text-sm mb-2">{card.title}</div>
                                                  <div className={`text-2xl font-semibold ${card.textColor}`}>{card.value}</div>
                                                  <div className="flex items-center mt-2">
                                                       {card.change > 0 ? (
                                                            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                                                       ) : (
                                                            <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                                                       )}
                                                       <span className={`text-sm ${card.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {Math.abs(card.change)}%
                                                       </span>
                                                  </div>
                                             </div>
                                             <Icon className={`w-8 h-8 ${card.textColor} opacity-60`} />
                                        </div>
                                   </Card>
                              );
                         })}
                    </div>

                    {/* Charts and Analytics */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                         {/* Revenue Chart */}
                         <Card className="p-6 rounded-2xl shadow-lg">
                              <div className="flex items-center justify-between mb-6">
                                   <h3 className="text-lg font-semibold text-gray-900">Doanh thu theo ngày</h3>
                                   <div className="flex items-center space-x-2">
                                        <BarChart3 className="w-5 h-5 text-gray-500" />
                                        <span className="text-sm text-gray-600">7 ngày qua</span>
                                   </div>
                              </div>
                              <div className="space-y-4">
                                   {revenueData.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                             <span className="text-sm text-gray-600 w-8">{item.day}</span>
                                             <div className="flex-1 mx-4">
                                                  <div className="bg-gray-200 rounded-full h-2">
                                                       <div
                                                            className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                                                            style={{ width: `${(item.amount / Math.max(...revenueData.map(d => d.amount))) * 100}%` }}
                                                       ></div>
                                                  </div>
                                             </div>
                                             <span className="text-sm font-medium text-gray-900 w-20 text-right">
                                                  {formatCurrency(item.amount)}
                                             </span>
                                        </div>
                                   ))}
                              </div>
                         </Card>

                         {/* Field Performance */}
                         <Card className="p-6 rounded-2xl shadow-lg">
                              <div className="flex items-center justify-between mb-6">
                                   <h3 className="text-lg font-semibold text-gray-900">Hiệu suất sân</h3>
                                   <div className="flex items-center space-x-2">
                                        <PieChart className="w-5 h-5 text-gray-500" />
                                        <span className="text-sm text-gray-600">Top 5</span>
                                   </div>
                              </div>
                              <div className="space-y-4">
                                   {fieldPerformance.map((field, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                             <div className="flex items-center">
                                                  <MapPin className="w-4 h-4 text-gray-500 mr-2" />
                                                  <span className="font-medium text-gray-900">{field.name}</span>
                                             </div>
                                             <div className="flex items-center space-x-4 text-sm">
                                                  <div className="text-center">
                                                       <div className="font-medium text-gray-900">{field.bookings}</div>
                                                       <div className="text-gray-500">Booking</div>
                                                  </div>
                                                  <div className="text-center">
                                                       <div className="font-medium text-gray-900">{formatCurrency(field.revenue)}</div>
                                                       <div className="text-gray-500">Doanh thu</div>
                                                  </div>
                                                  <div className="flex items-center">
                                                       <Star className="w-4 h-4 text-yellow-500 mr-1" />
                                                       <span className="font-medium text-gray-900">{field.rating}</span>
                                                  </div>
                                             </div>
                                        </div>
                                   ))}
                              </div>
                         </Card>
                    </div>

                    {/* Recent Activities and Quick Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                         {/* Recent Bookings */}
                         <Card className="p-6 rounded-2xl shadow-lg lg:col-span-2">
                              <div className="flex items-center justify-between mb-6">
                                   <h3 className="text-lg font-semibold text-gray-900">Booking gần đây</h3>
                                   <Button variant="outline" size="sm">
                                        <Activity className="w-4 h-4 mr-2" />
                                        Xem tất cả
                                   </Button>
                              </div>
                              <div className="space-y-3">
                                   {recentBookings.map((booking) => (
                                        <div key={booking.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                             <div className="flex items-center space-x-3">
                                                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                                       <Users className="w-5 h-5 text-gray-600" />
                                                  </div>
                                                  <div>
                                                       <div className="font-medium text-gray-900">{booking.customer}</div>
                                                       <div className="text-sm text-gray-600">{booking.field} • {booking.time}</div>
                                                  </div>
                                             </div>
                                             <div className="flex items-center space-x-3">
                                                  <span className="font-medium text-gray-900">{formatCurrency(booking.amount)}</span>
                                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                                       {getStatusText(booking.status)}
                                                  </span>
                                             </div>
                                        </div>
                                   ))}
                              </div>
                         </Card>

                         {/* Quick Actions */}
                         <Card className="p-6 rounded-2xl shadow-lg">
                              <h3 className="text-lg font-semibold text-gray-900 mb-6">Thao tác nhanh</h3>
                              <div className="space-y-3">
                                   <Button className="w-full justify-start" variant="outline">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Thêm sân mới
                                   </Button>
                                   <Button className="w-full justify-start" variant="outline">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        Xem booking
                                   </Button>
                                   <Button className="w-full justify-start" variant="outline">
                                        <DollarSign className="w-4 h-4 mr-2" />
                                        Cập nhật giá
                                   </Button>
                                   <Button className="w-full justify-start" variant="outline">
                                        <Settings className="w-4 h-4 mr-2" />
                                        Cài đặt hệ thống
                                   </Button>
                              </div>

                              {/* System Status */}
                              <div className="mt-6 pt-6 border-t border-gray-200">
                                   <h4 className="font-medium text-gray-900 mb-3">Trạng thái hệ thống</h4>
                                   <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                             <span className="text-sm text-gray-600">Sân hoạt động</span>
                                             <div className="flex items-center">
                                                  <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                                                  <span className="text-sm text-green-600">Bình thường</span>
                                             </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                             <span className="text-sm text-gray-600">Hệ thống thanh toán</span>
                                             <div className="flex items-center">
                                                  <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                                                  <span className="text-sm text-green-600">Hoạt động</span>
                                             </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                             <span className="text-sm text-gray-600">Thông báo</span>
                                             <div className="flex items-center">
                                                  <AlertCircle className="w-4 h-4 text-yellow-500 mr-1" />
                                                  <span className="text-sm text-yellow-600">2 chưa đọc</span>
                                             </div>
                                        </div>
                                   </div>
                              </div>
                         </Card>
                    </div>

                    {/* Demo Banner */}
                    {isDemo && (
                         <Card className="p-6 rounded-2xl shadow-lg bg-blue-50 border-blue-200">
                              <div className="flex items-center">
                                   <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                        <Eye className="w-4 h-4 text-blue-600" />
                                   </div>
                                   <div>
                                        <h3 className="font-medium text-blue-900">Chế độ Demo</h3>
                                        <p className="text-sm text-blue-700 mt-1">
                                             Đây là dữ liệu mẫu để bạn trải nghiệm hệ thống.
                                             <a href="/register" className="underline ml-1 font-medium">Đăng ký ngay</a> để sử dụng đầy đủ tính năng.
                                        </p>
                                   </div>
                              </div>
                         </Card>
                    )}
               </div>
          </OwnerLayout>
     );
}


