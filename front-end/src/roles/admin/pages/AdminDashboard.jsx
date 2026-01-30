import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, Button } from "../../../shared/components/ui";
import { Users, Building2, ClipboardList, AlertTriangle, FileText, TrendingUp, Calendar, Shield, Activity, Server, Eye, Settings, Clock, Bell } from "lucide-react";
import { decodeTokenPayload, getStoredToken } from "../../../shared/utils/tokenManager";
import {
     fetchOwnerStatistics,
     fetchBookingStatistics,
     fetchRevenueStatistics,
     fetchFieldStatistics,
     fetchReportStatistics,
     fetchPendingReportStatistics,
     fetchPostStatistics,
     fetchAllUserStatistics,
     fetchUserStatistics,
     fetchRecentActivities,
} from "../../../shared/services/adminStatistics";

export default function AdminDashboard() {
     const navigate = useNavigate();
     const [stats, setStats] = useState({
          totalUsers: 0,
          totalOwners: 0,
          totalBookings: 0,
          totalViolations: 0,
          totalPosts: 0,
          totalRevenue: 0,
          activeFields: 0,
          pendingReports: 0
     });

     const [recentActivities, setRecentActivities] = useState([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState(null);

     useEffect(() => {
          loadStatistics();
     }, []);

     // hàm lấy số từ API response
     const extractNumber = (data, ...keys) => {
          if (!data) return 0;
          for (const key of keys) {
               if (data[key] !== undefined && data[key] !== null) {
                    return typeof data[key] === 'number' ? data[key] : parseInt(data[key]) || 0;
               }
          }
          // Nếu data là số trực tiếp
          if (typeof data === 'number') return data;
          // Nếu data là mảng, trả về độ dài
          if (Array.isArray(data)) return data.length;
          return 0;
     };

     // tải thống kê
     const loadStatistics = async () => {
          try {
               setLoading(true);
               setError(null);
               // Kiểm tra token và role admin
               const token = getStoredToken();
               if (!token) {
                    setError("Bạn cần đăng nhập để xem thống kê.");
                    setLoading(false);
                    return;
               }
               const payload = decodeTokenPayload(token);
               if (!payload) {
                    setError("Token không hợp lệ.");
                    setLoading(false);
                    return;
               }
               // Kiểm tra role admin (roleID = 3 hoặc role = "Admin")
               const userRole = payload.roleID || payload.role || payload.RoleID || payload.Role;
               const isAdmin = userRole === 3 || userRole === "Admin" || userRole === "admin";

               if (!isAdmin) {
                    setError("Bạn không có quyền truy cập trang này. Chỉ Admin mới có thể xem thống kê.");
                    setLoading(false);
                    return;
               }

               // Gọi tất cả các API thống kê
               const [
                    ownersResult,
                    bookingsResult,
                    revenueResult,
                    fieldsResult,
                    reportsResult,
                    pendingReportsResult,
                    postsResult,

                    usersResult,
                    recentActivitiesResult,
               ] = await Promise.all([
                    fetchOwnerStatistics(),
                    fetchBookingStatistics(),
                    fetchRevenueStatistics(),
                    fetchFieldStatistics(),
                    fetchReportStatistics(),
                    fetchPendingReportStatistics(),
                    fetchPostStatistics(),
                    fetchAllUserStatistics(),
                    fetchUserStatistics(),
                    fetchRecentActivities(),
               ]);

               // Cập nhật stats từ các API response
               const newStats = {
                    totalUsers: extractNumber(usersResult.ok ? usersResult.data : null,
                         'totalUsers', 'total', 'count', 'userCount', 'numberOfUsers'),
                    totalOwners: extractNumber(ownersResult.ok ? ownersResult.data : null,
                         'totalOwners', 'total', 'count', 'ownerCount', 'numberOfOwners'),
                    totalBookings: extractNumber(bookingsResult.ok ? bookingsResult.data : null,
                         'totalBookings', 'total', 'count', 'bookingCount', 'numberOfBookings'),
                    totalViolations: extractNumber(reportsResult.ok ? reportsResult.data : null,
                         'totalReports', 'total', 'count', 'reportCount', 'numberOfReports'),
                    totalPosts: extractNumber(postsResult.ok ? postsResult.data : null,
                         'totalPosts', 'total', 'count', 'postCount', 'numberOfPosts'),
                    totalRevenue: extractNumber(revenueResult.ok ? revenueResult.data : null,
                         'totalRevenue', 'revenue', 'amount', 'totalAmount', 'sum'),
                    activeFields: extractNumber(fieldsResult.ok ? fieldsResult.data : null,
                         'activeFields', 'total', 'count', 'fieldCount', 'numberOfFields', 'activeCount'),
                    pendingReports: extractNumber(pendingReportsResult.ok ? pendingReportsResult.data : null,
                         'pendingReports', 'total', 'count', 'pendingCount', 'numberOfPending')
               };

               setStats(newStats);

               // Map recent activities từ API /api/admin/statistics/recent-activities
               const mapActivityIcon = (type) => {
                    const normalized = String(type || "").toLowerCase();
                    if (normalized.includes("user")) return Users;
                    if (normalized.includes("booking") || normalized.includes("reservation")) return ClipboardList;
                    if (normalized.includes("field") || normalized.includes("pitch")) return Building2;
                    if (normalized.includes("post") || normalized.includes("article")) return FileText;
                    if (normalized.includes("report") || normalized.includes("violation")) return AlertTriangle;
                    if (normalized.includes("system")) return Server;
                    return Activity;
               };

               let activities = [];
               if (recentActivitiesResult.ok && Array.isArray(recentActivitiesResult.data)) {
                    activities = recentActivitiesResult.data.map((item, index) => ({
                         id: item.id || item.activityId || index + 1,
                         type: item.type || item.activityType || "info",
                         message:
                              item.message ||
                              item.description ||
                              item.title ||
                              `Hoạt động: ${item.activityType || item.type || ""}`,
                         time: item.timeAgo || item.createdAt || item.timestamp || "Vừa cập nhật",
                         icon: mapActivityIcon(item.type || item.activityType),
                    }));
               }

               if (activities.length === 0) {
                    activities = [
                         {
                              id: 1,
                              type: "info",
                              message: "Chưa có hoạt động gần đây.",
                              time: "Vừa cập nhật",
                              icon: Activity,
                         },
                    ];
               }

               setRecentActivities(activities);

          } catch (err) {
               console.error("Error loading statistics:", err);
               setError("Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.");
          } finally {
               setLoading(false);
          }
     };

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

          },
          {
               title: "Chủ sân",
               value: stats.totalOwners.toLocaleString(),
               icon: Building2,
               color: "green",

          },
          {
               title: "Tổng booking",
               value: stats.totalBookings.toLocaleString(),
               icon: ClipboardList,
               color: "purple",

          },
          {
               title: "Doanh thu",
               value: formatCurrency(stats.totalRevenue),
               icon: TrendingUp,
               color: "emerald",

          },
          {
               title: "Sân hoạt động",
               value: stats.activeFields.toLocaleString(),
               icon: Calendar,
               color: "orange",

          },
          {
               title: "Báo cáo vi phạm",
               value: stats.totalViolations.toLocaleString(),
               icon: AlertTriangle,
               color: "red",

          },
          {
               title: "Số lượng bài post",
               value: stats.totalPosts.toLocaleString(),
               icon: FileText,
               color: "indigo",

          },
          {
               title: "Báo cáo chờ xử lý",
               value: stats.pendingReports.toLocaleString(),
               icon: Shield,
               color: "yellow",

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
                         <div className="flex items-center space-x-4">
                              <Button
                                   onClick={loadStatistics}
                                   disabled={loading}
                                   variant="outline"
                                   className="rounded-2xl"
                              >
                                   <Activity className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                   {loading ? 'Đang tải...' : 'Làm mới'}
                              </Button>
                              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                                   <Shield className="w-8 h-8 text-white" />
                              </div>
                         </div>
                    </div>
               </div>

               {/* Error Message */}
               {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
                         <div className="flex items-center space-x-2">
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                              <p className="text-red-700 font-medium">{error}</p>
                         </div>
                         <Button
                              onClick={loadStatistics}
                              variant="outline"
                              size="sm"
                              className="rounded-2xl"
                         >
                              Thử lại
                         </Button>
                    </div>
               )}

               {/* Stats Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((stat, index) => {
                         const Icon = stat.icon;
                         return (
                              <Card key={index} className="rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                                   <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                             <div className="flex-1">
                                                  <p className="text-sm font-medium text-slate-600 mb-1">{stat.title}</p>
                                                  {loading ? (
                                                       <div className="flex items-center space-x-2">
                                                            <Activity className="w-5 h-5 text-slate-400 animate-spin" />
                                                            <p className="text-2xl font-bold text-slate-400">...</p>
                                                       </div>
                                                  ) : (
                                                       <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                                                  )}

                                             </div>
                                             <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center shadow-lg">
                                                  <Icon className={`w-6 h-6 ${getIconColor(stat.color)} ${loading ? 'opacity-50' : ''}`} />
                                             </div>
                                        </div>
                                   </CardContent>
                              </Card>
                         );
                    })}
               </div>

               {/* Recent Activities */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="rounded-2xl shadow-lg">
                         <CardHeader>
                              <div className="flex items-center justify-between">
                                   <CardTitle className="flex items-center space-x-2">
                                        <Activity className="w-5 h-5 text-blue-600" />
                                        <span>Hoạt động gần đây</span>
                                   </CardTitle>

                              </div>
                         </CardHeader>
                         <CardContent className="scrollbar-hide overflow-auto max-h-96">
                              <div className="space-y-4">
                                   {recentActivities.map((activity) => {
                                        const Icon = activity.icon;
                                        return (
                                             <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm">
                                                  <div className="w-8 h-8 bg-slate-100 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
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
                    <Card className="rounded-2xl shadow-lg">
                         <CardHeader>
                              <div className="flex items-center justify-between">
                                   <CardTitle className="flex items-center space-x-2">
                                        <Settings className="w-5 h-5 text-green-600" />
                                        <span>Thao tác nhanh</span>
                                   </CardTitle>

                              </div>
                         </CardHeader>
                         <CardContent className="scrollbar-hide overflow-auto max-h-96">
                              <div className="space-y-3">
                                   <Button variant="outline" className="w-full justify-start p-3 h-auto hover:bg-red-50 hover:border-red-200 rounded-2xl shadow-sm" onClick={() => navigate('/admin/users')}>
                                        <div className="flex items-center space-x-3">
                                             <Users className="w-5 h-5 text-red-600" />
                                             <div className="text-left">
                                                  <p className="font-medium text-slate-900">Quản lý người dùng</p>
                                                  <p className="text-sm text-slate-600">Xem và quản lý tài khoản</p>
                                             </div>
                                        </div>
                                   </Button>
                                   <Button variant="outline" className="w-full justify-start p-3 h-auto hover:bg-orange-50 hover:border-orange-200 rounded-2xl shadow-sm" onClick={() => navigate('/admin/violations')}>
                                        <div className="flex items-center space-x-3">
                                             <AlertTriangle className="w-5 h-5 text-orange-600" />
                                             <div className="text-left">
                                                  <p className="font-medium text-slate-900">Xử lý báo cáo</p>
                                                  <p className="text-sm text-slate-600">Kiểm tra và xử lý vi phạm</p>
                                             </div>
                                        </div>
                                   </Button>
                                   <Button variant="outline" className="w-full justify-start p-3 h-auto hover:bg-blue-50 hover:border-blue-200 rounded-2xl shadow-sm" onClick={() => navigate('/admin/notifications')}>
                                        <div className="flex items-center space-x-3">
                                             <Bell className="w-5 h-5 text-blue-600" />
                                             <div className="text-left">
                                                  <p className="font-medium text-slate-900">Gửi thông báo</p>
                                                  <p className="text-sm text-slate-600">Tạo thông báo hệ thống</p>
                                             </div>
                                        </div>
                                   </Button>
                                   <Button variant="outline" className="w-full justify-start p-3 h-auto hover:bg-purple-50 hover:border-purple-200 rounded-2xl shadow-sm" onClick={() => navigate('/admin/fields')}>
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

          </div>
     );
}
