
import { Container, Button, Card } from "../../../../../shared/components/ui";
import { MapPin, Star, Sparkles, LogIn, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollReveal } from "../../../../../shared/components/ScrollReveal";
import { motion } from "framer-motion";

export const QuickBookingSection = ({ user }) => {
     const navigate = useNavigate();

     // Mock data for fields near user
     const nearbyFields = [
          {
               id: 1,
               name: "Sân bóng ABC",
               location: "Quận Hoàn Kiếm, Hà Nội",
               distance: "2.5 km",
               price: "200,000 VNĐ",
               rating: 4.8,
               image: "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
          },
          {
               id: 2,
               name: "Sân bóng XYZ",
               location: "Quận Ba Đình, Hà Nội",
               distance: "3.1 km",
               price: "180,000 VNĐ",
               rating: 4.6,
               image: "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
          },
     ];

     // Mock data for top rated fields
     const topRatedFields = [
          {
               id: 3,
               name: "Sân bóng DEF",
               location: "Quận Đống Đa, Hà Nội",
               price: "220,000 VNĐ",
               rating: 4.9,
               image: "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
          },
          {
               id: 4,
               name: "Sân bóng GHI",
               location: "Quận Cầu Giấy, Hà Nội",
               price: "250,000 VNĐ",
               rating: 4.7,
               image: "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
          },
     ];

     // Promotions for recurring (fixed schedule) bookings
     const promotions = [
          {
               id: 1,
               title: "Giảm 15% khi đặt cố định 4 tuần",
               description: "Đặt lịch cố định mỗi tuần, áp dụng cho cùng khung giờ",
               discount: "15%",
               validUntil: "Áp dụng đến hết tháng này",
          },
          {
               id: 2,
               title: "Giảm 10% khi đặt cố định 8 buổi",
               description: "Tiết kiệm khi đăng ký đặt dài hạn theo slot cố định",
               discount: "10%",
               validUntil: "Ưu đãi số lượng có hạn",
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
          <ScrollReveal direction="up" delay={0.1}>
               <Container className="my-10 py-8 bg-gradient-to-br rounded-2xl shadow-lg from-teal-50 via-white to-orange-50 border border-gray-200">
                    <div className="max-w-7xl mx-auto">
                         <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.6 }}
                              className="text-center mb-12"
                         >
                              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                                   Đặt sân nhanh chóng
                              </h2>
                              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                                   Tìm sân phù hợp, đặt lịch dễ dàng với những gợi ý được yêu thích nhất
                              </p>
                         </motion.div>

                         <motion.div
                              variants={containerVariants}
                              initial="hidden"
                              whileInView="visible"
                              viewport={{ once: true }}
                              className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-5"
                         >
                              {/* Đặt sân gần bạn */}
                              <motion.div variants={itemVariants}>
                                   <Card className="h-full p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-teal-100">
                                        <div className="flex items-center gap-3 mb-2">
                                             <div className="p-3 bg-teal-100 rounded-xl">
                                                  <MapPin className="w-6 h-6 text-teal-600" />
                                             </div>
                                             <h3 className="text-xl font-bold text-gray-900">Đặt sân gần bạn</h3>
                                        </div>
                                        <p className="text-gray-600 mb-4">Sân bóng được đề xuất theo vị trí của bạn</p>

                                        <div className="space-y-3">
                                             {nearbyFields.map((field) => (
                                                  <motion.div
                                                       key={field.id}
                                                       whileHover={{ scale: 1.02 }}
                                                       className="flex items-center border border-teal-200 gap-3 p-3 bg-gray-50 rounded-2xl cursor-pointer hover:bg-teal-50 transition-colors"
                                                       onClick={() => navigate(`/fields/${field.id}`)}
                                                  >
                                                       <img
                                                            src={field.image}
                                                            alt={field.name}
                                                            className="w-16 h-16 rounded-lg object-cover"
                                                       />
                                                       <div className="flex-1 min-w-0">
                                                            <h4 className="font-semibold text-gray-900 truncate">{field.name}</h4>
                                                            <p className="text-sm text-gray-600 truncate">{field.location}</p>
                                                            <p className="text-xs text-teal-600 font-medium">{field.distance} • {field.price}</p>
                                                       </div>
                                                  </motion.div>
                                             ))}
                                        </div>

                                        <Button
                                             onClick={() => navigate("/search")}
                                             className="w-full mt-4 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl"
                                        >
                                             Xem thêm sân gần bạn
                                             <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                   </Card>
                              </motion.div>

                              {/* Đánh giá tốt nhất */}
                              <motion.div variants={itemVariants}>
                                   <Card className="h-full p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-yellow-100">
                                        <div className="flex items-center gap-3 mb-2">
                                             <div className="p-3 bg-yellow-100 rounded-xl">
                                                  <Star className="w-6 h-6 text-yellow-600" />
                                             </div>
                                             <h3 className="text-xl font-bold text-gray-900">Đánh giá tốt nhất</h3>
                                        </div>
                                        <p className="text-gray-600 mb-4">Những sân bóng được đánh giá cao nhất</p>

                                        <div className="space-y-3">
                                             {topRatedFields.map((field) => (
                                                  <motion.div
                                                       key={field.id}
                                                       whileHover={{ scale: 1.02 }}
                                                       className="flex items-center border border-yellow-200 gap-3 p-3 bg-gray-50 rounded-2xl cursor-pointer hover:bg-yellow-50 transition-colors"
                                                       onClick={() => navigate(`/fields/${field.id}`)}
                                                  >
                                                       <img
                                                            src={field.image}
                                                            alt={field.name}
                                                            className="w-16 h-16 rounded-lg object-cover"
                                                       />
                                                       <div className="flex-1 min-w-0">
                                                            <h4 className="font-semibold text-gray-900 truncate">{field.name}</h4>
                                                            <p className="text-sm text-gray-600 truncate">{field.location}</p>
                                                            <p className="text-xs text-yellow-700 font-medium">
                                                                 ⭐ {field.rating} điểm • {field.price}
                                                            </p>
                                                       </div>
                                                  </motion.div>
                                             ))}
                                        </div>

                                        <Button
                                             onClick={() => navigate("/search")}
                                             className="w-full mt-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl"
                                        >
                                             Xem tất cả sân đánh giá cao
                                             <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                   </Card>
                              </motion.div>

                              {/* Ưu đãi đặt cố định */}
                              <motion.div variants={itemVariants}>
                                   <Card className="h-full p-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

                                        <div className="relative z-10">
                                             <div className="flex items-center gap-3 mb-4">
                                                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                                       <Sparkles className="w-6 h-6 text-white" />
                                                  </div>
                                                  <h3 className="text-xl font-bold">Ưu đãi đặt cố định</h3>
                                             </div>
                                             <p className="text-white/90 mb-6 text-sm">Đặt lịch cố định để nhận mức giảm giá hấp dẫn</p>

                                             <div className="space-y-4 mb-6">
                                                  {promotions.map((promo) => (
                                                       <motion.div
                                                            key={promo.id}
                                                            whileHover={{ scale: 1.05 }}
                                                            className="p-4 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30"
                                                       >
                                                            <div className="flex items-start justify-between mb-2">
                                                                 <div>
                                                                      <h4 className="font-bold text-base">{promo.title}</h4>
                                                                      <p className="text-sm text-white/80">{promo.description}</p>
                                                                 </div>
                                                                 <span className="px-3 py-1 bg-white text-purple-600 rounded-full font-bold text-sm">
                                                                      -{promo.discount}
                                                                 </span>
                                                            </div>
                                                            <p className="text-xs text-white/70">{promo.validUntil}</p>
                                                       </motion.div>
                                                  ))}
                                             </div>

                                             <Button
                                                  onClick={() => navigate("/search")}
                                                  className="w-full bg-white text-purple-600 hover:bg-gray-100 hover:text-purple-600 rounded-2xl font-semibold"
                                             >
                                                  Xem tất cả ưu đãi
                                                  <ArrowRight className="w-4 h-4 ml-2" />
                                             </Button>
                                        </div>
                                   </Card>
                              </motion.div>
                         </motion.div>

                         {/* Gợi ý đăng nhập */}
                         {!user && (
                              <motion.div
                                   initial={{ opacity: 0, y: 20 }}
                                   whileInView={{ opacity: 1, y: 0 }}
                                   viewport={{ once: true }}
                                   transition={{ duration: 0.6 }}
                              >
                                   <Card className="p-3 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl shadow-lg text-white">
                                        <div className="flex items-center justify-between flex-wrap gap-4">
                                             <div className="flex items-center gap-4">
                                                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                                       <LogIn className="w-6 h-6" />
                                                  </div>
                                                  <div>
                                                       <h3 className="text-xl font-bold mb-1">Đăng nhập để lưu lịch sử đặt sân</h3>
                                                       <p className="text-teal-100">Quản lý đặt sân dễ dàng, nhận thông báo và ưu đãi độc quyền</p>
                                                  </div>
                                             </div>
                                             <Button
                                                  onClick={() => navigate("/auth")}
                                                  className="bg-white text-teal-600 hover:bg-gray-100 hover:text-teal-600 font-semibold px-6 py-3 rounded-2xl"
                                             >
                                                  Đăng nhập ngay
                                                  <ArrowRight className="w-4 h-4 ml-2" />
                                             </Button>
                                        </div>
                                   </Card>
                              </motion.div>
                         )}
                    </div>
               </Container>
          </ScrollReveal>
     );
};

