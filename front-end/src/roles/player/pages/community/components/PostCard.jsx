import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Plus } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback, Badge, Button } from "../../../../../shared/components/ui";
import FieldInfoCard from "./FieldInfoCard";
import InteractionButtons from "./InteractionButtons";
import CommentInput from "./CommentInput";
import PostMenu from "./PostMenu";
import { isCurrentUserPost } from "./utils";

/**
 * Component hiển thị một bài viết trong feed cộng đồng
 * Trang: Cộng đồng (Community)
 * Vị trí: Danh sách bài viết trong tab "Dành cho bạn"
 * 
 * Chức năng:
 * - Hiển thị thông tin tác giả (avatar, tên, thời gian)
 * - Hiển thị tiêu đề và nội dung bài viết
 * - Hiển thị ảnh đính kèm (nếu có)
 * - Hiển thị thông tin sân được gắn thẻ (nếu có)
 * - Các nút tương tác (Like, Comment, Repost, Bookmark)
 * - Menu tùy chọn (Sửa, Xóa, Báo cáo)
 */
const PostCard = ({
     post,
     index,
     user,
     toggleLike,
     toggleRepost,
     toggleBookmark,
     toggleCommentInput,
     showCommentInput,
     commentContent,
     handleCommentChange,
     handleCommentSubmit,
     handleOpenReply,
     handleOpenPostDetail,
     formatTimeAgo,
     togglePostMenu,
     showPostMenu,
     handleMenuAction
}) => {
     const cardRef = useRef(null);
     const isInView = useInView(cardRef, { once: true, margin: "-50px" });

     // Check if this post belongs to current user
     const isOwnPost = isCurrentUserPost(post, user);

     // Handle click on post content to open detail modal
     const handleContentClick = (e) => {
          // Don't open modal if clicking on buttons or interactive elements
          if (e.target.closest('button') || e.target.closest('a')) {
               return;
          }
          handleOpenPostDetail?.(post);
     };

     return (
          <motion.div
               ref={cardRef}
               initial={{ opacity: 0, y: 30, scale: 0.95 }}
               animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
               transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                    ease: "easeOut"
               }}
               whileHover={{
                    scale: 1.01,
                    boxShadow: "0 10px 25px rgba(0,0,0,0.05)"
               }}
               className="p-5 bg-white hover:bg-gray-50/50 transition-all duration-200 border-b border-gray-100 last:border-b-0"
          >
               <div className="flex gap-3">
                    {/* Avatar với Animation */}
                    <motion.div
                         whileHover={{ scale: 1.1, rotate: 5 }}
                         transition={{ duration: 0.2 }}
                    >
                         <Avatar className="w-10 h-10">
                              <AvatarImage src={post.author?.Avatar || post.author?.avatar} />
                              <AvatarFallback className="bg-gray-200 text-gray-700">
                                   {(post.author?.FullName || post.author?.fullName || post.author?.name || "U").charAt(0).toUpperCase()}
                              </AvatarFallback>
                         </Avatar>
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                         {/* User Info */}
                         <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-gray-900 text-base">{post.author?.Username || post.author?.username || post.author?.name || "Người dùng"}</span>
                              {post.author?.Verified && (
                                   <Badge variant="secondary" className="text-xs hover:bg-blue-600 hover:text-white bg-blue-500 text-white px-1.5 py-0.5 rounded-full">
                                        ✓
                                   </Badge>
                              )}
                              {isOwnPost && (
                                   <Badge variant="secondary" className="text-xs hover:bg-green-600 hover:text-white bg-green-500 text-white px-2 py-0.5 rounded-full">
                                        của bạn
                                   </Badge>
                              )}
                              <span className="text-gray-500 text-sm">•</span>
                              <span className="text-gray-500 text-sm">{formatTimeAgo(post.CreatedAt)}</span>
                         </div>

                         {/* Post Title - Clickable */}
                         {post.Title && (
                              <h3
                                   className="text-lg font-bold text-gray-900 mb-2 cursor-pointer hover:text-teal-600 transition-colors"
                                   onClick={handleContentClick}
                              >
                                   {post.Title}
                              </h3>
                         )}

                         {/* Post Content - Clickable */}
                         <div className="mb-3 cursor-pointer" onClick={handleContentClick}>
                              <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{post.Content}</p>
                         </div>

                         {/* Media - Clickable */}
                         {post.MediaURL && (
                              <div
                                   className="mb-3 rounded-xl overflow-hidden border border-gray-200 cursor-pointer hover:opacity-95 transition-opacity"
                                   onClick={handleContentClick}
                              >
                                   <img
                                        src={post.MediaURL}
                                        alt="Post content"
                                        className="w-full h-auto object-cover"
                                   />
                              </div>
                         )}
                         {/* Field Information */}
                         <FieldInfoCard field={post.field} fieldId={post.FieldID} />
                         {/* Interaction Buttons */}
                         <div className="mt-3 pt-3 border-t border-gray-100">
                              <InteractionButtons
                                   post={post}
                                   user={user}
                                   onLike={() => toggleLike(post.PostID)}
                                   onComment={() => toggleCommentInput(post.PostID)}
                                   onRepost={() => toggleRepost(post.PostID)}
                                   onBookmark={() => toggleBookmark(post.PostID)}
                              />
                         </div>

                         {/* Comment Input Section */}
                         {user && showCommentInput[post.PostID] && (
                              <CommentInput
                                   post={post}
                                   user={user}
                                   commentContent={commentContent[post.PostID]}
                                   onCommentChange={(value) => handleCommentChange(post.PostID, value)}
                                   onCommentSubmit={() => handleCommentSubmit(post.PostID)}
                                   onOpenReply={handleOpenReply}
                              />
                         )}
                    </div>

                    {/* More Options */}
                    {user && (
                         <PostMenu
                              post={post}
                              isOwnPost={isOwnPost}
                              showMenu={showPostMenu[post.PostID]}
                              onToggleMenu={() => togglePostMenu(post.PostID)}
                              onMenuAction={(action) => handleMenuAction(post.PostID, action)}
                         />
                    )}
               </div>
          </motion.div>
     );
};

export default PostCard;

