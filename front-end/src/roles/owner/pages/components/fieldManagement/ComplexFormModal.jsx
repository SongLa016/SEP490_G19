import React from "react";
import { Building2, CheckCircle, Loader2 } from "lucide-react";
import { Button, Input, Modal, Textarea } from "../../../../../shared/components/ui";
import AddressPicker from "../../../../../shared/components/AddressPicker";

const ComplexFormModal = ({
     isOpen,
     isEdit,
     formData,
     isUploadingImage,
     imageInputRef,
     onClose,
     onSubmit,
     onFieldChange,
     onAddressChange,
     onLocationSelect,
     onTriggerImagePicker,
     onUploadAreaKeyDown,
     onImageUpload,
     onRemoveImage,
}) => {
     return (
          <Modal
               isOpen={isOpen}
               onClose={onClose}
               title={isEdit ? "Chỉnh sửa khu sân" : "Thêm khu sân mới"}
               className="max-w-2xl rounded-2xl shadow-lg px-3 scrollbar-hide overflow-y-auto"
          >
               <form onSubmit={onSubmit} className="space-y-3">
                    <div className="bg-blue-50 px-3 py-1 rounded-lg border items-center flex border-blue-200 mb-2">
                         <p className="text-xs items-center text-blue-800">
                              <Building2 className="w-4 h-4 inline mr-1" />
                              {isEdit
                                   ? "Chỉnh sửa thông tin khu sân của bạn"
                                   : "Tạo khu sân mới để quản lý các sân bóng của bạn"}
                         </p>
                    </div>

                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                              <Building2 className="w-4 h-4 inline mr-1 text-blue-600" />
                              Tên khu sân <span className="text-red-500">*</span>
                         </label>
                         <Input
                              name="name"
                              value={formData.name}
                              onChange={(e) => onFieldChange("name", e.target.value)}
                              placeholder="Ví dụ: Sân bóng ABC, Khu thể thao XYZ..."
                              required
                              className="w-full"
                         />
                    </div>

                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                              <Building2 className="w-4 h-4 inline mr-1 text-green-600" />
                              Địa chỉ khu sân <span className="text-red-500">*</span>
                         </label>
                         <AddressPicker
                              value={formData.address}
                              onChange={onAddressChange}
                              onLocationSelect={onLocationSelect}
                              placeholder="Nhập địa chỉ hoặc chọn trên bản đồ"
                         />
                         {formData.lat && formData.lng && (
                              <div className="mt-2 flex items-center text-xs text-gray-500 bg-green-50 p-2 rounded">
                                   <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                                   <span>
                                        Vị trí: {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
                                   </span>
                              </div>
                         )}
                    </div>

                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">
                              Mô tả khu sân
                         </label>
                         <Textarea
                              name="description"
                              value={formData.description}
                              onChange={(e) => onFieldChange("description", e.target.value)}
                              placeholder="Mô tả về khu sân, tiện ích, quy mô..."
                              rows={2}
                              className="w-full"
                         />
                         <p className="text-xs text-gray-500">
                              Mô tả chi tiết về khu sân sẽ giúp khách hàng hiểu rõ hơn
                         </p>
                    </div>

                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">
                              Hình ảnh khu sân
                         </label>
                         <div
                              role="button"
                              tabIndex={0}
                              onClick={onTriggerImagePicker}
                              onKeyDown={onUploadAreaKeyDown}
                              className={`relative h-40 rounded-xl border-2 border-dashed transition-all duration-200 flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 ${formData.image
                                   ? "border-blue-300 bg-white hover:shadow-md"
                                   : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-white"
                                   }`}
                         >
                              {isUploadingImage ? (
                                   <div className="flex flex-col items-center text-sm text-gray-500">
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
                                        <span>Đang tải ảnh...</span>
                                   </div>
                              ) : formData.image ? (
                                   <img
                                        src={formData.image}
                                        alt="Ảnh khu sân"
                                        className="w-full h-full object-cover rounded-xl"
                                        onError={(e) => {
                                             e.target.src =
                                                  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="20" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EKhông thể tải ảnh%3C/text%3E%3C/svg%3E';
                                        }}
                                   />
                              ) : (
                                   <div className="text-center text-sm text-gray-500">
                                        <p className="font-medium text-gray-600">Nhấn để chọn ảnh từ thiết bị</p>
                                        <p className="mt-1">Hỗ trợ định dạng JPG, PNG. Dung lượng tối đa 5MB.</p>
                                   </div>
                              )}
                         </div>
                         <input
                              ref={imageInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={onImageUpload}
                         />
                         {formData.image && !isUploadingImage && (
                              <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
                                   <span className="truncate">
                                        {formData.imageFile?.name || "Đang sử dụng ảnh hiện tại"}
                                   </span>
                                   <button
                                        type="button"
                                        onClick={onRemoveImage}
                                        className="text-red-600 hover:text-red-700 font-medium"
                                   >
                                        Xóa ảnh
                                   </button>
                              </div>
                         )}
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                         <Button type="button" variant="outline" onClick={onClose}>
                              Hủy
                         </Button>
                         <Button type="submit" className="rounded-2xl">
                              {isEdit ? "Cập nhật khu sân" : "Tạo khu sân"}
                         </Button>
                    </div>
               </form>
          </Modal>
     );
};

export default ComplexFormModal;
