import { motion } from 'framer-motion';
import { Modal, Button, Avatar, AvatarImage, AvatarFallback, Badge, Textarea } from '../../../../../shared/components/ui';

const ReplyModal = ({
     isOpen,
     onClose,
     user,
     originalPost,
     replyContent,
     setReplyContent,
     onSubmit
}) => {
     const handleSubmit = () => {
          if (replyContent.trim()) {
               onSubmit?.(replyContent);
               setReplyContent("");
               onClose();
          }
     };

     // Check if the original post belongs to current user
     // Get current user ID from various possible fields
     const currentUserId = user?.userID || user?.userId || user?.UserID || user?.id;
     // Get post author ID from various possible fields
     const postAuthorId = originalPost?.userId || originalPost?.authorId || originalPost?.postUserId;

     // Compare as strings to handle type differences (string vs number)
     const isOwnPost = originalPost && user && currentUserId && postAuthorId &&
          String(currentUserId) === String(postAuthorId);

     // Get username - check all possible fields
     console.log('[ReplyModal] User object for username:', user);
     const displayUsername = user?.userName || user?.username || user?.Username || user?.name || user?.fullName || user?.FullName || "User";
     console.log('[ReplyModal] Display username:', displayUsername);

     return (
          <Modal
               isOpen={isOpen}
               onClose={onClose}
               title="Trả lời bài viết"
               className="max-w-2xl px-2 bg-white rounded-2xl"
          >
               <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
               >
                    {/* Original Post */}
                    {originalPost && (
                         <div className="p-2">
                              <div className="flex gap-3">
                                   <Avatar className="w-8 h-8">
                                        <AvatarImage src={originalPost.avatar} />
                                        <AvatarFallback className="bg-gray-200 text-gray-700">
                                             {originalPost.author?.charAt(0) || "U"}
                                        </AvatarFallback>
                                   </Avatar>
                                   <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                             <span className="font-semibold text-sm">{originalPost.author}</span>
                                             {originalPost.verified && (
                                                  <Badge variant="secondary" className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full">
                                                       ✓
                                                  </Badge>
                                             )}
                                             {isOwnPost && (
                                                  <Badge variant="secondary" className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                                                       của bạn
                                                  </Badge>
                                             )}
                                             <span className="text-xs text-gray-500">•</span>
                                             <span className="text-xs text-gray-500">{originalPost.timeAgo}</span>
                                        </div>
                                        <p className="text-sm text-gray-800">{originalPost.content}</p>
                                   </div>
                              </div>
                         </div>
                    )}

                    {/* Reply Input Section */}
                    <div className="mx-5">
                         <div className="flex gap-2">

                              <div className="items-center ">
                                   <Avatar className="w-10 h-10">
                                        <AvatarImage src={user?.avatar} />
                                        <AvatarFallback className="bg-gray-200 text-gray-700">
                                             {user?.name?.charAt(0) || "U"}
                                        </AvatarFallback>
                                   </Avatar>
                                   <div className="flex pt-1 justify-center">
                                        <div className="w-px h-10 bg-gray-300"></div>
                                   </div>
                              </div>

                              <div className="flex-1">
                                   <div className="text-sm text-gray-500 mb-2">
                                        <span className="font-semibold">
                                             {displayUsername}
                                        </span>
                                        <span className="mx-1">&gt;</span>
                                        <span>Thêm bình luận</span>
                                   </div>
                                   <Textarea
                                        placeholder={`Trả lời ${originalPost?.author || 'post'}...`}
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        className="min-h-[50px] resize-none  border border-gray-300 focus:ring-0 text-lg placeholder:text-gray-500"
                                   />
                              </div>
                         </div>


                         <div className="flex justify-between items-center pb-2">
                              <div className="text-sm text-gray-500">
                                   Bất kỳ ai cũng có thể trả lời và trích dẫn
                              </div>
                              <div className="flex justify-end pt-4">
                                   <Button
                                        className={`px-6 rounded-xl ${replyContent.trim()
                                             ? "bg-teal-500 hover:bg-teal-600 text-white"
                                             : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                             }`}
                                        onClick={handleSubmit}
                                        disabled={!replyContent.trim()}
                                   >
                                        Đăng
                                   </Button>
                              </div>
                         </div>
                    </div>
               </motion.div>
          </Modal>
     );
};

export default ReplyModal;
