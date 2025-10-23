import React, { useState, useEffect, useCallback } from "react";
import OwnerLayout from "../../layouts/owner/OwnerLayout";
import { useAuth } from "../../contexts/AuthContext";
import { Card, Button, Input, Textarea, Modal } from "../../components/ui/index";
import DemoRestrictedModal from "../../components/DemoRestrictedModal";
import {
     Gift,
     Plus,
     Edit,
     Trash2,
     Percent,
     Calendar,
     AlertTriangle,
     CheckCircle,
     Users,
     Tag
} from "lucide-react";
import {
     fetchPromotions,
     createPromotion,
     updatePromotion,
     deletePromotion
} from "../../services/promotions";
import { fetchComplexes } from "../../services/fields";

export default function PromotionsManagement({ isDemo = false }) {
     const { user, logout } = useAuth();
     const [promotions, setPromotions] = useState([]);
     const [complexes, setComplexes] = useState([]);
     const [loading, setLoading] = useState(true);
     const [showModal, setShowModal] = useState(false);
     const [showDemoRestrictedModal, setShowDemoRestrictedModal] = useState(false);
     const [editingPromotion, setEditingPromotion] = useState(null);
     const [formData, setFormData] = useState({
          complexId: '',
          name: '',
          description: '',
          code: '',
          type: 'percentage',
          value: 10,
          minOrderAmount: 0,
          maxDiscountAmount: 0,
          startDate: '',
          endDate: '',
          usageLimit: 100,
          applicableSlots: [],
          applicableDays: []
     });

     const promotionTypes = [
          { value: 'percentage', label: 'Phần trăm (%)' },
          { value: 'fixed_amount', label: 'Số tiền cố định (VNĐ)' }
     ];

     const daysOfWeek = [
          { id: 1, label: 'Thứ 2' },
          { id: 2, label: 'Thứ 3' },
          { id: 3, label: 'Thứ 4' },
          { id: 4, label: 'Thứ 5' },
          { id: 5, label: 'Thứ 6' },
          { id: 6, label: 'Thứ 7' },
          { id: 0, label: 'Chủ nhật' }
     ];

     const timeSlots = [
          { id: 1, name: '06:00 - 07:30' },
          { id: 2, name: '07:30 - 09:00' },
          { id: 3, name: '09:00 - 10:30' },
          { id: 4, name: '10:30 - 12:00' },
          { id: 5, name: '12:00 - 13:30' },
          { id: 6, name: '13:30 - 15:00' },
          { id: 7, name: '15:00 - 16:30' },
          { id: 8, name: '16:30 - 18:00' },
          { id: 9, name: '18:00 - 19:30' },
          { id: 10, name: '19:30 - 21:00' },
          { id: 11, name: '21:00 - 22:30' }
     ];

     const loadData = useCallback(async () => {
          try {
               setLoading(true);
               const [promotionsData, complexesData] = await Promise.all([
                    fetchPromotions(user?.id || 1),
                    fetchComplexes()
               ]);

               // Filter complexes owned by current user
               const ownerComplexes = complexesData.filter(complex =>
                    complex.complexId === 101 || complex.complexId === 102 || complex.complexId === 103
               );

               setPromotions(promotionsData);
               setComplexes(ownerComplexes);
          } catch (error) {
               console.error('Error loading data:', error);
          } finally {
               setLoading(false);
          }
     }, [user?.id]);

     useEffect(() => {
          loadData();
     }, [loadData]);

     const handleCreatePromotion = () => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          setEditingPromotion(null);
          setFormData({
               complexId: '',
               name: '',
               description: '',
               code: '',
               type: 'percentage',
               value: 10,
               minOrderAmount: 0,
               maxDiscountAmount: 0,
               startDate: '',
               endDate: '',
               usageLimit: 100,
               applicableSlots: [],
               applicableDays: []
          });
          setShowModal(true);
     };

     const handleEditPromotion = (promotion) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          setEditingPromotion(promotion);
          setFormData({
               complexId: promotion.complexId,
               name: promotion.name,
               description: promotion.description,
               code: promotion.code,
               type: promotion.type,
               value: promotion.value,
               minOrderAmount: promotion.minOrderAmount,
               maxDiscountAmount: promotion.maxDiscountAmount,
               startDate: promotion.startDate.split('T')[0],
               endDate: promotion.endDate.split('T')[0],
               usageLimit: promotion.usageLimit,
               applicableSlots: promotion.applicableSlots,
               applicableDays: promotion.applicableDays
          });
          setShowModal(true);
     };

     const handleSubmit = async (e) => {
          e.preventDefault();
          try {
               const promotionData = {
                    ...formData,
                    ownerId: user?.id || 1,
                    startDate: new Date(formData.startDate).toISOString(),
                    endDate: new Date(formData.endDate).toISOString()
               };

               if (editingPromotion) {
                    await updatePromotion(editingPromotion.promotionId, promotionData);
               } else {
                    await createPromotion(promotionData);
               }

               setShowModal(false);
               loadData();
          } catch (error) {
               console.error('Error saving promotion:', error);
          }
     };

     const handleDeletePromotion = async (promotionId) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          if (window.confirm('Bạn có chắc chắn muốn xóa chiến dịch khuyến mãi này?')) {
               try {
                    await deletePromotion(promotionId);
                    loadData();
               } catch (error) {
                    console.error('Error deleting promotion:', error);
               }
          }
     };

     const getComplexName = (complexId) => {
          const complex = complexes.find(c => c.complexId === complexId);
          return complex ? complex.name : 'Không xác định';
     };

     const getPromotionStatus = (promotion) => {
          const now = new Date();
          const startDate = new Date(promotion.startDate);
          const endDate = new Date(promotion.endDate);

          if (!promotion.isActive) {
               return { text: "Tạm dừng", color: "bg-red-100 text-red-800" };
          }

          if (now < startDate) {
               return { text: "Chưa bắt đầu", color: "bg-yellow-100 text-yellow-800" };
          }

          if (now > endDate) {
               return { text: "Đã hết hạn", color: "bg-gray-100 text-gray-800" };
          }

          if (promotion.usedCount >= promotion.usageLimit) {
               return { text: "Hết lượt", color: "bg-orange-100 text-orange-800" };
          }

          return { text: "Hoạt động", color: "bg-green-100 text-green-800" };
     };

     const toggleDay = (dayId) => {
          setFormData(prev => ({
               ...prev,
               applicableDays: prev.applicableDays.includes(dayId)
                    ? prev.applicableDays.filter(d => d !== dayId)
                    : [...prev.applicableDays, dayId]
          }));
     };

     const toggleSlot = (slotId) => {
          setFormData(prev => ({
               ...prev,
               applicableSlots: prev.applicableSlots.includes(slotId)
                    ? prev.applicableSlots.filter(s => s !== slotId)
                    : [...prev.applicableSlots, slotId]
          }));
     };

     if (loading) {
          return (
               <OwnerLayout user={user} onLoggedOut={logout} isDemo={isDemo}>
                    <div className="flex items-center justify-center h-64">
                         <div className="text-gray-500">Đang tải...</div>
                    </div>
               </OwnerLayout>
          );
     }

     return (
          <OwnerLayout user={user} onLoggedOut={logout} isDemo={isDemo}>
               <div className="space-y-6">
                    <div className="flex items-center justify-between">
                         <div>
                              <h1 className="text-3xl font-bold text-gray-900">Chiến dịch khuyến mãi</h1>
                              <p className="text-gray-600 mt-1">Tạo và quản lý khuyến mãi, voucher cho các sân của bạn</p>
                         </div>
                         <Button onClick={handleCreatePromotion} className="flex items-center gap-2">
                              <Plus className="w-4 h-4" />
                              Tạo khuyến mãi
                         </Button>
                    </div>

                    {promotions.length === 0 ? (
                         <Card className="p-6">
                              <div className="text-center py-12">
                                   <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                   <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có chiến dịch khuyến mãi</h3>
                                   <p className="text-gray-500 mb-4">Tạo chiến dịch khuyến mãi đầu tiên cho sân của bạn</p>
                                   <Button onClick={handleCreatePromotion} className="flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        Tạo khuyến mãi
                                   </Button>
                              </div>
                         </Card>
                    ) : (
                         <div className="grid gap-6">
                              {promotions.map((promotion) => {
                                   const status = getPromotionStatus(promotion);
                                   return (
                                        <Card key={promotion.promotionId} className="p-6">
                                             <div className="flex items-start justify-between">
                                                  <div className="flex-1">
                                                       <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="text-lg font-semibold text-gray-900">{promotion.name}</h3>
                                                            <div className="flex items-center gap-1">
                                                                 <CheckCircle className="w-4 h-4 text-green-500" />
                                                                 <span className={`text-sm px-2 py-1 rounded-full ${status.color}`}>
                                                                      {status.text}
                                                                 </span>
                                                            </div>
                                                       </div>

                                                       <p className="text-gray-600 mb-3">{promotion.description}</p>

                                                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                                                            <div className="flex items-center gap-1">
                                                                 <Tag className="w-4 h-4" />
                                                                 <span>Mã: {promotion.code}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                 <Percent className="w-4 h-4" />
                                                                 <span>
                                                                      {promotion.type === 'percentage'
                                                                           ? `Giảm ${promotion.value}%`
                                                                           : `Giảm ${promotion.value.toLocaleString("vi-VN")} VNĐ`
                                                                      }
                                                                 </span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                 <Users className="w-4 h-4" />
                                                                 <span>Đã dùng: {promotion.usedCount}/{promotion.usageLimit}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                 <Gift className="w-4 h-4" />
                                                                 <span>Sân: {getComplexName(promotion.complexId)}</span>
                                                            </div>
                                                       </div>

                                                       <div className="mt-3 text-xs text-gray-500">
                                                            <div className="flex items-center gap-1">
                                                                 <Calendar className="w-3 h-3" />
                                                                 <span>
                                                                      Từ {new Date(promotion.startDate).toLocaleDateString("vi-VN")} đến {new Date(promotion.endDate).toLocaleDateString("vi-VN")}
                                                                 </span>
                                                            </div>
                                                       </div>
                                                  </div>

                                                  <div className="flex items-center gap-2">
                                                       <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEditPromotion(promotion)}
                                                            className="flex items-center gap-1"
                                                       >
                                                            <Edit className="w-4 h-4" />
                                                            Sửa
                                                       </Button>
                                                       <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDeletePromotion(promotion.promotionId)}
                                                            className="flex items-center gap-1 text-red-600 hover:text-red-700"
                                                       >
                                                            <Trash2 className="w-4 h-4" />
                                                            Xóa
                                                       </Button>
                                                  </div>
                                             </div>
                                        </Card>
                                   );
                              })}
                         </div>
                    )}

                    {/* Modal for creating/editing promotion */}
                    <Modal
                         isOpen={showModal}
                         onClose={() => setShowModal(false)}
                         title={editingPromotion ? 'Chỉnh sửa chiến dịch khuyến mãi' : 'Tạo chiến dịch khuyến mãi mới'}
                         size="lg"
                    >
                         <form onSubmit={handleSubmit} className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Sân áp dụng
                                        </label>
                                        <select
                                             value={formData.complexId}
                                             onChange={(e) => setFormData({ ...formData, complexId: e.target.value })}
                                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                             required
                                        >
                                             <option value="">Chọn sân</option>
                                             {complexes.map((complex) => (
                                                  <option key={complex.complexId} value={complex.complexId}>
                                                       {complex.name}
                                                  </option>
                                             ))}
                                        </select>
                                   </div>

                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Mã khuyến mãi
                                        </label>
                                        <Input
                                             value={formData.code}
                                             onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                             placeholder="Ví dụ: WEEKEND20"
                                             required
                                        />
                                   </div>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tên chiến dịch
                                   </label>
                                   <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ví dụ: Giảm giá cuối tuần"
                                        required
                                   />
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mô tả
                                   </label>
                                   <Textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Mô tả chi tiết về chiến dịch khuyến mãi"
                                        rows={3}
                                        required
                                   />
                              </div>

                              <div className="grid grid-cols-3 gap-4">
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Loại khuyến mãi
                                        </label>
                                        <select
                                             value={formData.type}
                                             onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                             required
                                        >
                                             {promotionTypes.map((type) => (
                                                  <option key={type.value} value={type.value}>
                                                       {type.label}
                                                  </option>
                                             ))}
                                        </select>
                                   </div>

                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             {formData.type === 'percentage' ? 'Phần trăm (%)' : 'Số tiền (VNĐ)'}
                                        </label>
                                        <Input
                                             type="number"
                                             value={formData.value}
                                             onChange={(e) => setFormData({ ...formData, value: parseInt(e.target.value) || 0 })}
                                             min="0"
                                             required
                                        />
                                   </div>

                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Đơn hàng tối thiểu (VNĐ)
                                        </label>
                                        <Input
                                             type="number"
                                             value={formData.minOrderAmount}
                                             onChange={(e) => setFormData({ ...formData, minOrderAmount: parseInt(e.target.value) || 0 })}
                                             min="0"
                                        />
                                   </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Giảm giá tối đa (VNĐ)
                                        </label>
                                        <Input
                                             type="number"
                                             value={formData.maxDiscountAmount}
                                             onChange={(e) => setFormData({ ...formData, maxDiscountAmount: parseInt(e.target.value) || 0 })}
                                             min="0"
                                        />
                                   </div>

                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Giới hạn sử dụng
                                        </label>
                                        <Input
                                             type="number"
                                             value={formData.usageLimit}
                                             onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) || 0 })}
                                             min="1"
                                             required
                                        />
                                   </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Ngày bắt đầu
                                        </label>
                                        <Input
                                             type="date"
                                             value={formData.startDate}
                                             onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                             required
                                        />
                                   </div>

                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Ngày kết thúc
                                        </label>
                                        <Input
                                             type="date"
                                             value={formData.endDate}
                                             onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                             required
                                        />
                                   </div>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Áp dụng cho các ngày trong tuần
                                   </label>
                                   <div className="flex flex-wrap gap-2">
                                        {daysOfWeek.map((day) => (
                                             <Button
                                                  key={day.id}
                                                  type="button"
                                                  onClick={() => toggleDay(day.id)}
                                                  className={`px-3 py-1 rounded-lg border text-sm ${formData.applicableDays.includes(day.id)
                                                       ? "bg-blue-600 text-white border-blue-600"
                                                       : "bg-white text-gray-700 border-gray-300"
                                                       }`}
                                             >
                                                  {day.label}
                                             </Button>
                                        ))}
                                   </div>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Áp dụng cho các slot (để trống = tất cả slot)
                                   </label>
                                   <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded-lg p-2">
                                        {timeSlots.map((slot) => (
                                             <Button
                                                  key={slot.id}
                                                  type="button"
                                                  onClick={() => toggleSlot(slot.id)}
                                                  className={`px-2 py-1 rounded text-xs ${formData.applicableSlots.includes(slot.id)
                                                       ? "bg-green-600 text-white"
                                                       : "bg-gray-100 text-gray-700"
                                                       }`}
                                             >
                                                  {slot.name}
                                             </Button>
                                        ))}
                                   </div>
                              </div>

                              <div className="flex items-center gap-2 pt-4">
                                   <AlertTriangle className="w-4 h-4 text-amber-500" />
                                   <span className="text-sm text-gray-600">
                                        Khuyến mãi sẽ được hiển thị cho khách hàng khi đặt sân và có thể áp dụng mã giảm giá
                                   </span>
                              </div>

                              <div className="flex justify-end gap-3 pt-4">
                                   <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowModal(false)}
                                   >
                                        Hủy
                                   </Button>
                                   <Button type="submit">
                                        {editingPromotion ? 'Cập nhật' : 'Tạo khuyến mãi'}
                                   </Button>
                              </div>
                         </form>
                    </Modal>

                    {/* Demo Restricted Modal */}
                    <DemoRestrictedModal
                         isOpen={showDemoRestrictedModal}
                         onClose={() => setShowDemoRestrictedModal(false)}
                         featureName="Khuyến mãi"
                    />
               </div>
          </OwnerLayout>
     );
}


