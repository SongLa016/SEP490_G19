import { useEffect, useState, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { LogIn, UserPlus, X } from "lucide-react";
import {
     Button,
     Avatar,
     AvatarImage,
     AvatarFallback,
     SlideIn,
     Card,
     CardContent,
} from "../../../../shared/components/ui";
import NewThreadModal from "./components/NewThreadModal";
import ThreadsFeed from "./components/ThreadsFeed";
import CommunityHeader from "./components/CommunityHeader";
import { useAuth } from "../../../../contexts/AuthContext";
import { seedCommunityPostsOnce, listMatchRequests } from "../../../../shared/index";
import FindMatch from "./components/FindMatch";
import TeamList from "./components/TeamList";

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
     const [showTeamCreation, setShowTeamCreation] = useState(false);
     const [showLoginPrompt, setShowLoginPrompt] = useState(true); // Control visibility of login prompt
     const highlightRef = useRef(null);
     const matchEndRef = useRef(null);
     const pageSize = 10;
     const visibleMatchRequests = matchRequests.slice(0, matchPage * pageSize);

     // Function to handle post submission
     const handlePostSubmit = (title, content, field) => {
          console.log("Posting:", { title, content, field });
          // Add your post submission logic here
     };


     // Accept navigation state to focus a specific post and tab
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

     // Reset to "danh-cho-ban" tab if user logs out
     useEffect(() => {
          if (!user && activeTab !== "danh-cho-ban") {
               setActiveTab("danh-cho-ban");
          }
     }, [user, activeTab]);

     // Scroll to top when tab changes
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

     // Seed demo community posts on first load
     useEffect(() => { seedCommunityPostsOnce(); }, []);

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
               <div className="ml-16 flex justify-center">
                    <div className="max-w-2xl w-full">


                         {/* Tabs */}
                         <SlideIn direction="down" delay={100}>
                              <div className="py-2">
                                   <div className="flex justify-center gap-1">
                                        <Button
                                             onClick={() => setActiveTab("danh-cho-ban")}
                                             className={`px-4 py-3 text-sm font-medium border-b-2 rounded-xl transition-all duration-200 hover:scale-105 ${activeTab === "danh-cho-ban"
                                                  ? "border-gray-900 bg-white hover:bg-transparent text-gray-900 hover:text-gray-900"
                                                  : "border-transparent bg-transparent hover:bg-transparent text-gray-500 hover:text-gray-700"
                                                  }`}
                                        >
                                             Dành cho bạn
                                        </Button>
                                        {user && (
                                             <>
                                                  <Button
                                                       onClick={() => setActiveTab("tim-doi-thu")}
                                                       className={`px-4 py-3 text-sm font-medium border-b-2 rounded-xl transition-all duration-200 hover:scale-105 ${activeTab === "tim-doi-thu"
                                                            ? "border-gray-900 bg-white hover:bg-transparent text-gray-900 hover:text-gray-900"
                                                            : "border-transparent bg-transparent hover:bg-transparent text-gray-500 hover:text-gray-700"
                                                            }`}
                                                  >
                                                       Tìm đối thủ
                                                  </Button>
                                                  <Button
                                                       onClick={() => setActiveTab("tao-doi")}
                                                       className={`px-4 py-3 text-sm font-medium border-b-2 rounded-xl transition-all duration-200 hover:scale-105 ${activeTab === "tao-doi"
                                                            ? "border-gray-900 bg-white hover:bg-transparent text-gray-900 hover:text-gray-900"
                                                            : "border-transparent bg-transparent hover:bg-transparent text-gray-500 hover:text-gray-700"
                                                            }`}
                                                  >
                                                       Tạo đội
                                                  </Button>
                                             </>
                                        )}
                                   </div>
                              </div>
                         </SlideIn>

                         {/* Post Creation Area - Only for logged users */}


                         {/* Content based on active tab */}
                         {activeTab === "danh-cho-ban" && (
                              <div className="border border-b-0 overflow-y-auto scrollbar-hide rounded-t-3xl bg-white border-gray-400 flex flex-col" style={{ height: 'calc(108.5vh - 120px)' }}>
                                   {user && (
                                        <div className="px-3 py-2  flex gap-2 items-center border-b border-gray-300">
                                             <div className="flex w-11/12 items-center px-4 gap-3">
                                                  <Avatar className="w-8 h-8">
                                                       <AvatarImage src={user.avatar} />
                                                       <AvatarFallback className="bg-gray-200 text-gray-700">
                                                            {user.name?.charAt(0) || "U"}
                                                       </AvatarFallback>
                                                  </Avatar>
                                                  <div className="flex items-center justify-between w-full gap-3">
                                                       <div
                                                            onClick={() => setShowNewThread(true)}
                                                            className="min-h-[60px] rounded-md px-3 py-2 flex items-center cursor-pointer hover:border-gray-400 transition-colors w-full"
                                                       >
                                                            <span className="text-gray-500 text-base">Có gì mới?</span>
                                                       </div>
                                                  </div>
                                             </div>
                                             <Button className="w-1/12 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl" onClick={() => setShowNewThread(true)}>Đăng</Button>
                                        </div>
                                   )}
                                   <div className="flex-1 ">
                                        <ThreadsFeed />
                                   </div>
                              </div>
                         )}

                         {user && activeTab === "tim-doi-thu" && (
                              <FindMatch />
                         )}

                         {user && activeTab === "tao-doi" && (
                              <TeamList onOpenTeamCreation={() => setShowTeamCreation(true)} />
                         )}
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

               {/* Floating Login Prompt Card - Bottom Right */}
               {!user && showLoginPrompt && (
                    <div className="fixed bottom-6 right-6 z-50 hidden lg:block animate-in fade-in slide-in-from-bottom-4 duration-300">
                         <Card className="w-80 border-2 border-teal-100 rounded-2xl shadow-2xl bg-gradient-to-br from-white to-teal-50/30 backdrop-blur-sm">
                              <CardContent className="p-5">
                                   {/* Close Button */}
                                   <div className="flex justify-end mb-2">
                                        <Button
                                             variant="ghost"
                                             size="sm"
                                             onClick={() => setShowLoginPrompt(false)}
                                             className="h-6 w-6 p-0 rounded-full hover:bg-gray-100"
                                        >
                                             <X className="w-4 h-4 text-gray-500" />
                                        </Button>
                                   </div>

                                   <div className="text-center mb-4">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 mb-3 shadow-lg">
                                             <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                             </svg>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">Tạo tài khoản để khám phá thêm</h3>
                                        <p className="text-xs text-gray-600 mb-4">
                                             Đăng ký ngay để tìm đối thủ, tạo đội bóng và tham gia các trận đấu thú vị!
                                        </p>
                                   </div>

                                   <div className="space-y-2">
                                        <Button
                                             asChild
                                             className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold py-2.5"
                                        >
                                             <Link to="/register">
                                                  <UserPlus className="w-4 h-4 mr-2" />
                                                  Đăng ký ngay
                                             </Link>
                                        </Button>
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
                                   </div>

                                   {/* Footer */}
                                   <div className="mt-4 pt-3 border-t border-gray-200">
                                        <p className="text-xs text-gray-500 text-center">
                                             Tham gia ngay cộng đồng trao đổi thông tin
                                        </p>
                                   </div>
                              </CardContent>
                         </Card>
                    </div>
               )}

          </div >
     );
}
