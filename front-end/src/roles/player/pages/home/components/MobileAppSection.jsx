import { Container, Button } from "../../../../../shared/components/ui";
import { Smartphone, Globe, Bell, ArrowRight } from "lucide-react";
import { ScrollReveal } from "../../../../../shared/components/ScrollReveal";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export const MobileAppSection = () => {
     const navigate = useNavigate();
     const features = [
          {
               icon: "🌐",
               title: "Phiên bản web tối ưu",
               description: "Trải nghiệm mượt trên mọi thiết bị",
          },
          {
               icon: "⚡",
               title: "Hiệu năng tốt",
               description: "Tìm sân, đặt lịch nhanh và đơn giản",
          },
          {
               icon: "🔒",
               title: "An toàn & bảo mật",
               description: "Thanh toán và dữ liệu luôn được bảo vệ",
          },
          {
               icon: "🤝",
               title: "Cộng đồng năng động",
               description: "Tìm đối, tham gia đội dễ dàng",
          },
     ];

     return (
          <ScrollReveal direction="up" delay={0.5}>
               <Container className="py-12 my-10 rounded-2xl shadow-lg bg-gradient-to-br from-slate-900 via-teal-800 to-slate-900 text-white relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48"></div>
                    <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/10 rounded-full -ml-36 -mb-36"></div>

                    <div className="max-w-7xl mx-auto relative z-10">
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                              {/* Content */}
                              <motion.div
                                   initial={{ opacity: 0, x: -30 }}
                                   whileInView={{ opacity: 1, x: 0 }}
                                   viewport={{ once: true }}
                                   transition={{ duration: 0.6 }}
                              >
                                   <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full mb-6 backdrop-blur-sm">
                                        <Smartphone className="w-5 h-5" />
                                        <span className="font-semibold">Ứng dụng di động</span>
                                   </div>
                                   <h2 className="text-4xl md:text-5xl font-bold mb-2">
                                        Sắp ra mắt trên iOS & Android
                                   </h2>
                                   <p className="text-lg text-teal-100 mb-8 leading-relaxed">
                                        Trong thời gian chờ ứng dụng, bạn có thể sử dụng phiên bản website với đầy đủ tính năng.
                                   </p>

                                   {/* Features */}
                                   <div className="grid grid-cols-2 gap-4 mb-8">
                                        {features.map((feature, index) => (
                                             <motion.div
                                                  key={index}
                                                  initial={{ opacity: 0, y: 20 }}
                                                  whileInView={{ opacity: 1, y: 0 }}
                                                  viewport={{ once: true }}
                                                  transition={{ duration: 0.5, delay: index * 0.1 }}
                                                  className="p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20"
                                             >
                                                  <div className="text-3xl mb-2">{feature.icon}</div>
                                                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                                                  <p className="text-sm text-teal-100">{feature.description}</p>
                                             </motion.div>
                                        ))}
                                   </div>

                                   {/* Website / Notify CTA */}
                                   <div className="flex flex-wrap gap-4">
                                        <Button
                                             onClick={() => navigate("/")}
                                             className="bg-white text-teal-700 hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                                        >
                                             <Globe className="w-5 h-5" />
                                             Dùng phiên bản website
                                        </Button>
                                        {/* <Button
                                             className="bg-transparent border-2 border-white/60 hover:border-white text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                                        >
                                             <Bell className="w-5 h-5" />
                                             Nhận thông báo khi ra mắt
                                             <ArrowRight className="w-4 h-4" />
                                        </Button> */}
                                   </div>
                              </motion.div>

                              {/* Phone Mockup */}
                              <motion.div
                                   initial={{ opacity: 0, x: 30 }}
                                   whileInView={{ opacity: 1, x: 0 }}
                                   viewport={{ once: true }}
                                   transition={{ duration: 0.6 }}
                                   className="relative"
                              >
                                   <div className="relative mx-auto w-64 h-[500px]">
                                        {/* Phone frame */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[3rem] p-2 shadow-2xl">
                                             <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                                                  {/* Notch */}
                                                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10"></div>
                                                  {/* Screen content */}
                                                  <div className="w-full h-full bg-gradient-to-br from-slate-50 to-teal-100 p-4 pt-10">
                                                       {/* Mock UI */}
                                                       <div className="space-y-4">
                                                            <div className="bg-white rounded-xl p-4 shadow-md">
                                                                 <div className="h-32 bg-gray-200 rounded-lg mb-3"></div>
                                                                 <div className="h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
                                                                 <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                                                            </div>
                                                            <div className="bg-white rounded-xl p-4 shadow-md">
                                                                 <div className="h-3 bg-gray-300 rounded w-2/3 mb-2"></div>
                                                                 <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
                                                                 <div className="h-3 bg-gray-300 rounded w-4/5"></div>
                                                            </div>
                                                            <div className="bg-teal-500 rounded-xl p-4 text-white text-center font-semibold">
                                                                 Sắp ra mắt
                                                            </div>
                                                       </div>
                                                  </div>
                                             </div>
                                        </div>
                                        {/* Floating elements */}
                                        <motion.div
                                             animate={{
                                                  y: [0, -10, 0],
                                             }}
                                             transition={{
                                                  duration: 3,
                                                  repeat: Infinity,
                                                  ease: "easeInOut",
                                             }}
                                             className="absolute -top-4 -right-4 w-16 h-16 bg-orange-500 rounded-xl shadow-lg flex items-center justify-center text-2xl"
                                        >
                                             🔔
                                        </motion.div>
                                        <motion.div
                                             animate={{
                                                  y: [0, 10, 0],
                                             }}
                                             transition={{
                                                  duration: 2.5,
                                                  repeat: Infinity,
                                                  ease: "easeInOut",
                                                  delay: 0.5,
                                             }}
                                             className="absolute -bottom-4 -left-4 w-12 h-12 bg-purple-500 rounded-xl shadow-lg flex items-center justify-center text-xl"
                                        >
                                             👥
                                        </motion.div>
                                   </div>
                              </motion.div>
                         </div>
                    </div>
               </Container>
          </ScrollReveal>
     );
};

