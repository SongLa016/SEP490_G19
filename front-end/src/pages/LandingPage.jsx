import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { Button } from '../shared/components/ui';
import logo from '../shared/components/assets/logo.png';
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
     const containerRef = useRef(null);
     const gradientRef = useRef(null);

     // Animated particles for background
     useEffect(() => {
          if (!containerRef.current) return;

          const particles = [];
          const container = containerRef.current;

          for (let i = 0; i < 50; i++) {
               const particle = document.createElement('div');
               particle.className = 'absolute w-1 h-1 bg-teal-400/30 rounded-full pointer-events-none';
               particle.style.left = Math.random() * 100 + '%';
               particle.style.top = Math.random() * 100 + '%';
               particle.style.width = Math.random() * 4 + 2 + 'px';
               particle.style.height = particle.style.width;
               container.appendChild(particle);
               particles.push(particle);
          }

          particles.forEach((particle, i) => {
               gsap.to(particle, {
                    x: Math.random() * 200 - 100,
                    y: Math.random() * 200 - 100,
                    duration: Math.random() * 3 + 2,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                    delay: i * 0.1,
               });
          });

          return () => {
               particles.forEach(particle => {
                    if (particle && particle.parentNode) {
                         particle.parentNode.removeChild(particle);
                    }
               });
          };
     }, []);

     // Continuous rotation for background gradient
     useEffect(() => {
          if (!gradientRef.current) return;

          gsap.to(gradientRef.current, {
               rotation: 360,
               duration: 20,
               repeat: -1,
               ease: "none",
          });
     }, []);

     return (
          <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 text-white relative overflow-hidden">
               {/* Animated Background with parallax effect */}
               <motion.div
                    className="absolute inset-0 opacity-80"
                    style={{
                         backgroundImage:
                              "url('https://backstage.vn/storage/2020/06/Screenshot-8.png')",
                         backgroundSize: 'cover',
                         backgroundPosition: 'center center',
                         backgroundRepeat: 'no-repeat',
                         backgroundAttachment: 'fixed',
                    }}
                    animate={{
                         y: [0, -10, 0],
                    }}
                    transition={{
                         duration: 8,
                         repeat: Infinity,
                         ease: "easeInOut",
                    }}
               ></motion.div>
               <motion.div
                    ref={gradientRef}
                    className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900/80"
                    animate={{
                         y: [0, 10, 0],
                    }}
                    transition={{
                         duration: 8,
                         repeat: Infinity,
                         ease: "easeInOut",
                    }}
               ></motion.div>

               {/* Main Content */}
               <motion.div
                    className="relative z-10 min-h-screen flex flex-col"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
               >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 py-4 lg:px-8">
                         {/* Animated Logo */}
                         <motion.div
                              className="flex items-center justify-start"
                              animate={{
                                   y: [0, -10, 0],
                                   rotate: [0, 5, -5, 0],
                              }}
                              transition={{
                                   duration: 4,
                                   repeat: Infinity,
                                   ease: "easeInOut",
                              }}
                         >
                              <motion.img
                                   src={logo}
                                   alt="BallSpot Logo"
                                   className="h-24 w-24"
                                   whileHover={{ scale: 1.1, rotate: 360 }}
                                   transition={{ duration: 0.6 }}
                              />
                         </motion.div>

                         {/* Persona Toggle - Professional Style with Animation */}
                         <motion.div
                              className="hidden sm:flex bg-white/5 backdrop-blur-sm rounded-lg p-1 border border-white/10 justify-center"
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 }}
                         >
                              <motion.div
                                   whileHover={{ scale: 1.05 }}
                                   whileTap={{ scale: 0.95 }}
                              >
                                   <Button
                                        onClick={() => setSelectedPersona('customer')}
                                        className={`px-4 py-2 rounded-md transition-all duration-300 flex items-center gap-2 text-sm font-medium ${selectedPersona === 'customer'
                                             ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                                             : 'text-slate-300 hover:text-white bg-white/5'
                                             }`}
                                   >
                                        <motion.div
                                             animate={selectedPersona === 'customer' ? { rotate: [0, -10, 10, 0] } : {}}
                                             transition={{ duration: 0.5 }}
                                        >
                                             <User className="w-4 h-4" />
                                        </motion.div>
                                        Đặt sân
                                   </Button>
                              </motion.div>
                              <motion.div
                                   whileHover={{ scale: 1.05 }}
                                   whileTap={{ scale: 0.95 }}
                              >
                                   <Button
                                        onClick={() => setSelectedPersona('business')}
                                        className={`px-4 py-2 rounded-md transition-all duration-300 flex items-center gap-2 text-sm font-medium ${selectedPersona === 'business'
                                             ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                                             : 'text-slate-300 hover:text-white bg-white/5'
                                             }`}
                                   >
                                        <motion.div
                                             animate={selectedPersona === 'business' ? { rotate: [0, -10, 10, 0] } : {}}
                                             transition={{ duration: 0.5 }}
                                        >
                                             <Building2 className="w-4 h-4" />
                                        </motion.div>
                                        Quản lý sân
                                   </Button>
                              </motion.div>
                         </motion.div>
                    </div>

                    {/* Mobile Persona Toggle with Animation */}
                    <motion.div
                         className="sm:hidden flex justify-center mb-5 px-6"
                         initial={{ opacity: 0, y: -10 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: 0.2 }}
                    >
                         <div className="bg-white/5 backdrop-blur-sm rounded-lg p-1 border border-white/10 w-full max-w-xs">
                              <motion.div
                                   whileHover={{ scale: 1.02 }}
                                   whileTap={{ scale: 0.98 }}
                              >
                                   <Button
                                        onClick={() => setSelectedPersona('customer')}
                                        className={`w-full px-4 py-3 rounded-md transition-all duration-300 flex items-center justify-center gap-2 text-sm font-medium ${selectedPersona === 'customer'
                                             ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                                             : 'text-slate-300 hover:text-white bg-white/10'
                                             }`}
                                   >
                                        <motion.div
                                             animate={selectedPersona === 'customer' ? { rotate: [0, -10, 10, 0] } : {}}
                                             transition={{ duration: 0.5 }}
                                        >
                                             <User className="w-4 h-4" />
                                        </motion.div>
                                        Đặt sân
                                   </Button>
                              </motion.div>
                              <motion.div
                                   whileHover={{ scale: 1.02 }}
                                   whileTap={{ scale: 0.98 }}
                              >
                                   <Button
                                        onClick={() => setSelectedPersona('business')}
                                        className={`w-full px-4 py-3 rounded-md transition-all duration-300 flex items-center justify-center gap-2 text-sm font-medium ${selectedPersona === 'business'
                                             ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                                             : 'text-slate-300 hover:text-white bg-white/5'
                                             }`}
                                   >
                                        <motion.div
                                             animate={selectedPersona === 'business' ? { rotate: [0, -10, 10, 0] } : {}}
                                             transition={{ duration: 0.5 }}
                                        >
                                             <Building2 className="w-4 h-4" />
                                        </motion.div>
                                        Quản lý sân
                                   </Button>
                              </motion.div>
                         </div>
                    </motion.div>

                    {/* Hero Section */}
                    <div className="flex-1 flex items-center justify-center px-6 lg:px-8">
                         <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                              {/* Left Content */}
                              <motion.div
                                   className="text-center lg:text-left"
                                   initial={{ opacity: 0, x: -50 }}
                                   animate={{ opacity: 1, x: 0 }}
                                   transition={{ delay: 0.4, duration: 0.6 }}
                              >
                                   {/* Animated Badge */}
                                   <motion.div
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-sm font-medium mb-8"
                                        animate={{
                                             boxShadow: [
                                                  "0 0 0px rgba(20, 184, 166, 0.4)",
                                                  "0 0 20px rgba(20, 184, 166, 0.6)",
                                                  "0 0 0px rgba(20, 184, 166, 0.4)",
                                             ],
                                        }}
                                        transition={{
                                             duration: 2,
                                             repeat: Infinity,
                                             ease: "easeInOut",
                                        }}
                                   >
                                        <motion.div
                                             animate={{ rotate: [0, 180, 360] }}
                                             transition={{
                                                  duration: 3,
                                                  repeat: Infinity,
                                                  ease: "linear",
                                             }}
                                        >
                                             <Sparkles className="w-4 h-4" />
                                        </motion.div>
                                        {selectedPersona === 'customer'
                                             ? 'Đặt sân bóng đá dễ dàng'
                                             : 'Quản lý sân bóng chuyên nghiệp'}
                                   </motion.div>

                                   {/* Animated Main Headline */}
                                   <motion.h1
                                        className="text-4xl md:text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-teal-200 to-teal-400 leading-tight"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6, duration: 0.8 }}
                                   >
                                        {selectedPersona === 'customer' ? (
                                             <>
                                                  Tìm và đặt sân
                                                  <br />
                                                  <motion.span
                                                       className="text-teal-400"
                                                       animate={{
                                                            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                                                       }}
                                                       transition={{
                                                            duration: 5,
                                                            repeat: Infinity,
                                                            ease: "linear",
                                                       }}
                                                       style={{
                                                            backgroundImage: "linear-gradient(90deg, #2dd4bf, #5eead4, #2dd4bf)",
                                                            backgroundSize: "200% 100%",
                                                            WebkitBackgroundClip: "text",
                                                            WebkitTextFillColor: "transparent",
                                                       }}
                                                  >
                                                       nhanh chóng
                                                  </motion.span>
                                             </>
                                        ) : (
                                             <>
                                                  Quản lý sân bóng
                                                  <br />
                                                  <motion.span
                                                       className="text-teal-400"
                                                       animate={{
                                                            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                                                       }}
                                                       transition={{
                                                            duration: 5,
                                                            repeat: Infinity,
                                                            ease: "linear",
                                                       }}
                                                       style={{
                                                            backgroundImage: "linear-gradient(90deg, #2dd4bf, #5eead4, #2dd4bf)",
                                                            backgroundSize: "200% 100%",
                                                            WebkitBackgroundClip: "text",
                                                            WebkitTextFillColor: "transparent",
                                                       }}
                                                  >
                                                       thông minh
                                                  </motion.span>
                                             </>
                                        )}
                                   </motion.h1>

                                   {/* Animated Subtitle */}
                                   <motion.p
                                        className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.8, duration: 0.8 }}
                                   >
                                        {selectedPersona === 'customer'
                                             ? 'Tìm sân bóng phù hợp, đặt lịch nhanh chóng với giá tốt nhất và thanh toán an toàn'
                                             : 'Hệ thống quản lý sân bóng toàn diện với booking tự động, thanh toán online và báo cáo chi tiết'}
                                   </motion.p>

                                   {/* Animated CTA Buttons */}
                                   <motion.div
                                        className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-8"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 1, duration: 0.6 }}
                                   >
                                        <motion.div
                                             whileHover={{ scale: 1.05, y: -2 }}
                                             whileTap={{ scale: 0.95 }}
                                             animate={{
                                                  boxShadow: [
                                                       "0 0 0px rgba(20, 184, 166, 0)",
                                                       "0 0 25px rgba(20, 184, 166, 0.5)",
                                                       "0 0 0px rgba(20, 184, 166, 0)",
                                                  ],
                                             }}
                                             transition={{
                                                  boxShadow: {
                                                       duration: 2,
                                                       repeat: Infinity,
                                                       ease: "easeInOut",
                                                  },
                                             }}
                                        >
                                             <Button
                                                  onClick={() => selectedPersona === 'business' ? navigate('/register') : navigate('/home')}
                                                  size="lg"
                                                  className="px-8 py-4 text-lg font-semibold bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition-all duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95 hover:scale-105"
                                             >
                                                  {selectedPersona === 'customer' ? 'Tìm sân ngay' : 'Đăng ký miễn phí'}
                                                  <motion.span
                                                       animate={{ x: [0, 5, 0] }}
                                                       transition={{
                                                            duration: 1.5,
                                                            repeat: Infinity,
                                                            ease: "easeInOut",
                                                       }}
                                                       className="inline-block ml-2"
                                                  >
                                                       <ArrowRight className="w-5 h-5" />
                                                  </motion.span>
                                             </Button>
                                        </motion.div>
                                        <motion.div
                                             whileHover={{ scale: 1.05, y: -2 }}
                                             whileTap={{ scale: 0.95 }}
                                        >
                                             <Button
                                                  onClick={() => selectedPersona === 'business' ? navigate('/demo') : navigate('/auth')}
                                                  variant="outline"
                                                  size="lg"
                                                  className="px-8 py-4 text-lg font-semibold border-2 border-white/20 hover:border-white/40 text-teal-500 hover:bg-transparent hover:text-white rounded-xl transition-all duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95 hover:scale-105"
                                             >
                                                  {selectedPersona === 'customer' ? 'Đăng ký' : 'Xem demo'}
                                             </Button>
                                        </motion.div>

                                   </motion.div>

                                   {/* Animated Social Proof */}
                                   <motion.div
                                        className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-8 text-slate-400"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1.2, duration: 0.6 }}
                                   >
                                        {[
                                             { Icon: Users, text: "10,000+ người dùng", color: "text-blue-400" },
                                             { Icon: Calendar, text: "50,000+ lượt đặt", color: "text-green-400" },
                                             { Icon: Star, text: "4.8/5 đánh giá", color: "text-yellow-400" },
                                        ].map((item, index) => (
                                             <motion.div
                                                  key={index}
                                                  className="flex items-center gap-2"
                                                  animate={{
                                                       y: [0, -5, 0],
                                                  }}
                                                  transition={{
                                                       duration: 2 + index * 0.5,
                                                       repeat: Infinity,
                                                       ease: "easeInOut",
                                                       delay: index * 0.3,
                                                  }}
                                             >
                                                  <motion.div
                                                       animate={{ rotate: [0, 10, -10, 0] }}
                                                       transition={{
                                                            duration: 3,
                                                            repeat: Infinity,
                                                            ease: "easeInOut",
                                                            delay: index * 0.2,
                                                       }}
                                                  >
                                                       <item.Icon className={`w-5 h-5 ${item.color}`} />
                                                  </motion.div>
                                                  <span>{item.text}</span>
                                             </motion.div>
                                        ))}
                                   </motion.div>
                              </motion.div>

                              {/* Right Content - Features Preview with Continuous Animations */}
                              <motion.div
                                   className="relative"
                                   initial={{ opacity: 0, x: 50 }}
                                   animate={{ opacity: 1, x: 0 }}
                                   transition={{ delay: 0.5, duration: 0.6 }}
                              >
                                   {selectedPersona === 'customer' ? (
                                        // Customer Features
                                        <div className="space-y-6">
                                             {/* Animated Search Preview */}
                                             <motion.div
                                                  className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20"
                                                  animate={{
                                                       y: [0, -8, 0],
                                                       boxShadow: [
                                                            "0 0 0px rgba(20, 184, 166, 0.2)",
                                                            "0 0 20px rgba(20, 184, 166, 0.4)",
                                                            "0 0 0px rgba(20, 184, 166, 0.2)",
                                                       ],
                                                  }}
                                                  transition={{
                                                       y: {
                                                            duration: 3,
                                                            repeat: Infinity,
                                                            ease: "easeInOut",
                                                       },
                                                       boxShadow: {
                                                            duration: 2,
                                                            repeat: Infinity,
                                                            ease: "easeInOut",
                                                       },
                                                  }}
                                             >
                                                  <div className="flex items-center gap-3 mb-4">
                                                       <motion.div
                                                            animate={{ rotate: [0, 360] }}
                                                            transition={{
                                                                 duration: 8,
                                                                 repeat: Infinity,
                                                                 ease: "linear",
                                                            }}
                                                       >
                                                            <Search className="w-5 h-5 text-teal-400" />
                                                       </motion.div>
                                                       <span className="text-white font-semibold">Tìm kiếm thông minh</span>
                                                  </div>
                                                  <div className="space-y-3">
                                                       <motion.div
                                                            className="h-3 bg-teal-500/30 rounded w-full"
                                                            animate={{
                                                                 scaleX: [1, 1.05, 1],
                                                            }}
                                                            transition={{
                                                                 duration: 2,
                                                                 repeat: Infinity,
                                                                 ease: "easeInOut",
                                                            }}
                                                       ></motion.div>
                                                       <div className="flex gap-2">
                                                            {[0, 1, 2].map((i) => (
                                                                 <motion.div
                                                                      key={i}
                                                                      className="h-2 bg-white/20 rounded w-1/4"
                                                                      animate={{
                                                                           scaleY: [1, 1.5, 1],
                                                                      }}
                                                                      transition={{
                                                                           duration: 1.5 + i * 0.3,
                                                                           repeat: Infinity,
                                                                           ease: "easeInOut",
                                                                           delay: i * 0.2,
                                                                      }}
                                                                 ></motion.div>
                                                            ))}
                                                       </div>
                                                  </div>
                                             </motion.div>

                                             {/* Animated Feature Cards for Customers */}
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
                                                       <motion.div
                                                            key={index}
                                                            className={`p-6 rounded-2xl border backdrop-blur-sm ${feature.color} hover:scale-105 transition-all duration-300`}
                                                            animate={{
                                                                 y: [0, -10, 0],
                                                                 rotate: [0, 2, -2, 0],
                                                            }}
                                                            transition={{
                                                                 duration: 3 + index * 0.5,
                                                                 repeat: Infinity,
                                                                 ease: "easeInOut",
                                                                 delay: index * 0.2,
                                                            }}
                                                            whileHover={{
                                                                 scale: 1.1,
                                                                 rotate: 5,
                                                                 transition: { duration: 0.2 }
                                                            }}
                                                       >
                                                            <motion.div
                                                                 className="text-white mb-3"
                                                                 animate={{
                                                                      scale: [1, 1.2, 1],
                                                                      rotate: [0, 15, -15, 0],
                                                                 }}
                                                                 transition={{
                                                                      duration: 2,
                                                                      repeat: Infinity,
                                                                      ease: "easeInOut",
                                                                      delay: index * 0.3,
                                                                 }}
                                                            >
                                                                 {feature.icon}
                                                            </motion.div>
                                                            <h3 className="text-white font-semibold text-sm">{feature.title}</h3>
                                                       </motion.div>
                                                  ))}
                                             </div>
                                        </div>
                                   ) : (
                                        // Animated Business Features
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
                                                       <motion.div
                                                            key={index}
                                                            className={`p-6 rounded-2xl border backdrop-blur-sm ${feature.color} hover:scale-105 transition-all duration-300`}
                                                            animate={{
                                                                 y: [0, -10, 0],
                                                                 rotate: [0, 2, -2, 0],
                                                            }}
                                                            transition={{
                                                                 duration: 3 + index * 0.5,
                                                                 repeat: Infinity,
                                                                 ease: "easeInOut",
                                                                 delay: index * 0.2,
                                                            }}
                                                            whileHover={{
                                                                 scale: 1.1,
                                                                 rotate: 5,
                                                                 transition: { duration: 0.2 }
                                                            }}
                                                       >
                                                            <motion.div
                                                                 className="text-white mb-3"
                                                                 animate={{
                                                                      scale: [1, 1.2, 1],
                                                                      rotate: [0, 15, -15, 0],
                                                                 }}
                                                                 transition={{
                                                                      duration: 2,
                                                                      repeat: Infinity,
                                                                      ease: "easeInOut",
                                                                      delay: index * 0.3,
                                                                 }}
                                                            >
                                                                 {feature.icon}
                                                            </motion.div>
                                                            <h3 className="text-white font-semibold text-sm">{feature.title}</h3>
                                                       </motion.div>
                                                  ))}
                                             </div>

                                             {/* Animated Dashboard Preview */}
                                             <motion.div
                                                  className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20"
                                                  animate={{
                                                       y: [0, -8, 0],
                                                       boxShadow: [
                                                            "0 0 0px rgba(20, 184, 166, 0.2)",
                                                            "0 0 20px rgba(20, 184, 166, 0.4)",
                                                            "0 0 0px rgba(20, 184, 166, 0.2)",
                                                       ],
                                                  }}
                                                  transition={{
                                                       y: {
                                                            duration: 3,
                                                            repeat: Infinity,
                                                            ease: "easeInOut",
                                                       },
                                                       boxShadow: {
                                                            duration: 2,
                                                            repeat: Infinity,
                                                            ease: "easeInOut",
                                                       },
                                                  }}
                                             >
                                                  <div className="flex items-center gap-3 mb-4">
                                                       {[
                                                            { color: "bg-red-500", delay: 0 },
                                                            { color: "bg-yellow-500", delay: 0.2 },
                                                            { color: "bg-green-500", delay: 0.4 },
                                                       ].map((dot, i) => (
                                                            <motion.div
                                                                 key={i}
                                                                 className={`w-3 h-3 ${dot.color} rounded-full`}
                                                                 animate={{
                                                                      scale: [1, 1.3, 1],
                                                                      opacity: [1, 0.7, 1],
                                                                 }}
                                                                 transition={{
                                                                      duration: 1.5,
                                                                      repeat: Infinity,
                                                                      ease: "easeInOut",
                                                                      delay: dot.delay,
                                                                 }}
                                                            ></motion.div>
                                                       ))}
                                                       <span className="text-slate-300 text-sm ml-4">Dashboard Preview</span>
                                                  </div>
                                                  <div className="space-y-3">
                                                       {[
                                                            { width: "w-3/4", delay: 0 },
                                                            { width: "w-1/2", delay: 0.2 },
                                                            { width: "w-2/3", delay: 0.4 },
                                                       ].map((bar, i) => (
                                                            <motion.div
                                                                 key={i}
                                                                 className={`h-2 ${i === 0 ? 'bg-teal-500/30' : 'bg-white/20'} rounded ${bar.width}`}
                                                                 animate={{
                                                                      scaleX: [1, 1.1, 1],
                                                                 }}
                                                                 transition={{
                                                                      duration: 2,
                                                                      repeat: Infinity,
                                                                      ease: "easeInOut",
                                                                      delay: bar.delay,
                                                                 }}
                                                            ></motion.div>
                                                       ))}
                                                  </div>
                                             </motion.div>
                                        </div>
                                   )}
                              </motion.div>
                         </div>
                    </div>

                    {/* Animated Bottom Trust Signals */}
                    <motion.div
                         className="p-6 lg:p-8 border-t border-white/10"
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: 1.4, duration: 0.6 }}
                    >
                         <div className="max-w-4xl mx-auto">
                              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-slate-400 text-sm">
                                   {[
                                        {
                                             Icon: CheckCircle,
                                             text: selectedPersona === 'customer' ? 'Miễn phí đăng ký' : 'Không cần thẻ tín dụng',
                                             delay: 0,
                                        },
                                        {
                                             Icon: CheckCircle,
                                             text: 'Hỗ trợ 24/7',
                                             delay: 0.1,
                                        },
                                        {
                                             Icon: CheckCircle,
                                             text: selectedPersona === 'customer' ? 'Thanh toán an toàn' : 'Hủy bất kỳ lúc nào',
                                             delay: 0.2,
                                        },
                                        {
                                             Icon: Globe,
                                             text: 'Đa nền tảng',
                                             delay: 0.3,
                                        },
                                   ].map((item, index) => (
                                        <motion.div
                                             key={index}
                                             className="flex items-center gap-2"
                                             animate={{
                                                  y: [0, -3, 0],
                                             }}
                                             transition={{
                                                  duration: 2,
                                                  repeat: Infinity,
                                                  ease: "easeInOut",
                                                  delay: item.delay,
                                             }}
                                        >
                                             <motion.div
                                                  animate={{
                                                       scale: [1, 1.2, 1],
                                                       rotate: [0, 360],
                                                  }}
                                                  transition={{
                                                       scale: {
                                                            duration: 2,
                                                            repeat: Infinity,
                                                            ease: "easeInOut",
                                                       },
                                                       rotate: {
                                                            duration: 10,
                                                            repeat: Infinity,
                                                            ease: "linear",
                                                            delay: index * 0.5,
                                                       },
                                                  }}
                                             >
                                                  <item.Icon className="w-4 h-4 text-teal-400" />
                                             </motion.div>
                                             <span>{item.text}</span>
                                        </motion.div>
                                   ))}
                              </div>
                         </div>
                    </motion.div>
               </motion.div>
          </div>
     );
};

export default LandingPage;
