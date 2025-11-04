import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Search, User, Menu, X, LogOut, Settings, Home, MapPin, Calendar, Users, BarChart3, LogIn } from "lucide-react";
import logo from "../../../../shared/components/assets/logo.png";
import { Button } from "../../../../shared/components/ui";
import { useModal } from "../../../../contexts/ModalContext";
import { NotificationBell, NotificationDropdown } from "../../../../shared/components/NotificationsDisplay";
import { roleMapping } from "../../../../shared/index";
export default function Header({ user, onLoggedOut }) {
     const [isMenuOpen, setIsMenuOpen] = useState(false);
     const [isProfileOpen, setIsProfileOpen] = useState(false);
     const [isNotificationOpen, setIsNotificationOpen] = useState(false);
     const [isScrolled, setIsScrolled] = useState(false);
     const navigate = useNavigate();
     const location = useLocation();
     const { isBookingModalOpen } = useModal();

     useEffect(() => {
          const handleScroll = () => {
               const scrollPosition = window.scrollY;
               setIsScrolled(scrollPosition > 50);
          };

          window.addEventListener("scroll", handleScroll);
          return () => window.removeEventListener("scroll", handleScroll);
     }, []);

     const getRoleDisplayName = (role) => {
          if (role && roleMapping.isValidRoleName(role)) {
               return roleMapping.getRoleDisplayName(roleMapping.getRoleID(role));
          }
          return "Khách";
     };

     const getRoleColor = (role) => {
          if (role && roleMapping.isValidRoleName(role)) {
               return roleMapping.getRoleColor(roleMapping.getRoleID(role));
          }
          return "bg-gray-100 text-gray-800";
     };

     const getNavigationItems = () => {
          if (!user) {
               return [
                    { id: "home", label: "Trang chủ", icon: Home },
                    { id: "search", label: "Danh sách sân", icon: Search },
                    { id: "community", label: "Cộng đồng", icon: Users },
               ];
          }

          const baseItems = [
               { id: "home", label: "Trang chủ", icon: Home },
               { id: "search", label: "Danh sách sân", icon: Search },
          ];

          if (user.roleName === "Player") {
               return [
                    ...baseItems,
                    { id: "bookings", label: "Đặt sân", icon: Calendar },
                    { id: "community", label: "Cộng đồng", icon: Users },
               ];
          } else if (user.roleName === "Owner") {
               return [
                    ...baseItems,
                    { id: "owner", label: "Sân của tôi", icon: MapPin },
                    { id: "owner/bookings", label: "Đặt sân", icon: Calendar },
                    { id: "owner/reports", label: "Báo cáo", icon: BarChart3 },
                    { id: "community", label: "Cộng đồng", icon: Users },
               ];
          } else if (user.roleName === "Admin") {
               return [
                    ...baseItems,
                    { id: "admin/users", label: "Người dùng", icon: Users },
                    { id: "admin", label: "Trang quản trị", icon: MapPin },
                    { id: "community", label: "Cộng đồng", icon: Users },
               ];
          }

          return baseItems;
     };

     const navigationItems = getNavigationItems();

     return (
          <header className={`${isScrolled ? 'bg-white/70' : 'bg-transparent'} backdrop-blur-sm rounded-b-2xl border-b border-teal-500 fixed top-0 left-0 right-0 z-50 shadow-sm transition-all duration-300 ${isBookingModalOpen ? '-translate-y-full' : 'translate-y-0'}`}>
               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                         {/* Logo */}
                         <div className="flex items-center">
                              <div className="flex-shrink-0 hover:cursor-pointer flex items-center">
                                   <Link to="/">
                                        <img src={logo} alt="Logo" className="h-36 hover:scale-105 transition-all duration-300" />
                                   </Link>
                              </div>
                         </div>

                         {/* Desktop Navigation */}
                         <nav className="hidden md:flex space-x-8">
                              {navigationItems.map((item) => {
                                   const Icon = item.icon;
                                   return (
                                        <Link
                                             key={item.id}
                                             to={`/${item.id}`}
                                             className={`flex items-center px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${location.pathname === `/${item.id}`
                                                  ? `${isScrolled ? 'text-teal-600  border-b-teal-600' : 'text-white border-b-teal-500'} border-b-2`
                                                  : `${isScrolled ? 'text-gray-700 hover:text-teal-600' : 'text-white'} hover:border-b-2 hover:border-teal-500`
                                                  }`}
                                        >
                                             <Icon className="w-4 h-4 mr-2" />
                                             {item.label}
                                        </Link>
                                   );
                              })}
                         </nav>

                         {/* User Menu */}
                         <div className="flex items-center space-x-4">
                              {user ? (
                                   <>
                                        {/* Notification Bell */}
                                        <div className="relative">
                                             <NotificationBell
                                                  userId={user.id}
                                                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                             />
                                             <NotificationDropdown
                                                  userId={user.id}
                                                  isOpen={isNotificationOpen}
                                                  onClose={() => setIsNotificationOpen(false)}
                                             />
                                        </div>

                                        {/* User Profile */}
                                        <div className="relative">
                                             <Button
                                                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                                                  className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                                             >
                                                  <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                                                       <User className="w-4 h-4" />
                                                  </div>
                                                  <span className="hidden md:block text-gray-700">{user.fullName || user.email || "User"}</span>
                                                  <span className={`px-2 py-1 rounded-full text-xs ${getRoleColor(user.roleName)}`}>
                                                       {getRoleDisplayName(user.roleName)}
                                                  </span>
                                             </Button>

                                             {/* Profile Dropdown */}
                                             {isProfileOpen && (
                                                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                                                       <div className="px-4 py-2 border-b">
                                                            <p className="text-sm font-medium text-gray-900">{user.fullName || user.email || "User"}</p>
                                                            {user.email && (
                                                                 <p className="text-xs text-gray-500">{user.email}</p>
                                                            )}
                                                            <p className="text-xs text-gray-400">{getRoleDisplayName(user.roleName)}</p>
                                                       </div>
                                                       <Button
                                                            onClick={() => {
                                                                 navigate("/profile");
                                                                 setIsProfileOpen(false);
                                                            }}
                                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 p-0 h-auto bg-transparent border-0"
                                                       >
                                                            <Settings className="w-4 h-4 mr-2" />
                                                            Cài đặt
                                                       </Button>
                                                       <Button
                                                            onClick={() => {
                                                                 onLoggedOut();
                                                                 setIsProfileOpen(false);
                                                            }}
                                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 p-0 h-auto bg-transparent border-0"
                                                       >
                                                            <LogOut className="w-4 h-4 mr-2" />
                                                            Đăng xuất
                                                       </Button>
                                                  </div>
                                             )}
                                        </div>
                                   </>
                              ) : (
                                   <div className="flex items-center gap-2">
                                        <Button
                                             onClick={() => {
                                                  navigate("/auth");
                                             }}
                                             className={`flex items-center space-x-2 border-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 bg-transparent px-4 py-2 rounded-full text-sm font-medium hover:border-b-2 hover:border-teal-500 hover:cursor-pointer hover:scale-105 transition-colors ${isScrolled ? 'text-gray-700 hover:text-teal-600' : 'text-white hover:bg-transparent hover:text-white'}`}
                                        >
                                             Đăng nhập
                                             <LogIn className="w-5 h-5 ml-2" />
                                        </Button>
                                        <Button
                                             onClick={() => {
                                                  navigate("/auth");
                                             }}
                                             className="bg-teal-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-teal-600 transition-colors"
                                        >
                                             Đăng ký
                                        </Button>
                                   </div>
                              )}

                              {/* Mobile menu button */}
                              <Button
                                   onClick={() => setIsMenuOpen(!isMenuOpen)}
                                   className={`md:hidden  inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-100 transition-colors ${isScrolled ? 'text-gray-700  hover:text-gray-900' : 'text-gray-400 hover:text-gray-500'}`}
                              >
                                   {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                              </Button>
                         </div>
                    </div>

                    {/* Mobile Navigation */}
                    {isMenuOpen && (
                         <div className="md:hidden">
                              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
                                   {navigationItems.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                             <Link
                                                  key={item.id}
                                                  to={`/${item.id}`}
                                                  onClick={() => setIsMenuOpen(false)}
                                                  className={`flex items-center w-full px-3 py-2 rounded-md text-base font-medium ${location.pathname === `/${item.id}`
                                                       ? "bg-teal-100 text-teal-700"
                                                       : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                                       }`}
                                             >
                                                  <Icon className="w-5 h-5 mr-3" />
                                                  {item.label}
                                             </Link>
                                        );
                                   })}
                              </div>
                         </div>
                    )}
               </div>
          </header >
     );
}
