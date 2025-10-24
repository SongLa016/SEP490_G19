import React, { useState, useEffect } from "react";
import { Card, Button, Badge } from "../components/ui/index";
import {
     Bell,
     CheckCircle,
     Clock,
     X,
     Eye,
     EyeOff,
} from "lucide-react";
import {
     fetchUserNotifications,
     markNotificationAsRead,
     markAllNotificationsAsRead
} from "../services/notifications";

export default function NotificationsDisplay({ userId, className = "" }) {
     const [notifications, setNotifications] = useState([]);
     const [loading, setLoading] = useState(true);
     const [showAll, setShowAll] = useState(false);
     const [unreadCount, setUnreadCount] = useState(0);

     useEffect(() => {
          loadNotifications();
     }, [userId]);

     const loadNotifications = async () => {
          try {
               setLoading(true);
               const notificationsData = await fetchUserNotifications(userId);
               setNotifications(notificationsData);
               setUnreadCount(notificationsData.filter(n => !n.isRead).length);
          } catch (error) {
               console.error('Error loading notifications:', error);
          } finally {
               setLoading(false);
          }
     };

     const handleMarkAsRead = async (userNotificationId) => {
          try {
               await markNotificationAsRead(userNotificationId);
               loadNotifications();
          } catch (error) {
               console.error('Error marking notification as read:', error);
          }
     };

     const handleMarkAllAsRead = async () => {
          try {
               await markAllNotificationsAsRead(userId);
               loadNotifications();
          } catch (error) {
               console.error('Error marking all notifications as read:', error);
          }
     };

     const getNotificationIcon = (type, priority) => {
          const iconMap = {
               cancellation: "❌",
               maintenance: "🔧",
               update: "📢",
               promotion: "🎉"
          };
          return iconMap[type] || "📢";
     };

     const getPriorityColor = (priority) => {
          const colorMap = {
               low: "bg-gray-100 text-gray-800",
               medium: "bg-blue-100 text-blue-800",
               high: "bg-orange-100 text-orange-800",
               urgent: "bg-red-100 text-red-800"
          };
          return colorMap[priority] || "bg-gray-100 text-gray-800";
     };

     const formatDate = (dateString) => {
          const date = new Date(dateString);
          const now = new Date();
          const diffInHours = (now - date) / (1000 * 60 * 60);

          if (diffInHours < 1) {
               return "Vừa xong";
          } else if (diffInHours < 24) {
               return `${Math.floor(diffInHours)} giờ trước`;
          } else if (diffInHours < 48) {
               return "Hôm qua";
          } else {
               return date.toLocaleDateString("vi-VN");
          }
     };

     const displayedNotifications = showAll ? notifications : notifications.slice(0, 5);

     if (loading) {
          return (
               <Card className={`p-4 ${className}`}>
                    <div className="flex items-center justify-center py-8">
                         <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-200 border-t-blue-600"></div>
                         <span className="ml-3 text-gray-600">Đang tải...</span>
                    </div>
               </Card>
          );
     }

     return (
          <Card className={`p-4 ${className}`}>
               <div className="space-y-4">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                              <Bell className="w-5 h-5 text-blue-600" />
                              <h3 className="font-semibold text-gray-900">Thông báo</h3>
                              {unreadCount > 0 && (
                                   <Badge className="bg-red-100 text-red-800">
                                        {unreadCount} mới
                                   </Badge>
                              )}
                         </div>
                         <div className="flex items-center gap-2">
                              {unreadCount > 0 && (
                                   <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleMarkAllAsRead}
                                        className="text-xs"
                                   >
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Đọc tất cả
                                   </Button>
                              )}
                              <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => setShowAll(!showAll)}
                                   className="text-xs"
                              >
                                   {showAll ? (
                                        <>
                                             <EyeOff className="w-3 h-3 mr-1" />
                                             Thu gọn
                                        </>
                                   ) : (
                                        <>
                                             <Eye className="w-3 h-3 mr-1" />
                                             Xem tất cả
                                        </>
                                   )}
                              </Button>
                         </div>
                    </div>

                    {notifications.length === 0 ? (
                         <div className="text-center py-8">
                              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-500 text-sm">Chưa có thông báo nào</p>
                         </div>
                    ) : (
                         <div className="space-y-3">
                              {displayedNotifications.map((notification) => (
                                   <div
                                        key={notification.userNotificationId}
                                        className={`p-3 rounded-lg border ${notification.isRead
                                             ? "bg-gray-50 border-gray-200"
                                             : "bg-blue-50 border-blue-200"
                                             }`}
                                   >
                                        <div className="flex items-start gap-3">
                                             <span className="text-lg flex-shrink-0">
                                                  {getNotificationIcon(notification.type, notification.priority)}
                                             </span>
                                             <div className="flex-1 min-w-0">
                                                  <div className="flex items-start justify-between mb-1">
                                                       <h4 className={`font-medium text-sm ${notification.isRead ? "text-gray-900" : "text-blue-900"
                                                            }`}>
                                                            {notification.title}
                                                       </h4>
                                                       <div className="flex items-center gap-1 ml-2">
                                                            <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                                                                 {notification.priority === 'urgent' ? 'Khẩn cấp' :
                                                                      notification.priority === 'high' ? 'Cao' :
                                                                           notification.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                                                            </Badge>
                                                            {!notification.isRead && (
                                                                 <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                                            )}
                                                       </div>
                                                  </div>

                                                  <p className={`text-xs mb-2 ${notification.isRead ? "text-gray-600" : "text-blue-700"
                                                       }`}>
                                                       {notification.message}
                                                  </p>

                                                  <div className="flex items-center justify-between">
                                                       <div className="flex items-center gap-1 text-xs text-gray-500">
                                                            <Clock className="w-3 h-3" />
                                                            <span>{formatDate(notification.receivedAt)}</span>
                                                       </div>

                                                       {!notification.isRead && (
                                                            <Button
                                                                 variant="outline"
                                                                 size="sm"
                                                                 onClick={() => handleMarkAsRead(notification.userNotificationId)}
                                                                 className="text-xs"
                                                            >
                                                                 <CheckCircle className="w-3 h-3 mr-1" />
                                                                 Đã đọc
                                                            </Button>
                                                       )}
                                                  </div>
                                             </div>
                                        </div>
                                   </div>
                              ))}
                         </div>
                    )}

                    {notifications.length > 5 && !showAll && (
                         <div className="text-center">
                              <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => setShowAll(true)}
                                   className="text-xs"
                              >
                                   Xem thêm {notifications.length - 5} thông báo
                              </Button>
                         </div>
                    )}
               </div>
          </Card>
     );
}

