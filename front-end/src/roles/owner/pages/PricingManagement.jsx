import React, { useState } from "react";
import {
     DollarSign,
     Clock,
     Calendar,
     Plus,
     Edit,
     Trash2,
     Save,
     TrendingUp,
     Settings,
     CheckSquare,
     FilterIcon
} from "lucide-react";
import { Button, Card, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, DatePicker, Modal, Input, Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "../../../shared/components/ui";
import OwnerLayout from "../layouts/OwnerLayout";
import { useAuth } from "../../../contexts/AuthContext";
import { DemoRestrictedModal } from "../../../shared";

const PricingManagement = ({ isDemo = false }) => {
     const { user, logout } = useAuth();
     const [selectedField, setSelectedField] = useState("Sân A1");
     const [selectedDate, setSelectedDate] = useState("");
     const [keyword, setKeyword] = useState("");
     const [filterDayType, setFilterDayType] = useState("");
     const [isAddModalOpen, setIsAddModalOpen] = useState(false);
     const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
     const [isEditModalOpen, setIsEditModalOpen] = useState(false);
     const [showDemoRestrictedModal, setShowDemoRestrictedModal] = useState(false);
     const [editingPrice, setEditingPrice] = useState(null);
     const [formData, setFormData] = useState({
          timeSlot: "",
          price: "",
          dayType: "weekday",
          isActive: true
     });
     const [bulkFormData, setBulkFormData] = useState({
          selectedTimeSlots: [],
          price: "",
          dayType: "weekday",
          isActive: true
     });

     // Mock data - replace with actual API calls
     const fields = [
          { value: "Sân A1", label: "Sân A1" },
          { value: "Sân A2", label: "Sân A2" },
          { value: "Sân B1", label: "Sân B1" },
          { value: "Sân B2", label: "Sân B2" },
          { value: "Sân C1", label: "Sân C1" }
     ];

     const timeSlots = [
          "06:00-08:00", "08:00-10:00", "10:00-12:00", "12:00-14:00",
          "14:00-16:00", "16:00-18:00", "18:00-20:00", "20:00-22:00", "22:00-24:00"
     ];

     const dayTypes = [
          { value: "weekday", label: "Ngày thường" },
          { value: "weekend", label: "Cuối tuần" },
          { value: "holiday", label: "Ngày lễ" }
     ];

     const pricingData = [
          {
               id: 1,
               field: "Sân A1",
               timeSlot: "18:00-20:00",
               dayType: "weekday",
               price: 500000,
               isActive: true,
               bookings: 45,
               revenue: 2250000
          },
          {
               id: 2,
               field: "Sân A1",
               timeSlot: "20:00-22:00",
               dayType: "weekday",
               price: 600000,
               isActive: true,
               bookings: 38,
               revenue: 2280000
          },
          {
               id: 3,
               field: "Sân A1",
               timeSlot: "18:00-20:00",
               dayType: "weekend",
               price: 700000,
               isActive: true,
               bookings: 42,
               revenue: 2940000
          },
          {
               id: 4,
               field: "Sân A1",
               timeSlot: "20:00-22:00",
               dayType: "weekend",
               price: 800000,
               isActive: true,
               bookings: 35,
               revenue: 2800000
          },
          {
               id: 5,
               field: "Sân A2",
               timeSlot: "16:00-18:00",
               dayType: "weekday",
               price: 450000,
               isActive: true,
               bookings: 28,
               revenue: 1260000
          },
          {
               id: 6,
               field: "Sân A2",
               timeSlot: "18:00-20:00",
               dayType: "weekday",
               price: 550000,
               isActive: false,
               bookings: 0,
               revenue: 0
          }
     ];

     const handleInputChange = (e) => {
          const { name, value, type, checked } = e.target;
          setFormData(prev => ({
               ...prev,
               [name]: type === 'checkbox' ? checked : value
          }));
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

     const handleEdit = (price) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          setEditingPrice(price);
          setFormData({
               timeSlot: price.timeSlot,
               price: price.price.toString(),
               dayType: price.dayType,
               isActive: price.isActive
          });
          setIsEditModalOpen(true);
     };

     const handleDelete = (priceId) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          if (window.confirm("Bạn có chắc chắn muốn xóa giá này?")) {
               // Handle delete
               console.log("Delete price:", priceId);
          }
     };

     const resetForm = () => {
          setFormData({
               timeSlot: "",
               price: "",
               dayType: "weekday",
               isActive: true
          });
          setEditingPrice(null);
     };

     const resetBulkForm = () => {
          setBulkFormData({
               selectedTimeSlots: [],
               price: "",
               dayType: "weekday",
               isActive: true
          });
     };

     const handleBulkTimeSlotToggle = (timeSlot) => {
          setBulkFormData(prev => ({
               ...prev,
               selectedTimeSlots: prev.selectedTimeSlots.includes(timeSlot)
                    ? prev.selectedTimeSlots.filter(slot => slot !== timeSlot)
                    : [...prev.selectedTimeSlots, timeSlot]
          }));
     };

     const handleBulkSubmit = (e) => {
          e.preventDefault();
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          // Handle bulk form submission
          console.log("Bulk form submitted:", bulkFormData);
          setIsBulkModalOpen(false);
          resetBulkForm();
     };

     const handleAddPrice = () => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          setIsAddModalOpen(true);
     };

     const handleBulkSetup = () => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          setIsBulkModalOpen(true);
     };

     const filteredPricing = pricingData.filter(price => {
          const matchesField = !selectedField || price.field === selectedField;
          const matchesDayType = !filterDayType || price.dayType === filterDayType;
          const matchesKeyword = !keyword || price.field.toLowerCase().includes(keyword.toLowerCase());
          const matchesDate = !selectedDate || true; // Date filter logic can be added later
          return matchesField && matchesDayType && matchesKeyword && matchesDate;
     });

     const formatCurrency = (amount) => {
          return new Intl.NumberFormat('vi-VN', {
               style: 'currency',
               currency: 'VND'
          }).format(amount);
     };

     const getDayTypeText = (dayType) => {
          const dayTypeObj = dayTypes.find(d => d.value === dayType);
          return dayTypeObj ? dayTypeObj.label : dayType;
     };

     const getDayTypeColor = (dayType) => {
          switch (dayType) {
               case 'weekday': return 'bg-blue-100 text-blue-800';
               case 'weekend': return 'bg-green-100 text-green-800';
               case 'holiday': return 'bg-red-100 text-red-800';
               default: return 'bg-gray-100 text-gray-800';
          }
     };

     return (
          <OwnerLayout user={user} onLoggedOut={logout} isDemo={isDemo}>
               <div className="space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                         <div>
                              <h1 className="text-3xl font-bold text-gray-900">Quản lý giá sân</h1>
                              <p className="text-gray-600 mt-1">Thiết lập giá theo khung giờ và loại ngày</p>
                         </div>

                         <div className="flex items-center space-x-3">
                              <Button
                                   variant="outline"
                                   className="rounded-2xl"
                                   onClick={handleBulkSetup}
                              >
                                   <Settings className="w-4 h-4 mr-2" />
                                   Setup hàng loạt
                              </Button>

                              <Button
                                   onClick={handleAddPrice}
                                   className="flex items-center space-x-2 rounded-2xl"
                              >
                                   <Plus className="w-4 h-4" />
                                   <span>Thêm giá mới</span>
                              </Button>
                         </div>
                    </div>

                    {/* Filters */}
                    <Card className="p-6 rounded-2xl shadow-lg">
                         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Chọn sân
                                   </label>
                                   <Select value={selectedField} onValueChange={setSelectedField} >
                                        <SelectTrigger className="rounded-2xl">
                                             <SelectValue placeholder="Chọn sân" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             {fields.map(field => (
                                                  <SelectItem key={field.value} value={field.value}>
                                                       {field.label}
                                                  </SelectItem>
                                             ))}
                                        </SelectContent>
                                   </Select>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ngày
                                   </label>
                                   <DatePicker
                                        value={selectedDate}
                                        onChange={setSelectedDate}
                                        placeholder="Chọn ngày"
                                        minDate={new Date().toISOString().split('T')[0]}
                                   />
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">Từ khóa</label>
                                   <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} className="rounded-2xl" placeholder="Tìm theo sân..." />
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">Loại ngày</label>
                                   <Select value={filterDayType} onValueChange={setFilterDayType}>
                                        <SelectTrigger className="rounded-2xl">
                                             <SelectValue placeholder="Tất cả" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             {dayTypes.map(d => (
                                                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                             ))}
                                        </SelectContent>
                                   </Select>
                              </div>
                         </div>

                         <div className="flex items-end justify-end gap-3 mt-4">
                              <Button
                                   variant="outline"
                                   onClick={() => {
                                        setSelectedField("");
                                        setSelectedDate("");
                                        setKeyword("");
                                        setFilterDayType("");
                                   }}
                                   className="rounded-2xl items-center justify-center"
                              >
                                   <FilterIcon className="w-4 h-4 mr-2" /> Xóa bộ lọc
                              </Button>
                         </div>
                    </Card>

                    {/* Pricing Table */}
                    <Card className="overflow-hidden rounded-2xl shadow-lg">
                         <Table>
                              <TableHeader>
                                   <TableRow className="bg-teal-700">
                                        <TableHead className="text-white" >Sân</TableHead>
                                        <TableHead className="text-white" >Khung giờ</TableHead>
                                        <TableHead className="text-white" >Loại ngày</TableHead>
                                        <TableHead className="text-white" >Giá</TableHead>
                                        <TableHead className="text-white" >Trạng thái</TableHead>
                                        <TableHead className="text-white" >Thống kê</TableHead>
                                        <TableHead className="text-white" >Thao tác</TableHead>
                                   </TableRow>
                              </TableHeader>
                              <TableBody>
                                   {filteredPricing.map((price) => (
                                        <TableRow key={price.id} className="hover:bg-slate-50">
                                             <TableCell className="text-sm font-medium text-gray-900">{price.field}</TableCell>
                                             <TableCell className="text-sm text-gray-900">{price.timeSlot}</TableCell>
                                             <TableCell>
                                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDayTypeColor(price.dayType)}`}>
                                                       {getDayTypeText(price.dayType)}
                                                  </span>
                                             </TableCell>
                                             <TableCell className="text-sm font-medium text-gray-900">{formatCurrency(price.price)}</TableCell>
                                             <TableCell>
                                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${price.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                       {price.isActive ? 'Hoạt động' : 'Tạm dừng'}
                                                  </span>
                                             </TableCell>
                                             <TableCell className="text-sm text-gray-900">
                                                  <div>
                                                       <div>{price.bookings} booking</div>
                                                       <div className="text-xs text-gray-500">{formatCurrency(price.revenue)}</div>
                                                  </div>
                                             </TableCell>
                                             <TableCell className="text-sm font-medium">
                                                  <div className="flex items-center space-x-2">
                                                       <Button variant="ghost" size="sm" onClick={() => handleEdit(price)}>
                                                            <Edit className="w-4 h-4" />
                                                       </Button>
                                                       <Button variant="ghost" size="sm" onClick={() => handleDelete(price.id)} className="text-red-600 hover:text-red-700">
                                                            <Trash2 className="w-4 h-4" />
                                                       </Button>
                                                  </div>
                                             </TableCell>
                                        </TableRow>
                                   ))}
                              </TableBody>
                         </Table>
                         {filteredPricing.length === 0 && (
                              <div className="text-center py-12">
                                   <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                   <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có giá nào</h3>
                                   <p className="text-gray-500">Hãy thêm giá cho các khung giờ của sân.</p>
                              </div>
                         )}
                    </Card>

                    {/* Pricing Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <Card className="p-6 rounded-2xl shadow-lg">
                              <div className="flex items-center">
                                   <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                        <TrendingUp className="w-6 h-6 text-green-600" />
                                   </div>
                                   <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                             {formatCurrency(filteredPricing.reduce((sum, price) => sum + price.revenue, 0))}
                                        </p>
                                   </div>
                              </div>
                         </Card>

                         <Card className="p-6 rounded-2xl shadow-lg">
                              <div className="flex items-center">
                                   <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Calendar className="w-6 h-6 text-blue-600" />
                                   </div>
                                   <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Tổng booking</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                             {filteredPricing.reduce((sum, price) => sum + price.bookings, 0)}
                                        </p>
                                   </div>
                              </div>
                         </Card>

                         <Card className="p-6 rounded-2xl shadow-lg">
                              <div className="flex items-center">
                                   <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <Clock className="w-6 h-6 text-purple-600" />
                                   </div>
                                   <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Khung giờ</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                             {filteredPricing.length}
                                        </p>
                                   </div>
                              </div>
                         </Card>
                    </div>

                    {/* Bulk Pricing Modal */}
                    <Modal
                         isOpen={isBulkModalOpen}
                         onClose={() => {
                              setIsBulkModalOpen(false);
                              resetBulkForm();
                         }}
                         title="Setup giá hàng loạt"
                         className="max-w-2xl"
                    >
                         <form onSubmit={handleBulkSubmit} className="space-y-4">
                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Sân *
                                   </label>
                                   <Select value={selectedField} onValueChange={setSelectedField}>
                                        <SelectTrigger>
                                             <SelectValue placeholder="Chọn sân" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             {fields.map(field => (
                                                  <SelectItem key={field.value} value={field.value}>
                                                       {field.label}
                                                  </SelectItem>
                                             ))}
                                        </SelectContent>
                                   </Select>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Chọn khung giờ *
                                   </label>
                                   <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                                        {timeSlots.map(slot => (
                                             <label key={slot} className="flex items-center space-x-2 cursor-pointer">
                                                  <input
                                                       type="checkbox"
                                                       checked={bulkFormData.selectedTimeSlots.includes(slot)}
                                                       onChange={() => handleBulkTimeSlotToggle(slot)}
                                                       className="rounded border-gray-300"
                                                  />
                                                  <span className="text-sm text-gray-700">{slot}</span>
                                             </label>
                                        ))}
                                   </div>
                                   <p className="text-xs text-gray-500 mt-1">
                                        Đã chọn: {bulkFormData.selectedTimeSlots.length} khung giờ
                                   </p>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Loại ngày *
                                   </label>
                                   <Select value={bulkFormData.dayType} onValueChange={(value) => setBulkFormData(prev => ({ ...prev, dayType: value }))}>
                                        <SelectTrigger>
                                             <SelectValue placeholder="Chọn loại ngày" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             {dayTypes.map(day => (
                                                  <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
                                             ))}
                                        </SelectContent>
                                   </Select>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Giá (VNĐ) *
                                   </label>
                                   <Input
                                        name="price"
                                        type="number"
                                        value={bulkFormData.price}
                                        onChange={(e) => setBulkFormData(prev => ({ ...prev, price: e.target.value }))}
                                        placeholder="Nhập giá"
                                        required
                                   />
                              </div>

                              <div className="flex items-center">
                                   <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={bulkFormData.isActive}
                                        onChange={(e) => setBulkFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                        className="rounded border-gray-300"
                                   />
                                   <label className="ml-2 text-sm text-gray-700">
                                        Kích hoạt giá này
                                   </label>
                              </div>

                              <div className="flex justify-end space-x-3 pt-4">
                                   <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                             setIsBulkModalOpen(false);
                                             resetBulkForm();
                                        }}
                                   >
                                        Hủy
                                   </Button>
                                   <Button type="submit" disabled={bulkFormData.selectedTimeSlots.length === 0}>
                                        <CheckSquare className="w-4 h-4 mr-2" />
                                        Tạo {bulkFormData.selectedTimeSlots.length} giá
                                   </Button>
                              </div>
                         </form>
                    </Modal>

                    {/* Add Price Modal */}
                    <Modal
                         isOpen={isAddModalOpen}
                         onClose={() => {
                              setIsAddModalOpen(false);
                              resetForm();
                         }}
                         title="Thêm giá mới"
                    >

                         <form onSubmit={handleSubmit} className="space-y-4">
                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Sân *
                                   </label>
                                   <Select value={selectedField} onValueChange={setSelectedField}>
                                        <SelectTrigger>
                                             <SelectValue placeholder="Chọn sân" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             {fields.map(field => (
                                                  <SelectItem key={field.value} value={field.value}>
                                                       {field.label}
                                                  </SelectItem>
                                             ))}
                                        </SelectContent>
                                   </Select>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Khung giờ *
                                   </label>
                                   <Select value={formData.timeSlot} onValueChange={(value) => setFormData(prev => ({ ...prev, timeSlot: value }))}>
                                        <SelectTrigger>
                                             <SelectValue placeholder="Chọn khung giờ" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             {timeSlots.map(slot => (
                                                  <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                                             ))}
                                        </SelectContent>
                                   </Select>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Loại ngày *
                                   </label>
                                   <Select value={formData.dayType} onValueChange={(value) => setFormData(prev => ({ ...prev, dayType: value }))}>
                                        <SelectTrigger>
                                             <SelectValue placeholder="Chọn loại ngày" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             {dayTypes.map(day => (
                                                  <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
                                             ))}
                                        </SelectContent>
                                   </Select>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Giá (VNĐ) *
                                   </label>
                                   <Input
                                        name="price"
                                        type="number"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        placeholder="Nhập giá"
                                        required
                                   />
                              </div>

                              <div className="flex items-center">
                                   <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                        className="rounded border-gray-300"
                                   />
                                   <label className="ml-2 text-sm text-gray-700">
                                        Kích hoạt giá này
                                   </label>
                              </div>

                              <div className="flex justify-end space-x-3 pt-4">
                                   <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                             setIsAddModalOpen(false);
                                             resetForm();
                                        }}
                                   >
                                        Hủy
                                   </Button>
                                   <Button type="submit">
                                        <Save className="w-4 h-4 mr-2" />
                                        Lưu giá
                                   </Button>
                              </div>
                         </form>
                    </Modal>

                    {/* Edit Price Modal */}
                    <Modal
                         isOpen={isEditModalOpen}
                         onClose={() => {
                              setIsEditModalOpen(false);
                              resetForm();
                         }}
                         title="Chỉnh sửa giá"
                    >

                         <form onSubmit={handleSubmit} className="space-y-4">
                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Sân
                                   </label>
                                   <Input
                                        value={editingPrice?.field || ""}
                                        disabled
                                        className="bg-gray-50"
                                   />
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Khung giờ *
                                   </label>
                                   <Select value={formData.timeSlot} onValueChange={(value) => setFormData(prev => ({ ...prev, timeSlot: value }))}>
                                        <SelectTrigger>
                                             <SelectValue placeholder="Chọn khung giờ" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             {timeSlots.map(slot => (
                                                  <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                                             ))}
                                        </SelectContent>
                                   </Select>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Loại ngày *
                                   </label>
                                   <Select value={formData.dayType} onValueChange={(value) => setFormData(prev => ({ ...prev, dayType: value }))}>
                                        <SelectTrigger>
                                             <SelectValue placeholder="Chọn loại ngày" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             {dayTypes.map(day => (
                                                  <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
                                             ))}
                                        </SelectContent>
                                   </Select>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Giá (VNĐ) *
                                   </label>
                                   <Input
                                        name="price"
                                        type="number"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        placeholder="Nhập giá"
                                        required
                                   />
                              </div>

                              <div className="flex items-center">
                                   <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                        className="rounded border-gray-300"
                                   />
                                   <label className="ml-2 text-sm text-gray-700">
                                        Kích hoạt giá này
                                   </label>
                              </div>

                              <div className="flex justify-end space-x-3 pt-4">
                                   <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                             setIsEditModalOpen(false);
                                             resetForm();
                                        }}
                                   >
                                        Hủy
                                   </Button>
                                   <Button type="submit">
                                        <Save className="w-4 h-4 mr-2" />
                                        Cập nhật giá
                                   </Button>
                              </div>
                         </form>
                    </Modal>

                    {/* Demo Restricted Modal */}
                    <DemoRestrictedModal
                         isOpen={showDemoRestrictedModal}
                         onClose={() => setShowDemoRestrictedModal(false)}
                         featureName="Quản lý giá sân"
                    />
               </div>
          </OwnerLayout>
     );
};

export default PricingManagement;
