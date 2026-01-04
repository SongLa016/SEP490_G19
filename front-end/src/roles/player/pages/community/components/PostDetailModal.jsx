import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Heart, MessageCircle, Bookmark, MoreHorizontal, Trash2, Edit, MapPin, Building2, Share, List, ExternalLink, Flag } from "lucide-react";
import { Modal, Button, Avatar, AvatarImage, AvatarFallback, Badge, Textarea } from '../../../../../shared/components/ui';
import { fetchCommentsByPost, deleteComment, updateComment } from '../../../../../shared/services/comments';
import { fetchFields } from '../../../../../shared/index';
import { formatTimeAgo } from './utils/formatTime';
import { createReport } from '../../../../../shared/services/reports';
import { API_BASE_URL } from '../../../../../shared/config/api';
import Swal from 'sweetalert2';
import { getUserAvatarAndName } from "./utils";


const PostDetailModal = ({
     isOpen,
     onClose,
     post,
     user,
     onLike,
     onRepost,
     onBookmark,
     onCommentSubmit
}) => {
     const [comments, setComments] = useState([]);
     const [loading, setLoading] = useState(false);
     const [commentContent, setCommentContent] = useState("");
     const [editingCommentId, setEditingCommentId] = useState(null);
     const [editingCommentContent, setEditingCommentContent] = useState("");
     const [showCommentMenu, setShowCommentMenu] = useState({});
     const [replyingToCommentId, setReplyingToCommentId] = useState(null);
     const [replyContent, setReplyContent] = useState({});
     const [fieldDetails, setFieldDetails] = useState(null);
     const { avatarUrl: currentUserAvatar, initial: currentUserInitial } = getUserAvatarAndName(user);
     const commentInputRef = useRef(null);

     // tự động mở rộng textarea
     const autoResize = useCallback((element, maxHeight = 200) => {
          if (element) {
               element.style.height = 'auto';
               element.style.height = Math.min(element.scrollHeight, maxHeight) + 'px';
          }
     }, []);

     // yêu cầu đăng nhập trước
     const requireLogin = (actionLabel = "sử dụng tính năng này") => {
          if (user) return true;

          Swal.fire({
               icon: "info",
               title: "Yêu cầu đăng nhập",
               text: `Vui lòng đăng nhập để ${actionLabel}.`,
               showCancelButton: true,
               confirmButtonText: "Đăng nhập",
               cancelButtonText: "Hủy",
               confirmButtonColor: "#0ea5e9",
               cancelButtonColor: "#6b7280",
          }).then((result) => {
               if (result.isConfirmed) {
                    window.location.href = "/login";
               }
          });

          return false;
     };

     useEffect(() => {
          if (isOpen && post) {
               loadComments();
               loadFieldDetails();
          }
     }, [isOpen, post]);

     // tải thông tin sân
     const loadFieldDetails = async () => {
          if (!post?.fieldId && !post?.FieldID) return;

          const fieldId = post.fieldId || post.FieldID;
          try {
               // lấy danh sách sân
               const allFields = await fetchFields();
               // tìm sân theo ID
               const field = allFields.find(f =>
                    f.fieldId === fieldId ||
                    f.id === fieldId ||
                    f.Id === fieldId ||
                    f.FieldId === fieldId
               );

               if (field) {
                    setFieldDetails(field);
               } else {
                    console.warn('[PostDetailModal] Field not found with ID:', fieldId);
               }
          } catch (error) {
               console.error('[PostDetailModal] Error loading field details:', error);
          }
     };

     // tải danh sách bình luận
     const loadComments = async () => {
          if (!post?.PostID) return;

          setLoading(true);
          try {
               const fetchedComments = await fetchCommentsByPost(post.PostID);
               // lấy thông tin user cho mỗi comment
               const commentsWithUserInfo = await Promise.all(
                    fetchedComments.map(async (comment) => {
                         const hasAuthorInfo = comment.author?.name && comment.author.name.trim() !== '' &&
                              comment.author?.username && comment.author.username.trim() !== '';
                         if (!hasAuthorInfo && comment.userId) {
                              try {
                                   const token = localStorage.getItem("token");
                                   const profileResponse = await fetch(
                                        `${API_BASE_URL}/api/PlayerProfile/${comment.userId}`,
                                        {
                                             headers: {
                                                  "Content-Type": "application/json",
                                                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                             },
                                        }
                                   );

                                   if (profileResponse.ok) {
                                        const profile = await profileResponse.json();
                                        return {
                                             ...comment,
                                             userName:
                                                  profile.fullName ||
                                                  profile.FullName ||
                                                  comment.userName ||
                                                  comment.username ||
                                                  comment.userName,
                                             author: {
                                                  ...comment.author,
                                                  id: profile.id || profile.userId || profile.UserID || comment.userId,
                                                  username:
                                                       comment.author?.username ||
                                                       comment.author?.userName ||
                                                       comment.userName ||
                                                       "",
                                                  name:
                                                       profile.fullName ||
                                                       profile.FullName ||
                                                       comment.author?.name ||
                                                       comment.fullName ||
                                                       comment.FullName ||
                                                       "",
                                                  avatar: profile.avatar || profile.avatarUrl || comment.author?.avatar || null,
                                                  verified:
                                                       profile.verified ||
                                                       profile.Verified ||
                                                       comment.author?.verified ||
                                                       comment.author?.Verified ||
                                                       false,
                                             },
                                        };
                                   }
                              } catch (error) {
                                   console.error('[PostDetailModal] Error fetching user data:', error);
                              }
                         }
                         return comment;
                    })
               );
               setComments(commentsWithUserInfo || []);
          } catch (error) {
               console.error("Error loading comments:", error);
               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: 'Không thể tải bình luận. Vui lòng thử lại.',
                    toast: true,
                    position: 'top-end',
                    timer: 3000,
                    showConfirmButton: false
               });
          } finally {
               setLoading(false);
          }
     };

     // submit bình luận
     const handleCommentSubmit = async () => {
          if (!user) {
               if (!requireLogin("bình luận")) return;
          }
          if (!commentContent.trim()) return;

          const success = await onCommentSubmit?.(post.PostID, commentContent);
          if (success) {
               setCommentContent("");
               loadComments();
          }
     };

     // xóa bình luận
     const handleDeleteComment = async (commentId) => {
          const result = await Swal.fire({
               title: 'Xóa bình luận?',
               text: 'Bạn có chắc chắn muốn xóa bình luận này?',
               icon: 'warning',
               showCancelButton: true,
               confirmButtonColor: '#ef4444',
               cancelButtonColor: '#6b7280',
               confirmButtonText: 'Xóa',
               cancelButtonText: 'Hủy'
          });

          if (result.isConfirmed) {
               try {
                    await deleteComment(commentId);
                    Swal.fire({
                         icon: 'success',
                         title: 'Đã xóa!',
                         text: 'Bình luận đã được xóa',
                         timer: 2000,
                         showConfirmButton: false,
                         toast: true,
                         position: 'top-end'
                    });
                    loadComments();
               } catch (error) {
                    Swal.fire({
                         icon: 'error',
                         title: 'Lỗi',
                         text: error.message || 'Không thể xóa bình luận',
                         confirmButtonText: 'Đã hiểu'
                    });
               }
          }
     };

     // chỉnh sửa bình luận
     const handleEditComment = (comment) => {
          setEditingCommentId(comment.id || comment.commentId);
          setEditingCommentContent(comment.content);
          setShowCommentMenu({});
     };

     // cập nhật bình luận
     const handleUpdateComment = async (commentId) => {
          if (!editingCommentContent.trim()) return;

          try {
               await updateComment(commentId, { content: editingCommentContent });
               Swal.fire({
                    icon: 'success',
                    title: 'Đã cập nhật!',
                    text: 'Bình luận đã được cập nhật',
                    timer: 2000,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end'
               });
               setEditingCommentId(null);
               setEditingCommentContent("");
               loadComments();
          } catch (error) {
               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: error.message || 'Không thể cập nhật bình luận',
                    confirmButtonText: 'Đã hiểu'
               });
          }
     };

     // hiển thị menu comment
     const toggleCommentMenu = (commentId) => {
          setShowCommentMenu(prev => ({
               ...prev,
               [commentId]: !prev[commentId]
          }));
     };

     // kiểm tra comment của user hiện tại
     const isOwnComment = (comment) => {
          const currentUserId = user?.userID || user?.userId || user?.UserID || user?.id;
          const commentUserId = comment?.userId;
          return currentUserId && commentUserId && String(currentUserId) === String(commentUserId);
     };

     const handleReplyToComment = (commentId) => {
          setReplyingToCommentId(commentId);
          setShowCommentMenu({});
     };

     // trả lời bình luận
     const handleReplySubmit = async (commentId) => {
          if (!user) {
               if (!requireLogin("trả lời bình luận")) return;
          }
          const content = replyContent[commentId];
          if (!content || !content.trim()) return;

          try {
               // gửi bình luận
               const success = await onCommentSubmit?.(post.PostID, content.trim(), commentId);
               if (success) {
                    setReplyContent(prev => ({
                         ...prev,
                         [commentId]: ""
                    }));
                    setReplyingToCommentId(null);
                    loadComments();
               }
          } catch (error) {
               console.error("Error submitting reply:", error);
          }
     };

     // thay đổi nội dung trả lời
     const handleReplyChange = (commentId, content) => {
          setReplyContent(prev => ({
               ...prev,
               [commentId]: content
          }));
     };

     // báo cáo bình luận
     const handleReportComment = async (commentId) => {
          if (!user) {
               if (!requireLogin("báo cáo bình luận")) return;
          }
          const reportPrompt = await Swal.fire({
               title: 'Báo cáo bình luận',
               input: 'textarea',
               inputLabel: 'Mô tả lý do báo cáo (tối thiểu 10 ký tự)',
               inputPlaceholder: 'Ví dụ: Bình luận chứa nội dung không phù hợp...',
               inputAttributes: {
                    'aria-label': 'Lý do báo cáo'
               },
               showCancelButton: true,
               confirmButtonText: 'Gửi báo cáo',
               cancelButtonText: 'Hủy',
               preConfirm: (value) => {
                    if (!value || value.trim().length < 10) {
                         Swal.showValidationMessage('Vui lòng nhập lý do tối thiểu 10 ký tự.');
                    }
                    return value;
               }
          });

          if (reportPrompt.isConfirmed) {
               try {
                    const payload = {
                         targetType: "Comment",
                         targetId: Number(commentId),
                         reason: reportPrompt.value.trim()
                    };
                    const response = await createReport(payload);
                    if (response?.ok) {
                         Swal.fire({
                              icon: 'success',
                              title: 'Đã gửi báo cáo',
                              text: response.message || 'Cảm ơn bạn, chúng tôi sẽ xem xét bình luận này.',
                              timer: 2500,
                              showConfirmButton: false
                         });
                    } else {
                         Swal.fire({
                              icon: 'error',
                              title: 'Không thể gửi báo cáo',
                              text: response?.reason || 'Vui lòng thử lại sau.',
                              confirmButtonText: 'Đã hiểu'
                         });
                    }
               } catch (error) {
                    console.error('Failed to create report:', error);
                    Swal.fire({
                         icon: 'error',
                         title: 'Có lỗi xảy ra',
                         text: error.message || 'Không thể gửi báo cáo lúc này.',
                         confirmButtonText: 'Đã hiểu'
                    });
               }
          }
          setShowCommentMenu({});
     };

     if (!post) return null;

     return (
          <Modal
               isOpen={isOpen}
               onClose={onClose}
               className="max-w-2xl max-h-[95vh] overflow-y-auto bg-white rounded-2xl scrollbar-hide"
          >
               <div className="sticky top-0 bg-white z-10 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                    <h2 className="text-xl font-bold">Chi tiết bài viết</h2>
                    <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full p-2">
                         <X className="w-5 h-5" />
                    </Button>
               </div>

               <div className="px-3 py-2">
                    {/* Original Post */}
                    <div className="mb-3">
                         <div className="flex gap-3 mb-3">
                              <Avatar className="w-12 h-12">
                                   <AvatarImage src={post.author?.Avatar || post.author?.avatar} />
                                   <AvatarFallback className="bg-gray-200 text-gray-700">
                                        {(post.author?.FullName || post.author?.fullName || post.author?.name || "U").charAt(0).toUpperCase()}
                                   </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                   <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold">{post.author?.Username || post.author?.username || post.author?.name || "Người dùng"}</span>
                                        {post.author?.Verified && (
                                             <Badge variant="secondary" className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full">
                                                  ✓
                                             </Badge>
                                        )}
                                   </div>
                              </div>
                         </div>

                         {/* Post Title */}
                         {post.Title && (
                              <h3 className="text-xl font-semibold text-gray-900 mb-2">{post.Title}</h3>
                         )}

                         {/* Post Content */}
                         <p className="text-gray-900 whitespace-pre-wrap mb-3">{post.Content}</p>

                         {/* Media */}
                         {post.MediaURL && (
                              <div className="mb-3 rounded-xl overflow-hidden border border-gray-200">
                                   <img
                                        src={post.MediaURL}
                                        alt="Post content"
                                        className="w-full h-auto object-cover"
                                   />
                              </div>
                         )}

                         {/* Field Information */}
                         {(post.field || post.FieldID || fieldDetails) && (() => {
                              const fieldData = fieldDetails || post.field;
                              const fieldName = fieldData?.name || fieldData?.Name || fieldData?.fieldName || fieldData?.FieldName || post.field?.fieldName;
                              const complexName = fieldData?.complexName || fieldData?.ComplexName;
                              const fieldAddress = fieldData?.address || fieldData?.Address || fieldData?.location || fieldData?.Location;

                              if (!fieldName && !complexName && !fieldAddress) return null;

                              return (
                                   <div className="mb-3 p-3 bg-teal-50 border border-teal-200 rounded-xl">
                                        <div className="space-y-2">
                                             {/* Field Name */}
                                             {fieldName && (
                                                  <div className="flex items-center gap-2">
                                                       <List className="w-4 h-4 text-teal-500" />
                                                       <h4 className="font-semibold text-base text-teal-900">{fieldName}</h4>
                                                  </div>
                                             )}

                                             {/* Complex Name */}
                                             {complexName && (
                                                  <div className="flex items-center gap-2">
                                                       <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                       <p className="text-sm text-teal-600 ">{complexName}</p>
                                                  </div>
                                             )}

                                             {/* Address with Google Maps link */}
                                             {fieldAddress && (
                                                  <div className="flex items-center gap-2 flex-wrap">
                                                       <MapPin className="w-4 h-4 text-yellow-500" />
                                                       <p className="text-xs text-teal-600">{fieldAddress}</p>
                                                       <span className="text-[11px] flex items-center gap-1 text-gray-500 hover:underline font-semibold hover:text-blue-600 cursor-pointer" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${fieldAddress}`, '_blank')} ><ExternalLink className="w-4 h-4 text-blue-500" /> Xem trên Google Maps</span>
                                                  </div>
                                             )}
                                        </div>
                                   </div>
                              );
                         })()}

                         {/* Post Time */}
                         <div className="text-gray-500 text-sm mb-3">
                              {formatTimeAgo(post.CreatedAt)}
                         </div>

                         {/* Stats */}
                         <div className="flex items-center gap-4 py-2 border-b border-gray-200 text-sm">
                              <span><strong>{post.likes || 0}</strong> <span className="text-gray-500">Lượt thích</span></span>
                              <span><strong>{post.comments || 0}</strong> <span className="text-gray-500">Bình luận</span></span>
                              <span><strong>{post.reposts || 0}</strong> <span className="text-gray-500">Chia sẻ</span></span>
                         </div>

                         {/* Action Buttons */}
                         <div className="flex items-center justify-around py-1 border-b border-gray-200">
                              <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={() => {
                                        if (!requireLogin("thích bài viết")) return;
                                        onLike?.(post.PostID);
                                   }}
                                   className={`flex items-center hover:text-red-500 rounded-2xl hover:bg-pink-50 gap-2 ${post.isLiked ? 'text-red-500' : 'text-gray-500'}`}
                              >
                                   <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                                   <span>Thích</span>
                              </Button>
                              <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={() => {
                                        // Nếu chưa đăng nhập, yêu cầu đăng nhập khi bấm "Bình luận"
                                        if (!requireLogin("bình luận bài viết")) return;
                                   }}
                                   className="flex items-center hover:text-blue-500 rounded-2xl hover:bg-blue-50 gap-2 text-gray-500"
                              >
                                   <MessageCircle className="w-5 h-5" />
                                   <span>Bình luận</span>
                              </Button>
                              <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={() => {
                                        if (!requireLogin("chia sẻ bài viết")) return;
                                        onRepost?.(post.PostID);
                                   }}
                                   className={`flex items-center hover:text-yellow-500 rounded-2xl hover:bg-yellow-50 gap-2 ${post.isReposted ? 'text-green-500' : 'text-gray-500'}`}
                              >
                                   <Share className="w-5 h-5" />
                                   <span>Chia sẻ</span>
                              </Button>
                              <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={() => {
                                        if (!requireLogin("lưu bài viết")) return;
                                        onBookmark?.(post.PostID);
                                   }}
                                   className={`flex items-center gap-2 ${post.isBookmarked ? 'text-yellow-500' : 'text-gray-500'}`}
                              >
                                   <Bookmark className={`w-5 h-5 ${post.isBookmarked ? 'fill-current' : ''}`} />
                              </Button>
                         </div>
                    </div>

                    {/* Comment Input */}
                    {user && (
                         <div className="mb-2">
                              <div className="flex gap-2">
                                   <Avatar className="w-10 h-10">
                                        <AvatarImage src={currentUserAvatar} />
                                        <AvatarFallback className="bg-gray-200 text-gray-700">
                                             {currentUserInitial}
                                        </AvatarFallback>
                                   </Avatar>
                                   <div className="flex-1">
                                        <Textarea
                                             ref={commentInputRef}
                                             placeholder="Viết bình luận..."
                                             value={commentContent}
                                             maxLength={2000}
                                             onChange={(e) => {
                                                  setCommentContent(e.target.value);
                                                  autoResize(e.target, 200);
                                             }}
                                             className={`min-h-[70px] resize-none border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 overflow-hidden ${commentContent.length > 2000 ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        <div className="flex justify-between items-center mt-2">
                                             <span className={`text-xs ${commentContent.length > 2000 ? 'text-red-500' : 'text-gray-400'}`}>
                                                  {commentContent.length}/2000
                                             </span>
                                             <Button
                                                  onClick={handleCommentSubmit}
                                                  disabled={!commentContent.trim() || commentContent.length > 2000}
                                                  className={`px-6 rounded-full ${commentContent.trim() && commentContent.length <= 2000
                                                       ? "bg-blue-500 hover:bg-blue-600 text-white"
                                                       : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                       }`}
                                             >
                                                  Đăng
                                             </Button>
                                        </div>
                                   </div>
                              </div>
                         </div>
                    )}

                    {/* Comments List */}
                    <div className="space-y-2">
                         <h3 className="font-semibold text-lg">Bình luận ({comments.length})</h3>

                         {loading ? (
                              <div className="text-center py-8 text-gray-500">
                                   Đang tải bình luận...
                              </div>
                         ) : comments.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                   Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
                              </div>
                         ) : (
                              comments
                                   .filter(comment => !comment.parentCommentId) // Only show parent comments
                                   .map((comment, index, array) => {
                                        const commentId = comment.id || comment.commentId;
                                        const isEditing = editingCommentId === commentId;
                                        const isOwn = isOwnComment(comment);
                                        const replies = comments.filter(c => c.parentCommentId === commentId);
                                        const isLastComment = index === array.length - 1;

                                        return (
                                             <div
                                                  key={commentId}
                                                  className={`pb-4 mb-4 ${!isLastComment ? 'border-b border-gray-300' : ''}`}
                                             >
                                                  <motion.div
                                                       initial={{ opacity: 0, y: 10 }}
                                                       animate={{ opacity: 1, y: 0 }}
                                                       className="flex gap-2"
                                                  >
                                                       <Avatar className="w-10 h-10">
                                                            <AvatarImage src={comment.author?.avatar} />
                                                            <AvatarFallback className="bg-gray-200 text-gray-700">
                                                                 {(comment.author?.name ||
                                                                      comment.author?.fullName ||
                                                                      comment.author?.FullName ||
                                                                      comment.userName ||
                                                                      comment.fullName ||
                                                                      comment.FullName ||
                                                                      "U").charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                       </Avatar>
                                                       <div className="flex-1">
                                                            <div className="flex items-center gap-1 ">
                                                                 <span className="font-semibold text-sm">
                                                                      {comment.author?.name ||
                                                                           comment.author?.fullName ||
                                                                           comment.author?.FullName ||
                                                                           comment.author?.username ||
                                                                           comment.author?.Username ||
                                                                           comment.userName ||
                                                                           comment.fullName ||
                                                                           comment.FullName ||
                                                                           "Người dùng"}
                                                                 </span>

                                                                 {isOwn && (
                                                                      <Badge variant="secondary" className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                                                                           của bạn
                                                                      </Badge>
                                                                 )}
                                                                 {comment.author?.verified && (
                                                                      <Badge variant="secondary" className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full">
                                                                           ✓
                                                                      </Badge>
                                                                 )}
                                                                 <span className="text-gray-500 text-xs">•</span>
                                                                 <span className="text-gray-500 text-xs">{formatTimeAgo(comment.createdAt)}</span>
                                                            </div>

                                                            {isEditing ? (
                                                                 <div className="mt-2">
                                                                      <Textarea
                                                                           value={editingCommentContent}
                                                                           onChange={(e) => setEditingCommentContent(e.target.value)}
                                                                           className="min-h-[60px] text-sm"
                                                                      />
                                                                      <div className="flex gap-2 justify-end mt-2">
                                                                           <Button
                                                                                size="sm"
                                                                                onClick={() => handleUpdateComment(commentId)}
                                                                                className="bg-blue-500 rounded-2xl hover:bg-blue-600 text-white"
                                                                           >
                                                                                Lưu
                                                                           </Button>
                                                                           <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                onClick={() => {
                                                                                     setEditingCommentId(null);
                                                                                     setEditingCommentContent("");
                                                                                }}
                                                                                className="rounded-2xl"
                                                                           >
                                                                                Hủy
                                                                           </Button>
                                                                      </div>
                                                                 </div>
                                                            ) : (
                                                                 <p className="text-gray-900 text-sm">{comment.content}</p>
                                                            )}

                                                            {/* Comment Actions */}
                                                            {!isEditing && (
                                                                 <div className="flex items-center gap-4 mt-2">

                                                                      <button
                                                                           onClick={() => handleReplyToComment(commentId)}
                                                                           className="text-gray-500 hover:text-blue-500 text-xs font-medium"
                                                                      >
                                                                           Trả lời
                                                                      </button>
                                                                 </div>
                                                            )}

                                                            {/* Reply Input */}
                                                            {replyingToCommentId === commentId && user && (
                                                                 <div className="mt-3 ml-8 flex gap-2">
                                                                      <Avatar className="w-8 h-8">
                                                                           <AvatarImage src={currentUserAvatar} />
                                                                           <AvatarFallback className="bg-gray-200 text-gray-700">
                                                                                {currentUserInitial}
                                                                           </AvatarFallback>
                                                                      </Avatar>
                                                                      <div className="flex-1">
                                                                           <Textarea
                                                                                placeholder={`Trả lời ${comment.userName || "comment"}...`}
                                                                                value={replyContent[commentId] || ""}
                                                                                maxLength={2000}
                                                                                onChange={(e) => {
                                                                                     handleReplyChange(commentId, e.target.value);
                                                                                     autoResize(e.target, 150);
                                                                                }}
                                                                                className={`min-h-[60px] text-sm border rounded-lg resize-none overflow-hidden ${(replyContent[commentId]?.length || 0) > 2000 ? 'border-red-500' : 'border-gray-300'}`}
                                                                           />
                                                                           <div className="flex justify-between items-center mt-2">
                                                                                <span className={`text-xs ${(replyContent[commentId]?.length || 0) > 2000 ? 'text-red-500' : 'text-gray-400'}`}>
                                                                                     {replyContent[commentId]?.length || 0}/2000
                                                                                </span>
                                                                                <div className="flex gap-2">
                                                                                     <Button
                                                                                          size="sm"
                                                                                          onClick={() => handleReplySubmit(commentId)}
                                                                                          disabled={!replyContent[commentId]?.trim() || (replyContent[commentId]?.length || 0) > 2000}
                                                                                          className={`rounded-full ${replyContent[commentId]?.trim() && (replyContent[commentId]?.length || 0) <= 2000
                                                                                               ? "bg-blue-500 hover:bg-blue-600 text-white"
                                                                                               : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                                                               }`}
                                                                                     >
                                                                                          Trả lời
                                                                                     </Button>
                                                                                     <Button
                                                                                          size="sm"
                                                                                          variant="ghost"
                                                                                          onClick={() => {
                                                                                               setReplyingToCommentId(null);
                                                                                               setReplyContent(prev => ({
                                                                                                    ...prev,
                                                                                                    [commentId]: ""
                                                                                               }));
                                                                                          }}
                                                                                          className="rounded-full"
                                                                                     >
                                                                                          Hủy
                                                                                     </Button>
                                                                                </div>
                                                                           </div>
                                                                      </div>
                                                                 </div>
                                                            )}
                                                       </div>

                                                       {/* Comment Menu */}
                                                       {!isEditing && (
                                                            <div className="relative">
                                                                 <Button
                                                                      variant="ghost"
                                                                      size="sm"
                                                                      onClick={() => toggleCommentMenu(commentId)}
                                                                      className="p-1 h-8 w-8 rounded-full hover:bg-gray-100"
                                                                 >
                                                                      <MoreHorizontal className="w-4 h-4 text-gray-500" />
                                                                 </Button>

                                                                 {showCommentMenu[commentId] && (
                                                                      <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
                                                                           {/* Menu for own comments */}
                                                                           {isOwn && (
                                                                                <>
                                                                                     <button
                                                                                          onClick={() => {
                                                                                               handleEditComment(comment);
                                                                                          }}
                                                                                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                                                                                     >
                                                                                          <Edit className="w-4 h-4" />
                                                                                          Sửa
                                                                                     </button>
                                                                                     <button
                                                                                          onClick={() => {
                                                                                               handleDeleteComment(commentId);
                                                                                               setShowCommentMenu({});
                                                                                          }}
                                                                                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
                                                                                     >
                                                                                          <Trash2 className="w-4 h-4" />
                                                                                          Xóa
                                                                                     </button>
                                                                                </>
                                                                           )}
                                                                           {/* Menu for others' comments */}
                                                                           {!isOwn && (
                                                                                <button
                                                                                     onClick={() => {
                                                                                          handleReportComment(commentId);
                                                                                     }}
                                                                                     className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                                                                                >
                                                                                     <Flag className="w-4 h-4" />
                                                                                     Báo cáo
                                                                                </button>
                                                                           )}
                                                                      </div>
                                                                 )}
                                                            </div>
                                                       )}
                                                  </motion.div>

                                                  {/* Replies */}
                                                  {replies.length > 0 && (
                                                       <div className="ml-12 mt-3 space-y-3">
                                                            {replies.map((reply, replyIndex, replyArray) => {
                                                                 const replyId = reply.id || reply.commentId;
                                                                 const isReplyEditing = editingCommentId === replyId;
                                                                 const isReplyOwn = isOwnComment(reply);
                                                                 const isLastReply = replyIndex === replyArray.length - 1;

                                                                 return (
                                                                      <div
                                                                           key={replyId}
                                                                           className={`flex gap-2 relative pb-3 ${!isLastReply ? 'border-b border-gray-200' : ''}`}
                                                                      >
                                                                           {/* Vertical line */}
                                                                           <div className="absolute left-[-24px] top-0 bottom-0 w-[2px] bg-gray-200"></div>
                                                                           <Avatar className="w-8 h-8">
                                                                                <AvatarImage src={reply.author?.avatar} />
                                                                                <AvatarFallback className="bg-gray-200 text-gray-700">
                                                                                     {(reply.author?.name ||
                                                                                          reply.author?.fullName ||
                                                                                          reply.author?.FullName ||
                                                                                          reply.userName ||
                                                                                          reply.fullName ||
                                                                                          "U").charAt(0).toUpperCase()}
                                                                                </AvatarFallback>
                                                                           </Avatar>
                                                                           <div className="flex-1">
                                                                                <div className="flex items-center gap-1 mb-1">
                                                                                     <span className="font-semibold text-sm">
                                                                                          {reply.author?.name ||
                                                                                               reply.author?.fullName ||
                                                                                               reply.author?.FullName ||
                                                                                               reply.author?.username ||
                                                                                               reply.author?.Username ||
                                                                                               reply.userName ||
                                                                                               reply.fullName ||
                                                                                               reply.FullName ||
                                                                                               "Người dùng"}
                                                                                     </span>

                                                                                     {isReplyOwn && (
                                                                                          <Badge variant="secondary" className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                                                                                               của bạn
                                                                                          </Badge>
                                                                                     )}
                                                                                     <span className="text-gray-500 text-xs">•</span>
                                                                                     <span className="text-gray-500 text-xs">{formatTimeAgo(reply.createdAt)}</span>
                                                                                </div>

                                                                                {isReplyEditing ? (
                                                                                     <div className="mt-2">
                                                                                          <Textarea
                                                                                               value={editingCommentContent}
                                                                                               onChange={(e) => setEditingCommentContent(e.target.value)}
                                                                                               className="min-h-[60px] text-sm"
                                                                                          />
                                                                                          <div className="flex gap-2 justify-end mt-2">
                                                                                               <Button
                                                                                                    size="sm"
                                                                                                    onClick={() => handleUpdateComment(replyId)}
                                                                                                    className="bg-blue-500 rounded-2xl hover:bg-blue-600 text-white"
                                                                                               >
                                                                                                    Lưu
                                                                                               </Button>
                                                                                               <Button
                                                                                                    size="sm"
                                                                                                    variant="ghost"
                                                                                                    onClick={() => {
                                                                                                         setEditingCommentId(null);
                                                                                                         setEditingCommentContent("");
                                                                                                    }}
                                                                                                    className="rounded-2xl"
                                                                                               >
                                                                                                    Hủy
                                                                                               </Button>
                                                                                          </div>
                                                                                     </div>
                                                                                ) : (
                                                                                     <p className="text-gray-900 text-sm">{reply.content}</p>
                                                                                )}

                                                                           </div>

                                                                           {/* Reply Menu */}
                                                                           {!isReplyEditing && (
                                                                                <div className="relative">
                                                                                     <Button
                                                                                          variant="ghost"
                                                                                          size="sm"
                                                                                          onClick={() => toggleCommentMenu(replyId)}
                                                                                          className="p-1 h-8 w-8 rounded-full hover:bg-gray-100"
                                                                                     >
                                                                                          <MoreHorizontal className="w-4 h-4 text-gray-500" />
                                                                                     </Button>

                                                                                     {showCommentMenu[replyId] && (
                                                                                          <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
                                                                                               {/* Menu for own replies */}
                                                                                               {isReplyOwn && (
                                                                                                    <>
                                                                                                         <button
                                                                                                              onClick={() => {
                                                                                                                   handleEditComment(reply);
                                                                                                              }}
                                                                                                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                                                                                                         >
                                                                                                              <Edit className="w-4 h-4" />
                                                                                                              Sửa
                                                                                                         </button>
                                                                                                         <button
                                                                                                              onClick={() => {
                                                                                                                   handleDeleteComment(replyId);
                                                                                                                   setShowCommentMenu({});
                                                                                                              }}
                                                                                                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
                                                                                                         >
                                                                                                              <Trash2 className="w-4 h-4" />
                                                                                                              Xóa
                                                                                                         </button>
                                                                                                    </>
                                                                                               )}
                                                                                               {/* Menu for others' replies */}
                                                                                               {!isReplyOwn && (
                                                                                                    <button
                                                                                                         onClick={() => {
                                                                                                              handleReportComment(replyId);
                                                                                                         }}
                                                                                                         className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                                                                                                    >
                                                                                                         <Flag className="w-4 h-4" />
                                                                                                         Báo cáo
                                                                                                    </button>
                                                                                               )}
                                                                                          </div>
                                                                                     )}
                                                                                </div>
                                                                           )}
                                                                      </div>
                                                                 );
                                                            })}
                                                       </div>
                                                  )}
                                             </div>
                                        );
                                   })
                         )}
                    </div>
               </div>
          </Modal >
     );
};

export default PostDetailModal;
