import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import {
     Card,
     Button,
     Input,
     Select,
     SelectContent,
     SelectItem,
     SelectTrigger,
     SelectValue,
     Textarea,
     Modal,
     Badge,
     Pagination
} from "../../../shared/components/ui";
import {
     Table,
     TableHeader,
     TableBody,
     TableRow,
     TableHead,
     TableCell
} from "../../../shared/components/ui/table";
import {
     createAdminNotification,
     createAdminBulkNotifications,
     getNotifications,
     getNotificationsByType,
     getAdminNotifications,
     deleteNotification,
     deleteAdminNotification,
     bulkDeleteAdminNotifications
} from "../../../shared/services/notifications";
import { fetchAllUserStatistics } from "../../../shared/services/adminStatistics";
import {
     Bell,
     Plus,
     Trash2,
     Send,
     Eye,
     Calendar,
     Users,
     AlertCircle,
     CheckCircle,
     Clock,
     RefreshCw
} from "lucide-react";
import Swal from "sweetalert2";

export default function SystemNotificationsManagement() {
     const { user } = useAuth();
     const [notifications, setNotifications] = useState([]);
     const [filteredNotifications, setFilteredNotifications] = useState([]);
     const [searchTerm, setSearchTerm] = useState("");
     const [typeFilter, setTypeFilter] = useState("all");
     const [statusFilter, setStatusFilter] = useState("all");
     const [showCreateModal, setShowCreateModal] = useState(false);
     const [selectedNotification, setSelectedNotification] = useState(null);
     const [showDetailModal, setShowDetailModal] = useState(false);
     const [loading, setLoading] = useState(false);
     const [users, setUsers] = useState([]);
     // "all" = gửi cho toàn hệ thống (userId = null), còn lại = userId cụ thể
     const [selectedRecipientId, setSelectedRecipientId] = useState("all");
     const [isCustomTargetId, setIsCustomTargetId] = useState(false);
     // Tab tạo thông báo: "system" = thông báo hệ thống (broadcast), "user" = gửi cho người dùng cụ thể
     const [createTab, setCreateTab] = useState("system");
     // Phân trang danh sách thông báo
     const [page, setPage] = useState(1);
     const pageSize = 10;

     const [newNotification, setNewNotification] = useState({
          title: "",
          message: "",
          type: "System",
          // null = gửi cho toàn hệ thống (theo rule backend), >0 = gửi cho user cụ thể
          userId: null,
          targetId: 0, // ID của đối tượng liên quan (booking, post, comment, etc.)
          targetType: "none", // none | booking | post | comment | report | user
     });

     const parseApiData = (data) => {
          if (Array.isArray(data)) {
               return data;
          }
          if (data?.notifications && Array.isArray(data.notifications)) {
               return data.notifications;
          }
          if (data?.data) {
               if (Array.isArray(data.data)) {
                    return data.data;
               }
               return data.data.notifications || data.data.items || data.data.results || [];
          }
          if (data?.items) {
               return data.items;
          }
          return [];
     };

     const loadUsers = useCallback(async () => {
          try {
               const result = await fetchAllUserStatistics();
               if (result.ok && result.data) {
                    const usersData = Array.isArray(result.data) ? result.data : (result.data.users || result.data.data || []);
                    const transformedUsers = usersData.map(user => ({
                         id: user.userId,
                         email: user.email,
                         fullName: user.fullName,
                         phone: user.phone || "N/A",
                         role: user.roleName
                    }));
                    setUsers(transformedUsers);
               }
          } catch (err) {
               console.error("Error loading users:", err);
          }
     }, []);

     const loadNotifications = useCallback(async (options = {}) => {
          try {
               setLoading(true);
               const targetType = options.type || typeFilter;
               let result;

               // Ưu tiên dùng endpoint admin chuyên biệt
               result = await getAdminNotifications({ pageNumber: 1, pageSize: 100 });

               // Nếu endpoint admin lỗi (không ok), fallback về endpoint thường
               if (!result?.ok) {
                    if (targetType && targetType !== "all") {
                         result = await getNotificationsByType(targetType, { page: 1, pageSize: 100 });
                    } else {
                         result = await getNotifications({ page: 1, pageSize: 100 });
                    }
               }
               if (result.ok) {
                    // Parse response data - API có thể trả về nhiều format
                    let notificationsData = parseApiData(result.data ?? result.raw);

                    // Nếu có filter type (ở phía client) thì lọc tiếp theo type
                    if (targetType && targetType !== "all") {
                         notificationsData = notificationsData.filter((n) => {
                              const t = n.type || n.notificationType || "System";
                              return t === targetType;
                         });
                    }
                    // Nếu không có data, thử dùng mock data để test UI
                    if (notificationsData.length === 0) {
                         console.warn("⚠️ [SystemNotificationsManagement] No notifications from API, using mock data for testing");
                    } else {
                         setNotifications(notificationsData);
                    }
               } else {
                    console.error("❌ [SystemNotificationsManagement] Failed to load:", result.reason);
                    setNotifications([]);
                    // Hiển thị thông báo lỗi
                    if (result.reason) {
                         console.error("Error reason:", result.reason);
                         // Không alert để không làm phiền user, chỉ log
                    }
               }
          } catch (error) {
               console.error("❌ [SystemNotificationsManagement] Error loading notifications:", error);
               setNotifications([]);
               Swal.fire({
                    icon: "error",
                    title: "Lỗi tải thông báo",
                    text: error.message || "Có lỗi xảy ra khi tải thông báo.",
               });
          } finally {
               setLoading(false);
          }
     }, [typeFilter]);

     useEffect(() => {
          // Kiểm tra role Admin trước khi load
          if (user?.roleName !== "Admin") {
               console.warn("⚠️ [SystemNotificationsManagement] Only Admin can access this page");
               return;
          }

          loadNotifications({ type: typeFilter });
          loadUsers();
     }, [user, typeFilter, loadNotifications, loadUsers]);

     useEffect(() => {
          let filtered = notifications;

          // Filter by search term - tìm trong message
          if (searchTerm) {
               filtered = filtered.filter(notification =>
                    (notification.message || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (notification.type || "").toLowerCase().includes(searchTerm.toLowerCase())
               );
          }

          // Filter by status - API có thể không có status, dùng isRead
          if (statusFilter !== "all") {
               if (statusFilter === "Sent") {
                    filtered = filtered.filter(notification => notification.isRead !== false);
               } else if (statusFilter === "Draft") {
                    filtered = filtered.filter(notification => notification.isRead === false);
               } else {
                    filtered = filtered.filter(notification =>
                         notification.status === statusFilter ||
                         (statusFilter === "Failed" && notification.status === "Failed")
                    );
               }
          }

          setFilteredNotifications(filtered);
          // Reset về trang 1 khi bộ lọc thay đổi
          setPage(1);
     }, [notifications, searchTerm, statusFilter]);

     const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / pageSize));
     const paginatedNotifications = filteredNotifications.slice(
          (page - 1) * pageSize,
          page * pageSize
     );

     const handleCreateNotification = async () => {
          // Kiểm tra role Admin
          if (user?.roleName !== "Admin") {
               Swal.fire({
                    icon: "error",
                    title: "Không có quyền",
                    text: "Chỉ Admin mới có quyền tạo thông báo hệ thống.",
               });
               return;
          }

          // Validate nội dung
          if (!newNotification.message || newNotification.message.trim() === "") {
               Swal.fire({
                    icon: "warning",
                    title: "Thiếu nội dung",
                    text: "Vui lòng nhập nội dung thông báo!",
               });
               return;
          }

          // Validate theo tab
          if (createTab === "user") {
               if (!newNotification.userId || newNotification.userId <= 0) {
                    Swal.fire({
                         icon: "warning",
                         title: "Thiếu người nhận",
                         text: "Vui lòng chọn người nhận khi gửi thông báo cho người dùng.",
                    });
                    return;
               }
          }

          // Có thể không bắt buộc title, nhưng nếu trống thì tự sinh từ message
          const title =
               (newNotification.title && newNotification.title.trim()) ||
               newNotification.message.slice(0, 50);

          // Validate Target ID (chỉ áp dụng cho tab gửi cho người dùng và khi có targetType khác "none")
          if (createTab === "user") {
               if (
                    newNotification.targetType &&
                    newNotification.targetType !== "none" &&
                    (!newNotification.targetId || newNotification.targetId <= 0)
               ) {
                    Swal.fire({
                         icon: "warning",
                         title: "Thiếu Target ID",
                         text: "Vui lòng nhập ID đối tượng liên quan phù hợp với loại bạn đã chọn.",
                    });
                    return;
               }
          }

          try {
               setLoading(true);

               // Format data cho API
               // Quy ước: userId = null => gửi cho toàn hệ thống
               // Loại thông báo cho tab hệ thống luôn cố định là "System"
               const basePayload = {
                    title: title,
                    type: createTab === "system" ? "System" : (newNotification.type || "System"),
                    targetId: newNotification.targetId || 0, // 0 if not applicable
                    message: newNotification.message.trim()
               };

               let result;
               if (createTab === "system") {
                    // Tab hệ thống: dùng bulk API, broadcast cho toàn hệ thống
                    // userId để null -> backend hiểu là toàn hệ thống
                    result = await createAdminBulkNotifications([
                         {
                              ...basePayload,
                              userId: null
                         }
                    ]);
               } else {
                    // Tab người dùng: dùng API đơn lẻ, gửi cho user cụ thể hoặc null (tất cả)
                    const notificationData = {
                         ...basePayload,
                         userId:
                              newNotification.userId === 0
                                   ? null
                                   : newNotification.userId,
                    };
                    result = await createAdminNotification(notificationData);
               }

               if (result.ok) {
                    // Reload notifications
                    await loadNotifications({ type: typeFilter });
                    setShowCreateModal(false);
                    setNewNotification({
                         title: "",
                         message: "",
                         type: "System",
                         userId: null,
                         targetId: 0
                    });
                    setCreateTab("system");
                    Swal.fire({
                         icon: "success",
                         title: "Đã tạo thông báo",
                         text: "Tạo thông báo hệ thống thành công.",
                         timer: 2000,
                         showConfirmButton: false,
                    });
               } else {
                    Swal.fire({
                         icon: "error",
                         title: "Lỗi tạo thông báo",
                         text: result.reason || "Không thể tạo thông báo.",
                    });
               }
          } catch (error) {
               console.error("Error creating notification:", error);
               Swal.fire({
                    icon: "error",
                    title: "Lỗi tạo thông báo",
                    text: error.message || "Có lỗi xảy ra khi tạo thông báo.",
               });
          } finally {
               setLoading(false);
          }
     };

     const handleDeleteNotification = async (notification) => {
          // Kiểm tra role Admin
          if (user?.roleName !== "Admin") {
               Swal.fire({
                    icon: "error",
                    title: "Không có quyền",
                    text: "Chỉ Admin mới có quyền xóa thông báo hệ thống.",
               });
               return;
          }

          const notificationId = notification.id || notification.notificationId;
          const message = notification.message || notification.title || "thông báo này";

          const confirmResult = await Swal.fire({
               icon: "warning",
               title: "Xóa thông báo?",
               text: `Bạn có chắc chắn muốn xóa thông báo "${message.substring(0, 50)}..."?`,
               showCancelButton: true,
               confirmButtonText: "Xóa",
               cancelButtonText: "Hủy",
               confirmButtonColor: "#dc2626",
          });
          if (!confirmResult.isConfirmed) return;

          try {
               setLoading(true);
               // Ưu tiên dùng endpoint delete admin chuyên biệt
               let result = await deleteAdminNotification(notificationId);

               // Nếu vì lý do nào đó endpoint admin không ok, fallback về delete thường
               if (!result?.ok) {
                    result = await deleteNotification(notificationId);
               }

               if (result.ok) {
                    Swal.fire({
                         icon: "success",
                         title: "Đã xóa thông báo",
                         timer: 1500,
                         showConfirmButton: false,
                    });
                    await loadNotifications({ type: typeFilter }); // Reload từ API
               } else {
                    Swal.fire({
                         icon: "error",
                         title: "Lỗi xóa thông báo",
                         text: result.reason || "Không thể xóa thông báo.",
                    });
               }
          } catch (error) {
               console.error("Error deleting notification:", error);
               Swal.fire({
                    icon: "error",
                    title: "Lỗi xóa thông báo",
                    text: error.message || "Có lỗi xảy ra khi xóa thông báo.",
               });
          } finally {
               setLoading(false);
          }
     };

     const handleDeleteAllNotificationsAdmin = async () => {
          if (!notifications.length) {
               Swal.fire({
                    icon: "info",
                    title: "Không có thông báo",
                    text: "Hiện không có thông báo để xóa.",
               });
               return;
          }
          const confirmResult = await Swal.fire({
               icon: "warning",
               title: "Xóa toàn bộ thông báo?",
               text: "Bạn có chắc chắn muốn xóa toàn bộ thông báo của hệ thống?",
               showCancelButton: true,
               confirmButtonText: "Xóa tất cả",
               cancelButtonText: "Hủy",
               confirmButtonColor: "#dc2626",
          });
          if (!confirmResult.isConfirmed) return;
          try {
               setLoading(true);
               // Dùng bulkDeleteAdminNotifications với tất cả ID hiện có
               const allIds = notifications.map(
                    (n) => n.notificationID || n.notificationId || n.id
               );
               const result = await bulkDeleteAdminNotifications(allIds);
               if (result.ok) {
                    Swal.fire({
                         icon: "success",
                         title: "Đã xóa toàn bộ thông báo",
                         timer: 2000,
                         showConfirmButton: false,
                    });
                    await loadNotifications({ type: typeFilter });
               } else {
                    Swal.fire({
                         icon: "error",
                         title: "Lỗi xóa tất cả",
                         text: result.reason || "Không thể xóa toàn bộ thông báo.",
                    });
               }
          } catch (error) {
               console.error("Error deleting all notifications:", error);
               Swal.fire({
                    icon: "error",
                    title: "Lỗi xóa tất cả",
                    text: error.message || "Có lỗi xảy ra khi xóa toàn bộ thông báo.",
               });
          } finally {
               setLoading(false);
          }
     };

     const handleViewNotification = (notification) => {
          setSelectedNotification(notification);
          setShowDetailModal(true);
     };

     // Badge helpers: dùng variant "outline" + className để kiểm soát màu
     const getTypeBadgeVariant = () => "outline";

     const getTypeBadgeClass = (type) => {
          const actualType = type || "System";
          switch (actualType) {
               case "System":
                    return "bg-red-50 text-red-700 border-red-200";
               case "Comment":
                    return "bg-blue-50 text-blue-700 border-blue-200";
               case "Like":
                    return "bg-pink-50 text-pink-700 border-pink-200";
               case "ReportResult":
                    return "bg-orange-50 text-orange-700 border-orange-200";
               case "MatchAccepted":
                    return "bg-green-50 text-green-700 border-green-200";
               case "MatchJoinRequest":
                    return "bg-yellow-50 text-yellow-700 border-yellow-200";
               case "NewComment":
                    return "bg-blue-50 text-blue-700 border-blue-200";
               case "Mention":
                    return "bg-purple-50 text-purple-700 border-purple-200";
               default:
                    return "bg-slate-50 text-slate-700 border-slate-200";
          }
     };

     const getStatusBadgeVariant = () => "outline";

     const getStatusBadgeClass = (notification) => {
          // API có thể trả về isRead thay vì status
          const isRead = notification.isRead;
          if (isRead === true) {
               return "bg-blue-50 text-blue-700 border-blue-200";
          } else if (isRead === false) {
               return "bg-gray-100 text-gray-700 border-gray-300";
          }
          // Fallback cho status cũ
          const status = notification.status;
          switch (status) {
               case "Sent":
                    return "bg-blue-50 text-blue-700 border-blue-200";
               case "Draft":
                    return "bg-gray-100 text-gray-700 border-gray-300";
               case "Failed":
                    return "bg-red-50 text-red-700 border-red-200";
               default:
                    return "bg-slate-50 text-slate-600 border-slate-200";
          }
     };

     const getTypeIcon = (type) => {
          const actualType = type || "System";
          switch (actualType) {
               case "System":
                    return "📢";
               case "Comment":
                    return "💬";
               case "Like":
                    return "👍";
               case "ReportResult":
                    return "📋";
               case "Mention":
                    return "@";
               case "MatchAccepted":
                    return "✅";
               case "MatchJoinRequest":
                    return "🤝";
               case "NewComment":
                    return "🆕";
               default:
                    return "📢";
          }
     };

     // Nhãn hiển thị tiếng Việt cho loại thông báo
     const getTypeLabel = (type) => {
          const actualType = type || "System";
          switch (actualType) {
               case "System":
                    return "Hệ thống";
               case "Comment":
                    return "Bình luận";
               case "Like":
                    return "Lượt thích";
               case "ReportResult":
                    return "Báo cáo";
               case "Mention":
                    return "Được nhắc đến";
               case "MatchAccepted":
                    return "Ghép trận";
               case "MatchJoinRequest":
                    return "Tham gia trận";
               case "NewComment":
                    return "Bình luận";
               default:
                    return actualType;
          }
     };

     const columns = [
          {
               key: "message",
               label: "Nội dung",
               render: (notification) => {
                    const message = notification.message || "";
                    const type = notification.type || "System";
                    return (
                         <div className="flex items-center">
                              <span className="text-lg flex-shrink-0">{getTypeIcon(type)}</span>
                              <span className="font-medium text-slate-900 line-clamp-2">
                                   {message.length > 50 ? message.substring(0, 50) + "..." : message}
                              </span>
                         </div>
                    );
               }
          },
          {
               key: "type",
               label: "Loại",
               render: (notification) => {
                    const type = notification.type || notification.notificationType || "System";
                    const label = getTypeLabel(type);
                    return (
                         <Badge variant={getTypeBadgeVariant(type)} className={getTypeBadgeClass(type)}>
                              {label}
                         </Badge>
                    );
               }
          },
          {
               key: "userId",
               label: "Người nhận",
               render: (notification) => {
                    const userId = notification.userId || 0;
                    const userInfo = users.find((u) => u.id === userId);
                    return (
                         <div className="flex items-center">
                              <Users className="w-4 h-4 text-slate-400 mr-1" />
                              <span className="text-sm text-slate-600">
                                   {userId === 0
                                        ? "Tất cả người dùng"
                                        : userInfo
                                             ? `${userInfo.fullName} (ID: ${userId})`
                                             : `User ID: ${userId}`}
                              </span>
                         </div>
                    );
               }
          },
          {
               key: "status",
               label: "Trạng thái",
               render: (notification) => {
                    const isRead = notification.isRead;
                    const status = notification.status;
                    const statusText = isRead !== undefined
                         ? (isRead ? "Đã đọc" : "Chưa đọc")
                         : (status || "N/A");
                    return (
                         <Badge
                              variant={getStatusBadgeVariant(notification)}
                              className={getStatusBadgeClass(notification)}
                         >
                              {statusText}
                         </Badge>
                    );
               }
          },
          {
               key: "createdAt",
               label: "Ngày tạo",
               render: (notification) => {
                    const date = notification.createdAt || notification.sentAt || notification.receivedAt;
                    return (
                         <div className="flex items-center">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <span className="text-sm text-slate-600">
                                   {date ? new Date(date).toLocaleDateString('vi-VN') : "N/A"}
                              </span>
                         </div>
                    );
               }
          },
          {
               key: "actions",
               label: "Thao tác",
               render: (notification) => (
                    <div className="flex items-center">
                         <Button
                              onClick={() => handleViewNotification(notification)}
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              title="Xem chi tiết"
                         >
                              <Eye className="w-4 h-4" />
                         </Button>
                         <Button
                              onClick={() => handleDeleteNotification(notification)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              title="Xóa"
                              disabled={loading}
                         >
                              <Trash2 className="w-4 h-4" />
                         </Button>
                    </div>
               )
          }
     ];

     return (
          <div className="space-y-6">
               {/* Header */}
               <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 border border-red-200/50">
                    <div className="flex items-center justify-between">
                         <div>
                              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-700 to-pink-700 bg-clip-text text-transparent">
                                   Quản lý thông báo hệ thống
                              </h1>
                              <p className="text-slate-600 mt-2 font-medium">
                                   Tạo và quản lý thông báo gửi đến người dùng
                              </p>
                         </div>
                         <div className="flex space-x-3">
                              <Button
                                   onClick={() => loadNotifications({ type: typeFilter })}
                                   variant="outline"
                                   className="border-red-200 rounded-2xl text-red-600 hover:bg-red-50"
                                   disabled={loading}
                              >
                                   <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                   Làm mới
                              </Button>
                              <Button
                                   onClick={handleDeleteAllNotificationsAdmin}
                                   variant="outline"
                                   className="border-red-300 rounded-2xl text-red-600 hover:bg-red-50"
                                   disabled={loading || notifications.length === 0}
                              >
                                   <Trash2 className="w-4 h-4 mr-2" />
                                   Xóa tất cả
                              </Button>
                              <Button
                                   onClick={() => setShowCreateModal(true)}
                                   className="bg-gradient-to-r  rounded-2xl from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                              >
                                   <Plus className="w-4 h-4 mr-2" />
                                   Tạo thông báo
                              </Button>
                              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                                   <Bell className="w-8 h-8 text-white" />
                              </div>
                         </div>
                    </div>
               </div>

               {/* Filters */}
               <Card className="p-6 rounded-2xl shadow-lg">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
                         <div className="flex-1">
                              <div className="relative">
                                   <Bell className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                   <Input
                                        placeholder="Tìm kiếm theo nội dung hoặc loại thông báo..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 rounded-xl"
                                   />
                              </div>
                         </div>
                         <div className="flex space-x-4">
                              <Select value={typeFilter} onValueChange={setTypeFilter}>
                                   <SelectTrigger className="w-40 rounded-xl">
                                        <SelectValue placeholder="Tất cả loại" />
                                   </SelectTrigger>
                                   <SelectContent>
                                        <SelectItem value="all">Tất cả loại</SelectItem>
                                        <SelectItem value="System">📢 System</SelectItem>
                                        <SelectItem value="Comment">💬 Comment</SelectItem>
                                        <SelectItem value="Like">👍 Like</SelectItem>
                                        <SelectItem value="ReportResult">📋 ReportResult</SelectItem>
                                        <SelectItem value="Mention">@ Mention</SelectItem>
                                   </SelectContent>
                              </Select>
                              <Select value={statusFilter} onValueChange={setStatusFilter}>
                                   <SelectTrigger className="w-40 rounded-xl">
                                        <SelectValue placeholder="Tất cả trạng thái" />
                                   </SelectTrigger>
                                   <SelectContent>
                                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                        <SelectItem value="Sent">Đã đọc</SelectItem>
                                        <SelectItem value="Draft">Chưa đọc</SelectItem>
                                   </SelectContent>
                              </Select>
                         </div>
                    </div>
               </Card>

               {/* Stats */}
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-4 rounded-2xl shadow-lg">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-slate-600">Tổng thông báo</p>
                                   <p className="text-2xl font-bold text-slate-900">{notifications.length}</p>
                              </div>
                              <Bell className="w-8 h-8 text-blue-600" />
                         </div>
                    </Card>
                    <Card className="p-4 rounded-2xl shadow-lg">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-slate-600">Đã đọc</p>
                                   <p className="text-2xl font-bold text-slate-900">
                                        {notifications.filter(n => n.isRead === true).length}
                                   </p>
                              </div>
                              <CheckCircle className="w-8 h-8 text-green-600" />
                         </div>
                    </Card>
                    <Card className="p-4 rounded-2xl shadow-lg">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-slate-600">Chưa đọc</p>
                                   <p className="text-2xl font-bold text-slate-900">
                                        {notifications.filter(n => n.isRead === false).length}
                                   </p>
                              </div>
                              <Clock className="w-8 h-8 text-yellow-600" />
                         </div>
                    </Card>
                    <Card className="p-4 rounded-2xl shadow-lg">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-slate-600">System</p>
                                   <p className="text-2xl font-bold text-slate-900">
                                        {notifications.filter(n => (n.type || "System") === "System").length}
                                   </p>
                              </div>
                              <AlertCircle className="w-8 h-8 text-red-600" />
                         </div>
                    </Card>
               </div>

               {/* Notifications Table */}
               <Card className="p-5 rounded-2xl shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                         <h3 className="text-lg font-bold text-slate-900">
                              Danh sách thông báo ({filteredNotifications.length})
                         </h3>
                         {loading && (
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                   <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-300 border-t-slate-600"></div>
                                   Đang tải...
                              </div>
                         )}
                    </div>
                    {loading && notifications.length === 0 ? (
                         <div className="flex items-center justify-center py-12">
                              <div className="text-center">
                                   <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-200 border-t-red-600 mx-auto mb-2"></div>
                                   <p className="text-sm text-slate-600">Đang tải thông báo...</p>
                              </div>
                         </div>
                    ) : filteredNotifications.length === 0 && notifications.length > 0 ? (
                         <div className="flex items-center justify-center py-12">
                              <div className="text-center">
                                   <Bell className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                                   <p className="text-sm text-slate-600">Không tìm thấy thông báo phù hợp với bộ lọc</p>
                                   <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                             setSearchTerm("");
                                             setTypeFilter("all");
                                             setStatusFilter("all");
                                        }}
                                        className="mt-4"
                                   >
                                        Xóa bộ lọc
                                   </Button>
                              </div>
                         </div>
                    ) : filteredNotifications.length === 0 ? (
                         <div className="flex items-center justify-center py-12">
                              <div className="text-center">
                                   <Bell className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                                   <p className="text-sm text-slate-600 mb-2">Chưa có thông báo nào</p>
                                   <p className="text-xs text-slate-500 mb-4">
                                        Tạo thông báo đầu tiên để gửi đến người dùng
                                   </p>
                                   <Button
                                        onClick={() => setShowCreateModal(true)}
                                        className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                                   >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Tạo thông báo đầu tiên
                                   </Button>
                              </div>
                         </div>
                    ) : (
                         <div className="">
                              <Table className="w-full rounded-2xl border border-teal-300">
                                   <TableHeader>
                                        <TableRow className="truncate text-nowrap">
                                             {columns.map((column) => (
                                                  <TableHead key={column.key}>{column.label}</TableHead>
                                             ))}
                                        </TableRow>
                                   </TableHeader>
                                   <TableBody>
                                        {paginatedNotifications.map((notification) => (
                                             <TableRow key={notification.notificationID || notification.id || Math.random()} className="truncate text-nowrap">
                                                  {columns.map((column) => (
                                                       <TableCell key={column.key}>
                                                            {column.render(notification)}
                                                       </TableCell>
                                                  ))}
                                             </TableRow>
                                        ))}
                                   </TableBody>
                              </Table>
                              {/* Pagination */}
                              {filteredNotifications.length > pageSize && (
                                   <div className="mt-4 flex justify-end">
                                        <Pagination
                                             currentPage={page}
                                             totalPages={totalPages}
                                             onPageChange={setPage}
                                             itemsPerPage={pageSize}
                                             totalItems={filteredNotifications.length}
                                        />
                                   </div>
                              )}
                         </div>
                    )}
               </Card>

               {/* Create Notification Modal */}
               <Modal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    title="Tạo thông báo mới"
                    size="lg"
                    className="max-h-[90vh] overflow-y-auto scrollbar-hide"
               >
                    <div className="space-y-3">
                         {/* Tabs: Hệ thống / Người dùng */}
                         <div className="flex items-center mb-2 rounded-xl bg-slate-100 p-1">
                              <button
                                   type="button"
                                   onClick={() => {
                                        setCreateTab("system");
                                        setSelectedRecipientId("all");
                                        setNewNotification((prev) => ({
                                             ...prev,
                                             userId: null,
                                        }));
                                   }}
                                   className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition ${createTab === "system"
                                        ? "bg-white text-red-600 shadow"
                                        : "text-slate-600 hover:text-slate-800"
                                        }`}
                              >
                                   <Bell className="w-4 h-4" />
                                   <span>Thông báo hệ thống</span>
                              </button>
                              <button
                                   type="button"
                                   onClick={() => {
                                        setCreateTab("user");
                                        // Reset lựa chọn người nhận, bắt buộc admin chọn 1 user cụ thể
                                        setSelectedRecipientId("");
                                        setNewNotification((prev) => ({
                                             ...prev,
                                             userId: null,
                                        }));
                                   }}
                                   className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition ${createTab === "user"
                                        ? "bg-white text-emerald-600 shadow"
                                        : "text-slate-600 hover:text-slate-800"
                                        }`}
                              >
                                   <Users className="w-4 h-4" />
                                   <span>Gửi cho người dùng</span>
                              </button>
                         </div>
                         {/* Message Content */}
                         <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                   Nội dung thông báo <span className="text-red-500">*</span>
                              </label>
                              <Textarea
                                   value={newNotification.message}
                                   onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                                   placeholder="Nhập nội dung thông báo... (Ví dụ: Bạn có đặt sân mới, Hệ thống sẽ bảo trì từ 2:00-4:00, ...)"
                                   rows={3}
                                   maxLength={500}
                                   className="resize-none"
                              />
                              <p className={`text-xs ${newNotification.message.length >= 500 ? "text-red-500 font-medium" : newNotification.message.length >= 450 ? "text-yellow-600" : "text-slate-500"}`}>
                                   {newNotification.message.length}/500 ký tự
                                   {newNotification.message.length >= 500 && " (đã đạt giới hạn)"}
                              </p>
                         </div>

                         {/* Type Selection */}
                         <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                   Loại thông báo <span className="text-red-500">*</span>
                              </label>
                              <Select
                                   value={createTab === "system" ? "System" : newNotification.type}
                                   disabled={createTab === "system"}
                                   onValueChange={(value) => setNewNotification({ ...newNotification, type: value })}
                              >
                                   <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Chọn loại thông báo" />
                                   </SelectTrigger>
                                   <SelectContent>
                                        <SelectItem value="System">📢 Thông báo hệ thống</SelectItem>
                                        <SelectItem value="Comment">💬  Bình luận</SelectItem>
                                        <SelectItem value="Like">👍 Thích</SelectItem>
                                        <SelectItem value="ReportResult">📋 Kết quả báo cáo</SelectItem>
                                        <SelectItem value="Mention">@ Được nhắc đến</SelectItem>
                                   </SelectContent>
                              </Select>
                              <p className="text-xs text-slate-500 mt-1">
                                   {createTab === "system"
                                        ? 'Tab "Thông báo hệ thống" luôn gửi loại "System".'
                                        : "Loại thông báo xác định cách hiển thị và xử lý"}
                              </p>
                         </div>

                         {/* User ID - Người nhận */}
                         <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                   Người nhận
                              </label>
                              <Select
                                   value={selectedRecipientId}
                                   disabled={createTab === "system"}
                                   onValueChange={(value) => {
                                        setSelectedRecipientId(value);
                                        setNewNotification({
                                             ...newNotification,
                                             userId: value === "all" ? null : parseInt(value, 10)
                                        });
                                   }}
                              >
                                   <SelectTrigger className="w-full rounded-xl">
                                        <SelectValue />
                                   </SelectTrigger>
                                   <SelectContent className="max-h-[300px]">
                                        {createTab === "system" && (
                                             <SelectItem value="all">
                                                  <div className="flex items-center space-x-2">
                                                       <Users className="w-4 h-4 text-blue-600" />
                                                       <span className="font-medium">Gửi cho tất cả ({users.length} người)</span>
                                                  </div>
                                             </SelectItem>
                                        )}
                                        {users.map((user) => (
                                             <SelectItem key={user.id} value={user.id.toString()}>
                                                  <div className="flex items-center space-x-2">
                                                       <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-semibold">
                                                            {user.fullName.charAt(0)}
                                                       </div>
                                                       <div className="flex-1">
                                                            <p className="font-medium text-sm">{user.fullName}</p>
                                                            <p className="text-xs text-slate-500">{user.email}</p>
                                                       </div>
                                                       <Badge
                                                            variant="outline"
                                                            className={
                                                                 user.role === "Admin"
                                                                      ? "bg-red-50 text-red-700 border-red-200"
                                                                      : user.role === "Owner"
                                                                           ? "bg-amber-50 text-amber-700 border-amber-200"
                                                                           : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                            }
                                                       >
                                                            {user.role}
                                                       </Badge>
                                                  </div>
                                             </SelectItem>
                                        ))}
                                   </SelectContent>
                              </Select>
                              <p className="text-xs text-slate-500 mt-1">
                                   {createTab === "system"
                                        ? '"Thông báo hệ thống" sẽ tự động gửi toàn bộ hệ thống.'
                                        : 'Chọn 1 người dùng cụ thể'}
                              </p>
                         </div>

                         {/* Target ID - chỉ hiển thị cho tab Gửi cho người dùng */}
                         {createTab === "user" && (
                              <div>
                                   <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Đối tượng liên quan <span className="text-red-500">*</span>
                                   </label>

                                   {/* Select loại đối tượng */}
                                   <div className="mb-2">
                                        <Select
                                             value={newNotification.targetType}
                                             onValueChange={(value) => {
                                                  setNewNotification((prev) => ({
                                                       ...prev,
                                                       targetType: value,
                                                       targetId: value === "none" ? 0 : prev.targetId,
                                                  }));
                                             }}
                                        >
                                             <SelectTrigger className="w-full rounded-xl mb-1">
                                                  <SelectValue placeholder="Chọn loại đối tượng liên quan" />
                                             </SelectTrigger>
                                             <SelectContent>
                                                  <SelectItem value="none">
                                                       Không áp dụng (thông báo chung)
                                                  </SelectItem>
                                                  <SelectItem value="booking">Đặt sân</SelectItem>
                                                  <SelectItem value="post">Bài viết cộng đồng</SelectItem>
                                                  <SelectItem value="comment">Bình luận</SelectItem>
                                                  <SelectItem value="report">Báo cáo vi phạm</SelectItem>
                                                  <SelectItem value="user">Người được nhắc đến</SelectItem>
                                             </SelectContent>
                                        </Select>
                                   </div>

                                   {/* Select Target ID nhanh hoặc nhập thủ công */}
                                   <div className="flex flex-col gap-1">
                                        <Select
                                             value={
                                                  isCustomTargetId
                                                       ? "custom"
                                                       : String(newNotification.targetId ?? 0)
                                             }
                                             onValueChange={(value) => {
                                                  if (value === "custom") {
                                                       setIsCustomTargetId(true);
                                                       setNewNotification((prev) => ({
                                                            ...prev,
                                                            targetId: prev.targetId || 0,
                                                       }));
                                                  } else {
                                                       setIsCustomTargetId(false);
                                                       setNewNotification((prev) => ({
                                                            ...prev,
                                                            targetId: parseInt(value, 10) || 0,
                                                       }));
                                                  }
                                             }}
                                             disabled={newNotification.targetType === "none"}
                                        >
                                             <SelectTrigger className="w-full rounded-xl">
                                                  <SelectValue
                                                       placeholder={
                                                            newNotification.targetType === "none"
                                                                 ? "0 = Không áp dụng"
                                                                 : "Chọn nhanh ID hoặc nhập thủ công"
                                                       }
                                                  />
                                             </SelectTrigger>
                                             <SelectContent>
                                                  <SelectItem value="0">0 = Không áp dụng</SelectItem>
                                                  <SelectItem value="custom">Nhập ID tùy chỉnh...</SelectItem>
                                             </SelectContent>
                                        </Select>

                                        {isCustomTargetId && newNotification.targetType !== "none" && (
                                             <Input
                                                  type="number"
                                                  value={newNotification.targetId || ""}
                                                  onChange={(e) =>
                                                       setNewNotification({
                                                            ...newNotification,
                                                            targetId: e.target.value
                                                                 ? parseInt(e.target.value, 10)
                                                                 : 0,
                                                       })
                                                  }
                                                  placeholder={
                                                       newNotification.targetType === "booking"
                                                            ? "Nhập Booking ID liên quan"
                                                            : newNotification.targetType === "post"
                                                                 ? "Nhập Post ID liên quan"
                                                                 : newNotification.targetType === "comment"
                                                                      ? "Nhập Comment ID liên quan"
                                                                      : newNotification.targetType === "report"
                                                                           ? "Nhập Report ID liên quan"
                                                                           : "Nhập User ID được nhắc đến"
                                                  }
                                                  min="0"
                                             />
                                        )}
                                   </div>
                                   <p className="text-xs text-slate-500 mt-1">
                                        ID đối tượng liên quan tùy theo loại thông báo:
                                        System → 0 (không gắn gì);
                                        Comment → CommentID;
                                        Like → PostID;
                                        ReportResult → ReportID;
                                        Mention → UserID được nhắc đến.
                                   </p>
                              </div>
                         )}


                         {/* Action Buttons */}
                         <div className="flex space-x-3 pt-4 border-t border-slate-200">
                              <Button
                                   onClick={handleCreateNotification}
                                   className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 rounded-xl"
                                   disabled={!newNotification.message || newNotification.message.trim() === "" || loading}
                              >
                                   {loading ? (
                                        <>
                                             <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                             Đang tạo...
                                        </>
                                   ) : (
                                        <>
                                             <Send className="w-4 h-4 mr-2" />
                                             Tạo thông báo
                                        </>
                                   )}
                              </Button>
                              <Button
                                   onClick={() => {
                                        setShowCreateModal(false);
                                        setNewNotification({
                                             message: "",
                                             type: "System",
                                             userId: 0,
                                             targetId: 0
                                        });
                                   }}
                                   variant="outline"
                                   className="flex-1 rounded-xl"
                                   disabled={loading}
                              >
                                   Hủy
                              </Button>
                         </div>
                    </div>
               </Modal>

               {/* Notification Detail Modal */}
               <Modal
                    isOpen={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    title="Chi tiết thông báo"
                    size="2xl"
                    className="max-h-[90vh] overflow-y-auto max-w-[90vw] scrollbar-hide"
               >
                    {selectedNotification && (
                         (() => {
                              // Chuẩn hóa dữ liệu theo format mới từ API admin:
                              // { success: true, data: { notificationId, userId, fullName, title, message, type, targetId, isRead, createdAt, link } }
                              const raw = selectedNotification;
                              const detail = raw.data || raw; // hỗ trợ cả khi truyền trực tiếp object data

                              const notificationId = detail.notificationId || detail.id;
                              const type = detail.type || detail.notificationType || "System";
                              const message = detail.message || detail.title || detail.content || "Thông báo";
                              const isRead = detail.isRead;
                              const createdAt =
                                   detail.createdAt ||
                                   detail.sentAt ||
                                   detail.receivedAt ||
                                   null;
                              const userId = detail.userId ?? 0;
                              const fullName = detail.fullName || "";
                              const targetId = detail.targetId || 0;
                              const link = detail.link || null;

                              return (
                                   <div className="space-y-4">
                                        <div className="flex items-center space-x-2">
                                             <span className="text-2xl">{getTypeIcon(type)}</span>
                                             <h4 className="text-lg font-bold text-slate-900">
                                                  {message}
                                             </h4>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                             <Badge variant={getTypeBadgeVariant(type)}>
                                                  {getTypeLabel(type)}
                                             </Badge>
                                             <Badge variant={getStatusBadgeVariant(detail)}>
                                                  {isRead === true
                                                       ? "Đã đọc"
                                                       : isRead === false
                                                            ? "Chưa đọc"
                                                            : "N/A"}
                                             </Badge>
                                        </div>

                                        <div>
                                             <p className="text-sm font-medium text-slate-600 mb-2">Nội dung:</p>
                                             <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                                  <p className="text-slate-900 whitespace-pre-wrap">
                                                       {message}
                                                  </p>
                                             </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                             <div>
                                                  <p className="text-sm font-medium text-slate-600 mb-1">Người nhận:</p>
                                                  <p className="text-slate-900">
                                                       {userId === 0
                                                            ? "Tất cả người dùng"
                                                            : fullName
                                                                 ? `${fullName} (User ID: ${userId})`
                                                                 : `User ID: ${userId}`}
                                                  </p>
                                             </div>
                                             <div>
                                                  <p className="text-sm font-medium text-slate-600 mb-1">Target ID:</p>
                                                  <p className="text-slate-900">
                                                       {targetId || 0}
                                                  </p>
                                             </div>
                                             <div>
                                                  <p className="text-sm font-medium text-slate-600 mb-1">Ngày tạo:</p>
                                                  <p className="text-slate-900">
                                                       {createdAt
                                                            ? new Date(createdAt).toLocaleString("vi-VN")
                                                            : "N/A"}
                                                  </p>
                                             </div>
                                             {notificationId && (
                                                  <div>
                                                       <p className="text-sm font-medium text-slate-600 mb-1">Notification ID:</p>
                                                       <p className="text-slate-900 font-mono text-sm">
                                                            {notificationId}
                                                       </p>
                                                  </div>
                                             )}
                                             {link && (
                                                  <div className="md:col-span-2">
                                                       <p className="text-sm font-medium text-slate-600 mb-1">Link liên quan:</p>
                                                       <a
                                                            href={link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-blue-600 hover:underline break-all"
                                                       >
                                                            {link}
                                                       </a>
                                                  </div>
                                             )}
                                        </div>
                                   </div>
                              );
                         })()
                    )}
               </Modal>
          </div>
     );
}
