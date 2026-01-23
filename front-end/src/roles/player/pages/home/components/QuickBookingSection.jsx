
import { Container, Button, Card } from "../../../../../shared/components/ui";
import { MapPin, Star, Sparkles, LogIn, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollReveal } from "../../../../../shared/components/ScrollReveal";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { fetchFieldComplexes, fetchFields } from "../../../../../shared/services/fields";
import { fetchRatingsByComplex } from "../../../../../shared/services/ratings";

export const QuickBookingSection = ({ user }) => {
     const navigate = useNavigate();
     const [nearbyFields, setNearbyFields] = useState([]);
     const [topRatedFields, setTopRatedFields] = useState([]);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
          const loadData = async () => {
               try {
                    setLoading(true);
                    // Fetch all complexes and fields
                    let complexes = [];
                    let allFields = [];

                    try {
                         let fetchedComplexes = await fetchFieldComplexes();
                         if (!Array.isArray(fetchedComplexes)) {
                              fetchedComplexes = [];
                         }
                         // Filter only Active complexes for Player
                         complexes = fetchedComplexes.filter(
                              (complex) => (complex.status || complex.Status || "Active") === "Active"
                         );
                    } catch (error) {
                         console.error("Error fetching complexes:", error);
                         complexes = [];
                    }

                    try {
                         allFields = await fetchFields();
                         if (!Array.isArray(allFields)) {
                              allFields = [];
                         }
                    } catch (error) {
                         console.error("Error fetching fields:", error);
                         allFields = [];
                    }

                    // Fetch rating statistics for each active complex (parallel)
                    const ratingStats = await Promise.all(
                         complexes.map(async (complex) => {
                              try {
                                   const ratings = await fetchRatingsByComplex(complex.complexId);
                                   if (!Array.isArray(ratings) || ratings.length === 0) {
                                        return { complexId: complex.complexId, averageRating: 0, reviewCount: 0 };
                                   }

                                   const totalStars = ratings.reduce(
                                        (sum, rating) => sum + Number(rating.stars || rating.rating || 0),
                                        0
                                   );
                                   return {
                                        complexId: complex.complexId,
                                        averageRating: totalStars / ratings.length,
                                        reviewCount: ratings.length
                                   };
                              } catch (error) {
                                   console.error("Error fetching ratings for complex:", complex.complexId, error);
                                   return { complexId: complex.complexId, averageRating: 0, reviewCount: 0 };
                              }
                         })
                    );

                    const ratingMap = new Map(ratingStats.map((stat) => [stat.complexId, stat]));

                    const complexMap = new Map((complexes || []).map(c => [c.complexId, c]));

                    const fieldsWithMetadata = allFields
                         .filter(f => f)
                         .map(field => {
                              const ratingInfo = ratingMap.get(field.complexId) || { averageRating: 0, reviewCount: 0 };
                              const complex = complexMap.get(field.complexId);
                              const primaryImage = field.mainImageUrl
                                   || (Array.isArray(field.imageUrls) ? field.imageUrls.find((u) => u && u.trim() !== "") : null)
                                   || null;

                              return {
                                   id: field.fieldId,
                                   name: field.name || "Sân bóng",
                                   location: field.address || complex?.address || "Đang cập nhật",
                                   distance: "Gần bạn",
                                   price: `${(field.pricePerHour || field.priceForSelectedSlot || 0).toLocaleString('vi-VN')} VNĐ`,
                                   rating: Number(ratingInfo.averageRating || 0),
                                   reviewCount: ratingInfo.reviewCount || 0,
                                   mainImageUrl: primaryImage,
                              };
                         })
                         .filter(f => f.location); // bỏ các sân không có địa chỉ

                    setNearbyFields(fieldsWithMetadata.slice(0, 2));

                    const ratedFields = fieldsWithMetadata
                         .filter(field => field.rating > 0)
                         .sort((a, b) => {
                              if (b.rating === a.rating) {
                                   return (b.reviewCount || 0) - (a.reviewCount || 0);
                              }
                              return b.rating - a.rating;
                         })
                         .slice(0, 2);
                    setTopRatedFields(ratedFields);
               } catch (error) {
                    console.error("Error loading data:", error);
                    // Fallback to empty arrays on error
                    setNearbyFields([]);
                    setTopRatedFields([]);
               } finally {
                    setLoading(false);
               }
          };

          loadData();
     }, []);

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
          <ScrollReveal direction="up" delay={0.1} margin="70px 0px">
               <Container className=" py-5 rounded-2xl shadow-lg max-h-[100vh] bg-white/80 backdrop-blur-sm border border-gray-200">
                    <div className="max-w-7xl mx-auto">
                         <motion.div
                              initial={{ opacity: 0, y: 16 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.5 }}
                              className="text-center mb-3"
                         >
                              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-3">
                                   Đặt sân nhanh chóng
                              </h2>
                              <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
                                   Tìm sân phù hợp, đặt lịch dễ dàng với những gợi ý được yêu thích nhất
                              </p>
                         </motion.div>

                         <motion.div
                              variants={containerVariants}
                              initial="hidden"
                              whileInView="visible"
                              viewport={{ once: true }}
                              className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6 mb-3"
                         >
                              {/* Đặt sân gần bạn */}
                              <motion.div variants={itemVariants}>
                                   <Card className="h-full p-3 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-teal-100">
                                        <div className="flex items-center gap-3 mb-3">
                                             <div className="p-3 bg-teal-100 rounded-xl">
                                                  <MapPin className="w-6 h-6 text-teal-600" />
                                             </div>
                                             <h3 className="text-xl font-bold text-gray-900">Đặt sân gần bạn</h3>
                                        </div>
                                        <p className="text-gray-600 mb-4">Sân bóng được đề xuất theo vị trí của bạn</p>

                                        <div className="space-y-3">
                                             {loading ? (
                                                  <div className="text-center py-4 text-gray-500">Đang tải...</div>
                                             ) : nearbyFields.length > 0 ? (
                                                  nearbyFields.map((field) => (
                                                       <motion.div
                                                            key={field.id}
                                                            whileHover={{ scale: 1.02 }}
                                                            className="flex items-center border border-teal-200 gap-3 p-3 bg-gray-50 rounded-2xl cursor-pointer hover:bg-teal-50 transition-colors"
                                                            onClick={() => navigate(`/field/${field.id}`)}
                                                       >
                                                            <img
                                                                 src={field.mainImageUrl || 'https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg'}
                                                                 alt={field.name}
                                                                 className="w-16 h-16 rounded-lg object-cover"
                                                                 onError={(e) => {
                                                                      e.target.src = 'https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg';
                                                                 }}
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                 <h4 className="font-semibold text-gray-900 truncate">{field.name}</h4>
                                                                 <p className="text-sm text-gray-600 truncate">{field.location}</p>
                                                                 <p className="text-xs text-teal-600 font-medium">{field.distance} • {field.price}</p>
                                                            </div>
                                                       </motion.div>
                                                  ))
                                             ) : (
                                                  <div className="text-center py-4 text-gray-500">Chưa có sân gần bạn</div>
                                             )}
                                        </div>

                                        <div className="mt-5">
                                             <Button
                                                  onClick={() => navigate("/search")}
                                                  className="w-full bg-teal-500 hover:bg-teal-600 text-white rounded-2xl"
                                             >
                                                  Xem thêm sân gần bạn
                                                  <ArrowRight className="w-4 h-4 ml-2" />
                                             </Button>
                                        </div>
                                   </Card>
                              </motion.div>

                              {/* Đánh giá tốt nhất */}
                              <motion.div variants={itemVariants}>
                                   <Card className="h-full p-3 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-yellow-100">
                                        <div className="flex items-center gap-3 mb-3">
                                             <div className="p-3 bg-yellow-100 rounded-xl">
                                                  <Star className="w-6 h-6 text-yellow-600" />
                                             </div>
                                             <h3 className="text-xl font-bold text-gray-900">Đánh giá tốt nhất</h3>
                                        </div>
                                        <p className="text-gray-600 mb-4">Những sân bóng được đánh giá cao nhất</p>

                                        <div className="space-y-3">
                                             {loading ? (
                                                  <div className="text-center py-4 text-gray-500">Đang tải...</div>
                                             ) : topRatedFields.length > 0 ? (
                                                  topRatedFields.map((field) => {
                                                       const hasRating = field.rating > 0;
                                                       const ratingLabel = hasRating
                                                            ? `⭐ ${field.rating.toFixed(1)} điểm • ${field.reviewCount || 0} đánh giá`
                                                            : "Chưa có đánh giá";
                                                       return (
                                                            <motion.div
                                                                 key={field.id}
                                                                 whileHover={{ scale: 1.02 }}
                                                                 className="flex items-center border border-yellow-200 gap-3 p-3 bg-gray-50 rounded-2xl cursor-pointer hover:bg-yellow-50 transition-colors"
                                                                 onClick={() => navigate(`/field/${field.id}`)}
                                                            >
                                                                 <img
                                                                      src={field.mainImageUrl || 'https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg'}
                                                                      alt={field.name}
                                                                      className="w-16 h-16 rounded-lg object-cover"
                                                                      onError={(e) => {
                                                                           e.target.src = 'https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg';
                                                                      }}
                                                                 />
                                                                 <div className="flex-1 min-w-0">
                                                                      <h4 className="font-semibold text-gray-900 truncate">{field.name}</h4>
                                                                      <p className="text-sm text-gray-600 truncate">{field.location}</p>
                                                                      <p className={`text-xs font-medium ${hasRating ? "text-yellow-700" : "text-gray-500"}`}>
                                                                           {ratingLabel} • {field.price}
                                                                      </p>
                                                                 </div>
                                                            </motion.div>
                                                       );
                                                  })
                                             ) : (
                                                  <div className="text-center py-4 text-gray-500">Chưa có sân đánh giá</div>
                                             )}
                                        </div>

                                        <div className="mt-5">
                                             <Button
                                                  onClick={() => navigate("/search")}
                                                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl"
                                             >
                                                  Xem tất cả sân đánh giá cao
                                                  <ArrowRight className="w-4 h-4 ml-2" />
                                             </Button>
                                        </div>
                                   </Card>
                              </motion.div>

                              {/* Đặt sân cố định */}
                              <motion.div variants={itemVariants}>
                                   <Card className="h-full p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

                                        <div className="relative z-10">
                                             <div className="flex items-center gap-3 mb-4">
                                                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                                       <Sparkles className="w-6 h-6 text-white" />
                                                  </div>
                                                  <h3 className="text-xl font-bold">Đặt sân cố định</h3>
                                             </div>
                                             <p className="text-white/90 mb-6 text-sm">Đặt lịch cố định hàng tuần để giữ chỗ yêu thích của bạn</p>

                                             <div className="space-y-4 mb-4">
                                                  <motion.div
                                                       whileHover={{ scale: 1.05 }}
                                                       className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30"
                                                  >
                                                       <div className="flex items-start justify-between mb-2">
                                                            <div>
                                                                 <h4 className="font-bold text-base">Tiện lợi & Nhanh chóng</h4>
                                                                 <p className="text-sm text-white/80">Không cần đặt lại mỗi tuần</p>
                                                            </div>
                                                       </div>
                                                  </motion.div>
                                                  <motion.div
                                                       whileHover={{ scale: 1.05 }}
                                                       className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30"
                                                  >
                                                       <div className="flex items-start justify-between mb-2">
                                                            <div>
                                                                 <h4 className="font-bold text-base">Giữ chỗ ưu tiên</h4>
                                                                 <p className="text-sm text-white/80">Đảm bảo có sân vào khung giờ yêu thích</p>
                                                            </div>
                                                       </div>
                                                  </motion.div>
                                             </div>

                                             <div className="mt-2">
                                                  <Button
                                                       onClick={() => navigate("/search")}
                                                       className="w-full bg-white text-purple-600 hover:bg-gray-100 hover:text-purple-600 rounded-2xl font-semibold"
                                                  >
                                                       Tìm sân ngay
                                                       <ArrowRight className="w-4 h-4 ml-2" />
                                                  </Button>
                                             </div>
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
                                   <Card className="py-2 px-3  bg-gradient-to-r from-teal-500 to-teal-600 rounded-3xl shadow-lg text-white">
                                        <div className="flex items-center justify-between flex-wrap gap-4">
                                             <div className="flex items-center gap-3">
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

