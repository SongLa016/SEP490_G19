import React, { useState, useEffect } from "react";
import {
     Card,
     CardContent,
     CardHeader,
     CardTitle,
     Button,
     Input,
     Select,
     SelectContent,
     SelectItem,
     SelectTrigger,
     SelectValue,
     Textarea,
     Table,
     Badge,
     Alert,
     AlertDescription,
     DatePicker,
     Modal
} from "../../components/ui";
import {
     FileText,
     Plus,
     Edit,
     Trash2,
     Eye,
     Calendar,
     User,
     Search,
     X,
     CheckCircle,
     Clock,
     Globe
} from "lucide-react";

export default function BlogManagement() {
     const [posts, setPosts] = useState([]);
     const [filteredPosts, setFilteredPosts] = useState([]);
     const [searchTerm, setSearchTerm] = useState("");
     const [statusFilter, setStatusFilter] = useState("all");
     const [showCreateModal, setShowCreateModal] = useState(false);
     const [showEditModal, setShowEditModal] = useState(false);
     const [showDetailModal, setShowDetailModal] = useState(false);
     const [selectedPost, setSelectedPost] = useState(null);

     const [newPost, setNewPost] = useState({
          title: "",
          content: "",
          status: "Draft"
     });

     useEffect(() => {
          // Mock data - trong thực tế sẽ gọi API
          const mockPosts = [
               {
                    id: 1,
                    title: "Hướng dẫn đặt sân bóng đá online",
                    content: "Bài viết hướng dẫn chi tiết cách đặt sân bóng đá trực tuyến trên nền tảng của chúng tôi. Bao gồm các bước từ đăng ký tài khoản đến thanh toán và nhận xác nhận.",
                    authorID: 1,
                    authorName: "Admin System",
                    status: "Published",
                    createdAt: "2024-01-20T10:00:00",
                    updatedAt: "2024-01-20T10:00:00",
                    views: 1250,
                    likes: 45
               },
               {
                    id: 2,
                    title: "Lợi ích của việc chơi bóng đá thường xuyên",
                    content: "Bóng đá không chỉ là môn thể thao giải trí mà còn mang lại nhiều lợi ích cho sức khỏe. Bài viết này sẽ chia sẻ những lợi ích tuyệt vời của việc chơi bóng đá thường xuyên.",
                    authorID: 1,
                    authorName: "Admin System",
                    status: "Published",
                    createdAt: "2024-01-19T15:30:00",
                    updatedAt: "2024-01-19T15:30:00",
                    views: 890,
                    likes: 32
               },
               {
                    id: 3,
                    title: "Các kỹ thuật cơ bản trong bóng đá",
                    content: "Bài viết giới thiệu các kỹ thuật cơ bản mà mọi cầu thủ bóng đá cần nắm vững. Từ cách kiểm soát bóng đến các kỹ thuật sút bóng và chuyền bóng.",
                    authorID: 1,
                    authorName: "Admin System",
                    status: "Draft",
                    createdAt: "2024-01-18T09:15:00",
                    updatedAt: "2024-01-18T09:15:00",
                    views: 0,
                    likes: 0
               },
               {
                    id: 4,
                    title: "Lịch sử phát triển của bóng đá Việt Nam",
                    content: "Tìm hiểu về lịch sử phát triển của bóng đá Việt Nam từ những ngày đầu đến hiện tại. Những thành tựu và cột mốc quan trọng trong lịch sử bóng đá nước nhà.",
                    authorID: 1,
                    authorName: "Admin System",
                    status: "Published",
                    createdAt: "2024-01-17T14:20:00",
                    updatedAt: "2024-01-17T14:20:00",
                    views: 2100,
                    likes: 78
               }
          ];

          setPosts(mockPosts);
          setFilteredPosts(mockPosts);
     }, []);

     useEffect(() => {
          let filtered = posts;

          // Filter by search term
          if (searchTerm) {
               filtered = filtered.filter(post =>
                    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    post.content.toLowerCase().includes(searchTerm.toLowerCase())
               );
          }

          // Filter by status
          if (statusFilter !== "all") {
               filtered = filtered.filter(post => post.status === statusFilter);
          }

          setFilteredPosts(filtered);
     }, [posts, searchTerm, statusFilter]);

     const handleCreatePost = () => {
          const post = {
               id: posts.length + 1,
               ...newPost,
               authorID: 1, // Current admin user
               authorName: "Admin System",
               createdAt: new Date().toISOString(),
               updatedAt: new Date().toISOString(),
               views: 0,
               likes: 0
          };

          setPosts([post, ...posts]);
          setShowCreateModal(false);
          setNewPost({
               title: "",
               content: "",
               status: "Draft"
          });
     };

     const handleEditPost = (post) => {
          setSelectedPost(post);
          setShowEditModal(true);
     };

     const handleDeletePost = (post) => {
          if (window.confirm(`Bạn có chắc chắn muốn xóa bài viết "${post.title}"?`)) {
               setPosts(posts.filter(p => p.id !== post.id));
          }
     };

     const handleViewPost = (post) => {
          setSelectedPost(post);
          setShowDetailModal(true);
     };

     const handlePublishPost = (post) => {
          setPosts(posts.map(p =>
               p.id === post.id ? { ...p, status: "Published", updatedAt: new Date().toISOString() } : p
          ));
     };

     const handleUpdatePost = () => {
          setPosts(posts.map(p =>
               p.id === selectedPost.id ? { ...p, ...selectedPost, updatedAt: new Date().toISOString() } : p
          ));
          setShowEditModal(false);
     };

     const getStatusBadgeColor = (status) => {
          switch (status) {
               case "Published":
                    return "bg-green-100 text-green-800 border-green-200";
               case "Draft":
                    return "bg-yellow-100 text-yellow-800 border-yellow-200";
               case "Archived":
                    return "bg-gray-100 text-gray-800 border-gray-200";
               default:
                    return "bg-gray-100 text-gray-800 border-gray-200";
          }
     };

     const columns = [
          {
               key: "title",
               label: "Tiêu đề",
               render: (post) => (
                    <div className="max-w-xs">
                         <p className="font-medium text-slate-900 truncate">{post.title}</p>
                         <p className="text-sm text-slate-500 truncate">{post.content.substring(0, 100)}...</p>
                    </div>
               )
          },
          {
               key: "author",
               label: "Tác giả",
               render: (post) => (
                    <div className="flex items-center space-x-2">
                         <User className="w-4 h-4 text-slate-400" />
                         <span className="text-sm text-slate-600">{post.authorName}</span>
                    </div>
               )
          },
          {
               key: "status",
               label: "Trạng thái",
               render: (post) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(post.status)}`}>
                         {post.status}
                    </span>
               )
          },
          {
               key: "stats",
               label: "Thống kê",
               render: (post) => (
                    <div className="text-sm text-slate-600">
                         <div className="flex items-center space-x-1">
                              <Eye className="w-3 h-3" />
                              <span>{post.views}</span>
                         </div>
                         <div className="flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>{post.likes}</span>
                         </div>
                    </div>
               )
          },
          {
               key: "createdAt",
               label: "Ngày tạo",
               render: (post) => (
                    <div className="flex items-center space-x-2">
                         <Calendar className="w-4 h-4 text-slate-400" />
                         <span className="text-sm text-slate-600">
                              {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                         </span>
                    </div>
               )
          },
          {
               key: "actions",
               label: "Thao tác",
               render: (post) => (
                    <div className="flex items-center space-x-2">
                         <Button
                              onClick={() => handleViewPost(post)}
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                         >
                              <Eye className="w-4 h-4" />
                         </Button>
                         <Button
                              onClick={() => handleEditPost(post)}
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-800 hover:bg-green-50"
                         >
                              <Edit className="w-4 h-4" />
                         </Button>
                         {post.status === "Draft" && (
                              <Button
                                   onClick={() => handlePublishPost(post)}
                                   variant="ghost"
                                   size="sm"
                                   className="text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                              >
                                   <Globe className="w-4 h-4" />
                              </Button>
                         )}
                         <Button
                              onClick={() => handleDeletePost(post)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                         >
                              <Trash2 className="w-4 h-4" />
                         </Button>
                    </div>
               )
          }
     ];

     return (
          <div className="space-y-6">
               {/* Header */}
               <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 border border-red-200/50">
                    <div className="flex items-center justify-between">
                         <div>
                              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-700 to-pink-700 bg-clip-text text-transparent">
                                   Quản lý blog
                              </h1>
                              <p className="text-slate-600 mt-2 font-medium">
                                   Tạo và quản lý các bài viết blog cho nền tảng
                              </p>
                         </div>
                         <div className="flex space-x-3">
                              <Button
                                   onClick={() => setShowCreateModal(true)}
                                   className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                              >
                                   <Plus className="w-4 h-4 mr-2" />
                                   Tạo bài viết
                              </Button>
                              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                                   <FileText className="w-8 h-8 text-white" />
                              </div>
                         </div>
                    </div>
               </div>

               {/* Filters */}
               <Card className="p-6 rounded-2xl shadow-lg">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
                         <div className="flex-1">
                              <div className="relative">
                                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                   <Input
                                        placeholder="Tìm kiếm theo tiêu đề hoặc nội dung..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                   />
                              </div>
                         </div>
                         <div className="flex space-x-4">
                              <Select value={statusFilter} onValueChange={setStatusFilter}>
                                   <SelectTrigger className="w-40 rounded-2xl">
                                        <SelectValue placeholder="Tất cả trạng thái" />
                                   </SelectTrigger>
                                   <SelectContent>
                                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                        <SelectItem value="Published">Đã xuất bản</SelectItem>
                                        <SelectItem value="Draft">Bản nháp</SelectItem>
                                        <SelectItem value="Archived">Đã lưu trữ</SelectItem>
                                   </SelectContent>
                              </Select>
                         </div>
                    </div>
               </Card>

               {/* Stats */}
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-4 rounded-2xl shadow-lg">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-slate-600">Tổng bài viết</p>
                                   <p className="text-2xl font-bold text-slate-900">{posts.length}</p>
                              </div>
                              <FileText className="w-8 h-8 text-blue-600" />
                         </div>
                    </Card>
                    <Card className="p-4">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-slate-600">Đã xuất bản</p>
                                   <p className="text-2xl font-bold text-slate-900">
                                        {posts.filter(p => p.status === "Published").length}
                                   </p>
                              </div>
                              <Globe className="w-8 h-8 text-green-600" />
                         </div>
                    </Card>
                    <Card className="p-4">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-slate-600">Bản nháp</p>
                                   <p className="text-2xl font-bold text-slate-900">
                                        {posts.filter(p => p.status === "Draft").length}
                                   </p>
                              </div>
                              <Clock className="w-8 h-8 text-yellow-600" />
                         </div>
                    </Card>
                    <Card className="p-4">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-slate-600">Tổng lượt xem</p>
                                   <p className="text-2xl font-bold text-slate-900">
                                        {posts.reduce((sum, post) => sum + post.views, 0).toLocaleString()}
                                   </p>
                              </div>
                              <Eye className="w-8 h-8 text-purple-600" />
                         </div>
                    </Card>
               </div>

               {/* Posts Table */}
               <Card className="p-6 rounded-2xl shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                         <h3 className="text-lg font-bold text-slate-900">
                              Danh sách bài viết ({filteredPosts.length})
                         </h3>
                    </div>
                    <Table
                         data={filteredPosts}
                         columns={columns}
                         className="w-full"
                    />
               </Card>

               {/* Create Post Modal */}
               <Modal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    title="Tạo bài viết mới"
                    size="4xl"
                    className="max-h-[90vh] scrollbar-hide"
               >

                    <div className="space-y-4">
                         <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                   Tiêu đề *
                              </label>
                              <Input
                                   value={newPost.title}
                                   onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                                   placeholder="Nhập tiêu đề bài viết..."
                              />
                         </div>

                         <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                   Nội dung *
                              </label>
                              <Textarea
                                   value={newPost.content}
                                   onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                                   placeholder="Nhập nội dung bài viết..."
                                   rows={12}
                              />
                         </div>

                         <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                   Trạng thái
                              </label>
                              <Select
                                   value={newPost.status}
                                   onValueChange={(value) => setNewPost({ ...newPost, status: value })}
                              >
                                   <SelectTrigger className="rounded-2xl">
                                        <SelectValue placeholder="Chọn trạng thái" />
                                   </SelectTrigger>
                                   <SelectContent>
                                        <SelectItem value="Draft">Bản nháp</SelectItem>
                                        <SelectItem value="Published">Xuất bản</SelectItem>
                                   </SelectContent>
                              </Select>
                         </div>

                         <div className="flex space-x-3 pt-4 border-t border-slate-200">
                              <Button
                                   onClick={handleCreatePost}
                                   className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 rounded-2xl"
                                   disabled={!newPost.title || !newPost.content}
                              >
                                   Tạo bài viết
                              </Button>
                              <Button
                                   onClick={() => setShowCreateModal(false)}
                                   variant="outline"
                                   className="flex-1 rounded-2xl"
                              >
                                   Hủy
                              </Button>
                         </div>
                    </div>
               </Modal>

               {/* Edit Post Modal */}
               <Modal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    title="Chỉnh sửa bài viết"
                    size="4xl"
                    className="max-h-[90vh] scrollbar-hide"
               >
                    {selectedPost && (
                         <div className="space-y-4">
                              <div>
                                   <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Tiêu đề *
                                   </label>
                                   <Input
                                        value={selectedPost.title}
                                        onChange={(e) => setSelectedPost({ ...selectedPost, title: e.target.value })}
                                        placeholder="Nhập tiêu đề bài viết..."
                                   />
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Nội dung *
                                   </label>
                                   <Textarea
                                        value={selectedPost.content}
                                        onChange={(e) => setSelectedPost({ ...selectedPost, content: e.target.value })}
                                        placeholder="Nhập nội dung bài viết..."
                                        rows={12}
                                   />
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Trạng thái
                                   </label>
                                   <Select
                                        value={selectedPost.status}
                                        onValueChange={(value) => setSelectedPost({ ...selectedPost, status: value })}
                                   >
                                        <SelectTrigger className="rounded-2xl">
                                             <SelectValue placeholder="Chọn trạng thái" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="Draft">Bản nháp</SelectItem>
                                             <SelectItem value="Published">Xuất bản</SelectItem>
                                             <SelectItem value="Archived">Lưu trữ</SelectItem>
                                        </SelectContent>
                                   </Select>
                              </div>

                              <div className="flex space-x-3 pt-4 border-t border-slate-200">
                                   <Button
                                        onClick={handleUpdatePost}
                                        className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 rounded-2xl"
                                        disabled={!selectedPost.title || !selectedPost.content}
                                   >
                                        Cập nhật bài viết
                                   </Button>
                                   <Button
                                        onClick={() => setShowEditModal(false)}
                                        variant="outline"
                                        className="flex-1 rounded-2xl"
                                   >
                                        Hủy
                                   </Button>
                              </div>
                         </div>
                    )}
               </Modal>

               {/* Post Detail Modal */}
               <Modal
                    isOpen={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    title="Chi tiết bài viết"
                    size="4xl"
                    className="max-h-[90vh] scrollbar-hide"
               >
                    {selectedPost && (
                         <div className="space-y-6">
                              <div>
                                   <h4 className="text-2xl font-bold text-slate-900 mb-2">{selectedPost.title}</h4>
                                   <div className="flex items-center space-x-4 text-sm text-slate-600">
                                        <div className="flex items-center space-x-1">
                                             <User className="w-4 h-4" />
                                             <span>{selectedPost.authorName}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                             <Calendar className="w-4 h-4" />
                                             <span>{new Date(selectedPost.createdAt).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(selectedPost.status)}`}>
                                             {selectedPost.status}
                                        </span>
                                   </div>
                              </div>

                              <div>
                                   <h5 className="text-lg font-bold text-slate-900 mb-3">Nội dung:</h5>
                                   <div className="prose max-w-none">
                                        <p className="text-slate-900 whitespace-pre-wrap leading-relaxed">
                                             {selectedPost.content}
                                        </p>
                                   </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                   <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <Eye className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                                        <p className="text-sm font-medium text-blue-700">Lượt xem</p>
                                        <p className="text-2xl font-bold text-blue-800">{selectedPost.views}</p>
                                   </div>
                                   <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                                        <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                                        <p className="text-sm font-medium text-green-700">Lượt thích</p>
                                        <p className="text-2xl font-bold text-green-800">{selectedPost.likes}</p>
                                   </div>
                                   <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                                        <Calendar className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                                        <p className="text-sm font-medium text-purple-700">Cập nhật</p>
                                        <p className="text-sm font-bold text-purple-800">
                                             {new Date(selectedPost.updatedAt).toLocaleDateString('vi-VN')}
                                        </p>
                                   </div>
                              </div>

                              <div className="flex space-x-3 pt-4 border-t border-slate-200">
                                   <Button
                                        onClick={() => {
                                             setShowDetailModal(false);
                                             handleEditPost(selectedPost);
                                        }}
                                        className="flex-1 rounded-2xl"
                                   >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Chỉnh sửa
                                   </Button>
                                   {selectedPost.status === "Draft" && (
                                        <Button
                                             onClick={() => handlePublishPost(selectedPost)}
                                             className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 rounded-2xl"
                                        >
                                             <Globe className="w-4 h-4 mr-2" />
                                             Xuất bản
                                        </Button>
                                   )}
                              </div>
                         </div>
                    )}
               </Modal>
          </div>
     );
}
