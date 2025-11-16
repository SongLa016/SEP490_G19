import React from "react";
import {
  Building2,
  CheckCircle,
  DollarSign,
  FileText,
  Image,
  Leaf,
  Loader2,
  Plus,
  Ruler,
  X,
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
  onImageUpload,
  onAddComplex,
  onBankAccountChange,
  onNavigateBankAccounts,
  isUploadingImage,
  imageInputRef,
  onTriggerImagePicker,
  onUploadAreaKeyDown,
  onRemoveImage,
  maxImages = 4,
}) => {
  const imageCount = formData.images?.length || 0;

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
            <Input
              name="grassType"
              value={formData.grassType}
              onChange={onInputChange}
              placeholder="Ví dụ: Cỏ nhân tạo"
            />
          </div>
        </div>

        <div>
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
          <div>
            <label className="items-center flex text-sm font-medium text-gray-700">
              <DollarSign className="w-4 h-4 inline mr-1 text-blue-600" />
              <span>Giá mỗi giờ (VND)</span> <span className="text-red-500">*</span>
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
          <div>
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

        <div>
          <div className="flex items-center justify-between text-sm font-medium text-gray-700">
            <div className="flex items-center gap-1">
              <Image className="w-4 h-4 text-blue-600" />
              <span>Hình ảnh</span>
              <span className="text-red-500">*</span>
            </div>
            <span className="text-xs text-gray-400">
              {imageCount}/{maxImages} ảnh
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            {formData.images?.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="relative group h-28 sm:h-32 rounded-xl overflow-hidden border border-gray-200 bg-gray-100"
              >
                <img
                  src={url}
                  alt={`Ảnh sân ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="20" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EKhông thể tải ảnh%3C/text%3E%3C/svg%3E';
                  }}
                />
                <button
                  type="button"
                  onClick={() => onRemoveImage(index)}
                  className="absolute top-2 right-2 bg-white/80 hover:bg-red-500 hover:text-white text-red-500 rounded-full p-1 shadow transition-colors"
                  aria-label="Xóa ảnh"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {imageCount < maxImages && (
              <div
                role="button"
                tabIndex={0}
                onClick={onTriggerImagePicker}
                onKeyDown={onUploadAreaKeyDown}
                className="flex h-28 sm:h-32 items-center justify-center border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:bg-white transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {isUploadingImage ? (
                  <div className="flex flex-col items-center text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500 mb-2" />
                    <span>Đang tải ảnh...</span>
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
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onImageUpload}
          />
          <p className="text-xs text-gray-500 mt-1">
            Tối đa {maxImages} ảnh, mỗi ảnh không vượt quá 5MB (JPG/PNG).
          </p>
        </div>

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

