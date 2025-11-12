import React, { useState, useEffect, useCallback } from "react";
import {
     Plus,
     Edit,
     Trash2,
     MapPin,
     Save,
     DollarSign,
     Loader2,
     Building2,
     CheckCircle
} from "lucide-react";
import Swal from "sweetalert2";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button, Card, Modal, Input, Textarea } from "../../../shared/components/ui";
import OwnerLayout from "../layouts/OwnerLayout";
import { useAuth } from "../../../contexts/AuthContext";
import { DemoRestrictedModal } from "../../../shared";
import AddressPicker from "../../../shared/components/AddressPicker";
import {
     createField,
     createFieldComplex,
     fetchFieldsByComplex,
     updateField,
     deleteField,
     fetchFieldComplexes,
     createFieldPrice
} from "../../../shared/services/fields";
import { fetchTimeSlots } from "../../../shared/services/timeSlots";

const FieldManagement = ({ isDemo = false }) => {
     const { user, logout } = useAuth();
     const [isAddModalOpen, setIsAddModalOpen] = useState(false);
     const [isEditModalOpen, setIsEditModalOpen] = useState(false);
     const [isAddComplexModalOpen, setIsAddComplexModalOpen] = useState(false);
     const [showDemoRestrictedModal, setShowDemoRestrictedModal] = useState(false);
     const [loading, setLoading] = useState(true);
     const [fields, setFields] = useState([]);
     const [complexes, setComplexes] = useState([]);
     const [timeSlots, setTimeSlots] = useState([]);
     const [complexFormData, setComplexFormData] = useState({
          name: "",
          address: "",
          lat: null,
          lng: null,
          description: "",
          image: "",
     });
     const [formData, setFormData] = useState({
          complexId: "",
          name: "",
          typeId: "",
          size: "",
          grassType: "",
          description: "",
          image: "",
          pricePerHour: "",
          status: "Available",
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
                    const ownerComplexes = complexesData
                         .filter(
                              complex => complex.ownerId === user.id || complex.ownerId === Number(user.id)
                         )
                         .map(complex => ({
                              // Only keep fields from API response
                              complexId: complex.complexId,
                              ownerId: complex.ownerId,
                              name: complex.name,
                              address: complex.address,
                              description: complex.description || null,
                              image: complex.image || null,
                              status: complex.status,
                              createdAt: complex.createdAt,
                              ownerName: complex.ownerName || null,
                              fields: complex.fields || []
                         }));
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

     const handleComplexSubmit = async (e) => {
          e.preventDefault();
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }

          try {
               const newComplexResponse = await createFieldComplex({
                    ownerId: user?.id || user?.userId || 1,
                    name: complexFormData.name,
                    address: complexFormData.address,
                    description: complexFormData.description || "",
                    image: complexFormData.image || "",
                    status: "Active",
                    fields: [],
               });

               // Handle response - API may return array or single object
               let newComplex;
               if (Array.isArray(newComplexResponse)) {
                    newComplex = newComplexResponse[0];
               } else {
                    newComplex = newComplexResponse;
               }

               // Extract only fields from API response
               const normalizedComplex = {
                    complexId: newComplex.complexId,
                    ownerId: newComplex.ownerId,
                    name: newComplex.name,
                    address: newComplex.address,
                    description: newComplex.description || null,
                    image: newComplex.image || null,
                    status: newComplex.status,
                    createdAt: newComplex.createdAt,
                    ownerName: newComplex.ownerName || null,
                    fields: newComplex.fields || []
               };

               // Add new complex to the list with only API fields
               setComplexes(prev => [...prev, normalizedComplex]);

               // Show success message
               const result = await Swal.fire({
                    icon: 'success',
                    title: 'Tạo khu sân thành công!',
                    text: `Khu sân "${normalizedComplex.name}" đã được tạo thành công.`,
                    confirmButtonColor: '#10b981',
                    showCancelButton: true,
                    cancelButtonText: 'Đóng',
                    confirmButtonText: 'Thêm sân ngay',
                    timer: 5000
               });

               // Close complex modal and reset form
               setIsAddComplexModalOpen(false);
               resetComplexForm();

               // If user wants to add field immediately, open field modal
               if (result.isConfirmed) {
                    setFormData(prev => ({
                         ...prev,
                         complexId: normalizedComplex.complexId
                    }));
                    setIsAddModalOpen(true);
               } else {
                    loadData();
               }
          } catch (error) {
               console.error('Error creating complex:', error);
               const errorMessage = error.message || "Có lỗi xảy ra khi tạo khu sân";

               await Swal.fire({
                    icon: 'error',
                    title: 'Lỗi!',
                    html: `<p>${errorMessage}</p>${error.message?.includes('CORS') ? '<p class="text-xs mt-2 text-gray-500">Vui lòng kiểm tra cấu hình CORS trên backend.</p>' : ''}`,
                    confirmButtonColor: '#ef4444'
               });
          }
     };

     const handleSubmit = async (e) => {
          e.preventDefault();
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }

          try {
               if (!formData.complexId) {
                    await Swal.fire({
                         icon: 'warning',
                         title: 'Chưa chọn khu sân!',
                         text: 'Vui lòng chọn khu sân để thêm sân vào.',
                         confirmButtonColor: '#f59e0b'
                    });
                    return;
               }

               // Create or update field
               const fieldPayload = {
                    complexId: formData.complexId,
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

               // Show success message with SweetAlert2
               await Swal.fire({
                    icon: 'success',
                    title: isEditModalOpen ? 'Cập nhật thành công!' : 'Tạo sân thành công!',
                    text: isEditModalOpen
                         ? 'Thông tin sân đã được cập nhật.'
                         : `Sân "${formData.name}" đã được tạo thành công.`,
                    confirmButtonColor: '#10b981',
                    timer: 2000,
                    showConfirmButton: true
               });

               setIsAddModalOpen(false);
               setIsEditModalOpen(false);
               resetForm();
               loadData();
          } catch (error) {
               console.error('Error saving field:', error);
               const errorMessage = error.message || "Có lỗi xảy ra khi lưu sân";
               const errorDetails = error.details || "";

               await Swal.fire({
                    icon: 'error',
                    title: 'Lỗi!',
                    html: `<p>${errorMessage}</p>${errorDetails ? `<p class="text-sm mt-2">${errorDetails}</p>` : ''}${error.message?.includes('CORS') ? '<p class="text-xs mt-2 text-gray-500">Vui lòng kiểm tra cấu hình CORS trên backend.</p>' : ''}`,
                    confirmButtonColor: '#ef4444'
               });
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
               name: field.name,
               typeId: typeKey,
               size: field.size || "",
               grassType: field.grassType || "",
               description: field.description || "",
               image: field.image || "",
               pricePerHour: field.pricePerHour || "",
               status: field.status || "Available",
          });
          setIsEditModalOpen(true);
     };

     const handleDelete = async (fieldId) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          const result = await Swal.fire({
               title: 'Bạn có chắc chắn?',
               text: "Bạn không thể hoàn tác hành động này!",
               icon: 'warning',
               showCancelButton: true,
               confirmButtonColor: '#ef4444',
               cancelButtonColor: '#6b7280',
               confirmButtonText: 'Xóa',
               cancelButtonText: 'Hủy'
          });

          if (result.isConfirmed) {
               try {
                    await deleteField(fieldId);
                    await Swal.fire({
                         icon: 'success',
                         title: 'Đã xóa!',
                         text: 'Sân đã được xóa thành công.',
                         confirmButtonColor: '#10b981',
                         timer: 2000
                    });
                    loadData();
               } catch (error) {
                    console.error('Error deleting field:', error);
                    await Swal.fire({
                         icon: 'error',
                         title: 'Lỗi!',
                         text: error.message || "Có lỗi xảy ra khi xóa sân",
                         confirmButtonColor: '#ef4444'
                    });
               }
          }
     };

     const handleAddField = () => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          if (complexes.length === 0) {
               Swal.fire({
                    icon: 'info',
                    title: 'Chưa có khu sân!',
                    text: 'Vui lòng tạo khu sân trước khi thêm sân.',
                    confirmButtonColor: '#3b82f6',
                    showCancelButton: true,
                    cancelButtonText: 'Hủy',
                    confirmButtonText: 'Tạo khu sân',
               }).then((result) => {
                    if (result.isConfirmed) {
                         handleAddComplex();
                    }
               });
               return;
          }
          resetForm();
          setIsAddModalOpen(true);
     };

     const handleAddComplex = () => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          resetComplexForm();
          setIsAddComplexModalOpen(true);
     };

     const resetComplexForm = () => {
          setComplexFormData({
               name: "",
               address: "",
               lat: null,
               lng: null,
               description: "",
               image: "",
          });
     };

     const resetForm = () => {
          setFormData({
               complexId: "",
               name: "",
               typeId: "",
               size: "",
               grassType: "",
               description: "",
               image: "",
               pricePerHour: "",
               status: "Available",
          });
     };

     // Handle address selection from AddressPicker for complex
     const handleComplexAddressSelect = (locationData) => {
          setComplexFormData(prev => ({
               ...prev,
               address: locationData.address,
               lat: locationData.lat,
               lng: locationData.lng,
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

                         <div className="flex space-x-3">
                              <Button
                                   onClick={handleAddComplex}
                                   variant="outline"
                                   className="flex items-center space-x-2 rounded-2xl border-blue-200 text-blue-600 hover:bg-blue-50"
                              >
                                   <Building2 className="w-4 h-4" />
                                   <span>Thêm khu sân</span>
                              </Button>
                              <Button
                                   onClick={handleAddField}
                                   className="flex items-center space-x-2 rounded-2xl"
                              >
                                   <Plus className="w-4 h-4" />
                                   <span>Thêm sân mới</span>
                              </Button>
                         </div>
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
                              {/* Complex Selection - Required for new fields */}
                              {!isEditModalOpen && (
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                             <Building2 className="w-4 h-4 inline mr-1 text-blue-600" />
                                             Chọn khu sân <span className="text-red-500">*</span>
                                        </label>
                                        {complexes.length === 0 ? (
                                             <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                  <p className="text-sm text-yellow-800 mb-2">
                                                       Chưa có khu sân nào. Vui lòng tạo khu sân trước.
                                                  </p>
                                                  <Button
                                                       type="button"
                                                       onClick={() => {
                                                            setIsAddModalOpen(false);
                                                            handleAddComplex();
                                                       }}
                                                       variant="outline"
                                                       className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                                                  >
                                                       <Building2 className="w-4 h-4 mr-2" />
                                                       Tạo khu sân
                                                  </Button>
                                             </div>
                                        ) : (
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
                                        )}
                                   </div>
                              )}

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

                    {/* Add Complex Modal */}
                    <Modal
                         isOpen={isAddComplexModalOpen}
                         onClose={() => {
                              setIsAddComplexModalOpen(false);
                              resetComplexForm();
                         }}
                         title="Thêm khu sân mới"
                         className="max-w-2xl rounded-2xl shadow-lg px-3"
                    >
                         <form onSubmit={handleComplexSubmit} className="space-y-4">
                              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
                                   <p className="text-sm text-blue-800">
                                        <Building2 className="w-4 h-4 inline mr-1" />
                                        Tạo khu sân mới để quản lý các sân bóng của bạn
                                   </p>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Building2 className="w-4 h-4 inline mr-1 text-blue-600" />
                                        Tên khu sân <span className="text-red-500">*</span>
                                   </label>
                                   <Input
                                        name="name"
                                        value={complexFormData.name}
                                        onChange={(e) => setComplexFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Ví dụ: Sân bóng ABC, Khu thể thao XYZ..."
                                        required
                                        className="w-full"
                                   />
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <MapPin className="w-4 h-4 inline mr-1 text-green-600" />
                                        Địa chỉ khu sân <span className="text-red-500">*</span>
                                   </label>
                                   <AddressPicker
                                        value={complexFormData.address}
                                        onChange={(address) => setComplexFormData(prev => ({ ...prev, address }))}
                                        onLocationSelect={handleComplexAddressSelect}
                                        placeholder="Nhập địa chỉ hoặc chọn trên bản đồ"
                                   />
                                   {complexFormData.lat && complexFormData.lng && (
                                        <div className="mt-2 flex items-center text-xs text-gray-500 bg-green-50 p-2 rounded">
                                             <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                                             <span>Vị trí: {complexFormData.lat.toFixed(6)}, {complexFormData.lng.toFixed(6)}</span>
                                        </div>
                                   )}
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mô tả khu sân
                                   </label>
                                   <Textarea
                                        name="description"
                                        value={complexFormData.description}
                                        onChange={(e) => setComplexFormData(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Mô tả về khu sân, tiện ích, quy mô..."
                                        rows={3}
                                        className="w-full"
                                   />
                                   <p className="text-xs text-gray-500 mt-1">
                                        Mô tả chi tiết về khu sân sẽ giúp khách hàng hiểu rõ hơn
                                   </p>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Hình ảnh (URL)
                                   </label>
                                   <Input
                                        name="image"
                                        value={complexFormData.image}
                                        onChange={(e) => setComplexFormData(prev => ({ ...prev, image: e.target.value }))}
                                        placeholder="Nhập URL hình ảnh khu sân"
                                        className="w-full"
                                   />
                              </div>

                              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                   <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                             setIsAddComplexModalOpen(false);
                                             resetComplexForm();
                                        }}
                                   >
                                        Hủy
                                   </Button>
                                   <Button type="submit" className="rounded-2xl">
                                        <Save className="w-5 h-5 mr-2" />
                                        Tạo khu sân
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
