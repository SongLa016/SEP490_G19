import React from 'react';
import { ImageIcon, Video, Smile, Pin, List } from "lucide-react";
import { Modal } from './ui/modal';
import { Button, Avatar, AvatarImage, AvatarFallback, Textarea } from './ui/index';

const NewThreadModal = ({
     isOpen,
     onClose,
     user,
     postContent,
     setPostContent,
     onSubmit
}) => {
     const handleSubmit = () => {
          if (postContent.trim()) {
               onSubmit?.(postContent);
               setPostContent("");
               onClose();
          }
     };

     return (
          <Modal
               isOpen={isOpen}
               onClose={onClose}
               title="Thêm chủ đề"
               className="max-w-2xl px-2 bg-white rounded-2xl"
          >
               <div className="space-y-1">
                    <div className="flex gap-3">
                         <Avatar className="w-10 h-10">
                              <AvatarImage src={user?.avatar} />
                              <AvatarFallback className="bg-gray-200 text-gray-700">
                                   {user?.name?.charAt(0) || "U"}
                              </AvatarFallback>
                         </Avatar>
                         <div className="flex-1">
                              <div className="text-sm text-gray-500 ">
                                   <span className="font-semibold">{user?.name || "User"}</span>
                                   <span className="mx-1">&gt;</span>
                                   <span>Thêm chủ đề</span>
                              </div>
                              <Textarea
                                   placeholder="Có gì mới?"
                                   value={postContent}
                                   onChange={(e) => setPostContent(e.target.value)}
                                   className="min-h-[120px] max-h-[300px] resize-none border-0 focus:ring-0 text-lg placeholder:text-gray-500 overflow-hidden"
                                   style={{
                                        height: 'auto',
                                        minHeight: '120px',
                                        maxHeight: '300px'
                                   }}
                                   onInput={(e) => {
                                        e.target.style.height = 'auto';
                                        e.target.style.height = Math.min(e.target.scrollHeight, 300) + 'px';
                                   }}
                              />
                              <div className="flex items-center gap-2">
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

                    <div className="text-sm text-blue-500 hover:text-blue-600 cursor-pointer">
                         Thêm vào chủ đề
                    </div>
                    <div className="text-sm text-gray-500">
                         Bất kỳ ai cũng có thể trả lời & trích dẫn
                    </div>
                    <div className="flex justify-end pt-4">
                         <Button
                              className={`px-6 ${postContent.trim()
                                   ? "bg-gray-900 hover:bg-gray-800 text-white"
                                   : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                   }`}
                              onClick={handleSubmit}
                              disabled={!postContent.trim()}
                         >
                              Đăng
                         </Button>
                    </div>
               </div>
          </Modal>
     );
};

export default NewThreadModal;
