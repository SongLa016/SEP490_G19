
import { MapPin, Phone, Mail, Facebook, Instagram, Twitter, Linkedin, MessageCircle } from "lucide-react";
import logo from "../../components/assets/logo.png";

export default function Footer() {
     return (
          <footer className="bg-gray-900 text-white">
               <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                         {/* Company Info */}
                         <div className="col-span-1 md:col-span-2">
                              <div className="flex items-center mb-4">
                                   <img src={logo} alt="Logo" className=" hover:scale-105 transition-all duration-300 w-36" />
                              </div>
                              <p className="text-gray-300 mb-4">
                                   Nền tảng kết nối và đặt sân bóng đá hàng đầu Việt Nam.
                                   Tìm sân, đặt sân, kết nối cộng đồng bóng đá một cách dễ dàng.
                              </p>
                              <div className="flex space-x-4">
                                   <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                        <Facebook className="w-5 h-5" />
                                   </a>
                                   <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                        <Instagram className="w-5 h-5" />
                                   </a>
                                   <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                        <Twitter className="w-5 h-5" />
                                   </a>
                                   <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                        <Linkedin className="w-5 h-5" />
                                   </a>
                                   <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                        <MessageCircle className="w-5 h-5" />
                                   </a>


                              </div>
                         </div>

                         {/* Quick Links */}
                         <div>
                              <h3 className="text-lg font-semibold mb-4">Liên kết nhanh</h3>
                              <ul className="space-y-2">
                                   <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Tìm sân</a></li>
                                   <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Đăng ký chủ sân</a></li>
                                   <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Giải đấu</a></li>
                                   <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Cộng đồng</a></li>
                                   <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Blog</a></li>
                              </ul>
                         </div>

                         {/* Contact Info */}
                         <div>
                              <h3 className="text-lg font-semibold mb-4">Liên hệ</h3>
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
                                        <span className="text-gray-300">support@ballspot.vn</span>
                                   </div>
                              </div>
                         </div>
                    </div>

                    <div className="border-t border-gray-800 mt-8 pt-8">
                         <div className="flex flex-col md:flex-row justify-between items-center">
                              <p className="text-gray-400 text-sm">
                                   © 2025 BallSpot. Tất cả quyền được bảo lưu.
                              </p>
                              <div className="flex space-x-6 mt-4 md:mt-0">
                                   <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                                        Điều khoản sử dụng
                                   </a>
                                   <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                                        Chính sách bảo mật
                                   </a>
                                   <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                                        Chính sách hủy
                                   </a>
                              </div>
                         </div>
                    </div>
               </div>
          </footer>
     );
}
