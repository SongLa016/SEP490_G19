import { useState, useEffect, useCallback } from "react";
import {
     DollarSign,
     Clock,
     Plus,
     Edit,
     Trash2,
     Save,
     Settings,
     CheckSquare,
     FilterIcon,
     Loader2
} from "lucide-react";
import { Button, Card, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, DatePicker, Modal, Input, Table, TableHeader, TableHead, TableRow, TableBody, TableCell, Pagination, usePagination } from "../../../shared/components/ui";
import OwnerLayout from "../layouts/OwnerLayout";
import { useAuth } from "../../../contexts/AuthContext";
import { DemoRestrictedModal } from "../../../shared";
import { fetchAllComplexesWithFields } from "../../../shared/services/fields";
import { useTimeSlots, useTimeSlotsByField } from "../../../shared/hooks";
import { fetchPricing, createPricing, updatePricing, deletePricing } from "../../../shared/services/pricing";
import Swal from "sweetalert2";

const PricingManagement = ({ isDemo = false }) => {
     const { user, logout } = useAuth();
     const [loading, setLoading] = useState(true);
     const [fields, setFields] = useState([]);
     const [pricingData, setPricingData] = useState([]);
     const [selectedField, setSelectedField] = useState("all");
     const [selectedDate, setSelectedDate] = useState("");
     const [keyword, setKeyword] = useState("");
     const [isAddModalOpen, setIsAddModalOpen] = useState(false);
     const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
     const [isEditModalOpen, setIsEditModalOpen] = useState(false);
     const [showDemoRestrictedModal, setShowDemoRestrictedModal] = useState(false);
     const [editingPrice, setEditingPrice] = useState(null);
     const [isSubmitting, setIsSubmitting] = useState(false);
     const [formData, setFormData] = useState({
          fieldId: "",
          slotId: "",
          price: ""
     });
     const [bulkFormData, setBulkFormData] = useState({
          selectedSlotIds: [],
          price: ""
     });

     // Use React Query hooks for time slots (after formData is declared)
     const { data: allTimeSlots = [] } = useTimeSlots();
     const { data: fieldTimeSlots = [], isLoading: loadingFieldSlots } = useTimeSlotsByField(
          formData.fieldId ? parseInt(formData.fieldId) : null,
          !!formData.fieldId // Only fetch when fieldId is selected
     );

     // Get current user ID
     const currentUserId = user?.userID || user?.UserID || user?.id || user?.userId;

     // Load data from API
     const loadData = useCallback(async () => {
          try {
               setLoading(true);

               // Fetch all complexes with fields
               const allComplexesWithFields = await fetchAllComplexesWithFields();

               // Filter only owner's complexes
               const ownerComplexes = allComplexesWithFields.filter(
                    complex => complex.ownerId === currentUserId || complex.ownerId === Number(currentUserId)
               );

               // Get all fields from owner's complexes
               const allFields = ownerComplexes.flatMap(complex =>
                    (complex.fields || []).map(field => ({
                         ...field,
                         complexName: complex.name
                    }))
               );

               setFields(allFields);

               // Time slots are now loaded via React Query hooks

               // Fetch pricing data
               const pricingResponse = await fetchPricing();
               if (pricingResponse.success) {
                    setPricingData(pricingResponse.data || []);
               }
          } catch (error) {
               console.error('Error loading data:', error);
               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi tải dữ liệu',
                    text: error.message || 'Không thể tải dữ liệu',
                    confirmButtonColor: '#ef4444'
               });
          } finally {
               setLoading(false);
          }
     }, [currentUserId]);

     useEffect(() => {
          loadData();
     }, [loadData]);

     const handleInputChange = (e) => {
          const { name, value, type, checked } = e.target;
          setFormData(prev => ({
               ...prev,
               [name]: type === 'checkbox' ? checked : value
          }));
     };

     const handleSubmit = async (e) => {
          e.preventDefault();
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }

          // Validate
          if (!formData.fieldId || !formData.slotId || !formData.price) {
               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: 'Vui lòng điền đầy đủ thông tin',
                    confirmButtonColor: '#ef4444'
               });
               return;
          }

          setIsSubmitting(true);
          try {
               let result;
               if (editingPrice) {
                    result = await updatePricing(editingPrice.priceId, formData);
               } else {
                    result = await createPricing(formData);
               }

               if (result.success) {
                    await Swal.fire({
                         icon: 'success',
                         title: editingPrice ? 'Cập nhật giá thành công!' : 'Tạo giá thành công!',
                         confirmButtonColor: '#10b981'
                    });
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                    resetForm();
                    await loadData();
               } else {
                    await Swal.fire({
                         icon: 'error',
                         title: 'Không thể lưu giá',
                         text: result.error || 'Có lỗi xảy ra',
                         confirmButtonColor: '#ef4444'
                    });
               }
          } catch (error) {
               console.error('Error saving pricing:', error);
               await Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: error.message || 'Có lỗi xảy ra khi lưu giá',
                    confirmButtonColor: '#ef4444'
               });
          } finally {
               setIsSubmitting(false);
          }
     };

     const handleEdit = (price) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          setEditingPrice(price);
          setFormData({
               fieldId: price.fieldId?.toString() || "",
               slotId: price.slotId?.toString() || "",
               price: price.price?.toString() || ""
          });
          setIsEditModalOpen(true);
     };

     const handleDelete = async (priceId) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }

          const confirm = await Swal.fire({
               title: 'Xác nhận xóa',
               text: 'Bạn có chắc chắn muốn xóa giá này?',
               icon: 'warning',
               showCancelButton: true,
               confirmButtonText: 'Xóa',
               cancelButtonText: 'Hủy',
               confirmButtonColor: '#dc2626'
          });

          if (!confirm.isConfirmed) return;

          try {
               const result = await deletePricing(priceId);
               if (result.success) {
                    await Swal.fire({
                         title: 'Đã xóa',
                         text: 'Xóa giá thành công',
                         icon: 'success',
                         confirmButtonText: 'OK'
                    });
                    await loadData();
               } else {
                    await Swal.fire({
                         title: 'Không thể xóa giá',
                         text: result.error,
                         icon: 'error',
                         confirmButtonText: 'OK'
                    });
               }
          } catch (error) {
               console.error('Error deleting pricing:', error);
               await Swal.fire({
                    title: 'Có lỗi xảy ra',
                    text: 'Có lỗi xảy ra khi xóa giá',
                    icon: 'error',
                    confirmButtonText: 'OK'
               });
          }
     };

     const resetForm = () => {
          setFormData({
               fieldId: "",
               slotId: "",
               price: ""
          });
          setEditingPrice(null);
     };

     const resetBulkForm = () => {
          setBulkFormData({
               selectedSlotIds: [],
               price: ""
          });
     };

     const handleBulkSlotToggle = (slotId) => {
          setBulkFormData(prev => ({
               ...prev,
               selectedSlotIds: prev.selectedSlotIds.includes(slotId)
                    ? prev.selectedSlotIds.filter(id => id !== slotId)
                    : [...prev.selectedSlotIds, slotId]
          }));
     };

     const handleBulkSubmit = async (e) => {
          e.preventDefault();
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }

          if (!formData.fieldId || bulkFormData.selectedSlotIds.length === 0 || !bulkFormData.price) {
               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: 'Vui lòng điền đầy đủ thông tin',
                    confirmButtonColor: '#ef4444'
               });
               return;
          }

          setIsSubmitting(true);
          try {
               let successCount = 0;
               let errorCount = 0;
               const errors = [];

               for (const slotId of bulkFormData.selectedSlotIds) {
                    try {
                         const result = await createPricing({
                              fieldId: formData.fieldId,
                              slotId: slotId,
                              price: bulkFormData.price
                         });

                         if (result.success) {
                              successCount++;
                         } else {
                              errorCount++;
                              errors.push(`Slot ${slotId}: ${result.error}`);
                         }
                    } catch (error) {
                         errorCount++;
                         errors.push(`Slot ${slotId}: ${error.message}`);
                    }
               }

               if (errorCount === 0) {
                    await Swal.fire({
                         icon: 'success',
                         title: 'Tạo giá hàng loạt thành công!',
                         text: `Đã tạo ${successCount} giá`,
                         confirmButtonColor: '#10b981'
                    });
                    setIsBulkModalOpen(false);
                    resetBulkForm();
                    await loadData();
               } else {
                    await Swal.fire({
                         icon: errorCount === bulkFormData.selectedSlotIds.length ? 'error' : 'warning',
                         title: errorCount === bulkFormData.selectedSlotIds.length ? 'Tạo giá thất bại' : 'Tạo một phần thành công',
                         html: `<div class="text-left"><p>Thành công: ${successCount}</p><p>Thất bại: ${errorCount}</p>${errors.length > 0 ? `<div class="mt-2 text-sm">${errors.join('<br>')}</div>` : ''}</div>`,
                         confirmButtonColor: errorCount === bulkFormData.selectedSlotIds.length ? '#ef4444' : '#f59e0b'
                    });
                    if (successCount > 0) {
                         setIsBulkModalOpen(false);
                         resetBulkForm();
                         await loadData();
                    }
               }
          } catch (error) {
               console.error('Error bulk creating pricing:', error);
               await Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: error.message || 'Có lỗi xảy ra khi tạo giá hàng loạt',
                    confirmButtonColor: '#ef4444'
               });
          } finally {
               setIsSubmitting(false);
          }
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

     // Helper to get field name
     const getFieldName = (fieldId) => {
          const field = fields.find(f => f.fieldId === fieldId);
          return field ? `${field.name} (${field.complexName})` : `Field ${fieldId}`;
     };

     // Helper to get slot name
     const getSlotName = (slotId) => {
          const slot = allTimeSlots.find(s => (s.slotId || s.SlotID) === slotId);
          if (!slot) return `Slot ${slotId}`;
          const slotName = slot.name || slot.SlotName || `Slot ${slotId}`;
          const startTime = slot.startTime || slot.StartTime || "00:00";
          const endTime = slot.endTime || slot.EndTime || "00:00";
          return `${slotName} (${startTime.substring(0, 5)}-${endTime.substring(0, 5)})`;
     };

     const filteredPricing = pricingData.filter(price => {
          const matchesField = !selectedField || selectedField === 'all' || price.fieldId?.toString() === selectedField;
          const fieldName = getFieldName(price.fieldId);
          const matchesKeyword = !keyword || fieldName.toLowerCase().includes(keyword.toLowerCase());
          return matchesField && matchesKeyword;
     });

     // Pagination for pricing (10 per page)
     const {
          currentPage,
          totalPages,
          currentItems: paginatedPricing,
          handlePageChange,
          totalItems,
          itemsPerPage,
     } = usePagination(filteredPricing, 10);

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
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Chọn sân
                                   </label>
                                   <Select value={selectedField} onValueChange={setSelectedField} >
                                        <SelectTrigger className="rounded-2xl">
                                             <SelectValue placeholder="Tất cả" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="all">Tất cả ({fields.length} sân)</SelectItem>
                                             {fields.map(field => (
                                                  <SelectItem key={field.fieldId} value={(field.fieldId || "").toString()}>
                                                       {field.name} ({field.complexName})
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
                         </div>

                         <div className="flex items-end justify-end gap-3 mt-4">
                              <Button
                                   variant="outline"
                                   onClick={() => {
                                        setSelectedField("all");
                                        setSelectedDate("");
                                        setKeyword("");
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
                                        <TableHead className="text-white" >Giá</TableHead>
                                        <TableHead className="text-white" >Thao tác</TableHead>
                                   </TableRow>
                              </TableHeader>
                              <TableBody>
                                   {paginatedPricing.map((price) => (
                                        <TableRow key={price.priceId} className="hover:bg-slate-50">
                                             <TableCell className="text-sm font-medium text-gray-900">{getFieldName(price.fieldId)}</TableCell>
                                             <TableCell className="text-sm text-gray-900">{getSlotName(price.slotId)}</TableCell>
                                             <TableCell className="text-sm font-bold text-teal-700">{formatCurrency(price.price)}</TableCell>
                                             <TableCell className="text-sm font-medium">
                                                  <div className="flex items-center space-x-2">
                                                       <Button variant="ghost" size="sm" onClick={() => handleEdit(price)}>
                                                            <Edit className="w-4 h-4" />
                                                       </Button>
                                                       <Button variant="ghost" size="sm" onClick={() => handleDelete(price.priceId)} className="text-red-600 hover:text-red-700">
                                                            <Trash2 className="w-4 h-4" />
                                                       </Button>
                                                  </div>
                                             </TableCell>
                                        </TableRow>
                                   ))}
                              </TableBody>
                         </Table>
                         {filteredPricing.length === 0 ? (
                              <div className="text-center py-12">
                                   <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                   <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có giá nào</h3>
                                   <p className="text-gray-500">Hãy thêm giá cho các khung giờ của sân.</p>
                              </div>
                         ) : (
                              <div className="p-4 border-t">
                                   <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={handlePageChange}
                                        itemsPerPage={itemsPerPage}
                                        totalItems={totalItems}
                                   />
                              </div>
                         )}
                    </Card>

                    {/* Pricing Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <Card className="p-6 rounded-2xl shadow-lg">
                              <div className="flex items-center">
                                   <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <DollarSign className="w-6 h-6 text-purple-600" />
                                   </div>
                                   <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Tổng giá đã thiết lập</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                             {filteredPricing.length}
                                        </p>
                                   </div>
                              </div>
                         </Card>

                         <Card className="p-6 rounded-2xl shadow-lg">
                              <div className="flex items-center">
                                   <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                        <CheckSquare className="w-6 h-6 text-green-600" />
                                   </div>
                                   <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Đang hoạt động</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                             {filteredPricing.filter(p => p.isActive).length}
                                        </p>
                                   </div>
                              </div>
                         </Card>

                         <Card className="p-6 rounded-2xl shadow-lg">
                              <div className="flex items-center">
                                   <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Clock className="w-6 h-6 text-blue-600" />
                                   </div>
                                   <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Giá trung bình</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                             {filteredPricing.length > 0 ? formatCurrency(filteredPricing.reduce((sum, p) => sum + p.price, 0) / filteredPricing.length) : formatCurrency(0)}
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
                                   <Select value={formData.fieldId} onValueChange={(value) => {
                                        setFormData(prev => ({ ...prev, fieldId: value }));
                                        setBulkFormData(prev => ({ ...prev, selectedSlotIds: [] })); // Reset selected slots when field changes
                                   }}>
                                        <SelectTrigger>
                                             <SelectValue placeholder="Chọn sân" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             {fields.map(field => (
                                                  <SelectItem key={field.fieldId} value={(field.fieldId || "").toString()}>
                                                       {field.name} ({field.complexName})
                                                  </SelectItem>
                                             ))}
                                        </SelectContent>
                                   </Select>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Chọn khung giờ *
                                   </label>
                                   {!formData.fieldId ? (
                                        <div className="border border-gray-200 rounded-lg p-4 text-center text-gray-500 text-sm">
                                             Vui lòng chọn sân trước
                                        </div>
                                   ) : loadingFieldSlots ? (
                                        <div className="border border-gray-200 rounded-lg p-4 text-center text-gray-500 text-sm">
                                             <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                                             Đang tải khung giờ...
                                        </div>
                                   ) : fieldTimeSlots.length === 0 ? (
                                        <div className="border border-gray-200 rounded-lg p-4 text-center text-gray-500 text-sm">
                                             Sân này chưa có khung giờ nào
                                        </div>
                                   ) : (
                                        <>
                                             <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                                                  {fieldTimeSlots.map(slot => {
                                                       const slotId = slot.slotId || slot.SlotID;
                                                       const slotName = slot.name || slot.SlotName || `Slot ${slotId}`;
                                                       const startTime = slot.startTime || slot.StartTime || "00:00";
                                                       const endTime = slot.endTime || slot.EndTime || "00:00";
                                                       return (
                                                            <label key={slotId} className="flex items-center space-x-2 cursor-pointer">
                                                                 <input
                                                                      type="checkbox"
                                                                      checked={bulkFormData.selectedSlotIds.includes(slotId)}
                                                                      onChange={() => handleBulkSlotToggle(slotId)}
                                                                      className="rounded border-gray-300"
                                                                 />
                                                                 <span className="text-sm text-gray-700">
                                                                      {slotName} ({startTime.substring(0, 5)}-{endTime.substring(0, 5)})
                                                                 </span>
                                                            </label>
                                                       );
                                                  })}
                                             </div>
                                             <p className="text-xs text-gray-500 mt-1">
                                                  Đã chọn: {bulkFormData.selectedSlotIds.length} khung giờ
                                             </p>
                                        </>
                                   )}
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
                                   <Button type="submit" disabled={bulkFormData.selectedSlotIds.length === 0 || isSubmitting}>
                                        {isSubmitting ? (
                                             <>
                                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                  Đang tạo...
                                             </>
                                        ) : (
                                             <>
                                                  <CheckSquare className="w-4 h-4 mr-2" />
                                                  Tạo {bulkFormData.selectedSlotIds.length} giá
                                             </>
                                        )}
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
                                   <Select value={formData.fieldId} onValueChange={(value) => {
                                        setFormData(prev => ({ ...prev, fieldId: value, slotId: "" })); // Reset slotId when field changes
                                   }}>
                                        <SelectTrigger>
                                             <SelectValue placeholder="Chọn sân" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             {fields.map(field => (
                                                  <SelectItem key={field.fieldId} value={(field.fieldId || "").toString()}>
                                                       {field.name} ({field.complexName})
                                                  </SelectItem>
                                             ))}
                                        </SelectContent>
                                   </Select>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Khung giờ *
                                   </label>
                                   {!formData.fieldId ? (
                                        <div className="border border-gray-200 rounded-lg p-3 text-center text-gray-500 text-sm">
                                             Vui lòng chọn sân trước
                                        </div>
                                   ) : loadingFieldSlots ? (
                                        <div className="border border-gray-200 rounded-lg p-3 text-center text-gray-500 text-sm flex items-center justify-center">
                                             <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                             Đang tải...
                                        </div>
                                   ) : (
                                        <Select value={formData.slotId} onValueChange={(value) => setFormData(prev => ({ ...prev, slotId: value }))}>
                                             <SelectTrigger>
                                                  <SelectValue placeholder="Chọn khung giờ" />
                                             </SelectTrigger>
                                             <SelectContent>
                                                  {fieldTimeSlots.length === 0 ? (
                                                       <div className="p-2 text-center text-gray-500 text-sm">
                                                            Sân này chưa có khung giờ nào
                                                       </div>
                                                  ) : (
                                                       fieldTimeSlots.map(slot => {
                                                            const slotId = slot.slotId || slot.SlotID;
                                                            const slotName = slot.name || slot.SlotName || `Slot ${slotId}`;
                                                            const startTime = slot.startTime || slot.StartTime || "00:00";
                                                            const endTime = slot.endTime || slot.EndTime || "00:00";
                                                            return (
                                                                 <SelectItem key={slotId} value={(slotId || "").toString()}>
                                                                      {slotName} ({startTime.substring(0, 5)}-{endTime.substring(0, 5)})
                                                                 </SelectItem>
                                                            );
                                                       })
                                                  )}
                                             </SelectContent>
                                        </Select>
                                   )}
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
                                   <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                             <>
                                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                  Đang lưu...
                                             </>
                                        ) : (
                                             <>
                                                  <Save className="w-4 h-4 mr-2" />
                                                  Lưu giá
                                             </>
                                        )}
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
                                   {loadingFieldSlots ? (
                                        <div className="border border-gray-200 rounded-lg p-3 text-center text-gray-500 text-sm flex items-center justify-center">
                                             <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                             Đang tải...
                                        </div>
                                   ) : (
                                        <Select value={formData.slotId} onValueChange={(value) => setFormData(prev => ({ ...prev, slotId: value }))}>
                                             <SelectTrigger>
                                                  <SelectValue placeholder="Chọn khung giờ" />
                                             </SelectTrigger>
                                             <SelectContent>
                                                  {fieldTimeSlots.length === 0 ? (
                                                       <div className="p-2 text-center text-gray-500 text-sm">
                                                            Sân này chưa có khung giờ nào
                                                       </div>
                                                  ) : (
                                                       fieldTimeSlots.map(slot => {
                                                            const slotId = slot.slotId || slot.SlotID;
                                                            const slotName = slot.name || slot.SlotName || `Slot ${slotId}`;
                                                            const startTime = slot.startTime || slot.StartTime || "00:00";
                                                            const endTime = slot.endTime || slot.EndTime || "00:00";
                                                            return (
                                                                 <SelectItem key={slotId} value={(slotId || "").toString()}>
                                                                      {slotName} ({startTime.substring(0, 5)}-{endTime.substring(0, 5)})
                                                                 </SelectItem>
                                                            );
                                                       })
                                                  )}
                                             </SelectContent>
                                        </Select>
                                   )}
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
