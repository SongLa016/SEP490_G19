import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ImageIcon, Pin, List, X, Building2, MapPin } from "lucide-react";
import { Modal, Button, Avatar, AvatarImage, AvatarFallback, Textarea } from "../../../../../shared/components/ui";
import FieldSelectionModal from "../../fields/components/FieldSelectionModal";
import { getUserAvatarAndName } from "./utils";

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
     onSubmit,
     editingPost = null,
     editImagePreview = null,
     setEditImagePreview = null,
     editSelectedImage = null,
     setEditSelectedImage = null
}) => {
     const { avatarUrl, initial } = getUserAvatarAndName(user);
     const [showFieldModal, setShowFieldModal] = useState(false);
     const [localImagePreview, setLocalImagePreview] = useState(null);
     const fileInputRef = useRef(null);

     // Determine which image preview to show
     const currentImagePreview = editingPost ? editImagePreview : localImagePreview;

     const handleFieldSelect = (field) => {
          setSelectedField(field);
     };

     const handleImageSelect = (event) => {
          const file = event.target.files?.[0];
          if (file) {
               // Validate file type
               if (!file.type.startsWith('image/')) {
                    alert('Vui lòng chọn file ảnh');
                    return;
               }
               // Validate file size (max 5MB)
               if (file.size > 5 * 1024 * 1024) {
                    alert('Kích thước ảnh không được vượt quá 5MB');
                    return;
               }
               if (editingPost && setEditSelectedImage) {
                    setEditSelectedImage(file);
               }
               // Create preview
               const reader = new FileReader();
               reader.onloadend = () => {
                    if (editingPost && setEditImagePreview) {
                         setEditImagePreview(reader.result);
                    } else {
                         setLocalImagePreview(reader.result);
                    }
               };
               reader.readAsDataURL(file);
          }
     };

     const handleRemoveImage = () => {
          if (editingPost) {
               if (setEditSelectedImage) setEditSelectedImage(null);
               if (setEditImagePreview) setEditImagePreview(null);
          } else {
               setLocalImagePreview(null);
          }
          if (fileInputRef.current) {
               fileInputRef.current.value = '';
          }
     };

     const handleSubmit = () => {
          if (postContent.trim()) {
               // For edit mode: 
               // - If editSelectedImage exists (new image selected), pass it
               // - If editImagePreview is null (image removed), pass null explicitly
               // - Otherwise (keeping old image), pass undefined to indicate no change
               // For new post: pass the image file if selected
               let imageToSubmit;
               if (editingPost) {
                    if (editSelectedImage) {
                         // New image selected
                         imageToSubmit = editSelectedImage;
                    } else if (editImagePreview === null) {
                         // Image was removed
                         imageToSubmit = null;
                    } else {
                         // Keeping old image - pass undefined to indicate no change
                         imageToSubmit = undefined;
                    }
               } else {
                    // New post - pass the file if exists
                    imageToSubmit = localImagePreview ? fileInputRef.current?.files?.[0] : null;
               }

               onSubmit?.(postTitle, postContent, selectedField, imageToSubmit);
               if (!editingPost) {
                    setPostContent("");
                    setPostTitle("");
                    setSelectedField(null);
                    setLocalImagePreview(null);
               }
               if (fileInputRef.current) {
                    fileInputRef.current.value = '';
               }
               onClose();
          }
     };

     return (
          <>
               <Modal
                    isOpen={isOpen}
                    onClose={onClose}
                    title={editingPost ? "Chỉnh sửa bài viết" : "Thêm chủ đề"}
                    className="max-w-2xl px-2 bg-white rounded-2xl overflow-y-auto max-h-[90vh] scrollbar-hide"
               >
                    <motion.div
                         className="space-y-1 p-2"
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: -20 }}
                         transition={{ duration: 0.3 }}
                    >
                         <div className="flex gap-3">
                              <div className="items-center ">
                                   <Avatar className="w-10 h-10">
                                        <AvatarImage src={avatarUrl} />
                                        <AvatarFallback className="bg-gray-200 text-gray-700">
                                             {initial}
                                        </AvatarFallback>
                                   </Avatar>
                                   <div className="flex pt-1 justify-center">
                                        <div className="w-px h-32 bg-gray-300"></div>
                                   </div>
                              </div>
                              <div className="flex-1">
                                   <div className="text-sm text-gray-500 flex items-center gap-2">
                                        <span className="font-semibold">{user?.name || user?.fullName || "User"}</span>
                                        {user?.username && (
                                             <span className="text-gray-400">@{user.username}</span>
                                        )}
                                        <span className="mx-1">&gt;</span>
                                        <Textarea
                                             placeholder="Thêm chủ đề"
                                             value={postTitle}
                                             rows={1}
                                             onChange={(e) => setPostTitle(e.target.value)}
                                             className="flex-1 min-h-[10px] max-h-[100px] resize-none border border-gray-200 rounded-lg focus:outline-none focus:ring-0 text-lg placeholder:text-gray-500 overflow-y-auto bg-transparent"
                                             style={{
                                                  minHeight: '10px',
                                                  maxHeight: '100px'
                                             }}
                                        />
                                   </div>
                                   <Textarea
                                        placeholder="Có gì mới?"
                                        value={postContent}
                                        onChange={(e) => setPostContent(e.target.value)}
                                        className="min-h-[80px] max-h-[300px] mt-2 resize-none border border-gray-100 focus:ring-0 focus:border-0 focus:outline-none text-lg placeholder:text-gray-500 overflow-y-auto bg-transparent"

                                   />
                                   {/* Image Preview */}
                                   {currentImagePreview && (
                                        <div className="mt-3 relative">
                                             <div className="relative rounded-xl overflow-hidden border border-gray-200">
                                                  <img
                                                       src={currentImagePreview}
                                                       alt="Preview"
                                                       className="w-full h-auto max-h-96 object-contain"
                                                  />
                                                  <Button
                                                       variant="ghost"
                                                       size="sm"
                                                       onClick={handleRemoveImage}
                                                       className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5"
                                                  >
                                                       <X className="w-4 h-4" />
                                                  </Button>
                                             </div>
                                        </div>
                                   )}
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
                                                            <span className="text-sm font-medium text-teal-800 flex items-center gap-2">
                                                                 <List className="w-4 h-4 text-teal-500" />
                                                                 {selectedField.name || "Sân bóng"}
                                                                 {selectedField.typeName && (
                                                                      <>
                                                                           <span className="text-xs text-gray-500">•</span>
                                                                           <span className="text-xs">{selectedField.typeName}</span>
                                                                      </>
                                                                 )}
                                                            </span>
                                                            {selectedField.complexName && (
                                                                 <p className="text-xs text-teal-600 flex items-center gap-2">
                                                                      <Building2 className="w-4 h-4 text-blue-500" />
                                                                      {selectedField.complexName}
                                                                 </p>
                                                            )}
                                                            {selectedField.address && (
                                                                 <p className="text-xs text-teal-500 flex items-center gap-2">
                                                                      <MapPin className="w-4 h-4 text-yellow-500" />
                                                                      {selectedField.address}
                                                                      <span className="text-xs text-gray-500 hover:underline font-semibold hover:text-blue-600 cursor-pointer" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedField.address)}`, '_blank')}>
                                                                           Xem trên Google Maps
                                                                      </span>
                                                                 </p>
                                                            )}
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
                                        <input
                                             type="file"
                                             ref={fileInputRef}
                                             accept="image/*"
                                             onChange={handleImageSelect}
                                             className="hidden"
                                             id="image-upload"
                                        />
                                        <Button
                                             variant="ghost"
                                             size="sm"
                                             className="p-2 text-sm "
                                             onClick={() => fileInputRef.current?.click()}
                                             type="button"
                                        >
                                             <ImageIcon className="w-5 h-5 mr-2 text-gray-500" />
                                             Thêm ảnh
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
                                        {editingPost ? "Cập nhật" : "Đăng"}
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