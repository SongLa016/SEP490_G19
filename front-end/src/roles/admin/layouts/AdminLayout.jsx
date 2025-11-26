import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
     Home,
     Users,
     Bell,
     AlertTriangle,
     FileText,
     LogOut,
     Menu,
     ChevronLeft,
     ChevronRight,
     Shield,
     Settings,
     UserCheck
} from "lucide-react";
import { Button } from "../../../shared/components/ui";
import logo from "../../../shared/components/assets/logo.png";
import ScrollProgressBar from "../../../shared/components/ScrollProgressBar";

export default function AdminLayout({ user, onLoggedOut, children }) {
     const [sidebarOpen, setSidebarOpen] = useState(false);
     const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
     const location = useLocation();
     const navigate = useNavigate();

     const handleLogout = () => {
          if (onLoggedOut) {
               onLoggedOut();
               navigate('/');
          }
     };

     const navigationItems = [
          { id: "admin", label: "Tổng quan", icon: Home, path: "/admin" },
          { id: "users", label: "Quản lý người dùng", icon: Users, path: "/admin/users" },
          { id: "owner-registration", label: "Duyệt đăng ký Owner", icon: UserCheck, path: "/admin/owner-registration" },
          { id: "notifications", label: "Thông báo hệ thống", icon: Bell, path: "/admin/notifications" },
          { id: "violations", label: "Báo cáo vi phạm", icon: AlertTriangle, path: "/admin/violations" },
          { id: "posts", label: "Quản lý bài viết", icon: FileText, path: "/admin/posts" },
          { id: "settings", label: "Cài đặt hệ thống", icon: Settings, path: "/admin/system-settings" },
     ];

     const handleNavigation = (path) => {
          navigate(path);
          setSidebarOpen(false);
     };

     return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
               <ScrollProgressBar />
               <div className="flex flex-1">
                    {/* Sidebar */}
                    <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${sidebarCollapsed ? 'w-16' : 'w-64'} fixed inset-y-0 left-0 z-50 bg-white/95 backdrop-blur-lg shadow-2xl transform transition-all duration-500 ease-in-out lg:translate-x-0 lg:inset-0 lg:sticky lg:top-0 lg:h-screen border-r border-slate-200/50 flex flex-col`}>
                         {/* Header */}
                         <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200/50 bg-gradient-to-r from-red-50 to-pink-50 sticky top-0 z-10">
                              <div className="flex items-center">
                                   <div className="w-10 h-10 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center shadow-lg">
                                        <img src={logo} alt="Logo" className="w-6 h-6" />
                                   </div>
                                   {!sidebarCollapsed && (
                                        <div className="ml-3">
                                             <span className="text-lg font-bold bg-gradient-to-r from-red-700 to-pink-700 bg-clip-text text-transparent">
                                                  Admin Panel
                                             </span>
                                             <p className="text-xs text-slate-500 font-medium">Management System</p>
                                        </div>
                                   )}
                              </div>
                              <div className="flex items-center ml-2">
                                   <Button
                                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                        className="text-red-600 border p-2 border-red-200 hover:text-red-800 hover:bg-red-100 transition-all duration-300 ease-in-out rounded-full hover:scale-105"
                                        variant="ghost"
                                        size="sm"
                                   >
                                        {sidebarCollapsed ?
                                             <ChevronRight className="w-4 h-4 text-red-600" /> :
                                             <ChevronLeft className="w-4 h-4 text-red-600" />
                                        }
                                   </Button>
                              </div>
                         </div>

                         {/* Admin Badge */}
                         {!sidebarCollapsed && (
                              <div className="px-4 py-3 bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-200/50">
                                   <div className="flex items-center">
                                        <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                                             <Shield className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                             <span className="text-sm font-bold text-red-800">Quản trị viên</span>
                                             <p className="text-xs text-red-700 mt-0.5 font-medium">Quyền cao nhất</p>
                                        </div>
                                   </div>
                              </div>
                         )}

                         {/* Navigation */}
                         <nav className="px-3 py-2 flex-1 overflow-y-auto">
                              <div className="space-y-1">
                                   {navigationItems.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = location.pathname === item.path;

                                        return (
                                             <Button
                                                  key={item.id}
                                                  onClick={() => handleNavigation(item.path)}
                                                  className={`w-full justify-start px-3 py-2 text-sm rounded-xl font-medium transition-colors ${isActive
                                                       ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:text-red-900 scale-105'
                                                       : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                                       } ${sidebarCollapsed ? 'px-2' : ''}`}
                                                  variant="ghost"
                                                  title={sidebarCollapsed ? item.label : undefined}
                                             >
                                                  <Icon className={`w-5 h-5 transition-all duration-300 ${isActive ? 'text-red-700' : 'text-slate-600 group-hover:text-slate-800'
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
                                   <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
                                        <span className="text-sm font-bold text-white">
                                             {user?.name?.charAt(0) || 'A'}
                                        </span>
                                   </div>
                                   {!sidebarCollapsed && (
                                        <div className="ml-3 flex-1">
                                             <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                                             <p className="text-xs text-slate-500 font-medium">{user?.email}</p>
                                        </div>
                                   )}
                                   <Button
                                        onClick={handleLogout}
                                        variant="ghost"
                                        size="sm"
                                        className="rounded-full hover:bg-red-50 hover:text-red-600 transition-all duration-300 ml-auto"
                                        title={sidebarCollapsed ? "Đăng xuất" : undefined}
                                   >
                                        <LogOut className="w-4 h-4" />
                                   </Button>
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
                                   <div className="flex items-center space-x-2 text-sm text-slate-600 bg-gradient-to-r from-red-50 to-pink-50 px-3 py-1.5 rounded-full border border-red-200/50">
                                        <Shield className="w-4 h-4 text-red-600" />
                                        <span className="font-medium">Admin Mode</span>
                                   </div>
                              </div>
                         </div>

                         {/* Page Content */}
                         <main className="flex-1 p-6 bg-cover bg-center bg-no-repeat bg-[url('https://mixivivu.com/section-background.png')]">
                              {children}
                         </main>
                    </div>
               </div>
          </div>
     );
}
