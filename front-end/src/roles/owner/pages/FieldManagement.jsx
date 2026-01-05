import React, { useState, useMemo } from "react";
import { Plus, Edit, Trash2, MapPin, DollarSign, Loader2, Building2, Power, PowerOff } from "lucide-react";
import { Button, Card, Pagination, usePagination } from "../../../shared/components/ui";
import { DemoRestrictedModal } from "../../../shared";
import { useFieldTypes } from "../../../shared/hooks";
import FieldFormModal from "./components/fieldManagement/FieldFormModal";
import ComplexFormModal from "./components/fieldManagement/ComplexFormModal";
import { useAuth } from "../../../contexts/AuthContext";
import { useFieldData, useFieldForm, useFieldActions } from "./hooks";

const FieldManagement = ({ isDemo = false }) => {
     const { user } = useAuth();
     const { data: apiFieldTypes = [] } = useFieldTypes();
     const [showDemoRestrictedModal, setShowDemoRestrictedModal] = useState(false);

     // Lấy userId
     const currentUserId = useMemo(() => {
          return user?.userID || user?.UserID || user?.id || user?.userId || null;
     }, [user?.userID, user?.UserID, user?.id, user?.userId]);

     // Hook quản lý dữ liệu
     const {
          loading,
          fields,
          complexes,
          setComplexes,
          bankAccounts,
          fieldTypes,
          fieldTypeMap,
          complexFieldCounts,
          activeFields,
          loadData,
     } = useFieldData(currentUserId, isDemo, apiFieldTypes);

     // Hook quản lý form
     const {
          formData,
          setFormData,
          complexFormData,
          setComplexFormData,
          editingComplexId,
          setEditingComplexId,
          complexImageUploading,
          complexImageInputRef,
          handleInputChange,
          handleMainImageChange,
          handleImageFilesChange,
          handleBankAccountChange,
          handleComplexImageUpload,
          handleComplexFieldChange,
          removeComplexImage,
          triggerComplexImagePicker,
          handleComplexUploadAreaKeyDown,
          handleComplexAddressSelect,
          resetForm,
          resetComplexForm,
          geocodeAddress,
     } = useFieldForm(bankAccounts);

     // Hook quản lý actions
     const {
          isAddModalOpen,
          isEditModalOpen,
          isAddComplexModalOpen,
          isEditComplexModalOpen,
          handleComplexSubmit,
          handleSubmit,
          handleEdit,
          handleDelete,
          handleAddField,
          handleAddComplex,
          handleEditComplex,
          handleDeleteComplex,
          handleToggleComplexStatus,
          handleCloseFieldModal,
          handleCloseComplexModal,
          handleRequestCreateComplex,
          handleNavigateBankAccounts,
     } = useFieldActions({
          user,
          isDemo,
          complexes,
          setComplexes,
          bankAccounts,
          fieldTypeMap,
          formData,
          setFormData,
          complexFormData,
          setComplexFormData,
          editingComplexId,
          setEditingComplexId,
          complexImageInputRef,
          resetForm,
          resetComplexForm,
          geocodeAddress,
          loadData,
          setShowDemoRestrictedModal,
     });

     const fieldStatuses = [
          { value: "Available", label: "Có sẵn" },
          { value: "Maintenance", label: "Bảo trì" },
          { value: "Unavailable", label: "Không khả dụng" },
     ];

     // Utility functions
     const normalizeFieldStatus = (status) => {
          const validStatuses = ['Available', 'Maintenance', 'Unavailable'];
          if (!status || !validStatuses.includes(status)) {
               return 'Available';
          }
          return status;
     };

     const getStatusColor = (status) => {
          const normalizedStatus = normalizeFieldStatus(status);
          switch (normalizedStatus) {
               case 'Available': return 'bg-green-100 text-green-800';
               case 'Maintenance': return 'bg-yellow-100 text-yellow-800';
               case 'Unavailable': return 'bg-red-100 text-red-800';
               default: return 'bg-gray-100 text-gray-800';
          }
     };

     const getStatusText = (status) => {
          const normalizedStatus = normalizeFieldStatus(status);
          const statusObj = fieldStatuses.find(s => s.value === normalizedStatus);
          return statusObj ? statusObj.label : normalizedStatus;
     };

     const formatCurrency = (amount) => {
          return new Intl.NumberFormat('vi-VN', {
               style: 'currency',
               currency: 'VND'
          }).format(amount);
     };

     // Phân trang khu sân (4)
     const {
          currentPage: complexesPage,
          totalPages: complexesTotalPages,
          currentItems: paginatedComplexes,
          handlePageChange: handleComplexesPageChange,
          totalItems: complexesTotalItems,
          itemsPerPage: complexesItemsPerPage,
     } = usePagination(complexes, 4);

     // Phân trang sân nhỏ (6)
     const {
          currentPage: fieldsPage,
          totalPages: fieldsTotalPages,
          currentItems: paginatedFields,
          handlePageChange: handleFieldsPageChange,
          totalItems: fieldsTotalItems,
          itemsPerPage: fieldsItemsPerPage,
     } = usePagination(activeFields, 6);

     if (loading) {
          return (
               <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                    <span className="ml-2 text-gray-600">Đang tải...</span>
               </div>
          );
     }

     return (
          <div className="space-y-8">
               {/* Header */}
               <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                         <h1 className="text-3xl font-bold text-gray-900">Quản lý sân</h1>
                         <p className="text-gray-600 mt-1">Theo dõi khu sân và các sân nhỏ trong hệ thống của bạn</p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm">
                         <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 font-medium">
                              Khu sân: {complexes.length}
                         </span>
                         <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-600 border border-teal-200 font-medium">
                              Sân nhỏ: {activeFields.length}
                         </span>
                         {fields.length > activeFields.length && (
                              <span className="px-3 py-1 rounded-full bg-yellow-50 text-yellow-600 border border-yellow-200 font-medium">
                                   Chờ duyệt: {fields.length - activeFields.length} sân
                              </span>
                         )}
                    </div>
               </div>

               {/* Complexes Section */}
               <section className="bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-3xl shadow-sm p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                         <div>
                              <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                                   <Building2 className="w-6 h-6 text-blue-500" />
                                   Khu sân
                              </h2>
                              <p className="text-sm text-gray-500 mt-1">Quản lý danh sách khu sân và thông tin tổng quan</p>
                         </div>
                         <Button
                              onClick={handleAddComplex}
                              variant="outline"
                              className="flex items-center space-x-2 rounded-2xl border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-600"
                         >
                              <Plus className="w-4 h-4" />
                              <span>Thêm khu sân</span>
                         </Button>
                    </div>

                    {complexes.length === 0 ? (
                         <Card className="p-10 text-center border-dashed border-2 border-blue-200 bg-blue-50/50 rounded-2xl">
                              <Building2 className="w-12 h-12 mx-auto text-blue-400 mb-3" />
                              <p className="text-gray-500 mb-4">Chưa có khu sân nào. Hãy tạo khu sân đầu tiên để quản lý sân nhỏ.</p>
                              <Button onClick={handleAddComplex}>
                                   <Plus className="w-4 h-4 mr-2" />
                                   Thêm khu sân mới
                              </Button>
                         </Card>
                    ) : (
                         <>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                   {paginatedComplexes.map((complex) => {
                                        const fieldCount = complexFieldCounts[complex.complexId] || 0;
                                        return (
                                             <Card key={complex.complexId} className={`h-full border rounded-2xl hover:shadow-lg transition-all duration-300 ${complex.status === "Active"
                                                  ? "border-blue-100 bg-white"
                                                  : complex.status === "Pending"
                                                       ? "border-yellow-200 bg-yellow-50/30"
                                                       : complex.status === "Rejected"
                                                            ? "border-red-200 bg-red-50/30 opacity-75"
                                                            : "border-gray-200 bg-gray-50/50 opacity-75"
                                                  }`}>
                                                  {/* Complex Image */}
                                                  <div className="relative h-32 overflow-hidden rounded-t-2xl">
                                                       {complex.imageUrl || complex.image ? (
                                                            <img
                                                                 src={complex.imageUrl || complex.image}
                                                                 alt={complex.name}
                                                                 className="w-full h-full object-cover"
                                                            />
                                                       ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                                                 <Building2 className="w-12 h-12 text-blue-400" />
                                                            </div>
                                                       )}
                                                       {/* Status Badge */}
                                                       <div className="absolute top-2 right-2">
                                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${complex.status === "Active"
                                                                 ? "bg-green-100 text-green-700"
                                                                 : complex.status === "Pending"
                                                                      ? "bg-yellow-100 text-yellow-700"
                                                                      : complex.status === "Rejected"
                                                                           ? "bg-red-100 text-red-700"
                                                                           : "bg-gray-100 text-gray-700"
                                                                 }`}>
                                                                 {complex.status === "Active" ? "Hoạt động" :
                                                                      complex.status === "Pending" ? "Chờ duyệt" :
                                                                           complex.status === "Rejected" ? "Từ chối" : "Vô hiệu"}
                                                            </span>
                                                       </div>
                                                  </div>

                                                  {/* Complex Info */}
                                                  <div className="p-4 space-y-3">
                                                       <h3 className="font-semibold text-gray-900 truncate">{complex.name}</h3>
                                                       <div className="flex items-start gap-2 text-sm text-gray-500">
                                                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                            <span className="line-clamp-2">{complex.address}</span>
                                                       </div>
                                                       <div className="flex items-center justify-between text-sm">
                                                            <span className="text-gray-500">Số sân:</span>
                                                            <span className="font-medium text-blue-600">{fieldCount}</span>
                                                       </div>

                                                       {/* Actions */}
                                                       <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                                            <Button
                                                                 variant="outline"
                                                                 size="sm"
                                                                 onClick={() => handleEditComplex(complex)}
                                                                 className="flex-1 text-xs rounded-xl"
                                                            >
                                                                 <Edit className="w-3 h-3 mr-1" />
                                                                 Sửa
                                                            </Button>
                                                            <Button
                                                                 variant="outline"
                                                                 size="sm"
                                                                 onClick={() => handleToggleComplexStatus(complex)}
                                                                 className={`flex-1 text-xs rounded-xl ${complex.status === "Active"
                                                                      ? "text-orange-600 border-orange-200 hover:bg-orange-50"
                                                                      : "text-green-600 border-green-200 hover:bg-green-50"
                                                                      }`}
                                                            >
                                                                 {complex.status === "Active" ? (
                                                                      <>
                                                                           <PowerOff className="w-3 h-3 mr-1" />
                                                                           Tắt
                                                                      </>
                                                                 ) : (
                                                                      <>
                                                                           <Power className="w-3 h-3 mr-1" />
                                                                           Bật
                                                                      </>
                                                                 )}
                                                            </Button>
                                                            <Button
                                                                 variant="outline"
                                                                 size="sm"
                                                                 onClick={() => handleDeleteComplex(complex.complexId)}
                                                                 className="text-red-600 border-red-200 hover:bg-red-50 rounded-xl"
                                                            >
                                                                 <Trash2 className="w-3 h-3" />
                                                            </Button>
                                                       </div>
                                                  </div>
                                             </Card>
                                        );
                                   })}
                              </div>

                              {/* Pagination for Complexes */}
                              {complexesTotalPages > 1 && (
                                   <div className="flex justify-center mt-6">
                                        <Pagination
                                             currentPage={complexesPage}
                                             totalPages={complexesTotalPages}
                                             onPageChange={handleComplexesPageChange}
                                             itemsPerPage={complexesItemsPerPage}
                                             totalItems={complexesTotalItems}
                                        />
                                   </div>
                              )}
                         </>
                    )}
               </section>

               {/* Fields Section */}
               <section className="bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-3xl shadow-sm p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                         <div>
                              <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                                   <MapPin className="w-6 h-6 text-teal-500" />
                                   Sân nhỏ
                              </h2>
                              <p className="text-sm text-gray-500 mt-1">Quản lý các sân nhỏ trong khu sân</p>
                         </div>
                         <Button
                              onClick={() => handleAddField()}
                              className="flex items-center space-x-2 rounded-2xl bg-teal-600 hover:bg-teal-700"
                         >
                              <Plus className="w-4 h-4" />
                              <span>Thêm sân nhỏ</span>
                         </Button>
                    </div>

                    {activeFields.length === 0 ? (
                         <Card className="p-10 text-center border-dashed border-2 border-teal-200 bg-teal-50/50 rounded-2xl">
                              <MapPin className="w-12 h-12 mx-auto text-teal-400 mb-3" />
                              <p className="text-gray-500 mb-4">
                                   {complexes.length === 0
                                        ? "Hãy tạo khu sân trước khi thêm sân nhỏ."
                                        : "Chưa có sân nhỏ nào. Hãy thêm sân nhỏ đầu tiên!"}
                              </p>
                              <Button onClick={() => handleAddField()} disabled={complexes.length === 0}>
                                   <Plus className="w-4 h-4 mr-2" />
                                   Thêm sân nhỏ
                              </Button>
                         </Card>
                    ) : (
                         <>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                   {paginatedFields.map((field) => (
                                        <Card key={field.fieldId} className="h-full border border-teal-100 rounded-2xl hover:shadow-lg transition-all duration-300">
                                             {/* Field Image */}
                                             <div className="relative h-40 overflow-hidden rounded-t-2xl">
                                                  {field.mainImageUrl || field.mainImage ? (
                                                       <img
                                                            src={field.mainImageUrl || field.mainImage}
                                                            alt={field.name}
                                                            className="w-full h-full object-cover"
                                                       />
                                                  ) : (
                                                       <div className="w-full h-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center">
                                                            <MapPin className="w-12 h-12 text-teal-400" />
                                                       </div>
                                                  )}
                                                  {/* Status Badge */}
                                                  <div className="absolute top-2 right-2">
                                                       <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(field.status)}`}>
                                                            {getStatusText(field.status)}
                                                       </span>
                                                  </div>
                                             </div>

                                             {/* Field Info */}
                                             <div className="p-4 space-y-3">
                                                  <div>
                                                       <h3 className="font-semibold text-gray-900">{field.name}</h3>
                                                       <p className="text-sm text-gray-500">{field.complexName}</p>
                                                  </div>

                                                  <div className="flex items-center justify-between text-sm">
                                                       <span className="text-gray-500">Loại sân:</span>
                                                       <span className="font-medium">{field.typeName || "Chưa xác định"}</span>
                                                  </div>

                                                  <div className="flex items-center justify-between text-sm">
                                                       <span className="text-gray-500">Giá/giờ:</span>
                                                       <span className="font-medium text-teal-600 flex items-center">
                                                            <DollarSign className="w-4 h-4 mr-1" />
                                                            {formatCurrency(field.pricePerHour || 0)}
                                                       </span>
                                                  </div>

                                                  {/* Actions */}
                                                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                                       <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEdit(field)}
                                                            className="flex-1 text-xs rounded-xl text-blue-600 border-blue-200 hover:bg-blue-50"
                                                       >
                                                            <Edit className="w-3 h-3 mr-1" />
                                                            Sửa
                                                       </Button>
                                                       <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDelete(field.fieldId)}
                                                            className="text-red-600 border-red-200 hover:bg-red-50 rounded-xl"
                                                       >
                                                            <Trash2 className="w-3 h-3" />
                                                       </Button>
                                                  </div>
                                             </div>
                                        </Card>
                                   ))}
                              </div>

                              {/* Pagination for Fields */}
                              {fieldsTotalPages > 1 && (
                                   <div className="flex justify-center mt-6">
                                        <Pagination
                                             currentPage={fieldsPage}
                                             totalPages={fieldsTotalPages}
                                             onPageChange={handleFieldsPageChange}
                                             itemsPerPage={fieldsItemsPerPage}
                                             totalItems={fieldsTotalItems}
                                        />
                                   </div>
                              )}
                         </>
                    )}
               </section>

               {/* Modals */}
               <FieldFormModal
                    isOpen={isAddModalOpen || isEditModalOpen}
                    onClose={handleCloseFieldModal}
                    onSubmit={handleSubmit}
                    formData={formData}
                    setFormData={setFormData}
                    complexes={complexes}
                    fieldTypes={fieldTypes}
                    fieldStatuses={fieldStatuses}
                    bankAccounts={bankAccounts}
                    isEdit={isEditModalOpen}
                    onInputChange={handleInputChange}
                    onSelectType={(value) => {
                         const selectedType = fieldTypes.find(t => t.value === value);
                         setFormData(prev => ({
                              ...prev,
                              typeId: value,
                              size: selectedType?.size || ""
                         }));
                    }}
                    onSelectStatus={(value) => handleInputChange({ target: { name: "status", value } })}
                    onMainImageChange={handleMainImageChange}
                    onImageFilesChange={handleImageFilesChange}
                    onBankAccountChange={handleBankAccountChange}
                    onAddComplex={handleRequestCreateComplex}
                    onNavigateBankAccounts={handleNavigateBankAccounts}
               />

               <ComplexFormModal
                    isOpen={isAddComplexModalOpen || isEditComplexModalOpen}
                    onClose={handleCloseComplexModal}
                    onSubmit={handleComplexSubmit}
                    formData={complexFormData}
                    setFormData={setComplexFormData}
                    isEditing={isEditComplexModalOpen}
                    handleFieldChange={handleComplexFieldChange}
                    handleImageUpload={handleComplexImageUpload}
                    removeImage={removeComplexImage}
                    triggerImagePicker={triggerComplexImagePicker}
                    handleUploadAreaKeyDown={handleComplexUploadAreaKeyDown}
                    imageInputRef={complexImageInputRef}
                    imageUploading={complexImageUploading}
                    onAddressSelect={handleComplexAddressSelect}
               />

               {/* Demo Restricted Modal */}
               <DemoRestrictedModal
                    isOpen={showDemoRestrictedModal}
                    onClose={() => setShowDemoRestrictedModal(false)}
               />
          </div>
     );
};

export default FieldManagement;
