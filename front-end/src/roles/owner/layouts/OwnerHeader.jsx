import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
     Search,
     User,
     Menu,
     X,
     LogOut,
     Settings,
     Home,
     MapPin,
     Calendar,
     BarChart3,
     DollarSign,
     Clock,
     Shield,
     CreditCard,
     Bell,
     TrendingUp,
} from "lucide-react";
import logo from "@/components/assets/logo.png";
import { Button } from "@/components/ui";

export default function OwnerHeader({ user, onLoggedOut }) {
     const [isMenuOpen, setIsMenuOpen] = useState(false);
     const [isProfileOpen, setIsProfileOpen] = useState(false);
     const navigate = useNavigate();
     const location = useLocation();

     const ownerMenuItems = [
          { id: "dashboard", label: "Dashboard", icon: BarChart3, path: "/owner/dashboard" },
          { id: "fields", label: "Quản lý sân", icon: MapPin, path: "/owner/fields" },
          { id: "bookings", label: "Quản lý booking", icon: Calendar, path: "/owner/bookings" },
          { id: "pricing", label: "Quản lý giá", icon: DollarSign, path: "/owner/pricing" },
          { id: "schedule", label: "Quản lý lịch", icon: Clock, path: "/owner/schedule" },
          { id: "reports", label: "Báo cáo doanh thu", icon: TrendingUp, path: "/owner/reports" },
          { id: "policies", label: "Chính sách hủy", icon: Shield, path: "/owner/policies" },
          { id: "payments", label: "Theo dõi thanh toán", icon: CreditCard, path: "/owner/payments" },
          { id: "notifications", label: "Thông báo", icon: Bell, path: "/owner/notifications" },
     ];

     const handleLogout = () => {
          onLoggedOut();
          navigate("/");
     };

     return (
          <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                         {/* Logo */}
                         <div className="flex items-center">
                              <div className="flex-shrink-0 hover:cursor-pointer flex items-center">
                                   <Link to="/">
                                        <img src={logo} alt="Logo" className="h-12 hover:scale-105 transition-all duration-300" />
                                   </Link>
                              </div>
                              <div className="ml-4">
                                   <h1 className="text-xl font-bold text-gray-900">Owner Panel</h1>
                                   <p className="text-sm text-gray-500">Quản lý sân bóng</p>
                              </div>
                         </div>

                         {/* Desktop Navigation */}
                         <nav className="hidden lg:flex space-x-1">
                              {ownerMenuItems.map((item) => {
                                   const Icon = item.icon;
                                   const isActive = location.pathname === item.path;

                                   return (
                                        <Button
                                             key={item.id}
                                             onClick={() => navigate(item.path)}
                                             className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                                  ? "bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg"
                                                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                                  }`}
                                        >
                                             <Icon className="w-4 h-4 mr-2" />
                                             {item.label}
                                        </Button>
                                   );
                              })}
                         </nav>

                         {/* User Menu */}
                         <div className="flex items-center space-x-4">
                              {user && (
                                   <div className="relative">
                                        <Button
                                             onClick={() => setIsProfileOpen(!isProfileOpen)}
                                             className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                             <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                                                  <User className="w-4 h-4 text-white" />
                                             </div>
                                             <span className="hidden md:block text-gray-700">{user.name || "Chủ sân"}</span>
                                             <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                                  Chủ sân
                                             </span>
                                        </Button>

                                        {/* Profile Dropdown */}
                                        {isProfileOpen && (
                                             <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200">
                                                  <div className="px-4 py-3 border-b border-gray-100">
                                                       <p className="text-sm font-medium text-gray-900">{user.name || `@${user.username}`}</p>
                                                       {user.name && <p className="text-xs text-gray-500">@{user.username}</p>}
                                                       {user.email && (
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                 {user.emailVerified ? "✓ Email đã xác thực" : "⚠ Email chưa xác thực"}
                                                            </p>
                                                       )}
                                                  </div>

                                                  <div className="py-1">
                                                       <Button
                                                            onClick={() => {
                                                                 navigate("/profile");
                                                                 setIsProfileOpen(false);
                                                            }}
                                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 p-0 h-auto bg-transparent border-0 justify-start"
                                                       >
                                                            <Settings className="w-4 h-4 mr-3" />
                                                            Cài đặt tài khoản
                                                       </Button>

                                                       <Button
                                                            onClick={() => {
                                                                 navigate("/");
                                                                 setIsProfileOpen(false);
                                                            }}
                                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 p-0 h-auto bg-transparent border-0 justify-start"
                                                       >
                                                            <Home className="w-4 h-4 mr-3" />
                                                            Về trang chủ
                                                       </Button>

                                                       <Button
                                                            onClick={() => {
                                                                 handleLogout();
                                                                 setIsProfileOpen(false);
                                                            }}
                                                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 p-0 h-auto bg-transparent border-0 justify-start"
                                                       >
                                                            <LogOut className="w-4 h-4 mr-3" />
                                                            Đăng xuất
                                                       </Button>
                                                  </div>
                                             </div>
                                        )}
                                   </div>
                              )}

                              {/* Mobile menu button */}
                              <Button
                                   onClick={() => setIsMenuOpen(!isMenuOpen)}
                                   className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                              >
                                   {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                              </Button>
                         </div>
                    </div>

                    {/* Mobile Navigation */}
                    {isMenuOpen && (
                         <div className="lg:hidden border-t border-gray-200">
                              <div className="px-2 pt-2 pb-3 space-y-1">
                                   {ownerMenuItems.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = location.pathname === item.path;

                                        return (
                                             <Button
                                                  key={item.id}
                                                  onClick={() => {
                                                       navigate(item.path);
                                                       setIsMenuOpen(false);
                                                  }}
                                                  className={`flex items-center w-full px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 ${isActive
                                                       ? "bg-gradient-to-r from-blue-500 to-green-500 text-white"
                                                       : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                                       }`}
                                             >
                                                  <Icon className="w-5 h-5 mr-3" />
                                                  {item.label}
                                             </Button>
                                        );
                                   })}
                              </div>
                         </div>
                    )}
               </div>
          </header>
     );
}
