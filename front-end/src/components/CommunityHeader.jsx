import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Search, User, LogOut, Settings, Home, MapPin, Calendar, Users, BarChart3, LogIn } from "lucide-react";
import { Button } from "./ui";
import logo from "./assets/logo.png";

export default function CommunityHeader({ user, onLoggedOut }) {
     const [isProfileOpen, setIsProfileOpen] = useState(false);
     const navigate = useNavigate();
     const location = useLocation();

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
          <div className="fixed justify-center left-0 top-0 w-16 h-full bg-white border-r border-gray-200 flex flex-col items-center py-4 z-10">
               {/* Logo */}
               <div className="mb-8">
                    <div className="w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center hover:cursor-pointer">

                         <Link to="/"> <img src={logo} alt="logo" className="w-20 h-14" /></Link>
                    </div>
               </div>

               {/* Navigation Items */}
               <div className="flex flex-col items-center space-y-4">

                    {navigationItems.map((item) => {
                         const Icon = item.icon;
                         const isActive = location.pathname === `/${item.id}`;
                         return (
                              <Button
                                   key={item.id}
                                   onClick={() => navigate(`/${item.id}`)}
                                   className={`p-1 w-10 h-10 rounded-xl transition-colors ${isActive
                                        ? "bg-teal-800 text-white hover:bg-teal-900"
                                        : "text-gray-500 hover:text-gray-700 bg-transparent hover:bg-teal-100"
                                        }`}
                                   title={item.label}
                              >
                                   <Icon className="w-6 h-6" />
                              </Button>
                         );
                    })}
               </div>


               {/* User Profile Section */}
               <div className="mt-auto mb-4">
                    {user ? (
                         <div className="relative">
                              <Button
                                   onClick={() => setIsProfileOpen(!isProfileOpen)}
                                   className="p-3 w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                                   title={user.name || "Profile"}
                              >
                                   <User className="w-6 h-6 text-gray-700" />
                              </Button>

                              {/* Profile Dropdown */}
                              {isProfileOpen && (
                                   <div className="absolute left-16 bottom-0 w-56 bg-white rounded-xl shadow-lg py-1 z-50 border border-gray-200">
                                        <div className="p-2 border-b">
                                             <p className="text-sm flex items-center gap-2 font-medium text-gray-900">{user.name || `@${user.username}`}<span className={`px-2 py-1 rounded-full text-xs ${getRoleColor(user.role)}`}>
                                                  {getRoleDisplayName(user.role)}
                                             </span></p>
                                             {user.name && <p className="text-xs text-gray-500">@{user.username}</p>}

                                        </div>
                                        <Button
                                             onClick={() => {
                                                  navigate("/profile");
                                                  setIsProfileOpen(false);
                                             }}
                                             className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-teal-100 hover:text-teal-800 p-0 h-auto bg-transparent border-0"
                                        >
                                             <Settings className="w-4 h-4 mr-2" />
                                             Settings
                                        </Button>
                                        <Button
                                             onClick={() => {
                                                  onLoggedOut();
                                                  setIsProfileOpen(false);
                                             }}
                                             className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-teal-100 hover:text-teal-800 p-0 h-auto bg-transparent border-0"
                                        >
                                             <LogOut className="w-4 h-4 mr-2" />
                                             Logout
                                        </Button>
                                   </div>
                              )}
                         </div>
                    ) : (
                         <Button
                              onClick={() => navigate("/auth")}
                              className="p-3 w-12 h-12 rounded-xl bg-gray-900 hover:bg-gray-800 text-white transition-colors"
                              title="Login"
                         >
                              <LogIn className="w-6 h-6" />
                         </Button>
                    )}
               </div>
          </div>
     );
}
