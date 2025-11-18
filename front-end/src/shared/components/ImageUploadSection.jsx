import { useState, useRef } from "react";
import { Image as ImageIcon, Plus, X, Loader2, Star } from "lucide-react";

/**
 * ImageUploadSection - Handle main image and gallery images
 * Converts images to base64 for API submission
 */
export default function ImageUploadSection({
     mainImage,
     imageFiles = [],
     onMainImageChange,
     onImageFilesChange,
     maxGalleryImages = 4,
     disabled = false,
}) {
     const [uploadingMain, setUploadingMain] = useState(false);
     const [uploadingGallery, setUploadingGallery] = useState(false);
     const mainImageInputRef = useRef(null);
     const galleryInputRef = useRef(null);

     // Convert file to base64
     const fileToBase64 = (file) => {
          return new Promise((resolve, reject) => {
               const reader = new FileReader();
               reader.readAsDataURL(file);
               reader.onload = () => resolve(reader.result);
               reader.onerror = (error) => reject(error);
          });
     };

     // Handle main image upload
     const handleMainImageUpload = async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          // Validate file type
          if (!file.type.startsWith("image/")) {
               alert("Vui lòng chọn file ảnh (JPG, PNG)");
               return;
          }

          // Validate file size (5MB)
          if (file.size > 5 * 1024 * 1024) {
               alert("Kích thước ảnh không được vượt quá 5MB");
               return;
          }

          setUploadingMain(true);
          try {
               const base64 = await fileToBase64(file);
               onMainImageChange(base64);
          } catch (error) {
               console.error("Error converting main image:", error);
               alert("Có lỗi khi tải ảnh lên");
          } finally {
               setUploadingMain(false);
          }
     };

     // Handle gallery images upload
     const handleGalleryUpload = async (e) => {
          const files = Array.from(e.target.files || []);
          if (files.length === 0) return;

          // Check if adding these files would exceed max
          const remainingSlots = maxGalleryImages - imageFiles.length;
          if (files.length > remainingSlots) {
               alert(`Chỉ có thể thêm tối đa ${remainingSlots} ảnh nữa`);
               return;
          }

          // Validate all files
          for (const file of files) {
               if (!file.type.startsWith("image/")) {
                    alert("Vui lòng chỉ chọn file ảnh (JPG, PNG)");
                    return;
               }
               if (file.size > 5 * 1024 * 1024) {
                    alert("Mỗi ảnh không được vượt quá 5MB");
                    return;
               }
          }

          setUploadingGallery(true);
          try {
               const base64Array = await Promise.all(
                    files.map((file) => fileToBase64(file))
               );
               onImageFilesChange([...imageFiles, ...base64Array]);
          } catch (error) {
               console.error("Error converting gallery images:", error);
               alert("Có lỗi khi tải ảnh lên");
          } finally {
               setUploadingGallery(false);
          }
     };

     // Remove gallery image
     const handleRemoveGalleryImage = (index) => {
          const newImages = imageFiles.filter((_, i) => i !== index);
          onImageFilesChange(newImages);
     };

     // Remove main image
     const handleRemoveMainImage = () => {
          onMainImageChange(null);
     };

     return (
          <div className="space-y-4">
               {/* Main Image Section */}
               <div>
                    <div className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                         <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span>Ảnh chính (Background)</span>
                              <span className="text-red-500">*</span>
                         </div>
                    </div>

                    {mainImage ? (
                         <div className="relative group h-48 rounded-xl overflow-hidden border-2 border-yellow-200 bg-gray-100">
                              <img
                                   src={mainImage}
                                   alt="Ảnh chính"
                                   className="w-full h-full object-cover"
                                   onError={(e) => {
                                        e.target.src =
                                             'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="20" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EKhông thể tải ảnh%3C/text%3E%3C/svg%3E';
                                   }}
                              />
                              <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                   <Star className="w-3 h-3 fill-white" />
                                   Ảnh chính
                              </div>
                              <button
                                   type="button"
                                   onClick={handleRemoveMainImage}
                                   disabled={disabled}
                                   className="absolute top-2 right-2 bg-white/90 hover:bg-red-500 hover:text-white text-red-500 rounded-full p-2 shadow transition-colors"
                                   aria-label="Xóa ảnh chính"
                              >
                                   <X className="w-4 h-4" />
                              </button>
                         </div>
                    ) : (
                         <div
                              role="button"
                              tabIndex={0}
                              onClick={() => !disabled && mainImageInputRef.current?.click()}
                              onKeyDown={(e) => {
                                   if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        !disabled && mainImageInputRef.current?.click();
                                   }
                              }}
                              className="flex h-48 items-center justify-center border-2 border-dashed border-yellow-300 rounded-xl text-sm text-gray-500 hover:border-yellow-400 hover:bg-yellow-50 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-400"
                         >
                              {uploadingMain ? (
                                   <div className="flex flex-col items-center text-gray-500">
                                        <Loader2 className="w-8 h-8 animate-spin text-yellow-500 mb-2" />
                                        <span>Đang tải ảnh chính...</span>
                                   </div>
                              ) : (
                                   <div className="flex flex-col items-center">
                                        <Star className="w-8 h-8 text-yellow-500 fill-yellow-500 mb-2" />
                                        <span className="font-medium">Thêm ảnh chính</span>
                                        <span className="text-xs text-gray-400 mt-1">
                                             Ảnh này sẽ hiển thị làm background
                                        </span>
                                   </div>
                              )}
                         </div>
                    )}

                    <input
                         ref={mainImageInputRef}
                         type="file"
                         accept="image/*"
                         className="hidden"
                         onChange={handleMainImageUpload}
                         disabled={disabled}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                         Ảnh chính sẽ được hiển thị làm thumbnail và background. Tối đa 5MB (JPG/PNG).
                    </p>
               </div>

               {/* Gallery Images Section */}
               <div>
                    <div className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                         <div className="flex items-center gap-1">
                              <ImageIcon className="w-4 h-4 text-blue-600" />
                              <span>Thư viện ảnh</span>
                         </div>
                         <span className="text-xs text-gray-400">
                              {imageFiles.length}/{maxGalleryImages} ảnh
                         </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                         {imageFiles.map((base64, index) => (
                              <div
                                   key={`gallery-${index}`}
                                   className="relative group h-28 sm:h-32 rounded-xl overflow-hidden border border-gray-200 bg-gray-100"
                              >
                                   <img
                                        src={base64}
                                        alt={`Ảnh ${index + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                             e.target.src =
                                                  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="20" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EKhông thể tải ảnh%3C/text%3E%3C/svg%3E';
                                        }}
                                   />
                                   <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                                        #{index + 1}
                                   </div>
                                   <button
                                        type="button"
                                        onClick={() => handleRemoveGalleryImage(index)}
                                        disabled={disabled}
                                        className="absolute top-2 right-2 bg-white/80 hover:bg-red-500 hover:text-white text-red-500 rounded-full p-1 shadow transition-colors opacity-0 group-hover:opacity-100"
                                        aria-label="Xóa ảnh"
                                   >
                                        <X className="w-3 h-3" />
                                   </button>
                              </div>
                         ))}

                         {imageFiles.length < maxGalleryImages && (
                              <div
                                   role="button"
                                   tabIndex={0}
                                   onClick={() => !disabled && galleryInputRef.current?.click()}
                                   onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                             e.preventDefault();
                                             !disabled && galleryInputRef.current?.click();
                                        }
                                   }}
                                   className="flex h-28 sm:h-32 items-center justify-center border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
                              >
                                   {uploadingGallery ? (
                                        <div className="flex flex-col items-center text-gray-500">
                                             <Loader2 className="w-5 h-5 animate-spin text-blue-500 mb-2" />
                                             <span>Đang tải...</span>
                                        </div>
                                   ) : (
                                        <div className="flex flex-col items-center">
                                             <Plus className="w-5 h-5 text-blue-500 mb-1" />
                                             <span>Thêm ảnh</span>
                                        </div>
                                   )}
                              </div>
                         )}
                    </div>

                    <input
                         ref={galleryInputRef}
                         type="file"
                         accept="image/*"
                         multiple
                         className="hidden"
                         onChange={handleGalleryUpload}
                         disabled={disabled}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                         Tối đa {maxGalleryImages} ảnh, mỗi ảnh không vượt quá 5MB (JPG/PNG).
                    </p>
               </div>
          </div>
     );
}
