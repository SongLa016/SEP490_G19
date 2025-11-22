import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, X, User, LogIn } from "lucide-react";
import { Button, Card, CardContent } from "../../../../../shared/components/ui";
import NewThreadModal from "./NewThreadModal";
import ReplyModal from "./ReplyModal";
import PostCard from "./PostCard";
import { useAuth } from "../../../../../contexts/AuthContext";
import { usePosts } from "./hooks/usePosts";
import { usePostActions } from "./hooks/usePostActions";
import { useComments } from "./hooks/useComments";
import { usePostMenu } from "./hooks/usePostMenu";
import { formatTimeAgo } from "./utils/formatTime";
import Swal from 'sweetalert2';

export default function ThreadsFeed({ refreshTrigger }) {
     const { user } = useAuth();
     const [selectedPost, setSelectedPost] = useState(null);
     const [showNewThread, setShowNewThread] = useState(false);
     const [showReplyModal, setShowReplyModal] = useState(false);
     const [replyContent, setReplyContent] = useState("");
     const [selectedField, setSelectedField] = useState(null);
     const [newPostTitle, setNewPostTitle] = useState("");
     const [newPostContent, setNewPostContent] = useState("");

     // Custom hooks
     const {
          posts,
          loading,
          setPosts,
          loadPosts,
          toggleLike,
          toggleRepost,
          toggleBookmark
     } = usePosts(user, refreshTrigger);

     const {
          editingPost,
          setEditingPost,
          editPostTitle,
          setEditPostTitle,
          editPostContent,
          setEditPostContent,
          editSelectedField,
          setEditSelectedField,
          editSelectedImage,
          setEditSelectedImage,
          editImagePreview,
          setEditImagePreview,
          handlePostSubmit,
          handleDeletePost,
          handleToggleVisibility
     } = usePostActions(user, posts, setPosts);

     const {
          showCommentInput,
          commentContent,
          toggleCommentInput,
          handleCommentChange,
          handleCommentSubmit
     } = useComments(user, posts, setPosts);

     const {
          showPostMenu,
          togglePostMenu,
          handleMenuAction
     } = usePostMenu(
          posts,
          setPosts,
          user,
          setEditingPost,
          setEditPostTitle,
          setEditPostContent,
          setEditSelectedField,
          setEditImagePreview,
          setEditSelectedImage,
          setShowNewThread,
          handleDeletePost,
          handleToggleVisibility,
          loadPosts
     );

     const handleOpenReply = (post) => {
          setSelectedPost(post);
          setShowReplyModal(true);
     };

     const handleReplySubmit = (content) => {
          console.log("Replying to post:", selectedPost?.PostID, "Content:", content);
          // Add your reply submission logic here
     };

     return (
          <div className="min-h-screen">
               {/* Main Content - Centered */}
               <div className="flex justify-center">
                    {/* Posts Feed với Stagger Animations */}
                    {loading ? (
                         <div className="flex justify-center items-center py-12">
                              <div className="text-gray-500">Đang tải...</div>
                         </div>
                    ) : posts.length === 0 ? (
                         <div className="flex justify-center items-center py-12">
                              <div className="text-gray-500">Chưa có bài viết nào</div>
                         </div>
                    ) : (
                         <div className="divide-y divide-gray-200">
                              {posts.map((post, index) => (
                                   <PostCard
                                        key={post.PostID}
                                        post={post}
                                        index={index}
                                        user={user}
                                        toggleLike={toggleLike}
                                        toggleRepost={toggleRepost}
                                        toggleBookmark={toggleBookmark}
                                        toggleCommentInput={toggleCommentInput}
                                        showCommentInput={showCommentInput}
                                        commentContent={commentContent}
                                        handleCommentChange={handleCommentChange}
                                        handleCommentSubmit={handleCommentSubmit}
                                        handleOpenReply={handleOpenReply}
                                        formatTimeAgo={formatTimeAgo}
                                        togglePostMenu={togglePostMenu}
                                        showPostMenu={showPostMenu}
                                        handleMenuAction={handleMenuAction}
                                   />
                              ))}
                         </div>
                    )}
               </div>

               {/* Right Plus Button - Fixed to right edge */}
               <div className="fixed right-4 top-20 z-20">
                    <Button
                         onClick={() => {
                              if (!user) {
                                   Swal.fire({
                                        icon: 'info',
                                        title: 'Yêu cầu đăng nhập',
                                        text: 'Vui lòng đăng nhập để tạo bài viết mới.',
                                        showCancelButton: true,
                                        confirmButtonText: 'Đăng nhập',
                                        cancelButtonText: 'Hủy',
                                        confirmButtonColor: '#0ea5e9',
                                        cancelButtonColor: '#6b7280'
                                   }).then((result) => {
                                        if (result.isConfirmed) {
                                             window.location.href = '/login';
                                        }
                                   });
                              } else {
                                   setShowNewThread(true);
                              }
                         }}
                         className="w-12 h-12 rounded-full bg-gray-900 hover:bg-gray-800 text-white shadow-lg"
                    >
                         <Plus className="w-6 h-6" />
                    </Button>
               </div>

               <NewThreadModal
                    isOpen={showNewThread}
                    onClose={() => {
                         setShowNewThread(false);
                         // Reset edit state when closing
                         if (editingPost) {
                              setEditingPost(null);
                              setEditPostTitle("");
                              setEditPostContent("");
                              setEditSelectedField(null);
                              setEditImagePreview(null);
                              setEditSelectedImage(null);
                         }
                    }}
                    user={user}
                    postContent={editingPost ? editPostContent : newPostContent}
                    setPostContent={editingPost ? setEditPostContent : setNewPostContent}
                    postTitle={editingPost ? editPostTitle : newPostTitle}
                    setPostTitle={editingPost ? setEditPostTitle : setNewPostTitle}
                    selectedField={editingPost ? editSelectedField : selectedField}
                    setSelectedField={editingPost ? setEditSelectedField : setSelectedField}
                    onSubmit={handlePostSubmit}
                    editingPost={editingPost}
                    editImagePreview={editImagePreview}
                    setEditImagePreview={setEditImagePreview}
                    editSelectedImage={editSelectedImage}
                    setEditSelectedImage={setEditSelectedImage}
               />

               <ReplyModal
                    isOpen={showReplyModal}
                    onClose={() => {
                         setShowReplyModal(false);
                         setSelectedPost(null);
                         setReplyContent("");
                    }}
                    user={user}
                    originalPost={selectedPost ? {
                         author: selectedPost.author?.FullName || selectedPost.author?.fullName || selectedPost.author?.name || "Người dùng",
                         avatar: selectedPost.author?.Avatar || selectedPost.author?.avatar,
                         verified: selectedPost.author?.Verified || false,
                         timeAgo: formatTimeAgo(selectedPost.CreatedAt),
                         content: selectedPost.Content
                    } : null}
                    replyContent={replyContent}
                    setReplyContent={setReplyContent}
                    onSubmit={handleReplySubmit}
               />

               {/* Login/Signup Modal for non-logged users */}
               {!user && showNewThread && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                         <Card className="w-full rounded-2xl max-w-md bg-white border border-gray-200">
                              <CardContent className="p-6">
                                   <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-bold text-gray-900">Đăng nhập hoặc đăng ký</h2>
                                        <Button
                                             variant="ghost"
                                             size="sm"
                                             onClick={() => setShowNewThread(false)}
                                        >
                                             <X className="w-5 h-5" />
                                        </Button>
                                   </div>

                                   <p className="text-gray-600 mb-6 text-sm">Xem những gì mọi người đang nói và tham gia cuộc trò chuyện.</p>

                                   <Button
                                        className="w-full bg-gray-900 hover:bg-gray-800 text-white mb-3"
                                        onClick={() => setShowNewThread(false)}
                                   >
                                        <User className="w-5 h-5 mr-2" />
                                        Tiếp tục trải nghiệm BallSpot
                                   </Button>

                                   <Link to="/login">
                                        <Button
                                             variant="ghost"
                                             className="w-full text-gray-600 hover:bg-gray-100"
                                        >
                                             <LogIn className="w-5 h-5 mr-2" />
                                             Đăng nhập bằng tài khoản của bạn
                                        </Button>
                                   </Link>
                              </CardContent>
                         </Card>
                    </div>
               )}
          </div>
     );
}
