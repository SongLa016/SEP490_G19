import React, { useState, useEffect } from "react";
import { MapPin, Users, BarChart3, Shield } from "lucide-react";
import { updateUserProfile, changePassword } from "../../../../shared/index";
import { useAuth } from "../../../../contexts/AuthContext";
import Header from "../../layouts/Header";
import Footer from "../../layouts/Footer";
import HomePage from "../home/HomePage";
import FieldSearch from "../fields/FieldSearch";
import BookingHistory from "../booking/BookingHistory";

import { Button, Section, FadeIn, SlideIn, PhoneInput } from "../../../../shared/components/ui";
import { NotificationsDisplay } from "../../../../shared";

export default function Dashboard({ currentView, navigateTo }) {
     const { user, logout } = useAuth();
     const [name, setName] = useState(user?.name || "");
     const [phone, setPhone] = useState(user?.phone || "");
     const [oldPassword, setOldPassword] = useState("");
     const [newPassword, setNewPassword] = useState("");
     const [profileMsg, setProfileMsg] = useState("");
     const [profileErr, setProfileErr] = useState("");
     const [pwdMsg, setPwdMsg] = useState("");
     const [pwdErr, setPwdErr] = useState("");

     // Cuộn lên đầu 
     useEffect(() => {
          const loadingTimeout = setTimeout(() => {
               window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
               });
          }, 100);
          return () => clearTimeout(loadingTimeout);
     }, [currentView]);

     const renderContent = () => {
          switch (currentView) {
               case "home":
                    return <HomePage user={user} navigateTo={navigateTo} />;
               case "search":
                    return <FieldSearch user={user} navigateTo={navigateTo} />;
               case "profile":
                    return renderProfileContent();
               case "notifications":
                    return (
                         <div className="min-h-screen bg-gray-50 py-8">
                              <div className="max-w-4xl mx-auto px-4">
                                   <h1 className="text-3xl font-bold text-gray-900 mb-8">Thông báo</h1>
                                   <NotificationsDisplay userId={user?.id} />
                              </div>
                         </div>
                    );
               case "bookings":
                    return <BookingHistory user={user} navigateTo={navigateTo} />;
               case "community":
                    return renderCommunityContent();
               case "my-fields":
                    return renderMyFieldsContent();
               case "reports":
                    return renderReportsContent();
               case "users":
                    return renderUsersContent();
               case "fields":
                    return renderFieldsContent();
               default:
                    return <HomePage user={user} navigateTo={navigateTo} />;
          }
     };

     const renderProfileContent = () => (
          <FadeIn delay={100}>
               <div className="max-w-4xl mx-auto p-6">
                    <SlideIn direction="down" delay={50}>
                         <div className="bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl">
                              <div className="bg-gradient-to-r from-teal-500 to-orange-500 px-6 py-8 text-white">
                                   <h1 className="text-2xl font-bold">Hồ sơ cá nhân</h1>
                                   <p className="text-teal-100">Quản lý thông tin tài khoản của bạn</p>
                              </div>
                              <div className="p-6">
                                   <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                             <div>
                                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                                       Họ và tên
                                                  </label>
                                                  <input
                                                       type="text"
                                                       value={name}
                                                       onChange={(e) => setName(e.target.value)}
                                                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                                       placeholder="Nhập họ và tên"
                                                  />
                                             </div>
                                             <div>
                                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                                       Email
                                                  </label>
                                                  <input
                                                       type="email"
                                                       defaultValue={user?.email || ""}
                                                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                                       placeholder="Nhập email"
                                                       disabled
                                                  />
                                             </div>
                                             <div>
                                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                                       Số điện thoại
                                                  </label>
                                                  <PhoneInput
                                                       value={phone}
                                                       onChange={(e) => setPhone(e.target.value)}
                                                       maxLength={10}
                                                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                                       placeholder="Nhập số điện thoại"
                                                  />
                                             </div>
                                             <div>
                                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                                       Vai trò
                                                  </label>
                                                  <input
                                                       type="text"
                                                       value={user?.role === "User" ? "Người chơi" : user?.role === "FieldOwner" ? "Chủ sân" : "Quản trị viên"}
                                                       disabled
                                                       className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                                                  />
                                             </div>
                                        </div>
                                        {profileErr && <div className="rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{profileErr}</div>}
                                        {profileMsg && <div className="rounded border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">{profileMsg}</div>}
                                        <div className="mt-2">
                                             <Button
                                                  onClick={() => {
                                                       setProfileErr("");
                                                       setProfileMsg("");
                                                       if (!name) { setProfileErr("Vui lòng nhập họ tên"); return; }
                                                       const res = updateUserProfile({ userId: user.id, name, phone });
                                                       if (!res.ok) { setProfileErr(res.reason || "Cập nhật thất bại"); return; }
                                                       setProfileMsg("Đã cập nhật hồ sơ");
                                                  }}
                                                  className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                                             >
                                                  Cập nhật thông tin
                                             </Button>
                                        </div>

                                        <div className="pt-6 border-t">
                                             <h2 className="text-lg font-semibold text-gray-900 mb-3">Đổi mật khẩu</h2>
                                             {pwdErr && <div className="rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm mb-3">{pwdErr}</div>}
                                             {pwdMsg && <div className="rounded border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm mb-3">{pwdMsg}</div>}
                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                  <div>
                                                       <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu hiện tại</label>
                                                       <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Nhập mật khẩu hiện tại" />
                                                  </div>
                                                  <div>
                                                       <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu mới</label>
                                                       <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Nhập mật khẩu mới" />
                                                  </div>
                                             </div>
                                             <div className="mt-4">
                                                  <Button
                                                       onClick={() => {
                                                            setPwdErr("");
                                                            setPwdMsg("");
                                                            if (!newPassword) { setPwdErr("Vui lòng nhập mật khẩu mới"); return; }
                                                            const res = changePassword({ userId: user.id, oldPassword, newPassword });
                                                            if (!res.ok) { setPwdErr(res.reason || "Đổi mật khẩu thất bại"); return; }
                                                            setPwdMsg("Đổi mật khẩu thành công");
                                                            setOldPassword("");
                                                            setNewPassword("");
                                                       }}
                                                       className="bg-gray-900 hover:bg-black text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                                                  >
                                                       Đổi mật khẩu
                                                  </Button>
                                             </div>
                                        </div>
                                   </div>
                              </div>
                         </div>
                    </SlideIn>
               </div>
          </FadeIn>
     );

     const renderCommunityContent = () => (
          <div className="max-w-6xl mx-auto p-6">
               <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-500 to-orange-500 px-6 py-8 text-white">
                         <h1 className="text-2xl font-bold">Cộng đồng</h1>
                         <p className="text-teal-100">Kết nối với người chơi khác</p>
                    </div>
                    <div className="p-6">
                         <div className="text-center py-8 text-gray-500">
                              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <p>Tính năng cộng đồng đang được phát triển</p>
                         </div>
                    </div>
               </div>
          </div>
     );

     const renderMyFieldsContent = () => (
          <div className="max-w-6xl mx-auto p-6">
               <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-500 to-orange-500 px-6 py-8 text-white">
                         <h1 className="text-2xl font-bold">Sân của tôi</h1>
                         <p className="text-teal-100">Quản lý các sân bóng của bạn</p>
                    </div>
                    <div className="p-6">
                         <div className="text-center py-8 text-gray-500">
                              <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <p>Chưa có sân nào được thêm</p>
                              <Button className="mt-4 bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                                   Thêm sân mới
                              </Button>
                         </div>
                    </div>
               </div>
          </div>
     );

     const renderReportsContent = () => (
          <div className="max-w-6xl mx-auto p-6">
               <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-500 to-orange-500 px-6 py-8 text-white">
                         <h1 className="text-2xl font-bold">Báo cáo</h1>
                         <p className="text-teal-100">Thống kê và báo cáo doanh thu</p>
                    </div>
                    <div className="p-6">
                         <div className="text-center py-8 text-gray-500">
                              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <p>Báo cáo đang được phát triển</p>
                         </div>
                    </div>
               </div>
          </div>
     );

     const renderUsersContent = () => (
          <div className="max-w-6xl mx-auto p-6">
               <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-500 to-orange-500 px-6 py-8 text-white">
                         <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
                         <p className="text-teal-100">Quản lý tài khoản người dùng hệ thống</p>
                    </div>
                    <div className="p-6">
                         <div className="text-center py-8 text-gray-500">
                              <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <p>Tính năng quản trị đang được phát triển</p>
                         </div>
                    </div>
               </div>
          </div>
     );

     const renderFieldsContent = () => (
          <div className="max-w-6xl mx-auto p-6">
               <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-500 to-orange-500 px-6 py-8 text-white">
                         <h1 className="text-2xl font-bold">Quản lý sân</h1>
                         <p className="text-teal-100">Quản lý tất cả sân bóng trong hệ thống</p>
                    </div>
                    <div className="p-6">
                         <div className="text-center py-8 text-gray-500">
                              <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <p>Tính năng quản trị đang được phát triển</p>
                         </div>
                    </div>
               </div>
          </div>
     );

     return (
          <Section className="min-h-screen  text-white">
               <Header
                    user={user}
                    onLoggedOut={logout}
                    currentView={currentView}
                    navigateTo={navigateTo}
               />
               {renderContent()}
               <Footer />
          </Section>
     );
}
