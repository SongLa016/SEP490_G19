import React, { useState, useEffect, useCallback } from "react";
import OwnerLayout from "../layouts/OwnerLayout";
import { useAuth } from "../../../contexts/AuthContext";
import { Card, Button, Input, Textarea, Modal } from "../../../shared/components/ui";
import { DemoRestrictedModal } from "../../../shared";
import {
     Shield,
     Plus,
     Edit,
     Trash2,
     Clock,
     Percent,
     AlertTriangle,
     CheckCircle,
     XCircle
} from "lucide-react";
import {
     fetchCancellationPolicies,
     createCancellationPolicy,
     updateCancellationPolicy,
     deleteCancellationPolicy
} from "../../../shared/index";
import { fetchComplexes } from "../../../shared/index";

export default function CancellationPolicies({ isDemo = false }) {
     const { user, logout } = useAuth();
     const [policies, setPolicies] = useState([]);
     const [complexes, setComplexes] = useState([]);
     const [loading, setLoading] = useState(true);
     const [showModal, setShowModal] = useState(false);
     const [showDemoRestrictedModal, setShowDemoRestrictedModal] = useState(false);
     const [editingPolicy, setEditingPolicy] = useState(null);
     const [formData, setFormData] = useState({
          complexId: '',
          name: '',
          description: '',
          freeCancellationHours: 24,
          cancellationFeePercentage: 50
     });

     const loadData = useCallback(async () => {
          try {
               setLoading(true);
               const [policiesData, complexesData] = await Promise.all([
                    fetchCancellationPolicies(user?.id || 1),
                    fetchComplexes()
               ]);

               // Filter complexes owned by current user
               const ownerComplexes = complexesData.filter(complex =>
                    complex.complexId === 101 || complex.complexId === 102 || complex.complexId === 103
               );

               setPolicies(policiesData);
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

     const handleCreatePolicy = () => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          setEditingPolicy(null);
          setFormData({
               complexId: '',
               name: '',
               description: '',
               freeCancellationHours: 24,
               cancellationFeePercentage: 50
          });
          setShowModal(true);
     };

     const handleEditPolicy = (policy) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          setEditingPolicy(policy);
          setFormData({
               complexId: policy.complexId,
               name: policy.name,
               description: policy.description,
               freeCancellationHours: policy.freeCancellationHours,
               cancellationFeePercentage: policy.cancellationFeePercentage
          });
          setShowModal(true);
     };

     const handleSubmit = async (e) => {
          e.preventDefault();
          try {
               if (editingPolicy) {
                    await updateCancellationPolicy(editingPolicy.policyId, {
                         ...formData,
                         ownerId: user?.id || 1
                    });
               } else {
                    await createCancellationPolicy({
                         ...formData,
                         ownerId: user?.id || 1
                    });
               }

               setShowModal(false);
               loadData();
          } catch (error) {
               console.error('Error saving policy:', error);
          }
     };

     const handleDeletePolicy = async (policyId) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          if (window.confirm('Bạn có chắc chắn muốn xóa chính sách này?')) {
               try {
                    await deleteCancellationPolicy(policyId);
                    loadData();
               } catch (error) {
                    console.error('Error deleting policy:', error);
               }
          }
     };

     const getComplexName = (complexId) => {
          const complex = complexes.find(c => c.complexId === complexId);
          return complex ? complex.name : 'Không xác định';
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
                              <h1 className="text-3xl font-bold text-gray-900">Chính sách hủy</h1>
                              <p className="text-gray-600 mt-1">Thiết lập chính sách hủy cho các sân của bạn</p>
                         </div>
                         <Button onClick={handleCreatePolicy} className="flex items-center gap-2">
                              <Plus className="w-4 h-4" />
                              Thêm chính sách
                         </Button>
                    </div>

                    {policies.length === 0 ? (
                         <Card className="p-6">
                              <div className="text-center py-12">
                                   <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                   <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có chính sách hủy</h3>
                                   <p className="text-gray-500 mb-4">Tạo chính sách hủy đầu tiên cho sân của bạn</p>
                                   <Button onClick={handleCreatePolicy} className="flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        Tạo chính sách
                                   </Button>
                              </div>
                         </Card>
                    ) : (
                         <div className="grid gap-6">
                              {policies.map((policy) => (
                                   <Card key={policy.policyId} className="p-6">
                                        <div className="flex items-start justify-between">
                                             <div className="flex-1">
                                                  <div className="flex items-center gap-3 mb-2">
                                                       <h3 className="text-lg font-semibold text-gray-900">{policy.name}</h3>
                                                       <div className="flex items-center gap-1">
                                                            {policy.isActive ? (
                                                                 <CheckCircle className="w-4 h-4 text-green-500" />
                                                            ) : (
                                                                 <XCircle className="w-4 h-4 text-red-500" />
                                                            )}
                                                            <span className={`text-sm ${policy.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                                                 {policy.isActive ? 'Hoạt động' : 'Tạm dừng'}
                                                            </span>
                                                       </div>
                                                  </div>

                                                  <p className="text-gray-600 mb-3">{policy.description}</p>

                                                  <div className="flex items-center gap-6 text-sm text-gray-500">
                                                       <div className="flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            <span>Miễn phí hủy: {policy.freeCancellationHours}h</span>
                                                       </div>
                                                       <div className="flex items-center gap-1">
                                                            <Percent className="w-4 h-4" />
                                                            <span>Phí hủy: {policy.cancellationFeePercentage}%</span>
                                                       </div>
                                                       <div className="flex items-center gap-1">
                                                            <Shield className="w-4 h-4" />
                                                            <span>Sân: {getComplexName(policy.complexId)}</span>
                                                       </div>
                                                  </div>
                                             </div>

                                             <div className="flex items-center gap-2">
                                                  <Button
                                                       variant="outline"
                                                       size="sm"
                                                       onClick={() => handleEditPolicy(policy)}
                                                       className="flex items-center gap-1"
                                                  >
                                                       <Edit className="w-4 h-4" />
                                                       Sửa
                                                  </Button>
                                                  <Button
                                                       variant="outline"
                                                       size="sm"
                                                       onClick={() => handleDeletePolicy(policy.policyId)}
                                                       className="flex items-center gap-1 text-red-600 hover:text-red-700"
                                                  >
                                                       <Trash2 className="w-4 h-4" />
                                                       Xóa
                                                  </Button>
                                             </div>
                                        </div>
                                   </Card>
                              ))}
                         </div>
                    )}

                    {/* Modal for creating/editing policy */}
                    <Modal
                         isOpen={showModal}
                         onClose={() => setShowModal(false)}
                         title={editingPolicy ? 'Chỉnh sửa chính sách hủy' : 'Tạo chính sách hủy mới'}
                    >
                         <form onSubmit={handleSubmit} className="space-y-4">
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
                                        Tên chính sách
                                   </label>
                                   <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ví dụ: Chính sách hủy tiêu chuẩn"
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
                                        placeholder="Mô tả chi tiết về chính sách hủy"
                                        rows={3}
                                        required
                                   />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Thời gian hủy miễn phí (giờ)
                                        </label>
                                        <Input
                                             type="number"
                                             value={formData.freeCancellationHours}
                                             onChange={(e) => setFormData({ ...formData, freeCancellationHours: parseInt(e.target.value) })}
                                             min="1"
                                             max="168"
                                             required
                                        />
                                   </div>

                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Phí hủy (%)
                                        </label>
                                        <Input
                                             type="number"
                                             value={formData.cancellationFeePercentage}
                                             onChange={(e) => setFormData({ ...formData, cancellationFeePercentage: parseInt(e.target.value) })}
                                             min="0"
                                             max="100"
                                             required
                                        />
                                   </div>
                              </div>

                              <div className="flex items-center gap-2 pt-4">
                                   <AlertTriangle className="w-4 h-4 text-amber-500" />
                                   <span className="text-sm text-gray-600">
                                        Chính sách sẽ được áp dụng cho tất cả đặt sân của sân được chọn
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
                                        {editingPolicy ? 'Cập nhật' : 'Tạo chính sách'}
                                   </Button>
                              </div>
                         </form>
                    </Modal>

                    {/* Demo Restricted Modal */}
                    <DemoRestrictedModal
                         isOpen={showDemoRestrictedModal}
                         onClose={() => setShowDemoRestrictedModal(false)}
                         featureName="Chính sách Hủy"
                    />
               </div>
          </OwnerLayout>
     );
}


