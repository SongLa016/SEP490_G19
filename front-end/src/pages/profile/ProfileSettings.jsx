import { useState } from "react";
import { Settings, Shield, Bell, Key, Trash2, AlertTriangle, CheckCircle, User, Lock, Eye, EyeOff, LogIn, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Container } from "../../components/ui";

export default function ProfileSettings({ user }) {
     const [activeTab, setActiveTab] = useState("account");
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
                         <CardTitle>Thông tin tài khoản</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                   <label className="gap-2 text-sm flex font-medium text-gray-700 mb-1.5">
                                        <LogIn size={20} />  Email đăng nhập
                                   </label>
                                   <Input value="user@example.com" disabled className="rounded-xl" />
                                   <p className="text-xs text-red-500 ml-3 mt-1">Email không thể thay đổi</p>
                              </div>
                              <div>
                                   <label className="flex gap-2 text-sm font-medium text-gray-700 mb-1.5">
                                        <Phone size={20} />Số điện thoại
                                   </label>
                                   <Input placeholder="Nhập số điện thoại" className="rounded-xl" />
                              </div>
                         </div>
                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                   Ngôn ngữ hiển thị
                              </label>
                              <Select defaultValue="vi">
                                   <SelectTrigger>
                                        <SelectValue />
                                   </SelectTrigger>
                                   <SelectContent>
                                        <SelectItem value="vi">Tiếng Việt</SelectItem>
                                        <SelectItem value="en">English</SelectItem>
                                   </SelectContent>
                              </Select>
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
