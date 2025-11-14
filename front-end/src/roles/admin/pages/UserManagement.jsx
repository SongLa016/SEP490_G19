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
     Table,
     Badge,
     Avatar,
     AvatarFallback,
     DatePicker,
     Modal
} from "../../../shared/components/ui";
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
     Plus
} from "lucide-react";

export default function UserManagement() {
     const [users, setUsers] = useState([]);
     const [filteredUsers, setFilteredUsers] = useState([]);
     const [searchTerm, setSearchTerm] = useState("");
     const [roleFilter, setRoleFilter] = useState("all");
     const [statusFilter, setStatusFilter] = useState("all");
     const [selectedUser, setSelectedUser] = useState(null);
     const [showUserModal, setShowUserModal] = useState(false);
     const [showCreateModal, setShowCreateModal] = useState(false);
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
          // Mock data - trong thực tế sẽ gọi API
          const mockUsers = [
               {
                    id: 1,
                    email: "user1@example.com",
                    fullName: "Nguyễn Văn A",
                    phone: "0123456789",
                    role: "Player",
                    status: "Active",
                    createdAt: "2024-01-15",
                    lastLogin: "2024-01-20",
                    avatar: null,
                    profile: {
                         dateOfBirth: "1990-05-15",
                         gender: "Nam",
                         address: "Hà Nội",
                         skillLevel: "Intermediate"
                    }
               },
               {
                    id: 2,
                    email: "owner1@example.com",
                    fullName: "Trần Thị B",
                    phone: "0987654321",
                    role: "FieldOwner",
                    status: "Active",
                    createdAt: "2024-01-10",
                    lastLogin: "2024-01-19",
                    avatar: null,
                    profile: {
                         dateOfBirth: "1985-03-20",
                         gender: "Nữ",
                         address: "TP.HCM",
                         skillLevel: "Advanced"
                    }
               },
               {
                    id: 3,
                    email: "admin@example.com",
                    fullName: "Lê Văn C",
                    phone: "0369258147",
                    role: "Admin",
                    status: "Active",
                    createdAt: "2024-01-01",
                    lastLogin: "2024-01-20",
                    avatar: null,
                    profile: {
                         dateOfBirth: "1980-12-10",
                         gender: "Nam",
                         address: "Đà Nẵng",
                         skillLevel: "Advanced"
                    }
               },
               {
                    id: 4,
                    email: "user2@example.com",
                    fullName: "Phạm Thị D",
                    phone: "0147258369",
                    role: "Player",
                    status: "Suspended",
                    createdAt: "2024-01-12",
                    lastLogin: "2024-01-18",
                    avatar: null,
                    profile: {
                         dateOfBirth: "1992-08-25",
                         gender: "Nữ",
                         address: "Cần Thơ",
                         skillLevel: "Beginner"
                    }
               }
          ];

          setUsers(mockUsers);
          setFilteredUsers(mockUsers);
     }, []);

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
               filtered = filtered.filter(user => user.role === roleFilter);
          }

          // Filter by status
          if (statusFilter !== "all") {
               filtered = filtered.filter(user => user.status === statusFilter);
          }

          setFilteredUsers(filtered);
     }, [users, searchTerm, roleFilter, statusFilter]);

     const handleViewUser = (user) => {
          setSelectedUser(user);
          setShowUserModal(true);
     };

     const handleEditUser = (user) => {
          setSelectedUser(user);
          // Implement edit functionality
          console.log("Edit user:", user);
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

     const handleDeleteUser = (user) => {
          if (window.confirm(`Bạn có chắc chắn muốn xóa người dùng ${user.fullName}?`)) {
               setUsers(users.filter(u => u.id !== user.id));
          }
     };

     const handleStatusChange = (user, newStatus) => {
          setUsers(users.map(u =>
               u.id === user.id ? { ...u, status: newStatus } : u
          ));
     };

     const getRoleBadgeVariant = (role) => {
          switch (role) {
               case "Admin":
                    return "destructive";
               case "FieldOwner":
                    return "default";
               case "Player":
                    return "secondary";
               default:
                    return "outline";
          }
     };

     const getStatusBadgeVariant = (status) => {
          switch (status) {
               case "Active":
                    return "default";
               case "Suspended":
                    return "destructive";
               case "Inactive":
                    return "secondary";
               default:
                    return "outline";
          }
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
                    <Badge variant={getStatusBadgeVariant(user.status)}>
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
                         >
                              <Eye className="w-4 h-4" />
                         </Button>
                         <Button
                              onClick={() => handleEditUser(user)}
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-800 hover:bg-green-50"
                         >
                              <Edit className="w-4 h-4" />
                         </Button>
                         <Button
                              onClick={() => handleDeleteUser(user)}
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
                                             <SelectItem value="FieldOwner">Chủ sân</SelectItem>
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
                                             {users.filter(u => u.role === "FieldOwner").length}
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
                              <Button onClick={() => setShowCreateModal(true)}>
                                   <Plus className="w-4 h-4 mr-2" />
                                   Thêm người dùng
                              </Button>
                         </div>
                    </CardHeader>
                    <CardContent>
                         <Table
                              data={filteredUsers}
                              columns={columns}
                              className="w-full"
                         />
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
                    onClose={() => setShowUserModal(false)}
                    title="Chi tiết người dùng"
                    size="2xl"
                    className="max-h-[90vh] scrollbar-hide"
               >
                    {selectedUser && (
                         <div className="space-y-6">
                              {/* User Info */}
                              <div className="flex items-center space-x-4">
                                   <Avatar className="w-16 h-16">
                                        <AvatarFallback className="bg-gradient-to-br from-slate-400 to-slate-600 text-white text-xl">
                                             {selectedUser.fullName.charAt(0)}
                                        </AvatarFallback>
                                   </Avatar>
                                   <div>
                                        <h4 className="text-lg font-bold text-slate-900">{selectedUser.fullName}</h4>
                                        <p className="text-slate-600">{selectedUser.email}</p>
                                        <div className="flex space-x-2 mt-2">
                                             <Badge variant={getRoleBadgeVariant(selectedUser.role)}>
                                                  {selectedUser.role}
                                             </Badge>
                                             <Badge variant={getStatusBadgeVariant(selectedUser.status)}>
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
                                             <p className="text-slate-900">{selectedUser.phone}</p>
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

                              {/* Profile Info */}
                              {selectedUser.profile && (
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
                                   <Button
                                        onClick={() => handleStatusChange(selectedUser, selectedUser.status === "Active" ? "Suspended" : "Active")}
                                        variant={selectedUser.status === "Active" ? "destructive" : "default"}
                                        className="flex-1 rounded-2xl"
                                   >
                                        {selectedUser.status === "Active" ? "Tạm khóa" : "Kích hoạt"}
                                   </Button>
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
                         </div>
                    )}
               </Modal>
          </div>
     );
}
