import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Heart, MessageCircle, Bookmark, MoreHorizontal, Trash2, Edit, MapPin, Building2, Share, List, ExternalLink } from "lucide-react";
import { Modal, Button, Avatar, AvatarImage, AvatarFallback, Badge, Textarea } from '../../../../../shared/components/ui';
import { fetchCommentsByPost, deleteComment, updateComment } from '../../../../../shared/services/comments';
import { fetchFields } from '../../../../../shared/index';
import { formatTimeAgo } from './utils/formatTime';
import Swal from 'sweetalert2';

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

     useEffect(() => {
          if (isOpen && post) {
               loadComments();
               loadFieldDetails();
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [isOpen, post]);

     const loadFieldDetails = async () => {
          if (!post?.fieldId && !post?.FieldID) return;

          const fieldId = post.fieldId || post.FieldID;
          try {
               // Fetch all fields using the same service as FieldSelectionModal
               const allFields = await fetchFields();
               console.log('[PostDetailModal] All fields loaded, searching for fieldId:', fieldId);

               // Find the specific field by ID
               const field = allFields.find(f =>
                    f.fieldId === fieldId ||
                    f.id === fieldId ||
                    f.Id === fieldId ||
                    f.FieldId === fieldId
               );

               if (field) {
                    console.log('[PostDetailModal] Found field:', field);
                    setFieldDetails(field);
               } else {
                    console.warn('[PostDetailModal] Field not found with ID:', fieldId);
               }
          } catch (error) {
               console.error('[PostDetailModal] Error loading field details:', error);
          }
     };

     const loadComments = async () => {
          if (!post?.PostID) return;

          setLoading(true);
          try {
               const fetchedComments = await fetchCommentsByPost(post.PostID);
               console.log('[PostDetailModal] Fetched comments:', fetchedComments);

               // Fetch user info for each comment if author info is missing
               const commentsWithUserInfo = await Promise.all(
                    fetchedComments.map(async (comment) => {
                         // Check if author info is missing or empty (empty string counts as missing)
                         const hasAuthorInfo = comment.author?.name && comment.author.name.trim() !== '' &&
                              comment.author?.username && comment.author.username.trim() !== '';

                         console.log('[PostDetailModal] Comment', comment.id, 'hasAuthorInfo:', hasAuthorInfo, 'author:', comment.author);

                         if (!hasAuthorInfo && comment.userId) {
                              try {
                                   console.log('[PostDetailModal] Fetching user data for userId:', comment.userId);
                                   const userResponse = await fetch(`https://sep490-g19-zxph.onrender.com/api/User/${comment.userId}`);
                                   if (userResponse.ok) {
                                        const userData = await userResponse.json();
                                        console.log('[PostDetailModal] Fetched user data for userId', comment.userId, ':', userData);
                                        return {
                                             ...comment,
                                             userName: userData.userName || userData.username || userData.Username || userData.fullName || userData.FullName,
                                             author: {
                                                  ...comment.author,
                                                  id: userData.id || userData.userId || userData.UserID,
                                                  username: userData.userName || userData.username || userData.Username,
                                                  name: userData.fullName || userData.FullName || userData.userName || userData.username,
                                                  avatar: userData.avatar || userData.Avatar,
                                                  verified: userData.verified || userData.Verified || false
                                             }
                                        };
                                   }
                              } catch (error) {
                                   console.error('[PostDetailModal] Error fetching user data:', error);
                              }
                         }
                         return comment;
                    })
               );

               console.log('[PostDetailModal] Comments with user info:', commentsWithUserInfo);
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

     const handleCommentSubmit = async () => {
          if (!commentContent.trim()) return;

          const success = await onCommentSubmit?.(post.PostID, commentContent);
          if (success) {
               setCommentContent("");
               loadComments(); // Reload comments after successful submission
          }
     };

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

     const handleEditComment = (comment) => {
          setEditingCommentId(comment.id || comment.commentId);
          setEditingCommentContent(comment.content);
          setShowCommentMenu({});
     };

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

     const toggleCommentMenu = (commentId) => {
          setShowCommentMenu(prev => ({
               ...prev,
               [commentId]: !prev[commentId]
          }));
     };

     const isOwnComment = (comment) => {
          const currentUserId = user?.userID || user?.userId || user?.UserID || user?.id;
          const commentUserId = comment?.userId;
          return currentUserId && commentUserId && String(currentUserId) === String(commentUserId);
     };

     const handleReplyToComment = (commentId) => {
          setReplyingToCommentId(commentId);
          setShowCommentMenu({});
     };

     const handleReplySubmit = async (commentId) => {
          const content = replyContent[commentId];
          if (!content || !content.trim()) return;

          try {
               // Call API to create reply with parentCommentId
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

     const handleReplyChange = (commentId, content) => {
          setReplyContent(prev => ({
               ...prev,
               [commentId]: content
          }));
     };

     if (!post) return null;

     return (
          <Modal
               isOpen={isOpen}
               onClose={onClose}
               className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl"
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
                                   onClick={() => onLike?.(post.PostID)}
                                   className={`flex items-center hover:text-red-500 rounded-2xl hover:bg-pink-50 gap-2 ${post.isLiked ? 'text-red-500' : 'text-gray-500'}`}
                              >
                                   <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                                   <span>Thích</span>
                              </Button>
                              <Button
                                   variant="ghost"
                                   size="sm"
                                   className="flex items-center hover:text-blue-500 rounded-2xl hover:bg-blue-50 gap-2 text-gray-500"
                              >
                                   <MessageCircle className="w-5 h-5" />
                                   <span>Bình luận</span>
                              </Button>
                              <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={() => onRepost?.(post.PostID)}
                                   className={`flex items-center hover:text-yellow-500 rounded-2xl hover:bg-yellow-50 gap-2 ${post.isReposted ? 'text-green-500' : 'text-gray-500'}`}
                              >
                                   <Share className="w-5 h-5" />
                                   <span>Chia sẻ</span>
                              </Button>
                              {user && (
                                   <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onBookmark?.(post.PostID)}
                                        className={`flex items-center gap-2 ${post.isBookmarked ? 'text-yellow-500' : 'text-gray-500'}`}
                                   >
                                        <Bookmark className={`w-5 h-5 ${post.isBookmarked ? 'fill-current' : ''}`} />
                                   </Button>
                              )}
                         </div>
                    </div>

                    {/* Comment Input */}
                    {user && (
                         <div className="mb-2">
                              <div className="flex gap-2">
                                   <Avatar className="w-10 h-10">
                                        <AvatarImage src={user?.avatar} />
                                        <AvatarFallback className="bg-gray-200 text-gray-700">
                                             {user?.name?.charAt(0) || "U"}
                                        </AvatarFallback>
                                   </Avatar>
                                   <div className="flex-1">
                                        <Textarea
                                             placeholder="Viết bình luận..."
                                             value={commentContent}
                                             onChange={(e) => setCommentContent(e.target.value)}
                                             className="min-h-[70px] resize-none border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                                        />
                                        <div className="flex justify-end mt-2">
                                             <Button
                                                  onClick={handleCommentSubmit}
                                                  disabled={!commentContent.trim()}
                                                  className={`px-6 rounded-full ${commentContent.trim()
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
                                                                 {(comment.userName || comment.fullName || comment.author?.name || "U").charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                       </Avatar>
                                                       <div className="flex-1">
                                                            <div className="flex items-center gap-1 ">
                                                                 <span className="font-semibold text-sm">
                                                                      {comment.userName || comment.fullName || comment.author?.username || comment.author?.name || "Người dùng"}
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
                                                                           <AvatarImage src={user?.avatar} />
                                                                           <AvatarFallback className="bg-gray-200 text-gray-700">
                                                                                {(user?.name || "U").charAt(0).toUpperCase()}
                                                                           </AvatarFallback>
                                                                      </Avatar>
                                                                      <div className="flex-1">
                                                                           <Textarea
                                                                                placeholder={`Trả lời ${comment.userName || "comment"}...`}
                                                                                value={replyContent[commentId] || ""}
                                                                                onChange={(e) => handleReplyChange(commentId, e.target.value)}
                                                                                className="min-h-[60px] text-sm border border-gray-300 rounded-lg"
                                                                           />
                                                                           <div className="flex gap-2 justify-end mt-2">
                                                                                <Button
                                                                                     size="sm"
                                                                                     onClick={() => handleReplySubmit(commentId)}
                                                                                     disabled={!replyContent[commentId]?.trim()}
                                                                                     className={`rounded-full ${replyContent[commentId]?.trim()
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
                                                            )}
                                                       </div>

                                                       {/* Comment Menu for own comments */}
                                                       {isOwn && !isEditing && (
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
                                                                                     {(reply.userName || reply.author?.name || "U").charAt(0).toUpperCase()}
                                                                                </AvatarFallback>
                                                                           </Avatar>
                                                                           <div className="flex-1">
                                                                                <div className="flex items-center gap-1 mb-1">
                                                                                     <span className="font-semibold text-sm">
                                                                                          {reply.userName || reply.author?.username || reply.author?.name || reply.fullName || "Người dùng"}
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
                                                                           {isReplyOwn && !isReplyEditing && (
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
