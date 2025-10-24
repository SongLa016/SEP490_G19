import React, { useState } from "react";
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
     Calendar
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button, Card, Modal, Input, Textarea } from "../../../../shared/components/ui";
import OwnerLayout from "../../../owner/layouts/owner/OwnerLayout";
import { useAuth } from "../../../../contexts/AuthContext";
import DemoRestrictedModal from "../../../../shared/components/DemoRestrictedModal";

const FieldManagement = ({ isDemo = false }) => {
     const { user, logout } = useAuth();
     const [isAddModalOpen, setIsAddModalOpen] = useState(false);
     const [isEditModalOpen, setIsEditModalOpen] = useState(false);
     const [showDemoRestrictedModal, setShowDemoRestrictedModal] = useState(false);
     const [formData, setFormData] = useState({
          name: "",
          type: "",
          address: "",
          description: "",
          images: [],
          status: "active",
          capacity: "",
          amenities: []
     });

     // Mock data - replace with actual API calls
     const fields = [
          {
               id: 1,
               name: "Sân A1",
               type: "Sân 7 người",
               address: "123 Đường ABC, Quận 1, TP.HCM",
               description: "Sân bóng đá 7 người chất lượng cao với cỏ nhân tạo",
               images: ["field1.jpg", "field2.jpg"],
               status: "active",
               capacity: 14,
               amenities: ["Cỏ nhân tạo", "Ánh sáng", "Nhà vệ sinh", "Chỗ đậu xe"],
               rating: 4.8,
               totalBookings: 45,
               revenue: 2250000
          },
          {
               id: 2,
               name: "Sân A2",
               type: "Sân 5 người",
               address: "456 Đường DEF, Quận 2, TP.HCM",
               description: "Sân bóng đá 5 người phù hợp cho các trận đấu nhỏ",
               images: ["field3.jpg"],
               status: "maintenance",
               capacity: 10,
               amenities: ["Cỏ nhân tạo", "Ánh sáng"],
               rating: 4.6,
               totalBookings: 38,
               revenue: 1900000
          },
          {
               id: 3,
               name: "Sân B1",
               type: "Sân 11 người",
               address: "789 Đường GHI, Quận 3, TP.HCM",
               description: "Sân bóng đá 11 người tiêu chuẩn quốc tế",
               images: ["field4.jpg", "field5.jpg"],
               status: "active",
               capacity: 22,
               amenities: ["Cỏ tự nhiên", "Ánh sáng", "Nhà vệ sinh", "Chỗ đậu xe", "Khán đài"],
               rating: 4.7,
               totalBookings: 42,
               revenue: 2100000
          }
     ];

     const fieldTypes = [
          "Sân 5 người",
          "Sân 7 người",
          "Sân 9 người",
          "Sân 11 người"
     ];

     const fieldStatuses = [
          { value: "active", label: "Hoạt động" },
          { value: "maintenance", label: "Bảo trì" },
          { value: "holiday", label: "Nghỉ lễ" },
          { value: "inactive", label: "Ngừng hoạt động" }
     ];

     const amenitiesOptions = [
          "Cỏ nhân tạo",
          "Cỏ tự nhiên",
          "Ánh sáng",
          "Nhà vệ sinh",
          "Chỗ đậu xe",
          "Khán đài",
          "Quầy bar",
          "Phòng thay đồ",
          "Máy lạnh",
          "WiFi"
     ];

     const handleInputChange = (e) => {
          const { name, value } = e.target;
          setFormData(prev => ({
               ...prev,
               [name]: value
          }));
     };

     const handleAmenityToggle = (amenity) => {
          setFormData(prev => ({
               ...prev,
               amenities: prev.amenities.includes(amenity)
                    ? prev.amenities.filter(a => a !== amenity)
                    : [...prev.amenities, amenity]
          }));
     };

     const handleImageUpload = (e) => {
          const files = Array.from(e.target.files || []);
          if (files.length === 0) return;

          const previews = files.map((file) => ({
               name: file.name,
               url: URL.createObjectURL(file),
               file
          }));

          setFormData((prev) => ({
               ...prev,
               images: [...prev.images, ...previews]
          }));
     };

     const handleRemoveImage = (indexToRemove) => {
          setFormData((prev) => {
               const next = [...prev.images];
               const removed = next.splice(indexToRemove, 1)[0];
               if (removed && removed.url) {
                    try { URL.revokeObjectURL(removed.url); } catch { }
               }
               return { ...prev, images: next };
          });
     };

     const handleSubmit = (e) => {
          e.preventDefault();
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          // Handle form submission
          console.log("Form submitted:", formData);
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          resetForm();
     };

     const handleEdit = (field) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          setFormData({
               name: field.name,
               type: field.type,
               address: field.address,
               description: field.description,
               images: field.images,
               status: field.status,
               capacity: field.capacity.toString(),
               amenities: field.amenities
          });
          setIsEditModalOpen(true);
     };

     const handleDelete = (fieldId) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          if (window.confirm("Bạn có chắc chắn muốn xóa sân này?")) {
               // Handle delete
               console.log("Delete field:", fieldId);
          }
     };

     const handleAddField = () => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          setIsAddModalOpen(true);
     };

     const resetForm = () => {
          setFormData({
               name: "",
               type: "",
               address: "",
               description: "",
               images: [],
               status: "active",
               capacity: "",
               amenities: []
          });
     };

     const getStatusColor = (status) => {
          switch (status) {
               case 'active': return 'bg-green-100 text-green-800';
               case 'maintenance': return 'bg-yellow-100 text-yellow-800';
               case 'holiday': return 'bg-blue-100 text-blue-800';
               case 'inactive': return 'bg-red-100 text-red-800';
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {fields.map((field) => (
                              <Card key={field.id} className="overflow-hidden hover:shadow-lg hover:scale-105 hover:border-teal-200 hover:bg-teal-50 transition-all duration-300 ease-in-out rounded-2xl">
                                   {/* Field Image */}
                                   <div className="h-48 bg-gradient-to-br from-green-400 to-blue-500 relative">
                                        <img src={field.images[0]} alt={field.name} className="w-full h-full object-cover p-3 rounded-2xl" />
                                        <div className="absolute top-4 right-4">
                                             <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(field.status)}`}>
                                                  {getStatusText(field.status)}
                                             </span>
                                        </div>
                                        <div className="absolute bottom-4 left-4 p-1 rounded-full bg-teal-50 border border-teal-200 text-yellow-500 shadow-lg">
                                             <div className="flex items-center space-x-1">
                                                  <Star className="w-4 h-4 fill-current" />
                                                  <span className="text-xs font-medium">{field.rating}</span>
                                             </div>
                                        </div>
                                   </div>

                                   {/* Field Info */}
                                   <div className="px-6 pb-6 pt-3">
                                        <div className="flex items-start justify-between">
                                             <div>
                                                  <h3 className="text-xl font-bold text-gray-900">{field.name}</h3>
                                                  <p className="text-sm text-gray-600">{field.type}</p>
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
                                                       onClick={() => handleDelete(field.id)}
                                                       className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 transition-all duration-300 ease-in-out rounded-full hover:scale-105"
                                                  >
                                                       <Trash2 className="w-4 h-4" />
                                                  </Button>
                                             </div>
                                        </div>

                                        <div className="space-y-1 my-2">
                                             <div className="flex border border-teal-200 rounded-full p-1 items-center  text-sm text-teal-600">
                                                  <MapPin className="w-4 h-4 mr-2" />
                                                  <span className="truncate">{field.address}</span>
                                             </div>
                                             <div className="flex  items-center  text-sm text-teal-600">
                                                  <Users className="w-4 h-4 mr-2" />
                                                  <span>Tối đa {field.capacity} người</span>
                                             </div>
                                             <div className="flex items-center justify-between">
                                                  <div className="flex items-center font-semibold text-sm text-yellow-500">
                                                       <Calendar className="w-4 h-4 mr-2" />
                                                       <span>{field.totalBookings} booking</span>
                                                  </div>
                                                  <div className="flex items-center font-bold text-lg text-red-500">
                                                       <DollarSign className="w-4 h-4 " />
                                                       <span>{formatCurrency(field.revenue)}</span>
                                                  </div>
                                             </div>
                                        </div>

                                        <p className="text-sm border-t border-teal-200 pt-2 text-gray-600 mb-4 line-clamp-2">
                                             {field.description}
                                        </p>

                                        <div className="flex flex-wrap gap-1">
                                             {field.amenities.slice(0, 3).map((amenity, index) => (
                                                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                                       {amenity}
                                                  </span>
                                             ))}
                                             {field.amenities.length > 3 && (
                                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                                       +{field.amenities.length - 3} khác
                                                  </span>
                                             )}
                                        </div>
                                   </div>
                              </Card>
                         ))}
                    </div>

                    {/* Add Field Modal */}
                    <Modal
                         isOpen={isAddModalOpen}
                         onClose={() => {
                              setIsAddModalOpen(false);
                              resetForm();
                         }}
                         title="Thêm sân mới"
                         className="max-w-2xl rounded-2xl shadow-lg px-3 max-h-[90vh] overflow-y-auto scrollbar-hide"
                    >

                         <form onSubmit={handleSubmit} className="space-y-2.5">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                             Loại sân <span className="text-red-500">*</span>
                                        </label>
                                        <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                                             <SelectTrigger>
                                                  <SelectValue placeholder="Chọn loại sân" />
                                             </SelectTrigger>
                                             <SelectContent>
                                                  {fieldTypes.map(type => (
                                                       <SelectItem key={type} value={type}>{type}</SelectItem>
                                                  ))}
                                             </SelectContent>
                                        </Select>
                                   </div>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Địa chỉ <span className="text-red-500">*</span>
                                   </label>
                                   <Input
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="Nhập địa chỉ sân"
                                        required
                                   />
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mô tả
                                   </label>
                                   <Textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Mô tả về sân bóng"
                                        rows={2}
                                   />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                             Sức chứa tối đa <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                             name="capacity"
                                             type="number"
                                             value={formData.capacity}
                                             onChange={handleInputChange}
                                             placeholder="Số người"
                                             required
                                        />
                                   </div>

                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                             Trạng thái
                                        </label>
                                        <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                                             <SelectTrigger>
                                                  <SelectValue placeholder="Chọn trạng thái" />
                                             </SelectTrigger>
                                             <SelectContent>
                                                  {fieldStatuses.map(status => (
                                                       <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                                                  ))}
                                             </SelectContent>
                                        </Select>
                                   </div>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tiện ích
                                   </label>
                                   <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {amenitiesOptions.map(amenity => (
                                             <label key={amenity} className="flex items-center space-x-2">
                                                  <input
                                                       type="checkbox"
                                                       checked={formData.amenities.includes(amenity)}
                                                       onChange={() => handleAmenityToggle(amenity)}
                                                       className="rounded border-gray-300"
                                                  />
                                                  <span className="text-sm text-gray-700">{amenity}</span>
                                             </label>
                                        ))}
                                   </div>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Hình ảnh
                                   </label>
                                   <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-600 mb-2">Kéo thả hình ảnh vào đây hoặc click để chọn</p>
                                        <input
                                             type="file"
                                             multiple
                                             accept="image/*"
                                             onChange={handleImageUpload}
                                             className="hidden"
                                             id="image-upload"
                                        />
                                        <Button
                                             type="button"
                                             variant="outline"
                                             onClick={() => document.getElementById('image-upload').click()}
                                        >
                                             <Camera className="w-4 h-4 mr-2" />
                                             Chọn hình ảnh
                                        </Button>
                                   </div>
                                   {formData.images.length > 0 && (
                                        <div className="mt-3">
                                             <p className="text-sm text-gray-600 mb-2">Xem trước:</p>
                                             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                                  {formData.images.map((img, index) => {
                                                       const src = typeof img === 'string' ? img : (img.url || '');
                                                       const label = typeof img === 'string' ? img : (img.name || 'Ảnh mới');
                                                       return (
                                                            <div key={index} className="relative group">
                                                                 <img src={src} alt={label} className="w-full h-24 object-cover rounded-lg border border-slate-200 shadow-sm" />
                                                                 <button
                                                                      type="button"
                                                                      onClick={() => handleRemoveImage(index)}
                                                                      className="absolute -top-2 -right-2 bg-white border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 rounded-full w-7 h-7 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition"
                                                                 >
                                                                      <Trash2 className="w-4 h-4" />
                                                                 </button>
                                                            </div>
                                                       );
                                                  })}
                                             </div>
                                        </div>
                                   )}
                              </div>

                              <div className="flex justify-end space-x-3 pt-4">
                                   <Button type="submit" className="rounded-2xl">
                                        <Save className="w-5 h-5 mr-2" />
                                        Lưu sân
                                   </Button>
                              </div>
                         </form>
                    </Modal>

                    {/* Edit Field Modal */}
                    <Modal
                         isOpen={isEditModalOpen}
                         onClose={() => {
                              setIsEditModalOpen(false);
                              resetForm();
                         }}
                         title="Chỉnh sửa sân"
                         className="max-w-2xl px-3 max-h-[90vh] overflow-y-auto scrollbar-hide"
                    >

                         <form onSubmit={handleSubmit} className="space-y-4">
                              {/* Same form fields as Add Modal */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                             Loại sân <span className="text-red-500">*</span>
                                        </label>
                                        <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                                             <SelectTrigger>
                                                  <SelectValue placeholder="Chọn loại sân" />
                                             </SelectTrigger>
                                             <SelectContent>
                                                  {fieldTypes.map(type => (
                                                       <SelectItem key={type} value={type}>{type}</SelectItem>
                                                  ))}
                                             </SelectContent>
                                        </Select>
                                   </div>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Địa chỉ <span className="text-red-500">*</span>
                                   </label>
                                   <Input
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="Nhập địa chỉ sân"
                                        required
                                   />
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
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

                              {/* Images - Edit */}
                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Hình ảnh
                                   </label>
                                   <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-600 mb-2">Kéo thả hình ảnh vào đây hoặc click để chọn</p>
                                        <input
                                             type="file"
                                             multiple
                                             accept="image/*"
                                             onChange={handleImageUpload}
                                             className="hidden"
                                             id="image-upload-edit"
                                        />
                                        <Button
                                             type="button"
                                             variant="outline"
                                             onClick={() => document.getElementById('image-upload-edit').click()}
                                        >
                                             <Camera className="w-4 h-4 mr-2" />
                                             Chọn hình ảnh
                                        </Button>
                                   </div>
                                   {formData.images.length > 0 && (
                                        <div className="mt-3">
                                             <p className="text-sm text-gray-600 mb-2">Xem trước:</p>
                                             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                                  {formData.images.map((img, index) => {
                                                       const src = typeof img === 'string' ? img : (img.url || '');
                                                       const label = typeof img === 'string' ? img : (img.name || 'Ảnh mới');
                                                       return (
                                                            <div key={index} className="relative group">
                                                                 <img src={src} alt={label} className="w-full h-24 object-cover rounded-lg border border-slate-200 shadow-sm" />
                                                                 <button
                                                                      type="button"
                                                                      onClick={() => handleRemoveImage(index)}
                                                                      className="absolute -top-2 -right-2 bg-white border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 rounded-full w-7 h-7 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition"
                                                                 >
                                                                      <Trash2 className="w-4 h-4" />
                                                                 </button>
                                                            </div>
                                                       );
                                                  })}
                                             </div>
                                        </div>
                                   )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                             Sức chứa tối đa <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                             name="capacity"
                                             type="number"
                                             value={formData.capacity}
                                             onChange={handleInputChange}
                                             placeholder="Số người"
                                             required
                                        />
                                   </div>

                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                             Trạng thái
                                        </label>
                                        <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                                             <SelectTrigger>
                                                  <SelectValue placeholder="Chọn trạng thái" />
                                             </SelectTrigger>
                                             <SelectContent>
                                                  {fieldStatuses.map(status => (
                                                       <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                                                  ))}
                                             </SelectContent>
                                        </Select>
                                   </div>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tiện ích
                                   </label>
                                   <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {amenitiesOptions.map(amenity => (
                                             <label key={amenity} className="flex items-center space-x-2">
                                                  <input
                                                       type="checkbox"
                                                       checked={formData.amenities.includes(amenity)}
                                                       onChange={() => handleAmenityToggle(amenity)}
                                                       className="rounded border-gray-300"
                                                  />
                                                  <span className="text-sm text-gray-700">{amenity}</span>
                                             </label>
                                        ))}
                                   </div>
                              </div>

                              <div className="flex justify-end space-x-3 pt-4">
                                   <Button type="submit" className="rounded-2xl">
                                        <Save className="w-5 h-5 mr-2" />
                                        Cập nhật sân
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
