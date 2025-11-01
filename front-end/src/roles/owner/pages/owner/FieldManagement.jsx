import React, { useState, useEffect, useCallback } from "react";
import {
     Plus,
     Edit,
     Trash2,
     MapPin,
     Camera,
     Upload,
     Save,
     Star,
     Users,
     DollarSign,
     Calendar,
     Loader2
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button, Card, Modal, Input, Textarea } from "../../../../shared/components/ui";
import OwnerLayout from "../../../owner/layouts/owner/OwnerLayout";
import { useAuth } from "../../../../contexts/AuthContext";
import DemoRestrictedModal from "../../../../shared/components/DemoRestrictedModal";
import AddressPicker from "../../../../shared/components/AddressPicker";
import {
     createField,
     createFieldComplex,
     fetchFieldsByComplex,
     updateField,
     deleteField,
     fetchFieldComplexes,
     createFieldPrice
} from "../../../../shared/services/fields";
import { fetchTimeSlots } from "../../../../shared/services/timeSlots";

const FieldManagement = ({ isDemo = false }) => {
     const { user, logout } = useAuth();
     const [isAddModalOpen, setIsAddModalOpen] = useState(false);
     const [isEditModalOpen, setIsEditModalOpen] = useState(false);
     const [showDemoRestrictedModal, setShowDemoRestrictedModal] = useState(false);
     const [loading, setLoading] = useState(true);
     const [fields, setFields] = useState([]);
     const [complexes, setComplexes] = useState([]);
     const [timeSlots, setTimeSlots] = useState([]);
     const [formData, setFormData] = useState({
          complexId: "",
          complexName: "",
          complexAddress: "",
          complexLat: null,
          complexLng: null,
          complexDescription: "",
          complexImage: "",
          name: "",
          typeId: "",
          size: "",
          grassType: "",
          description: "",
          image: "",
          pricePerHour: "",
          status: "Available",
          createNewComplex: false,
     });

     // Map field types
     const fieldTypeMap = {
          "5vs5": 1,
          "7vs7": 2,
          "11vs11": 3,
     };

     const fieldTypes = [
          { value: "5vs5", label: "Sân 5 người", typeId: 1 },
          { value: "7vs7", label: "Sân 7 người", typeId: 2 },
          { value: "11vs11", label: "Sân 11 người", typeId: 3 },
     ];

     const fieldStatuses = [
          { value: "Available", label: "Có sẵn" },
          { value: "Maintenance", label: "Bảo trì" },
          { value: "Unavailable", label: "Không khả dụng" },
     ];

     const loadData = useCallback(async () => {
          try {
               setLoading(true);
               if (!isDemo && user?.id) {
                    // Fetch complexes owned by user
                    const complexesData = await fetchFieldComplexes();
                    const ownerComplexes = complexesData.filter(
                         complex => complex.ownerId === user.id || complex.ownerId === Number(user.id)
                    );
                    setComplexes(ownerComplexes);

                    // Fetch all fields from owner's complexes
                    const allFields = [];
                    for (const complex of ownerComplexes) {
                         try {
                              const complexFields = await fetchFieldsByComplex(complex.complexId);
                              allFields.push(...complexFields.map(f => ({
                                   ...f,
                                   complexName: complex.name,
                                   complexAddress: complex.address,
                              })));
                         } catch (error) {
                              console.error(`Error fetching fields for complex ${complex.complexId}:`, error);
                         }
                    }
                    setFields(allFields);

                    // Fetch time slots
                    const slotsResponse = await fetchTimeSlots();
                    if (slotsResponse.success) {
                         setTimeSlots(slotsResponse.data || []);
                    }
               }
          } catch (error) {
               console.error('Error loading data:', error);
          } finally {
               setLoading(false);
          }
     }, [user?.id, isDemo]);

     useEffect(() => {
          loadData();
     }, [loadData]);

     const handleInputChange = (e) => {
          const { name, value } = e.target;
          setFormData(prev => ({
               ...prev,
               [name]: value
          }));
     };

     const handleImageUpload = (e) => {
          const file = e.target.files?.[0];
          if (file) {
               // For now, we'll just store the file name/path
               // In production, you'd upload to a file server and get URL
               const reader = new FileReader();
               reader.onloadend = () => {
                    setFormData(prev => ({
                         ...prev,
                         image: reader.result || file.name
                    }));
               };
               reader.readAsDataURL(file);
          }
     };

     const handleSubmit = async (e) => {
          e.preventDefault();
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }

          try {
               let targetComplexId = formData.complexId;

               // If creating new complex
               if (formData.createNewComplex) {
                    const newComplex = await createFieldComplex({
                         ownerId: user?.id || user?.userId || 1,
                         name: formData.complexName,
                         address: formData.complexAddress,
                         description: formData.complexDescription || "",
                         image: formData.complexImage || "",
                         status: "Active",
                         fields: [],
                         // Note: API might need lat/lng if supported
                    });
                    targetComplexId = newComplex.complexId;
               }

               // Create or update field
               const fieldPayload = {
                    complexId: targetComplexId,
                    typeId: fieldTypeMap[formData.typeId] || parseInt(formData.typeId),
                    name: formData.name,
                    size: formData.size || "",
                    grassType: formData.grassType || "",
                    description: formData.description || "",
                    image: formData.image || "",
                    pricePerHour: parseFloat(formData.pricePerHour) || 0,
                    status: formData.status || "Available",
               };

               let createdField;
               if (isEditModalOpen && formData.fieldId) {
                    await updateField(formData.fieldId, fieldPayload);
                    createdField = { fieldId: formData.fieldId, ...fieldPayload };
               } else {
                    createdField = await createField(fieldPayload);
               }

               // Optionally create default field prices for all time slots
               if (timeSlots.length > 0 && formData.pricePerHour) {
                    try {
                         for (const slot of timeSlots) {
                              await createFieldPrice({
                                   fieldId: createdField.fieldId,
                                   slotId: slot.SlotID,
                                   price: parseFloat(formData.pricePerHour),
                              });
                         }
                    } catch (priceError) {
                         console.warn("Error creating field prices:", priceError);
                         // Continue even if price creation fails
                    }
               }

               alert(isEditModalOpen ? "Cập nhật sân thành công!" : "Tạo sân thành công!");
               setIsAddModalOpen(false);
               setIsEditModalOpen(false);
               resetForm();
               loadData();
          } catch (error) {
               console.error('Error saving field:', error);
               const errorMessage = error.message || "Có lỗi xảy ra khi lưu sân";
               const errorDetails = error.details || "";
               alert(`${errorMessage}${errorDetails ? '\n\n' + errorDetails : ''}\n\nNếu lỗi CORS, vui lòng kiểm tra:\n1. Backend đã cấu hình CORS cho phép localhost:3000\n2. Proxy đã được cấu hình trong setupProxy.js`);
          }
     };

     const handleEdit = (field) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          const typeKey = Object.keys(fieldTypeMap).find(
               key => fieldTypeMap[key] === field.typeId
          ) || "";
          
          setFormData({
               fieldId: field.fieldId,
               complexId: field.complexId,
               complexName: field.complexName || "",
               complexAddress: field.complexAddress || "",
               complexLat: null,
               complexLng: null,
               complexDescription: "",
               complexImage: "",
               name: field.name,
               typeId: typeKey,
               size: field.size || "",
               grassType: field.grassType || "",
               description: field.description || "",
               image: field.image || "",
               pricePerHour: field.pricePerHour || "",
               status: field.status || "Available",
               createNewComplex: false,
          });
          setIsEditModalOpen(true);
     };

     const handleDelete = async (fieldId) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          if (window.confirm("Bạn có chắc chắn muốn xóa sân này?")) {
               try {
                    await deleteField(fieldId);
                    alert("Xóa sân thành công!");
                    loadData();
               } catch (error) {
                    console.error('Error deleting field:', error);
                    alert(error.message || "Có lỗi xảy ra khi xóa sân");
               }
          }
     };

     const handleAddField = () => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          resetForm();
          setIsAddModalOpen(true);
     };

     const resetForm = () => {
          setFormData({
               complexId: "",
               complexName: "",
               complexAddress: "",
               complexLat: null,
               complexLng: null,
               complexDescription: "",
               complexImage: "",
               name: "",
               typeId: "",
               size: "",
               grassType: "",
               description: "",
               image: "",
               pricePerHour: "",
               status: "Available",
               createNewComplex: false,
          });
     };

     // Handle address selection from AddressPicker
     const handleAddressSelect = (locationData) => {
          setFormData(prev => ({
               ...prev,
               complexAddress: locationData.address,
               complexLat: locationData.lat,
               complexLng: locationData.lng,
          }));
     };

     const getStatusColor = (status) => {
          switch (status) {
               case 'Available': return 'bg-green-100 text-green-800';
               case 'Maintenance': return 'bg-yellow-100 text-yellow-800';
               case 'Unavailable': return 'bg-red-100 text-red-800';
               default: return 'bg-gray-100 text-gray-800';
          }
     };

     const getStatusText = (status) => {
          const statusObj = fieldStatuses.find(s => s.value === status);
          return statusObj ? statusObj.label : status;
     };

     const formatCurrency = (amount) => {
          return new Intl.NumberFormat('vi-VN', {
               style: 'currency',
               currency: 'VND'
          }).format(amount);
     };

     if (loading) {
          return (
               <OwnerLayout user={user} onLoggedOut={logout} isDemo={isDemo}>
                    <div className="flex items-center justify-center h-64">
                         <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                         <span className="ml-2 text-gray-600">Đang tải...</span>
                    </div>
               </OwnerLayout>
          );
     }

     return (
          <OwnerLayout user={user} onLoggedOut={logout} isDemo={isDemo}>
               <div className="space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                         <div>
                              <h1 className="text-3xl font-bold text-gray-900">Quản lý sân</h1>
                              <p className="text-gray-600 mt-1">Thêm, chỉnh sửa và quản lý thông tin sân bóng</p>
                         </div>

                         <Button
                              onClick={handleAddField}
                              className="flex items-center space-x-2 rounded-2xl"
                         >
                              <Plus className="w-4 h-4" />
                              <span>Thêm sân mới</span>
                         </Button>
                    </div>

                    {/* Fields Grid */}
                    {fields.length === 0 ? (
                         <Card className="p-12 text-center">
                              <p className="text-gray-500 mb-4">Chưa có sân nào. Hãy tạo sân đầu tiên!</p>
                              <Button onClick={handleAddField}>
                                   <Plus className="w-4 h-4 mr-2" />
                                   Thêm sân mới
                              </Button>
                         </Card>
                    ) : (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {fields.map((field) => (
                                   <Card key={field.fieldId} className="overflow-hidden hover:shadow-lg hover:scale-105 hover:border-teal-200 hover:bg-teal-50 transition-all duration-300 ease-in-out rounded-2xl">
                                        {/* Field Image */}
                                        <div className="h-48 bg-gradient-to-br from-green-400 to-blue-500 relative">
                                             {field.image ? (
                                                  <img src={field.image} alt={field.name} className="w-full h-full object-cover p-3 rounded-2xl" />
                                             ) : (
                                                  <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold">
                                                       {field.name}
                                                  </div>
                                             )}
                                             <div className="absolute top-4 right-4">
                                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(field.status)}`}>
                                                       {getStatusText(field.status)}
                                                  </span>
                                             </div>
                                        </div>

                                        {/* Field Info */}
                                        <div className="px-6 pb-6 pt-3">
                                             <div className="flex items-start justify-between">
                                                  <div className="flex-1">
                                                       <h3 className="text-xl font-bold text-gray-900">{field.name}</h3>
                                                       <p className="text-sm text-gray-600">{field.typeName || `Type ID: ${field.typeId}`}</p>
                                                       <p className="text-xs text-gray-500 mt-1">{field.complexName}</p>
                                                  </div>
                                                  <div className="flex space-x-2">
                                                       <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 transition-all duration-300 ease-in-out rounded-full hover:scale-105"
                                                            onClick={() => handleEdit(field)}
                                                       >
                                                            <Edit className="w-4 h-4" />
                                                       </Button>
                                                       <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDelete(field.fieldId)}
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 transition-all duration-300 ease-in-out rounded-full hover:scale-105"
                                                       >
                                                            <Trash2 className="w-4 h-4" />
                                                       </Button>
                                                  </div>
                                             </div>

                                             <div className="space-y-1 my-3">
                                                  {field.complexAddress && (
                                                       <div className="flex border border-teal-200 rounded-full p-1 items-center text-sm text-teal-600">
                                                            <MapPin className="w-4 h-4 mr-2" />
                                                            <span className="truncate">{field.complexAddress}</span>
                                                       </div>
                                                  )}
                                                  {field.size && (
                                                       <div className="text-sm text-gray-600">
                                                            Kích thước: {field.size}
                                                       </div>
                                                  )}
                                                  {field.pricePerHour > 0 && (
                                                       <div className="flex items-center font-bold text-lg text-red-500">
                                                            <DollarSign className="w-4 h-4 mr-1" />
                                                            <span>{formatCurrency(field.pricePerHour)}/giờ</span>
                                                       </div>
                                                  )}
                                             </div>

                                             {field.description && (
                                                  <p className="text-sm border-t border-teal-200 pt-2 text-gray-600 mb-4 line-clamp-2">
                                                       {field.description}
                                                  </p>
                                             )}
                                        </div>
                                   </Card>
                              ))}
                         </div>
                    )}

                    {/* Add/Edit Field Modal */}
                    <Modal
                         isOpen={isAddModalOpen || isEditModalOpen}
                         onClose={() => {
                              setIsAddModalOpen(false);
                              setIsEditModalOpen(false);
                              resetForm();
                         }}
                         title={isEditModalOpen ? "Chỉnh sửa sân" : "Thêm sân mới"}
                         className="max-w-2xl rounded-2xl shadow-lg px-3 max-h-[90vh] overflow-y-auto scrollbar-hide"
                    >
                         <form onSubmit={handleSubmit} className="space-y-4">
                              {/* Create New Complex Toggle */}
                              {!isEditModalOpen && (
                                   <div className="flex items-center space-x-2 pb-2 border-b">
                                        <input
                                             type="checkbox"
                                             id="createNewComplex"
                                             checked={formData.createNewComplex}
                                             onChange={(e) => setFormData(prev => ({ ...prev, createNewComplex: e.target.checked }))}
                                             className="rounded"
                                        />
                                        <label htmlFor="createNewComplex" className="text-sm font-medium text-gray-700">
                                             Tạo khu sân mới
                                        </label>
                                   </div>
                              )}

                              {/* Complex Selection or Creation */}
                              {formData.createNewComplex && !isEditModalOpen ? (
                                   <>
                                        <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-1">
                                                  Tên khu sân <span className="text-red-500">*</span>
                                             </label>
                                             <Input
                                                  name="complexName"
                                                  value={formData.complexName}
                                                  onChange={handleInputChange}
                                                  placeholder="Nhập tên khu sân"
                                                  required
                                             />
                                        </div>
                                        <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-1">
                                                  Địa chỉ khu sân <span className="text-red-500">*</span>
                                             </label>
                                             <AddressPicker
                                                  value={formData.complexAddress}
                                                  onChange={(address) => setFormData(prev => ({ ...prev, complexAddress: address }))}
                                                  onLocationSelect={handleAddressSelect}
                                                  placeholder="Nhập địa chỉ hoặc chọn trên bản đồ"
                                             />
                                             {formData.complexLat && formData.complexLng && (
                                                  <p className="text-xs text-gray-500 mt-1">
                                                       Vị trí: {formData.complexLat.toFixed(6)}, {formData.complexLng.toFixed(6)}
                                                  </p>
                                             )}
                                        </div>
                                        <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-1">
                                                  Mô tả khu sân
                                             </label>
                                             <Textarea
                                                  name="complexDescription"
                                                  value={formData.complexDescription}
                                                  onChange={handleInputChange}
                                                  placeholder="Mô tả về khu sân"
                                                  rows={2}
                                             />
                                        </div>
                                   </>
                              ) : !isEditModalOpen ? (
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Chọn khu sân <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                             name="complexId"
                                             value={formData.complexId}
                                             onChange={handleInputChange}
                                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                             required
                                        >
                                             <option value="">Chọn khu sân</option>
                                             {complexes.map((complex) => (
                                                  <option key={complex.complexId} value={complex.complexId}>
                                                       {complex.name} - {complex.address}
                                                  </option>
                                             ))}
                                        </select>
                                   </div>
                              ) : null}

                              {/* Field Information */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Tên sân <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                             name="name"
                                             value={formData.name}
                                             onChange={handleInputChange}
                                             placeholder="Nhập tên sân"
                                             required
                                        />
                                   </div>

                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Loại sân <span className="text-red-500">*</span>
                                        </label>
                                        <Select
                                             value={formData.typeId}
                                             onValueChange={(value) => setFormData(prev => ({ ...prev, typeId: value }))}
                                        >
                                             <SelectTrigger>
                                                  <SelectValue placeholder="Chọn loại sân" />
                                             </SelectTrigger>
                                             <SelectContent>
                                                  {fieldTypes.map(type => (
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
                                             Kích thước
                                        </label>
                                        <Input
                                             name="size"
                                             value={formData.size}
                                             onChange={handleInputChange}
                                             placeholder="Ví dụ: 20x40m"
                                        />
                                   </div>

                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Loại cỏ
                                        </label>
                                        <Input
                                             name="grassType"
                                             value={formData.grassType}
                                             onChange={handleInputChange}
                                             placeholder="Ví dụ: Cỏ nhân tạo"
                                        />
                                   </div>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mô tả
                                   </label>
                                   <Textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Mô tả về sân bóng"
                                        rows={3}
                                   />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Giá mỗi giờ (VND) <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                             name="pricePerHour"
                                             type="number"
                                             min="0"
                                             value={formData.pricePerHour}
                                             onChange={handleInputChange}
                                             placeholder="Nhập giá thuê"
                                             required
                                        />
                                   </div>

                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Trạng thái
                                        </label>
                                        <Select
                                             value={formData.status}
                                             onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                                        >
                                             <SelectTrigger>
                                                  <SelectValue placeholder="Chọn trạng thái" />
                                             </SelectTrigger>
                                             <SelectContent>
                                                  {fieldStatuses.map(status => (
                                                       <SelectItem key={status.value} value={status.value}>
                                                            {status.label}
                                                       </SelectItem>
                                                  ))}
                                             </SelectContent>
                                        </Select>
                                   </div>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Hình ảnh (URL)
                                   </label>
                                   <Input
                                        name="image"
                                        value={formData.image}
                                        onChange={handleInputChange}
                                        placeholder="Nhập URL hình ảnh"
                                   />
                                   <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="mt-2"
                                   />
                              </div>

                              <div className="flex justify-end space-x-3 pt-4">
                                   <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                             setIsAddModalOpen(false);
                                             setIsEditModalOpen(false);
                                             resetForm();
                                        }}
                                   >
                                        Hủy
                                   </Button>
                                   <Button type="submit" className="rounded-2xl">
                                        <Save className="w-5 h-5 mr-2" />
                                        {isEditModalOpen ? "Cập nhật sân" : "Lưu sân"}
                                   </Button>
                              </div>
                         </form>
                    </Modal>

                    {/* Demo Restricted Modal */}
                    <DemoRestrictedModal
                         isOpen={showDemoRestrictedModal}
                         onClose={() => setShowDemoRestrictedModal(false)}
                         featureName="Quản lý sân"
                    />
               </div>
          </OwnerLayout>
     );
};

export default FieldManagement;
