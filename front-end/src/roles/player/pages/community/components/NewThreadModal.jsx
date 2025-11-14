import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon, Video, Smile, Pin, List, X, Building2, MapPin } from "lucide-react";
import { Modal, Button, Avatar, AvatarImage, AvatarFallback, Textarea } from "../../../../../shared/components/ui";
import FieldSelectionModal from "../../fields/components/FieldSelectionModal";

const NewThreadModal = ({
     isOpen,
     onClose,
     user,
     postContent,
     setPostContent,
     postTitle,
     setPostTitle,
     selectedField,
     setSelectedField,
     onSubmit
}) => {
     const [showFieldModal, setShowFieldModal] = useState(false);

     const handleSubmit = () => {
          if (postContent.trim()) {
               onSubmit?.(postTitle, postContent, selectedField);
               setPostContent("");
               setPostTitle("");
               setSelectedField(null);
               onClose();
          }
     };

     const handleFieldSelect = (field) => {
          setSelectedField(field);
     };

     return (
          <>
               <Modal
                    isOpen={isOpen}
                    onClose={onClose}
                    title="Thêm chủ đề"
                    className="max-w-2xl px-2 bg-white rounded-2xl"
               >
                    <motion.div
                         className="space-y-1"
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: -20 }}
                         transition={{ duration: 0.3 }}
                    >
                         <div className="flex gap-3">
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
                                   <div className="text-sm text-gray-500 flex items-center gap-2">
                                        <span className="font-semibold">{user?.name || "User"}</span>
                                        <span className="mx-1">&gt;</span>
                                        <Textarea
                                             placeholder="Thêm chủ đề"
                                             value={postTitle}
                                             rows={1}
                                             onChange={(e) => setPostTitle(e.target.value)}
                                             className="flex-1 min-h-[10px] py-1 px-1 max-h-[100px] h-auto resize-none border-0 focus:outline-none focus:ring-0 text-lg placeholder:text-gray-500 overflow-hidden bg-transparent"
                                             onInput={(e) => {
                                                  e.target.style.height = 'auto';
                                                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                                             }}
                                        />
                                   </div>
                                   <Textarea
                                        placeholder="Có gì mới?"
                                        value={postContent}
                                        onChange={(e) => setPostContent(e.target.value)}
                                        className="min-h-[40px] h-auto max-h-[300px] mt-2 resize-none border-0 focus:ring-0 focus:border-0 focus:outline-none text-lg placeholder:text-gray-500 overflow-hidden bg-transparent"
                                        style={{
                                             height: 'auto',
                                             minHeight: '40px',
                                             maxHeight: '300px'
                                        }}
                                        onInput={(e) => {
                                             e.target.style.height = 'auto';
                                             e.target.style.height = Math.min(e.target.scrollHeight, 300) + 'px';
                                        }}
                                   />
                                   {/* Field Selection */}
                                   <div className="mt-3">
                                        <div className="flex gap-2 ">
                                             <div className="flex items-center gap-2">
                                                  <Pin className="w-4 h-4 text-red-500" />
                                                  <span className="text-sm text-gray-600 ">Gắn thẻ sân: </span>
                                             </div>
                                             <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => setShowFieldModal(true)}
                                                  className="py-1 px-2 text-sm rounded-3xl"
                                             >
                                                  {selectedField?.name || "Chọn sân"}
                                             </Button>
                                        </div>
                                        {selectedField && (
                                             <div className="mt-2 p-2 bg-teal-50 rounded-xl border border-teal-200">
                                                  <div className="flex items-center justify-between">
                                                       <div className="flex flex-col gap-1">
                                                            <span className="text-sm font-medium text-teal-800 flex items-center gap-2"><List className="w-4 h-4 text-teal-500" /> {selectedField.name} <span className="text-xs text-gray-500">•</span> {selectedField.typeName}</span>
                                                            <p className="text-xs text-teal-600 flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-500" /> {selectedField.complexName}</p>
                                                            <p className="text-xs text-teal-500 flex items-center gap-2"><MapPin className="w-4 h-4 text-yellow-500" /> {selectedField.address} <span className="text-xs text-gray-500 hover:underline font-semibold hover:text-blue-600 cursor-pointer" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selectedField.address}`, '_blank')}>Xem trên Google Maps</span></p>
                                                       </div>
                                                       <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setSelectedField(null)}
                                                            className="hover:text-red-600 hover:bg-transparent px-2 py-1 rounded-full"
                                                       >
                                                            <X className="w-4 h-4 text-red-500" />
                                                       </Button>
                                                  </div>
                                             </div>
                                        )}
                                   </div>

                                   <div className="flex items-center gap-2 ">
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
                                   </div>
                              </div>
                         </div>

                         <div className="flex items-center justify-between gap-2">
                              <div className="text-sm text-gray-500">
                                   Bất kỳ ai cũng có thể trả lời & trích dẫn
                              </div>
                              <div className="flex justify-end">
                                   <Button
                                        className={`px-6 rounded-xl ${postContent.trim()
                                             ? "bg-teal-700 hover:bg-teal-800 text-white"
                                             : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                             }`}
                                        onClick={handleSubmit}
                                        disabled={!postContent.trim()}
                                   >
                                        Đăng
                                   </Button>
                              </div>
                         </div>
                    </motion.div>
               </Modal>

               {/* Field Selection Modal */}
               <FieldSelectionModal
                    isOpen={showFieldModal}
                    onClose={() => setShowFieldModal(false)}
                    onFieldSelect={handleFieldSelect}
                    selectedField={selectedField}
               />
          </>
     );
};

export default NewThreadModal;
