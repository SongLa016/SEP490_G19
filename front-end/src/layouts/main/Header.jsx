import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, User, Menu, X, LogOut, Settings, Home, MapPin, Calendar, Users, BarChart3, LogIn } from "lucide-react";
import logo from "../../components/assets/logo.png";
import { Button } from "../../components/ui";
import { useModal } from "../../contexts/ModalContext";
import { NotificationBell, NotificationDropdown } from "../../components/NotificationsDisplay";
export default function Header({ user, onLoggedOut }) {
     const [isMenuOpen, setIsMenuOpen] = useState(false);
     const [isProfileOpen, setIsProfileOpen] = useState(false);
     const [isNotificationOpen, setIsNotificationOpen] = useState(false);
     const navigate = useNavigate();
     const location = useLocation();
     const { isBookingModalOpen } = useModal();

     const getRoleDisplayName = (role) => {
          switch (role) {
               case "User": return "Người chơi";
               case "FieldOwner": return "Chủ sân";
               case "Admin": return "Quản trị viên";
               default: return "Khách";
          }
     };

     const getRoleColor = (role) => {
          switch (role) {
               case "User": return "bg-blue-100 text-blue-800";
               case "FieldOwner": return "bg-green-100 text-green-800";
               case "Admin": return "bg-red-100 text-red-800";
               default: return "bg-gray-100 text-gray-800";
          }
     };

     const getNavigationItems = () => {
          if (!user) {
               return [
                    { id: "home", label: "Home", icon: Home },
                    { id: "search", label: "Danh sách sân", icon: Search },
                    { id: "community", label: "Community", icon: Users },
               ];
          }

          const baseItems = [
               { id: "home", label: "Home", icon: Home },
               { id: "search", label: "Danh sách sân", icon: Search },
          ];

          if (user.role === "User") {
               return [
                    ...baseItems,
                    { id: "bookings", label: "Bookings", icon: Calendar },
                    { id: "community", label: "Community", icon: Users },
               ];
          } else if (user.role === "FieldOwner") {
               return [
                    ...baseItems,
                    { id: "my-fields", label: "My Fields", icon: MapPin },
                    { id: "bookings", label: "Bookings", icon: Calendar },
                    { id: "reports", label: "Reports", icon: BarChart3 },
                    { id: "community", label: "Community", icon: Users },
                    { id: "reports", label: "Reports", icon: BarChart3 },
               ];
          } else if (user.role === "Admin") {
               return [
                    ...baseItems,
                    { id: "users", label: "Users", icon: Users },
                    { id: "fields", label: "Fields", icon: MapPin },
                    { id: "reports", label: "Reports", icon: BarChart3 },
                    { id: "community", label: "Community", icon: Users },

               ];
          }

          return baseItems;
     };

     const navigationItems = getNavigationItems();

     return (
          <header className={`bg-transparent backdrop-blur-sm rounded-b-2xl border-b border-teal-500 fixed top-0 left-0 right-0 z-50 shadow-sm transition-transform duration-300 ${isBookingModalOpen ? '-translate-y-full' : 'translate-y-0'}`}>
               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                         {/* Logo */}
                         <div className="flex items-center">
                              <div className="flex-shrink-0 hover:cursor-pointer flex items-center">
                                   <a href="/"><img src={logo} alt="Logo" className="h-36 hover:scale-105 transition-all duration-300" /></a>
                              </div>
                         </div>

                         {/* Desktop Navigation */}
                         <nav className="hidden md:flex space-x-8">
                              {navigationItems.map((item) => {
                                   const Icon = item.icon;
                                   return (
                                        <Button
                                             key={item.id}
                                             onClick={() => navigate(`/${item.id}`)}
                                             className={`flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-colors ${location.pathname === `/${item.id}`
                                                  ? "text-white border-b-teal-500 border-b-2"
                                                  : "text-white hover:border-b-2 hover:border-teal-500"
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
                                                  <span className="hidden md:block text-gray-700">{user.name}</span>
                                                  <span className={`px-2 py-1 rounded-full text-xs ${getRoleColor(user.role)}`}>
                                                       {getRoleDisplayName(user.role)}
                                                  </span>
                                             </Button>

                                             {/* Profile Dropdown */}
                                             {isProfileOpen && (
                                                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                                                       <div className="px-4 py-2 border-b">
                                                            <p className="text-sm font-medium text-gray-900">{user.name || `@${user.username}`}</p>
                                                            {user.name && <p className="text-xs text-gray-500">@{user.username}</p>}
                                                            {user.email && (
                                                                 <p className="text-xs text-gray-400">{user.emailVerified ? "✓ Email đã xác thực" : "⚠ Email chưa xác thực"}</p>
                                                            )}
                                                            {!user.name && (
                                                                 <p className="text-xs text-gray-400">Cập nhật thông tin trong profile</p>
                                                            )}
                                                       </div>
                                                       <Button
                                                            onClick={() => {
                                                                 navigate("/profile");
                                                                 setIsProfileOpen(false);
                                                            }}
                                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 p-0 h-auto bg-transparent border-0"
                                                       >
                                                            <Settings className="w-4 h-4 mr-2" />
                                                            Settings
                                                       </Button>
                                                       <Button
                                                            onClick={() => {
                                                                 onLoggedOut();
                                                                 setIsProfileOpen(false);
                                                            }}
                                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 p-0 h-auto bg-transparent border-0"
                                                       >
                                                            <LogOut className="w-4 h-4 mr-2" />
                                                            Logout
                                                       </Button>
                                                  </div>
                                             )}
                                        </div>
                                   </>
                              ) : (
                                   <div className="flex items-center gap-2">
                                        <Button
                                             onClick={() => navigate("/auth")}
                                             className="flex items-center space-x-2 border-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 bg-transparent text-white px-4 py-2 rounded-full text-sm font-medium hover:border-b-2 hover:border-teal-500 hover:cursor-pointer hover:scale-105 hover:bg-transparent hover:text-white transition-colors"
                                        >
                                             Login
                                             <LogIn className="w-5 h-5 ml-2" />
                                        </Button>
                                        <Button
                                             onClick={() => navigate("/auth")}
                                             className="bg-teal-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-teal-600 transition-colors"
                                        >
                                             Register
                                        </Button>
                                   </div>
                              )}

                              {/* Mobile menu button */}
                              <Button
                                   onClick={() => setIsMenuOpen(!isMenuOpen)}
                                   className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
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
                                             <Button
                                                  key={item.id}
                                                  onClick={() => {
                                                       navigate(`/${item.id}`);
                                                       setIsMenuOpen(false);
                                                  }}
                                                  className={`flex items-center w-full px-3 py-2 rounded-md text-base font-medium ${location.pathname === `/${item.id}`
                                                       ? "bg-teal-100 text-teal-700"
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
          </header >
     );
}
