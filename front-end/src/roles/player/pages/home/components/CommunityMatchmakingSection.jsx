import { Button, Card, Section } from "../../../../../shared/components/ui";
import { Users, Search, Trophy, Clock, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollReveal } from "../../../../../shared/components/ScrollReveal";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { fetchMatchRequests } from "../../../../../shared/services/matchRequests";

export const CommunityMatchmakingSection = () => {
     const navigate = useNavigate();
     const [matchPosts, setMatchPosts] = useState([]);
     const [loading, setLoading] = useState(true);

     const matchmakingFeatures = [
          {
               icon: Search,
               title: "Tìm đối",
               description: "Tìm đội đối thủ phù hợp để thi đấu",
               color: "teal",
          },
          {
               icon: Users,
               title: "Tham gia kèo",
               description: "Tham gia các kèo đang tìm người chơi",
               color: "purple",
          },
     ];

     useEffect(() => {
          const loadMatchRequests = async () => {
               try {
                    setLoading(true);
                    const result = await fetchMatchRequests({ page: 1, size: 10 });
                    
                    if (result.success && result.data && Array.isArray(result.data)) {
                         // Helper function to get booking info
                         const getBookingInfo = (request) => {
                              const booking = request.booking || request.bookingInfo || request.bookingDetails || {};
                              return {
                                   fieldName: booking.fieldName || request.fieldName || "",
                                   fieldAddress: booking.fieldAddress || booking.address || request.complexName || request.location || "",
                                   date: request.matchDate || booking.date || request.booking?.date,
                                   slotName: booking.slotName || booking.time || "",
                              };
                         };
                         
                         // Map API data to component format
                         const mappedPosts = result.data
                              .filter(request => {
                                   // Filter out expired, cancelled, and rejected requests
                                   const status = (request.status || request.Status || "").toLowerCase();
                                   return !["expired", "cancelled", "rejected", "closed"].includes(status);
                              })
                              .slice(0, 3) // Limit to 3 posts
                              .map((request) => {
                                   const bookingInfo = getBookingInfo(request);
                                   
                                   // Parse date and time
                                   const matchDate = request.matchDate || request.MatchDate || bookingInfo.date;
                                   const slotName = bookingInfo.slotName || request.startTime || "";
                                   
                                   let timeDisplay = "Chưa xác định";
                                   if (matchDate) {
                                        try {
                                             const date = new Date(matchDate);
                                             if (!isNaN(date.getTime())) {
                                                  const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
                                                  const dayName = dayNames[date.getDay()];
                                                  const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                                                  
                                                  if (slotName) {
                                                       timeDisplay = `${dayName}, ${dateStr} - ${slotName}`;
                                                  } else {
                                                       timeDisplay = `${dayName}, ${dateStr}`;
                                                  }
                                             }
                                        } catch (e) {
                                             timeDisplay = "Chưa xác định";
                                        }
                                   }
                                   
                                   // Get location
                                   const location = bookingInfo.fieldAddress || 
                                                  request.location ||
                                                  request.address ||
                                                  request.complexName ||
                                                  "Chưa xác định";
                                   
                                   // Get team/player name
                                   const teamName = request.creatorTeamName || 
                                                  request.homeTeamName ||
                                                  request.hostTeamName ||
                                                  request.ownerName ||
                                                  request.createdByName ||
                                                  request.owner?.name ||
                                                  request.createdBy ||
                                                  "Người chơi";
                                   
                                   // Calculate players needed
                                   const maxPlayers = request.maxPlayers || request.MaxPlayers || request.maxParticipants || 0;
                                   const currentPlayers = request.currentPlayers || request.CurrentPlayers || request.currentParticipants || 0;
                                   const playersNeeded = Math.max(0, maxPlayers - currentPlayers);
                                   
                                   // Determine type based on request
                                   const type = playersNeeded > 0 ? "recruit" : "match";
                                   
                                   return {
                                        id: request.requestId || request.RequestID || request.id || request.matchRequestId,
                                        teamName: teamName,
                                        need: playersNeeded > 0 ? "Cần thêm người" : "Tìm đối",
                                        time: timeDisplay,
                                        location: location,
                                        playersNeeded: playersNeeded,
                                        type: type,
                                        requestId: request.requestId || request.RequestID || request.id || request.matchRequestId,
                                   };
                              });
                         
                         setMatchPosts(mappedPosts);
                    } else {
                         setMatchPosts([]);
                    }
               } catch (error) {
                    console.error("Error loading match requests:", error);
                    setMatchPosts([]);
               } finally {
                    setLoading(false);
               }
          };

          loadMatchRequests();
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
                                   Tìm đối, tham gia kèo - Kết nối với cộng đồng người chơi bóng đá
                              </p>
                         </motion.div>

                         {/* Features */}
                         <motion.div
                              variants={containerVariants}
                              initial="hidden"
                              whileInView="visible"
                              viewport={{ once: true }}
                              className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3"
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
                              {loading ? (
                                   <div className="text-center py-8">
                                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                                        <p className="mt-4 text-white/80">Đang tải kèo...</p>
                                   </div>
                              ) : matchPosts.length > 0 ? (
                                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {matchPosts.map((post) => (
                                             <motion.div
                                                  key={post.id}
                                                  whileHover={{ scale: 1.02, y: -5 }}
                                                  className="relative"
                                             >
                                                  <Card className="p-3 bg-white/95 backdrop-blur rounded-2xl hover:shadow-xl transition-all duration-300 border border-white/20 h-full max-h-[200px]">
                                                       <div className="flex items-start gap-3 mb-2">
                                                            <div className="p-2 bg-teal-100 rounded-lg">
                                                                 <Users className="w-5 h-5 text-teal-600" />
                                                            </div>
                                                            <div className="flex-1">
                                                                 <h4 className="font-bold text-slate-900 truncate">{post.teamName}</h4>
                                                                 <p className="text-sm text-teal-600 font-medium">{post.need}</p>
                                                            </div>
                                                       </div>

                                                       <div className="space-y-2 mb-2">
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                 <Clock className="w-4 h-4" />
                                                                 <span className="truncate">{post.time}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                 <MapPin className="w-4 h-4" />
                                                                 <span className="truncate">{post.location}</span>
                                                            </div>
                                                            {post.playersNeeded > 0 && (
                                                                 <div className="flex items-center gap-2 text-sm text-orange-600 font-medium">
                                                                      <Users className="w-4 h-4" />
                                                                      <span>Cần thêm {post.playersNeeded} người</span>
                                                                 </div>
                                                            )}
                                                       </div>

                                                       <Button
                                                            onClick={() => navigate(`/community?requestId=${post.requestId || post.id}`)}
                                                            className="w-full bg-teal-500 hover:bg-teal-600 text-white rounded-2xl"
                                                       >
                                                            {post.type === "match" && "Xem chi tiết"}
                                                            {post.type === "recruit" && "Tham gia ngay"}
                                                       </Button>
                                                  </Card>
                                             </motion.div>
                                        ))}
                                   </div>
                              ) : (
                                   <div className="text-center py-8">
                                        <Users className="w-16 h-16 text-white/50 mx-auto mb-4" />
                                        <p className="text-white/80 text-lg">Hiện chưa có kèo nào</p>
                                        <p className="text-white/60 text-sm mt-2">Hãy quay lại sau để xem các kèo mới</p>
                                   </div>
                              )}
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
                                   onClick={() => navigate("/community?action=find-opponent")}
                                   className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 rounded-2xl font-semibold text-lg"
                              >
                                   <Search className="w-5 h-5 mr-2" />
                                   Đăng bài tìm đối
                              </Button>
                              <Button
                                   onClick={() => navigate("/community?action=join")}
                                   className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-3 rounded-2xl font-semibold text-lg"
                              >
                                   <Users className="w-5 h-5 mr-2" />
                                   Tham gia kèo
                              </Button>
                         </motion.div>
                    </div>
               </Section>
          </ScrollReveal>
     );
};

