import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { Card, Button } from "../../../shared/components/ui";
import {
     Bell,
     Send,
     Target,
     Calendar,
     MessageSquare,
     AlertCircle,
     CheckCircle,
     Eye,
} from "lucide-react";
import {
     fetchNotifications,
     getNotificationStats,
     markNotificationAsRead,
     markAllNotificationsAsRead
} from "../../../shared/index";

export default function NotificationsManagement() {
     const { user } = useAuth();
     const [notifications, setNotifications] = useState([]);
     const [stats, setStats] = useState(null);
     const [loading, setLoading] = useState(true);

     const notificationTypes = [
          { value: 'System', label: 'Hệ thống', icon: '🔔', color: 'bg-purple-100 text-purple-800' },
          { value: 'system', label: 'Hệ thống', icon: '🔔', color: 'bg-purple-100 text-purple-800' },
          { value: 'cancellation', label: 'Hủy đặt sân', icon: '❌', color: 'bg-red-100 text-red-800' },
          { value: 'maintenance', label: 'Bảo trì', icon: '🔧', color: 'bg-yellow-100 text-yellow-800' },
          { value: 'update', label: 'Cập nhật', icon: '📢', color: 'bg-blue-100 text-blue-800' },
          { value: 'promotion', label: 'Khuyến mãi', icon: '🎉', color: 'bg-green-100 text-green-800' }
     ];

     const priorityLevels = [
          { value: 'low', label: 'Thấp', color: 'bg-gray-100 text-gray-800' },
          { value: 'medium', label: 'Trung bình', color: 'bg-blue-100 text-blue-800' },
          { value: 'high', label: 'Cao', color: 'bg-orange-100 text-orange-800' },
          { value: 'urgent', label: 'Khẩn cấp', color: 'bg-red-100 text-red-800' }
     ];

     const loadData = useCallback(async () => {
          try {
               setLoading(true);
               const [notificationsData, statsData] = await Promise.all([
                    fetchNotifications(user?.id || 1),
                    getNotificationStats(user?.id || 1)
               ]);

               setNotifications(notificationsData);
               setStats(statsData);
          } catch (error) {
               console.error('Error loading data:', error);
          } finally {
               setLoading(false);
          }
     }, [user?.id]);

     useEffect(() => {
          loadData();
     }, [loadData]);

     const handleMarkAsRead = async (notificationId) => {
          try {
               await markNotificationAsRead(notificationId);
               // Cập nhật state local
               setNotifications(prev => prev.map(n =>
                    n.notificationId === notificationId ? { ...n, isRead: true } : n
               ));
          } catch (error) {
               console.error('Error marking notification as read:', error);
          }
     };

     const handleMarkAllAsRead = async () => {
          try {
               await markAllNotificationsAsRead(user?.id || 1);
               // Cập nhật tất cả thông báo thành đã đọc
               setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
          } catch (error) {
               console.error('Error marking all notifications as read:', error);
          }
     };

     // Đếm số thông báo chưa đọc
     const unreadCount = notifications.filter(n => !n.isRead).length;

     const getTypeInfo = (type) => {
          return notificationTypes.find(t => t.value === type) || notificationTypes[0];
     };

     const getPriorityInfo = (priority) => {
          return priorityLevels.find(p => p.value === priority) || priorityLevels[1];
     };

     const formatDate = (dateString) => {
          if (!dateString || dateString === 'Invalid Date') return 'Không xác định';
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return 'Không xác định';
          return date.toLocaleString("vi-VN");
     };

     if (loading) {
          return (
               <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Đang tải...</div>
               </div>
          );
     }

     return (
          <div className="space-y-6">
               <div className="flex items-center justify-between">
                    <div>
                         <h1 className="text-3xl font-bold text-gray-900">Thông báo</h1>
                         <p className="text-gray-600 mt-1">Xem các thông báo từ hệ thống</p>
                    </div>
                    {unreadCount > 0 && (
                         <Button
                              onClick={handleMarkAllAsRead}
                              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl"
                         >
                              <CheckCircle className="w-4 h-4" />
                              Đọc tất cả ({unreadCount})
                         </Button>
                    )}
               </div>

               {/* Statistics */}
               {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                         <Card className="p-4 rounded-2xl shadow-lg border my-auto border-blue-300">
                              <div className="flex items-center justify-between gap-3">
                                   <div className="flex items-center gap-3">
                                        <Bell className="w-8 h-8 text-blue-600" />
                                        <div className="text-sm font-medium text-gray-700">Tổng thông báo</div>
                                   </div>
                                   <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                              </div>
                         </Card>
                         <Card className="p-4 rounded-2xl shadow-lg border my-auto border-green-300">
                              <div className="flex items-center justify-between gap-3">
                                   <div className="flex items-center gap-3">
                                        <Send className="w-8 h-8 text-green-600" />
                                        <div className="text-sm font-medium text-gray-700">Đã nhận</div>
                                   </div>
                                   <div className="text-2xl font-bold text-gray-900">{stats.sent}</div>
                              </div>
                         </Card>
                         <Card className="p-4 rounded-2xl shadow-lg border my-auto border-red-300">
                              <div className="flex items-center justify-between gap-3">
                                   <div className="flex items-center gap-3">
                                        <AlertCircle className="w-8 h-8 text-red-600" />
                                        <div className="text-sm font-medium text-gray-700">Ưu tiên cao</div>
                                   </div>
                                   <div className="text-2xl font-bold text-gray-900">{stats.byPriority.urgent + stats.byPriority.high}</div>
                              </div>
                         </Card>
                         <Card className="p-4 rounded-2xl shadow-lg border my-auto border-purple-300">
                              <div className="flex items-center justify-between gap-3">
                                   <div className="flex items-center gap-3">
                                        <MessageSquare className="w-8 h-8 text-purple-600" />
                                        <div className="text-sm font-medium text-gray-700">Hệ thống</div>
                                   </div>
                                   <div className="text-2xl font-bold text-gray-900">{stats.byType.system || stats.byType.System || 0}</div>
                              </div>
                         </Card>
                    </div>
               )}

               {/* Notifications List */}
               {notifications.length === 0 ? (
                    <Card className="p-6 rounded-2xl shadow-lg border border-blue-300">
                         <div className="text-center py-12">
                              <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có thông báo nào</h3>
                              <p className="text-gray-500">Bạn sẽ nhận được thông báo từ hệ thống tại đây</p>
                         </div>
                    </Card>
               ) : (
                    <div className="grid gap-6">
                         {notifications.map((notification) => {
                              const typeInfo = getTypeInfo(notification.type);
                              const priorityInfo = getPriorityInfo(notification.priority);

                              return (
                                   <Card key={notification.notificationId} className="p-6 rounded-2xl shadow-lg border border-blue-300">
                                        <div className="flex items-start justify-between">
                                             <div className="flex-1">
                                                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                       <span className="text-2xl flex-shrink-0">{typeInfo.icon}</span>
                                                       <h3 className="text-lg font-semibold text-gray-900 truncate max-w-xs">{notification.title || 'Thông báo'}</h3>
                                                       <span className={`text-xs px-2 py-1 font-medium rounded-full flex-shrink-0 ${typeInfo.color}`}>
                                                            {typeInfo.label}
                                                       </span>
                                                       <span className={`text-xs px-2 py-1 font-medium rounded-full flex-shrink-0 ${priorityInfo.color}`}>
                                                            {priorityInfo.label}
                                                       </span>
                                                  </div>

                                                  <p className="text-gray-600 mb-3 text-sm font-medium line-clamp-3">Nội dung: {notification.message}</p>

                                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-500">
                                                       <div className="flex items-center gap-1">
                                                            <Target className="w-4 h-4" />
                                                            <span>Từ: Admin</span>
                                                       </div>
                                                       <div className="flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>Gửi: {formatDate(notification.sentAt || notification.createdAt)}</span>
                                                       </div>
                                                       <div className="flex items-center gap-1">
                                                            <CheckCircle className="w-4 h-4" />
                                                            <span>{notification.isRead ? 'Đã đọc' : 'Chưa đọc'}</span>
                                                       </div>
                                                  </div>
                                             </div>

                                             {/* Button đánh dấu đã đọc */}
                                             {!notification.isRead && (
                                                  <Button
                                                       variant="outline"
                                                       size="sm"
                                                       onClick={() => handleMarkAsRead(notification.notificationId)}
                                                       className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-300 rounded-2xl"
                                                  >
                                                       <Eye className="w-4 h-4" />
                                                       Đã đọc
                                                  </Button>
                                             )}
                                        </div>
                                   </Card>
                              );
                         })}
                    </div>
               )}
          </div>
     );
}
