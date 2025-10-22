import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
     Home,
     Building2,
     DollarSign,
     Clock,
     ClipboardList,
     FileText,
     LineChart,
     Shield,
     CalendarCog,
     Bell,
     LogOut,
     Menu,
     X,
     Eye,
     ChevronLeft,
     ChevronRight
} from "lucide-react";
import { Button } from "../../components/ui";
import logo from "../../components/assets/logo.png";
import crosslineDots from "../../components/assets/crossline-dots.png";

export default function OwnerLayout({ user, onLoggedOut, children, isDemo = false }) {
     const [sidebarOpen, setSidebarOpen] = useState(false);
     const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
     const location = useLocation();
     const navigate = useNavigate();

     // Mock user for demo mode
     const demoUser = {
          name: "Demo Owner",
          email: "demo@example.com",
          role: "FieldOwner"
     };

     const currentUser = isDemo ? demoUser : user;

     const navigationItems = [
          { id: "owner", label: "Tổng quan", icon: Home, path: "/owner" },
          { id: "fields", label: "Quản lý sân", icon: Building2, path: "/owner/fields" },
          { id: "pricing", label: "Giá theo slot", icon: DollarSign, path: "/owner/pricing" },
          { id: "bookings", label: "Quản lý booking", icon: ClipboardList, path: "/owner/bookings" },
          { id: "reports", label: "Báo cáo doanh thu", icon: FileText, path: "/owner/reports" },
          { id: "policies", label: "Chính sách hủy", icon: Shield, path: "/owner/policies" },
          { id: "promotions", label: "Khuyến mãi", icon: CalendarCog, path: "/owner/promotions" },
          { id: "notifications", label: "Thông báo", icon: Bell, path: "/owner/notifications" },
     ];

     const handleNavigation = (path) => {
          if (isDemo) {
               navigate(path.replace('/owner', '/demo'));
          } else {
               navigate(path);
          }
          setSidebarOpen(false);
     };

     return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
               {/* Sidebar */}
               <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${sidebarCollapsed ? 'w-16' : 'w-64'} fixed inset-y-0 left-0 z-50 bg-white/95 backdrop-blur-lg shadow-2xl transform transition-all duration-500 ease-in-out lg:translate-x-0 lg:inset-0 lg:sticky lg:top-0 lg:h-screen border-r border-slate-200/50 flex flex-col`}>
                    {/* Header */}
                    <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200/50 bg-gradient-to-r from-teal-50 to-emerald-50 sticky top-0 z-10">
                         <div className="flex items-center">
                              <div className="w-10 h-10 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-center shadow-lg">
                                   <img src={logo} alt="Logo" className="w-6 h-6" />
                              </div>
                              {!sidebarCollapsed && (
                                   <div className="ml-3">
                                        <span className="text-lg font-bold bg-gradient-to-r from-teal-700 to-emerald-700 bg-clip-text text-transparent">
                                             {isDemo ? 'Demo Panel' : 'Owner Panel'}
                                        </span>
                                        <p className="text-xs text-slate-500 font-medium">Management System</p>
                                   </div>
                              )}
                         </div>
                         <div className="flex items-center ml-2">
                              {!sidebarCollapsed && (
                                   <Button
                                        onClick={() => setSidebarCollapsed(true)}
                                        className="lg:hidden text-teal-600 p-2 border border-teal-200 hover:text-teal-800 hover:bg-teal-100 transition-all duration-300 ease-in-out rounded-full hover:scale-105"
                                        variant="ghost"
                                        size="sm"
                                   >
                                        <X className="w-4 h-4 text-teal-600" />
                                   </Button>
                              )}
                              <Button
                                   onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                   className="md:hidden lg:flex text-teal-600 border p-2  border-teal-200 hover:text-teal-800 hover:bg-teal-100 transition-all duration-300 ease-in-out rounded-full hover:scale-105"
                                   variant="ghost"
                                   size="sm"
                              >
                                   {sidebarCollapsed ?
                                        <ChevronRight className="w-4 h-4 text-teal-600" /> :
                                        <ChevronLeft className="w-4 h-4 text-teal-600" />
                                   }
                              </Button>
                         </div>
                    </div>

                    {/* Demo Banner */}
                    {isDemo && !sidebarCollapsed && (
                         <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200/50">
                              <div className="flex items-center">
                                   <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                                        <Eye className="w-4 h-4 text-white" />
                                   </div>
                                   <div>
                                        <span className="text-sm font-bold text-amber-800">Chế độ Demo</span>
                                        <p className="text-xs text-amber-700 mt-0.5 font-medium">Dữ liệu mẫu, không thể chỉnh sửa</p>
                                   </div>
                              </div>
                         </div>
                    )}

                    {/* Navigation */}
                    <nav className=" px-3 py-2 flex-1 overflow-y-auto">
                         <div className="space-y-1">
                              {navigationItems.map((item) => {
                                   const Icon = item.icon;
                                   const isActive = location.pathname === item.path ||
                                        (isDemo && location.pathname === item.path.replace('/owner', '/demo'));

                                   return (
                                        <Button
                                             key={item.id}
                                             onClick={() => handleNavigation(item.path)}
                                             className={`w-full justify-start px-3 py-2 text-sm rounded-xl font-medium transition-colors ${isActive
                                                  ? 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 hover:text-teal-900 scale-105'
                                                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                                  } ${sidebarCollapsed ? 'px-2' : ''}`}
                                             variant="ghost"
                                             title={sidebarCollapsed ? item.label : undefined}
                                        >
                                             <Icon className={`w-5 h-5 transition-all duration-300 ${isActive ? 'text-teal-700' : 'text-slate-600 group-hover:text-slate-800'
                                                  } ${sidebarCollapsed ? '' : 'mr-3'}`} />
                                             {!sidebarCollapsed && (
                                                  <span className="font-semibold">{item.label}</span>
                                             )}
                                        </Button>
                                   );
                              })}
                         </div>
                    </nav>

                    {/* User Info */}
                    <div className="sticky bottom-0 p-4 border-t border-slate-200/50 bg-gradient-to-r from-slate-50 to-slate-100 backdrop-blur-sm z-10">
                         <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-600 rounded-xl flex items-center justify-center shadow-md">
                                   <span className="text-sm font-bold text-white">
                                        {currentUser?.name?.charAt(0) || 'O'}
                                   </span>
                              </div>
                              {!sidebarCollapsed && (
                                   <div className="ml-3 flex-1">
                                        <p className="text-sm font-bold text-slate-900">{currentUser?.name}</p>
                                        <p className="text-xs text-slate-500 font-medium">{currentUser?.email}</p>
                                   </div>
                              )}
                              {!isDemo && !sidebarCollapsed && (
                                   <Button
                                        onClick={onLoggedOut}
                                        variant="ghost"
                                        size="sm"
                                        className="rounded-full hover:bg-red-50 hover:text-red-600 transition-all duration-300"
                                   >
                                        <LogOut className="w-4 h-4" />
                                   </Button>
                              )}
                         </div>
                    </div>
               </div>

               {/* Main Content */}
               <div className="flex-1 flex flex-col min-w-0">
                    {/* Top Bar */}
                    <div className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-slate-200/50 px-4 py-1 flex items-center justify-between">
                         <div className="flex items-center space-x-4">
                              <Button
                                   onClick={() => setSidebarOpen(true)}
                                   className="lg:hidden transition-all duration-300 ease-in-out rounded-full hover:bg-slate-100 hover:scale-105"
                                   variant="ghost"
                                   size="sm"
                              >
                                   <Menu className="w-5 h-5 text-slate-600" />
                              </Button>
                         </div>

                         <div className="flex items-center space-x-4">
                              {isDemo && (<>
                                   <div className="flex items-center space-x-2 text-sm text-slate-600 bg-gradient-to-r from-amber-50 to-yellow-50 px-3 py-1.5 rounded-full border border-amber-200/50">
                                        <Eye className="w-4 h-4 text-amber-600" />
                                        <span className="font-medium">Demo Mode</span>
                                   </div>
                                   <Button
                                        onClick={() => navigate('/')}
                                        variant="outline"
                                        size="xs"
                                        className="px-2 py-1 text-slate-600 border border-slate-200 hover:text-slate-800 hover:bg-slate-100 transition-all duration-300 ease-in-out rounded-full hover:scale-105"
                                   >
                                        <span className="font-medium">Về trang chủ</span>
                                   </Button></>)}
                         </div>
                    </div>

                    {/* Page Content */}
                    <main className="flex-1 p-6 bg-cover bg-center bg-no-repeat bg-[url('https://mixivivu.com/section-background.png')]"  >
                         {children}
                    </main>
               </div>
          </div>
     );
}