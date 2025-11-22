import { Button } from "../../../../../shared/components/ui";
import { Bookmark, Flag, Copy, Edit, Trash2, MoreHorizontal } from "lucide-react";

const PostMenu = ({
     post,
     isOwnPost,
     showMenu,
     onToggleMenu,
     onMenuAction
}) => {
     return (
          <div className="flex flex-col gap-1 relative post-menu-container">
               <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-6 w-6 hover:bg-gray-100 rounded-full transition-colors"
                    onClick={onToggleMenu}
               >
                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
               </Button>

               {/* Dropdown Menu */}
               {showMenu && (
                    <div className="absolute right-0 top-8 w-44 bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-200">
                         <div className="px-2 space-y-2 text-base">
                              <Button
                                   onClick={() => onMenuAction('save')}
                                   className={`flex items-center w-full px-3 py-1 hover:bg-yellow-50 hover:text-yellow-600 p-0 h-auto bg-transparent border-0 justify-start rounded-md transition-colors ${post.isBookmarked ? 'text-yellow-600' : 'text-gray-700'}`}
                              >
                                   <Bookmark className={`w-5 h-5 mr-3 ${post.isBookmarked ? 'fill-current' : ''}`} />
                                   {post.isBookmarked ? 'Đã lưu' : 'Lưu'}
                              </Button>
                              {/* Only show report button for others' posts */}
                              {!isOwnPost && (
                                   <Button
                                        onClick={() => onMenuAction('report')}
                                        className="flex items-center w-full px-3 py-2 text-red-700 hover:bg-red-50 hover:text-red-600 p-0 h-auto bg-transparent border-0 justify-start rounded-md transition-colors"
                                   >
                                        <Flag className="w-5 h-5 mr-3" />
                                        Báo cáo
                                   </Button>
                              )}
                              <Button
                                   onClick={() => onMenuAction('copy')}
                                   className="flex items-center w-full px-3 py-2 text-blue-700 hover:bg-blue-50 hover:text-blue-600 p-0 h-auto bg-transparent border-0 justify-start rounded-md transition-colors"
                              >
                                   <Copy className="w-5 h-5 mr-3" />
                                   Sao chép liên kết
                              </Button>
                         </div>

                         {/* Owner-only options */}
                         {isOwnPost && (
                              <>
                                   <div className="border-t border-gray-200 my-1"></div>
                                   <div className="px-2 space-y-2">
                                        <Button
                                             onClick={() => onMenuAction('edit')}
                                             className="flex items-center w-full px-3 py-2 text-gray-700 hover:bg-gray-100 p-0 h-auto bg-transparent border-0 justify-start rounded-md transition-colors"
                                        >
                                             <Edit className="w-5 h-5 mr-3" />
                                             Chỉnh sửa
                                        </Button>

                                        <Button
                                             onClick={() => onMenuAction('delete')}
                                             className="flex items-center w-full px-3 py-2 text-red-600 hover:bg-red-50 p-0 h-auto bg-transparent border-0 justify-start rounded-md transition-colors"
                                        >
                                             <Trash2 className="w-5 h-5 mr-3" />
                                             Xóa bài viết
                                        </Button>
                                   </div>
                              </>
                         )}
                    </div>
               )}

               {/* Quick Report Button - Only show for others' posts */}
               {!isOwnPost && (
                    <Button
                         variant="ghost"
                         size="sm"
                         className="p-1 h-6 w-6 hover:bg-red-50 rounded-full transition-colors"
                         onClick={() => onMenuAction('report')}
                         title="Báo cáo bài viết"
                    >
                         <Flag className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </Button>
               )}
          </div>
     );
};

export default PostMenu;

