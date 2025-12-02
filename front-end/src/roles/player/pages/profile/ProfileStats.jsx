import { useState, useEffect } from "react";
import { Trophy, Calendar, Star, Users, Target, TrendingUp, Award, Clock, BarChart3, Loader2 } from "lucide-react";
import { Container, Card, CardContent, CardHeader, CardTitle, Button, Section } from "../../../../shared/components/ui";
import { playerStatisticsService } from "../../../../shared/services/playerStatistics";
import { profileService } from "../../../../shared/index";
import { getStoredToken, isTokenExpired } from "../../../../shared/utils/tokenManager";
import { useTranslation } from "../../../../shared/hooks/useTranslation";

export default function ProfileStats({ user }) {
     const { t } = useTranslation();
     const [stats, setStats] = useState({
          totalBookings: 0,
          totalHours: 0,
          averageRating: 0,
          totalSpent: 0,
          favoritePosition: "Chưa cập nhật",
          skillLevel: "Chưa cập nhật",
          joinDate: new Date().toISOString(),
          achievements: [],
          recentActivity: [],
          monthlyStats: []
     });
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState(null);
     const [profileData, setProfileData] = useState(null);

     useEffect(() => {
          const loadStats = async () => {
               try {
                    setLoading(true);
                    setError(null);

                    // Load profile data first
                    let profile = null;
                    let userData = null;
                    try {
                         const profileResult = await profileService.getProfile();
                         if (profileResult.ok && profileResult.profile) {
                              profile = profileResult.profile;
                              setProfileData(profile);
                         }
                    } catch (profileError) {
                         console.warn("Could not load profile:", profileError);
                         // Continue even if profile fails
                    }

                    // Load user data from User table to get createdAt
                    try {
                         // Get userId from token payload
                         const token = getStoredToken();
                         let userId = null;
                         
                         if (token && !isTokenExpired(token)) {
                              try {
                                   // Decode token to get userId
                                   const payload = JSON.parse(atob(token.split('.')[1]));
                                   userId = payload.UserID || payload.userID || payload.userId || payload.id;
                              } catch (decodeError) {
                                   console.warn("Could not decode token:", decodeError);
                              }
                         }
                         
                         // Fallback to user prop or localStorage
                         if (!userId) {
                              const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');
                              userId = currentUser?.userId || currentUser?.id || currentUser?.UserID;
                         }
                         
                         if (userId) {
                              const response = await fetch(
                                   `https://sep490-g19-zxph.onrender.com/api/User/${userId}`,
                                   {
                                        headers: {
                                             'Authorization': `Bearer ${token || localStorage.getItem('token')}`,
                                             'Content-Type': 'application/json'
                                        }
                                   }
                              );
                              
                              if (response.ok) {
                                   userData = await response.json();
                              }
                         }
                    } catch (userError) {
                         console.warn("Could not load user data:", userError);
                         // Continue even if user data fails
                    }

                    // Load all stats from API
                    const allStats = await playerStatisticsService.getAllStats();

                    // Transform monthly stats to match component format
                    const transformedMonthlyStats = Array.isArray(allStats.monthlyStats)
                         ? allStats.monthlyStats.map((stat, index) => {
                              // Handle different possible response formats
                              const monthName = stat.month || stat.monthName || `Tháng ${new Date().getMonth() - index + 1}`;
                              // Ensure all values are numbers
                              const bookings = Number(stat.bookings || stat.totalBookings || 0) || 0;
                              const hours = Number(stat.hours || stat.totalHours || stat.totalPlaying || stat.totalPlayingHours || 0) || 0;
                              const spent = Number(stat.spent || stat.totalSpent || stat.totalSpending || 0) || 0;
                              
                              return {
                                   month: String(monthName), // Ensure month is a string
                                   bookings: bookings,
                                   hours: hours,
                                   spent: spent
                              };
                         })
                         : [];

                    // Transform recent activity to match component format
                    const transformedRecentActivity = Array.isArray(allStats.recentActivity)
                         ? allStats.recentActivity.map((activity, index) => {
                              // Handle different possible response formats
                              // Ensure all values are primitives (string or number)
                              return {
                                   id: Number(activity.id) || index + 1,
                                   type: String(activity.type || activity.activityType || "default"),
                                   message: String(activity.message || activity.description || activity.content || "Hoạt động mới"),
                                   time: String(activity.time || activity.timeAgo || activity.createdAt || "Vừa xong")
                              };
                         })
                         : [];

                    // Ensure all numeric values are actually numbers
                    const safeTotalBookings = Number(allStats.totalBookings) || 0;
                    // Làm tròn tổng giờ chơi về số nguyên gần nhất
                    const safeTotalHours = Math.round(Number(allStats.totalHours) || 0);
                    const safeAverageRating = Number(allStats.averageRating) || 0;
                    const safeTotalSpent = Number(allStats.totalSpent) || 0;

                    // Extract profile information
                    const preferredPositions = profile?.preferredPositions || 
                                               profile?.PreferredPositions || 
                                               user?.preferredPositions || 
                                               "Chưa cập nhật";
                    const skillLevel = profile?.skillLevel || 
                                      profile?.SkillLevel || 
                                      user?.skillLevel || 
                                      "Chưa cập nhật";
                    
                    // Get createdAt from User table (priority: userData > user > profile)
                    const createdAt = userData?.createdAt || 
                                     userData?.CreatedAt ||
                                     userData?.created_at ||
                                     user?.createdAt || 
                                     user?.CreatedAt ||
                                     user?.created_at ||
                                     user?.joinDate || 
                                     profile?.createdAt || 
                                     profile?.CreatedAt || 
                                     new Date().toISOString();

                    setStats({
                         totalBookings: safeTotalBookings,
                         totalHours: safeTotalHours,
                         averageRating: safeAverageRating,
                         totalSpent: safeTotalSpent,
                         favoritePosition: String(preferredPositions) || "Chưa cập nhật",
                         skillLevel: String(skillLevel) || "Chưa cập nhật",
                         joinDate: createdAt,
                         achievements: [
                              { id: 1, name: "Người chơi tích cực", description: "Đặt sân 10 lần trong tháng", icon: Trophy, earned: safeTotalBookings >= 10 },
                              { id: 2, name: "Đánh giá cao", description: "Nhận đánh giá 5 sao", icon: Star, earned: safeAverageRating >= 4.5 },
                              { id: 3, name: "Thành viên lâu năm", description: "Tham gia 6 tháng", icon: Award, earned: false },
                              { id: 4, name: "Tiết kiệm", description: "Tiết kiệm 500k trong tháng", icon: Target, earned: false }
                         ],
                         recentActivity: transformedRecentActivity,
                         monthlyStats: transformedMonthlyStats
                    });
               } catch (err) {
                    console.error("Error loading stats:", err);
                    setError(err.message || "Không thể tải thống kê. Vui lòng thử lại sau.");
               } finally {
                    setLoading(false);
               }
          };

          loadStats();
     }, [user]);

     const formatCurrency = (amount) => {
          return new Intl.NumberFormat('vi-VN', {
               style: 'currency',
               currency: 'VND'
          }).format(amount);
     };

     const formatDate = (dateString) => {
          if (!dateString) return t("profileStats.notUpdated");
          try {
               const date = new Date(dateString);
               if (isNaN(date.getTime())) {
                    return t("profileStats.notUpdated");
               }
               return date.toLocaleDateString('vi-VN');
          } catch (error) {
               console.error("Error formatting date:", error);
               return "Chưa cập nhật";
          }
     };

     const translateSkillLevel = (skillLevel) => {
          if (!skillLevel || skillLevel === "Chưa cập nhật" || skillLevel === t("profileStats.notUpdated")) {
               return t("profileStats.notUpdated");
          }
          
          const skillLevelMap = {
               "beginner": "Mới bắt đầu",
               "intermediate": "Trung bình",
               "advanced": "Nâng cao",
               "professional": "Chuyên nghiệp",
               "Mới bắt đầu": "Mới bắt đầu",
               "Trung bình": "Trung bình",
               "Nâng cao": "Nâng cao",
               "Chuyên nghiệp": "Chuyên nghiệp"
          };
          
          const lowerCaseLevel = String(skillLevel).toLowerCase().trim();
          return skillLevelMap[lowerCaseLevel] || skillLevelMap[skillLevel] || String(skillLevel);
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

     if (loading) {
          return (
               <Section className="relative min-h-screen ">
                    <div className="absolute inset-0 bg-[url('https://mixivivu.com/section-background.png')] bg-cover bg-center border border-teal-600 rounded-3xl" />
                    <Container>
                         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                              <div className="flex flex-col items-center justify-center min-h-[400px]">
                                   <Loader2 className="w-12 h-12 text-teal-600 animate-spin mb-4" />
                                   <p className="text-teal-600 text-lg">{t("profileStats.subtitle")}</p>
                              </div>
                         </div>
                    </Container>
               </Section>
          );
     }

     if (error) {
          return (
               <Section className="relative min-h-screen ">
                    <div className="absolute inset-0 bg-[url('https://mixivivu.com/section-background.png')] bg-cover bg-center border border-teal-600 rounded-3xl" />
                    <Container>
                         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                              <div className="flex flex-col items-center justify-center min-h-[400px]">
                                   <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                                        <h3 className="text-red-800 font-semibold mb-2">{t("common.error")}</h3>
                                        <p className="text-red-600 text-sm mb-4">{error}</p>
                                        <Button
                                             onClick={() => window.location.reload()}
                                             variant="outline"
                                             className="w-full"
                                        >
                                             {t("common.retry") || t("common.confirm")}
                                        </Button>
                                   </div>
                              </div>
                         </div>
                    </Container>
               </Section>
          );
     }

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
                              <h1 className="text-3xl font-bold text-teal-900 mb-2">{t("profileStats.title")}</h1>
                              <p className="text-teal-600 text-base">{t("profileStats.subtitle")}</p>
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
                                                            <p className="text-sm font-medium text-green-600">{t("profileStats.totalBookings")}</p>
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
                                                            <p className="text-sm font-medium text-green-600">{t("profileStats.totalHours")}</p>
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
                                                            <p className="text-sm font-medium text-red-600">{t("profileStats.averageRating")}</p>
                                                            <p className="text-2xl font-bold text-red-900">
                                                                 {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0'}
                                                            </p>
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
                                                            <p className="text-sm font-medium text-red-600">{t("profileStats.totalSpent")}</p>
                                                            <p className="text-2xl font-bold text-red-900">{formatCurrency(stats.totalSpent)}</p>
                                                       </div>
                                                  </div>
                                             </CardContent>
                                        </Card>
                                   </div>

                                   {/* Monthly Stats Chart */}
                                   <Card>
                                        <CardHeader>
                                             <CardTitle>{t("profileStats.monthlyStats")}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                             {stats.monthlyStats.length > 0 ? (
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
                                             ) : (
                                                  <div className="text-center py-8 text-gray-500">
                                                       <p>{t("profileStats.noMonthlyStats")}</p>
                                                  </div>
                                             )}
                                        </CardContent>
                                   </Card>

                                   {/* Recent Activity */}
                                   <Card>
                                        <CardHeader>
                                             <CardTitle>{t("profileStats.recentActivity")}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                             {stats.recentActivity.length > 0 ? (
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
                                             ) : (
                                                  <div className="text-center py-8 text-gray-500">
                                                       <p>{t("profileStats.noRecentActivity")}</p>
                                                  </div>
                                             )}
                                        </CardContent>
                                   </Card>
                              </div>

                              {/* Sidebar */}
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                   {/* Profile Summary */}
                                   <Card>
                                        <CardHeader>
                                             <CardTitle>{t("profileStats.profileSummary")}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                             <div>
                                                  <label className="text-sm font-medium text-gray-600">{t("profileStats.favoritePosition")}</label>
                                                  <p className="text-gray-900">{stats.favoritePosition}</p>
                                             </div>
                                             <div>
                                                  <label className="text-sm font-medium text-gray-600">{t("profileStats.skillLevel")}</label>
                                                  <p className="text-gray-900">{translateSkillLevel(stats.skillLevel)}</p>
                                             </div>
                                             <div>
                                                  <label className="text-sm font-medium text-gray-600">{t("profileStats.joinedFrom")}</label>
                                                  <p className="text-gray-900">{formatDate(stats.joinDate)}</p>
                                             </div>
                                             <div>
                                                  <label className="text-sm font-medium text-gray-600">{t("profileStats.activeTime")}</label>
                                                  <p className="text-gray-900">
                                                       {Math.floor((new Date() - new Date(stats.joinDate)) / (1000 * 60 * 60 * 24))} {t("profileStats.days")}
                                                  </p>
                                             </div>
                                        </CardContent>
                                   </Card>

                                   {/* Achievements */}
                                   <Card>
                                        <CardHeader>
                                             <CardTitle>{t("profileStats.achievements")}</CardTitle>
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
                                             <CardTitle>{t("profileStats.quickActions")}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                             <Button className="w-full" variant="outline">
                                                  <Calendar className="w-4 h-4 mr-2" />
                                                  {t("profileStats.newBooking")}
                                             </Button>
                                             <Button className="w-full" variant="outline">
                                                  <Users className="w-4 h-4 mr-2" />
                                                  {t("profileStats.findOpponent")}
                                             </Button>
                                             <Button className="w-full" variant="outline">
                                                  <Star className="w-4 h-4 mr-2" />
                                                  {t("profileStats.rateField")}
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
