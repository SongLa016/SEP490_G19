import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import logo from '../components/assets/logo.png';
import {
     ArrowRight,
     CheckCircle,
     Star,
     Users,
     Calendar,
     MapPin,
     Clock,
     ShieldCheck,
     Sparkles,
     Search,
     Globe,
     Trophy,
     BarChart3,
     Zap,
     Building2,
     User,
} from 'lucide-react';

const LandingPage = () => {
     const navigate = useNavigate();
     const [selectedPersona, setSelectedPersona] = useState('customer');

     return (
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 text-white relative overflow-hidden">
               {/* Background with parallax effect */}
               <div
                    className="absolute inset-0 opacity-80"
                    style={{
                         backgroundImage:
                              "url('https://backstage.vn/storage/2020/06/Screenshot-8.png')",
                         backgroundSize: 'cover',
                         backgroundPosition: 'center center',
                         backgroundRepeat: 'no-repeat',
                         backgroundAttachment: 'fixed',
                    }}
               ></div>
               <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900/80"></div>

               {/* Main Content */}
               <div className="relative z-10 min-h-screen flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 py-4 lg:px-8">
                         {/* Logo */}
                         <div className="flex items-center justify-start">
                              <img src={logo} alt="BallSpot Logo" className="h-24 w-24" />
                         </div>

                         {/* Persona Toggle - Professional Style */}
                         <div className="hidden sm:flex bg-white/5 backdrop-blur-sm rounded-lg p-1 border border-white/10 justify-center">
                              <Button
                                   onClick={() => setSelectedPersona('customer')}
                                   className={`px-4 py-2 rounded-md transition-all duration-300 flex items-center gap-2 text-sm font-medium ${selectedPersona === 'customer'
                                        ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                                        }`}
                              >
                                   <User className="w-4 h-4" />
                                   Đặt sân
                              </Button>
                              <Button
                                   onClick={() => setSelectedPersona('business')}
                                   className={`px-4 py-2 rounded-md transition-all duration-300 flex items-center gap-2 text-sm font-medium ${selectedPersona === 'business'
                                        ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                                        }`}
                              >
                                   <Building2 className="w-4 h-4" />
                                   Quản lý sân
                              </Button>
                         </div>
                    </div>

                    {/* Mobile Persona Toggle */}
                    <div className="sm:hidden flex justify-center mb-5 px-6">
                         <div className="bg-white/5 backdrop-blur-sm rounded-lg p-1 border border-white/10 w-full max-w-xs">
                              <Button
                                   onClick={() => setSelectedPersona('customer')}
                                   className={`w-full px-4 py-3 rounded-md transition-all duration-300 flex items-center justify-center gap-2 text-sm font-medium ${selectedPersona === 'customer'
                                        ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                                        }`}
                              >
                                   <User className="w-4 h-4" />
                                   Đặt sân
                              </Button>
                              <Button
                                   onClick={() => setSelectedPersona('business')}
                                   className={`w-full px-4 py-3 rounded-md transition-all duration-300 flex items-center justify-center gap-2 text-sm font-medium ${selectedPersona === 'business'
                                        ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                                        }`}
                              >
                                   <Building2 className="w-4 h-4" />
                                   Quản lý sân
                              </Button>
                         </div>
                    </div>

                    {/* Hero Section */}
                    <div className="flex-1 flex items-center justify-center px-6 lg:px-8">
                         <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                              {/* Left Content */}
                              <div className="text-center lg:text-left">
                                   {/* Badge */}
                                   <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-sm font-medium mb-8">
                                        <Sparkles className="w-4 h-4" />
                                        {selectedPersona === 'customer'
                                             ? 'Đặt sân bóng đá dễ dàng'
                                             : 'Quản lý sân bóng chuyên nghiệp'}
                                   </div>

                                   {/* Main Headline */}
                                   <h1 className="text-4xl md:text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-teal-200 to-teal-400 leading-tight">
                                        {selectedPersona === 'customer' ? (
                                             <>
                                                  Tìm và đặt sân
                                                  <br />
                                                  <span className="text-teal-400">nhanh chóng</span>
                                             </>
                                        ) : (
                                             <>
                                                  Quản lý sân bóng
                                                  <br />
                                                  <span className="text-teal-400">thông minh</span>
                                             </>
                                        )}
                                   </h1>

                                   {/* Subtitle */}
                                   <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                                        {selectedPersona === 'customer'
                                             ? 'Tìm sân bóng phù hợp, đặt lịch nhanh chóng với giá tốt nhất và thanh toán an toàn'
                                             : 'Hệ thống quản lý sân bóng toàn diện với booking tự động, thanh toán online và báo cáo chi tiết'}
                                   </p>

                                   {/* CTA Buttons */}
                                   <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-8">
                                        <Button
                                             onClick={() => navigate('/home')}
                                             size="lg"
                                             className="px-8 py-4 text-lg font-semibold bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition-all duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95 hover:scale-105"
                                        >
                                             {selectedPersona === 'customer' ? 'Tìm sân ngay' : 'Bắt đầu miễn phí'}
                                             <ArrowRight className="w-5 h-5 ml-2" />
                                        </Button>
                                        <Button
                                             onClick={() => navigate('/auth')}
                                             variant="outline"
                                             size="lg"
                                             className="px-8 py-4 text-lg font-semibold border-2 border-white/20 hover:border-white/40 text-teal-500 hover:bg-transparent hover:text-white rounded-xl transition-all duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95 hover:scale-105"
                                        >
                                             {selectedPersona === 'customer' ? 'Đăng ký' : 'Xem demo'}
                                        </Button>
                                   </div>

                                   {/* Social Proof */}
                                   <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-8 text-slate-400">
                                        <div className="flex items-center gap-2">
                                             <Users className="w-5 h-5" />
                                             <span>10,000+ người dùng</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                             <Calendar className="w-5 h-5" />
                                             <span>50,000+ lượt đặt</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                             <Star className="w-5 h-5 text-yellow-400" />
                                             <span>4.8/5 đánh giá</span>
                                        </div>
                                   </div>
                              </div>

                              {/* Right Content - Features Preview */}
                              <div className="relative">
                                   {selectedPersona === 'customer' ? (
                                        // Customer Features
                                        <div className="space-y-6">
                                             {/* Search Preview */}
                                             <div className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                                                  <div className="flex items-center gap-3 mb-4">
                                                       <Search className="w-5 h-5 text-teal-400" />
                                                       <span className="text-white font-semibold">Tìm kiếm thông minh</span>
                                                  </div>
                                                  <div className="space-y-3">
                                                       <div className="h-3 bg-teal-500/30 rounded w-full"></div>
                                                       <div className="flex gap-2">
                                                            <div className="h-2 bg-white/20 rounded w-1/4"></div>
                                                            <div className="h-2 bg-white/20 rounded w-1/4"></div>
                                                            <div className="h-2 bg-white/20 rounded w-1/4"></div>
                                                       </div>
                                                  </div>
                                             </div>

                                             {/* Feature Cards for Customers */}
                                             <div className="grid grid-cols-2 gap-4">
                                                  {[
                                                       {
                                                            icon: <MapPin className="w-6 h-6" />,
                                                            title: 'Gần bạn',
                                                            color: 'bg-blue-500/20 border-blue-500/30',
                                                       },
                                                       {
                                                            icon: <Clock className="w-6 h-6" />,
                                                            title: 'Đặt nhanh',
                                                            color: 'bg-green-500/20 border-green-500/30',
                                                       },
                                                       {
                                                            icon: <ShieldCheck className="w-6 h-6" />,
                                                            title: 'An toàn',
                                                            color: 'bg-purple-500/20 border-purple-500/30',
                                                       },
                                                       {
                                                            icon: <Trophy className="w-6 h-6" />,
                                                            title: 'Giá tốt',
                                                            color: 'bg-yellow-500/20 border-yellow-500/30',
                                                       },
                                                  ].map((feature, index) => (
                                                       <div
                                                            key={index}
                                                            className={`p-6 rounded-2xl border backdrop-blur-sm ${feature.color} hover:scale-105 transition-all duration-300`}
                                                       >
                                                            <div className="text-white mb-3">{feature.icon}</div>
                                                            <h3 className="text-white font-semibold text-sm">{feature.title}</h3>
                                                       </div>
                                                  ))}
                                             </div>
                                        </div>
                                   ) : (
                                        // Business Features
                                        <div className="space-y-6">
                                             <div className="grid grid-cols-2 gap-4">
                                                  {[
                                                       {
                                                            icon: <Calendar className="w-6 h-6" />,
                                                            title: 'Booking tự động',
                                                            color: 'bg-blue-500/20 border-blue-500/30',
                                                       },
                                                       {
                                                            icon: <BarChart3 className="w-6 h-6" />,
                                                            title: 'Báo cáo chi tiết',
                                                            color: 'bg-green-500/20 border-green-500/30',
                                                       },
                                                       {
                                                            icon: <Zap className="w-6 h-6" />,
                                                            title: 'Tích hợp API',
                                                            color: 'bg-yellow-500/20 border-yellow-500/30',
                                                       },
                                                       {
                                                            icon: <ShieldCheck className="w-6 h-6" />,
                                                            title: 'Bảo mật cao',
                                                            color: 'bg-purple-500/20 border-purple-500/30',
                                                       },
                                                  ].map((feature, index) => (
                                                       <div
                                                            key={index}
                                                            className={`p-6 rounded-2xl border backdrop-blur-sm ${feature.color} hover:scale-105 transition-all duration-300`}
                                                       >
                                                            <div className="text-white mb-3">{feature.icon}</div>
                                                            <h3 className="text-white font-semibold text-sm">{feature.title}</h3>
                                                       </div>
                                                  ))}
                                             </div>

                                             {/* Dashboard Preview */}
                                             <div className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                                                  <div className="flex items-center gap-3 mb-4">
                                                       <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                       <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                                       <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                       <span className="text-slate-300 text-sm ml-4">Dashboard Preview</span>
                                                  </div>
                                                  <div className="space-y-3">
                                                       <div className="h-2 bg-teal-500/30 rounded w-3/4"></div>
                                                       <div className="h-2 bg-white/20 rounded w-1/2"></div>
                                                       <div className="h-2 bg-white/20 rounded w-2/3"></div>
                                                  </div>
                                             </div>
                                        </div>
                                   )}
                              </div>
                         </div>
                    </div>

                    {/* Bottom Trust Signals */}
                    <div className="p-6 lg:p-8 border-t border-white/10">
                         <div className="max-w-4xl mx-auto">
                              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-slate-400 text-sm">
                                   <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-teal-400" />
                                        <span>
                                             {selectedPersona === 'customer' ? 'Miễn phí đăng ký' : 'Không cần thẻ tín dụng'}
                                        </span>
                                   </div>
                                   <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-teal-400" />
                                        <span>Hỗ trợ 24/7</span>
                                   </div>
                                   <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-teal-400" />
                                        <span>
                                             {selectedPersona === 'customer' ? 'Thanh toán an toàn' : 'Hủy bất kỳ lúc nào'}
                                        </span>
                                   </div>
                                   <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-teal-400" />
                                        <span>Đa nền tảng</span>
                                   </div>
                              </div>
                         </div>
                    </div>
               </div>
          </div>
     );
};

export default LandingPage;
