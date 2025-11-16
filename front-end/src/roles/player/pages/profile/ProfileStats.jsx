import { useState, useEffect } from "react";
import { Trophy, Calendar, Star, Users, Target, TrendingUp, Award, Clock, BarChart3 } from "lucide-react";
import { Container, Card, CardContent, CardHeader, CardTitle, Button, Section } from "../../../../shared/components/ui";

export default function ProfileStats({ user }) {
     const [stats, setStats] = useState({
          totalBookings: 0,
          totalHours: 0,
          averageRating: 0,
          totalSpent: 0,
          favoritePosition: "Tiền đạo",
          skillLevel: "Trung bình",
          joinDate: "2024-01-15",
          achievements: [],
          recentActivity: [],
          monthlyStats: []
     });

     useEffect(() => {
          // Simulate loading stats data
          setStats({
               totalBookings: 24,
               totalHours: 48,
               averageRating: 4.2,
               totalSpent: 2400000,
               favoritePosition: "Tiền đạo",
               skillLevel: "Trung bình",
               joinDate: "2024-01-15",
               achievements: [
                    { id: 1, name: "Người chơi tích cực", description: "Đặt sân 10 lần trong tháng", icon: Trophy, earned: true },
                    { id: 2, name: "Đánh giá cao", description: "Nhận đánh giá 5 sao", icon: Star, earned: true },
                    { id: 3, name: "Thành viên lâu năm", description: "Tham gia 6 tháng", icon: Award, earned: false },
                    { id: 4, name: "Tiết kiệm", description: "Tiết kiệm 500k trong tháng", icon: Target, earned: false }
               ],
               recentActivity: [
                    { id: 1, type: "booking", message: "Đặt sân Sân ABC - 19:00 ngày 15/12", time: "2 giờ trước" },
                    { id: 2, type: "rating", message: "Đánh giá sân XYZ 5 sao", time: "1 ngày trước" },
                    { id: 3, type: "payment", message: "Thanh toán thành công 200,000 VNĐ", time: "2 ngày trước" },
                    { id: 4, type: "achievement", message: "Nhận thành tích 'Người chơi tích cực'", time: "3 ngày trước" }
               ],
               monthlyStats: [
                    { month: "Tháng 12", bookings: 8, hours: 16, spent: 800000 },
                    { month: "Tháng 11", bookings: 6, hours: 12, spent: 600000 },
                    { month: "Tháng 10", bookings: 10, hours: 20, spent: 1000000 }
               ]
          });
     }, []);

     const formatCurrency = (amount) => {
          return new Intl.NumberFormat('vi-VN', {
               style: 'currency',
               currency: 'VND'
          }).format(amount);
     };

     const formatDate = (dateString) => {
          return new Date(dateString).toLocaleDateString('vi-VN');
     };

     const getActivityIcon = (type) => {
          switch (type) {
               case "booking":
                    return Calendar;
               case "rating":
                    return Star;
               case "payment":
                    return TrendingUp;
               case "achievement":
                    return Trophy;
               default:
                    return Clock;
          }
     };

     const getActivityColor = (type) => {
          switch (type) {
               case "booking":
                    return "text-blue-600 bg-blue-100";
               case "rating":
                    return "text-yellow-600 bg-yellow-100";
               case "payment":
                    return "text-green-600 bg-green-100";
               case "achievement":
                    return "text-purple-600 bg-purple-100";
               default:
                    return "text-gray-600 bg-gray-100";
          }
     };

     return (
          <Section className="relative min-h-screen ">
               <div className="absolute inset-0 bg-[url('https://mixivivu.com/section-background.png')] bg-cover bg-center border border-teal-600 rounded-3xl" />
               <Container>
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                         {/* Header */}
                         <div className="my-2 text-center">
                              <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-100 rounded-2xl mb-4">
                                   <BarChart3 className="w-8 h-8 text-teal-600" />
                              </div>
                              <h1 className="text-3xl font-bold text-teal-900 mb-2">Thống kê cá nhân</h1>
                              <p className="text-teal-600 text-base">Theo dõi hoạt động và thành tích của bạn</p>
                         </div>

                         <div className="space-y-8">
                              {/* Main Stats */}
                              <div className="space-y-6">
                                   {/* Overview Cards */}
                                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl hover:shadow-xl transition-all duration-300">
                                             <CardContent className="p-6">
                                                  <div className="flex items-center">
                                                       <div className="p-3 bg-green-100 rounded-2xl mr-4">
                                                            <Calendar className="w-6 h-6 text-green-600" />
                                                       </div>
                                                       <div>
                                                            <p className="text-sm font-medium text-green-600">Tổng lượt đặt</p>
                                                            <p className="text-2xl font-bold text-green-900">{stats.totalBookings}</p>
                                                       </div>
                                                  </div>
                                             </CardContent>
                                        </Card>

                                        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl hover:shadow-xl transition-all duration-300">
                                             <CardContent className="p-6">
                                                  <div className="flex items-center">
                                                       <div className="p-3 bg-green-100 rounded-2xl mr-4">
                                                            <Clock className="w-6 h-6 text-green-600" />
                                                       </div>
                                                       <div>
                                                            <p className="text-sm font-medium text-green-600">Tổng giờ chơi</p>
                                                            <p className="text-2xl font-bold text-green-900">{stats.totalHours}h</p>
                                                       </div>
                                                  </div>
                                             </CardContent>
                                        </Card>

                                        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl hover:shadow-xl transition-all duration-300">
                                             <CardContent className="p-6">
                                                  <div className="flex items-center">
                                                       <div className="p-3 bg-red-100 rounded-2xl mr-4">
                                                            <Star className="w-6 h-6 text-red-600" />
                                                       </div>
                                                       <div>
                                                            <p className="text-sm font-medium text-red-600">Đánh giá TB</p>
                                                            <p className="text-2xl font-bold text-red-900">{stats.averageRating}</p>
                                                       </div>
                                                  </div>
                                             </CardContent>
                                        </Card>

                                        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl hover:shadow-xl transition-all duration-300">
                                             <CardContent className="p-6">
                                                  <div className="flex items-center">
                                                       <div className="p-3 bg-red-100 rounded-2xl mr-4">
                                                            <TrendingUp className="w-6 h-6 text-red-600" />
                                                       </div>
                                                       <div>
                                                            <p className="text-sm font-medium text-red-600">Tổng chi tiêu</p>
                                                            <p className="text-2xl font-bold text-red-900">{formatCurrency(stats.totalSpent)}</p>
                                                       </div>
                                                  </div>
                                             </CardContent>
                                        </Card>
                                   </div>

                                   {/* Monthly Stats Chart */}
                                   <Card>
                                        <CardHeader>
                                             <CardTitle>Thống kê theo tháng</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                             <div className="space-y-4">
                                                  {stats.monthlyStats.map((month, index) => (
                                                       <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                                            <div>
                                                                 <h4 className="font-medium">{month.month}</h4>
                                                                 <p className="text-sm text-gray-600">
                                                                      {month.bookings} lượt đặt • {month.hours}h chơi
                                                                 </p>
                                                            </div>
                                                            <div className="text-right">
                                                                 <p className="font-semibold text-teal-600">{formatCurrency(month.spent)}</p>
                                                            </div>
                                                       </div>
                                                  ))}
                                             </div>
                                        </CardContent>
                                   </Card>

                                   {/* Recent Activity */}
                                   <Card>
                                        <CardHeader>
                                             <CardTitle>Hoạt động gần đây</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                             <div className="space-y-4">
                                                  {stats.recentActivity.map((activity) => {
                                                       const Icon = getActivityIcon(activity.type);
                                                       return (
                                                            <div key={activity.id} className="flex items-start space-x-3">
                                                                 <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                                                                      <Icon className="w-4 h-4" />
                                                                 </div>
                                                                 <div className="flex-1 min-w-0">
                                                                      <p className="text-sm text-gray-900">{activity.message}</p>
                                                                      <p className="text-xs text-gray-500">{activity.time}</p>
                                                                 </div>
                                                            </div>
                                                       );
                                                  })}
                                             </div>
                                        </CardContent>
                                   </Card>
                              </div>

                              {/* Sidebar */}
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                   {/* Profile Summary */}
                                   <Card>
                                        <CardHeader>
                                             <CardTitle>Tóm tắt hồ sơ</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                             <div>
                                                  <label className="text-sm font-medium text-gray-600">Vị trí ưa thích</label>
                                                  <p className="text-gray-900">{stats.favoritePosition}</p>
                                             </div>
                                             <div>
                                                  <label className="text-sm font-medium text-gray-600">Trình độ</label>
                                                  <p className="text-gray-900">{stats.skillLevel}</p>
                                             </div>
                                             <div>
                                                  <label className="text-sm font-medium text-gray-600">Tham gia từ</label>
                                                  <p className="text-gray-900">{formatDate(stats.joinDate)}</p>
                                             </div>
                                             <div>
                                                  <label className="text-sm font-medium text-gray-600">Thời gian hoạt động</label>
                                                  <p className="text-gray-900">
                                                       {Math.floor((new Date() - new Date(stats.joinDate)) / (1000 * 60 * 60 * 24))} ngày
                                                  </p>
                                             </div>
                                        </CardContent>
                                   </Card>

                                   {/* Achievements */}
                                   <Card>
                                        <CardHeader>
                                             <CardTitle>Thành tích</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                             <div className="space-y-4">
                                                  {stats.achievements.map((achievement) => {
                                                       const Icon = achievement.icon;
                                                       return (
                                                            <div key={achievement.id} className={`p-4 rounded-lg border ${achievement.earned ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                                                                 }`}>
                                                                 <div className="flex items-start">
                                                                      <div className={`p-2 rounded-full ${achievement.earned ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                                                           }`}>
                                                                           <Icon className="w-4 h-4" />
                                                                      </div>
                                                                      <div className="ml-3 flex-1">
                                                                           <h4 className={`font-medium ${achievement.earned ? 'text-green-800' : 'text-red-800'
                                                                                }`}>
                                                                                {achievement.name}
                                                                           </h4>
                                                                           <p className={`text-sm ${achievement.earned ? 'text-green-600' : 'text-red-600'
                                                                                }`}>
                                                                                {achievement.description}
                                                                           </p>
                                                                      </div>
                                                                      {achievement.earned ? (
                                                                           <div className="text-green-600">
                                                                                <Award className="w-5 h-5" />
                                                                           </div>
                                                                      ) : (
                                                                           <div className="text-red-600">
                                                                                <Award className="w-5 h-5" />
                                                                           </div>
                                                                      )}
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
                                             <CardTitle>Hành động nhanh</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                             <Button className="w-full" variant="outline">
                                                  <Calendar className="w-4 h-4 mr-2" />
                                                  Đặt sân mới
                                             </Button>
                                             <Button className="w-full" variant="outline">
                                                  <Users className="w-4 h-4 mr-2" />
                                                  Tìm đối thủ
                                             </Button>
                                             <Button className="w-full" variant="outline">
                                                  <Star className="w-4 h-4 mr-2" />
                                                  Đánh giá sân
                                             </Button>
                                        </CardContent>
                                   </Card>
                              </div>
                         </div>
                    </div>
               </Container>
          </Section>
     );
}
