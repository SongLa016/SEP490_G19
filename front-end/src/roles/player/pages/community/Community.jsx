import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
     Button,
     Avatar,
     AvatarImage,
     AvatarFallback,
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
          if (st.tab) setActiveTab(st.tab);
          if (st.highlightPostId) setHighlightPostId(st.highlightPostId);
     }, [locationRouter?.state]);

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
                         <div className="py-2">
                              <div className="flex justify-center gap-1">
                                   <Button
                                        onClick={() => setActiveTab("danh-cho-ban")}
                                        className={`px-4 py-3 text-sm font-medium border-b-2 rounded-xl transition-colors ${activeTab === "danh-cho-ban"
                                             ? "border-gray-900 bg-white hover:bg-transparent text-gray-900 hover:text-gray-900"
                                             : "border-transparent bg-transparent hover:bg-transparent text-gray-500 hover:text-gray-700"
                                             }`}
                                   >
                                        Dành cho bạn
                                   </Button>
                                   <Button
                                        onClick={() => setActiveTab("tim-doi-thu")}
                                        className={`px-4 py-3 text-sm font-medium border-b-2 rounded-xl transition-colors ${activeTab === "tim-doi-thu"
                                             ? "border-gray-900 bg-white hover:bg-transparent text-gray-900 hover:text-gray-900"
                                             : "border-transparent bg-transparent hover:bg-transparent text-gray-500 hover:text-gray-700"
                                             }`}
                                   >
                                        Tìm đối thủ
                                   </Button>
                                   <Button
                                        onClick={() => setActiveTab("tao-doi")}
                                        className={`px-4 py-3 text-sm font-medium border-b-2 rounded-xl transition-colors ${activeTab === "tao-doi"
                                             ? "border-gray-900 bg-white hover:bg-transparent text-gray-900 hover:text-gray-900"
                                             : "border-transparent bg-transparent hover:bg-transparent text-gray-500 hover:text-gray-700"
                                             }`}
                                   >
                                        Tạo đội
                                   </Button>
                              </div>
                         </div>

                         {/* Post Creation Area - Only for logged users */}


                         {/* Content based on active tab */}
                         {activeTab === "danh-cho-ban" && (
                              <div className="border border-b-0 overflow-y-auto scrollbar-hide rounded-t-3xl bg-white border-gray-400 flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
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

                         {activeTab === "tim-doi-thu" && (
                              <FindMatch />
                         )}

                         {activeTab === "tao-doi" && (
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



          </div >
     );
}
