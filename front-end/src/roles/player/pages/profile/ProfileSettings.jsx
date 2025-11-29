import { useState } from "react";
import { Settings, Shield, Bell, Trash2, AlertTriangle, Phone, Mail, User, Calendar, CheckCircle, AlertCircle, Clock, Activity, Database, Key } from "lucide-react";
import { Container, Card, CardContent, CardHeader, CardTitle, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, FadeIn, SlideIn } from "../../../../shared/components/ui";
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

     ];

     const handlePasswordChange = (field, value) => {
          setPasswordData(prev => ({
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
          <div className="space-y-4 ">
               <FadeIn delay={100}>
                    <Card className="rounded-3xl border border-teal-200/70 bg-white/90 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl backdrop-blur">
                         <CardHeader className="flex flex-col gap-2 border-b border-teal-100/60 bg-gradient-to-r from-teal-50 via-white to-white rounded-t-3xl">
                              <CardTitle className="flex items-center text-teal-900">
                                   <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-100 text-teal-600">
                                        <User className="w-5 h-5" />
                                   </div>
                                   Thông tin tài khoản
                              </CardTitle>
                              <p className="text-sm text-teal-600">
                                   Kiểm tra và điều chỉnh những dữ liệu cơ bản của tài khoản của bạn
                              </p>
                         </CardHeader>
                         <CardContent className="space-y-6 p-6">
                              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                   <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-teal-800">
                                             <Mail className="w-4 h-4" />
                                             Email đăng nhập
                                        </label>
                                        <div className="relative">
                                             <Input
                                                  value={accountInfo.email}
                                                  disabled
                                                  className="rounded-2xl border-teal-100 bg-teal-50/70 pr-28 text-teal-900 focus:border-teal-500 focus:ring-teal-500"
                                             />
                                             <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                                  <div className={`flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${accountInfo.emailVerified
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
                                        <p className="pl-1 text-xs text-teal-500">Email được cố định sau khi đăng ký</p>
                                   </div>
                                   <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-teal-800">
                                             <Phone className="w-4 h-4" />
                                             Số điện thoại
                                        </label>
                                        <Input
                                             value={accountInfo.phone || "Chưa cập nhật"}
                                             disabled
                                             className="rounded-2xl border-teal-100 bg-white text-teal-900 focus:border-teal-500 focus:ring-teal-500"
                                        />
                                        <p className="pl-1 text-xs text-teal-500">Cập nhật tại trang Hồ sơ cá nhân</p>
                                   </div>
                              </div>
                              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                   <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-teal-800">
                                             <Calendar className="w-4 h-4" />
                                             Ngày tạo tài khoản
                                        </label>
                                        <Input
                                             value={new Date(accountInfo.createdAt).toLocaleDateString('vi-VN')}
                                             disabled
                                             className="rounded-2xl border-teal-100 bg-white text-teal-900 focus:border-teal-500 focus:ring-teal-500"
                                        />
                                   </div>
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                             <label className="block text-sm font-semibold text-teal-800">
                                                  Ngôn ngữ hiển thị
                                             </label>
                                             <Select defaultValue="vi">
                                                  <SelectTrigger className="rounded-2xl border-teal-100 bg-white focus:border-teal-500 focus:ring-teal-500">
                                                       <SelectValue placeholder="Chọn ngôn ngữ" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                       <SelectItem value="vi">Tiếng Việt</SelectItem>
                                                       <SelectItem value="en">English</SelectItem>
                                                  </SelectContent>
                                             </Select>
                                        </div>
                                        <div className="space-y-2">
                                             <label className="block text-sm font-semibold text-teal-800">
                                                  Múi giờ
                                             </label>
                                             <Select defaultValue="Asia/Ho_Chi_Minh">
                                                  <SelectTrigger className="rounded-2xl border-teal-100 bg-white focus:border-teal-500 focus:ring-teal-500">
                                                       <SelectValue placeholder="Chọn múi giờ" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                       <SelectItem value="Asia/Ho_Chi_Minh">GMT+7 (Việt Nam)</SelectItem>
                                                       <SelectItem value="UTC">UTC</SelectItem>
                                                       <SelectItem value="America/New_York">GMT-5 (New York)</SelectItem>
                                                  </SelectContent>
                                             </Select>
                                        </div>
                                   </div>
                              </div>
                         </CardContent>
                    </Card>
               </FadeIn>

               <FadeIn delay={160}>
                    <Card className="rounded-3xl border border-teal-200/70 bg-white/90 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl backdrop-blur">
                         <CardHeader className="border-b border-teal-100/60 bg-gradient-to-r from-teal-50 via-white to-white rounded-t-3xl">
                              <CardTitle className="flex items-center gap-2 text-teal-900">
                                   <Shield className="w-5 h-5 text-teal-600" />
                                   Trạng thái tài khoản
                              </CardTitle>
                         </CardHeader>
                         <CardContent className="space-y-4 p-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div className="flex items-center justify-between rounded-2xl border border-green-200 bg-green-50/90 px-4 py-3">
                                        <div className="flex items-center">
                                             <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                                             <span className="text-sm font-semibold text-green-800">Tài khoản hoạt động</span>
                                        </div>
                                        <div className="text-xs font-semibold text-green-600">
                                             {accountInfo.status || "Active"}
                                        </div>
                                   </div>
                                   <div className="rounded-2xl border border-gray-200 bg-gray-50/90 px-4 py-3">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                             <div className="flex items-center text-gray-700">
                                                  <Calendar className="w-5 h-5 text-gray-600 mr-2" />
                                                  <span className="text-sm font-semibold">Thành viên từ</span>
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
                              </div>

                         </CardContent>
                    </Card>
               </FadeIn>


               <FadeIn delay={260}>
                    <Card className="rounded-3xl border border-red-200/70 bg-white/95 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl backdrop-blur">
                         <CardHeader className="border-b border-red-100/70 bg-gradient-to-r from-red-50 via-white to-white rounded-t-3xl">
                              <CardTitle className="flex items-center gap-2 text-red-700">
                                   <Trash2 className="w-5 h-5" />
                                   Xóa tài khoản
                              </CardTitle>
                         </CardHeader>
                         <CardContent className="space-y-4 p-6">
                              <div className="rounded-2xl border border-red-100 bg-red-50/80 p-4">
                                   <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                                        <div>
                                             <h4 className="text-base font-semibold text-red-700">Hành động nguy hiểm</h4>
                                             <p className="mt-1 text-sm text-red-600">
                                                  Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu liên quan. Hành động này không thể hoàn tác.
                                             </p>
                                        </div>
                                   </div>
                              </div>
                              <Button
                                   variant="destructive"
                                   className="rounded-2xl shadow-md hover:shadow-lg"
                                   onClick={handleDeleteAccount}
                              >
                                   <Trash2 className="w-4 h-4 mr-2" />
                                   Xóa tài khoản
                              </Button>
                         </CardContent>
                    </Card>
               </FadeIn>
          </div>
     );

     const renderSecuritySettings = () => (
          <div className="space-y-4">
               <FadeIn delay={100}>
                    <Card className="rounded-3xl border border-teal-200/70 bg-white/90 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl backdrop-blur">
                         <CardHeader className="border-b py-3 border-teal-100/60 bg-gradient-to-r from-teal-50 via-white to-white rounded-t-3xl">
                              <CardTitle className="flex text-2xl items-center gap-2 text-teal-900">
                                   <Key className="w-5 h-5 text-teal-600" />
                                   Đổi mật khẩu
                              </CardTitle>
                              <p className="text-sm text-teal-600">
                                   Tăng cường bảo mật bằng cách cập nhật mật khẩu định kỳ
                              </p>
                         </CardHeader>
                         <CardContent className="space-y-2 px-5 pt-2">
                              <div className="space-y-2">
                                   <label className="block text-sm font-semibold text-teal-800">
                                        Mật khẩu hiện tại
                                   </label>
                                   <Input
                                        type="password"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                                        placeholder="Nhập mật khẩu hiện tại"
                                        className="rounded-2xl border-teal-100 focus:border-teal-500 focus:ring-teal-500"
                                   />
                              </div>
                              <div className="space-y-2">
                                   <label className="block text-sm font-semibold text-teal-800">
                                        Mật khẩu mới
                                   </label>
                                   <Input
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                                        placeholder="Nhập mật khẩu mới"
                                        className="rounded-2xl border-teal-100 focus:border-teal-500 focus:ring-teal-500"
                                   />
                              </div>
                              <div className="space-y-2">
                                   <label className="block text-sm font-semibold text-teal-800">
                                        Xác nhận mật khẩu mới
                                   </label>
                                   <Input
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                                        placeholder="Nhập lại mật khẩu mới"
                                        className="rounded-2xl border-teal-100 focus:border-teal-500 focus:ring-teal-500"
                                   />
                              </div>
                              <Button
                                   onClick={handleChangePassword}
                                   className="rounded-2xl bg-teal-500 hover:bg-teal-600"
                              >
                                   <Key className="w-4 h-4 mr-2" />
                                   Đổi mật khẩu
                              </Button>
                         </CardContent>
                    </Card>
               </FadeIn>

               <FadeIn delay={260}>
                    <Card className="rounded-3xl border border-orange-200/70 bg-white/95 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl backdrop-blur">
                         <CardHeader className="border-b border-orange-100/70 bg-gradient-to-r from-orange-50 via-white to-white rounded-t-3xl">
                              <CardTitle className="flex items-center gap-2 text-orange-700">
                                   <Shield className="w-5 h-5" />
                                   Khuyến nghị bảo mật
                              </CardTitle>
                         </CardHeader>
                         <CardContent className="space-y-3 p-6">

                              <div className="flex items-start gap-3 rounded-2xl border border-orange-100 bg-orange-50/80 px-4 py-3">
                                   <Key className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                   <div className="flex-1">
                                        <p className="text-sm font-semibold text-orange-800">Đổi mật khẩu định kỳ</p>
                                        <p className="mt-1 text-xs text-orange-600">Mật khẩu hiện tại đã được sử dụng 90 ngày</p>
                                   </div>
                              </div>
                         </CardContent>
                    </Card>
               </FadeIn>
          </div>
     );



     const renderContent = () => {
          switch (activeTab) {
               case "account":
                    return renderAccountSettings();
               case "security":
                    return renderSecuritySettings();
               default:
                    return renderAccountSettings();
          }
     };

     return (
          <div className="relative min-h-screen ">
               <div className="absolute inset-0 bg-[url('https://mixivivu.com/section-background.png')] bg-cover bg-center border border-teal-500 rounded-3xl" />
               <Container>
                    <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                         {/* Header */}
                         <SlideIn direction="down" delay={120}>
                              <div className="my-2 text-center">
                                   <div className="inline-flex items-center justify-center w-14 h-14 bg-white/80 border border-teal-100 rounded-3xl shadow-sm mb-3">
                                        <Settings className="w-8 h-8 text-teal-600" />
                                   </div>
                                   <h1 className="text-3xl font-bold text-teal-900 mb-2">Cài đặt hồ sơ</h1>
                                   <p className="text-teal-600 text-base max-w-2xl mx-auto">
                                        Tinh chỉnh thông tin tài khoản, bảo mật và trải nghiệm sử dụng của bạn
                                   </p>
                              </div>
                         </SlideIn>

                         {/* Error and Info Messages */}
                         {error && (
                              <FadeIn delay={140}>
                                   <ErrorDisplay
                                        type="error"
                                        title="Lỗi"
                                        message={error}
                                        onClose={() => setError('')}
                                   />
                              </FadeIn>
                         )}
                         {info && (
                              <FadeIn delay={140}>
                                   <ErrorDisplay
                                        type="success"
                                        title="Thành công"
                                        message={info}
                                        onClose={() => setInfo('')}
                                   />
                              </FadeIn>
                         )}

                         <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                              {/* Sidebar */}
                              <div className="lg:col-span-1">
                                   <div className="lg:sticky lg:top-28 space-y-4">
                                        <SlideIn direction="left" delay={200}>
                                             <Card className="border border-teal-100/80 bg-white/80 backdrop-blur rounded-3xl shadow-xl">
                                                  <CardContent className="p-3">
                                                       <nav className="space-y-2">
                                                            {tabs.map((tab) => {
                                                                 const Icon = tab.icon;
                                                                 return (
                                                                      <button
                                                                           key={tab.id}
                                                                           onClick={() => setActiveTab(tab.id)}
                                                                           className={`group w-full flex items-center px-4 py-3 text-left text-sm font-semibold rounded-2xl transition-all duration-300 ${activeTab === tab.id
                                                                                ? 'bg-white/90 text-teal-800 shadow-lg border border-teal-200 backdrop-blur'
                                                                                : 'text-teal-600 hover:text-teal-800 hover:bg-white/70 hover:border hover:border-teal-200'
                                                                                }`}
                                                                      >
                                                                           <div className={`mr-3 flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-300 ${activeTab === tab.id
                                                                                ? 'bg-teal-100 text-teal-700'
                                                                                : 'bg-teal-50 text-teal-500 group-hover:bg-teal-100 group-hover:text-teal-700'
                                                                                }`}>
                                                                                <Icon className="w-4 h-4" />
                                                                           </div>
                                                                           <span className="flex-1">{tab.label}</span>
                                                                      </button>
                                                                 );
                                                            })}
                                                       </nav>
                                                  </CardContent>
                                             </Card>
                                        </SlideIn>
                                   </div>
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

