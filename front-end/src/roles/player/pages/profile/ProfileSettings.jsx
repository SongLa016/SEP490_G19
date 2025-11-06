import { useState } from "react";
import { Settings, Shield, Bell, Trash2, AlertTriangle, Phone, Mail, User, Calendar, CheckCircle, AlertCircle, Clock, Activity, Database, Key, Eye } from "lucide-react";
import { Container, Card, CardContent, CardHeader, CardTitle, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../shared/components/ui";
import ErrorDisplay from "../../../../shared/components/ErrorDisplay";

export default function ProfileSettings({ user }) {
     const [activeTab, setActiveTab] = useState("account");
     const [error, setError] = useState('');
     const [info, setInfo] = useState('');
     const [passwordData, setPasswordData] = useState({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
     });
     const [notificationSettings, setNotificationSettings] = useState({
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
          bookingReminders: true,
          promotionalEmails: false
     });
     const [accountInfo, setAccountInfo] = useState({
          email: user?.email || "",
          phone: user?.phone || "",
          fullName: user?.fullName || "",
          roleName: user?.roleName || "Player",
          emailVerified: user?.emailVerified || true,
          createdAt: user?.createdAt || new Date().toISOString()
     });

     const tabs = [
          { id: "account", label: "Tài khoản", icon: Settings },
          { id: "security", label: "Bảo mật", icon: Shield },
          { id: "notifications", label: "Thông báo", icon: Bell },
          { id: "privacy", label: "Quyền riêng tư", icon: Shield }
     ];

     const handlePasswordChange = (field, value) => {
          setPasswordData(prev => ({
               ...prev,
               [field]: value
          }));
     };

     const handleNotificationChange = (field, value) => {
          setNotificationSettings(prev => ({
               ...prev,
               [field]: value
          }));
     };

     const handleChangePassword = () => {
          if (passwordData.newPassword !== passwordData.confirmPassword) {
               alert("Mật khẩu mới không khớp!");
               return;
          }
          // API call to change password
          console.log("Changing password...");
          setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
     };

     const handleDeleteAccount = () => {
          if (window.confirm("Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác!")) {
               // API call to delete account
               console.log("Deleting account...");
          }
     };

     const renderAccountSettings = () => (
          <div className="space-y-6">
               <Card className="rounded-2xl border border-teal-300">
                    <CardHeader>
                         <CardTitle className="flex items-center">
                              <User className="w-5 h-5 mr-2 text-teal-600" />
                              Thông tin tài khoản
                         </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                   <label className="gap-2 text-sm flex font-medium text-gray-700 mb-1.5">
                                        <Mail size={20} />  Email đăng nhập
                                   </label>
                                   <div className="relative">
                                        <Input value={accountInfo.email} disabled className="rounded-xl pr-20" />
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                             <div className={`flex items-center px-2 py-1 rounded-lg text-xs font-medium ${accountInfo.emailVerified
                                                  ? 'bg-green-100 text-green-700 border border-green-200'
                                                  : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                                  }`}>
                                                  {accountInfo.emailVerified ? (
                                                       <>
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            Đã xác thực
                                                       </>
                                                  ) : (
                                                       <>
                                                            <AlertCircle className="w-3 h-3 mr-1" />
                                                            Chưa xác thực
                                                       </>
                                                  )}
                                             </div>
                                        </div>
                                   </div>
                                   <p className="text-xs text-gray-500 ml-3 mt-1">Email không thể thay đổi</p>
                              </div>
                              <div>
                                   <label className="flex gap-2 text-sm font-medium text-gray-700 mb-1.5">
                                        <Phone size={20} />Số điện thoại
                                   </label>
                                   <Input value={accountInfo.phone || "Chưa cập nhật"} disabled className="rounded-xl" />
                                   <p className="text-xs text-gray-500 ml-3 mt-1">Cập nhật trong trang Profile</p>
                              </div>
                         </div>
                         <div>
                              <label className="flex gap-2 text-sm font-medium text-gray-700 mb-1.5">
                                   <Calendar size={20} />Ngày tạo tài khoản
                              </label>
                              <Input value={new Date(accountInfo.createdAt).toLocaleDateString('vi-VN')} disabled className="rounded-xl" />
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ngôn ngữ hiển thị
                                   </label>
                                   <Select defaultValue="vi">
                                        <SelectTrigger className="rounded-xl">
                                             <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="vi">Tiếng Việt</SelectItem>
                                             <SelectItem value="en">English</SelectItem>
                                        </SelectContent>
                                   </Select>
                              </div>
                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Múi giờ
                                   </label>
                                   <Select defaultValue="Asia/Ho_Chi_Minh">
                                        <SelectTrigger className="rounded-xl">
                                             <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="Asia/Ho_Chi_Minh">GMT+7 (Việt Nam)</SelectItem>
                                             <SelectItem value="UTC">UTC</SelectItem>
                                             <SelectItem value="America/New_York">GMT-5 (New York)</SelectItem>
                                        </SelectContent>
                                   </Select>
                              </div>
                         </div>
                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                   Chủ đề giao diện
                              </label>
                              <Select defaultValue="light">
                                   <SelectTrigger className="rounded-xl">
                                        <SelectValue />
                                   </SelectTrigger>
                                   <SelectContent>
                                        <SelectItem value="light">Sáng</SelectItem>
                                        <SelectItem value="dark">Tối</SelectItem>
                                        <SelectItem value="auto">Tự động</SelectItem>
                                   </SelectContent>
                              </Select>
                         </div>
                    </CardContent>
               </Card>

               {/* Account Status Card */}
               <Card className="rounded-2xl border border-teal-300">
                    <CardHeader>
                         <CardTitle className="flex items-center">
                              <Shield className="w-5 h-5 mr-2 text-teal-600" />
                              Trạng thái tài khoản
                         </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                                   <div className="flex items-center">
                                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                                        <span className="text-sm font-medium text-green-800">Tài khoản hoạt động</span>
                                   </div>
                                   <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-lg">
                                        {accountInfo.status || "Active"}
                                   </div>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl">
                                   <div className="flex items-center">
                                        <Mail className="w-5 h-5 text-blue-600 mr-2" />
                                        <span className="text-sm font-medium text-blue-800">Email xác thực</span>
                                   </div>
                                   <div className={`text-xs px-2 py-1 rounded-lg ${accountInfo.emailVerified
                                        ? 'text-green-600 bg-green-100'
                                        : 'text-yellow-600 bg-yellow-100'
                                        }`}>
                                        {accountInfo.emailVerified ? "Đã xác thực" : "Chưa xác thực"}
                                   </div>
                              </div>
                         </div>
                         <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                              <div className="flex items-center justify-between">
                                   <div className="flex items-center">
                                        <Calendar className="w-5 h-5 text-gray-600 mr-2" />
                                        <span className="text-sm font-medium text-gray-800">Thành viên từ</span>
                                   </div>
                                   <span className="text-sm text-gray-600">
                                        {new Date(accountInfo.createdAt).toLocaleDateString('vi-VN', {
                                             year: 'numeric',
                                             month: 'long',
                                             day: 'numeric'
                                        })}
                                   </span>
                              </div>
                         </div>
                    </CardContent>
               </Card>

               {/* Activity & Statistics Card */}
               <Card className="rounded-2xl border border-teal-300">
                    <CardHeader>
                         <CardTitle className="flex items-center">
                              <Activity className="w-5 h-5 mr-2 text-teal-600" />
                              Hoạt động & Thống kê
                         </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl">
                                   <div className="flex items-center">
                                        <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                                        <span className="text-sm font-medium text-blue-800">Lần đăng nhập cuối</span>
                                   </div>
                                   <span className="text-xs text-blue-600">
                                        {new Date().toLocaleDateString('vi-VN')}
                                   </span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                                   <div className="flex items-center">
                                        <Clock className="w-5 h-5 text-green-600 mr-2" />
                                        <span className="text-sm font-medium text-green-800">Thời gian online</span>
                                   </div>
                                   <span className="text-xs text-green-600">
                                        2h 30m
                                   </span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-xl">
                                   <div className="flex items-center">
                                        <Database className="w-5 h-5 text-purple-600 mr-2" />
                                        <span className="text-sm font-medium text-purple-800">Dung lượng đã dùng</span>
                                   </div>
                                   <span className="text-xs text-purple-600">
                                        15.2 MB
                                   </span>
                              </div>
                         </div>
                         <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                              <div className="flex items-center justify-between mb-2">
                                   <span className="text-sm font-medium text-gray-800">Tổng số lần đăng nhập</span>
                                   <span className="text-sm text-gray-600">127 lần</span>
                              </div>
                              <div className="flex items-center justify-between mb-2">
                                   <span className="text-sm font-medium text-gray-800">Số ngày hoạt động</span>
                                   <span className="text-sm text-gray-600">45 ngày</span>
                              </div>
                              <div className="flex items-center justify-between">
                                   <span className="text-sm font-medium text-gray-800">Thời gian tạo tài khoản</span>
                                   <span className="text-sm text-gray-600">
                                        {Math.floor((new Date() - new Date(accountInfo.createdAt)) / (1000 * 60 * 60 * 24))} ngày trước
                                   </span>
                              </div>
                         </div>
                    </CardContent>
               </Card>

               <Card>
                    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                         <div className="flex items-start">
                              <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                              <div className="flex-1">
                                   <h4 className="font-medium text-red-800">Xóa tài khoản</h4>
                                   <p className="text-sm text-red-600 mt-1">
                                        Xóa vĩnh viễn tài khoản và tất cả dữ liệu liên quan. Hành động này không thể hoàn tác.
                                   </p>
                              </div>
                         </div>
                         <Button
                              variant="destructive"
                              className="mt-3"
                              onClick={handleDeleteAccount}
                         >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Xóa tài khoản
                         </Button>
                    </div>
               </Card>
          </div>
     );

     const renderSecuritySettings = () => (
          <div className="space-y-6 ">
               <Card className="rounded-2xl border border-teal-300">
                    <CardHeader>
                         <CardTitle>Đổi mật khẩu</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                   Mật khẩu hiện tại
                              </label>
                              <Input
                                   type="password"
                                   value={passwordData.currentPassword}
                                   onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                                   placeholder="Nhập mật khẩu hiện tại"
                                   className="rounded-xl"
                              />
                         </div>
                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                   Mật khẩu mới
                              </label>
                              <Input
                                   type="password"
                                   value={passwordData.newPassword}
                                   onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                                   placeholder="Nhập mật khẩu mới"
                                   className="rounded-xl"
                              />
                         </div>
                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                   Xác nhận mật khẩu mới
                              </label>
                              <Input
                                   type="password"
                                   value={passwordData.confirmPassword}
                                   onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                                   placeholder="Nhập lại mật khẩu mới"
                                   className="rounded-xl"
                              />
                         </div>
                         <Button onClick={handleChangePassword}>
                              <Key className="w-4 h-4 mr-2" />
                              Đổi mật khẩu
                         </Button>
                    </CardContent>
               </Card>

               <Card className="rounded-2xl border border-teal-300">
                    <CardHeader>
                         <CardTitle>Xác thực hai yếu tố</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="space-y-4">
                              <div className="flex items-center justify-between p-4 border rounded-lg">
                                   <div>
                                        <h4 className="font-medium">SMS Authentication</h4>
                                        <p className="text-sm text-gray-600">Nhận mã xác thực qua SMS</p>
                                   </div>
                                   <Button variant="outline" size="sm">
                                        Bật
                                   </Button>
                              </div>
                              <div className="flex items-center justify-between p-4 border rounded-lg">
                                   <div>
                                        <h4 className="font-medium">Authenticator App</h4>
                                        <p className="text-sm text-gray-600">Sử dụng ứng dụng xác thực</p>
                                   </div>
                                   <Button variant="outline" size="sm">
                                        Bật
                                   </Button>
                              </div>
                         </div>
                    </CardContent>
               </Card>

               {/* Login History Card */}
               <Card className="rounded-2xl border border-teal-300">
                    <CardHeader>
                         <CardTitle className="flex items-center">
                              <Clock className="w-5 h-5 mr-2 text-teal-600" />
                              Lịch sử đăng nhập
                         </CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 border rounded-lg">
                                   <div className="flex items-center">
                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                                        <div>
                                             <p className="text-sm font-medium">Đăng nhập thành công</p>
                                             <p className="text-xs text-gray-500">Chrome trên Windows</p>
                                        </div>
                                   </div>
                                   <div className="text-right">
                                        <p className="text-xs text-gray-600">Hôm nay</p>
                                        <p className="text-xs text-gray-500">14:30</p>
                                   </div>
                              </div>
                              <div className="flex items-center justify-between p-3 border rounded-lg">
                                   <div className="flex items-center">
                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                                        <div>
                                             <p className="text-sm font-medium">Đăng nhập thành công</p>
                                             <p className="text-xs text-gray-500">Mobile App</p>
                                        </div>
                                   </div>
                                   <div className="text-right">
                                        <p className="text-xs text-gray-600">Hôm qua</p>
                                        <p className="text-xs text-gray-500">09:15</p>
                                   </div>
                              </div>
                              <div className="flex items-center justify-between p-3 border rounded-lg">
                                   <div className="flex items-center">
                                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                                        <div>
                                             <p className="text-sm font-medium">Đăng nhập thất bại</p>
                                             <p className="text-xs text-gray-500">Sai mật khẩu</p>
                                        </div>
                                   </div>
                                   <div className="text-right">
                                        <p className="text-xs text-gray-600">2 ngày trước</p>
                                        <p className="text-xs text-gray-500">16:45</p>
                                   </div>
                              </div>
                         </div>
                    </CardContent>
               </Card>

               {/* Security Recommendations Card */}
               <Card className="rounded-2xl border border-orange-300">
                    <CardHeader>
                         <CardTitle className="flex items-center text-orange-700">
                              <Shield className="w-5 h-5 mr-2" />
                              Khuyến nghị bảo mật
                         </CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="space-y-3">
                              <div className="flex items-start p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                   <AlertTriangle className="w-4 h-4 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                                   <div className="flex-1">
                                        <p className="text-sm font-medium text-orange-800">Bật xác thực hai yếu tố</p>
                                        <p className="text-xs text-orange-600 mt-1">Tăng cường bảo mật tài khoản của bạn</p>
                                   </div>
                              </div>
                              <div className="flex items-start p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                   <Key className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                                   <div className="flex-1">
                                        <p className="text-sm font-medium text-blue-800">Đổi mật khẩu định kỳ</p>
                                        <p className="text-xs text-blue-600 mt-1">Mật khẩu hiện tại đã được sử dụng 90 ngày</p>
                                   </div>
                              </div>
                         </div>
                    </CardContent>
               </Card>
          </div>
     );

     const renderNotificationSettings = () => (
          <div className="space-y-6">
               <Card className="rounded-2xl border border-teal-300">
                    <CardHeader>
                         <CardTitle>Cài đặt thông báo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                   <div>
                                        <h4 className="font-medium">Thông báo qua email</h4>
                                        <p className="text-sm text-gray-600">Nhận thông báo quan trọng qua email</p>
                                   </div>
                                   <Select
                                        value={notificationSettings.emailNotifications.toString()}
                                        onValueChange={(value) => handleNotificationChange('emailNotifications', value === 'true')}
                                   >
                                        <SelectTrigger className="w-20 rounded-xl">
                                             <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="true" className="text-green-500 hover:text-green-600">Bật</SelectItem>
                                             <SelectItem value="false" className="text-red-500 hover:text-red-600">Tắt</SelectItem>
                                        </SelectContent>
                                   </Select>
                              </div>
                              <div className="flex items-center justify-between">
                                   <div>
                                        <h4 className="font-medium">Thông báo qua SMS</h4>
                                        <p className="text-sm text-gray-600">Nhận thông báo qua tin nhắn</p>
                                   </div>
                                   <Select
                                        value={notificationSettings.smsNotifications.toString()}
                                        onValueChange={(value) => handleNotificationChange('smsNotifications', value === 'true')}
                                   >
                                        <SelectTrigger className="w-20 rounded-xl">
                                             <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="true" className="text-green-500 hover:text-green-600">Bật</SelectItem>
                                             <SelectItem value="false" className="text-red-500 hover:text-red-600">Tắt</SelectItem>
                                        </SelectContent>
                                   </Select>
                              </div>
                              <div className="flex items-center justify-between">
                                   <div>
                                        <h4 className="font-medium">Thông báo đẩy</h4>
                                        <p className="text-sm text-gray-600">Nhận thông báo trên thiết bị</p>
                                   </div>
                                   <Select
                                        value={notificationSettings.pushNotifications.toString()}
                                        onValueChange={(value) => handleNotificationChange('pushNotifications', value === 'true')}
                                   >
                                        <SelectTrigger className="w-20 rounded-xl">
                                             <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="true" className="text-green-500 hover:text-green-600">Bật</SelectItem>
                                             <SelectItem value="false" className="text-red-500 hover:text-red-600">Tắt</SelectItem>
                                        </SelectContent>
                                   </Select>
                              </div>
                              <div className="flex items-center justify-between">
                                   <div>
                                        <h4 className="font-medium">Nhắc nhở đặt sân</h4>
                                        <p className="text-sm text-gray-600">Nhắc nhở trước khi đặt sân</p>
                                   </div>
                                   <Select
                                        value={notificationSettings.bookingReminders.toString()}
                                        onValueChange={(value) => handleNotificationChange('bookingReminders', value === 'true')}
                                   >
                                        <SelectTrigger className="w-20 rounded-xl">
                                             <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="true" className="text-green-500 hover:text-green-600">Bật</SelectItem>
                                             <SelectItem value="false" className="text-red-500 hover:text-red-600">Tắt</SelectItem>
                                        </SelectContent>
                                   </Select>
                              </div>
                              <div className="flex items-center justify-between">
                                   <div>
                                        <h4 className="font-medium">Email khuyến mãi</h4>
                                        <p className="text-sm text-gray-600">Nhận thông tin khuyến mãi và ưu đãi</p>
                                   </div>
                                   <Select
                                        value={notificationSettings.promotionalEmails.toString()}
                                        onValueChange={(value) => handleNotificationChange('promotionalEmails', value === 'true')}
                                   >
                                        <SelectTrigger className="w-20 rounded-xl">
                                             <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="true" className="text-green-500 hover:text-green-600">Bật</SelectItem>
                                             <SelectItem value="false" className="text-red-500 hover:text-red-600">Tắt</SelectItem>
                                        </SelectContent>
                                   </Select>
                              </div>
                         </div>
                    </CardContent>
               </Card>
          </div>
     );

     const renderPrivacySettings = () => (
          <div className="space-y-6">
               <Card className="rounded-2xl border border-teal-300">
                    <CardHeader>
                         <CardTitle>Cài đặt quyền riêng tư</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                   <div>
                                        <h4 className="font-medium">Hiển thị hồ sơ công khai</h4>
                                        <p className="text-sm text-gray-600">Cho phép người khác xem hồ sơ của bạn</p>
                                   </div>
                                   <Select defaultValue="true">
                                        <SelectTrigger className="w-20 rounded-xl">
                                             <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="true" className="text-green-500 hover:text-green-600">Bật</SelectItem>
                                             <SelectItem value="false" className="text-red-500 hover:text-red-600">Tắt</SelectItem>
                                        </SelectContent>
                                   </Select>
                              </div>
                              <div className="flex items-center justify-between">
                                   <div>
                                        <h4 className="font-medium">Hiển thị số điện thoại</h4>
                                        <p className="text-sm text-gray-600">Cho phép người khác xem số điện thoại</p>
                                   </div>
                                   <Select defaultValue="false">
                                        <SelectTrigger className="w-20 rounded-xl">
                                             <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="true" className="text-green-500 hover:text-green-600">Bật</SelectItem>
                                             <SelectItem value="false" className="text-red-500 hover:text-red-600">Tắt</SelectItem>
                                        </SelectContent>
                                   </Select>
                              </div>
                              <div className="flex items-center justify-between">
                                   <div>
                                        <h4 className="font-medium">Hiển thị địa chỉ</h4>
                                        <p className="text-sm text-gray-600">Cho phép người khác xem địa chỉ</p>
                                   </div>
                                   <Select defaultValue="false">
                                        <SelectTrigger className="w-20 rounded-xl">
                                             <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="true" className="text-green-500 hover:text-green-600">Bật</SelectItem>
                                             <SelectItem value="false" className="text-red-500 hover:text-red-600">Tắt</SelectItem>
                                        </SelectContent>
                                   </Select>
                              </div>
                         </div>
                    </CardContent>
               </Card>

               <Card className="rounded-2xl border border-teal-300">
                    <CardHeader>
                         <CardTitle>Dữ liệu cá nhân</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="space-y-4">
                              <div className="p-4 border rounded-lg bg-teal-50">
                                   <h4 className="font-medium mb-2 text-teal-600">Xuất dữ liệu</h4>
                                   <p className="text-sm text-gray-600 mb-3">
                                        Tải xuống tất cả dữ liệu cá nhân của bạn
                                   </p>
                                   <Button variant="outline" size="sm">
                                        Xuất dữ liệu
                                   </Button>
                              </div>
                              <div className="p-4 border rounded-lg bg-red-50">
                                   <h4 className="font-medium mb-2 text-red-600">Xóa dữ liệu</h4>
                                   <p className="text-sm text-gray-600 mb-3">
                                        Xóa tất cả dữ liệu cá nhân (không bao gồm tài khoản)
                                   </p>
                                   <Button variant="destructive" size="sm">
                                        Xóa dữ liệu
                                   </Button>
                              </div>
                         </div>
                    </CardContent>
               </Card>

               {/* Data Usage Card */}
               <Card className="rounded-2xl border border-teal-300">
                    <CardHeader>
                         <CardTitle className="flex items-center">
                              <Database className="w-5 h-5 mr-2 text-teal-600" />
                              Sử dụng dữ liệu
                         </CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                                        <div className="flex items-center justify-between mb-2">
                                             <span className="text-sm font-medium text-blue-800">Dữ liệu đã tải xuống</span>
                                             <span className="text-sm text-blue-600">45.2 MB</span>
                                        </div>
                                        <div className="w-full bg-blue-200 rounded-full h-2">
                                             <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                                        </div>
                                   </div>
                                   <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                                        <div className="flex items-center justify-between mb-2">
                                             <span className="text-sm font-medium text-green-800">Dữ liệu đã tải lên</span>
                                             <span className="text-sm text-green-600">12.8 MB</span>
                                        </div>
                                        <div className="w-full bg-green-200 rounded-full h-2">
                                             <div className="bg-green-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                                        </div>
                                   </div>
                              </div>
                              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                                   <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-800">Tổng dung lượng sử dụng</span>
                                        <span className="text-sm text-gray-600">58.0 MB / 1 GB</span>
                                   </div>
                                   <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-gray-600 h-2 rounded-full" style={{ width: '5.8%' }}></div>
                                   </div>
                              </div>
                         </div>
                    </CardContent>
               </Card>

               {/* Privacy Settings Card */}
               <Card className="rounded-2xl border border-teal-300">
                    <CardHeader>
                         <CardTitle className="flex items-center">
                              <Eye className="w-5 h-5 mr-2 text-teal-600" />
                              Cài đặt hiển thị
                         </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                   <div>
                                        <h4 className="font-medium">Hiển thị trạng thái online</h4>
                                        <p className="text-sm text-gray-600">Cho phép người khác thấy bạn đang online</p>
                                   </div>
                                   <Select defaultValue="true">
                                        <SelectTrigger className="w-20 rounded-xl">
                                             <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="true" className="text-green-500 hover:text-green-600">Bật</SelectItem>
                                             <SelectItem value="false" className="text-red-500 hover:text-red-600">Tắt</SelectItem>
                                        </SelectContent>
                                   </Select>
                              </div>
                              <div className="flex items-center justify-between">
                                   <div>
                                        <h4 className="font-medium">Hiển thị hoạt động gần đây</h4>
                                        <p className="text-sm text-gray-600">Cho phép người khác thấy hoạt động của bạn</p>
                                   </div>
                                   <Select defaultValue="true">
                                        <SelectTrigger className="w-20 rounded-xl">
                                             <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="true" className="text-green-500 hover:text-green-600">Bật</SelectItem>
                                             <SelectItem value="false" className="text-red-500 hover:text-red-600">Tắt</SelectItem>
                                        </SelectContent>
                                   </Select>
                              </div>
                              <div className="flex items-center justify-between">
                                   <div>
                                        <h4 className="font-medium">Cho phép tìm kiếm</h4>
                                        <p className="text-sm text-gray-600">Cho phép người khác tìm thấy bạn qua email/số điện thoại</p>
                                   </div>
                                   <Select defaultValue="false">
                                        <SelectTrigger className="w-20 rounded-xl">
                                             <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="true" className="text-green-500 hover:text-green-600">Bật</SelectItem>
                                             <SelectItem value="false" className="text-red-500 hover:text-red-600">Tắt</SelectItem>
                                        </SelectContent>
                                   </Select>
                              </div>
                         </div>
                    </CardContent>
               </Card>
          </div>
     );

     const renderContent = () => {
          switch (activeTab) {
               case "account":
                    return renderAccountSettings();
               case "security":
                    return renderSecuritySettings();
               case "notifications":
                    return renderNotificationSettings();
               case "privacy":
                    return renderPrivacySettings();
               default:
                    return renderAccountSettings();
          }
     };

     return (
          <div className="min-h-screen bg-[url('https://mixivivu.com/section-background.png')] bg-cover bg-center">
               <Container>
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-5">
                         {/* Header */}
                         <div className="my-2 text-center">
                              <div className="inline-flex items-center justify-center w-12 h-10 bg-teal-100 rounded-2xl mb-2">
                                   <Settings className="w-8 h-8 text-teal-600" />
                              </div>
                              <h1 className="text-4xl font-bold text-teal-900 mb-2">Cài đặt</h1>
                              <p className="text-teal-600 text-lg">Quản lý cài đặt tài khoản và ứng dụng</p>
                         </div>

                         {/* Error and Info Messages */}
                         {error && (
                              <ErrorDisplay
                                   type="error"
                                   title="Lỗi"
                                   message={error}
                                   onClose={() => setError('')}
                              />
                         )}
                         {info && (
                              <ErrorDisplay
                                   type="success"
                                   title="Thành công"
                                   message={info}
                                   onClose={() => setInfo('')}
                              />
                         )}

                         <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                              {/* Sidebar */}
                              <div className="lg:col-span-1">
                                   <Card className="sticky bg-transparent border-0 rounded-2xl">
                                        <CardContent className="p-0">
                                             <nav className="space-y-2 p-2">
                                                  {tabs.map((tab) => {
                                                       const Icon = tab.icon;
                                                       return (
                                                            <button
                                                                 key={tab.id}
                                                                 onClick={() => setActiveTab(tab.id)}
                                                                 className={`w-full flex items-center px-4 py-3 text-left text-sm font-medium rounded-2xl transition-all duration-300 ${activeTab === tab.id
                                                                      ? 'bg-teal-100 text-teal-700shadow-xl border-2 border-teal-300 backdrop-blur-sm'
                                                                      : 'text-teal-600 hover:bg-teal-50 hover:border hover:border-teal-200 hover:text-teal-800'
                                                                      }`}
                                                            >
                                                                 <div className={`p-2 rounded-xl mr-3 ${activeTab === tab.id ? 'bg-teal-200' : 'bg-teal-100'}`}>
                                                                      <Icon className="w-4 h-4" />
                                                                 </div>
                                                                 {tab.label}
                                                            </button>
                                                       );
                                                  })}
                                             </nav>
                                        </CardContent>
                                   </Card>
                              </div>

                              {/* Content */}
                              <div className="lg:col-span-3">
                                   {renderContent()}
                              </div>
                         </div>
                    </div>
               </Container>
          </div>
     );
}
