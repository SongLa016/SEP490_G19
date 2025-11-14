import React, { useState, useEffect } from "react";
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
     Table,
     Modal
} from "../../../shared/components/ui";
import {
     Bell,
     Plus,
     Edit,
     Trash2,
     Send,
     Eye,
     Calendar,
     Users,
     AlertCircle,
     CheckCircle,
     Clock
} from "lucide-react";

export default function SystemNotificationsManagement() {
     const [notifications, setNotifications] = useState([]);
     const [filteredNotifications, setFilteredNotifications] = useState([]);
     const [searchTerm, setSearchTerm] = useState("");
     const [typeFilter, setTypeFilter] = useState("all");
     const [statusFilter, setStatusFilter] = useState("all");
     const [showCreateModal, setShowCreateModal] = useState(false);
     const [selectedNotification, setSelectedNotification] = useState(null);
     const [showDetailModal, setShowDetailModal] = useState(false);

     const [newNotification, setNewNotification] = useState({
          title: "",
          content: "",
          notificationType: "General",
          sentToRole: "all",
          sentToSpecificUsers: "",
          isUrgent: false,
          expiresAt: ""
     });

     useEffect(() => {
          // Mock data - trong thực tế sẽ gọi API
          const mockNotifications = [
               {
                    id: 1,
                    title: "Bảo trì hệ thống",
                    content: "Hệ thống sẽ được bảo trì từ 2:00 - 4:00 ngày 25/01/2024. Vui lòng lưu lại công việc của bạn.",
                    notificationType: "Warning",
                    sentToRole: "all",
                    sentToSpecificUsers: null,
                    isUrgent: true,
                    sentBy: 1,
                    sentAt: "2024-01-20T10:00:00",
                    expiresAt: "2024-01-25T04:00:00",
                    status: "Sent"
               },
               {
                    id: 2,
                    title: "Khuyến mãi đặc biệt",
                    content: "Giảm giá 20% cho tất cả các sân vào cuối tuần này! Đặt ngay để không bỏ lỡ cơ hội.",
                    notificationType: "Promotion",
                    sentToRole: "Player",
                    sentToSpecificUsers: null,
                    isUrgent: false,
                    sentBy: 1,
                    sentAt: "2024-01-19T15:30:00",
                    expiresAt: "2024-01-28T23:59:59",
                    status: "Sent"
               },
               {
                    id: 3,
                    title: "Cập nhật tính năng mới",
                    content: "Chúng tôi đã thêm tính năng đặt sân định kỳ. Hãy thử ngay!",
                    notificationType: "Update",
                    sentToRole: "all",
                    sentToSpecificUsers: null,
                    isUrgent: false,
                    sentBy: 1,
                    sentAt: "2024-01-18T09:00:00",
                    expiresAt: null,
                    status: "Sent"
               },
               {
                    id: 4,
                    title: "Thông báo quan trọng",
                    content: "Vui lòng cập nhật thông tin cá nhân để tiếp tục sử dụng dịch vụ.",
                    notificationType: "General",
                    sentToRole: "Player",
                    sentToSpecificUsers: "123,456,789",
                    isUrgent: false,
                    sentBy: 1,
                    sentAt: "2024-01-17T14:20:00",
                    expiresAt: "2024-02-17T14:20:00",
                    status: "Draft"
               }
          ];

          setNotifications(mockNotifications);
          setFilteredNotifications(mockNotifications);
     }, []);

     useEffect(() => {
          let filtered = notifications;

          // Filter by search term
          if (searchTerm) {
               filtered = filtered.filter(notification =>
                    notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    notification.content.toLowerCase().includes(searchTerm.toLowerCase())
               );
          }

          // Filter by type
          if (typeFilter !== "all") {
               filtered = filtered.filter(notification => notification.notificationType === typeFilter);
          }

          // Filter by status
          if (statusFilter !== "all") {
               filtered = filtered.filter(notification => notification.status === statusFilter);
          }

          setFilteredNotifications(filtered);
     }, [notifications, searchTerm, typeFilter, statusFilter]);

     const handleCreateNotification = () => {
          const notification = {
               id: notifications.length + 1,
               ...newNotification,
               sentBy: 1, // Current admin user
               sentAt: new Date().toISOString(),
               status: "Draft"
          };

          setNotifications([notification, ...notifications]);
          setShowCreateModal(false);
          setNewNotification({
               title: "",
               content: "",
               notificationType: "General",
               sentToRole: "all",
               sentToSpecificUsers: "",
               isUrgent: false,
               expiresAt: ""
          });
     };

     const handleEditNotification = (notification) => {
          setSelectedNotification(notification);
          setShowDetailModal(true);
     };

     const handleDeleteNotification = (notification) => {
          if (window.confirm(`Bạn có chắc chắn muốn xóa thông báo "${notification.title}"?`)) {
               setNotifications(notifications.filter(n => n.id !== notification.id));
          }
     };

     const handleSendNotification = (notification) => {
          setNotifications(notifications.map(n =>
               n.id === notification.id ? { ...n, status: "Sent", sentAt: new Date().toISOString() } : n
          ));
     };

     const handleViewNotification = (notification) => {
          setSelectedNotification(notification);
          setShowDetailModal(true);
     };

     const getTypeBadgeVariant = (type) => {
          switch (type) {
               case "General":
                    return "default";
               case "Promotion":
                    return "secondary";
               case "Warning":
                    return "destructive";
               case "Update":
                    return "outline";
               default:
                    return "outline";
          }
     };

     const getStatusBadgeVariant = (status) => {
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

     const getUrgentIcon = (isUrgent) => {
          return isUrgent ? (
               <AlertCircle className="w-4 h-4 text-red-600" />
          ) : null;
     };

     const columns = [
          {
               key: "title",
               label: "Tiêu đề",
               render: (notification) => (
                    <div className="flex items-center space-x-2">
                         {getUrgentIcon(notification.isUrgent)}
                         <span className="font-medium text-slate-900">{notification.title}</span>
                    </div>
               )
          },
          {
               key: "type",
               label: "Loại",
               render: (notification) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeBadgeVariant(notification.notificationType)}`}>
                         {notification.notificationType}
                    </span>
               )
          },
          {
               key: "target",
               label: "Đối tượng",
               render: (notification) => (
                    <div className="flex items-center space-x-2">
                         <Users className="w-4 h-4 text-slate-400" />
                         <span className="text-sm text-slate-600">
                              {notification.sentToRole === "all" ? "Tất cả" : notification.sentToRole}
                         </span>
                    </div>
               )
          },
          {
               key: "status",
               label: "Trạng thái",
               render: (notification) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeVariant(notification.status)}`}>
                         {notification.status}
                    </span>
               )
          },
          {
               key: "sentAt",
               label: "Ngày gửi",
               render: (notification) => (
                    <div className="flex items-center space-x-2">
                         <Calendar className="w-4 h-4 text-slate-400" />
                         <span className="text-sm text-slate-600">
                              {new Date(notification.sentAt).toLocaleDateString('vi-VN')}
                         </span>
                    </div>
               )
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
                         >
                              <Eye className="w-4 h-4" />
                         </Button>
                         <Button
                              onClick={() => handleEditNotification(notification)}
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-800 hover:bg-green-50"
                         >
                              <Edit className="w-4 h-4" />
                         </Button>
                         {notification.status === "Draft" && (
                              <Button
                                   onClick={() => handleSendNotification(notification)}
                                   variant="ghost"
                                   size="sm"
                                   className="text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                              >
                                   <Send className="w-4 h-4" />
                              </Button>
                         )}
                         <Button
                              onClick={() => handleDeleteNotification(notification)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
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
                                   onClick={() => setShowCreateModal(true)}
                                   className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
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
                                        placeholder="Tìm kiếm theo tiêu đề hoặc nội dung..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                   />
                              </div>
                         </div>
                         <div className="flex space-x-4">
                              <Select value={typeFilter} onValueChange={setTypeFilter}>
                                   <SelectTrigger className="w-40 rounded-2xl">
                                        <SelectValue placeholder="Tất cả loại" />
                                   </SelectTrigger>
                                   <SelectContent>
                                        <SelectItem value="all">Tất cả loại</SelectItem>
                                        <SelectItem value="General">Chung</SelectItem>
                                        <SelectItem value="Promotion">Khuyến mãi</SelectItem>
                                        <SelectItem value="Warning">Cảnh báo</SelectItem>
                                        <SelectItem value="Update">Cập nhật</SelectItem>
                                   </SelectContent>
                              </Select>
                              <Select value={statusFilter} onValueChange={setStatusFilter}>
                                   <SelectTrigger className="w-40 rounded-2xl">
                                        <SelectValue placeholder="Tất cả trạng thái" />
                                   </SelectTrigger>
                                   <SelectContent>
                                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                        <SelectItem value="Sent">Đã gửi</SelectItem>
                                        <SelectItem value="Draft">Bản nháp</SelectItem>
                                        <SelectItem value="Failed">Thất bại</SelectItem>
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
                    <Card className="p-4">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-slate-600">Đã gửi</p>
                                   <p className="text-2xl font-bold text-slate-900">
                                        {notifications.filter(n => n.status === "Sent").length}
                                   </p>
                              </div>
                              <CheckCircle className="w-8 h-8 text-green-600" />
                         </div>
                    </Card>
                    <Card className="p-4">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-slate-600">Bản nháp</p>
                                   <p className="text-2xl font-bold text-slate-900">
                                        {notifications.filter(n => n.status === "Draft").length}
                                   </p>
                              </div>
                              <Clock className="w-8 h-8 text-yellow-600" />
                         </div>
                    </Card>
                    <Card className="p-4">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-slate-600">Khẩn cấp</p>
                                   <p className="text-2xl font-bold text-slate-900">
                                        {notifications.filter(n => n.isUrgent).length}
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
                    </div>
                    <Table
                         data={filteredNotifications}
                         columns={columns}
                         className="w-full"
                    />
               </Card>

               {/* Create Notification Modal */}
               <Modal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    title="Tạo thông báo mới"
                    size="2xl"
                    className="max-h-[90vh] scrollbar-hide"
               >

                    <div className="space-y-4">
                         <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                   Tiêu đề *
                              </label>
                              <Input
                                   value={newNotification.title}
                                   onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                                   placeholder="Nhập tiêu đề thông báo..."
                              />
                         </div>

                         <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                   Nội dung *
                              </label>
                              <Textarea
                                   value={newNotification.content}
                                   onChange={(e) => setNewNotification({ ...newNotification, content: e.target.value })}
                                   placeholder="Nhập nội dung thông báo..."
                                   rows={4}
                              />
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                   <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Loại thông báo
                                   </label>
                                   <Select
                                        value={newNotification.notificationType}
                                        onValueChange={(value) => setNewNotification({ ...newNotification, notificationType: value })}
                                   >
                                        <SelectTrigger className="rounded-2xl">
                                             <SelectValue placeholder="Chọn loại thông báo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="General">Chung</SelectItem>
                                             <SelectItem value="Promotion">Khuyến mãi</SelectItem>
                                             <SelectItem value="Warning">Cảnh báo</SelectItem>
                                             <SelectItem value="Update">Cập nhật</SelectItem>
                                        </SelectContent>
                                   </Select>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Đối tượng nhận
                                   </label>
                                   <Select
                                        value={newNotification.sentToRole}
                                        onValueChange={(value) => setNewNotification({ ...newNotification, sentToRole: value })}
                                   >
                                        <SelectTrigger className="rounded-2xl">
                                             <SelectValue placeholder="Chọn đối tượng" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="all">Tất cả</SelectItem>
                                             <SelectItem value="Player">Người chơi</SelectItem>
                                             <SelectItem value="FieldOwner">Chủ sân</SelectItem>
                                             <SelectItem value="Admin">Admin</SelectItem>
                                        </SelectContent>
                                   </Select>
                              </div>
                         </div>

                         <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                   Gửi đến người dùng cụ thể (ID, cách nhau bởi dấu phẩy)
                              </label>
                              <Input
                                   value={newNotification.sentToSpecificUsers}
                                   onChange={(e) => setNewNotification({ ...newNotification, sentToSpecificUsers: e.target.value })}
                                   placeholder="123,456,789"
                              />
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex items-center space-x-2">
                                   <input
                                        type="checkbox"
                                        id="isUrgent"
                                        checked={newNotification.isUrgent}
                                        onChange={(e) => setNewNotification({ ...newNotification, isUrgent: e.target.checked })}
                                        className="rounded border-slate-300"
                                   />
                                   <label htmlFor="isUrgent" className="text-sm font-medium text-slate-700">
                                        Thông báo khẩn cấp
                                   </label>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Hết hạn
                                   </label>
                                   <Input
                                        type="datetime-local"
                                        value={newNotification.expiresAt}
                                        onChange={(e) => setNewNotification({ ...newNotification, expiresAt: e.target.value })}
                                   />
                              </div>
                         </div>

                         <div className="flex space-x-3 pt-4 border-t border-slate-200">
                              <Button
                                   onClick={handleCreateNotification}
                                   className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 rounded-2xl"
                                   disabled={!newNotification.title || !newNotification.content}
                              >
                                   Tạo thông báo
                              </Button>
                              <Button
                                   onClick={() => setShowCreateModal(false)}
                                   variant="outline"
                                   className="flex-1 rounded-2xl"
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
                    className="max-h-[90vh] scrollbar-hide"
               >
                    {selectedNotification && (
                         <div className="space-y-4">
                              <div className="flex items-center space-x-2">
                                   {getUrgentIcon(selectedNotification.isUrgent)}
                                   <h4 className="text-lg font-bold text-slate-900">{selectedNotification.title}</h4>
                              </div>

                              <div className="flex space-x-2">
                                   <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeBadgeVariant(selectedNotification.notificationType)}`}>
                                        {selectedNotification.notificationType}
                                   </span>
                                   <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeVariant(selectedNotification.status)}`}>
                                        {selectedNotification.status}
                                   </span>
                              </div>

                              <div>
                                   <p className="text-sm font-medium text-slate-600 mb-2">Nội dung:</p>
                                   <p className="text-slate-900 whitespace-pre-wrap">{selectedNotification.content}</p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div>
                                        <p className="text-sm font-medium text-slate-600">Đối tượng:</p>
                                        <p className="text-slate-900">
                                             {selectedNotification.sentToRole === "all" ? "Tất cả" : selectedNotification.sentToRole}
                                        </p>
                                   </div>
                                   <div>
                                        <p className="text-sm font-medium text-slate-600">Ngày gửi:</p>
                                        <p className="text-slate-900">
                                             {new Date(selectedNotification.sentAt).toLocaleString('vi-VN')}
                                        </p>
                                   </div>
                                   {selectedNotification.expiresAt && (
                                        <div>
                                             <p className="text-sm font-medium text-slate-600">Hết hạn:</p>
                                             <p className="text-slate-900">
                                                  {new Date(selectedNotification.expiresAt).toLocaleString('vi-VN')}
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
