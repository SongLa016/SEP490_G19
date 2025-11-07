import { Button, Card, Section } from "../../../../../shared/components/ui";
import { Users, UserPlus, Search, Trophy, Clock, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollReveal } from "../../../../../shared/components/ScrollReveal";
import { motion } from "framer-motion";

export const CommunityMatchmakingSection = () => {
     const navigate = useNavigate();

     const matchmakingFeatures = [
          {
               icon: Search,
               title: "Tìm đối",
               description: "Tìm đội đối thủ phù hợp để thi đấu",
               color: "teal",
          },
          {
               icon: UserPlus,
               title: "Tạo đội",
               description: "Tạo đội bóng riêng và quản lý thành viên",
               color: "orange",
          },
          {
               icon: Users,
               title: "Tham gia đội",
               description: "Tham gia các đội đang tìm thành viên",
               color: "purple",
          },
     ];

     const matchPosts = [
          {
               id: 1,
               teamName: "Đội ABC",
               need: "Tìm đối",
               time: "Thứ 7, 19:00",
               location: "Sân bóng ABC, Quận Hoàn Kiếm",
               playersNeeded: 0,
               type: "match",
          },
          {
               id: 2,
               teamName: "Đội XYZ",
               need: "Cần thêm người",
               time: "Tối nay, 19:00",
               location: "Sân bóng XYZ, Quận Ba Đình",
               playersNeeded: 2,
               type: "recruit",
          },
          {
               id: 3,
               teamName: "Giải mini nội khu",
               need: "Tuyển đội",
               time: "Cuối tuần",
               location: "Nhiều địa điểm",
               playersNeeded: 0,
               type: "tournament",
          },
     ];

     const containerVariants = {
          hidden: { opacity: 0 },
          visible: {
               opacity: 1,
               transition: {
                    staggerChildren: 0.1,
               },
          },
     };

     const itemVariants = {
          hidden: { y: 20, opacity: 0 },
          visible: {
               y: 0,
               opacity: 1,
               transition: {
                    duration: 0.5,
               },
          },
     };

     return (
          <ScrollReveal direction="up" delay={0.2} margin="70px 0px">
               <Section className="relative px-5  max-h-[100vh] py-10 overflow-hidden">
                    {/* Background image + gradient overlay */}
                    <div
                         className="absolute inset-0 bg-cover bg-center"
                         style={{ backgroundImage: "url('https://plus.unsplash.com/premium_photo-1709168768941-ef59f7489002?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1333')" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900/80" />
                    <div className="relative z-10 max-w-7xl mx-auto px-4">
                         <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.6 }}
                              className="text-center mb-3"
                         >
                              <h2 className="text-4xl md:text-5xl font-bold text-white mb-3">
                                   Cộng đồng & Matchmaking
                              </h2>
                              <p className="text-lg text-slate-200 max-w-2xl mx-auto">
                                   Tìm đối, tạo đội, tham gia đội - Kết nối với cộng đồng người chơi bóng đá
                              </p>
                         </motion.div>

                         {/* Features */}
                         <motion.div
                              variants={containerVariants}
                              initial="hidden"
                              whileInView="visible"
                              viewport={{ once: true }}
                              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3"
                         >
                              {matchmakingFeatures.map((feature, index) => {
                                   const Icon = feature.icon;
                                   const colorClasses = {
                                        teal: "bg-teal-100 text-teal-600",
                                        orange: "bg-orange-100 text-orange-600",
                                        purple: "bg-purple-100 text-purple-600",
                                   };
                                   return (
                                        <motion.div key={index} variants={itemVariants}>
                                             <Card className="p-3 text-center bg-white/95 backdrop-blur rounded-2xl hover:shadow-xl transition-all duration-300 border border-white/20">
                                                  <div className={`inline-flex p-3 rounded-2xl mb-4 ${colorClasses[feature.color]}`}>
                                                       <Icon className="w-8 h-8" />
                                                  </div>
                                                  <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                                                  <p className="text-slate-600">{feature.description}</p>
                                             </Card>
                                        </motion.div>
                                   );
                              })}
                         </motion.div>

                         {/* Match Posts */}
                         <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.6 }}
                              className="mb-5"
                         >
                              <h3 className="text-2xl font-bold text-white mb-4">Cơ hội đang chờ bạn</h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                   {matchPosts.map((post) => (
                                        <motion.div
                                             key={post.id}
                                             whileHover={{ scale: 1.02, y: -5 }}
                                             className="relative"
                                        >
                                             <Card className="p-3 bg-white/95 backdrop-blur rounded-2xl hover:shadow-xl transition-all duration-300 border border-white/20 h-full max-h-[200px]">
                                                  {post.type === "tournament" && (
                                                       <div className="absolute top-4 right-4">
                                                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold flex items-center gap-1">
                                                                 <Trophy className="w-3 h-3" />
                                                                 Giải đấu
                                                            </span>
                                                       </div>
                                                  )}
                                                  <div className="flex items-start gap-3 mb-2">
                                                       <div className="p-2 bg-teal-100 rounded-lg">
                                                            <Users className="w-5 h-5 text-teal-600" />
                                                       </div>
                                                       <div className="flex-1">
                                                            <h4 className="font-bold text-slate-900">{post.teamName}</h4>
                                                            <p className="text-sm text-teal-600 font-medium">{post.need}</p>
                                                       </div>
                                                  </div>

                                                  <div className="space-y-2 mb-2">
                                                       <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Clock className="w-4 h-4" />
                                                            <span>{post.time}</span>
                                                       </div>
                                                       <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <MapPin className="w-4 h-4" />
                                                            <span className="truncate">{post.location}</span>
                                                       </div>
                                                       {post.playersNeeded > 0 && (
                                                            <div className="flex items-center gap-2 text-sm text-orange-600 font-medium">
                                                                 <UserPlus className="w-4 h-4" />
                                                                 <span>Cần thêm {post.playersNeeded} người</span>
                                                            </div>
                                                       )}
                                                  </div>

                                                  <Button
                                                       onClick={() => navigate("/community")}
                                                       className="w-full bg-teal-500 hover:bg-teal-600 text-white rounded-2xl"
                                                  >
                                                       {post.type === "match" && "Xem chi tiết"}
                                                       {post.type === "recruit" && "Tham gia ngay"}
                                                       {post.type === "tournament" && "Đăng ký tham gia"}
                                                  </Button>
                                             </Card>
                                        </motion.div>
                                   ))}
                              </div>
                         </motion.div>

                         {/* CTA Buttons */}
                         <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.6 }}
                              className="flex flex-wrap justify-center gap-4"
                         >
                              <Button
                                   onClick={() => navigate("/community?action=create-team")}
                                   className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 rounded-2xl font-semibold text-lg"
                              >
                                   <UserPlus className="w-5 h-5 mr-2" />
                                   Tạo đội mới
                              </Button>
                              <Button
                                   onClick={() => navigate("/community?action=join")}
                                   className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-2xl font-semibold text-lg"
                              >
                                   <Users className="w-5 h-5 mr-2" />
                                   Tham gia ngay
                              </Button>
                              <Button
                                   onClick={() => navigate("/community?action=find-opponent")}
                                   className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-3 rounded-2xl font-semibold text-lg"
                              >
                                   <Search className="w-5 h-5 mr-2" />
                                   Đăng bài tìm đối
                              </Button>
                         </motion.div>
                    </div>
               </Section>
          </ScrollReveal>
     );
};

