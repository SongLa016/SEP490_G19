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
     Shield,
     UserCheck,
     UserX,
     Eye,
     Phone,
     Calendar,
     Users,
     X,
     Bell,
     Send,
     Lock,
     Unlock
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
     const [loading, setLoading] = useState(false);
     const [loadingProfile, setLoadingProfile] = useState(false);
     const [error, setError] = useState(null);
     const [ownerProfile, setOwnerProfile] = useState(null);
     const [ownerLoading, setOwnerLoading] = useState(false);

     useEffect(() => {
          loadUsers();
          fetchOwnerProfile();
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
                    const transformedUsers = await Promise.all(
                         usersData.map(async (user) => {
                              // Fetch status và createdAt từ PlayerProfile API cho mỗi user
                              let userStatus = user.status || "Active";
                              let userCreatedAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : "N/A";
                              let avatarUrl = user.avatar || user.profile?.avatar || user.profile?.avatarUrl || null;

                              try {
                                   const profileResult = await fetchPlayerProfile(user.userId);
                                   if (profileResult.ok && profileResult.data) {
                                        // Lấy status từ PlayerProfile
                                        if (profileResult.data.status) {
                                             userStatus = profileResult.data.status;
                                        }
                                        // Lấy createdAt từ PlayerProfile (chính xác hơn)
                                        if (profileResult.data.createdAt) {
                                             userCreatedAt = new Date(profileResult.data.createdAt).toLocaleDateString('vi-VN', {
                                                  year: 'numeric',
                                                  month: '2-digit',
                                                  day: '2-digit'
                                             });
                                        }
                                        // Avatar từ PlayerProfile (ưu tiên Cloudinary URL)
                                        avatarUrl =
                                             profileResult.data.avatar ||
                                             profileResult.data.avatarUrl ||
                                             profileResult.data.imageUrl ||
                                             avatarUrl;
                                   }
                              } catch (err) {
                                   // Nếu không fetch được, dùng dữ liệu từ fetchAllUserStatistics
                                   console.warn(`Could not fetch profile for user ${user.userId}:`, err);
                              }

                              return {
                                   id: user.userId,
                                   email: user.email,
                                   fullName: user.fullName,
                                   phone: user.phone || "N/A",
                                   role: user.roleName,
                                   status: userStatus,
                                   createdAt: userCreatedAt,
                                   lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('vi-VN') : "N/A",
                                   avatar: avatarUrl,
                                   profile: {
                                        dateOfBirth: user.dateOfBirth || user.profile?.dateOfBirth || "N/A",
                                        gender: user.gender || user.profile?.gender || "N/A",
                                        address: user.address || user.profile?.address || "N/A",
                                        skillLevel: user.skillLevel || user.profile?.skillLevel || "N/A"
                                   }
                              };
                         })
                    );

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

     const fetchOwnerProfile = async () => {
          setOwnerLoading(true);
          try {
               const res = await fetch('http://localhost:8080/api/PlayerProfile/3');
               if (!res.ok) throw new Error(`HTTP ${res.status}`);
               const data = await res.json();
               setOwnerProfile(data);
          } catch (err) {
               console.error('Failed to fetch owner profile:', err);
          } finally {
               setOwnerLoading(false);
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
                    const profileData = result.data;
                    setUserProfileDetails(profileData);
                    // Cập nhật status từ API PlayerProfile vào selectedUser
                    if (profileData.status) {
                         setSelectedUser({
                              ...user,
                              status: profileData.status
                         });
                    }
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

          // Xác định status hiện tại - ưu tiên lấy từ userProfileDetails nếu có
          const currentStatus = ownerProfile?.status || userProfileDetails?.status || targetUser.status || "Active";
          const isActive = currentStatus === "Active";
          const actionText = isActive ? "khóa" : "mở khóa";

          const result = await Swal.fire({
               title: "Xác nhận",
               text: `Bạn có chắc chắn muốn ${actionText} tài khoản ${targetUser.fullName}?`,
               icon: "question",
               showCancelButton: true,
               confirmButtonColor: isActive ? "#d33" : "#3085d6",
               cancelButtonColor: "#6c757d",
               confirmButtonText: "Xác nhận",
               cancelButtonText: "Hủy"
          });

          if (!result.isConfirmed) {
               return;
          }

          try {
               setLoading(true);
               const lockResult = await lockUserAccount(targetUser.id);
               if (lockResult.ok) {
                    // Fetch lại PlayerProfile để lấy status mới nhất từ API
                    const profileResult = await fetchPlayerProfile(targetUser.id);
                    let newStatus = isActive ? "Locked" : "Active";

                    if (profileResult.ok && profileResult.data?.status) {
                         newStatus = profileResult.data.status;
                    }

                    // Cập nhật status trong danh sách users
                    setUsers(prevUsers =>
                         prevUsers.map(u =>
                              u.id === targetUser.id
                                   ? { ...u, status: newStatus }
                                   : u
                         )
                    );
                    setFilteredUsers(prevUsers =>
                         prevUsers.map(u =>
                              u.id === targetUser.id
                                   ? { ...u, status: newStatus }
                                   : u
                         )
                    );

                    // Cập nhật selectedUser nếu modal đang mở
                    if (selectedUser && selectedUser.id === targetUser.id) {
                         if (profileResult.ok && profileResult.data) {
                              const updatedProfile = profileResult.data;
                              setUserProfileDetails(updatedProfile);
                              setSelectedUser({
                                   ...selectedUser,
                                   status: newStatus
                              });
                         } else {
                              setSelectedUser({
                                   ...selectedUser,
                                   status: newStatus
                              });
                         }
                    }

                    await Swal.fire({
                         icon: "success",
                         title: "Thành công",
                         text: `Đã ${actionText} tài khoản thành công!`,
                         timer: 2000,
                         timerProgressBar: true
                    });
               } else {
                    await Swal.fire({
                         icon: "error",
                         title: "Lỗi",
                         text: lockResult.reason || "Không thể thực hiện thao tác này"
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

     const getRoleBadgeVariant = (role) => {
          switch (role) {
               case "Admin":
                    return "destructive";
               case "Owner":
               case "FieldOwner":
                    return "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200";
               case "Player":
                    return "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200";
               default:
                    return "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200";
          }
     };

     const getStatusBadgeVariant = (status) => {
          switch (status) {
               case "Active":
                    return "success";
               case "Locked":
               case "Suspended":
                    return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200";
               case "Inactive":
                    return "secondary";
               default:
                    return "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200";
          }
     };

     const getStatusBadgeClassName = (status) => {
          if (status === "Active") {
               return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";
          }
          if (status === "Locked" || status === "Suspended") {
               return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200";
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
                              {user.avatar && (
                                   <AvatarImage
                                        src={user.avatar}
                                        alt={user.fullName}
                                        onError={(e) => {
                                             e.currentTarget.style.display = "none";
                                        }}
                                   />
                              )}
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
               render: (user) => {
                    const variant = getRoleBadgeVariant(user.role);
                    const isCustomClass = variant.includes("bg-");
                    return (
                         <Badge
                              variant={isCustomClass ? "outline" : variant}
                              className={isCustomClass ? variant : ""}
                         >
                              {user.role}
                         </Badge>
                    );
               }
          },
          {
               key: "status",
               label: "Trạng thái",
               render: (user) => {
                    const variant = getStatusBadgeVariant(user.status);
                    const className = getStatusBadgeClassName(user.status);
                    const isCustomClass = variant.includes("bg-");
                    return (
                         <Badge
                              variant={isCustomClass ? "outline" : variant}
                              className={isCustomClass ? variant : className}
                         >
                              {user.status}
                         </Badge>
                    );
               }
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
               render: (user) => {
                    const isActive = user.status === "Active";
                    return (
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

                              {checkIsAdmin() && (
                                   <Button
                                        onClick={() => handleLockAccount(user)}
                                        variant="ghost"
                                        size="sm"
                                        className={isActive
                                             ? "text-red-600 hover:text-red-800 hover:bg-red-50"
                                             : "text-green-600 hover:text-green-800 hover:bg-green-50"}
                                        title={isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                                        disabled={loading}
                                   >
                                        {isActive ? (
                                             <Lock className="w-4 h-4" />
                                        ) : (
                                             <Unlock className="w-4 h-4" />
                                        )}
                                   </Button>
                              )}
                         </div>
                    );
               }
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
                                                       {(() => {
                                                            const roleVariant = getRoleBadgeVariant(selectedUser.role);
                                                            const isRoleCustomClass = roleVariant.includes("bg-");
                                                            return (
                                                                 <Badge
                                                                      variant={isRoleCustomClass ? "outline" : roleVariant}
                                                                      className={isRoleCustomClass ? roleVariant : ""}
                                                                 >
                                                                      {selectedUser.role}
                                                                 </Badge>
                                                            );
                                                       })()}
                                                       {(() => {
                                                            const status = userProfileDetails?.status || selectedUser.status;
                                                            const statusVariant = getStatusBadgeVariant(status);
                                                            const statusClassName = getStatusBadgeClassName(status);
                                                            const isStatusCustomClass = statusVariant.includes("bg-");
                                                            return (
                                                                 <Badge
                                                                      variant={isStatusCustomClass ? "outline" : statusVariant}
                                                                      className={isStatusCustomClass ? statusVariant : statusClassName}
                                                                 >
                                                                      {status}
                                                                 </Badge>
                                                            );
                                                       })()}
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
                                        </div>

                                        {/* Profile Info from API */}
                                        {userProfileDetails && (
                                             <div>
                                                  <h5 className="text-lg font-bold text-slate-900 mb-3">Thông tin cá nhân</h5>
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                       {/* Status từ API PlayerProfile */}
                                                       {userProfileDetails.status && (
                                                            <div>
                                                                 <p className="text-sm font-medium text-slate-600">Trạng thái tài khoản</p>
                                                                 <div className="mt-1">
                                                                      {(() => {
                                                                           const statusVariant = getStatusBadgeVariant(userProfileDetails.status);
                                                                           const statusClassName = getStatusBadgeClassName(userProfileDetails.status);
                                                                           const isCustomClass = statusVariant.includes("bg-");
                                                                           return (
                                                                                <Badge
                                                                                     variant={isCustomClass ? "outline" : statusVariant}
                                                                                     className={isCustomClass ? statusVariant : statusClassName}
                                                                                >
                                                                                     {userProfileDetails.status}
                                                                                </Badge>
                                                                           );
                                                                      })()}
                                                                 </div>
                                                            </div>
                                                       )}
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
                                                       {userProfileDetails.createdAt && (
                                                            <div>
                                                                 <p className="text-sm font-medium text-slate-600">Ngày tạo tài khoản</p>
                                                                 <p className="text-slate-900">
                                                                      {new Date(userProfileDetails.createdAt).toLocaleDateString('vi-VN', {
                                                                           year: 'numeric',
                                                                           month: '2-digit',
                                                                           day: '2-digit',
                                                                           hour: '2-digit',
                                                                           minute: '2-digit'
                                                                      })}
                                                                 </p>
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
                                             {checkIsAdmin() && (() => {
                                                  const currentStatus = ownerProfile?.status || userProfileDetails?.status || selectedUser.status || "Active";
                                                  const isActive = currentStatus === "Active";
                                                  return (
                                                       <Button
                                                            onClick={() => handleLockAccount(selectedUser)}
                                                            variant={isActive ? "destructive" : "default"}
                                                            className="flex-1 rounded-2xl"
                                                            disabled={loading}
                                                       >
                                                            {loading ? (
                                                                 <>
                                                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                                      Đang xử lý...
                                                                 </>
                                                            ) : (
                                                                 isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"
                                                            )}
                                                       </Button>
                                                  );
                                             })()}
                                        </div>
                                   </>
                              )}
                         </div>
                    )}
               </Modal>

          </div>
     );
}
