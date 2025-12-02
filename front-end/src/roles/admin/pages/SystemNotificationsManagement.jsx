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
     Badge
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
     createNotification,
     getNotifications,
     getNotificationsByType,
     deleteNotification,
     deleteAllNotifications
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
     const [selectedRecipientId, setSelectedRecipientId] = useState("0");

     const [newNotification, setNewNotification] = useState({
          message: "",
          type: "System",
          userId: 0, // 0 = system notification (gửi cho tất cả), >0 = gửi cho user cụ thể
          targetId: 0 // ID của đối tượng liên quan (booking, post, comment, etc.)
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

               if (targetType && targetType !== "all") {
                    result = await getNotificationsByType(targetType, { page: 1, pageSize: 100 });
               } else {
                    result = await getNotifications({ page: 1, pageSize: 100 });
               }
               if (result.ok) {
                    // Parse response data - API có thể trả về nhiều format
                    const notificationsData = parseApiData(result.data ?? result.raw);
                    // Nếu không có data, thử dùng mock data để test UI
                    if (notificationsData.length === 0) {
                         console.warn("⚠️ [SystemNotificationsManagement] No notifications from API, using mock data for testing");
                         const mockNotifications = [
                              {
                                   notificationID: 1,
                                   userId: 0,
                                   type: "System",
                                   targetId: 0,
                                   message: "Hệ thống sẽ bảo trì từ 2:00-4:00 sáng ngày mai",
                                   isRead: false,
                                   createdAt: new Date().toISOString()
                              },
                              {
                                   notificationID: 2,
                                   userId: 2,
                                   type: "NewComment",
                                   targetId: 5,
                                   message: "Bạn có bình luận mới trên bài viết",
                                   isRead: true,
                                   createdAt: new Date(Date.now() - 86400000).toISOString()
                              },
                              {
                                   notificationID: 3,
                                   userId: 0,
                                   type: "System",
                                   targetId: 0,
                                   message: "Chào mừng bạn đến với hệ thống đặt sân!",
                                   isRead: false,
                                   createdAt: new Date(Date.now() - 172800000).toISOString()
                              }
                         ];
                         setNotifications(mockNotifications);
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
               alert("Có lỗi xảy ra khi tải thông báo: " + error.message);
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
     }, [notifications, searchTerm, statusFilter]);

     const handleCreateNotification = async () => {
          // Kiểm tra role Admin
          if (user?.roleName !== "Admin") {
               alert("Chỉ Admin mới có quyền tạo thông báo hệ thống.");
               return;
          }

          // Validate
          if (!newNotification.message || newNotification.message.trim() === "") {
               alert("Vui lòng nhập nội dung thông báo!");
               return;
          }

          try {
               setLoading(true);

               // Format data theo API
               const notificationData = {
                    userId: newNotification.userId || 0, // 0 = system notification, >0 = gửi cho user cụ thể
                    type: newNotification.type || "System",
                    targetId: newNotification.targetId || 0, // 0 if not applicable
                    message: newNotification.message.trim()
               };
               const result = await createNotification(notificationData);

               if (result.ok) {
                    // Reload notifications
                    await loadNotifications({ type: typeFilter });
                    setShowCreateModal(false);
                    setNewNotification({
                         message: "",
                         type: "System",
                         userId: 0,
                         targetId: 0
                    });
                    alert("✅ Tạo thông báo thành công!");
               } else {
                    alert("❌ Lỗi: " + result.reason);
               }
          } catch (error) {
               console.error("Error creating notification:", error);
               alert("❌ Có lỗi xảy ra khi tạo thông báo: " + error.message);
          } finally {
               setLoading(false);
          }
     };

     const handleDeleteNotification = async (notification) => {
          // Kiểm tra role Admin
          if (user?.roleName !== "Admin") {
               alert("Chỉ Admin mới có quyền xóa thông báo hệ thống.");
               return;
          }

          const notificationId = notification.id || notification.notificationId;
          const message = notification.message || notification.title || "thông báo này";

          if (!window.confirm(`Bạn có chắc chắn muốn xóa thông báo "${message.substring(0, 50)}..."?`)) {
               return;
          }

          try {
               setLoading(true);
               const result = await deleteNotification(notificationId);

               if (result.ok) {
                    alert("✅ Xóa thông báo thành công!");
                    await loadNotifications({ type: typeFilter }); // Reload từ API
               } else {
                    alert("❌ Lỗi: " + result.reason);
               }
          } catch (error) {
               console.error("Error deleting notification:", error);
               alert("❌ Có lỗi xảy ra khi xóa thông báo: " + error.message);
          } finally {
               setLoading(false);
          }
     };

     const handleDeleteAllNotificationsAdmin = async () => {
          if (!notifications.length) {
               alert("Hiện không có thông báo để xóa.");
               return;
          }
          if (!window.confirm("Bạn có chắc chắn muốn xóa toàn bộ thông báo của hệ thống?")) {
               return;
          }
          try {
               setLoading(true);
               const result = await deleteAllNotifications();
               if (result.ok) {
                    alert("✅ Đã xóa toàn bộ thông báo.");
                    await loadNotifications({ type: typeFilter });
               } else {
                    alert("❌ Lỗi: " + result.reason);
               }
          } catch (error) {
               console.error("Error deleting all notifications:", error);
               alert("❌ Có lỗi xảy ra khi xóa toàn bộ thông báo: " + error.message);
          } finally {
               setLoading(false);
          }
     };

     const handleViewNotification = (notification) => {
          setSelectedNotification(notification);
          setShowDetailModal(true);
     };

     const getTypeBadgeVariant = (type) => {
          const actualType = type || "System";
          switch (actualType) {
               case "System":
                    return "default";
               case "Comment":
                    return "secondary";
               case "Like":
                    return "secondary";
               case "ReportResult":
                    return "outline";
               case "Mention":
                    return "secondary";
               default:
                    return "outline";
          }
     };

     const getStatusBadgeVariant = (notification) => {
          // API có thể trả về isRead thay vì status
          const isRead = notification.isRead;
          if (isRead === true) {
               return "default";
          } else if (isRead === false) {
               return "secondary";
          }
          // Fallback cho status cũ
          const status = notification.status;
          switch (status) {
               case "Sent":
                    return "default";
               case "Draft":
                    return "secondary";
               case "Failed":
                    return "destructive";
               default:
                    return "outline";
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
               default:
                    return "📢";
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
                         <div className="flex items-start space-x-2">
                              <span className="text-lg flex-shrink-0">{getTypeIcon(type)}</span>
                              <span className="font-medium text-slate-900 line-clamp-2">
                                   {message.length > 60 ? message.substring(0, 60) + "..." : message}
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
                    return (
                         <Badge variant={getTypeBadgeVariant(type)}>
                              {type}
                         </Badge>
                    );
               }
          },
          {
               key: "userId",
               label: "Người nhận",
               render: (notification) => {
                    const userId = notification.userId || 0;
                    return (
                         <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-slate-400" />
                              <span className="text-sm text-slate-600">
                                   {userId === 0 ? "Tất cả" : `User ID: ${userId}`}
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
                         <Badge variant={getStatusBadgeVariant(notification)}>
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
                         <div className="flex items-center space-x-2">
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
                    <div className="flex items-center space-x-2">
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
               <Card className="p-6 rounded-2xl shadow-lg">
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
                         <div className="overflow-x-auto">
                              <Table className="w-full  rounded-2xl border border-teal-300">
                                   <TableHeader>
                                        <TableRow>
                                             {columns.map((column) => (
                                                  <TableHead key={column.key}>{column.label}</TableHead>
                                             ))}
                                        </TableRow>
                                   </TableHeader>
                                   <TableBody>
                                        {filteredNotifications.map((notification) => (
                                             <TableRow key={notification.notificationID || notification.id || Math.random()}>
                                                  {columns.map((column) => (
                                                       <TableCell key={column.key}>
                                                            {column.render(notification)}
                                                       </TableCell>
                                                  ))}
                                             </TableRow>
                                        ))}
                                   </TableBody>
                              </Table>
                         </div>
                    )}
               </Card>

               {/* Create Notification Modal */}
               <Modal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    title="Tạo thông báo mới"
                    size="2xl"
                    className="max-h-[90vh] overflow-y-auto scrollbar-hide"
               >
                    <div className="space-y-4">
                         {/* Info Banner */}
                         <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                              <Bell className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div className="text-sm text-blue-800">
                                   <p className="font-medium mb-1">Thông tin API</p>
                                   <p className="text-xs">Thông báo sẽ được gửi theo format: userId, type, targetId, message</p>
                              </div>
                         </div>

                         {/* Message Content */}
                         <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                   Nội dung thông báo *
                              </label>
                              <Textarea
                                   value={newNotification.message}
                                   onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                                   placeholder="Nhập nội dung thông báo... (Ví dụ: Bạn có đặt sân mới, Hệ thống sẽ bảo trì từ 2:00-4:00, ...)"
                                   rows={3}
                                   className="resize-none"
                              />
                              <p className="text-xs text-slate-500 mt-1">
                                   {newNotification.message.length} ký tự
                              </p>
                         </div>

                         {/* Type Selection */}
                         <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                   Loại thông báo *
                              </label>
                              <Select
                                   value={newNotification.type}
                                   onValueChange={(value) => setNewNotification({ ...newNotification, type: value })}
                              >
                                   <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Chọn loại thông báo" />
                                   </SelectTrigger>
                                   <SelectContent>
                                        <SelectItem value="System">📢 System - Thông báo hệ thống</SelectItem>
                                        <SelectItem value="Comment">💬 Comment - Bình luận</SelectItem>
                                        <SelectItem value="Like">👍 Like - Thích</SelectItem>
                                        <SelectItem value="ReportResult">📋 ReportResult - Kết quả báo cáo</SelectItem>
                                        <SelectItem value="Mention">@ Mention - Được nhắc đến</SelectItem>
                                   </SelectContent>
                              </Select>
                              <p className="text-xs text-slate-500 mt-1">
                                   Loại thông báo xác định cách hiển thị và xử lý
                              </p>
                         </div>

                         {/* User ID - Người nhận */}
                         <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                   User ID (Người nhận)
                              </label>
                              <Select
                                   value={selectedRecipientId}
                                   onValueChange={(value) => {
                                        setSelectedRecipientId(value);
                                        setNewNotification({
                                             ...newNotification,
                                             userId: parseInt(value)
                                        });
                                   }}
                              >
                                   <SelectTrigger className="w-full rounded-xl">
                                        <SelectValue />
                                   </SelectTrigger>
                                   <SelectContent className="max-h-[300px]">
                                        <SelectItem value="0">
                                             <div className="flex items-center space-x-2">
                                                  <Users className="w-4 h-4 text-blue-600" />
                                                  <span className="font-medium">0 = Gửi cho tất cả ({users.length} người)</span>
                                             </div>
                                        </SelectItem>
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
                                                       <Badge className="text-xs">{user.role}</Badge>
                                                  </div>
                                             </SelectItem>
                                        ))}
                                   </SelectContent>
                              </Select>
                              <p className="text-xs text-slate-500 mt-1">
                                   Để trống hoặc nhập 0 để gửi thông báo hệ thống cho tất cả người dùng
                              </p>
                         </div>

                         {/* Target ID */}
                         <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                   Target ID (ID đối tượng liên quan)
                              </label>
                              <Input
                                   type="number"
                                   value={newNotification.targetId || ""}
                                   onChange={(e) => setNewNotification({
                                        ...newNotification,
                                        targetId: e.target.value ? parseInt(e.target.value) : 0
                                   })}
                                   placeholder="0 = Không áp dụng, >0 = ID của booking/post/comment liên quan"
                                   min="0"
                              />
                              <p className="text-xs text-slate-500 mt-1">
                                   ID của đối tượng liên quan (ví dụ: Booking ID, Post ID, Comment ID)
                              </p>
                         </div>

                         {/* Preview */}
                         {newNotification.message && (
                              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                   <p className="text-xs font-medium text-slate-600 mb-2">Preview:</p>
                                   <div className="bg-white rounded p-3 border border-slate-200">
                                        <div className="flex items-start gap-2">
                                             <span className="text-lg">
                                                  {newNotification.type === "System" ? "📢" :
                                                       newNotification.type === "Comment" ? "💬" :
                                                            newNotification.type === "Like" ? "👍" :
                                                                 newNotification.type === "ReportResult" ? "📋" :
                                                                      newNotification.type === "Mention" ? "@" : "📢"}
                                             </span>
                                             <div className="flex-1">
                                                  <p className="text-sm text-slate-900 whitespace-pre-wrap">
                                                       {newNotification.message}
                                                  </p>
                                                  <p className="text-xs text-slate-500 mt-2">
                                                       Type: {newNotification.type} |
                                                       UserID: {newNotification.userId || 0} |
                                                       TargetID: {newNotification.targetId || 0}
                                                  </p>
                                             </div>
                                        </div>
                                   </div>
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
                         <div className="space-y-4">
                              <div className="flex items-center space-x-2">
                                   <span className="text-2xl">{getTypeIcon(selectedNotification.type || selectedNotification.notificationType)}</span>
                                   <h4 className="text-lg font-bold text-slate-900">
                                        {selectedNotification.message || selectedNotification.title || "Thông báo"}
                                   </h4>
                              </div>

                              <div className="flex space-x-2">
                                   <Badge variant={getTypeBadgeVariant(selectedNotification.type || selectedNotification.notificationType)}>
                                        {selectedNotification.type || selectedNotification.notificationType || "System"}
                                   </Badge>
                                   <Badge variant={getStatusBadgeVariant(selectedNotification)}>
                                        {selectedNotification.isRead !== undefined
                                             ? (selectedNotification.isRead ? "Đã đọc" : "Chưa đọc")
                                             : (selectedNotification.status || "N/A")}
                                   </Badge>
                              </div>

                              <div>
                                   <p className="text-sm font-medium text-slate-600 mb-2">Nội dung:</p>
                                   <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                        <p className="text-slate-900 whitespace-pre-wrap">
                                             {selectedNotification.message || selectedNotification.content || "Không có nội dung"}
                                        </p>
                                   </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div>
                                        <p className="text-sm font-medium text-slate-600 mb-1">User ID:</p>
                                        <p className="text-slate-900">
                                             {selectedNotification.userId === 0 ? "Tất cả người dùng" : `User ID: ${selectedNotification.userId}`}
                                        </p>
                                   </div>
                                   <div>
                                        <p className="text-sm font-medium text-slate-600 mb-1">Target ID:</p>
                                        <p className="text-slate-900">
                                             {selectedNotification.targetId || 0}
                                        </p>
                                   </div>
                                   <div>
                                        <p className="text-sm font-medium text-slate-600 mb-1">Ngày tạo:</p>
                                        <p className="text-slate-900">
                                             {selectedNotification.createdAt
                                                  ? new Date(selectedNotification.createdAt).toLocaleString('vi-VN')
                                                  : selectedNotification.sentAt
                                                       ? new Date(selectedNotification.sentAt).toLocaleString('vi-VN')
                                                       : "N/A"}
                                        </p>
                                   </div>
                                   {selectedNotification.id && (
                                        <div>
                                             <p className="text-sm font-medium text-slate-600 mb-1">Notification ID:</p>
                                             <p className="text-slate-900 font-mono text-sm">
                                                  {selectedNotification.id || selectedNotification.notificationId}
                                             </p>
                                        </div>
                                   )}
                              </div>
                         </div>
                    )}
               </Modal>
          </div>
     );
}
