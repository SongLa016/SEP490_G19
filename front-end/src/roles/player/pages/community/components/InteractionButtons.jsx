import { motion } from "framer-motion";
import { Heart, MessageCircle, Share, Bookmark } from "lucide-react";
import { Button } from "../../../../../shared/components/ui";
import { Link } from "react-router-dom";
import Swal from 'sweetalert2';

/**
 * Component hiển thị các nút tương tác với bài viết
 * Trang: Cộng đồng (Community)
 * Vị trí: Phần dưới của mỗi PostCard
 * 
 * Chức năng:
 * - Nút Like (thích bài viết)
 * - Nút Comment (bình luận)
 * - Nút Share (chia sẻ)
 * - Nút Bookmark (lưu bài viết)
 */
const InteractionButtons = ({
     post,              // Dữ liệu bài viết
     user,              // Thông tin người dùng hiện tại
     onLike,            // Xử lý khi nhấn nút Like
     onComment,         // Xử lý khi nhấn nút Comment
     onRepost,          // Xử lý khi nhấn nút Share
     onBookmark         // Xử lý khi nhấn nút Bookmark
}) => {
     /**
      * Xử lý tương tác với bài viết
      * Yêu cầu đăng nhập nếu chưa đăng nhập
      * @param {string} action - Loại action (like, comment, share)
      * @param {Function} callback - Hàm callback khi đã đăng nhập
      */
     const handleInteraction = (action, callback) => {
          if (!user) {
               Swal.fire({
                    icon: 'info',
                    title: 'Yêu cầu đăng nhập',
                    text: 'Vui lòng đăng nhập để ' + (action === 'like' ? 'thích' : action === 'comment' ? 'bình luận' : 'chia sẻ') + ' bài viết.',
                    showCancelButton: true,
                    confirmButtonText: 'Đăng nhập',
                    cancelButtonText: 'Hủy',
                    confirmButtonColor: '#14b8a6',
                    cancelButtonColor: '#6b7280'
               }).then((result) => {
                    if (result.isConfirmed) {
                         window.location.href = '/login';
                    }
               });
               return;
          }
          callback?.();
     };

     return (
          <div className="flex items-center gap-2">
               <motion.div
                    whileHover={{ scale: user ? 1.1 : 1 }}
                    whileTap={{ scale: user ? 0.9 : 1 }}
               >
                    <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => handleInteraction('like', onLike)}
                         disabled={!user}
                         className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${user
                                   ? `${post.isLiked ? 'text-red-500 hover:text-red-600 hover:bg-red-50' : 'text-gray-500 hover:text-red-500 hover:bg-red-50'}`
                                   : 'text-gray-400 cursor-not-allowed opacity-60'
                              }`}
                    >
                         <motion.div
                              animate={post.isLiked && user ? { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] } : {}}
                              transition={{ duration: 0.4 }}
                         >
                              <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                         </motion.div>
                         <span className="text-sm font-medium">{post.likes || 0}</span>
                    </Button>
               </motion.div>
               <motion.div
                    whileHover={{ scale: user ? 1.1 : 1 }}
                    whileTap={{ scale: user ? 0.9 : 1 }}
               >
                    <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => handleInteraction('comment', onComment)}
                         disabled={!user}
                         className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${user
                                   ? 'text-gray-500 hover:text-blue-500 hover:bg-blue-50'
                                   : 'text-gray-400 cursor-not-allowed opacity-60'
                              }`}
                    >
                         <MessageCircle className="w-5 h-5" />
                         <span className="text-sm font-medium">{typeof post.comments === 'number' ? post.comments : 0}</span>
                    </Button>
               </motion.div>

               <motion.div
                    whileHover={{ scale: user ? 1.1 : 1 }}
                    whileTap={{ scale: user ? 0.9 : 1 }}
               >
                    <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => handleInteraction('share', onRepost)}
                         disabled={!user}
                         className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${user
                                   ? 'text-gray-500 hover:text-blue-500 hover:bg-blue-50'
                                   : 'text-gray-400 cursor-not-allowed opacity-60'
                              }`}
                    >
                         <Share className="w-5 h-5" />
                         <span className="text-sm font-medium">{post.shares || 0}</span>
                    </Button>
               </motion.div>
               {user && (
                    <motion.div
                         whileHover={{ scale: 1.1 }}
                         whileTap={{ scale: 0.9 }}
                    >
                         <Button
                              variant="ghost"
                              size="sm"
                              onClick={onBookmark}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors hover:bg-yellow-50 ${post.isBookmarked ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'}`}
                         >
                              <Bookmark className={`w-5 h-5 ${post.isBookmarked ? 'fill-current' : ''}`} />
                         </Button>
                    </motion.div>
               )}
          </div>
     );
};

export default InteractionButtons;
