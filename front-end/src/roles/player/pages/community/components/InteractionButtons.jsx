import { motion } from "framer-motion";
import { Heart, MessageCircle, Repeat2, Share, Bookmark } from "lucide-react";
import { Button } from "../../../../../shared/components/ui";

const InteractionButtons = ({
     post,
     user,
     onLike,
     onComment,
     onRepost,
     onBookmark
}) => {
     return (
          <div className="flex items-center space-x-1 max-w-md">
               <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
               >
                    <Button
                         variant="ghost"
                         size="sm"
                         onClick={onLike}
                         className={`flex items-center gap-1 px-3 py-1.5 rounded-full rounded-2xl hover:text-red-500 transition-colors hover:bg-red-50 ${post.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                    >
                         <motion.div
                              animate={post.isLiked ? { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] } : {}}
                              transition={{ duration: 0.4 }}
                         >
                              <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                         </motion.div>
                         <span className="text-sm">{post.likes}</span>
                    </Button>
               </motion.div>
               <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
               >
                    <Button
                         variant="ghost"
                         size="sm"
                         onClick={onComment}
                         className="flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors text-gray-500 hover:text-blue-500 hover:bg-blue-50"
                    >
                         <MessageCircle className="w-5 h-5" />
                         <span className="text-sm">{typeof post.comments === 'number' ? post.comments : 0}</span>
                    </Button>
               </motion.div>

               <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
               >
                    <Button
                         variant="ghost"
                         size="sm"
                         className="flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors text-gray-500 hover:text-blue-500 hover:bg-blue-50"
                    >
                         <Share className="w-5 h-5" />
                         <span className="text-sm">{post.shares}</span>
                    </Button>
               </motion.div>
               {user && (
                    <Button
                         variant="ghost"
                         size="sm"
                         onClick={onBookmark}
                         className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors hover:bg-yellow-50 ${post.isBookmarked ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'}`}
                    >
                         <Bookmark className={`w-5 h-5 ${post.isBookmarked ? 'fill-current' : ''}`} />
                    </Button>
               )}
          </div>
     );
};

export default InteractionButtons;
