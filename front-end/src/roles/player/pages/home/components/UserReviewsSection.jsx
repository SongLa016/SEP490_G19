import { Container, Card } from "../../../../../shared/components/ui";
import { Star, Users, Trophy, Calendar } from "lucide-react";
import { ScrollReveal } from "../../../../../shared/components/ScrollReveal";
import { motion } from "framer-motion";

export const UserReviewsSection = () => {
     const reviews = [
          {
               id: 1,
               userName: "Đội Bóng ABC",
               avatar: "https://ui-avatars.com/api/?name=ABC&background=14b8a6&color=fff",
               role: "Đội chơi",
               rating: 5,
               review: "Sân bóng rất tốt, nhân viên phục vụ nhiệt tình. Đã đặt nhiều lần và rất hài lòng!",
               bookings: 47,
               matches: 23,
               teamsJoined: 5,
               reputation: "Gold",
               reputationColor: "yellow",
          },
          {
               id: 2,
               userName: "Nguyễn Văn A",
               avatar: "https://ui-avatars.com/api/?name=Nguyen+Van+A&background=f97316&color=fff",
               role: "Người chơi",
               rating: 5,
               review: "Dịch vụ tuyệt vời, giá cả hợp lý. Sẽ tiếp tục đặt sân ở đây!",
               bookings: 32,
               matches: 18,
               teamsJoined: 3,
               reputation: "Silver",
               reputationColor: "gray",
          },
          {
               id: 3,
               userName: "Đội XYZ",
               avatar: "https://ui-avatars.com/api/?name=XYZ&background=8b5cf6&color=fff",
               role: "Đội chơi",
               rating: 4,
               review: "Sân đẹp, sạch sẽ. Chỉ có điều đôi khi khá đông vào cuối tuần.",
               bookings: 89,
               matches: 45,
               teamsJoined: 8,
               reputation: "Platinum",
               reputationColor: "blue",
          },
          {
               id: 4,
               userName: "Trần Thị B",
               avatar: "https://ui-avatars.com/api/?name=Tran+Thi+B&background=ec4899&color=fff",
               role: "Người chơi",
               rating: 5,
               review: "Ứng dụng rất tiện lợi, đặt sân nhanh chóng. Cộng đồng người chơi thân thiện!",
               bookings: 156,
               matches: 78,
               teamsJoined: 12,
               reputation: "Diamond",
               reputationColor: "cyan",
          },
     ];

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
          <ScrollReveal direction="up" delay={0.3}>
               <Container className="my-10 py-8 bg-gradient-to-br rounded-2xl shadow-lg from-teal-50 via-white to-orange-50 border border-gray-200">
                    <div className="max-w-7xl mx-auto">
                         <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.6 }}
                              className="text-center mb-6"
                         >
                              <h2 className="text-4xl md:text-5xl font-bold text-teal-900 mb-3">
                                   Đánh giá & Cộng đồng người dùng
                              </h2>
                              <p className="text-lg text-teal-600 max-w-2xl mx-auto">
                                   Những đánh giá chân thực từ người chơi và đội bóng thực tế
                              </p>
                         </motion.div>

                         <motion.div
                              variants={containerVariants}
                              initial="hidden"
                              whileInView="visible"
                              viewport={{ once: true }}
                              className="grid grid-cols-1 md:grid-cols-2 gap-6"
                         >
                              {reviews.map((review) => (
                                   <motion.div key={review.id} variants={itemVariants}>
                                        <Card className="p-4 bg-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border border-teal-100 h-full">
                                             <div className="flex items-start gap-4 mb-4">
                                                  <img
                                                       src={review.avatar}
                                                       alt={review.userName}
                                                       className="w-16 h-16 rounded-full object-cover ring-4 ring-teal-100"
                                                  />
                                                  <div className="flex-1">
                                                       <div className="flex items-center justify-between mb-1">
                                                            <h4 className="font-bold text-teal-900 text-lg">{review.userName}</h4>
                                                            {getReputationBadge(review.reputation, review.reputationColor)}
                                                       </div>
                                                       <p className="text-sm text-teal-600 mb-2">{review.role}</p>
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

                                             <p className="text-teal-700 mb-4 leading-relaxed">{review.review}</p>

                                             <div className="flex items-center gap-5 pt-4 border-t border-teal-100">
                                                  <div className="flex items-center gap-1 text-sm text-teal-600">
                                                       <Calendar className="w-4 h-4 text-teal-600" />
                                                       <span className="font-semibold">{review.bookings}</span>
                                                       <span>lượt đặt</span>
                                                  </div>
                                                  <div className="flex items-center gap-1 text-sm text-teal-600">
                                                       <Trophy className="w-4 h-4 text-orange-600" />
                                                       <span className="font-semibold">{review.matches}</span>
                                                       <span>trận đấu</span>
                                                  </div>
                                                  <div className="flex items-center gap-1 text-sm text-teal-600">
                                                       <Users className="w-4 h-4 text-purple-600" />
                                                       <span className="font-semibold">{review.teamsJoined}</span>
                                                       <span>đội tham gia</span>
                                                  </div>
                                             </div>
                                        </Card>
                                   </motion.div>
                              ))}
                         </motion.div>
                    </div>
               </Container>
          </ScrollReveal>
     );
};

