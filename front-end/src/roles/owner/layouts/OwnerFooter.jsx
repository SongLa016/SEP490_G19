import {
     MapPin,
     Phone,
     Mail,
     Facebook,
     Instagram,
     Twitter,
     Linkedin,
     MessageCircle,
     Shield,
     FileText,
     HelpCircle,
     Users,
     BarChart3
} from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/components/assets/logo.png";

export default function OwnerFooter() {
     return (
          <footer className="bg-gray-900 text-white">
               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                         {/* Company Info */}
                         <div className="col-span-1 md:col-span-2">
                              <div className="flex items-center mb-4">
                                   <img src={logo} alt="Logo" className="hover:scale-105 transition-all duration-300 w-36" />
                              </div>
                              <p className="text-gray-300 mb-4">
                                   Nền tảng quản lý sân bóng đá hàng đầu Việt Nam.
                                   Quản lý sân, booking, doanh thu và khách hàng một cách chuyên nghiệp.
                              </p>
                              <div className="flex space-x-4">
                                   <Link to="#" className="text-gray-400 hover:text-white transition-colors">
                                        <Facebook className="w-5 h-5" />
                                   </Link>
                                   <Link to="#" className="text-gray-400 hover:text-white transition-colors">
                                        <Instagram className="w-5 h-5" />
                                   </Link>
                                   <Link to="#" className="text-gray-400 hover:text-white transition-colors">
                                        <Twitter className="w-5 h-5" />
                                   </Link>
                                   <Link to="#" className="text-gray-400 hover:text-white transition-colors">
                                        <Linkedin className="w-5 h-5" />
                                   </Link>
                                   <Link to="#" className="text-gray-400 hover:text-white transition-colors">
                                        <MessageCircle className="w-5 h-5" />
                                   </Link>
                              </div>
                         </div>

                         {/* Owner Tools */}
                         <div>
                              <h3 className="text-lg font-semibold mb-4 flex items-center">
                                   <BarChart3 className="w-5 h-5 mr-2 text-green-400" />
                                   Công cụ quản lý
                              </h3>
                              <ul className="space-y-2">
                                   <li><Link to="/owner/dashboard" className="text-gray-300 hover:text-white transition-colors">Dashboard</Link></li>
                                   <li><Link to="/owner/fields" className="text-gray-300 hover:text-white transition-colors">Quản lý sân</Link></li>
                                   <li><Link to="/owner/bookings" className="text-gray-300 hover:text-white transition-colors">Quản lý booking</Link></li>
                                   <li><Link to="/owner/reports" className="text-gray-300 hover:text-white transition-colors">Báo cáo doanh thu</Link></li>
                              </ul>
                         </div>

                         {/* Support & Resources */}
                         <div>
                              <h3 className="text-lg font-semibold mb-4 flex items-center">
                                   <HelpCircle className="w-5 h-5 mr-2 text-blue-400" />
                                   Hỗ trợ & Tài nguyên
                              </h3>
                              <div className="space-y-3">
                                   <div className="flex items-center">
                                        <MapPin className="w-4 h-4 mr-2 text-teal-500" />
                                        <span className="text-gray-300">123 Đường ABC, Quận 1, TP.HCM</span>
                                   </div>
                                   <div className="flex items-center">
                                        <Phone className="w-4 h-4 mr-2 text-teal-500" />
                                        <span className="text-gray-300">+84 123 456 789</span>
                                   </div>
                                   <div className="flex items-center">
                                        <Mail className="w-4 h-4 mr-2 text-teal-500" />
                                        <span className="text-gray-300">owner-support@ballspot.vn</span>
                                   </div>
                              </div>

                              <div className="mt-4 space-y-2">
                                   <Link to="#" className="text-gray-300 hover:text-white transition-colors flex items-center">
                                        <FileText className="w-4 h-4 mr-2" />
                                        Hướng dẫn sử dụng
                                   </Link>
                                   <Link to="#" className="text-gray-300 hover:text-white transition-colors flex items-center">
                                        <Users className="w-4 h-4 mr-2" />
                                        Cộng đồng chủ sân
                                   </Link>
                                   <Link to="/privacy-policy" className="text-gray-300 hover:text-white transition-colors flex items-center">
                                        <Shield className="w-4 h-4 mr-2" />
                                        Chính sách bảo mật
                                   </Link>
                              </div>
                         </div>
                    </div>

                    <div className="border-t border-gray-800 mt-8 pt-8">
                         <div className="flex flex-col md:flex-row justify-between items-center">
                              <p className="text-gray-400 text-sm">
                                   © 2025 BallSpot Owner Panel. Tất cả quyền được bảo lưu.
                              </p>
                              <div className="flex space-x-6 mt-4 md:mt-0">
                                   <Link to="/terms-of-service" className="text-gray-400 hover:text-white text-sm transition-colors">
                                        Điều khoản dịch vụ
                                   </Link>
                                   <Link to="/privacy-policy" className="text-gray-400 hover:text-white text-sm transition-colors">
                                        Chính sách bảo mật
                                   </Link>
                              </div>
                         </div>
                    </div>
               </div>
          </footer>
     );
}
