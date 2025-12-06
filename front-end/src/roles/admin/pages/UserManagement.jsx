import React, { useState, useEffect } from "react";
import {
     Card,
     CardContent,
     CardHeader,
     CardTitle,
     Button,
     Input,
     Select,
     SelectContent,
     SelectItem,
     SelectTrigger,
     SelectValue,
     Badge,
     Avatar,
     AvatarImage,
     AvatarFallback,
     DatePicker,
     Modal
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
     Search,
     Filter,
     Edit,
     Trash2,
     Shield,
     UserCheck,
     UserX,
     Eye,
     Phone,
     Calendar,
     Users,
     X,
     Bell,
     Send
} from "lucide-react";
import { fetchAllUserStatistics, fetchPlayerProfile, lockUserAccount } from "../../../shared/services/adminStatistics";
import { createNotification, createBulkNotifications } from "../../../shared/services/notifications";
import Swal from "sweetalert2";
import { useAuth } from "../../../contexts/AuthContext";

export default function UserManagement() {
     const { user, isAdmin: checkIsAdmin } = useAuth();
     const [users, setUsers] = useState([]);
     const [filteredUsers, setFilteredUsers] = useState([]);
     const [searchTerm, setSearchTerm] = useState("");
     const [roleFilter, setRoleFilter] = useState("all");
     const [statusFilter, setStatusFilter] = useState("all");
     const [selectedUser, setSelectedUser] = useState(null);
     const [userProfileDetails, setUserProfileDetails] = useState(null);
     const [showUserModal, setShowUserModal] = useState(false);
     const [showCreateModal, setShowCreateModal] = useState(false);
     const [showNotificationModal, setShowNotificationModal] = useState(false);
     const [loading, setLoading] = useState(false);
     const [loadingProfile, setLoadingProfile] = useState(false);
     const [error, setError] = useState(null);
     const [selectedUsersForNotification, setSelectedUsersForNotification] = useState([]);
     const [selectedRecipientId, setSelectedRecipientId] = useState("0");
     const [notificationData, setNotificationData] = useState({
          type: "System",
          message: ""
     });
     const [newUser, setNewUser] = useState({
          email: "",
          fullName: "",
          phone: "",
          role: "Player",
          status: "Active",
          profile: {
               dateOfBirth: "",
               gender: "",
               address: "",
               skillLevel: "Beginner"
          }
     });

     useEffect(() => {
          loadUsers();
     }, []);

     const loadUsers = async () => {
          try {
               setLoading(true);
               setError(null);
               const result = await fetchAllUserStatistics();
               if (result.ok && result.data) {
                    // Check if data is an array or needs to be extracted
                    const usersData = Array.isArray(result.data) ? result.data :
                         (result.data.users || result.data.data || []);
                    // Transform API data to match component structure
                    // API returns: { userId, fullName, email, phone, roleName }
                    const transformedUsers = usersData.map(user => ({
                         id: user.userId,
                         email: user.email,
                         fullName: user.fullName,
                         phone: user.phone || "N/A",
                         role: user.roleName,
                         status: user.status || "Active",
                         createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : "N/A",
                         lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('vi-VN') : "N/A",
                         avatar: user.avatar || null,
                         profile: {
                              dateOfBirth: user.dateOfBirth || user.profile?.dateOfBirth || "N/A",
                              gender: user.gender || user.profile?.gender || "N/A",
                              address: user.address || user.profile?.address || "N/A",
                              skillLevel: user.skillLevel || user.profile?.skillLevel || "N/A"
                         }
                    }));
                    console.log("Roles in data:", transformedUsers.map(u => u.role));

                    setUsers(transformedUsers);
                    setFilteredUsers(transformedUsers);
               } else {
                    console.error("API Error:", result);
                    setError(result.reason || "Không thể tải danh sách người dùng");
               }
          } catch (err) {
               console.error("Error loading users:", err);
               setError("Đã xảy ra lỗi khi tải danh sách người dùng");
          } finally {
               setLoading(false);
          }
     };

     useEffect(() => {
          let filtered = users;

          // Filter by search term
          if (searchTerm) {
               filtered = filtered.filter(user =>
                    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.phone.includes(searchTerm)
               );
          }

          // Filter by role
          if (roleFilter !== "all") {
               if (roleFilter === "Owner") {
                    // Support both "Owner" and "FieldOwner"
                    filtered = filtered.filter(user => user.role === "Owner" || user.role === "FieldOwner");
               } else {
                    filtered = filtered.filter(user => user.role === roleFilter);
               }
          }

          // Filter by status
          if (statusFilter !== "all") {
               filtered = filtered.filter(user => user.status === statusFilter);
          }

          setFilteredUsers(filtered);
     }, [users, searchTerm, roleFilter, statusFilter]);

     const handleViewUser = async (user) => {
          setSelectedUser(user);
          setShowUserModal(true);
          setUserProfileDetails(null);

          // Fetch detailed profile information
          try {
               setLoadingProfile(true);
               const result = await fetchPlayerProfile(user.id);
               if (result.ok && result.data) {
                    setUserProfileDetails(result.data);
               } else {
                    console.error("Failed to fetch profile:", result.reason);
                    // Still show modal with basic info even if profile fetch fails
               }
          } catch (err) {
               console.error("Error fetching profile:", err);
          } finally {
               setLoadingProfile(false);
          }
     };

     const handleEditUser = (user) => {
          setSelectedUser(user);
          // Implement edit functionality
     };

     const handleCreateUser = () => {
          const user = {
               id: users.length + 1,
               ...newUser,
               createdAt: new Date().toISOString().split('T')[0],
               lastLogin: new Date().toISOString().split('T')[0],
               avatar: null
          };
          setUsers([user, ...users]);
          setShowCreateModal(false);
          setNewUser({
               email: "",
               fullName: "",
               phone: "",
               role: "Player",
               status: "Active",
               profile: {
                    dateOfBirth: "",
                    gender: "",
                    address: "",
                    skillLevel: "Beginner"
               }
          });
     };

     const handleDeleteUser = async (user) => {
          const result = await Swal.fire({
               title: "Xác nhận xóa",
               text: `Bạn có chắc chắn muốn xóa người dùng ${user.fullName}?`,
               icon: "warning",
               showCancelButton: true,
               confirmButtonColor: "#d33",
               cancelButtonColor: "#3085d6",
               confirmButtonText: "Xóa",
               cancelButtonText: "Hủy"
          });

          if (result.isConfirmed) {
               setUsers(users.filter(u => u.id !== user.id));
               await Swal.fire("Đã xóa!", "Người dùng đã được xóa thành công.", "success");
          }
     };

     const handleLockAccount = async (targetUser) => {
          // Kiểm tra quyền admin trước khi thực hiện (user từ useAuth là user hiện tại đang đăng nhập)
          if (!user) {
               await Swal.fire({
                    icon: "error",
                    title: "Lỗi xác thực",
                    text: "Không thể xác thực người dùng. Vui lòng đăng nhập lại."
               });
               return;
          }

          // Kiểm tra quyền admin
          if (!checkIsAdmin()) {
               await Swal.fire({
                    icon: "error",
                    title: "Không có quyền",
                    text: "Bạn không có quyền thực hiện thao tác này. Chỉ quản trị viên mới được phép khóa/mở khóa tài khoản."
               });
               return;
          }

          const actionText = targetUser.status === "Active" ? "khóa" : "mở khóa";
          const result = await Swal.fire({
               title: "Xác nhận",
               text: `Bạn có chắc chắn muốn ${actionText} tài khoản ${targetUser.fullName}?`,
               icon: "question",
               showCancelButton: true,
               confirmButtonColor: targetUser.status === "Active" ? "#d33" : "#3085d6",
               cancelButtonColor: "#6c757d",
               confirmButtonText: "Xác nhận",
               cancelButtonText: "Hủy"
          });

          if (!result.isConfirmed) {
               return;
          }

          try {
               setLoading(true);
               const result = await lockUserAccount(targetUser.id);
               if (result.ok) {
                    // Reload users to get updated status
                    await loadUsers();
                    // Update selected user if modal is open
                    if (selectedUser && selectedUser.id === targetUser.id) {
                         const updatedUsers = await fetchAllUserStatistics();
                         if (updatedUsers.ok && updatedUsers.data) {
                              const usersData = Array.isArray(updatedUsers.data) ? updatedUsers.data :
                                   (updatedUsers.data.users || updatedUsers.data.data || []);
                              const updatedUser = usersData.find(u => u.userId === targetUser.id);
                              if (updatedUser) {
                                   setSelectedUser({
                                        ...selectedUser,
                                        status: updatedUser.status || (targetUser.status === "Active" ? "Suspended" : "Active")
                                   });
                              }
                         }
                    }
                    await Swal.fire({
                         icon: "success",
                         title: "Thành công",
                         text: `Đã ${targetUser.status === "Active" ? "khóa" : "mở khóa"} tài khoản thành công!`
                    });
               } else {
                    await Swal.fire({
                         icon: "error",
                         title: "Lỗi",
                         text: result.reason || "Không thể thực hiện thao tác này"
                    });
               }
          } catch (err) {
               console.error("Error locking account:", err);
               await Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Đã xảy ra lỗi khi thực hiện thao tác"
               });
          } finally {
               setLoading(false);
          }
     };

     const handleSendNotification = (user) => {
          setSelectedUsersForNotification([user]);
          setSelectedRecipientId(user.id.toString());
          setShowNotificationModal(true);
     };

     const handleOpenNotificationModal = () => {
          setSelectedUsersForNotification([]);
          setSelectedRecipientId("0");
          setShowNotificationModal(true);
     };

     const handleSubmitNotification = async () => {
          if (!notificationData.message.trim()) {
               await Swal.fire({
                    icon: "warning",
                    title: "Thiếu thông tin",
                    text: "Vui lòng nhập nội dung thông báo"
               });
               return;
          }

          try {
               setLoading(true);
               const recipientId = parseInt(selectedRecipientId);

               if (recipientId === 0) {
                    // Gửi hàng loạt cho tất cả người dùng hiện tại
                    const usersToSend = selectedUsersForNotification.length > 0
                         ? selectedUsersForNotification
                         : filteredUsers;

                    const notifications = usersToSend.map(user => ({
                         userId: user.id,
                         type: notificationData.type,
                         targetId: 0,
                         message: notificationData.message
                    }));

                    const result = await createBulkNotifications(notifications);

                    if (result.ok) {
                         await Swal.fire({
                              icon: "success",
                              title: "Thành công",
                              text: `Gửi thông báo thành công cho ${usersToSend.length} người dùng!`
                         });
                         setShowNotificationModal(false);
                         setNotificationData({ type: "System", message: "" });
                         setSelectedRecipientId("0");
                    } else {
                         await Swal.fire({
                              icon: "error",
                              title: "Lỗi",
                              text: result.reason || "Không thể gửi thông báo hàng loạt"
                         });
                    }
               } else {
                    // Gửi cho 1 người cụ thể
                    const result = await createNotification({
                         userId: recipientId,
                         type: notificationData.type,
                         targetId: 0,
                         message: notificationData.message
                    });

                    if (result.ok) {
                         const recipient = users.find(u => u.id === recipientId);
                         await Swal.fire({
                              icon: "success",
                              title: "Thành công",
                              text: `Gửi thông báo thành công cho ${recipient?.fullName || 'người dùng'}!`
                         });
                         setShowNotificationModal(false);
                         setNotificationData({ type: "System", message: "" });
                         setSelectedRecipientId("0");
                    } else {
                         await Swal.fire({
                              icon: "error",
                              title: "Lỗi",
                              text: result.reason || "Không thể gửi thông báo"
                         });
                    }
               }
          } catch (err) {
               console.error("Error sending notification:", err);
               await Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Đã xảy ra lỗi khi gửi thông báo"
               });
          } finally {
               setLoading(false);
          }
     };

     const getRoleBadgeVariant = (role) => {
          switch (role) {
               case "Admin":
                    return "destructive";
               case "Owner":
                    return "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200";
               case "Player":
                    return "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200";
               default:
                    return "default";
          }
     };

     const getStatusBadgeVariant = (status) => {
          switch (status) {
               case "Active":
                    return "success";
               case "Locked":
                    return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200";
               case "Inactive":
                    return "secondary";
               default:
                    return "outline";
          }
     };

     const getStatusBadgeClassName = (status) => {
          if (status === "Active") {
               return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";
          }
          return "";
     };

     const columns = [
          {
               key: "user",
               label: "Người dùng",
               render: (user) => (
                    <div className="flex items-center space-x-3">
                         <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-gradient-to-br from-slate-400 to-slate-600 text-white">
                                   {user.fullName.charAt(0)}
                              </AvatarFallback>
                         </Avatar>
                         <div>
                              <p className="font-medium text-slate-900">{user.fullName}</p>
                              <p className="text-sm text-slate-500">{user.email}</p>
                         </div>
                    </div>
               )
          },
          {
               key: "role",
               label: "Vai trò",
               render: (user) => (
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                         {user.role}
                    </Badge>
               )
          },
          {
               key: "status",
               label: "Trạng thái",
               render: (user) => (
                    <Badge
                         variant={getStatusBadgeVariant(user.status)}
                         className={getStatusBadgeClassName(user.status)}
                    >
                         {user.status}
                    </Badge>
               )
          },
          {
               key: "phone",
               label: "Số điện thoại",
               render: (user) => (
                    <div className="flex items-center space-x-2">
                         <Phone className="w-4 h-4 text-slate-400" />
                         <span className="text-sm text-slate-600">{user.phone}</span>
                    </div>
               )
          },
          {
               key: "createdAt",
               label: "Ngày tạo",
               render: (user) => (
                    <div className="flex items-center space-x-2">
                         <Calendar className="w-4 h-4 text-slate-400" />
                         <span className="text-sm text-slate-600">{user.createdAt}</span>
                    </div>
               )
          },
          {
               key: "actions",
               label: "Thao tác",
               render: (user) => (
                    <div className="flex items-center space-x-2">
                         <Button
                              onClick={() => handleViewUser(user)}
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              title="Xem chi tiết"
                         >
                              <Eye className="w-4 h-4" />
                         </Button>
                         <Button
                              onClick={() => handleSendNotification(user)}
                              variant="ghost"
                              size="sm"
                              className="text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                              title="Gửi thông báo"
                         >
                              <Bell className="w-4 h-4" />
                         </Button>
                         <Button
                              onClick={() => handleEditUser(user)}
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-800 hover:bg-green-50"
                              title="Chỉnh sửa"
                         >
                              <Edit className="w-4 h-4" />
                         </Button>
                         <Button
                              onClick={() => handleDeleteUser(user)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              title="Xóa"
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
                                   Quản lý người dùng
                              </h1>
                              <p className="text-slate-600 mt-2 font-medium">
                                   Quản lý tài khoản người dùng, chủ sân và phân quyền
                              </p>
                         </div>
                         <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                              <Users className="w-8 h-8 text-white" />
                         </div>
                    </div>
               </div>

               {/* Filters */}
               <Card className="rounded-2xl shadow-lg">
                    <CardHeader>
                         <CardTitle className="flex items-center space-x-2">
                              <Filter className="w-5 h-5" />
                              <span>Bộ lọc</span>
                         </CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
                              <div className="flex-1">
                                   <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <Input
                                             placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
                                             value={searchTerm}
                                             onChange={(e) => setSearchTerm(e.target.value)}
                                             className="pl-10"
                                        />
                                   </div>
                              </div>
                              <div className="flex space-x-4">
                                   <Select value={roleFilter} onValueChange={setRoleFilter}>
                                        <SelectTrigger className="w-40">
                                             <SelectValue placeholder="Tất cả vai trò" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="all">Tất cả vai trò</SelectItem>
                                             <SelectItem value="Admin">Admin</SelectItem>
                                             <SelectItem value="Owner">Chủ sân</SelectItem>
                                             <SelectItem value="Player">Người chơi</SelectItem>
                                        </SelectContent>
                                   </Select>
                                   <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-40">
                                             <SelectValue placeholder="Tất cả trạng thái" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                             <SelectItem value="Active">Hoạt động</SelectItem>
                                             <SelectItem value="Suspended">Tạm khóa</SelectItem>
                                             <SelectItem value="Inactive">Không hoạt động</SelectItem>
                                        </SelectContent>
                                   </Select>
                              </div>
                         </div>
                    </CardContent>
               </Card>

               {/* Stats */}
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="rounded-2xl shadow-lg">
                         <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                   <div>
                                        <p className="text-sm font-medium text-slate-600">Tổng người dùng</p>
                                        <p className="text-2xl font-bold text-slate-900">{users.length}</p>
                                   </div>
                                   <Users className="w-8 h-8 text-blue-600" />
                              </div>
                         </CardContent>
                    </Card>
                    <Card>
                         <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                   <div>
                                        <p className="text-sm font-medium text-slate-600">Chủ sân</p>
                                        <p className="text-2xl font-bold text-slate-900">
                                             {users.filter(u => u.role === "FieldOwner" || u.role === "Owner").length}
                                        </p>
                                   </div>
                                   <Shield className="w-8 h-8 text-green-600" />
                              </div>
                         </CardContent>
                    </Card>
                    <Card>
                         <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                   <div>
                                        <p className="text-sm font-medium text-slate-600">Người chơi</p>
                                        <p className="text-2xl font-bold text-slate-900">
                                             {users.filter(u => u.role === "Player").length}
                                        </p>
                                   </div>
                                   <UserCheck className="w-8 h-8 text-purple-600" />
                              </div>
                         </CardContent>
                    </Card>
                    <Card>
                         <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                   <div>
                                        <p className="text-sm font-medium text-slate-600">Tài khoản bị khóa</p>
                                        <p className="text-2xl font-bold text-slate-900">
                                             {users.filter(u => u.status === "Suspended").length}
                                        </p>
                                   </div>
                                   <UserX className="w-8 h-8 text-red-600" />
                              </div>
                         </CardContent>
                    </Card>
               </div>

               {/* Users Table */}
               <Card className="rounded-2xl shadow-lg">
                    <CardHeader>
                         <div className="flex items-center justify-between">
                              <CardTitle>
                                   Danh sách người dùng ({filteredUsers.length})
                              </CardTitle>
                              <div className="flex space-x-2">
                                   <Button
                                        onClick={handleOpenNotificationModal}
                                        variant="outline"
                                        className="border-orange-300 rounded-2xl text-orange-700 hover:bg-orange-50"
                                   >
                                        <Bell className="w-4 h-4 mr-2" />
                                        Tạo thông báo
                                   </Button>

                              </div>
                         </div>
                    </CardHeader>
                    <CardContent>
                         {loading ? (
                              <div className="flex items-center justify-center py-12">
                                   <div className="text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                                        <p className="text-slate-600">Đang tải dữ liệu...</p>
                                   </div>
                              </div>
                         ) : error ? (
                              <div className="flex items-center justify-center py-12">
                                   <div className="text-center">
                                        <div className="text-red-600 mb-4">
                                             <X className="w-12 h-12 mx-auto" />
                                        </div>
                                        <p className="text-slate-900 font-medium mb-2">Lỗi tải dữ liệu</p>
                                        <p className="text-slate-600 mb-4">{error}</p>
                                        <Button onClick={loadUsers} variant="outline">
                                             Thử lại
                                        </Button>
                                   </div>
                              </div>
                         ) : filteredUsers.length === 0 ? (
                              <div className="flex items-center justify-center py-12">
                                   <div className="text-center">
                                        <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                        <p className="text-slate-600">Không tìm thấy người dùng nào</p>
                                   </div>
                              </div>
                         ) : (
                              <Table className="w-full rounded-2xl shadow-lg border border-slate-200">
                                   <TableHeader>
                                        <TableRow>
                                             {columns.map((column) => (
                                                  <TableHead key={column.key}>{column.label}</TableHead>
                                             ))}
                                        </TableRow>
                                   </TableHeader>
                                   <TableBody>
                                        {filteredUsers.map((user) => (
                                             <TableRow key={user.id}>
                                                  {columns.map((column) => (
                                                       <TableCell key={column.key}>
                                                            {column.render(user)}
                                                       </TableCell>
                                                  ))}
                                             </TableRow>
                                        ))}
                                   </TableBody>
                              </Table>
                         )}
                    </CardContent>
               </Card>

               {/* Create User Modal */}
               {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                         <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                              <CardHeader>
                                   <div className="flex items-center justify-between">
                                        <CardTitle>Tạo người dùng mới</CardTitle>
                                        <Button
                                             onClick={() => setShowCreateModal(false)}
                                             variant="ghost"
                                             size="sm"
                                        >
                                             <X className="w-4 h-4" />
                                        </Button>
                                   </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                             <label className="block text-sm font-medium text-slate-700 mb-2">
                                                  Họ tên *
                                             </label>
                                             <Input
                                                  value={newUser.fullName}
                                                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                                                  placeholder="Nhập họ tên..."
                                             />
                                        </div>
                                        <div>
                                             <label className="block text-sm font-medium text-slate-700 mb-2">
                                                  Email *
                                             </label>
                                             <Input
                                                  type="email"
                                                  value={newUser.email}
                                                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                                  placeholder="Nhập email..."
                                             />
                                        </div>
                                        <div>
                                             <label className="block text-sm font-medium text-slate-700 mb-2">
                                                  Số điện thoại *
                                             </label>
                                             <Input
                                                  value={newUser.phone}
                                                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                                                  placeholder="Nhập số điện thoại..."
                                             />
                                        </div>
                                        <div>
                                             <label className="block text-sm font-medium text-slate-700 mb-2">
                                                  Vai trò
                                             </label>
                                             <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                                                  <SelectTrigger>
                                                       <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                       <SelectItem value="Player">Người chơi</SelectItem>
                                                       <SelectItem value="FieldOwner">Chủ sân</SelectItem>
                                                       <SelectItem value="Admin">Admin</SelectItem>
                                                  </SelectContent>
                                             </Select>
                                        </div>
                                        <div>
                                             <label className="block text-sm font-medium text-slate-700 mb-2">
                                                  Giới tính
                                             </label>
                                             <Select value={newUser.profile.gender} onValueChange={(value) => setNewUser({ ...newUser, profile: { ...newUser.profile, gender: value } })}>
                                                  <SelectTrigger>
                                                       <SelectValue placeholder="Chọn giới tính" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                       <SelectItem value="Nam">Nam</SelectItem>
                                                       <SelectItem value="Nữ">Nữ</SelectItem>
                                                       <SelectItem value="Khác">Khác</SelectItem>
                                                  </SelectContent>
                                             </Select>
                                        </div>
                                        <div>
                                             <label className="block text-sm font-medium text-slate-700 mb-2">
                                                  Trình độ
                                             </label>
                                             <Select value={newUser.profile.skillLevel} onValueChange={(value) => setNewUser({ ...newUser, profile: { ...newUser.profile, skillLevel: value } })}>
                                                  <SelectTrigger>
                                                       <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                       <SelectItem value="Beginner">Mới bắt đầu</SelectItem>
                                                       <SelectItem value="Intermediate">Trung bình</SelectItem>
                                                       <SelectItem value="Advanced">Nâng cao</SelectItem>
                                                  </SelectContent>
                                             </Select>
                                        </div>
                                   </div>
                                   <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                             Ngày sinh
                                        </label>
                                        <DatePicker
                                             value={newUser.profile.dateOfBirth}
                                             onChange={(date) => setNewUser({ ...newUser, profile: { ...newUser.profile, dateOfBirth: date } })}
                                        />
                                   </div>
                                   <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                             Địa chỉ
                                        </label>
                                        <Input
                                             value={newUser.profile.address}
                                             onChange={(e) => setNewUser({ ...newUser, profile: { ...newUser.profile, address: e.target.value } })}
                                             placeholder="Nhập địa chỉ..."
                                        />
                                   </div>
                                   <div className="flex space-x-3 pt-4 border-t border-slate-200">
                                        <Button
                                             onClick={handleCreateUser}
                                             className="flex-1"
                                             disabled={!newUser.fullName || !newUser.email || !newUser.phone}
                                        >
                                             Tạo người dùng
                                        </Button>
                                        <Button
                                             onClick={() => setShowCreateModal(false)}
                                             variant="outline"
                                             className="flex-1"
                                        >
                                             Hủy
                                        </Button>
                                   </div>
                              </CardContent>
                         </Card>
                    </div>
               )}

               {/* User Detail Modal */}
               <Modal
                    isOpen={showUserModal}
                    onClose={() => {
                         setShowUserModal(false);
                         setUserProfileDetails(null);
                    }}
                    title="Chi tiết người dùng"
                    size="2xl"
                    className="max-h-[90vh] scrollbar-hide"
               >
                    {selectedUser && (
                         <div className="space-y-6">
                              {loadingProfile ? (
                                   <div className="flex items-center justify-center py-8">
                                        <div className="text-center">
                                             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                                             <p className="text-slate-600 text-sm">Đang tải thông tin chi tiết...</p>
                                        </div>
                                   </div>
                              ) : (
                                   <>
                                        {/* User Info */}
                                        <div className="flex items-center space-x-4">
                                             <Avatar className="w-16 h-16">
                                                  {userProfileDetails?.avatar && (
                                                       <AvatarImage src={userProfileDetails.avatar} alt={selectedUser.fullName} />
                                                  )}
                                                  <AvatarFallback className="bg-gradient-to-br from-slate-400 to-slate-600 text-white text-xl">
                                                       {selectedUser.fullName.charAt(0)}
                                                  </AvatarFallback>
                                             </Avatar>
                                             <div>
                                                  <h4 className="text-lg font-bold text-slate-900">
                                                       {userProfileDetails?.fullName || selectedUser.fullName}
                                                  </h4>
                                                  <p className="text-slate-600">{userProfileDetails?.email || selectedUser.email}</p>
                                                  <div className="flex space-x-2 mt-2">
                                                       <Badge variant={getRoleBadgeVariant(selectedUser.role)}>
                                                            {selectedUser.role}
                                                       </Badge>
                                                       <Badge
                                                            variant={getStatusBadgeVariant(selectedUser.status)}
                                                            className={getStatusBadgeClassName(selectedUser.status)}
                                                       >
                                                            {selectedUser.status}
                                                       </Badge>
                                                  </div>
                                             </div>
                                        </div>

                                        {/* Contact Info */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                             <div className="flex items-center space-x-3">
                                                  <Phone className="w-5 h-5 text-slate-400" />
                                                  <div>
                                                       <p className="text-sm font-medium text-slate-600">Số điện thoại</p>
                                                       <p className="text-slate-900">{userProfileDetails?.phone || selectedUser.phone}</p>
                                                  </div>
                                             </div>
                                             <div className="flex items-center space-x-3">
                                                  <Calendar className="w-5 h-5 text-slate-400" />
                                                  <div>
                                                       <p className="text-sm font-medium text-slate-600">Ngày tạo</p>
                                                       <p className="text-slate-900">{selectedUser.createdAt}</p>
                                                  </div>
                                             </div>
                                        </div>

                                        {/* Profile Info from API */}
                                        {userProfileDetails && (
                                             <div>
                                                  <h5 className="text-lg font-bold text-slate-900 mb-3">Thông tin cá nhân</h5>
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                       {userProfileDetails.dateOfBirth && (
                                                            <div>
                                                                 <p className="text-sm font-medium text-slate-600">Ngày sinh</p>
                                                                 <p className="text-slate-900">
                                                                      {new Date(userProfileDetails.dateOfBirth).toLocaleDateString('vi-VN')}
                                                                 </p>
                                                            </div>
                                                       )}
                                                       {userProfileDetails.gender && (
                                                            <div>
                                                                 <p className="text-sm font-medium text-slate-600">Giới tính</p>
                                                                 <p className="text-slate-900">{userProfileDetails.gender}</p>
                                                            </div>
                                                       )}
                                                       {userProfileDetails.address && (
                                                            <div>
                                                                 <p className="text-sm font-medium text-slate-600">Địa chỉ</p>
                                                                 <p className="text-slate-900">{userProfileDetails.address}</p>
                                                            </div>
                                                       )}
                                                       {userProfileDetails.skillLevel && (
                                                            <div>
                                                                 <p className="text-sm font-medium text-slate-600">Trình độ</p>
                                                                 <p className="text-slate-900">{userProfileDetails.skillLevel}</p>
                                                            </div>
                                                       )}
                                                       {userProfileDetails.preferredPositions && (
                                                            <div>
                                                                 <p className="text-sm font-medium text-slate-600">Vị trí ưa thích</p>
                                                                 <p className="text-slate-900">{userProfileDetails.preferredPositions}</p>
                                                            </div>
                                                       )}
                                                  </div>
                                             </div>
                                        )}

                                        {/* Fallback to basic profile if API didn't return details */}
                                        {!userProfileDetails && selectedUser.profile && (
                                             <div>
                                                  <h5 className="text-lg font-bold text-slate-900 mb-3">Thông tin cá nhân</h5>
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                       <div>
                                                            <p className="text-sm font-medium text-slate-600">Ngày sinh</p>
                                                            <p className="text-slate-900">{selectedUser.profile.dateOfBirth}</p>
                                                       </div>
                                                       <div>
                                                            <p className="text-sm font-medium text-slate-600">Giới tính</p>
                                                            <p className="text-slate-900">{selectedUser.profile.gender}</p>
                                                       </div>
                                                       <div>
                                                            <p className="text-sm font-medium text-slate-600">Địa chỉ</p>
                                                            <p className="text-slate-900">{selectedUser.profile.address}</p>
                                                       </div>
                                                       <div>
                                                            <p className="text-sm font-medium text-slate-600">Trình độ</p>
                                                            <p className="text-slate-900">{selectedUser.profile.skillLevel}</p>
                                                       </div>
                                                  </div>
                                             </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex space-x-3 pt-4 border-t border-slate-200">
                                             {checkIsAdmin() && (
                                                  <Button
                                                       onClick={() => handleLockAccount(selectedUser)}
                                                       variant={selectedUser.status === "Active" ? "destructive" : "default"}
                                                       className="flex-1 rounded-2xl"
                                                       disabled={loading}
                                                  >
                                                       {loading ? (
                                                            <>
                                                                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                                 Đang xử lý...
                                                            </>
                                                       ) : (
                                                            selectedUser.status === "Active" ? "Khóa tài khoản" : "Mở khóa tài khoản"
                                                       )}
                                                  </Button>
                                             )}
                                             <Button
                                                  onClick={() => {
                                                       setShowUserModal(false);
                                                       handleEditUser(selectedUser);
                                                  }}
                                                  variant="outline"
                                                  className="flex-1 rounded-2xl"
                                             >
                                                  Chỉnh sửa
                                             </Button>
                                        </div>
                                   </>
                              )}
                         </div>
                    )}
               </Modal>

               {/* Notification Modal */}
               {showNotificationModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                         <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                              <CardHeader className="border-b border-slate-200">
                                   <div className="flex items-center justify-between">
                                        <CardTitle className="text-xl font-bold">Tạo thông báo mới</CardTitle>
                                        <Button
                                             onClick={() => {
                                                  setShowNotificationModal(false);
                                                  setNotificationData({ type: "System", message: "" });
                                             }}
                                             variant="ghost"
                                             size="sm"
                                        >
                                             <X className="w-5 h-5" />
                                        </Button>
                                   </div>
                              </CardHeader>
                              <CardContent className="space-y-5 pt-6">
                                   {/* Thông tin API */}
                                   <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-start space-x-2">
                                             <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                                             <div className="flex-1">
                                                  <p className="font-semibold text-blue-900 mb-1">Thông tin API</p>
                                                  <p className="text-sm text-blue-700">
                                                       Thông báo sẽ được gửi theo format: userId, type, targetId, message
                                                  </p>
                                             </div>
                                        </div>
                                   </div>

                                   {/* Nội dung thông báo */}
                                   <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                             Nội dung thông báo <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                             value={notificationData.message}
                                             onChange={(e) =>
                                                  setNotificationData({ ...notificationData, message: e.target.value })
                                             }
                                             placeholder="Nhập nội dung thông báo... (Ví dụ: Bạn có đặt sân mới, Hệ thống sẽ bảo trì từ 2:00-4:00, ...)"
                                             className="w-full min-h-[120px] px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">0 ký tự</p>
                                   </div>

                                   {/* Loại thông báo */}
                                   <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                             Loại thông báo <span className="text-red-500">*</span>
                                        </label>
                                        <Select
                                             value={notificationData.type}
                                             onValueChange={(value) =>
                                                  setNotificationData({ ...notificationData, type: value })
                                             }
                                        >
                                             <SelectTrigger className="w-full">
                                                  <SelectValue />
                                             </SelectTrigger>
                                             <SelectContent>
                                                  <SelectItem value="System">
                                                       <div className="flex items-center space-x-2">
                                                            <span>📢</span>
                                                            <span>System - Thông báo hệ thống</span>
                                                       </div>
                                                  </SelectItem>
                                                  <SelectItem value="NewComment">
                                                       <div className="flex items-center space-x-2">
                                                            <span>💬</span>
                                                            <span>NewComment - Bình luận mới</span>
                                                       </div>
                                                  </SelectItem>
                                                  <SelectItem value="Reply">
                                                       <div className="flex items-center space-x-2">
                                                            <span>↩️</span>
                                                            <span>Reply - Trả lời</span>
                                                       </div>
                                                  </SelectItem>
                                                  <SelectItem value="Mention">
                                                       <div className="flex items-center space-x-2">
                                                            <span>@</span>
                                                            <span>Mention - Nhắc đến</span>
                                                       </div>
                                                  </SelectItem>
                                                  <SelectItem value="Like">
                                                       <div className="flex items-center space-x-2">
                                                            <span>❤️</span>
                                                            <span>Like - Thích</span>
                                                       </div>
                                                  </SelectItem>
                                                  <SelectItem value="ReportResult">
                                                       <div className="flex items-center space-x-2">
                                                            <span>⚠️</span>
                                                            <span>ReportResult - Kết quả báo cáo</span>
                                                       </div>
                                                  </SelectItem>
                                             </SelectContent>
                                        </Select>
                                        <p className="text-xs text-slate-500 mt-1">
                                             Loại thông báo xác định cách hiển thị và xử lý
                                        </p>
                                   </div>

                                   {/* User ID */}
                                   <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                             User ID (Người nhận)
                                        </label>
                                        <Select
                                             value={selectedRecipientId}
                                             onValueChange={setSelectedRecipientId}
                                        >
                                             <SelectTrigger className="w-full">
                                                  <SelectValue />
                                             </SelectTrigger>
                                             <SelectContent className="max-h-[300px]">
                                                  <SelectItem value="0">
                                                       <div className="flex items-center space-x-2">
                                                            <Users className="w-4 h-4 text-blue-600" />
                                                            <span className="font-medium">0 = Gửi cho tất cả ({filteredUsers.length} người)</span>
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
                                                                 <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                                                                      {user.role}
                                                                 </Badge>
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
                                             value="0"
                                             disabled
                                             placeholder="0 = Không áp dụng, >0 = ID của booking/post/comment liên quan"
                                             className="bg-slate-50"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">
                                             ID của đối tượng liên quan (ví dụ: Booking ID, Post ID, Comment ID)
                                        </p>
                                   </div>

                                   {/* Buttons */}
                                   <div className="flex space-x-3 pt-4 border-t border-slate-200">
                                        <Button
                                             onClick={handleSubmitNotification}
                                             className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
                                             disabled={loading || !notificationData.message.trim()}
                                        >
                                             {loading ? (
                                                  <>
                                                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                       Đang gửi...
                                                  </>
                                             ) : (
                                                  <>
                                                       <Send className="w-4 h-4 mr-2" />
                                                       Gửi thông báo
                                                  </>
                                             )}
                                        </Button>
                                        <Button
                                             onClick={() => {
                                                  setShowNotificationModal(false);
                                                  setNotificationData({ type: "System", message: "" });
                                             }}
                                             variant="outline"
                                             className="flex-1"
                                             disabled={loading}
                                        >
                                             Hủy
                                        </Button>
                                   </div>
                              </CardContent>
                         </Card>
                    </div>
               )}
          </div>
     );
}
