import React, { useState, useEffect, useCallback } from "react";
import { Card, Button, Badge } from "../components/ui/index";
import {
     Bell,
     CheckCircle,
     Clock,
     X,
     Eye,
     EyeOff,
     Trash2,
     Filter
} from "lucide-react";
import {
     getLatestNotifications,
     getUnreadCount,
     getNotificationsByType,
     markNotificationAsRead,
     markAllNotificationsAsRead,
     deleteNotification,
     deleteAllNotifications
} from "../services/notifications";
import { useNavigate } from "react-router-dom";
import { deletePost } from "../services/posts";
import { deleteComment, fetchCommentById } from "../services/comments";
import Swal from "sweetalert2";

// Helper function to fetch user profile by userId
const fetchUserProfile = async (userId) => {
     if (!userId) return null;
     try {
          const token = localStorage.getItem("token");
          const response = await fetch(
               `https://sep490-g19-zxph.onrender.com/api/PlayerProfile/${userId}`,
               {
                    headers: {
                         "Content-Type": "application/json",
                         ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
               }
          );
          if (response.ok) {
               return await response.json();
          }
     } catch (error) {
          console.error("[NotificationsDisplay] Error fetching user profile:", error);
     }
     return null;
};

const NOTIFICATION_TYPES = [
     { label: "Tất cả", value: "all" },
     { label: "Hệ thống", value: "System" },
     { label: "Bình luận", value: "Comment" },
     { label: "Lượt thích", value: "Like" },
     { label: "Kết quả báo cáo", value: "ReportResult" },
     { label: "Nhắc đến", value: "Mention" },
];

const COMMENT_NOTIFICATION_TYPES = new Set(["comment", "newcomment", "reply", "mention"]);

const cleanString = (value) => (typeof value === "string" ? value.trim() : "");

const getNotificationType = (notification) => cleanString(notification?.type || notification?.notificationType).toLowerCase();

const isCommentNotification = (notification) => COMMENT_NOTIFICATION_TYPES.has(getNotificationType(notification));

const getCommentIdFromNotification = (notification) => {
     const candidates = [
          notification?.commentId,
          notification?.commentID,
          notification?.CommentId,
          notification?.CommentID,
          notification?.targetCommentId,
          notification?.targetCommentID,
          notification?.TargetCommentId,
          notification?.TargetCommentID,
          notification?.relatedCommentId,
          notification?.relatedCommentID,
          notification?.Comment?.id,
          notification?.comment?.id,
          notification?.metadata?.commentId,
          notification?.metadata?.CommentId,
     ];

     const fallbackTarget = notification?.targetId || notification?.targetID || notification?.TargetId || notification?.TargetID;
     return (candidates.find((id) => id !== undefined && id !== null && id !== "") ?? fallbackTarget) || null;
};

const extractActorNameFromNotification = (notification) => {
     const sources = [
          notification?.actorName,
          notification?.actorFullName,
          notification?.actorUsername,
          notification?.senderName,
          notification?.senderFullName,
          notification?.senderUsername,
          notification?.triggerUserName,
          notification?.triggerFullName,
          notification?.triggeredByName,
          notification?.createdByName,
          notification?.metadata?.actorName,
          notification?.metadata?.fullName,
          notification?.metadata?.senderName,
          notification?.metadata?.createdByName,
          notification?.data?.actorName,
          notification?.data?.fullName,
          notification?.data?.senderName,
          notification?.additionalData?.actorName,
          notification?.additionalData?.fullName,
          notification?.additionalData?.senderName,
     ];

     return cleanString(sources.find((value) => cleanString(value)) || "");
};

const formatNotificationMessage = (notification) => {
     const actorName = cleanString(notification?.actorName);
     const baseMessage = cleanString(notification?.message) || cleanString(notification?.title);

     if (!actorName && !baseMessage) {
          return "Bạn có thông báo mới";
     }

     if (!actorName) {
          return baseMessage;
     }

     if (!baseMessage) {
          return actorName;
     }

     return baseMessage.toLowerCase().includes(actorName.toLowerCase())
          ? baseMessage
          : `${actorName} ${baseMessage}`;
};

const LIKE_NOTIFICATION_TYPES = new Set(["like", "newlike", "postlike"]);

const isLikeNotification = (notification) => LIKE_NOTIFICATION_TYPES.has(getNotificationType(notification));

const getActorIdFromNotification = (notification) => {
     const candidates = [
          // Direct actor/user ID fields
          notification?.actorId,
          notification?.actorID,
          notification?.ActorId,
          notification?.ActorID,
          notification?.userId,
          notification?.userID,
          notification?.UserId,
          notification?.UserID,
          // Triggered by fields
          notification?.triggeredByUserId,
          notification?.triggeredByUserID,
          notification?.TriggeredByUserId,
          notification?.TriggeredByUserID,
          notification?.triggeredBy,
          notification?.TriggeredBy,
          // Sender fields
          notification?.senderId,
          notification?.senderID,
          notification?.SenderId,
          notification?.SenderID,
          // From user fields
          notification?.fromUserId,
          notification?.fromUserID,
          notification?.FromUserId,
          notification?.FromUserID,
          // Liked by fields
          notification?.likedByUserId,
          notification?.likedByUserID,
          notification?.LikedByUserId,
          notification?.LikedByUserID,
          notification?.likedBy,
          notification?.LikedBy,
          // Nested in metadata
          notification?.metadata?.actorId,
          notification?.metadata?.userId,
          notification?.metadata?.UserId,
          notification?.metadata?.triggeredBy,
          notification?.metadata?.senderId,
          notification?.metadata?.likedBy,
          // Nested in data
          notification?.data?.actorId,
          notification?.data?.userId,
          notification?.data?.UserId,
          notification?.data?.triggeredBy,
          notification?.data?.likedBy,
          // Nested in additionalData
          notification?.additionalData?.actorId,
          notification?.additionalData?.userId,
          notification?.additionalData?.UserId,
     ];
     return candidates.find((id) => id !== undefined && id !== null && id !== "") || null;
};

const enrichNotificationsWithActors = async (notifications) => {
     if (!Array.isArray(notifications) || notifications.length === 0) {
          return notifications || [];
     }
     const commentCache = new Map();
     const userCache = new Map();

     const enriched = await Promise.all(
          notifications.map(async (notification) => {
               const existingActor = extractActorNameFromNotification(notification);

               if (existingActor) {
                    return { ...notification, actorName: existingActor };
               }
               // lấy thông tin user cho thông báo like
               if (isLikeNotification(notification)) {
                    const actorId = getActorIdFromNotification(notification);
                    if (!actorId) {
                         return notification;
                    }

                    try {
                         let userProfile = userCache.get(actorId);
                         if (userProfile === undefined) {
                              userProfile = await fetchUserProfile(actorId);
                              userCache.set(actorId, userProfile || null);
                         }

                         if (!userProfile) {
                              return notification;
                         }

                         const actorName =
                              cleanString(userProfile.fullName) ||
                              cleanString(userProfile.FullName) ||
                              cleanString(userProfile.userName) ||
                              cleanString(userProfile.UserName) ||
                              cleanString(userProfile.username) ||
                              cleanString(userProfile.Username);

                         return {
                              ...notification,
                              actorName: actorName || notification.actorName,
                         };
                    } catch (error) {
                         console.error("[NotificationsDisplay] Không thể tải profile cho thông báo like:", actorId, error);
                         return notification;
                    }
               }

               // lấy thông tin user cho thông báo comment
               if (!isCommentNotification(notification)) {
                    return notification;
               }

               const commentId = getCommentIdFromNotification(notification);
               if (!commentId) {
                    return notification;
               }

               try {
                    let comment = commentCache.get(commentId);
                    if (comment === undefined) {
                         comment = await fetchCommentById(commentId);
                         commentCache.set(commentId, comment || null);
                    }

                    if (!comment) {
                         return notification;
                    }

                    const actorName =
                         cleanString(comment.author?.name) ||
                         cleanString(comment.author?.fullName) ||
                         cleanString(comment.author?.username) ||
                         cleanString(comment.fullName) ||
                         cleanString(comment.userName);

                    return {
                         ...notification,
                         actorName: actorName || notification.actorName,
                         commentContent: comment.content || notification.commentContent,
                         commentAuthorId: comment.author?.id || notification.commentAuthorId,
                    };
               } catch (error) {
                    console.error("[NotificationsDisplay] Không thể tải bình luận cho thông báo:", commentId, error);
                    return notification;
               }
          })
     );

     return enriched;
};

export default function NotificationsDisplay({ userId, className = "" }) {
     const [notifications, setNotifications] = useState([]);
     const [loading, setLoading] = useState(true);
     const [showAll, setShowAll] = useState(false);
     const [unreadCount, setUnreadCount] = useState(0);
     const [activeType, setActiveType] = useState("all");
     const [isDeleting, setIsDeleting] = useState(false);

     const parseNotifications = (payload) => {
          if (Array.isArray(payload)) {
               return payload;
          }
          if (payload?.notifications) {
               return payload.notifications;
          }
          if (payload?.data) {
               return Array.isArray(payload.data)
                    ? payload.data
                    : payload.data.notifications || payload.data.items || payload.data.results || [];
          }
          if (payload?.items) {
               return payload.items;
          }
          return [];
     };

     const fetchUnreadCount = useCallback(async () => {
          try {
               const countResult = await getUnreadCount();
               if (countResult.ok) {
                    setUnreadCount(countResult.count);
               }
          } catch (error) {
               console.error('❌ [NotificationsDisplay] Error loading unread count:', error);
          }
     }, []);

     const loadNotifications = useCallback(async (typeOverride) => {
          const typeToLoad = typeOverride || activeType;
          try {
               setLoading(true);

               let notificationsData = [];

               if (typeToLoad === "all") {
                    const latestResult = await getLatestNotifications(20);
                    if (latestResult.ok) {
                         notificationsData = parseNotifications(latestResult.data);
                    } else {
                         console.error('❌ [NotificationsDisplay] Failed to load:', latestResult.reason);
                    }
               } else {
                    const typeResult = await getNotificationsByType(typeToLoad, { page: 1, pageSize: 20 });
                    if (typeResult.ok) {
                         notificationsData = parseNotifications(typeResult.data ?? typeResult.raw);
                    } else {
                         console.error('❌ [NotificationsDisplay] Failed to load by type:', typeResult.reason);
                    }
               }

               const enrichedNotifications = await enrichNotificationsWithActors(notificationsData);
               setNotifications(enrichedNotifications);
          } catch (error) {
               console.error('❌ [NotificationsDisplay] Error loading notifications:', error);
          } finally {
               setLoading(false);
          }
     }, [activeType]);

     useEffect(() => {
          loadNotifications(activeType);
          fetchUnreadCount();
     }, [userId, activeType, loadNotifications, fetchUnreadCount]);

     const handleMarkAsRead = async (notificationId) => {
          try {
               const result = await markNotificationAsRead(notificationId);
               if (result.ok) {
                    await Promise.all([loadNotifications(), fetchUnreadCount()]);
               } else {
                    console.error('Error marking notification as read:', result.reason);
               }
          } catch (error) {
               console.error('Error marking notification as read:', error);
          }
     };

     const handleMarkAllAsRead = async () => {
          try {
               const result = await markAllNotificationsAsRead();
               if (result.ok) {
                    await Promise.all([loadNotifications(), fetchUnreadCount()]);
               } else {
                    console.error('Error marking all notifications as read:', result.reason);
               }
          } catch (error) {
               console.error('Error marking all notifications as read:', error);
          }
     };

     // xử lý xóa thông báo
     const handleDeleteNotification = async (notificationId, messagePreview = "") => {
          if (!notificationId) return;

          const result = await Swal.fire({
               title: 'Xác nhận xóa?',
               text: `Bạn có chắc muốn xóa thông báo "${messagePreview || notificationId}"?`,
               icon: 'warning',
               showCancelButton: true,
               confirmButtonColor: '#ef4444',
               cancelButtonColor: '#6b7280',
               confirmButtonText: 'Xóa',
               cancelButtonText: 'Hủy'
          });

          if (!result.isConfirmed) {
               return;
          }

          try {
               setIsDeleting(true);
               const result = await deleteNotification(notificationId);
               if (result.ok) {
                    await Promise.all([loadNotifications(), fetchUnreadCount()]);
                    Swal.fire({
                         icon: 'success',
                         title: 'Đã xóa!',
                         text: 'Thông báo đã được xóa thành công.',
                         timer: 2000,
                         showConfirmButton: false
                    });
               } else {
                    Swal.fire({
                         icon: 'error',
                         title: 'Lỗi',
                         text: result.reason || "Không thể xóa thông báo",
                         confirmButtonText: 'Đã hiểu'
                    });
               }
          } catch (error) {
               console.error("Error deleting notification:", error);
               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: "Có lỗi xảy ra khi xóa thông báo",
                    confirmButtonText: 'Đã hiểu'
               });
          } finally {
               setIsDeleting(false);
          }
     };

     // xử lý xóa nội dung bị báo cáo (bài viết/comment)
     const handleDeleteReportedContentMain = async (notification) => {
          const targetId = notification.targetId || notification.targetID || notification.TargetId;
          const message = notification.message || "";
          const notificationId = notification.id || notification.notificationId || notification.userNotificationId;

          // Xác định targetType từ message
          const isPost = message.toLowerCase().includes("bài viết");
          const isComment = message.toLowerCase().includes("bình luận");

          if (!targetId) {
               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: 'Không tìm thấy ID nội dung cần xóa.',
                    confirmButtonText: 'Đã hiểu'
               });
               return;
          }

          const confirmResult = await Swal.fire({
               title: 'Xác nhận xóa?',
               text: isPost
                    ? 'Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.'
                    : 'Bạn có chắc chắn muốn xóa bình luận này? Hành động này không thể hoàn tác.',
               icon: 'warning',
               showCancelButton: true,
               confirmButtonColor: '#ef4444',
               cancelButtonColor: '#6b7280',
               confirmButtonText: 'Xóa',
               cancelButtonText: 'Hủy'
          });

          if (!confirmResult.isConfirmed) {
               return;
          }

          try {
               Swal.fire({
                    title: 'Đang xóa...',
                    allowOutsideClick: false,
                    didOpen: () => {
                         Swal.showLoading();
                    }
               });

               setIsDeleting(true);
               if (isPost) {
                    await deletePost(targetId);
               } else if (isComment) {
                    await deleteComment(targetId);
               } else {
                    throw new Error('Không xác định được loại nội dung cần xóa');
               }

               // Sau khi xóa thành công, đánh dấu thông báo là đã đọc để phản ánh đã xử lý
               if (notificationId) {
                    try {
                         await markNotificationAsRead(notificationId);
                    } catch (notifError) {
                         console.error('Error marking notification as read:', notifError);
                         // Tiếp tục dù có lỗi khi đánh dấu đã đọc
                    }
               }

               Swal.fire({
                    icon: 'success',
                    title: 'Đã xóa!',
                    text: isPost ? 'Bài viết đã được xóa thành công.' : 'Bình luận đã được xóa thành công.',
                    timer: 2000,
                    showConfirmButton: false
               });

               await Promise.all([loadNotifications(), fetchUnreadCount()]);
          } catch (error) {
               console.error('Error deleting content:', error);
               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: error.message || 'Không thể xóa nội dung. Vui lòng thử lại.',
                    confirmButtonText: 'Đã hiểu'
               });
          } finally {
               setIsDeleting(false);
          }
     };

     // xử lý xóa tất cả thông báo
     const handleDeleteAllNotifications = async () => {
          if (!notifications.length) return;

          const result = await Swal.fire({
               title: 'Xác nhận xóa?',
               text: "Bạn có chắc muốn xóa toàn bộ thông báo?",
               icon: 'warning',
               showCancelButton: true,
               confirmButtonColor: '#ef4444',
               cancelButtonColor: '#6b7280',
               confirmButtonText: 'Xóa tất cả',
               cancelButtonText: 'Hủy'
          });

          if (!result.isConfirmed) {
               return;
          }

          try {
               setIsDeleting(true);
               const result = await deleteAllNotifications();
               if (result.ok) {
                    await Promise.all([loadNotifications(), fetchUnreadCount()]);
                    Swal.fire({
                         icon: 'success',
                         title: 'Đã xóa!',
                         text: "Đã xóa toàn bộ thông báo",
                         timer: 2000,
                         showConfirmButton: false
                    });
               } else {
                    Swal.fire({
                         icon: 'error',
                         title: 'Lỗi',
                         text: result.reason || "Không thể xóa toàn bộ thông báo",
                         confirmButtonText: 'Đã hiểu'
                    });
               }
          } catch (error) {
               console.error("Error deleting all notifications:", error);
               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: "Có lỗi xảy ra khi xóa toàn bộ thông báo",
                    confirmButtonText: 'Đã hiểu'
               });
          } finally {
               setIsDeleting(false);
          }
     };

     const handleTypeChange = (type) => {
          setActiveType(type);
          setShowAll(false);
     };

     const getNotificationIcon = (type, priority) => {
          const iconMap = {
               cancellation: "❌",
               maintenance: "🔧",
               update: "📢",
               promotion: "🎉",
               System: "📢",
               Comment: "💬",
               Like: "👍",
               ReportResult: "📋"
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
          if (!dateString) return "Vừa xong";

          const date = new Date(dateString);
          // Format: HH:mm:ss DD/MM/YYYY
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();

          return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
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
                              {notifications.length > 0 && (
                                   <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDeleteAllNotifications}
                                        className="text-xs rounded-2xl border-red-500 hover:text-red-700 text-red-600 hover:bg-red-200 font-medium"
                                        disabled={isDeleting}
                                   >
                                        <Trash2 className="w-3 h-3 mr-1" />
                                        Xóa tất cả
                                   </Button>
                              )}
                              {unreadCount > 0 && (
                                   <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleMarkAllAsRead}
                                        className="text-xs rounded-2xl border-teal-500 hover:text-teal-700 text-teal-600 hover:bg-teal-200 font-medium"
                                   >
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Đọc tất cả
                                   </Button>
                              )}
                              <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => setShowAll(!showAll)}
                                   className="text-xs rounded-2xl border-blue-500 hover:text-blue-700 text-blue-600 hover:bg-blue-200 font-medium"
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

                    <div className="flex flex-wrap gap-2">
                         {NOTIFICATION_TYPES.map((type) => (
                              <Button
                                   key={type.value}
                                   variant={activeType === type.value ? "default" : "outline"}
                                   size="sm"
                                   onClick={() => handleTypeChange(type.value)}
                                   className={`text-xs rounded-2xl ${activeType === type.value ? "bg-blue-600 text-white" : ""}`}
                              >
                                   {type.value === "all" && <Filter className="w-3 h-3 mr-1" />}
                                   {type.label}
                              </Button>
                         ))}
                    </div>

                    {notifications.length === 0 ? (
                         <div className="text-center py-8">
                              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-500 text-sm">Chưa có thông báo nào</p>
                         </div>
                    ) : (
                         <div className="space-y-2">
                              {displayedNotifications.map((notification) => {
                                   const notificationId = notification.id || notification.notificationId || notification.userNotificationId;
                                   const receivedAt = notification.receivedAt || notification.createdAt || notification.sentAt;
                                   const messageText = formatNotificationMessage(notification);
                                   return (
                                        <div
                                             key={notificationId}
                                             className={`p-3 rounded-2xl border ${notification.isRead
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
                                                                 {notification.title || notification.message?.substring(0, 50) || "Thông báo"}
                                                            </h4>
                                                            <div className="flex items-center gap-1 ml-2">
                                                                 {notification.priority && (
                                                                      <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                                                                           {notification.priority === 'urgent' ? 'Khẩn cấp' :
                                                                                notification.priority === 'high' ? 'Cao' :
                                                                                     notification.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                                                                      </Badge>
                                                                 )}
                                                                 {!notification.isRead && (
                                                                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                                                 )}
                                                            </div>
                                                       </div>

                                                       <p className={`text-xs mb-2 ${notification.isRead ? "text-gray-600" : "text-blue-700"
                                                            }`}>
                                                            {messageText}
                                                       </p>
                                                       {notification.commentContent && (
                                                            <p className="text-xs text-gray-500 italic mb-2 line-clamp-2">
                                                                 “{notification.commentContent}”
                                                            </p>
                                                       )}

                                                       <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                                 <Clock className="w-3 h-3" />
                                                                 <span>{receivedAt ? formatDate(receivedAt) : "Vừa xong"}</span>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                 {!notification.isRead && (
                                                                      <Button
                                                                           variant="outline"
                                                                           size="sm"
                                                                           onClick={() => handleMarkAsRead(notificationId)}
                                                                           className="text-xs rounded-2xl border-teal-500 hover:text-teal-700 text-teal-600 hover:bg-teal-200 font-medium"
                                                                      >
                                                                           <CheckCircle className="w-3 h-3 mr-1" />
                                                                           Đã đọc
                                                                      </Button>
                                                                 )}
                                                                 {/* Button xóa nội dung nếu là thông báo yêu cầu xóa */}
                                                                 {notification.type === "ReportResult" &&
                                                                      notification.message &&
                                                                      notification.message.includes("yêu cầu xóa") && (
                                                                           <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => handleDeleteReportedContentMain(notification)}
                                                                                className="text-xs rounded-2xl border-red-500 text-red-600 hover:bg-red-50 font-medium"
                                                                                disabled={isDeleting}
                                                                           >
                                                                                <Trash2 className="w-3 h-3 mr-1" />
                                                                                Xóa
                                                                           </Button>
                                                                      )}
                                                                 {/* Button xóa thông báo */}
                                                                 <Button
                                                                      variant="ghost"
                                                                      size="sm"
                                                                      className="text-xs rounded-2xl text-red-500 hover:text-red-600"
                                                                      onClick={() => handleDeleteNotification(notificationId, notification.message)}
                                                                      disabled={isDeleting}
                                                                 >
                                                                      <Trash2 className="w-3 h-3 mr-1" />
                                                                      Xóa TB
                                                                 </Button>
                                                            </div>
                                                       </div>
                                                  </div>
                                             </div>
                                        </div>
                                   );
                              })}
                         </div>
                    )}

                    {notifications.length > 5 && (
                         <div className="text-center">
                              <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => setShowAll(!showAll)}
                                   className="text-xs rounded-2xl border-blue-500 hover:text-blue-700 text-blue-600 hover:bg-blue-200 font-medium"
                              >
                                   {showAll ? "Thu gọn" : `Xem thêm ${notifications.length - 5} thông báo`}
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
     const [loading, setLoading] = useState(true);

     useEffect(() => {
          const loadUnreadCount = async () => {
               try {
                    setLoading(true);
                    const result = await getUnreadCount();

                    if (result.ok) {
                         // Try multiple possible response formats
                         const count = result.count || result.data?.count || result.data?.unreadCount || result.data || 0;
                         setUnreadCount(Number(count) || 0);
                    } else {
                         setUnreadCount(0);
                    }
               } catch (error) {
                    setUnreadCount(0);
               } finally {
                    setLoading(false);
               }
          };

          loadUnreadCount();
          // Refresh count more frequently for better UX
          const interval = setInterval(loadUnreadCount, 15000); // Every 15 seconds
          return () => clearInterval(interval);
     }, [userId]);

     return (
          <div
               className={`relative cursor-pointer transition-all duration-200 hover:scale-110 ${className}`}
               onClick={onClick}
               style={{ overflow: 'visible' }}
          >
               <Bell className={`w-6 h-6 transition-colors ${unreadCount > 0 ? 'text-teal-600' : 'text-gray-600'} hover:text-teal-700`} />
               {!loading && unreadCount > 0 && (
                    <span
                         className="absolute -top-1 -right-0.5 min-w-[12px] h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 shadow-lg border border-white"
                         style={{
                              zIndex: 9999,
                              lineHeight: '1',
                              pointerEvents: 'none'
                         }}
                    >
                         {unreadCount > 99 ? "99+" : String(unreadCount)}
                    </span>
               )}
          </div>
     );
}

// Component for notification dropdown
export function NotificationDropdown({ userId, isOpen, onClose, className = "" }) {
     const [notifications, setNotifications] = useState([]);
     const [loading, setLoading] = useState(false);
     const [unreadCount, setUnreadCount] = useState(0);
     const [isDeleting, setIsDeleting] = useState(false);
     const navigate = useNavigate();

     useEffect(() => {
          if (isOpen) {
               loadDropdownNotifications();
               loadDropdownUnreadCount();
          }
     }, [isOpen, userId]);

     const loadDropdownUnreadCount = async () => {
          try {
               const result = await getUnreadCount();
               if (result.ok) {
                    setUnreadCount(result.count || 0);
               }
          } catch (error) {
               console.error('Error loading unread count:', error);
          }
     };

     const loadDropdownNotifications = async () => {
          try {
               setLoading(true);
               const result = await getLatestNotifications(10);
               if (result.ok) {
                    const notificationsData = Array.isArray(result.data)
                         ? result.data
                         : result.data?.notifications || result.data?.data || [];
                    const enrichedNotifications = await enrichNotificationsWithActors(notificationsData);
                    setNotifications(enrichedNotifications);
                    setUnreadCount(enrichedNotifications.filter(n => !n.isRead).length);
               }
          } catch (error) {
               console.error('Error loading notifications:', error);
          } finally {
               setLoading(false);
          }
     };

     const handleMarkAsRead = async (notificationId) => {
          try {
               const result = await markNotificationAsRead(notificationId);
               if (result.ok) {
                    await loadDropdownNotifications();
                    await loadDropdownUnreadCount();
               } else {
                    console.error('Error marking notification as read:', result.reason);
               }
          } catch (error) {
               console.error('Error marking notification as read:', error);
          }
     };

     const handleMarkAllAsRead = async () => {
          try {
               const result = await markAllNotificationsAsRead();
               if (result.ok) {
                    await loadDropdownNotifications();
                    await loadDropdownUnreadCount();
               } else {
                    console.error('Error marking all notifications as read:', result.reason);
               }
          } catch (error) {
               console.error('Error marking all notifications as read:', error);
          }
     };

     const handleDeleteNotification = async (notificationId, messagePreview = "") => {
          if (!notificationId) return;

          const result = await Swal.fire({
               title: 'Xác nhận xóa?',
               text: `Bạn có chắc muốn xóa thông báo "${messagePreview || notificationId}"?`,
               icon: 'warning',
               showCancelButton: true,
               confirmButtonColor: '#ef4444',
               cancelButtonColor: '#6b7280',
               confirmButtonText: 'Xóa',
               cancelButtonText: 'Hủy'
          });

          if (!result.isConfirmed) {
               return;
          }

          try {
               setIsDeleting(true);
               const result = await deleteNotification(notificationId);
               if (result.ok) {
                    await Promise.all([loadDropdownNotifications(), loadDropdownUnreadCount()]);
                    Swal.fire({
                         icon: 'success',
                         title: 'Đã xóa!',
                         text: 'Thông báo đã được xóa thành công.',
                         timer: 2000,
                         showConfirmButton: false
                    });
               } else {
                    Swal.fire({
                         icon: 'error',
                         title: 'Lỗi',
                         text: result.reason || "Không thể xóa thông báo",
                         confirmButtonText: 'Đã hiểu'
                    });
               }
          } catch (error) {
               console.error("Error deleting notification:", error);
               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: "Có lỗi xảy ra khi xóa thông báo",
                    confirmButtonText: 'Đã hiểu'
               });
          } finally {
               setIsDeleting(false);
          }
     };

     // Xử lý xóa nội dung bị báo cáo (bài viết/comment)
     const handleDeleteReportedContent = async (notification) => {
          const targetId = notification.targetId || notification.targetID || notification.TargetId;
          const message = notification.message || "";
          const notificationId = notification.id || notification.notificationId || notification.userNotificationId;

          // Xác định targetType từ message
          const isPost = message.toLowerCase().includes("bài viết");
          const isComment = message.toLowerCase().includes("bình luận");

          if (!targetId) {
               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: 'Không tìm thấy ID nội dung cần xóa.',
                    confirmButtonText: 'Đã hiểu'
               });
               return;
          }

          const result = await Swal.fire({
               title: 'Xác nhận xóa?',
               text: isPost
                    ? 'Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.'
                    : 'Bạn có chắc chắn muốn xóa bình luận này? Hành động này không thể hoàn tác.',
               icon: 'warning',
               showCancelButton: true,
               confirmButtonColor: '#ef4444',
               cancelButtonColor: '#6b7280',
               confirmButtonText: 'Xóa',
               cancelButtonText: 'Hủy'
          });

          if (result.isConfirmed) {
               try {
                    Swal.fire({
                         title: 'Đang xóa...',
                         allowOutsideClick: false,
                         didOpen: () => {
                              Swal.showLoading();
                         }
                    });

                    if (isPost) {
                         await deletePost(targetId);
                    } else if (isComment) {
                         await deleteComment(targetId);
                    } else {
                         throw new Error('Không xác định được loại nội dung cần xóa');
                    }

                    // Sau khi xóa thành công, đánh dấu thông báo là đã đọc để phản ánh đã xử lý
                    if (notificationId) {
                         try {
                              await markNotificationAsRead(notificationId);
                         } catch (notifError) {
                              console.error('Error marking notification as read:', notifError);
                              // Tiếp tục dù có lỗi khi đánh dấu đã đọc
                         }
                    }

                    Swal.fire({
                         icon: 'success',
                         title: 'Đã xóa!',
                         text: isPost ? 'Bài viết đã được xóa thành công.' : 'Bình luận đã được xóa thành công.',
                         timer: 2000,
                         showConfirmButton: false
                    });

                    // Reload notifications
                    await loadDropdownNotifications();
                    await loadDropdownUnreadCount();
               } catch (error) {
                    console.error('Error deleting content:', error);
                    Swal.fire({
                         icon: 'error',
                         title: 'Lỗi',
                         text: error.message || 'Không thể xóa nội dung. Vui lòng thử lại.',
                         confirmButtonText: 'Đã hiểu'
                    });
               }
          }
     };

     const handleDeleteAllNotifications = async () => {
          if (!notifications.length) return;

          const result = await Swal.fire({
               title: 'Xác nhận xóa?',
               text: "Bạn có chắc muốn xóa toàn bộ thông báo?",
               icon: 'warning',
               showCancelButton: true,
               confirmButtonColor: '#ef4444',
               cancelButtonColor: '#6b7280',
               confirmButtonText: 'Xóa tất cả',
               cancelButtonText: 'Hủy'
          });

          if (!result.isConfirmed) {
               return;
          }

          try {
               setIsDeleting(true);
               const result = await deleteAllNotifications();
               if (result.ok) {
                    await Promise.all([loadDropdownNotifications(), loadDropdownUnreadCount()]);
                    Swal.fire({
                         icon: 'success',
                         title: 'Đã xóa!',
                         text: "Đã xóa toàn bộ thông báo",
                         timer: 2000,
                         showConfirmButton: false
                    });
               } else {
                    Swal.fire({
                         icon: 'error',
                         title: 'Lỗi',
                         text: result.reason || "Không thể xóa toàn bộ thông báo",
                         confirmButtonText: 'Đã hiểu'
                    });
               }
          } catch (error) {
               console.error("Error deleting all notifications:", error);
               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: "Có lỗi xảy ra khi xóa toàn bộ thông báo",
                    confirmButtonText: 'Đã hiểu'
               });
          } finally {
               setIsDeleting(false);
          }
     };

     const formatDate = (dateString) => {
          if (!dateString) return "Vừa xong";

          const date = new Date(dateString);
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();

          return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
     };

     const getNotificationIcon = (type) => {
          const iconMap = {
               cancellation: "❌",
               maintenance: "🔧",
               update: "📢",
               promotion: "🎉",
               System: "📢",
               Comment: "💬",
               Like: "👍",
               ReportResult: "📋"
          };
          return iconMap[type] || "📢";
     };

     if (!isOpen) return null;

     return (
          <div className={`absolute right-0 top-full mt-2 w-96 bg-white border border-teal-100 rounded-2xl shadow-2xl z-50 overflow-hidden ${className}`}>
               {/* Header */}
               <div className="p-4 border-b border-teal-50 bg-white">
                    <div className="flex items-center justify-between">
                         <h3 className="font-bold text-lg text-gray-900">Thông báo</h3>
                         <div className="flex items-center gap-2">
                              {notifications.length > 0 && (
                                   <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDeleteAllNotifications}
                                        className="text-xs border border-red-200 bg-white rounded-lg text-red-600 hover:bg-red-50 font-medium px-3 py-1.5"
                                        disabled={isDeleting}
                                   >
                                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                        Xóa tất cả
                                   </Button>
                              )}
                              <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={onClose}
                                   className="text-xs border border-teal-100 bg-white rounded-full hover:bg-gray-50 text-gray-600 hover:text-gray-700 p-1.5 h-8 w-8 flex items-center justify-center"
                              >
                                   <X className="w-4 h-4" />
                              </Button>
                         </div>
                    </div>
               </div>

               {/* Notifications List */}
               <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-teal-200 scrollbar-track-gray-100">
                    {loading ? (
                         <div className="flex items-center justify-center py-12">
                              <div className="text-center">
                                   <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-200 border-t-teal-600 mx-auto mb-2"></div>
                                   <p className="text-sm text-gray-600">Đang tải...</p>
                              </div>
                         </div>
                    ) : notifications.length === 0 ? (
                         <div className="text-center py-12">
                              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">Chưa có thông báo nào</p>
                         </div>
                    ) : (
                         <div className="divide-y divide-gray-100">
                              {notifications.map((notification) => {
                                   const notificationId = notification.id || notification.notificationId || notification.userNotificationId;
                                   const receivedAt = notification.receivedAt || notification.createdAt || notification.sentAt;
                                   const isUnread = !notification.isRead;
                                   const message = formatNotificationMessage(notification);

                                   return (
                                        <div
                                             key={notificationId}
                                             className={`p-3 transition-all duration-200 hover:bg-gray-50 ${isUnread ? "bg-blue-50/30" : "bg-white"
                                                  }`}
                                        >
                                             <div className="flex items-start gap-3">
                                                  {/* Icon */}
                                                  <span className="text-xl flex-shrink-0">
                                                       {getNotificationIcon(notification.type || notification.notificationType)}
                                                  </span>

                                                  {/* Content */}
                                                  <div className="flex-1 min-w-0">
                                                       <div className="flex items-start justify-between mb-1">
                                                            <div className="flex-1">
                                                                 <h4 className={`font-semibold text-sm ${isUnread ? "text-gray-900" : "text-gray-700"
                                                                      }`}>
                                                                      {message.length > 60 ? message.substring(0, 60) + "..." : message}
                                                                 </h4>
                                                                 {message.length > 60 && (
                                                                      <p className={`text-xs mt-1 ${isUnread ? "text-gray-600" : "text-gray-500"
                                                                           }`}>
                                                                           {message}
                                                                      </p>
                                                                 )}
                                                            </div>
                                                            {isUnread && (
                                                                 <div className="w-2 h-2 bg-teal-600 rounded-full ml-2 flex-shrink-0 mt-1.5"></div>
                                                            )}
                                                       </div>

                                                       {/* Timestamp and Action */}
                                                       <div className="flex items-center justify-between mt-2">
                                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                                 <Clock className="w-3 h-3" />
                                                                 {formatDate(receivedAt)}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                 {isUnread && (
                                                                      <Button
                                                                           variant="outline"
                                                                           size="sm"
                                                                           onClick={() => handleMarkAsRead(notificationId)}
                                                                           className="text-xs border-teal-200 text-teal-600 hover:bg-teal-50 font-medium rounded-lg px-2 py-1"
                                                                      >
                                                                           Đọc
                                                                      </Button>
                                                                 )}
                                                                 {/* Button xóa nội dung nếu là thông báo yêu cầu xóa */}
                                                                 {notification.type === "ReportResult" &&
                                                                      notification.message &&
                                                                      notification.message.includes("yêu cầu xóa") && (
                                                                           <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => handleDeleteReportedContent(notification)}
                                                                                className="text-xs border-red-200 text-red-600 hover:bg-red-50 font-medium rounded-lg px-2 py-1"
                                                                           >
                                                                                <Trash2 className="w-3 h-3 mr-1" />
                                                                                Xóa
                                                                           </Button>
                                                                      )}
                                                                 {/* Button xóa thông báo */}
                                                                 <Button
                                                                      variant="ghost"
                                                                      size="sm"
                                                                      className="text-xs text-gray-400 hover:text-red-500"
                                                                      onClick={() => handleDeleteNotification(notificationId, notification.message)}
                                                                      disabled={isDeleting}
                                                                 >
                                                                      <Trash2 className="w-3 h-3" />
                                                                 </Button>
                                                            </div>
                                                       </div>
                                                  </div>
                                             </div>
                                        </div>
                                   );
                              })}
                         </div>
                    )}
               </div>

               {/* Footer */}
               {notifications.length > 0 && (
                    <div className="p-3 border-t border-teal-50 bg-white text-center">
                         <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                   onClose && onClose();
                                   navigate("/notifications");
                              }}
                              className="text-xs border-teal-200 rounded-xl hover:text-teal-600 text-teal-600 hover:bg-teal-50 font-medium w-full"
                         >
                              Xem tất cả thông báo
                         </Button>
                    </div>
               )}
          </div>
     );
}
