import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Plus, ImageIcon, Video, Smile, FileText, Pin, List } from "lucide-react";
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
     Textarea,
} from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { seedCommunityPostsOnce, listMatchRequests, joinMatchRequest } from "../../utils/communityStore";
import ThreadsFeed from "../../components/ThreadsFeed";

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
          <div className="min-h-screen bg-white">
               {/* Main Content */}
               <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
                         <div className="flex flex-col items-center justify-center text-center">
                              <h1 className="text-xl font-bold text-gray-900">Cộng đồng</h1>
                              <p className="text-sm text-gray-600">Chia sẻ kinh nghiệm, kết nối và học hỏi cùng nhau</p>
                         </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                         <div className="flex justify-center">
                              <button
                                   onClick={() => setActiveTab("danh-cho-ban")}
                                   className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "danh-cho-ban"
                                        ? "border-gray-900 text-gray-900"
                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                        }`}
                              >
                                   Dành cho bạn
                              </button>
                              <button
                                   onClick={() => setActiveTab("tim-doi-thu")}
                                   className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "tim-doi-thu"
                                        ? "border-gray-900 text-gray-900"
                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                        }`}
                              >
                                   Tìm đối thủ
                              </button>
                         </div>
                    </div>

                    {/* Post Creation Area - Only for logged users */}
                    {user && (
                         <div className="border-b border-gray-200 p-4">
                              <div className="flex gap-3">
                                   <Avatar className="w-10 h-10">
                                        <AvatarImage src={user.avatar} />
                                        <AvatarFallback className="bg-gray-200 text-gray-700">
                                             {user.name?.charAt(0) || "U"}
                                        </AvatarFallback>
                                   </Avatar>
                                   <div className="flex-1">
                                        <Textarea
                                             placeholder="Có gì mới?"
                                             value={newPostContent}
                                             onChange={(e) => setNewPostContent(e.target.value)}
                                             className="min-h-[60px] resize-none border-0 focus:ring-0 text-lg placeholder:text-gray-500"
                                        />
                                        <div className="flex items-center justify-between mt-2">
                                             <div className="flex items-center gap-2">
                                                  <Button variant="ghost" size="sm" className="p-2">
                                                       <ImageIcon className="w-5 h-5 text-gray-500" />
                                                  </Button>
                                                  <Button variant="ghost" size="sm" className="p-2">
                                                       <Video className="w-5 h-5 text-gray-500" />
                                                  </Button>
                                                  <Button variant="ghost" size="sm" className="p-2">
                                                       <Smile className="w-5 h-5 text-gray-500" />
                                                  </Button>
                                                  <Button variant="ghost" size="sm" className="p-2">
                                                       <FileText className="w-5 h-5 text-gray-500" />
                                                  </Button>
                                                  <Button variant="ghost" size="sm" className="p-2">
                                                       <Pin className="w-5 h-5 text-gray-500" />
                                                  </Button>
                                                  <Button variant="ghost" size="sm" className="p-2">
                                                       <List className="w-5 h-5 text-gray-500" />
                                                  </Button>
                                             </div>
                                             <Button
                                                  onClick={() => setShowNewThread(true)}
                                                  className="bg-gray-900 hover:bg-gray-800 text-white px-6"
                                             >
                                                  Đăng
                                             </Button>
                                        </div>
                                   </div>
                              </div>
                         </div>
                    )}

                    {/* Content based on active tab */}
                    {activeTab === "danh-cho-ban" && (
                         <ThreadsFeed />
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

               {/* Right Plus Button */}
               {user && (
                    <Button
                         variant="default"
                         size="icon"
                         className="fixed right-4 top-4 w-12 h-12 rounded-full shadow-lg bg-gray-900 hover:bg-gray-700 text-white z-20"
                         onClick={() => setShowNewThread(true)}
                    >
                         <Plus className="w-6 h-6" />
                    </Button>
               )}

               {/* New Thread Modal - Fixed on the right */}
               {showNewThread && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
                         <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl overflow-hidden">
                              {/* Header */}
                              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                                   <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowNewThread(false)}
                                        className="p-2"
                                   >
                                        <Plus className="w-5 h-5 text-gray-500 rotate-45" />
                                   </Button>
                                   <h2 className="text-lg font-bold text-gray-900">New thread</h2>
                                   <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="sm" className="p-2">
                                             <FileText className="w-5 h-5 text-gray-500" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="p-2">
                                             <List className="w-5 h-5 text-gray-500" />
                                        </Button>
                                   </div>
                              </div>

                              {/* Content */}
                              <div className="p-4 flex-1 overflow-y-auto">
                                   <div className="space-y-4">
                                        <div className="flex gap-3">
                                             <Avatar className="w-10 h-10">
                                                  <AvatarImage src={user?.avatar} />
                                                  <AvatarFallback className="bg-gray-200 text-gray-700">
                                                       {user?.name?.charAt(0) || "U"}
                                                  </AvatarFallback>
                                             </Avatar>
                                             <div className="flex-1">
                                                  <div className="text-sm text-gray-500 mb-2">
                                                       <span className="font-semibold">{user?.name || "User"}</span>
                                                       <span className="mx-1">&gt;</span>
                                                       <span>Add a topic</span>
                                                  </div>
                                                  <Textarea
                                                       placeholder="Có gì mới?"
                                                       className="min-h-[120px] resize-none border-0 focus:ring-0 text-lg placeholder:text-gray-500"
                                                  />
                                             </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                             <Button variant="ghost" size="sm" className="p-2">
                                                  <ImageIcon className="w-5 h-5 text-gray-500" />
                                             </Button>
                                             <Button variant="ghost" size="sm" className="p-2">
                                                  <Video className="w-5 h-5 text-gray-500" />
                                             </Button>
                                             <Button variant="ghost" size="sm" className="p-2">
                                                  <Smile className="w-5 h-5 text-gray-500" />
                                             </Button>
                                             <Button variant="ghost" size="sm" className="p-2">
                                                  <List className="w-5 h-5 text-gray-500" />
                                             </Button>
                                             <Button variant="ghost" size="sm" className="p-2">
                                                  <Pin className="w-5 h-5 text-gray-500" />
                                             </Button>
                                        </div>
                                        <div className="text-sm text-blue-500 hover:text-blue-600 cursor-pointer">
                                             Add to thread
                                        </div>
                                        <div className="text-sm text-gray-500">
                                             Anyone can reply & quote
                                        </div>
                                   </div>
                              </div>

                              {/* Footer */}
                              <div className="p-4 border-t border-gray-200">
                                   <div className="flex justify-end">
                                        <Button
                                             className="bg-gray-900 hover:bg-gray-800 text-white px-6"
                                             onClick={() => setShowNewThread(false)}
                                        >
                                             Post
                                        </Button>
                                   </div>
                              </div>
                         </div>
                    </div>
               )}
          </div>
     );
}