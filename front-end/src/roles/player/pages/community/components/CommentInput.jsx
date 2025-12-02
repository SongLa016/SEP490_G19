import { Avatar, AvatarImage, AvatarFallback, Textarea, Button, Badge } from "../../../../../shared/components/ui";
import { getCurrentUserFromToken } from "../../../../../shared/services/posts";

const CommentInput = ({
     post,
     user,
     commentContent,
     onCommentChange,
     onCommentSubmit,
     onOpenReply
}) => {
     if (!user) return null;

     const currentUser = getCurrentUserFromToken();
     const roleName = currentUser?.role === 'Player' || currentUser?.role === 'player' ? 'Người chơi' :
          currentUser?.role === 'Owner' || currentUser?.role === 'owner' ? 'Chủ sân' :
               currentUser?.role;

     return (
          <div className="mt-4">
               {/* Timeline line from post */}
               <div className="flex">
                    <div className="w-8 flex justify-center">
                         <div className="w-px h-8 bg-gray-300"></div>
                    </div>
                    <div className="flex-1">
                         <div className="flex gap-2">
                              <Avatar className="w-8 h-8">
                                   <AvatarImage src={user.avatar} />
                                   <AvatarFallback className="bg-gray-200 text-gray-700">
                                        {user.name?.charAt(0) || "U"}
                                   </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                   <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-semibold text-gray-900">{user.name || user.fullName || "User"}</span>
                                        {user.username && (
                                             <span className="text-sm text-gray-400">@{user.username}</span>
                                        )}
                                        {currentUser?.role && (
                                             <Badge variant="secondary" className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full">
                                                  {roleName}
                                             </Badge>
                                        )}
                                        <span className="text-gray-500">&gt;</span>
                                        <span className="text-sm text-gray-500">Thêm bình luận</span>
                                   </div>
                                   <Textarea
                                        placeholder={`Trả lời ${post.author?.FullName || post.author?.fullName || post.author?.name || "người dùng"}...`}
                                        value={commentContent || ""}
                                        onChange={(e) => onCommentChange(e.target.value)}
                                        className="min-h-[40px] max-h-[200px] resize-none border-0 focus:ring-0 text-sm placeholder:text-gray-500 bg-transparent overflow-hidden"
                                        style={{
                                             height: 'auto',
                                             minHeight: '60px',
                                             maxHeight: '200px'
                                        }}
                                        onInput={(e) => {
                                             e.target.style.height = 'auto';
                                             e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                                        }}
                                   />
                              </div>
                              <div className="flex items-center gap-2">
                                   <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onOpenReply(post)}
                                        className="w-8 h-8 p-0 rounded-full border border-gray-300 hover:bg-gray-100"
                                   >
                                        <div className="w-4 h-4 flex items-center justify-center">
                                             <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                             </svg>
                                        </div>
                                   </Button>
                                   {commentContent && commentContent.trim() && (
                                        <Button
                                             variant="ghost"
                                             size="sm"
                                             onClick={onCommentSubmit}
                                             className="w-8 h-8 p-0 rounded-full bg-gray-900 hover:bg-gray-800"
                                        >
                                             <div className="w-4 h-4 flex items-center justify-center">
                                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                  </svg>
                                             </div>
                                        </Button>
                                   )}
                              </div>
                         </div>
                    </div>
               </div>
          </div>
     );
};

export default CommentInput;
