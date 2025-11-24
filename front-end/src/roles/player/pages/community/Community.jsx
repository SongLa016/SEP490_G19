import { useEffect, useState, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, UserPlus, X } from "lucide-react";
import {
     Button,
     Avatar,
     AvatarImage,
     AvatarFallback,
     Card,
     CardContent,
} from "../../../../shared/components/ui";
import NewThreadModal from "./components/NewThreadModal";
import ThreadsFeed from "./components/ThreadsFeed";
import CommunityHeader from "./components/CommunityHeader";
import { useAuth } from "../../../../contexts/AuthContext";
import { listMatchRequests } from "../../../../shared/index";
import { createPost } from "../../../../shared/services/posts";
import FindMatch from "./components/FindMatch";
import TeamList from "./components/TeamList";
import Swal from 'sweetalert2';

export default function Community() {
     const locationRouter = useLocation();
     const { user, logout } = useAuth();
     const [activeTab, setActiveTab] = useState("danh-cho-ban"); // danh-cho-ban | tim-doi-thu | tao-doi
     const [filterLocation] = useState("");
     const [filterDate] = useState("");
     const [matchRequests, setMatchRequests] = useState([]);
     const [matchPage, setMatchPage] = useState(1);
     const [highlightPostId, setHighlightPostId] = useState(null);
     const [showNewThread, setShowNewThread] = useState(false);
     const [newPostContent, setNewPostContent] = useState("");
     const [newPostTitle, setNewPostTitle] = useState("");
     const [selectedField, setSelectedField] = useState(null);
     const [showLoginPrompt, setShowLoginPrompt] = useState(true); // Control visibility of login prompt
     const [refreshTrigger, setRefreshTrigger] = useState(0); // Trigger to refresh ThreadsFeed
     const highlightRef = useRef(null);
     const matchEndRef = useRef(null);
     const pageSize = 10;
     const visibleMatchRequests = matchRequests.slice(0, matchPage * pageSize);

     // Function to handle post submission
     const handlePostSubmit = async (title, content, field, imageFile) => {
          if (!user || !content.trim()) return;

          try {
               await createPost({
                    title: title || "",
                    content: content,
                    fieldId: field?.fieldId || 0,
                    imageFiles: imageFile
               });
               // Trigger refresh in ThreadsFeed
               setRefreshTrigger(prev => prev + 1);
               setNewPostContent("");
               setNewPostTitle("");
               setSelectedField(null);
               setShowNewThread(false);

               // Show success message
               Swal.fire({
                    icon: 'success',
                    title: 'Đã đăng!',
                    text: 'Bài viết của bạn đã được đăng thành công',
                    timer: 2000,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end'
               });
          } catch (error) {
               console.error("Error creating post:", error);
               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: error.message || 'Không thể tạo bài viết. Vui lòng thử lại.',
                    confirmButtonText: 'Đã hiểu'
               });
          }
     };

     const handleOpenTeamCreation = () => {

     };


     useEffect(() => {
          const st = locationRouter?.state || {};
          if (st.tab) {
               // Only allow "danh-cho-ban" tab if not logged in
               if (!user && st.tab !== "danh-cho-ban") {
                    setActiveTab("danh-cho-ban");
               } else {
                    setActiveTab(st.tab);
               }
          }
          if (st.highlightPostId) setHighlightPostId(st.highlightPostId);
     }, [locationRouter?.state, user]);

     useEffect(() => {
          if (!user && activeTab !== "danh-cho-ban") {
               setActiveTab("danh-cho-ban");
          }
     }, [user, activeTab]);


     useEffect(() => {
          // Brief loading indication when switching tabs
          window.scrollTo({
               top: 0,
               behavior: 'smooth'
          });
     }, [activeTab]);

     // Auto scroll to highlighted post
     useEffect(() => {
          if (!highlightPostId) return;
          if (highlightRef.current) {
               highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
               const timer = setTimeout(() => setHighlightPostId(null), 6000);
               return () => clearTimeout(timer);
          }
     }, [highlightPostId]);

     // Note: Posts are now loaded via API in ThreadsFeed component

     useEffect(() => {
          setMatchRequests(listMatchRequests({ status: "Open" }));
     }, [filterLocation, filterDate]);

     // Observe end for match infinite scroll
     useEffect(() => {
          if (activeTab !== "tim-doi-thu") return;
          const el = matchEndRef.current;
          if (!el) return;
          const io = new IntersectionObserver((entries) => {
               entries.forEach((e) => {
                    if (e.isIntersecting) {
                         setMatchPage((p) => (visibleMatchRequests.length >= matchRequests.length ? p : p + 1));
                    }
               });
          }, { root: null, threshold: 0.1 });
          io.observe(el);
          return () => io.disconnect();
     }, [activeTab, matchRequests.length, visibleMatchRequests.length]);

     return (
          <div className="bg-gray-200 min-h-screen">
               {/* Community Header */}
               <CommunityHeader user={user} onLoggedOut={logout} />

               {/* Main Content */}
               <div className="ml-0 md:ml-8 lg:ml-16 px-3 md:px-4 flex justify-center">
                    <div className="max-w-2xl w-full">


                         {/* Tabs với Underline Slide Animation */}
                         <motion.div
                              className="py-2"
                              initial={{ opacity: 0, y: -20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5 }}
                         >
                              <div className="flex justify-center gap-1 relative overflow-x-auto whitespace-nowrap px-1">
                                   {[
                                        { id: "danh-cho-ban", label: "Dành cho bạn" },
                                        ...(user ? [
                                             { id: "tim-doi-thu", label: "Tìm đối thủ" },
                                             { id: "tao-doi", label: "Tạo đội" },
                                        ] : []),
                                   ].map((tab, index) => (
                                        <motion.div
                                             key={tab.id}
                                             className="relative"
                                             initial={{ opacity: 0, x: -10 }}
                                             animate={{ opacity: 1, x: 0 }}
                                             transition={{ delay: index * 0.1, duration: 0.3 }}
                                        >
                                             <motion.div
                                                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                                                  initial={{ scaleX: 0 }}
                                                  animate={{ scaleX: activeTab === tab.id ? 1 : 0 }}
                                                  transition={{ duration: 0.3, ease: "easeInOut" }}
                                             />
                                             <motion.div

                                                  whileTap={{ y: 1 }}
                                             >
                                                  <Button
                                                       onClick={() => setActiveTab(tab.id)}
                                                       className={`px-3 py-1 text-sm font-medium rounded-xl transition-all duration-200 relative ${activeTab === tab.id
                                                            ? "border-b-2 border-teal-500 font-bold bg-white text-teal-600"
                                                            : "border-transparent bg-transparent text-gray-500 hover:text-gray-700"
                                                            }`}
                                                  >
                                                       <motion.span
                                                            animate={activeTab === tab.id ? { fontWeight: 600 } : { fontWeight: 400 }}
                                                            transition={{ duration: 0.2 }}
                                                       >
                                                            {tab.label}
                                                       </motion.span>
                                                  </Button>
                                             </motion.div>
                                        </motion.div>
                                   ))}
                              </div>
                         </motion.div>

                         {/* Post Creation Area - Only for logged users */}


                         {/* Content based on active tab với Smooth Transitions */}
                         <AnimatePresence mode="wait">
                              {activeTab === "danh-cho-ban" && (
                                   <motion.div
                                        key="danh-cho-ban"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.4, ease: "easeInOut" }}
                                        className="border border-b-0 overflow-y-auto scrollbar-hide rounded-t-3xl bg-white border-gray-400 flex flex-col"
                                        style={{ height: 'calc(108.5vh - 120px)' }}
                                   >
                                        {user && (
                                             <motion.div
                                                  className="px-3 py-0.5 flex gap-2 items-center border-b border-gray-300"
                                                  initial={{ opacity: 0, y: -10 }}
                                                  animate={{ opacity: 1, y: 0 }}
                                                  transition={{ delay: 0.2, duration: 0.4 }}
                                             >
                                                  <div className="flex w-11/12 items-center px-4 gap-3">
                                                       <motion.div
                                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                                            transition={{ duration: 0.2 }}
                                                       >
                                                            <Avatar className="w-8 h-8">
                                                                 <AvatarImage src={user.avatar} />
                                                                 <AvatarFallback className="bg-gray-200 text-gray-700">
                                                                      {user.name?.charAt(0) || "U"}
                                                                 </AvatarFallback>
                                                            </Avatar>
                                                       </motion.div>
                                                       <div className="flex items-center justify-between w-full gap-3">
                                                            <motion.div
                                                                 onClick={() => setShowNewThread(true)}
                                                                 className="min-h-[60px] rounded-md px-3 py-2 flex items-center cursor-pointer  hover:border-teal-400 transition-colors w-full"
                                                                 whileHover={{ scale: 1.02, borderColor: "#14b8a6" }}
                                                                 whileTap={{ scale: 0.98 }}
                                                            >
                                                                 <span className="text-gray-500 text-base">Có gì mới?</span>
                                                            </motion.div>
                                                       </div>
                                                  </div>
                                                  <motion.div
                                                  >
                                                       <Button
                                                            className="w-full h-[35px] bg-teal-500 hover:bg-teal-600 text-white px-3 py-0.5 rounded-xl border-none shadow-none outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                                            onClick={() => setShowNewThread(true)}
                                                       >
                                                            Đăng
                                                       </Button>
                                                  </motion.div>
                                             </motion.div>
                                        )}
                                        <motion.div
                                             className="flex-1"
                                             initial={{ opacity: 0 }}
                                             animate={{ opacity: 1 }}
                                             transition={{ delay: 0.3, duration: 0.4 }}
                                        >
                                             <ThreadsFeed refreshTrigger={refreshTrigger} />
                                        </motion.div>
                                   </motion.div>
                              )}

                              {user && activeTab === "tim-doi-thu" && (
                                   <motion.div
                                        key="tim-doi-thu"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.4, ease: "easeInOut" }}
                                   >
                                        <FindMatch />
                                   </motion.div>
                              )}

                              {user && activeTab === "tao-doi" && (
                                   <motion.div
                                        key="tao-doi"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.4, ease: "easeInOut" }}
                                   >
                                        <TeamList onOpenTeamCreation={handleOpenTeamCreation} />
                                   </motion.div>
                              )}
                         </AnimatePresence>
                    </div>
               </div>

               {/* New Thread Modal */}
               <NewThreadModal
                    isOpen={showNewThread}
                    onClose={() => setShowNewThread(false)}
                    user={user}
                    postContent={newPostContent}
                    setPostContent={setNewPostContent}
                    postTitle={newPostTitle}
                    setPostTitle={setNewPostTitle}
                    selectedField={selectedField}
                    setSelectedField={setSelectedField}
                    onSubmit={handlePostSubmit}
               />

               {/* Floating Login Prompt Card với Animations */}
               <AnimatePresence>
                    {!user && showLoginPrompt && (
                         <motion.div
                              className="fixed bottom-6 right-6 z-50 hidden lg:block"
                              initial={{ opacity: 0, y: 50, scale: 0.8 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 50, scale: 0.8, rotate: -10 }}
                              transition={{
                                   type: "spring",
                                   stiffness: 300,
                                   damping: 25,
                              }}
                              whileHover={{ scale: 1.05, y: -5 }}
                         >
                              <Card className="w-80 border-2 border-teal-100 rounded-2xl shadow-2xl bg-gradient-to-br from-white to-teal-50/30 backdrop-blur-sm">
                                   <CardContent className="p-5">
                                        {/* Close Button */}
                                        <div className="flex justify-end mb-2">
                                             <motion.div
                                                  whileHover={{ rotate: 90, scale: 1.1 }}
                                                  whileTap={{ scale: 0.9 }}
                                                  transition={{ duration: 0.2 }}
                                             >
                                                  <Button
                                                       variant="ghost"
                                                       size="sm"
                                                       onClick={() => setShowLoginPrompt(false)}
                                                       className="h-6 w-6 p-0 rounded-full hover:bg-gray-100"
                                                  >
                                                       <X className="w-4 h-4 text-gray-500" />
                                                  </Button>
                                             </motion.div>
                                        </div>

                                        <div className="text-center mb-4">
                                             <motion.div
                                                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 mb-3 shadow-lg"
                                                  animate={{
                                                       rotate: [0, 10, -10, 0],
                                                       scale: [1, 1.1, 1],
                                                  }}
                                                  transition={{
                                                       duration: 3,
                                                       repeat: Infinity,
                                                       ease: "easeInOut",
                                                  }}
                                             >
                                                  <motion.svg
                                                       className="w-8 h-8 text-white"
                                                       fill="none"
                                                       stroke="currentColor"
                                                       viewBox="0 0 24 24"
                                                       animate={{
                                                            pathLength: [0, 1, 0],
                                                       }}
                                                       transition={{
                                                            duration: 2,
                                                            repeat: Infinity,
                                                            ease: "easeInOut",
                                                       }}
                                                  >
                                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                  </motion.svg>
                                             </motion.div>
                                             <motion.h3
                                                  className="text-lg font-bold text-gray-900 mb-1"
                                                  initial={{ opacity: 0, y: 10 }}
                                                  animate={{ opacity: 1, y: 0 }}
                                                  transition={{ delay: 0.2 }}
                                             >
                                                  Tạo tài khoản để khám phá thêm
                                             </motion.h3>
                                             <motion.p
                                                  className="text-xs text-gray-600 mb-4"
                                                  initial={{ opacity: 0 }}
                                                  animate={{ opacity: 1 }}
                                                  transition={{ delay: 0.3 }}
                                             >
                                                  Đăng ký ngay để tìm đối thủ, tạo đội bóng và tham gia các trận đấu thú vị!
                                             </motion.p>
                                        </div>

                                        <div className="space-y-2">
                                             <motion.div
                                                  whileHover={{ scale: 1.02, y: -2 }}
                                                  whileTap={{ scale: 0.98 }}
                                             >
                                                  <Button
                                                       asChild
                                                       className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold py-2.5"
                                                  >
                                                       <Link to="/register">
                                                            <motion.span
                                                                 animate={{ x: [0, 3, 0] }}
                                                                 transition={{
                                                                      duration: 2,
                                                                      repeat: Infinity,
                                                                      ease: "easeInOut",
                                                                 }}
                                                                 className="inline-flex items-center"
                                                            >
                                                                 <UserPlus className="w-4 h-4 mr-2" />
                                                                 Đăng ký ngay
                                                            </motion.span>
                                                       </Link>
                                                  </Button>
                                             </motion.div>
                                             <motion.div
                                                  whileHover={{ scale: 1.02, y: -2 }}
                                                  whileTap={{ scale: 0.98 }}
                                             >
                                                  <Button
                                                       asChild
                                                       variant="outline"
                                                       className="w-full border-teal-300 text-teal-700 hover:bg-teal-50 hover:text-teal-700 rounded-xl text-sm font-semibold py-2.5"
                                                  >
                                                       <Link to="/login" className="flex items-center justify-center">
                                                            <LogIn className="w-4 h-4 mr-2" />
                                                            Đăng nhập
                                                       </Link>
                                                  </Button>
                                             </motion.div>
                                        </div>

                                        {/* Footer */}
                                        <motion.div
                                             className="mt-4 pt-3 border-t border-gray-200"
                                             initial={{ opacity: 0 }}
                                             animate={{ opacity: 1 }}
                                             transition={{ delay: 0.4 }}
                                        >
                                             <p className="text-xs text-gray-500 text-center">
                                                  Tham gia ngay cộng đồng trao đổi thông tin
                                             </p>
                                        </motion.div>
                                   </CardContent>
                              </Card>
                         </motion.div>
                    )}
               </AnimatePresence>

          </div >
     );
}
