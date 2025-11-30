import { Button, Card, Container } from "../../../../../shared/components/ui";
import { Tag, Calendar, Percent, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollReveal } from "../../../../../shared/components/ScrollReveal";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { fetchFieldComplexes } from "../../../../../shared/services/fields";
import { fetchPromotionsByComplex } from "../../../../../shared/services/promotions";

export const PromotionsSection = () => {
     const navigate = useNavigate();
     const [promotions, setPromotions] = useState([]);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
          const loadPromotions = async () => {
               try {
                    setLoading(true);
                    // Fetch all complexes
                    let complexes = [];
                    try {
                         complexes = await fetchFieldComplexes();
                         if (!Array.isArray(complexes)) {
                              complexes = [];
                         }
                         // Filter only Active complexes for Player
                         complexes = complexes.filter(
                              (complex) => (complex.status || complex.Status || "Active") === "Active"
                         );
                    } catch (error) {
                         console.error("Error fetching complexes:", error);
                         complexes = [];
                    }
                    
                    // Fetch promotions from all complexes
                    const promotionPromises = complexes.map(complex => 
                         fetchPromotionsByComplex(complex.complexId).catch(() => [])
                    );
                    const allPromotions = await Promise.all(promotionPromises);
                    
                    // Filter active promotions
                    const now = new Date();
                    const activePromotions = allPromotions
                         .flat()
                         .filter(promo => {
                              const startDate = new Date(promo.startDate);
                              const endDate = new Date(promo.endDate);
                              return promo.isActive && now >= startDate && now <= endDate;
                         })
                         .sort((a, b) => {
                              // Sort by discount value (percentage first, then by value)
                              const aValue = a.type === "percentage" ? a.value : 0;
                              const bValue = b.type === "percentage" ? b.value : 0;
                              return bValue - aValue;
                         })
                         .slice(0, 3) // Get top 3 promotions
                         .map(promo => {
                              const startDate = new Date(promo.startDate);
                              const endDate = new Date(promo.endDate);
                              const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                              
                              return {
                                   id: promo.promotionId,
                                   title: promo.name,
                                   description: promo.description || "Áp dụng cho các slot được chỉ định",
                                   code: promo.code,
                                   discount: promo.type === "percentage" 
                                        ? `${promo.value}%` 
                                        : `${promo.value.toLocaleString('vi-VN')} VNĐ`,
                                   discountType: promo.type,
                                   discountValue: promo.value,
                                   minOrder: promo.minOrderAmount,
                                   maxDiscount: promo.maxDiscountAmount,
                                   validUntil: endDate.toLocaleDateString('vi-VN'),
                                   daysLeft: daysLeft > 0 ? daysLeft : 0,
                                   usageCount: promo.usedCount || 0,
                                   usageLimit: promo.usageLimit || 0,
                                   complexId: promo.complexId,
                              };
                         });
                    
                    setPromotions(activePromotions);
               } catch (error) {
                    console.error("Error loading promotions:", error);
                    setPromotions([]);
               } finally {
                    setLoading(false);
               }
          };

          loadPromotions();
     }, []);

     const getStatusBadge = (daysLeft) => {
          if (daysLeft <= 7) {
               return {
                    text: "Sắp hết hạn",
                    color: "bg-red-100 text-red-800 border-red-300",
               };
          }
          return {
               text: "Đang diễn ra",
               color: "bg-green-100 text-green-800 border-green-300",
          };
     };

     const containerVariants = {
          hidden: { opacity: 0 },
          visible: {
               opacity: 1,
               transition: {
                    staggerChildren: 0.2,
               },
          },
     };

     const itemVariants = {
          hidden: { y: 30, opacity: 0 },
          visible: {
               y: 0,
               opacity: 1,
               transition: {
                    duration: 0.6,
               },
          },
     };

     return (
          <ScrollReveal direction="up" delay={0.4} margin="70px 0px">
               <Container className=" py-5 max-h-[100vh] rounded-2xl shadow-lg from-teal-50 via-white to-orange-50 border border-gray-200 bg-white">
                    <div className="max-w-7xl mx-auto">
                         <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.6 }}
                              className="text-center mb-3"
                         >
                              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 rounded-full mb-2">
                                   <Sparkles className="w-5 h-5 text-purple-600" />
                                   <span className="text-purple-600 font-semibold">Ưu đãi & Khuyến mãi</span>
                              </div>
                              <h2 className="text-4xl md:text-5xl font-bold text-teal-900 mb-2">
                                   Ưu đãi nổi bật
                              </h2>
                              <p className="text-lg text-teal-600 max-w-2xl mx-auto">
                                   Các chương trình khuyến mãi đang diễn ra - Tiết kiệm khi đặt sân ngay hôm nay
                              </p>
                         </motion.div>

                         {loading ? (
                              <div className="text-center py-12">
                                   <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                                   <p className="mt-4 text-gray-600">Đang tải ưu đãi...</p>
                              </div>
                         ) : promotions.length > 0 ? (
                              <motion.div
                                   variants={containerVariants}
                                   initial="hidden"
                                   whileInView="visible"
                                   viewport={{ once: true }}
                                   className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4"
                              >
                                   {promotions.map((promo) => {
                                        const statusBadge = getStatusBadge(promo.daysLeft);
                                        return (
                                             <motion.div key={promo.id} variants={itemVariants}>
                                                  <Card className="overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border border-purple-100 h-full flex flex-col">
                                                       <div className="relative h-48 overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                                            <div className="absolute top-4 right-4">
                                                                 <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge.color}`}>
                                                                      {statusBadge.text}
                                                                 </span>
                                                            </div>
                                                            <div className="absolute bottom-3 left-4 right-4">
                                                                 <div className="flex items-center gap-2 mb-2">
                                                                      <Percent className="w-8 h-8 text-white" />
                                                                      <span className="text-3xl font-bold text-white">{promo.discount}</span>
                                                                 </div>
                                                                 <p className="text-white/90 text-sm">Giảm giá</p>
                                                            </div>
                                                       </div>

                                                       <div className="p-4 flex-1 flex flex-col">
                                                            <h3 className="text-xl font-bold text-teal-900 mb-1 pb-1 line-clamp-2">{promo.title}</h3>
                                                            <p className="text-teal-600 text-sm mb-3 line-clamp-3 flex-1">{promo.description}</p>

                                                            <div className="space-y-2 mb-3">
                                                                 <div className="flex items-center gap-1 text-sm text-teal-600">
                                                                      <Tag className="w-4 h-4 text-purple-600" />
                                                                      <span className="font-semibold">Mã: {promo.code}</span>
                                                                 </div>
                                                                 <div className="flex items-center gap-1 text-sm text-teal-600">
                                                                      <Calendar className="w-4 h-4 text-teal-600" />
                                                                      <span>Còn {promo.daysLeft} ngày</span>
                                                                 </div>
                                                                 {promo.minOrder > 0 && (
                                                                      <div className="text-xs text-gray-500">
                                                                           Đơn tối thiểu: {promo.minOrder.toLocaleString('vi-VN')} VNĐ
                                                                      </div>
                                                                 )}
                                                                 {promo.usageLimit > 0 && (
                                                                      <div className="text-xs text-gray-500">
                                                                           Đã dùng: {promo.usageCount}/{promo.usageLimit} lượt
                                                                      </div>
                                                                 )}
                                                            </div>

                                                            <Button
                                                                 onClick={() => navigate("/search")}
                                                                 className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-2xl font-semibold"
                                                            >
                                                                 Sử dụng ngay
                                                                 <ArrowRight className="w-4 h-4 ml-2" />
                                                            </Button>
                                                       </div>
                                                  </Card>
                                             </motion.div>
                                        );
                                   })}
                              </motion.div>
                         ) : (
                              <div className="text-center py-12">
                                   <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                   <p className="text-gray-600 text-lg">Hiện chưa có ưu đãi nào</p>
                                   <p className="text-gray-500 text-sm mt-2">Hãy quay lại sau để xem các chương trình khuyến mãi mới</p>
                              </div>
                         )}

                         <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.6 }}
                              className="text-center"
                         >
                              <Button
                                   onClick={() => navigate("/search")}
                                   className="bg-purple-500 hover:bg-purple-600 text-white px-8 rounded-2xl font-semibold text-lg"
                              >
                                   Xem tất cả ưu đãi
                                   <ArrowRight className="w-5 h-5 ml-2" />
                              </Button>
                         </motion.div>
                    </div>
               </Container>
          </ScrollReveal>
     );
};

