import { useState, useEffect } from "react";
import { Container, Card } from "../../../../../shared/components/ui";
import { Star, Calendar } from "lucide-react";
import { ScrollReveal } from "../../../../../shared/components/ScrollReveal";
import { motion } from "framer-motion";
import { fetchRatingsByField } from "../../../../../shared/services/ratings";
import { fetchFields } from "../../../../../shared/index";

export const UserReviewsSection = () => {
     const [reviews, setReviews] = useState([]);
     const [isLoading, setIsLoading] = useState(true);

     useEffect(() => {
          const loadReviews = async () => {
               try {
                    setIsLoading(true);
                    // Lấy danh sách fields
                    const fields = await fetchFields({ query: "", useApi: true });

                    if (!Array.isArray(fields) || fields.length === 0) {
                         setReviews([]);
                         return;
                    }

                    // Lấy ratings từ tất cả fields (lấy một số fields đầu tiên để tránh quá nhiều requests)
                    const fieldsToFetch = fields.slice(0, 10); // Lấy 10 fields đầu tiên
                    const ratingsPromises = fieldsToFetch.map(async (field) => {
                         try {
                              const fieldRatings = await fetchRatingsByField(field.fieldId);
                              // Số lượt đặt = số lượng ratings của field (mỗi rating thường tương ứng với một booking đã hoàn thành)
                              const totalBookings = fieldRatings.length;

                              // Map ratings với thông tin field
                              return fieldRatings.map(rating => ({
                                   ...rating,
                                   fieldName: field.name || rating.fieldName || "Sân bóng",
                                   fieldId: field.fieldId,
                                   totalBookings: totalBookings, // Số lượt đặt = số ratings của field
                              }));
                         } catch (error) {
                              console.error(`Error loading ratings for field ${field.fieldId}:`, error);
                              return [];
                         }
                    });

                    const allRatingsArrays = await Promise.all(ratingsPromises);
                    const allRatings = allRatingsArrays.flat();

                    // Sắp xếp theo ngày tạo mới nhất và lấy 4 reviews đầu tiên
                    const sortedRatings = allRatings
                         .sort((a, b) => {
                              const dateA = new Date(a.createdAt || 0);
                              const dateB = new Date(b.createdAt || 0);
                              return dateB - dateA;
                         })
                         .slice(0, 4);

                    // Map sang format hiển thị
                    const mappedReviews = sortedRatings.map((rating, index) => {
                         const userName = rating.userName || "Người dùng";

                         // Tính reputation dựa trên số lượt đặt
                         const bookings = rating.totalBookings || 0;
                         let reputation = "Silver";
                         let reputationColor = "gray";
                         if (bookings >= 100) {
                              reputation = "Diamond";
                              reputationColor = "cyan";
                         } else if (bookings >= 50) {
                              reputation = "Platinum";
                              reputationColor = "blue";
                         } else if (bookings >= 20) {
                              reputation = "Gold";
                              reputationColor = "yellow";
                         }

                         return {
                              id: rating.ratingId || index + 1,
                              userName: userName,
                              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=14b8a6&color=fff`,
                              role: "Người chơi", // Có thể cập nhật sau nếu có thông tin team
                              rating: rating.stars || 0,
                              review: rating.comment || "",
                              fieldName: rating.fieldName || "Sân bóng",
                              bookings: bookings,
                              matches: Math.floor(bookings / 2), // Ước tính số trận đấu
                              teamsJoined: Math.floor(bookings / 10), // Ước tính số đội tham gia
                              reputation: reputation,
                              reputationColor: reputationColor,
                         };
                    });

                    setReviews(mappedReviews);
               } catch (error) {
                    console.error("Error loading reviews:", error);
                    setReviews([]);
               } finally {
                    setIsLoading(false);
               }
          };

          loadReviews();
     }, []);

     const getReputationBadge = (reputation, color) => {
          const colorClasses = {
               yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
               gray: "bg-gray-100 text-gray-800 border-gray-300",
               blue: "bg-blue-100 text-blue-800 border-blue-300",
               cyan: "bg-cyan-100 text-cyan-800 border-cyan-300",
          };
          return (
               <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colorClasses[color]}`}>
                    {reputation}
               </span>
          );
     };

     const containerVariants = {
          hidden: { opacity: 0 },
          visible: {
               opacity: 1,
               transition: {
                    staggerChildren: 0.15,
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
          <ScrollReveal direction="up" delay={0.3} margin="70px 0px">
               <Container className=" py-8 max-h-[100vh] bg-gradient-to-br rounded-2xl shadow-lg from-teal-50 via-white to-orange-50 border border-gray-200">
                    <div className="max-w-7xl mx-auto">
                         <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.6 }}
                              className="text-center mb-4"
                         >
                              <h2 className="text-3xl md:text-4xl font-bold text-teal-900 mb-2">
                                   Đánh giá & Cộng đồng người dùng
                              </h2>
                              <p className="text-lg text-teal-600 max-w-2xl mx-auto">
                                   Những đánh giá chân thực từ người chơi và đội bóng thực tế
                              </p>
                         </motion.div>

                         {isLoading ? (
                              <div className="text-center pb-6">
                                   <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                                   <p className="mt-2 text-sm text-teal-600">Đang tải đánh giá...</p>
                              </div>
                         ) : reviews.length === 0 ? (
                              <div className="text-center pb-6">
                                   <p className="text-teal-600">Chưa có đánh giá nào.</p>
                              </div>
                         ) : (
                              <motion.div
                                   variants={containerVariants}
                                   initial="hidden"
                                   whileInView="visible"
                                   viewport={{ once: true }}
                                   className="grid grid-cols-1 md:grid-cols-2 gap-6"
                              >
                                   {reviews.map((review) => (
                                        <motion.div key={review.id} variants={itemVariants}>
                                             <Card className="p-4 bg-white rounded-3xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border border-teal-600 h-full">
                                                  <div className="flex items-start gap-4 mb-1">
                                                       <img
                                                            src={review.avatar}
                                                            alt={review.userName}
                                                            className="w-16 h-16 rounded-full object-cover ring-4 ring-teal-100"
                                                       />
                                                       <div className="flex-1 ">
                                                            <div className="flex items-center justify-between">
                                                                 <h4 className="font-bold text-teal-900 text-lg">{review.userName}</h4>
                                                                 {getReputationBadge(review.reputation, review.reputationColor)}
                                                            </div>
                                                            <p className="text-sm text-teal-600">{review.role}</p>
                                                            <div className="flex items-center gap-1">
                                                                 {[...Array(5)].map((_, i) => (
                                                                      <Star
                                                                           key={i}
                                                                           className={`w-4 h-4 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                                                                }`}
                                                                      />
                                                                 ))}
                                                            </div>
                                                       </div>
                                                  </div>

                                                  <p className="text-teal-800 my-2 pl-4 leading-relaxed">{review.review}</p>

                                                  {/* Hiển thị tên sân */}
                                                  {review.fieldName && (
                                                       <div className="mb-3 p-2 rounded-2xl flex items-center gap-2 bg-teal-50 border border-teal-200">
                                                            <p className="text-sm text-teal-600">Sân đánh giá:</p>
                                                            <p className="text-sm font-semibold text-teal-800">{review.fieldName}</p>
                                                       </div>
                                                  )}

                                                  <div className="flex items-center justify-end gap-5 pt-4 border-t border-teal-100">
                                                       <div className="flex items-center gap-1 text-sm text-teal-600">
                                                            <Calendar className="w-4 h-4 text-teal-600" />
                                                            <span className="font-semibold">{review.bookings}</span>
                                                            <span>lượt đặt</span>
                                                       </div>
                                                  </div>
                                             </Card>
                                        </motion.div>
                                   ))}
                              </motion.div>
                         )}
                    </div>
               </Container>
          </ScrollReveal>
     );
};