// Component for notification bell icon with count
export function NotificationBell({ userId, onClick, className = "" }) {
     const [unreadCount, setUnreadCount] = useState(0);

     useEffect(() => {
          const loadUnreadCount = async () => {
               try {
                    const notifications = await fetchUserNotifications(userId);
                    const count = notifications.filter(n => !n.isRead).length;
                    setUnreadCount(count);
               } catch (error) {
                    console.error('Error loading unread count:', error);
               }
          };

          loadUnreadCount();
     }, [userId]);

     return (
          <div className={`relative ${className}`} onClick={onClick}>
               <Bell className="w-6 h-6 text-gray-600 hover:text-gray-900 cursor-pointer" />
               {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                         {unreadCount > 9 ? "9+" : unreadCount}
                    </div>
               )}
          </div>
     );
}

// Component for notification dropdown
export function NotificationDropdown({ userId, isOpen, onClose, className = "" }) {
     const [notifications, setNotifications] = useState([]);
     const [loading, setLoading] = useState(false);

     useEffect(() => {
          if (isOpen) {
               loadNotifications();
          }
     }, [isOpen, userId]);

     const loadNotifications = async () => {
          try {
               setLoading(true);
               const notificationsData = await fetchUserNotifications(userId);
               setNotifications(notificationsData.slice(0, 10)); // Show only latest 10
          } catch (error) {
               console.error('Error loading notifications:', error);
          } finally {
               setLoading(false);
          }
     };

     const handleMarkAsRead = async (userNotificationId) => {
          try {
               await markNotificationAsRead(userNotificationId);
               loadNotifications();
          } catch (error) {
               console.error('Error marking notification as read:', error);
          }
     };

     const handleMarkAllAsRead = async () => {
          try {
               await markAllNotificationsAsRead(userId);
               loadNotifications();
          } catch (error) {
               console.error('Error marking all notifications as read:', error);
          }
     };

     if (!isOpen) return null;

     return (
          <div className={`absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 ${className}`}>
               <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                         <h3 className="font-semibold text-gray-900">Thông báo</h3>
                         <div className="flex items-center gap-2">
                              <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={handleMarkAllAsRead}
                                   className="text-xs"
                              >
                                   Đọc tất cả
                              </Button>
                              <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={onClose}
                                   className="text-xs"
                              >
                                   <X className="w-3 h-3" />
                              </Button>
                         </div>
                    </div>
               </div>

               <div className="max-h-96 overflow-y-auto">
                    {loading ? (
                         <div className="flex items-center justify-center py-8">
                              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-200 border-t-blue-600"></div>
                              <span className="ml-3 text-gray-600">Đang tải...</span>
                         </div>
                    ) : notifications.length === 0 ? (
                         <div className="text-center py-8">
                              <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-500 text-sm">Chưa có thông báo nào</p>
                         </div>
                    ) : (
                         <div className="divide-y divide-gray-200">
                              {notifications.map((notification) => (
                                   <div
                                        key={notification.userNotificationId}
                                        className={`p-3 hover:bg-gray-50 ${!notification.isRead ? "bg-blue-50" : ""
                                             }`}
                                   >
                                        <div className="flex items-start gap-3">
                                             <span className="text-lg flex-shrink-0">
                                                  {notification.type === 'cancellation' ? '❌' :
                                                       notification.type === 'maintenance' ? '🔧' :
                                                            notification.type === 'promotion' ? '🎉' : '📢'}
                                             </span>
                                             <div className="flex-1 min-w-0">
                                                  <div className="flex items-start justify-between mb-1">
                                                       <h4 className={`font-medium text-sm ${notification.isRead ? "text-gray-900" : "text-blue-900"
                                                            }`}>
                                                            {notification.title}
                                                       </h4>
                                                       {!notification.isRead && (
                                                            <div className="w-2 h-2 bg-blue-600 rounded-full ml-2"></div>
                                                       )}
                                                  </div>
                                                  <p className={`text-xs mb-2 ${notification.isRead ? "text-gray-600" : "text-blue-700"
                                                       }`}>
                                                       {notification.message}
                                                  </p>
                                                  <div className="flex items-center justify-between">
                                                       <span className="text-xs text-gray-500">
                                                            {new Date(notification.receivedAt).toLocaleString("vi-VN")}
                                                       </span>
                                                       {!notification.isRead && (
                                                            <Button
                                                                 variant="outline"
                                                                 size="sm"
                                                                 onClick={() => handleMarkAsRead(notification.userNotificationId)}
                                                                 className="text-xs"
                                                            >
                                                                 Đã đọc
                                                            </Button>
                                                       )}
                                                  </div>
                                             </div>
                                        </div>
                                   </div>
                              ))}
                         </div>
                    )}
               </div>

               {notifications.length > 0 && (
                    <div className="p-3 border-t border-gray-200 text-center">
                         <Button
                              variant="outline"
                              size="sm"
                              onClick={onClose}
                              className="text-xs"
                         >
                              Xem tất cả thông báo
                         </Button>
                    </div>
               )}
          </div>
     );
}
