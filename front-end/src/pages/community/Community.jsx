import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle, Plus, Search, Filter, Users, Calendar, MapPin, ChevronDown, ChevronUp, ThumbsUp, X, Send, Reply } from "lucide-react";
import Swal from 'sweetalert2';
import {
     Section,
     Container,
     Card,
     CardContent,
     CardHeader,
     CardTitle,
     Button,
     Input,
     Textarea,
     Badge,
     Select,
     SelectContent,
     SelectItem,
     SelectTrigger,
     SelectValue,
     DatePicker,
} from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { seedCommunityPostsOnce, listCommunityPosts, joinCommunityPost, listJoinsByPost } from "../../utils/communityStore";

export default function Community() {
     const locationRouter = useLocation();
     const { user } = useAuth();
     const [searchQuery, setSearchQuery] = useState("");
     const [selectedCategory, setSelectedCategory] = useState("all");
     const [tab, setTab] = useState("feed"); // feed | find-match
     const [filterLocation, setFilterLocation] = useState("");
     const [filterDate, setFilterDate] = useState("");
     const [communityPosts, setCommunityPosts] = useState([]);
     const [showCreatePost, setShowCreatePost] = useState(false);
     const [newPost, setNewPost] = useState({ title: "", content: "", category: "general", image: "" });
     const [expandedPosts, setExpandedPosts] = useState(new Set());
     const [likedPosts, setLikedPosts] = useState(new Set());
     const [bookmarkedPosts, setBookmarkedPosts] = useState(new Set());
     const [selectedPost, setSelectedPost] = useState(null);
     const [showPostModal, setShowPostModal] = useState(false);
     const [newComment, setNewComment] = useState("");
     const [replyingTo, setReplyingTo] = useState(null);
     const [likedComments, setLikedComments] = useState(new Set());
     const [highlightPostId, setHighlightPostId] = useState(null);
     const highlightRef = useRef(null);

     // Accept navigation state to focus a specific post and tab
     useEffect(() => {
          const st = locationRouter?.state || {};
          if (st.tab) setTab(st.tab);
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

    // Observe end for infinite scroll (moved below slices)

     const categories = [
          { id: "all", name: "Tất cả", icon: "📝" },
          { id: "tips", name: "Mẹo chơi", icon: "💡" },
          { id: "tournament", name: "Giải đấu", icon: "🏆" },
          { id: "equipment", name: "Trang thiết bị", icon: "⚽" },
          { id: "health", name: "Sức khỏe", icon: "💪" },
          { id: "general", name: "Thảo luận", icon: "💬" }
     ];

     // Seed demo community posts on first load
     useEffect(() => { seedCommunityPostsOnce(); }, []);

     useEffect(() => {
          setCommunityPosts(listCommunityPosts({ location: filterLocation, date: filterDate }));
     }, [filterLocation, filterDate, showCreatePost]);

     const posts = [
          {
               id: 1,
               title: "Giải phủi cuối tuần tại TP.HCM",
               content: "Tuần này có nhiều giải đấu phủi thú vị tại các quận trung tâm. Đặc biệt có giải đấu tại sân ABC với giải thưởng hấp dẫn. Các bạn có thể đăng ký tham gia để có cơ hội giao lưu và thi đấu với nhiều đội khác nhau.",
               author: { name: "BallSpot", avatar: "https://ui-avatars.com/api/?name=BallSpot&background=0ea5e9&color=fff&size=100", role: "Admin" },
               date: "2025-01-15",
               category: "tournament",
               likes: 24,
               comments: 8,
               shares: 3,
               image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=400&fit=crop",
               tags: ["giải đấu", "TP.HCM", "phủi"]
          },
          {
               id: 2,
               title: "Mẹo đá sân 7 người hiệu quả",
               content: "Sân 7 người đòi hỏi sự cân bằng giữa thể lực và chiến thuật. Dưới đây là một số mẹo quan trọng:\n\n1. Kiểm soát bóng tốt hơn\n2. Di chuyển không bóng\n3. Phối hợp nhóm\n4. Tận dụng không gian\n\nCác bạn có kinh nghiệm gì khác không?",
               author: { name: "Coach Minh", avatar: "https://ui-avatars.com/api/?name=Coach+Minh&background=10b981&color=fff&size=100", role: "Huấn luyện viên" },
               date: "2025-01-14",
               category: "tips",
               likes: 45,
               comments: 12,
               shares: 7,
               image: "https://images.unsplash.com/photo-1501612780327-45045538702b?w=800&h=400&fit=crop",
               tags: ["chiến thuật", "sân 7", "mẹo"]
          },
          {
               id: 3,
               title: "Chọn giày đá bóng phù hợp theo mặt sân",
               content: "Việc chọn giày phù hợp rất quan trọng để tránh chấn thương và tăng hiệu suất thi đấu. Các loại mặt sân khác nhau cần loại giày khác nhau:\n\n- Sân cỏ tự nhiên: giày có gai dài\n- Sân cỏ nhân tạo: giày có gai ngắn\n- Sân trong nhà: giày đế phẳng\n\nBạn đã từng gặp vấn đề gì với giày không phù hợp chưa?",
               author: { name: "Thiết bị Pro", avatar: "https://ui-avatars.com/api/?name=Thiet+Bi+Pro&background=f59e0b&color=fff&size=100", role: "Chuyên gia" },
               date: "2025-01-13",
               category: "equipment",
               likes: 32,
               comments: 15,
               shares: 4,
               image: "https://images.unsplash.com/photo-1599050751795-5fa78f5c9c23?w=800&h=400&fit=crop",
               tags: ["giày", "trang thiết bị", "an toàn"]
          },
          {
               id: 4,
               title: "Khởi động đúng cách trước khi thi đấu",
               content: "Khởi động đúng cách giúp giảm nguy cơ chấn thương và tăng hiệu suất thi đấu. Quy trình khởi động nên bao gồm:\n\n1. Chạy nhẹ 5-10 phút\n2. Giãn cơ động\n3. Bài tập với bóng\n4. Chạy nước rút ngắn\n\nCác bạn có bài tập khởi động nào hiệu quả không?",
               author: { name: "Physio Team", avatar: "https://ui-avatars.com/api/?name=Physio+Team&background=ef4444&color=fff&size=100", role: "Bác sĩ thể thao" },
               date: "2025-01-12",
               category: "health",
               likes: 28,
               comments: 9,
               shares: 6,
               image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&h=400&fit=crop",
               tags: ["khởi động", "sức khỏe", "chấn thương"]
          },
          {
               id: 5,
               title: "Tìm đội chơi cùng khu vực",
               content: "Mình đang tìm đội để chơi thường xuyên tại quận 7. Có ai quan tâm không? Chúng ta có thể tổ chức các trận đấu vào cuối tuần.",
               author: { name: "Nguyễn Văn A", avatar: "https://ui-avatars.com/api/?name=Nguyen+Van+A&background=8b5cf6&color=fff&size=100", role: "Người chơi" },
               date: "2025-01-11",
               category: "general",
               likes: 15,
               comments: 5,
               shares: 2,
               image: "",
               tags: ["tìm đội", "quận 7", "cuối tuần"]
          }
     ];

     // Mock comments data
     const comments = [
          {
               id: 1,
               postId: 1,
               author: { name: "Nguyễn Văn B", avatar: "https://ui-avatars.com/api/?name=Nguyen+Van+B&background=10b981&color=fff&size=100" },
               content: "Giải đấu này có vẻ thú vị! Mình có thể tham gia được không?",
               date: "2025-01-15T10:30:00",
               likes: 5,
               replies: [
                    {
                         id: 11,
                         author: { name: "BallSpot", avatar: "https://ui-avatars.com/api/?name=BallSpot&background=0ea5e9&color=fff&size=100" },
                         content: "Chào bạn! Bạn có thể đăng ký tại link này: https://example.com",
                         date: "2025-01-15T11:00:00",
                         likes: 2
                    }
               ]
          },
          {
               id: 2,
               postId: 1,
               author: { name: "Trần Thị C", avatar: "https://ui-avatars.com/api/?name=Tran+Thi+C&background=f59e0b&color=fff&size=100" },
               content: "Mình đã tham gia giải này năm ngoái, rất vui và có nhiều đội mạnh!",
               date: "2025-01-15T14:20:00",
               likes: 8,
               replies: []
          },
          {
               id: 3,
               postId: 2,
               author: { name: "Lê Văn D", avatar: "https://ui-avatars.com/api/?name=Le+Van+D&background=ef4444&color=fff&size=100" },
               content: "Cảm ơn coach đã chia sẻ! Mình sẽ áp dụng những mẹo này vào trận đấu cuối tuần.",
               date: "2025-01-14T16:45:00",
               likes: 12,
               replies: [
                    {
                         id: 31,
                         author: { name: "Coach Minh", avatar: "https://ui-avatars.com/api/?name=Coach+Minh&background=10b981&color=fff&size=100" },
                         content: "Chúc bạn thi đấu tốt! Nhớ khởi động kỹ trước khi đá nhé.",
                         date: "2025-01-14T17:30:00",
                         likes: 6
                    }
               ]
          }
     ];

     const filteredPosts = posts.filter(post => {
          const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
               post.content.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;
          return matchesSearch && matchesCategory;
     });

     // Infinite scroll slices
     const [feedPage, setFeedPage] = useState(1);
     const [matchPage, setMatchPage] = useState(1);
     const pageSize = 10;
     const feedEndRef = useRef(null);
     const matchEndRef = useRef(null);
     const visibleFeedPosts = filteredPosts.slice(0, feedPage * pageSize);
     const visibleCommunityPosts = communityPosts.slice(0, matchPage * pageSize);

     // Observe end for feed infinite scroll
     useEffect(() => {
          if (tab !== "feed") return;
          const el = feedEndRef.current;
          if (!el) return;
          const io = new IntersectionObserver((entries) => {
               entries.forEach((e) => {
                    if (e.isIntersecting) {
                         setFeedPage((p) => (visibleFeedPosts.length >= filteredPosts.length ? p : p + 1));
                    }
               });
          }, { root: null, threshold: 0.1 });
          io.observe(el);
          return () => io.disconnect();
     }, [tab, filteredPosts.length, visibleFeedPosts.length]);

     // Observe end for match infinite scroll
     useEffect(() => {
          if (tab !== "find-match") return;
          const el = matchEndRef.current;
          if (!el) return;
          const io = new IntersectionObserver((entries) => {
               entries.forEach((e) => {
                    if (e.isIntersecting) {
                         setMatchPage((p) => (visibleCommunityPosts.length >= communityPosts.length ? p : p + 1));
                    }
               });
          }, { root: null, threshold: 0.1 });
          io.observe(el);
          return () => io.disconnect();
     }, [tab, communityPosts.length, visibleCommunityPosts.length]);

     const togglePostExpansion = (postId) => {
          const newExpanded = new Set(expandedPosts);
          if (newExpanded.has(postId)) {
               newExpanded.delete(postId);
          } else {
               newExpanded.add(postId);
          }
          setExpandedPosts(newExpanded);
     };

     const toggleLike = (postId) => {
          const newLiked = new Set(likedPosts);
          if (newLiked.has(postId)) {
               newLiked.delete(postId);
          } else {
               newLiked.add(postId);
          }
          setLikedPosts(newLiked);
     };

     const toggleBookmark = (postId) => {
          const newBookmarked = new Set(bookmarkedPosts);
          if (newBookmarked.has(postId)) {
               newBookmarked.delete(postId);
          } else {
               newBookmarked.add(postId);
          }
          setBookmarkedPosts(newBookmarked);
     };

     const handleCreatePost = () => {
          if (!newPost.title || !newPost.content) return;

          // Here you would typically send the post to your backend
          console.log("Creating new post:", newPost);

          // Reset form
          setNewPost({ title: "", content: "", category: "general", image: "" });
          setShowCreatePost(false);
     };

     const openPostModal = (post) => {
          setSelectedPost(post);
          setShowPostModal(true);
          setNewComment("");
          setReplyingTo(null);
     };

     const closePostModal = () => {
          setShowPostModal(false);
          setSelectedPost(null);
          setNewComment("");
          setReplyingTo(null);
     };

     const handleAddComment = () => {
          if (!newComment.trim()) return;

          // Here you would typically send the comment to your backend
          console.log("Adding comment:", {
               postId: selectedPost.id,
               content: newComment,
               replyingTo: replyingTo
          });

          setNewComment("");
          setReplyingTo(null);
     };

     const toggleCommentLike = (commentId) => {
          const newLiked = new Set(likedComments);
          if (newLiked.has(commentId)) {
               newLiked.delete(commentId);
          } else {
               newLiked.add(commentId);
          }
          setLikedComments(newLiked);
     };

     const getPostComments = (postId) => {
          return comments.filter(comment => comment.postId === postId);
     };

     const PostCard = ({ post }) => {
          const isExpanded = expandedPosts.has(post.id);
          const isLiked = likedPosts.has(post.id);
          const isBookmarked = false;
          const categoryInfo = categories.find(cat => cat.id === post.category);

          // Community join (simple demo using local store)

          const handleJoin = () => {
               if (!user) return alert("Vui lòng đăng nhập để tham gia.");
               joinCommunityPost({ postId: post.postId || `CP-${post.id}`, userId: user.id });
               alert("Đã gửi yêu cầu tham gia");
          };

          return (
               <Card className="mb-6 hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="pb-3">
                         <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3">
                                   <img
                                        src={post.author.avatar}
                                        alt={post.author.name}
                                        className="w-12 h-12 rounded-full object-cover"
                                   />
                                   <div>
                                        <div className="flex items-center space-x-2">
                                             <h3 className="font-semibold text-gray-900">{post.author.name}</h3>
                                             <Badge variant="secondary" className="text-xs">
                                                  {post.author.role}
                                             </Badge>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-500 space-x-2">
                                             <Calendar className="w-4 h-4" />
                                             <span>{new Date(post.date).toLocaleDateString('vi-VN')}</span>
                                             <Badge variant="outline" className="text-xs">
                                                  {categoryInfo?.icon} {categoryInfo?.name}
                                             </Badge>
                                        </div>
                                   </div>
                              </div>
                              <div className="hidden" />
                         </div>
                    </CardHeader>

                    <CardContent>
                         <h2 className="text-xl font-bold text-gray-900 mb-3 cursor-pointer hover:text-teal-600"
                              onClick={() => openPostModal(post)}>
                              {post.title}
                         </h2>

                         <div className={`text-gray-700 leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
                              {post.content.split('\n').map((paragraph, index) => (
                                   <p key={index} className="mb-2">{paragraph}</p>
                              ))}
                         </div>

                         {post.content.split('\n').length > 3 && (
                              <Button
                                   variant="ghost"
                                   className="mt-2 p-0 h-auto text-teal-600 hover:text-teal-700"
                                   onClick={() => togglePostExpansion(post.id)}
                              >
                                   {isExpanded ? (
                                        <>
                                             <ChevronUp className="w-4 h-4 mr-1" />
                                             Thu gọn
                                        </>
                                   ) : (
                                        <>
                                             <ChevronDown className="w-4 h-4 mr-1" />
                                             Xem thêm
                                        </>
                                   )}
                              </Button>
                         )}

                         {post.image && (
                              <div className="mt-4">
                                   <img
                                        src={post.image}
                                        alt={post.title}
                                        className="w-full h-64 object-cover rounded-lg"
                                   />
                              </div>
                         )}

                         <div className="flex flex-wrap gap-2 mt-4">
                              {post.tags.map((tag, index) => (
                                   <Badge key={index} variant="outline" className="text-xs">
                                        #{tag}
                                   </Badge>
                              ))}
                         </div>

                         <div className="flex items-center justify-between mt-6 pt-4 border-t">
                              <div className="flex items-center space-x-6">
                                   <Button
                                        variant="ghost"
                                        className={`flex items-center space-x-2 ${isLiked ? 'text-teal-600' : 'text-gray-500'}`}
                                        onClick={() => toggleLike(post.id)}
                                   >
                                        <ThumbsUp className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                                        <span>{post.likes + (isLiked ? 1 : 0)}</span>
                                   </Button>
                                   <Button
                                        variant="ghost"
                                        className="flex items-center space-x-2 text-gray-500 hover:text-teal-600"
                                        onClick={() => openPostModal(post)}
                                   >
                                        <MessageCircle className="w-5 h-5" />
                                        <span>{post.comments}</span>
                                   </Button>
                                   <div className="hidden" />
                              </div>
                              {/* Join/Apply demo */}
                              {post.postId && (
                                   <div className="flex items-center gap-2">
                                        <Button onClick={handleJoin} className="bg-teal-500 hover:bg-teal-600 text-white">Tham gia</Button>
                                   </div>
                              )}
                         </div>
                    </CardContent>
               </Card>
          );
     };

     return (
          <Section className="min-h-screen bg-gray-50">
               <Container className="py-8">
                    {/* Header */}
                    <div className="mb-8">
                         <div className="flex items-center justify-between mb-6">
                              <div>
                                   <h1 className="text-3xl font-bold text-gray-900 mb-2">Cộng đồng bóng đá</h1>
                                   <p className="text-gray-600">Chia sẻ kinh nghiệm, kết nối và học hỏi cùng nhau</p>
                              </div>
                              <Button
                                   onClick={() => {
                                        if (!user) {
                                             Swal.fire({ icon: 'warning', title: 'Yêu cầu đăng nhập', text: 'Vui lòng đăng nhập để tạo bài viết.', confirmButtonText: 'Đồng ý' });
                                             return;
                                        }
                                        setShowCreatePost(true);
                                   }}
                                   className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2"
                              >
                                   <Plus className="w-5 h-5" />
                                   <span>Tạo bài viết</span>
                              </Button>
                         </div>

                         {/* Tabs */}
                         <div className="flex items-center gap-2 mb-6">
                              <Button type="button" onClick={() => setTab("feed")} className={`px-4 py-2 rounded-xl ${tab === "feed" ? "bg-teal-500 text-white" : "bg-teal-50 text-teal-700 border border-teal-200"}`}>Bảng tin</Button>
                              <Button type="button" onClick={() => setTab("find-match")} className={`px-4 py-2 rounded-xl ${tab === "find-match" ? "bg-teal-500 text-white" : "bg-teal-50 text-teal-700 border border-teal-200"}`}>Tìm đối thủ</Button>
                         </div>

                         {tab === "feed" ? (
                              <div className="flex flex-col md:flex-row gap-4 mb-6">
                                   <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <Input
                                             placeholder="Tìm kiếm bài viết..."
                                             value={searchQuery}
                                             onChange={(e) => setSearchQuery(e.target.value)}
                                             className="pl-10"
                                        />
                                   </div>
                                   <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                        <SelectTrigger className="w-full md:w-48">
                                             <Filter className="w-4 h-4 mr-2" />
                                             <SelectValue placeholder="Chọn danh mục" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             {categories.map(category => (
                                                  <SelectItem key={category.id} value={category.id}>
                                                       {category.icon} {category.name}
                                                  </SelectItem>
                                             ))}
                                        </SelectContent>
                                   </Select>
                              </div>
                         ) : (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 bg-white/70 p-3 rounded-2xl border border-teal-100">
                                   <div className="md:col-span-1">
                                        <Input placeholder="Địa điểm (ví dụ: Quận 7)" value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} />
                                   </div>
                                   <div className="md:col-span-1">
                                        <DatePicker value={filterDate} onChange={setFilterDate} />
                                   </div>
                                   <div className="md:col-span-1 flex items-center justify-end text-sm text-gray-600">
                                        <span className="inline-flex items-center gap-2 bg-teal-50 border border-teal-100 px-3 py-2 rounded-xl">
                                             <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                                             {communityPosts.length} bài phù hợp
                                        </span>
                                   </div>
                              </div>
                         )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                         {/* Main Content */}
                         <div className="lg:col-span-3">
                              {/* Stats hidden: not mapped to DB */}

                              {tab === "feed" ? (
                                   visibleFeedPosts.length > 0 ? (
                                        <>
                                             {visibleFeedPosts.map(post => <PostCard key={post.id} post={post} />)}
                                             <div ref={feedEndRef} className="h-6" />
                                        </>
                                   ) : (
                                        <Card>
                                             <CardContent className="p-12 text-center">
                                                  <div className="text-gray-400 mb-4">
                                                       <Search className="w-16 h-16 mx-auto" />
                                                  </div>
                                                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Không tìm thấy bài viết</h3>
                                                  <p className="text-gray-500">Thử thay đổi từ khóa tìm kiếm hoặc danh mục</p>
                                             </CardContent>
                                        </Card>
                                   )
                              ) : (
                                   <div className="space-y-4">
                                        {visibleCommunityPosts.map((cp) => (
                                             <Card
                                                  key={cp.postId}
                                                  ref={highlightPostId === cp.postId ? highlightRef : null}
                                                  className={`border transition-all duration-200 ${highlightPostId === cp.postId ? "border-emerald-500 ring-2 ring-emerald-200" : "border-teal-100 hover:shadow-lg"}`}
                                             >
                                                  <CardContent className="p-4">
                                                       <div className="flex items-start justify-between">
                                                            <div>
                                                                 <div className="flex items-center gap-3 mb-1">
                                                                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm border border-teal-200">
                                                                           {(cp.authorName || "?").slice(0, 1)}
                                                                      </div>
                                                                      <div className="font-semibold text-teal-800">{cp.content}</div>
                                                                 </div>
                                                                 <div className="text-sm text-gray-600 flex items-center gap-3 flex-wrap">
                                                                      <span className="inline-flex items-center gap-1 bg-teal-50 border border-teal-100 text-teal-700 px-2 py-1 rounded-full" title={cp.location || ""}><MapPin className="w-4 h-4" /> {cp.location || "—"}</span>
                                                                      <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-700 px-2 py-1 rounded-full"><Calendar className="w-4 h-4" /> {(cp.date && cp.slotName) ? `${cp.date} • ${cp.slotName}` : (cp.time || "—")}</span>
                                                                      {cp.authorName && (
                                                                           <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-700 px-2 py-1 rounded-full">
                                                                                <Users className="w-4 h-4" /> {cp.authorName}
                                                                                <span className="ml-1 inline-flex items-center text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Chủ bài</span>
                                                                           </span>
                                                                      )}
                                                                 </div>
                                                                 <div className="mt-2 text-xs text-gray-600 flex items-center gap-3 flex-wrap">
                                                                      {cp.location && (
                                                                           <a
                                                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cp.location)}`}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="underline text-teal-700 hover:text-teal-800"
                                                                           >Xem bản đồ</a>
                                                                      )}
                                                                      {cp.bookingId && (
                                                                           <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-700 px-2 py-0.5 rounded-full">#Booking: {cp.bookingId}</span>
                                                                      )}
                                                                 </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                 {highlightPostId === cp.postId && (
                                                                      <Badge variant="secondary" className="bg-emerald-500 text-white">Mới</Badge>
                                                                 )}
                                                                 {user?.id === cp.userId ? (
                                                                      <Button disabled className="bg-gray-200 text-gray-500 cursor-not-allowed">Bài của bạn</Button>
                                                                 ) : (
                                                                      <Button onClick={() => {
                                                                           if (!user) { Swal.fire({ icon: 'warning', title: 'Yêu cầu đăng nhập', text: 'Vui lòng đăng nhập để tham gia.', confirmButtonText: 'Đồng ý' }); return; }
                                                                           const existing = listJoinsByPost(cp.postId).find(j => j.userId === user.id);
                                                                           if (existing) {
                                                                                Swal.fire({ toast: true, position: 'top-end', timer: 1800, showConfirmButton: false, icon: 'info', title: 'Bạn đã yêu cầu trước đó' });
                                                                                return;
                                                                           }
                                                                           joinCommunityPost({ postId: cp.postId, userId: user.id });
                                                                           Swal.fire({ toast: true, position: 'top-end', timer: 1800, showConfirmButton: false, icon: 'success', title: 'Đã gửi yêu cầu tham gia' });
                                                                      }} className="bg-teal-500 hover:bg-teal-600 text-white">Tham gia</Button>
                                                                 )}
                                                            </div>
                                                       </div>
                                                  </CardContent>
                                             </Card>
                                        ))}
                                        <div ref={matchEndRef} className="h-6" />
                                        {communityPosts.length === 0 && (
                                             <Card>
                                                  <CardContent className="p-8 text-center text-gray-600">Không có bài tìm đối thủ phù hợp</CardContent>
                                             </Card>
                                        )}
                                   </div>
                              )}
                         </div>

                         {/* Sidebar hidden (not mapped to DB) */}
                         <div className="hidden lg:col-span-1" />
                    </div>

                    {/* Create Post Modal */}
                    {showCreatePost && (
                         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                              <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                                   <CardHeader>
                                        <div className="flex items-center justify-between">
                                             <CardTitle>Tạo bài viết mới</CardTitle>
                                             <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() => setShowCreatePost(false)}
                                             >
                                                  <X className="w-4 h-4" />
                                             </Button>
                                        </div>
                                   </CardHeader>
                                   <CardContent className="space-y-4">
                                        <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-2">
                                                  Tiêu đề
                                             </label>
                                             <Input
                                                  placeholder="Nhập tiêu đề bài viết..."
                                                  value={newPost.title}
                                                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                                             />
                                        </div>

                                        <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-2">
                                                  Danh mục
                                             </label>
                                             <Select value={newPost.category} onValueChange={(value) => setNewPost({ ...newPost, category: value })}>
                                                  <SelectTrigger>
                                                       <SelectValue placeholder="Chọn danh mục" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                       {categories.filter(cat => cat.id !== "all").map(category => (
                                                            <SelectItem key={category.id} value={category.id}>
                                                                 {category.icon} {category.name}
                                                            </SelectItem>
                                                       ))}
                                                  </SelectContent>
                                             </Select>
                                        </div>

                                        <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-2">
                                                  Nội dung
                                             </label>
                                             <Textarea
                                                  placeholder="Chia sẻ suy nghĩ của bạn..."
                                                  value={newPost.content}
                                                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                                                  rows={6}
                                             />
                                        </div>

                                        <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-2">
                                                  Hình ảnh (tùy chọn)
                                             </label>
                                             <Input
                                                  placeholder="URL hình ảnh..."
                                                  value={newPost.image}
                                                  onChange={(e) => setNewPost({ ...newPost, image: e.target.value })}
                                             />
                                        </div>

                                        <div className="flex justify-end space-x-3 pt-4">
                                             <Button
                                                  variant="outline"
                                                  onClick={() => setShowCreatePost(false)}
                                             >
                                                  Hủy
                                             </Button>
                                             <Button
                                                  onClick={handleCreatePost}
                                                  disabled={!newPost.title || !newPost.content}
                                             >
                                                  Đăng bài
                                             </Button>
                                        </div>
                                   </CardContent>
                              </Card>
                         </div>
                    )}

                    {/* Post Detail Modal */}
                    {showPostModal && selectedPost && (
                         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                              <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-lg flex flex-col">
                                   {/* Modal Header */}
                                   <div className="flex items-center justify-between p-6 border-b">
                                        <h2 className="text-2xl font-bold text-gray-900">Chi tiết bài viết</h2>
                                        <Button
                                             variant="ghost"
                                             size="icon"
                                             onClick={closePostModal}
                                        >
                                             <X className="w-6 h-6" />
                                        </Button>
                                   </div>

                                   {/* Modal Content */}
                                   <div className="flex-1 overflow-y-auto">
                                        <div className="p-6">
                                             {/* Post Header */}
                                             <div className="flex items-start justify-between mb-6">
                                                  <div className="flex items-center space-x-3">
                                                       <img
                                                            src={selectedPost.author.avatar}
                                                            alt={selectedPost.author.name}
                                                            className="w-12 h-12 rounded-full object-cover"
                                                       />
                                                       <div>
                                                            <div className="flex items-center space-x-2">
                                                                 <h3 className="font-semibold text-gray-900">{selectedPost.author.name}</h3>
                                                                 <Badge variant="secondary" className="text-xs">
                                                                      {selectedPost.author.role}
                                                                 </Badge>
                                                            </div>
                                                            <div className="flex items-center text-sm text-gray-500 space-x-2">
                                                                 <Calendar className="w-4 h-4" />
                                                                 <span>{new Date(selectedPost.date).toLocaleDateString('vi-VN')}</span>
                                                                 <Badge variant="outline" className="text-xs">
                                                                      {categories.find(cat => cat.id === selectedPost.category)?.icon} {categories.find(cat => cat.id === selectedPost.category)?.name}
                                                                 </Badge>
                                                            </div>
                                                       </div>
                                                  </div>
                                                  <div className="hidden" />
                                             </div>

                                             {/* Post Content */}
                                             <div className="mb-6">
                                                  <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedPost.title}</h1>
                                                  <div className="text-gray-700 leading-relaxed text-lg">
                                                       {selectedPost.content.split('\n').map((paragraph, index) => (
                                                            <p key={index} className="mb-4">{paragraph}</p>
                                                       ))}
                                                  </div>

                                                  {selectedPost.image && (
                                                       <div className="mt-6">
                                                            <img
                                                                 src={selectedPost.image}
                                                                 alt={selectedPost.title}
                                                                 className="w-full h-96 object-cover rounded-lg"
                                                            />
                                                       </div>
                                                  )}

                                                  <div className="flex flex-wrap gap-2 mt-6">
                                                       {selectedPost.tags.map((tag, index) => (
                                                            <Badge key={index} variant="outline" className="text-sm">
                                                                 #{tag}
                                                            </Badge>
                                                       ))}
                                                  </div>
                                             </div>

                                             {/* Post Actions */}
                                             <div className="flex items-center justify-between py-4 border-t border-b">
                                                  <div className="flex items-center space-x-6">
                                                       <Button
                                                            variant="ghost"
                                                            className={`flex items-center space-x-2 ${likedPosts.has(selectedPost.id) ? 'text-teal-600' : 'text-gray-500'}`}
                                                            onClick={() => toggleLike(selectedPost.id)}
                                                       >
                                                            <ThumbsUp className={`w-5 h-5 ${likedPosts.has(selectedPost.id) ? 'fill-current' : ''}`} />
                                                            <span>{selectedPost.likes + (likedPosts.has(selectedPost.id) ? 1 : 0)}</span>
                                                       </Button>
                                                       <Button variant="ghost" className="flex items-center space-x-2 text-gray-500">
                                                            <MessageCircle className="w-5 h-5" />
                                                            <span>{getPostComments(selectedPost.id).length}</span>
                                                       </Button>
                                                       <div className="hidden" />
                                                  </div>
                                             </div>

                                             {/* Comments Section */}
                                             <div className="mt-6">
                                                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                                       Bình luận ({getPostComments(selectedPost.id).length})
                                                  </h3>

                                                  {/* Add Comment Form */}
                                                  <div className="mb-6">
                                                       <div className="flex items-start space-x-3">
                                                            <img
                                                                 src="https://ui-avatars.com/api/?name=You&background=0ea5e9&color=fff&size=100"
                                                                 alt="You"
                                                                 className="w-10 h-10 rounded-full object-cover"
                                                            />
                                                            <div className="flex-1">
                                                                 <Textarea
                                                                      placeholder={replyingTo ? `Trả lời ${replyingTo}...` : "Viết bình luận..."}
                                                                      value={newComment}
                                                                      onChange={(e) => setNewComment(e.target.value)}
                                                                      rows={3}
                                                                      className="resize-none"
                                                                 />
                                                                 <div className="flex items-center justify-between mt-2">
                                                                      {replyingTo && (
                                                                           <div className="flex items-center space-x-2 text-sm text-gray-500">
                                                                                <span>Trả lời:</span>
                                                                                <span className="font-medium">{replyingTo}</span>
                                                                                <Button
                                                                                     variant="ghost"
                                                                                     size="sm"
                                                                                     onClick={() => setReplyingTo(null)}
                                                                                >
                                                                                     <X className="w-4 h-4" />
                                                                                </Button>
                                                                           </div>
                                                                      )}
                                                                      <Button
                                                                           onClick={handleAddComment}
                                                                           disabled={!newComment.trim()}
                                                                           className="bg-teal-500 hover:bg-teal-600 text-white"
                                                                      >
                                                                           <Send className="w-4 h-4 mr-2" />
                                                                           Gửi
                                                                      </Button>
                                                                 </div>
                                                            </div>
                                                       </div>
                                                  </div>

                                                  {/* Comments List */}
                                                  <div className="space-y-4">
                                                       {getPostComments(selectedPost.id).map((comment) => (
                                                            <div key={comment.id} className="border-l-2 border-gray-100 pl-4">
                                                                 <div className="flex items-start space-x-3">
                                                                      <img
                                                                           src={comment.author.avatar}
                                                                           alt={comment.author.name}
                                                                           className="w-8 h-8 rounded-full object-cover"
                                                                      />
                                                                      <div className="flex-1">
                                                                           <div className="flex items-center space-x-2 mb-1">
                                                                                <span className="font-medium text-gray-900">{comment.author.name}</span>
                                                                                <span className="text-sm text-gray-500">
                                                                                     {new Date(comment.date).toLocaleDateString('vi-VN')}
                                                                                </span>
                                                                           </div>
                                                                           <p className="text-gray-700 mb-2">{comment.content}</p>
                                                                           <div className="flex items-center space-x-4">
                                                                                <Button
                                                                                     variant="ghost"
                                                                                     size="sm"
                                                                                     className={`flex items-center space-x-1 ${likedComments.has(comment.id) ? 'text-teal-600' : 'text-gray-500'}`}
                                                                                     onClick={() => toggleCommentLike(comment.id)}
                                                                                >
                                                                                     <ThumbsUp className={`w-4 h-4 ${likedComments.has(comment.id) ? 'fill-current' : ''}`} />
                                                                                     <span>{comment.likes + (likedComments.has(comment.id) ? 1 : 0)}</span>
                                                                                </Button>
                                                                                <Button
                                                                                     variant="ghost"
                                                                                     size="sm"
                                                                                     className="flex items-center space-x-1 text-gray-500"
                                                                                     onClick={() => setReplyingTo(comment.author.name)}
                                                                                >
                                                                                     <Reply className="w-4 h-4" />
                                                                                     <span>Trả lời</span>
                                                                                </Button>
                                                                           </div>

                                                                           {/* Replies */}
                                                                           {comment.replies && comment.replies.length > 0 && (
                                                                                <div className="mt-3 ml-6 space-y-3">
                                                                                     {comment.replies.map((reply) => (
                                                                                          <div key={reply.id} className="flex items-start space-x-3">
                                                                                               <img
                                                                                                    src={reply.author.avatar}
                                                                                                    alt={reply.author.name}
                                                                                                    className="w-6 h-6 rounded-full object-cover"
                                                                                               />
                                                                                               <div className="flex-1">
                                                                                                    <div className="flex items-center space-x-2 mb-1">
                                                                                                         <span className="font-medium text-gray-900 text-sm">{reply.author.name}</span>
                                                                                                         <span className="text-xs text-gray-500">
                                                                                                              {new Date(reply.date).toLocaleDateString('vi-VN')}
                                                                                                         </span>
                                                                                                    </div>
                                                                                                    <p className="text-gray-700 text-sm mb-1">{reply.content}</p>
                                                                                                    <div className="flex items-center space-x-3">
                                                                                                         <Button
                                                                                                              variant="ghost"
                                                                                                              size="sm"
                                                                                                              className={`flex items-center space-x-1 text-xs ${likedComments.has(reply.id) ? 'text-teal-600' : 'text-gray-500'}`}
                                                                                                              onClick={() => toggleCommentLike(reply.id)}
                                                                                                         >
                                                                                                              <ThumbsUp className={`w-3 h-3 ${likedComments.has(reply.id) ? 'fill-current' : ''}`} />
                                                                                                              <span>{reply.likes + (likedComments.has(reply.id) ? 1 : 0)}</span>
                                                                                                         </Button>
                                                                                                         <Button
                                                                                                              variant="ghost"
                                                                                                              size="sm"
                                                                                                              className="flex items-center space-x-1 text-xs text-gray-500"
                                                                                                              onClick={() => setReplyingTo(reply.author.name)}
                                                                                                         >
                                                                                                              <Reply className="w-3 h-3" />
                                                                                                              <span>Trả lời</span>
                                                                                                         </Button>
                                                                                                    </div>
                                                                                               </div>
                                                                                          </div>
                                                                                     ))}
                                                                                </div>
                                                                           )}
                                                                      </div>
                                                                 </div>
                                                            </div>
                                                       ))}
                                                  </div>
                                             </div>
                                        </div>
                                   </div>
                              </div>
                         </div>
                    )}
               </Container>
          </Section>
     );
}

