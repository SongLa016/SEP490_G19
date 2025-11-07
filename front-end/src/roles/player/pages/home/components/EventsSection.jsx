import { Button, Card, Container } from "../../../../../shared/components/ui";
import { Trophy, Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollReveal } from "../../../../../shared/components/ScrollReveal";
import { motion } from "framer-motion";

export const EventsSection = () => {
     const navigate = useNavigate();

     const events = [
          {
               id: 1,
               title: "Giải bóng đá mini khu vực Hà Nội",
               description: "Giải đấu dành cho các đội bóng đá mini trong khu vực Hà Nội. Tham gia để giành giải thưởng hấp dẫn!",
               date: "15/12/2024",
               location: "Nhiều địa điểm tại Hà Nội",
               participants: 32,
               image: "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
               status: "Đang diễn ra",
               statusColor: "green",
          },
          {
               id: 2,
               title: "Giải đấu cuối tuần - Tháng 12",
               description: "Giải đấu hàng tuần dành cho các đội đam mê bóng đá. Cơ hội giao lưu và thi đấu với nhiều đội mạnh.",
               date: "22/12/2024",
               location: "Sân bóng ABC, Quận Hoàn Kiếm",
               participants: 16,
               image: "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
               status: "Sắp tới",
               statusColor: "blue",
          },
          {
               id: 3,
               title: "Giải vô địch cộng đồng 2024",
               description: "Giải đấu lớn nhất trong năm, quy tụ các đội mạnh nhất từ khắp các khu vực. Đăng ký ngay để có cơ hội tham gia!",
               date: "01/01/2025",
               location: "Sân vận động lớn, Hà Nội",
               participants: 64,
               image: "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
               status: "Sắp tới",
               statusColor: "blue",
          },
     ];

     const getStatusBadge = (status, color) => {
          const colorClasses = {
               green: "bg-green-100 text-green-800 border-green-300",
               blue: "bg-blue-100 text-blue-800 border-blue-300",
          };
          return (
               <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colorClasses[color]}`}>
                    {status}
               </span>
          );
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
                              <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-100 rounded-full mb-2">
                                   <Trophy className="w-5 h-5 text-teal-600" />
                                   <span className="text-teal-600 font-semibold">Sự kiện & Giải đấu</span>
                              </div>
                              <h2 className="text-4xl md:text-5xl font-bold text-teal-900 mb-2">
                                   Giải đấu nổi bật
                              </h2>
                              <p className="text-lg text-teal-600 max-w-2xl mx-auto">
                                   Các giải đấu đang diễn ra và sắp tới - Tham gia để trải nghiệm và giành giải thưởng
                              </p>
                         </motion.div>

                         <motion.div
                              variants={containerVariants}
                              initial="hidden"
                              whileInView="visible"
                              viewport={{ once: true }}
                              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4"
                         >
                              {events.map((event) => (
                                   <motion.div key={event.id} variants={itemVariants}>
                                        <Card className="overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border border-teal-100 h-full flex flex-col">
                                             <div className="relative h-48 overflow-hidden">
                                                  <img
                                                       src={event.image}
                                                       alt={event.title}
                                                       className="w-full h-full object-cover"
                                                  />
                                                  <div className="absolute top-4 right-4">
                                                       {getStatusBadge(event.status, event.statusColor)}
                                                  </div>
                                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                                  <div className="absolute bottom-3 left-4 right-4">
                                                       <Trophy className="w-8 h-8 text-white mb-1" />
                                                  </div>
                                             </div>

                                             <div className="p-4 flex-1 flex flex-col">
                                                  <h3 className="text-xl font-bold text-teal-900 mb-1 pb-1 line-clamp-2">{event.title}</h3>
                                                  <p className="text-teal-600 text-sm mb-3 line-clamp-3 flex-1">{event.description}</p>

                                                  <div className="space-y-2 mb-3">
                                                       <div className="flex items-center gap-1 text-sm text-teal-600">
                                                            <Calendar className="w-4 h-4 text-teal-600" />
                                                            <span>{event.date}</span>
                                                       </div>
                                                       <div className="flex items-center gap-1 text-sm text-teal-600">
                                                            <MapPin className="w-4 h-4 text-teal-600" />
                                                            <span className="truncate">{event.location}</span>
                                                       </div>
                                                       <div className="flex items-center gap-1 text-sm text-teal-600">
                                                            <Users className="w-4 h-4 text-teal-600" />
                                                            <span>{event.participants} đội tham gia</span>
                                                       </div>
                                                  </div>

                                                  <Button
                                                       onClick={() => navigate(`/events/${event.id}`)}
                                                       className="w-full bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-semibold"
                                                  >
                                                       Đăng ký tham gia
                                                       <ArrowRight className="w-4 h-4 ml-2" />
                                                  </Button>
                                             </div>
                                        </Card>
                                   </motion.div>
                              ))}
                         </motion.div>

                         <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.6 }}
                              className="text-center"
                         >
                              <Button
                                   onClick={() => navigate("/events")}
                                   className="bg-teal-500 hover:bg-teal-600 text-white px-8 rounded-2xl font-semibold text-lg"
                              >
                                   Xem tất cả sự kiện
                                   <ArrowRight className="w-5 h-5 ml-2" />
                              </Button>
                         </motion.div>
                    </div>
               </Container>
          </ScrollReveal>
     );
};

