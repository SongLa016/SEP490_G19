import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { Search, LogOut, Settings, Home, MapPin, Calendar, Users, BarChart3, LogIn } from "lucide-react";
import { Button, Avatar, AvatarImage, AvatarFallback } from "../../../../../shared/components/ui";
import { NotificationBell, NotificationDropdown } from "../../../../../shared/components/NotificationsDisplay";
import logo from "../../../../../shared/components/assets/logo.png";
import { getUserAvatarAndName } from "./utils";

export default function CommunityHeader({ user, onLoggedOut }) {
     const [isProfileOpen, setIsProfileOpen] = useState(false);
     const [isNotificationOpen, setIsNotificationOpen] = useState(false);
     const navigate = useNavigate();
     const location = useLocation();
     const headerRef = useRef(null);
     const { avatarUrl, initial } = getUserAvatarAndName(user);

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
               { id: "bookings", label: "Đặt sân", icon: Calendar },
               { id: "community", label: "Cộng đồng", icon: Users },
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

     // Floating particles animation
     useEffect(() => {
          if (!headerRef.current) return;

          const particles = [];
          const particleCount = 15;

          for (let i = 0; i < particleCount; i++) {
               const particle = document.createElement('div');
               particle.style.position = 'absolute';
               particle.style.width = '4px';
               particle.style.height = '4px';
               particle.style.borderRadius = '50%';
               particle.style.background = `rgba(20, 184, 166, ${Math.random() * 0.5 + 0.2})`;
               particle.style.left = `${Math.random() * 16}px`;
               particle.style.top = `${Math.random() * 100}%`;
               particle.style.pointerEvents = 'none';
               headerRef.current.appendChild(particle);
               particles.push(particle);

               gsap.to(particle, {
                    y: `+=${Math.random() * 200 + 100}`,
                    x: `+=${Math.random() * 40 - 20}`,
                    opacity: Math.random() * 0.5 + 0.3,
                    duration: Math.random() * 3 + 2,
                    repeat: -1,
                    yoyo: true,
                    ease: "power1.inOut",
               });
          }

          return () => {
               particles.forEach(p => p.remove());
          };
     }, []);

     return (
          <motion.div
               ref={headerRef}
               className="hidden md:flex fixed justify-center left-0 top-0 rounded-lg w-16 h-full border-r border-gray-200 flex-col items-center py-4 z-10 overflow-visible"
               initial={{ x: -64 }}
               animate={{ x: 0 }}
               transition={{ duration: 0.5, ease: "easeOut" }}
          >
               {/* Logo với Animation */}
               <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
               >
                    <motion.div
                         className="w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center hover:cursor-pointer"
                         whileHover={{ scale: 1.1, rotate: 5 }}
                         whileTap={{ scale: 0.95 }}
                    >
                         <Link to="/">
                              <motion.img
                                   src={logo}
                                   alt="logo"
                                   className="w-20 h-14"
                                   animate={{
                                        filter: [
                                             "drop-shadow(0 0 0px rgba(20, 184, 166, 0))",
                                             "drop-shadow(0 0 10px rgba(20, 184, 166, 0.5))",
                                             "drop-shadow(0 0 0px rgba(20, 184, 166, 0))",
                                        ],
                                   }}
                                   transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                   }}
                              />
                         </Link>
                    </motion.div>
               </motion.div>

               {/* Navigation Items với Stagger Animation */}
               <div className="flex flex-col items-center space-y-4">
                    {navigationItems.map((item, index) => {
                         const Icon = item.icon;
                         const isActive = location.pathname === `/${item.id}`;
                         return (
                              <motion.div
                                   key={item.id}
                                   initial={{ opacity: 0, x: -20 }}
                                   animate={{ opacity: 1, x: 0 }}
                                   transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                              >
                                   <motion.div
                                        whileHover={{ scale: 1.1, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        animate={isActive ? {
                                             boxShadow: [
                                                  "0 0 0px rgba(20, 184, 166, 0)",
                                                  "0 0 10px rgba(20, 184, 166, 0.6)",
                                                  "0 0 0px rgba(20, 184, 166, 0)",
                                             ],
                                        } : {}}
                                        transition={{
                                             boxShadow: {
                                                  duration: 2,
                                                  repeat: Infinity,
                                                  ease: "easeInOut",
                                             },
                                        }}
                                   >
                                        <Button
                                             onClick={() => navigate(`/${item.id}`)}
                                             className={`p-1 w-10 h-10 rounded-xl transition-colors border-none shadow-none outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 ${isActive
                                                  ? "bg-teal-800 text-white hover:bg-teal-900"
                                                  : "text-gray-500 hover:text-gray-700 bg-transparent hover:bg-teal-100"
                                                  }`}
                                             title={item.label}
                                        >
                                             <motion.div
                                                  animate={isActive ? { rotate: [0, -5, 5, 0] } : {}}
                                                  transition={{
                                                       duration: 1,
                                                       repeat: Infinity,
                                                       ease: "easeInOut",
                                                  }}
                                             >
                                                  <Icon className="w-6 h-6" />
                                             </motion.div>
                                        </Button>
                                   </motion.div>
                              </motion.div>
                         );
                    })}

                    {/* Notification Bell */}
                    {user && (
                         <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 + navigationItems.length * 0.1, duration: 0.3 }}
                              className="relative"
                         >
                              <motion.div
                                   whileHover={{ scale: 1.1, y: -2 }}
                                   whileTap={{ scale: 0.95 }}
                              >
                                   <NotificationBell
                                        userId={user.id}
                                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                   />
                              </motion.div>
                              <NotificationDropdown
                                   userId={user.id}
                                   isOpen={isNotificationOpen}
                                   onClose={() => setIsNotificationOpen(false)}
                                   className="left-10 right-auto -top-28"
                              />
                         </motion.div>
                    )}
               </div>

               {/* User Profile Section */}
               <div className="mt-auto mb-4">
                    {user ? (
                         <>
                              {/* User Profile */}
                              <div className="relative">
                                   <Button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className="p-3 w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                                        title={user.fullName || user.name || "Profile"}
                                   >
                                        <Avatar className="w-8 h-8">
                                             <AvatarImage src={avatarUrl} />
                                             <AvatarFallback className="bg-gray-300 text-gray-700">
                                                  {initial}
                                             </AvatarFallback>
                                        </Avatar>
                                   </Button>

                                   {/* Profile Dropdown */}
                                   <AnimatePresence>
                                        {isProfileOpen && (
                                             <motion.div
                                                  initial={{ opacity: 0, scale: 0.95, x: -10 }}
                                                  animate={{ opacity: 1, scale: 1, x: 0 }}
                                                  exit={{ opacity: 0, scale: 0.95, x: -10 }}
                                                  transition={{ duration: 0.2 }}
                                                  className="absolute left-16 bottom-0 w-fit bg-white rounded-xl shadow-lg py-1 z-50 border border-gray-200"
                                             >
                                                  <div className="p-2 border-b">
                                                       <p className="text-sm flex truncate items-center gap-2 font-medium text-gray-900">{user.fullName || `@${user.username}`}<span className={`px-2 py-1 rounded-full text-xs ${getRoleColor(user.role)}`}>
                                                            {getRoleDisplayName(user.role)}
                                                       </span></p>
                                                       {/* {user.name && <p className="text-xs text-gray-500">@{user.username}</p>} */}
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
                                             </motion.div>
                                        )}
                                   </AnimatePresence>
                              </div>
                         </>
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
          </motion.div>
     );
}