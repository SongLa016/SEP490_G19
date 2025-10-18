import React from 'react';
import { X, ImageIcon, Video, Smile, Pin, List } from "lucide-react";
import { Modal } from './ui/modal';
import { Button, Avatar, AvatarImage, AvatarFallback, Textarea } from './ui/index';

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

     return (
          <Modal
               isOpen={isOpen}
               onClose={onClose}
               title="Trả lời bài viết"
               className="max-w-2xl px-2 bg-white rounded-2xl"

          >
               <div className="space-y-4">
                    {/* Original Post */}
                    {originalPost && (
                         <div className="">
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
                                                  <span className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                                       <span className="text-white text-xs">✓</span>
                                                  </span>
                                             )}
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
                                        <div className="w-px h-16 bg-gray-300"></div>
                                   </div>
                              </div>

                              <div className="flex-1">
                                   <div className="text-sm text-gray-500 mb-2">
                                        <span className="font-semibold">{user?.name || "User"}</span>
                                        <span className="mx-1">&gt;</span>
                                        <span>Thêm chủ đề</span>
                                   </div>
                                   <Textarea
                                        placeholder={`Trả lời ${originalPost?.author || 'post'}...`}
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        className="min-h-[50px] resize-none  border-0 border-gray-300 focus:ring-0 text-lg placeholder:text-gray-500"
                                   />
                                   <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="sm" className="p-2">
                                             <ImageIcon className="w-5 h-5 text-gray-500" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="p-2">
                                             <Video className="w-5 h-5 text-gray-500" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="p-2">
                                             <Smile className="w-5 h-5 text-gray-500" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="p-2">
                                             <List className="w-5 h-5 text-gray-500" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="p-2">
                                             <Pin className="w-5 h-5 text-gray-500" />
                                        </Button>
                                   </div>
                              </div>
                         </div>


                         <div className="flex justify-between items-center">
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
               </div>
          </Modal>
     );
};

export default ReplyModal;
