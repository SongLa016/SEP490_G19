import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ImageIcon, Pin, List, X, Building2, MapPin } from "lucide-react";
import { Modal, Button, Avatar, AvatarImage, AvatarFallback, Textarea } from "../../../../../shared/components/ui";
import FieldSelectionModal from "../../fields/components/FieldSelectionModal";
import { getUserAvatarAndName } from "./utils";
import Swal from "sweetalert2";

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
     const titleRef = useRef(null);
     const contentRef = useRef(null);

     // tự động mở rộng textarea
     const autoResize = useCallback((ref, maxHeight) => {
          if (ref.current) {
               ref.current.style.height = 'auto';
               ref.current.style.height = Math.min(ref.current.scrollHeight, maxHeight) + 'px';
          }
     }, []);

     const currentImagePreview = editingPost ? editImagePreview : localImagePreview;

     // chọn sân
     const handleFieldSelect = (field) => {
          setSelectedField(field);
     };

     // chọn ảnh
     const handleImageSelect = (event) => {
          const file = event.target.files?.[0];
          if (file) {
               if (!file.type.startsWith('image/')) {
                    alert('Vui lòng chọn file ảnh');
                    return;
               }
               // kích thước ảnh
               if (file.size > 5 * 1024 * 1024) {
                    alert('Kích thước ảnh không được vượt quá 5MB');
                    return;
               }
               if (editingPost && setEditSelectedImage) {
                    setEditSelectedImage(file);
               }
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

     // xóa ảnh
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

     // submit bài viết
     const handleSubmit = () => {
          const trimmedTitle = postTitle.trim();
          if (!trimmedTitle) {
               Swal.fire({
                    icon: "warning",
                    title: "Thiếu tiêu đề",
                    text: "Vui lòng nhập tiêu đề cho chủ đề",
                    confirmButtonColor: "#0d9488"
               });
               return;
          }

          if (trimmedTitle.length < 5) {
               Swal.fire({
                    icon: "warning",
                    title: "Tiêu đề quá ngắn",
                    text: "Tiêu đề phải có ít nhất 5 ký tự",
                    confirmButtonColor: "#0d9488"
               });
               return;
          }

          if (trimmedTitle.length > 200) {
               Swal.fire({
                    icon: "warning",
                    title: "Tiêu đề quá dài",
                    text: "Tiêu đề không được vượt quá 200 ký tự",
                    confirmButtonColor: "#0d9488"
               });
               return;
          }

          // kiểm tra nội dung
          const trimmedContent = postContent.trim();
          if (!trimmedContent) {
               Swal.fire({
                    icon: "warning",
                    title: "Thiếu nội dung",
                    text: "Vui lòng nhập nội dung cho chủ đề",
                    confirmButtonColor: "#0d9488"
               });
               return;
          }

          if (trimmedContent.length < 10) {
               Swal.fire({
                    icon: "warning",
                    title: "Nội dung quá ngắn",
                    text: "Nội dung phải có ít nhất 10 ký tự",
                    confirmButtonColor: "#0d9488"
               });
               return;
          }

          if (trimmedContent.length > 5000) {
               Swal.fire({
                    icon: "warning",
                    title: "Nội dung quá dài",
                    text: "Nội dung không được vượt quá 5000 ký tự",
                    confirmButtonColor: "#0d9488"
               });
               return;
          }

          // ảnh đính kèm
          let imageToSubmit;
          if (editingPost) {
               if (editSelectedImage) {
                    imageToSubmit = editSelectedImage;
               } else if (editImagePreview === null) {
                    imageToSubmit = null;
               } else {
                    imageToSubmit = undefined;
               }
          } else {
               // bài viết mới
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
                                   <div className="text-sm text-gray-500 flex gap-1">
                                        <span className="font-semibold pt-2">{user?.name || user?.fullName || "User"}</span>
                                        <span className="mx-1 pt-2">&gt;</span>
                                        <div className="flex-1">
                                             <Textarea
                                                  ref={titleRef}
                                                  placeholder="Thêm chủ đề"
                                                  value={postTitle}
                                                  rows={1}
                                                  maxLength={200}
                                                  onChange={(e) => {
                                                       setPostTitle(e.target.value);
                                                       autoResize(titleRef, 100);
                                                  }}
                                                  className={`w-full min-h-[36px] resize-none border rounded-lg focus:outline-none focus:ring-0 text-lg placeholder:text-gray-500 overflow-hidden bg-transparent ${postTitle.length > 200 ? 'border-red-500' : 'border-gray-200'}`}
                                             />
                                             <div className={`text-xs text-right mt-1 ${postTitle.length > 200 ? 'text-red-500' : 'text-gray-400'}`}>
                                                  {postTitle.length}/200
                                             </div>
                                        </div>
                                   </div>
                                   <div>
                                        <Textarea
                                             ref={contentRef}
                                             placeholder="Có gì mới?"
                                             value={postContent}
                                             maxLength={5000}
                                             onChange={(e) => {
                                                  setPostContent(e.target.value);
                                                  autoResize(contentRef, 300);
                                             }}
                                             className={`min-h-[80px] mt-2 resize-none border focus:ring-0 focus:outline-none text-lg placeholder:text-gray-500 overflow-hidden bg-transparent ${postContent.length > 5000 ? 'border-red-500' : 'border-gray-100'}`}
                                        />
                                        <div className={`text-xs text-right mt-1 ${postContent.length > 5000 ? 'text-red-500' : 'text-gray-400'}`}>
                                             {postContent.length}/5000
                                        </div>
                                   </div>
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