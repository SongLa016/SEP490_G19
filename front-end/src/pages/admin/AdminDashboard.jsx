import React, { useState, useEffect } from "react";
import {
     Card,
     CardContent,
     CardHeader,
     CardTitle,
     Button,
     Badge,
     Avatar,
     AvatarFallback
} from "../../components/ui";
import {
     Users,
     Building2,
     ClipboardList,
     AlertTriangle,
     Bell,
     TrendingUp,
     Calendar,
     Shield,
     Activity,
     Database,
     Server,
     Eye,
     Settings,
     BarChart3,
     Clock,
     CheckCircle,
     AlertCircle
} from "lucide-react";

export default function AdminDashboard() {
     const [stats, setStats] = useState({
          totalUsers: 0,
          totalOwners: 0,
          totalBookings: 0,
          totalViolations: 0,
          totalNotifications: 0,
          totalRevenue: 0,
          activeFields: 0,
          pendingReports: 0
     });

     const [recentActivities, setRecentActivities] = useState([]);

     useEffect(() => {
          // Mock data - trong thực tế sẽ gọi API
          setStats({
               totalUsers: 1250,
               totalOwners: 45,
               totalBookings: 3200,
               totalViolations: 12,
               totalNotifications: 8,
               totalRevenue: 125000000,
               activeFields: 180,
               pendingReports: 5
          });

          setRecentActivities([
               {
                    id: 1,
                    type: "user_registration",
                    message: "Người dùng mới đăng ký: Nguyễn Văn A",
                    time: "2 phút trước",
                    icon: Users
               },
               {
                    id: 2,
                    type: "violation_report",
                    message: "Báo cáo vi phạm mới từ User ID: 123",
                    time: "15 phút trước",
                    icon: AlertTriangle
               },
               {
                    id: 3,
                    type: "booking_completed",
                    message: "Booking hoàn thành: Sân A1 - Slot 3",
                    time: "1 giờ trước",
                    icon: ClipboardList
               },
               {
                    id: 4,
                    type: "field_added",
                    message: "Sân mới được thêm: Sân bóng XYZ",
                    time: "2 giờ trước",
                    icon: Building2
               }
          ]);
     }, []);

     const formatCurrency = (amount) => {
          return new Intl.NumberFormat('vi-VN', {
               style: 'currency',
               currency: 'VND'
          }).format(amount);
     };

     const statCards = [
          {
               title: "Tổng người dùng",
               value: stats.totalUsers.toLocaleString(),
               icon: Users,
               color: "blue",
               change: "+12%",
               changeType: "positive"
          },
          {
               title: "Chủ sân",
               value: stats.totalOwners.toLocaleString(),
               icon: Building2,
               color: "green",
               change: "+5%",
               changeType: "positive"
          },
          {
               title: "Tổng booking",
               value: stats.totalBookings.toLocaleString(),
               icon: ClipboardList,
               color: "purple",
               change: "+18%",
               changeType: "positive"
          },
          {
               title: "Doanh thu",
               value: formatCurrency(stats.totalRevenue),
               icon: TrendingUp,
               color: "emerald",
               change: "+25%",
               changeType: "positive"
          },
          {
               title: "Sân hoạt động",
               value: stats.activeFields.toLocaleString(),
               icon: Calendar,
               color: "orange",
               change: "+3%",
               changeType: "positive"
          },
          {
               title: "Báo cáo vi phạm",
               value: stats.totalViolations.toLocaleString(),
               icon: AlertTriangle,
               color: "red",
               change: "-8%",
               changeType: "negative"
          },
          {
               title: "Thông báo chưa gửi",
               value: stats.totalNotifications.toLocaleString(),
               icon: Bell,
               color: "indigo",
               change: "+2",
               changeType: "neutral"
          },
          {
               title: "Báo cáo chờ xử lý",
               value: stats.pendingReports.toLocaleString(),
               icon: Shield,
               color: "yellow",
               change: "-1",
               changeType: "positive"
          }
     ];

     const getIconColor = (color) => {
          const colors = {
               blue: "text-blue-600",
               green: "text-green-600",
               purple: "text-purple-600",
               emerald: "text-emerald-600",
               orange: "text-orange-600",
               red: "text-red-600",
               indigo: "text-indigo-600",
               yellow: "text-yellow-600"
          };
          return colors[color] || colors.blue;
     };

     const getChangeColor = (type) => {
          switch (type) {
               case "positive":
                    return "text-green-600";
               case "negative":
                    return "text-red-600";
               default:
                    return "text-gray-600";
          }
     };

     return (
          <div className="space-y-6">
               {/* Header */}
               <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 border border-red-200/50">
                    <div className="flex items-center justify-between">
                         <div>
                              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-700 to-pink-700 bg-clip-text text-transparent">
                                   Admin Dashboard
                              </h1>
                              <p className="text-slate-600 mt-2 font-medium">
                                   Tổng quan hệ thống và quản lý toàn bộ nền tảng
                              </p>
                         </div>
                         <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                              <Shield className="w-8 h-8 text-white" />
                         </div>
                    </div>
               </div>

               {/* Stats Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((stat, index) => {
                         const Icon = stat.icon;
                         return (
                              <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:scale-105">
                                   <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                             <div className="flex-1">
                                                  <p className="text-sm font-medium text-slate-600 mb-1">{stat.title}</p>
                                                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                                                  <p className={`text-sm font-medium mt-1 ${getChangeColor(stat.changeType)}`}>
                                                       {stat.change} so với tháng trước
                                                  </p>
                                             </div>
                                             <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                                                  <Icon className={`w-6 h-6 ${getIconColor(stat.color)}`} />
                                             </div>
                                        </div>
                                   </CardContent>
                              </Card>
                         );
                    })}
               </div>

               {/* Recent Activities */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                         <CardHeader>
                              <div className="flex items-center justify-between">
                                   <CardTitle className="flex items-center space-x-2">
                                        <Activity className="w-5 h-5 text-blue-600" />
                                        <span>Hoạt động gần đây</span>
                                   </CardTitle>
                                   <Badge variant="secondary">
                                        <Clock className="w-3 h-3 mr-1" />
                                        Real-time
                                   </Badge>
                              </div>
                         </CardHeader>
                         <CardContent>
                              <div className="space-y-4">
                                   {recentActivities.map((activity) => {
                                        const Icon = activity.icon;
                                        return (
                                             <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                       <Icon className="w-4 h-4 text-slate-600" />
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                       <p className="text-sm font-medium text-slate-900">{activity.message}</p>
                                                       <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                                                  </div>
                                             </div>
                                        );
                                   })}
                              </div>
                         </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                         <CardHeader>
                              <div className="flex items-center justify-between">
                                   <CardTitle className="flex items-center space-x-2">
                                        <Settings className="w-5 h-5 text-green-600" />
                                        <span>Thao tác nhanh</span>
                                   </CardTitle>
                                   <Badge variant="outline">
                                        <Eye className="w-3 h-3 mr-1" />
                                        Quick Access
                                   </Badge>
                              </div>
                         </CardHeader>
                         <CardContent>
                              <div className="space-y-3">
                                   <Button variant="outline" className="w-full justify-start p-3 h-auto hover:bg-red-50 hover:border-red-200">
                                        <div className="flex items-center space-x-3">
                                             <Users className="w-5 h-5 text-red-600" />
                                             <div className="text-left">
                                                  <p className="font-medium text-slate-900">Quản lý người dùng</p>
                                                  <p className="text-sm text-slate-600">Xem và quản lý tài khoản</p>
                                             </div>
                                        </div>
                                   </Button>
                                   <Button variant="outline" className="w-full justify-start p-3 h-auto hover:bg-orange-50 hover:border-orange-200">
                                        <div className="flex items-center space-x-3">
                                             <AlertTriangle className="w-5 h-5 text-orange-600" />
                                             <div className="text-left">
                                                  <p className="font-medium text-slate-900">Xử lý báo cáo</p>
                                                  <p className="text-sm text-slate-600">Kiểm tra và xử lý vi phạm</p>
                                             </div>
                                        </div>
                                   </Button>
                                   <Button variant="outline" className="w-full justify-start p-3 h-auto hover:bg-blue-50 hover:border-blue-200">
                                        <div className="flex items-center space-x-3">
                                             <Bell className="w-5 h-5 text-blue-600" />
                                             <div className="text-left">
                                                  <p className="font-medium text-slate-900">Gửi thông báo</p>
                                                  <p className="text-sm text-slate-600">Tạo thông báo hệ thống</p>
                                             </div>
                                        </div>
                                   </Button>
                                   <Button variant="outline" className="w-full justify-start p-3 h-auto hover:bg-purple-50 hover:border-purple-200">
                                        <div className="flex items-center space-x-3">
                                             <Building2 className="w-5 h-5 text-purple-600" />
                                             <div className="text-left">
                                                  <p className="font-medium text-slate-900">Quản lý sân</p>
                                                  <p className="text-sm text-slate-600">Kiểm tra và phê duyệt sân</p>
                                             </div>
                                        </div>
                                   </Button>
                              </div>
                         </CardContent>
                    </Card>
               </div>

               {/* System Status */}
               <Card>
                    <CardHeader>
                         <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center space-x-2">
                                   <Server className="w-5 h-5 text-emerald-600" />
                                   <span>Trạng thái hệ thống</span>
                              </CardTitle>
                              <div className="flex items-center space-x-2">
                                   <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                   <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Hoạt động bình thường
                                   </Badge>
                              </div>
                         </div>
                    </CardHeader>
                    <CardContent>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                                   <div className="flex items-center justify-center mb-2">
                                        <Activity className="w-5 h-5 text-green-600" />
                                   </div>
                                   <p className="text-sm font-medium text-green-700">API Response Time</p>
                                   <p className="text-2xl font-bold text-green-800">120ms</p>
                              </div>
                              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                                   <div className="flex items-center justify-center mb-2">
                                        <Database className="w-5 h-5 text-blue-600" />
                                   </div>
                                   <p className="text-sm font-medium text-blue-700">Database Status</p>
                                   <p className="text-2xl font-bold text-blue-800">99.9%</p>
                              </div>
                              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                                   <div className="flex items-center justify-center mb-2">
                                        <BarChart3 className="w-5 h-5 text-purple-600" />
                                   </div>
                                   <p className="text-sm font-medium text-purple-700">Server Load</p>
                                   <p className="text-2xl font-bold text-purple-800">45%</p>
                              </div>
                         </div>
                    </CardContent>
               </Card>
          </div>
     );
}