import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import Swal from 'sweetalert2';
import {
     Card,
     CardContent,
     Button,
     Input,
     Badge,
     DatePicker,
     Avatar,
     AvatarImage,
     AvatarFallback,

} from "../../components/ui";
import NewThreadModal from "../../components/NewThreadModal";
import ThreadsFeed from "../../components/ThreadsFeed";
import { useAuth } from "../../contexts/AuthContext";
import { seedCommunityPostsOnce, listMatchRequests, joinMatchRequest } from "../../utils/communityStore";

export default function Community() {
     const locationRouter = useLocation();
     const { user } = useAuth();
     const [activeTab, setActiveTab] = useState("danh-cho-ban"); // danh-cho-ban | tim-doi-thu
     const [filterLocation, setFilterLocation] = useState("");
     const [filterDate, setFilterDate] = useState("");
     const [matchRequests, setMatchRequests] = useState([]);
     const [matchPage, setMatchPage] = useState(1);
     const [highlightPostId, setHighlightPostId] = useState(null);
     const [showNewThread, setShowNewThread] = useState(false);
     const [newPostContent, setNewPostContent] = useState("");
     const highlightRef = useRef(null);
     const matchEndRef = useRef(null);
     const pageSize = 10;
     const visibleMatchRequests = matchRequests.slice(0, matchPage * pageSize);

     // Function to handle post submission
     const handlePostSubmit = (content) => {
          console.log("Posting:", content);
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
          <div className="min-h-screen pt-12 bg-gray-200">
               {/* Main Content */}
               <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className=" top-0 bg-white border-b border-gray-200 p-4 z-10">
                         <div className="flex flex-col items-center justify-center text-center">
                              <h1 className="text-xl font-bold text-gray-900">Cộng đồng</h1>
                              <p className="text-sm text-gray-600">Chia sẻ kinh nghiệm, kết nối và học hỏi cùng nhau</p>
                         </div>
                    </div>

                    {/* Tabs */}
                    <div className="sticky top-16 py-2">
                         <div className="flex justify-center  ">
                              <Button
                                   onClick={() => setActiveTab("danh-cho-ban")}
                                   className={`px-6 py-3 text-sm font-medium border-b-2 rounded-xl transition-colors ${activeTab === "danh-cho-ban"
                                        ? "border-gray-900 bg-white hover:bg-transparent text-gray-900 hover:text-gray-900"
                                        : "border-transparent bg-transparent hover:bg-transparent text-gray-500 hover:text-gray-700"
                                        }`}
                              >
                                   Dành cho bạn
                              </Button>
                              <Button
                                   onClick={() => setActiveTab("tim-doi-thu")}
                                   className={`px-6 py-3 text-sm font-medium border-b-2 rounded-xl transition-colors ${activeTab === "tim-doi-thu"
                                        ? "border-gray-900 bg-white hover:bg-transparent text-gray-900 hover:text-gray-900"
                                        : "border-transparent bg-transparent hover:bg-transparent text-gray-500 hover:text-gray-700"
                                        }`}
                              >
                                   Tìm đối thủ
                              </Button>
                         </div>
                    </div>

                    {/* Post Creation Area - Only for logged users */}


                    {/* Content based on active tab */}
                    {activeTab === "danh-cho-ban" && (
                         <div className="border border-b-0 rounded-t-2xl bg-white border-gray-400">
                              {user && (
                                   <div className="px-3 py-2 flex gap-2 items-center border-b border-gray-300">
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
                              <ThreadsFeed />
                         </div>
                    )}

                    {activeTab === "tim-doi-thu" && (
                         <div className="space-y-4">
                              {/* Filter for Tìm đối thủ tab */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-gray-50 border-b border-gray-200">
                                   <div className="md:col-span-1">
                                        <Input
                                             placeholder="Địa điểm (ví dụ: Quận 7)"
                                             value={filterLocation}
                                             onChange={(e) => setFilterLocation(e.target.value)}
                                        />
                                   </div>
                                   <div className="md:col-span-1">
                                        <DatePicker value={filterDate} onChange={setFilterDate} />
                                   </div>
                                   <div className="md:col-span-1 flex items-center justify-end text-sm text-gray-600">
                                        <span className="inline-flex items-center gap-2 bg-teal-50 border border-teal-100 px-3 py-2 rounded-xl">
                                             <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                                             {matchRequests.length} yêu cầu mở
                                        </span>
                                   </div>
                              </div>

                              {/* Match Requests Feed */}
                              <div className="divide-y divide-gray-200">
                                   {visibleMatchRequests.map((mr) => (
                                        <Card
                                             key={mr.requestId}
                                             ref={highlightPostId === mr.requestId ? highlightRef : null}
                                             className={`border transition-all duration-200 ${highlightPostId === mr.requestId
                                                  ? "border-emerald-500 ring-2 ring-emerald-200"
                                                  : "border-teal-100 hover:shadow-lg"
                                                  }`}
                                        >
                                             <CardContent className="p-4">
                                                  <div className="flex items-start justify-between">
                                                       <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                 <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm border border-teal-200">
                                                                      U
                                                                 </div>
                                                                 <div className="font-semibold text-teal-800">Tìm đối thủ cho booking #{mr.bookingId}</div>
                                                            </div>
                                                            <div className="text-sm text-gray-600 flex items-center gap-3 flex-wrap mb-2">
                                                                 <Badge variant="outline" className="text-xs">Mức độ: {mr.level || "Any"}</Badge>
                                                                 <Badge variant="outline" className="text-xs">Trạng thái: {mr.status}</Badge>
                                                            </div>
                                                            {mr.note && (
                                                                 <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded-lg border">
                                                                      <strong>Ghi chú:</strong> {mr.note}
                                                                 </div>
                                                            )}
                                                            <div className="mt-2 text-xs text-gray-500">
                                                                 Hết hạn: {new Date(mr.expireAt).toLocaleString('vi-VN')}
                                                            </div>
                                                       </div>
                                                       <div className="flex items-center gap-2 ml-4">
                                                            {user?.id === mr.ownerId ? (
                                                                 <Button disabled className="bg-gray-200 text-gray-500 cursor-not-allowed">Yêu cầu của bạn</Button>
                                                            ) : (
                                                                 <Button onClick={() => {
                                                                      if (!user) {
                                                                           Swal.fire({
                                                                                icon: 'warning',
                                                                                title: 'Yêu cầu đăng nhập',
                                                                                text: 'Vui lòng đăng nhập để tham gia.',
                                                                                confirmButtonText: 'Đồng ý'
                                                                           });
                                                                           return;
                                                                      }
                                                                      const level = prompt("Mức độ đội của bạn (ví dụ: Beginner/Intermediate/Advanced)", "Intermediate") || "";
                                                                      try {
                                                                           joinMatchRequest({ requestId: mr.requestId, userId: user.id, level });
                                                                           Swal.fire({
                                                                                toast: true,
                                                                                position: 'top-end',
                                                                                timer: 1800,
                                                                                showConfirmButton: false,
                                                                                icon: 'success',
                                                                                title: 'Đã gửi yêu cầu tham gia'
                                                                           });
                                                                           setMatchRequests(listMatchRequests({ status: "Open" })); // Refresh list
                                                                      } catch (e) {
                                                                           Swal.fire({
                                                                                icon: 'error',
                                                                                title: 'Lỗi',
                                                                                text: e.message || 'Không thể tham gia',
                                                                                confirmButtonText: 'Đồng ý'
                                                                           });
                                                                      }
                                                                 }} className="bg-teal-500 hover:bg-teal-600 text-white">Tham gia</Button>
                                                            )}
                                                       </div>
                                                  </div>
                                             </CardContent>
                                        </Card>
                                   ))}
                                   <div ref={matchEndRef} className="h-6" />
                                   {matchRequests.length === 0 && (
                                        <Card>
                                             <CardContent className="p-8 text-center text-gray-600">Không có yêu cầu tìm đối thủ nào</CardContent>
                                        </Card>
                                   )}
                              </div>
                         </div>
                    )}
               </div>

               {/* New Thread Modal */}
               <NewThreadModal
                    isOpen={showNewThread}
                    onClose={() => setShowNewThread(false)}
                    user={user}
                    postContent={newPostContent}
                    setPostContent={setNewPostContent}
                    onSubmit={handlePostSubmit}
               />

          </div>
     );
}