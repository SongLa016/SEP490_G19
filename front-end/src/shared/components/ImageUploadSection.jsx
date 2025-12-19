import React, { useRef } from "react";
import { Image as ImageIcon, Plus, X, Star } from "lucide-react";
import Swal from "sweetalert2";

// component xử lý upload ảnh chính và thư viện ảnh
export default function ImageUploadSection({
     mainImage,
     imageFiles = [],
     onMainImageChange,
     onImageFilesChange,
     maxGalleryImages = 4,
     disabled = false,
}) {
     // refs để truy cập input file
     const mainImageInputRef = useRef(null);
     const galleryInputRef = useRef(null);
     // ref để theo dõi ObjectURLs cần cleanup khi unmount
     const objectUrlsRef = useRef(new Set());

     // hàm tiện ích
     const isUrl = (value) => {
          if (!value || typeof value !== 'string') return false;
          return value.startsWith('http://') || value.startsWith('https://');
     };

     // hàm kiểm tra giá trị có phải là File object không
     const isFile = (value) => {
          return value instanceof File;
     };

     // hàm lấy URL preview cho ảnh (File object hoặc URL string)
     const getPreviewUrl = (image) => {
          if (isFile(image)) {
               const objectUrl = URL.createObjectURL(image);
               objectUrlsRef.current.add(objectUrl);
               return objectUrl;
          }
          return image;
     };

     // cleanup ObjectURLs khi component unmount để tránh memory leak
     React.useEffect(() => {
          const currentUrls = objectUrlsRef.current;
          return () => {
               currentUrls.forEach(url => URL.revokeObjectURL(url));
               currentUrls.clear();
          };
     }, []);

     // danh sách định dạng file ảnh được phép
     const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
     const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];

     // hàm kiểm tra file ảnh trước khi upload
     const validateImageFile = (file) => {
          // lấy extension từ tên file
          const fileName = file.name.toLowerCase();
          const extension = fileName.split('.').pop();

          // Kiểm tra extension có trong danh sách cho phép không
          if (!allowedExtensions.includes(extension)) {
               Swal.fire({
                    icon: 'error',
                    title: 'File không hợp lệ',
                    html: `Chỉ chấp nhận file ảnh với định dạng: <strong>JPG, PNG, GIF, WEBP</strong><br/>File của bạn: <strong>.${extension}</strong>`,
                    confirmButtonText: 'Đóng',
                    confirmButtonColor: '#ef4444'
               });
               return false;
          }

          // Kiểm tra MIME type để đảm bảo file thực sự là ảnh
          if (!allowedMimeTypes.includes(file.type) && !file.type.startsWith("image/")) {
               Swal.fire({
                    icon: 'error',
                    title: 'File không hợp lệ',
                    text: 'Vui lòng chọn file ảnh hợp lệ (JPG, PNG, GIF, WEBP)',
                    confirmButtonText: 'Đóng',
                    confirmButtonColor: '#ef4444'
               });
               return false;
          }

          // Kiểm tra kích thước file (tối đa 5MB)
          if (file.size > 5 * 1024 * 1024) {
               Swal.fire({
                    icon: 'error',
                    title: 'File quá lớn',
                    text: 'Kích thước ảnh không được vượt quá 5MB',
                    confirmButtonText: 'Đóng',
                    confirmButtonColor: '#ef4444'
               });
               return false;
          }

          return true;
     };

     // hàm xử lý upload ảnh chính
     const handleMainImageUpload = (e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          // kiểm tra file trước khi xử lý
          if (!validateImageFile(file)) {
               if (mainImageInputRef.current) {
                    mainImageInputRef.current.value = "";
               }
               return;
          }

          // Xóa ObjectURL cũ nếu có để tránh memory leak
          if (mainImage && isFile(mainImage) && mainImage !== file) {
               const oldUrl = getPreviewUrl(mainImage);
               URL.revokeObjectURL(oldUrl);
               objectUrlsRef.current.delete(oldUrl);
          }

          // Gọi callback với File object (không chuyển đổi base64)
          onMainImageChange(file);

          // Reset input để có thể chọn lại cùng file
          if (mainImageInputRef.current) {
               mainImageInputRef.current.value = "";
          }
     };

     // ==================== XỬ LÝ UPLOAD THƯ VIỆN ẢNH ====================
     const handleGalleryUpload = (e) => {
          const files = Array.from(e.target.files || []);
          if (files.length === 0) return;

          // Tính số slot còn trống trong thư viện
          const existingCount = imageFiles.length;
          const remainingSlots = maxGalleryImages - existingCount;

          // Kiểm tra nếu số file chọn vượt quá số slot còn trống
          if (files.length > remainingSlots) {
               Swal.fire({
                    icon: 'warning',
                    title: 'Vượt quá giới hạn',
                    text: `Chỉ có thể thêm tối đa ${remainingSlots} ảnh nữa`,
                    confirmButtonText: 'Đóng',
                    confirmButtonColor: '#f59e0b'
               });
               return;
          }

          // Validate từng file
          for (const file of files) {
               if (!validateImageFile(file)) {
                    // Reset input nếu có file không hợp lệ
                    if (galleryInputRef.current) {
                         galleryInputRef.current.value = "";
                    }
                    return;
               }
          }

          // Gọi callback với mảng ảnh mới (giữ ảnh cũ + thêm ảnh mới)
          onImageFilesChange([...imageFiles, ...files]);

          // Reset input để có thể chọn lại cùng files
          if (galleryInputRef.current) {
               galleryInputRef.current.value = "";
          }
     };

     // hàm xóa ảnh khỏi thư viện
     const handleRemoveGalleryImage = (index) => {
          const newImages = imageFiles.filter((_, i) => i !== index);
          onImageFilesChange(newImages);
     };

     // hàm xóa ảnh chính
     const handleRemoveMainImage = () => {
          onMainImageChange(null);
     };

     return (
          <div className="space-y-4">
               {/* ===== PHẦN ẢNH CHÍNH ===== */}
               <div>
                    <div className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                         <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span>Ảnh chính (Background)</span>
                              <span className="text-red-500">*</span>
                         </div>
                    </div>

                    {/* Hiển thị ảnh chính nếu có */}
                    {mainImage ? (
                         <div className="relative group h-48 rounded-xl overflow-hidden border-2 border-yellow-200 bg-gray-100">
                              <img
                                   src={getPreviewUrl(mainImage)}
                                   alt="Ảnh chính"
                                   className="w-full h-full object-cover"
                                   crossOrigin={isUrl(mainImage) ? "anonymous" : undefined}
                                   onError={(e) => {
                                        e.target.src =
                                             'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="20" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EKhông thể tải ảnh%3C/text%3E%3C/svg%3E';
                                   }}
                              />
                              {/* Badge hiển thị trạng thái ảnh */}
                              <div className="absolute top-2 left-2 flex flex-col gap-1">
                                   {isUrl(mainImage) && (
                                        <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                             <span>✓ Cloudinary</span>
                                        </div>
                                   )}
                                   {isFile(mainImage) && (
                                        <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                             <span>📤 Mới</span>
                                        </div>
                                   )}
                                   <div className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-white" />
                                        Ảnh chính
                                   </div>
                              </div>
                              {/* Nút xóa ảnh */}
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
                         /* Vùng click để chọn ảnh chính */
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
                              <div className="flex flex-col items-center">
                                   <Star className="w-8 h-8 text-yellow-500 fill-yellow-500 mb-2" />
                                   <span className="font-medium">Thêm ảnh chính</span>
                                   <span className="text-xs text-gray-400 mt-1">
                                        Ảnh này sẽ hiển thị làm background
                                   </span>
                              </div>
                         </div>
                    )}

                    {/* Input file ẩn cho ảnh chính */}
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

               {/* ===== PHẦN THƯ VIỆN ẢNH ===== */}
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

                    {/* Grid hiển thị ảnh trong thư viện */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                         {imageFiles.map((image, index) => {
                              const isImageUrl = isUrl(image);
                              const isImageFile = isFile(image);
                              return (
                                   <div
                                        key={`gallery-${index}-${isImageFile ? image.name : image}`}
                                        className="relative group h-28 sm:h-32 rounded-xl overflow-hidden border border-gray-200 bg-gray-100"
                                   >
                                        <img
                                             src={getPreviewUrl(image)}
                                             alt={`Ảnh ${index + 1}`}
                                             className="w-full h-full object-cover"
                                             crossOrigin={isImageUrl ? "anonymous" : undefined}
                                             onError={(e) => {
                                                  e.target.src =
                                                       'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="20" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EKhông thể tải ảnh%3C/text%3E%3C/svg%3E';
                                             }}
                                        />
                                        {/* Số thứ tự ảnh */}
                                        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                                             #{index + 1}
                                        </div>
                                        {/* Badge trạng thái ảnh */}
                                        {isImageUrl && (
                                             <div className="absolute bottom-2 right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded">
                                                  ✓
                                             </div>
                                        )}
                                        {isImageFile && (
                                             <div className="absolute bottom-2 right-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                                                  📤
                                             </div>
                                        )}
                                        {/* Nút xóa ảnh (hiện khi hover) */}
                                        <button
                                             type="button"
                                             onClick={() => {
                                                  // Cleanup ObjectURL nếu là File
                                                  if (isFile(image)) {
                                                       const url = getPreviewUrl(image);
                                                       URL.revokeObjectURL(url);
                                                       objectUrlsRef.current.delete(url);
                                                  }
                                                  handleRemoveGalleryImage(index);
                                             }}
                                             disabled={disabled}
                                             className="absolute top-2 right-2 bg-white/80 hover:bg-red-500 hover:text-white text-red-500 rounded-full p-1 shadow transition-colors opacity-0 group-hover:opacity-100"
                                             aria-label="Xóa ảnh"
                                        >
                                             <X className="w-3 h-3" />
                                        </button>
                                   </div>
                              );
                         })}

                         {/* Nút thêm ảnh mới (nếu chưa đạt giới hạn) */}
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
                                   <div className="flex flex-col items-center">
                                        <Plus className="w-5 h-5 text-blue-500 mb-1" />
                                        <span>Thêm ảnh</span>
                                   </div>
                              </div>
                         )}
                    </div>

                    {/* Input file ẩn cho thư viện ảnh (cho phép chọn nhiều file) */}
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
