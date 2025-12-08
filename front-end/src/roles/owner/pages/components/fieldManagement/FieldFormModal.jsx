import React from "react";
import {
     Building2,
     CheckCircle,
     DollarSign,
     FileText,
     Leaf,
     Plus,
     Ruler,
} from "lucide-react";
import {
     Button,
     Input,
     Modal,
     Select,
     SelectContent,
     SelectItem,
     SelectTrigger,
     SelectValue,
     Textarea,
} from "../../../../../shared/components/ui";
import ImageUploadSection from "../../../../../shared/components/ImageUploadSection";

const FieldFormModal = ({
     isOpen,
     isEdit,
     complexes,
     formData,
     fieldTypes,
     fieldStatuses,
     bankAccounts,
     onClose,
     onSubmit,
     onInputChange,
     onSelectType,
     onSelectStatus,
     onMainImageChange,
     onImageFilesChange,
     onAddComplex,
     onBankAccountChange,
     onNavigateBankAccounts,
     maxImages = 4,
}) => {

     return (
          <Modal
               isOpen={isOpen}
               onClose={onClose}
               title={isEdit ? "Chỉnh sửa sân" : "Thêm sân mới"}
               className="max-w-2xl rounded-2xl shadow-lg px-3 max-h-[90vh] overflow-y-auto scrollbar-hide"
          >
               <form onSubmit={onSubmit} className="space-y-3">
                    {!isEdit && (
                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                   <Building2 className="w-4 h-4 inline mr-1 text-blue-600" />
                                   Chọn khu sân <span className="text-red-500">*</span>
                              </label>
                              {complexes.length === 0 ? (
                                   <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                        <p className="text-sm text-yellow-800 mb-2">
                                             Chưa có khu sân nào. Vui lòng tạo khu sân trước.
                                        </p>
                                        <Button
                                             type="button"
                                             onClick={onAddComplex}
                                             variant="outline"
                                             className="text-yellow-700 border-yellow-300 hover:bg-yellow-100 items-center flex gap-2"
                                        >
                                             <Plus className="w-4 h-4" />
                                             <span>Tạo khu sân</span>
                                        </Button>
                                   </div>
                              ) : (
                                   <Select
                                        value={formData.complexId ? String(formData.complexId) : ""}
                                        onValueChange={(value) =>
                                             onInputChange({
                                                  target: { name: "complexId", value },
                                             })
                                        }
                                   >
                                        <SelectTrigger>
                                             <SelectValue placeholder="Chọn khu sân" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             {complexes.map((complex) => (
                                                  <SelectItem
                                                       key={complex.complexId}
                                                       value={String(complex.complexId)}
                                                  >
                                                       <div className="flex flex-col text-left">
                                                            <span className="font-medium">{complex.name}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                 {complex.address}
                                                            </span>
                                                       </div>
                                                  </SelectItem>
                                             ))}
                                        </SelectContent>
                                   </Select>
                              )}
                         </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                              <label className="items-center flex text-sm font-medium text-gray-700">
                                   <Building2 className="w-4 h-4 inline mr-1 text-blue-600" />
                                   <span>Tên sân</span> <span className="text-red-500">*</span>
                              </label>
                              <Input
                                   name="name"
                                   value={formData.name}
                                   onChange={onInputChange}
                                   placeholder="Nhập tên sân"
                                   required
                              />
                         </div>
                         <div>
                              <label className="items-center flex text-sm font-medium text-gray-700">
                                   <Leaf className="w-4 h-4 inline mr-1 text-blue-600" />
                                   <span>Loại sân</span> <span className="text-red-500">*</span>
                              </label>
                              <Select value={formData.typeId} onValueChange={onSelectType}>
                                   <SelectTrigger>
                                        <SelectValue placeholder="Chọn loại sân" />
                                   </SelectTrigger>
                                   <SelectContent>
                                        {fieldTypes.map((type) => (
                                             <SelectItem key={type.value} value={type.value}>
                                                  {type.label}
                                             </SelectItem>
                                        ))}
                                   </SelectContent>
                              </Select>
                         </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                   <Ruler className="w-4 h-4 inline mr-1 text-blue-600" />
                                   Kích thước
                              </label>
                              <Input
                                   name="size"
                                   value={formData.size}
                                   onChange={onInputChange}
                                   placeholder="Ví dụ: 20x40m"
                              />
                         </div>
                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                   <Leaf className="w-4 h-4 inline mr-1 text-blue-600" />
                                   Loại cỏ
                              </label>
                              <Select
                                   value={formData.grassType || ""}
                                   onValueChange={(value) =>
                                        onInputChange({
                                             target: { name: "grassType", value },
                                        })
                                   }
                              >
                                   <SelectTrigger>
                                        <SelectValue placeholder="Chọn loại cỏ" />
                                   </SelectTrigger>
                                   <SelectContent>
                                        <SelectItem value="Nhân tạo">Nhân tạo</SelectItem>
                                        <SelectItem value="Tự nhiên">Tự nhiên</SelectItem>
                                   </SelectContent>
                              </Select>
                         </div>
                    </div>

                    <div className="flex flex-col gap-1">
                         <label className=" text-sm items-center flex font-medium text-gray-700">
                              <FileText className="w-4 h-4 inline mr-1 text-blue-600" />
                              <span>Mô tả</span>
                         </label>
                         <Textarea
                              name="description"
                              value={formData.description}
                              onChange={onInputChange}
                              placeholder="Mô tả về sân bóng"
                              rows={2}
                              className="w-full"
                         />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         <div className="flex flex-col gap-1">
                              <label className="items-center flex text-sm font-medium text-gray-700">
                                   <DollarSign className="w-4 h-4 inline mr-1 text-blue-600" />
                                   <span>Giá trung bình (VND)</span> <span className="text-red-500">*</span>
                              </label>
                              <Input
                                   name="pricePerHour"
                                   type="number"
                                   min="0"
                                   value={formData.pricePerHour}
                                   onChange={onInputChange}
                                   placeholder="Nhập giá thuê"
                                   required
                              />
                         </div>
                         <div className="flex flex-col gap-1">
                              <label className="items-center flex text-sm font-medium text-gray-700">
                                   <CheckCircle className="w-4 h-4 inline mr-1 text-blue-600" />
                                   <span>Trạng thái</span>
                              </label>
                              <Select value={formData.status} onValueChange={onSelectStatus}>
                                   <SelectTrigger>
                                        <SelectValue placeholder="Chọn trạng thái" />
                                   </SelectTrigger>
                                   <SelectContent>
                                        {fieldStatuses.map((status) => (
                                             <SelectItem key={status.value} value={status.value}>
                                                  {status.label}
                                             </SelectItem>
                                        ))}
                                   </SelectContent>
                              </Select>
                         </div>
                    </div>

                    <ImageUploadSection
                         mainImage={formData.mainImage}
                         imageFiles={formData.imageFiles}
                         onMainImageChange={onMainImageChange}
                         onImageFilesChange={onImageFilesChange}
                         maxGalleryImages={maxImages}
                    />

                    <div>
                         <label className="items-center flex text-sm font-medium text-gray-700">
                              <DollarSign className="w-4 h-4 inline mr-1 text-green-600" />
                              <span>Tài khoản ngân hàng</span> <span className="text-red-500">*</span>
                         </label>
                         {bankAccounts.length === 0 ? (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                   <p className="text-sm text-yellow-800 mb-2">
                                        Chưa có tài khoản ngân hàng nào. Vui lòng thêm tài khoản ngân hàng trước.
                                   </p>
                                   <Button
                                        type="button"
                                        onClick={onNavigateBankAccounts}
                                        variant="outline"
                                        className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                                   >
                                        <DollarSign className="w-4 h-4 mr-2" />
                                        Thêm tài khoản ngân hàng
                                   </Button>
                              </div>
                         ) : (
                              <>
                                   <Select value={formData.bankAccountId} onValueChange={onBankAccountChange}>
                                        <SelectTrigger>
                                             <SelectValue placeholder="Chọn tài khoản ngân hàng" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             {bankAccounts.map((account) => (
                                                  <SelectItem key={account.bankAccountId} value={String(account.bankAccountId)}>
                                                       {account.bankName} - {account.accountNumber}{" "}
                                                       {account.isDefault && "(Mặc định)"}
                                                  </SelectItem>
                                             ))}
                                        </SelectContent>
                                   </Select>
                                   {formData.bankAccountId && (
                                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                             <p className="text-xs text-gray-600 mb-1">
                                                  <span className="font-medium">Ngân hàng:</span> {formData.bankName}
                                             </p>
                                             <p className="text-xs text-gray-600 mb-1">
                                                  <span className="font-medium">Số tài khoản:</span> {formData.accountNumber}
                                             </p>
                                             <p className="text-xs text-gray-600">
                                                  <span className="font-medium">Chủ tài khoản:</span> {formData.accountHolder}
                                             </p>
                                        </div>
                                   )}
                              </>
                         )}
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                         <Button type="button" variant="outline" onClick={onClose}>
                              Hủy
                         </Button>
                         <Button type="submit" className="rounded-2xl">
                              {isEdit ? "Cập nhật sân" : "Lưu sân"}
                         </Button>
                    </div>
               </form>
          </Modal>
     );
};

export default FieldFormModal;
